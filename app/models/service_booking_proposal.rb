class ServiceBookingProposal < ApplicationRecord
  FEE_TYPES = {
    landed: "landed",
    landed_hospitalities: "landed_hospitalities",
    no_landed_add_ons: "no_landed_add_ons"
  }.freeze

  ACTIVE_STATUSES = %w[
    pending_artist_response
    countered_by_artist
    countered_by_booker
  ].freeze

  belongs_to :service_product, class_name: "Products::ServiceProduct"
  belongs_to :booker, class_name: "User"
  belongs_to :artist, class_name: "User"
  belongs_to :current_offer_by, class_name: "User", optional: true
  belongs_to :accepted_by, class_name: "User", optional: true
  belongs_to :service_booking, optional: true
  has_many :conversations, as: :messageable, dependent: :destroy

  enum :status, {
    pending_artist_response: "pending_artist_response",
    countered_by_artist: "countered_by_artist",
    countered_by_booker: "countered_by_booker",
    accepted: "accepted",
    rejected: "rejected",
    cancelled: "cancelled",
    expired: "expired"
  }

  enum :fee_type, FEE_TYPES, prefix: :fee

  scope :active, -> { where(status: ACTIVE_STATUSES) }
  scope :for_user, ->(user) { where("booker_id = :id OR artist_id = :id", id: user.id) }

  before_validation :set_defaults
  before_save :calculate_financials
  before_create :seed_initial_history
  after_create :create_proposal_conversation!

  validates :event_name, :event_date, :venue_name, :city, :status, :fee_type, :currency, presence: true
  validates :proposed_amount, numericality: { greater_than: 0 }
  validates :deposit_percentage, numericality: { greater_than_or_equal_to: 0, less_than_or_equal_to: 100 }
  validates :guest_list_count, numericality: { only_integer: true, greater_than_or_equal_to: 0 }
  validate :booker_cannot_be_artist
  validate :current_offer_by_must_be_participant

  def participant?(user)
    [booker_id, artist_id].include?(user&.id)
  end

  def recipient?(user)
    participant?(user) && current_offer_by_id != user.id
  end

  def active_negotiation?
    ACTIVE_STATUSES.include?(status)
  end

  def can_counter?(user)
    active_negotiation? && recipient?(user) && remaining_counter_for(user).positive?
  end

  def can_accept?(user)
    active_negotiation? && recipient?(user)
  end

  def can_reject?(user)
    active_negotiation? && recipient?(user)
  end

  def can_cancel?(user)
    active_negotiation? && participant?(user)
  end

  def counter!(actor:, attributes:)
    raise ArgumentError, "Only the recipient can counter this offer" unless can_counter?(actor)

    with_lock do
      assign_attributes(attributes)
      self.current_offer_by = actor
      self.status = actor == artist ? :countered_by_artist : :countered_by_booker
      self.artist_counter_count += 1 if actor == artist
      self.booker_counter_count += 1 if actor == booker
      append_history(action: "countered", actor: actor)
      save!
      add_system_message!("#{actor.display_name.presence || actor.full_name} sent a counterproposal.", actor: actor)
    end
  end

  def accept!(actor:)
    raise ArgumentError, "Only the recipient can accept this offer" unless can_accept?(actor)

    ActiveRecord::Base.transaction do
      with_lock do
        self.accepted_by = actor
        self.accepted_at = Time.current
        self.status = :accepted
        append_history(action: "accepted", actor: actor)
        save!

        booking = create_confirmed_booking!
        snapshot = build_contract_snapshot(booking: booking)
        booking.update!(agreement_snapshot: snapshot)
        update!(service_booking: booking, contract_snapshot: snapshot)
        cancel_conflicting_proposals!(actor: actor)
        add_system_message!("#{actor.display_name.presence || actor.full_name} accepted the proposal. Booking ##{booking.id} was created.", actor: actor)
        booking.add_system_message!("Booking created from proposal ##{id}.", actor: actor)
        booking
      end
    end
  end

  def reject!(actor:)
    raise ArgumentError, "Only the recipient can reject this offer" unless can_reject?(actor)

    update_status_with_history!(status: :rejected, action: "rejected", actor: actor)
  end

  def cancel!(actor:)
    raise ArgumentError, "Only participants can cancel this proposal" unless can_cancel?(actor)

    update_status_with_history!(status: :cancelled, action: "cancelled", actor: actor)
  end

  def build_contract_snapshot(booking: nil)
    {
      service_booking_id: booking&.id,
      proposal_id: id,
      event_name: event_name,
      event_date: event_date&.iso8601,
      starts_at: starts_at&.iso8601,
      ends_at: ends_at&.iso8601,
      venue: {
        name: venue_name,
        address: venue_address,
        city: city,
        country: country
      },
      parties: {
        booker: party_snapshot(booker),
        artist: party_snapshot(artist)
      },
      financials: financial_snapshot,
      terms: terms_snapshot,
      accepted_by_id: accepted_by_id,
      accepted_at: accepted_at&.iso8601,
      digital_signature_statement: "Both parties accepted the negotiated terms in Rauversion."
    }
  end

  def financial_snapshot
    {
      proposed_amount: proposed_amount&.to_s,
      currency: currency,
      deposit_percentage: deposit_percentage&.to_s,
      deposit_amount: deposit_amount&.to_s,
      balance_amount: balance_amount&.to_s,
      platform_fee_rate: platform_fee_rate&.to_s,
      platform_fee_min_amount: platform_fee_min_amount&.to_s,
      platform_fee_amount: platform_fee_amount&.to_s,
      artist_payout_amount: artist_payout_amount&.to_s
    }
  end

  def terms_snapshot
    {
      fee_type: fee_type,
      transport_included: transport_included,
      accommodation_included: accommodation_included,
      hospitality_included: hospitality_included,
      catering_included: catering_included,
      guest_list_count: guest_list_count,
      benefits: benefits,
      technical_notes: technical_notes,
      message: message
    }
  end

  def auto_cancel!(actor:)
    update_status_with_history!(status: :cancelled, action: "auto_cancelled", actor: actor)
  end

  private

  def set_defaults
    self.artist ||= service_product&.user
    self.current_offer_by ||= booker
    self.currency = currency.presence || "clp"
    self.deposit_percentage = 50 if deposit_percentage.blank?
    self.platform_fee_rate = 0.05 if platform_fee_rate.blank?
    self.platform_fee_min_amount = 5000 if platform_fee_min_amount.blank?
    self.event_date ||= starts_at&.to_date
    self.expires_at ||= 14.days.from_now
  end

  def calculate_financials
    return if proposed_amount.blank?

    amount = proposed_amount.to_d
    deposit_rate = deposit_percentage.to_d / 100
    fee_rate = platform_fee_rate.to_d
    minimum_fee = platform_fee_min_amount.to_d
    calculated_fee = amount * fee_rate
    fee = [calculated_fee, minimum_fee].max
    fee = [fee, amount].min

    self.deposit_amount = amount * deposit_rate
    self.balance_amount = amount - deposit_amount.to_d
    self.platform_fee_amount = fee
    self.artist_payout_amount = amount - fee
  end

  def seed_initial_history
    append_history(action: "created", actor: booker)
  end

  def append_history(action:, actor:)
    self.negotiation_history = Array(negotiation_history) + [
      {
        action: action,
        actor_id: actor.id,
        actor_name: actor.display_name.presence || actor.full_name,
        actor_role: actor == artist ? "artist" : "booker",
        occurred_at: Time.current.iso8601,
        offer: {
          proposed_amount: proposed_amount&.to_s,
          currency: currency,
          deposit_percentage: deposit_percentage&.to_s,
          fee_type: fee_type,
          transport_included: transport_included,
          accommodation_included: accommodation_included,
          hospitality_included: hospitality_included,
          catering_included: catering_included,
          guest_list_count: guest_list_count,
          benefits: benefits,
          technical_notes: technical_notes,
          message: message
        }
      }
    ]
  end

  def update_status_with_history!(status:, action:, actor:)
    with_lock do
      self.status = status
      append_history(action: action, actor: actor)
      save!
      add_system_message!("#{actor.display_name.presence || actor.full_name} #{action} the proposal.", actor: actor)
    end
  end

  def create_confirmed_booking!
    snapshot = build_contract_snapshot

    ServiceBooking.create!(
      service_product: service_product,
      customer: booker,
      provider: artist,
      status: :confirmed,
      payment_status: :pending,
      currency: currency,
      subtotal_amount: proposed_amount,
      total_amount: proposed_amount,
      deposit_amount: deposit_amount,
      balance_due_amount: balance_amount,
      starts_at: starts_at,
      ends_at: ends_at,
      venue_name: venue_name,
      venue_address: venue_address,
      city: city,
      country: country,
      agreement_snapshot: snapshot,
      contract_status: :auto_signed,
      contract_signed_at: accepted_at,
      platform_fee_rate: platform_fee_rate,
      platform_fee_amount: platform_fee_amount,
      artist_payout_amount: artist_payout_amount
    ).tap(&:set_service_product_conversation)
  end

  def cancel_conflicting_proposals!(actor:)
    self.class.active
      .where(artist_id: artist_id, event_date: event_date)
      .where.not(id: id)
      .find_each do |proposal|
        proposal.auto_cancel!(actor: actor)
      end
  end

  def create_proposal_conversation!
    conversation = conversations.create!(
      subject: "Proposal ##{id} - #{event_name}",
      status: "active"
    )
    conversation.add_participant(booker)
    conversation.add_participant(artist)
    conversation.messages.create!(
      user: booker,
      message_type: "system",
      body: "A new booking proposal was created for #{event_name}."
    )
  end

  def add_system_message!(body, actor:)
    conversation = conversations.active.first || conversations.first
    return unless conversation

    conversation.messages.create!(
      user: actor,
      message_type: "system",
      body: body
    )
  end

  def party_snapshot(user)
    {
      id: user.id,
      name: user.full_name,
      username: user.username,
      email: user.email
    }
  end

  def remaining_counter_for(user)
    return 0 unless participant?(user)

    user == artist ? 1 - artist_counter_count.to_i : 1 - booker_counter_count.to_i
  end

  def booker_cannot_be_artist
    errors.add(:booker, "cannot be the artist") if booker_id.present? && booker_id == artist_id
  end

  def current_offer_by_must_be_participant
    return if current_offer_by_id.blank?
    return if [booker_id, artist_id].include?(current_offer_by_id)

    errors.add(:current_offer_by, "must be one of the proposal participants")
  end
end

module Admin
  class BookingsDashboard
    DEFAULT_RANGE_DAYS = 30
    RECENT_LIMIT = 12
    ACTIVE_BOOKING_STATUSES = %w[pending_confirmation confirmed scheduled in_progress].freeze
    OPEN_REFUND_STATUSES = %w[requested processing failed].freeze

    def initialize(scope: ServiceBooking.all, proposal_scope: ServiceBookingProposal.all, ledger_scope: ServiceBookingLedgerEntry.all, from: nil, to: nil)
      @scope = scope
      @proposal_scope = proposal_scope
      @ledger_scope = ledger_scope
      @from = from
      @to = to
    end

    def as_json(*)
      {
        range: range,
        summary: summary,
        booking_amounts_by_currency: money_stats(filtered_bookings.group(:currency).sum(:total_amount)),
        calculated_payouts_by_currency: money_stats(filtered_bookings.group(:currency).sum(:artist_payout_amount)),
        platform_fees_by_currency: money_stats(filtered_bookings.group(:currency).sum(:platform_fee_amount)),
        refunds_by_currency: money_stats(filtered_bookings.where(refund_status: %w[refunded processing requested failed]).group(:currency).sum(:total_amount)),
        proposal_volume_by_currency: money_stats(filtered_proposals.group(:currency).sum(:proposed_amount)),
        booking_status_counts: count_stats(filtered_bookings.group(:status).count, key: :status),
        payment_status_counts: count_stats(filtered_bookings.group(:payment_status).count, key: :status),
        proposal_status_counts: count_stats(filtered_proposals.group(:status).count, key: :status),
        ledger_activity_counts: count_stats(filtered_ledger_entries.group(:entry_type).count, key: :entry_type),
        action_queue: action_queue,
        recent_bookings: recent_bookings,
        recent_proposals: recent_proposals,
        counter_activity: counter_activity,
        recent_cancellations: recent_cancellations,
        recent_ledger_entries: recent_ledger_entries
      }
    end

    private

    attr_reader :scope, :proposal_scope, :ledger_scope

    def range
      {
        from: from_date.iso8601,
        to: to_date.iso8601,
        days: (to_date - from_date).to_i + 1
      }
    end

    def summary
      {
        bookings_created: filtered_bookings.count,
        active_bookings: operational_bookings.count,
        upcoming_bookings: operational_bookings.where("starts_at >= ?", Time.current).count,
        pending_deposits: deposit_collection_scope.count,
        pending_balances: balance_collection_scope.count,
        open_proposals: open_proposals.count,
        counteroffers: counteroffer_count(filtered_proposals),
        cancellations: filtered_bookings.where(status: "cancelled").count,
        refund_cases: refund_watch_scope.count,
        latest_booking_at: filtered_bookings.maximum(:created_at),
        latest_proposal_at: filtered_proposals.maximum(:created_at),
        latest_ledger_at: filtered_ledger_entries.maximum(:occurred_at)
      }
    end

    def action_queue
      [
        {
          key: "artist_response",
          label: "Artist response pending",
          count: proposal_scope.where(status: "pending_artist_response").count,
          amounts: money_stats(proposal_scope.where(status: "pending_artist_response").group(:currency).sum(:proposed_amount))
        },
        {
          key: "counteroffers",
          label: "Counteroffers in negotiation",
          count: proposal_scope.where(status: %w[countered_by_artist countered_by_booker]).count,
          amounts: money_stats(proposal_scope.where(status: %w[countered_by_artist countered_by_booker]).group(:currency).sum(:proposed_amount))
        },
        {
          key: "deposit_collection",
          label: "Deposits to collect",
          count: deposit_collection_scope.count,
          amounts: money_stats(deposit_collection_scope.group(:currency).sum(:deposit_amount))
        },
        {
          key: "deposit_confirmation",
          label: "Deposits awaiting artist confirmation",
          count: deposit_confirmation_scope.count,
          amounts: money_stats(deposit_confirmation_scope.group(:currency).sum(:deposit_amount))
        },
        {
          key: "balance_collection",
          label: "Balances to collect",
          count: balance_collection_scope.count,
          amounts: money_stats(balance_collection_scope.group(:currency).sum(:balance_due_amount))
        },
        {
          key: "refund_watch",
          label: "Refunds to watch",
          count: refund_watch_scope.count,
          amounts: money_stats(refund_watch_scope.group(:currency).sum(:total_amount))
        }
      ]
    end

    def recent_bookings
      filtered_bookings
        .includes(:service_product, :customer, :provider, :service_booking_proposal)
        .order(created_at: :desc)
        .limit(RECENT_LIMIT)
        .map { |booking| serialize_booking(booking) }
    end

    def recent_proposals
      filtered_proposals
        .includes(:service_product, :booker, :artist, :current_offer_by)
        .order(updated_at: :desc)
        .limit(RECENT_LIMIT)
        .map { |proposal| serialize_proposal(proposal) }
    end

    def counter_activity
      proposal_scope
        .includes(:service_product, :booker, :artist, :current_offer_by)
        .where("COALESCE(artist_counter_count, 0) + COALESCE(booker_counter_count, 0) > 0")
        .order(Arel.sql("COALESCE(artist_counter_count, 0) + COALESCE(booker_counter_count, 0) DESC"), updated_at: :desc)
        .limit(RECENT_LIMIT)
        .map { |proposal| serialize_proposal(proposal) }
    end

    def recent_cancellations
      scope
        .includes(:service_product, :customer, :provider, :service_booking_proposal)
        .where(status: "cancelled")
        .or(scope.where(refund_status: %w[requested processing refunded failed]))
        .order(updated_at: :desc)
        .limit(RECENT_LIMIT)
        .map { |booking| serialize_booking(booking) }
    end

    def recent_ledger_entries
      filtered_ledger_entries
        .includes(:actor, service_booking: [:service_product, :customer, :provider])
        .order(occurred_at: :desc, id: :desc)
        .limit(RECENT_LIMIT)
        .map { |entry| serialize_ledger_entry(entry) }
    end

    def filtered_bookings
      @filtered_bookings ||= scope.where(created_at: from_date.beginning_of_day..to_date.end_of_day)
    end

    def filtered_proposals
      @filtered_proposals ||= proposal_scope.where(created_at: from_date.beginning_of_day..to_date.end_of_day)
    end

    def filtered_ledger_entries
      @filtered_ledger_entries ||= ledger_scope.where(occurred_at: from_date.beginning_of_day..to_date.end_of_day)
    end

    def operational_bookings
      @operational_bookings ||= scope.where(status: ACTIVE_BOOKING_STATUSES)
    end

    def open_proposals
      @open_proposals ||= proposal_scope.where(status: ServiceBookingProposal::ACTIVE_STATUSES)
    end

    def deposit_collection_scope
      @deposit_collection_scope ||= operational_bookings.where(deposit_status: %w[unpaid checkout_created])
    end

    def deposit_confirmation_scope
      @deposit_confirmation_scope ||= operational_bookings.where(deposit_status: "reported")
    end

    def balance_collection_scope
      @balance_collection_scope ||= operational_bookings
        .where(deposit_status: "confirmed", balance_status: %w[unpaid checkout_created])
        .where("COALESCE(balance_due_amount, 0) > 0")
    end

    def refund_watch_scope
      @refund_watch_scope ||= scope.where(refund_status: OPEN_REFUND_STATUSES)
    end

    def counteroffer_count(relation)
      relation.sum(:artist_counter_count).to_i + relation.sum(:booker_counter_count).to_i
    end

    def serialize_booking(booking)
      {
        id: booking.id,
        event_name: booking_event_name(booking),
        product_title: booking.service_product&.title,
        status: booking.status,
        payment_status: booking.payment_status,
        deposit_status: booking.deposit_status,
        balance_status: booking.balance_status,
        refund_status: booking.refund_status,
        contract_status: booking.contract_status,
        total_amount: booking.total_amount,
        deposit_amount: booking.deposit_amount,
        balance_due_amount: booking.balance_due_amount,
        platform_fee_amount: booking.platform_fee_amount,
        artist_payout_amount: booking.artist_payout_amount,
        currency: normalize_currency(booking.currency),
        starts_at: booking.starts_at,
        ends_at: booking.ends_at,
        created_at: booking.created_at,
        updated_at: booking.updated_at,
        venue: venue_label(booking),
        checkout_provider: booking.checkout_provider,
        payment_intent_id: booking.payment_intent_id,
        cancellation_reason: booking.cancellation_reason,
        proposal_id: booking.service_booking_proposal&.id,
        provider: user_snapshot(booking.provider),
        customer: user_snapshot(booking.customer)
      }
    end

    def serialize_proposal(proposal)
      {
        id: proposal.id,
        event_name: proposal.event_name,
        status: proposal.status,
        fee_type: proposal.fee_type,
        proposed_amount: proposal.proposed_amount,
        deposit_amount: proposal.deposit_amount,
        balance_amount: proposal.balance_amount,
        platform_fee_amount: proposal.platform_fee_amount,
        artist_payout_amount: proposal.artist_payout_amount,
        currency: normalize_currency(proposal.currency),
        event_date: proposal.event_date,
        starts_at: proposal.starts_at,
        venue: [proposal.venue_name, proposal.city, proposal.country].compact_blank.join(", "),
        artist_counter_count: proposal.artist_counter_count,
        booker_counter_count: proposal.booker_counter_count,
        total_counter_count: proposal.artist_counter_count.to_i + proposal.booker_counter_count.to_i,
        created_at: proposal.created_at,
        updated_at: proposal.updated_at,
        service_booking_id: proposal.service_booking_id,
        booker: user_snapshot(proposal.booker),
        artist: user_snapshot(proposal.artist),
        current_offer_by: user_snapshot(proposal.current_offer_by)
      }
    end

    def serialize_ledger_entry(entry)
      booking = entry.service_booking

      {
        id: entry.id,
        service_booking_id: entry.service_booking_id,
        event_name: booking_event_name(booking),
        entry_type: entry.entry_type,
        milestone: entry.milestone,
        direction: entry.direction,
        amount: entry.amount,
        currency: normalize_currency(entry.currency),
        status: entry.status,
        gateway: entry.gateway,
        gateway_reference: entry.gateway_reference,
        occurred_at: entry.occurred_at,
        actor: user_snapshot(entry.actor)
      }
    end

    def user_snapshot(user)
      return nil if user.blank?

      {
        id: user.id,
        name: user.display_name.presence || user.full_name.presence || user.username || user.email,
        username: user.username,
        email: user.email,
        path: user.username.present? ? routes.user_path(user.username) : nil
      }
    end

    def booking_event_name(booking)
      return nil if booking.blank?

      snapshot = booking.agreement_snapshot.is_a?(Hash) ? booking.agreement_snapshot : {}
      snapshot["event_name"].presence ||
        snapshot.dig("event", "name").presence ||
        booking.venue_name.presence ||
        booking.service_product&.title ||
        "Booking ##{booking.id}"
    end

    def venue_label(booking)
      [booking.venue_name, booking.city, booking.country].compact_blank.join(", ")
    end

    def money_stats(stats_hash)
      stats_hash
        .map do |currency, amount|
          {
            currency: normalize_currency(currency),
            amount: amount.to_d
          }
        end
        .sort_by { |entry| -entry[:amount] }
    end

    def count_stats(stats_hash, key:)
      stats_hash
        .map { |value, count| { key => value.presence || "unknown", count: count.to_i } }
        .sort_by { |entry| [-entry[:count], entry[key].to_s] }
    end

    def normalize_currency(currency)
      currency.present? ? currency.to_s.upcase : "USD"
    end

    def routes
      Rails.application.routes.url_helpers
    end

    def from_date
      @from_date ||= normalized_range.first
    end

    def to_date
      @to_date ||= normalized_range.last
    end

    def normalized_range
      @normalized_range ||= begin
        default_to = parse_date(@to) || Time.zone.today
        default_from = parse_date(@from) || (default_to - (DEFAULT_RANGE_DAYS - 1).days)
        [default_from, default_to].minmax
      end
    end

    def parse_date(value)
      return if value.blank?

      Date.iso8601(value.to_s)
    rescue ArgumentError
      nil
    end
  end
end

require "rails_helper"

RSpec.describe ServiceBookingProposal, type: :model do
  include ActiveJob::TestHelper

  around do |example|
    previous_adapter = ActiveJob::Base.queue_adapter
    ActiveJob::Base.queue_adapter = :test
    clear_enqueued_jobs
    example.run
  ensure
    clear_enqueued_jobs
    ActiveJob::Base.queue_adapter = previous_adapter
  end

  describe "financials" do
    it "calculates deposit, balance, platform fee, and artist payout" do
      proposal = build(:service_booking_proposal, proposed_amount: 800_000, deposit_percentage: 50)

      proposal.valid?

      expect(proposal.deposit_amount).to eq(400_000)
      expect(proposal.balance_amount).to eq(400_000)
      expect(proposal.platform_fee_amount).to eq(40_000)
      expect(proposal.artist_payout_amount).to eq(760_000)
    end
  end

  describe "#counter!" do
    it "lets the recipient send one counterproposal" do
      proposal = create(:service_booking_proposal)

      proposal.counter!(
        actor: proposal.artist,
        attributes: {
          proposed_amount: 800_000,
          transport_included: true,
          guest_list_count: 5
        }
      )

      expect(proposal).to be_countered_by_artist
      expect(proposal.artist_counter_count).to eq(1)
      expect(proposal.current_offer_by).to eq(proposal.artist)
    end

    it "notifies the recipient by email" do
      proposal = create(:service_booking_proposal)
      clear_enqueued_jobs

      expect do
        proposal.counter!(
          actor: proposal.artist,
          attributes: {
            proposed_amount: 800_000
          }
        )
      end.to have_enqueued_mail(ServiceBookingProposalMailer, :counterproposal_received)
    end
  end

  describe "notifications" do
    it "notifies the artist when a proposal is created" do
      expect do
        create(:service_booking_proposal)
      end.to have_enqueued_mail(ServiceBookingProposalMailer, :proposal_created)
    end

    it "notifies the booker when the artist accepts the proposal" do
      proposal = create(:service_booking_proposal)
      clear_enqueued_jobs

      expect do
        proposal.accept!(actor: proposal.artist)
      end.to have_enqueued_mail(ServiceBookingProposalMailer, :proposal_accepted)
    end

    it "notifies the booker when the artist rejects the proposal" do
      proposal = create(:service_booking_proposal)
      clear_enqueued_jobs

      expect do
        proposal.reject!(actor: proposal.artist)
      end.to have_enqueued_mail(ServiceBookingProposalMailer, :proposal_rejected)
    end

    it "notifies the artist when the booker cancels the proposal" do
      proposal = create(:service_booking_proposal)
      clear_enqueued_jobs

      expect do
        proposal.cancel!(actor: proposal.booker)
      end.to have_enqueued_mail(ServiceBookingProposalMailer, :proposal_cancelled)
    end
  end

  describe "#accept!" do
    it "creates a confirmed booking with a contract snapshot when no start time is agreed" do
      proposal = create(:service_booking_proposal)
      proposal.counter!(actor: proposal.artist, attributes: { proposed_amount: 800_000 })

      booking = proposal.accept!(actor: proposal.booker)

      expect(booking).to be_confirmed
      expect(booking.contract_status).to eq("auto_signed")
      expect(booking.agreement_snapshot["proposal_id"]).to eq(proposal.id)
      expect(booking.deposit_amount).to eq(400_000)
      expect(proposal.reload.service_booking).to eq(booking)
      expect(proposal).to be_accepted
    end

    it "creates a scheduled booking when the accepted contract includes a start time and venue" do
      starts_at = Time.zone.local(2026, 7, 18, 23, 30)
      service_product = create(
        :service_product,
        service_kind: "performance",
        category: "dj_set",
        delivery_method: "in_person"
      )
      proposal = create(
        :service_booking_proposal,
        service_product: service_product,
        artist: service_product.user,
        event_date: starts_at.to_date,
        starts_at: starts_at,
        ends_at: starts_at + 2.hours,
        venue_name: "Club Rau",
        venue_address: "Av. Providencia 123",
        city: "Santiago",
        country: "Chile"
      )

      booking = proposal.accept!(actor: proposal.artist)

      expect(booking).to be_scheduled
      expect(booking.scheduled_date).to eq("2026-07-18")
      expect(booking.scheduled_time).to eq("23:30")
      expect(booking.timezone).to be_present
      expect(booking.meeting_location).to include("Club Rau")
      expect(booking.starts_at).to eq(starts_at)
    end

    it "does not cancel other proposals for the same event" do
      booker = create(:user)
      event_date = 2.weeks.from_now.to_date
      first_proposal = create(
        :service_booking_proposal,
        booker: booker,
        event_name: "Multi DJ Night",
        event_date: event_date
      )
      second_proposal = create(
        :service_booking_proposal,
        booker: booker,
        event_name: "Multi DJ Night",
        event_date: event_date
      )

      first_proposal.accept!(actor: first_proposal.artist)

      expect(first_proposal.reload).to be_accepted
      expect(second_proposal.reload).to be_pending_artist_response
    end
  end
end

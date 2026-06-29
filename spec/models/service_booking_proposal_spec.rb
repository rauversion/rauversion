require "rails_helper"

RSpec.describe ServiceBookingProposal, type: :model do
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
  end

  describe "#accept!" do
    it "creates a confirmed booking with a contract snapshot" do
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
  end
end

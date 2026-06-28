require "rails_helper"

RSpec.describe TrackProcessingChannel, type: :channel do
  let(:owner) { create(:user) }
  let(:other_user) { create(:user) }
  let(:track) { create(:track, user: owner) }

  it "streams processing progress for the track owner" do
    stub_connection current_user: owner

    subscribe track_id: track.id

    expect(subscription).to be_confirmed
    expect(subscription).to have_stream_from("track_processing_#{track.id}")
  end

  it "rejects users that do not own the track" do
    stub_connection current_user: other_user

    subscribe track_id: track.id

    expect(subscription).to be_rejected
  end
end

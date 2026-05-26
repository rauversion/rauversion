require "rails_helper"

RSpec.describe MasteringChannel, type: :channel do
  let(:owner) { create(:user) }
  let(:other_user) { create(:user) }
  let(:track) { create(:track, user: owner) }
  let(:track_master) { create(:track_master, track: track) }

  it "streams mastering progress for the owner" do
    stub_connection current_user: owner

    subscribe track_master_id: track_master.id

    expect(subscription).to be_confirmed
    expect(subscription).to have_stream_from("mastering_#{track_master.id}")
  end

  it "rejects users that do not own the track" do
    stub_connection current_user: other_user

    subscribe track_master_id: track_master.id

    expect(subscription).to be_rejected
  end
end

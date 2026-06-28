require "rails_helper"

RSpec.describe TrackMaster, type: :model do
  it { should belong_to(:track) }
  it { should have_one(:user).through(:track) }
  it { should have_one_attached(:audio) }

  it "validates the target profile" do
    master = build(:track_master, target_profile: "unknown")

    expect(master).not_to be_valid
    expect(master.errors[:target_profile]).to be_present
  end

  it "tracks readiness when completed with attached audio" do
    master = create(:track_master, state: "completed")
    master.audio.attach(
      io: StringIO.new("fake-wav"),
      filename: "master.wav",
      content_type: "audio/wav"
    )

    expect(master).to be_ready
  end

  it "marks failures with a bounded message" do
    master = create(:track_master)

    master.mark_failed!("x" * 1200)

    expect(master.state).to eq("failed")
    expect(master.failed_at).to be_present
    expect(master.error_message.length).to be <= 1000
  end

  it "resets processing state and stores retry feedback" do
    master = create(
      :track_master,
      state: "completed",
      feedback: "old prompt",
      recipe: { "target" => { "profile" => "club_loud" } },
      analysis_before: { "integrated_lufs" => -20.0 },
      analysis_after: { "integrated_lufs" => -9.5 },
      completed_at: Time.current
    )
    master.audio.attach(
      io: StringIO.new("fake-wav"),
      filename: "master.wav",
      content_type: "audio/wav"
    )

    master.retry!(feedback: "menos bombeo")

    expect(master.state).to eq("pending")
    expect(master.feedback).to eq("menos bombeo")
    expect(master.recipe).to eq({})
    expect(master.analysis_before).to eq({})
    expect(master.analysis_after).to eq({})
    expect(master.completed_at).to be_nil
    expect(master.audio).not_to be_attached
  end
end

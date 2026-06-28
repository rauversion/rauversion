require "rails_helper"

RSpec.describe TrackProcessorJob, type: :job do
  let(:track) { instance_double(Track, id: 42) }

  before do
    allow(Track).to receive(:find).with(42).and_return(track)
    allow(TrackProcessing::Broadcaster).to receive(:broadcast)
  end

  it "broadcasts processing stages and completion" do
    allow(track).to receive(:reprocess!) do |on_progress:|
      on_progress.call(step: "transcoding_audio", progress: 45)
      true
    end

    described_class.perform_now(42)

    expect(TrackProcessing::Broadcaster).to have_received(:broadcast).with(
      track,
      event: "started",
      step: "preparing",
      progress: 5,
      level: "info"
    )
    expect(TrackProcessing::Broadcaster).to have_received(:broadcast).with(
      track,
      event: "progress",
      step: "transcoding_audio",
      progress: 45,
      level: "info"
    )
    expect(TrackProcessing::Broadcaster).to have_received(:broadcast).with(
      track,
      event: "completed",
      step: "completed",
      progress: 100,
      level: "info"
    )
  end

  it "broadcasts failure and reraises processing errors" do
    allow(track).to receive(:reprocess!).and_raise(StandardError, "conversion failed")

    expect do
      described_class.perform_now(42)
    end.to raise_error(StandardError, "conversion failed")

    expect(TrackProcessing::Broadcaster).to have_received(:broadcast).with(
      track,
      event: "failed",
      step: "failed",
      progress: nil,
      level: "error"
    )
  end
end

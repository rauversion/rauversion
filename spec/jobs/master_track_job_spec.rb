require "rails_helper"

RSpec.describe MasterTrackJob, type: :job do
  let(:track_master) { create(:track_master) }

  it "marks the master as failed and broadcasts the failure when the pipeline raises" do
    pipeline = instance_double(Mastering::Pipeline)

    allow(Mastering::Pipeline).to receive(:new).with(track_master: track_master).and_return(pipeline)
    allow(pipeline).to receive(:call).and_raise(Mastering::Pipeline::Error, "render failed")
    allow(Mastering::Broadcaster).to receive(:broadcast)

    expect { described_class.perform_now(track_master.id) }.to raise_error(Mastering::Pipeline::Error, "render failed")

    expect(track_master.reload.state).to eq("failed")
    expect(track_master.error_message).to eq("render failed")
    expect(Mastering::Broadcaster).to have_received(:broadcast).with(
      track_master,
      event: "failed",
      step: "failed",
      message: "El master fallo: render failed",
      progress: nil,
      level: "error",
      payload: { error_class: "Mastering::Pipeline::Error" }
    )
  end
end

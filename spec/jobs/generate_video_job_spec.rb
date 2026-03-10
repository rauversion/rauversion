require "rails_helper"

RSpec.describe GenerateVideoJob, type: :job do
  let(:user) { create(:user, confirmed_at: Time.current, role: :artist) }
  let(:cover_blob) do
    ActiveStorage::Blob.create_and_upload!(
      io: StringIO.new(File.binread(Rails.root.join("spec/fixtures/files/sample.jpg"))),
      filename: "sample.jpg",
      content_type: "image/jpeg"
    )
  end
  let(:audio_blob) do
    ActiveStorage::Blob.create_and_upload!(
      io: StringIO.new(File.binread(Rails.root.join("spec/fixtures/audio.mp3"))),
      filename: "audio.mp3",
      content_type: "audio/mpeg"
    )
  end
  let(:generator) { instance_double(VideoGenerator) }
  let(:mailer_delivery) { instance_double(ActionMailer::MessageDelivery, deliver_now: true) }
  let(:parameterized_mailer) { double(video_ready: mailer_delivery) }

  describe "#perform" do
    it "downloads blob-backed inputs before generating and emails the result" do
      output_file = nil

      expect(VideoGenerator).to receive(:new) do |args|
        output_file = args[:output_file]

        expect(args[:cover_image]).to be_present
        expect(args[:audio_file]).to be_present
        expect(File.exist?(args[:cover_image])).to eq(true)
        expect(File.exist?(args[:audio_file])).to eq(true)
        expect(File.binread(args[:cover_image])).to eq(File.binread(Rails.root.join("spec/fixtures/files/sample.jpg")))
        expect(File.binread(args[:audio_file])).to eq(File.binread(Rails.root.join("spec/fixtures/audio.mp3")))
        expect(args[:color]).to eq("#112233")
        expect(args[:disc_size]).to eq("70")
        expect(args[:duration]).to eq("8")
        expect(args[:loop_speed]).to eq("45")

        generator
      end

      expect(generator).to receive(:generate!) do
        File.binwrite(output_file, "fake-video")
      end

      expect(VideoMailer).to receive(:with) do |args|
        expect(args[:user]).to eq(user)
        expect(args[:video_url]).to include("/rails/active_storage/blobs/")
        parameterized_mailer
      end

      described_class.perform_now(
        user_id: user.id,
        cover_image_blob_id: cover_blob.id,
        audio_file_blob_id: audio_blob.id,
        options: {
          audio_start: "0",
          audio_end: "8",
          bg_color: "#112233",
          disc_size: "70",
          duration: "8",
          loop_speed: "45"
        }
      )

      expect { cover_blob.reload }.to raise_error(ActiveRecord::RecordNotFound)
      expect { audio_blob.reload }.to raise_error(ActiveRecord::RecordNotFound)

      generated_blob = ActiveStorage::Blob.order(:created_at).last
      expect(generated_blob.filename.to_s).to match(/generated_video_\d+\.mp4/)
    end
  end
end

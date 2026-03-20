require "rails_helper"

RSpec.describe TrackAudioAnalysisService do
  describe "#call" do
    let(:client) { instance_double(OpenAI::Client) }
    let(:attachment) do
      instance_double(
        "ActiveStorageAttachment",
        attached?: true,
        filename: "audio.mp3",
        content_type: "audio/mpeg"
      )
    end
    let(:track) do
      instance_double(
        Track,
        id: 42,
        title: "Track de prueba",
        mp3_audio: attachment,
        analyzable_audio_media: attachment
      )
    end

    before do
      allow(ENV).to receive(:[]).and_call_original
      allow(ENV).to receive(:fetch).and_call_original
      allow(ENV).to receive(:[]).with("OPENAI_API_KEY").and_return("test-key")
      allow(ENV).to receive(:fetch).with("OPENAI_TRACK_ANALYSIS_MODEL", "gpt-audio").and_return("gpt-audio")
      allow(attachment).to receive(:download) do |&block|
        block.call("fake-source-audio")
      end
    end

    it "downloads the track attachment and returns normalized structured analysis" do
      allow(Open3).to receive(:capture3) do |*args|
        case args.first
        when "ffprobe"
          [
            {
              format: {
                duration: "61.8",
                bit_rate: "192000",
                format_name: "mp3"
              },
              streams: [
                {
                  codec_type: "audio",
                  codec_name: "mp3",
                  sample_rate: "44100",
                  channels: 2
                }
              ]
            }.to_json,
            "",
            instance_double(Process::Status, success?: true)
          ]
        when "ffmpeg"
          [
            "",
            "",
            instance_double(Process::Status, success?: true)
          ]
        else
          raise "Unexpected command: #{args.inspect}"
        end
      end

      allow(Dir).to receive(:mktmpdir).and_return("/tmp/generated-analysis")
      allow(File).to receive(:exist?).and_call_original
      allow(File).to receive(:exist?).with("/tmp/generated-analysis/analysis_fragment.mp3").and_return(true)
      allow(File).to receive(:binread).with("/tmp/generated-analysis/analysis_fragment.mp3").and_return("fake-mp3-data")
      allow(FileUtils).to receive(:remove_entry)

      allow(client).to receive(:chat).and_return(
        {
          "choices" => [
            {
              "message" => {
                "tool_calls" => [
                  {
                    "function" => {
                      "name" => "submit_track_analysis",
                      "arguments" => {
                        genre: "Melodic techno",
                        subgenres: ["Progressive house", "Afterlife-style"],
                        bpm: 124.4,
                        bpm_range: { min: 122, max: 126 },
                        key: "A minor",
                        mood: ["Hypnotic", "Dark"],
                        energy: 0.82,
                        danceability: 0.76,
                        instrumental: true,
                        vocal_presence: 0.05,
                        language: nil,
                        primary_instruments: ["Kick", "Synth bass", "Pads"],
                        reference_artists: ["Anyma", "Tale Of Us", "ARTBAT"],
                        production_traits: ["Rolling bassline", "Wide atmospheric pads"],
                        confidence_breakdown: {
                          genre: 0.9,
                          bpm: 0.83,
                          mood: 0.82,
                          reference_artists: 0.74,
                          language: 0.95,
                          key: 0.6,
                          production_traits: 0.79
                        },
                        analysis_notes: "Steady four-on-the-floor groove with melodic synth layering."
                      }.to_json
                    }
                  }
                ]
              }
            }
          ]
        }
      )

      result = described_class.new(
        track: track,
        duration_seconds: 60,
        client: client
      ).call

      expect(result[:accuracy]).to eq(0.8)
      expect(result[:genre]).to eq("Melodic techno")
      expect(result[:bpm]).to eq(124)
      expect(result[:instrumental]).to eq(true)
      expect(result[:reference_artists]).to eq(["Anyma", "Tale Of Us", "ARTBAT"])
      expect(result[:analysis_window]).to eq({ start_seconds: 0.0, duration_seconds: 60.0 })
      expect(result[:source_metadata]).to include(
        track_id: 42,
        track_title: "Track de prueba",
        attachment_name: "mp3_audio",
        filename: "audio.mp3",
        content_type: "audio/mpeg",
        codec: "mp3",
        duration_seconds: 61.8,
        sample_rate_hz: 44_100,
        channels: 2,
        bit_rate_kbps: 192.0
      )
      expect(attachment).to have_received(:download)
    end

    it "raises a domain error when OpenAI returns no function call" do
      allow(Open3).to receive(:capture3) do |*args|
        case args.first
        when "ffprobe"
          [
            {
              format: {
                duration: "20.0",
                bit_rate: "192000",
                format_name: "mp3"
              },
              streams: [
                {
                  codec_type: "audio",
                  codec_name: "mp3",
                  sample_rate: "44100",
                  channels: 2
                }
              ]
            }.to_json,
            "",
            instance_double(Process::Status, success?: true)
          ]
        when "ffmpeg"
          [
            "",
            "",
            instance_double(Process::Status, success?: true)
          ]
        else
          raise "Unexpected command: #{args.inspect}"
        end
      end

      allow(Dir).to receive(:mktmpdir).and_return("/tmp/generated-analysis")
      allow(File).to receive(:exist?).and_call_original
      allow(File).to receive(:exist?).with("/tmp/generated-analysis/analysis_fragment.mp3").and_return(true)
      allow(File).to receive(:binread).with("/tmp/generated-analysis/analysis_fragment.mp3").and_return("fake-mp3-data")
      allow(FileUtils).to receive(:remove_entry)

      allow(client).to receive(:chat).and_return(
        {
          "choices" => [
            {
              "message" => {
                "content" => "No structured output"
              }
            }
          ]
        }
      )

      service = described_class.new(
        track: track,
        client: client
      )

      expect { service.call }.to raise_error(
        TrackAudioAnalysisService::Error,
        "OpenAI did not return structured analysis data"
      )
    end
  end
end

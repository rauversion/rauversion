# app/services/audio_summarizer.rb
require 'openai'
require 'securerandom'
require 'tmpdir'

class AudioSummarizer
  MAX_FILE_SIZE_MB = 20
  MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024

  def initialize(file_path)
    @file_path = file_path
    @client = OpenAI::Client.new(access_token: ENV["OPENAI_API_KEY"], log_errors: true)
  end

  def summarize
    chunk_paths = split_audio_by_silence
    Rails.logger.info("Audio parts #{chunk_paths.size}")
    transcriptions = chunk_paths.map { |chunk_path| 
      Rails.logger.info("CHUNK PATH #{chunk_path}")
      transcribe_chunk(chunk_path) 
    }
    
    text = transcriptions.join("\n")
    puts text
    puts "*********"
    {
      transcription: text,
      summary: sumarize_transcription(text)
    }
    
  ensure
    cleanup_temp_files(chunk_paths)
  end

  def sumarize_transcription(text)
    response = @client.chat(
      parameters: {
          model: "gpt-4o",
          messages: [
            { role: "assistant", content: "summarize the podcast transcription for the Rauversion platform"},
            { role: "user", content: text}
          ],
          temperature: 0.7,
      })
    response.dig("choices", 0, "message", "content")
  end

  private

  def split_audio_by_silence
    output_dir = Dir.mktmpdir
    chunk_pattern = File.join(output_dir, 'chunk_%03d.wav')

    # Split the file by silence detection
    `ffmpeg -i "#{@file_path}" -af silencedetect=noise=-30dB:d=0.5 -f segment -segment_time 30 -c:a pcm_s16le "#{chunk_pattern}"`

    chunk_paths = Dir.glob("#{output_dir}/chunk_*.wav")
    valid_chunks = []

    chunk_paths.each do |chunk_path|
      if File.size(chunk_path) > MAX_FILE_SIZE_BYTES
        # Re-split large chunks further
        valid_chunks += split_large_chunk(chunk_path, output_dir)
        File.delete(chunk_path) # Delete the original large chunk
      else
        valid_chunks << chunk_path
      end
    end

    valid_chunks
  end

  def split_large_chunk(chunk_path, output_dir)
    temp_pattern = File.join(output_dir, 'temp_chunk_%03d.wav')

    `ffmpeg -i "#{chunk_path}" -f segment -segment_time 15 -c:a pcm_s16le "#{temp_pattern}"`

    Dir.glob("#{output_dir}/temp_chunk_*.wav").select do |path|
      File.size(path) <= MAX_FILE_SIZE_BYTES
    end
  end

  def transcribe_chunk(chunk_path)
    response = @client.audio.transcribe(
      parameters: {
        file: File.open(chunk_path),
        model: "whisper-1"
      }
    )
    response['text']
  end

  def cleanup_temp_files(files)
    files.each { |file| File.delete(file) if File.exist?(file) }
  end
end

require 'yaml'
require 'ruby/openai'
require 'active_support/core_ext/hash/deep_merge'

namespace :i18n do
  desc "Translate es.yml to en.yml using OpenAI"
  task :translate_to_english => :environment do
    # Initialize OpenAI client
    client = OpenAI::Client.new(
      access_token: ENV['OPENAI_API_KEY'],
      request_timeout: 240
    )

    # Load Spanish YAML
    spanish_file = Rails.root.join('config', 'locales', 'es.yml')
    spanish_yaml = YAML.load_file(spanish_file)
    spanish_translations = spanish_yaml['es']

    # Initialize result hash
    english_translations = { 'en' => {} }

    def translate_hash(client, hash, path = [], result = {})
      hash.each do |key, value|
        current_path = path + [key]
        
        if value.is_a?(Hash)
          result[key] = {}
          translate_hash(client, value, current_path, result[key])
        else
          # Skip translation for interpolation variables and special formats
          if value.is_a?(String) && 
             !value.match?(/%{[^}]+}/) && # Skip interpolation variables
             !value.match?(/^%[a-zA-Z]/) && # Skip format strings
             !value.empty? && # Skip empty strings
             !value.match?(/^[0-9\s]*$/) # Skip numeric strings
            
            prompt = <<~PROMPT
              Translate this Spanish text to English, maintaining any special characters or formatting:
              Spanish: #{value}
              English:
            PROMPT

            response = client.chat(
              parameters: {
                model: "gpt-3.5-turbo",
                messages: [{ role: "user", content: prompt }],
                temperature: 0.7,
                max_tokens: 150
              }
            )

            translation = response.dig("choices", 0, "message", "content")&.strip
            result[key] = translation || value

            # Log progress
            puts "Translated: #{current_path.join('.')} => #{translation}"
            
            # Add a small delay to avoid rate limits
            sleep(0.5)
          else
            # Keep original value for special strings
            result[key] = value
          end
        end
      end
      result
    end

    begin
      puts "Starting translation..."
      english_translations['en'] = translate_hash(client, spanish_translations)

      # Save to en.yml
      english_file = Rails.root.join('config', 'locales', 'en.yml')
      File.write(english_file, english_translations.to_yaml)
      
      puts "Translation completed successfully!"
      puts "Output saved to: #{english_file}"
    rescue => e
      puts "Error during translation: #{e.message}"
      puts e.backtrace
    end
  end
end

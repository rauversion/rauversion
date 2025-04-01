require 'yaml'
require 'ruby/openai'
require 'active_support/core_ext/hash/deep_merge'

# rails i18n:translate"[products.es.yml,en]"
namespace :i18n do
  desc "Translate YAML files using OpenAI. Usage: rake i18n:translate[source_file,target_lang]"
  task :translate, [:source_file, :target_lang] => :environment do |t, args|
    # Set defaults if arguments are not provided
    source_file = args[:source_file] || 'es.yml'
    target_lang = args[:target_lang] || 'en'
    
    # Extract source language from filename (assuming format like 'products.es.yml')
    source_lang = source_file.match(/\.([a-z]{2})\.yml$/)&.[](1) || 'es'
    
    # Initialize OpenAI client
    client = OpenAI::Client.new(
      access_token: ENV['OPENAI_API_KEY'],
      request_timeout: 240
    )

    # Load source YAML
    source_path = Rails.root.join('config', 'locales', source_file)
    source_yaml = YAML.load_file(source_path)
    source_translations = source_yaml[source_lang]

    # Initialize result hash
    target_translations = { target_lang => {} }

    def translate_hash(client, hash, source_lang, target_lang, path = [], result = {})
      hash.each do |key, value|
        current_path = path + [key]
        
        if value.is_a?(Hash)
          result[key] = {}
          translate_hash(client, value, source_lang, target_lang, current_path, result[key])
        else
          # Skip translation for interpolation variables and special formats
          if value.is_a?(String) && 
             !value.match?(/%{[^}]+}/) && # Skip interpolation variables
             !value.match?(/^%[a-zA-Z]/) && # Skip format strings
             !value.empty? && # Skip empty strings
             !value.match?(/^[0-9\s]*$/) # Skip numeric strings
            
            prompt = <<~PROMPT
              Translate this #{source_lang.upcase} text to #{target_lang.upcase}, maintaining any special characters or formatting:
              #{source_lang.upcase}: #{value}
              #{target_lang.upcase}:
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
      puts "Starting translation from #{source_lang} to #{target_lang}..."
      target_translations[target_lang] = translate_hash(client, source_translations, source_lang, target_lang)

      # Generate target filename (preserve prefix if exists)
      if source_file.include?('.')
        prefix = source_file.split('.')[0..-3].join('.')
        target_file = prefix.empty? ? "#{target_lang}.yml" : "#{prefix}.#{target_lang}.yml"
      else
        target_file = "#{target_lang}.yml"
      end
      
      target_path = Rails.root.join('config', 'locales', target_file)
      File.write(target_path, target_translations.to_yaml)
      
      puts "Translation completed successfully!"
      puts "Output saved to: #{target_path}"
    rescue => e
      puts "Error during translation: #{e.message}"
      puts e.backtrace
    end
  end
end

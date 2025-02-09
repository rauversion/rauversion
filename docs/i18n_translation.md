# I18n Translation Task

This rake task uses OpenAI's GPT-3.5-turbo model to translate the Spanish locale file (es.yml) to English (en.yml).

## Prerequisites

1. Make sure you have the required gems installed:
```ruby
gem "ruby-openai", "~> 7.1"
```

2. Set up your OpenAI API key in your environment:
```bash
export OPENAI_API_KEY=your_api_key_here
```

## Usage

Run the translation task:
```bash
bundle exec rake i18n:translate_to_english
```

The task will:
1. Read the Spanish translations from `config/locales/es.yml`
2. Translate each string using OpenAI's API
3. Preserve all interpolation variables (%{var}) and special formats
4. Save the English translations to `config/locales/en.yml`

## Features

- Maintains YAML structure and hierarchy
- Preserves interpolation variables and special formats
- Handles nested translations recursively
- Shows progress with logging
- Includes error handling
- Adds small delays to avoid rate limits

## Notes

- The task skips translation for:
  - Interpolation variables (%{var})
  - Format strings (%d, %s, etc.)
  - Empty strings
  - Numeric strings
- Each translation request has a small delay (0.5s) to avoid API rate limits
- The task uses GPT-3.5-turbo with temperature 0.7 for natural translations
- Translations are logged to the console for monitoring progress

## Example

Spanish (es.yml):
```yaml
es:
  hello: "Hola mundo"
  welcome: "Bienvenido %{name}"
```

English (en.yml) after translation:
```yaml
en:
  hello: "Hello world"
  welcome: "Welcome %{name}"

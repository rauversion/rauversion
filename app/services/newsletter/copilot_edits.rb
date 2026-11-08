require "set"

module Newsletter
  class CopilotEdits
    MAX_CHANGES = 14
    EDITABLE_FIELDS = {
      "heading" => %w[text subtitle], "text" => %w[content], "section" => %w[eyebrow title body ctaText],
      "bio" => %w[name role bio ctaText], "button" => %w[text], "image" => %w[alt], "links" => %w[title],
    }.freeze
    RICH_FIELDS = { "text" => "content", "section" => "body" }.freeze

    def initialize(context:, history:)
      unless context.is_a?(Hash) && context["blocks"].is_a?(Array) && context["blocks"].size <= 100 && context.to_json.bytesize <= 110_000
        raise Copilot::InvalidInput, "El borrador es demasiado grande o no se pudo leer. Prueba la opción Reescribir bloque."
      end

      @blocks = context.fetch("blocks")
      @by_id = @blocks.index_by { |block| block["id"] }
      @context = context.except("blocks").merge("blocks" => @blocks.map { |block| block.except("assets") })
      @history = Array(history).last(8).select { |message| %w[user assistant].include?(message["role"]) }.map do |message|
        { role: message["role"], text: message["text"].to_s.first(800) }
      end
    end

    attr_reader :context, :history

    def existing_assets
      @blocks.flat_map { |block| Array(block["assets"]) }
    end

    def fields(blocks)
      string = { type: "string" }
      {
        message: string,
        subject: { type: %w[string null] },
        preheader: { type: %w[string null] },
        changes: { type: "array", maxItems: MAX_CHANGES, items: { anyOf: [
          object_schema(action: { type: "string", enum: ["update"] }, block_id: string, field: string, value: string),
          object_schema(action: { type: "string", enum: ["insert"] }, after: string, block: blocks.block_schema),
        ] } },
      }
    end

    def build(result, blocks)
      changes = result["changes"]
      raise CopilotBlocks::INVALID unless changes.is_a?(Array) && changes.size <= MAX_CHANGES

      updated = Set.new
      {
        "message" => text(result["message"], 800, allow_blank: false),
        "subject" => metadata(result["subject"], 160, @context["subject"], allow_blank: false),
        "preheader" => metadata(result["preheader"], 220, @context["preheader"]),
        "changes" => changes.filter_map do |entry|
          raise CopilotBlocks::INVALID unless entry.is_a?(Hash)

          case entry["action"]
          when "update"
            id, field = entry.values_at("block_id", "field")
            previous = editable_text(id, field)
            raise CopilotBlocks::INVALID unless updated.add?([id, field])

            value = text(entry["value"], 8_000)
            preserve_tokens!(previous, value)
            { action: "update", block_id: id, field: field, value: value } if previous != value
          when "insert"
            anchor = entry["after"]
            raise CopilotBlocks::INVALID unless %w[start end].include?(anchor) || @by_id.key?(anchor)

            { action: "insert", after: anchor, block: blocks.build_block(entry["block"]) }
          else
            raise CopilotBlocks::INVALID
          end
        end,
      }
    end

    private

    def editable_text(id, field)
      block = @by_id.fetch(id) { raise CopilotBlocks::INVALID }
      type = block["type"]
      property, index = field.to_s.split(":", 2)
      valid = EDITABLE_FIELDS.fetch(type, []).include?(property) &&
        (RICH_FIELDS[type] == property ? index&.match?(/\A\d+\z/) : index.nil?)
      raise CopilotBlocks::INVALID unless valid

      entry = Array(block["fields"]).find { |item| item["key"] == field }
      raise CopilotBlocks::INVALID unless entry

      entry["text"].to_s
    end

    def object_schema(properties)
      { type: "object", properties: properties, required: properties.keys, additionalProperties: false }
    end

    def text(value, limit, allow_blank: true)
      raise CopilotBlocks::INVALID unless value.is_a?(String) && value.length <= limit && (allow_blank || value.present?)

      value
    end

    def metadata(value, limit, previous, allow_blank: true)
      return if value.nil?

      value = text(value, limit, allow_blank: allow_blank).squish
      preserve_tokens!(previous.to_s, value)
      value unless value == previous
    end

    def preserve_tokens!(previous, value)
      tokens = TemplateVariables::VARIABLE_PATTERN
      return if (previous.scan(tokens) - value.scan(tokens)).empty?

      raise Copilot::GenerationFailed, "La propuesta no conservó todas las variables del texto. Intenta generarla de nuevo."
    end
  end
end

require "cgi"
require "uri"

module Newsletter
  class CopilotBlocks
    INVALID = Class.new(StandardError)
    MAX_BLOCKS = 10
    FIELDS = {
      "heading" => %w[title], "text" => %w[text], "section" => %w[title text], "bio" => %w[title text],
      "button" => %w[title link], "links" => %w[links], "image" => %w[title image], "gallery" => %w[images],
      "divider" => [], "spacer" => [],
    }.freeze

    def initialize(prompt:, event_context:, block_type: nil, existing_assets: [])
      @block_type = block_type
      @links = {}
      @images = {}
      @existing_labels = {}
      @links["event_page"] = event_context[:event_url] if event_context[:event_url]
      @images["event_cover"] = event_context[:cover_url] if event_context[:cover_url]

      URI.extract(prompt, %w[http https]).uniq.first(8).each_with_index do |raw, index|
        url = raw.sub(/[).,;]+\z/, "")
        parsed = URI.parse(url)
        next unless parsed.host.present? && parsed.userinfo.nil?

        assets = parsed.path.match?(/\.(?:png|jpe?g|gif|webp)\z/i) ? @images : @links
        assets["url_#{index + 1}"] = url
      rescue URI::InvalidURIError
        next
      end

      existing_assets.first(16).each_with_index do |item, index|
        url = item["url"]
        parsed = URI.parse(url.to_s)
        next unless parsed.is_a?(URI::HTTP) && parsed.host.present? && parsed.userinfo.nil? && url.bytesize <= 2_000

        key = "existing_#{index + 1}"
        (item["kind"] == "image" ? @images : @links)[key] = url
        @existing_labels[key] = item["label"].to_s.first(120).presence || "Existing #{item["kind"]}"
      rescue URI::InvalidURIError
        next
      end
    end

    def available_types
      FIELDS.keys.reject do |type|
        (%w[button links].include?(type) && @links.empty?) ||
          (type == "image" && @images.empty?) || (type == "gallery" && @images.size < 2)
      end
    end

    def assets
      { links: describe_assets(@links, "event_page", "Event page"), images: describe_assets(@images, "event_cover", "Event cover") }
    end

    def schema
      { type: "array", minItems: 1, maxItems: @block_type ? 1 : MAX_BLOCKS - 1, items: block_schema }
    end

    def block_schema
      variants = (@block_type ? [@block_type] : available_types).map do |type|
        properties = FIELDS.fetch(type).to_h { |field| [field, field_schema(field)] }
        object_schema({ type: { type: "string", enum: [type] } }.merge(properties))
      end

      variants.one? ? variants.first : { anyOf: variants }
    end

    def build(plan, reminder: false)
      raise INVALID unless plan.is_a?(Array) && plan.size.between?(1, @block_type ? 1 : MAX_BLOCKS - 1)

      blocks = plan.map { |entry| build_block(entry) }
      if reminder && @links["event_page"] && blocks.none? { |block| block[:type] == "button" && block.dig(:props, :href) == @links["event_page"] }
        blocks << { type: "button", props: { text: "Ver evento", href: @links.fetch("event_page") } }
      end
      blocks
    end

    def field_schema(field)
      case field
      when "link", "image"
        { type: "string", enum: (field == "link" ? @links : @images).keys }
      when "links", "images"
        { type: "array", minItems: field == "images" ? 2 : 1, maxItems: 4,
          items: object_schema(title: { type: "string" }, target: field_schema(field.singularize)) }
      else
        { type: "string" }
      end
    end

    def object_schema(properties)
      { type: "object", properties: properties, required: properties.keys, additionalProperties: false }
    end

    def build_block(entry)
      raise INVALID unless entry.is_a?(Hash)

      type = entry["type"]
      raise INVALID unless available_types.include?(type) && (!@block_type || type == @block_type)

      props = case type
      when "heading" then { text: copy(entry["title"]), subtitle: "", level: "h2", size: "lg" }
      when "text" then { content: html(entry["text"]) }
      when "section" then { title: copy(entry["title"]), body: html(entry["text"]), layout: "stacked" }
      when "bio" then { name: copy(entry["title"]), bio: copy(entry["text"], limit: 2_000), layout: "stacked", role: "", ctaText: "" }
      when "button" then { text: copy(entry["title"]), href: asset(@links, entry["link"]) }
      when "links" then { links: items(entry["links"], @links, :url) }
      when "image" then { alt: copy(entry["title"]), src: asset(@images, entry["image"]) }
      when "gallery" then { images: items(entry["images"], @images, :src, min: 2) }
      else {}
      end
      { type: type, props: props }
    end

    private :field_schema, :object_schema

    private

    def describe_assets(assets, event_key, event_label)
      assets.to_h { |key, url| [key, key == event_key ? event_label : @existing_labels.fetch(key, url)] }
    end

    def items(entries, assets, url_key, min: 1)
      raise INVALID unless entries.is_a?(Array) && entries.size.between?(min, 4)

      entries.map do |entry|
        raise INVALID unless entry.is_a?(Hash)

        { (url_key == :src ? :alt : :label) => copy(entry["title"]), url_key => asset(assets, entry["target"]) }
      end
    end

    def asset(assets, key)
      assets.fetch(key) { raise INVALID }
    end

    def copy(value, limit: 200)
      raise INVALID unless value.is_a?(String) && value.strip.present? && value.strip.length <= limit

      value.strip
    end

    def html(value)
      CGI.escapeHTML(copy(value, limit: 5_000)).gsub(/\r\n?/, "\n").split(/\n[^\S\n]*\n+/).map do |paragraph|
        "<p>#{paragraph.gsub("\n", "<br>")}</p>"
      end.join
    end
  end
end

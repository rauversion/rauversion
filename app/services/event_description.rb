class EventDescription
  NODE_TYPES = %w[doc paragraph heading text hardBreak horizontalRule bulletList orderedList listItem blockquote codeBlock].freeze
  MARK_TYPES = %w[bold italic strike underline code link].freeze
  TAGS = %w[p br h1 h2 h3 strong em u s ul ol li blockquote pre code a hr].freeze

  def initialize(value, document: nil)
    @value = value.to_s
    @document = document.is_a?(Hash) ? document.deep_stringify_keys : document
  end

  def valid_document?
    @document.nil? || (@document.is_a?(Hash) && @document["type"] == "doc" && valid_node?(@document))
  end

  def document
    return @document if @document

    paragraphs = @value.gsub(/\r\n?/, "\n").split("\n\n", -1)
    paragraphs = [""] if paragraphs.empty?
    {
      "type" => "doc",
      "content" => paragraphs.map do |paragraph|
        content = paragraph.split("\n", -1).each_with_index.flat_map do |line, index|
          nodes = index.positive? ? [{ "type" => "hardBreak" }] : []
          nodes << { "type" => "text", "text" => line } if line.present?
          nodes
        end
        content.empty? ? { "type" => "paragraph" } : { "type" => "paragraph", "content" => content }
      end
    }
  end

  def html
    unless @document && valid_document?
      return "" if @value.blank?

      return helpers.simple_format(ERB::Util.html_escape(@value), {}, sanitize: false)
    end
    return "" if text.blank? && !contains_rule?(@document)

    helpers.sanitize(render_node(@document), tags: TAGS, attributes: %w[href target rel style start])
  end

  def text
    return @value unless @document && valid_document?

    node_text(@document).strip
  end

  private

  def valid_node?(node, depth = 0)
    return false unless node.is_a?(Hash) && NODE_TYPES.include?(node["type"]) && depth <= 50
    return false if node["attrs"] && !node["attrs"].is_a?(Hash)
    return false if node["type"] == "text" && !node["text"].is_a?(String)
    return false if node["marks"] && (!node["marks"].is_a?(Array) || !node["marks"].all? { |mark|
      mark.is_a?(Hash) && MARK_TYPES.include?(mark["type"]) && (mark["attrs"].nil? || mark["attrs"].is_a?(Hash))
    })

    node["content"].nil? || (node["content"].is_a?(Array) && node["content"].all? { |child| valid_node?(child, depth + 1) })
  end

  def render_node(node)
    attrs = node["attrs"] || {}
    content = helpers.safe_join(Array(node["content"]).map { |child| render_node(child) })
    alignment = attrs["textAlign"]
    style = "text-align: #{alignment}" if %w[left center right justify].include?(alignment)

    case node["type"]
    when "doc" then content
    when "text"
      Array(node["marks"]).reduce(ERB::Util.html_escape(node["text"])) { |text, mark| render_mark(text, mark) }
    when "paragraph" then helpers.tag.p(content, style: style)
    when "heading"
      level = [1, 2, 3].include?(attrs["level"]) ? attrs["level"] : 2
      helpers.tag.public_send("h#{level}", content, style: style)
    when "hardBreak" then helpers.tag.br
    when "horizontalRule" then helpers.tag.hr
    when "bulletList" then helpers.tag.ul(content)
    when "orderedList"
      start = attrs["start"].is_a?(Integer) ? attrs["start"] : 1
      helpers.tag.ol(content, start: start > 1 ? start : nil)
    when "listItem" then helpers.tag.li(content)
    when "blockquote" then helpers.tag.blockquote(content)
    when "codeBlock" then helpers.tag.pre(helpers.tag.code(content))
    end
  end

  def render_mark(text, mark)
    case mark["type"]
    when "bold" then helpers.tag.strong(text)
    when "italic" then helpers.tag.em(text)
    when "strike" then helpers.tag.s(text)
    when "underline" then helpers.tag.u(text)
    when "code" then helpers.tag.code(text)
    when "link"
      attrs = mark["attrs"] || {}
      helpers.tag.a(text, href: attrs["href"].to_s, target: attrs["target"] == "_blank" ? "_blank" : nil, rel: "noopener noreferrer")
    end
  end

  def node_text(node)
    return node["text"] if node["type"] == "text"
    return "\n" if %w[hardBreak horizontalRule].include?(node["type"])

    separator = case node["type"]
    when "doc", "listItem", "blockquote" then "\n\n"
    when "bulletList", "orderedList" then "\n"
    else ""
    end
    Array(node["content"]).map { |child| node_text(child) }.join(separator)
  end

  def contains_rule?(node)
    node["type"] == "horizontalRule" || Array(node["content"]).any? { |child| contains_rule?(child) }
  end

  def helpers
    ApplicationController.helpers
  end
end

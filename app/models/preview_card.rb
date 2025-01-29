# frozen_string_literal: true

class PreviewCard < ApplicationRecord
  include Rails.application.routes.url_helpers

  IMAGE_MIME_TYPES = ["image/jpeg", "image/png", "image/gif"].freeze

  self.inheritance_column = false

  enum :type, {link: 0, photo: 1, video: 2, rich: 3}

  # mount_uploader :image, PreviewUploader
  has_one_attached :image

  validates :url, presence: true

  before_save :process_youtube_iframe

  def save_with_optional_image!
    save!
  rescue ActiveRecord::RecordInvalid
    self.image = nil
    save!
  end

  def images
    image_url = image.attached? ? url_for(image) : nil
    [{url: image_url}]
  end

  def provider_url
    Addressable::URI.parse(url).site
  end

  def process_youtube_iframe
    return html unless url.include?('https://www.youtube.com/watch?v=') && html.present?

    doc = Nokogiri::HTML.fragment(html)
    iframe = doc.at_css('iframe')
    
    if iframe
      iframe['width'] = '100%'
      iframe['height'] = '100%'
      self.html = doc.to_html
    else
      self.html = html
    end
  end

  def media
    {html: html}
  end

  def as_oembed_json(_opts = {})
    as_json(only: %i[url title description html],
      methods: %i[provider_url images media])
  end
end

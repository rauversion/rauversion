class MediaStreamUrl
  def self.for(attachment, only_path: true)
    return unless attachment&.attached?

    blob = attachment.blob
    route = only_path ? :rails_storage_redirect_path : :rails_storage_redirect_url

    Rails.application.routes.url_helpers.public_send(
      route,
      blob,
      only_path: only_path,
      disposition: "inline"
    )
  end
end

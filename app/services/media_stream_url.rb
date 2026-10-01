class MediaStreamUrl
  def self.for(attachment, only_path: true, proxy: false)
    return unless attachment&.attached?

    blob = attachment.blob
    route = if proxy
      only_path ? :rails_storage_proxy_path : :rails_storage_proxy_url
    else
      only_path ? :rails_storage_redirect_path : :rails_storage_redirect_url
    end

    Rails.application.routes.url_helpers.public_send(
      route,
      blob,
      only_path: only_path,
      disposition: "inline"
    )
  end
end

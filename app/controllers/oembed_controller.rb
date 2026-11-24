class OembedController < ApplicationController
  include CorsHeaders
  before_action :cors_preflight_check
  after_action :cors_set_access_control_headers

  def show
    res = FetchLinkCardService.new.call(params[:url])
    return head :not_found unless res

    render json: res.as_oembed_json
  end
end

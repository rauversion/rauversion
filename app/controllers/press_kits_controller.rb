class PressKitsController < ApplicationController
  include PageMetadata

  before_action :authenticate_user!, except: [:show]
  before_action :set_user
  before_action :set_press_kit, only: [:show, :update]
  before_action :authorize_user!, only: [:update]

  def show
    set_press_kit_page_metadata

    if @press_kit
      respond_to do |format|
        format.html do
          render_blank
        end
        format.json do
          render json: {
            press_kit: press_kit_json(@press_kit),
            seo: @seo_metadata
          }
        end
      end
    else
      respond_to do |format|
        format.html do
          render_blank
        end
        format.json do
          render json: {
            press_kit: nil,
            seo: nil
          }
        end
      end
    end
  end

  def update
    @press_kit ||= @user.build_press_kit

    # Parse data if it's a JSON string
    data_param = params.dig(:press_kit, :data)
    parsed_data = data_param.is_a?(String) ? JSON.parse(data_param) : data_param
    # Normalize ActionController::Parameters to plain Hash for consistent processing
    parsed_data = parsed_data.to_unsafe_h if parsed_data.respond_to?(:to_unsafe_h)

    if parsed_data.nil?
      render json: { errors: [t('press_kit.nothing_to_update')] }, status: :unprocessable_entity
      return
    end

    # Persist data and process any uploaded image signed_ids for pressPhotos.
    # Expect each press photo entry to optionally include "signed_id" (from DirectUpload)
    # and optional "cropData". For entries with signed_id we will:
    #  - create a Photo record attached to this PressKit (photoable)
    #  - attach the signed blob to the Photo.image
    #  - replace the data entry's image field with the public url (via url_for)
    #  - remove the signed_id / cropData keys from stored data


    begin
      PressKit.transaction do
        uploaded_photo_ids = []
        # Process photos first, creating ActiveStorage-backed Photo records.
        if parsed_data["pressPhotos"].is_a?(Array)
          entries = parsed_data["pressPhotos"].map { |e| e.respond_to?(:to_unsafe_h) ? e.to_unsafe_h : e }
          entries.each do |entry|
            next unless entry.is_a?(Hash) && entry["signed_id"].present?
            # Create Photo via model hook (before_validation attaches signed_id)
            photo = @press_kit.photos.create!(user: current_user, attach_signed_id: entry["signed_id"])
            uploaded_photo_ids << photo.id
          end
          # Do not persist pressPhotos in the data JSON
          parsed_data.delete("pressPhotos")
        end

        requested_photo_ids = parsed_data.fetch("photo_ids", @press_kit.data["photo_ids"])
        requested_photo_ids = uploaded_photo_ids + (requested_photo_ids.is_a?(Array) ? requested_photo_ids : [])
        parsed_data["photo_ids"] = @press_kit.ordered_photos(photo_ids: requested_photo_ids).map(&:id)

        # Persist the remaining data cleanly (without pressPhotos)
        @press_kit.update!(data: parsed_data)
      end

      set_press_kit_page_metadata
      render json: {
        press_kit: press_kit_json(@press_kit),
        seo: @seo_metadata,
        message: t('press_kit.updated_successfully')
      }
    rescue => e
      Rails.logger.error("[PressKitsController] Error updating press kit: #{e.class} - #{e.message}\n#{e.backtrace.take(10).join("\n")}")
      render json: { errors: [e.message] }, status: :unprocessable_entity
    end
  end

  private

  def set_press_kit_page_metadata
    unless @press_kit&.published?
      set_meta_tags(noindex: true, nofollow: true)
      return
    end

    data = @press_kit.data
    artist_name = press_kit_plain_text(data["artistName"]).presence || @user.display_name
    title = "#{artist_name} — Press Kit"
    intro = data["bio"].is_a?(Hash) ? data["bio"]["intro"] : nil
    description = [intro, data["tagline"]].filter_map do |text|
      press_kit_plain_text(text).presence
    end.first || title

    photos = @press_kit.ordered_photos.select { |photo| photo.image.attached? }
    cover = photos.find { |photo| photo.id.to_s == data["heroPhotoId"].to_s } || photos.first
    image = if cover
      rails_blob_url(cover.image)
    elsif @user.avatar.attached?
      rails_blob_url(@user.avatar)
    else
      "#{request.base_url}#{AlbumsHelper.default_image_sqr}"
    end

    set_page_metadata(
      title: title,
      description: helpers.truncate(description, length: 160),
      image: image,
      image_alt: artist_name,
      url: user_press_kit_url(@user.username, format: nil),
      type: "website"
    )
  end

  def press_kit_plain_text(text)
    CGI.unescapeHTML(helpers.strip_tags(text.to_s)).squish
  end

  def set_user
    @user = User.find_by!(username: params[:user_id])
  end

  def set_press_kit
    press_kit = @user.press_kit

    # If there's a press kit but it's not published, only the owner may view it
    if press_kit && !press_kit.published? && (!current_user || current_user.id != @user.id)
      @press_kit = nil
    else
      @press_kit = press_kit
    end
  end

  def authorize_user!
    unless current_user.id == @user.id
      render json: { error: t('errors.unauthorized') }, status: :unauthorized
    end
  end

  def press_kit_params
    # Data is handled separately in the update action
    params.require(:press_kit)
  end

  def press_kit_json(press_kit)
    {
      id: press_kit.id,
      data: press_kit.data,
      photos: press_kit.ordered_photos.map do |photo|
        {
          id: photo.id,
          url: photo.image.attached? ? url_for(photo.image) : nil,
          pdf_url: photo.image.attached? ? rails_storage_proxy_path(photo.image) : nil,
          description: photo.description,
          tags: photo.tags
        }
      end,
      performer_services: performer_services_json(press_kit.user),
      created_at: press_kit.created_at,
      updated_at: press_kit.updated_at
    }
  end

  def performer_services_json(user)
    user.products
        .where(type: "Products::ServiceProduct", service_kind: "performance", status: "active")
        .includes(:service_price_rules, product_images: { image_attachment: :blob })
        .order(created_at: :desc)
        .map { |product| performer_service_json(product) }
  end

  def performer_service_json(product)
    cover_image = product.product_images.detect { |image| image.image.attached? }

    {
      id: product.id,
      title: product.title,
      slug: product.slug,
      path: user_product_path(product.user.username, product),
      description: helpers.strip_tags(product.description.to_s).squish,
      short_description: helpers.strip_tags(product.description.to_s).squish.truncate(180),
      category: product.category,
      service_kind: product.service_kind,
      booking_mode: product.booking_mode,
      delivery_method: product.delivery_method,
      duration_minutes: product.duration_minutes,
      price: product.price,
      currency: product.currency,
      formatted_price: helpers.formatted_product_price(product.price, product.currency),
      performance_format: product.performance_format,
      home_city: product.home_city,
      home_country: product.home_country,
      price_notes: product.price_notes,
      cover_url: cover_image&.image&.attached? ? url_for(cover_image.image) : nil,
      user: {
        id: product.user.id,
        username: product.user.username,
        name: product.user.display_name.presence || product.user.full_name.presence || product.user.username
      },
      service_price_rules: product.service_price_rules.ordered.active.map do |rule|
        {
          id: rule.id,
          name: rule.name,
          rule_type: rule.rule_type,
          amount: rule.amount,
          currency: rule.currency,
          formatted_amount: helpers.formatted_product_price(rule.amount, rule.currency),
          duration_minutes: rule.duration_minutes,
          location_scope: rule.location_scope
        }
      end
    }
  end
end

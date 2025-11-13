class PressKitsController < ApplicationController
  before_action :authenticate_user!, except: [:show]
  before_action :set_user
  before_action :set_press_kit, only: [:show, :update]
  # before_action :authorize_user!, only: [:update]

  def show
    if @press_kit
      respond_to do |format|
        format.html do
          render_blank
        end
        format.json do
          render json: {
            press_kit: press_kit_json(@press_kit)
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
            press_kit: nil
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
        # Process photos first, creating ActiveStorage-backed Photo records.
        if parsed_data["pressPhotos"].is_a?(Array)
          entries = parsed_data["pressPhotos"].map { |e| e.respond_to?(:to_unsafe_h) ? e.to_unsafe_h : e }
          entries.each do |entry|
            next unless entry.is_a?(Hash) && entry["signed_id"].present?
            # Create Photo via model hook (before_validation attaches signed_id)
            @press_kit.photos.create!(user: current_user, attach_signed_id: entry["signed_id"])
          end
          # Do not persist pressPhotos in the data JSON
          parsed_data.delete("pressPhotos")
        end

        # Persist the remaining data cleanly (without pressPhotos)
        @press_kit.update!(data: parsed_data)
      end

      render json: {
        press_kit: press_kit_json(@press_kit),
        message: t('press_kit.updated_successfully')
      }
    rescue => e
      Rails.logger.error("[PressKitsController] Error updating press kit: #{e.class} - #{e.message}\n#{e.backtrace.take(10).join("\n")}")
      render json: { errors: [e.message] }, status: :unprocessable_entity
    end
  end

  private

  def set_user
    @user = User.find_by!(username: params[:username])
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
      photos: press_kit.photos.map do |photo|
        {
          id: photo.id,
          url: photo.image.attached? ? url_for(photo.image) : nil,
          description: photo.description,
          tags: photo.tags
        }
      end,
      created_at: press_kit.created_at,
      updated_at: press_kit.updated_at
    }
  end
end

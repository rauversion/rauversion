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
        # First update data (we will modify it below for images)
        @press_kit.update!(data: parsed_data)

        if parsed_data["pressPhotos"].is_a?(Array)
          parsed_data["pressPhotos"].each_with_index do |entry, idx|
            next unless entry.is_a?(Hash) && entry["signed_id"].present?

            signed_id = entry["signed_id"]
            crop_data = entry["cropData"] # optional, currently not persisted to Photo model

            # Find the signed blob and attach to a new Photo record
            blob = ActiveStorage::Blob.find_signed(signed_id) rescue nil
            if blob
              photo = @press_kit.photos.create!(user: current_user)
              # attach the blob to the photo's image attachment
              photo.image.attach(blob)
              # update the entry image to the public URL
              entry["image"] = photo.image.attached? ? url_for(photo.image) : entry["image"]
              # remove temporary fields we don't want persisted
              entry.delete("signed_id")
              entry.delete("cropData")
            else
              Rails.logger.warn("[PressKitsController] signed blob not found for signed_id=#{signed_id}")
              # If blob not found, just remove signed_id to avoid storing it
              entry.delete("signed_id")
              entry.delete("cropData")
            end

            # persist modified entry back to parsed_data (already mutated)
            parsed_data["pressPhotos"][idx] = entry
          end

          # Save the cleaned up data back to press_kit
          @press_kit.update!(data: parsed_data)
        end
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
      playlists: press_kit.user_playlists.map do |playlist|
        {
          id: playlist.id,
          title: playlist.title,
          slug: playlist.slug,
          description: playlist.description,
          playlist_type: playlist.playlist_type,
          cover_url: playlist.cover.attached? ? url_for(playlist.cover) : nil
        }
      end,
      created_at: press_kit.created_at,
      updated_at: press_kit.updated_at
    }
  end
end

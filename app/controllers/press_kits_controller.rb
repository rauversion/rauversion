class PressKitsController < ApplicationController
  before_action :authenticate_user!, except: [:show]
  before_action :set_user
  before_action :set_press_kit, only: [:show, :update]
  before_action :authorize_user!, only: [:update]

  def show
    if @press_kit
      render json: {
        press_kit: press_kit_json(@press_kit)
      }
    else
      render json: {
        press_kit: nil
      }
    end
  end

  def update
    @press_kit ||= @user.build_press_kit
    
    # Parse data if it's a JSON string
    data_param = params.dig(:press_kit, :data)
    parsed_data = data_param.is_a?(String) ? JSON.parse(data_param) : data_param

    if @press_kit.update(data: parsed_data)
      render json: {
        press_kit: press_kit_json(@press_kit),
        message: t('press_kit.updated_successfully')
      }
    else
      render json: {
        errors: @press_kit.errors.full_messages
      }, status: :unprocessable_entity
    end
  end

  private

  def set_user
    @user = User.find_by!(username: params[:username])
  end

  def set_press_kit
    @press_kit = @user.press_kit
  end

  def authorize_user!
    unless current_user == @user
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

module Api
  module V1
    class ThemesController < ApplicationController
      before_action :set_theme, only: [:show, :download_tarball]

      # GET /api/v1/themes
      # List system themes and themes for the current site
      def index
        site_id = params[:site_id]
        
        themes = if site_id.present?
          Theme.where(system_theme: true).or(Theme.where(site_id: site_id))
        else
          Theme.system_themes
        end

        render json: themes.order(created_at: :desc)
      end

      # GET /api/v1/themes/:id
      def show
        render json: @theme
      end

      # POST /api/v1/themes/:id/download_tarball
      # Initiates the download of theme tarball from GitHub
      def download_tarball
        unless @theme.github_tarball_url
          render json: { error: 'Theme does not have a valid GitHub repository' }, status: :unprocessable_entity
          return
        end

        # Start async download job
        ThemeDownloadJob.perform_later(@theme.id, current_user&.id)

        render json: { 
          message: 'Theme download initiated',
          theme_id: @theme.id
        }, status: :accepted
      end

      private

      def set_theme
        @theme = Theme.find(params[:id])
      end
    end
  end
end

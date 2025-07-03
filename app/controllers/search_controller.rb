class SearchController < ApplicationController
  # POST /search
  def create
    query = params[:q].to_s.strip

    users = User.where("username ILIKE :q OR first_name ILIKE :q OR last_name ILIKE :q", q: "%#{query}%").limit(10)
    playlists = Playlist.where("title ILIKE :q OR description ILIKE :q", q: "%#{query}%").limit(10)
    tracks = Track.where("title ILIKE :q OR description ILIKE :q", q: "%#{query}%").limit(10)

    render :create, locals: { users: users, playlists: playlists, tracks: tracks }
  end
end

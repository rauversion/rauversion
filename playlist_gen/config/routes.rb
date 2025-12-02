PlaylistGen::Engine.routes.draw do
  namespace :api do
    namespace :v1 do
      resources :library_uploads, only: [:create, :show]
      resources :playlists, only: [:index, :show, :create] do
        member do
          get :export_m3u
          get :export_rekordbox
          get :export_traktor
          post :add_track
          delete :remove_track
        end
      end
      post "sets/generate", to: "sets#generate"
      
      # Tracks and genre classification
      resources :tracks, only: [:index, :show] do
        member do
          post :classify
          get :stream
        end
        collection do
          post :classify_batch
          get :stats
          get :search_by_prompt
        end
      end
    end
  end
end

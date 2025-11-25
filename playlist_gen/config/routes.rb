PlaylistGen::Engine.routes.draw do
  namespace :api do
    namespace :v1 do
      resources :library_uploads, only: [:create, :show]
      resources :playlists, only: [:index, :show] do
        member do
          get :export_m3u
        end
      end
      post "sets/generate", to: "sets#generate"
    end
  end
end

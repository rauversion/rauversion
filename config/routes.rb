require_relative "../lib/constraints/username_route_contrainer"

Rails.application.routes.draw do
  # API routes
  namespace :api do
    namespace :v1 do
      get 'me', to: 'me#show'
      resources :categories, only: [:index]
      get 'tags/popular', to: 'tags#popular'
      
      resources :users, param: :username, only: [] do
        resources :user_links, only: [:index]
      end
    end
  end

  # devise_for :users
  # Define your application routes per the DSL in https://guides.rubyonrails.org/routing.html

  # Defines the root path route ("/")
  # root "articles#index"

  resources :terms_and_conditions, only: [:index, :show]


  mount Backstage::Engine => "/admin"

  #namespace :admin do
  #  root to: 'dashboard#index'
  #  resources :users do
  #    post 'add_filter', on: :collection
  #  end
  #  resources :categories
  #  resources :posts
  #  resources :terms_and_conditions
  #  # Add more admin resources as needed
  #end


  post 'product_cart/add/:product_id', to: 'product_cart#add', as: 'product_cart_add'
  get 'product_cart', to: 'product_cart#show', as: 'product_cart'
  delete 'product_cart/remove/:product_id', to: 'product_cart#remove', as: 'product_cart_remove'

  get 'puck', to: 'releases#puck'

  resources :product_purchases, only: [:index, :show]



  namespace :products do
   
    get 'services', to: 'services#index'
    get 'music', to: 'music#index'
    get 'accessories', to: 'accessories#index'
    get 'gear', to: 'gear#index'
  end

  resources :products do
    member do
      post 'add_to_cart'
    end
    collection do
      get 'used_gear'
    end
  end

  resources :product_checkout, only: [:create] do
    collection do
      get 'success'
      get 'cancel'
    end
  end
  
  get 'checkout/success', to: 'product_checkout#success', as: :checkout_success
  get 'checkout/failure', to: 'product_checkout#cancel', as: :checkout_failure

  root to: "home#index"
  get "/home", to: "home#index"

  get "/searchables", to: "users#index", as: :searchable_users
  # resource :oembed, controller: 'oembed', only: :show
  get "/oembed/", to: "oembed#show", as: :oembed
  get "/become/:id", to: "application#become"
  get "/artists", to: "users#index"
  get "/store", to: "store#index"
  
  resources :store do
    collection do
      get :services
      get :music
      get :classes
      get :feedback
      get :accessories
      get :gear
    end
  end
  
  get "/oembed/:track_id", to: "embeds#oembed_show", as: :oembed_show
  get "/oembed/:track_id/private", to: "embeds#oembed_private_show", as: :private_oembed_track
  get "/oembed/sets/:playlist_id", to: "embeds#oembed_show", as: :oembed_playlist_show
  get "/oembed/sets/:playlist_id/private", to: "embeds#oembed_private_show", as: :private_oembed_playlist

  get "/embed/:track_id", to: "embeds#show"
  get "/embed/:track_id/private", to: "embeds#private_track", as: :private_embed
  get "/embed/sets/:playlist_id", to: "embeds#show_playlist", as: :playlist_embed
  get "/embed/sets/:playlist_id/private", to: "embeds#private_playlist", as: :playlist_private_embed

  get "/404" => "errors#not_found"
  get "/500" => "errors#fatal"
  post "webhooks/:provider", to: "webhooks#create", as: :webhooks

  resource :player, controller: "player" do
    member do
      get :tracklist
    end
  end

  scope path: "/api" do
    scope path: "/v1" do
      resources :direct_uploads, only: [:create], controller: "api/v1/direct_uploads"
      resources :audio_direct_uploads, only: [:create], controller: "api/v1/audio_direct_uploads"
    end
  end

  resources :articles do
    member do
      get :preview
    end
    collection do
      get :mine
      get :categories
      get :tags
    end
  end

  resources :sales, only: [:index]
  
  resources :purchases do
    collection do
      get :music
      get :tickets
      get :products
    end

    member do
      get :download
      get :check_zip_status
    end
  end

  devise_for :users, controllers: {
    omniauth_callbacks: "users/omniauth_callbacks",
    registrations: "users/registrations",
    sessions: "users/sessions"
    # :invitations => 'users/invitations'
  }

  resources :event_webhooks

  get "/events/:id/livestream", to: "event_streaming_services#show", as: :event_livestream

  resources :events do
    collection do
      get :mine
    end
    member do
      get :schedule
      get :team
      get :tickets
      get :streaming
      get :attendees
      get :recordings
      get :settings
    end

    resources :event_hosts
    resources :event_recordings
    resources :event_tickets
    resources :event_streaming_services, only: [:new, :update]
    resources :event_attendees, only: [:index]
    resources :event_purchases do
      member do
        get :success
        get :failure
      end
    end
  end

  get "/tracks/genre/:tag", to: "tags#index", as: :track_tag

  resources :tracks do
    resource :events, only: :show, controller: "tracking_events"
    resource :reposts
    resource :likes
    resources :comments
    resource :embed, only: :show
    resource :sharer, controller: "sharer"
    member do
      get :private, to: "tracks#private_access"
    end
    resources :track_purchases do
      member do
        get :success
        get :failure
      end
    end
  end

  resources :photos

  resources :releases do
    member do
      get :editor
    end
    collection do
      get :puck
      post :upload_puck_image
    end
  end

  resources :playlists do

    collection do
      get :by_id
      get :albums
    end
    resources :comments
    resource :embed, only: :show
    resource :likes
    resource :reposts
    resource :sharer, controller: "sharer"

    resources :releases do
      collection do
        get :puck
        post :upload_puck_image
      end
    end

    member do
      post :sort
    end

    resources :playlist_purchases, only: [:new, :create] do
      member do
        get :success
        get :failure
      end
    end

  end

  resources :track_playlists

  mount MissionControl::Jobs::Engine, at: "/jobs"

  get "/onbehalf/parent/:username", to: "label_auth#back"
  get "/onbehalf/:username", to: "label_auth#add"
  
  resources :account_connections do
    collection do
      get :user_search
      get :impersonate
    end
    member do
      get :approve
      post :approve
    end
  end

  resources :labels
  resources :albums

  resources :service_bookings do
    member do
      patch :confirm
      get :schedule_form
      patch :schedule
      patch :complete
      patch :cancel
      get :feedback_form
    end
  end

  constraints(Constraints::UsernameRouteConstrainer.new) do
    # get ':username/about', to: 'users#about', as: :user_about
    # get ':username/stats', to: 'users#stats', as: :user_stats
    # Same route as before, only within the constraints block
    resources :users, path: "" do
      resource :insights
      resources :artists, controller: "label_artists"
      resource :spotlight
      resources :user_links, path: 'links' do
        collection do
          get 'wizard/new', to: 'user_links/wizard#new', as: :wizard_new
          post 'wizard/configure', to: 'user_links/wizard#configure', as: :configure_wizard
          post 'wizard', to: 'user_links/wizard#create', as: :wizard
        end
      end
      resources :settings, param: :section, controller: "user_settings"
      resources :invitations, controller: "user_invitations"
      resources :integrations, controller: "user_integrations"
      resources :reposts, controller: "user_reposts", only: [:create]
      resources :follows, controller: "user_follows", only: [
        :index, :create, :destroy
      ]



      namespace :products, path: :products do

        resources :music do
          collection do
            get :search
          end
        end
    
        resources :gear do
          collection do
            get :search
            get :brands
          end
        end
    
        resources :merch do
          collection do
            get :search
          end
        end
    
        resources :accessory do
          collection do
            get :search
          end
        end

        resources :service do
          collection do
            get :search
          end
        end
      end

      resources :products do
        collection do
          get :used_gear
        end
      end
      resources :coupons

      resources :podcaster_hosts, only: [:new, :create, :destroy]
      resources :podcasts, controller: "podcasts" do
        collection do
          get :podcaster_info
          get :about
        end
      end
      get 'podcast/rss', to: 'podcasts#rss', defaults: { format: 'rss' }, as: :rss_podcast
      get "followers", to: "user_follows#followers"
      get "followees", to: "user_follows#followees"
      get "/tracks", to: "users#tracks"
      get "/tracks/search", to: "users#search_tracks"
      get "/playlists", to: "users#playlists"
      get "/playlists_filter", to: "users#playlists_filter"
      get "/reposts", to: "users#reposts"
      get "/albums", to: "users#albums"
      get "/about", to: "users#about"
      get "/label_artists", to: "users#artists", as: :label_artists

      get "/articles", to: "users#articles"
      member do
        get :playlists, format: :json, to: 'users#playlists_api'
      end
    end
  end

  post 'ai_enhancements/enhance', to: 'ai_enhancements#enhance'

  # mount Plain::Engine => "/plain"
end

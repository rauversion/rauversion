require_relative "../lib/constraints/username_route_contrainer"

Rails.application.routes.draw do
  resources :pages do
    collection do
      get :menus
    end
  end
  resources :course_enrollments, only: [:create, :show] do
    member do
      post :start_lesson
      post :finish_lesson
    end
  end
  resources :courses do
    collection do
      get :mine
    end
    member do
      get :enrollments
      post :invite
    end
    get "/lessons/:lesson_id", to: "courses#show_lesson", as: :lesson
    resources :course_documents, only: [:index, :create, :destroy] do
      member do
        get :download
      end
    end

    resources :course_modules do
      member do
        patch :move
      end
      resources :lessons do
        resources :course_documents, only: [:index, :create, :destroy]
        member do
          patch :move
          get :stream
        end
      end
    end
  end


  get "/page-builder", to: "application#render_blank"
  get "/search", to: "application#render_blank"
  get "/forgot-password", to: "application#render_blank"
  get "/set-generator", to: "application#render_blank"


  # Stripe Connect routes
  resource :stripe_connect, only: [:show, :create], controller: :stripe_connect do
    get :reauth
    get :return
    get :status
  end

  resources :conversations do
    member do
      post :archived
      post :close
    end
    resources :messages, only: [:create, :index] do
      member do
        put :mark_as_read
      end
    end
  end
  # API routes
  namespace :api do
    namespace :v1 do
      get 'me', to: 'me#show'
      resources :categories, only: [:index]
      get 'tags/popular', to: 'tags#popular'
      
      resources :users, param: :username, only: [] do
        resources :user_links, only: [:index]
      end
      
      resources :user_links, only: [:create, :update, :destroy] do
        collection do
          post :wizard
        end
      end
    end
  end

  # devise_for :users
  # Define your application routes per the DSL in https://guides.rubyonrails.org/routing.html

  # Defines the root path route ("/")
  # root "articles#index"

  resources :terms_and_conditions, only: [:index, :show]


  mount Backstage::Engine => "/admin"
  mount PlaylistGen::Engine => "/playlist_gen"

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

  get 'change_locale', to: 'application#change_locale'
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
  get "/home/:section", to: "home#index"

  get "/searchables", to: "users#index", as: :searchable_users
  # resource :oembed, controller: 'oembed', only: :show
  post "/search", to: "search#create"
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

  get "/articles/c/:id", to: "articles#index"

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

  resources :interest_alerts, only: [:create] do
    collection do
      get :status
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

  resources :sales do
    collection do
      get :index
      get :product_show
      get :update
    end

    member do
      get :product_show
      post :refund
    end
  end
  
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

  devise_for :users, 
  # defaults: { format: [:html, :json] },
  controllers: {
    omniauth_callbacks: "users/omniauth_callbacks",
    registrations: "users/registrations",
    sessions: "users/sessions",
    passwords: "users/passwords",
    invitations: 'users/invitations'
  }

  resources :event_webhooks

  get "/events/:id/livestream", to: "event_streaming_services#show", as: :event_livestream
  get "/events/:id/edit/:section", to: "application#render_blank"

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
    resources :event_tickets do
      member do
        get :secret_link
      end
    end
    resources :event_lists do
      member do
        post :import
      end
      resources :event_list_contacts
    end
    resources :event_streaming_services, only: [:new, :update]
    resources :event_attendees, only: [:index] do
      collection do
        get :export_csv
        get :tickets
        post :create_invitation
      end
      member do
        post :refund
      end
    end
    resources :event_reports, only: [:show]
    resources :event_purchases do
      member do
        get :success
        get :failure
      end
    end
  end

  get "/tracks/genre/:tag", to: "tags#index", as: :track_tag

  resources :tracks do
    collection do
      get :by_id
    end
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
      get :editor2, action: :editor
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
  mount Mailbin::Engine => :mailbin if Rails.env.development?


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
  resource :spotlight


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
      get "/all_playlists", to: "users#all_playlists"
      get "/playlists_filter", to: "users#playlists_filter"
      get "/reposts", to: "users#reposts"
      get "/albums", to: "users#albums"
      get "/about", to: "users#about"
      get "/label_artists", to: "users#artists", as: :label_artists

      get "/articles", to: "users#articles"
      
      # Press Kit routes
      get "/press-kit", to: "press_kits#show", as: :press_kit
      patch "/press-kit", to: "press_kits#update"
      
      member do
        get :playlists, format: :json, to: 'users#playlists_api'
      end
    end
  end

  post 'ai_enhancements/enhance', to: 'ai_enhancements#enhance'

  get "turn", to: "turn#show"
  post "turn/generate_video", to: "turn#generate_video"
  # mount Plain::Engine => "/plain"
end

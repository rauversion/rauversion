# Rauversion: Music Multiverses

Rauversion is an open-source music platform that empowers artists to share, distribute, and monetize their music directly with fans. Our mission is to provide a transparent and artist-friendly alternative to mainstream streaming services.

Rauversion is built on Ruby on Rails.

---

[![CI](https://github.com/rauversion/rauversion-ror/actions/workflows/ruby.yml/badge.svg)](https://github.com/rauversion/rauversion-ror/actions/workflows/ruby.yml)

<!--[![Maintainability](https://api.codeclimate.com/v1/badges/29736b742904813c7fec/maintainability)](https://codeclimate.com/github/rauversion/rauversion-ror/maintainability)
-->

![Image](https://github.com/user-attachments/assets/7ec88799-364f-4200-8fc2-160a7a47bfa8)

![Image](https://github.com/user-attachments/assets/9610bc9e-c5ba-47dc-a8a1-4dd9eb781d10)

![Image](https://github.com/user-attachments/assets/c6e13ff3-5ef6-41d1-bbd8-66533f68815e)

![Image](https://github.com/user-attachments/assets/36512ed5-1520-4723-b02b-3c92ad7ab433)

![Image](https://github.com/user-attachments/assets/028a6093-7f1a-4bf9-8fff-bbcebb4a1e18)


## Features:
 + Account system with different providers, Twitter, Discord, Twitch.
 + Roles to open or closed communities.
  
### Music publishing:
  + Audio processing to format mp3 and audio analysis to draw audio peaks.
  + Audio player, embeddable, with chunk range loading processing to save bandwidth.
  + Music publishing preferences, downloadable, private, attribution settings, like creative commons, all rights reserved.
  + Uploads for tracks, albums, and playlists with their meta information.
  + Multi-upload provider local or AWS, other providers could be implemented.
  + Sellable tracks & albums with Stripe, for connected accounts or main account.
  + Tagging tracks, playlists & albums.
### Music Listening:
  + Follow artists
  + Make playlists & reposts
  + Comments on tracks and albums.

### Events: 
  + Event scheduling
  + Host & managers
  + Ticketing service with QR validation
  + Sell event tickets via Stripe or transbank (Chile).
  + Use Stripe Connect to ease the payouts.
  + Streaming services via Twitch, Zoom, Whereby, Mux, and Stream Yard.
  + Attendees event details.
  + Public page with ticket checkout for paid or free tickets.

### Publishing magazine:
  + Articles management publishing: Draft, Public, Listed and partially public.
  + Showcase articles on the homepage.
  + Text editor based on [Dante3](https://dante-editor.dev)
  + Cover image.
  + Article Categories.
  
### Marketplace:
  + Sell Music: Physical formats, CD, Vinyls, Casettes.
  + Sell Gear: Used gear for trade or Barter.
  + Offer services: Different services for professionals.
  + Merch: General merch offerings.
  
### LinkTree like Supported
  + add multiple links from different sources.

### Service Bookings:
  + Book the services with clients
  + Use Messaging board to coordinate stuff

## setup

Rauversion is written in Ruby on top of the Rails Framework:

> Ruby 3.3.5

You can develop directly in a container with [vscode devcontainer](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-containers) or [neovim devcontainer](https://github.com/jamestthompson3/nvim-remote-containers)

To start your Rauversion server:

  * Install dependencies with `bundle install`
  * rename `.env.example` to `.env` and add your variable configurations
  * Create and migrate your database with `rails db:setup`
  * Compile assets `yarn install.`
  * Start Rails server with `./bin/dev`

Now you can visit [`localhost:3000`](http://localhost:3000) from your browser.


### File preprocessing requirements:

+ Lame
+ FFMPEG
+ audiowaveform
+ vips


## Local development

First you will need to copy the `.env.example` and rename it to .env you can set & tweak as many vars you want. when you are ready you will need to setup database:

First install dependences:

```bash
bundle install
yarn install
```

Prepare Database:

```bash
bundle exec rails db:prepare
```

### Start the server

There are some ways to start the server, the most straigforward is

`./bin/dev` 

That will start all the process using what is declared in `Procfile.dev` including the server, the background workers and the assets precompilation with watchers. This is good for frontend development as change in the assets will trigger a rebuild.

#### Start only the server:

`rails s`

This will only run server only. No assets precompilation.


## Docker for development

### requirements

The development image expects that youhave a local postgres installation running on localhost with the defaults. you can set some envs to set non default pg:

```bash
POSTGRES_USERNAME
POSTGRES_PASSWORD
POSTGRES_HOST
```


### Start app
- docker-compose up
- docker compose up --build  # will rebuild  
- docker-compose build --no-cache # refreshed build  

### Run Rails app only

docker compose run --rm rails bin/rails s

### Bash console
- docker compose run --rm rails bash

## Remove containers
docker compose down -v  # remove containers and volumes


## Credits

### Flag rendering API:

+ https://flagpedia.net/download/api



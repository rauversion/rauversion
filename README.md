# Rauversion

---

![image](https://user-images.githubusercontent.com/11976/174422926-b392a1f5-bd6a-4bd2-b6c8-8d41dad6711d.png)

[![CI](https://github.com/rauversion/rauversion-ror/actions/workflows/ruby.yml/badge.svg)](https://github.com/rauversion/rauversion-ror/actions/workflows/ruby.yml)

[![Maintainability](https://api.codeclimate.com/v1/badges/29736b742904813c7fec/maintainability)](https://codeclimate.com/github/rauversion/rauversion-ror/maintainability)

Rauversion is an open source music sharing platform.

Rauversion is built on Ruby on Rails.


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


## setup

Rauversion is written in Ruby on top of the Rails Framework:

> Ruby 3.2

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

## Credits

### Flag rendering API:

+ https://flagpedia.net/download/api

### image credits


Photo by <a href="https://unsplash.com/@schluditsch?utm_source=unsplash&utm_medium=referral&utm_content=creditCopyText">Daniel Schludi</a> on <a href="https://unsplash.com/?utm_source=unsplash&utm_medium=referral&utm_content=creditCopyText">Unsplash</a>

Photo by <a href="https://unsplash.com/@helloimnik?utm_source=unsplash&utm_medium=referral&utm_content=creditCopyText">Hello I'm Nik</a> on <a href="https://unsplash.com/s/photos/music-studio?utm_source=unsplash&utm_medium=referral&utm_content=creditCopyText">Unsplash</a>

Photo by <a href="https://unsplash.com/@etiennegirardet?utm_source=unsplash&utm_medium=referral&utm_content=creditCopyText">Etienne Girardet</a> on <a href="https://unsplash.com/s/photos/music-studio?utm_source=unsplash&utm_medium=referral&utm_content=creditCopyText">Unsplash</a>

Photo by <a href="https://unsplash.com/@schluditsch?utm_source=unsplash&utm_medium=referral&utm_content=creditCopyText">Daniel Schludi</a> on <a href="https://unsplash.com/s/photos/music-studio?utm_source=unsplash&utm_medium=referral&utm_content=creditCopyText">Unsplash</a>
  
Photo by <a href="https://unsplash.com/@dancristianpaduret?utm_source=unsplash&utm_medium=referral&utm_content=creditCopyText">Dan-Cristian Pădureț</a> on <a href="https://unsplash.com/s/photos/music-studio?utm_source=unsplash&utm_medium=referral&utm_content=creditCopyText">Unsplash</a>
  
Photo by <a href="https://unsplash.com/@grittzheng?utm_source=unsplash&utm_medium=referral&utm_content=creditCopyText">Gritt Zheng</a> on <a href="https://unsplash.com/s/photos/music-studio?utm_source=unsplash&utm_medium=referral&utm_content=creditCopyText">Unsplash</a>

Photo by <a href="https://unsplash.com/@saiharishk?utm_source=unsplash&utm_medium=referral&utm_content=creditCopyText">Sai Harish</a> on <a href="https://unsplash.com/?utm_source=unsplash&utm_medium=referral&utm_content=creditCopyText">Unsplash</a>

Foto de <a href="https://unsplash.com/@denitdao?utm_source=unsplash&utm_medium=referral&utm_content=creditCopyText">Denys Churchyn</a> en <a href="https://unsplash.com/es/s/fotos/black-background-gradient?utm_source=unsplash&utm_medium=referral&utm_content=creditCopyText">Unsplash</a>
  
  
  


# test
test mailers

http://localhost:3000/rails/mailers/purchases/event_ticket_confirmation

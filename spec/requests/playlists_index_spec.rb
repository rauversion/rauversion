require "rails_helper"

RSpec.describe "Playlist directory", type: :request do
  let(:artist) { create(:user, confirmed_at: Time.current, role: :artist) }

  def release_with_tracks(title: "Album", playlist_type: "album", private: false, track_privacy: [false], user: artist, **attributes)
    playlist = create(:playlist, title: title, playlist_type: playlist_type, private: private, user: user, **attributes)
    track_privacy.each do |privacy|
      track = create(:track, user: user, tenant: playlist.tenant, private: privacy)
      playlist.track_playlists.create!(track: track)
    end
    playlist
  end

  def directory(params = {})
    get playlists_path(format: :json), params: params
    expect(response).to have_http_status(:ok)
    JSON.parse(response.body)
  end

  def record_queries
    queries = []
    subscriber = lambda do |_name, _start, _finish, _id, payload|
      queries << payload[:sql] if payload[:name] != "SCHEMA" && payload[:sql].match?(/\ASELECT/i)
    end
    ActiveSupport::Notifications.subscribed(subscriber, "sql.active_record") { yield }
    queries
  end

  it "excludes empty releases and releases with only private tracks before pagination" do
    album = release_with_tracks(track_privacy: [false, nil])
    release_with_tracks(title: "Hidden tracks", track_privacy: [true])
    release_with_tracks(title: "Private album", private: true)
    release_with_tracks(title: "Podcast", playlist_type: "podcast")
    create_list(:playlist, 25, user: artist, playlist_type: "album", private: false)

    data = directory

    expect(data.fetch("collection").pluck("id")).to eq([album.id])
    expect(data.fetch("collection").first.fetch("tracks").size).to eq(2)
    expect(data.fetch("metadata")).to include("total_count" => 1, "total_pages" => 1, "next_page" => nil)
  end

  it "preserves type and title filters, newest-first order, and track position" do
    older = release_with_tracks(title: "Ambient one")
    release_with_tracks(title: "Ambient EP", playlist_type: "ep")
    release_with_tracks(title: "Techno")
    newer = release_with_tracks(title: "Ambient two", track_privacy: [false, true, nil])
    first, _private, last = newer.track_playlists.order(:position).to_a
    last.move_to_top

    data = directory(type: "album", term: "Ambient")

    expect(data.fetch("collection").pluck("id")).to eq([newer.id, older.id])
    expect(data.fetch("collection").first.fetch("tracks").pluck("id")).to eq([last.track_id, first.track_id])
  end

  it "preserves owner and label access to private tracks without publishing private albums" do
    owned = release_with_tracks(track_privacy: [true])
    labeled = release_with_tracks(user: create(:user), label: artist, track_privacy: [true])
    release_with_tracks(user: create(:user), track_privacy: [true])
    release_with_tracks(private: true)
    sign_in artist

    data = directory

    expect(data.fetch("collection").pluck("id")).to contain_exactly(owned.id, labeled.id)
    expect(data.fetch("collection").flat_map { |item| item.fetch("tracks") }.pluck("private")).to eq([true, true])
  end

  it "only returns releases from the current tenant" do
    local = release_with_tracks
    release_with_tracks(tenant: create(:tenant))

    expect(directory.fetch("collection").pluck("id")).to eq([local.id])
  end

  it "paginates distinct nonempty releases without gaps or duplicates" do
    releases = Array.new(25) { release_with_tracks(track_privacy: [false, false]) }
    create_list(:playlist, 3, user: artist, playlist_type: "album", private: false)

    first_page = directory
    second_page = directory(page: 2)

    expect(first_page.fetch("collection").pluck("id")).to eq(releases.reverse.first(24).map(&:id))
    expect(first_page.fetch("metadata")).to include("total_count" => 25, "total_pages" => 2, "next_page" => 2)
    expect(second_page.fetch("collection").pluck("id")).to eq([releases.first.id])
    expect(second_page.fetch("metadata")).to include("total_count" => 25, "next_page" => nil)
  end

  it "keeps query count constant as the number of releases and tracks grows" do
    release_with_tracks(track_privacy: [false, nil])
    directory # Warm up routes, templates, and tenant configuration.
    one_release_queries = record_queries { directory }
    3.times { release_with_tracks(user: create(:user), track_privacy: [false, nil]) }

    four_release_queries = record_queries { directory }

    expect(four_release_queries.size).to be <= one_release_queries.size
  end

  it "generates image URLs without processing image variants during the listing request" do
    playlist = release_with_tracks
    track = playlist.tracks.first
    [playlist, track].each do |record|
      record.cover.attach(io: File.open(Rails.root.join("spec/fixtures/files/sample.jpg")), filename: "cover.jpg", content_type: "image/jpeg")
      record.update!(crop_data: { x: 0, y: 0, width: 100, height: 100 })
    end
    expect_any_instance_of(ActiveStorage::VariantWithRecord).not_to receive(:processed)

    item = directory.fetch("collection").first

    expect(item.dig("cover_url", "cropped_image")).to include("/rails/active_storage/representations/")
    expect(item.fetch("tracks").first.dig("cover_url", "cropped_image")).to include("/rails/active_storage/representations/")
  end
end

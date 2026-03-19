module Admin
  class ListeningDashboard
    DEFAULT_RANGE_DAYS = 30
    TOP_TRACKS_LIMIT = 30
    BREAKDOWN_LIMIT = 12
    TRACKS_JOIN = "LEFT JOIN tracks ON tracks.id = listening_events.track_id".freeze
    TRACK_OWNERS_JOIN = "LEFT JOIN users track_owners ON track_owners.id = tracks.user_id".freeze
    PLAYLISTS_JOIN = "LEFT JOIN playlists ON playlists.id = listening_events.playlist_id".freeze
    PLAYLIST_OWNERS_JOIN = "LEFT JOIN users playlist_owners ON playlist_owners.id = playlists.user_id".freeze
    ACCOUNTS_JOIN = "LEFT JOIN users accounts ON accounts.id = listening_events.user_id".freeze
    TRACK_OWNER_NAME_SQL = "COALESCE(NULLIF(track_owners.display_name, ''), track_owners.username, track_owners.email)".freeze
    PLAYLIST_OWNER_NAME_SQL = "COALESCE(NULLIF(playlist_owners.display_name, ''), playlist_owners.username, playlist_owners.email)".freeze
    ACCOUNT_NAME_SQL = "COALESCE(NULLIF(accounts.display_name, ''), accounts.username, accounts.email)".freeze

    def initialize(scope: ListeningEvent.all, from: nil, to: nil)
      @scope = scope
      @from = from
      @to = to
    end

    def as_json(*)
      {
        range: range,
        summary: summary,
        plays_series: plays_series,
        top_tracks: top_tracks,
        top_countries: top_countries,
        top_accounts: top_accounts,
        top_playlists: top_playlists
      }
    end

    private

    attr_reader :scope

    def range
      {
        from: from_date.iso8601,
        to: to_date.iso8601,
        days: (to_date - from_date).to_i + 1
      }
    end

    def summary
      {
        total_plays: filtered_scope.count,
        accounts_count: filtered_scope.where.not(user_id: nil).distinct.count(:user_id),
        tracks_count: filtered_scope.where.not(track_id: nil).distinct.count(:track_id),
        playlists_count: filtered_scope.where.not(playlist_id: nil).distinct.count(:playlist_id),
        countries_count: distinct_countries.count,
        latest_play_at: filtered_scope.maximum(:created_at)
      }
    end

    def top_tracks
      rows = filtered_scope
        .where.not(track_id: nil)
        .joins(TRACKS_JOIN)
        .joins(TRACK_OWNERS_JOIN)
        .select(
          "listening_events.track_id AS track_id",
          "tracks.title AS track_title",
          "tracks.private AS track_private",
          "#{TRACK_OWNER_NAME_SQL} AS artist_name",
          "track_owners.username AS artist_username",
          "COUNT(listening_events.id) AS plays_count"
        )
        .group(
          "listening_events.track_id",
          "tracks.id",
          "tracks.title",
          "tracks.private",
          "track_owners.username",
          "track_owners.display_name",
          "track_owners.email"
        )
        .order(Arel.sql("plays_count DESC, listening_events.track_id DESC"))
        .limit(TOP_TRACKS_LIMIT)

      track_map = Track.where(id: rows.map(&:track_id)).index_by(&:id)

      rows.map do |row|
        track = track_map[row.track_id]
        {
          id: row.track_id,
          title: row.track_title.presence || "Deleted track ##{row.track_id}",
          artist_name: row.artist_name.presence || "Unknown artist",
          artist_username: row.artist_username,
          artist_path: row.artist_username.present? ? routes.user_path(row.artist_username) : nil,
          plays_count: row.plays_count.to_i,
          track_path: track_path_for(track),
          private: ActiveModel::Type::Boolean.new.cast(row.track_private),
          missing: track.blank?
        }
      end
    end

    def top_countries
      filtered_scope
        .where.not(country: [nil, ""])
        .group(Arel.sql("UPPER(listening_events.country)"))
        .select(
          "UPPER(listening_events.country) AS country",
          "COUNT(listening_events.id) AS plays_count",
          "COUNT(DISTINCT listening_events.user_id) AS accounts_count"
        )
        .order(Arel.sql("plays_count DESC, country ASC"))
        .limit(BREAKDOWN_LIMIT)
        .map do |row|
          country_code = normalize_country(row.country)
          {
            country: country_code,
            plays_count: row.plays_count.to_i,
            accounts_count: row.accounts_count.to_i,
            flag_url: flag_url_for(country_code)
          }
        end
    end

    def top_accounts
      filtered_scope
        .where.not(user_id: nil)
        .joins(ACCOUNTS_JOIN)
        .select(
          "listening_events.user_id AS account_id",
          "#{ACCOUNT_NAME_SQL} AS account_name",
          "accounts.username AS account_username",
          "COUNT(listening_events.id) AS plays_count",
          "COUNT(DISTINCT listening_events.track_id) AS tracks_count",
          "COUNT(DISTINCT listening_events.playlist_id) AS playlists_count"
        )
        .group(
          "listening_events.user_id",
          "accounts.username",
          "accounts.display_name",
          "accounts.email"
        )
        .order(Arel.sql("plays_count DESC, listening_events.user_id DESC"))
        .limit(BREAKDOWN_LIMIT)
        .map do |row|
          {
            id: row.account_id,
            name: row.account_name.presence || "Deleted user ##{row.account_id}",
            username: row.account_username,
            user_path: row.account_username.present? ? routes.user_path(row.account_username) : nil,
            plays_count: row.plays_count.to_i,
            tracks_count: row.tracks_count.to_i,
            playlists_count: row.playlists_count.to_i,
            missing: row.account_username.blank?
          }
        end
    end

    def top_playlists
      rows = filtered_scope
        .where.not(playlist_id: nil)
        .joins(PLAYLISTS_JOIN)
        .joins(PLAYLIST_OWNERS_JOIN)
        .select(
          "listening_events.playlist_id AS playlist_id",
          "playlists.title AS playlist_title",
          "playlists.private AS playlist_private",
          "playlists.playlist_type AS playlist_type",
          "#{PLAYLIST_OWNER_NAME_SQL} AS owner_name",
          "playlist_owners.username AS owner_username",
          "COUNT(listening_events.id) AS plays_count"
        )
        .group(
          "listening_events.playlist_id",
          "playlists.id",
          "playlists.title",
          "playlists.private",
          "playlists.playlist_type",
          "playlist_owners.username",
          "playlist_owners.display_name",
          "playlist_owners.email"
        )
        .order(Arel.sql("plays_count DESC, listening_events.playlist_id DESC"))
        .limit(BREAKDOWN_LIMIT)

      playlist_map = Playlist.where(id: rows.map(&:playlist_id)).index_by(&:id)

      rows.map do |row|
        playlist = playlist_map[row.playlist_id]
        {
          id: row.playlist_id,
          title: row.playlist_title.presence || "Deleted playlist ##{row.playlist_id}",
          playlist_type: row.playlist_type.presence&.humanize || "Playlist",
          owner_name: row.owner_name.presence || "Unknown owner",
          owner_username: row.owner_username,
          owner_path: row.owner_username.present? ? routes.user_path(row.owner_username) : nil,
          plays_count: row.plays_count.to_i,
          playlist_path: playlist_path_for(playlist),
          private: ActiveModel::Type::Boolean.new.cast(row.playlist_private),
          missing: playlist.blank?
        }
      end
    end

    def plays_series
      counts_by_day = filtered_scope
        .group(Arel.sql("DATE(listening_events.created_at)"))
        .count
        .each_with_object({}) do |(date, count), memo|
          memo[date.to_date] = count
        end

      date_range.map do |date|
        {
          date: date.iso8601,
          label: date.strftime("%b %-d"),
          plays_count: counts_by_day[date] || 0
        }
      end
    end

    def track_path_for(track)
      return nil if track.blank? || track.private?

      routes.track_path(track.slug.presence || track.id)
    end

    def playlist_path_for(playlist)
      return nil if playlist.blank? || playlist.private?

      routes.playlist_path(playlist.slug.presence || playlist.id)
    end

    def routes
      Rails.application.routes.url_helpers
    end

    def normalize_country(value)
      value.to_s.strip.upcase.presence || "Unknown"
    end

    def distinct_countries
      @distinct_countries ||= filtered_scope.where.not(country: [nil, ""]).distinct.pluck(Arel.sql("UPPER(country)"))
    end

    def filtered_scope
      @filtered_scope ||= scope.where(created_at: from_date.beginning_of_day..to_date.end_of_day)
    end

    def from_date
      @from_date ||= normalized_range.first
    end

    def to_date
      @to_date ||= normalized_range.last
    end

    def normalized_range
      @normalized_range ||= begin
        default_to = parse_date(@to) || Time.zone.today
        default_from = parse_date(@from) || (default_to - (DEFAULT_RANGE_DAYS - 1).days)
        [default_from, default_to].minmax
      end
    end

    def parse_date(value)
      return nil if value.blank?

      Date.iso8601(value)
    rescue ArgumentError
      nil
    end

    def date_range
      @date_range ||= (from_date..to_date).to_a
    end

    def flag_url_for(country_code)
      return nil unless country_code.match?(/\A[A-Z]{2}\z/)

      "https://flagcdn.com/w40/#{country_code.downcase}.png"
    end
  end
end

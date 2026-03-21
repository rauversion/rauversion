class TracksDiscoveryQuery
  FACET_LIMIT = 10
  SECTION_LIMIT = 4
  SECTION_TRACK_LIMIT = 6
  DEFAULT_PER_PAGE = 15
  MAX_PER_PAGE = 30
  SORT_OPTIONS = %w[featured latest bpm_low bpm_high most_confident].freeze
  TEMPO_BANDS = [
    { key: "under-100", translation_key: "under_100", min: nil, max: 99 },
    { key: "100-119", translation_key: "between_100_119", min: 100, max: 119 },
    { key: "120-129", translation_key: "between_120_129", min: 120, max: 129 },
    { key: "130-139", translation_key: "between_130_139", min: 130, max: 139 },
    { key: "140-plus", translation_key: "plus_140", min: 140, max: nil }
  ].freeze

  def initialize(scope: Track.published, params: {})
    @scope = scope
    @params = params.to_h.stringify_keys
  end

  def call
    paginated_tracks = preload_tracks(apply_sort(filtered_scope)).page(page).per(per_page)

    {
      tracks: paginated_tracks,
      facets: build_facets(filtered_scope),
      discovery_sections: filters_applied? ? empty_sections : build_sections,
      active_filters: active_filters,
      meta: {
        total_pages: paginated_tracks.total_pages,
        current_page: paginated_tracks.current_page,
        total_count: paginated_tracks.total_count,
        per_page: paginated_tracks.limit_value
      }
    }
  end

  private

  attr_reader :scope, :params

  def filtered_scope
    @filtered_scope ||= begin
      relation = scope
      relation = apply_query(relation)
      relation = apply_genre(relation)
      relation = apply_mood(relation)
      relation = apply_subgenre(relation)
      relation = apply_tag(relation)
      relation = apply_language(relation)
      relation = apply_vocal_mode(relation)
      relation = apply_tempo_band(relation)
      relation = apply_bpm_range(relation)
      relation
    end
  end

  def apply_query(relation)
    query = params["q"].to_s.strip
    return relation if query.blank?

    pattern = "%#{ActiveRecord::Base.sanitize_sql_like(query)}%"

    relation
      .left_outer_joins(:user)
      .where(
        <<~SQL.squish,
          tracks.title ILIKE :pattern
          OR COALESCE(tracks.description, '') ILIKE :pattern
          OR COALESCE(tracks.metadata ->> 'genre', '') ILIKE :pattern
          OR COALESCE(users.username, '') ILIKE :pattern
          OR EXISTS (
            SELECT 1
            FROM jsonb_array_elements_text(COALESCE(tracks.metadata -> 'subgenres', '[]'::jsonb)) AS subgenre(value)
            WHERE subgenre.value ILIKE :pattern
          )
          OR EXISTS (
            SELECT 1
            FROM jsonb_array_elements_text(COALESCE(tracks.metadata -> 'mood', '[]'::jsonb)) AS mood(value)
            WHERE mood.value ILIKE :pattern
          )
          OR EXISTS (
            SELECT 1
            FROM unnest(COALESCE(tracks.tags, ARRAY[]::varchar[])) AS tag(value)
            WHERE tag.value ILIKE :pattern
          )
        SQL
        pattern: pattern
      )
  end

  def apply_genre(relation)
    return relation if params["genre"].blank?

    relation.where("LOWER(COALESCE(tracks.metadata ->> 'genre', '')) = ?", params["genre"].to_s.strip.downcase)
  end

  def apply_mood(relation)
    return relation if params["mood"].blank?

    apply_array_term_filter(relation, "mood", params["mood"])
  end

  def apply_subgenre(relation)
    return relation if params["subgenre"].blank?

    apply_array_term_filter(relation, "subgenres", params["subgenre"])
  end

  def apply_tag(relation)
    return relation if params["tag"].blank?

    relation.where("? = ANY(COALESCE(tracks.tags, ARRAY[]::varchar[]))", params["tag"].to_s.strip.downcase)
  end

  def apply_language(relation)
    return relation if params["language"].blank?

    relation.where("LOWER(COALESCE(tracks.metadata ->> 'language', '')) = ?", params["language"].to_s.strip.downcase)
  end

  def apply_vocal_mode(relation)
    case params["vocal_mode"].to_s
    when "instrumental"
      relation.where("tracks.metadata ->> 'instrumental' = 'true'")
    when "vocal"
      relation.where("tracks.metadata ->> 'instrumental' = 'false'")
    else
      relation
    end
  end

  def apply_tempo_band(relation)
    band = selected_tempo_band
    return relation if band.blank?

    relation = relation.where("#{bpm_numeric_sql} >= ?", band[:min]) if band[:min].present?
    relation = relation.where("#{bpm_numeric_sql} <= ?", band[:max]) if band[:max].present?
    relation
  end

  def apply_bpm_range(relation)
    relation = relation.where("#{bpm_numeric_sql} >= ?", params["min_bpm"].to_i) if params["min_bpm"].to_i.positive?
    relation = relation.where("#{bpm_numeric_sql} <= ?", params["max_bpm"].to_i) if params["max_bpm"].to_i.positive?
    relation
  end

  def apply_sort(relation)
    case sort
    when "latest"
      relation.order(created_at: :desc)
    when "bpm_low"
      relation.order(Arel.sql("#{bpm_numeric_sql} ASC NULLS LAST, tracks.created_at DESC"))
    when "bpm_high"
      relation.order(Arel.sql("#{bpm_numeric_sql} DESC NULLS LAST, tracks.created_at DESC"))
    when "most_confident"
      relation.order(Arel.sql("#{analysis_accuracy_numeric_sql} DESC NULLS LAST, tracks.created_at DESC"))
    else
      relation.order(Arel.sql("#{analysis_accuracy_numeric_sql} DESC NULLS LAST, tracks.created_at DESC"))
    end
  end

  def build_facets(relation)
    {
      genres: top_metadata_terms(relation, "genre"),
      moods: top_metadata_array_terms(relation, "mood"),
      subgenres: top_metadata_array_terms(relation, "subgenres"),
      languages: top_metadata_terms(relation, "language", limit: 6),
      tags: top_tag_terms(relation),
      tempo_bands: tempo_band_counts(relation),
      stats: {
        analyzed_count: analyzed_relation(relation).count,
        bpm_min: metadata_numeric_bounds(relation, "bpm")[:min],
        bpm_max: metadata_numeric_bounds(relation, "bpm")[:max]
      }
    }
  end

  def build_sections
    analyzed_scope = analyzed_relation(filtered_scope)

    {
      genres: build_metadata_sections(analyzed_scope, "genre", section_title(:genres)),
      moods: build_array_sections(analyzed_scope, "mood", section_title(:moods))
    }
  end

  def build_metadata_sections(relation, key, title)
    terms = top_metadata_terms(relation, key, limit: SECTION_LIMIT)

    {
      title: title,
      items: terms.map do |term|
        {
          value: term[:value],
          count: term[:count],
          tracks: preload_tracks(
            relation.where("tracks.metadata ->> '#{key}' = ?", term[:value]).limit(SECTION_TRACK_LIMIT)
          )
        }
      end
    }
  end

  def build_array_sections(relation, key, title)
    terms = top_metadata_array_terms(relation, key, limit: SECTION_LIMIT)

    {
      title: title,
      items: terms.map do |term|
        {
          value: term[:value],
          count: term[:count],
          tracks: preload_tracks(
            apply_array_term_filter(relation, key, term[:value]).limit(SECTION_TRACK_LIMIT)
          )
        }
      end
    }
  end

  def top_metadata_terms(relation, key, limit: FACET_LIMIT)
    relation
      .where("COALESCE(tracks.metadata ->> '#{key}', '') <> ''")
      .group(Arel.sql("tracks.metadata ->> '#{key}'"))
      .order(Arel.sql("COUNT(*) DESC, tracks.metadata ->> '#{key}' ASC"))
      .limit(limit)
      .pluck(Arel.sql("tracks.metadata ->> '#{key}'"), Arel.sql("COUNT(*)"))
      .map { |value, count| { value: value, count: count.to_i } }
  end

  def top_metadata_array_terms(relation, key, limit: FACET_LIMIT)
    relation
      .joins("CROSS JOIN LATERAL jsonb_array_elements_text(COALESCE(tracks.metadata -> '#{key}', '[]'::jsonb)) AS facet(value)")
      .where("facet.value <> ''")
      .group("facet.value")
      .order(Arel.sql("COUNT(*) DESC, facet.value ASC"))
      .limit(limit)
      .pluck(Arel.sql("facet.value"), Arel.sql("COUNT(*)"))
      .map { |value, count| { value: value, count: count.to_i } }
  end

  def top_tag_terms(relation, limit: FACET_LIMIT)
    relation
      .joins("CROSS JOIN LATERAL unnest(COALESCE(tracks.tags, ARRAY[]::varchar[])) AS tag(value)")
      .where("tag.value <> ''")
      .group("tag.value")
      .order(Arel.sql("COUNT(*) DESC, tag.value ASC"))
      .limit(limit)
      .pluck(Arel.sql("tag.value"), Arel.sql("COUNT(*)"))
      .map { |value, count| { value: value, count: count.to_i } }
  end

  def tempo_band_counts(relation)
    tempo_bands.filter_map do |band|
      scoped = relation
      scoped = scoped.where("#{bpm_numeric_sql} >= ?", band[:min]) if band[:min].present?
      scoped = scoped.where("#{bpm_numeric_sql} <= ?", band[:max]) if band[:max].present?
      count = scoped.count
      next if count.zero?

      band.merge(count: count)
    end
  end

  def metadata_numeric_bounds(relation, key)
    min, max = relation.pick(
      Arel.sql("MIN(#{metadata_numeric_sql(key)})"),
      Arel.sql("MAX(#{metadata_numeric_sql(key)})")
    )

    {
      min: min&.to_f&.round,
      max: max&.to_f&.round
    }
  end

  def preload_tracks(relation)
    relation
      .with_attached_cover
      .with_attached_mp3_audio
      .includes(
        user: { avatar_attachment: :blob },
        artists: { avatar_attachment: :blob }
      )
  end

  def apply_array_term_filter(relation, key, value)
    relation.where(
      <<~SQL.squish,
        EXISTS (
          SELECT 1
          FROM jsonb_array_elements_text(COALESCE(tracks.metadata -> '#{key}', '[]'::jsonb)) AS term(value)
          WHERE LOWER(term.value) = :value
        )
      SQL
      value: value.to_s.strip.downcase
    )
  end

  def analyzed_relation(relation)
    relation.where("COALESCE(tracks.metadata ->> 'analysis_accuracy', '') <> ''")
  end

  def metadata_numeric_sql(key)
    "NULLIF(tracks.metadata ->> '#{key}', '')::numeric"
  end

  def bpm_numeric_sql
    @bpm_numeric_sql ||= metadata_numeric_sql("bpm")
  end

  def analysis_accuracy_numeric_sql
    @analysis_accuracy_numeric_sql ||= metadata_numeric_sql("analysis_accuracy")
  end

  def empty_sections
    {
      genres: { title: section_title(:genres), items: [] },
      moods: { title: section_title(:moods), items: [] }
    }
  end

  def active_filters
    {
      q: params["q"].to_s.strip.presence,
      genre: params["genre"].to_s.strip.presence,
      mood: params["mood"].to_s.strip.presence,
      subgenre: params["subgenre"].to_s.strip.presence,
      tag: params["tag"].to_s.strip.presence,
      language: params["language"].to_s.strip.presence,
      vocal_mode: params["vocal_mode"].to_s.strip.presence,
      tempo_band: params["tempo_band"].to_s.strip.presence,
      min_bpm: params["min_bpm"].to_i.positive? ? params["min_bpm"].to_i : nil,
      max_bpm: params["max_bpm"].to_i.positive? ? params["max_bpm"].to_i : nil,
      sort: sort
    }.compact
  end

  def filters_applied?
    active_filters.except(:sort).present?
  end

  def selected_tempo_band
    @selected_tempo_band ||= tempo_bands.find { |band| band[:key] == params["tempo_band"].to_s }
  end

  def tempo_bands
    @tempo_bands ||= TEMPO_BANDS.map do |band|
      band.merge(label: I18n.t("tracks.discovery.tempo_bands.#{band[:translation_key]}"))
    end
  end

  def section_title(key)
    I18n.t("tracks.discovery.sections.#{key}")
  end

  def sort
    value = params["sort"].to_s
    SORT_OPTIONS.include?(value) ? value : "featured"
  end

  def page
    value = params["page"].to_i
    value.positive? ? value : 1
  end

  def per_page
    requested = params["per_page"].to_i
    return DEFAULT_PER_PAGE unless requested.positive?

    [requested, MAX_PER_PAGE].min
  end
end

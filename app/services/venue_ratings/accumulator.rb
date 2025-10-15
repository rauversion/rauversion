# frozen_string_literal: true

# Accumula agregados incrementales en venue_rating_stats por día (bucket_on), role y métrica.
# Usa UPSERT con incrementos (sum +=, count +=) para alta concurrencia.
#
# API:
#   VenueRatings::Accumulator.apply_create(review)
#   VenueRatings::Accumulator.apply_update(review, before:)  # before: hash snapshot con valores previos
#   VenueRatings::Accumulator.apply_destroy(before:)         # before: snapshot del review destruido
#
# Snapshot esperado (Hash simbólico):
#   {
#     venue_id: Integer,
#     reviewer_role: String,
#     bucket_on: Date,
#     overall_rating: Float,
#     aspects: Hash{String|Symbol => Numeric}
#   }
module VenueRatings
  class Accumulator
    class << self
      def apply_create(review)
        snap = snapshot_from_review(review)
        apply_delta!(snap, +1)
      end

      # review: objeto actual
      # before: hash con valores previos
      def apply_update(review, before:)
        after = snapshot_from_review(review)

        # Cambios de composite key (venue_id, bucket_on, reviewer_role) requieren debitar viejo y acreditar nuevo
        if before[:venue_id] != after[:venue_id] ||
           before[:bucket_on] != after[:bucket_on] ||
           before[:reviewer_role] != after[:reviewer_role]

          # Debitar completamente lo viejo
          apply_delta!(before, -1, full: true)
          # Acreditar completamente lo nuevo
          apply_delta!(after, +1, full: true)
          return
        end

        # Mismo composite key: aplicar solamente deltas numéricos
        overall_delta = (after[:overall_rating].to_f - before[:overall_rating].to_f)
        upsert_increment!(
          venue_id: after[:venue_id],
          bucket_on: after[:bucket_on],
          reviewer_role: after[:reviewer_role],
          metric: "overall",
          sum_delta: overall_delta,
          count_delta: 0
        )

        # Aspects: calcular delta por key y delta de count según presencia
        before_aspects = (before[:aspects] || {}).transform_keys(&:to_s)
        after_aspects  = (after[:aspects] || {}).transform_keys(&:to_s)
        keys = (before_aspects.keys + after_aspects.keys).uniq
        keys.each do |k|
          b = to_num(before_aspects[k])
          a = to_num(after_aspects[k])
          sum_delta = (a || 0.0) - (b || 0.0)
          count_delta = presence_to_count(a) - presence_to_count(b)
          next if sum_delta.zero? && count_delta.zero?

          upsert_increment!(
            venue_id: after[:venue_id],
            bucket_on: after[:bucket_on],
            reviewer_role: after[:reviewer_role],
            metric: k,
            sum_delta: sum_delta,
            count_delta: count_delta
          )
        end
      end

      # before: snapshot del review eliminado
      def apply_destroy(before:)
        apply_delta!(before, -1)
      end

      private

      def snapshot_from_review(review)
        {
          venue_id: review.venue_id,
          reviewer_role: review.reviewer_role,
          bucket_on: (review.created_at || Time.current).to_date,
          overall_rating: review.overall_rating.to_f,
          aspects: (review.aspects || {}).dup
        }
      end

      # full: true => aplica todo el contenido (overall y todos los aspects) con count +/-1 para existentes
      # sign: +1 o -1
      def apply_delta!(snap, sign, full: false)
        vid = snap[:venue_id]
        role = snap[:reviewer_role]
        day  = snap[:bucket_on]

        # Overall (siempre cuenta 1 en create/destroy)
        sum_delta = sign * snap[:overall_rating].to_f
        count_delta = full ? sign * 1 : (sign == -1 ? -1 : +1) # en create/destroy da +/-1; en update con full también +/-1
        upsert_increment!(
          venue_id: vid,
          bucket_on: day,
          reviewer_role: role,
          metric: "overall",
          sum_delta: sum_delta,
          count_delta: count_delta
        )

        # Aspects
        (snap[:aspects] || {}).each do |k, v|
          next if v.nil?
          upsert_increment!(
            venue_id: vid,
            bucket_on: day,
            reviewer_role: role,
            metric: k.to_s,
            sum_delta: sign * v.to_f,
            count_delta: sign * 1
          )
        end
      end

      def presence_to_count(v)
        v.nil? ? 0 : 1
      end

      def to_num(v)
        return nil if v.nil?
        Float(v) rescue nil
      end

      # Realiza UPSERT con incrementos en sum y count.
      def upsert_increment!(venue_id:, bucket_on:, reviewer_role:, metric:, sum_delta:, count_delta:)
        return if sum_delta.to_f.zero? && count_delta.to_i.zero?

        now = Time.current
        raw_sql = <<~SQL.squish
          INSERT INTO venue_rating_stats
            (venue_id, bucket_on, reviewer_role, metric, sum, count, last_review_at, created_at, updated_at)
          VALUES
            (?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT (venue_id, bucket_on, reviewer_role, metric)
          DO UPDATE SET
            sum = venue_rating_stats.sum + EXCLUDED.sum,
            count = venue_rating_stats.count + EXCLUDED.count,
            last_review_at = GREATEST(venue_rating_stats.last_review_at, EXCLUDED.last_review_at),
            updated_at = EXCLUDED.updated_at
        SQL

        sql = ActiveRecord::Base.send(
          :sanitize_sql_array,
          [
            raw_sql,
            venue_id,
            bucket_on,
            reviewer_role,
            metric,
            sum_delta,
            count_delta,
            now,
            now,
            now
          ]
        )

        ActiveRecord::Base.connection.execute(sql)
      end
    end
  end
end

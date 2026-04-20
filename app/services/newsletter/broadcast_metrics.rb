module Newsletter
  class BroadcastMetrics
    DELIVERY_COLORS = {
      delivered: "var(--chart-1)",
      failed: "var(--chart-3)",
      pending: "var(--chart-4)",
    }.freeze

    ENGAGEMENT_COLORS = {
      clicked: "var(--chart-2)",
      opened_only: "var(--chart-1)",
      clicked_without_open: "var(--chart-5)",
      no_engagement: "var(--chart-4)",
    }.freeze

    def initialize(broadcast)
      @broadcast = broadcast
    end

    def as_json
      {
        unique_open_recipients: unique_open_recipient_ids.size,
        total_opens: open_events.count,
        unique_click_recipients: unique_click_recipient_ids.size,
        total_clicks: click_events.count,
        open_rate: percentage(unique_open_recipient_ids.size, sent_recipients),
        click_rate: percentage(unique_click_recipient_ids.size, sent_recipients),
        click_to_open_rate: percentage(unique_click_recipient_ids.size, unique_open_recipient_ids.size),
        delivery_breakdown: delivery_breakdown,
        engagement_breakdown: engagement_breakdown,
        activity_series: activity_series,
        top_links: top_links,
      }
    end

    def recipient_aggregates
      @recipient_aggregates ||= begin
        aggregates = Hash.new { |hash, key| hash[key] = default_recipient_aggregate }

        open_events.order(:occurred_at).pluck(:recipient_id, :occurred_at).each do |recipient_id, occurred_at|
          recipient = aggregates[recipient_id]
          recipient[:open_count] += 1
          recipient[:opened_at] ||= occurred_at
          recipient[:last_opened_at] = occurred_at
        end

        click_events.order(:occurred_at).pluck(:recipient_id, :occurred_at).each do |recipient_id, occurred_at|
          recipient = aggregates[recipient_id]
          recipient[:click_count] += 1
          recipient[:clicked_at] ||= occurred_at
          recipient[:last_clicked_at] = occurred_at
        end

        aggregates
      end
    end

    private

    attr_reader :broadcast

    def events
      @events ||= broadcast.events
    end

    def open_events
      @open_events ||= events.opens
    end

    def click_events
      @click_events ||= events.clicks
    end

    def unique_open_recipient_ids
      @unique_open_recipient_ids ||= open_events.distinct.pluck(:recipient_id)
    end

    def unique_click_recipient_ids
      @unique_click_recipient_ids ||= click_events.distinct.pluck(:recipient_id)
    end

    def sent_recipients
      broadcast.sent_recipients.to_i
    end

    def delivery_breakdown
      [
        metric_slice(:delivered, "Entregados", sent_recipients, DELIVERY_COLORS[:delivered]),
        metric_slice(:failed, "Fallidos", broadcast.failed_recipients.to_i, DELIVERY_COLORS[:failed]),
        metric_slice(:pending, "Pendientes", broadcast.pending_recipients_count, DELIVERY_COLORS[:pending]),
      ].select { |slice| slice[:value].positive? }
    end

    def engagement_breakdown
      clicked = unique_click_recipient_ids
      opened = unique_open_recipient_ids
      engaged = (opened + clicked).uniq

      slices = [
        metric_slice(:clicked, "Click", clicked.size, ENGAGEMENT_COLORS[:clicked]),
        metric_slice(:opened_only, "Solo apertura", (opened - clicked).size, ENGAGEMENT_COLORS[:opened_only]),
        metric_slice(:clicked_without_open, "Click sin apertura", (clicked - opened).size, ENGAGEMENT_COLORS[:clicked_without_open]),
        metric_slice(:no_engagement, "Sin interacción", [sent_recipients - engaged.size, 0].max, ENGAGEMENT_COLORS[:no_engagement]),
      ]

      slices.select { |slice| slice[:value].positive? }
    end

    def activity_series
      opens_by_day = open_events.group("DATE(occurred_at)").count
      clicks_by_day = click_events.group("DATE(occurred_at)").count
      dates = (opens_by_day.keys + clicks_by_day.keys).uniq.sort

      dates.map do |date|
        {
          date: date.to_s,
          opens: opens_by_day[date].to_i,
          clicks: clicks_by_day[date].to_i,
        }
      end
    end

    def top_links
      click_events
        .where.not(tracked_url: [nil, ""])
        .group(:tracked_url)
        .order(Arel.sql("COUNT(*) DESC"))
        .limit(5)
        .count
        .map do |url, count|
          {
            url: url,
            clicks: count,
            unique_clicks: click_events.where(tracked_url: url).distinct.count(:recipient_id),
          }
        end
    end

    def percentage(numerator, denominator)
      return 0.0 if denominator.to_f <= 0

      ((numerator.to_f / denominator.to_f) * 100).round(1)
    end

    def metric_slice(key, label, value, fill)
      {
        key: key.to_s,
        label: label,
        value: value.to_i,
        fill: fill,
      }
    end

    def default_recipient_aggregate
      {
        open_count: 0,
        click_count: 0,
        opened_at: nil,
        last_opened_at: nil,
        clicked_at: nil,
        last_clicked_at: nil,
      }
    end
  end
end

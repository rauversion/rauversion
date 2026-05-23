class SalesDashboard
  DEFAULT_RANGE_DAYS = 30
  TOP_LIMIT = 8
  RECENT_LIMIT = 8
  PAID_PRODUCT_STATUSES = %w[completed order_placed].freeze

  def initialize(user:, from: nil, to: nil)
    @user = user
    @from = parse_date(from) || (DEFAULT_RANGE_DAYS - 1).days.ago.to_date
    @to = parse_date(to) || Time.zone.today
  end

  def as_json(*)
    {
      range: range,
      summary: summary,
      revenue_by_currency: money_stats(combined_revenue_by_currency),
      revenue_series: revenue_series,
      sales_mix: sales_mix,
      product_status_mix: product_status_mix,
      top_items: top_items,
      recent_sales: recent_sales
    }
  end

  private

  attr_reader :user, :from, :to

  def parse_date(value)
    return nil if value.blank?

    Date.iso8601(value.to_s)
  rescue ArgumentError
    nil
  end

  def range
    {
      from: from.iso8601,
      to: to.iso8601,
      days: (to - from).to_i + 1
    }
  end

  def date_range
    from.beginning_of_day..to.end_of_day
  end

  def seller_ids
    @seller_ids ||= user.seller_account_ids
  end

  def summary
    orders = paid_music_orders_count + paid_product_orders_count
    revenue = combined_revenue_by_currency.values.sum(&:to_d)
    units = paid_track_items.count + paid_album_items.count + paid_product_units

    {
      gross_revenue: revenue.to_f,
      music_revenue: money_value(paid_music_revenue),
      product_revenue: money_value(paid_product_revenue),
      orders_count: orders,
      units_sold: units,
      average_order_value: orders.positive? ? (revenue / orders).to_f : 0,
      music_sales_count: paid_track_items.count + paid_album_items.count,
      product_orders_count: paid_product_orders_count,
      pending_product_orders_count: product_purchases.where(status: "pending").count,
      refunded_count: refunded_music_items_count + product_purchases.where(status: "refunded").count,
      latest_sale_at: latest_sale_at,
      primary_currency: primary_currency
    }
  end

  def revenue_series
    music = merge_grouped_money(
      paid_track_items.group_by_day("purchased_items.created_at", range: date_range, format: "%Y-%m-%d").sum("COALESCE(purchased_items.price, 0)"),
      paid_album_items.group_by_day("purchased_items.created_at", range: date_range, format: "%Y-%m-%d").sum("COALESCE(purchased_items.price, 0)")
    )
    products = paid_product_items
      .group_by_day("product_purchases.created_at", range: date_range, format: "%Y-%m-%d")
      .sum("COALESCE(product_purchase_items.price, 0) * COALESCE(product_purchase_items.quantity, 1)")

    date_keys.map do |date|
      music_amount = money_value(music[date])
      product_amount = money_value(products[date])

      {
        date: date,
        music: music_amount,
        products: product_amount,
        total: music_amount + product_amount
      }
    end
  end

  def sales_mix
    [
      {
        key: "tracks",
        units: paid_track_items.count,
        revenue: money_value(paid_track_items.sum("COALESCE(purchased_items.price, 0)"))
      },
      {
        key: "albums",
        units: paid_album_items.count,
        revenue: money_value(paid_album_items.sum("COALESCE(purchased_items.price, 0)"))
      },
      {
        key: "products",
        units: paid_product_units,
        revenue: money_value(paid_product_revenue)
      }
    ]
  end

  def product_status_mix
    product_purchases.group(:status).count.map do |status, count|
      {
        key: status.presence || "unknown",
        count: count.to_i
      }
    end
  end

  def top_items
    (top_track_items + top_album_items + top_product_items)
      .sort_by { |item| [-item[:revenue].to_f, -item[:units].to_i] }
      .first(TOP_LIMIT)
  end

  def recent_sales
    (recent_music_sales + recent_product_sales)
      .sort_by { |sale| Time.zone.parse(sale[:created_at].to_s) || Time.zone.at(0) }
      .reverse
      .first(RECENT_LIMIT)
  end

  def track_items
    @track_items ||= PurchasedItem
      .joins(:purchase)
      .joins("INNER JOIN tracks ON tracks.id = purchased_items.purchased_item_id AND purchased_items.purchased_item_type = 'Track'")
      .where(tracks: { user_id: seller_ids })
      .where(purchased_items: { created_at: date_range })
  end

  def album_items
    @album_items ||= PurchasedItem
      .joins(:purchase)
      .joins("INNER JOIN playlists ON playlists.id = purchased_items.purchased_item_id AND purchased_items.purchased_item_type = 'Playlist'")
      .where(playlists: { user_id: seller_ids, playlist_type: "album" })
      .where(purchased_items: { created_at: date_range })
  end

  def paid_track_items
    @paid_track_items ||= track_items.where(purchased_items: { state: "paid" })
  end

  def paid_album_items
    @paid_album_items ||= album_items.where(purchased_items: { state: "paid" })
  end

  def refunded_music_items_count
    track_items.where(purchased_items: { state: "refunded" }).count +
      album_items.where(purchased_items: { state: "refunded" }).count
  end

  def product_purchases
    @product_purchases ||= ProductPurchase.for_seller(user)
      .where(product_purchases: { created_at: date_range })
  end

  def product_items
    @product_items ||= ProductPurchaseItem
      .joins(:product_purchase, :product)
      .where(products: { user_id: seller_ids })
      .where(product_purchases: { created_at: date_range })
  end

  def paid_product_items
    @paid_product_items ||= product_items.where(product_purchases: { status: PAID_PRODUCT_STATUSES })
  end

  def paid_product_revenue
    paid_product_items.sum("COALESCE(product_purchase_items.price, 0) * COALESCE(product_purchase_items.quantity, 1)")
  end

  def paid_music_revenue
    paid_track_items.sum("COALESCE(purchased_items.price, 0)") +
      paid_album_items.sum("COALESCE(purchased_items.price, 0)")
  end

  def paid_product_units
    paid_product_items.sum("COALESCE(product_purchase_items.quantity, 1)").to_i
  end

  def paid_music_orders_count
    (paid_track_items.distinct.pluck(:purchase_id) + paid_album_items.distinct.pluck(:purchase_id)).uniq.count
  end

  def paid_product_orders_count
    paid_product_items.distinct.count("product_purchases.id")
  end

  def combined_revenue_by_currency
    merge_grouped_money(
      paid_track_items.group(:currency).sum("COALESCE(purchased_items.price, 0)"),
      paid_album_items.group(:currency).sum("COALESCE(purchased_items.price, 0)"),
      paid_product_items.group("product_purchase_items.currency").sum("COALESCE(product_purchase_items.price, 0) * COALESCE(product_purchase_items.quantity, 1)")
    )
  end

  def primary_currency
    combined_revenue_by_currency.max_by { |_currency, amount| amount.to_d }&.first.presence || "usd"
  end

  def latest_sale_at
    [
      paid_track_items.maximum("purchased_items.created_at"),
      paid_album_items.maximum("purchased_items.created_at"),
      paid_product_items.maximum("product_purchases.created_at")
    ].compact.max
  end

  def top_track_items
    paid_track_items
      .select("tracks.id AS item_id, tracks.title AS item_title, purchased_items.currency AS sale_currency, COUNT(purchased_items.id) AS units, SUM(COALESCE(purchased_items.price, 0)) AS revenue")
      .group("tracks.id", "tracks.title", "purchased_items.currency")
      .map { |row| top_item_hash(row, "tracks") }
  end

  def top_album_items
    paid_album_items
      .select("playlists.id AS item_id, playlists.title AS item_title, purchased_items.currency AS sale_currency, COUNT(purchased_items.id) AS units, SUM(COALESCE(purchased_items.price, 0)) AS revenue")
      .group("playlists.id", "playlists.title", "purchased_items.currency")
      .map { |row| top_item_hash(row, "albums") }
  end

  def top_product_items
    paid_product_items
      .select("products.id AS item_id, products.title AS item_title, products.type AS product_type, product_purchase_items.currency AS sale_currency, SUM(COALESCE(product_purchase_items.quantity, 1)) AS units, SUM(COALESCE(product_purchase_items.price, 0) * COALESCE(product_purchase_items.quantity, 1)) AS revenue")
      .group("products.id", "products.title", "products.type", "product_purchase_items.currency")
      .map { |row| top_item_hash(row, "products", row.product_type) }
  end

  def top_item_hash(row, key, subtype = nil)
    {
      id: row.item_id,
      key: key,
      subtype: subtype,
      title: row.item_title,
      units: row.units.to_i,
      revenue: money_value(row.revenue),
      currency: normalize_currency(row.sale_currency)
    }
  end

  def recent_music_sales
    track_recent = paid_track_items.includes(purchase: :user).preload(:purchased_item).order(created_at: :desc).limit(RECENT_LIMIT)
    album_recent = paid_album_items.includes(purchase: :user).preload(:purchased_item).order(created_at: :desc).limit(RECENT_LIMIT)

    (track_recent + album_recent).map do |item|
      {
        id: "music-#{item.id}",
        type: item.purchased_item_type == "Track" ? "tracks" : "albums",
        title: item.purchased_item&.title,
        amount: money_value(item.price),
        currency: normalize_currency(item.currency),
        units: 1,
        status: item.state,
        buyer_name: item.purchase.user&.full_name,
        buyer_email: item.purchase.user&.email,
        created_at: item.created_at
      }
    end
  end

  def recent_product_sales
    ProductPurchase.for_seller(user)
      .includes(:user, product_purchase_items: :product)
      .where(product_purchases: { created_at: date_range })
      .order(created_at: :desc)
      .limit(RECENT_LIMIT)
      .map do |purchase|
        seller_items = purchase.product_purchase_items.select { |item| seller_ids.include?(item.product.user_id) }
        amount = seller_items.sum { |item| item.price.to_d * item.quantity.to_i }

        {
          id: "product-#{purchase.id}",
          type: "products",
          title: seller_items.map { |item| "#{item.quantity}x #{item.product.title}" }.join(", "),
          amount: money_value(amount),
          currency: normalize_currency(seller_items.first&.currency || purchase.currency),
          units: seller_items.sum { |item| item.quantity.to_i },
          status: purchase.status,
          buyer_name: purchase.user&.full_name,
          buyer_email: purchase.user&.email,
          created_at: purchase.created_at,
          path: Rails.application.routes.url_helpers.product_show_sale_path(purchase)
        }
      end
  end

  def merge_grouped_money(*hashes)
    hashes.each_with_object({}) do |hash, memo|
      hash.each do |key, value|
        normalized_key = key.presence || "usd"
        memo[normalized_key] = memo.fetch(normalized_key, 0.to_d) + value.to_d
      end
    end
  end

  def money_stats(hash)
    hash.map do |currency, amount|
      {
        currency: normalize_currency(currency),
        amount: money_value(amount)
      }
    end.sort_by { |entry| -entry[:amount] }
  end

  def money_value(value)
    value.to_d.to_f
  end

  def normalize_currency(currency)
    currency.presence || "usd"
  end

  def date_keys
    (from..to).map { |date| date.strftime("%Y-%m-%d") }
  end
end

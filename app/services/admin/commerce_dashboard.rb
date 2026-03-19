module Admin
  class CommerceDashboard
    SUCCESSFUL_STATUSES = %w[completed order_placed].freeze
    TOP_LIMIT = 8
    RECENT_LIMIT = 12
    PRODUCTS_JOIN = "INNER JOIN products ON products.id = product_purchase_items.product_id".freeze
    SELLERS_JOIN = "INNER JOIN users sellers ON sellers.id = products.user_id".freeze
    BUYERS_JOIN = "INNER JOIN users buyers ON buyers.id = product_purchases.user_id".freeze
    SELLER_NAME_SQL = "COALESCE(NULLIF(sellers.display_name, ''), sellers.username, sellers.email)".freeze
    BUYER_NAME_SQL = "COALESCE(NULLIF(buyers.display_name, ''), buyers.username, buyers.email)".freeze
    ITEM_REVENUE_SQL = "COALESCE(product_purchase_items.price, 0) * COALESCE(product_purchase_items.quantity, 0)".freeze

    def initialize(scope: ProductPurchase.all)
      @scope = scope
    end

    def as_json(*)
      {
        summary: summary,
        paid_revenue_by_currency: money_stats(successful_purchases.group(:currency).sum(:total_amount)),
        item_revenue_by_currency: money_stats(successful_items.group(:currency).sum(Arel.sql(ITEM_REVENUE_SQL))),
        refunded_revenue_by_currency: money_stats(refunded_purchases.group(:currency).sum(:total_amount)),
        top_products: top_products,
        top_sellers: top_sellers,
        top_categories: top_categories,
        recent_items: recent_items
      }
    end

    private

    attr_reader :scope

    def summary
      {
        paid_orders: successful_purchases.count,
        items_sold: successful_items.sum(:quantity).to_i,
        products_sold: successful_items.distinct.count(:product_id),
        active_sellers: successful_items.joins(PRODUCTS_JOIN).distinct.count("products.user_id"),
        latest_sale_at: successful_purchases.maximum(:created_at)
      }
    end

    def top_products
      rows = successful_items
        .joins(PRODUCTS_JOIN)
        .joins(SELLERS_JOIN)
        .select(
          "products.id AS product_id",
          "products.title AS product_title",
          "products.category AS category",
          "products.type AS product_type",
          "products.user_id AS seller_id",
          "#{SELLER_NAME_SQL} AS seller_name",
          "sellers.username AS seller_username",
          "product_purchase_items.currency AS currency",
          "SUM(COALESCE(product_purchase_items.quantity, 0)) AS units_sold",
          "SUM(#{ITEM_REVENUE_SQL}) AS revenue"
        )
        .group(
          "products.id",
          "products.title",
          "products.category",
          "products.type",
          "products.user_id",
          "sellers.username",
          "sellers.display_name",
          "sellers.email",
          "product_purchase_items.currency"
        )
        .order(Arel.sql("units_sold DESC, revenue DESC"))
        .limit(TOP_LIMIT)

      product_map = Product.with_deleted.where(id: rows.map(&:product_id)).index_by(&:id)

      rows.map do |row|
        product = product_map[row.product_id]
        {
          id: row.product_id,
          title: row.product_title,
          category: row.category.presence || "Uncategorized",
          product_type: row.product_type.to_s.demodulize.delete_suffix("Product").underscore.humanize.presence || "General",
          currency: normalize_currency(row.currency),
          units_sold: row.units_sold.to_i,
          revenue: row.revenue.to_d,
          seller_name: row.seller_name,
          seller_username: row.seller_username,
          seller_path: row.seller_username.present? ? Rails.application.routes.url_helpers.user_path(row.seller_username) : nil,
          product_path: product_path_for(product),
          archived: product&.deleted? || false
        }
      end
    end

    def top_sellers
      successful_items
        .joins(PRODUCTS_JOIN)
        .joins(SELLERS_JOIN)
        .select(
          "sellers.id AS seller_id",
          "#{SELLER_NAME_SQL} AS seller_name",
          "sellers.username AS seller_username",
          "product_purchase_items.currency AS currency",
          "COUNT(DISTINCT product_purchase_items.product_purchase_id) AS orders_count",
          "COUNT(DISTINCT products.id) AS products_count",
          "SUM(COALESCE(product_purchase_items.quantity, 0)) AS units_sold",
          "SUM(#{ITEM_REVENUE_SQL}) AS revenue"
        )
        .group(
          "sellers.id",
          "sellers.username",
          "sellers.display_name",
          "sellers.email",
          "product_purchase_items.currency"
        )
        .order(Arel.sql("revenue DESC, units_sold DESC"))
        .limit(TOP_LIMIT)
        .map do |row|
          {
            id: row.seller_id,
            name: row.seller_name,
            username: row.seller_username,
            currency: normalize_currency(row.currency),
            orders_count: row.orders_count.to_i,
            products_count: row.products_count.to_i,
            units_sold: row.units_sold.to_i,
            revenue: row.revenue.to_d,
            seller_path: row.seller_username.present? ? Rails.application.routes.url_helpers.user_path(row.seller_username) : nil
          }
        end
    end

    def top_categories
      successful_items
        .joins(PRODUCTS_JOIN)
        .select(
          "products.category AS category",
          "product_purchase_items.currency AS currency",
          "COUNT(DISTINCT product_purchase_items.product_purchase_id) AS orders_count",
          "SUM(COALESCE(product_purchase_items.quantity, 0)) AS units_sold",
          "SUM(#{ITEM_REVENUE_SQL}) AS revenue"
        )
        .group("products.category", "product_purchase_items.currency")
        .order(Arel.sql("units_sold DESC, revenue DESC"))
        .limit(TOP_LIMIT)
        .map do |row|
          {
            category: row.category.presence || "Uncategorized",
            currency: normalize_currency(row.currency),
            orders_count: row.orders_count.to_i,
            units_sold: row.units_sold.to_i,
            revenue: row.revenue.to_d
          }
        end
    end

    def recent_items
      rows = successful_items
        .joins(PRODUCTS_JOIN)
        .joins(SELLERS_JOIN)
        .joins(BUYERS_JOIN)
        .select(
          "product_purchase_items.id AS item_id",
          "product_purchase_items.product_purchase_id AS purchase_id",
          "product_purchase_items.quantity AS quantity",
          "product_purchase_items.price AS unit_price",
          "product_purchase_items.currency AS currency",
          "product_purchases.created_at AS sold_at",
          "product_purchases.status AS purchase_status",
          "product_purchases.shipping_status AS shipping_status",
          "products.id AS product_id",
          "products.title AS product_title",
          "products.category AS category",
          "#{SELLER_NAME_SQL} AS seller_name",
          "sellers.username AS seller_username",
          "#{BUYER_NAME_SQL} AS buyer_name",
          "buyers.username AS buyer_username",
          "buyers.email AS buyer_email",
          "SUM(#{ITEM_REVENUE_SQL}) OVER (PARTITION BY product_purchase_items.id) AS item_revenue"
        )
        .order(Arel.sql("product_purchases.created_at DESC, product_purchase_items.id DESC"))
        .limit(RECENT_LIMIT)

      product_map = Product.with_deleted.where(id: rows.map(&:product_id)).index_by(&:id)

      rows.map do |row|
        product = product_map[row.product_id]
        {
          id: row.item_id,
          purchase_id: row.purchase_id,
          title: row.product_title,
          category: row.category.presence || "Uncategorized",
          quantity: row.quantity.to_i,
          unit_price: row.unit_price.to_d,
          item_revenue: row.item_revenue.to_d,
          currency: normalize_currency(row.currency),
          sold_at: row.sold_at,
          purchase_status: row.purchase_status,
          shipping_status: row.shipping_status,
          seller_name: row.seller_name,
          seller_username: row.seller_username,
          seller_path: row.seller_username.present? ? Rails.application.routes.url_helpers.user_path(row.seller_username) : nil,
          buyer_name: row.buyer_name,
          buyer_username: row.buyer_username,
          buyer_email: row.buyer_email,
          buyer_path: row.buyer_username.present? ? Rails.application.routes.url_helpers.user_path(row.buyer_username) : nil,
          product_path: product_path_for(product),
          archived: product&.deleted? || false
        }
      end
    end

    def successful_purchases
      @successful_purchases ||= scope.where(status: SUCCESSFUL_STATUSES)
    end

    def refunded_purchases
      @refunded_purchases ||= scope.where(status: :refunded)
    end

    def successful_items
      @successful_items ||= ProductPurchaseItem.joins(:product_purchase).merge(successful_purchases)
    end

    def money_stats(stats_hash)
      stats_hash
        .map do |currency, amount|
          {
            currency: normalize_currency(currency),
            amount: amount.to_d
          }
        end
        .sort_by { |entry| -entry[:amount] }
    end

    def normalize_currency(currency)
      currency.present? ? currency.to_s.upcase : "USD"
    end

    def product_path_for(product)
      return nil if product.blank? || product.deleted?

      product.show_path
    rescue StandardError
      nil
    end
  end
end

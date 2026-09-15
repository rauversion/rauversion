class CreateTenantBilling < ActiveRecord::Migration[7.1]
  def change
    create_table :plans do |t|
      t.string :code, null: false
      t.string :name, null: false
      t.text :description
      t.boolean :active, null: false, default: true
      t.integer :position, null: false, default: 0
      t.jsonb :entitlements, null: false, default: {}
      t.timestamps
    end
    add_index :plans, :code, unique: true

    create_table :plan_prices do |t|
      t.references :plan, null: false, foreign_key: true
      t.string :provider, null: false, default: "stripe"
      t.string :provider_price_id
      t.string :currency, null: false, default: "usd"
      t.integer :amount_cents, null: false
      t.string :billing_interval, null: false, default: "month"
      t.boolean :active, null: false, default: true
      t.timestamps
    end
    add_index :plan_prices, :provider_price_id, unique: true, where: "provider_price_id IS NOT NULL"

    create_table :tenant_subscriptions do |t|
      t.references :tenant, null: false, foreign_key: true, index: { unique: true }
      t.references :subscriber, null: false, foreign_key: { to_table: :users }
      t.references :plan, null: false, foreign_key: true
      t.references :plan_price, null: false, foreign_key: true
      t.string :provider, null: false, default: "stripe"
      t.string :provider_customer_id
      t.string :provider_subscription_id
      t.string :provider_checkout_session_id
      t.string :status, null: false, default: "pending"
      t.datetime :trial_ends_at
      t.datetime :current_period_starts_at
      t.datetime :current_period_ends_at
      t.boolean :cancel_at_period_end, null: false, default: false
      t.datetime :canceled_at
      t.datetime :grace_period_ends_at
      t.jsonb :entitlements_snapshot, null: false, default: {}
      t.timestamps
    end
    add_index :tenant_subscriptions, :provider_subscription_id, unique: true, where: "provider_subscription_id IS NOT NULL"
    add_index :tenant_subscriptions, :provider_checkout_session_id, unique: true, where: "provider_checkout_session_id IS NOT NULL"

    create_table :billing_events do |t|
      t.string :provider, null: false
      t.string :provider_event_id, null: false
      t.string :event_type, null: false
      t.jsonb :payload, null: false, default: {}
      t.datetime :processed_at
      t.text :processing_error
      t.timestamps
    end
    add_index :billing_events, [:provider, :provider_event_id], unique: true
  end
end

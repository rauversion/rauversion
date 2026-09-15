namespace :services do
  desc "Backfill legacy service products into the service marketplace schema"
  task migrate_legacy: :environment do
    dry_run = ActiveModel::Type::Boolean.new.cast(ENV["DRY_RUN"])
    counts = Hash.new(0)

    Products::ServiceProduct.find_each do |service|
      inferred_kind = case service.category
      when "classes", "one_on_one_class", "workshop"
        "education"
      when "dj_set", "live_act", "hybrid_live", "vocalist", "host_mc"
        "performance"
      when "mastering", "mixing", "production", "recording", "songwriting", "sound_design", "voice_over"
        "studio_service"
      else
        "advisory"
      end

      updates = {}
      updates[:service_kind] = inferred_kind if service.service_kind != inferred_kind
      updates[:booking_mode] = "instant_checkout" if service.booking_mode.blank?

      if updates.any?
        counts[:products_updated] += 1
        service.update_columns(updates.merge(updated_at: Time.current)) unless dry_run
      end

      next if service.service_price_rules.where(rule_type: "base").exists?

      counts[:price_rules_created] += 1
      next if dry_run

      service.service_price_rules.create!(
        name: "Base price",
        rule_type: "base",
        amount: service.price || 0,
        currency: "usd",
        duration_minutes: service.duration_minutes,
        location_scope: service.delivery_method,
        position: 0,
        conditions: { migrated_from_legacy: true }
      )
    end

    mode = dry_run ? "DRY RUN" : "DONE"
    puts "[#{mode}] products updated: #{counts[:products_updated]}"
    puts "[#{mode}] price rules created: #{counts[:price_rules_created]}"
  end
end

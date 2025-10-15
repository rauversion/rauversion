namespace :venues do
  desc "Import venues from a JSON file. Usage: rake 'venues:import[/absolute/or/relative/path.json]'. Defaults to spec/fixtures/venues.json"
  task :import, [:path] => :environment do |t, args|
    require "json"

    default_path = Rails.root.join("spec", "fixtures", "venues.json").to_s
    path = args[:path].presence || default_path

    unless File.exist?(path)
      puts "File not found: #{path}"
      exit(1)
    end

    puts "Importing venues from: #{path}"

    raw = File.read(path)
    data = JSON.parse(raw) rescue nil
    if !data.is_a?(Array)
      puts "Invalid JSON format. Expecting an array of venue objects."
      exit(1)
    end

    created = 0
    updated = 0
    skipped = 0
    errors  = 0

    data.each_with_index do |row, idx|
      begin
        name    = row["name"]
        city    = row["city"]
        country = row["country"]

        if name.blank?
          skipped += 1
          puts "[#{idx}] Skipped: missing name"
          next
        end

        # Idempotency: try to find by natural key (name + city + country)
        venue = Venue.where(name: name, city: city, country: country).first

        mapped_attrs = {
          name:         name,
          city:         city,
          country:      country,
          rating:       row["rating"],
          review_count: row["review_count"],
          genres:       Array(row["genres"]).compact,
          capacity:     row["capacity"],
          price_range:  row["price_range"],
          description:  row["description"],
          address:      row["address"],
          image_url:    row["image_url"] || row["image"]
          # lat/lng not provided in fixture; if present, include here:
          # lat:          row["lat"],
          # lng:          row["lng"],
        }.compact

        if venue
          venue.assign_attributes(mapped_attrs)
          if venue.changed?
            venue.save!
            updated += 1
            puts "[#{idx}] Updated: #{venue.name}"
          else
            skipped += 1
            puts "[#{idx}] Skipped (no changes): #{venue.name}"
          end
        else
          venue = Venue.new(mapped_attrs)
          venue.save!
          created += 1
          puts "[#{idx}] Created: #{venue.name}"
        end
      rescue => e
        errors += 1
        puts "[#{idx}] Error processing row: #{e.class} - #{e.message}"
      end
    end

    puts "Done. created=#{created}, updated=#{updated}, skipped=#{skipped}, errors=#{errors}, total=#{data.size}"
  end

  desc "Rebuild venue data (delete all venues and import from JSON). Usage: rake 'venues:rebuild[/path.json]'"
  task :rebuild, [:path] => :environment do |t, args|
    path = args[:path].presence || Rails.root.join("spec", "fixtures", "venues.json").to_s
    puts "Deleting all venues..."
    Venue.delete_all
    puts "Importing..."
    Rake::Task["venues:import"].invoke(path)
  end
end

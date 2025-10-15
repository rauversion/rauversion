namespace :venue_rating_stats do
  desc "Backfill venue_rating_stats from existing VenueReview records"
  task backfill: :environment do
    batch_size = ENV.fetch("BATCH", 1000).to_i

    total = VenueReview.count
    puts "Backfilling #{total} reviews into venue_rating_stats (batch_size=#{batch_size})"

    processed = 0
    VenueReview.find_in_batches(batch_size: batch_size) do |batch|
      ActiveRecord::Base.transaction do
        batch.each do |review|
          VenueRatings::Accumulator.apply_create(review)
          processed += 1
        end
      end
      puts "Processed #{processed}/#{total}"
    end

    puts "Backfill complete"
  end

  desc "Rebuild stats from scratch (truncate + backfill)"
  task rebuild: :environment do
    puts "Truncating venue_rating_stats..."
    VenueRatingStat.delete_all
    Rake::Task["venue_rating_stats:backfill"].invoke
  end
end

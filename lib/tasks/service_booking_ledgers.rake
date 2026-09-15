namespace :service_bookings do
  desc "Backfill append-only payment ledger entries for existing service bookings"
  task backfill_ledger: :environment do
    count = 0

    ServiceBooking.find_each do |booking|
      booking.backfill_ledger_entries!
      count += 1
    end

    puts "Backfilled service booking ledgers for #{count} bookings"
  end
end

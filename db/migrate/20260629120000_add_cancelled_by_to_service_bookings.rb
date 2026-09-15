class AddCancelledByToServiceBookings < ActiveRecord::Migration[8.1]
  def change
    add_reference :service_bookings,
      :cancelled_by,
      foreign_key: { to_table: :users },
      index: true
  end
end

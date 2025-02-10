class AddFeedbackToServiceBooking < ActiveRecord::Migration[7.0]
  def change
    add_column :service_bookings, :rating, :integer
    add_column :service_bookings, :feedback, :text
  end
end

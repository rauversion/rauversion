module ServiceBookingsHelper
  def booking_status_class(status)
    case status.to_sym
    when :pending_confirmation
      'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
    when :confirmed
      'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
    when :scheduled
      'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300'
    when :in_progress
      'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300'
    when :completed
      'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
    when :cancelled
      'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
    when :refunded
      'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'
    else
      'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'
    end
  end
end

class MakeUserIdOptionalInEventHosts < ActiveRecord::Migration[7.0]
  def change
    change_column_null :event_hosts, :user_id, true
  end
end

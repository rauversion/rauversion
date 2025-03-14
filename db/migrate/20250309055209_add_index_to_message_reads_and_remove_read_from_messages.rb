class AddIndexToMessageReadsAndRemoveReadFromMessages < ActiveRecord::Migration[8.0]
  def change
    # Add unique index to message_reads
    add_index :message_reads, [:message_id, :participant_id], unique: true
    
    # Make read_at not nullable
    change_column_null :message_reads, :read_at, false
    
    # Remove read column from messages
    remove_column :messages, :read, :boolean
    remove_index :messages, :read if index_exists?(:messages, :read)
  end
end

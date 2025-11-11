class AddPolymorphicToPhotos < ActiveRecord::Migration[8.0]
  def change
    # Add polymorphic columns
    add_column :photos, :photoable_type, :string
    add_column :photos, :photoable_id, :bigint
    
    # Add index for polymorphic association
    add_index :photos, [:photoable_type, :photoable_id]
    
    # Migrate existing data - all existing photos belong to users
    reversible do |dir|
      dir.up do
        execute <<-SQL
          UPDATE photos 
          SET photoable_type = 'User', photoable_id = user_id 
          WHERE user_id IS NOT NULL;
        SQL
      end
    end
    
    # user_id can now be nullable since we have photoable
    change_column_null :photos, :user_id, true
  end
end

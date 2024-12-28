class AddStiToUserLinks < ActiveRecord::Migration[7.0]
  def change
    add_column :user_links, :type, :string
    add_column :user_links, :username, :string
    add_column :user_links, :custom_url, :string
    
    add_index :user_links, :type
    remove_column :user_links, :service_type, :string
  end
end

class AddVectorExtension < ActiveRecord::Migration[8.0]
  def change
    enable_extension "vector"
  end
end

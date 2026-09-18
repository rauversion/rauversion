class AddYoutubeUrlToLessons < ActiveRecord::Migration[8.1]
  def change
    add_column :lessons, :youtube_url, :string
  end
end

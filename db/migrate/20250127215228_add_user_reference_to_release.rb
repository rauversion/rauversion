class AddUserReferenceToRelease < ActiveRecord::Migration[8.0]
  def change
    add_reference :releases, :user, null: true, foreign_key: true
  end
end

class CreateEmailTemplates < ActiveRecord::Migration[8.0]
  def change
    create_table :email_templates do |t|
      t.references :user, null: false, foreign_key: true
      t.string :name, null: false
      t.string :subject, null: false, default: ""
      t.string :preheader
      t.boolean :published, null: false, default: false
      t.jsonb :document, null: false, default: {}

      t.timestamps
    end

    add_index :email_templates, [:user_id, :updated_at]
    add_index :email_templates, :document, using: :gin
  end
end

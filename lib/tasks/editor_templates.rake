namespace :editor_templates do
  desc "Seed global editor templates"
  task seed_globals: :environment do
    created = 0
    updated = 0
    unchanged = 0

    EditorTemplates::Defaults.global_templates.each do |attributes|
      template = EditorTemplate.find_or_initialize_by(
        user_id: nil,
        category: attributes[:category],
        name: attributes[:name]
      )

      template.assign_attributes(attributes)

      if template.new_record?
        template.save!
        created += 1
      elsif template.changed?
        template.save!
        updated += 1
      else
        unchanged += 1
      end
    end

    puts "created=#{created} updated=#{updated} unchanged=#{unchanged}"
  end
end

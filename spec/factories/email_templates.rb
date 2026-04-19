FactoryBot.define do
  factory :email_template do
    association :user
    name { "Monthly Update" }
    subject { "Latest news from Rauversion" }
    preheader { "Highlights, releases and upcoming announcements" }
    published { false }
    document do
      {
        "schemaVersion" => 1,
        "name" => name,
        "subject" => subject,
        "preheader" => preheader,
        "theme" => EmailTemplate::DEFAULT_THEME.deep_dup,
        "blocks" => [],
      }
    end
  end
end

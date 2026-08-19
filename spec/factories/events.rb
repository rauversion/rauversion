FactoryBot.define do
  factory :event do
    tenant { Current.tenant || association(:tenant) }
    association :user
    title { "MyString" }
    description { "MyText" }
    # slug { "MyString" }
    # state { "MyString" }
    timezone { "MyString" }
    event_start { "2023-07-26 16:05:55" }
    event_ends { "2023-07-26 16:05:55" }
    private { false }
    online { false }
    location { "MyString" }
    street { "MyString" }
    street_number { "MyString" }
    lat { 1 }
    lng { 1 }
    venue { "MyString" }
    country { "MyString" }
    city { "MyString" }
    province { "MyString" }
    postal { "MyString" }
    age_requirement { "MyString" }
    event_capacity { false }
    event_capacity_limit { 1 }
    eticket { false }
    will_call { false }
    # order_form { "" }
    # widget_button { "" }
    event_short_link { "MyString" }
    # tax_rates_settings { "" }
    # attendee_list_settings { "" }
    # scheduling_settings { "" }
    # event_settings { "" }
    # tickets { "" }
    # streaming_service { "" }
  end
end

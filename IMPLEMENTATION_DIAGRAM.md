# Press Kit Photos - Implementation Diagram

## Data Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                         USER UPLOADS PHOTO                           │
└─────────────────────────────────────────────────────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────────┐
│  Frontend (AdminPanel.tsx)                                          │
│  ┌───────────────────────────────────────────────────────────────┐ │
│  │ 1. Direct Upload to Active Storage                             │ │
│  │ 2. Receives signed_id from Active Storage                      │ │
│  │ 3. Sends to API:                                               │ │
│  │    {                                                            │ │
│  │      pressPhotos: [{                                           │ │
│  │        title: "Photo",                                         │ │
│  │        signed_id: "abc123...",                                 │ │
│  │        image: ""                                               │ │
│  │      }]                                                         │ │
│  │    }                                                            │ │
│  └───────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────────┐
│  Backend (PressKitsController#update)                               │
│  ┌───────────────────────────────────────────────────────────────┐ │
│  │ 1. Parse data with pressPhotos array                           │ │
│  │ 2. For each photo with signed_id:                              │ │
│  │                                                                 │ │
│  │    blob = ActiveStorage::Blob.find_signed(signed_id)          │ │
│  │                                                                 │ │
│  │    # CREATE POLYMORPHIC ASSOCIATION                            │ │
│  │    photo = @press_kit.photos.create!(user: current_user)      │ │
│  │    # Sets: photoable_type = "PressKit"                         │ │
│  │    #       photoable_id = press_kit.id                         │ │
│  │                                                                 │ │
│  │    # ATTACH IMAGE VIA ACTIVE STORAGE                           │ │
│  │    photo.image.attach(blob)                                    │ │
│  │                                                                 │ │
│  │    # STORE URL IN JSON DATA                                    │ │
│  │    entry["image"] = url_for(photo.image)                       │ │
│  │                                                                 │ │
│  │ 3. Save updated data back to press_kit.data                    │ │
│  └───────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────────┐
│  DATABASE STATE                                                      │
│                                                                      │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ press_kits table                                             │   │
│  │ ┌──────────┬─────────────────────────────────────────────┐ │   │
│  │ │ id: 1    │ data: {                                      │ │   │
│  │ │ user_id: │   pressPhotos: [{                            │ │   │
│  │ │   10     │     title: "Photo",                          │ │   │
│  │ │          │     image: "https://storage.../photo.jpg"    │ │   │
│  │ │          │   }]                                          │ │   │
│  │ │          │ }                                             │ │   │
│  │ └──────────┴─────────────────────────────────────────────┘ │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                      │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ photos table                                                 │   │
│  │ ┌──────┬─────────┬─────────────────┬───────────────────┐   │   │
│  │ │ id   │ user_id │ photoable_type  │ photoable_id      │   │   │
│  │ ├──────┼─────────┼─────────────────┼───────────────────┤   │   │
│  │ │ 123  │   10    │   "PressKit"    │        1          │   │   │
│  │ └──────┴─────────┴─────────────────┴───────────────────┘   │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                      │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ active_storage_attachments table                             │   │
│  │ ┌──────┬─────────────┬───────────┬─────────────────────┐   │   │
│  │ │ id   │ record_type │ record_id │ blob_id             │   │   │
│  │ ├──────┼─────────────┼───────────┼─────────────────────┤   │   │
│  │ │ 456  │  "Photo"    │    123    │       789           │   │   │
│  │ └──────┴─────────────┴───────────┴─────────────────────┘   │   │
│  └─────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────────┐
│  QUERYING PHOTOS                                                     │
│                                                                      │
│  Ruby (Backend):                                                    │
│  ┌───────────────────────────────────────────────────────────────┐ │
│  │ press_kit = PressKit.find(1)                                   │ │
│  │                                                                 │ │
│  │ # Query all photos                                             │ │
│  │ press_kit.photos                                               │ │
│  │ # => [#<Photo id: 123, photoable_type: "PressKit", ...>]     │ │
│  │                                                                 │ │
│  │ # Query with conditions                                        │ │
│  │ press_kit.photos.where("created_at > ?", 1.week.ago)          │ │
│  │                                                                 │ │
│  │ # Count photos                                                 │ │
│  │ press_kit.photos.count  # => 1                                 │ │
│  │                                                                 │ │
│  │ # Access from photo                                            │ │
│  │ photo = Photo.find(123)                                        │ │
│  │ photo.photoable  # => #<PressKit id: 1, ...>                  │ │
│  └───────────────────────────────────────────────────────────────┘ │
│                                                                      │
│  API Response (press_kit_json):                                     │
│  ┌───────────────────────────────────────────────────────────────┐ │
│  │ {                                                               │ │
│  │   "press_kit": {                                               │ │
│  │     "id": 1,                                                    │ │
│  │     "data": {                                                   │ │
│  │       "pressPhotos": [...]  // For display                     │ │
│  │     },                                                          │ │
│  │     "photos": [              // For querying                   │ │
│  │       {                                                         │ │
│  │         "id": 123,                                             │ │
│  │         "url": "https://...",                                  │ │
│  │         "description": "...",                                  │ │
│  │         "tags": []                                             │ │
│  │       }                                                         │ │
│  │     ]                                                           │ │
│  │   }                                                             │ │
│  │ }                                                               │ │
│  └───────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────────┐
│  Frontend (PressKitPage.tsx)                                        │
│  ┌───────────────────────────────────────────────────────────────┐ │
│  │ 1. Loads press kit from API                                    │ │
│  │ 2. Sets pressKitData from data.press_kit.data                  │ │
│  │ 3. Sets photos from data.press_kit.photos  // NEW              │ │
│  │ 4. Displays photos from pressKitData.pressPhotos               │ │
│  │ 5. photos array available for future use                       │ │
│  └───────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
```

## Model Relationships

```
┌──────────────────┐
│      User        │
│  id: 10          │
│  username: "..."  │
└────┬─────────────┘
     │ has_one
     │
     ▼
┌──────────────────┐         has_many (as: :photoable)        ┌──────────────────┐
│    PressKit      │────────────────────────────────────────▶│      Photo       │
│  id: 1           │                                          │  id: 123         │
│  user_id: 10     │                                          │  user_id: 10     │
│  data: {...}     │                                          │  photoable_type: │
└──────────────────┘                                          │    "PressKit"    │
                                                              │  photoable_id: 1 │
                                                              └────┬─────────────┘
                                                                   │ has_one_attached
                                                                   │
                                                                   ▼
                                                              ┌──────────────────┐
                                                              │ Active Storage   │
                                                              │     Blob         │
                                                              │  photo.jpg       │
                                                              └──────────────────┘
```

## Key Points

1. **Polymorphic Association**: Photo can belong to User OR PressKit via `photoable`
2. **Dual Storage**: Photo URL stored in both Photo record AND JSON data
3. **Queryable**: Use `press_kit.photos` to query with ActiveRecord
4. **Fast Display**: Use `press_kit.data["pressPhotos"]` for quick display
5. **Atomic Updates**: Both storage locations updated in transaction

## Benefits

✅ **Organized**: Photos properly associated, not just URLs  
✅ **Queryable**: Full ActiveRecord query capabilities  
✅ **Flexible**: Can add metadata, ordering, filtering  
✅ **Fast**: JSON data provides quick access for display  
✅ **Consistent**: Uses same infrastructure as user photos  
✅ **Scalable**: Easy to extend with new features

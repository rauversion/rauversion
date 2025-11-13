# Press Kit Photos - Polymorphic Association Implementation

## Overview

This document verifies and documents that press kit photos uploaded via Active Storage are correctly associated with press kits through a polymorphic `photoable` relationship, enabling querying of images through the association.

## Implementation Status: ✅ COMPLETE

The polymorphic association between `PressKit` and `Photo` is **fully implemented and functional**.

## Architecture

### Database Schema

The `photos` table includes polymorphic columns:
```ruby
t.string "photoable_type"
t.bigint "photoable_id"
t.index ["photoable_type", "photoable_id"]
```

### Model Associations

**PressKit Model** (`app/models/press_kit.rb`):
```ruby
has_many :photos, as: :photoable, dependent: :destroy
```

**Photo Model** (`app/models/photo.rb`):
```ruby
belongs_to :photoable, polymorphic: true, optional: true
has_one_attached :image
```

### Photo Upload Flow

When a user uploads a photo to their press kit:

1. **Frontend** (AdminPanel.tsx):
   - User selects an image
   - Image is uploaded via Active Storage Direct Upload
   - Frontend receives a `signed_id` from the upload
   - Frontend sends the `signed_id` in the `pressPhotos` array within the press kit data

2. **Backend** (PressKitsController#update, lines 57-88):
   ```ruby
   # For each pressPhoto entry with a signed_id:
   blob = ActiveStorage::Blob.find_signed(signed_id)
   photo = @press_kit.photos.create!(user: current_user)  # Creates polymorphic association
   photo.image.attach(blob)                                # Attaches the uploaded file
   entry["image"] = url_for(photo.image)                   # Stores URL in JSON data
   ```

3. **Association Created**:
   - A `Photo` record is created with:
     - `photoable_type = "PressKit"`
     - `photoable_id = <press_kit.id>`
     - `user_id = <current_user.id>`
   - The uploaded image is attached via Active Storage
   - The photo's URL is stored in the press kit's JSON data field

## Querying Photos

Photos can be queried in multiple ways:

### 1. Through the Polymorphic Association

```ruby
press_kit = PressKit.find(id)
press_kit.photos         # Returns all Photo records associated with this press kit
press_kit.photos.count   # Count of photos
press_kit.photos.where(description: "...")  # Query with conditions
```

### 2. Through the API Response

The `GET /:username/press-kit.json` endpoint returns:

```json
{
  "press_kit": {
    "id": 1,
    "data": {
      "pressPhotos": [
        {
          "title": "Concert Photo",
          "resolution": "1920x1080",
          "image": "https://..."
        }
      ]
    },
    "photos": [
      {
        "id": 123,
        "url": "https://...",
        "description": "Concert Photo",
        "tags": []
      }
    ],
    "playlists": [...]
  }
}
```

The `photos` array contains all Photo records associated with the press kit through the polymorphic association.

### 3. From a Photo Record

```ruby
photo = Photo.find(id)
photo.photoable          # Returns the associated PressKit (or User)
photo.photoable_type     # Returns "PressKit"
photo.photoable_id       # Returns the press kit ID
```

## Test Coverage

Comprehensive tests have been added to verify the functionality:

### Model Tests (`spec/models/press_kit_spec.rb`)
- ✅ Photos can be associated through polymorphic relationship
- ✅ Multiple photos can be associated with one press kit
- ✅ Photos are destroyed when press kit is destroyed
- ✅ Photos can be queried through the association

### Model Tests (`spec/models/photo_spec.rb`)
- ✅ Photo can belong to a PressKit through photoable
- ✅ Photo can be created through press_kit.photos association
- ✅ Photo can have Active Storage attachment
- ✅ Photo validates presence of image on create

### Request Tests (`spec/requests/press_kits_spec.rb`)
- ✅ Photo records are created when uploading via API
- ✅ Photos are associated with PressKit via photoable
- ✅ Photos array is returned in API response
- ✅ All photos are queryable through the association

## Benefits of This Implementation

1. **Queryable**: Photos can be queried using ActiveRecord: `press_kit.photos.where(...)`
2. **Organized**: Photos are properly associated with their press kit, not just URLs in JSON
3. **Flexible**: Photos can have their own metadata (description, tags, etc.)
4. **Scalable**: Easy to add features like photo ordering, captions, metadata, etc.
5. **Consistent**: Uses the same Photo model and Active Storage infrastructure as user photos
6. **Polymorphic**: The Photo model can be associated with multiple types (User, PressKit, potentially others in the future)

## Usage Examples

### Creating Photos Programmatically

```ruby
# Create a press kit
press_kit = user.press_kit || user.create_press_kit!(data: { artistName: "Artist" })

# Add a photo
photo = press_kit.photos.create!(user: user, description: "Press photo 1")
photo.image.attach(io: File.open("path/to/photo.jpg"), filename: "photo.jpg")

# Query photos
press_kit.photos.each do |photo|
  puts "Photo URL: #{Rails.application.routes.url_helpers.url_for(photo.image)}"
end
```

### Via API

```javascript
// Upload a photo via Direct Upload, get the signed_id
const signedId = await uploadPhoto(file);

// Update press kit with the photo
await patch(`/${username}/press-kit.json`, {
  body: JSON.stringify({
    press_kit: {
      data: {
        pressPhotos: [
          {
            title: "Press Photo",
            resolution: "1920x1080",
            image: "",
            signed_id: signedId
          }
        ]
      }
    }
  })
});

// The backend will:
// 1. Create a Photo record associated with the PressKit
// 2. Attach the uploaded image to the Photo
// 3. Store the photo URL in the data.pressPhotos array
// 4. Return the photo in the separate photos array for querying
```

## Conclusion

✅ **The requirement is met**: Photos uploaded to press kits via Active Storage are correctly associated with press kits through the polymorphic `photoable` relationship.

✅ **Photos are queryable**: Through the `press_kit.photos` association and the API's `photos` array.

✅ **Implementation is tested**: Comprehensive tests verify all aspects of the functionality.

No additional changes are required unless specific enhancements are requested.

## Potential Future Enhancements

1. **Frontend Display**: Update the frontend to also display photos from the separate `photos` array (currently only displays from `data.pressPhotos`)
2. **Photo Management**: Add ability to delete, reorder, or edit photo metadata
3. **Bulk Upload**: Support uploading multiple photos at once
4. **Photo Gallery**: Create a dedicated photo gallery view
5. **Image Processing**: Add image resizing, cropping, or filters on the backend
6. **Metadata**: Extend Photo model to store more metadata (photographer, copyright, etc.)

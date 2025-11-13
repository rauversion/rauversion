# Press Kit Feature Implementation

## Overview

This document describes the implementation of the press kit feature for Rauversion, which allows artists to create and manage professional press kits that can be shared with media, promoters, and fans.

## Architecture

### Backend (Rails)

#### Models

**PressKit** (`app/models/press_kit.rb`)
- Belongs to User (has_one relationship)
- Has many Photos (polymorphic association)
- Stores data in a jsonb field for flexible content structure
- Includes helper method to fetch user's public playlists

**Photo** (`app/models/photo.rb`)
- Made polymorphic to support both User and PressKit associations
- Uses Active Storage for image handling

**User** (`app/models/user.rb`)
- Has one PressKit

#### Controllers

**PressKitsController** (`app/controllers/press_kits_controller.rb`)
- `show` - Public endpoint to view press kit data
- `update` - Protected endpoint to update press kit (owner only)
- Automatically includes user's public playlists in response
- Handles JSON string data from frontend

#### Routes

```ruby
get "/:username/press-kit", to: "press_kits#show"
patch "/:username/press-kit", to: "press_kits#update"
```

#### Database Migrations

1. `create_press_kits.rb` - Creates press_kits table with jsonb data field
2. `add_polymorphic_to_photos.rb` - Adds polymorphic support to photos table

### Frontend (React + TypeScript)

#### Components

**PressKitPage** (`app/javascript/components/press_kit/PressKitPage.tsx`)
- Main press kit display page
- Sections: Intro, Biography, Music, Photos, Press & Reviews, Contact
- Loads data from backend API
- Shows admin button for press kit owners
- Displays user's Rauversion playlists automatically
- Shows external music platform links (Spotify, Bandcamp, SoundCloud, etc.)

**AdminPanel** (`app/javascript/components/press_kit/AdminPanel.tsx`)
- Modal-based admin interface for editing press kit content
- Tabs for different content sections:
  - Bio & Info
  - Music (external links)
  - Social Links
  - Press Photos
  - Contact Info
  - Tour Dates
- Real-time form state management

#### Routing

Added to AppRouter.jsx:
```jsx
<Route path="/:username/press-kit" element={<PressKitPage />} />
```

## Data Structure

The press kit data is stored as jsonb with the following structure:

```javascript
{
  artistName: string,
  tagline: string,
  location: string,
  listeners: string,
  bio: {
    intro: string,
    career: string,
    sound: string
  },
  achievements: string[],
  genres: string[],
  socialLinks: [
    {
      name: string,
      handle: string,
      url: string
    }
  ],
  contacts: [
    {
      type: string,
      email: string,
      agent?: string
    }
  ],
  tourDates: [
    {
      date: string,
      venue: string,
      city: string
    }
  ],
  pressPhotos: [
    {
      title: string,
      resolution: string,
      image: string
    }
  ],
  externalMusicLinks: [
    {
      platform: string,  // 'spotify', 'bandcamp', 'soundcloud', etc.
      url: string,
      title: string
    }
  ]
}
```

## Features

### Public View
- Clean, professional layout with smooth animations
- Section navigation with sticky sidebar
- Dark/light theme toggle
- Responsive design for all screen sizes
- PDF download functionality (placeholder for future implementation)

### Admin Features
- Edit all press kit content through modal interface
- Add/remove items dynamically
- Real-time preview
- Form validation
- Auto-save to backend

### Music Integration
- Automatically includes user's public Rauversion playlists
- Support for external music platform links:
  - Spotify
  - Bandcamp
  - SoundCloud
  - Apple Music
  - YouTube
  - Other platforms

### Photos
- Polymorphic association allows press kit-specific photos
- Support for multiple photos with metadata
- Grid layout with hover effects

## Internationalization

Complete translations provided in:
- `config/locales/en.yml` (English)
- `config/locales/es.yml` (Spanish)

Translation keys under `press_kit` namespace include:
- Section titles
- Form labels
- Button text
- Placeholder text
- Error messages

## Testing

### RSpec Tests

**Model Tests** (`spec/models/press_kit_spec.rb`)
- Association tests
- Validation tests
- Default data initialization
- Data storage and retrieval

**Request Specs** (`spec/requests/press_kits_spec.rb`)
- Public access to press kits
- Authentication requirements
- Authorization checks
- Data update functionality

## Usage

### For Artists

1. Navigate to `/:username/press-kit`
2. Click the edit button (pencil icon) if you're the owner
3. Fill in your information across the different tabs
4. Save changes
5. Share the press kit URL with media, promoters, etc.

### API Usage

**Get Press Kit**
```
GET /:username/press-kit
```

**Update Press Kit** (requires authentication)
```
PATCH /:username/press-kit
Content-Type: application/json

{
  "press_kit": {
    "data": "{...json data...}"
  }
}
```

## Future Enhancements

Potential improvements for future iterations:

1. PDF generation implementation
2. Press photo upload via Active Storage
3. Press reviews and quotes section
4. Analytics tracking (views, downloads)
5. Custom domain support
6. Template selection
7. Export to different formats
8. Social media preview cards
9. Integration with press distribution services
10. Automated content suggestions

## Technical Notes

### Design Decisions

1. **jsonb Storage**: Chosen for flexibility in data structure without requiring schema migrations for new fields
2. **Polymorphic Photos**: Allows reuse of existing Photo model infrastructure
3. **Separate Components**: AdminPanel and PressKitPage kept separate for maintainability
4. **React Router**: Integrated with existing routing architecture
5. **Zustand State**: Uses existing state management patterns

### Performance Considerations

- Press kit data cached in component state
- Playlists fetched once on load
- Lazy loading for images
- Optimized animations with CSS transforms

### Security

- Owner-only updates enforced at controller level
- Authentication required for modifications
- Public read access for all press kits
- Input sanitization on backend

## Migration Guide

To set up the press kit feature:

```bash
# Run migrations
rails db:migrate

# Build assets
yarn build

# Start server
rails server
```

## Support

For issues or questions:
- Check existing documentation in code comments
- Review translation files for UI text
- See test specs for expected behavior
- Consult repository custom instructions

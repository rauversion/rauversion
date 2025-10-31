# Copilot Instructions for Rauversion

## Project Overview

Rauversion is an open-source music platform built on Ruby on Rails that empowers artists to share, distribute, and monetize their music directly with fans. It includes features for music publishing, events, articles, marketplace, and service bookings.

## Tech Stack

### Backend
- **Framework**: Ruby on Rails 8.0.1
- **Ruby Version**: 3.3.5
- **Database**: PostgreSQL
- **Background Jobs**: Sidekiq (via Kredis/Redis)
- **API**: RESTful with Jbuilder for JSON responses
- **Authentication**: Devise with multiple providers (Twitter, Discord, Twitch)

### Frontend
- **Framework**: React 18 with TypeScript
- **State Management**: Zustand
- **Component Library**: shadcn/ui (based on Radix UI)
- **Styling**: Tailwind CSS
- **Animation**: Framer Motion
- **Forms**: React Hook Form with Zod validation
- **Routing**: React Router DOM v7
- **Bundler**: esbuild for JavaScript, Tailwind for CSS

### File Processing
- **Audio**: FFMPEG, Lame, audiowaveform
- **Images**: Vips (via Active Storage)

## Development Commands

### Setup
```bash
bundle install          # Install Ruby dependencies
yarn install           # Install JavaScript dependencies
rails db:prepare       # Setup database
```

### Running the App
```bash
./bin/dev              # Start all processes (server, workers, assets with watch)
rails s                # Start server only (no asset compilation)
```

### Building Assets
```bash
yarn build             # Build JavaScript with esbuild
yarn build:css         # Build CSS with Tailwind
```

### Testing
```bash
bundle exec rspec      # Run RSpec tests
rails test             # Run Rails tests
```

## Coding Standards

### Frontend (React/TypeScript)

1. **State Management**: Use Zustand for global state
   ```typescript
   import { create } from 'zustand';
   ```

2. **Components**: Use shadcn/ui components from `@/components/ui`
   ```typescript
   import { Button } from '@/components/ui/button';
   ```

3. **Styling**: Use Tailwind CSS classes, use `cn()` utility for conditional classes
   ```typescript
   import { cn } from '@/lib/utils';
   ```

4. **Forms**: Use React Hook Form with Zod validation
   ```typescript
   import { useForm } from 'react-hook-form';
   import { zodResolver } from '@hookform/resolvers/zod';
   import { z } from 'zod';
   ```

5. **API Requests**: Use `@rails/request.js` (NOT fetch)
   ```typescript
   import { get, post, put, destroy } from '@rails/request.js';
   
   // Note: response.json (not response.json())
   const response = await get('/api/tracks');
   const data = await response.json;
   ```

6. **Routing**: Use React Router DOM hooks
   ```typescript
   import { useParams, useNavigate } from 'react-router-dom';
   ```

7. **Toasts**: Use `use-toast` from `@/hooks/use-toast`
   ```typescript
   import { useToast } from '@/hooks/use-toast';
   ```

8. **Pagination**: Implement with React hooks for loading and pagination

### Backend (Rails)

1. **Controllers**: Keep actions thin, delegate to service objects for complex logic

2. **Models**: Always check the schema and model attributes before building
   ```ruby
   # Check: db/schema.rb or rails dbconsole
   ```

3. **Views**: Use Jbuilder for JSON API responses
   ```ruby
   # app/views/api/tracks/show.json.jbuilder
   json.extract! @track, :id, :title, :duration
   ```

4. **Services**: Extract complex business logic into service objects
   ```ruby
   # app/services/audio_processor_service.rb
   ```

5. **Tests**: Write RSpec tests for models, requests, and services
   ```ruby
   # spec/models/track_spec.rb
   # spec/requests/api/tracks_spec.rb
   ```

## File Organization

### Frontend Structure
```
app/javascript/
  ├── components/      # React components
  │   └── ui/          # shadcn/ui components
  ├── hooks/           # Custom React hooks
  ├── lib/             # Utilities and helpers
  └── stores/          # Zustand stores
```

### Backend Structure
```
app/
  ├── controllers/     # Rails controllers
  ├── models/          # ActiveRecord models
  ├── services/        # Business logic services
  ├── jobs/            # Background jobs
  └── views/           # Jbuilder templates
```

## Best Practices

### General
- Stay focused on the task at hand; don't get sidetracked
- Always check existing schema and models before making database changes
- Ensure proper error handling and validation
- Follow Rails conventions and naming patterns

### Security
- Never commit secrets or credentials
- Use environment variables for configuration
- Validate and sanitize user input
- Use strong parameters in controllers

### Performance
- Use database indexes appropriately
- Leverage Rails caching where appropriate
- Optimize N+1 queries with `includes` or `preload`
- Use background jobs for time-consuming operations

### Audio/Media Processing
- Audio files are processed with FFMPEG for format conversion
- Waveforms are generated using audiowaveform
- Support chunk range loading for efficient bandwidth usage
- Images are processed with Vips via Active Storage

## Key Features to Remember

1. **Multi-upload Support**: Local or AWS (other providers can be implemented)
2. **Stripe Integration**: For selling tracks, albums, and event tickets
3. **Payments**: Stripe Connect for payouts, Transbank for Chile
4. **Event Streaming**: Supports Twitch, Zoom, Whereby, Mux, Stream Yard
5. **Text Editor**: Uses Dante3 for article editing
6. **Ticketing**: QR validation for event tickets
7. **Roles System**: Support for open or closed communities
8. **Attribution**: Creative Commons and rights management

## Common Patterns

### Creating a New Feature
1. Define routes in `config/routes.rb`
2. Create controller with appropriate actions
3. Create model with migrations if needed
4. Add service objects for complex logic
5. Create Jbuilder views for API responses
6. Build React components for UI
7. Add Zustand store if state management is needed
8. Write RSpec and/or Rails tests

### Working with Audio
1. Upload handling through Active Storage
2. Processing via FFMPEG for format conversion
3. Waveform generation with audiowaveform
4. Metadata extraction and storage
5. Player implementation with chunk loading

## Testing Guidelines

- Write tests for all new features
- Use FactoryBot for test data (see `spec/factories/`)
- Mock external services in tests
- Test both happy path and edge cases
- Ensure tests are isolated and repeatable

## Dependencies Management

- Use Bundler for Ruby gems
- Use Yarn for JavaScript packages
- Keep dependencies up to date
- Check for security vulnerabilities regularly

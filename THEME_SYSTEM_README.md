# Theme Download and Activation System

This document describes the theme download and activation system for the Rauversion Dev Editor.

## Overview

The theme system allows users to:
1. Browse available themes (system themes and site-specific themes)
2. Click on a theme to activate it
3. Download theme files from GitHub repositories
4. Track download progress via ActionCable
5. Integrate downloaded files with WebContainer (if available)

## Architecture

### Backend Components

#### Theme Model (`app/models/theme.rb`)
- Stores theme metadata
- Fields:
  - `name`: Theme name
  - `system_theme`: Boolean flag for system-wide themes
  - `site_id`: Optional site ID for site-specific themes
  - `deploy_options`: JSONB field containing GitHub repository information
  - `description`: Theme description

#### ThemesController (`app/controllers/api/v1/themes_controller.rb`)
- `GET /api/v1/themes` - List themes (system_theme or site-specific)
- `GET /api/v1/themes/:id` - Get single theme
- `POST /api/v1/themes/:id/download_tarball` - Initiate theme download

#### ThemeDownloadJob (`app/jobs/theme_download_job.rb`)
- Background job that downloads tarball from GitHub
- Extracts files from the tarball
- Broadcasts progress updates via ActionCable

#### ThemeDownloadChannel (`app/channels/theme_download_channel.rb`)
- ActionCable channel for real-time progress updates
- Streams to `theme_download_{theme_id}_{user_id}`

### Frontend Components

#### DevEditorNew (`app/javascript/components/themes/DevEditorNew.jsx`)
- Main component with tabs: "Quick Start Templates" and "Editor"
- Fetches and displays available themes
- Handles theme activation flow

#### ThemeTemplateCard (`app/javascript/components/themes/ThemeTemplateCard.jsx`)
- Displays individual theme card
- Shows theme name, description, GitHub repo
- "Activate Theme" button

#### ThemeActivationModal (`app/javascript/components/themes/ThemeActivationModal.jsx`)
- Confirmation modal for theme activation
- Shows download progress with progress bar
- Listens to ActionCable for real-time updates
- Displays success/error messages

#### Theme API (`app/javascript/lib/themeApi.js`)
- `fetchThemes(siteId)` - Fetch available themes
- `fetchTheme(themeId)` - Fetch single theme
- `downloadThemeTarball(themeId)` - Initiate download

#### Theme Download Store (`app/javascript/stores/themeDownloadStore.js`)
- Zustand store for managing theme download state
- Tracks: themes list, loading state, download progress, downloaded files

## Usage

### Accessing the Dev Editor

Navigate to `/dev-editor` in your browser. You must be authenticated to access this page.

### Activating a Theme

1. Browse the available themes in the "Quick Start Templates" tab
2. Click "Activate Theme" on your desired theme
3. Confirm in the modal dialog
4. Watch the progress as the theme is downloaded
5. Once complete, the files are available for integration

### Adding New Themes

Themes can be added via the Rails console or database seeds:

\`\`\`ruby
Theme.create!(
  name: 'My Custom Theme',
  system_theme: true,
  description: 'A beautiful custom theme',
  deploy_options: {
    repo: 'username/repo-name',
    ref: 'main',
    env: 'production'
  }
)
\`\`\`

Or add to `db/seeds/themes_seed.rb` and run:

\`\`\`bash
rails db:seed
\`\`\`

## WebContainer Integration

The downloaded theme files are provided to the `onThemeFilesReady` callback in the DevEditorNew component:

\`\`\`jsx
<DevEditorNew 
  siteId={yourSiteId}
  onThemeFilesReady={(files, theme) => {
    // files is an array of { path, content, size }
    // Integrate with your WebContainer here
    console.log('Theme files ready:', files)
  }}
/>
\`\`\`

### Example WebContainer Integration

\`\`\`javascript
import { WebContainer } from '@webcontainer/api';

// Initialize WebContainer
const webcontainer = await WebContainer.boot();

// When theme files are ready
function handleThemeFilesReady(files, theme) {
  files.forEach(async (file) => {
    // Write each file to the WebContainer
    await webcontainer.fs.writeFile(file.path, file.content);
  });
  
  console.log(\`Added \${files.length} files to WebContainer\`);
}

// Use in DevEditorNew
<DevEditorNew 
  siteId={yourSiteId}
  onThemeFilesReady={handleThemeFilesReady}
/>
\`\`\`

## ActionCable Progress Updates

The system broadcasts the following status updates during download:

- `started` - Download initiated (progress: 0%)
- `downloading` - Downloading from GitHub (progress: 20%)
- `extracting` - Extracting tarball (progress: 50%)
- `processing` - Processing files (progress: 70%)
- `completed` - Download complete (progress: 100%)
- `error` - Download failed

Each update includes:
- `status`: Current status
- `message`: Human-readable message
- `progress`: Progress percentage (0-100)
- `files`: Array of files (only on completed status)

## Database Schema

\`\`\`ruby
create_table :themes do |t|
  t.string :name, null: false
  t.boolean :system_theme, default: false, null: false
  t.integer :site_id
  t.jsonb :deploy_options, default: {}
  t.text :description
  t.timestamps
end

add_index :themes, :system_theme
add_index :themes, :site_id
\`\`\`

## API Endpoints

### List Themes
\`\`\`
GET /api/v1/themes?site_id=123
\`\`\`

Returns all system themes and themes for the specified site.

### Get Single Theme
\`\`\`
GET /api/v1/themes/:id
\`\`\`

### Download Theme Tarball
\`\`\`
POST /api/v1/themes/:id/download_tarball
\`\`\`

Initiates async download. Subscribe to ActionCable for progress.

## Security Considerations

1. The controller checks authentication with `current_user`
2. Only authenticated users can download themes
3. ActionCable channels are user-specific
4. GitHub API is accessed with proper User-Agent header
5. Tarball extraction is sandboxed within the job

## Future Enhancements

- Theme preview screenshots
- Theme categories/tags
- User-uploaded themes
- Theme versioning
- Direct WebContainer integration in the modal
- Theme customization options before activation

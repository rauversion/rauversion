# Theme Download Feature - UI Component Structure

## Visual Hierarchy

```
/dev-editor (Authenticated Route)
│
└── DevEditorNew Component
    │
    ├── Header
    │   ├── Title: "Dev Editor"
    │   └── Description: "Build and customize your site..."
    │
    └── Tabs Component
        │
        ├── Tab 1: "Quick Start Templates" (Active by default)
        │   │
        │   └── Card: "Quick Start Templates"
        │       │
        │       ├── Header
        │       │   ├── Title: "Quick Start Templates"
        │       │   └── Description: "Choose from our collection..."
        │       │
        │       └── Content
        │           │
        │           └── Grid (3 columns on large screens)
        │               │
        │               ├── ThemeTemplateCard (System Theme 1)
        │               │   ├── Card Header
        │               │   │   ├── Title: "Theme Name"
        │               │   │   ├── Description: "Theme description"
        │               │   │   └── Badge: "System" (if system_theme)
        │               │   │
        │               │   └── Card Content
        │               │       ├── GitHub Icon + Repo Name
        │               │       └── Button: "Activate Theme"
        │               │
        │               ├── ThemeTemplateCard (System Theme 2)
        │               │   └── [Same structure as above]
        │               │
        │               └── ThemeTemplateCard (Site Theme)
        │                   └── [Same structure, no "System" badge]
        │
        └── Tab 2: "Editor"
            │
            └── Card: "Visual Editor"
                ├── Header: "Visual Editor"
                └── Content: "Editor interface will be displayed here"

```

## Component Details

### DevEditorNew
- **Purpose**: Main container for the dev editor
- **Props**: 
  - `siteId` (optional): Filter themes by site
  - `onThemeFilesReady`: Callback when files are downloaded
- **State**: themes list, loading, selected theme, modal visibility
- **Styling**: Container with padding, space-y-8

### ThemeTemplateCard
- **Purpose**: Display individual theme information
- **Props**: 
  - `theme`: Theme object with name, description, deploy_options
  - `onActivate`: Callback when "Activate Theme" is clicked
- **Features**:
  - Hover effect (shadow increase)
  - System badge for system themes
  - GitHub repo display with icon
  - Activation button
- **Styling**: shadcn/ui Card component with hover effects

### ThemeActivationModal
- **Purpose**: Handle theme activation with progress tracking
- **Props**:
  - `theme`: Selected theme object
  - `open`: Modal visibility state
  - `onOpenChange`: Callback to change modal state
  - `onFilesReady`: Callback when files are ready
- **States**:
  - Initial: Confirmation message with Cancel/Activate buttons
  - Downloading: Progress bar with status message and percentage
  - Completed: Success message with file count
  - Error: Error message with Try Again button
- **Features**:
  - Real-time progress via ActionCable
  - Prevents closing during download
  - Spinner animation during processing
  - Success/error alerts with icons
- **Styling**: shadcn/ui Dialog with custom content

## Color Scheme (shadcn/ui defaults)
- **Primary**: Theme accent color for buttons
- **Secondary**: Muted color for badges
- **Destructive**: Red for error messages
- **Muted**: Gray for secondary text
- **Success**: Green for success alerts

## Icons Used (lucide-react)
- `Download`: Activate Theme button
- `Github`: GitHub repository indicator
- `Loader2`: Loading spinner (animate-spin)
- `CheckCircle2`: Success indicator
- `AlertCircle`: Error indicator

## Responsive Design
- **Mobile (< 768px)**: Single column grid
- **Tablet (768px - 1024px)**: 2 column grid
- **Desktop (> 1024px)**: 3 column grid

## User Interactions

### 1. Browse Themes
- User navigates to `/dev-editor`
- Sees grid of theme cards
- Can hover over cards for visual feedback

### 2. Activate Theme
- User clicks "Activate Theme" button
- Modal opens with confirmation
- User confirms or cancels

### 3. Download Progress
- Progress bar shows: 0% → 20% → 50% → 70% → 100%
- Status messages change:
  - "Starting theme download..."
  - "Downloading from {repo}..."
  - "Extracting files..."
  - "Processing files..."
  - "Theme downloaded successfully!"
- User cannot close modal during download

### 4. Completion
- Success message shows file count
- "Close" button available
- Files passed to parent component via callback

### 5. Error Handling
- Error alert shown with message
- "Try Again" and "Cancel" buttons available

## Accessibility
- All buttons have proper labels
- Modal has proper ARIA attributes (via Radix UI)
- Loading states announced
- Keyboard navigation supported
- Focus management in modal

## Example Screenshots Structure

When taking screenshots, capture:
1. `/dev-editor` page with theme grid
2. Theme card hover state
3. Activation modal - initial state
4. Activation modal - downloading with progress
5. Activation modal - success state
6. Activation modal - error state (if testing)

## Integration Points

### Parent Component Integration
```jsx
<DevEditorNew 
  siteId={123} // Optional
  onThemeFilesReady={(files, theme) => {
    // Handle files here
    // Integrate with WebContainer
  }}
/>
```

### WebContainer Integration
```jsx
import { mountThemeFiles } from '@/lib/webContainerHelper'

const handleThemeFilesReady = async (files, theme) => {
  await mountThemeFiles(webcontainer, files)
  console.log('Theme activated:', theme.name)
}
```

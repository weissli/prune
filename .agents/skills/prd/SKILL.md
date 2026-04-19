---
name: Prune PRD
description: Product Requirements Document describing the features, user flows, and technical architecture of the Prune application.
---

# Product Requirements Document (PRD): Prune

## 1. Product Overview
**Prune** is an AI-powered personal gardening assistant designed to help users manage their plant care and pruning schedules. By leveraging Google's Gemini AI, the application automatically generates tailored pruning instructions, optimal schedules, and photorealistic botanical images based simply on a plant's name.

## 2. Target Audience
*   Home gardeners and houseplant enthusiasts.
*   Users looking for a low-friction way to track when and how to prune their plants.
*   Individuals who prefer privacy-first, local-storage applications without the need for complex account creations.

## 3. Key Features

### 3.1. AI-Powered Plant Generation
*   **Smart Auto-Fill**: Users input a plant name, and the app uses the Gemini API to fetch detailed care instructions and determine the best months for pruning.
*   **Image Generation**: Generates a photorealistic image of the plant (focusing on leaf and plant shape) using Imagen-4 (with a fallback to Gemini 2.5 Flash Image, and a final fallback to Unsplash).
*   **Error Handling**: Gracefully handles API errors, quota limits, and provides clear feedback to the user if generation fails.

### 3.2. Dynamic Pruning Dashboard
*   **Seasonal Roadmap**: Plants are grouped chronologically by their required pruning months, providing a clear seasonal schedule.
*   **Grouped Pruning Tasks**: Supports discrete pruning descriptions (e.g., "Winter Hard Prune" vs "Summer Deadheading"). 
    *   **Once vs Recurring**: Combines multiple "Once" operations sharing identical ranges beautifully within Dashboard headers.
*   **Task Management**: Users can mark pruning tasks as "completed" for the current year. Completed tasks are visually dimmed and crossed out.
*   **Visual Cues**: The current month is highlighted to draw immediate attention to urgent tasks.

### 3.3. Plant Details & Management
*   **Detail View**: Displays the generated plant image, location, care instructions layout, and an **interactive month-by-month checklist template grid** displaying exact state values for bundled tasks toggling accurately.
*   **Deletion**: Users can easily remove plants from their garden, which automatically cleans up associated tasks.

### 3.4. Privacy-First Local Storage
*   **Compressed Local Storage**: All user data (plants, tasks, settings) is stored entirely in the browser's `localStorage`.
*   **LZ-String Compression**: To accommodate base64 AI-generated images and bypass standard 5MB storage limits, the app aggressively compresses images (max 300px width, 0.5 quality) and uses `lz-string` to compress the entire state object before saving.
*   **Import/Export**: Users can export their entire garden data as a JSON file for backup and import it across different devices or browsers.

### 3.5. Settings & Onboarding
*   **Welcome Screen**: Guides new users to input their Google Gemini API key. Redirects automatically if a key is already present.
*   **Manual Mode**: Allows users to skip the API key step and manually input plant details if they prefer not to use AI features.
*   **Settings Page**: Allows users to update their API key and manage their data (Import/Export). Includes smart **Legacy Data Migration** triggers incorporating image fallback retry buffers to upgrade older flat structures dynamically.

## 4. User Flows

### 4.1. Onboarding Flow
1. User opens the app for the first time.
2. Presented with the Welcome screen.
3. User enters a Gemini API key (or opts to skip for manual mode).
4. App validates and securely stores the key in `localStorage`.
5. User is redirected to the empty Dashboard.

### 4.2. Add Plant Flow
1. User clicks the "+" (Add) button from the Dashboard.
2. User enters the "Plant Name" and optional "Location".
3. User clicks the "Sparkles" (Generate) button.
4. App displays a loading state while fetching data from Gemini.
5. Form auto-populates with an image, selected pruning months, and care instructions.
6. User reviews the data, makes manual adjustments if necessary, and clicks "Save Plant".
7. App compresses the data, saves it to local storage, and returns to the Dashboard.

## 5. Technical Architecture

*   **Frontend Framework**: React 19, Vite.
*   **Routing**: React Router (`HashRouter` for static hosting compatibility).
*   **Styling**: Tailwind CSS v4, `lucide-react` for iconography.
*   **State Management**: Custom React hook (`useStore`) interacting with a robust `storage` service.
*   **AI Integration**: `@google/genai` SDK.
    *   *Text/Instructions*: `gemini-3-flash-preview`
    *   *Images*: `imagen-4.0-generate-001` (Primary) -> `gemini-2.5-flash-image` (Fallback)
*   **Data Persistence**: Browser `localStorage` with `lz-string` UTF-16 compression.
*   **Markdown Rendering**: `react-markdown`.

## 6. Future Enhancements (Potential)
*   **Push Notifications**: Browser-based notifications to remind users when a new month starts and plants need pruning.
*   **Cloud Sync**: Optional Firebase integration for cross-device syncing.
*   **Expanded Plant Data**: Tracking watering schedules, fertilizing, and repotting alongside pruning.

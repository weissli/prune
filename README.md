# Prune

Prune is a Progressive Web App (PWA) designed to help you care for your plants, featuring a Gemini-powered assistant.

## Screenshots

| Main Screen | Detail View |
| :---: | :---: |
| <img src="main_screen.jpg" width="300" alt="Main Screen" /> | <img src="add-plant.jpg" width="300" alt="Detail View" /> |

*Note: Please add your screenshots to the `assets/` directory and update the paths above.*

## Getting Started

### Prerequisites
- Node.js (v18+ recommended)

### Installation

1. Clone the repository (if you haven't already):
   ```bash
   git clone https://github.com/weissli/prune.git
   cd prune
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

### Running Locally

1. Start the development server:
   ```bash
   npm run dev
   ```
   The app will be available at `http://localhost:3000` (or the port specified in output).

### Deployment

To deploy the application to the configured FTP server:

1. Ensure `.env.deploy` is configured with your FTP credentials.
2. Run the release script:
   ```bash
   ./release.sh <feature_update_name>
   ```
   This will create a backup of the `src` directory and deploy the built assets to the server.

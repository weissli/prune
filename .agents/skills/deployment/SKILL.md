---
name: Deployment & Build
description: Guides on generating deployable production files and static assets.
---

# Deployment & Build Guide

This guide describes how to generate production-ready deployable files for the Prune application.

## 🛠️ Build Process

To generate the production bundle, follow these steps:

1.  **Install Dependencies**:
    Ensure all packages are restored correctly.
    ```bash
    npm install
    ```

2.  **Run Build Script**:
    Execute the Vite bundler to compile and minify assets.
    ```bash
    npm run build
    ```

---

## 📁 Output Structure

The build output will be placed in the **`dist/`** directory at the project root. This folder contains all necessary files for static hosting:

*   **`dist/index.html`**: The main entry point.
*   **`dist/assets/`**: Contains compiled, hashed JavaScript and CSS bundles.
*   **`dist/vite.svg`** (or other static assets): Copied over to root.

---

## 🧪 Local Preview

Before deploying to a live server, it is highly recommended to test the production build locally to ensure code splits and absolute paths resolve correctly.

Run the preview server:
```bash
npm run preview
```
*Default access is usually `http://localhost:4173`.*

---

## 🌐 Deployment Targets

Since Prune is a standard Single Page Application (SPA), the contents of the `dist/` directory can be hosted on any static site hosting provider:

*   **GitHub Pages**: Great for hosting free static assets.
*   **Vercel / Netlify**: Automated CI/CD deployments connected to git pushes.
*   **Firebase Hosting**: Fast global CDN deployments.

> [!IMPORTANT]
> Ensure your hosting provider is configured to **redirect all 404 traffic to `index.html`** so the client-side React router can resolve dynamic page addresses accurately.

---

## 🚀 Automated Release Workflow

To streamline backups and deployment, use the `release.sh` script located in the project root. This script chains together backup creation and server syncing:

1.  **Usage**:
    ```bash
    ./release.sh <feature_update_name>
    ```
2.  **What it does**:
    *   **Backup**: Copies the current `src/` directory into a timestamped folder: `backups/src_YYYYMMDD_HHMMSS_<feature_update_name>/`.
    *   **Deploy**: Runs `./deploy.sh` automatically to build the assets and sync via FTP to the production server.

Ensure `.env.deploy` is configured correctly with your hosting credentials before running the wrapper.


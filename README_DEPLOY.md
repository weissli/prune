# How to Build and Deploy Prune

To deploy this application to your web server (e.g., for your iPhone), you need to "build" it first. This process converts the source code into a set of static files (HTML, CSS, JS) that browsers can run.

## 1. Prerequisites
You need **Node.js** installed on your computer.
- Download it here: [https://nodejs.org/](https://nodejs.org/) (Download the "LTS" version).
- Follow the installer instructions.

## 2. Open a Terminal
**Windows:**
1. Open the folder where you unzipped the project.
2. Right-click in an empty space and select "Open in Terminal" (or hold Shift + Right-click and select "Open PowerShell window here").

**Mac:**
1. Open the "Terminal" app.
2. Type `cd ` (with a space) and drag the unzipped folder into the terminal window. Press Enter.

## 3. Install Dependencies
In the terminal, type this command and press Enter:

```bash
npm install
```

*This downloads all the necessary libraries (like React, Tailwind, etc.) into a `node_modules` folder. It might take a minute.*

## 4. Build the App
Once the installation finishes, type this command and press Enter:

```bash
npm run build
```

*This creates a new folder named `dist` in your project directory. This folder contains the optimized, production-ready version of your app.*

## 5. Deploy
1. Open the new `dist` folder.
2. Select **all** the files inside it (`index.html`, `assets` folder, etc.).
3. Upload **only these files** to your web server (e.g., to the `/pwa/prune/` folder on your site).
4. Visit `https://www.everyeye.org.uk/pwa/prune/index.html`.

## Troubleshooting
- If you see a blank white screen, check the "Console" in your browser's Developer Tools (F12) for errors.
- Ensure you uploaded the *contents* of the `dist` folder, not the `dist` folder itself (unless you want the URL to be `.../prune/dist/index.html`).

<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/6b459b67-73b5-4084-9203-4077aa0e3fb0

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## Deploy with GitHub Actions

This repository includes a GitHub Actions workflow that publishes the Vite build to GitHub Pages on pushes to `main`.

1. In the repository settings, enable **GitHub Pages** and set the source to **GitHub Actions**.
2. Push to `main` or run the **Deploy to GitHub Pages** workflow manually.

Notes:
- The published GitHub Pages site is a static preview, so **AI 分析** and **URLから取得** are disabled there.
- Do not expose `GEMINI_API_KEY` in a static GitHub Pages build. For full functionality, run the app locally with `npm run dev` or deploy it to a Node.js-capable host.

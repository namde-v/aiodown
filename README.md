# AioDown 🌌 — Ultimate Social Media Media Downloader

**AioDown** (All-in-One Downloader) is a premium, high-performance, client-side web application designed to download video, audio, and image carousels from almost any social media platform. 

It runs **100% in your browser** and relies entirely on free, open-source community instances of the **Cobalt API**. No backend code or server-side downloads are required.

---

## ✨ Features

- **Rich Aesthetics**: A stunning dark space theme with glowing elements, glassmorphic cards, smooth micro-interactions, and custom animations.
- **Brand Auto-Detection**: Dynamic URL input that identifies the source platform (YouTube, TikTok, Instagram, Twitter/X, Reddit, Facebook, SoundCloud) as you paste or type, changing border colors and branding logos on the fly.
- **Dynamic Preview Players**: Built-in HTML5 video and audio players that let you play or preview your downloaded media directly on the page before saving.
- **Instagram / TikTok Gallery Pickers**: Support for multi-photo/video carousel posts. Renders a beautiful visual grid of all media cards with individual download options and a sequential **Download All** button.
- **Smart Connection Diagnostics**: Connection status indicator (Online, Offline, Checking) displaying live latency (ping) and version numbers of the connected API node.
- **Auto-Detect Fastest Instance**: One-click scanner that fetches live community APIs from `cobalt.directory` and pings them to auto-fill the fastest, most reliable node.
- **CORS Fallback Downloader**: Fully handles browser security policies. Attempts direct local file generation (via JavaScript Blobs) and automatically falls back to an external helper download page if CORS is restricted.

---

## 🚀 Quick Start

### Option A: Direct Open (Zero Setup)
Simply double-click the [index.html](file:///C:/Users/Nam/Desktop/aiodown/index.html) file inside your file manager. It will load instantly in any modern web browser!

### Option B: Local Web Server (Recommended)
Running through an HTTP server ensures correct local origin handling.
1. Make sure you have [Node.js](https://nodejs.org) installed.
2. Open a terminal in this folder and run:
   ```bash
   npx http-server . -p 3000 -o
   ```
3. This downloads and runs a local server, opening your browser directly to `http://localhost:3000`.

---

## 🛠️ Configuration & Settings

Since public Cobalt instances (like `api.cobalt.tools`) often enforce rate limits, the app includes a **Settings Panel** (gear icon) where you can fully customize the download pipeline:

- **Instance URL**: Switch between community-run servers or connect your own private node.
- **Quality**: Set preferred default resolutions (Max, 1080p, 720p, 480p, etc.).
- **Audio Format**: Extract sound into MP3, WAV, Opus, or Ogg formats.
- **File Naming Styles**: Basic (Title only), Pretty (Title - Author), Classic (ID), or Nerdy.
- **Advanced Flags**: Toggles to allow H.265/HEVC, convert Twitter animations to GIF, fetch TikTok original full-length audios, and disable/enable metadata headers.

---

## 🐳 Running Your Own Downloader Node (Self-Hosting)

To bypass public rate limits completely, you can easily self-host a private Cobalt instance on your local machine using Docker:

1. Create a `docker-compose.yml` file:
   ```yaml
   services:
     cobalt-api:
       image: ghcr.io/imputnet/cobalt:latest
       restart: always
       ports:
         - 9000:9000
       environment:
         # Set this to your local IP or domain name
         API_URL: "http://localhost:9000/"
         # Allow requests from your browser
         API_CORS: "http://localhost:3000,http://127.0.0.1:3000,null"
   ```
2. Start the container:
   ```bash
   docker compose up -d
   ```
3. Open AioDown's settings, change the **Cobalt Instance URL** to `http://localhost:9000`, and click **Test Connection**!

---

## 📜 Credits & License

- Core downloader API provided by the awesome open-source [imputnet/cobalt](https://github.com/imputnet/cobalt) project.
- Active instance tracking provided by the community directory at [cobalt.directory](https://cobalt.directory).
- UI code is licensed under the MIT License. Feel free to customize and share!

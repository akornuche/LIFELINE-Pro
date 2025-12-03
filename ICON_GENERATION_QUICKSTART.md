# 🚀 Quick Start: Generate PWA Icons

## Prerequisites

Install ImageMagick:

### Windows
```powershell
# Using Chocolatey
choco install imagemagick

# Or download from: https://imagemagick.org/script/download.php
```

### macOS
```bash
brew install imagemagick
```

### Linux
```bash
sudo apt-get install imagemagick  # Ubuntu/Debian
sudo yum install imagemagick      # CentOS/RHEL
```

---

## Option 1: Using the PowerShell Script

```powershell
# From project root
cd "c:\Git\LIFELINE Pro"

# Generate all icons from logo.svg
.\scripts\generate-pwa-icons.ps1 -SourceLogo "frontend\public\logo.svg"

# With custom background and padding
.\scripts\generate-pwa-icons.ps1 `
  -SourceLogo "frontend\public\logo.svg" `
  -BackgroundColor "#10b981" `
  -Padding 10
```

---

## Option 2: Using Online Tool (No Installation)

1. **Visit**: https://tools.crawlink.com/tools/pwa-icon-generator/
2. **Upload**: `frontend/public/logo.svg`
3. **Generate**: Click "Generate Icons"
4. **Download**: Get the ZIP file
5. **Extract**: Copy all icons to `frontend/public/icons/`

---

## Option 3: Using PWA Asset Generator (NPM)

```powershell
# Install globally
npm install -g pwa-asset-generator

# Generate all icons and splash screens
pwa-asset-generator `
  frontend/public/logo.svg `
  frontend/public/icons `
  --icon-only `
  --favicon `
  --maskable `
  --padding "10%" `
  --background "#10b981"

# Generate splash screens separately
pwa-asset-generator `
  frontend/public/logo.svg `
  frontend/public/splash `
  --splash-only `
  --padding "20%" `
  --background "#10b981"
```

---

## Verify Generated Icons

After generation, you should have:

```
frontend/public/
├── favicon.ico
├── logo.svg ✓
├── icons/
│   ├── icon-57x57.png
│   ├── icon-60x60.png
│   ├── icon-72x72.png
│   ├── icon-76x76.png
│   ├── icon-96x96.png
│   ├── icon-114x114.png
│   ├── icon-120x120.png
│   ├── icon-128x128.png
│   ├── icon-144x144.png
│   ├── icon-152x152.png
│   ├── icon-192x192.png
│   ├── icon-384x384.png
│   ├── icon-512x512.png
│   ├── icon-maskable-192x192.png
│   ├── icon-maskable-512x512.png
│   ├── apple-touch-icon.png
│   ├── favicon-16x16.png
│   ├── favicon-32x32.png
│   ├── ms-icon-70x70.png
│   ├── ms-icon-144x144.png
│   ├── ms-icon-150x150.png
│   ├── ms-icon-310x310.png
│   ├── shortcut-doctor.png
│   ├── shortcut-history.png
│   └── shortcut-consultation.png
└── splash/ (optional)
    ├── apple-splash-2048-2732.png
    ├── apple-splash-1668-2388.png
    ├── apple-splash-1536-2048.png
    ├── apple-splash-1242-2688.png
    ├── apple-splash-1125-2436.png
    ├── apple-splash-828-1792.png
    ├── apple-splash-750-1334.png
    └── apple-splash-640-1136.png
```

---

## Test Your PWA

```powershell
cd frontend

# Build production version
npm run build

# Preview (with service worker)
npm run preview

# Open http://localhost:4173 in Chrome
# Check DevTools → Application → Manifest
```

---

## Next Steps

See **docs/PWA_SETUP_GUIDE.md** for:
- Deploying to HTTPS
- Testing on Android
- Publishing to Play Store
- Troubleshooting

---

**Note**: A basic logo.svg has been created. Replace it with your actual LifeLine Pro logo for better branding!

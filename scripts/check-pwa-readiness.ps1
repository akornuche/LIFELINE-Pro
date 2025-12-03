# PWA Readiness Checker for LifeLine Pro
# Verifies all PWA requirements are met

Write-Host ""
Write-Host "🔍 LifeLine Pro - PWA Readiness Check" -ForegroundColor Cyan
Write-Host "=" * 50 -ForegroundColor Cyan
Write-Host ""

$allGood = $true
$warnings = @()
$errorsList = @()

# Check 1: Required Files
Write-Host "📁 Checking required files..." -ForegroundColor Yellow

$requiredFiles = @(
    "frontend/public/manifest.webmanifest",
    "frontend/public/browserconfig.xml",
    "frontend/public/robots.txt",
    "frontend/public/offline.html",
    "frontend/public/logo.svg",
    "frontend/src/components/PwaInstallPrompt.vue",
    "frontend/src/composables/usePwa.js"
)

foreach ($file in $requiredFiles) {
    if (Test-Path $file) {
        Write-Host "   ✓ $file" -ForegroundColor Green
    } else {
        Write-Host "   ✗ $file - MISSING!" -ForegroundColor Red
        $errorsList += "Missing file: $file"
        $allGood = $false
    }
}

Write-Host ""

# Check 2: Icon Files
Write-Host "🎨 Checking icon files..." -ForegroundColor Yellow

$iconDir = "frontend/public/icons"
$requiredIcons = @(
    "icon-72x72.png",
    "icon-96x96.png",
    "icon-128x128.png",
    "icon-144x144.png",
    "icon-152x152.png",
    "icon-192x192.png",
    "icon-384x384.png",
    "icon-512x512.png",
    "icon-maskable-192x192.png",
    "icon-maskable-512x512.png",
    "apple-touch-icon.png",
    "favicon-16x16.png",
    "favicon-32x32.png"
)

$missingIcons = @()
$foundIcons = 0

if (Test-Path $iconDir) {
    foreach ($icon in $requiredIcons) {
        $iconPath = Join-Path $iconDir $icon
        if (Test-Path $iconPath) {
            $foundIcons++
        } else {
            $missingIcons += $icon
        }
    }
    
    if ($missingIcons.Count -eq 0) {
        Write-Host "   ✓ All $foundIcons icons present" -ForegroundColor Green
    } else {
        Write-Host "   ⚠ Missing $($missingIcons.Count)/$($requiredIcons.Count) icons" -ForegroundColor Yellow
        Write-Host "   Missing: $($missingIcons -join ', ')" -ForegroundColor Gray
        $warnings += "Icons not generated yet. Run: .\scripts\generate-pwa-icons.ps1"
    }
} else {
    Write-Host "   ✗ Icons directory not found" -ForegroundColor Red
    $warnings += "Icons directory missing. Create it and generate icons."
}

Write-Host ""

# Check 3: Favicon
Write-Host "🔖 Checking favicon..." -ForegroundColor Yellow

if (Test-Path "frontend/public/favicon.ico") {
    Write-Host "   ✓ favicon.ico present" -ForegroundColor Green
} else {
    Write-Host "   ⚠ favicon.ico missing" -ForegroundColor Yellow
    $warnings += "favicon.ico missing. Generate with icons."
}

Write-Host ""

# Check 4: Package.json dependencies
Write-Host "📦 Checking dependencies..." -ForegroundColor Yellow

if (Test-Path "frontend/package.json") {
    $packageJson = Get-Content "frontend/package.json" | ConvertFrom-Json
    
    $requiredDeps = @(
        "vite-plugin-pwa",
        "workbox-window"
    )
    
    foreach ($dep in $requiredDeps) {
        if ($packageJson.devDependencies.$dep) {
            Write-Host "   ✓ $dep ($($packageJson.devDependencies.$dep))" -ForegroundColor Green
        } else {
            Write-Host "   ✗ $dep missing" -ForegroundColor Red
            $errorsList += "Missing dependency: $dep"
            $allGood = $false
        }
    }
} else {
    Write-Host "   ✗ package.json not found" -ForegroundColor Red
    $errorsList += "package.json not found"
    $allGood = $false
}

Write-Host ""

# Check 5: Vite config
Write-Host "⚙️  Checking Vite configuration..." -ForegroundColor Yellow

if (Test-Path "frontend/vite.config.js") {
    $viteConfig = Get-Content "frontend/vite.config.js" -Raw
    
    if ($viteConfig -match "VitePWA") {
        Write-Host "   ✓ VitePWA plugin configured" -ForegroundColor Green
    } else {
        Write-Host "   ✗ VitePWA plugin not found in config" -ForegroundColor Red
        $errorsList += "VitePWA plugin not configured"
        $allGood = $false
    }
    
    if ($viteConfig -match "registerType") {
        Write-Host "   ✓ Service worker registration configured" -ForegroundColor Green
    } else {
        Write-Host "   ⚠ Service worker registration may need configuration" -ForegroundColor Yellow
    }
} else {
    Write-Host "   ✗ vite.config.js not found" -ForegroundColor Red
    $errorsList += "vite.config.js not found"
    $allGood = $false
}

Write-Host ""

# Check 6: Main.js integration
Write-Host "🚀 Checking main.js integration..." -ForegroundColor Yellow

if (Test-Path "frontend/src/main.js") {
    $mainJs = Get-Content "frontend/src/main.js" -Raw
    
    if ($mainJs -match "virtual:pwa-register") {
        Write-Host "   ✓ PWA registration in main.js" -ForegroundColor Green
    } else {
        Write-Host "   ⚠ PWA registration may need to be added to main.js" -ForegroundColor Yellow
        $warnings += "Check PWA registration in main.js"
    }
} else {
    Write-Host "   ✗ main.js not found" -ForegroundColor Red
    $errorsList += "main.js not found"
    $allGood = $false
}

Write-Host ""

# Check 7: App.vue integration
Write-Host "📱 Checking App.vue integration..." -ForegroundColor Yellow

if (Test-Path "frontend/src/App.vue") {
    $appVue = Get-Content "frontend/src/App.vue" -Raw
    
    if ($appVue -match "PwaInstallPrompt") {
        Write-Host "   ✓ PwaInstallPrompt component integrated" -ForegroundColor Green
    } else {
        Write-Host "   ⚠ PwaInstallPrompt not found in App.vue" -ForegroundColor Yellow
        $warnings += "Consider adding PwaInstallPrompt to App.vue"
    }
} else {
    Write-Host "   ✗ App.vue not found" -ForegroundColor Red
    $errorsList += "App.vue not found"
    $allGood = $false
}

Write-Host ""

# Check 8: Build output (if exists)
Write-Host "🏗️  Checking build output..." -ForegroundColor Yellow

if (Test-Path "frontend/dist") {
    $distFiles = Get-ChildItem "frontend/dist" -File
    if ($distFiles.Count -gt 0) {
        Write-Host "   ✓ Build output exists ($($distFiles.Count) files)" -ForegroundColor Green
        
        if (Test-Path "frontend/dist/sw.js") {
            Write-Host "   ✓ Service worker built (sw.js)" -ForegroundColor Green
        } else {
            Write-Host "   ⚠ Service worker not found in build" -ForegroundColor Yellow
            $warnings += "Run 'npm run build' to generate service worker"
        }
    } else {
        Write-Host "   ⚠ Build output is empty" -ForegroundColor Yellow
        $warnings += "Run 'npm run build' to create production build"
    }
} else {
    Write-Host "   ⚠ No build output (dist/ not found)" -ForegroundColor Yellow
    $warnings += "Run 'npm run build' to create production build"
}

Write-Host ""
Write-Host "=" * 50 -ForegroundColor Cyan
Write-Host ""

# Summary
if ($allGood -and $warnings.Count -eq 0) {
    Write-Host "🎉 PWA CONFIGURATION: COMPLETE!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Your app is ready to be deployed as a PWA!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Cyan
    Write-Host "1. Generate icons (if not done): .\scripts\generate-pwa-icons.ps1 -SourceLogo 'frontend\public\logo.svg'" -ForegroundColor White
    Write-Host "2. Build: cd frontend; npm run build" -ForegroundColor White
    Write-Host "3. Preview: npm run preview" -ForegroundColor White
    Write-Host "4. Deploy to HTTPS domain" -ForegroundColor White
    Write-Host "5. Test on Android device" -ForegroundColor White
    Write-Host ""
} elseif ($errorsList.Count -eq 0 -and $warnings.Count -gt 0) {
    Write-Host "⚠️  PWA CONFIGURATION: ALMOST READY" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Warnings found ($($warnings.Count)):" -ForegroundColor Yellow
    foreach ($warning in $warnings) {
        Write-Host "   • $warning" -ForegroundColor Yellow
    }
    Write-Host ""
    Write-Host "These are not critical, but recommended to address." -ForegroundColor Gray
    Write-Host ""
} else {
    Write-Host "❌ PWA CONFIGURATION: INCOMPLETE" -ForegroundColor Red
    Write-Host ""
    if ($errorsList.Count -gt 0) {
        Write-Host "Errors found ($($errorsList.Count)):" -ForegroundColor Red
        foreach ($err in $errorsList) {
            Write-Host "   • $err" -ForegroundColor Red
        }
        Write-Host ""
    }
    if ($warnings.Count -gt 0) {
        Write-Host "Warnings found ($($warnings.Count)):" -ForegroundColor Yellow
        foreach ($warning in $warnings) {
            Write-Host "   • $warning" -ForegroundColor Yellow
        }
        Write-Host ""
    }
    Write-Host "Please fix the errors above before proceeding." -ForegroundColor Gray
    Write-Host ""
}

# Additional Info
Write-Host "📚 Documentation:" -ForegroundColor Cyan
Write-Host "   • Complete guide: docs/PWA_SETUP_GUIDE.md" -ForegroundColor White
Write-Host "   • Icon quick start: ICON_GENERATION_QUICKSTART.md" -ForegroundColor White
Write-Host "   • Summary: PWA_COMPLETE.md" -ForegroundColor White
Write-Host ""

exit $(if ($errorsList.Count -eq 0) { 0 } else { 1 })

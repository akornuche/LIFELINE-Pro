# PWA Readiness Checker - Simple Version
Write-Host ""
Write-Host "PWA Readiness Check for LifeLine Pro" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

# Check required files
Write-Host "Checking required files..." -ForegroundColor Yellow
$files = @(
    "frontend/public/manifest.webmanifest",
    "frontend/public/browserconfig.xml",
    "frontend/public/robots.txt",
    "frontend/public/offline.html",
    "frontend/public/logo.svg",
    "frontend/src/components/PwaInstallPrompt.vue",
    "frontend/src/composables/usePwa.js"
)

$allFiles = $true
foreach ($file in $files) {
    if (Test-Path $file) {
        Write-Host "  OK: $file" -ForegroundColor Green
    } else {
        Write-Host "  MISSING: $file" -ForegroundColor Red
        $allFiles = $false
    }
}

Write-Host ""
Write-Host "Checking for icons..." -ForegroundColor Yellow
if (Test-Path "frontend/public/icons") {
    $iconCount = (Get-ChildItem "frontend/public/icons" -Filter "*.png" -ErrorAction SilentlyContinue).Count
    if ($iconCount -gt 0) {
        Write-Host "  OK: Found $iconCount icon files" -ForegroundColor Green
    } else {
        Write-Host "  WARNING: No icons found. Run generate-pwa-icons.ps1" -ForegroundColor Yellow
    }
} else {
    Write-Host "  WARNING: Icons folder missing. Generate icons first." -ForegroundColor Yellow
}

Write-Host ""
if ($allFiles) {
    Write-Host "PWA Configuration: COMPLETE" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Cyan
    Write-Host "1. Generate icons: .\scripts\generate-pwa-icons.ps1 -SourceLogo 'frontend\public\logo.svg'" -ForegroundColor White
    Write-Host "2. Build: cd frontend; npm run build" -ForegroundColor White
    Write-Host "3. Preview: npm run preview" -ForegroundColor White
    Write-Host "4. Deploy to HTTPS" -ForegroundColor White
} else {
    Write-Host "PWA Configuration: INCOMPLETE" -ForegroundColor Red
    Write-Host "Please check missing files above." -ForegroundColor Yellow
}
Write-Host ""

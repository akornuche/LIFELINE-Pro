# 🎨 Icon Generation Script for PWA

# This script generates all required PWA icons from a source logo
# Requires ImageMagick to be installed

param(
    [Parameter(Mandatory=$true)]
    [string]$SourceLogo,
    
    [Parameter(Mandatory=$false)]
    [string]$OutputDir = "frontend/public/icons",
    
    [Parameter(Mandatory=$false)]
    [string]$BackgroundColor = "#10b981",
    
    [Parameter(Mandatory=$false)]
    [int]$Padding = 10
)

# Check if ImageMagick is installed
if (-not (Get-Command "magick" -ErrorAction SilentlyContinue)) {
    Write-Host "❌ ImageMagick not found. Please install it first:" -ForegroundColor Red
    Write-Host "   Windows: choco install imagemagick" -ForegroundColor Yellow
    Write-Host "   or download from: https://imagemagick.org/script/download.php" -ForegroundColor Yellow
    exit 1
}

# Check if source logo exists
if (-not (Test-Path $SourceLogo)) {
    Write-Host "❌ Source logo not found: $SourceLogo" -ForegroundColor Red
    exit 1
}

# Create output directory
New-Item -ItemType Directory -Force -Path $OutputDir | Out-Null
Write-Host "📁 Output directory: $OutputDir" -ForegroundColor Green

# Define icon sizes
$regularIcons = @(57, 60, 72, 76, 96, 114, 120, 128, 144, 152, 192, 384, 512)
$maskableIcons = @(192, 512)
$msIcons = @(70, 144, 150, 310)
$favicons = @(16, 32)

Write-Host ""
Write-Host "🎨 Generating PWA icons..." -ForegroundColor Cyan
Write-Host ""

# Generate regular icons
Write-Host "📱 Creating regular icons..." -ForegroundColor Yellow
foreach ($size in $regularIcons) {
    $output = Join-Path $OutputDir "icon-${size}x${size}.png"
    magick convert $SourceLogo -resize "${size}x${size}" -background "none" $output
    Write-Host "   ✓ Created icon-${size}x${size}.png" -ForegroundColor Green
}

# Generate maskable icons (with padding and background)
Write-Host ""
Write-Host "🎭 Creating maskable icons..." -ForegroundColor Yellow
foreach ($size in $maskableIcons) {
    $output = Join-Path $OutputDir "icon-maskable-${size}x${size}.png"
    $innerSize = [int]($size * (100 - $Padding) / 100)
    magick convert $SourceLogo -resize "${innerSize}x${innerSize}" `
        -background $BackgroundColor -gravity center `
        -extent "${size}x${size}" $output
    Write-Host "   ✓ Created icon-maskable-${size}x${size}.png" -ForegroundColor Green
}

# Generate Microsoft tiles
Write-Host ""
Write-Host "🪟 Creating Microsoft tiles..." -ForegroundColor Yellow
foreach ($size in $msIcons) {
    $output = Join-Path $OutputDir "ms-icon-${size}x${size}.png"
    magick convert $SourceLogo -resize "${size}x${size}" -background $BackgroundColor $output
    Write-Host "   ✓ Created ms-icon-${size}x${size}.png" -ForegroundColor Green
}

# Generate favicons
Write-Host ""
Write-Host "🔖 Creating favicons..." -ForegroundColor Yellow
foreach ($size in $favicons) {
    $output = Join-Path $OutputDir "favicon-${size}x${size}.png"
    magick convert $SourceLogo -resize "${size}x${size}" $output
    Write-Host "   ✓ Created favicon-${size}x${size}.png" -ForegroundColor Green
}

# Generate multi-size favicon.ico
Write-Host ""
Write-Host "💠 Creating favicon.ico..." -ForegroundColor Yellow
$favicon16 = Join-Path $OutputDir "favicon-16x16.png"
$favicon32 = Join-Path $OutputDir "favicon-32x32.png"
$faviconIco = Join-Path $OutputDir ".." "favicon.ico"
magick convert $favicon16 $favicon32 $faviconIco
Write-Host "   ✓ Created favicon.ico" -ForegroundColor Green

# Generate Apple touch icon
Write-Host ""
Write-Host "🍎 Creating Apple touch icon..." -ForegroundColor Yellow
$appleIcon = Join-Path $OutputDir "apple-touch-icon.png"
magick convert $SourceLogo -resize "180x180" $appleIcon
Write-Host "   ✓ Created apple-touch-icon.png" -ForegroundColor Green

# Generate shortcut icons (96x96)
Write-Host ""
Write-Host "🔗 Creating shortcut icons..." -ForegroundColor Yellow
$shortcuts = @("doctor", "history", "consultation")
foreach ($shortcut in $shortcuts) {
    $output = Join-Path $OutputDir "shortcut-${shortcut}.png"
    magick convert $SourceLogo -resize "96x96" $output
    Write-Host "   ✓ Created shortcut-${shortcut}.png" -ForegroundColor Green
}

# Summary
Write-Host ""
Write-Host "✅ Icon generation complete!" -ForegroundColor Green
Write-Host ""
Write-Host "📊 Summary:" -ForegroundColor Cyan
Write-Host "   Regular icons: $($regularIcons.Count)" -ForegroundColor White
Write-Host "   Maskable icons: $($maskableIcons.Count)" -ForegroundColor White
Write-Host "   Microsoft tiles: $($msIcons.Count)" -ForegroundColor White
Write-Host "   Favicons: $($favicons.Count + 1)" -ForegroundColor White
Write-Host "   Apple icon: 1" -ForegroundColor White
Write-Host "   Shortcut icons: $($shortcuts.Count)" -ForegroundColor White
Write-Host "   Total: $($regularIcons.Count + $maskableIcons.Count + $msIcons.Count + $favicons.Count + 1 + 1 + $shortcuts.Count)" -ForegroundColor White
Write-Host ""
Write-Host "📝 Next steps:" -ForegroundColor Yellow
Write-Host "   1. Review generated icons in: $OutputDir" -ForegroundColor White
Write-Host "   2. Generate splash screens (see PWA_SETUP_GUIDE.md)" -ForegroundColor White
Write-Host "   3. Build and test: npm run build && npm run preview" -ForegroundColor White
Write-Host "   4. Deploy to HTTPS domain" -ForegroundColor White
Write-Host ""

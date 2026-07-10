# build.ps1
# Builds the LifeLine Android TWA APK / AAB
# Prerequisites: Android SDK installed, ANDROID_HOME set, Java 11+

param(
    [ValidateSet("debug","release","bundle")]
    [string]$Target = "release"
)

$root = $PSScriptRoot

# Ensure local.properties has sdk.dir
$localProps = Join-Path $root "local.properties"
if ($env:ANDROID_HOME -and (-not (Select-String -Path $localProps -Pattern "sdk.dir" -Quiet))) {
    $sdkPath = $env:ANDROID_HOME -replace "\\", "/"
    Add-Content -Path $localProps -Value "sdk.dir=$sdkPath"
    Write-Host "Set sdk.dir=$sdkPath in local.properties"
}

# Ensure keystore exists
$keystore = Join-Path $root "android-signing-key.keystore"
if (-not (Test-Path $keystore)) {
    Write-Host "Keystore not found. Run generate-keystore.ps1 first."
    exit 1
}

# Determine gradle task
switch ($Target) {
    "debug"   { $task = "assembleDebug" }
    "release" { $task = "assembleRelease" }
    "bundle"  { $task = "bundleRelease" }
}

Write-Host "Building target: $Target (gradle task: $task)"

$gradlew = Join-Path $root "gradlew.bat"
if (-not (Test-Path $gradlew)) {
    Write-Host "gradlew.bat not found. Run 'gradle wrapper' inside the android directory first, or download it."
    exit 1
}

& $gradlew $task

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "Build succeeded!"
    if ($Target -eq "bundle") {
        $output = "app\build\outputs\bundle\release\app-release.aab"
    } elseif ($Target -eq "release") {
        $output = "app\build\outputs\apk\release\app-release.apk"
    } else {
        $output = "app\build\outputs\apk\debug\app-debug.apk"
    }
    $fullOutput = Join-Path $root $output
    if (Test-Path $fullOutput) {
        Write-Host "Output: $fullOutput"
    }
} else {
    Write-Host "Build failed with exit code $LASTEXITCODE"
    exit $LASTEXITCODE
}

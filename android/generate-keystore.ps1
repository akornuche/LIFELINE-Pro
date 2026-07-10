# generate-keystore.ps1
# Generates the Android signing keystore for LifeLine
# Requires Java keytool on PATH (comes with JDK)

$keystorePath = "android-signing-key.keystore"
$keyAlias = "android"
$storePassword = $env:KEYSTORE_PASSWORD
if (-not $storePassword) { $storePassword = "LifeLine2026!" }
$keyPassword = $env:KEY_PASSWORD
if (-not $keyPassword) { $keyPassword = "LifeLine2026!" }

if (Test-Path $keystorePath) {
    Write-Host "Keystore already exists at $keystorePath. Delete it first to regenerate."
    exit 0
}

Write-Host "Generating keystore at $keystorePath ..."

keytool -genkeypair `
  -v `
  -keystore $keystorePath `
  -alias $keyAlias `
  -keyalg RSA `
  -keysize 2048 `
  -validity 10000 `
  -storepass $storePassword `
  -keypass $keyPassword `
  -dname "CN=LifeLine, OU=Mobile, O=LifeLine Pro, L=Unknown, ST=Unknown, C=US"

if ($LASTEXITCODE -eq 0) {
    Write-Host "Keystore generated successfully."
    Write-Host ""
    Write-Host "IMPORTANT: Keep android-signing-key.keystore safe and backed up."
    Write-Host "It is excluded from git via .gitignore."
    Write-Host ""
    Write-Host "To get the SHA-256 fingerprint for assetlinks.json:"
    keytool -list -v -keystore $keystorePath -alias $keyAlias -storepass $storePassword | Select-String "SHA256"
} else {
    Write-Host "Keystore generation failed. Make sure Java (keytool) is installed and on PATH."
    exit 1
}

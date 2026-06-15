param(
  [switch]$VerifyOnly
)

$ErrorActionPreference = "Stop"

$expectedSiteId = "8fea8a59-a1b7-43fa-b644-7fd8c230c720"
$expectedSiteUrl = "https://whh-email-outreach-survey.netlify.app/survey/"
$expectedTitle = "Help Shape WHH Updates"
$repoRoot = Split-Path -Parent $PSScriptRoot
$indexPath = Join-Path $repoRoot "public\survey\index.html"

if (-not (Test-Path $indexPath)) {
  throw "Expected public\survey\index.html under $repoRoot."
}

$indexHtml = Get-Content $indexPath -Raw
if ($indexHtml -notmatch "<title>$([regex]::Escape($expectedTitle))</title>") {
  throw "Refusing deploy: public\survey\index.html is not $expectedTitle."
}

$gitRoot = (git -C $repoRoot rev-parse --show-toplevel).Trim()
$normalizedGitRoot = [System.IO.Path]::GetFullPath($gitRoot)
$normalizedRepoRoot = [System.IO.Path]::GetFullPath($repoRoot)
if ($normalizedGitRoot -ne $normalizedRepoRoot) {
  throw "Refusing deploy: repo root mismatch. Expected $repoRoot, got $gitRoot."
}

if (-not $VerifyOnly) {
  npx.cmd netlify-cli@latest deploy `
    --prod `
    --build `
    --site $expectedSiteId `
    --message "WHH Email Outreach guarded deploy"
}

$cacheBust = [DateTimeOffset]::UtcNow.ToUnixTimeSeconds()
$response = Invoke-WebRequest -UseBasicParsing "$expectedSiteUrl`?v=$cacheBust"
if ($response.Content -notmatch "<title>$([regex]::Escape($expectedTitle))</title>") {
  throw "Deploy verification failed: $expectedSiteUrl is not serving $expectedTitle."
}

Write-Host "Verified $expectedTitle at $expectedSiteUrl"

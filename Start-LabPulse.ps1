# Ensure execution policy for current process
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass -Force

# Winget helpers
function Ensure-App($id, $name) {
  if (-not (winget list --id $id | Select-String $id)) {
    Write-Host "Installing $name..."
    winget install --id $id -e --silent
  } else { Write-Host "$name OK" }
}

# Node, Rust toolchain, Git
Ensure-App "OpenJS.NodeJS.LTS" "Node LTS"
Ensure-App "Git.Git" "Git"
if (-not (Get-Command rustc -ErrorAction SilentlyContinue)) {
  Write-Host "Installing Rust..."
  Invoke-Expression "& { $(Invoke-RestMethod https://sh.rustup.rs -UseBasicParsing) } -y"  # installs rustup + stable
}

# pnpm
if (-not (Get-Command pnpm -ErrorAction SilentlyContinue)) {
  npm i -g pnpm
}

# deps
pnpm i

# tauri cli (local dev dep already added, ensure bin on PATH)
$env:PATH = "$env:APPDATA\npm;$env:USERPROFILE\.cargo\bin;$env:PATH"

# run tauri dev
pnpm tauri:dev


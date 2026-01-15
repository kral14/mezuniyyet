# Windows Defender Exclusion Script
# This script runs with administrator privileges and adds Defender exclusion

# Check for admin privileges
if (-NOT ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")) {
    Write-Host "Administrator permission required. Restarting..." -ForegroundColor Yellow
    
    # Restart script as admin
    Start-Process powershell.exe "-NoProfile -ExecutionPolicy Bypass -File `"$PSCommandPath`"" -Verb RunAs
    exit
}

# Running as admin
Write-Host "Administrator permission granted!" -ForegroundColor Green
Write-Host ""

# Exclusion path
$exclusionPath = "c:\Users\nesib\OneDrive\Masaustu\v7.14\mezuniyyet-sistem\src-tauri\target"

Write-Host "Adding Windows Defender exclusion..." -ForegroundColor Cyan
Write-Host "Path: $exclusionPath" -ForegroundColor Gray
Write-Host ""

try {
    # Add Defender exclusion
    Add-MpPreference -ExclusionPath $exclusionPath
    
    Write-Host "SUCCESS! Exclusion added!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Now Tauri build will work. To continue:" -ForegroundColor Yellow
    Write-Host "  1. Close this window" -ForegroundColor White
    Write-Host "  2. In VS Code, tell me 'haziram' (ready)" -ForegroundColor White
    Write-Host ""
    
    # Show current exclusions
    Write-Host "Current exclusions:" -ForegroundColor Cyan
    Get-MpPreference | Select-Object -ExpandProperty ExclusionPath
    
}
catch {
    Write-Host "ERROR: $_" -ForegroundColor Red
}

Write-Host ""
Write-Host "Press any key to close..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

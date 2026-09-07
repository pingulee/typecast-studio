$ErrorActionPreference = 'Stop'
if ($env:GITHUB_ACTIONS -ne 'true') { throw 'This install/uninstall test is restricted to a disposable GitHub runner.' }
foreach ($language in @(@{Code='en';Id=1033},@{Code='ko';Id=1042},@{Code='zh-CN';Id=2052})) {
$dataDir = Join-Path $env:LOCALAPPDATA 'Typecast Studio'
# Reset only this disposable runner's test state for each clean installation.
if (Test-Path $dataDir) { Remove-Item $dataDir -Recurse -Force }
Remove-Item 'HKCU:\Software\Typecast Studio' -Recurse -Force -ErrorAction SilentlyContinue
$installer = Join-Path $PWD 'dist\Typecast-Studio-Setup-1.1.0.exe'
$installDir = Join-Path $env:ProgramFiles 'Typecast Studio'
$install = Start-Process -FilePath $installer -ArgumentList @('/S',"/LANGUAGE=$($language.Id)") -Wait -PassThru
if ($install.ExitCode -ne 0) { throw "Installer exited $($install.ExitCode)" }
if (!(Test-Path "$installDir\TypecastStudio.exe")) { throw 'Launcher missing in Program Files' }
$startup = (Get-ItemProperty 'HKCU:\Software\Microsoft\Windows\CurrentVersion\Run').TypecastStudio
if ($startup -notlike '*TypecastStudio.exe*--background*') { throw 'Startup registration missing' }
Start-Process -FilePath "$installDir\TypecastStudio.exe" -ArgumentList '--background'
$health = $null
for ($i=0; $i -lt 40; $i++) {
  try { $health = Invoke-RestMethod 'http://127.0.0.1:4318/api/health'; break } catch { Start-Sleep -Milliseconds 500 }
}
if ($health.app -ne 'typecast-studio' -or $health.version -ne 2) { throw 'Installed background service did not start' }
$page = Invoke-WebRequest 'http://127.0.0.1:4318/'
if ($page.StatusCode -ne 200 -or $page.Content -notmatch 'lang="en"') { throw 'English default document unavailable' }
foreach ($route in @('/overlay','/capture?key=green','/capture?key=blue')) {
  if ((Invoke-WebRequest ("http://127.0.0.1:4318"+$route)).StatusCode -ne 200) { throw "Missing route: $route" }
}
$state = Invoke-RestMethod 'http://127.0.0.1:4318/api/state'
if ($state.config.language -ne $language.Code) { throw 'Installer language did not reach the editor' }
$state.config.lines = @('Single-line installed Windows smoke test')
$state.config.singleMode = 'stay'
$state.config.animation = 'pulse'
$state.config.language = $language.Code
$json = $state.config | ConvertTo-Json -Depth 10 -Compress
Invoke-RestMethod 'http://127.0.0.1:4318/api/state' -Method Post -ContentType 'application/json' -Body ([Text.Encoding]::UTF8.GetBytes($json)) | Out-Null
$dataFile = Join-Path $env:LOCALAPPDATA 'Typecast Studio\settings.json'
if (!(Test-Path $dataFile)) { throw 'User settings not saved in LocalAppData' }
$stored = Get-Content $dataFile -Raw -Encoding utf8 | ConvertFrom-Json
if ($stored.config.lines.Count -ne 1 -or $stored.config.animation -ne 'pulse') { throw 'Single-line configuration was not persisted' }
if (Test-Path "$installDir\data") { throw 'Program attempted to write settings to Program Files' }
& "$installDir\runtime\node.exe" "$installDir\control.mjs" stop
Start-Sleep -Seconds 2
Start-Process -FilePath "$installDir\TypecastStudio.exe" -ArgumentList '--background'
for ($i=0; $i -lt 30; $i++) { try { $again=Invoke-RestMethod 'http://127.0.0.1:4318/api/state'; break } catch { Start-Sleep -Milliseconds 500 } }
if ($again.config.language -ne $language.Code) { throw 'Restart lost the selected language' }
if ($language.Code -eq 'en') {
  node scripts/windows-ui.mjs
  if ($LASTEXITCODE -ne 0) { throw 'Browser language test failed' }
}
if ($again.config.lines[0] -ne 'Single-line installed Windows smoke test') { throw 'Restart lost saved settings' }
$uninstall = Start-Process -FilePath "$installDir\Uninstall.exe" -ArgumentList '/S' -Wait -PassThru
Start-Sleep -Seconds 4
if (Test-Path "$installDir\TypecastStudio.exe") { throw 'Uninstaller left the launcher behind' }
$remaining = Get-ItemProperty 'HKCU:\Software\Microsoft\Windows\CurrentVersion\Run' -ErrorAction SilentlyContinue
if ($remaining.TypecastStudio) { throw 'Uninstaller left startup registration behind' }
if (!(Test-Path $dataFile)) { throw 'Uninstaller removed user settings' }
Write-Host "PASS: $($language.Code) installation, bundled runtime, language, startup, text persistence, restart and uninstall."
}

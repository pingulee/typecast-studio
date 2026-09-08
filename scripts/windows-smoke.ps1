$ErrorActionPreference = 'Stop'
if ($env:GITHUB_ACTIONS -ne 'true') { throw 'Disposable Windows CI only.' }
$dataDir = Join-Path $env:LOCALAPPDATA 'Typecast Studio'
if (Test-Path $dataDir) { Remove-Item $dataDir -Recurse -Force }
$installer = Join-Path $PWD 'dist\Typecast-Studio-Setup-1.2.0.exe'
$installDir = Join-Path $env:ProgramFiles 'Typecast Studio'
New-Item -ItemType Directory -Path 'work/ui' -Force | Out-Null
$csc = Join-Path $env:WINDIR 'Microsoft.NET\Framework64\v4.0.30319\csc.exe'
& $csc /nologo /target:exe /reference:System.Drawing.dll "/out:$PWD\work\InstallerSmoke.exe" (Join-Path $PWD 'tests\InstallerSmoke.cs')
if ($LASTEXITCODE -ne 0) { throw 'Installer test compilation failed' }
& "$PWD\work\InstallerSmoke.exe" $installer "$PWD\work\ui\installer-welcome.png"
if ($LASTEXITCODE -ne 0) { throw 'English welcome screen test failed' }
$install = Start-Process -FilePath $installer -ArgumentList '/S' -Wait -PassThru
if ($install.ExitCode -ne 0) { throw 'Installer failed' }
$startup = (Get-ItemProperty 'HKCU:\Software\Microsoft\Windows\CurrentVersion\Run').TypecastStudio
if ($startup -notlike '*TypecastStudio.exe*--background*') { throw 'Startup registration missing' }
foreach ($name in @('TypecastStudio.exe','runtime\node.exe','User-Guide-zh-CN.txt')) {
 if (!(Test-Path "$installDir\$name")) { throw "Missing installed file: $name" }
}
New-Item -ItemType Directory -Path 'work/ui' -Force | Out-Null
$csc = Join-Path $env:WINDIR 'Microsoft.NET\Framework64\v4.0.30319\csc.exe'
& $csc /nologo /target:exe /reference:System.Windows.Forms.dll /reference:System.Drawing.dll "/out:$installDir\TraySmoke.exe" (Join-Path $PWD "tests\TraySmoke.cs")
if ($LASTEXITCODE -ne 0) { throw 'Tray test compilation failed' }
& "$installDir\TraySmoke.exe" "$installDir\TypecastStudio.exe" "$PWD\work\ui\tray-menu.png"
if ($LASTEXITCODE -ne 0) { throw 'Windows tray test failed' }
Remove-Item "$installDir\TraySmoke.exe"
function Wait-Ready {
 for ($i=0; $i -lt 40; $i++) {
  try { return Invoke-RestMethod 'http://127.0.0.1:4318/api/state' } catch { Start-Sleep -Milliseconds 500 }
 }
 throw 'Installed service did not start'
}
$hostProcess = Start-Process -FilePath "$installDir\TypecastStudio.exe" -ArgumentList '--background' -PassThru
$state = Wait-Ready
if ($state.config.language -ne 'zh-CN' -or $state.config.lines.Count -ne 1 -or $state.config.highlight) { throw 'Fresh defaults are not simple Chinese single-entry mode' }
# A second launch must not create a duplicate tray host.
$second = Start-Process -FilePath "$installDir\TypecastStudio.exe" -ArgumentList '--background' -PassThru
if (!$second.WaitForExit(5000)) { throw 'Duplicate tray process did not exit' }
node scripts/windows-ui.mjs
if ($LASTEXITCODE -ne 0) { throw 'Browser test failed' }
if (!$hostProcess.WaitForExit(8000)) { throw 'Web Quit left the tray process running' }
$hostProcess = Start-Process -FilePath "$installDir\TypecastStudio.exe" -ArgumentList '--background' -PassThru
$again = Wait-Ready
if ($again.config.lines.Count -ne 1 -or $again.config.lines[0] -notmatch 'your_wechat') { throw 'Saved one-entry state was lost' }
$stop = Start-Process -FilePath "$installDir\TypecastStudio.exe" -ArgumentList '--stop' -PassThru -Wait
if (!$hostProcess.WaitForExit(8000)) { throw 'Tray Quit command left the process running' }
$hostProcess = Start-Process -FilePath "$installDir\TypecastStudio.exe" -ArgumentList '--background' -PassThru
$null = Wait-Ready
$uninstall = Start-Process -FilePath "$installDir\Uninstall.exe" -ArgumentList '/S' -Wait -PassThru
Start-Sleep -Seconds 4
if (Test-Path "$installDir\TypecastStudio.exe") { throw 'Uninstaller left the launcher behind' }
$remaining = Get-ItemProperty 'HKCU:\Software\Microsoft\Windows\CurrentVersion\Run' -ErrorAction SilentlyContinue
if ($remaining.TypecastStudio) { throw 'Uninstaller left startup registration behind' }
if (!(Test-Path "$dataDir\settings.json")) { throw 'Uninstaller removed settings' }
Write-Host 'PASS: English installer, Chinese single-entry UI, real tray, duplicate launch, both Quit paths, restart and uninstall.'

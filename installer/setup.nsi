Unicode true
!include "MUI2.nsh"
!include "LogicLib.nsh"
!include "x64.nsh"
Name "直播花字工作室 1.0.0"
OutFile "${OUTPUT}"
InstallDir "$PROGRAMFILES64\Typecast Studio"
InstallDirRegKey HKLM "Software\Typecast Studio" "InstallDir"
RequestExecutionLevel admin
SetCompressor /SOLID lzma
SetCompressorDictSize 32
BrandingText "Typecast Studio · 中文直播花字"
Icon "${ICON}"
UninstallIcon "${ICON}"
VIProductVersion "1.0.0.0"
VIAddVersionKey /LANG=2052 "ProductName" "Typecast Studio"
VIAddVersionKey /LANG=2052 "FileDescription" "直播花字工作室安装程序"
VIAddVersionKey /LANG=2052 "FileVersion" "1.0.0.0"
VIAddVersionKey /LANG=2052 "LegalCopyright" "Copyright 2026 Typecast Studio contributors"
!define MUI_ABORTWARNING
!define MUI_WELCOMEPAGE_TITLE "欢迎安装直播花字工作室"
!define MUI_WELCOMEPAGE_TEXT "为抖音直播伴侣制作实时更新的中文艺术字。$\r$\n$\r$\n包含 14 款样式、2 套字体和 10 种动画。支持单条文案和多条轮播。$\r$\n$\r$\n程序将安装到 Program Files，设置保存在当前用户的 AppData。请先退出旧版本。"
!insertmacro MUI_PAGE_WELCOME
!insertmacro MUI_PAGE_COMPONENTS
!insertmacro MUI_PAGE_DIRECTORY
!insertmacro MUI_PAGE_INSTFILES
!define MUI_FINISHPAGE_TITLE "安装完成"
!define MUI_FINISHPAGE_TEXT "双击桌面上的“直播花字工作室”打开编辑器。$\r$\n$\r$\n若启用了自动启动，登录 Windows 后后台服务会自动运行，不会弹出浏览器。$\r$\n$\r$\n开始菜单还提供“退出后台服务”和“使用说明”。"
!insertmacro MUI_PAGE_FINISH
!insertmacro MUI_UNPAGE_CONFIRM
!insertmacro MUI_UNPAGE_INSTFILES
!insertmacro MUI_LANGUAGE "SimpChinese"
Function .onInit
  ${IfNot} ${RunningX64}
    MessageBox MB_OK|MB_ICONSTOP "此版本需要 64 位 Windows。"
    Abort
  ${EndIf}
  SetRegView 64
  SetShellVarContext current
FunctionEnd
Section "程序文件（必需）" Core
  SectionIn RO
  IfFileExists "$INSTDIR\runtime\node.exe" 0 copy_files
    nsExec::Exec '"$INSTDIR\runtime\node.exe" "$INSTDIR\control.mjs" stop'
    Pop $0
    Sleep 1200
  copy_files:
  SetOutPath "$INSTDIR"
  File /r "${PAYLOAD}\*.*"
  WriteRegStr HKLM "Software\Typecast Studio" "InstallDir" "$INSTDIR"
  WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\TypecastStudio" "DisplayName" "直播花字工作室 (Typecast Studio)"
  WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\TypecastStudio" "DisplayVersion" "1.0.0"
  WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\TypecastStudio" "Publisher" "Typecast Studio contributors"
  WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\TypecastStudio" "InstallLocation" "$INSTDIR"
  WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\TypecastStudio" "DisplayIcon" "$INSTDIR\TypecastStudio.exe"
  WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\TypecastStudio" "UninstallString" '"$INSTDIR\Uninstall.exe"'
  WriteRegDWORD HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\TypecastStudio" "NoModify" 1
  WriteRegDWORD HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\TypecastStudio" "NoRepair" 1
  WriteUninstaller "$INSTDIR\Uninstall.exe"
  DeleteRegValue HKCU "Software\Microsoft\Windows\CurrentVersion\Run" "TypecastStudio"
  CreateDirectory "$SMPROGRAMS\直播花字工作室"
  CreateShortcut "$SMPROGRAMS\直播花字工作室\直播花字工作室.lnk" "$INSTDIR\TypecastStudio.exe"
  CreateShortcut "$SMPROGRAMS\直播花字工作室\退出后台服务.lnk" "$INSTDIR\TypecastStudio.exe" "--stop"
  CreateShortcut "$SMPROGRAMS\直播花字工作室\使用说明.lnk" "$INSTDIR\使用说明.txt"
  CreateShortcut "$SMPROGRAMS\直播花字工作室\卸载.lnk" "$INSTDIR\Uninstall.exe"
SectionEnd
Section "登录 Windows 后自动启动（推荐）" Startup
  WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Run" "TypecastStudio" '"$INSTDIR\TypecastStudio.exe" --background'
SectionEnd
Section "创建桌面快捷方式" Desktop
  CreateShortcut "$DESKTOP\直播花字工作室.lnk" "$INSTDIR\TypecastStudio.exe"
SectionEnd
Function un.onInit
  SetRegView 64
  SetShellVarContext current
FunctionEnd
Section "Uninstall"
  nsExec::Exec '"$INSTDIR\runtime\node.exe" "$INSTDIR\control.mjs" stop'
  Pop $0
  Sleep 1500
  DeleteRegValue HKCU "Software\Microsoft\Windows\CurrentVersion\Run" "TypecastStudio"
  Delete "$DESKTOP\直播花字工作室.lnk"
  RMDir /r "$SMPROGRAMS\直播花字工作室"
  DeleteRegKey HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\TypecastStudio"
  DeleteRegKey HKLM "Software\Typecast Studio"
  ; Remove only owned program files. Preserve the user's AppData settings.
  Delete "$INSTDIR\TypecastStudio.exe"
  Delete "$INSTDIR\server.mjs"
  Delete "$INSTDIR\control.mjs"
  Delete "$INSTDIR\使用说明.txt"
  Delete "$INSTDIR\Uninstall.exe"
  RMDir /r "$INSTDIR\runtime"
  RMDir /r "$INSTDIR\web"
  RMDir /r "$INSTDIR\lib"
  RMDir /r "$INSTDIR\licenses"
  RMDir "$INSTDIR"
SectionEnd

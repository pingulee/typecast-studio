Unicode true
!include "MUI2.nsh"
!include "LogicLib.nsh"
!include "x64.nsh"
!include "FileFunc.nsh"
Name "Typecast Studio 1.4.0"
OutFile "${OUTPUT}"
InstallDir "$PROGRAMFILES64\Typecast Studio"
InstallDirRegKey HKLM "Software\Typecast Studio" "InstallDir"
RequestExecutionLevel admin
SetCompressor /SOLID lzma
SetCompressorDictSize 32
BrandingText "Typecast Studio"
Icon "${ICON}"
UninstallIcon "${ICON}"
VIProductVersion "1.4.0.0"
VIAddVersionKey /LANG=1033 "ProductName" "Typecast Studio"
VIAddVersionKey /LANG=1033 "FileDescription" "Typecast Studio Installer"
VIAddVersionKey /LANG=1033 "FileVersion" "1.4.0.0"
VIAddVersionKey /LANG=1033 "LegalCopyright" "Copyright 2026 Typecast Studio contributors"
!define MUI_ABORTWARNING
!define MUI_WELCOMEPAGE_TITLE "Welcome to Typecast Studio"
!define MUI_WELCOMEPAGE_TEXT "A simple live text editor with a Chinese web interface.$\r$\n$\r$\nStart with one text entry and add more with +. Change the style, choose an animation, and open the live output window.$\r$\n$\r$\nEverything is included. No separate Node.js or developer tools are required.$\r$\n$\r$\nPlease quit the previous version before upgrading."
!insertmacro MUI_PAGE_WELCOME
!insertmacro MUI_PAGE_COMPONENTS
!insertmacro MUI_PAGE_DIRECTORY
!insertmacro MUI_PAGE_INSTFILES
!define MUI_FINISHPAGE_TITLE "Installation complete"
!define MUI_FINISHPAGE_TEXT "Open Typecast Studio from your desktop or Start menu.$\r$\n$\r$\nThe web editor is in Chinese. A tray icon lets you open the editor, open the output window, or quit.$\r$\n$\r$\nIf startup is enabled, the app starts quietly when you sign in."
!insertmacro MUI_PAGE_FINISH
!insertmacro MUI_UNPAGE_CONFIRM
!insertmacro MUI_UNPAGE_INSTFILES
!insertmacro MUI_LANGUAGE "English"
Function .onInit
  SetRegView 64
  SetShellVarContext current
  StrCpy $LANGUAGE 1033
  ${GetParameters} $0
  ClearErrors
  ${GetOptions} $0 "/UPDATE" $1
  ${IfNot} ${Errors}
    ReadRegStr $2 HKCU "Software\Microsoft\Windows\CurrentVersion\Run" "TypecastStudio"
    ${If} $2 == ""
      SectionSetFlags 1 0
    ${EndIf}
    IfFileExists "$DESKTOP\Typecast Studio.lnk" +2 0
      SectionSetFlags 2 0
  ${EndIf}
  ${IfNot} ${RunningX64}
    MessageBox MB_OK|MB_ICONSTOP "This version requires 64-bit Windows."
    Abort
  ${EndIf}
FunctionEnd
Section "Program files (required)" Core
  SectionIn RO
  IfFileExists "$INSTDIR\runtime\node.exe" 0 copy_files
    nsExec::Exec '"$INSTDIR\runtime\node.exe" "$INSTDIR\control.mjs" stop'
    Pop $0
    Sleep 1800
  copy_files:
  SetOutPath "$INSTDIR"
  File /r "${PAYLOAD}\*.*"
  WriteRegStr HKLM "Software\Typecast Studio" "InstallDir" "$INSTDIR"
  WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\TypecastStudio" "DisplayName" "Typecast Studio"
  WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\TypecastStudio" "DisplayVersion" "1.4.0"
  WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\TypecastStudio" "Publisher" "Typecast Studio contributors"
  WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\TypecastStudio" "InstallLocation" "$INSTDIR"
  WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\TypecastStudio" "DisplayIcon" "$INSTDIR\TypecastStudio.exe"
  WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\TypecastStudio" "UninstallString" '"$INSTDIR\Uninstall.exe"'
  WriteRegDWORD HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\TypecastStudio" "NoModify" 1
  WriteRegDWORD HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\TypecastStudio" "NoRepair" 1
  WriteUninstaller "$INSTDIR\Uninstall.exe"
  DeleteRegValue HKCU "Software\Microsoft\Windows\CurrentVersion\Run" "TypecastStudio"
  DeleteRegValue HKCU "Software\Typecast Studio" "InstallerLanguage"
  RMDir /r "$SMPROGRAMS\直播花字工作室"
  Delete "$DESKTOP\直播花字工作室.lnk"
  RMDir /r "$SMPROGRAMS\Typecast Studio"
  CreateDirectory "$SMPROGRAMS\Typecast Studio"
  CreateShortcut "$SMPROGRAMS\Typecast Studio\Typecast Studio.lnk" "$INSTDIR\TypecastStudio.exe"
  CreateShortcut "$SMPROGRAMS\Typecast Studio\Quit.lnk" "$INSTDIR\TypecastStudio.exe" "--stop"
  CreateShortcut "$SMPROGRAMS\Typecast Studio\User guide.lnk" "$INSTDIR\User-Guide-zh-CN.txt"
  CreateShortcut "$SMPROGRAMS\Typecast Studio\Uninstall.lnk" "$INSTDIR\Uninstall.exe"
SectionEnd
Section "Start automatically when I sign in (recommended)" Startup
  WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Run" "TypecastStudio" '"$INSTDIR\TypecastStudio.exe" --background'
SectionEnd
Section "Create a desktop shortcut" Desktop
  CreateShortcut "$DESKTOP\Typecast Studio.lnk" "$INSTDIR\TypecastStudio.exe"
SectionEnd
Function un.onInit
  SetRegView 64
  SetShellVarContext current
  StrCpy $LANGUAGE 1033
FunctionEnd
Section "Uninstall"
  nsExec::Exec '"$INSTDIR\runtime\node.exe" "$INSTDIR\control.mjs" stop'
  Pop $0
  Sleep 1800
  DeleteRegValue HKCU "Software\Microsoft\Windows\CurrentVersion\Run" "TypecastStudio"
  Delete "$DESKTOP\直播花字工作室.lnk"
  Delete "$DESKTOP\Typecast Studio.lnk"
  RMDir /r "$SMPROGRAMS\直播花字工作室"
  RMDir /r "$SMPROGRAMS\Typecast Studio"
  DeleteRegKey HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\TypecastStudio"
  DeleteRegKey HKLM "Software\Typecast Studio"
  Delete "$INSTDIR\TypecastStudio.exe"
  Delete "$INSTDIR\TypecastUpdate.exe"
  Delete "$INSTDIR\server.mjs"
  Delete "$INSTDIR\control.mjs"
  Delete "$INSTDIR\使用说明.txt"
  Delete "$INSTDIR\User-Guide-en.txt"
  Delete "$INSTDIR\User-Guide-ko.txt"
  Delete "$INSTDIR\User-Guide-zh-CN.txt"
  Delete "$INSTDIR\Uninstall.exe"
  RMDir /r "$INSTDIR\runtime"
  RMDir /r "$INSTDIR\web"
  RMDir /r "$INSTDIR\lib"
  RMDir /r "$INSTDIR\licenses"
  RMDir "$INSTDIR"
SectionEnd

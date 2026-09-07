Unicode true
!include "MUI2.nsh"
!include "LogicLib.nsh"
!include "x64.nsh"
!include "FileFunc.nsh"
Name "Typecast Studio 1.1.0"
OutFile "${OUTPUT}"
InstallDir "$PROGRAMFILES64\Typecast Studio"
InstallDirRegKey HKLM "Software\Typecast Studio" "InstallDir"
RequestExecutionLevel admin
SetCompressor /SOLID lzma
SetCompressorDictSize 32
BrandingText "Typecast Studio"
Icon "${ICON}"
UninstallIcon "${ICON}"
VIProductVersion "1.1.0.0"
VIAddVersionKey /LANG=1033 "ProductName" "Typecast Studio"
VIAddVersionKey /LANG=1033 "FileDescription" "Typecast Studio Installer"
VIAddVersionKey /LANG=1033 "FileVersion" "1.1.0.0"
VIAddVersionKey /LANG=1033 "LegalCopyright" "Copyright 2026 Typecast Studio contributors"
!define MUI_ABORTWARNING
!define MUI_LANGDLL_ALWAYSSHOW
!define MUI_LANGDLL_ALLLANGUAGES
!define MUI_LANGDLL_WINDOWTITLE "Language / 언어 / 语言"
!define MUI_LANGDLL_INFO "Select a language / 언어를 선택하세요 / 请选择语言"
!define MUI_LANGDLL_REGISTRY_ROOT HKCU
!define MUI_LANGDLL_REGISTRY_KEY "Software\Typecast Studio"
!define MUI_LANGDLL_REGISTRY_VALUENAME "InstallerLanguage"
!define MUI_WELCOMEPAGE_TITLE "$(WelcomeTitle)"
!define MUI_WELCOMEPAGE_TEXT "$(WelcomeText)"
!insertmacro MUI_PAGE_WELCOME
!insertmacro MUI_PAGE_COMPONENTS
!insertmacro MUI_PAGE_DIRECTORY
!insertmacro MUI_PAGE_INSTFILES
!define MUI_FINISHPAGE_TITLE "$(FinishTitle)"
!define MUI_FINISHPAGE_TEXT "$(FinishText)"
!insertmacro MUI_PAGE_FINISH
!insertmacro MUI_UNPAGE_CONFIRM
!insertmacro MUI_UNPAGE_INSTFILES
!insertmacro MUI_LANGUAGE "English"
!insertmacro MUI_LANGUAGE "Korean"
!insertmacro MUI_LANGUAGE "SimpChinese"
!include "languages.nsh"
!insertmacro MUI_RESERVEFILE_LANGDLL
Function .onInit
  SetRegView 64
  StrCpy $LANGUAGE 1033
  !insertmacro MUI_LANGDLL_DISPLAY
  ${GetParameters} $0
  ClearErrors
  ${GetOptions} $0 "/LANGUAGE=" $1
  ${IfNot} ${Errors}
    ${If} $1 == 1033
    ${OrIf} $1 == 1042
    ${OrIf} $1 == 2052
      StrCpy $LANGUAGE $1
    ${EndIf}
  ${EndIf}
  ${IfNot} ${RunningX64}
    MessageBox MB_OK|MB_ICONSTOP "$(Need64)"
    Abort
  ${EndIf}
  SetRegView 64
  SetShellVarContext current
FunctionEnd
Section "$(CoreFiles)" Core
  SectionIn RO
  IfFileExists "$INSTDIR\runtime\node.exe" 0 copy_files
    nsExec::Exec '"$INSTDIR\runtime\node.exe" "$INSTDIR\control.mjs" stop'
    Pop $0
    Sleep 1200
  copy_files:
  SetOutPath "$INSTDIR"
  File /r "${PAYLOAD}\*.*"
  WriteRegStr HKLM "Software\Typecast Studio" "InstallDir" "$INSTDIR"
  WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\TypecastStudio" "DisplayName" "Typecast Studio"
  WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\TypecastStudio" "DisplayVersion" "1.1.0"
  WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\TypecastStudio" "Publisher" "Typecast Studio contributors"
  WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\TypecastStudio" "InstallLocation" "$INSTDIR"
  WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\TypecastStudio" "DisplayIcon" "$INSTDIR\TypecastStudio.exe"
  WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\TypecastStudio" "UninstallString" '"$INSTDIR\Uninstall.exe"'
  WriteRegDWORD HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\TypecastStudio" "NoModify" 1
  WriteRegDWORD HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\TypecastStudio" "NoRepair" 1
  WriteUninstaller "$INSTDIR\Uninstall.exe"
  DeleteRegValue HKCU "Software\Microsoft\Windows\CurrentVersion\Run" "TypecastStudio"
  ; Replace owned shortcut folders when upgrading from any language.
  RMDir /r "$SMPROGRAMS\直播花字工作室"
  Delete "$DESKTOP\直播花字工作室.lnk"
  RMDir /r "$SMPROGRAMS\Typecast Studio"
  CreateDirectory "$SMPROGRAMS\Typecast Studio"
  CreateShortcut "$SMPROGRAMS\Typecast Studio\Typecast Studio.lnk" "$INSTDIR\TypecastStudio.exe"
  CreateShortcut "$SMPROGRAMS\Typecast Studio\$(StopService).lnk" "$INSTDIR\TypecastStudio.exe" "--stop"
  StrCpy $2 "User-Guide-en.txt"
  ${If} $LANGUAGE == 1042
    StrCpy $2 "User-Guide-ko.txt"
  ${ElseIf} $LANGUAGE == 2052
    StrCpy $2 "User-Guide-zh-CN.txt"
  ${EndIf}
  CreateShortcut "$SMPROGRAMS\Typecast Studio\$(UserGuide).lnk" "$INSTDIR\$2"
  WriteRegStr HKCU "Software\Typecast Studio" "InstallerLanguage" "$LANGUAGE"
  CreateShortcut "$SMPROGRAMS\Typecast Studio\$(UninstallLabel).lnk" "$INSTDIR\Uninstall.exe"
SectionEnd
Section "$(StartupOption)" Startup
  WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Run" "TypecastStudio" '"$INSTDIR\TypecastStudio.exe" --background'
SectionEnd
Section "$(DesktopOption)" Desktop
  CreateShortcut "$DESKTOP\Typecast Studio.lnk" "$INSTDIR\TypecastStudio.exe"
SectionEnd
Function un.onInit
  SetRegView 64
  StrCpy $LANGUAGE 1033
  !insertmacro MUI_UNGETLANGUAGE
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
  Delete "$DESKTOP\Typecast Studio.lnk"
  RMDir /r "$SMPROGRAMS\Typecast Studio"
  ; Remove only owned program files. Preserve the user's AppData settings.
  Delete "$INSTDIR\TypecastStudio.exe"
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

Unicode true
Name "Typecast Studio"
OutFile "${OUTPUT}"
Icon "${ICON}"
RequestExecutionLevel user
SilentInstall silent
AutoCloseWindow true
ShowInstDetails nevershow
!include "FileFunc.nsh"
!include "LogicLib.nsh"
Var Args
Var Mode
Var AppLanguage
LoadLanguageFile "${NSISDIR}\Contrib\Language files\English.nlf"
LoadLanguageFile "${NSISDIR}\Contrib\Language files\Korean.nlf"
LoadLanguageFile "${NSISDIR}\Contrib\Language files\SimpChinese.nlf"
!include "languages.nsh"
Section
  SetRegView 64
  StrCpy $LANGUAGE 1033
  ReadRegStr $0 HKCU "Software\Typecast Studio" "InstallerLanguage"
  StrCpy $AppLanguage "en"
  ${If} $0 == 1042
    StrCpy $LANGUAGE 1042
    StrCpy $AppLanguage "ko"
  ${ElseIf} $0 == 2052
    StrCpy $LANGUAGE 2052
    StrCpy $AppLanguage "zh-CN"
  ${EndIf}
  SetOutPath "$EXEDIR"
  ${GetParameters} $Args
  StrCpy $Mode ""
  ClearErrors
  ${GetOptions} $Args "--background" $0
  ${IfNot} ${Errors}
    StrCpy $Mode "--no-open"
  ${EndIf}
  ClearErrors
  ${GetOptions} $Args "--stop" $0
  ${IfNot} ${Errors}
    nsExec::Exec '"$EXEDIR\runtime\node.exe" "$EXEDIR\control.mjs" stop'
    Pop $0
    Quit
  ${EndIf}
  nsExec::ExecToStack '"$EXEDIR\runtime\node.exe" "$EXEDIR\server.mjs" $Mode --language=$AppLanguage'
  Pop $0
  Pop $1
  ${If} $0 != 0
    CreateDirectory "$LOCALAPPDATA\Typecast Studio"
    FileOpen $2 "$LOCALAPPDATA\Typecast Studio\startup-error.log" w
    FileWrite $2 "$1"
    FileClose $2
    ${If} $Mode == ""
      MessageBox MB_OK|MB_ICONEXCLAMATION "$(LaunchError)"
    ${EndIf}
  ${EndIf}
SectionEnd

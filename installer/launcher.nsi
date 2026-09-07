Unicode true
Name "直播花字工作室"
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
Section
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
  nsExec::ExecToStack '"$EXEDIR\runtime\node.exe" "$EXEDIR\server.mjs" $Mode'
  Pop $0
  Pop $1
  ${If} $0 != 0
    CreateDirectory "$LOCALAPPDATA\Typecast Studio"
    FileOpen $2 "$LOCALAPPDATA\Typecast Studio\startup-error.log" w
    FileWrite $2 "$1"
    FileClose $2
    ${If} $Mode == ""
      MessageBox MB_OK|MB_ICONEXCLAMATION "程序无法启动。请先退出旧版本，确认 4318 端口未被占用。$\r$\n$\r$\n详细记录：$LOCALAPPDATA\Typecast Studio\startup-error.log"
    ${EndIf}
  ${EndIf}
SectionEnd

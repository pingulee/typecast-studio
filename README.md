# Typecast Studio

[简体中文使用说明](docs/README.zh-CN.md)

A small live-text editor for Chinese-speaking streamers. **English installer and tray menus; Chinese web editor.** Download the installer, open the app and enter your text. No separate Node.js, npm or developer tools are needed.

**[Download the Windows installer](https://github.com/pingulee/typecast-studio/releases/latest)**

## Simple by default

- Start with **one empty text entry**. Click **+ 添加文案** to add more, or the trash icon to return to one. Existing user text is preserved on upgrade.
- Six quick styles, an entrance animation selector and one text-effect selector: **none, fire, waves, dots, animated depth**.
- No special coloring after a colon or on contact IDs, including older saved settings.
- A compact desktop layout designed to fit **1024 × 768** with one entry. Extra entries scroll within their list.
- Transparent web output and transparent PNG / animated GIF / animated WebP. Effects animate around/behind the letters without painting a background.
- A Windows tray icon with **Open editor**, **Open output window** and **Quit**. Double-click to open the editor.
- The Chinese web editor also has **退出程序** to stop the background app and remove its tray icon.

## Install and use

1. Install `Typecast-Studio-Setup-1.4.0.exe`. The entire installer is English, with no language selection dialog.
2. Open **Typecast Studio** from your desktop. The editor opens at `http://localhost:4318` in Chinese.
3. Enter one line of text. Add more with **+ 添加文案** if needed.
4. Choose a style, entrance animation and optional effect. Changes save automatically.
5. Open/copy the transparent output or save WebP, GIF or PNG.

Windows 10/11 x64. The installer includes Node and fonts. The tray uses Windows' included .NET Framework and requires no separate runtime installer on a standard supported Windows installation. Edge or Chrome is used for the separate output window. The installer is unsigned. Program files default to `C:\Program Files\Typecast Studio`; settings are in `%LOCALAPPDATA%\Typecast Studio\settings.json`.

Sign-in startup is checked by default and can be unchecked. Startup shows the tray icon without opening the editor. Windows may place the icon under the taskbar's hidden-icons arrow. Close the browser tab to keep the app running; use **Quit** in the tray or **退出程序** on the page to actually exit.

## Transparency and streaming

The fixed transparent link is `http://localhost:4318/overlay`. The separate output page `/capture` is also transparent; old green/blue/black query parameters no longer add a colored background. Preview checkerboards are never exported.

**Use a web/browser source in streaming software that supports it.** The link updates live and the app must run on the same computer. An ordinary Edge/Chrome window captured by another app does not reliably preserve webpage alpha. We do not claim transparent Douyin window capture.

For Douyin Live Companion, if your version has no compatible web source, use a transparent PNG or supported animated GIF/WebP image source. Animation-file support varies by version, and files are snapshots rather than live-updating links. Actual Douyin compatibility must be checked on the streaming PC. No green/black fallback is added to the output.

WebP preserves partial transparency; GIF has only transparent or opaque pixels, so glow edges may look harder. One text stays visible; multiple entries rotate. Selected background/text effects keep moving and their GIF/WebP exports loop. The app does not translate or rewrite your text.

## Upgrade and uninstall

Quit the previous app before installing this version. Older text entries are retained; delete unwanted entries to use only one. Older interface language preferences now become Chinese, and old contact highlighting is ignored. Preset styling is retained where possible.

Uninstall through Windows installed apps. This removes the app, shortcuts and startup registration, while preserving AppData text settings and the isolated output-browser profile for reinstallation.

## Build from source (developers only)

```sh
npm ci
npm run check
npm run lint
npm test
npm run test:render
npm run build
```

`npm start` launches a local server. Tests above do not listen on network ports. The Windows packaging command is `npm run package:windows`, after installing NSIS and placing `makensis` on PATH (or setting `MAKENSIS`). Windows' C# compiler builds the tray host. Packaging verifies the official Node.js 24.19.0 Windows x64 runtime by SHA-256. Outputs are in `dist/`.

GitHub Actions checks the actual Windows tray/menu, single-instance startup, single/add/delete text, effects, transparent output, web Quit, tray Quit, restart and uninstall. Browser screenshots are captured on the disposable Windows runner. Actual Douyin capture is outside automated tests.

Source: MIT. Noto CJK fonts: SIL OFL. Dependency license notices are included in the installer. No settings, credentials, browser profiles or build caches are committed.

### Animated text effects

Version 1.3 rebuilds the four effects around the actual lettering: turbulent flames with rising embers, refracted wave motion, travelling light particles, and solid shaded 3D lettering with moving reflections. Effects loop continuously on a transparent canvas; exported animations use the same complete cycle. The editor stays compact with one effect selector.

Version 1.3.1 refines fire with upward-flowing turbulence, fixed glyph emitters, thinner fading tips, and fewer embers. WebP exports now render at 30 fps and GIF at 25 fps. Prefer the live transparent source or WebP for soft flame edges; GIF has a hard transparency cutoff.

### Automatic updates (1.4+)

Install 1.4.0 once to enable updates; older versions cannot update themselves. The app checks the public GitHub release 10 seconds after startup and every six hours, downloads newer stable installers in the background, and checks their SHA-256 before running them. No GitHub account is required.

The Chinese editor shows **安装并重启** when ready; click after your stream, then allow the Windows administrator prompt. Installing briefly stops output. The app restarts quietly and open editor/output pages reload the new version. Saved text, startup preference, and desktop shortcut preference are preserved. The tray also has **Check for updates**. Failed connections can be retried without stopping output; canceling the administrator prompt leaves the current app running.

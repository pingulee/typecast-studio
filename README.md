# Typecast Studio

**English** · [한국어](docs/README.ko.md) · [简体中文](docs/README.zh-CN.md)

Animated text for your live stream, with **14 designs, 2 fonts and 10 animations**. Show one line continuously or rotate several entries. Connect a live output window to Douyin Live Companion, or export transparent PNG, GIF and WebP files.

## Download and install

**[Download the Windows installer](https://github.com/pingulee/typecast-studio/releases/latest)**

Download `Typecast-Studio-Setup-1.1.0.exe`, install it, and open **Typecast Studio** from your desktop. **You do not need to install Node.js, npm, Python or any developer tools. No commands or account are required.** The installer includes its own runtime and Chinese/Korean-capable fonts. Daily use works offline.

- Windows 10/11 x64. Edge or Chrome is needed for the separate output window.
- The installer starts in **English**, with a choice of **English / 한국어 / 简体中文**. It remembers the last installer language.
- The editor uses your installation language on first use. Choose a different language in the top bar; it saves automatically. Changing the interface language never translates or replaces your own text.
- Without an installation preference, the default is English. Existing 1.0 settings are preserved and use English until you select another language.
- Default location: `C:\Program Files\Typecast Studio`. Installation needs administrator confirmation.
- **Start automatically when I sign in** is selected by default; you can uncheck it. Startup runs the background service without opening a browser or output window.
- The installer is not code-signed; Windows may show a publisher warning.

## Connect Douyin Live Companion

1. Enter your text, then select a design and animation.
2. Under **Connect Douyin Live Companion**, choose a green/blue/black background and click **Open output window**.
3. In Douyin, choose **Add source → Window (添加素材 → 窗口)** and select the Typecast Studio output window. Its title follows your editor language.
4. If available for that source, enable **Chroma key (绿幕抠图 / 颜色抠图)**. Sample the background color and crop the title bar/borders.
5. Position the text. Later changes in the editor appear automatically in the output window.

Use blue behind green text and green behind blue text. Keep the output window open and do not minimize it. Capture behavior depends on your graphics hardware and streaming software version.

Douyin menus and chroma key availability vary. If the window source has no chroma key option, use a black background or export transparent PNG and add an image source. GIF/WebP source support also depends on the Douyin version. This is an independent tool, not an official Douyin plugin. Actual capture/chroma key should be checked on your streaming PC.

[Official Douyin chroma key guide](https://streamingtool.douyin.com/docs/guide_ztb12xj7)

## Fixed links and live updates

Run Typecast Studio and your streaming software on the **same computer**.

| Page | Address |
| --- | --- |
| Editor | `http://localhost:4318` |
| Green output | `http://localhost:4318/capture?key=green` |
| Blue output | `http://localhost:4318/capture?key=blue` |
| Black output | `http://localhost:4318/capture?key=black` |
| Transparent web output | `http://localhost:4318/overlay` |

The transparent link is for software that supports web sources. Do not assume every Douyin version accepts arbitrary web links. A captured window itself does not preserve web alpha; use chroma key when supported. These local links are not public internet pages.

## Text, designs and animation

- **One entry is enough.** Stay visible plays the entrance once and keeps the text on screen; pulse and scrolling continue moving. Select repeat to loop the chosen effect.
- Multiple entries rotate one at a time. Blank entries are skipped; all blank means no text.
- Up to 8 entries, 160 characters each. Line breaks become spaces; long text shrinks to fit one line.
- Animations: slide up, slide down, slide sideways, fade, pop in, reveal wipe, typewriter, gentle pulse, scrolling marquee, instant cut.
- Designs: Golden 3D, Crystal Blue, Neon Purple, Outlined White, Rose Gold, Flame Orange, Jade Green, Mirror Silver, Comic Pop, Cyber Glow, Pearl Serif, Candy Pink, Classic Outline, Custom Color.
- Adjust font, size, outline, extrusion, glow, alignment, timing and contact ID highlighting.

![Text design examples](docs/designs.png)

## Save, export and close

Changes save and sync after about 0.6 seconds. Settings, including the interface language, live in `%LOCALAPPDATA%\Typecast Studio\settings.json`, outside Program Files. The output window uses its own browser profile, separate from your regular browser accounts.

Export transparent PNG, animated GIF or animated WebP. WebP preserves partial transparency; GIF has only transparent/opaque pixels, so soft glow/fades may have harder edges. A single text set to stay visible exports a one-time entrance; pulse, scrolling and repeating modes loop. PNG exports the full current entry. The preview checkerboard is never exported.

Closing the editor tab leaves the background service running. Use **Start menu → Typecast Studio → Stop background service** to stop it. Disable automatic startup in **Windows Settings → Apps → Startup**. Uninstall from Windows installed apps; this removes program files, shortcuts and startup registration but preserves your AppData settings/profile for reinstallation.

To upgrade, stop the old service and install the new EXE. If port 4318 is occupied, exit the old version first. To migrate a portable version, stop both apps and copy its `data/settings.json` to the AppData location above. Missing new settings use defaults.

## For developers only

Regular users only need the installer. The commands below build from source with Node.js 24.

```sh
npm ci
npm run check
npm run lint
npm test
npm run test:render
npm run build
npm start
```

`npm start` starts a local server. Build/check/test do not listen on network ports. The app uses React, Vite, Canvas and a local Node HTTP/SSE service.

To build the installer, install NSIS and put `makensis` on PATH (or set `MAKENSIS` to its full path), then run `npm run package:windows` after building. The script downloads and verifies the official Node.js 24.19.0 Windows x64 runtime. `TYPECAST_NODE_EXE` can point to an existing download; SHA-256 is still checked. Installers appear in `dist/`.

GitHub Actions builds on Windows and checks installation, language selection/persistence, startup registration, service startup, configuration updates, restart and uninstall in all three languages. Tests also cover API/SSE persistence, translation coverage, canvas rendering and GIF/WebP encoding. Actual Douyin capture is not part of automated tests. Optional WebMCP is only registered in browsers that support it.

Source: MIT. Fonts: Noto Sans CJK / Noto Serif CJK, SIL OFL; see `public/fonts/`. Dependencies retain their licenses; the installer includes license notices. User settings, profiles, runtime caches and build outputs are not committed to the repository.

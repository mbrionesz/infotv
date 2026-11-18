# XuperWindows Tester · libmpv

`XuperMpvHost.exe` is a separate GPL-2.0-or-later playback utility, built from `desktop/mpv-host.cs`. It dynamically uses the unmodified `libmpv-2.dll` distribution below. The application communicates over inherited JSON-lines pipes; no external player executable, HTTP controller, Lua scripts or downloaded scripts are started.

Pinned binaries and SHA256: `desktop/libmpv-dependencies.json`.

Corresponding source/build recipes:

- https://github.com/shinchiro/mpv-winbuild-cmake/tree/20261111
- https://github.com/shinchiro/mpv-winbuild-cmake/releases/tag/20261111
- https://github.com/mpv-player/mpv/tree/bcde6b93cc
- https://github.com/FFmpeg/FFmpeg/tree/cd4e96eb3
- https://github.com/mpv-player/mpv/blob/bcde6b93cc/LICENSE.GPL

The full GPL text and mpv copyright notice are included next to the DLL and controller. Source of the controller is included in the tester source archive. No proprietary programmes, licenses or authorizations are provided by the decoder.

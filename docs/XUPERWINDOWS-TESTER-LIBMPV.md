# Tester 0.1.14 Test libmpv

Experimental Windows 10/11 x64 and x86 build. Uses the current XuperWindows GUI, with a separate helper that links the libmpv C API. No external mpv application is opened. TV retains the existing browser playback path.

The tester has its own installer identity and profile (`XuperWindows Tester`), so production favorites and progress are not migrated or overwritten. Close the normal application before comparing the same title.

The controller reports measured demuxer cache duration and bytes. Forward cache targets 180 seconds, capped at 64 MiB on x64 or 32 MiB on x86, with 8 MiB for backward reads. These are goals and limits, not a guarantee of three minutes at every bitrate. Playback does not wait for the entire target to fill. Authenticated requests and byte ranges still pass through the app's secure-DNS proxy with Host/SNI and TLS verification.

The existing controls support pause/resume, timeline and typed-minute seeking, audio selection, external subtitles and font/size/color. Native subtitle rendering receives the GUI preferences. Diagnostic copies identify `engine: libmpv`, measured cache, seek status, FPS and track selections.

Reproducible build: `.github/workflows/windows-libmpv-tester.yml`. Pinned upstream binaries and hashes: `desktop/libmpv-dependencies.json`. Third-party license/source notices ship alongside the DLL. This test does not establish provider performance, physical audio output or decoding performance on every computer.

Test fixtures cover HEVC/AAC, two audio track selections, SRT on/off and font/color settings, authenticated HTTP byte ranges and random seeks at 40/110/60 minutes in a synthetic two-hour stream. Separate Electron screen captures require visible colored video inside the app-owned window for x64 and x86; advancing an audio clock alone does not pass.

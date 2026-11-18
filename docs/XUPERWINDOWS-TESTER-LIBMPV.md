# Tester 0.1.14 Test libmpv

Experimental Windows 10/11 x64 build. The i686 upstream DLL failed initialization in validation, so no 32-bit tester is distributed. The normal x86 VLC build remains available. Uses the current XuperWindows GUI, with a separate helper that links the libmpv C API. No external mpv application is opened. TV retains the existing browser playback path.

The tester has its own installer identity and profile (`XuperWindows Tester`), so production favorites and progress are not migrated or overwritten. Close the normal application before comparing the same title.

The controller reports measured demuxer cache duration and bytes. Forward cache targets 180 seconds, capped at 64 MiB, with 8 MiB for backward reads. These are goals and limits, not a guarantee of three minutes at every bitrate. Playback does not wait for the entire target to fill. Authenticated requests and byte ranges still pass through the app's secure-DNS proxy with Host/SNI and TLS verification.

The existing controls support pause/resume, timeline and typed-minute seeking, audio selection, external subtitles and font/size/color. Native subtitle rendering receives the GUI preferences. Diagnostic copies identify `engine: libmpv`, measured cache, seek status, FPS and track selections.

Reproducible build: `.github/workflows/windows-libmpv-tester.yml`. Pinned upstream binaries and hashes: `desktop/libmpv-dependencies.json`. Third-party license/source notices ship alongside the DLL. This test does not establish provider performance, physical audio output or decoding performance on every computer.

Test fixtures cover HEVC/AAC, two audio track selections, SRT on/off and font/color settings, authenticated HTTP byte ranges and random seeks at 40/110/60 minutes in a synthetic two-hour stream. Separate Electron screen captures require visible colored video inside the app-owned window for x64; advancing an audio clock alone does not pass.

The hosted Windows visual runner has no hardware video device or audio endpoint. Its Electron test explicitly uses software decoding and a null audio sink; it still requires visible video from the real DLL in an app-owned HWND. Normal installations retain automatic hardware selection and real audio output.

The mpv surface avoids Electron's layered-window mouse passthrough style, which prevents Direct3D presentation on some systems. The native surface is clipped away from the HTML controls and hidden for menus, and pointer polling still reveals the playback controls. The normal VLC surface is unchanged.

The tester uses mpv's Direct3D 11 GPU renderer inside the owned surface. Decoder, audio, subtitles, cache and seeking remain libmpv; no libVLC library is loaded by the tester. Parent window child clipping prevents the host background from painting over native video.

The native mpv child is kept above Electron's internal `Intermediate D3D Window`. Without this sibling Z-order correction, the host backing window can cover decoded video with a black rectangle. Position, size, menu clipping and focus stay under the application's control.

## Verified tester build

Source: `v0.1.14-test-libmpv.10`. [Windows validation and packaging run](https://github.com/mbrionesz/infotv/actions/runs/44228544595) completed successfully. 347 core tests and 34 desktop tests passed. The real DLL passed HEVC/AAC, Spanish/English tracks, SRT on/off, font/size/color, paused seeks, resume checkpoint and EOF checks. A two-hour synthetic source confirmed 40/110/60-minute seeks, including from packaged resources. The Electron screen capture showed the native video visibly rendered inside the owned window after the sibling Z-order correction.

[Download Windows x64 tester](https://github.com/mbrionesz/infotv/releases/download/v0.10.21-beta.6/XuperWindows-Tester-0.1.14-Test-libmpv-x64-Setup.exe).

Installer SHA256: `1360eafcf6bf3bbababfcd9c55e192ecbb2dadc3515d593f34f0513734c5ae99`. Downloaded artifact matched the workflow checksum and published asset digest. Existing production installers and Tizen WGT remained unchanged. Compare actual provider startup and buffering on the user's PC; local fixture seek timings are not provider latency measurements.

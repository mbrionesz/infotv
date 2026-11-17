# Controlador propio XuperWindows 0.1.8

El ejecutable XuperMediaHost se compila desde `desktop/media-host.cs`. Enlaza dinámicamente los libVLC oficiales siguientes y no modifica sus binarios. Utiliza la API de reproducción/HWND; no inicia la interfaz Lua/HTTP ni una interfaz gráfica de VLC. Permanecen incluidas las licencias y avisos de la distribución oficial y sus fuentes correspondientes.

# XuperWindows 0.1.5: VLC 3.0.24 integrado (x64 y x86)

La distribución 0.1.5 utiliza los binarios oficiales sin modificar de VideoLAN en ambas arquitecturas. Se incluyen las licencias, plugins y avisos de sus archivos oficiales. La interfaz dummy permite incrustar el vídeo mediante HWND y no muestra la interfaz de VLC. Checksums y descargas: `native-dependencies.json`.

Fuente correspondiente: https://download.videolan.org/pub/videolan/vlc/3.0.24/vlc-3.0.24.tar.xz
Repositorio: https://code.videolan.org/videolan/vlc/-/tree/3.0.24

## Información conservada sobre versiones anteriores que incluían mpv

# mpv / FFmpeg — XuperWindows native decoder

mpv is a separate executable, launched only as a codec-compatible playback backup. It is not modified. Upstream copyright, license and documentation files from its distribution are retained alongside the executable. This component is free software; no warranty is provided.

Binary distribution, date and checksums: `native-dependencies.json` and the packaged `build-provenance.json`.

Corresponding source and build instructions for this distribution:

- Build recipes, toolchain and dependency recipes: https://github.com/shinchiro/mpv-winbuild-cmake/tree/20261003
- mpv, exact revision: https://github.com/mpv-player/mpv/tree/3186d369f9
- FFmpeg, revision reported by the build release: https://github.com/FFmpeg/FFmpeg/tree/98e92563a
- Source releases and complete recipe repository: https://github.com/shinchiro/mpv-winbuild-cmake/releases/tag/20261003
- mpv GPL text: https://github.com/mpv-player/mpv/blob/3186d369f9/LICENSE.GPL

These source locations are provided next to the downloadable Windows release as well. XuperWindows does not claim ownership of these components. Proprietary media or a source's authorization are not supplied by this decoder.

Windows x86 incluye VLC 3.0.24 oficial de VideoLAN, tras fallar la inicialización del otro binario x86. Se conservan sus licencias dentro del directorio del motor. Fuente correspondiente y recetas contrib: https://download.videolan.org/pub/videolan/vlc/3.0.24/vlc-3.0.24.tar.xz . Windows x64 usa mpv. Ambos se conectan mediante el proxy con DNS seguro.

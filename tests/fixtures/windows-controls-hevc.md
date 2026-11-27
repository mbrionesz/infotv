Local two-minute controls fixture, remuxed without re-encoding from
`windows-dual-audio.mp4` (HEVC test pattern with Spanish and English AAC tracks):

```
ffmpeg -stream_loop 11 -i windows-dual-audio.mp4 -t 120 -map 0 -c copy -movflags +faststart windows-controls-hevc.mp4
```

Used in the actual Electron/native Windows GUI to test mouse overlays and single-click track selection without accessing a portal.

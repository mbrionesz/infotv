Synthetic HEVC MPEG-TS test source, two hours, 192x108, 1 FPS, no audio. Tests long timestamp seeks and HTTP ranges, not high-bitrate throughput. Audio is tested by windows-hevc.ts. Generated locally with FFmpeg testsrc2 (no third-party programme content).

Command:

```sh
ffmpeg -f lavfi -i 'testsrc2=size=192x108:rate=1' -t 7200 -an -c:v libx265 -preset ultrafast -x265-params 'pools=none:frame-threads=1:log-level=error:keyint=5' -threads 1 -muxdelay 0 -f mpegts windows-long-hevc.ts
```

SHA256: `bbc281f6d4cf837669f1d6ffdd7050d34fdea667805d4898e1c8c0ed4dd441b4`

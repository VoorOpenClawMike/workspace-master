---
name: render_tiktok_vertical_budget_video
description: "Render TikTok-ready vertical videos (1080x1920) with VO + music via ffmpeg. Trigger with command payload JSON containing tool + params."
metadata: { "openclaw": { "emoji": "🎬", "events": ["message:received"] } }
---

# render_tiktok_vertical_budget_video

This hook accepts a JSON payload in a command message:

```json
{
  "tool": "render_tiktok_vertical_budget_video",
  "params": {
    "video_file": "assets/video/skyline_generic_vertical.mp4",
    "voiceover_file": "assets/audio/vo_d01_nl.wav",
    "music_file": "assets/audio/music_d01_bg.wav",
    "output_file": "output/tiktok_nl_D01_budgetbreakdown_350k_haarlem_final.mp4"
  }
}
```

Optional params:
- `music_volume` (default: `0.25`)
- `enable_music_fade` (default: `true`)
- `fade_in_duration` (default: `1.5`)
- `fade_out_duration` (default: `2.0`)
- `target_width` (default: `1080`)
- `target_height` (default: `1920`)
- `video_crf` (default: `20`)
- `video_preset` (default: `veryfast`)
- `audio_bitrate_kbps` (default: `192`)
- `normalize_mix` (default: `true`)

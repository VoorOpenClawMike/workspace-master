---
name: video-ffmpeg-pipeline
version: 0.1.0
description: >
  Wrapper rond de bestaande video-rendering pipeline (TTS + FFmpeg).
  Zet JSON-scripts om naar MP4-video's met voiceover, B-roll en text overlays.
permissions:
  - fs:read
  - fs:write
  - process:spawn
tags:
  - video
  - ffmpeg
  - tts
  - rendering
---

# Video FFmpeg Pipeline

## Purpose

Standaard video-rendering workflow: Input JSON-script → Output verticale 9:16 MP4-video (TikTok/Reels/Shorts-ready).

Gebruikt voor alle video's die voice-over + B-roll + text overlays nodig hebben. Productie-kwaliteit renders (1080x1920, 30fps, H.264).

## Inputs

- **Script:** script_[video_id].json (zie pipeline_spec.json format)
- **Video ID:** Unieke identifier (bijv. D07)
- **Assets (optioneel):** B-roll clips, muziek

## Outputs

- **Video:** output/[video_id].mp4
- **Artifacts:** output/vo_[video_id]_nl.wav (voiceover), output/[video_id]_thumb.jpg (thumbnail)
- **Metadata:** output/[video_id]_meta.json

## Behaviour

### 1. Text-to-Speech (TTS)

Gebruikt Edge-TTS (Microsoft, gratis):
```
edge-tts --text "Volledige narration" --voice nl-NL-FennaNeural --write-media output/vo_D07_nl.wav
```

Voice options: nl-NL-FennaNeural (vrouwelijk), nl-NL-MaartenNeural (mannelijk), en-US-JennyNeural (Engels). Configuratie via .env → TTS_VOICE.

### 2. FFmpeg Video Render

Combineert voiceover (WAV) + B-roll clips (MP4) + text overlays (DrawText) + muziek (optioneel, geduckt). Zie pipeline/render_all.mjs voor implementatie.

### 3. Quality Checks

Na render: controleer bestandsgrootte (8-15 MB verwacht), duur (moet matchen met script), audio-sync. Als checks falen → log error, retry 1x.

## Error Handling

- **TTS fails:** Retry na 10 sec (max 3x), fallback naar pre-recorded voiceover
- **FFmpeg fails:** Gebruik placeholder clip (assets/placeholder_vertical.mp4) als B-roll ontbreekt
- **Output te groot (> 20 MB):** Re-render met hogere compressie (-crf 28)

## Performance

Typische render-tijd (30-sec video): TTS 5-10 sec, FFmpeg 30-60 sec, totaal ~1 minuut. Parallelle renders: 3-5 video's tegelijk (CPU-afhankelijk).
 
# SKILL

_Content volgt - zie Perplexity output voor volledige content._

---
name: video-sora2-generator
version: 0.1.0
description: >
  Genereert video's via OpenAI Sora 2 API (text-to-video of image-to-video).
  Optimaliseert prompts voor realistische scenes, camera control en audio sync.
permissions:
  - net:outbound
  - fs:write
tags:
  - video
  - sora2
  - ai-generation
---

# Video Sora 2 Generator

## Purpose

Gebruik deze skill wanneer je video-content wilt genereren via OpenAI Sora 2, vooral voor:
- B-roll clips (drone shots, establishing shots, interiors)
- Hero shots waar stock footage niet volstaat
- Unieke visuals die moeilijk te filmen zijn

**Niet gebruiken voor:**
- Volledige video's met voice-over (gebruik video-ffmpeg-pipeline daarvoor)
- Simpele text overlays (FFmpeg is goedkoper)

## Inputs

- **Type:** text-to-video of image-to-video
- **Prompt:** Gedetailleerde scene-beschrijving (zie openai/sora2-prompts.md)
- **Duration:** 15-25 seconden
- **Aspect ratio:** 16:9, 9:16, of 1:1
- **Style:** realistic, cinematic, documentary, animation
- **Camera control (optioneel):** drone, tracking, static, pan, etc.

## Outputs

- Video-bestand (MP4, 1080p)
- Metadata JSON met sora_job_id, prompt, duration, cost

## Behaviour

### 1. Prompt Engineering
Leest input-prompt en optimaliseert met gpt-4o: voegt camera-beweging, lighting en audio-cues toe. Valideert tegen Sora 2 best practices.

### 2. API Call
Roept OpenAI Sora 2 API aan met model "sora-2", geoptimaliseerde prompt, duration, aspect_ratio en style. Polling voor status (1-3 min).

### 3. Post-Processing
Download video, sla op in assets/sora2/[scene_id].mp4, log metadata in logs/sora2-renders.json.

## Error Handling

- **API fails:** Retry 1x na 30 sec, fallback naar stock footage (Pixabay/Pexels)
- **Prompt rejected:** Log rejection, genereer alternatieve prompt, retry 1x
- **Output quality laag:** Detectie via gpt-4o-vision, regenereer als < 70% quality score

## Cost Management

Sora 2 kost ~$0.40-0.60 per 20-sec clip. Cache succesvolle clips, batch genereren, fallback naar stock als budget overschreden. Log elke call in logs/sora2-costs.json. Wekelijkse limiet: $50 (configureerbaar in .env).

## Integration met FFmpeg Pipeline

Sora 2 output = B-roll input voor FFmpeg. Voorbeeld: assets/sora2/haarlem_drone.mp4 → FFmpeg combineert met voiceover → output/D07_final.mp4
 
# SKILL

_Content volgt - zie Perplexity output voor volledige content._

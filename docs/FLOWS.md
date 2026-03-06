# User Flows

Concrete voorbeelden van hoe taken door de workspace stromen.

## Flow 1: Volledige Video-Cyclus (D07)

Goal: Maak nieuwe TikTok-video over hypotheek-tips.

1. User → Telegram: "/video D07 Hypotheek tips voor starters"
2. Manager checkt pipeline_spec.json → D07 niet aanwezig → volledige cyclus (7 stappen)
3. STEP-01 Trend Research: Trend-Research Agent doet web-search → trend_report_D07.json
4. STEP-02 Content Planning: Content-Planner Agent → content_plan_D07.json (format, hook, structure, 32 sec)
5. STEP-03 Script Writing: Script-Writer Agent → script_D07.json (3 scenes, narration)
6. STEP-04 Compliance Check: Compliance-Quality Agent → {status: "approved"}
7. STEP-05 Visual Assets: Visual-Asset Agent → visual_brief_D07.json (B-roll search keywords)
8. STEP-06 Video Production: Video-Production Agent roept video-ffmpeg-pipeline skill aan → TTS (8 sec) → FFmpeg render (52 sec) → output/D07.mp4 (13.2 MB, 32 sec)
9. STEP-07 Publishing Plan: Publishing-Analytics Agent → publishing_plan_D07.json (caption, hashtags, scheduled_time)
10. Manager → User via Telegram: "🎉 Video D07 klaar! [D07.mp4 preview]"

## Flow 2: Quick Render (bestaande video)

Goal: Render video die al in pipeline_spec.json staat.

1. User → Telegram: "/video D03"
2. Manager checkt pipeline_spec.json → D03 bestaat ✅ → direct render (2 stappen: TTS + render)
3. Video-Production Agent: TTS (vo_D03_nl.wav) → FFmpeg (output/D03.mp4) → 60 sec totaal
4. Manager → User: "✅ Video D03 klaar! [D03.mp4]"

Totale tijd: ~1 minuut.

## Flow 3: Campagne (grote taak)

Goal: Maak 5 video's voor Q2-campagne over vastgoed-tips.

1. User → Telegram: "/orchestrate Maak 5 vastgoed-video's voor Q2: budgetteren, hypotheek, keuring, wijkkeuze, onderhoud"
2. Manager maakt plan met 35 stappen (7 stappen × 5 video's), parallellisatie waar mogelijk
3. Uitvoering: Trend research 1x (30 sec), Content planning 5x parallel (2 min), Script writing 5x parallel (3 min), Compliance 5x sequentieel (5 min, D10 needs revision → retry → approved), Visual briefs 5x parallel (2 min), Video production 5x sequentieel (10 min), Publishing plans 5x parallel (2 min)
4. Manager → User (na ~24 min): "🎉 Campagne Q2 klaar! 5 video's (D08-D12), publishing-schema, alle bestanden in output/runs/RUN-2026-03-06-Q2/"

## Flow 4: Promo-Content Genereren

Goal: Titels, hooks en hashtags voor bestaande video.

1. User uploadt video D05.mp4, reply met "/promo"
2. Manager: promo-taak, geen volledige video-cyclus → 1 stap (skill aanroepen)
3. Promo-Content-Writer Skill: input video metadata → genereert 3 titels, 3 hooks, beschrijving kort/lang, hashtags (trending/niche/branded), CTA
4. Manager → User (binnen 10 sec): "📝 Promo Content voor D05 [titels, hooks, beschrijving, hashtags, CTA]"

## Flow 5: Error Handling (Compliance Reject)

Goal: Script wordt afgekeurd, moet aangepast.

1. Normal flow tot STEP-04
2. STEP-04 Compliance rejected: "⚠️ D10 bevat claim 'gegarandeerde besparing' zonder disclaimer → misleiding → terugsturen naar Script-Writer, Retry 1/2"
3. Manager → Script-Writer (retry): input script_D10.json + compliance_feedback.json → Script-Writer past aan ("gegarandeerde" → "mogelijke", voegt disclaimer toe)
4. STEP-04 retry: Compliance approved "✅ D10 aangepast, voldoet nu"
5. Workflow vervolgt normaal

Fallback: Als 2e retry faalt → Manager escaleert naar user: "❌ D10 voldoet niet na 2 pogingen. Acties: /fix D10 / /skip D10 / /pause"

## Flow 6: Batch Render

Goal: Render alle video's in pipeline_spec.json tegelijk.

1. User → Telegram: "/video all"
2. Manager leest pipeline_spec.json → 5 video's (D01, D02, D03, D05, D06) → plan: 5 parallelle renders (of sequentieel als resources beperkt)
3. Video-Production Agent (batch mode): roept pipeline/render_all.mjs aan → for each video: TTS + FFmpeg render
4. Progress updates: "🎬 Batch render: 1/5 klaar (D01)", "2/5 (D02)", etc.
5. Manager → User (na ~5 min): "🎉 Batch render voltooid! 5/5 videos klaar (59.4 MB totaal)"

 

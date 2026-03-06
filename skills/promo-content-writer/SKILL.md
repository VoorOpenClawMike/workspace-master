---
name: promo-content-writer
version: 0.1.0
description: >
  Genereert platform-specifieke promo-content: titels, hooks, beschrijvingen,
  hashtags en CTA's voor TikTok, Reels, Shorts en andere social media.
permissions:
  - none
tags:
  - marketing
  - copywriting
  - social-media
---

# Promo Content Writer

## Purpose

Gebruik deze skill om marketing-copy te genereren voor video's of posts, geoptimaliseerd per platform.

Use cases: Titels en hooks voor nieuwe video's, captions voor TikTok/Reels/Shorts, hashtag-sets (trending + niche), call-to-actions.

## Inputs

- **Content beschrijving:** Korte samenvatting (of video-metadata)
- **Platform:** TikTok, Reels, Shorts, LinkedIn, Twitter/X
- **Tone:** casual, educatief, grappig, professioneel, urgent
- **Target audience:** starters, investeerders, makelaars, etc.

## Outputs

JSON met titles (3 varianten), hooks (3 varianten), description_short, description_long, hashtags (trending/niche/branded), CTA.

## Behaviour

### 1. Analyse Input
Begrijp content-kern, identificeer hook-moment (drama/curiosity/value), match tone met platform (TikTok = casual, LinkedIn = professioneel).

### 2. Titel Generatie (3 varianten)
Formules: Curiosity ("Deze truc bespaart je €10k"), Value ("5 hypotheek-hacks"), Urgency ("Stop met dit te doen"), Question ("Hoeveel kost een huis echt?"). Max 60 tekens, emoji's max 2, cijfers gebruiken.

### 3. Hook Generatie (eerste 3 sec)
Formules: Statement, Question, Challenge, Shock. Hook moet binnen 3 sec klaar zijn (TikTok attention span).

### 4. Beschrijving (2 versies)
Kort (TikTok/Reels): 1-2 zinnen, direct, CTA aan eind. Lang (YouTube/LinkedIn): 3-5 zinnen, meer context, SEO-keywords, professionele tone.

### 5. Hashtags (platform-specifiek)
TikTok: 5-10 hashtags (2 mega-trending + 3 niche + 1 branded). Instagram Reels: 8-15 hashtags (niche > trending). YouTube Shorts: 3-5 hashtags max.

### 6. CTA Generatie
Types: Engagement ("Deel dit!"), Follow ("Volg voor tips"), Save ("Save deze video"), Comment ("Drop je budget"). Platform-tips: TikTok = engagement, Reels = save, Shorts = subscribe.

## Platform-Specific Optimization

- **TikTok:** Casual, kort (1-2 zinnen), 5-7 hashtags trending > niche, CTA = engagement
- **Instagram Reels:** Aesthetisch, 2-3 zinnen, 8-12 hashtags niche-focus, CTA = save/share
- **YouTube Shorts:** Educatief, 3-4 zinnen, 3-5 hashtags keywords, CTA = subscribe
- **LinkedIn:** Professioneel, lang (5-10 zinnen), 3-5 hashtags industry, CTA = connect

## Quality Checks

Titel < 60 tekens met hook-woord. Hook < 15 woorden met intrigue/vraag. Hashtags geen banned hashtags. CTA duidelijk en actionable.
 
# SKILL

_Content volgt - zie Perplexity output voor volledige content._

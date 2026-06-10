# VISION — MVP_AI

## One-liner
Turn a single image + a text prompt into a short, shareable AI video — in seconds,
with no editing skills.

## Product
A web app where a user:
1. Uploads a still frame (keyframe).
2. Describes motion, mood, pacing in text.
3. Picks duration (10s / 15s) and options.
4. Gets an async-rendered video preview, stored in their account/gallery.

## Target audience
- Content creators / social media (short vertical clips).
- Small marketers needing quick promo motion from a single asset.
- Hobbyists experimenting with AI video.

## Business model — Hybrid (plans + credits)
- **Plans** (FREE / PRO / PREMIUM): monthly credit allowance + feature gates
  (max duration, resolution, watermark on/off, queue priority).
- **Credits**: each video costs N credits; users can buy top-up packs.
- **Stripe**: subscriptions for plans, one-time payments for credit packs.
- FREE tier outputs are watermarked (industry standard, e.g. Luma/Pika).

## Why we win (positioning)
- Dead-simple UX (one image + one prompt).
- Neon/cinematic brand identity already started in the UI.
- Provider-agnostic backend: start on cheap/free models, swap to premium
  (Kling/Veo/Sora via fal.ai) with no app rewrite.

## Non-goals (for now)
- Full timeline video editor.
- Self-hosted GPU models (no local NVIDIA hardware).
- Mobile native apps.

## Success signals (MVP)
- A user can sign in, generate a real video end-to-end, see it in their gallery.
- Credits are correctly charged only on success.
- A paying user can subscribe and buy credits via Stripe.

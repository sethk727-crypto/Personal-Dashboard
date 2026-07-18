# LifeOS // Terminal

A zero-dependency personal command center, served straight from this repo by GitHub Pages.
Vanilla HTML/CSS/ES-module JavaScript — no build step, no framework, no npm install.

**Live site:** https://sethk727-crypto.github.io/Personal-Dashboard/

---

## Modules

| Module | Source of truth | What it does |
|---|---|---|
| **MOD-01 · Nutrition Telemetry** | `nutrition/macros.json` | Calories tracked / remaining / deficit delta, protein bar vs the 180g floor, meal log, and the ΔE = Energy In − Energy Out deficit doctrine |
| **MOD-02 · Voice-Note Timeline** | `notes/index.json` + `notes/*.md` | Every clean phone transcript, urgency-tagged and expandable; corrupt payloads are quarantined and counted |
| **MOD-03 · Schedule Tracker** | `data/calendar.json` | Today's blocks (academic / internship / networking / athletic / project) with a live NOW line and past/live/upcoming states |
| **MOD-04 · Critical Comms** | `data/emails.json` | Urgency-weighted (1–10) critical email triage; newsletter/receipt noise pre-suppressed |
| **MOD-05 · Action Command Board** | compiled from `notes/*.md` | Every `- [ ]` task ever spoken into the phone, deduped and urgency-ranked, with tap-to-complete (persisted in localStorage) and an auto-generated Daily Brief |

The page re-syncs all data streams every 5 minutes and re-evaluates schedule states every 60 seconds.

## Talk on your phone → it publishes to the site

The capture pipeline, end to end:

```
you speak on phone
      │
      ▼
n8n workflow (transcription webhook)
      │  commits notes/voice_note_<timestamp>.md
      ▼
GitHub Action: Rebuild Notes Manifest (.github/workflows/notes-manifest.yml)
      │  regenerates notes/index.json
      ▼
GitHub Pages redeploys main
      │
      ▼
live dashboard shows the transcript + its action items (within ~1–2 min)
```

Once the note lands in `notes/`, **everything after that is automatic** — the manifest
action and the Pages redeploy require zero manual steps.

### ⚠️ Fixing the n8n corrupt-payload fault

Most existing notes arrived as the literal text `{{ $json.content.parts[0].text }}` instead
of the actual transcript. That means the **file-content field in the n8n GitHub node is in
"Fixed" mode, not "Expression" mode**, so the template string is committed verbatim instead
of being evaluated.

Fix (≈10 seconds, in the n8n editor):

1. Open the workflow and click the **GitHub** node (the one that creates `notes/*.md`).
2. Find the **File Content** parameter.
3. Hover over the field and flip the toggle from **Fixed** to **Expression** (or make sure the
   value starts with `=`), so it reads: `={{ $json.content.parts[0].text }}`.
4. Save and run once from your phone — the new note should contain real text.

The dashboard shows a **PIPELINE FAULT** chip on MOD-02 while quarantined payloads outnumber
clean transcripts, so you'll see at a glance when the fix has taken.

## Data contracts

- `nutrition/macros.json` — `targets{calories, protein_g, …}`, `consumed{…}`, `meals[]`, `hydration_oz`, `last_sync`
- `notes/index.json` — `{ generated, source, files[] }` (maintained automatically by the manifest action)
- `data/calendar.json` — `week[]` of `{ day, items[{start, end, title, category, location, detail}] }`
- `data/emails.json` — `triage{scanned, suppressed}`, `threshold`, `critical[{sender, subject, received, urgency, tag}]`

All fetches use strict relative paths, so the site also works from any static server
(`python3 -m http.server`) with no configuration.

## Deployment

GitHub Pages → **Deploy from a branch** → `main` / root. `.nojekyll` is committed so raw
`.md` files are served as-is. Every push to `main` redeploys automatically.

## Repo automation

- `.github/workflows/notes-manifest.yml` — rebuilds `notes/index.json` on any note commit
- `.github/workflows/morning-briefing.yml` — bi-daily email synthesis of the last 12h of notes

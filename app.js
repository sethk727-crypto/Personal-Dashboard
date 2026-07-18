/* ============================================================================
   LIFEOS // TERMINAL — APPLICATION ENGINE
   Vanilla ES module · zero dependencies · GitHub Pages relative pathing
   Modules: clock/ticker core, nutrition telemetry, voice-note timeline,
            schedule tracker, email triage, action command board
   ========================================================================== */

/* ------------------------------ CONFIG ------------------------------------ */
const CONFIG = {
  paths: {
    macros: "./nutrition/macros.json",
    notesIndex: "./notes/index.json",
    notesDir: "./notes/",
    calendar: "./data/calendar.json",
    emails: "./data/emails.json",
  },
  proteinFloorG: 180,
  emailThreshold: 6,
  fetchTimeoutMs: 8000,
  dataRefreshMs: 5 * 60 * 1000, // full telemetry re-sync every 5 minutes
  scheduleTickMs: 60 * 1000, // temporal state re-evaluation every 60 seconds
  taskStoreKey: "lifeos.actionState.v1", // localStorage key for action check-offs
};

/* ------------------------------ STATE -------------------------------------- */
const state = {
  bootedAt: Date.now(),
  macros: null,
  notes: [],
  notesSuppressed: 0,
  calendar: null,
  scheduleDay: null,
  scheduleFromCache: false,
  notesSignature: null,
  emails: null,
  actionCounts: null, // { open, done, total } compiled from voice-note tasks
  moduleStatus: {}, // moduleKey -> "ok" | "warn" | "err"
};

/* --------------------------- FALLBACK PAYLOADS ------------------------------
   Used only when a fetch stream fails (e.g. file:// preview before deploy).
   Keeps every UI binding live so the layout never renders dead. */
const FALLBACK = {
  macros: {
    date: "2026-07-14",
    targets: { maintenance_calories: 2800, calories: 2200, protein_g: 180, carbs_g: 190, fats_g: 70 },
    consumed: { calories: 200, protein_g: 18, carbs_g: 2, fats_g: 14 },
    meals: [
      { time: "08:40", name: "Whey isolate + almond butter", calories: 200, protein_g: 18, carbs_g: 2, fats_g: 14 },
    ],
    hydration_oz: 24,
    last_sync: null,
  },
  notes: [
    {
      file: "voice_note_2026-07-12_15-53-03.md",
      date: new Date(2026, 6, 12, 15, 53, 3),
      title: "Finish Mr. Long's website + schoolwork sweep",
      content:
        "# Task Overview\nI need to ensure that Mr. Long's website is completed. Additionally, I have to finish my schoolwork, go to the gym, and make sure my room is clean.\n\n## Action Items\n- [ ] Finish Mr. Long's website\n- [ ] Complete schoolwork\n- [ ] Go to the gym\n- [ ] Clean room",
    },
    {
      file: "voice_note_2026-07-12_15-53-46.md",
      date: new Date(2026, 6, 12, 15, 53, 46),
      title: "OpenAI agent research + NLP study",
      content:
        "# Project Updates\nOpenAI can help me create an AI agent. Spoke with Marshall about it; learning more NLP.\n\n## Action Items\n* [ ] Research how OpenAI can help build an AI agent\n* [ ] Follow up with Marshall\n* [ ] Continue learning NLP",
    },
  ],
  calendar: {
    week: [
      {
        day: "Monday",
        items: [
          { start: "09:30", end: "09:45", title: "Corporate Analytics — Daily Standup", category: "internship", location: "Teams", detail: "KPI pipeline status" },
          { start: "14:00", end: "15:15", title: "SCM 4310 — Supply Chain Management", category: "academic", location: "Bus. Hall 214", detail: "Inventory optimization module" },
          { start: "18:00", end: "19:15", title: "Lift — Push Day", category: "athletic", location: "Rec Center", detail: "Bench 5x5 · OHP 4x8" },
        ],
      },
    ],
  },
  emails: {
    triage: { scanned: 147, suppressed: 138 },
    threshold: 6,
    critical: [
      { sender: "Dana Whitfield", email: "d.whitfield@corp-analytics.com", subject: "Sprint review moved — deck needed by EOD Thursday", received: "2026-07-14T07:58:00-04:00", urgency: 10, tag: "internship" },
      { sender: "Prof. R. Okafor", email: "okafor@university.edu", subject: "SCM 4310: Quiz 3 scope finalized", received: "2026-07-14T07:12:00-04:00", urgency: 9, tag: "academic" },
    ],
  },
};

/* ------------------------------ DOM HELPERS -------------------------------- */
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

function escapeHTML(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

const fmtInt = (n) => Math.round(n).toLocaleString("en-US");

const clamp = (n, lo, hi) => Math.min(hi, Math.max(lo, n));

const pad2 = (n) => String(n).padStart(2, "0");

/* --------------------------- FETCH PRIMITIVES ------------------------------ */
async function fetchWithTimeout(path, asJSON) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), CONFIG.fetchTimeoutMs);
  try {
    const res = await fetch(path, { cache: "no-store", signal: ctrl.signal });
    if (!res.ok) throw new Error(`HTTP ${res.status} on ${path}`);
    return asJSON ? await res.json() : await res.text();
  } finally {
    clearTimeout(timer);
  }
}

const fetchJSON = (path) => fetchWithTimeout(path, true);
const fetchText = (path) => fetchWithTimeout(path, false);

/* ------------------------------ BOOT LOG ----------------------------------- */
function bootLog(message, tone = "info") {
  const list = $("#boot-log");
  if (!list) return;
  const now = new Date();
  const ts = `${pad2(now.getHours())}:${pad2(now.getMinutes())}:${pad2(now.getSeconds())}`;
  const li = document.createElement("li");
  li.className = `log-line log-${tone}`;
  li.innerHTML = `<span class="log-ts">[${ts}]</span>${escapeHTML(message)}`;
  list.appendChild(li);
  while (list.children.length > 40) list.removeChild(list.firstChild);
  list.scrollTop = list.scrollHeight;
}

/* ------------------------- MODULE STATUS CONTROL --------------------------- */
function setModuleState(moduleKey, ledState, chipText, chipClass) {
  state.moduleStatus[moduleKey] = ledState;
  const led = $(`[data-module-led="${moduleKey}"]`);
  if (led) led.dataset.state = ledState;
  const chipMap = {
    nutrition: "#nut-status",
    notes: "#notes-chip",
    email: "#email-chip",
  };
  if (chipText && chipMap[moduleKey]) {
    const chip = $(chipMap[moduleKey]);
    if (chip) {
      chip.textContent = chipText;
      chip.className = `panel-chip ${chipClass || ""}`.trim();
    }
  }
  refreshSyncLED();
}

function refreshSyncLED() {
  const led = $("#sync-led");
  const label = $("#sync-label");
  if (!led || !label) return;
  const states = Object.values(state.moduleStatus);
  if (states.length < 4) {
    led.dataset.state = "";
    label.textContent = "SYNCING";
    return;
  }
  if (states.includes("err")) {
    led.dataset.state = "err";
    label.textContent = "DEGRADED";
  } else if (states.includes("warn")) {
    led.dataset.state = "warn";
    label.textContent = "CACHE MODE";
  } else {
    led.dataset.state = "ok";
    label.textContent = "SYNCED";
  }
}

/* ------------------------- COUNT-UP VALUE ANIMATION ------------------------- */
function animateValue(el, target, { duration = 900, decimals = 0, suffix = "" } = {}) {
  if (!el) return;
  const from = parseFloat(el.dataset.current || "0") || 0;
  const start = performance.now();
  el.dataset.current = String(target);
  function frame(now) {
    const t = clamp((now - start) / duration, 0, 1);
    const eased = 1 - Math.pow(1 - t, 3);
    const value = from + (target - from) * eased;
    el.textContent = value.toLocaleString("en-US", {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }) + suffix;
    if (t < 1) requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}

/* ============================================================================
   CORE MODULE · CLOCK / DATE / UPTIME
   ========================================================================== */
const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const DAY_ABBR = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
const MONTH_ABBR = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];

function tickClock() {
  const now = new Date();
  const clock = $("#clock");
  const dateReadout = $("#date-readout");
  if (clock) {
    clock.textContent = `${pad2(now.getHours())}:${pad2(now.getMinutes())}:${pad2(now.getSeconds())}`;
    clock.setAttribute("datetime", now.toISOString());
  }
  if (dateReadout) {
    dateReadout.textContent = `${DAY_ABBR[now.getDay()]} · ${MONTH_ABBR[now.getMonth()]} ${now.getDate()} · ${now.getFullYear()}`;
  }
  const uptimeEl = $("#uptime");
  if (uptimeEl) {
    const s = Math.floor((Date.now() - state.bootedAt) / 1000);
    uptimeEl.textContent = `UPTIME ${pad2(Math.floor(s / 3600))}:${pad2(Math.floor((s % 3600) / 60))}:${pad2(s % 60)}`;
  }
}

/* ============================================================================
   CORE MODULE · STATUS TICKER
   ========================================================================== */
function updateTicker() {
  const track = $("#ticker-track");
  if (!track) return;
  const items = [];

  if (state.macros) {
    const consumed = state.macros.consumed || {};
    const targets = state.macros.targets || {};
    const proteinGap = Math.max(0, CONFIG.proteinFloorG - (consumed.protein_g || 0));
    const kcalLeft = Math.max(0, (targets.calories || 0) - (consumed.calories || 0));
    items.push({ cls: "tick-green", html: `PROTEIN GAP <b>${fmtInt(proteinGap)}g</b>` });
    items.push({ cls: "tick-blue", html: `KCAL REMAINING <b>${fmtInt(kcalLeft)}</b>` });
  }
  if (state.emails) {
    items.push({ cls: "tick-amber", html: `CRITICAL MAIL <b>${state.emails.critical.length}</b>` });
  }
  if (state.notes.length) {
    items.push({ cls: "tick-blue", html: `TRANSCRIPTS LIVE <b>${state.notes.length}</b>` });
  }
  if (state.scheduleDay) {
    const next = nextScheduleItem();
    if (next) {
      items.push({ cls: "tick-blue", html: `NEXT BLOCK <b>${escapeHTML(next.start)} ${escapeHTML(shortTitle(next.title))}</b>` });
    }
  }
  if (state.actionCounts) {
    items.push({
      cls: state.actionCounts.open > 0 ? "tick-amber" : "tick-green",
      html: `OPEN ACTIONS <b>${state.actionCounts.open}</b>`,
    });
    if (state.actionCounts.done > 0) {
      items.push({ cls: "tick-green", html: `CLEARED <b>${state.actionCounts.done}</b>` });
    }
  }

  if (!items.length) return;
  const html = items
    .map((i) => `<span class="ticker-item ${i.cls}">${i.html}</span>`)
    .join("");
  track.innerHTML = html + html; // duplicated once for a seamless -50% marquee loop
}

function shortTitle(title) {
  const cut = String(title).split("—")[0].trim();
  return cut.length > 26 ? cut.slice(0, 25) + "…" : cut;
}

/* ============================================================================
   MODULE 01 · NUTRITION & CALORIC TELEMETRY ENGINE
   ========================================================================== */
async function loadNutrition() {
  let data;
  let fromCache = false;
  try {
    data = await fetchJSON(CONFIG.paths.macros);
    bootLog("MOD-01 nutrition telemetry stream acquired → ./nutrition/macros.json", "ok");
  } catch (err) {
    data = FALLBACK.macros;
    fromCache = true;
    bootLog(`MOD-01 stream unreachable (${err.message}) — offline cache engaged`, "warn");
  }
  state.macros = data;
  renderNutrition(data, fromCache);
}

function renderNutrition(data, fromCache) {
  const consumed = data.consumed || {};
  const targets = data.targets || {};
  const kcalIn = Number(consumed.calories) || 0;
  const kcalTarget = Number(targets.calories) || 0;
  const maintenance = Number(targets.maintenance_calories) || kcalTarget;
  const protein = Number(consumed.protein_g) || 0;
  const floor = Number(targets.protein_g) || CONFIG.proteinFloorG;

  animateValue($("#nut-calories"), kcalIn);
  animateValue($("#nut-remaining"), Math.max(0, kcalTarget - kcalIn));
  animateValue($("#nut-deficit"), kcalIn - maintenance);

  const calSub = $("#nut-calories-sub");
  if (calSub) calSub.textContent = `of ${fmtInt(kcalTarget)} kcal ceiling`;
  const remSub = $("#nut-remaining-sub");
  if (remSub) remSub.textContent = kcalIn > kcalTarget ? "CEILING BREACHED" : "until daily ceiling";
  const defSub = $("#nut-deficit-sub");
  if (defSub) defSub.textContent = `vs ${fmtInt(maintenance)} kcal maintenance`;

  const pct = clamp((protein / floor) * 100, 0, 100);
  const bar = $("#nut-protein-bar");
  if (bar) {
    bar.style.width = `${pct}%`;
    bar.className = `progress-fill ${protein >= floor ? "fill-green" : pct >= 50 ? "fill-blue" : "fill-amber"}`;
  }
  const track = $("#nut-protein-track");
  if (track) {
    track.setAttribute("aria-valuemax", String(floor));
    track.setAttribute("aria-valuenow", String(protein));
  }
  const label = $("#nut-protein-label");
  if (label) label.textContent = `${fmtInt(protein)}g / ${fmtInt(floor)}g`;

  const carbs = $("#nut-carbs");
  if (carbs) carbs.textContent = `${fmtInt(Number(consumed.carbs_g) || 0)}g`;
  const fats = $("#nut-fats");
  if (fats) fats.textContent = `${fmtInt(Number(consumed.fats_g) || 0)}g`;
  const hydration = $("#nut-hydration");
  if (hydration) hydration.textContent = `${fmtInt(Number(data.hydration_oz) || 0)}oz`;
  const updated = $("#nut-updated");
  if (updated) {
    updated.textContent = data.last_sync
      ? new Date(data.last_sync).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })
      : "LOCAL";
  }

  const mealList = $("#nut-meals");
  if (mealList) {
    const meals = Array.isArray(data.meals) ? data.meals : [];
    mealList.innerHTML = meals.length
      ? meals
          .map(
            (m) => `
        <li class="meal">
          <span class="meal-time">${escapeHTML(m.time || "--:--")}</span>
          <span class="meal-name">${escapeHTML(m.name || "Logged intake")}</span>
          <span class="meal-macros">${fmtInt(Number(m.calories) || 0)}kcal · P${fmtInt(Number(m.protein_g) || 0)} C${fmtInt(Number(m.carbs_g) || 0)} F${fmtInt(Number(m.fats_g) || 0)}</span>
        </li>`
          )
          .join("")
      : `<li class="note-empty">No intake events logged yet today.</li>`;
  }

  setModuleState(
    "nutrition",
    fromCache ? "warn" : "ok",
    fromCache ? "OFFLINE CACHE" : protein >= floor ? "FLOOR SECURED" : "TRACKING",
    fromCache ? "chip-warn" : protein >= floor ? "chip-ok" : "chip-blue"
  );
}

/* ============================================================================
   MODULE 02 · DYNAMIC VOICE-NOTE LOG TIMELINE
   ========================================================================== */
const NOTE_ARTIFACT_RE = /\{\{\s*\$json/; // unresolved n8n template payloads
const NOTE_DATE_RE = /(\d{4})-(\d{2})-(\d{2})_(\d{2})-(\d{2})-(\d{2})/;

function parseNoteDate(filename) {
  const m = filename.match(NOTE_DATE_RE);
  if (!m) return null;
  return new Date(+m[1], +m[2] - 1, +m[3], +m[4], +m[5], +m[6]);
}

function classifyUrgency(text) {
  const t = text.toLowerCase();
  const high = ["urgent", "asap", "deadline", "due", "today", "tonight", "immediately", "quiz", "exam", "finish", "must"];
  const medium = ["follow up", "follow-up", "contact", "call", "email", "review", "schedule", "meet", "complete", "clean"];
  if (high.some((k) => t.includes(k))) return { tag: "CRITICAL", cls: "urgency-high" };
  if (medium.some((k) => t.includes(k))) return { tag: "ACTION", cls: "urgency-medium" };
  return { tag: "LOG", cls: "urgency-low" };
}

function extractNoteTitle(content, filename) {
  const lines = content.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const heading = lines.find((l) => /^#{1,3}\s+/.test(l));
  if (heading) return heading.replace(/^#{1,3}\s+/, "");
  if (lines[0]) return lines[0].length > 72 ? lines[0].slice(0, 71) + "…" : lines[0];
  return filename.replace(/\.md$/, "").replace(/[_-]+/g, " ");
}

/* Minimal, escape-first markdown renderer for transcript payloads. */
function renderMarkdown(raw) {
  const lines = escapeHTML(raw).split(/\r?\n/);
  const out = [];
  let listBuffer = [];
  const flushList = () => {
    if (listBuffer.length) {
      out.push(`<ul>${listBuffer.join("")}</ul>`);
      listBuffer = [];
    }
  };
  const inline = (s) => s.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      flushList();
      continue;
    }
    const heading = trimmed.match(/^#{1,3}\s+(.+)$/);
    if (heading) {
      flushList();
      out.push(`<div class="md-h">${inline(heading[1])}</div>`);
      continue;
    }
    const task = trimmed.match(/^[-*]\s*\[( |x|X)\]\s*(.+)$/);
    if (task) {
      const done = task[1].toLowerCase() === "x";
      listBuffer.push(
        `<li class="md-task"><span class="md-check${done ? " done" : ""}">${done ? "✓" : "◻"}</span><span>${inline(task[2])}</span></li>`
      );
      continue;
    }
    const bullet = trimmed.match(/^[-*]\s+(.+)$/);
    if (bullet) {
      listBuffer.push(`<li class="md-bullet">${inline(bullet[1])}</li>`);
      continue;
    }
    flushList();
    out.push(`<p>${inline(trimmed)}</p>`);
  }
  flushList();
  return out.join("");
}

async function loadNotes() {
  let notes = [];
  let suppressed = 0;
  let fromCache = false;
  try {
    const index = await fetchJSON(CONFIG.paths.notesIndex);
    const files = Array.isArray(index.files) ? index.files : [];
    bootLog(`MOD-02 note manifest acquired — ${files.length} payloads referenced`, "ok");

    const results = await Promise.allSettled(
      files.map((f) => fetchText(CONFIG.paths.notesDir + encodeURIComponent(f)))
    );

    results.forEach((res, i) => {
      const file = files[i];
      if (res.status !== "fulfilled") {
        suppressed += 1;
        return;
      }
      const content = res.value || "";
      if (!content.trim() || NOTE_ARTIFACT_RE.test(content)) {
        suppressed += 1; // empty or unresolved automation template → quarantine
        return;
      }
      notes.push({
        file,
        date: parseNoteDate(file),
        title: extractNoteTitle(content, file),
        content,
      });
    });
  } catch (err) {
    notes = FALLBACK.notes.slice();
    suppressed = 0;
    fromCache = true;
    bootLog(`MOD-02 manifest unreachable (${err.message}) — offline cache engaged`, "warn");
  }

  notes.sort((a, b) => (b.date?.getTime() || 0) - (a.date?.getTime() || 0));
  state.notes = notes;
  state.notesSuppressed = suppressed;
  if (!fromCache && suppressed > notes.length) {
    bootLog(
      `MOD-02 pipeline fault — ${suppressed} corrupt payloads vs ${notes.length} clean: check the n8n GitHub node (content field must be in Expression mode)`,
      "warn"
    );
  }
  renderNotes(notes, suppressed, fromCache);
}

/* Chip copy for the notes module: surface a capture-pipeline fault when
   quarantined payloads outnumber clean transcripts. */
function notesChip(notes, suppressed, fromCache) {
  if (fromCache) return { text: "OFFLINE CACHE", cls: "chip-warn" };
  if (suppressed > notes.length) return { text: "PIPELINE FAULT", cls: "chip-warn" };
  return { text: `${notes.length} LIVE`, cls: "chip-ok" };
}

function renderNotes(notes, suppressed, fromCache) {
  const feed = $("#notes-feed");
  const count = $("#notes-count");
  const suppressedEl = $("#notes-suppressed");
  if (count) count.textContent = String(notes.length);
  if (suppressedEl) suppressedEl.textContent = String(suppressed);
  if (!feed) return;

  // Skip the DOM rebuild when the transcript set is byte-identical to what is
  // already rendered. This keeps the 5-minute re-sync from collapsing a note the
  // user is mid-read and from re-announcing the whole feed to screen readers.
  const signature = `${suppressed}|${notes.map((n) => n.file + ":" + n.content.length).join("|")}`;
  if (feed.dataset.signature === signature && feed.children.length) {
    const chip = notesChip(notes, suppressed, fromCache);
    setModuleState("notes", fromCache ? "warn" : "ok", chip.text, chip.cls);
    return;
  }
  // Preserve which notes are expanded across a genuine rebuild, keyed by file.
  const openFiles = new Set(
    $$(".note.open", feed).map((el) => el.dataset.noteFile).filter(Boolean)
  );
  feed.dataset.signature = signature;

  if (!notes.length) {
    feed.innerHTML = `<p class="note-empty">No clean transcripts in the stream. ${suppressed} corrupt payloads quarantined.</p>`;
  } else {
    feed.innerHTML = notes
      .map((note, i) => {
        const urgency = classifyUrgency(note.content);
        const isOpen = openFiles.has(note.file);
        const dateStr = note.date
          ? `${MONTH_ABBR[note.date.getMonth()]} ${note.date.getDate()} · ${pad2(note.date.getHours())}:${pad2(note.date.getMinutes())}`
          : "UNDATED";
        return `
        <article class="note ${urgency.cls}${isOpen ? " open" : ""}" data-note-index="${i}" data-note-file="${escapeHTML(note.file)}">
          <button type="button" class="note-head" aria-expanded="${isOpen ? "true" : "false"}" aria-controls="note-body-${i}">
            <span class="note-tag">${urgency.tag}</span>
            <span class="note-title">${escapeHTML(note.title)}</span>
            <span class="note-date">${dateStr}</span>
            <span class="note-caret" aria-hidden="true">▶</span>
          </button>
          <div class="note-body" id="note-body-${i}">
            <div class="note-content">${renderMarkdown(note.content)}</div>
          </div>
        </article>`;
      })
      .join("");

    $$(".note-head", feed).forEach((btn) => {
      btn.addEventListener("click", () => {
        const note = btn.closest(".note");
        const open = note.classList.toggle("open");
        btn.setAttribute("aria-expanded", String(open));
      });
    });
  }

  const chip = notesChip(notes, suppressed, fromCache);
  setModuleState("notes", fromCache ? "warn" : "ok", chip.text, chip.cls);
}

/* ============================================================================
   MODULE 03 · CALENDAR & INTEGRATED SCHEDULE TRACKER
   ========================================================================== */
const toMinutes = (hhmm) => {
  const m = String(hhmm).match(/^(\d{1,2}):(\d{2})$/);
  return m ? +m[1] * 60 + +m[2] : null;
};

function nextScheduleItem() {
  if (!state.scheduleDay || !state.scheduleDay.isToday) return null;
  const now = new Date();
  const nowMin = now.getHours() * 60 + now.getMinutes();
  return (state.scheduleDay.items || []).find((it) => (toMinutes(it.start) ?? 0) > nowMin) || null;
}

async function loadSchedule() {
  let data;
  let fromCache = false;
  try {
    data = await fetchJSON(CONFIG.paths.calendar);
    bootLog("MOD-03 calendar stream acquired → ./data/calendar.json", "ok");
  } catch (err) {
    data = FALLBACK.calendar;
    fromCache = true;
    bootLog(`MOD-03 stream unreachable (${err.message}) — offline cache engaged`, "warn");
  }
  state.calendar = data;

  const todayName = DAY_NAMES[new Date().getDay()];
  const week = Array.isArray(data.week) ? data.week : [];
  let day = week.find((d) => d.day === todayName);
  let isToday = Boolean(day);
  if (!day) day = week[0] || { day: "—", items: [] };
  const items = (day.items || [])
    .slice()
    .sort((a, b) => (toMinutes(a.start) ?? 0) - (toMinutes(b.start) ?? 0));
  state.scheduleDay = { ...day, items, isToday };
  state.scheduleFromCache = fromCache;
  renderSchedule(fromCache);
}

function renderSchedule(fromCache) {
  const day = state.scheduleDay;
  if (!day) return;
  const timeline = $("#schedule-timeline");
  const dayEl = $("#schedule-day");
  const countEl = $("#schedule-count");
  const chip = $("#schedule-chip");
  const items = (day.items || [])
    .slice()
    .sort((a, b) => (toMinutes(a.start) ?? 0) - (toMinutes(b.start) ?? 0));

  if (dayEl) dayEl.textContent = day.isToday ? `${day.day.toUpperCase()} (TODAY)` : day.day.toUpperCase();
  if (countEl) countEl.textContent = String(items.length);
  if (chip) chip.classList.toggle("chip-warn", Boolean(fromCache));
  if (!timeline) return;

  const now = new Date();
  const nowMin = now.getHours() * 60 + now.getMinutes();
  let nowLinePlaced = !day.isToday; // only place the NOW divider on a real today view
  const rows = [];

  items.forEach((item) => {
    const startMin = toMinutes(item.start) ?? 0;
    const endMin = toMinutes(item.end) ?? startMin + 60;
    let temporal = "is-upcoming";
    let badge = "";
    if (day.isToday) {
      if (nowMin >= endMin) {
        temporal = "is-past";
        badge = `<span class="tl-badge badge-done">DONE</span>`;
      } else if (nowMin >= startMin) {
        temporal = "is-active";
        badge = `<span class="tl-badge">LIVE</span>`;
      }
      if (!nowLinePlaced && nowMin < startMin) {
        rows.push(
          `<li class="now-line" aria-hidden="true"><span class="now-label">NOW ${pad2(now.getHours())}:${pad2(now.getMinutes())}</span><span class="now-rule"></span></li>`
        );
        nowLinePlaced = true;
      }
    }
    const cat = /^(academic|internship|networking|athletic|project)$/.test(item.category || "")
      ? item.category
      : "project";
    rows.push(`
      <li class="tl-item ${temporal} cat-${cat}">
        <div class="tl-time">${escapeHTML(item.start || "--:--")}<small>${escapeHTML(item.end || "")}</small></div>
        <div class="tl-rail"><span class="tl-dot"></span></div>
        <div class="tl-card">
          <div class="tl-title">${escapeHTML(item.title || "Untitled block")}${badge}</div>
          <div class="tl-meta">${escapeHTML((item.category || "block").toUpperCase())} · ${escapeHTML(item.location || "—")}</div>
          ${item.detail ? `<div class="tl-detail">${escapeHTML(item.detail)}</div>` : ""}
        </div>
      </li>`);
  });

  if (day.isToday && !nowLinePlaced) {
    rows.push(
      `<li class="now-line" aria-hidden="true"><span class="now-label">NOW ${pad2(now.getHours())}:${pad2(now.getMinutes())}</span><span class="now-rule"></span></li>`
    );
  }

  timeline.innerHTML = rows.length
    ? rows.join("")
    : `<li class="note-empty">No blocks scheduled for ${escapeHTML(day.day)}.</li>`;

  setModuleState("schedule", fromCache ? "warn" : "ok");
}

/* ============================================================================
   MODULE 04 · AUTOMATED EMAIL TRIAGE & NOISE FILTER
   ========================================================================== */
async function loadEmails() {
  let data;
  let fromCache = false;
  try {
    data = await fetchJSON(CONFIG.paths.emails);
    bootLog("MOD-04 triage feed acquired → ./data/emails.json", "ok");
  } catch (err) {
    data = FALLBACK.emails;
    fromCache = true;
    bootLog(`MOD-04 feed unreachable (${err.message}) — offline cache engaged`, "warn");
  }

  const threshold = Number(data.threshold) || CONFIG.emailThreshold;
  const critical = (Array.isArray(data.critical) ? data.critical : [])
    .filter((e) => Number(e.urgency) >= threshold)
    .sort((a, b) => Number(b.urgency) - Number(a.urgency));

  state.emails = { ...data, critical };
  renderEmails(state.emails, fromCache);
}

function formatReceived(iso) {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "—";
  const now = new Date();
  const sameDay =
    d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate();
  return sameDay
    ? `${pad2(d.getHours())}:${pad2(d.getMinutes())}`
    : `${MONTH_ABBR[d.getMonth()]} ${d.getDate()}`;
}

function urgencyCells(urgency) {
  const u = clamp(Math.round(urgency), 0, 10);
  let cells = "";
  for (let i = 1; i <= 10; i += 1) {
    cells += `<span class="u-cell${i <= u ? " on" : ""}"></span>`;
  }
  return cells;
}

function renderEmails(data, fromCache) {
  const list = $("#email-list");
  const scanned = $("#email-scanned");
  const suppressed = $("#email-suppressed");
  const passed = $("#email-passed");
  const triage = data.triage || {};

  if (scanned) animateValue(scanned, Number(triage.scanned) || 0, { duration: 700 });
  if (suppressed) animateValue(suppressed, Number(triage.suppressed) || 0, { duration: 700 });
  if (passed) passed.textContent = String(data.critical.length);
  if (!list) return;

  list.innerHTML = data.critical.length
    ? data.critical
        .map((e) => {
          const u = Number(e.urgency) || 0;
          const weightCls = u >= 9 ? "u-crit" : u >= 7 ? "u-med" : "";
          return `
        <li class="email-item">
          <div class="email-top">
            <span class="email-sender" title="${escapeHTML(e.email || "")}">${escapeHTML(e.sender || "Unknown sender")}</span>
            <span class="email-time">${formatReceived(e.received)}</span>
          </div>
          <div class="email-subject">${escapeHTML(e.subject || "(no subject)")}</div>
          <div class="email-bottom">
            <span class="email-tag">${escapeHTML(e.tag || "general")}</span>
            <span class="urgency-meter ${weightCls}" title="Urgency weight ${u}/10">
              <span class="urgency-cells">${urgencyCells(u)}</span>
              <span class="urgency-num">${u}/10</span>
            </span>
          </div>
        </li>`;
        })
        .join("")
    : `<li class="note-empty">Zero communications passed the urgency threshold. Inbox is silent.</li>`;

  setModuleState(
    "email",
    fromCache ? "warn" : "ok",
    fromCache ? "OFFLINE CACHE" : `T≥${Number(data.threshold) || CONFIG.emailThreshold}`,
    fromCache ? "chip-warn" : "chip-ok"
  );
}

/* ============================================================================
   MODULE 05 · ACTION COMMAND BOARD
   Compiles every task line ("- [ ] ..." / "* [x] ...") spoken into the phone
   across all clean transcripts, dedupes them, ranks by urgency, and renders a
   tap-to-complete checklist. Completion overrides persist in localStorage so
   checked items survive reloads and 5-minute re-syncs on this device.
   ========================================================================== */
const TASK_LINE_RE = /^[-*]\s*\[( |x|X)\]\s*(.+)$/;

function hashId(str) {
  let h = 5381;
  for (let i = 0; i < str.length; i += 1) {
    h = ((h << 5) + h + str.charCodeAt(i)) | 0;
  }
  return (h >>> 0).toString(36);
}

function loadTaskState() {
  try {
    return JSON.parse(localStorage.getItem(CONFIG.taskStoreKey)) || {};
  } catch {
    return {};
  }
}

function saveTaskState(overrides) {
  try {
    localStorage.setItem(CONFIG.taskStoreKey, JSON.stringify(overrides));
  } catch {
    /* storage unavailable (private mode) — check-offs just won't persist */
  }
}

const URGENCY_RANK = { "urgency-high": 0, "urgency-medium": 1, "urgency-low": 2 };

function compileTasks() {
  const raw = [];
  state.notes.forEach((note) => {
    const urgency = classifyUrgency(note.content);
    note.content.split(/\r?\n/).forEach((line) => {
      const m = line.trim().match(TASK_LINE_RE);
      if (!m) return;
      const text = m[2].trim();
      if (!text) return;
      raw.push({
        id: hashId(note.file + "::" + text.toLowerCase()),
        text,
        file: note.file,
        date: note.date,
        urgencyCls: urgency.cls,
        doneInSource: m[1].toLowerCase() === "x",
      });
    });
  });

  // Repeated captures of the same task across notes collapse to the most
  // recent mention (normalized on letters/digits so punctuation variants match).
  raw.sort((a, b) => (b.date?.getTime() || 0) - (a.date?.getTime() || 0));
  const seen = new Set();
  const tasks = [];
  for (const t of raw) {
    const key = t.text.toLowerCase().replace(/[^a-z0-9 ]/g, "").replace(/\s+/g, " ").trim();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    tasks.push(t);
  }
  return tasks;
}

function composeBrief(tasks, overrides) {
  const now = new Date();
  const open = tasks.filter((t) => !((overrides[t.id] ?? t.doneInSource)));
  const critical = open.filter((t) => t.urgencyCls === "urgency-high").length;
  const parts = [`${DAY_ABBR[now.getDay()]} ${MONTH_ABBR[now.getMonth()]} ${now.getDate()}`];
  parts.push(`${state.notes.length} transcripts on stream`);
  parts.push(`${open.length} open actions${critical ? ` (${critical} critical)` : ""}`);
  const next = nextScheduleItem();
  if (next) parts.push(`next block ${next.start} ${shortTitle(next.title)}`);
  if (state.macros) {
    const floor = Number(state.macros.targets?.protein_g) || CONFIG.proteinFloorG;
    const gap = Math.max(0, floor - (Number(state.macros.consumed?.protein_g) || 0));
    if (gap > 0) parts.push(`protein gap ${fmtInt(gap)}g`);
  }
  if (state.emails) parts.push(`${state.emails.critical.length} critical mails`);
  return ("▸ " + parts.join(" · ")).toUpperCase();
}

function renderActionBoard() {
  const list = $("#action-list");
  if (!list) return;
  const overrides = loadTaskState();
  const tasks = compileTasks();

  const resolved = (t) => overrides[t.id] ?? t.doneInSource;
  const done = tasks.filter(resolved).length;
  const open = tasks.length - done;
  state.actionCounts = { open, done, total: tasks.length };

  // Open items first (critical → low, newest first), cleared items sink.
  const ordered = tasks.slice().sort((a, b) => {
    const ra = resolved(a) ? 1 : 0;
    const rb = resolved(b) ? 1 : 0;
    if (ra !== rb) return ra - rb;
    const ua = URGENCY_RANK[a.urgencyCls] ?? 2;
    const ub = URGENCY_RANK[b.urgencyCls] ?? 2;
    if (ua !== ub) return ua - ub;
    return (b.date?.getTime() || 0) - (a.date?.getTime() || 0);
  });

  list.innerHTML = ordered.length
    ? ordered
        .map((t) => {
          const isDone = resolved(t);
          const dateStr = t.date ? `${MONTH_ABBR[t.date.getMonth()]} ${t.date.getDate()}` : "—";
          return `
      <li>
        <button type="button" class="action-item ${t.urgencyCls}${isDone ? " done" : ""}" data-task-id="${t.id}" aria-pressed="${isDone}">
          <span class="action-check" aria-hidden="true">${isDone ? "✓" : "◻"}</span>
          <span class="action-text">${escapeHTML(t.text)}</span>
          <span class="action-meta">${dateStr}</span>
        </button>
      </li>`;
        })
        .join("")
    : `<li class="action-empty">No action items captured yet — speak a task into your phone and it lands here on the next sync.</li>`;

  $$(".action-item", list).forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.taskId;
      const current = loadTaskState();
      const task = tasks.find((t) => t.id === id);
      const wasDone = current[id] ?? task?.doneInSource ?? false;
      current[id] = !wasDone;
      saveTaskState(current);
      renderActionBoard();
      updateTicker();
    });
  });

  const label = $("#actions-progress-label");
  if (label) label.textContent = `${done} / ${tasks.length}`;
  const pct = tasks.length ? (done / tasks.length) * 100 : 0;
  const bar = $("#actions-progress-bar");
  if (bar) bar.style.width = `${pct}%`;
  const track = $("#actions-progress-track");
  if (track) {
    track.setAttribute("aria-valuemax", String(tasks.length));
    track.setAttribute("aria-valuenow", String(done));
  }

  const chip = $("#actions-chip");
  if (chip) {
    chip.textContent = open > 0 ? `${open} OPEN` : tasks.length ? "ALL CLEAR" : "STANDBY";
    chip.className = `panel-chip ${open > 0 ? "chip-amber" : tasks.length ? "chip-ok" : ""}`.trim();
  }
  const led = $('[data-module-led="actions"]');
  if (led) led.dataset.state = "ok";

  const brief = $("#daily-brief");
  if (brief) brief.textContent = composeBrief(tasks, overrides);
}

/* ============================================================================
   BOOT SEQUENCE + TEMPORAL TRIGGERS
   ========================================================================== */
async function syncAllStreams(reason) {
  bootLog(`telemetry sync initiated — ${reason}`, "info");
  await Promise.allSettled([loadNutrition(), loadNotes(), loadSchedule(), loadEmails()]);
  renderActionBoard();
  updateTicker();
  bootLog("telemetry sync cycle complete", "ok");
}

function init() {
  bootLog("LIFEOS terminal core online — vanilla runtime, zero dependencies", "ok");
  tickClock();
  setInterval(tickClock, 1000);

  syncAllStreams("initial boot");

  // Temporal trigger: full data re-sync every 5 minutes
  setInterval(() => syncAllStreams("scheduled 5-minute refresh"), CONFIG.dataRefreshMs);

  // Temporal trigger: schedule past/live/upcoming states re-evaluated every 60s
  setInterval(() => {
    if (state.scheduleDay) {
      renderSchedule(state.scheduleFromCache);
      updateTicker();
    }
  }, CONFIG.scheduleTickMs);
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}

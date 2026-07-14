/* ============================================================================
   LIFEOS // TERMINAL — APPLICATION ENGINE
   Vanilla ES module · zero dependencies · GitHub Pages relative pathing
   Modules: clock/ticker core, nutrition telemetry, voice-note timeline,
            schedule tracker, email triage, quantitative hedge simulator
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
  hedgeDefaults: { payout: 2000, stake: 50, odds: -110 },
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
  hedge: { payout: 2000, stake: 50, odds: -110, amount: 0 },
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

const fmtMoney = (n) =>
  (n < 0 ? "-$" : "$") +
  Math.abs(n).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

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
  const hedge = computeHedge(state.hedge.payout, state.hedge.stake, americanToDecimal(state.hedge.odds), state.hedge.amount);
  if (hedge.valid) {
    items.push({ cls: "tick-green", html: `EQUAL-PROFIT LOCK <b>${escapeHTML(fmtMoney(hedge.lockAtOptimal))}</b>` });
  }
  items.push({ cls: "", html: `PAYOUT ANCHOR <b>${escapeHTML(fmtMoney(state.hedge.payout))}</b>` });

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
  renderNotes(notes, suppressed, fromCache);
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
    setModuleState(
      "notes",
      fromCache ? "warn" : "ok",
      fromCache ? "OFFLINE CACHE" : `${notes.length} LIVE`,
      fromCache ? "chip-warn" : "chip-ok"
    );
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

  setModuleState(
    "notes",
    fromCache ? "warn" : "ok",
    fromCache ? "OFFLINE CACHE" : `${notes.length} LIVE`,
    fromCache ? "chip-warn" : "chip-ok"
  );
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
   MODULE 05 · QUANTITATIVE RISK & HEDGING SIMULATOR
   Pure cash-flow math around a parlay payout anchor.
     decimal line d:  +odds → 1 + odds/100 · −odds → 1 + 100/|odds|
     equal-profit hedge H* = P / d          (both branches settle identically)
     guaranteed lock @ H*  = P − S − P/d
     break-even floor      = S / (d − 1)    (hedge branch covers the stake)
     max hedge ceiling     = P − S          (parlay branch stays non-negative)
   ========================================================================== */
function americanToDecimal(odds) {
  const o = Number(odds);
  if (!Number.isFinite(o) || Math.abs(o) < 100) return NaN;
  return o > 0 ? 1 + o / 100 : 1 + 100 / Math.abs(o);
}

function computeHedge(payout, stake, decimal, hedgeStake) {
  const P = Number(payout);
  const S = Number(stake);
  const d = Number(decimal);
  const H = Number(hedgeStake);
  const valid = Number.isFinite(P) && Number.isFinite(S) && Number.isFinite(d) && Number.isFinite(H) && P > 0 && S >= 0 && H >= 0 && d > 1;
  if (!valid) {
    return { valid: false };
  }
  const profitParlayHits = P - S - H;
  const profitHedgeHits = H * (d - 1) - S;
  const optimal = P / d;
  const lockAtOptimal = P - S - optimal;
  const floor = S / (d - 1);
  const ceiling = P - S;
  const locked = Math.min(profitParlayHits, profitHedgeHits);
  const atRisk = S + H;
  return {
    valid: true,
    profitParlayHits,
    profitHedgeHits,
    optimal,
    lockAtOptimal,
    floor,
    ceiling,
    locked,
    roi: atRisk > 0 ? locked / atRisk : 0,
  };
}

function readHedgeInputs() {
  state.hedge.payout = Number($("#hedge-payout")?.value) || 0;
  state.hedge.stake = Number($("#hedge-stake")?.value) || 0;
  state.hedge.odds = Number($("#hedge-odds")?.value) || 0;
  state.hedge.amount = Number($("#hedge-amount")?.value) || 0;
}

function renderHedge() {
  const { payout, stake, odds, amount } = state.hedge;
  const decimal = americanToDecimal(odds);
  const result = computeHedge(payout, stake, decimal, amount);

  const oddsInput = $("#hedge-odds");
  if (oddsInput) oddsInput.classList.toggle("input-invalid", !Number.isFinite(decimal));

  const verdict = $("#hedge-verdict");
  const setOut = (id, text, cls) => {
    const el = $(id);
    if (!el) return;
    el.textContent = text;
    if (cls !== undefined) el.className = cls;
  };

  if (!result.valid) {
    if (verdict) {
      verdict.textContent = "INVALID PARAMETERS — AMERICAN LINES REQUIRE |ODDS| ≥ 100";
      verdict.className = "hedge-verdict verdict-err";
    }
    ["#out-decimal", "#out-optimal", "#out-lock", "#out-floor", "#out-ceiling", "#out-scenario-a", "#out-scenario-b", "#out-roi"].forEach(
      (id) => setOut(id, "—")
    );
    const zone = $("#window-zone");
    const marker = $("#window-marker");
    if (zone) zone.style.width = "0%";
    if (marker) marker.style.left = "0%";
    const readout = $("#window-readout");
    if (readout) readout.textContent = "—";
    return;
  }

  setOut("#out-decimal", decimal.toFixed(3));
  setOut("#out-optimal", fmtMoney(result.optimal));
  setOut("#out-lock", fmtMoney(result.lockAtOptimal), result.lockAtOptimal >= 0 ? "accent-green" : "accent-danger");
  setOut("#out-floor", fmtMoney(result.floor));
  setOut("#out-ceiling", fmtMoney(result.ceiling));
  setOut("#out-scenario-a", fmtMoney(result.profitParlayHits), result.profitParlayHits >= 0 ? "accent-green" : "accent-danger");
  setOut("#out-scenario-b", fmtMoney(result.profitHedgeHits), result.profitHedgeHits >= 0 ? "accent-green" : "accent-danger");
  setOut("#out-roi", `${(result.roi * 100).toFixed(1)}%`, result.roi >= 0 ? "accent-green" : "accent-danger");

  if (verdict) {
    if (amount < result.floor && result.profitHedgeHits < 0) {
      verdict.textContent = `EXPOSED — PARLAY MISS COSTS ${fmtMoney(Math.abs(result.profitHedgeHits))}`;
      verdict.className = "hedge-verdict verdict-risk";
    } else if (amount > result.ceiling) {
      verdict.textContent = `OVER-HEDGED — PARLAY HIT NETS ${fmtMoney(result.profitParlayHits)}`;
      verdict.className = "hedge-verdict verdict-risk";
    } else {
      verdict.textContent = `LOCKED — ${fmtMoney(result.locked)} GUARANTEED ON EITHER BRANCH`;
      verdict.className = "hedge-verdict verdict-locked";
    }
  }

  // Protected profit window visual, domain [0, payout]
  const domain = Math.max(payout, 1);
  const zoneLeft = clamp((result.floor / domain) * 100, 0, 100);
  const zoneRight = clamp((result.ceiling / domain) * 100, 0, 100);
  const zone = $("#window-zone");
  if (zone) {
    zone.style.left = `${zoneLeft}%`;
    zone.style.width = `${Math.max(0, zoneRight - zoneLeft)}%`;
  }
  const marker = $("#window-marker");
  if (marker) marker.style.left = `calc(${clamp((amount / domain) * 100, 0, 100)}% - 1.5px)`;
  const readout = $("#window-readout");
  if (readout) {
    readout.textContent =
      result.floor < result.ceiling
        ? `${fmtMoney(result.floor)} → ${fmtMoney(result.ceiling)}`
        : "NO PROTECTED WINDOW";
  }

  // Keep the sweep slider in sync with the payout domain and current stake
  const slider = $("#hedge-slider");
  if (slider) {
    slider.max = String(Math.max(1, Math.round(payout)));
    slider.value = String(clamp(Math.round(amount), 0, Number(slider.max)));
    slider.style.setProperty("--slider-pct", `${clamp((amount / Number(slider.max)) * 100, 0, 100)}%`);
  }
}

function initHedge() {
  const form = $("#hedge-form");
  if (!form) return;

  const recompute = () => {
    readHedgeInputs();
    renderHedge();
    updateTicker();
  };

  ["#hedge-payout", "#hedge-stake", "#hedge-odds", "#hedge-amount"].forEach((id) => {
    $(id)?.addEventListener("input", recompute);
  });

  $("#hedge-slider")?.addEventListener("input", (e) => {
    const amountInput = $("#hedge-amount");
    if (amountInput) amountInput.value = e.target.value;
    recompute();
  });

  $("#btn-optimal")?.addEventListener("click", () => {
    readHedgeInputs();
    const d = americanToDecimal(state.hedge.odds);
    const r = computeHedge(state.hedge.payout, state.hedge.stake, d, state.hedge.amount);
    if (r.valid) {
      const amountInput = $("#hedge-amount");
      if (amountInput) amountInput.value = r.optimal.toFixed(2);
      recompute();
      bootLog(`MOD-05 equal-profit lock set — H* ${fmtMoney(r.optimal)} locks ${fmtMoney(r.lockAtOptimal)}`, "ok");
    }
  });

  $("#btn-floor")?.addEventListener("click", () => {
    readHedgeInputs();
    const d = americanToDecimal(state.hedge.odds);
    const r = computeHedge(state.hedge.payout, state.hedge.stake, d, state.hedge.amount);
    if (r.valid) {
      const amountInput = $("#hedge-amount");
      if (amountInput) amountInput.value = r.floor.toFixed(2);
      recompute();
      bootLog(`MOD-05 break-even floor set — ${fmtMoney(r.floor)} neutralizes downside`, "info");
    }
  });

  form.addEventListener("submit", (e) => e.preventDefault());

  // Pre-configure: seed the hedge stake at the equal-profit point for the
  // $2,000 payout anchor so the workspace opens on a locked position.
  readHedgeInputs();
  const d = americanToDecimal(state.hedge.odds);
  const seeded = computeHedge(state.hedge.payout, state.hedge.stake, d, 0);
  if (seeded.valid) {
    const amountInput = $("#hedge-amount");
    if (amountInput) amountInput.value = seeded.optimal.toFixed(2);
  }
  readHedgeInputs();
  renderHedge();
  bootLog("MOD-05 hedge simulator armed — $2,000.00 payout anchor loaded", "ok");
}

/* ============================================================================
   BOOT SEQUENCE + TEMPORAL TRIGGERS
   ========================================================================== */
async function syncAllStreams(reason) {
  bootLog(`telemetry sync initiated — ${reason}`, "info");
  await Promise.allSettled([loadNutrition(), loadNotes(), loadSchedule(), loadEmails()]);
  updateTicker();
  bootLog("telemetry sync cycle complete", "ok");
}

function init() {
  bootLog("LIFEOS terminal core online — vanilla runtime, zero dependencies", "ok");
  tickClock();
  setInterval(tickClock, 1000);

  initHedge();

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

(async function () {
  "use strict";

  /* ── 1. Extract problem ID from URL ────────────────────────────── */
  const match = window.location.pathname.match(/\/problemset\/task\/(\d+)/);
  if (!match) return;
  const problemId = match[1];

  /* ── 2. Inject floating UI box ─────────────────────────────────── */
  const box = document.createElement("div");
  box.id = "cses-friends-box";
  box.innerHTML = `
    <style>
      #cses-friends-box {
        position: relative;
        margin: 16px auto;
        max-width: 760px;
        background: linear-gradient(135deg, #1e1e2e, #2a2a3d);
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: 14px;
        padding: 20px 24px;
        font-family: 'Segoe UI', 'Inter', system-ui, sans-serif;
        color: #e0e0e0;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.35);
        z-index: 9999;
      }
      #cses-friends-box .cfb-header {
        display: flex;
        align-items: center;
        gap: 10px;
        margin-bottom: 14px;
      }
      #cses-friends-box .cfb-title {
        font-size: 16px;
        font-weight: 700;
        background: linear-gradient(90deg, #6ee7b7, #3b82f6);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        letter-spacing: 0.3px;
      }
      #cses-friends-box .cfb-badge {
        font-size: 11px;
        background: rgba(99, 102, 241, 0.25);
        color: #a5b4fc;
        padding: 2px 8px;
        border-radius: 20px;
        font-weight: 600;
      }
      #cses-friends-box .cfb-list {
        list-style: none;
        padding: 0;
        margin: 0;
        display: flex;
        flex-direction: column;
        gap: 6px;
      }
      #cses-friends-box .cfb-item {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 8px 12px;
        border-radius: 8px;
        background: rgba(255, 255, 255, 0.04);
        transition: background 0.2s;
      }
      #cses-friends-box .cfb-item:hover {
        background: rgba(255, 255, 255, 0.08);
      }
      #cses-friends-box .cfb-icon {
        font-size: 16px;
        width: 22px;
        text-align: center;
        flex-shrink: 0;
      }
      #cses-friends-box .cfb-icon.solved { color: #34d399; }
      #cses-friends-box .cfb-icon.unsolved { color: #f87171; }
      #cses-friends-box .cfb-name {
        font-size: 14px;
        font-weight: 500;
      }
      #cses-friends-box .cfb-name a {
        color: inherit;
        text-decoration: none;
        border-bottom: 1px dashed rgba(255,255,255,0.25);
        transition: border-color 0.2s;
      }
      #cses-friends-box .cfb-name a:hover {
        border-bottom-color: #6ee7b7;
      }
      #cses-friends-box .cfb-loading {
        display: flex;
        align-items: center;
        gap: 10px;
        color: #a0a0b8;
        font-size: 13px;
      }
      #cses-friends-box .cfb-spinner {
        width: 16px;
        height: 16px;
        border: 2px solid rgba(255,255,255,0.15);
        border-top-color: #6ee7b7;
        border-radius: 50%;
        animation: cfb-spin 0.7s linear infinite;
      }
      @keyframes cfb-spin {
        to { transform: rotate(360deg); }
      }
      #cses-friends-box .cfb-empty {
        color: #71717a;
        font-size: 13px;
        font-style: italic;
      }
      #cses-friends-box .cfb-error {
        color: #fbbf24;
        font-size: 12px;
        margin-top: 2px;
      }
    </style>
    <div class="cfb-header">
      <span class="cfb-title">CSES Friends Solver</span>
      <span class="cfb-badge">Problem #${problemId}</span>
    </div>
    <div id="cfb-content">
      <div class="cfb-loading">
        <div class="cfb-spinner"></div>
        Loading friend data…
      </div>
    </div>
  `;

  // Insert box at the top of the problem content area
  const contentDiv =
    document.querySelector(".content") ||
    document.querySelector("#main-content") ||
    document.body;
  contentDiv.prepend(box);

  /* ── 3. Read friend list from storage ──────────────────────────── */
  // Each friend is stored as { id: "120526", name: "Bhavik" }
  let { friends = [] } = await chrome.storage.sync.get("friends");

  // Backward compat: if friends are plain strings, skip them (old format)
  friends = friends
    .map((f) => (typeof f === "string" ? null : f))
    .filter((f) => f && f.id);

  const contentEl = document.getElementById("cfb-content");

  if (friends.length === 0) {
    contentEl.innerHTML =
      '<p class="cfb-empty">No friends added yet. Click the extension icon to add friends (use numeric CSES User IDs).</p>';
    return;
  }

  /* ── 4. Cache helpers ──────────────────────────────────────────── */
  const CACHE_TTL = 60 * 60 * 1000; // 1 hour

  async function getCachedSolvedSet(userId) {
    const key = `cache_${userId}`;
    const data = (await chrome.storage.local.get(key))[key];
    if (data && data.ids && data.ids.length > 0 && Date.now() - data.ts < CACHE_TTL) {
      return new Set(data.ids);
    }
    // Clear stale/empty cache entries
    if (data) await chrome.storage.local.remove(key);
    return null;
  }

  async function setCachedSolvedSet(userId, ids) {
    if (ids.size === 0) return; // Don't cache empty results
    const key = `cache_${userId}`;
    await chrome.storage.local.set({ [key]: { ids: [...ids], ts: Date.now() } });
  }

  /* ── 5. Fetch & parse a user's solved problems ─────────────────── */
  async function fetchSolvedProblems(userId) {
    // Try cache first
    const cached = await getCachedSolvedSet(userId);
    if (cached) return { solved: cached, error: null };

    try {
      const resp = await fetch(
        `https://cses.fi/problemset/user/${userId}/`,
        { credentials: "include" }
      );
      if (!resp.ok) {
        return { solved: new Set(), error: `HTTP ${resp.status}` };
      }
      const html = await resp.text();
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, "text/html");

      // On CSES, solved problems are <a> tags with class "task-score icon full"
      // e.g. <a href="/problemset/task/1068/" class="task-score icon full"></a>
      const solvedIds = new Set();
      doc.querySelectorAll('a.full[href*="/problemset/task/"]').forEach((a) => {
        const m = a.getAttribute("href").match(/\/problemset\/task\/(\d+)/);
        if (m) solvedIds.add(m[1]);
      });

      await setCachedSolvedSet(userId, solvedIds);
      return { solved: solvedIds, error: null };
    } catch (err) {
      return { solved: new Set(), error: err.message };
    }
  }

  /* ── 6. Resolve all friends in parallel ────────────────────────── */
  const results = await Promise.all(
    friends.map(async (friend) => {
      const { solved, error } = await fetchSolvedProblems(friend.id);
      return {
        id: friend.id,
        name: friend.name || friend.id,
        hasSolved: solved.has(problemId),
        error,
      };
    })
  );

  /* ── 7. Render results ─────────────────────────────────────────── */
  // Sort: solved first, then alphabetical
  results.sort((a, b) => {
    if (a.hasSolved !== b.hasSolved) return a.hasSolved ? -1 : 1;
    return a.name.localeCompare(b.name);
  });

  const listHtml = results
    .map((r) => {
      const icon = r.hasSolved
        ? '<span class="cfb-icon solved">✓</span>'
        : '<span class="cfb-icon unsolved">✗</span>';
      const profileUrl = `https://cses.fi/problemset/user/${r.id}/`;
      const errorTag = r.error
        ? `<span class="cfb-error">(${r.error})</span>`
        : "";
      return `
        <li class="cfb-item">
          ${icon}
          <span class="cfb-name">
            <a href="${profileUrl}" target="_blank" rel="noopener">${r.name}</a>
          </span>
          ${errorTag}
        </li>`;
    })
    .join("");

  const solvedCount = results.filter((r) => r.hasSolved).length;
  contentEl.innerHTML = `
    <ul class="cfb-list">${listHtml}</ul>
    <div style="margin-top:10px;font-size:12px;color:#71717a;">
      ${solvedCount}/${results.length} friends solved this problem
    </div>
  `;
})();

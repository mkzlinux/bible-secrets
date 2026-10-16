/* Bereshit Lab — front end. Plain JS, no build step. */
const $ = (id) => document.getElementById(id);
const api = (path, params = {}) => {
  // Relative to the document, so the UI works at "/" and behind "/engine/".
  const url = new URL(path.replace(/^\/+/, ""), document.baseURI);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  return fetch(url).then((r) => r.json());
};

let current = "Gen.1.1";

/* ------------------------------------------------------------------ verse */
async function openVerse(osis) {
  const data = await api(`/api/verse/${osis}`);
  if (data.error) {
    alert(`“${osis}” was not found. Try Gen.1.1 or John 1:1.`);
    return;
  }
  current = data.osis;
  $("osis-label").textContent = data.osis;
  $("verse-meta").textContent = [
    data.testament === "OT" ? "Old Testament" : "New Testament",
    data.words.length ? `${data.words.length} Hebrew words` : null,
    data.wlc_osis && data.wlc_osis !== data.osis ? `WLC ${data.wlc_osis}` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  const hebrew = $("hebrew");
  hebrew.innerHTML = "";
  if (data.words.length) {
    data.words.forEach((word) => {
      const span = document.createElement("span");
      span.textContent = word.pointed;
      span.title = `${word.cons}${word.morph ? " · " + word.morph : ""}`;
      span.onclick = () => {
        $("nested-input").value = word.cons;
        $("cipher-input").value = word.cons;
        runNested(word.cons);
        showTab("nested");
      };
      hebrew.appendChild(span);
      hebrew.appendChild(document.createTextNode(" "));
    });
  } else {
    hebrew.textContent = "— no Hebrew for this verse (New Testament) —";
  }

  $("kjv").textContent = data.kjv || "";
  $("prev-verse").dataset.osis = data.prev || "";
  $("next-verse").dataset.osis = data.next || "";

  loadGraph(data.osis);
}

$("search-form").addEventListener("submit", (event) => {
  event.preventDefault();
  openVerse($("search-input").value.trim());
});
$("prev-verse").onclick = () => {
  const osis = $("prev-verse").dataset.osis;
  if (osis) openVerse(osis);
};
$("next-verse").onclick = () => {
  const osis = $("next-verse").dataset.osis;
  if (osis) openVerse(osis);
};

/* -------------------------------------------------------------------- tabs */
function showTab(name) {
  document.querySelectorAll(".panel").forEach((panel) => {
    panel.classList.toggle("active", panel.id === `panel-${name}`);
  });
  document.querySelectorAll("#tabs button").forEach((button) => {
    button.classList.toggle("active", button.dataset.tab === name);
  });
  if (name === "els" && !$("els-hits").dataset.loaded) runEls();
}
$("tabs").addEventListener("click", (event) => {
  const tab = event.target.dataset.tab;
  if (tab) showTab(tab);
});

/* ------------------------------------------------------------------- graph */
const canvas = $("graph-canvas");
const ctx = canvas.getContext("2d");
let simulation = null;

function fitCanvas() {
  const ratio = window.devicePixelRatio || 1;
  const width = canvas.clientWidth || 640;
  canvas.width = width * ratio;
  canvas.height = 420 * ratio;
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
}
window.addEventListener("resize", () => {
  fitCanvas();
  draw();
});

let nodes = [];
let links = [];

async function loadGraph(osis) {
  const [graph, xrefs] = await Promise.all([api(`/api/graph/${osis}`), api(`/api/xrefs/${osis}`)]);
  nodes = graph.nodes.map((node, index) => ({
    ...node,
    x: canvas.clientWidth / 2 + Math.cos(index) * 120,
    y: 210 + Math.sin(index) * 90,
    vx: 0,
    vy: 0,
  }));
  links = graph.links.map((link) => ({
    ...link,
    source: nodes.findIndex((n) => n.osis === link.source),
    target: nodes.findIndex((n) => n.osis === link.target),
  }));
  fitCanvas();
  startSimulation();

  fill("xref-out", xrefs.refs, "No outgoing references recorded.");
  fill("xref-in", xrefs.incoming, "Nothing cites this verse in the graph.");
  $("search-input").value = osis;
}

function fill(listId, items, emptyText) {
  const list = $(listId);
  list.innerHTML = "";
  if (!items.length) {
    const li = document.createElement("li");
    li.className = "gloss";
    li.textContent = emptyText;
    list.appendChild(li);
    return;
  }
  items.slice(0, 22).forEach((item) => {
    const li = document.createElement("li");
    const button = document.createElement("button");
    button.textContent = item.osis;
    button.onclick = () => openVerse(item.osis);
    const gloss = document.createElement("span");
    gloss.className = "gloss";
    gloss.textContent = (item.kjv || "").slice(0, 54) + ((item.kjv || "").length > 54 ? "…" : "");
    const votes = document.createElement("span");
    votes.className = "votes";
    votes.textContent = `▲ ${item.votes}`;
    li.append(button, gloss, votes);
    list.appendChild(li);
  });
}

function startSimulation() {
  if (simulation) cancelAnimationFrame(simulation);
  let ticks = 0;
  const step = () => {
    ticks += 1;
    const width = canvas.clientWidth;
    const height = 420;

    nodes.forEach((node) => {
      node.vx *= 0.86;
      node.vy *= 0.86;
      if (node.centre) {
        node.vx += (width / 2 - node.x) * 0.06;
        node.vy += (height / 2 - node.y) * 0.06;
      }
    });

    links.forEach((link) => {
      const a = nodes[link.source];
      const b = nodes[link.target];
      if (!a || !b) return;
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const distance = Math.max(Math.hypot(dx, dy), 1);
      const desired = 130 - Math.min(60, link.votes);
      const force = (distance - desired) / distance / 46;
      a.vx += dx * force;
      a.vy += dy * force;
      b.vx -= dx * force;
      b.vy -= dy * force;
    });

    for (let i = 0; i < nodes.length; i += 1) {
      for (let j = i + 1; j < nodes.length; j += 1) {
        const a = nodes[i];
        const b = nodes[j];
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const distance = Math.max(Math.hypot(dx, dy), 1);
        if (distance < 90) {
          const push = (90 - distance) / distance / 260;
          a.vx -= dx * push;
          a.vy -= dy * push;
          b.vx += dx * push;
          b.vy += dy * push;
        }
      }
    }

    nodes.forEach((node) => {
      if (!node.centre) {
        node.x += node.vx;
        node.y += node.vy;
        node.x = Math.max(24, Math.min(canvas.clientWidth - 24, node.x));
        node.y = Math.max(24, Math.min(height - 24, node.y));
      }
    });

    draw();
    if (ticks < 700) simulation = requestAnimationFrame(step);
  };
  simulation = requestAnimationFrame(step);
}

function draw() {
  if (!nodes.length) return;
  const width = canvas.clientWidth;
  const height = 420;
  ctx.clearRect(0, 0, width, height);

  links.forEach((link) => {
    const a = nodes[link.source];
    const b = nodes[link.target];
    if (!a || !b) return;
    ctx.strokeStyle = `rgba(212,180,90,${Math.min(0.75, 0.16 + link.votes / 120)})`;
    ctx.lineWidth = Math.min(3, 0.5 + link.votes / 30);
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.stroke();
  });

  nodes.forEach((node) => {
    const colour = node.centre ? "#d4b45a" : node.testament === "NT" ? "#e08b7a" : "#7ec8b8";
    ctx.beginPath();
    ctx.arc(node.x, node.y, node.centre ? 9 : 5.5, 0, Math.PI * 2);
    ctx.fillStyle = colour;
    ctx.fill();
    ctx.fillStyle = "rgba(243,234,216,0.62)";
    ctx.font = "10px Inter, system-ui, sans-serif";
    ctx.fillText(node.osis, node.x + 9, node.y + 3);
  });
}

canvas.addEventListener("click", (event) => {
  const rect = canvas.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;
  const hit = nodes.find((node) => Math.hypot(node.x - x, node.y - y) < 14);
  if (hit) openVerse(hit.osis);
});

/* ------------------------------------------------------------ nested words */
async function runNested(query) {
  const data = await api("/api/nested", { q: query });
  const cards = $("letter-cards");
  cards.innerHTML = "";
  (data.letters || []).forEach((letter) => {
    const card = document.createElement("div");
    card.className = "card";
    card.innerHTML = `<b>${letter.char}</b><small>${letter.name}</small><small>${letter.pictograph}</small><i>${letter.value}</i>`;
    cards.appendChild(card);
  });

  $("nested-summary").textContent = data.lang === "he"
    ? `${data.consonants} · ${data.letters.length} consonants · gematria ${data.gematria}`
    : `${data.consonants} · ${data.hits.length} consecutive hits in the KJV vocabulary`;

  const hits = $("nested-hits");
  hits.innerHTML = "";
  (data.hits || []).slice(0, 40).forEach((hit) => {
    const li = document.createElement("li");
    const text = document.createElement("span");
    text.className = "tk";
    text.dir = data.lang === "he" ? "rtl" : "ltr";
    text.textContent = hit.text;
    const gloss = document.createElement("span");
    gloss.className = "gloss";
    const first = (hit.entries && hit.entries[0]) || {};
    gloss.textContent = `${first.gloss || ""}${hit.entries && hit.entries.length > 1 ? ` (+${hit.entries.length - 1})` : ""}`;
    const code = document.createElement("span");
    code.className = "votes";
    code.textContent = first.strongs || "";
    li.append(text, gloss, code);
    hits.appendChild(li);
  });

  const segs = $("nested-segs");
  segs.innerHTML = "";
  (data.segmentations || []).forEach((seg) => {
    const li = document.createElement("li");
    const words = document.createElement("span");
    words.className = "tk";
    words.dir = data.lang === "he" ? "rtl" : "ltr";
    words.textContent = seg.words.join(" + ");
    const gloss = document.createElement("span");
    gloss.className = "gloss";
    gloss.textContent = seg.glosses.join(" · ");
    li.append(words, gloss);
    segs.appendChild(li);
  });
}

$("nested-he").onclick = () => {
  $("nested-input").value = "בראשית";
  runNested("בראשית");
};
$("nested-en").onclick = () => {
  $("nested-input").value = "beginning";
  runNested("beginning");
};
$("nested-input").addEventListener("keydown", (event) => {
  if (event.key === "Enter") runNested($("nested-input").value);
});

/* ----------------------------------------------------------------- ciphers */
async function runCiphers() {
  const data = await api("/api/anagrams", { q: $("cipher-input").value });
  const cards = $("cipher-cards");
  cards.innerHTML = "";
  if (data.error) {
    cards.innerHTML = `<div class="card"><span>note</span><b>${data.error}</b></div>`;
    return;
  }
  const rows = [
    ["Gematria", data.gematria],
    ["Atbash", data.atbash],
    ["Albam", data.albam],
    ["Consonants", data.consonants],
  ];
  rows.forEach(([label, value]) => {
    const card = document.createElement("div");
    card.className = "card";
    card.innerHTML = `<span>${label}</span><b dir="${label === "Gematria" ? "ltr" : "rtl"}">${value}</b>`;
    cards.appendChild(card);
  });

  const list = (id, items, empty) => {
    const host = $(id);
    host.innerHTML = "";
    if (!items.length) {
      host.innerHTML = `<li class="gloss">${empty}</li>`;
      return;
    }
    items.slice(0, 30).forEach((item) => {
      const li = document.createElement("li");
      li.innerHTML = `<span class="tk" dir="rtl">${item.cons}</span><span class="gloss">${item.gloss || ""}</span><span class="votes">${item.strongs}</span>`;
      host.appendChild(li);
    });
  };
  list("cipher-twins", data.twins || [], "No gematria twins.");
  list("cipher-anagrams", data.anagrams || [], "No anagram twins.");
  $("nested-summary").textContent = `gematria ${data.gematria} · atbash ${data.atbash} · albam ${data.albam}`;
}
$("cipher-run").onclick = runCiphers;
$("cipher-input").addEventListener("keydown", (event) => {
  if (event.key === "Enter") runCiphers();
});

/* --------------------------------------------------------------------- ELS */
async function runEls() {
  const hits = $("els-hits");
  hits.innerHTML = "<li class='gloss'>Scanning skip distances…</li>";
  const data = await api("/api/els", {
    q: $("els-term").value,
    scope: $("els-scope").value,
    min: $("els-min").value,
    max: $("els-max").value,
  });
  $("els-caveat").textContent = data.caveat || "";
  hits.innerHTML = "";
  (data.hits || []).forEach((hit) => {
    const li = document.createElement("li");
    const head = document.createElement("div");
    head.className = "hit-head";
    head.innerHTML = `<span class="skip">skip ${hit.skip} · ${hit.start_osis} → ${hit.end_osis}</span>`;
    const context = document.createElement("div");
    context.className = "hit-context";
    const marked = [...hit.context]
      .map((ch, index) => {
        const absolute = hit.context_start + index;
        return hit.letters.includes(absolute) ? `<mark>${ch}</mark>` : ch;
      })
      .join("");
    context.innerHTML = marked;
    li.append(head, context);
    hits.appendChild(li);
  });
  if (!data.hits || !data.hits.length) {
    hits.innerHTML = `<li class="gloss">No hits for “${data.term}” in ${data.scope} at those skips (tape length ${data.tape_length.toLocaleString()}).</li>`;
  }
  hits.dataset.loaded = "1";
  $("search-input").value = current;
}
$("els-run").onclick = runEls;

/* ------------------------------------------------------------------- boot */
async function boot() {
  const stats = await api("/api/stats");
  const counts = stats.counts;
  $("stats").textContent = `${stats.name} · ${counts.verses.toLocaleString()} verses · ${counts.hebrew_words.toLocaleString()} Hebrew words · ${counts.lexicon.toLocaleString()} Strong's entries · ${counts.xrefs.toLocaleString()} cross-reference edges · ${counts.vocab.toLocaleString()} KJV types`;
  $("els-caveat").textContent = stats.caveat_els;
  await openVerse("Gen.1.1");
  await runNested("בראשית");
  await runCiphers();

  // deep links from the site: /?tab=graph, /?tab=els, /?verse=John.1.1
  const params = new URLSearchParams(window.location.search);
  const verse = params.get("verse");
  if (verse) await openVerse(verse);
  const tab = params.get("tab");
  if (tab) showTab(tab);
}

boot();

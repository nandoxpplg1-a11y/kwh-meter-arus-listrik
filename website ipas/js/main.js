/* kWh Meter — kalkulator listrik (halaman index.html) */
const REDUCE = matchMedia("(prefers-reduced-motion: reduce)").matches;
function tween(el, to, fmt) {
    const from = el._v || 0; el._v = to; cancelAnimationFrame(el._r);
    if (REDUCE || from === to) { el.textContent = fmt(to); return; }
    const t0 = performance.now(), d = 550;
    const step = t => { const k = Math.min(1, (t - t0) / d), e = 1 - Math.pow(1 - k, 3); el.textContent = fmt(from + (to - from) * e); if (k < 1) el._r = requestAnimationFrame(step); };
    el._r = requestAnimationFrame(step);
}
let newIdx = -1;
const VA = [
    { va: 450, label: "450 VA", tarif: 415 },
    { va: 900, label: "900 VA subsidi", tarif: 605 },
    { va: 1300, label: "1.300 VA", tarif: 1444.7 },
    { va: 2200, label: "2.200 VA", tarif: 1444.7 },
    { va: 3500, label: "3.500 VA", tarif: 1699.53 },
    { va: 5500, label: "5.500 VA", tarif: 1699.53 },
    { va: 6600, label: "6.600 VA", tarif: 1699.53 }
];
const PRESETS = [
    { n: "AC 1 PK", w: 800, h: 8 }, { n: "Kulkas", w: 120, h: 24 }, { n: "TV LED", w: 80, h: 5 },
    { n: "Lampu LED", w: 10, h: 8 }, { n: "Kipas angin", w: 50, h: 8 }, { n: "Rice cooker", w: 400, h: 3 },
    { n: "Mesin cuci", w: 350, h: 1 }, { n: "Laptop", w: 65, h: 6 }, { n: "Pompa air", w: 250, h: 2 },
    { n: "Setrika", w: 350, h: 1 }, { n: "Charger HP", w: 15, h: 3 }, { n: "Wi-Fi router", w: 12, h: 24 }
];
const DEFAULT = [{ n: "Kulkas", w: 120, h: 24, q: 1 }, { n: "Lampu LED", w: 10, h: 8, q: 5 }, { n: "TV LED", w: 80, h: 5, q: 1 }];
let devices = [];
const $ = id => document.getElementById(id);
const rp = n => "Rp " + Math.round(n).toLocaleString("id-ID");
const rpd = n => "Rp " + n.toLocaleString("id-ID", { maximumFractionDigits: 2 }); // tarif dengan desimal
const num = (v) => { const x = parseFloat(v); return isFinite(x) && x > 0 ? x : 0; };
const kwhFmt = n => n.toLocaleString("id-ID", { maximumFractionDigits: 2, minimumFractionDigits: 2 });

/* Animasikan lebar bar/meter dari nilai sebelumnya ke nilai baru
   (elemen dirender ulang tiap hitung, jadi lebar lama diingat). */
const PREV = {};
function grow(root, key) {
    const els = root.querySelectorAll("[data-w]");
    els.forEach((e, i) => { e.style.width = (PREV[key + i] || 0) + "%"; });
    void root.offsetWidth;
    els.forEach((e, i) => { const w = +e.dataset.w; e.style.width = w + "%"; PREV[key + i] = w; });
}

function save() {
    try {
        localStorage.setItem("kwh-v2", JSON.stringify({ devices, va: $("va").value, tarif: $("tarif").value, hari: $("hari").value, ppj: $("ppj").value, budget: $("budget").value }));
    } catch (e) { }
}
function load() {
    try {
        const s = JSON.parse(localStorage.getItem("kwh-v2") || "null");
        if (s && Array.isArray(s.devices)) return s;
    } catch (e) { }
    return null;
}

function init() {
    $("va").innerHTML = VA.map(v => `<option value="${v.va}">${v.label}</option>`).join("");
    $("chips").innerHTML = PRESETS.map((p, i) => `<button class="chip" data-i="${i}">+ ${p.n}</button>`).join("");
    const s = load();
    if (s) {
        devices = s.devices;
        $("va").value = s.va || 1300; $("tarif").value = s.tarif;
        $("hari").value = s.hari || 30; $("ppj").value = s.ppj || 0; $("budget").value = s.budget || "";
    } else {
        devices = DEFAULT.map(d => ({ ...d }));
        $("va").value = 1300; setTarifFromVA();
    }
    if (!$("tarif").value) setTarifFromVA();
    renderList(); calc();
}
function setTarifFromVA() {
    const v = VA.find(x => x.va == $("va").value);
    $("tarif").value = v ? v.tarif : 1444.7;
}

function renderList() {
    const el = $("list");
    if (!devices.length) { el.innerHTML = `<div class="empty">Belum ada perangkat. Ketuk salah satu tombol di atas untuk memulai.</div>`; return; }
    el.innerHTML = devices.map((d, i) => `
    <div class="dev${i === newIdx ? " new" : ""}" data-i="${i}">
      <div class="dev-top">
        <input data-k="n" value="${esc(d.n)}" placeholder="Nama perangkat" aria-label="Nama perangkat">
        <button class="del" data-del="${i}" aria-label="Hapus">✕</button>
      </div>
      <div class="row3">
        <div><label>Daya (Watt)</label><input data-k="w" type="number" inputmode="decimal" min="0" value="${d.w}"></div>
        <div><label>Jam / hari</label><input data-k="h" type="number" inputmode="decimal" min="0" max="24" value="${d.h}"></div>
        <div><label>Jumlah unit</label><input data-k="q" type="number" inputmode="numeric" min="1" value="${d.q}"></div>
      </div>
      <div class="dev-cost" id="dc${i}"></div>
    </div>`).join("");
    newIdx = -1;
}

function calc() {
    const hari = num($("hari").value) || 1;
    const tarif = num($("tarif").value);
    const ppj = num($("ppj").value);
    const rows = devices.map(d => {
        const kwhDay = num(d.w) * Math.min(num(d.h), 24) * Math.max(num(d.q), 0) / 1000;
        return { ...d, kwhDay, kwh: kwhDay * hari, cost: kwhDay * hari * tarif };
    });
    const kwh = rows.reduce((a, r) => a + r.kwh, 0);
    const base = kwh * tarif;
    const total = base * (1 + ppj / 100);
    rows.forEach((r, i) => { const e = $("dc" + i); if (e) e.innerHTML = `<b>${kwhFmt(r.kwh)} kWh</b> · <b>${rp(r.cost)}</b> untuk ${hari} hari<br>Arus ≈ <b>${(num(r.w) * Math.max(num(r.q), 0) / 220).toLocaleString("id-ID", { maximumFractionDigits: 2 })} A</b> pada 220 V (I = P ÷ V)`; });

    tween($("cost"), total, rp);
    $("sub").textContent = `${kwhFmt(kwh)} kWh untuk ${hari} hari${ppj ? ` (termasuk PPJ ${ppj}%)` : ""}`;
    tween($("perDay"), total / hari, rp);
    tween($("perYear"), total / hari * 365, rp);
    const dial = $("dial"); dial.classList.toggle("paused", kwh <= 0);
    dial.style.setProperty("--spin", Math.max(.5, 6 / (1 + kwh / hari)) + "s");
    $("rate").textContent = rpd(tarif) + "/kWh";
    $("token").textContent = kwhFmt(kwh) + " kWh";

    // Budget
    const bud = num($("budget").value);
    $("budgetCard").hidden = !bud;
    if (bud) {
        const diff = bud - total, pct = Math.min(100, total / bud * 100);
        const cls = total <= bud * 0.9 ? "ok" : (total <= bud ? "warn" : "bad");
        const maxKwh = tarif ? bud / (tarif * (1 + ppj / 100)) : 0;
        $("budgetInfo").innerHTML = `
      <span class="badge ${cls}">${diff >= 0 ? "Masih aman" : "Melebihi budget"}</span>
      <div class="meter"><div data-w="${pct}" style="background:${cls == "bad" ? "var(--bad)" : cls == "warn" ? "var(--warn)" : "var(--brand)"}"></div></div>
      <p class="hint">${diff >= 0 ? `Sisa ${rp(diff)}.` : `Lebih ${rp(-diff)}.`} Budget ini setara maksimal sekitar <b>${kwhFmt(maxKwh)} kWh</b> untuk ${hari} hari (≈ ${kwhFmt(maxKwh / hari)} kWh/hari).</p>`;
        grow($("budgetInfo"), "bud");
    }

    // Bars
    const sorted = rows.filter(r => r.cost > 0).sort((a, b) => b.cost - a.cost);
    const max = sorted[0]?.cost || 1;
    $("bars").innerHTML = sorted.length ? sorted.map(r => `
    <div class="bar-row"><div class="bar-top"><span>${esc(r.n || "Tanpa nama")}</span><b>${rp(r.cost)} · ${base ? Math.round(r.cost / base * 100) : 0}%</b></div>
    <div class="bar"><div data-w="${r.cost / max * 100}"></div></div></div>`).join("") : `<div class="empty">Isi daya & durasi untuk melihat grafik.</div>`;
    grow($("bars"), "bar");

    if (sorted[0]) {
        const top = sorted[0];
        const saving = top.cost * 0.2;
        $("tip").innerHTML = `💡 <b>${esc(top.n || "Perangkat teratas")}</b> memakai ${Math.round(top.cost / base * 100)}% tagihanmu. Mengurangi pemakaiannya 20% bisa menghemat sekitar <b>${rp(saving)}</b> per ${hari} hari.`;
    } else $("tip").innerHTML = "💡 Tips: matikan perangkat standby & pakai lampu LED untuk hemat.";

    // Capacity
    const va = num($("va").value);
    const watts = rows.reduce((a, r) => a + num(r.w) * Math.max(num(r.q), 0), 0);
    const safe = va * 0.8; // faktor daya ±0,8
    const pct = safe ? watts / safe * 100 : 0;
    const cls = pct <= 70 ? "ok" : pct <= 100 ? "warn" : "bad";
    const msg = pct <= 70 ? "Aman" : pct <= 100 ? "Hati-hati, mendekati batas" : "Berisiko MCB turun";
    $("cap").innerHTML = `
    <span class="badge ${cls}">${msg}</span>
    <div class="meter"><div data-w="${Math.min(100, pct)}" style="background:${cls == "bad" ? "var(--bad)" : cls == "warn" ? "var(--warn)" : "var(--brand)"}"></div></div>
    <p class="hint">Jika semua perangkat menyala bersamaan: <b>${watts.toLocaleString("id-ID")} W</b> dari kapasitas aman ± <b>${Math.round(safe).toLocaleString("id-ID")} W</b> (${Math.round(va).toLocaleString("id-ID")} VA × 0,8). Arus total ≈ <b>${(watts / 220).toLocaleString("id-ID", { maximumFractionDigits: 1 })} A</b> dari batas MCB ± <b>${(va / 220).toLocaleString("id-ID", { maximumFractionDigits: 1 })} A</b> (220 V). Ini perkiraan kasar; perangkat motor seperti AC/pompa butuh arus awal lebih besar.</p>`;
    grow($("cap"), "cap");

    window.__summary = `⚡ Estimasi listrik ${hari} hari\n` + sorted.map(r => `• ${r.n || "Perangkat"}: ${kwhFmt(r.kwh)} kWh = ${rp(r.cost)}`).join("\n") + `\n\nTotal: ${kwhFmt(kwh)} kWh\nBiaya: ${rp(total)} (tarif ${rpd(tarif)}/kWh${ppj ? `, PPJ ${ppj}%` : ""})`;
    save();
}
function esc(s) { return String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c])); }

$("chips").addEventListener("click", e => {
    const b = e.target.closest(".chip"); if (!b) return;
    const p = PRESETS[b.dataset.i]; devices.push({ n: p.n, w: p.w, h: p.h, q: 1 }); newIdx = devices.length - 1;
    renderList(); calc(); toast(p.n + " ditambahkan");
});
$("list").addEventListener("input", e => {
    const k = e.target.dataset.k, row = e.target.closest(".dev"); if (!k || !row) return;
    devices[row.dataset.i][k] = e.target.value;
    calc();
});
$("list").addEventListener("click", e => {
    const d = e.target.closest(".del"); if (!d) return;
    devices.splice(+d.dataset.del, 1); renderList(); calc();
});
$("addBlank").onclick = () => { devices.push({ n: "", w: 0, h: 1, q: 1 }); newIdx = devices.length - 1; renderList(); calc(); };
$("reset").onclick = () => { devices = DEFAULT.map(d => ({ ...d })); $("hari").value = 30; $("ppj").value = 0; $("budget").value = ""; $("va").value = 1300; setTarifFromVA(); renderList(); calc(); toast("Data dikembalikan ke contoh"); };
$("va").addEventListener("change", () => { setTarifFromVA(); calc(); });
["tarif", "hari", "ppj", "budget"].forEach(id => $(id).addEventListener("input", calc));
$("copy").onclick = async () => {
    try { await navigator.clipboard.writeText(window.__summary); toast("Ringkasan disalin"); }
    catch (e) { const t = document.createElement("textarea"); t.value = window.__summary; document.body.appendChild(t); t.select(); document.execCommand("copy"); t.remove(); toast("Ringkasan disalin"); }
};
init();
/* Hukum Ohm: V = I × R (halaman ohm.html) */
const $ = id => document.getElementById(id);
let ohmMode = "I";
const ohmF = n => Number(n.toPrecision(6)).toLocaleString("id-ID", { maximumFractionDigits: 6 });

function setResults(v, i, r, p) {
    $("rV").textContent = ohmF(v) + " V";
    $("rI").textContent = ohmF(i) + " A";
    $("rR").textContent = ohmF(r) + " Ω";
    $("rP").textContent = ohmF(p) + " W";
}

function ohmCalc() {
    const el = { V: $("oV"), I: $("oI"), R: $("oR") };
    ["V", "I", "R"].forEach(k => { el[k].readOnly = k === ohmMode; });
    const V = parseFloat(el.V.value), I = parseFloat(el.I.value), R = parseFloat(el.R.value);
    const out = $("ohmFormula"), extra = $("ohmExtra"), cir = $("circuit");
    let v = V, i = I, r = R, f = "", err = "";
    if (ohmMode === "I") {
        if (!(V >= 0) || !(R > 0)) err = "Isi V (≥ 0) dan R (> 0).";
        else { i = V / R; el.I.value = Number(i.toPrecision(6)); f = `I = V ÷ R = ${ohmF(V)} ÷ ${ohmF(R)} = ${ohmF(i)} A`; }
    } else if (ohmMode === "V") {
        if (!(I >= 0) || !(R >= 0)) err = "Isi I dan R (≥ 0).";
        else { v = I * R; el.V.value = Number(v.toPrecision(6)); f = `V = I × R = ${ohmF(I)} × ${ohmF(R)} = ${ohmF(v)} V`; }
    } else {
        if (!(V >= 0) || !(I > 0)) err = "Isi V (≥ 0) dan I (> 0).";
        else { r = V / I; el.R.value = Number(r.toPrecision(6)); f = `R = V ÷ I = ${ohmF(V)} ÷ ${ohmF(I)} = ${ohmF(r)} Ω`; }
    }
    if (err) {
        out.textContent = err; extra.textContent = "";
        ["rV", "rI", "rR", "rP"].forEach(id => $(id).textContent = "-");
        cir.classList.add("paused"); return;
    }
    out.textContent = f;
    const p = v * i;
    setResults(v, i, r, p);
    cir.classList.toggle("paused", !(i > 0));
    cir.style.setProperty("--flow", Math.min(6, Math.max(.35, 2.2 / Math.sqrt(Math.max(i, .01)))) + "s");
    cir.querySelector(".glow").style.opacity = Math.min(.95, .15 + p / 1500);
    $("cirI").textContent = "I = " + ohmF(i) + " A";
    $("cirV").textContent = "V = " + ohmF(v) + " V";
    $("cirR").textContent = "R = " + ohmF(r) + " Ω";
    extra.innerHTML = `Daya listrik P = V × I ≈ <b>${ohmF(p)} W</b>. Arus ${ohmF(i)} A = <b>${ohmF(i * 1000)} mA</b>.` + (i > 0 ? ` Energi bila menyala 1 jam ≈ ${ohmF(p / 1000)} kWh.` : "");
}

function setMode(m) {
    ohmMode = m;
    [...$("ohmSeg").children].forEach(x => x.classList.toggle("on", x.dataset.m === m));
    ohmCalc();
}

$("ohmSeg").addEventListener("click", e => {
    const b = e.target.closest("button"); if (!b) return;
    setMode(b.dataset.m);
});
["oV", "oI", "oR"].forEach(id => $(id).addEventListener("input", ohmCalc));
function useVolt(v) {
    $("oV").value = v;
    if (ohmMode === "V") ohmMode = "I";
    setMode(ohmMode);
}
$("ohm220").onclick = () => useVolt(220);
$("vChips").addEventListener("click", e => {
    const b = e.target.closest(".chip"); if (!b) return;
    useVolt(b.dataset.v); toast("V diisi " + b.dataset.v + " volt");
});
ohmCalc();
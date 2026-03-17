import React, { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import "./App.css";

/* ─────────────────────────────────────────────────────────────────
   COOKIE + LOCALSTORAGE HELPERS
───────────────────────────────────────────────────────────────── */
const COOKIE_NAME = "nyc_subway_rides";
const DATA_KEY = "nyc_subway_datasets_v1";

function readRidesFromCookie() {
  try {
    const match = document.cookie
      .split(";")
      .map((c) => c.trim())
      .find((c) => c.startsWith(`${COOKIE_NAME}=`));
    if (!match) return [];
    const arr = JSON.parse(decodeURIComponent(match.split("=")[1] || ""));
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

function writeRidesToCookie(rides) {
  try {
    const value = encodeURIComponent(JSON.stringify(rides));
    document.cookie = `${COOKIE_NAME}=${value}; Max-Age=${60 * 60 * 24 * 400}; Path=/`;
  } catch {}
}

function useCookieRides() {
  const [rides, setRides] = useState(readRidesFromCookie);
  useEffect(() => writeRidesToCookie(rides), [rides]);
  return [rides, setRides];
}

/* ─────────────────────────────────────────────────────────────────
   INLINE DATASETS  (no fetch needed — editable in localStorage)
───────────────────────────────────────────────────────────────── */
const DEFAULT_DATASETS = {
  rollingStock: [
    { model: "R62",  ranges: [[1301,1390],[1601,1625]], division: "A" },
    { model: "R62A", ranges: [[1651,2150]],             division: "A" },
    { model: "R142", ranges: [[6301,6899]],             division: "A" },
    { model: "R142A",ranges: [[7211,7590]],             division: "A" },
    { model: "R188", ranges: [[7811,7936]],             division: "A" },
    { model: "R68",  ranges: [[2500,2790]],             division: "B" },
    { model: "R68A", ranges: [[5001,5296]],             division: "B" },
    { model: "R160A",ranges: [[8313,8652]],             division: "B" },
    { model: "R160B",ranges: [[8713,9942]],             division: "B" },
    { model: "R179", ranges: [[3010,3327]],             division: "B" },
    { model: "R211A",ranges: [[3400,4499]],             division: "B" },
    { model: "R211S (SIR)", ranges: [[100,199]],        division: "SIR" },
  ],
  lines: [
    { id:"1",   label:"1",   division:"A",   color:"#EE352E", textColor:"#fff", terminals:["Van Cortlandt Park–242 St","South Ferry"] },
    { id:"2",   label:"2",   division:"A",   color:"#EE352E", textColor:"#fff", terminals:["Wakefield–241 St","Flatbush Av–Bklyn College"] },
    { id:"3",   label:"3",   division:"A",   color:"#EE352E", textColor:"#fff", terminals:["Harlem–148 St","New Lots Av"] },
    { id:"4",   label:"4",   division:"A",   color:"#00933C", textColor:"#fff", terminals:["Woodlawn","Crown Hts–Utica Av"] },
    { id:"5",   label:"5",   division:"A",   color:"#00933C", textColor:"#fff", terminals:["Eastchester–Dyre Av","Flatbush Av"] },
    { id:"6",   label:"6",   division:"A",   color:"#00933C", textColor:"#fff", terminals:["Pelham Bay Park","Brooklyn Bridge–City Hall"] },
    { id:"7",   label:"7",   division:"A",   color:"#B933AD", textColor:"#fff", terminals:["Flushing–Main St","34 St–Hudson Yards"] },
    { id:"A",   label:"A",   division:"B",   color:"#2850AD", textColor:"#fff", terminals:["Inwood–207 St","Far Rockaway / Lefferts Blvd"] },
    { id:"B",   label:"B",   division:"B",   color:"#FF6319", textColor:"#fff", terminals:["Bedford Park Blvd","Brighton Beach"] },
    { id:"C",   label:"C",   division:"B",   color:"#2850AD", textColor:"#fff", terminals:["168 St","Euclid Av"] },
    { id:"D",   label:"D",   division:"B",   color:"#FF6319", textColor:"#fff", terminals:["Norwood–205 St","Coney Island–Stillwell Av"] },
    { id:"E",   label:"E",   division:"B",   color:"#2850AD", textColor:"#fff", terminals:["Jamaica Center","World Trade Center"] },
    { id:"F",   label:"F",   division:"B",   color:"#FF6319", textColor:"#fff", terminals:["Jamaica–179 St","Coney Island–Stillwell Av"] },
    { id:"G",   label:"G",   division:"B",   color:"#6CBE45", textColor:"#fff", terminals:["Court Sq","Church Av"] },
    { id:"J",   label:"J",   division:"B",   color:"#996633", textColor:"#fff", terminals:["Jamaica Center","Broad St"] },
    { id:"Z",   label:"Z",   division:"B",   color:"#996633", textColor:"#fff", terminals:["Jamaica Center","Broad St"] },
    { id:"L",   label:"L",   division:"B",   color:"#A7A9AC", textColor:"#fff", terminals:["8 Av","Canarsie–Rockaway Pkwy"] },
    { id:"M",   label:"M",   division:"B",   color:"#FF6319", textColor:"#fff", terminals:["Forest Hills–71 Av","Delancey–Essex"] },
    { id:"N",   label:"N",   division:"B",   color:"#FCCC0A", textColor:"#000", terminals:["Astoria–Ditmars Blvd","Coney Island–Stillwell Av"] },
    { id:"Q",   label:"Q",   division:"B",   color:"#FCCC0A", textColor:"#000", terminals:["96 St","Coney Island–Stillwell Av"] },
    { id:"R",   label:"R",   division:"B",   color:"#FCCC0A", textColor:"#000", terminals:["Forest Hills–71 Av","Bay Ridge–95 St"] },
    { id:"W",   label:"W",   division:"B",   color:"#FCCC0A", textColor:"#000", terminals:["Astoria–Ditmars Blvd","Whitehall St"] },
    { id:"S",   label:"S",   division:"A",   color:"#808183", textColor:"#fff", terminals:["Times Sq–42 St","Grand Central–42 St"] },
    { id:"SIR", label:"SIR", division:"SIR", color:"#0039A6", textColor:"#fff", terminals:["St George","Tottenville"] },
  ],
};

function getDatasets() {
  try {
    const saved = localStorage.getItem(DATA_KEY);
    return saved ? JSON.parse(saved) : DEFAULT_DATASETS;
  } catch {
    return DEFAULT_DATASETS;
  }
}

function saveDatasets(ds) {
  localStorage.setItem(DATA_KEY, JSON.stringify(ds));
}

function detectModelFromNumber(numStr, rollingStock) {
  const n = parseInt(numStr, 10);
  if (Number.isNaN(n)) return null;
  for (const entry of rollingStock) {
    for (const [lo, hi] of entry.ranges) {
      if (n >= lo && n <= hi) return { model: entry.model, division: entry.division };
    }
  }
  return null;
}

/* ─────────────────────────────────────────────────────────────────
   SHARED UI
───────────────────────────────────────────────────────────────── */
function LineBullet({ label, color, textColor = "#fff", size = 48, selected, onClick }) {
  return (
    <button
      onClick={onClick}
      title={`Line ${label}`}
      style={{
        width: size, height: size, minWidth: size,
        borderRadius: "50%",
        background: color,
        color: textColor,
        fontWeight: 900,
        fontSize: size * 0.38,
        fontFamily: "'Barlow Condensed', 'Arial Narrow', sans-serif",
        border: selected ? "3px solid #FCCC0A" : "3px solid transparent",
        boxShadow: selected
          ? `0 0 0 3px rgba(252,204,10,0.4), 0 4px 16px ${color}66`
          : `0 2px 8px ${color}44`,
        transform: selected ? "scale(1.15)" : "scale(1)",
        transition: "all 0.15s ease",
        cursor: onClick ? "pointer" : "default",
        display: "flex", alignItems: "center", justifyContent: "center",
        flexShrink: 0,
        lineHeight: 1,
      }}
    >
      {label}
    </button>
  );
}

function ProgressBar({ value, color = "#00933C" }) {
  return (
    <div style={{ width: "100%", height: 8, background: "rgba(255,255,255,0.1)", borderRadius: 4, overflow: "hidden" }}>
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${Math.min(100, value)}%` }}
        transition={{ duration: 0.7, ease: "easeOut" }}
        style={{ height: "100%", background: color, borderRadius: 4 }}
      />
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────
   LIVE RIDER PAGE
───────────────────────────────────────────────────────────────── */
const DIV_LABELS = { A: "A Division · IRT", B: "B Division · IND/BMT", SIR: "Staten Island Rwy" };

function LiveRider({ datasets, onAddRide }) {
  const [trainNumber, setTrainNumber] = useState("");
  const [selectedLine, setSelectedLine] = useState(null);
  const [lastRide, setLastRide] = useState(null);

  const found = useMemo(
    () => detectModelFromNumber(trainNumber, datasets.rollingStock),
    [trainNumber, datasets.rollingStock]
  );

  const linesByDivision = useMemo(() => {
    const map = {};
    datasets.lines.forEach((l) => {
      if (!map[l.division]) map[l.division] = [];
      map[l.division].push(l);
    });
    return map;
  }, [datasets.lines]);

  function handleLog() {
    if (!trainNumber || !selectedLine) return;
    const ride = {
      id: crypto.randomUUID(),
      trainNumber: trainNumber.trim(),
      line: selectedLine.id,
      lineLabel: selectedLine.label,
      lineColor: selectedLine.color,
      lineTextColor: selectedLine.textColor || "#fff",
      model: found?.model || "Unknown",
      division: found?.division || "?",
      timestamp: new Date().toISOString(),
    };
    onAddRide(ride);
    setLastRide(ride);
    setTrainNumber("");
  }

  const canLog = trainNumber.length > 0 && selectedLine;

  return (
    <div style={{ maxWidth: 640, margin: "0 auto", padding: "1.5rem 1rem 3rem" }}>

      {/* ── CAR NUMBER ── */}
      <div style={{ marginBottom: "1.5rem" }}>
        <label style={labelStyle}>Train Car Number</label>
        <input
          type="text"
          inputMode="numeric"
          placeholder="e.g. 8778"
          value={trainNumber}
          onChange={(e) => setTrainNumber(e.target.value.replace(/[^0-9]/g, ""))}
          onKeyDown={(e) => e.key === "Enter" && handleLog()}
          style={{
            ...inputStyle,
            fontSize: "2.4rem",
            fontWeight: 800,
            textAlign: "center",
            letterSpacing: "0.15em",
            padding: "0.8rem",
          }}
        />
      </div>

      {/* ── LIVE PREVIEW ── */}
      <AnimatePresence>
        {trainNumber && selectedLine && (
          <motion.div
            key="preview"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            style={{
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 16,
              padding: "1.25rem 1.5rem",
              textAlign: "center",
              marginBottom: "1.5rem",
            }}
          >
            <div style={{ fontSize: "1rem", color: "rgba(255,255,255,0.55)", marginBottom: "0.4rem" }}>
              You're riding a
            </div>
            <div style={{ fontSize: "2.8rem", fontWeight: 900, fontFamily: "'Barlow Condensed', sans-serif", lineHeight: 1, color: found ? "#4ade80" : "#f87171" }}>
              {found?.model || "Unknown"}
            </div>
            <div style={{ marginTop: "0.5rem", fontSize: "1.05rem", color: "rgba(255,255,255,0.6)" }}>
              on the{" "}
              <span style={{ color: selectedLine.color, fontWeight: 700 }}>{selectedLine.label}</span>
              {" "}line 🚇
            </div>
            {!found && (
              <div style={{ marginTop: "0.5rem", fontSize: "0.78rem", color: "#f87171" }}>
                Car not found — check number or update ranges in Stats → Settings
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── LINE PICKER ── */}
      <div style={{ marginBottom: "1.5rem" }}>
        <label style={labelStyle}>Select Line</label>
        {Object.entries(linesByDivision).map(([div, lines]) => (
          <div key={div} style={{ marginBottom: "1rem" }}>
            <div style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.35)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "0.6rem" }}>
              {DIV_LABELS[div] || div}
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.55rem" }}>
              {lines.map((l) => (
                <LineBullet
                  key={l.id}
                  label={l.label}
                  color={l.color}
                  textColor={l.textColor}
                  size={54}
                  selected={selectedLine?.id === l.id}
                  onClick={() => setSelectedLine((prev) => (prev?.id === l.id ? null : l))}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* ── LOG BUTTON ── */}
      <motion.button
        onClick={handleLog}
        disabled={!canLog}
        whileTap={canLog ? { scale: 0.97 } : {}}
        style={{
          width: "100%",
          padding: "1rem",
          borderRadius: 14,
          border: "none",
          background: canLog ? "#FCCC0A" : "rgba(255,255,255,0.08)",
          color: canLog ? "#000" : "rgba(255,255,255,0.3)",
          fontFamily: "'Barlow Condensed', sans-serif",
          fontWeight: 900,
          fontSize: "1.3rem",
          letterSpacing: "0.08em",
          cursor: canLog ? "pointer" : "not-allowed",
          transition: "background 0.2s, color 0.2s",
          marginBottom: "1.5rem",
        }}
      >
        LOG RIDE →
      </motion.button>

      {/* ── SUCCESS TOAST ── */}
      <AnimatePresence>
        {lastRide && (
          <motion.div
            key={lastRide.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "1rem",
              background: "rgba(0,147,60,0.15)",
              border: "1px solid rgba(0,147,60,0.4)",
              borderRadius: 14,
              padding: "1rem 1.25rem",
            }}
          >
            <LineBullet label={lastRide.lineLabel} color={lastRide.lineColor} textColor={lastRide.lineTextColor} size={46} />
            <div>
              <div style={{ fontWeight: 700, fontSize: "1rem" }}>✓ Ride logged!</div>
              <div style={{ color: "rgba(255,255,255,0.55)", fontSize: "0.85rem" }}>
                {lastRide.model} · Car #{lastRide.trainNumber}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────
   STATS / MANAGER PAGE
───────────────────────────────────────────────────────────────── */
function StatsPage({ datasets, setDatasets }) {
  const [rides, setRides] = useCookieRides();
  const [tab, setTab] = useState("progress");
  const [query, setQuery] = useState("");

  const riddenModels = useMemo(() => new Set(rides.map((r) => r.model)), [rides]);
  const riddenLines  = useMemo(() => new Set(rides.map((r) => r.line)),  [rides]);

  const modelPct = datasets.rollingStock.length
    ? (riddenModels.size / datasets.rollingStock.length) * 100
    : 0;
  const linePct = datasets.lines.length
    ? (riddenLines.size / datasets.lines.length) * 100
    : 0;

  /* History helpers */
  function deleteRide(id) { setRides((prev) => prev.filter((r) => r.id !== id)); }
  function clearRides() { if (confirm("Delete ALL rides?")) setRides([]); }

  function exportRides() {
    const blob = new Blob([JSON.stringify(rides, null, 2)], { type: "application/json" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href = url; a.download = `nyc-rides-${new Date().toISOString().slice(0,10)}.json`; a.click();
    URL.revokeObjectURL(url);
  }

  function importRides(e) {
    const file = e.target.files?.[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result);
        if (!Array.isArray(parsed)) throw new Error("Expected array");
        setRides(parsed);
      } catch (err) { alert("Invalid JSON: " + err.message); }
    };
    reader.readAsText(file);
  }

  /* Dataset editors */
  function save() { saveDatasets(datasets); alert("Saved!"); }
  function reset() { if (confirm("Reset datasets to defaults?")) { saveDatasets(DEFAULT_DATASETS); setDatasets(DEFAULT_DATASETS); } }

  function updateLine(idx, field, value) {
    setDatasets((d) => ({ ...d, lines: d.lines.map((l, i) => i === idx ? { ...l, [field]: value } : l) }));
  }
  function removeLine(idx) {
    setDatasets((d) => ({ ...d, lines: d.lines.filter((_, i) => i !== idx) }));
  }
  function addLine() {
    setDatasets((d) => ({ ...d, lines: [...d.lines, { id:"X", label:"X", division:"B", color:"#444", textColor:"#fff", terminals:["",""] }] }));
  }
  function updateStock(idx, field, value) {
    setDatasets((d) => ({ ...d, rollingStock: d.rollingStock.map((s, i) => i === idx ? { ...s, [field]: value } : s) }));
  }
  function updateRange(idx, rIdx, which, value) {
    setDatasets((d) => ({
      ...d,
      rollingStock: d.rollingStock.map((s, i) => {
        if (i !== idx) return s;
        return { ...s, ranges: s.ranges.map((r, j) => j === rIdx ? [which === 0 ? +value : r[0], which === 1 ? +value : r[1]] : r) };
      }),
    }));
  }
  function addRange(idx) {
    setDatasets((d) => ({ ...d, rollingStock: d.rollingStock.map((s, i) => i === idx ? { ...s, ranges: [...s.ranges, [0,0]] } : s) }));
  }
  function removeStock(idx) {
    setDatasets((d) => ({ ...d, rollingStock: d.rollingStock.filter((_, i) => i !== idx) }));
  }
  function addStock() {
    setDatasets((d) => ({ ...d, rollingStock: [...d.rollingStock, { model:"New Model", ranges:[[0,0]], division:"A" }] }));
  }

  const filteredRides = rides.filter((r) => {
    const q = query.toLowerCase();
    return !q || [r.trainNumber, r.model, r.line].some((v) => v?.toLowerCase().includes(q));
  });

  const innerTabs = [
    { key: "progress", label: "Progress" },
    { key: "history",  label: "History" },
    { key: "settings", label: "Settings" },
  ];

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: "1.5rem 1rem 3rem" }}>

      {/* Sub-tabs */}
      <div style={{ display: "flex", gap: "0.3rem", background: "rgba(255,255,255,0.05)", borderRadius: 12, padding: "0.3rem", marginBottom: "1.5rem", overflowX: "auto" }}>
        {innerTabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            style={{
              flex: 1,
              padding: "0.55rem 1rem",
              border: "none",
              borderRadius: 9,
              fontFamily: "'Barlow Condensed', sans-serif",
              fontWeight: 700,
              fontSize: "1rem",
              letterSpacing: "0.04em",
              whiteSpace: "nowrap",
              background: tab === t.key ? "#FCCC0A" : "transparent",
              color: tab === t.key ? "#000" : "rgba(255,255,255,0.5)",
              cursor: "pointer",
              transition: "all 0.15s",
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── PROGRESS ── */}
      {tab === "progress" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>

          {/* Summary row */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "0.75rem" }}>
            {[
              { label: "Total Rides", value: rides.length, color: "#FCCC0A" },
              { label: "Models Ridden", value: `${riddenModels.size}/${datasets.rollingStock.length}`, color: "#4ade80" },
              { label: "Lines Ridden",  value: `${riddenLines.size}/${datasets.lines.length}`, color: "#60a5fa" },
              { label: "Unique Cars",   value: new Set(rides.map(r=>r.trainNumber)).size, color: "#f472b6" },
            ].map(({ label, value, color }) => (
              <div key={label} style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 14, padding: "1rem 1.25rem" }}>
                <div style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.1em" }}>{label}</div>
                <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 900, fontSize: "2rem", color, marginTop: "0.2rem" }}>{value}</div>
              </div>
            ))}
          </div>

          {/* Models */}
          <div style={cardStyle}>
            <div style={sectionHeadStyle}>
              Train Models
              <span style={badgeStyle}>{riddenModels.size}/{datasets.rollingStock.length}</span>
            </div>
            <ProgressBar value={modelPct} color="#4ade80" />
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))", gap: "0.6rem", marginTop: "1rem" }}>
              {datasets.rollingStock.map((s) => {
                const ridden = riddenModels.has(s.model);
                return (
                  <motion.div
                    key={s.model}
                    whileHover={{ scale: 1.03 }}
                    style={{
                      padding: "0.75rem 1rem",
                      borderRadius: 10,
                      border: `1px solid ${ridden ? "rgba(74,222,128,0.4)" : "rgba(255,255,255,0.08)"}`,
                      background: ridden ? "rgba(74,222,128,0.1)" : "rgba(255,255,255,0.03)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <span style={{ fontWeight: 700, fontSize: "0.95rem" }}>{s.model}</span>
                    <span style={{ fontSize: "1.1rem" }}>{ridden ? "✓" : "·"}</span>
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* Lines */}
          <div style={cardStyle}>
            <div style={sectionHeadStyle}>
              Subway Lines
              <span style={badgeStyle}>{riddenLines.size}/{datasets.lines.length}</span>
            </div>
            <ProgressBar value={linePct} color="#60a5fa" />
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.6rem", marginTop: "1rem" }}>
              {datasets.lines.map((l) => {
                const ridden = riddenLines.has(l.id);
                return (
                  <div
                    key={l.id}
                    style={{
                      display: "flex", alignItems: "center", gap: "0.5rem",
                      padding: "0.4rem 0.8rem 0.4rem 0.4rem",
                      borderRadius: 999,
                      border: `1.5px solid ${ridden ? l.color : "rgba(255,255,255,0.1)"}`,
                      background: ridden ? `${l.color}22` : "rgba(255,255,255,0.03)",
                      opacity: ridden ? 1 : 0.5,
                    }}
                  >
                    <LineBullet label={l.label} color={l.color} textColor={l.textColor} size={30} />
                    <span style={{ fontSize: "0.82rem", fontWeight: 600 }}>{ridden ? "✓" : ""}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── HISTORY ── */}
      {tab === "history" && (
        <div style={cardStyle}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem", flexWrap: "wrap", gap: "0.5rem" }}>
            <span style={sectionHeadStyle}>Ride History <span style={badgeStyle}>{rides.length}</span></span>
            <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
              <SmallBtn onClick={exportRides}>⬇ Export</SmallBtn>
              <label style={{ ...smallBtnStyle, cursor: "pointer" }}>
                ⬆ Import
                <input type="file" accept="application/json" style={{ display: "none" }} onChange={importRides} />
              </label>
              <SmallBtn onClick={clearRides} danger>🗑 Clear All</SmallBtn>
            </div>
          </div>

          <input
            placeholder="Filter by line, model, car #…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{ ...inputStyle, marginBottom: "1rem" }}
          />

          <div style={{ overflowX: "auto", borderRadius: 10, border: "1px solid rgba(255,255,255,0.08)" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.88rem" }}>
              <thead>
                <tr style={{ background: "rgba(0,0,0,0.4)" }}>
                  {["Time", "Line", "Car #", "Model", "Div", ""].map((h) => (
                    <th key={h} style={{ padding: "0.6rem 0.8rem", textAlign: "left", color: "rgba(255,255,255,0.4)", fontWeight: 700, fontSize: "0.72rem", letterSpacing: "0.08em", textTransform: "uppercase", borderBottom: "1px solid rgba(255,255,255,0.08)", whiteSpace: "nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredRides.length === 0 && (
                  <tr><td colSpan={6} style={{ padding: "2rem", textAlign: "center", color: "rgba(255,255,255,0.3)" }}>No rides match.</td></tr>
                )}
                {[...filteredRides].reverse().map((r, i) => (
                  <tr key={r.id} style={{ background: i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.02)", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                    <td style={{ padding: "0.55rem 0.8rem", color: "rgba(255,255,255,0.45)", whiteSpace: "nowrap" }}>{new Date(r.timestamp).toLocaleString()}</td>
                    <td style={{ padding: "0.55rem 0.8rem" }}>
                      <LineBullet label={r.lineLabel || r.line} color={r.lineColor || "#555"} textColor={r.lineTextColor || "#fff"} size={32} />
                    </td>
                    <td style={{ padding: "0.55rem 0.8rem", fontWeight: 700, fontFamily: "'Barlow Condensed', sans-serif", fontSize: "1.05rem" }}>#{r.trainNumber}</td>
                    <td style={{ padding: "0.55rem 0.8rem", fontWeight: 600 }}>{r.model}</td>
                    <td style={{ padding: "0.55rem 0.8rem", color: "rgba(255,255,255,0.45)", fontSize: "0.8rem" }}>{r.division}</td>
                    <td style={{ padding: "0.55rem 0.8rem" }}>
                      <SmallBtn onClick={() => deleteRide(r.id)} danger>✕</SmallBtn>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── SETTINGS ── */}
      {tab === "settings" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>

          {/* Rolling Stock */}
          <div style={cardStyle}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem", flexWrap: "wrap", gap: "0.5rem" }}>
              <span style={sectionHeadStyle}>Rolling Stock Ranges</span>
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <SmallBtn onClick={addStock}>+ Model</SmallBtn>
                <SmallBtn onClick={save} green>✓ Save</SmallBtn>
                <SmallBtn onClick={reset} danger>↺ Reset</SmallBtn>
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.65rem", maxHeight: "60vh", overflowY: "auto" }}>
              {datasets.rollingStock.map((s, idx) => (
                <div key={idx} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, padding: "0.85rem 1rem" }}>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", alignItems: "center", marginBottom: "0.65rem" }}>
                    <input value={s.model} onChange={(e) => updateStock(idx,"model",e.target.value)} style={{ ...inputStyle, width: 140 }} />
                    <select value={s.division} onChange={(e) => updateStock(idx,"division",e.target.value)} style={{ ...inputStyle, width: 80 }}>
                      <option>A</option><option>B</option><option>SIR</option>
                    </select>
                    <div style={{ marginLeft: "auto", display: "flex", gap: "0.4rem" }}>
                      <SmallBtn onClick={() => addRange(idx)}>+ Range</SmallBtn>
                      <SmallBtn onClick={() => removeStock(idx)} danger>Delete</SmallBtn>
                    </div>
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "0.45rem" }}>
                    {s.ranges.map((r, rIdx) => (
                      <div key={rIdx} style={{ display: "flex", alignItems: "center", gap: "0.35rem", background: "rgba(0,0,0,0.3)", padding: "0.3rem 0.6rem", borderRadius: 7, border: "1px solid rgba(255,255,255,0.07)" }}>
                        <input value={r[0]} onChange={(e) => updateRange(idx,rIdx,0,e.target.value)} style={{ ...inputStyle, width: 72, textAlign: "center", padding: "0.3rem 0.4rem" }} />
                        <span style={{ color: "rgba(255,255,255,0.3)" }}>–</span>
                        <input value={r[1]} onChange={(e) => updateRange(idx,rIdx,1,e.target.value)} style={{ ...inputStyle, width: 72, textAlign: "center", padding: "0.3rem 0.4rem" }} />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Lines */}
          <div style={cardStyle}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem", flexWrap: "wrap", gap: "0.5rem" }}>
              <span style={sectionHeadStyle}>Subway Lines</span>
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <SmallBtn onClick={addLine}>+ Line</SmallBtn>
                <SmallBtn onClick={save} green>✓ Save</SmallBtn>
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem", maxHeight: "60vh", overflowY: "auto" }}>
              {datasets.lines.map((l, idx) => (
                <div key={idx} style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "0.5rem", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, padding: "0.7rem 0.85rem" }}>
                  <LineBullet label={l.label} color={l.color} textColor={l.textColor||"#fff"} size={38} />
                  <input value={l.id}    onChange={(e) => updateLine(idx,"id",e.target.value)}    style={{ ...inputStyle, width: 52 }} placeholder="ID" />
                  <input value={l.label} onChange={(e) => updateLine(idx,"label",e.target.value)} style={{ ...inputStyle, width: 60 }} placeholder="Label" />
                  <select value={l.division} onChange={(e) => updateLine(idx,"division",e.target.value)} style={{ ...inputStyle, width: 76 }}>
                    <option>A</option><option>B</option><option>SIR</option>
                  </select>
                  <input type="color" value={l.color} onChange={(e) => updateLine(idx,"color",e.target.value)} style={{ width: 38, height: 34, borderRadius: 6, border: "none", cursor: "pointer", background: "none" }} />
                  <input value={l.color} onChange={(e) => updateLine(idx,"color",e.target.value)} style={{ ...inputStyle, width: 86 }} />
                  <input value={l.terminals?.[0]||""} onChange={(e) => updateLine(idx,"terminals",[e.target.value, l.terminals?.[1]||""])} style={{ ...inputStyle, flex: 1, minWidth: 120 }} placeholder="Terminal A" />
                  <input value={l.terminals?.[1]||""} onChange={(e) => updateLine(idx,"terminals",[l.terminals?.[0]||"", e.target.value])} style={{ ...inputStyle, flex: 1, minWidth: 120 }} placeholder="Terminal B" />
                  <SmallBtn onClick={() => removeLine(idx)} danger>✕</SmallBtn>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────
   MICRO UI
───────────────────────────────────────────────────────────────── */
const inputStyle = {
  background: "rgba(255,255,255,0.07)",
  color: "#fff",
  border: "1px solid rgba(255,255,255,0.12)",
  borderRadius: 8,
  fontFamily: "inherit",
  fontSize: "0.92rem",
  padding: "0.5rem 0.75rem",
  outline: "none",
  width: "100%",
};

const labelStyle = {
  display: "block",
  fontSize: "0.72rem",
  fontWeight: 700,
  letterSpacing: "0.1em",
  textTransform: "uppercase",
  color: "rgba(255,255,255,0.4)",
  marginBottom: "0.5rem",
};

const cardStyle = {
  background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: 16,
  padding: "1.25rem 1.5rem",
};

const sectionHeadStyle = {
  fontFamily: "'Barlow Condensed', sans-serif",
  fontWeight: 800,
  fontSize: "1.15rem",
  letterSpacing: "0.04em",
  display: "flex",
  alignItems: "center",
  gap: "0.5rem",
  marginBottom: "0.75rem",
};

const badgeStyle = {
  background: "rgba(255,255,255,0.1)",
  borderRadius: 999,
  padding: "0.1rem 0.55rem",
  fontSize: "0.8rem",
  fontWeight: 700,
  fontFamily: "'Barlow Condensed', sans-serif",
};

const smallBtnStyle = {
  padding: "0.4rem 0.8rem",
  borderRadius: 7,
  border: "1px solid rgba(255,255,255,0.15)",
  background: "rgba(255,255,255,0.07)",
  color: "#fff",
  fontWeight: 700,
  fontSize: "0.8rem",
  fontFamily: "'Barlow Condensed', sans-serif",
  cursor: "pointer",
  letterSpacing: "0.03em",
  display: "inline-flex",
  alignItems: "center",
  gap: "0.25rem",
  whiteSpace: "nowrap",
};

function SmallBtn({ children, onClick, danger, green, ...rest }) {
  return (
    <button
      onClick={onClick}
      {...rest}
      style={{
        ...smallBtnStyle,
        ...(danger ? { background: "rgba(238,53,46,0.2)", borderColor: "rgba(238,53,46,0.4)", color: "#ff8882" } : {}),
        ...(green  ? { background: "rgba(0,147,60,0.2)",  borderColor: "rgba(0,147,60,0.4)",  color: "#4ade80"  } : {}),
        ...(rest.style || {}),
      }}
    >
      {children}
    </button>
  );
}

/* ─────────────────────────────────────────────────────────────────
   ROOT APP
───────────────────────────────────────────────────────────────── */
export default function App() {
  const [page, setPage] = useState("live");
  const [datasets, setDatasets] = useState(getDatasets);
  const [rides, setRides] = useCookieRides();

  function onAddRide(ride) {
    setRides((prev) => [...prev, ride]);
  }

  return (
    <div style={{ minHeight: "100vh", background: "#111116", color: "#f0f0f4", fontFamily: "'Barlow', system-ui, sans-serif" }}>
      {/* ── HEADER ── */}
      <header style={{
        position: "sticky", top: 0, zIndex: 50,
        background: "rgba(17,17,22,0.9)",
        backdropFilter: "blur(14px)",
        borderBottom: "1px solid rgba(255,255,255,0.07)",
        padding: "0 1rem",
      }}>
        <div style={{ maxWidth: 900, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0.75rem 0", gap: "1rem", flexWrap: "wrap" }}>
          {/* Logo */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.65rem" }}>
            <div style={{ width: 38, height: 38, borderRadius: 9, background: "#FCCC0A", color: "#000", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 900, fontSize: "0.75rem", letterSpacing: "0.02em" }}>NYC</div>
            <div>
              <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 900, fontSize: "1.35rem", lineHeight: 1, letterSpacing: "0.03em" }}>
                HaveIRidden<span style={{ color: "#FCCC0A" }}>?</span>
              </div>
              <div style={{ fontSize: "0.65rem", color: "rgba(255,255,255,0.35)", letterSpacing: "0.1em", textTransform: "uppercase" }}>NYC Subway Tracker</div>
            </div>
          </div>

          {/* Nav */}
          <div style={{ display: "flex", gap: "0.25rem", background: "rgba(255,255,255,0.06)", borderRadius: 10, padding: "0.25rem", border: "1px solid rgba(255,255,255,0.07)" }}>
            {[{ key:"live", label:"🚇 Live Rider" }, { key:"stats", label:"📊 Stats" }].map((t) => (
              <button key={t.key} onClick={() => setPage(t.key)} style={{
                padding: "0.45rem 1rem",
                borderRadius: 7, border: "none",
                fontFamily: "'Barlow Condensed', sans-serif",
                fontWeight: 700, fontSize: "0.95rem", letterSpacing: "0.03em",
                background: page === t.key ? "#FCCC0A" : "transparent",
                color: page === t.key ? "#000" : "rgba(255,255,255,0.45)",
                cursor: "pointer", transition: "all 0.15s",
              }}>{t.label}</button>
            ))}
          </div>

          {/* Ride counter */}
          <div style={{ fontSize: "0.82rem", color: "rgba(255,255,255,0.35)", display: "flex", alignItems: "center", gap: "0.3rem" }}>
            <span style={{ color: "#FCCC0A", fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 900, fontSize: "1.15rem" }}>{rides.length}</span>
            rides logged
          </div>
        </div>
      </header>

      {/* ── PAGES ── */}
      <AnimatePresence mode="wait">
        <motion.div
          key={page}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          {page === "live"
            ? <LiveRider datasets={datasets} onAddRide={onAddRide} />
            : <StatsPage datasets={datasets} setDatasets={setDatasets} />}
        </motion.div>
      </AnimatePresence>

      <footer style={{ borderTop: "1px solid rgba(255,255,255,0.06)", padding: "1rem", textAlign: "center", fontSize: "0.72rem", color: "rgba(255,255,255,0.2)", letterSpacing: "0.06em" }}>
        HaveIRidden? · Personal NYC Subway Tracker · Fleet data is editable in Stats → Settings
      </footer>
    </div>
  );
}

import React, { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

/* ─────────────────────────────────────────────────────────────────
   GLOBAL STYLES  (injected once into <head>)
───────────────────────────────────────────────────────────────── */
const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@400;600;700;800;900&family=Barlow:wght@400;500;600&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --tunnel: #0a0a0f;
    --surface: #13131a;
    --card: #1c1c26;
    --border: rgba(255,255,255,0.08);
    --border-bright: rgba(255,255,255,0.18);
    --text: #f0f0f4;
    --muted: #8888a0;
    --accent: #FCCC0A;
    --accent-dark: #c9a400;
    --danger: #EE352E;
    --success: #00933C;
    --radius: 14px;
    --radius-sm: 8px;
  }

  html, body, #root {
    height: 100%;
    background: var(--tunnel);
    color: var(--text);
    font-family: 'Barlow', sans-serif;
    font-size: 16px;
    -webkit-font-smoothing: antialiased;
  }

  /* subway tile pattern background */
  body::before {
    content: '';
    position: fixed;
    inset: 0;
    background-image:
      linear-gradient(rgba(255,255,255,0.015) 1px, transparent 1px),
      linear-gradient(90deg, rgba(255,255,255,0.015) 1px, transparent 1px);
    background-size: 32px 32px;
    pointer-events: none;
    z-index: 0;
  }

  /* scrollbar */
  ::-webkit-scrollbar { width: 6px; height: 6px; }
  ::-webkit-scrollbar-track { background: var(--surface); }
  ::-webkit-scrollbar-thumb { background: #333; border-radius: 3px; }
  ::-webkit-scrollbar-thumb:hover { background: #555; }

  input, select, textarea {
    background: var(--surface);
    color: var(--text);
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
    font-family: 'Barlow', sans-serif;
    font-size: 1rem;
    padding: 0.6rem 0.9rem;
    outline: none;
    transition: border-color 0.2s;
    width: 100%;
  }
  input:focus, select:focus { border-color: var(--accent); box-shadow: 0 0 0 3px rgba(252,204,10,0.15); }
  input::placeholder { color: var(--muted); }
  select option { background: #1c1c26; }

  button { cursor: pointer; font-family: 'Barlow', sans-serif; }

  table { border-collapse: collapse; width: 100%; }
  th { text-align: left; }

  .hide-scrollbar::-webkit-scrollbar { display: none; }
  .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
`;

function GlobalStyles() {
  useEffect(() => {
    const style = document.createElement("style");
    style.textContent = GLOBAL_CSS;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);
  return null;
}

/* ─────────────────────────────────────────────────────────────────
   DATA LAYER
───────────────────────────────────────────────────────────────── */
const COOKIE_NAME = "nyc_subway_rides";
const DATA_KEY = "nyc_subway_datasets_v1";

function readRidesFromCookie() {
  try {
    const match = document.cookie.split(";").map(c => c.trim()).find(c => c.startsWith(`${COOKIE_NAME}=`));
    if (!match) return [];
    const arr = JSON.parse(decodeURIComponent(match.split("=")[1] || ""));
    return Array.isArray(arr) ? arr : [];
  } catch { return []; }
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

function loadDatasets() {
  try { const r = localStorage.getItem(DATA_KEY); return r ? JSON.parse(r) : null; } catch { return null; }
}
function saveDatasets(ds) { localStorage.setItem(DATA_KEY, JSON.stringify(ds)); }

function prefillDatasets() {
  const datasets = {
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
      { model: "R211A",ranges: [[4000,4399]],             division: "B" },
      { model: "R211S (Staten Island)", ranges: [[100,199]], division: "SIR" },
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
  saveDatasets(datasets);
  return datasets;
}

function getDatasets() { return loadDatasets() || prefillDatasets(); }

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
   PRIMITIVE UI COMPONENTS
───────────────────────────────────────────────────────────────── */
function LineBullet({ label, color, textColor = "#fff", size = 48, selected, onClick, style = {} }) {
  return (
    <button
      onClick={onClick}
      title={`Line ${label}`}
      style={{
        width: size, height: size, minWidth: size,
        borderRadius: "50%",
        background: color,
        color: textColor,
        fontFamily: "'Barlow Condensed', sans-serif",
        fontWeight: 800,
        fontSize: size * 0.38,
        border: selected ? "3px solid var(--accent)" : "3px solid transparent",
        boxShadow: selected ? `0 0 0 3px rgba(252,204,10,0.35), 0 4px 16px ${color}55` : `0 2px 8px ${color}44`,
        transform: selected ? "scale(1.12)" : "scale(1)",
        transition: "all 0.18s ease",
        cursor: onClick ? "pointer" : "default",
        display: "flex", alignItems: "center", justifyContent: "center",
        flexShrink: 0,
        ...style,
      }}
    >
      {label}
    </button>
  );
}

function Card({ children, style = {}, className = "" }) {
  return (
    <div className={className} style={{
      background: "var(--card)",
      border: "1px solid var(--border)",
      borderRadius: "var(--radius)",
      padding: "1.5rem",
      ...style,
    }}>
      {children}
    </div>
  );
}

function SectionHeader({ title, subtitle, actions }) {
  return (
    <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", gap:"1rem", marginBottom:"1.25rem", flexWrap:"wrap" }}>
      <div>
        <h2 style={{ fontFamily:"'Barlow Condensed', sans-serif", fontWeight:800, fontSize:"1.4rem", letterSpacing:"0.03em", color:"var(--text)" }}>
          {title}
        </h2>
        {subtitle && <p style={{ color:"var(--muted)", fontSize:"0.85rem", marginTop:"0.2rem" }}>{subtitle}</p>}
      </div>
      {actions && <div style={{ display:"flex", gap:"0.5rem", flexWrap:"wrap" }}>{actions}</div>}
    </div>
  );
}

function Btn({ children, onClick, variant = "primary", size = "md", disabled, as: Tag = "button", ...rest }) {
  const variants = {
    primary:  { background:"var(--accent)",  color:"#000", border:"none" },
    ghost:    { background:"rgba(255,255,255,0.07)", color:"var(--text)", border:"1px solid var(--border)" },
    danger:   { background:"var(--danger)",  color:"#fff", border:"none" },
    success:  { background:"var(--success)", color:"#fff", border:"none" },
    dark:     { background:"#252530",        color:"var(--text)", border:"1px solid var(--border)" },
  };
  const sizes = {
    sm: { padding:"0.35rem 0.75rem", fontSize:"0.8rem" },
    md: { padding:"0.55rem 1.1rem", fontSize:"0.92rem" },
    lg: { padding:"0.8rem 1.6rem", fontSize:"1rem" },
  };
  return (
    <Tag onClick={onClick} disabled={disabled} {...rest} style={{
      ...variants[variant],
      ...sizes[size],
      borderRadius:"var(--radius-sm)",
      fontWeight:600,
      fontFamily:"'Barlow Condensed', sans-serif",
      letterSpacing:"0.04em",
      cursor: disabled ? "not-allowed" : "pointer",
      opacity: disabled ? 0.4 : 1,
      transition:"opacity 0.15s, filter 0.15s",
      display:"inline-flex", alignItems:"center", gap:"0.4rem",
      whiteSpace:"nowrap",
      textDecoration:"none",
      ...(rest.style || {}),
    }}>
      {children}
    </Tag>
  );
}

function DivisionTag({ div }) {
  const colors = { A:"#EE352E", B:"#2850AD", SIR:"#0039A6" };
  return (
    <span style={{
      background: colors[div] || "#555",
      color:"#fff",
      fontSize:"0.7rem",
      fontWeight:700,
      fontFamily:"'Barlow Condensed', sans-serif",
      padding:"0.15rem 0.5rem",
      borderRadius:4,
      letterSpacing:"0.05em",
    }}>
      {div === "SIR" ? "SIR" : `Div ${div}`}
    </span>
  );
}

/* ─────────────────────────────────────────────────────────────────
   HEADER / NAV
───────────────────────────────────────────────────────────────── */
function Header({ page, setPage, rideCount }) {
  return (
    <header style={{
      position:"sticky", top:0, zIndex:50,
      background:"rgba(10,10,15,0.92)",
      backdropFilter:"blur(12px)",
      borderBottom:"1px solid var(--border)",
      padding:"0 max(1rem, env(safe-area-inset-left))",
    }}>
      <div style={{ maxWidth:1200, margin:"0 auto", display:"flex", alignItems:"center", justifyContent:"space-between", padding:"0.85rem 0", gap:"1rem", flexWrap:"wrap" }}>
        {/* Logo */}
        <div style={{ display:"flex", alignItems:"center", gap:"0.75rem" }}>
          <div style={{
            width:42, height:42, borderRadius:10,
            background:"var(--accent)", color:"#000",
            display:"flex", alignItems:"center", justifyContent:"center",
            fontFamily:"'Barlow Condensed', sans-serif", fontWeight:900, fontSize:"0.85rem",
            letterSpacing:"0.02em",
          }}>NYC</div>
          <div>
            <div style={{ fontFamily:"'Barlow Condensed', sans-serif", fontWeight:900, fontSize:"1.45rem", letterSpacing:"0.04em", lineHeight:1 }}>
              HaveIRidden<span style={{ color:"var(--accent)" }}>?</span>
            </div>
            <div style={{ color:"var(--muted)", fontSize:"0.72rem", letterSpacing:"0.08em", textTransform:"uppercase" }}>
              NYC Subway Tracker
            </div>
          </div>
        </div>

        {/* Nav tabs */}
        <nav style={{ display:"flex", gap:"0.25rem", background:"var(--surface)", borderRadius:10, padding:"0.3rem", border:"1px solid var(--border)" }}>
          {[
            { key:"live", label:"🚇 Live Rider" },
            { key:"stats", label:"📊 Stats & Edit" },
          ].map(t => (
            <button key={t.key} onClick={() => setPage(t.key)} style={{
              padding:"0.5rem 1rem",
              borderRadius:7,
              border:"none",
              fontFamily:"'Barlow Condensed', sans-serif",
              fontWeight:700,
              fontSize:"0.95rem",
              letterSpacing:"0.03em",
              background: page === t.key ? "var(--accent)" : "transparent",
              color: page === t.key ? "#000" : "var(--muted)",
              cursor:"pointer",
              transition:"all 0.18s",
            }}>
              {t.label}
            </button>
          ))}
        </nav>

        {/* Ride counter badge */}
        <div style={{
          fontFamily:"'Barlow Condensed', sans-serif",
          fontSize:"0.85rem", color:"var(--muted)",
          display:"flex", alignItems:"center", gap:"0.4rem",
        }}>
          <span style={{ color:"var(--accent)", fontWeight:800, fontSize:"1.2rem" }}>{rideCount}</span>
          rides logged
        </div>
      </div>
    </header>
  );
}

/* ─────────────────────────────────────────────────────────────────
   LIVE RIDER PAGE
───────────────────────────────────────────────────────────────── */
function LiveRider({ datasets, onAddRide, rides }) {
  const [trainNumber, setTrainNumber] = useState("");
  const [selectedLine, setSelectedLine] = useState(null);
  const [lastRide, setLastRide] = useState(null);
  const [flash, setFlash] = useState(false);

  function handleLog() {
    if (!trainNumber || !selectedLine) return;
    const found = detectModelFromNumber(trainNumber, datasets.rollingStock);
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
    setFlash(true);
    setTimeout(() => setFlash(false), 600);
  }

  // Group lines for display
  const lineGroups = useMemo(() => {
    const groups = {};
    datasets.lines.forEach(l => {
      const key = l.division;
      if (!groups[key]) groups[key] = [];
      groups[key].push(l);
    });
    return groups;
  }, [datasets]);

  const divisionNames = { A: "A Division (IRT)", B: "B Division (IND/BMT)", SIR: "Staten Island Railway" };
  const recentRides = [...rides].reverse().slice(0, 6);

  return (
    <div style={{ display:"grid", gridTemplateColumns:"1fr", gap:"1.25rem", maxWidth:1200, margin:"0 auto" }}>

      {/* ── INPUT CARD ── */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(300px, 1fr))", gap:"1.25rem" }}>
        <Card>
          <SectionHeader title="Log a Ride" subtitle="Enter your car number and select the line" />

          {/* Car number input */}
          <label style={{ display:"block", color:"var(--muted)", fontSize:"0.8rem", fontWeight:600, letterSpacing:"0.08em", textTransform:"uppercase", marginBottom:"0.4rem" }}>
            Train Car Number
          </label>
          <div style={{ position:"relative", marginBottom:"1.5rem" }}>
            <input
              type="text"
              inputMode="numeric"
              placeholder="e.g. 8778"
              value={trainNumber}
              onChange={e => setTrainNumber(e.target.value.replace(/[^0-9]/g, ""))}
              onKeyDown={e => e.key === "Enter" && handleLog()}
              style={{ fontSize:"2rem", fontWeight:700, fontFamily:"'Barlow Condensed', sans-serif", letterSpacing:"0.1em", padding:"0.8rem 1.2rem", textAlign:"center" }}
            />
          </div>

          {/* Line picker */}
          <label style={{ display:"block", color:"var(--muted)", fontSize:"0.8rem", fontWeight:600, letterSpacing:"0.08em", textTransform:"uppercase", marginBottom:"0.75rem" }}>
            Select Line
          </label>
          {Object.entries(lineGroups).map(([div, lines]) => (
            <div key={div} style={{ marginBottom:"1rem" }}>
              <div style={{ fontSize:"0.72rem", color:"var(--muted)", letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:"0.5rem", display:"flex", alignItems:"center", gap:"0.4rem" }}>
                <DivisionTag div={div} /> {divisionNames[div]}
              </div>
              <div style={{ display:"flex", flexWrap:"wrap", gap:"0.5rem" }}>
                {lines.map(l => (
                  <LineBullet
                    key={l.id}
                    label={l.label}
                    color={l.color}
                    textColor={l.textColor || "#fff"}
                    size={52}
                    selected={selectedLine?.id === l.id}
                    onClick={() => setSelectedLine(l === selectedLine ? null : l)}
                  />
                ))}
              </div>
            </div>
          ))}

          {/* Selected line info */}
          {selectedLine && (
            <motion.div
              initial={{ opacity:0, y:4 }}
              animate={{ opacity:1, y:0 }}
              style={{ margin:"1rem 0", padding:"0.75rem 1rem", background:"var(--surface)", borderRadius:"var(--radius-sm)", border:"1px solid var(--border)", display:"flex", alignItems:"center", gap:"0.75rem" }}
            >
              <LineBullet label={selectedLine.label} color={selectedLine.color} textColor={selectedLine.textColor} size={38} />
              <div style={{ fontSize:"0.85rem", color:"var(--muted)" }}>
                <div style={{ color:"var(--text)", fontWeight:600 }}>Line {selectedLine.id}</div>
                <div>{selectedLine.terminals?.[0]} ↔ {selectedLine.terminals?.[1]}</div>
              </div>
            </motion.div>
          )}

          {/* Log button */}
          <motion.button
            onClick={handleLog}
            disabled={!trainNumber || !selectedLine}
            animate={{ scale: flash ? [1, 1.04, 1] : 1 }}
            style={{
              width:"100%", padding:"1rem",
              background: (!trainNumber || !selectedLine) ? "#252530" : "var(--accent)",
              color: (!trainNumber || !selectedLine) ? "var(--muted)" : "#000",
              border:"none", borderRadius:"var(--radius-sm)",
              fontFamily:"'Barlow Condensed', sans-serif",
              fontWeight:800, fontSize:"1.2rem", letterSpacing:"0.08em",
              cursor: (!trainNumber || !selectedLine) ? "not-allowed" : "pointer",
              transition:"background 0.2s, color 0.2s",
              marginTop:"0.25rem",
            }}
          >
            LOG RIDE →
          </motion.button>
        </Card>

        {/* ── RESULT CARD ── */}
        <div style={{ display:"flex", flexDirection:"column", gap:"1.25rem" }}>
          <Card style={{ flex:1 }}>
            <SectionHeader title="Result" />
            <AnimatePresence mode="wait">
              {!lastRide ? (
                <div style={{ color:"var(--muted)", fontSize:"0.95rem", padding:"1.5rem 0" }}>
                  No ride logged yet — enter a car number and pick a line.
                </div>
              ) : (
                <motion.div
                  key={lastRide.id}
                  initial={{ opacity:0, y:10 }}
                  animate={{ opacity:1, y:0 }}
                  exit={{ opacity:0 }}
                >
                  {/* Hero result */}
                  <div style={{ display:"flex", alignItems:"center", gap:"1rem", marginBottom:"1.25rem" }}>
                    <LineBullet label={lastRide.lineLabel} color={lastRide.lineColor} textColor={lastRide.lineTextColor} size={64} />
                    <div>
                      <div style={{ fontFamily:"'Barlow Condensed', sans-serif", fontWeight:900, fontSize:"2.2rem", lineHeight:1 }}>
                        {lastRide.model}
                      </div>
                      <div style={{ color:"var(--muted)", fontSize:"0.9rem" }}>Car #{lastRide.trainNumber}</div>
                    </div>
                  </div>

                  {/* Details grid */}
                  {[
                    ["Line",     lastRide.line],
                    ["Division", lastRide.division],
                    ["Time",     new Date(lastRide.timestamp).toLocaleString()],
                  ].map(([label, val]) => (
                    <div key={label} style={{ display:"flex", justifyContent:"space-between", padding:"0.5rem 0", borderBottom:"1px solid var(--border)", fontSize:"0.9rem" }}>
                      <span style={{ color:"var(--muted)" }}>{label}</span>
                      <span style={{ fontWeight:600 }}>{val}</span>
                    </div>
                  ))}

                  {lastRide.model === "Unknown" && (
                    <div style={{ marginTop:"1rem", padding:"0.75rem", background:"rgba(238,53,46,0.12)", border:"1px solid rgba(238,53,46,0.3)", borderRadius:8, fontSize:"0.82rem", color:"#ff8882" }}>
                      Model not found — add or adjust ranges in Stats → Rolling Stock.
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </Card>

          <Card style={{ flex:1 }}>
            <SectionHeader title="Tips" />
            <ul style={{ listStyle:"none", display:"flex", flexDirection:"column", gap:"0.6rem" }}>
              {[
                "Car numbers are typically 3–4 digits; SIR uses 3 digits (100–199).",
                "If a model shows Unknown, add or adjust ranges in Stats → Rolling Stock.",
                "Export your ride history as JSON from the Stats page.",
                "Datasets are editable—fleet ranges and terminals change over time.",
              ].map((tip, i) => (
                <li key={i} style={{ display:"flex", gap:"0.6rem", fontSize:"0.88rem", color:"var(--muted)" }}>
                  <span style={{ color:"var(--accent)", fontWeight:800, flexShrink:0 }}>→</span>
                  {tip}
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </div>

      {/* ── RECENT RIDES ── */}
      <Card>
        <SectionHeader title="Recent Rides" subtitle={`${rides.length} total logged`} />
        {recentRides.length === 0 ? (
          <div style={{ color:"var(--muted)", padding:"1rem 0" }}>No rides yet.</div>
        ) : (
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(260px, 1fr))", gap:"0.75rem" }}>
            {recentRides.map((r, i) => (
              <motion.div
                key={r.id}
                initial={{ opacity:0, y:6 }}
                animate={{ opacity:1, y:0 }}
                transition={{ delay: i * 0.05 }}
                style={{ display:"flex", alignItems:"center", gap:"0.75rem", padding:"0.75rem 1rem", background:"var(--surface)", borderRadius:10, border:"1px solid var(--border)" }}
              >
                <LineBullet label={r.lineLabel || r.line} color={r.lineColor} textColor={r.lineTextColor || "#fff"} size={42} />
                <div style={{ minWidth:0 }}>
                  <div style={{ fontWeight:700, fontFamily:"'Barlow Condensed', sans-serif", fontSize:"1.05rem", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>
                    {r.model} <span style={{ color:"var(--muted)", fontWeight:400 }}>#{r.trainNumber}</span>
                  </div>
                  <div style={{ color:"var(--muted)", fontSize:"0.78rem" }}>{new Date(r.timestamp).toLocaleString()}</div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────
   STATS PAGE
───────────────────────────────────────────────────────────────── */
function StatsPage({ datasets, setDatasets }) {
  const [rides, setRides] = useCookieRides();
  const [tab, setTab] = useState("history");

  function exportRides() {
    const blob = new Blob([JSON.stringify(rides, null, 2)], { type:"application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `nyc-rides-${new Date().toISOString().slice(0,10)}.json`; a.click();
    URL.revokeObjectURL(url);
  }

  function clearRides() {
    if (!confirm("Delete ALL rides from cookies?")) return;
    setRides([]);
  }

  function importRides(e) {
    const file = e.target.files?.[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result));
        if (!Array.isArray(parsed)) throw new Error("Expected an array");
        setRides(parsed);
      } catch (err) { alert("Invalid JSON: " + err.message); }
    };
    reader.readAsText(file);
  }

  function save() { saveDatasets(datasets); alert("Saved to localStorage."); }
  function prefill() { setDatasets(prefillDatasets()); }

  /* Rolling Stock editors */
  function addStock() { setDatasets({ ...datasets, rollingStock: [...datasets.rollingStock, { model:"New Model", ranges:[[0,0]], division:"A" }] }); }
  function removeStock(idx) { setDatasets({ ...datasets, rollingStock: datasets.rollingStock.filter((_,i) => i!==idx) }); }
  function updateStock(idx, field, value) { setDatasets({ ...datasets, rollingStock: datasets.rollingStock.map((s,i) => i===idx ? {...s,[field]:value} : s) }); }
  function addRange(idx) { const rs = datasets.rollingStock.map((s,i) => i===idx ? {...s, ranges:[...s.ranges,[0,0]]} : s); setDatasets({...datasets, rollingStock:rs}); }
  function updateRange(idx, rIdx, which, value) {
    const rs = datasets.rollingStock.map((s,i) => {
      if (i!==idx) return s;
      const ranges = s.ranges.map((r,j) => j===rIdx ? [which===0?parseInt(value||0):r[0], which===1?parseInt(value||0):r[1]] : r);
      return {...s, ranges};
    });
    setDatasets({...datasets, rollingStock:rs});
  }

  /* Lines editors */
  function addLine() { setDatasets({...datasets, lines:[...datasets.lines, {id:"X",label:"X",division:"B",color:"#000000",textColor:"#fff",terminals:["A","B"]}]}); }
  function removeLine(idx) { setDatasets({...datasets, lines:datasets.lines.filter((_,i)=>i!==idx)}); }
  function updateLine(idx, field, value) { setDatasets({...datasets, lines:datasets.lines.map((l,i)=>i===idx?{...l,[field]:value}:l)}); }

  /* Summary stats */
  const modelCounts = useMemo(() => {
    const c = {};
    rides.forEach(r => { c[r.model] = (c[r.model]||0)+1; });
    return Object.entries(c).sort((a,b)=>b[1]-a[1]);
  }, [rides]);

  const lineCounts = useMemo(() => {
    const c = {};
    rides.forEach(r => { c[r.line] = (c[r.line]||0)+1; });
    return Object.entries(c).sort((a,b)=>b[1]-a[1]);
  }, [rides]);

  const innerTabs = [
    { key:"history", label:"Ride History" },
    { key:"rolling", label:"Rolling Stock" },
    { key:"lines",   label:"Lines" },
    { key:"summary", label:"Summary" },
  ];

  return (
    <div style={{ maxWidth:1200, margin:"0 auto" }}>
      {/* Sub-tabs */}
      <div style={{ display:"flex", gap:"0.35rem", marginBottom:"1.25rem", background:"var(--card)", borderRadius:"var(--radius-sm)", padding:"0.3rem", border:"1px solid var(--border)", overflowX:"auto" }} className="hide-scrollbar">
        {innerTabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} style={{
            padding:"0.5rem 1.1rem", border:"none", borderRadius:6, whiteSpace:"nowrap",
            fontFamily:"'Barlow Condensed', sans-serif", fontWeight:700, fontSize:"0.95rem", letterSpacing:"0.03em",
            background: tab===t.key ? "var(--accent)" : "transparent",
            color: tab===t.key ? "#000" : "var(--muted)",
            cursor:"pointer", transition:"all 0.18s",
          }}>{t.label}</button>
        ))}
      </div>

      {/* ── HISTORY ── */}
      {tab === "history" && (
        <Card>
          <SectionHeader
            title="Ride History"
            subtitle={`${rides.length} rides stored in cookie`}
            actions={
              <>
                <Btn onClick={exportRides} variant="ghost" size="sm">⬇ Export JSON</Btn>
                <Btn as="label" variant="ghost" size="sm" style={{ cursor:"pointer" }}>
                  ⬆ Import JSON
                  <input type="file" accept="application/json" style={{ display:"none" }} onChange={importRides} />
                </Btn>
                <Btn onClick={clearRides} variant="danger" size="sm">🗑 Clear All</Btn>
              </>
            }
          />
          <RideTable rides={rides} setRides={setRides} datasets={datasets} />
        </Card>
      )}

      {/* ── ROLLING STOCK ── */}
      {tab === "rolling" && (
        <Card>
          <SectionHeader
            title="Rolling Stock"
            subtitle="Car number ranges by model — edit to match current fleet assignments"
            actions={
              <>
                <Btn onClick={addStock} variant="ghost" size="sm">+ Add Model</Btn>
                <Btn onClick={prefill} variant="dark" size="sm">↺ Prefill 2025</Btn>
                <Btn onClick={save} variant="success" size="sm">✓ Save</Btn>
              </>
            }
          />
          <div style={{ display:"flex", flexDirection:"column", gap:"0.75rem", maxHeight:"70vh", overflowY:"auto", paddingRight:"0.25rem" }}>
            {datasets.rollingStock.map((s, idx) => (
              <div key={idx} style={{ background:"var(--surface)", borderRadius:"var(--radius-sm)", padding:"1rem", border:"1px solid var(--border)" }}>
                <div style={{ display:"flex", flexWrap:"wrap", gap:"0.6rem", alignItems:"center", marginBottom:"0.75rem" }}>
                  <input value={s.model} onChange={e => updateStock(idx,"model",e.target.value)} style={{ width:160 }} />
                  <select value={s.division} onChange={e => updateStock(idx,"division",e.target.value)} style={{ width:90 }}>
                    <option>A</option><option>B</option><option>SIR</option>
                  </select>
                  <DivisionTag div={s.division} />
                  <div style={{ marginLeft:"auto", display:"flex", gap:"0.4rem" }}>
                    <Btn onClick={() => addRange(idx)} variant="ghost" size="sm">+ Range</Btn>
                    <Btn onClick={() => removeStock(idx)} variant="danger" size="sm">Delete</Btn>
                  </div>
                </div>
                <div style={{ display:"flex", flexWrap:"wrap", gap:"0.5rem" }}>
                  {s.ranges.map((r, rIdx) => (
                    <div key={rIdx} style={{ display:"flex", alignItems:"center", gap:"0.4rem", background:"var(--card)", padding:"0.4rem 0.6rem", borderRadius:6, border:"1px solid var(--border)" }}>
                      <span style={{ color:"var(--muted)", fontSize:"0.75rem", whiteSpace:"nowrap" }}>#{rIdx+1}</span>
                      <input value={r[0]} onChange={e => updateRange(idx,rIdx,0,e.target.value)} style={{ width:80, textAlign:"center" }} />
                      <span style={{ color:"var(--muted)" }}>–</span>
                      <input value={r[1]} onChange={e => updateRange(idx,rIdx,1,e.target.value)} style={{ width:80, textAlign:"center" }} />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* ── LINES ── */}
      {tab === "lines" && (
        <Card>
          <SectionHeader
            title="Subway Lines"
            subtitle="Edit line IDs, colors, and terminal stations"
            actions={
              <>
                <Btn onClick={addLine} variant="ghost" size="sm">+ Add Line</Btn>
                <Btn onClick={save} variant="success" size="sm">✓ Save</Btn>
              </>
            }
          />
          <div style={{ display:"flex", flexDirection:"column", gap:"0.75rem", maxHeight:"70vh", overflowY:"auto", paddingRight:"0.25rem" }}>
            {datasets.lines.map((l, idx) => (
              <div key={idx} style={{ background:"var(--surface)", borderRadius:"var(--radius-sm)", padding:"0.85rem 1rem", border:"1px solid var(--border)", display:"flex", flexWrap:"wrap", gap:"0.6rem", alignItems:"center" }}>
                <LineBullet label={l.label} color={l.color} textColor={l.textColor||"#fff"} size={40} />
                <input value={l.id} onChange={e => updateLine(idx,"id",e.target.value)} style={{ width:56 }} placeholder="ID" />
                <input value={l.label} onChange={e => updateLine(idx,"label",e.target.value)} style={{ width:64 }} placeholder="Label" />
                <select value={l.division} onChange={e => updateLine(idx,"division",e.target.value)} style={{ width:80 }}>
                  <option>A</option><option>B</option><option>SIR</option>
                </select>
                <div style={{ display:"flex", alignItems:"center", gap:"0.4rem" }}>
                  <input type="color" value={l.color} onChange={e => updateLine(idx,"color",e.target.value)} style={{ width:40, height:36, padding:2, cursor:"pointer" }} />
                  <input value={l.color} onChange={e => updateLine(idx,"color",e.target.value)} style={{ width:90 }} placeholder="#000000" />
                </div>
                <input value={l.terminals?.[0]||""} onChange={e => updateLine(idx,"terminals",[e.target.value, l.terminals?.[1]||""])} style={{ flex:1, minWidth:140 }} placeholder="Terminal A" />
                <input value={l.terminals?.[1]||""} onChange={e => updateLine(idx,"terminals",[l.terminals?.[0]||"", e.target.value])} style={{ flex:1, minWidth:140 }} placeholder="Terminal B" />
                <Btn onClick={() => removeLine(idx)} variant="danger" size="sm">Delete</Btn>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* ── SUMMARY ── */}
      {tab === "summary" && (
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(280px, 1fr))", gap:"1.25rem" }}>
          <Card>
            <SectionHeader title="By Model" subtitle="Cars ridden per rolling stock model" />
            {modelCounts.length === 0 ? (
              <div style={{ color:"var(--muted)" }}>No rides yet.</div>
            ) : modelCounts.map(([model, count]) => (
              <div key={model} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"0.5rem 0", borderBottom:"1px solid var(--border)" }}>
                <span style={{ fontWeight:600 }}>{model}</span>
                <span style={{ fontFamily:"'Barlow Condensed', sans-serif", fontWeight:800, fontSize:"1.1rem", color:"var(--accent)" }}>{count}</span>
              </div>
            ))}
          </Card>

          <Card>
            <SectionHeader title="By Line" subtitle="Rides logged per subway line" />
            {lineCounts.length === 0 ? (
              <div style={{ color:"var(--muted)" }}>No rides yet.</div>
            ) : lineCounts.map(([lineId, count]) => {
              const lineData = datasets.lines.find(l => l.id === lineId);
              return (
                <div key={lineId} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"0.5rem 0", borderBottom:"1px solid var(--border)" }}>
                  <div style={{ display:"flex", alignItems:"center", gap:"0.6rem" }}>
                    {lineData && <LineBullet label={lineData.label} color={lineData.color} textColor={lineData.textColor||"#fff"} size={30} />}
                    <span style={{ fontWeight:600 }}>Line {lineId}</span>
                  </div>
                  <span style={{ fontFamily:"'Barlow Condensed', sans-serif", fontWeight:800, fontSize:"1.1rem", color:"var(--accent)" }}>{count}</span>
                </div>
              );
            })}
          </Card>

          <Card>
            <SectionHeader title="Overview" />
            {[
              ["Total Rides", rides.length],
              ["Unique Models", new Set(rides.map(r=>r.model)).size],
              ["Unique Lines",  new Set(rides.map(r=>r.line)).size],
              ["First Ride", rides.length ? new Date(rides[0].timestamp).toLocaleDateString() : "—"],
              ["Latest Ride", rides.length ? new Date(rides[rides.length-1].timestamp).toLocaleDateString() : "—"],
            ].map(([label, val]) => (
              <div key={label} style={{ display:"flex", justifyContent:"space-between", padding:"0.6rem 0", borderBottom:"1px solid var(--border)" }}>
                <span style={{ color:"var(--muted)" }}>{label}</span>
                <span style={{ fontFamily:"'Barlow Condensed', sans-serif", fontWeight:800, fontSize:"1.1rem", color:"var(--accent)" }}>{val}</span>
              </div>
            ))}
          </Card>
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────
   RIDE TABLE
───────────────────────────────────────────────────────────────── */
function RideTable({ rides, setRides, datasets }) {
  const [query, setQuery] = useState("");

  const filtered = rides.filter(r => {
    const q = query.toLowerCase();
    return !q || [r.trainNumber, r.model, r.line, r.lineLabel].some(v => v?.toLowerCase().includes(q));
  });

  function deleteRide(id) { setRides(rides.filter(r => r.id !== id)); }

  return (
    <div>
      <div style={{ display:"flex", gap:"0.6rem", marginBottom:"1rem" }}>
        <input placeholder="Filter by line, model, car #…" value={query} onChange={e => setQuery(e.target.value)} style={{ flex:1 }} />
        {query && <Btn onClick={() => setQuery("")} variant="ghost" size="sm">✕ Clear</Btn>}
      </div>

      {filtered.length === 0 ? (
        <div style={{ color:"var(--muted)", padding:"2rem 0", textAlign:"center" }}>No rides match.</div>
      ) : (
        <div style={{ overflowX:"auto", borderRadius:"var(--radius-sm)", border:"1px solid var(--border)" }}>
          <table>
            <thead>
              <tr style={{ background:"#0f0f18" }}>
                {["Time","Line","Car #","Model","Division",""].map(h => (
                  <th key={h} style={{ padding:"0.65rem 0.85rem", fontFamily:"'Barlow Condensed', sans-serif", fontWeight:700, fontSize:"0.78rem", letterSpacing:"0.1em", textTransform:"uppercase", color:"var(--muted)", whiteSpace:"nowrap", borderBottom:"1px solid var(--border)" }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[...filtered].reverse().map((r, i) => (
                <tr key={r.id} style={{ background: i%2===0 ? "transparent" : "rgba(255,255,255,0.02)", borderBottom:"1px solid var(--border)" }}>
                  <td style={{ padding:"0.6rem 0.85rem", fontSize:"0.85rem", color:"var(--muted)", whiteSpace:"nowrap" }}>{new Date(r.timestamp).toLocaleString()}</td>
                  <td style={{ padding:"0.6rem 0.85rem" }}>
                    <div style={{ display:"flex", alignItems:"center", gap:"0.5rem" }}>
                      <LineBullet label={r.lineLabel||r.line} color={r.lineColor||"#555"} textColor={r.lineTextColor||"#fff"} size={32} />
                    </div>
                  </td>
                  <td style={{ padding:"0.6rem 0.85rem", fontFamily:"'Barlow Condensed', sans-serif", fontWeight:700, fontSize:"1rem" }}>#{r.trainNumber}</td>
                  <td style={{ padding:"0.6rem 0.85rem", fontWeight:600 }}>{r.model}</td>
                  <td style={{ padding:"0.6rem 0.85rem" }}><DivisionTag div={r.division} /></td>
                  <td style={{ padding:"0.6rem 0.85rem" }}>
                    <Btn onClick={() => deleteRide(r.id)} variant="danger" size="sm">Delete</Btn>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────
   ROOT APP
───────────────────────────────────────────────────────────────── */
export default function App() {
  const [page, setPage] = useState("live");
  const [datasets, setDatasets] = useState(getDatasets);
  const [rides, setRides] = useCookieRides();

  function onAddRide(ride) { setRides(prev => [...prev, ride]); }

  return (
    <>
      <GlobalStyles />
      <div style={{ minHeight:"100vh", position:"relative", zIndex:1 }}>
        <Header page={page} setPage={setPage} rideCount={rides.length} />

        <main style={{ padding:"1.5rem max(1rem, env(safe-area-inset-left)) 3rem" }}>
          <AnimatePresence mode="wait">
            <motion.div
              key={page}
              initial={{ opacity:0, y:8 }}
              animate={{ opacity:1, y:0 }}
              exit={{ opacity:0 }}
              transition={{ duration:0.2 }}
            >
              {page === "live"
                ? <LiveRider datasets={datasets} onAddRide={onAddRide} rides={rides} />
                : <StatsPage datasets={datasets} setDatasets={setDatasets} />}
            </motion.div>
          </AnimatePresence>
        </main>

        <footer style={{ borderTop:"1px solid var(--border)", padding:"1.25rem max(1rem, env(safe-area-inset-left))", textAlign:"center", color:"var(--muted)", fontSize:"0.8rem", letterSpacing:"0.04em" }}>
          HaveIRidden? · Personal NYC Subway Tracker · Fleet data is user-editable — refine in Stats.
        </footer>
      </div>
    </>
  );
}
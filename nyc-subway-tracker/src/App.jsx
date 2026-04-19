import React, { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import "./App.css";

/* ─────────────────────────────────────────────────────────────────
   SYSTEM SELECTION (stored in cookie)
───────────────────────────────────────────────────────────────── */
const SYSTEM_COOKIE = "transit_system_v1";

function readSystemCookie() {
  try {
    const match = document.cookie.split(";").map((c) => c.trim()).find((c) => c.startsWith(`${SYSTEM_COOKIE}=`));
    if (!match) return null;
    const val = match.split("=")[1];
    return ["nyc", "dc"].includes(val) ? val : null;
  } catch { return null; }
}
function writeSystemCookie(system) {
  document.cookie = `${SYSTEM_COOKIE}=${system}; Max-Age=${60 * 60 * 24 * 400}; Path=/`;
}

/* ─────────────────────────────────────────────────────────────────
   SYSTEM SELECTOR SCREEN
───────────────────────────────────────────────────────────────── */
const SELECTOR_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=EB+Garamond:wght@400;600&family=IBM+Plex+Mono:wght@400;500&family=IBM+Plex+Sans:wght@300;400;500&family=Barlow+Condensed:wght@700;800;900&family=Barlow:wght@400;500;600&display=swap');
  .sys-root {
    min-height:100vh;background:#0a0a0f;display:flex;align-items:center;
    justify-content:center;padding:2rem 1rem;position:relative;font-family:'IBM Plex Sans',system-ui,sans-serif;
  }
  .sys-grid-bg {
    position:fixed;inset:0;pointer-events:none;
    background-image:
      repeating-linear-gradient(0deg,transparent,transparent 59px,rgba(255,255,255,0.018) 59px,rgba(255,255,255,0.018) 60px),
      repeating-linear-gradient(90deg,transparent,transparent 59px,rgba(255,255,255,0.018) 59px,rgba(255,255,255,0.018) 60px);
  }
`;

function NYCVisual() {
  const lines = [
    { label:"A",color:"#2850AD" },{ label:"1",color:"#EE352E" },
    { label:"N",color:"#FCCC0A",tc:"#000" },{ label:"G",color:"#6CBE45" },
    { label:"7",color:"#B933AD" },{ label:"L",color:"#A7A9AC" },
  ];
  return (
    <div style={{display:"flex",flexWrap:"wrap",gap:"0.5rem",padding:"1rem",justifyContent:"center"}}>
      {lines.map((l,i) => (
        <motion.div key={l.label} initial={{scale:0,rotate:-10}} animate={{scale:1,rotate:0}}
          transition={{delay:0.05+i*0.06,type:"spring",stiffness:200}}
          style={{width:44,height:44,borderRadius:"50%",background:l.color,color:l.tc||"#fff",
            display:"flex",alignItems:"center",justifyContent:"center",
            fontFamily:"'Barlow Condensed',sans-serif",fontWeight:900,fontSize:"1.05rem",
            boxShadow:`0 4px 16px ${l.color}55`}}>
          {l.label}
        </motion.div>
      ))}
    </div>
  );
}

function DCVisual() {
  const dcLines = [{color:"#BF0D3E"},{color:"#009CDE"},{color:"#ED8B00"},{color:"#919D9D"},{color:"#00B140"},{color:"#FFD100"}];
  return (
    <svg width="200" height="110" viewBox="0 0 200 110" fill="none">
      <path d="M20 100 Q20 20 100 20 Q180 20 180 100" stroke="rgba(255,255,255,0.12)" strokeWidth="1.5" fill="none"/>
      {[0.2,0.35,0.5,0.65,0.8].map((t,i)=>{
        const x=20+t*160; const yTop=20+Math.pow(t-0.5,2)*160;
        return <line key={i} x1={x} y1={yTop} x2={x} y2={100} stroke="rgba(255,255,255,0.06)" strokeWidth="1"/>;
      })}
      {dcLines.map((l,i)=>(<rect key={l.color} x={20+i*(160/6)} y={98} width={160/6} height={4} fill={l.color} opacity={0.75}/>))}
      <line x1={20} y1={102} x2={180} y2={102} stroke="rgba(255,255,255,0.1)" strokeWidth={1}/>
    </svg>
  );
}

function SystemCard({ id, label, description, features, onSelect, delay }) {
  const isNYC = id === "nyc";
  return (
    <motion.button initial={{opacity:0,y:20}} animate={{opacity:1,y:0}}
      transition={{delay,duration:0.4,ease:"easeOut"}} whileHover={{scale:1.02}} whileTap={{scale:0.98}}
      onClick={()=>onSelect(id)}
      style={{position:"relative",width:"100%",maxWidth:320,background:"transparent",border:"none",cursor:"pointer",padding:0,textAlign:"left",borderRadius:0,overflow:"hidden"}}>
      <div style={{border:"1px solid rgba(255,255,255,0.1)",borderRadius:isNYC?0:4,overflow:"hidden",background:isNYC?"#111116":"#0d0e0f"}}>
        <div style={{height:140,position:"relative",overflow:"hidden",display:"flex",alignItems:"center",justifyContent:"center",
          background:isNYC?"linear-gradient(135deg,#111116 0%,#1a1a22 100%)":"linear-gradient(135deg,#0d0e0f 0%,#14161a 100%)"}}>
          {isNYC ? <NYCVisual/> : <DCVisual/>}
        </div>
        <div style={{padding:"1.25rem",borderTop:`3px solid ${isNYC?"#FCCC0A":"rgba(255,255,255,0.15)"}`}}>
          <div style={{fontFamily:isNYC?"'Barlow Condensed',sans-serif":"'IBM Plex Sans',sans-serif",fontWeight:isNYC?900:500,
            fontSize:isNYC?"1.5rem":"1rem",letterSpacing:isNYC?"0.04em":"0.12em",textTransform:isNYC?"none":"uppercase",
            color:"#f0f0f4",marginBottom:"0.3rem"}}>{label}</div>
          <div style={{fontFamily:isNYC?"'Barlow',sans-serif":"'IBM Plex Mono',monospace",fontSize:isNYC?"0.82rem":"0.68rem",
            color:"rgba(240,240,244,0.4)",letterSpacing:isNYC?"0":"0.08em",lineHeight:1.5}}>{description}</div>
          <div style={{display:"flex",gap:"0.35rem",flexWrap:"wrap",marginTop:"0.85rem"}}>
            {features.map(f=>(
              <span key={f} style={{padding:"0.2rem 0.5rem",background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.08)",
                borderRadius:isNYC?4:2,fontFamily:isNYC?"'Barlow',sans-serif":"'IBM Plex Mono',monospace",
                fontSize:"0.65rem",color:"rgba(255,255,255,0.35)",letterSpacing:"0.04em"}}>{f}</span>
            ))}
          </div>
        </div>
        <div style={{padding:"0.85rem 1.25rem",background:"rgba(255,255,255,0.025)",borderTop:"1px solid rgba(255,255,255,0.07)",
          display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <span style={{fontFamily:isNYC?"'Barlow Condensed',sans-serif":"'IBM Plex Mono',monospace",fontWeight:isNYC?800:500,
            fontSize:isNYC?"0.88rem":"0.7rem",letterSpacing:isNYC?"0.06em":"0.12em",textTransform:"uppercase",
            color:isNYC?"#FCCC0A":"rgba(232,230,224,0.5)"}}>Select →</span>
        </div>
      </div>
    </motion.button>
  );
}

function SystemSelector({ onSelect }) {
  const systems = [
    { id:"nyc", label:"NYC Subway", description:"Log every train car you've ridden on the MTA network.", features:["Rolling stock IDs","All 24 lines","Ride history"] },
    { id:"dc",  label:"WMATA",      description:"Track every station you've visited across 6 Metro lines.", features:["6 lines","98 stations","Per-line progress"] },
  ];
  return (
    <>
      <style>{SELECTOR_CSS}</style>
      <div className="sys-root">
        <div className="sys-grid-bg"/>
        <div style={{position:"relative",zIndex:1,width:"100%",maxWidth:760}}>
          <motion.div initial={{opacity:0,y:-12}} animate={{opacity:1,y:0}} transition={{duration:0.5}}
            style={{textAlign:"center",marginBottom:"2.5rem"}}>
            <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:"0.65rem",letterSpacing:"0.2em",textTransform:"uppercase",
              color:"rgba(255,255,255,0.25)",marginBottom:"0.75rem"}}>HaveIRidden?</div>
            <h1 style={{fontFamily:"'EB Garamond',Georgia,serif",fontStyle:"italic",fontWeight:400,
              fontSize:"clamp(1.8rem,5vw,2.6rem)",color:"#f0f0f4",margin:0,letterSpacing:"0.01em",lineHeight:1.15}}>
              Which system do you ride?</h1>
            <p style={{marginTop:"0.6rem",fontFamily:"'IBM Plex Sans',sans-serif",fontSize:"0.85rem",
              color:"rgba(255,255,255,0.3)",letterSpacing:"0.02em"}}>Your choice is saved — you can switch anytime from the header.</p>
          </motion.div>
          <div style={{display:"flex",gap:"1.25rem",justifyContent:"center",flexWrap:"wrap"}}>
            {systems.map((s,i) => (<SystemCard key={s.id} {...s} onSelect={onSelect} delay={0.2+i*0.1}/>))}
          </div>
          <motion.div initial={{opacity:0}} animate={{opacity:1}} transition={{delay:0.7}}
            style={{marginTop:"2rem",textAlign:"center",fontFamily:"'IBM Plex Mono',monospace",fontSize:"0.58rem",
              color:"rgba(255,255,255,0.15)",letterSpacing:"0.08em",textTransform:"uppercase"}}>
            All data stored locally in your browser · No account required</motion.div>
        </div>
      </div>
    </>
  );
}

/* ─────────────────────────────────────────────────────────────────
   LOCALSTORAGE HELPERS (NYC)
   Rides are stored in localStorage, NOT cookies.
   Cookies have a 4KB limit — Safari silently drops writes beyond
   that, so after ~14 rides new entries were never actually saved.
   localStorage has a ~5MB limit and persists reliably in iOS PWAs.
───────────────────────────────────────────────────────────────── */
const RIDES_KEY = "nyc_subway_rides_v2";
// FIX: separate keys for user-edited datasets vs remote cache
const USER_DATA_KEY = "nyc_subway_datasets_v1";
const REMOTE_CACHE_KEY = "nyc_subway_remote_cache_v1";
const REMOTE_CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

function readRidesFromStorage() {
  try {
    const raw = localStorage.getItem(RIDES_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch { return []; }
}
function writeRidesToStorage(rides) {
  try {
    localStorage.setItem(RIDES_KEY, JSON.stringify(rides));
  } catch (e) {
    // localStorage full — shouldn't happen at normal ride counts but log it
    console.warn("[HaveIRidden] Could not save rides:", e);
  }
}

// Migrate any existing cookie rides into localStorage on first run,
// then clear the cookie so we don't double-count.
function migrateFromCookie() {
  const COOKIE_NAME = "nyc_subway_rides";
  try {
    const match = document.cookie.split(";").map(c=>c.trim()).find(c=>c.startsWith(`${COOKIE_NAME}=`));
    if (!match) return;
    const arr = JSON.parse(decodeURIComponent(match.split("=")[1] || ""));
    if (Array.isArray(arr) && arr.length > 0) {
      const existing = readRidesFromStorage();
      if (existing.length === 0) {
        // Only migrate if localStorage is empty — avoid duplicates
        writeRidesToStorage(arr);
        console.log(`[HaveIRidden] Migrated ${arr.length} rides from cookie to localStorage`);
      }
    }
    // Clear the cookie regardless
    document.cookie = `${COOKIE_NAME}=; Max-Age=0; Path=/`;
  } catch {}
}

// Single source of truth for rides — only called once in NYCApp, passed as props
function useRides() {
  const [rides, setRides] = useState(() => {
    migrateFromCookie();        // one-time migration on first render
    return readRidesFromStorage();
  });
  useEffect(() => writeRidesToStorage(rides), [rides]);
  return [rides, setRides];
}

async function fetchRemoteDatasets() {
  const res = await fetch(`/data/datasets.json?v=${Date.now()}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

// Remote cache: saves fetched data + timestamp so the app works offline instantly
function getRemoteCache() {
  try {
    const raw = localStorage.getItem(REMOTE_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed.data || !parsed.timestamp) return null;
    return parsed;
  } catch { return null; }
}
function saveRemoteCache(data) {
  try { localStorage.setItem(REMOTE_CACHE_KEY, JSON.stringify({ data, timestamp: Date.now() })); } catch {}
}
function clearRemoteCache() {
  try { localStorage.removeItem(REMOTE_CACHE_KEY); } catch {}
}

// User edits: saved separately, take priority over remote cache
function getUserDatasets() {
  try { const s = localStorage.getItem(USER_DATA_KEY); return s ? JSON.parse(s) : null; } catch { return null; }
}
function saveUserDatasets(ds) { localStorage.setItem(USER_DATA_KEY, JSON.stringify(ds)); }
function clearUserDatasets() { localStorage.removeItem(USER_DATA_KEY); }

const FALLBACK_DATASETS = {
  rollingStock:[
    {model:"R62",ranges:[[1301,1390],[1601,1625]],division:"A"},
    {model:"R62A",ranges:[[1651,2150]],division:"A"},
    {model:"R142",ranges:[[1101,1250],[6300,7180]],division:"A"},
    {model:"R142 / R188",ranges:[[7211,7936]],division:"A"},
    {model:"R68",ranges:[[2500,2924]],division:"B"},
    {model:"R179",ranges:[[3010,3327]],division:"B"},
    {model:"R211A",ranges:[[3400,4499]],division:"B"},
    {model:"R211T",ranges:[[4040,4059]],division:"B"},
    {model:"R68A",ranges:[[5001,5200]],division:"B"},
    {model:"R46",ranges:[[5482,6258]],division:"B"},
    {model:"R143",ranges:[[8101,8312]],division:"B"},
    {model:"R160",ranges:[[8313,9974]],division:"B"},
    {model:"R211S (SIR)",ranges:[[100,199]],division:"SIR"},
  ],
  lines:[
    {id:"1",label:"1",division:"A",color:"#EE352E",textColor:"#fff",terminals:["Van Cortlandt Park–242 St","South Ferry"]},
    {id:"2",label:"2",division:"A",color:"#EE352E",textColor:"#fff",terminals:["Wakefield–241 St","Flatbush Av–Bklyn College"]},
    {id:"3",label:"3",division:"A",color:"#EE352E",textColor:"#fff",terminals:["Harlem–148 St","New Lots Av"]},
    {id:"4",label:"4",division:"A",color:"#00933C",textColor:"#fff",terminals:["Woodlawn","Crown Hts–Utica Av"]},
    {id:"5",label:"5",division:"A",color:"#00933C",textColor:"#fff",terminals:["Eastchester–Dyre Av","Flatbush Av"]},
    {id:"6",label:"6",division:"A",color:"#00933C",textColor:"#fff",terminals:["Pelham Bay Park","Brooklyn Bridge–City Hall"]},
    {id:"7",label:"7",division:"A",color:"#B933AD",textColor:"#fff",terminals:["Flushing–Main St","34 St–Hudson Yards"]},
    {id:"A",label:"A",division:"B",color:"#2850AD",textColor:"#fff",terminals:["Inwood–207 St","Far Rockaway / Lefferts Blvd"]},
    {id:"B",label:"B",division:"B",color:"#FF6319",textColor:"#fff",terminals:["Bedford Park Blvd","Brighton Beach"]},
    {id:"C",label:"C",division:"B",color:"#2850AD",textColor:"#fff",terminals:["168 St","Euclid Av"]},
    {id:"D",label:"D",division:"B",color:"#FF6319",textColor:"#fff",terminals:["Norwood–205 St","Coney Island–Stillwell Av"]},
    {id:"E",label:"E",division:"B",color:"#2850AD",textColor:"#fff",terminals:["Jamaica Center","World Trade Center"]},
    {id:"F",label:"F",division:"B",color:"#FF6319",textColor:"#fff",terminals:["Jamaica–179 St","Coney Island–Stillwell Av"]},
    {id:"G",label:"G",division:"B",color:"#6CBE45",textColor:"#fff",terminals:["Court Sq","Church Av"]},
    {id:"J",label:"J",division:"B",color:"#996633",textColor:"#fff",terminals:["Jamaica Center","Broad St"]},
    {id:"Z",label:"Z",division:"B",color:"#996633",textColor:"#fff",terminals:["Jamaica Center","Broad St"]},
    {id:"L",label:"L",division:"B",color:"#A7A9AC",textColor:"#fff",terminals:["8 Av","Canarsie–Rockaway Pkwy"]},
    {id:"M",label:"M",division:"B",color:"#FF6319",textColor:"#fff",terminals:["Forest Hills–71 Av","Delancey–Essex"]},
    {id:"N",label:"N",division:"B",color:"#FCCC0A",textColor:"#000",terminals:["Astoria–Ditmars Blvd","Coney Island–Stillwell Av"]},
    {id:"Q",label:"Q",division:"B",color:"#FCCC0A",textColor:"#000",terminals:["96 St","Coney Island–Stillwell Av"]},
    {id:"R",label:"R",division:"B",color:"#FCCC0A",textColor:"#000",terminals:["Forest Hills–71 Av","Bay Ridge–95 St"]},
    {id:"W",label:"W",division:"B",color:"#FCCC0A",textColor:"#000",terminals:["Astoria–Ditmars Blvd","Whitehall St"]},
    {id:"S",label:"S",division:"A",color:"#808183",textColor:"#fff",terminals:["Times Sq–42 St","Grand Central–42 St"]},
    {id:"SIR",label:"SIR",division:"SIR",color:"#0039A6",textColor:"#fff",terminals:["St George","Tottenville"]},
  ],
};

function detectModelFromNumber(numStr, rollingStock) {
  const n = parseInt(numStr, 10);
  if (Number.isNaN(n)) return null;
  for (const entry of rollingStock)
    for (const [lo, hi] of entry.ranges)
      if (n >= lo && n <= hi) return { model: entry.model, division: entry.division };
  return null;
}

/* ─────────────────────────────────────────────────────────────────
   SHARED UI (NYC)
───────────────────────────────────────────────────────────────── */
function LineBullet({ label, color, textColor="#fff", size=48, selected, onClick }) {
  return (
    <button onClick={onClick} title={`Line ${label}`} style={{
      width:size,height:size,minWidth:size,borderRadius:"50%",background:color,color:textColor,
      fontWeight:900,fontSize:size*0.38,fontFamily:"'Barlow Condensed','Arial Narrow',sans-serif",
      border:selected?"3px solid #FCCC0A":"3px solid transparent",
      boxShadow:selected?`0 0 0 3px rgba(252,204,10,0.4),0 4px 16px ${color}66`:`0 2px 8px ${color}44`,
      transform:selected?"scale(1.15)":"scale(1)",transition:"all 0.15s ease",
      cursor:onClick?"pointer":"default",display:"flex",alignItems:"center",justifyContent:"center",
      flexShrink:0,lineHeight:1}}>
      {label}
    </button>
  );
}

function ProgressBar({ value, color="#00933C" }) {
  return (
    <div style={{width:"100%",height:8,background:"rgba(255,255,255,0.1)",borderRadius:4,overflow:"hidden"}}>
      <motion.div initial={{width:0}} animate={{width:`${Math.min(100,value)}%`}}
        transition={{duration:0.7,ease:"easeOut"}} style={{height:"100%",background:color,borderRadius:4}}/>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────
   NYC LIVE RIDER
───────────────────────────────────────────────────────────────── */
const DIV_LABELS = { A:"A Division · IRT", B:"B Division · IND/BMT", SIR:"Staten Island Rwy" };

// FIX: rides and setRides now come from props (lifted state in NYCApp)
function LiveRider({ datasets, rides, setRides }) {
  const [trainNumber, setTrainNumber] = useState("");
  const [selectedLine, setSelectedLine] = useState(null);
  const [lastRide, setLastRide] = useState(null);
  const found = useMemo(() => detectModelFromNumber(trainNumber, datasets.rollingStock), [trainNumber, datasets.rollingStock]);
  const linesByDivision = useMemo(() => {
    const map = {};
    datasets.lines.forEach(l => { if (!map[l.division]) map[l.division] = []; map[l.division].push(l); });
    return map;
  }, [datasets.lines]);

  function handleLog() {
    if (!trainNumber || !selectedLine) return;
    const ride = {
      id: crypto.randomUUID(), trainNumber: trainNumber.trim(),
      line: selectedLine.id, lineLabel: selectedLine.label, lineColor: selectedLine.color,
      lineTextColor: selectedLine.textColor || "#fff", model: found?.model || "Unknown",
      division: found?.division || "?", timestamp: new Date().toISOString()
    };
    setRides(prev => [...prev, ride]);
    setLastRide(ride);
    setTrainNumber("");
  }

  const canLog = trainNumber.length > 0 && selectedLine;
  return (
    <div style={{maxWidth:640,margin:"0 auto",padding:"1.5rem 1rem 3rem"}}>
      <div style={{marginBottom:"1.5rem"}}>
        <label style={labelStyle}>Train Car Number</label>
        <input type="text" inputMode="numeric" placeholder="e.g. 8778" value={trainNumber}
          onChange={e => setTrainNumber(e.target.value.replace(/[^0-9]/g, ""))}
          onKeyDown={e => e.key === "Enter" && handleLog()}
          style={{...inputStyle,fontSize:"2.4rem",fontWeight:800,textAlign:"center",letterSpacing:"0.15em",padding:"0.8rem"}}/>
      </div>
      <AnimatePresence>
        {trainNumber && selectedLine && (
          <motion.div key="preview" initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-8}}
            style={{background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:16,
              padding:"1.25rem 1.5rem",textAlign:"center",marginBottom:"1.5rem"}}>
            <div style={{fontSize:"1rem",color:"rgba(255,255,255,0.55)",marginBottom:"0.4rem"}}>You're riding a</div>
            <div style={{fontSize:"2.8rem",fontWeight:900,fontFamily:"'Barlow Condensed',sans-serif",lineHeight:1,color:found?"#4ade80":"#f87171"}}>
              {found?.model || "Unknown"}</div>
            <div style={{marginTop:"0.5rem",fontSize:"1.05rem",color:"rgba(255,255,255,0.6)"}}>
              on the <span style={{color:selectedLine.color,fontWeight:700}}>{selectedLine.label}</span> line 🚇</div>
            {!found && <div style={{marginTop:"0.5rem",fontSize:"0.78rem",color:"#f87171"}}>
              Car not found — check number or update ranges in Stats → Settings</div>}
          </motion.div>
        )}
      </AnimatePresence>
      <div style={{marginBottom:"1.5rem"}}>
        <label style={labelStyle}>Select Line</label>
        {Object.entries(linesByDivision).map(([div, lines]) => (
          <div key={div} style={{marginBottom:"1rem"}}>
            <div style={{fontSize:"0.7rem",color:"rgba(255,255,255,0.35)",letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:"0.6rem"}}>
              {DIV_LABELS[div] || div}</div>
            <div style={{display:"flex",flexWrap:"wrap",gap:"0.55rem"}}>
              {lines.map(l => <LineBullet key={l.id} label={l.label} color={l.color} textColor={l.textColor} size={54}
                selected={selectedLine?.id === l.id} onClick={() => setSelectedLine(prev => prev?.id === l.id ? null : l)}/>)}
            </div>
          </div>
        ))}
      </div>
      <motion.button onClick={handleLog} disabled={!canLog} whileTap={canLog ? {scale:0.97} : {}}
        style={{width:"100%",padding:"1rem",borderRadius:14,border:"none",
          background:canLog?"#FCCC0A":"rgba(255,255,255,0.08)",color:canLog?"#000":"rgba(255,255,255,0.3)",
          fontFamily:"'Barlow Condensed',sans-serif",fontWeight:900,fontSize:"1.3rem",letterSpacing:"0.08em",
          cursor:canLog?"pointer":"not-allowed",transition:"background 0.2s,color 0.2s",marginBottom:"1.5rem"}}>
        LOG RIDE →
      </motion.button>
      <AnimatePresence>
        {lastRide && (
          <motion.div key={lastRide.id} initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} exit={{opacity:0}}
            style={{display:"flex",alignItems:"center",gap:"1rem",background:"rgba(0,147,60,0.15)",
              border:"1px solid rgba(0,147,60,0.4)",borderRadius:14,padding:"1rem 1.25rem"}}>
            <LineBullet label={lastRide.lineLabel} color={lastRide.lineColor} textColor={lastRide.lineTextColor} size={46}/>
            <div>
              <div style={{fontWeight:700,fontSize:"1rem"}}>✓ Ride logged!</div>
              <div style={{color:"rgba(255,255,255,0.55)",fontSize:"0.85rem"}}>{lastRide.model} · Car #{lastRide.trainNumber}</div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────
   NYC STATS PAGE
   FIX: rides/setRides are props, not local state. No more split brain.
───────────────────────────────────────────────────────────────── */
function StatsPage({ datasets, setDatasets, datasetsSource, onResetToRemote, onForceRefresh, refreshing, rides, setRides }) {
  const [tab, setTab] = useState("progress");
  const [query, setQuery] = useState("");
  const riddenModels = useMemo(() => new Set(rides.map(r => r.model)), [rides]);
  const riddenLines = useMemo(() => new Set(rides.map(r => r.line)), [rides]);
  const modelPct = datasets.rollingStock.length ? (riddenModels.size / datasets.rollingStock.length) * 100 : 0;
  const linePct = datasets.lines.length ? (riddenLines.size / datasets.lines.length) * 100 : 0;

  function deleteRide(id) { setRides(prev => prev.filter(r => r.id !== id)); }
  function clearRides() { if (confirm("Delete ALL rides?")) setRides([]); }
  function exportRides() {
    const blob = new Blob([JSON.stringify(rides, null, 2)], {type:"application/json"});
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url;
    a.download = `nyc-rides-${new Date().toISOString().slice(0,10)}.json`; a.click(); URL.revokeObjectURL(url);
  }
  function importRides(e) {
    const file = e.target.files?.[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try { const p = JSON.parse(reader.result); if (!Array.isArray(p)) throw new Error("Expected array"); setRides(p); }
      catch (err) { alert("Invalid JSON: " + err.message); }
    }; reader.readAsText(file);
  }
  function save() { setDatasets(datasets); alert("Saved to your device!"); }
  function reset() { if (confirm("Reset to server defaults? Your local edits will be cleared.")) { onResetToRemote(); } }
  function updateLine(idx, field, value) { setDatasets(d => ({...d,lines:d.lines.map((l,i)=>i===idx?{...l,[field]:value}:l)})); }
  function removeLine(idx) { setDatasets(d => ({...d,lines:d.lines.filter((_,i)=>i!==idx)})); }
  function addLine() { setDatasets(d => ({...d,lines:[...d.lines,{id:"X",label:"X",division:"B",color:"#444",textColor:"#fff",terminals:["",""]}]})); }
  function updateStock(idx, field, value) { setDatasets(d => ({...d,rollingStock:d.rollingStock.map((s,i)=>i===idx?{...s,[field]:value}:s)})); }
  function updateRange(idx, rIdx, which, value) {
    setDatasets(d => ({...d,rollingStock:d.rollingStock.map((s,i)=>{
      if (i !== idx) return s;
      return {...s,ranges:s.ranges.map((r,j)=>j===rIdx?[which===0?+value:r[0],which===1?+value:r[1]]:r)};
    })}));
  }
  function addRange(idx) { setDatasets(d => ({...d,rollingStock:d.rollingStock.map((s,i)=>i===idx?{...s,ranges:[...s.ranges,[0,0]]}:s)})); }
  function removeStock(idx) { setDatasets(d => ({...d,rollingStock:d.rollingStock.filter((_,i)=>i!==idx)})); }
  function addStock() { setDatasets(d => ({...d,rollingStock:[...d.rollingStock,{model:"New Model",ranges:[[0,0]],division:"A"}]})); }

  const filteredRides = rides.filter(r => {
    const q = query.toLowerCase();
    return !q || [r.trainNumber, r.model, r.line].some(v => v?.toLowerCase().includes(q));
  });
  const innerTabs = [{key:"progress",label:"Progress"},{key:"history",label:"History"},{key:"settings",label:"Settings"}];

  return (
    <div style={{maxWidth:900,margin:"0 auto",padding:"1.5rem 1rem 3rem"}}>
      <div style={{display:"flex",gap:"0.3rem",background:"rgba(255,255,255,0.05)",borderRadius:12,padding:"0.3rem",marginBottom:"1.5rem",overflowX:"auto"}}>
        {innerTabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            style={{flex:1,padding:"0.55rem 1rem",border:"none",borderRadius:9,fontFamily:"'Barlow Condensed',sans-serif",
              fontWeight:700,fontSize:"1rem",letterSpacing:"0.04em",whiteSpace:"nowrap",
              background:tab===t.key?"#FCCC0A":"transparent",color:tab===t.key?"#000":"rgba(255,255,255,0.5)",
              cursor:"pointer",transition:"all 0.15s"}}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === "progress" && (
        <div style={{display:"flex",flexDirection:"column",gap:"1.5rem"}}>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))",gap:"0.75rem"}}>
            {[{label:"Total Rides",value:rides.length,color:"#FCCC0A"},
              {label:"Models Ridden",value:`${riddenModels.size}/${datasets.rollingStock.length}`,color:"#4ade80"},
              {label:"Lines Ridden",value:`${riddenLines.size}/${datasets.lines.length}`,color:"#60a5fa"},
              {label:"Unique Cars",value:new Set(rides.map(r=>r.trainNumber)).size,color:"#f472b6"}
            ].map(({label,value,color}) => (
              <div key={label} style={{background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:14,padding:"1rem 1.25rem"}}>
                <div style={{fontSize:"0.72rem",color:"rgba(255,255,255,0.4)",textTransform:"uppercase",letterSpacing:"0.1em"}}>{label}</div>
                <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:900,fontSize:"2rem",color,marginTop:"0.2rem"}}>{value}</div>
              </div>
            ))}
          </div>
          <div style={cardStyle}>
            <div style={sectionHeadStyle}>Train Models <span style={badgeStyle}>{riddenModels.size}/{datasets.rollingStock.length}</span></div>
            <ProgressBar value={modelPct} color="#4ade80"/>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(130px,1fr))",gap:"0.6rem",marginTop:"1rem"}}>
              {datasets.rollingStock.map(s => {
                const ridden = riddenModels.has(s.model);
                return (
                  <motion.div key={s.model} whileHover={{scale:1.03}}
                    style={{padding:"0.75rem 1rem",borderRadius:10,
                      border:`1px solid ${ridden?"rgba(74,222,128,0.4)":"rgba(255,255,255,0.08)"}`,
                      background:ridden?"rgba(74,222,128,0.1)":"rgba(255,255,255,0.03)",
                      display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                    <span style={{fontWeight:700,fontSize:"0.95rem"}}>{s.model}</span>
                    <span style={{fontSize:"1.1rem"}}>{ridden ? "✓" : "·"}</span>
                  </motion.div>
                );
              })}
            </div>
          </div>
          <div style={cardStyle}>
            <div style={sectionHeadStyle}>Subway Lines <span style={badgeStyle}>{riddenLines.size}/{datasets.lines.length}</span></div>
            <ProgressBar value={linePct} color="#60a5fa"/>
            <div style={{display:"flex",flexWrap:"wrap",gap:"0.6rem",marginTop:"1rem"}}>
              {datasets.lines.map(l => {
                const ridden = riddenLines.has(l.id);
                return (
                  <div key={l.id} style={{display:"flex",alignItems:"center",gap:"0.5rem",padding:"0.4rem 0.8rem 0.4rem 0.4rem",
                    borderRadius:999,border:`1.5px solid ${ridden?l.color:"rgba(255,255,255,0.1)"}`,
                    background:ridden?`${l.color}22`:"rgba(255,255,255,0.03)",opacity:ridden?1:0.5}}>
                    <LineBullet label={l.label} color={l.color} textColor={l.textColor} size={30}/>
                    <span style={{fontSize:"0.82rem",fontWeight:600}}>{ridden ? "✓" : ""}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {tab === "history" && (
        <div style={cardStyle}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"1rem",flexWrap:"wrap",gap:"0.5rem"}}>
            <span style={sectionHeadStyle}>Ride History <span style={badgeStyle}>{rides.length}</span></span>
            <div style={{display:"flex",gap:"0.5rem",flexWrap:"wrap"}}>
              <SmallBtn onClick={exportRides}>⬇ Export</SmallBtn>
              <label style={{...smallBtnStyle,cursor:"pointer"}}>⬆ Import<input type="file" accept="application/json" style={{display:"none"}} onChange={importRides}/></label>
              <SmallBtn onClick={clearRides} danger>🗑 Clear All</SmallBtn>
            </div>
          </div>
          <input placeholder="Filter by line, model, car #…" value={query} onChange={e => setQuery(e.target.value)} style={{...inputStyle,marginBottom:"1rem"}}/>
          <div style={{overflowX:"auto",borderRadius:10,border:"1px solid rgba(255,255,255,0.08)"}}>
            <table style={{width:"100%",borderCollapse:"collapse",fontSize:"0.88rem"}}>
              <thead><tr style={{background:"rgba(0,0,0,0.4)"}}>
                {["Time","Line","Car #","Model","Div",""].map(h=>(
                  <th key={h} style={{padding:"0.6rem 0.8rem",textAlign:"left",color:"rgba(255,255,255,0.4)",fontWeight:700,
                    fontSize:"0.72rem",letterSpacing:"0.08em",textTransform:"uppercase",
                    borderBottom:"1px solid rgba(255,255,255,0.08)",whiteSpace:"nowrap"}}>{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {filteredRides.length === 0 && <tr><td colSpan={6} style={{padding:"2rem",textAlign:"center",color:"rgba(255,255,255,0.3)"}}>No rides match.</td></tr>}
                {[...filteredRides].reverse().map((r, i) => (
                  <tr key={r.id} style={{background:i%2===0?"transparent":"rgba(255,255,255,0.02)",borderBottom:"1px solid rgba(255,255,255,0.05)"}}>
                    <td style={{padding:"0.55rem 0.8rem",color:"rgba(255,255,255,0.45)",whiteSpace:"nowrap"}}>{new Date(r.timestamp).toLocaleString()}</td>
                    <td style={{padding:"0.55rem 0.8rem"}}><LineBullet label={r.lineLabel||r.line} color={r.lineColor||"#555"} textColor={r.lineTextColor||"#fff"} size={32}/></td>
                    <td style={{padding:"0.55rem 0.8rem",fontWeight:700,fontFamily:"'Barlow Condensed',sans-serif",fontSize:"1.05rem"}}>#{r.trainNumber}</td>
                    <td style={{padding:"0.55rem 0.8rem",fontWeight:600}}>{r.model}</td>
                    <td style={{padding:"0.55rem 0.8rem",color:"rgba(255,255,255,0.45)",fontSize:"0.8rem"}}>{r.division}</td>
                    <td style={{padding:"0.55rem 0.8rem"}}><SmallBtn onClick={() => deleteRide(r.id)} danger>✕</SmallBtn></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === "settings" && (
        <div style={{display:"flex",flexDirection:"column",gap:"1.25rem"}}>
          {/* Dataset source status banner */}
          <div style={{display:"flex",alignItems:"center",gap:"0.6rem",padding:"0.65rem 1rem",borderRadius:10,
            background:datasetsSource==="user"?"rgba(252,204,10,0.08)":"rgba(74,222,128,0.08)",
            border:`1px solid ${datasetsSource==="user"?"rgba(252,204,10,0.25)":"rgba(74,222,128,0.25)"}`,
            fontSize:"0.82rem",color:"rgba(255,255,255,0.6)"}}>
            <span style={{fontSize:"1rem"}}>{datasetsSource==="user"?"✏️":"🌐"}</span>
            <span>{datasetsSource==="user"
              ? <><strong style={{color:"#FCCC0A"}}>Using your local edits.</strong> These override the server data.</>
              : <><strong style={{color:"#4ade80"}}>Live from server.</strong> Edit below and Save to customise locally.</>
            }</span>
          </div>

          {/* NEW: Manual refresh section */}
          <div style={cardStyle}>
            <div style={sectionHeadStyle}>Fleet Data Cache</div>
            <p style={{margin:"0 0 1rem",fontSize:"0.84rem",color:"rgba(255,255,255,0.45)",lineHeight:1.6}}>
              Rolling stock ranges are cached locally so the app works offline underground.
              Tap <strong style={{color:"#fff"}}>Refresh Data</strong> when you're connected to pull the latest ranges from the server.
              {datasetsSource === "user" && <><br/><span style={{color:"#FCCC0A"}}>Note: you have local edits saved — refresh will update the remote cache but your edits still take priority until you Reset.</span></>}
            </p>
            <div style={{display:"flex",gap:"0.5rem",flexWrap:"wrap"}}>
              <SmallBtn onClick={onForceRefresh} disabled={refreshing}
                style={{opacity:refreshing?0.6:1,pointerEvents:refreshing?"none":"auto"}}>
                {refreshing ? "⏳ Fetching…" : "↻ Refresh Data"}
              </SmallBtn>
              <SmallBtn onClick={reset} danger>↺ Reset to Defaults</SmallBtn>
            </div>
          </div>

          <div style={cardStyle}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"1rem",flexWrap:"wrap",gap:"0.5rem"}}>
              <span style={sectionHeadStyle}>Rolling Stock Ranges</span>
              <div style={{display:"flex",gap:"0.5rem"}}>
                <SmallBtn onClick={addStock}>+ Model</SmallBtn>
                <SmallBtn onClick={save} green>✓ Save</SmallBtn>
              </div>
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:"0.65rem",maxHeight:"60vh",overflowY:"auto"}}>
              {datasets.rollingStock.map((s, idx) => (
                <div key={idx} style={{background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:10,padding:"0.85rem 1rem"}}>
                  <div style={{display:"flex",flexWrap:"wrap",gap:"0.5rem",alignItems:"center",marginBottom:"0.65rem"}}>
                    <input value={s.model} onChange={e => updateStock(idx,"model",e.target.value)} style={{...inputStyle,width:140}}/>
                    <select value={s.division} onChange={e => updateStock(idx,"division",e.target.value)} style={{...inputStyle,width:80}}>
                      <option>A</option><option>B</option><option>SIR</option>
                    </select>
                    <div style={{marginLeft:"auto",display:"flex",gap:"0.4rem"}}>
                      <SmallBtn onClick={() => addRange(idx)}>+ Range</SmallBtn>
                      <SmallBtn onClick={() => removeStock(idx)} danger>Delete</SmallBtn>
                    </div>
                  </div>
                  <div style={{display:"flex",flexWrap:"wrap",gap:"0.45rem"}}>
                    {s.ranges.map((r, rIdx) => (
                      <div key={rIdx} style={{display:"flex",alignItems:"center",gap:"0.35rem",background:"rgba(0,0,0,0.3)",
                        padding:"0.3rem 0.6rem",borderRadius:7,border:"1px solid rgba(255,255,255,0.07)"}}>
                        <input value={r[0]} onChange={e => updateRange(idx,rIdx,0,e.target.value)} style={{...inputStyle,width:72,textAlign:"center",padding:"0.3rem 0.4rem"}}/>
                        <span style={{color:"rgba(255,255,255,0.3)"}}>–</span>
                        <input value={r[1]} onChange={e => updateRange(idx,rIdx,1,e.target.value)} style={{...inputStyle,width:72,textAlign:"center",padding:"0.3rem 0.4rem"}}/>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={cardStyle}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"1rem",flexWrap:"wrap",gap:"0.5rem"}}>
              <span style={sectionHeadStyle}>Subway Lines</span>
              <div style={{display:"flex",gap:"0.5rem"}}>
                <SmallBtn onClick={addLine}>+ Line</SmallBtn>
                <SmallBtn onClick={save} green>✓ Save</SmallBtn>
              </div>
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:"0.6rem",maxHeight:"60vh",overflowY:"auto"}}>
              {datasets.lines.map((l, idx) => (
                <div key={idx} style={{display:"flex",flexWrap:"wrap",alignItems:"center",gap:"0.5rem",
                  background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:10,padding:"0.7rem 0.85rem"}}>
                  <LineBullet label={l.label} color={l.color} textColor={l.textColor||"#fff"} size={38}/>
                  <input value={l.id} onChange={e=>updateLine(idx,"id",e.target.value)} style={{...inputStyle,width:52}} placeholder="ID"/>
                  <input value={l.label} onChange={e=>updateLine(idx,"label",e.target.value)} style={{...inputStyle,width:60}} placeholder="Label"/>
                  <select value={l.division} onChange={e=>updateLine(idx,"division",e.target.value)} style={{...inputStyle,width:76}}>
                    <option>A</option><option>B</option><option>SIR</option>
                  </select>
                  <input type="color" value={l.color} onChange={e=>updateLine(idx,"color",e.target.value)} style={{width:38,height:34,borderRadius:6,border:"none",cursor:"pointer",background:"none"}}/>
                  <input value={l.color} onChange={e=>updateLine(idx,"color",e.target.value)} style={{...inputStyle,width:86}}/>
                  <input value={l.terminals?.[0]||""} onChange={e=>updateLine(idx,"terminals",[e.target.value,l.terminals?.[1]||""])} style={{...inputStyle,flex:1,minWidth:120}} placeholder="Terminal A"/>
                  <input value={l.terminals?.[1]||""} onChange={e=>updateLine(idx,"terminals",[l.terminals?.[0]||"",e.target.value])} style={{...inputStyle,flex:1,minWidth:120}} placeholder="Terminal B"/>
                  <SmallBtn onClick={()=>removeLine(idx)} danger>✕</SmallBtn>
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
   MICRO UI (NYC)
───────────────────────────────────────────────────────────────── */
const inputStyle = {background:"rgba(255,255,255,0.07)",color:"#fff",border:"1px solid rgba(255,255,255,0.12)",borderRadius:8,fontFamily:"inherit",fontSize:"0.92rem",padding:"0.5rem 0.75rem",outline:"none",width:"100%"};
const labelStyle = {display:"block",fontSize:"0.72rem",fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase",color:"rgba(255,255,255,0.4)",marginBottom:"0.5rem"};
const cardStyle = {background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:16,padding:"1.25rem 1.5rem"};
const sectionHeadStyle = {fontFamily:"'Barlow Condensed',sans-serif",fontWeight:800,fontSize:"1.15rem",letterSpacing:"0.04em",display:"flex",alignItems:"center",gap:"0.5rem",marginBottom:"0.75rem"};
const badgeStyle = {background:"rgba(255,255,255,0.1)",borderRadius:999,padding:"0.1rem 0.55rem",fontSize:"0.8rem",fontWeight:700,fontFamily:"'Barlow Condensed',sans-serif"};
const smallBtnStyle = {padding:"0.4rem 0.8rem",borderRadius:7,border:"1px solid rgba(255,255,255,0.15)",background:"rgba(255,255,255,0.07)",color:"#fff",fontWeight:700,fontSize:"0.8rem",fontFamily:"'Barlow Condensed',sans-serif",cursor:"pointer",letterSpacing:"0.03em",display:"inline-flex",alignItems:"center",gap:"0.25rem",whiteSpace:"nowrap"};
function SmallBtn({ children, onClick, danger, green, disabled, style: extraStyle, ...rest }) {
  return (
    <button onClick={onClick} disabled={disabled} {...rest}
      style={{...smallBtnStyle,...(danger?{background:"rgba(238,53,46,0.2)",borderColor:"rgba(238,53,46,0.4)",color:"#ff8882"}:{}), ...(green?{background:"rgba(0,147,60,0.2)",borderColor:"rgba(0,147,60,0.4)",color:"#4ade80"}:{}), ...(disabled?{opacity:0.5,cursor:"not-allowed"}:{}), ...(extraStyle||{})}}>
      {children}
    </button>
  );
}

/* ─────────────────────────────────────────────────────────────────
   NYC APP SHELL
   FIX: rides/setRides lifted here — single source of truth
   FIX: dataset loading uses localStorage remote cache for offline use
───────────────────────────────────────────────────────────────── */
function NYCApp({ onSwitchSystem }) {
  const [page, setPage] = useState("live");
  const [datasets, setDatasets] = useState(null);
  const [datasetsSource, setDatasetsSource] = useState("remote");
  const [refreshing, setRefreshing] = useState(false);

  // Single useRides() call — passed as props to both LiveRider and StatsPage.
  // Uses localStorage (not cookies) to avoid the 4KB iOS Safari silent-drop bug.
  const [rides, setRides] = useRides();

  useEffect(() => {
    const userDs = getUserDatasets();
    if (userDs) {
      // User has saved edits — show them immediately
      setDatasets(userDs);
      setDatasetsSource("user");
      // Still refresh the remote cache in the background if stale, but don't overwrite display
      const cache = getRemoteCache();
      const stale = !cache || (Date.now() - cache.timestamp > REMOTE_CACHE_TTL_MS);
      if (stale && navigator.onLine) {
        fetchRemoteDatasets().then(ds => saveRemoteCache(ds)).catch(() => {});
      }
    } else {
      // No user edits — check remote cache first (works offline)
      const cache = getRemoteCache();
      if (cache) {
        setDatasets(cache.data);
        setDatasetsSource("remote");
        // Background refresh if stale and online
        const stale = Date.now() - cache.timestamp > REMOTE_CACHE_TTL_MS;
        if (stale && navigator.onLine) {
          fetchRemoteDatasets().then(ds => {
            saveRemoteCache(ds);
            setDatasets(ds); // silently update
          }).catch(() => {});
        }
      } else {
        // No cache at all — try to fetch, fall back to hardcoded
        fetchRemoteDatasets()
          .then(ds => { saveRemoteCache(ds); setDatasets(ds); setDatasetsSource("remote"); })
          .catch(() => { setDatasets(FALLBACK_DATASETS); setDatasetsSource("remote"); });
      }
    }
  }, []);

  function handleSetDatasets(ds) {
    setDatasets(ds);
    saveUserDatasets(ds);
    setDatasetsSource("user");
  }

  function handleResetToRemote() {
    clearUserDatasets();
    setDatasetsSource("remote");
    const cache = getRemoteCache();
    if (cache) {
      setDatasets(cache.data);
    } else {
      fetchRemoteDatasets()
        .then(ds => { saveRemoteCache(ds); setDatasets(ds); })
        .catch(() => setDatasets(FALLBACK_DATASETS));
    }
  }

  // NEW: manual force-refresh button handler
  async function handleForceRefresh() {
    if (!navigator.onLine) {
      alert("You're offline. Connect to the internet to refresh fleet data.");
      return;
    }
    setRefreshing(true);
    try {
      const ds = await fetchRemoteDatasets();
      saveRemoteCache(ds);
      // Only update display if user hasn't saved local edits
      if (datasetsSource !== "user") {
        setDatasets(ds);
      }
      alert("Fleet data updated and cached for offline use!");
    } catch (err) {
      alert("Refresh failed: " + err.message);
    } finally {
      setRefreshing(false);
    }
  }

  if (!datasets) {
    return (
      <div style={{minHeight:"100vh",background:"#111116",color:"#f0f0f4",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'Barlow',system-ui,sans-serif"}}>
        <div style={{textAlign:"center",opacity:0.5}}>
          <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:900,fontSize:"1.5rem",letterSpacing:"0.04em"}}>Loading fleet data…</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{minHeight:"100vh",background:"#111116",color:"#f0f0f4",fontFamily:"'Barlow',system-ui,sans-serif"}}>
      <header style={{position:"sticky",top:0,zIndex:50,background:"rgba(17,17,22,0.9)",backdropFilter:"blur(14px)",borderBottom:"1px solid rgba(255,255,255,0.07)",padding:"0 1rem"}}>
        <div style={{maxWidth:900,margin:"0 auto",display:"flex",alignItems:"center",justifyContent:"space-between",padding:"0.75rem 0",gap:"1rem",flexWrap:"wrap"}}>
          <div style={{display:"flex",alignItems:"center",gap:"0.65rem"}}>
            <div style={{width:38,height:38,borderRadius:9,background:"#FCCC0A",color:"#000",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'Barlow Condensed',sans-serif",fontWeight:900,fontSize:"0.75rem",letterSpacing:"0.02em"}}>NYC</div>
            <div>
              <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:900,fontSize:"1.35rem",lineHeight:1,letterSpacing:"0.03em"}}>HaveIRidden<span style={{color:"#FCCC0A"}}>?</span></div>
              <div style={{fontSize:"0.65rem",color:"rgba(255,255,255,0.35)",letterSpacing:"0.1em",textTransform:"uppercase"}}>NYC Subway Tracker</div>
            </div>
          </div>
          <nav style={{display:"flex",gap:"0.25rem",background:"rgba(255,255,255,0.06)",borderRadius:10,padding:"0.25rem",border:"1px solid rgba(255,255,255,0.07)"}}>
            {[{key:"live",label:"🚇 Live Rider"},{key:"stats",label:"📊 Stats"}].map(t => (
              <button key={t.key} onClick={() => setPage(t.key)}
                style={{padding:"0.45rem 1rem",borderRadius:7,border:"none",fontFamily:"'Barlow Condensed',sans-serif",fontWeight:700,fontSize:"0.95rem",letterSpacing:"0.03em",background:page===t.key?"#FCCC0A":"transparent",color:page===t.key?"#000":"rgba(255,255,255,0.45)",cursor:"pointer",transition:"all 0.15s"}}>
                {t.label}
              </button>
            ))}
          </nav>
          <div style={{display:"flex",alignItems:"center",gap:"1rem"}}>
            <div style={{fontSize:"0.82rem",color:"rgba(255,255,255,0.35)",display:"flex",alignItems:"center",gap:"0.3rem"}}>
              <span style={{color:"#FCCC0A",fontFamily:"'Barlow Condensed',sans-serif",fontWeight:900,fontSize:"1.15rem"}}>{rides.length}</span> rides
            </div>
            <button onClick={onSwitchSystem}
              style={{padding:"0.35rem 0.75rem",border:"1px solid rgba(255,255,255,0.12)",borderRadius:6,background:"transparent",color:"rgba(255,255,255,0.35)",fontFamily:"'Barlow Condensed',sans-serif",fontSize:"0.72rem",letterSpacing:"0.08em",textTransform:"uppercase",cursor:"pointer",transition:"all 0.15s"}}>
              Switch →
            </button>
          </div>
        </div>
      </header>
      <AnimatePresence mode="wait">
        <motion.div key={page} initial={{opacity:0,y:6}} animate={{opacity:1,y:0}} exit={{opacity:0}} transition={{duration:0.2}}>
          {page === "live"
            ? <LiveRider datasets={datasets} rides={rides} setRides={setRides}/>
            : <StatsPage datasets={datasets} setDatasets={handleSetDatasets} datasetsSource={datasetsSource}
                onResetToRemote={handleResetToRemote} onForceRefresh={handleForceRefresh} refreshing={refreshing}
                rides={rides} setRides={setRides}/>}
        </motion.div>
      </AnimatePresence>
      <footer style={{borderTop:"1px solid rgba(255,255,255,0.06)",padding:"1rem",textAlign:"center",fontSize:"0.72rem",color:"rgba(255,255,255,0.2)",letterSpacing:"0.06em"}}>
        HaveIRidden? · Personal NYC Subway Tracker · Fleet data is editable in Stats → Settings
      </footer>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────
   DC METRO
───────────────────────────────────────────────────────────────── */
const DC_LINES_DATA = [
  {id:"red",label:"Red",color:"#BF0D3E",textColor:"#fff",endpoints:["Shady Grove","Glenmont"],stations:["Shady Grove","Rockville","Twinbrook","White Flint","Grosvenor–Strathmore","Medical Center","Bethesda","Friendship Heights","Tenleytown–AU","Van Ness–UDC","Cleveland Park","Woodley Park–Zoo/Adams Morgan","Dupont Circle","Farragut North","Metro Center","Gallery Pl–Chinatown","Judiciary Square","Union Station","NoMa–Gallaudet U","Rhode Island Ave–Brentwood","Brookland–CUA","Fort Totten","Takoma","Silver Spring","Forest Glen","Wheaton","Glenmont"]},
  {id:"blue",label:"Blue",color:"#009CDE",textColor:"#fff",endpoints:["Franconia–Springfield","Largo Town Center"],stations:["Franconia–Springfield","Van Dorn Street","Eisenhower Avenue","King Street–Old Town","Braddock Road","Reagan National Airport","Crystal City","Pentagon City","Pentagon","Arlington Cemetery","Rosslyn","Foggy Bottom–GWU","Farragut West","McPherson Square","Metro Center","Federal Triangle","Smithsonian","L'Enfant Plaza","Federal Center SW","Capitol South","Eastern Market","Potomac Ave","Stadium–Armory","Benning Road","Capitol Heights","Addison Road–Seat Pleasant","Morgan Boulevard","Largo Town Center"]},
  {id:"orange",label:"Orange",color:"#ED8B00",textColor:"#fff",endpoints:["Vienna/Fairfax–GMU","New Carrollton"],stations:["Vienna/Fairfax–GMU","Dunn Loring–Merrifield","West Falls Church–VT/UVA","East Falls Church","Ballston–MU","Virginia Square–GMU","Clarendon","Court House","Rosslyn","Foggy Bottom–GWU","Farragut West","McPherson Square","Metro Center","Federal Triangle","Smithsonian","L'Enfant Plaza","Federal Center SW","Capitol South","Eastern Market","Potomac Ave","Stadium–Armory","Cheverly","Landover","New Carrollton"]},
  {id:"silver",label:"Silver",color:"#919D9D",textColor:"#fff",endpoints:["Ashburn","Largo Town Center"],stations:["Ashburn","Loudoun Gateway","Washington Dulles International Airport","Innovation Center","Herndon","Reston Town Center","Wiehle–Reston East","Spring Hill","Greensboro","Tysons Corner","McLean","East Falls Church","Ballston–MU","Virginia Square–GMU","Clarendon","Court House","Rosslyn","Foggy Bottom–GWU","Farragut West","McPherson Square","Metro Center","Federal Triangle","Smithsonian","L'Enfant Plaza","Federal Center SW","Capitol South","Eastern Market","Potomac Ave","Stadium–Armory","Benning Road","Capitol Heights","Addison Road–Seat Pleasant","Morgan Boulevard","Largo Town Center"]},
  {id:"green",label:"Green",color:"#00B140",textColor:"#fff",endpoints:["Branch Ave","Greenbelt"],stations:["Branch Ave","Suitland","Naylor Road","Southern Avenue","Oxon Hill–Fort Foote","Anacostia","Congress Heights","Navy Yard–Ballpark","Waterfront","L'Enfant Plaza","Archives–Navy Memorial–Penn Quarter","Gallery Pl–Chinatown","Mt Vernon Sq/7th St–Convention Center","Shaw–Howard U","U Street/African-Amer Civil War Memorial/Cardozo","Columbia Heights","Georgia Ave–Petworth","Fort Totten","West Hyattsville","Prince George's Plaza","College Park–U of Md","Greenbelt"]},
  {id:"yellow",label:"Yellow",color:"#FFD100",textColor:"#000",endpoints:["Huntington","Greenbelt"],stations:["Huntington","Eisenhower Avenue","King Street–Old Town","Braddock Road","Reagan National Airport","Crystal City","Pentagon City","Pentagon","L'Enfant Plaza","Archives–Navy Memorial–Penn Quarter","Gallery Pl–Chinatown","Mt Vernon Sq/7th St–Convention Center","Shaw–Howard U","U Street/African-Amer Civil War Memorial/Cardozo","Columbia Heights","Georgia Ave–Petworth","Fort Totten","West Hyattsville","Prince George's Plaza","College Park–U of Md","Greenbelt"]},
];

const DC_VISITED_KEY = "wmata_visited_v1";
function loadDCVisited() { try { const r = localStorage.getItem(DC_VISITED_KEY); return r ? new Set(JSON.parse(r)) : new Set(); } catch { return new Set(); } }
function saveDCVisited(set) { try { localStorage.setItem(DC_VISITED_KEY, JSON.stringify([...set])); } catch {} }
function useDCVisited() {
  const [visited, setV] = useState(loadDCVisited);
  const setVisited = React.useCallback((fn) => {
    setV(prev => { const next = typeof fn === "function" ? fn(prev) : fn; saveDCVisited(next); return next; });
  }, []);
  return [visited, setVisited];
}

const DC_CSS_GLOBAL = `
  @import url('https://fonts.googleapis.com/css2?family=EB+Garamond:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&family=IBM+Plex+Sans:wght@300;400;500;600&display=swap');
  .dc-root{--dc-bg:#0d0e0f;--dc-surface:#141516;--dc-card:#1a1b1c;--dc-border:rgba(255,255,255,0.07);--dc-border-bright:rgba(255,255,255,0.14);--dc-text:#e8e6e0;--dc-muted:rgba(232,230,224,0.45);--dc-serif:'EB Garamond',Georgia,serif;--dc-mono:'IBM Plex Mono',monospace;--dc-sans:'IBM Plex Sans',system-ui,sans-serif;background:var(--dc-bg);color:var(--dc-text);font-family:var(--dc-sans);min-height:100vh;}
  .dc-vault-bg{position:fixed;inset:0;pointer-events:none;z-index:0;background-image:repeating-linear-gradient(0deg,transparent,transparent 79px,rgba(255,255,255,0.022) 79px,rgba(255,255,255,0.022) 80px),repeating-linear-gradient(90deg,transparent,transparent 79px,rgba(255,255,255,0.022) 79px,rgba(255,255,255,0.022) 80px);}
  .dc-header{position:sticky;top:0;z-index:50;background:rgba(13,14,15,0.94);backdrop-filter:blur(16px);border-bottom:1px solid var(--dc-border);font-family:var(--dc-sans);}
  .dc-nav-btn{padding:0.45rem 1rem;border:none;border-radius:4px;font-family:var(--dc-sans);font-size:0.78rem;font-weight:500;letter-spacing:0.1em;text-transform:uppercase;cursor:pointer;transition:all 0.18s;background:transparent;color:rgba(232,230,224,0.4);}
  .dc-nav-btn.active{background:rgba(232,230,224,0.1);color:var(--dc-text);border:1px solid var(--dc-border-bright);}
  .dc-line-tab{padding:0.5rem 0.85rem;border:none;border-radius:0;font-family:var(--dc-mono);font-size:0.72rem;font-weight:500;letter-spacing:0.12em;text-transform:uppercase;cursor:pointer;transition:all 0.18s;background:transparent;color:rgba(232,230,224,0.35);border-bottom:2px solid transparent;white-space:nowrap;flex-shrink:0;}
  .dc-line-tab.active{color:var(--dc-text);border-bottom-color:currentColor;}
  .dc-station-row{display:flex;align-items:stretch;gap:0;padding:0;border-bottom:1px solid rgba(255,255,255,0.06);cursor:pointer;transition:background 0.12s;position:relative;}
  .dc-station-row:hover{background:rgba(255,255,255,0.025);}
  .dc-station-row.visited{background:rgba(255,255,255,0.04);}
  .dc-stat-num{font-family:var(--dc-mono);font-size:2.4rem;font-weight:500;letter-spacing:-0.02em;line-height:1;}
  .hide-scrollbar::-webkit-scrollbar{display:none;}.hide-scrollbar{-ms-overflow-style:none;scrollbar-width:none;}
`;

function DCStyles2() {
  useEffect(() => {
    const el = document.createElement("style"); el.id = "dc-metro-styles"; el.textContent = DC_CSS_GLOBAL;
    document.head.appendChild(el);
    return () => { const s = document.getElementById("dc-metro-styles"); if (s) s.remove(); };
  }, []);
  return null;
}

function ArcProgress2({ value, total, color, size=110 }) {
  const pct = total > 0 ? value / total : 0;
  const r = (size - 10) / 2; const cx = size / 2; const cy = size / 2;
  const circum = 2 * Math.PI * r; const dash = pct * circum; const gap = circum - dash;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{transform:"rotate(-90deg)"}}>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth={5}/>
      <motion.circle cx={cx} cy={cy} r={r} fill="none" stroke={color} strokeWidth={5} strokeLinecap="round"
        strokeDasharray={`${dash} ${gap}`} initial={{strokeDasharray:"0 9999"}}
        animate={{strokeDasharray:`${dash} ${gap}`}} transition={{duration:0.9,ease:"easeOut"}}/>
    </svg>
  );
}

function DCLinePill({ line, size="md", selected, onClick }) {
  const sz = size === "sm" ? { minW:28, h:17, fs:9, px:4 } : { minW:36, h:22, fs:10, px:8 };
  return (
    <button onClick={onClick} style={{minWidth:sz.minW,padding:`0 ${sz.px}px`,height:sz.h,borderRadius:3,background:line.color,
      color:line.textColor,fontFamily:"'IBM Plex Mono',monospace",fontWeight:500,fontSize:sz.fs,letterSpacing:"0.08em",
      border:selected?`2px solid ${line.color}`:"2px solid transparent",
      outline:selected?"2px solid rgba(255,255,255,0.6)":"none",outlineOffset:2,
      cursor:onClick?"pointer":"default",display:"inline-flex",alignItems:"center",justifyContent:"center",
      flexShrink:0,transition:"outline 0.12s",textTransform:"uppercase"}}>
      {line.label}
    </button>
  );
}

function DCStationRow({ station, lineColor, isVisited, onToggle, index, isLast }) {
  return (
    <motion.div layout className={`dc-station-row${isVisited ? " visited" : ""}`} onClick={onToggle}
      initial={{opacity:0,x:-8}} animate={{opacity:1,x:0}}
      transition={{delay:Math.min(index*0.018,0.4),duration:0.22}}>
      <div style={{width:32,flexShrink:0,display:"flex",flexDirection:"column",alignItems:"center",position:"relative"}}>
        {index > 0 && <div style={{position:"absolute",top:0,bottom:"50%",left:"50%",transform:"translateX(-50%)",width:3,background:lineColor,opacity:0.4}}/>}
        {!isLast && <div style={{position:"absolute",top:"50%",bottom:0,left:"50%",transform:"translateX(-50%)",width:3,background:lineColor,opacity:0.4}}/>}
        <div style={{position:"absolute",top:"50%",left:"50%",transform:"translate(-50%,-50%)",
          width:isVisited?12:10,height:isVisited?12:10,borderRadius:"50%",
          background:isVisited?lineColor:"transparent",border:`2px solid ${isVisited?lineColor:"rgba(255,255,255,0.25)"}`,
          transition:"all 0.2s ease",flexShrink:0,zIndex:1}}/>
      </div>
      <div style={{flex:1,padding:"0.85rem 0.75rem 0.85rem 0.25rem",display:"flex",alignItems:"center",justifyContent:"space-between",minHeight:52}}>
        <div style={{fontFamily:"'IBM Plex Sans',sans-serif",fontWeight:isVisited?500:300,fontSize:"0.9rem",
          color:isVisited?"#e8e6e0":"rgba(232,230,224,0.55)",letterSpacing:"0.01em",
          transition:"color 0.2s,font-weight 0.2s"}}>{station}</div>
        <div style={{marginLeft:"0.5rem",flexShrink:0}}>
          {isVisited
            ? <motion.div initial={{scale:0}} animate={{scale:1}} style={{width:20,height:20,borderRadius:"50%",background:lineColor,display:"flex",alignItems:"center",justifyContent:"center"}}>
                <svg width="10" height="8" viewBox="0 0 10 8" fill="none"><path d="M1 4L3.8 7L9 1" stroke="rgba(0,0,0,0.7)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </motion.div>
            : <div style={{width:20,height:20,borderRadius:"50%",border:"1px solid rgba(255,255,255,0.12)"}}/>}
        </div>
      </div>
    </motion.div>
  );
}

function DCLogPage2({ visited, onToggle }) {
  const [selectedLine, setSelectedLine] = useState(DC_LINES_DATA[0]);
  const [filter, setFilter] = useState("all");
  const lineStats = useMemo(() => DC_LINES_DATA.map(l => {
    const count = l.stations.filter(s => visited.has(`${l.id}::${s}`)).length;
    return {...l, visited:count, total:l.stations.length, pct:l.stations.length?count/l.stations.length:0};
  }), [visited]);
  const activeStats = lineStats.find(l => l.id === selectedLine.id);
  const displayedStations = useMemo(() => {
    if (!selectedLine) return [];
    return selectedLine.stations.filter(s => {
      const key = `${selectedLine.id}::${s}`;
      if (filter === "visited") return visited.has(key);
      if (filter === "unvisited") return !visited.has(key);
      return true;
    });
  }, [selectedLine, visited, filter]);

  function markAll() {
    const keys = selectedLine.stations.map(s => `${selectedLine.id}::${s}`);
    const allV = keys.every(k => visited.has(k));
    if (allV) { onToggle(prev => { const next = new Set(prev); keys.forEach(k => next.delete(k)); return next; }); }
    else { onToggle(prev => { const next = new Set(prev); keys.forEach(k => next.add(k)); return next; }); }
  }
  const allMarked = selectedLine.stations.every(s => visited.has(`${selectedLine.id}::${s}`));

  return (
    <div style={{position:"relative",zIndex:1,maxWidth:840,margin:"0 auto",padding:"1.5rem 1rem 3rem"}}>
      <div style={{marginBottom:"1.5rem",background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.07)",borderRadius:4,overflow:"hidden"}}>
        <div style={{padding:"0.75rem 1rem",borderBottom:"1px solid rgba(255,255,255,0.07)",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:"0.68rem",letterSpacing:"0.14em",textTransform:"uppercase",color:"rgba(232,230,224,0.35)"}}>Select Line</span>
        </div>
        <div style={{display:"flex",overflowX:"auto",borderBottom:"1px solid rgba(255,255,255,0.07)"}} className="hide-scrollbar">
          {DC_LINES_DATA.map(line => {
            const stat = lineStats.find(l => l.id === line.id);
            const isActive = selectedLine.id === line.id;
            return (
              <button key={line.id} className={`dc-line-tab${isActive?" active":""}`}
                style={{color:isActive?line.color:undefined,borderBottomColor:isActive?line.color:undefined}}
                onClick={() => { setSelectedLine(line); setFilter("all"); }}>
                {line.label}
                <span style={{marginLeft:"0.4rem",fontFamily:"'IBM Plex Mono',monospace",fontSize:"0.62rem",opacity:0.6}}>{stat?.visited}/{stat?.total}</span>
              </button>
            );
          })}
        </div>
        <div style={{padding:"0.65rem 1rem",display:"flex",alignItems:"center",gap:"0.75rem",flexWrap:"wrap",borderBottom:"1px solid rgba(255,255,255,0.07)"}}>
          <DCLinePill line={selectedLine}/>
          <div style={{flex:1}}>
            <div style={{fontFamily:"'IBM Plex Sans',sans-serif",fontSize:"0.78rem",color:"rgba(232,230,224,0.4)",letterSpacing:"0.02em"}}>
              {selectedLine.endpoints[0]} ↔ {selectedLine.endpoints[1]}</div>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:"0.5rem"}}>
            <div style={{width:100,height:3,background:"rgba(255,255,255,0.08)",borderRadius:2,overflow:"hidden"}}>
              <motion.div animate={{width:`${(activeStats?.pct||0)*100}%`}} transition={{duration:0.7,ease:"easeOut"}} style={{height:"100%",background:selectedLine.color,borderRadius:2}}/>
            </div>
            <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:"0.72rem",color:selectedLine.color,minWidth:36}}>{Math.round((activeStats?.pct||0)*100)}%</span>
          </div>
        </div>
        <div style={{padding:"0.5rem 0.75rem",display:"flex",alignItems:"center",gap:"0.5rem",flexWrap:"wrap"}}>
          {["all","visited","unvisited"].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              style={{padding:"0.28rem 0.65rem",border:`1px solid ${filter===f?"rgba(255,255,255,0.3)":"rgba(255,255,255,0.08)"}`,borderRadius:3,
                background:filter===f?"rgba(255,255,255,0.08)":"transparent",color:filter===f?"#e8e6e0":"rgba(232,230,224,0.35)",
                fontFamily:"'IBM Plex Mono',monospace",fontSize:"0.65rem",letterSpacing:"0.08em",textTransform:"uppercase",cursor:"pointer",transition:"all 0.15s"}}>
              {f}
            </button>
          ))}
          <button onClick={markAll}
            style={{marginLeft:"auto",padding:"0.28rem 0.65rem",border:"1px solid rgba(255,255,255,0.08)",borderRadius:3,
              background:"transparent",color:selectedLine.color,fontFamily:"'IBM Plex Mono',monospace",
              fontSize:"0.65rem",letterSpacing:"0.08em",textTransform:"uppercase",cursor:"pointer",transition:"all 0.15s",opacity:0.8}}>
            {allMarked ? "Unmark All" : "Mark All"}
          </button>
        </div>
      </div>
      <div style={{background:"rgba(255,255,255,0.02)",border:"1px solid rgba(255,255,255,0.07)",borderRadius:4,overflow:"hidden"}}>
        {displayedStations.length === 0
          ? <div style={{padding:"3rem 1.5rem",textAlign:"center",color:"rgba(232,230,224,0.25)",fontFamily:"'IBM Plex Mono',monospace",fontSize:"0.75rem",letterSpacing:"0.1em"}}>No stations match this filter</div>
          : <AnimatePresence mode="wait">
              <motion.div key={selectedLine.id+filter}>
                {displayedStations.map((station, i) => {
                  const key = `${selectedLine.id}::${station}`;
                  return (<DCStationRow key={key} station={station} lineColor={selectedLine.color} isVisited={visited.has(key)}
                    onToggle={() => onToggle(prev => { const next = new Set(prev); next.has(key) ? next.delete(key) : next.add(key); return next; })}
                    index={i} isLast={i===displayedStations.length-1}/>);
                })}
              </motion.div>
            </AnimatePresence>}
      </div>
      <div style={{marginTop:"0.75rem",fontFamily:"'IBM Plex Mono',monospace",fontSize:"0.62rem",color:"rgba(232,230,224,0.2)",letterSpacing:"0.08em",textAlign:"center"}}>
        Tap any station to mark as visited · Data stored locally on your device</div>
    </div>
  );
}

function DCProgressPage2({ visited }) {
  const allStations = useMemo(() => { const s = new Set(); DC_LINES_DATA.forEach(l => l.stations.forEach(st => s.add(st))); return s; }, []);
  const totalUnique = allStations.size;
  const visitedUnique = useMemo(() => {
    const seen = new Set();
    DC_LINES_DATA.forEach(l => l.stations.forEach(st => { if (visited.has(`${l.id}::${st}`)) seen.add(st); }));
    return seen.size;
  }, [visited]);
  const lineStats = useMemo(() => DC_LINES_DATA.map(l => ({...l, count:l.stations.filter(s=>visited.has(`${l.id}::${s}`)).length, total:l.stations.length})), [visited]);
  const totalVisits = useMemo(() => { let n = 0; DC_LINES_DATA.forEach(l => l.stations.forEach(s => { if (visited.has(`${l.id}::${s}`)) n++; })); return n; }, [visited]);
  const pctUnique = totalUnique > 0 ? visitedUnique / totalUnique : 0;
  return (
    <div style={{position:"relative",zIndex:1,maxWidth:840,margin:"0 auto",padding:"1.5rem 1rem 3rem"}}>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:"1px",background:"rgba(255,255,255,0.07)",border:"1px solid rgba(255,255,255,0.07)",borderRadius:4,overflow:"hidden",marginBottom:"1.5rem"}}>
        {[{label:"Unique Stations",value:`${visitedUnique}/${totalUnique}`,sub:"visited"},
          {label:"System Progress",value:`${Math.round(pctUnique*100)}%`,sub:"complete"},
          {label:"Total Visits",value:totalVisits,sub:"across all lines"}
        ].map(({label,value,sub}) => (
          <div key={label} style={{background:"rgba(255,255,255,0.02)",padding:"1.25rem 1rem",textAlign:"center"}}>
            <div className="dc-stat-num" style={{color:"#e8e6e0",marginBottom:"0.2rem"}}>{value}</div>
            <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:"0.62rem",letterSpacing:"0.1em",textTransform:"uppercase",color:"rgba(232,230,224,0.3)"}}>{label}</div>
            <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:"0.58rem",color:"rgba(232,230,224,0.2)",marginTop:"0.1rem"}}>{sub}</div>
          </div>
        ))}
      </div>
      <div style={{background:"rgba(255,255,255,0.02)",border:"1px solid rgba(255,255,255,0.07)",borderRadius:4,padding:"2rem 1.5rem",display:"flex",alignItems:"center",gap:"2rem",flexWrap:"wrap",marginBottom:"1.5rem"}}>
        <div style={{position:"relative",display:"inline-flex"}}>
          <ArcProgress2 value={visitedUnique} total={totalUnique} color="#e8e6e0" size={120}/>
          <div style={{position:"absolute",inset:0,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center"}}>
            <div className="dc-stat-num" style={{fontSize:"1.5rem"}}>{Math.round(pctUnique*100)}</div>
            <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:"0.6rem",color:"rgba(232,230,224,0.35)",letterSpacing:"0.08em"}}>pct</div>
          </div>
        </div>
        <div style={{flex:1,minWidth:200}}>
          <div style={{fontFamily:"'EB Garamond',serif",fontStyle:"italic",fontSize:"1.5rem",color:"#e8e6e0",marginBottom:"0.4rem"}}>System Coverage</div>
          <div style={{fontFamily:"'IBM Plex Sans',sans-serif",fontSize:"0.82rem",color:"rgba(232,230,224,0.45)",lineHeight:1.5}}>
            You've visited {visitedUnique} of {totalUnique} unique stations across the WMATA network.
            {visitedUnique === totalUnique ? " You've ridden the entire system!" : ` ${totalUnique-visitedUnique} remaining.`}
          </div>
        </div>
      </div>
      <div style={{background:"rgba(255,255,255,0.02)",border:"1px solid rgba(255,255,255,0.07)",borderRadius:4,overflow:"hidden"}}>
        <div style={{padding:"0.75rem 1rem",borderBottom:"1px solid rgba(255,255,255,0.07)",fontFamily:"'IBM Plex Mono',monospace",fontSize:"0.65rem",letterSpacing:"0.12em",textTransform:"uppercase",color:"rgba(232,230,224,0.3)"}}>Line Progress</div>
        {lineStats.map((l, i) => (
          <motion.div key={l.id} initial={{opacity:0,x:-6}} animate={{opacity:1,x:0}} transition={{delay:i*0.06,duration:0.3}}
            style={{display:"flex",alignItems:"center",gap:"1rem",padding:"1rem",borderBottom:i<lineStats.length-1?"1px solid rgba(255,255,255,0.05)":"none"}}>
            <DCLinePill line={l}/>
            <div style={{flex:1,minWidth:0}}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:"0.4rem",alignItems:"baseline"}}>
                <span style={{fontFamily:"'IBM Plex Sans',sans-serif",fontSize:"0.82rem",fontWeight:500,color:l.color}}>{l.label} Line</span>
                <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:"0.72rem",color:"rgba(232,230,224,0.4)"}}>{l.count} / {l.total}</span>
              </div>
              <div style={{width:"100%",height:4,background:"rgba(255,255,255,0.07)",borderRadius:2,overflow:"hidden"}}>
                <motion.div initial={{width:0}} animate={{width:`${l.total>0?(l.count/l.total)*100:0}%`}} transition={{duration:0.8,delay:i*0.05,ease:"easeOut"}} style={{height:"100%",background:l.color,borderRadius:2}}/>
              </div>
            </div>
            <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:"0.78rem",color:l.count===l.total&&l.total>0?l.color:"rgba(232,230,224,0.25)",minWidth:36,textAlign:"right"}}>
              {l.count===l.total&&l.total>0?"✓":`${Math.round((l.count/l.total)*100)}%`}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function DCManagePage2({ visited, setVisited }) {
  function exportData() {
    const data = {}; DC_LINES_DATA.forEach(l => { data[l.id] = l.stations.filter(s => visited.has(`${l.id}::${s}`)); });
    const blob = new Blob([JSON.stringify({version:1,visited:[...visited],lines:data},null,2)],{type:"application/json"});
    const url = URL.createObjectURL(blob); const a = document.createElement("a");
    a.href=url; a.download=`wmata-stations-${new Date().toISOString().slice(0,10)}.json`; a.click(); URL.revokeObjectURL(url);
  }
  function importData(e) {
    const file = e.target.files?.[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try { const p = JSON.parse(String(reader.result)); if (p.visited && Array.isArray(p.visited)) { setVisited(new Set(p.visited)); alert("Import successful!"); } else alert("Invalid file format."); }
      catch (err) { alert("Error: " + err.message); }
    }; reader.readAsText(file);
  }
  function clearAll() { if (confirm("Clear all visited stations? This cannot be undone.")) setVisited(new Set()); }
  const totalVisited = visited.size;
  const btnBase = {padding:"0.6rem 1.2rem",borderRadius:3,fontFamily:"'IBM Plex Mono',monospace",fontSize:"0.72rem",letterSpacing:"0.1em",textTransform:"uppercase",cursor:"pointer"};
  return (
    <div style={{position:"relative",zIndex:1,maxWidth:540,margin:"0 auto",padding:"1.5rem 1rem 3rem"}}>
      <div style={{fontFamily:"'EB Garamond',serif",fontStyle:"italic",fontSize:"1.6rem",color:"#e8e6e0",marginBottom:"1.5rem",letterSpacing:"0.01em"}}>Manage Your Data</div>
      {[
        {title:"Export",desc:`Download your ${totalVisited} station records as JSON.`,action:<button onClick={exportData} style={{...btnBase,background:"rgba(255,255,255,0.07)",border:"1px solid rgba(255,255,255,0.15)",color:"#e8e6e0"}}>↓ Export JSON</button>},
        {title:"Import",desc:"Restore from a previously exported JSON file.",action:<label style={{...btnBase,background:"rgba(255,255,255,0.07)",border:"1px solid rgba(255,255,255,0.15)",color:"#e8e6e0",display:"inline-block"}}>↑ Import JSON<input type="file" accept="application/json" style={{display:"none"}} onChange={importData}/></label>},
        {title:"Clear All",desc:"Remove all visited station records.",action:<button onClick={clearAll} style={{...btnBase,background:"rgba(191,13,62,0.1)",border:"1px solid rgba(191,13,62,0.3)",color:"#BF0D3E"}}>✕ Clear All</button>},
      ].map(({title,desc,action}) => (
        <div key={title} style={{marginBottom:"1px",background:"rgba(255,255,255,0.02)",border:"1px solid rgba(255,255,255,0.07)",borderRadius:4,padding:"1.25rem",display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:"1.5rem",flexWrap:"wrap"}}>
          <div style={{flex:1,minWidth:200}}>
            <div style={{fontFamily:"'IBM Plex Sans',sans-serif",fontWeight:500,fontSize:"0.88rem",color:"#e8e6e0",marginBottom:"0.35rem"}}>{title}</div>
            <div style={{fontFamily:"'IBM Plex Sans',sans-serif",fontSize:"0.78rem",color:"rgba(232,230,224,0.4)",lineHeight:1.5}}>{desc}</div>
          </div>
          {action}
        </div>
      ))}
      <div style={{marginTop:"2rem",padding:"1rem",background:"rgba(255,255,255,0.02)",border:"1px solid rgba(255,255,255,0.06)",borderRadius:4,fontFamily:"'IBM Plex Mono',monospace",fontSize:"0.65rem",letterSpacing:"0.06em",color:"rgba(232,230,224,0.2)",lineHeight:1.7}}>
        Data is stored in your browser's localStorage under key "wmata_visited_v1".<br/>Nothing is sent to any server.
      </div>
    </div>
  );
}

function DCApp({ onSwitchSystem }) {
  const [page, setPage] = useState("log");
  const [visited, setVisited] = useDCVisited();
  const totalVisited = visited.size;
  const totalAll = useMemo(() => DC_LINES_DATA.reduce((acc, l) => acc + l.stations.length, 0), []);
  const navItems = [{key:"log",label:"Log Stations"},{key:"progress",label:"Progress"},{key:"manage",label:"Manage"}];
  return (
    <div className="dc-root">
      <DCStyles2/>
      <div className="dc-vault-bg"/>
      <header className="dc-header">
        <div style={{maxWidth:900,margin:"0 auto",display:"flex",alignItems:"center",justifyContent:"space-between",padding:"0.85rem 1rem",gap:"1rem",flexWrap:"wrap"}}>
          <div style={{display:"flex",alignItems:"center",gap:"0.75rem"}}>
            <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
              <rect width="36" height="36" rx="4" fill="#1a1b1c" stroke="rgba(255,255,255,0.12)" strokeWidth="1"/>
              <path d="M6 28 Q6 10 18 10 Q30 10 30 28" fill="none" stroke="#e8e6e0" strokeWidth="1.2"/>
              <line x1="6" y1="28" x2="30" y2="28" stroke="#e8e6e0" strokeWidth="1.2"/>
              <line x1="18" y1="10" x2="18" y2="28" stroke="rgba(255,255,255,0.25)" strokeWidth="0.8"/>
              <line x1="12" y1="11.5" x2="10" y2="28" stroke="rgba(255,255,255,0.15)" strokeWidth="0.8"/>
              <line x1="24" y1="11.5" x2="26" y2="28" stroke="rgba(255,255,255,0.15)" strokeWidth="0.8"/>
            </svg>
            <div>
              <div style={{fontFamily:"'IBM Plex Sans',sans-serif",fontWeight:600,fontSize:"0.95rem",letterSpacing:"0.04em",color:"#e8e6e0",lineHeight:1.1}}>HaveIRidden?</div>
              <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:"0.6rem",color:"rgba(232,230,224,0.28)",letterSpacing:"0.1em",textTransform:"uppercase"}}>Washington Metro</div>
            </div>
          </div>
          <nav style={{display:"flex",gap:"0.25rem",background:"rgba(255,255,255,0.04)",borderRadius:4,padding:"0.2rem",border:"1px solid rgba(255,255,255,0.07)"}}>
            {navItems.map(t => (<button key={t.key} className={`dc-nav-btn${page===t.key?" active":""}`} onClick={() => setPage(t.key)}>{t.label}</button>))}
          </nav>
          <div style={{display:"flex",alignItems:"center",gap:"0.75rem"}}>
            <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:"0.72rem",color:"rgba(232,230,224,0.3)",letterSpacing:"0.06em"}}>
              <span style={{color:"#e8e6e0",fontWeight:500}}>{totalVisited}</span>{" "}/ {totalAll} visits
            </div>
            <button onClick={onSwitchSystem} style={{padding:"0.35rem 0.75rem",border:"1px solid rgba(255,255,255,0.12)",borderRadius:4,background:"transparent",color:"rgba(232,230,224,0.35)",fontFamily:"'IBM Plex Mono',monospace",fontSize:"0.65rem",letterSpacing:"0.08em",textTransform:"uppercase",cursor:"pointer",transition:"all 0.15s"}}>
              Switch →
            </button>
          </div>
        </div>
        <div style={{height:3,display:"flex"}}>
          {DC_LINES_DATA.map(l => <div key={l.id} style={{flex:1,background:l.color,opacity:0.7}}/>)}
        </div>
      </header>
      <AnimatePresence mode="wait">
        <motion.div key={page} initial={{opacity:0,y:6}} animate={{opacity:1,y:0}} exit={{opacity:0}} transition={{duration:0.2}}>
          {page === "log" && <DCLogPage2 visited={visited} onToggle={setVisited}/>}
          {page === "progress" && <DCProgressPage2 visited={visited}/>}
          {page === "manage" && <DCManagePage2 visited={visited} setVisited={setVisited}/>}
        </motion.div>
      </AnimatePresence>
      <footer style={{position:"relative",zIndex:1,borderTop:"1px solid rgba(255,255,255,0.06)",padding:"1rem",textAlign:"center",fontFamily:"'IBM Plex Mono',monospace",fontSize:"0.6rem",color:"rgba(232,230,224,0.15)",letterSpacing:"0.08em",textTransform:"uppercase"}}>
        WMATA Station Tracker · All data stored locally · Not affiliated with WMATA
      </footer>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────
   ROOT APP
───────────────────────────────────────────────────────────────── */
export default function App() {
  const [system, setSystem] = useState(() => readSystemCookie());

  function handleSelectSystem(id) { writeSystemCookie(id); setSystem(id); }
  function handleSwitchSystem() {
    document.cookie = `${SYSTEM_COOKIE}=; Max-Age=0; Path=/`;
    setSystem(null);
  }

  return (
    <AnimatePresence mode="wait">
      {!system
        ? <motion.div key="selector" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} transition={{duration:0.25}}><SystemSelector onSelect={handleSelectSystem}/></motion.div>
        : system === "nyc"
          ? <motion.div key="nyc" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} transition={{duration:0.25}}><NYCApp onSwitchSystem={handleSwitchSystem}/></motion.div>
          : <motion.div key="dc" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} transition={{duration:0.25}}><DCApp onSwitchSystem={handleSwitchSystem}/></motion.div>}
    </AnimatePresence>
  );
}
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
    return ["nyc", "dc", "path"].includes(val) ? val : null;
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
  .sys-card-select-btn {
    padding:0.85rem 1.25rem;
    background:rgba(255,255,255,0.025);
    border-top:1px solid rgba(255,255,255,0.07);
    display:flex;
    align-items:center;
    justify-content:space-between;
    transition:background 0.2s;
  }
  .sys-card-select-btn:hover {
    background:rgba(255,255,255,0.05);
  }
  .sys-card-select-text {
    font-weight:800;
    font-size:0.88rem;
    letter-spacing:0.06em;
    text-transform:uppercase;
    color:rgba(255,255,255,0.4);
    transition:color 0.2s;
  }
  .sys-card-btn:hover .sys-card-select-text {
    color:#FCCC0A;
  }
  .sys-card-btn {
    position:relative;width:100%;max-width:320px;background:transparent;border:none;cursor:pointer;padding:0;text-align:left;border-radius:0;overflow:hidden;
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

function PATHVisual() {
  // Schematic of PATH lines intersecting — two crossing lines
  return (
    <svg width="200" height="120" viewBox="0 0 200 120" fill="none" style={{overflow:"visible"}}>
      {/* Background grid suggesting industrial tile */}
      {[0,1,2,3].map(i=>(
        <line key={`h${i}`} x1={10} y1={20+i*25} x2={190} y2={20+i*25} stroke="rgba(255,255,255,0.04)" strokeWidth="1"/>
      ))}
      {/* NWK-WTC line — horizontal */}
      <line x1={15} y1={60} x2={185} y2={60} stroke="#D41F3A" strokeWidth="5" strokeLinecap="round"/>
      {/* JSQ-33 line — diagonal */}
      <line x1={20} y1={100} x2={160} y2={20} stroke="#005DAA" strokeWidth="5" strokeLinecap="round"/>
      {/* HOB-33 line */}
      <line x1={20} y1={85} x2={185} y2={35} stroke="#4BA3C7" strokeWidth="5" strokeLinecap="round" strokeDasharray="8 3"/>
      {/* Stations — circles at key intersections */}
      {[
        {x:45,y:60,c:"#D41F3A"},{x:100,y:60,c:"#D41F3A"},{x:155,y:60,c:"#D41F3A"},
        {x:70,y:72,c:"#005DAA"},{x:115,y:47,c:"#005DAA"},
      ].map((s,i)=>(
        <circle key={i} cx={s.x} cy={s.y} r={5} fill="#0a0a0f" stroke={s.c} strokeWidth="2.5"/>
      ))}
      {/* PATH wordmark suggestion */}
      <text x="100" y="115" textAnchor="middle" fill="rgba(255,255,255,0.12)" fontSize="9"
        fontFamily="'IBM Plex Mono',monospace" letterSpacing="4">PATH</text>
    </svg>
  );
}


function SystemCard({ id, label, description, features, onSelect, delay }) {
  const isNYC = id === "nyc";
  const isPATH = id === "path";
  const accentColor = isNYC ? "#FCCC0A" : isPATH ? "#D41F3A" : "rgba(255,255,255,0.15)";
  return (
    <motion.button
      initial={{opacity:0,y:20}} animate={{opacity:1,y:0}}
      transition={{delay,duration:0.4,ease:"easeOut"}} whileHover={{scale:1.02}} whileTap={{scale:0.98}}
      onClick={()=>onSelect(id)}
      className="sys-card-btn">
      <div style={{border:"1px solid rgba(255,255,255,0.1)",borderRadius:isNYC?0:4,overflow:"hidden",background:isNYC?"#111116":isPATH?"#0c0d10":"#0d0e0f",display:"flex",flexDirection:"column",height:"100%"}}>
        <div style={{height:140,position:"relative",overflow:"hidden",display:"flex",alignItems:"center",justifyContent:"center",
          background:isNYC?"linear-gradient(135deg,#111116 0%,#1a1a22 100%)":isPATH?"linear-gradient(135deg,#0c0d10 0%,#131620 100%)":"linear-gradient(135deg,#0d0e0f 0%,#14161a 100%)"}}>
          {isNYC ? <NYCVisual/> : isPATH ? <PATHVisual/> : <DCVisual/>}
        </div>
        <div style={{padding:"1.25rem",borderTop:`3px solid ${accentColor}`,flex:1}}>
          <div style={{fontFamily:isNYC?"'Barlow Condensed',sans-serif":isPATH?"'IBM Plex Mono',monospace":"'IBM Plex Sans',sans-serif",fontWeight:isNYC?900:isPATH?700:500,
            fontSize:isNYC?"1.5rem":isPATH?"1.1rem":"1rem",letterSpacing:isNYC?"0.04em":isPATH?"0.08em":"0.12em",textTransform:isPATH?"uppercase":"none",
            color:"#f0f0f4",marginBottom:"0.3rem"}}>{label}</div>
          <div style={{fontFamily:isPATH?"'IBM Plex Mono',monospace":isNYC?"'Barlow',sans-serif":"'IBM Plex Mono',monospace",fontSize:"0.68rem",
            color:"rgba(240,240,244,0.4)",letterSpacing:isPATH?"0.04em":isNYC?"0":"0.08em",lineHeight:1.5}}>{description}</div>
          <div style={{display:"flex",gap:"0.35rem",flexWrap:"wrap",marginTop:"0.85rem"}}>
            {features.map(f=>(
              <span key={f} style={{padding:"0.2rem 0.5rem",background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.08)",
                borderRadius:isPATH?2:isNYC?4:2,fontFamily:isPATH?"'IBM Plex Mono',monospace":isNYC?"'Barlow',sans-serif":"'IBM Plex Mono',monospace",
                fontSize:"0.65rem",color:"rgba(255,255,255,0.35)",letterSpacing:"0.04em"}}>{f}</span>
            ))}
          </div>
        </div>
        <div className="sys-card-select-btn">
          <span className="sys-card-select-text">Select →</span>
        </div>
      </div>
    </motion.button>
  );
}

function SystemSelector({ onSelect }) {
  const systems = [
    { id:"nyc", label:"NYC Subway", description:"Log every train car you've ridden on the MTA network.", features:["Rolling stock IDs","All 24 lines","Ride history"] },
    { id:"dc",  label:"WMATA",      description:"Track every station you've visited across 6 Metro lines.", features:["6 lines","98 stations","Per-line progress"] },
    { id:"path", label:"PATH train", description:"Log trips across the Port Authority Trans-Hudson system between NJ and NYC.", features:["4 lines","29 stations","Trip log"] },
  ];
  return (
    <>
      <style>{SELECTOR_CSS}</style>
      <div className="sys-root">
        <div className="sys-grid-bg"/>
        <div style={{position:"relative",zIndex:1,width:"100%",maxWidth:1060}}>
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
          <div style={{display:"flex",gap:"1.25rem",justifyContent:"center",flexWrap:"wrap",alignItems:"stretch"}}>
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
───────────────────────────────────────────────────────────────── */
const RIDES_KEY = "nyc_subway_rides_v2";
const USER_DATA_KEY = "nyc_subway_datasets_v1";
const REMOTE_CACHE_KEY = "nyc_subway_remote_cache_v1";
const REMOTE_CACHE_TTL_MS = 60 * 60 * 1000;

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
    console.warn("[HaveIRidden] Could not save rides:", e);
  }
}

function migrateFromCookie() {
  const COOKIE_NAME = "nyc_subway_rides";
  try {
    const match = document.cookie.split(";").map(c=>c.trim()).find(c=>c.startsWith(`${COOKIE_NAME}=`));
    if (!match) return;
    const arr = JSON.parse(decodeURIComponent(match.split("=")[1] || ""));
    if (Array.isArray(arr) && arr.length > 0) {
      const existing = readRidesFromStorage();
      if (existing.length === 0) {
        writeRidesToStorage(arr);
        console.log(`[HaveIRidden] Migrated ${arr.length} rides from cookie to localStorage`);
      }
    }
    document.cookie = `${COOKIE_NAME}=; Max-Age=0; Path=/`;
  } catch {}
}

function useRides() {
  const [rides, setRides] = useState(() => {
    migrateFromCookie();
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

          <div style={cardStyle}>
            <div style={sectionHeadStyle}>Fleet Data Cache</div>
            <p style={{margin:"0 0 1rem",fontSize:"0.84rem",color:"rgba(255,255,255,0.45)",lineHeight:1.6}}>
              Rolling stock ranges are cached locally so the app works offline underground.
              Tap <strong style={{color:"#fff"}}>Refresh Data</strong> when you're connected to pull the latest ranges from the server.
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
───────────────────────────────────────────────────────────────── */
function NYCApp({ onSwitchSystem }) {
  const [page, setPage] = useState("live");
  const [datasets, setDatasets] = useState(null);
  const [datasetsSource, setDatasetsSource] = useState("remote");
  const [refreshing, setRefreshing] = useState(false);
  const [rides, setRides] = useRides();

  useEffect(() => {
    const userDs = getUserDatasets();
    if (userDs) {
      setDatasets(userDs);
      setDatasetsSource("user");
      const cache = getRemoteCache();
      const stale = !cache || (Date.now() - cache.timestamp > REMOTE_CACHE_TTL_MS);
      if (stale && navigator.onLine) {
        fetchRemoteDatasets().then(ds => saveRemoteCache(ds)).catch(() => {});
      }
    } else {
      const cache = getRemoteCache();
      if (cache) {
        setDatasets(cache.data);
        setDatasetsSource("remote");
        const stale = Date.now() - cache.timestamp > REMOTE_CACHE_TTL_MS;
        if (stale && navigator.onLine) {
          fetchRemoteDatasets().then(ds => {
            saveRemoteCache(ds);
            setDatasets(ds);
          }).catch(() => {});
        }
      } else {
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

  async function handleForceRefresh() {
    if (!navigator.onLine) {
      alert("You're offline. Connect to the internet to refresh fleet data.");
      return;
    }
    setRefreshing(true);
    try {
      const ds = await fetchRemoteDatasets();
      saveRemoteCache(ds);
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
   DC METRO DATA
───────────────────────────────────────────────────────────────── */
const DC_LINES_DATA = [
  {id:"red",label:"Red",color:"#BF0D3E",textColor:"#fff",endpoints:["Shady Grove","Glenmont"],stations:["Shady Grove","Rockville","Twinbrook","White Flint","Grosvenor–Strathmore","Medical Center","Bethesda","Friendship Heights","Tenleytown–AU","Van Ness–UDC","Cleveland Park","Woodley Park–Zoo/Adams Morgan","Dupont Circle","Farragut North","Metro Center","Gallery Pl–Chinatown","Judiciary Square","Union Station","NoMa–Gallaudet U","Rhode Island Ave–Brentwood","Brookland–CUA","Fort Totten","Takoma","Silver Spring","Forest Glen","Wheaton","Glenmont"]},
  {id:"blue",label:"Blue",color:"#009CDE",textColor:"#fff",endpoints:["Franconia–Springfield","Largo Town Center"],stations:["Franconia–Springfield","Van Dorn Street","Eisenhower Avenue","King Street–Old Town","Braddock Road","Reagan National Airport","Crystal City","Pentagon City","Pentagon","Arlington Cemetery","Rosslyn","Foggy Bottom–GWU","Farragut West","McPherson Square","Metro Center","Federal Triangle","Smithsonian","L'Enfant Plaza","Federal Center SW","Capitol South","Eastern Market","Potomac Ave","Stadium–Armory","Benning Road","Capitol Heights","Addison Road–Seat Pleasant","Morgan Boulevard","Largo Town Center"]},
  {id:"orange",label:"Orange",color:"#ED8B00",textColor:"#fff",endpoints:["Vienna/Fairfax–GMU","New Carrollton"],stations:["Vienna/Fairfax–GMU","Dunn Loring–Merrifield","West Falls Church–VT/UVA","East Falls Church","Ballston–MU","Virginia Square–GMU","Clarendon","Court House","Rosslyn","Foggy Bottom–GWU","Farragut West","McPherson Square","Metro Center","Federal Triangle","Smithsonian","L'Enfant Plaza","Federal Center SW","Capitol South","Eastern Market","Potomac Ave","Stadium–Armory","Cheverly","Landover","New Carrollton"]},
  {id:"silver",label:"Silver",color:"#919D9D",textColor:"#fff",endpoints:["Ashburn","Largo Town Center"],stations:["Ashburn","Loudoun Gateway","Washington Dulles International Airport","Innovation Center","Herndon","Reston Town Center","Wiehle–Reston East","Spring Hill","Greensboro","Tysons Corner","McLean","East Falls Church","Ballston–MU","Virginia Square–GMU","Clarendon","Court House","Rosslyn","Foggy Bottom–GWU","Farragut West","McPherson Square","Metro Center","Federal Triangle","Smithsonian","L'Enfant Plaza","Federal Center SW","Capitol South","Eastern Market","Potomac Ave","Stadium–Armory","Benning Road","Capitol Heights","Addison Road–Seat Pleasant","Morgan Boulevard","Largo Town Center"]},
  {id:"green",label:"Green",color:"#00B140",textColor:"#fff",endpoints:["Branch Ave","Greenbelt"],stations:["Branch Ave","Suitland","Naylor Road","Southern Avenue","Oxon Hill–Fort Foote","Anacostia","Congress Heights","Navy Yard–Ballpark","Waterfront","L'Enfant Plaza","Archives–Navy Memorial–Penn Quarter","Gallery Pl–Chinatown","Mt Vernon Sq/7th St–Convention Center","Shaw–Howard U","U Street/African-Amer Civil War Memorial/Cardozo","Columbia Heights","Georgia Ave–Petworth","Fort Totten","West Hyattsville","Prince George's Plaza","College Park–U of Md","Greenbelt"]},
  {id:"yellow",label:"Yellow",color:"#FFD100",textColor:"#000",endpoints:["Huntington","Greenbelt"],stations:["Huntington","Eisenhower Avenue","King Street–Old Town","Braddock Road","Reagan National Airport","Crystal City","Pentagon City","Pentagon","L'Enfant Plaza","Archives–Navy Memorial–Penn Quarter","Gallery Pl–Chinatown","Mt Vernon Sq/7th St–Convention Center","Shaw–Howard U","U Street/African-Amer Civil War Memorial/Cardozo","Columbia Heights","Georgia Ave–Petworth","Fort Totten","West Hyattsville","Prince George's Plaza","College Park–U of Md","Greenbelt"]},
];

const DC_ROLLING_STOCK = [
  { model: "1000-Series", builder: "Rohr", years: "1976–1978", notes: "Retired 2017" },
  { model: "2000-Series", builder: "Breda", years: "1982–1983", notes: "Retired 2018" },
  { model: "3000-Series", builder: "Breda", years: "1984–1988", notes: "In service (rehabilitated)" },
  { model: "4000-Series", builder: "Breda", years: "1991–1993", notes: "Retired 2017" },
  { model: "5000-Series", builder: "CAF", years: "2001–2004", notes: "Retired 2018 (reliability issues)" },
  { model: "6000-Series", builder: "Alstom", years: "2005–2007", notes: "In service" },
  { model: "7000-Series", builder: "Kawasaki", years: "2015–2020", notes: "Current primary fleet" },
];

const DC_VISITED_KEY = "wmata_visited_v1";
const DC_RIDES_KEY = "wmata_rides_v1";

function loadDCVisited() { try { const r = localStorage.getItem(DC_VISITED_KEY); return r ? new Set(JSON.parse(r)) : new Set(); } catch { return new Set(); } }
function saveDCVisited(set) { try { localStorage.setItem(DC_VISITED_KEY, JSON.stringify([...set])); } catch {} }
function useDCVisited() {
  const [visited, setV] = useState(loadDCVisited);
  const setVisited = React.useCallback((fn) => {
    setV(prev => { const next = typeof fn === "function" ? fn(prev) : fn; saveDCVisited(next); return next; });
  }, []);
  return [visited, setVisited];
}

function loadDCRides() { try { const r = localStorage.getItem(DC_RIDES_KEY); return r ? JSON.parse(r) : []; } catch { return []; } }
function saveDCRides(rides) { try { localStorage.setItem(DC_RIDES_KEY, JSON.stringify(rides)); } catch {} }
function useDCRides() {
  const [rides, setR] = useState(loadDCRides);
  const setRides = React.useCallback((fn) => {
    setR(prev => { const next = typeof fn === "function" ? fn(prev) : fn; saveDCRides(next); return next; });
  }, []);
  return [rides, setRides];
}

function DCLinePill({ line, size="md", selected, onClick }) {
  const sz = size === "sm" ? { minW:28, h:17, fs:9, px:4 } : size === "lg" ? { minW:54, h:32, fs:13, px:10 } : { minW:36, h:22, fs:10, px:8 };
  return (
    <button onClick={onClick} style={{
      minWidth:sz.minW,padding:`0 ${sz.px}px`,height:sz.h,
      borderRadius:4,background:line.color,color:line.textColor,
      fontFamily:"'Barlow Condensed',sans-serif",fontWeight:900,fontSize:sz.fs,letterSpacing:"0.06em",
      border:selected?"3px solid rgba(255,255,255,0.9)":"3px solid transparent",
      boxShadow:selected?`0 0 0 2px ${line.color}88`:"none",
      cursor:onClick?"pointer":"default",display:"inline-flex",alignItems:"center",justifyContent:"center",
      flexShrink:0,transition:"all 0.12s",textTransform:"uppercase"}}>
      {line.label}
    </button>
  );
}

function DCLiveRider({ dcRides, setDCRides, visited, setVisited }) {
  const [step, setStep] = useState(1);
  const [selectedLine, setSelectedLine] = useState(null);
  const [boardStation, setBoardStation] = useState(null);
  const [exitStation, setExitStation] = useState(null);
  const [exitLine, setExitLine] = useState(null);
  const [lastRide, setLastRide] = useState(null);

  function resetForm() {
    setStep(1); setSelectedLine(null); setBoardStation(null); setExitStation(null); setExitLine(null);
  }

  function handleSelectLine(line) {
    setSelectedLine(line); setBoardStation(null); setExitStation(null); setExitLine(null); setStep(2);
  }
  function handleSelectBoard(station) { setBoardStation(station); setExitStation(null); setStep(3); }
  function handleSelectExit(station, line) { setExitStation(station); setExitLine(line); }

  const exitLineGroups = useMemo(() => {
    if (!selectedLine || !boardStation) return [];
    const boardLineGroup = { line: selectedLine, stations: selectedLine.stations.filter(s => s !== boardStation) };
    const otherGroups = DC_LINES_DATA.filter(l => l.id !== selectedLine.id).map(l => ({ line: l, stations: l.stations }));
    return [boardLineGroup, ...otherGroups];
  }, [selectedLine, boardStation]);

  function handleLog() {
    if (!selectedLine || !boardStation || !exitStation || !exitLine) return;
    const isTransfer = exitLine.id !== selectedLine.id;
    const ride = {
      id: crypto.randomUUID(), lineId: selectedLine.id, lineLabel: selectedLine.label,
      lineColor: selectedLine.color, lineTextColor: selectedLine.textColor,
      boardStation, exitStation, exitLineId: exitLine.id, exitLineLabel: exitLine.label,
      exitLineColor: exitLine.color, transferLineId: isTransfer ? exitLine.id : null,
      transferLineLabel: isTransfer ? exitLine.label : null, timestamp: new Date().toISOString(),
    };
    setDCRides(prev => [...prev, ride]);
    setVisited(prev => {
      const next = new Set(prev);
      next.add(`${selectedLine.id}::${boardStation}`);
      next.add(`${exitLine.id}::${exitStation}`);
      return next;
    });
    setLastRide(ride);
    resetForm();
  }

  const canLog = selectedLine && boardStation && exitStation && exitLine;
  const stepLabels = ["Select Line", "Board Station", "Exit Station"];

  return (
    <div style={{maxWidth:640,margin:"0 auto",padding:"1.5rem 1rem 3rem"}}>
      <div style={{display:"flex",alignItems:"center",gap:0,marginBottom:"2rem"}}>
        {[1,2,3].map((s, i) => (
          <React.Fragment key={s}>
            <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:"0.3rem",flex:1}}>
              <div style={{width:32,height:32,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",
                fontFamily:"'Barlow Condensed',sans-serif",fontWeight:900,fontSize:"1rem",
                background:step>s?"#4ade80":step===s?(selectedLine?.color||"#FCCC0A"):"rgba(255,255,255,0.1)",
                color:step>s?"#000":step===s?(selectedLine?.textColor||"#000"):"rgba(255,255,255,0.35)",
                border:step===s?`2px solid ${selectedLine?.color||"#FCCC0A"}`:"2px solid transparent",
                transition:"all 0.2s"}}>
                {step > s ? "✓" : s}
              </div>
              <div style={{fontSize:"0.62rem",letterSpacing:"0.08em",textTransform:"uppercase",
                color:step>=s?"rgba(255,255,255,0.6)":"rgba(255,255,255,0.25)",whiteSpace:"nowrap"}}>
                {stepLabels[i]}
              </div>
            </div>
            {i < 2 && (
              <div style={{flex:2,height:2,background:step>s+1?"#4ade80":step===s+1?(selectedLine?.color||"rgba(255,255,255,0.15)"):"rgba(255,255,255,0.1)",
                marginBottom:"1.5rem",transition:"background 0.3s"}}/>
            )}
          </React.Fragment>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.div key="step1" initial={{opacity:0,x:20}} animate={{opacity:1,x:0}} exit={{opacity:0,x:-20}} transition={{duration:0.2}}>
            <label style={labelStyle}>Select your line</label>
            <div style={{display:"flex",flexWrap:"wrap",gap:"0.75rem",marginTop:"0.5rem",justifyContent:"center"}}>
              {DC_LINES_DATA.map(line => (
                <motion.button key={line.id} whileHover={{scale:1.05}} whileTap={{scale:0.97}}
                  onClick={() => handleSelectLine(line)}
                  style={{padding:"0.7rem 1.4rem",borderRadius:6,background:line.color,color:line.textColor,
                    fontFamily:"'Barlow Condensed',sans-serif",fontWeight:900,fontSize:"1.1rem",letterSpacing:"0.08em",
                    border:"none",cursor:"pointer",boxShadow:`0 3px 12px ${line.color}44`,
                    display:"flex",flexDirection:"column",alignItems:"center",gap:"0.2rem",minWidth:90}}>
                  <span style={{fontSize:"1.3rem"}}>{line.label}</span>
                  <span style={{fontSize:"0.62rem",fontWeight:700,letterSpacing:"0.06em",opacity:0.75,textTransform:"uppercase",lineHeight:1.1,textAlign:"center"}}>
                    {line.endpoints[0].split("–")[0]}↔{line.endpoints[1].split("–")[0]}
                  </span>
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}

        {step === 2 && selectedLine && (
          <motion.div key="step2" initial={{opacity:0,x:20}} animate={{opacity:1,x:0}} exit={{opacity:0,x:-20}} transition={{duration:0.2}}>
            <div style={{display:"flex",alignItems:"center",gap:"0.75rem",marginBottom:"1.25rem"}}>
              <DCLinePill line={selectedLine} size="lg"/>
              <div>
                <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:900,fontSize:"1.2rem",color:"#f0f0f4"}}>{selectedLine.label} Line</div>
                <div style={{fontSize:"0.75rem",color:"rgba(255,255,255,0.4)"}}>{selectedLine.endpoints[0]} ↔ {selectedLine.endpoints[1]}</div>
              </div>
              <button onClick={() => setStep(1)} style={{marginLeft:"auto",padding:"0.3rem 0.7rem",border:"1px solid rgba(255,255,255,0.15)",borderRadius:6,background:"transparent",color:"rgba(255,255,255,0.4)",fontFamily:"'Barlow Condensed',sans-serif",fontSize:"0.75rem",letterSpacing:"0.06em",cursor:"pointer"}}>← Change</button>
            </div>
            <label style={labelStyle}>Where did you board?</label>
            <div style={{maxHeight:380,overflowY:"auto",border:"1px solid rgba(255,255,255,0.08)",borderRadius:12,marginTop:"0.5rem"}}>
              {selectedLine.stations.map((station, i) => (
                <button key={station} onClick={() => handleSelectBoard(station)}
                  style={{width:"100%",padding:"0.75rem 1rem",background:"transparent",border:"none",
                    borderBottom:i<selectedLine.stations.length-1?"1px solid rgba(255,255,255,0.05)":"none",
                    cursor:"pointer",textAlign:"left",display:"flex",alignItems:"center",gap:"0.75rem",
                    transition:"background 0.1s",color:"#f0f0f4"}}
                  onMouseEnter={e=>{e.currentTarget.style.background="rgba(255,255,255,0.05)"}}
                  onMouseLeave={e=>{e.currentTarget.style.background="transparent"}}>
                  <div style={{width:10,height:10,borderRadius:"50%",background:selectedLine.color,flexShrink:0,opacity:0.7}}/>
                  <span style={{fontFamily:"'Barlow',sans-serif",fontSize:"0.9rem"}}>{station}</span>
                  {visited.has(`${selectedLine.id}::${station}`) && (
                    <span style={{marginLeft:"auto",fontSize:"0.7rem",color:selectedLine.color,fontFamily:"'Barlow Condensed',sans-serif",fontWeight:700,letterSpacing:"0.06em"}}>visited</span>
                  )}
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {step === 3 && selectedLine && boardStation && (
          <motion.div key="step3" initial={{opacity:0,x:20}} animate={{opacity:1,x:0}} exit={{opacity:0,x:-20}} transition={{duration:0.2}}>
            <div style={{display:"flex",alignItems:"center",gap:"0.75rem",marginBottom:"1rem",flexWrap:"wrap"}}>
              <DCLinePill line={selectedLine} size="lg"/>
              <div style={{flex:1}}>
                <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:900,fontSize:"1.1rem",color:"#f0f0f4"}}>
                  Boarded at <span style={{color:selectedLine.color}}>{boardStation}</span>
                </div>
              </div>
              <button onClick={() => setStep(2)} style={{padding:"0.3rem 0.7rem",border:"1px solid rgba(255,255,255,0.15)",borderRadius:6,background:"transparent",color:"rgba(255,255,255,0.4)",fontFamily:"'Barlow Condensed',sans-serif",fontSize:"0.75rem",letterSpacing:"0.06em",cursor:"pointer"}}>← Change</button>
            </div>
            <label style={labelStyle}>Where did you exit?</label>
            <div style={{maxHeight:340,overflowY:"auto",border:"1px solid rgba(255,255,255,0.08)",borderRadius:12,marginTop:"0.5rem",marginBottom:"1rem"}}>
              {exitLineGroups.map((group, gi) => (
                <div key={group.line.id}>
                  <div style={{display:"flex",alignItems:"center",gap:"0.6rem",padding:"0.5rem 1rem",
                    background:gi===0?"rgba(255,255,255,0.04)":"rgba(255,255,255,0.02)",
                    borderBottom:"1px solid rgba(255,255,255,0.06)",
                    borderTop:gi>0?"1px solid rgba(255,255,255,0.08)":"none",position:"sticky",top:0,zIndex:2}}>
                    <div style={{padding:"0.15rem 0.55rem",borderRadius:3,background:group.line.color,color:group.line.textColor,
                      fontFamily:"'Barlow Condensed',sans-serif",fontWeight:900,fontSize:"0.78rem",letterSpacing:"0.06em"}}>
                      {group.line.label}</div>
                    <span style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:700,fontSize:"0.78rem",color:"rgba(255,255,255,0.4)",letterSpacing:"0.04em"}}>
                      {group.line.label} Line
                      {gi===0 && <span style={{marginLeft:"0.4rem",fontWeight:400,fontSize:"0.7rem",color:"rgba(255,255,255,0.25)"}}>(your line)</span>}
                      {gi>0 && <span style={{marginLeft:"0.4rem",fontWeight:400,fontSize:"0.7rem",color:"rgba(255,255,255,0.25)"}}>transfer</span>}
                    </span>
                  </div>
                  {group.stations.map((station, i) => {
                    const isSelected = exitStation === station && exitLine?.id === group.line.id;
                    return (
                      <button key={`${group.line.id}::${station}`} onClick={() => handleSelectExit(station, group.line)}
                        style={{width:"100%",padding:"0.7rem 1rem 0.7rem 1.25rem",
                          background:isSelected?`${group.line.color}22`:"transparent",border:"none",
                          borderBottom:i<group.stations.length-1?"1px solid rgba(255,255,255,0.04)":"none",
                          cursor:"pointer",textAlign:"left",display:"flex",alignItems:"center",gap:"0.75rem",
                          transition:"background 0.1s",color:"#f0f0f4"}}
                        onMouseEnter={e=>{if(!isSelected)e.currentTarget.style.background="rgba(255,255,255,0.05)"}}
                        onMouseLeave={e=>{if(!isSelected)e.currentTarget.style.background="transparent"}}>
                        <div style={{width:8,height:8,borderRadius:"50%",
                          background:isSelected?group.line.color:"rgba(255,255,255,0.15)",flexShrink:0,
                          border:isSelected?`2px solid ${group.line.color}`:"2px solid rgba(255,255,255,0.15)",transition:"all 0.15s"}}/>
                        <span style={{fontFamily:"'Barlow',sans-serif",fontSize:"0.88rem",fontWeight:isSelected?600:400,
                          color:isSelected?group.line.color:"#f0f0f4",flex:1}}>{station}</span>
                        {isSelected && <span style={{color:group.line.color,fontSize:"0.9rem",flexShrink:0}}>✓</span>}
                        {!isSelected && visited.has(`${group.line.id}::${station}`) && (
                          <span style={{fontSize:"0.68rem",color:group.line.color,fontFamily:"'Barlow Condensed',sans-serif",fontWeight:700,letterSpacing:"0.06em",flexShrink:0,opacity:0.7}}>visited</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
            <motion.button onClick={handleLog} disabled={!canLog} whileTap={canLog?{scale:0.97}:{}}
              style={{width:"100%",padding:"1rem",borderRadius:12,border:"none",
                background:canLog?(selectedLine?.color||"#FCCC0A"):"rgba(255,255,255,0.08)",
                color:canLog?(selectedLine?.textColor||"#000"):"rgba(255,255,255,0.3)",
                fontFamily:"'Barlow Condensed',sans-serif",fontWeight:900,fontSize:"1.3rem",letterSpacing:"0.08em",
                cursor:canLog?"pointer":"not-allowed",transition:"background 0.2s,color 0.2s"}}>
              LOG TRIP →
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {lastRide && (
          <motion.div key={lastRide.id} initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} exit={{opacity:0}}
            style={{marginTop:"1.5rem",display:"flex",alignItems:"flex-start",gap:"1rem",
              background:"rgba(0,177,64,0.12)",border:"1px solid rgba(0,177,64,0.35)",
              borderRadius:12,padding:"1rem 1.25rem"}}>
            <div style={{display:"flex",alignItems:"center",gap:"0.35rem",flexShrink:0}}>
              <div style={{width:36,height:36,borderRadius:5,background:lastRide.lineColor,color:lastRide.lineTextColor,
                display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'Barlow Condensed',sans-serif",fontWeight:900,fontSize:"1rem"}}>
                {lastRide.lineLabel}
              </div>
              {lastRide.transferLineId && (
                <>
                  <span style={{color:"rgba(255,255,255,0.3)",fontSize:"0.9rem"}}>→</span>
                  <div style={{width:36,height:36,borderRadius:5,background:lastRide.exitLineColor,color:DC_LINES_DATA.find(l=>l.id===lastRide.exitLineId)?.textColor||"#fff",
                    display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'Barlow Condensed',sans-serif",fontWeight:900,fontSize:"1rem"}}>
                    {lastRide.exitLineLabel}
                  </div>
                </>
              )}
            </div>
            <div>
              <div style={{fontWeight:700,fontSize:"1rem",color:"#4ade80"}}>✓ Trip logged!</div>
              <div style={{color:"rgba(255,255,255,0.55)",fontSize:"0.85rem",marginTop:"0.2rem"}}>
                {lastRide.boardStation} → {lastRide.exitStation}
                {lastRide.transferLineLabel && <span style={{color:"rgba(255,255,255,0.35)"}}> via {lastRide.transferLineLabel} Line</span>}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function DCStatsPage({ visited, dcRides, setDCRides, setVisited }) {
  const [tab, setTab] = useState("progress");

  function deleteRide(id) { setDCRides(prev => prev.filter(r => r.id !== id)); }
  function clearRides() { if (confirm("Delete all DC trips?")) setDCRides([]); }
  function exportData() {
    const blob = new Blob([JSON.stringify({rides:dcRides,visited:[...visited]},null,2)],{type:"application/json"});
    const url=URL.createObjectURL(blob); const a=document.createElement("a");
    a.href=url; a.download=`wmata-data-${new Date().toISOString().slice(0,10)}.json`; a.click(); URL.revokeObjectURL(url);
  }
  function importData(e) {
    const file=e.target.files?.[0]; if(!file) return;
    const reader=new FileReader();
    reader.onload=()=>{
      try {
        const p=JSON.parse(String(reader.result));
        if(p.rides && Array.isArray(p.rides)) setDCRides(p.rides);
        if(p.visited && Array.isArray(p.visited)) setVisited(new Set(p.visited));
        alert("Import successful!");
      } catch(err){alert("Error: "+err.message);}
    }; reader.readAsText(file);
  }
  function clearAll() { if(confirm("Clear all visited stations?")) setVisited(new Set()); }

  const allStations = useMemo(()=>{const s=new Set();DC_LINES_DATA.forEach(l=>l.stations.forEach(st=>s.add(st)));return s;},[]);
  const visitedUnique = useMemo(()=>{const seen=new Set();DC_LINES_DATA.forEach(l=>l.stations.forEach(st=>{if(visited.has(`${l.id}::${st}`))seen.add(st);}));return seen.size;},[visited]);
  const lineStats = useMemo(()=>DC_LINES_DATA.map(l=>({...l,count:l.stations.filter(s=>visited.has(`${l.id}::${s}`)).length,total:l.stations.length})),[visited]);

  const innerTabs = [{key:"progress",label:"Progress"},{key:"stations",label:"Stations"},{key:"history",label:"Trip History"},{key:"manage",label:"Manage"}];

  return (
    <div style={{maxWidth:900,margin:"0 auto",padding:"1.5rem 1rem 3rem"}}>
      <div style={{display:"flex",gap:"0.3rem",background:"rgba(255,255,255,0.05)",borderRadius:12,padding:"0.3rem",marginBottom:"1.5rem",overflowX:"auto"}}>
        {innerTabs.map(t => (
          <button key={t.key} onClick={()=>setTab(t.key)}
            style={{flex:1,padding:"0.55rem 1rem",border:"none",borderRadius:9,
              fontFamily:"'Barlow Condensed',sans-serif",fontWeight:700,fontSize:"1rem",letterSpacing:"0.04em",whiteSpace:"nowrap",
              background:tab===t.key?"#BF0D3E":"transparent",
              color:tab===t.key?"#fff":"rgba(255,255,255,0.5)",cursor:"pointer",transition:"all 0.15s"}}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === "progress" && (
        <div style={{display:"flex",flexDirection:"column",gap:"1.5rem"}}>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))",gap:"0.75rem"}}>
            {[
              {label:"Unique Stations",value:`${visitedUnique}/${allStations.size}`,color:"#BF0D3E"},
              {label:"Total Trips",value:dcRides.length,color:"#009CDE"},
              {label:"Lines Ridden",value:lineStats.filter(l=>l.count>0).length+"/"+lineStats.length,color:"#00B140"},
              {label:"Transfers",value:dcRides.filter(r=>r.transferLineId).length,color:"#ED8B00"},
            ].map(({label,value,color})=>(
              <div key={label} style={{background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:14,padding:"1rem 1.25rem"}}>
                <div style={{fontSize:"0.72rem",color:"rgba(255,255,255,0.4)",textTransform:"uppercase",letterSpacing:"0.1em"}}>{label}</div>
                <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:900,fontSize:"2rem",color,marginTop:"0.2rem"}}>{value}</div>
              </div>
            ))}
          </div>
          <div style={cardStyle}>
            <div style={sectionHeadStyle}>Line Coverage</div>
            <div style={{display:"flex",flexDirection:"column",gap:"0.75rem"}}>
              {lineStats.map(l=>(
                <div key={l.id}>
                  <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"0.35rem"}}>
                    <div style={{display:"flex",alignItems:"center",gap:"0.6rem"}}>
                      <DCLinePill line={l} size="sm"/>
                      <span style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:700,fontSize:"0.95rem",color:"#f0f0f4"}}>{l.label} Line</span>
                    </div>
                    <span style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:700,fontSize:"0.9rem",color:l.count===l.total&&l.total>0?l.color:"rgba(255,255,255,0.4)"}}>
                      {l.count}/{l.total}
                    </span>
                  </div>
                  <ProgressBar value={l.total>0?(l.count/l.total)*100:0} color={l.color}/>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === "stations" && <DCLogPage visited={visited} onToggle={setVisited}/>}

      {tab === "history" && (
        <div style={cardStyle}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"1rem",flexWrap:"wrap",gap:"0.5rem"}}>
            <span style={sectionHeadStyle}>Trip History <span style={badgeStyle}>{dcRides.length}</span></span>
            <div style={{display:"flex",gap:"0.5rem"}}>
              <SmallBtn onClick={exportData}>⬇ Export</SmallBtn>
              <SmallBtn onClick={clearRides} danger>🗑 Clear All</SmallBtn>
            </div>
          </div>
          <div style={{overflowX:"auto",borderRadius:10,border:"1px solid rgba(255,255,255,0.08)"}}>
            <table style={{width:"100%",borderCollapse:"collapse",fontSize:"0.88rem"}}>
              <thead><tr style={{background:"rgba(0,0,0,0.4)"}}>
                {["Time","Line","Boarded","Exited","Transfer",""].map(h=>(
                  <th key={h} style={{padding:"0.6rem 0.8rem",textAlign:"left",color:"rgba(255,255,255,0.4)",fontWeight:700,
                    fontSize:"0.72rem",letterSpacing:"0.08em",textTransform:"uppercase",
                    borderBottom:"1px solid rgba(255,255,255,0.08)",whiteSpace:"nowrap"}}>{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {dcRides.length===0 && <tr><td colSpan={6} style={{padding:"2rem",textAlign:"center",color:"rgba(255,255,255,0.3)"}}>No trips yet. Log a ride!</td></tr>}
                {[...dcRides].reverse().map((r,i)=>{
                  const line = DC_LINES_DATA.find(l=>l.id===r.lineId)||{color:"#555",textColor:"#fff",label:r.lineLabel||"?"};
                  return (
                    <tr key={r.id} style={{background:i%2===0?"transparent":"rgba(255,255,255,0.02)",borderBottom:"1px solid rgba(255,255,255,0.05)"}}>
                      <td style={{padding:"0.55rem 0.8rem",color:"rgba(255,255,255,0.45)",whiteSpace:"nowrap",fontSize:"0.8rem"}}>{new Date(r.timestamp).toLocaleString()}</td>
                      <td style={{padding:"0.55rem 0.8rem"}}>
                        <div style={{width:28,height:18,borderRadius:3,background:line.color,color:line.textColor,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'Barlow Condensed',sans-serif",fontWeight:900,fontSize:"0.75rem",letterSpacing:"0.06em"}}>{r.lineLabel}</div>
                      </td>
                      <td style={{padding:"0.55rem 0.8rem",fontSize:"0.82rem",maxWidth:160,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{r.boardStation}</td>
                      <td style={{padding:"0.55rem 0.8rem",fontSize:"0.82rem",maxWidth:160,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{r.exitStation}</td>
                      <td style={{padding:"0.55rem 0.8rem",fontSize:"0.78rem",color:"rgba(255,255,255,0.4)"}}>{r.transferLineLabel||"—"}</td>
                      <td style={{padding:"0.55rem 0.8rem"}}><SmallBtn onClick={()=>deleteRide(r.id)} danger>✕</SmallBtn></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === "manage" && (
        <div style={{display:"flex",flexDirection:"column",gap:"1rem"}}>
          {[
            {title:"Export Data",desc:`Download your ${dcRides.length} trips and ${visited.size} station visits as JSON.`,action:<SmallBtn onClick={exportData}>⬇ Export JSON</SmallBtn>},
            {title:"Import Data",desc:"Restore from a previously exported JSON file.",action:<label style={{...smallBtnStyle,cursor:"pointer"}}>⬆ Import JSON<input type="file" accept="application/json" style={{display:"none"}} onChange={importData}/></label>},
            {title:"Clear All Stations",desc:"Remove all visited station records.",action:<SmallBtn onClick={clearAll} danger>✕ Clear Stations</SmallBtn>},
            {title:"Clear Trip History",desc:"Remove all logged trips.",action:<SmallBtn onClick={clearRides} danger>✕ Clear Trips</SmallBtn>},
          ].map(({title,desc,action})=>(
            <div key={title} style={{...cardStyle,display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:"1.5rem",flexWrap:"wrap"}}>
              <div style={{flex:1,minWidth:200}}>
                <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:800,fontSize:"1rem",color:"#f0f0f4",marginBottom:"0.3rem"}}>{title}</div>
                <div style={{fontSize:"0.82rem",color:"rgba(255,255,255,0.4)",lineHeight:1.5}}>{desc}</div>
              </div>
              {action}
            </div>
          ))}
          <div style={{...cardStyle,marginTop:"0.5rem"}}>
            <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:800,fontSize:"1rem",color:"#f0f0f4",marginBottom:"0.5rem"}}>Rolling Stock</div>
            <div style={{display:"flex",flexDirection:"column",gap:"0.5rem"}}>
              {DC_ROLLING_STOCK.map(s=>(
                <div key={s.model} style={{display:"flex",alignItems:"center",gap:"1rem",padding:"0.6rem 0",borderBottom:"1px solid rgba(255,255,255,0.06)"}}>
                  <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:800,fontSize:"1.05rem",color:"#f0f0f4",minWidth:120}}>{s.model}</div>
                  <div style={{fontSize:"0.82rem",color:"rgba(255,255,255,0.4)"}}>{s.builder} · {s.years}</div>
                  <div style={{marginLeft:"auto",fontSize:"0.75rem",color:"rgba(255,255,255,0.25)"}}>{s.notes}</div>
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
   DC LOG STATIONS PAGE
───────────────────────────────────────────────────────────────── */
const DC_CSS_GLOBAL = `
  @import url('https://fonts.googleapis.com/css2?family=EB+Garamond:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&family=IBM+Plex+Sans:wght@300;400;500;600&family=Barlow+Condensed:wght@700;800;900&family=Barlow:wght@400;500;600&display=swap');
  .dc-root{background:#111116;color:#f0f0f4;font-family:'Barlow',system-ui,sans-serif;min-height:100vh;}
  .dc-vault-bg{position:fixed;inset:0;pointer-events:none;z-index:0;background-image:repeating-linear-gradient(0deg,transparent,transparent 79px,rgba(255,255,255,0.018) 79px,rgba(255,255,255,0.018) 80px),repeating-linear-gradient(90deg,transparent,transparent 79px,rgba(255,255,255,0.018) 79px,rgba(255,255,255,0.018) 80px);}
  .dc-line-tab{padding:0.5rem 0.85rem;border:none;border-radius:0;font-family:'Barlow Condensed',sans-serif;font-size:0.85rem;font-weight:800;letter-spacing:0.06em;text-transform:uppercase;cursor:pointer;transition:all 0.18s;background:transparent;color:rgba(240,240,244,0.35);border-bottom:3px solid transparent;white-space:nowrap;flex-shrink:0;}
  .dc-line-tab.active{color:#f0f0f4;border-bottom-color:currentColor;}
  .dc-station-row{display:flex;align-items:stretch;gap:0;padding:0;border-bottom:1px solid rgba(255,255,255,0.06);cursor:pointer;transition:background 0.12s;position:relative;}
  .dc-station-row:hover{background:rgba(255,255,255,0.025);}
  .dc-station-row.visited{background:rgba(255,255,255,0.04);}
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
        <div style={{fontFamily:"'Barlow',sans-serif",fontWeight:isVisited?600:400,fontSize:"0.9rem",
          color:isVisited?"#f0f0f4":"rgba(240,240,244,0.55)",
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

function DCLogPage({ visited, onToggle }) {
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
        <div style={{display:"flex",overflowX:"auto",borderBottom:"1px solid rgba(255,255,255,0.07)"}} className="hide-scrollbar">
          {DC_LINES_DATA.map(line => {
            const stat = lineStats.find(l => l.id === line.id);
            const isActive = selectedLine.id === line.id;
            return (
              <button key={line.id} className={`dc-line-tab${isActive?" active":""}`}
                style={{color:isActive?line.color:undefined,borderBottomColor:isActive?line.color:undefined}}
                onClick={() => { setSelectedLine(line); setFilter("all"); }}>
                {line.label}
                <span style={{marginLeft:"0.4rem",fontFamily:"'Barlow Condensed',sans-serif",fontSize:"0.75rem",opacity:0.6,fontWeight:700}}>{stat?.visited}/{stat?.total}</span>
              </button>
            );
          })}
        </div>
        <div style={{padding:"0.65rem 1rem",display:"flex",alignItems:"center",gap:"0.75rem",flexWrap:"wrap",borderBottom:"1px solid rgba(255,255,255,0.07)"}}>
          <DCLinePill line={selectedLine}/>
          <div style={{flex:1}}>
            <div style={{fontFamily:"'Barlow',sans-serif",fontSize:"0.78rem",color:"rgba(240,240,244,0.4)",letterSpacing:"0.02em"}}>
              {selectedLine.endpoints[0]} ↔ {selectedLine.endpoints[1]}</div>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:"0.5rem"}}>
            <div style={{width:100,height:3,background:"rgba(255,255,255,0.08)",borderRadius:2,overflow:"hidden"}}>
              <motion.div animate={{width:`${(activeStats?.pct||0)*100}%`}} transition={{duration:0.7,ease:"easeOut"}} style={{height:"100%",background:selectedLine.color,borderRadius:2}}/>
            </div>
            <span style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:900,fontSize:"0.85rem",color:selectedLine.color,minWidth:36}}>{Math.round((activeStats?.pct||0)*100)}%</span>
          </div>
        </div>
        <div style={{padding:"0.5rem 0.75rem",display:"flex",alignItems:"center",gap:"0.5rem",flexWrap:"wrap"}}>
          {["all","visited","unvisited"].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              style={{padding:"0.28rem 0.65rem",border:`1px solid ${filter===f?"rgba(255,255,255,0.3)":"rgba(255,255,255,0.08)"}`,borderRadius:5,
                background:filter===f?"rgba(255,255,255,0.08)":"transparent",color:filter===f?"#f0f0f4":"rgba(240,240,244,0.35)",
                fontFamily:"'Barlow Condensed',sans-serif",fontWeight:700,fontSize:"0.78rem",letterSpacing:"0.06em",textTransform:"uppercase",cursor:"pointer",transition:"all 0.15s"}}>
              {f}
            </button>
          ))}
          <button onClick={markAll}
            style={{marginLeft:"auto",padding:"0.28rem 0.65rem",border:"1px solid rgba(255,255,255,0.08)",borderRadius:5,
              background:"transparent",color:selectedLine.color,fontFamily:"'Barlow Condensed',sans-serif",fontWeight:900,
              fontSize:"0.78rem",letterSpacing:"0.06em",textTransform:"uppercase",cursor:"pointer",opacity:0.8}}>
            {allMarked ? "Unmark All" : "Mark All"}
          </button>
        </div>
      </div>
      <div style={{background:"rgba(255,255,255,0.02)",border:"1px solid rgba(255,255,255,0.07)",borderRadius:4,overflow:"hidden"}}>
        {displayedStations.length === 0
          ? <div style={{padding:"3rem 1.5rem",textAlign:"center",color:"rgba(240,240,244,0.25)",fontFamily:"'Barlow Condensed',sans-serif",fontSize:"0.9rem",letterSpacing:"0.1em"}}>No stations match this filter</div>
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
      <div style={{marginTop:"0.75rem",fontFamily:"'Barlow Condensed',sans-serif",fontWeight:600,fontSize:"0.72rem",color:"rgba(240,240,244,0.2)",letterSpacing:"0.08em",textAlign:"center",textTransform:"uppercase"}}>
        Tap any station to mark as visited · Data stored locally</div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────
   DC APP SHELL
───────────────────────────────────────────────────────────────── */
function DCApp({ onSwitchSystem }) {
  const [page, setPage] = useState("live");
  const [visited, setVisited] = useDCVisited();
  const [dcRides, setDCRides] = useDCRides();

  const navItems = [
    {key:"live",label:"🚇 Live Rider"},
    {key:"stats",label:"📊 Stats"},
  ];

  return (
    <div className="dc-root">
      <DCStyles2/>
      <div className="dc-vault-bg"/>
      <header style={{position:"sticky",top:0,zIndex:50,background:"rgba(17,17,22,0.9)",backdropFilter:"blur(14px)",borderBottom:"1px solid rgba(255,255,255,0.07)",padding:"0 1rem"}}>
        <div style={{maxWidth:900,margin:"0 auto",display:"flex",alignItems:"center",justifyContent:"space-between",padding:"0.75rem 0",gap:"1rem",flexWrap:"wrap"}}>
          <div style={{display:"flex",alignItems:"center",gap:"0.65rem"}}>
            <div style={{width:38,height:38,borderRadius:9,background:"#BF0D3E",color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'Barlow Condensed',sans-serif",fontWeight:900,fontSize:"0.7rem",letterSpacing:"0.02em",textAlign:"center",lineHeight:1.1}}>DC</div>
            <div>
              <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:900,fontSize:"1.35rem",lineHeight:1,letterSpacing:"0.03em"}}>HaveIRidden<span style={{color:"#BF0D3E"}}>?</span></div>
              <div style={{fontSize:"0.65rem",color:"rgba(255,255,255,0.35)",letterSpacing:"0.1em",textTransform:"uppercase"}}>Washington Metro Tracker</div>
            </div>
          </div>
          <nav style={{display:"flex",gap:"0.25rem",background:"rgba(255,255,255,0.06)",borderRadius:10,padding:"0.25rem",border:"1px solid rgba(255,255,255,0.07)"}}>
            {navItems.map(t => (
              <button key={t.key} onClick={() => setPage(t.key)}
                style={{padding:"0.45rem 1rem",borderRadius:7,border:"none",fontFamily:"'Barlow Condensed',sans-serif",fontWeight:700,fontSize:"0.95rem",letterSpacing:"0.03em",
                  background:page===t.key?"#BF0D3E":"transparent",
                  color:page===t.key?"#fff":"rgba(255,255,255,0.45)",
                  cursor:"pointer",transition:"all 0.15s",whiteSpace:"nowrap"}}>
                {t.label}
              </button>
            ))}
          </nav>
          <div style={{display:"flex",alignItems:"center",gap:"1rem"}}>
            <div style={{fontSize:"0.82rem",color:"rgba(255,255,255,0.35)",display:"flex",alignItems:"center",gap:"0.3rem"}}>
              <span style={{color:"#BF0D3E",fontFamily:"'Barlow Condensed',sans-serif",fontWeight:900,fontSize:"1.15rem"}}>{dcRides.length}</span> trips
            </div>
            <button onClick={onSwitchSystem}
              style={{padding:"0.35rem 0.75rem",border:"1px solid rgba(255,255,255,0.12)",borderRadius:6,background:"transparent",color:"rgba(255,255,255,0.35)",fontFamily:"'Barlow Condensed',sans-serif",fontSize:"0.72rem",letterSpacing:"0.08em",textTransform:"uppercase",cursor:"pointer",transition:"all 0.15s"}}>
              Switch →
            </button>
          </div>
        </div>
        <div style={{height:3,display:"flex"}}>
          {DC_LINES_DATA.map(l => <div key={l.id} style={{flex:1,background:l.color,opacity:0.75}}/>)}
        </div>
      </header>
      <AnimatePresence mode="wait">
        <motion.div key={page} initial={{opacity:0,y:6}} animate={{opacity:1,y:0}} exit={{opacity:0}} transition={{duration:0.2}}
          style={{position:"relative",zIndex:1}}>
          {page === "live" && <DCLiveRider dcRides={dcRides} setDCRides={setDCRides} visited={visited} setVisited={setVisited}/>}
          {page === "stats" && <DCStatsPage visited={visited} dcRides={dcRides} setDCRides={setDCRides} setVisited={setVisited}/>}
        </motion.div>
      </AnimatePresence>
      <footer style={{position:"relative",zIndex:1,borderTop:"1px solid rgba(255,255,255,0.06)",padding:"1rem",textAlign:"center",fontFamily:"'Barlow Condensed',sans-serif",fontWeight:600,fontSize:"0.68rem",color:"rgba(255,255,255,0.15)",letterSpacing:"0.08em",textTransform:"uppercase"}}>
        HaveIRidden? · WMATA Station &amp; Trip Tracker · Not affiliated with WMATA
      </footer>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════

/* ═══════════════════════════════════════════════════════════════════
   PATH TRAIN SYSTEM
═══════════════════════════════════════════════════════════════════ */

/* ─────────────────────────────────────────────────────────────────
   PATH DATA — Official PANYNJ line colors
   NWK-WTC  Red    #DA291C
   JSQ-33   Blue+Yellow  #0082C6 / #F5C518
   HOB-33   Blue   #0082C6
   HOB-WTC  Green  #00953A
   Brand:   #0047BB
───────────────────────────────────────────────────────────────── */
const PATH_BRAND_BLUE = "#0047BB";

const PATH_LINES_DATA = [
  {
    id: "nwk-wtc",
    label: "NWK–WTC",
    shortLabel: "NWK",
    bulletLabel: "NWK",
    color: "#DA291C",
    textColor: "#fff",
    endpoints: ["Newark", "World Trade Center"],
    stations: [
      "Newark",
      "Harrison",
      "Journal Square",
      "Grove Street",
      "Exchange Place",
      "World Trade Center",
    ],
  },
  {
    id: "jsq-33",
    label: "JSQ–33",
    shortLabel: "JSQ",
    bulletLabel: "JSQ",
    color: "#0082C6",
    accentColor: "#F5C518",
    textColor: "#fff",
    endpoints: ["Journal Square", "33rd Street"],
    stations: [
      "Journal Square",
      "Grove Street",
      "Newport",
      "Christopher Street",
      "9th Street",
      "14th Street",
      "23rd Street",
      "33rd Street",
    ],
  },
  {
    id: "hob-33",
    label: "HOB–33",
    shortLabel: "HOB",
    bulletLabel: "HOB",
    color: "#0082C6",
    textColor: "#fff",
    endpoints: ["Hoboken", "33rd Street"],
    stations: [
      "Hoboken",
      "Christopher Street",
      "9th Street",
      "14th Street",
      "23rd Street",
      "33rd Street",
    ],
  },
  {
    id: "hob-wtc",
    label: "HOB–WTC",
    shortLabel: "WTC",
    bulletLabel: "WTC",
    color: "#00953A",
    textColor: "#fff",
    endpoints: ["Hoboken", "World Trade Center"],
    stations: [
      "Hoboken",
      "Newport",
      "Exchange Place",
      "World Trade Center",
    ],
  },
];

const PATH_ALL_STATIONS = [
  { name: "Newark",             lines: ["nwk-wtc"],                       state: "NJ" },
  { name: "Harrison",           lines: ["nwk-wtc"],                       state: "NJ" },
  { name: "Journal Square",     lines: ["nwk-wtc", "jsq-33"],             state: "NJ" },
  { name: "Grove Street",       lines: ["nwk-wtc", "jsq-33"],             state: "NJ" },
  { name: "Exchange Place",     lines: ["nwk-wtc", "hob-wtc"], state: "NJ" },
  { name: "Newport",            lines: ["jsq-33", "hob-wtc"],  state: "NJ" },
  { name: "Hoboken",            lines: ["hob-33", "hob-wtc"],  state: "NJ" },
  { name: "World Trade Center", lines: ["nwk-wtc", "jsq-33", "hob-wtc"], state: "NY" },
  { name: "Christopher Street", lines: ["jsq-33", "hob-33"],              state: "NY" },
  { name: "9th Street",         lines: ["jsq-33", "hob-33"],              state: "NY" },
  { name: "14th Street",        lines: ["jsq-33", "hob-33"],              state: "NY" },
  { name: "23rd Street",        lines: ["jsq-33", "hob-33"],              state: "NY" },
  { name: "33rd Street",        lines: ["jsq-33", "hob-33"],              state: "NY" },
];

const PATH_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600;700&family=IBM+Plex+Sans:wght@300;400;500;600;700&display=swap');

  .path-root {
    background: #050C1F;
    color: #D6E0F5;
    min-height: 100vh;
    font-family: 'IBM Plex Sans', system-ui, sans-serif;
  }

  /*
    PATH ceramic tile wall pattern.
    Replicates the vertical fluted tiles at Grove St, Exchange Place, etc.
    Narrow glazed tile columns (≈22px wide) divided by dark grout seams.
    Horizontal mortar seams every ~60px.
  */
  .path-tile-bg {
    position: fixed;
    inset: 0;
    pointer-events: none;
    z-index: 0;
    background-image:
      repeating-linear-gradient(
        90deg,
        rgba(0,50,140,0.10)  0px,
        rgba(0,50,140,0.10)  21px,
        rgba(0,20,70,0.55)  21px,
        rgba(0,20,70,0.55)  24px
      ),
      repeating-linear-gradient(
        0deg,
        transparent         0px,
        transparent         57px,
        rgba(0,20,70,0.45)  57px,
        rgba(0,20,70,0.45)  60px
      );
    background-size: 24px 60px;
    opacity: 1;
  }

  .path-tile-bg::after {
    content: '';
    position: absolute;
    inset: 0;
    background:
      radial-gradient(ellipse 80% 40% at 50% 0%,   rgba(0,71,187,0.22) 0%, transparent 100%),
      radial-gradient(ellipse 60% 30% at 50% 100%, rgba(0,40,120,0.14) 0%, transparent 100%);
  }

  .path-line-badge {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-family: 'IBM Plex Mono', monospace;
    font-weight: 700;
    letter-spacing: 0.03em;
    text-transform: uppercase;
    flex-shrink: 0;
    border-radius: 2px;
    transition: all 0.15s;
  }

  /* JSQ dual-color split badge */
  .path-jsq-badge {
    display: inline-flex;
    align-items: stretch;
    border-radius: 2px;
    overflow: hidden;
    flex-shrink: 0;
  }
  .path-jsq-half {
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: 'IBM Plex Mono', monospace;
    font-weight: 700;
    letter-spacing: 0.03em;
  }

  .path-station-btn {
    width: 100%;
    background: transparent;
    border: none;
    border-bottom: 1px solid rgba(0,71,187,0.18);
    cursor: pointer;
    text-align: left;
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.72rem 1rem;
    transition: background 0.1s;
    color: #D6E0F5;
  }
  .path-station-btn:hover  { background: rgba(0,71,187,0.18); }
  .path-station-btn.selected { background: rgba(0,71,187,0.32); }

  .path-card {
    background: rgba(0,25,85,0.55);
    border: 1px solid rgba(0,71,187,0.4);
    border-radius: 2px;
    padding: 1.25rem 1.5rem;
    backdrop-filter: blur(6px);
  }

  .path-surface {
    background: rgba(0,16,58,0.7);
    border: 1px solid rgba(0,71,187,0.28);
    border-radius: 2px;
    backdrop-filter: blur(4px);
  }

  .path-stat-chip {
    background: rgba(0,25,85,0.6);
    border: 1px solid rgba(0,71,187,0.35);
    border-radius: 2px;
    padding: 0.9rem 1rem;
  }

  .path-log-btn {
    width: 100%;
    padding: 1rem;
    border: none;
    border-radius: 2px;
    font-family: 'IBM Plex Mono', monospace;
    font-weight: 700;
    font-size: 0.95rem;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    cursor: pointer;
    transition: all 0.18s;
  }

  .path-tab-btn {
    padding: 0.45rem 1rem;
    border: none;
    border-radius: 1px;
    font-family: 'IBM Plex Mono', monospace;
    font-weight: 600;
    font-size: 0.72rem;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    cursor: pointer;
    transition: all 0.15s;
    white-space: nowrap;
    flex-shrink: 0;
  }

  .path-line-select-btn {
    width: 100%;
    background: rgba(0,16,58,0.7);
    border: 1px solid rgba(0,71,187,0.32);
    border-radius: 2px;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 0.85rem 1rem;
    transition: all 0.15s;
    text-align: left;
    color: #D6E0F5;
  }
  .path-line-select-btn:hover {
    background: rgba(0,50,150,0.5);
    border-color: rgba(0,71,187,0.7);
    transform: translateX(3px);
  }

  .path-hide-scroll::-webkit-scrollbar { display: none; }
  .path-hide-scroll { -ms-overflow-style: none; scrollbar-width: none; }

  .path-bar-track {
    width: 100%;
    height: 5px;
    background: rgba(0,71,187,0.2);
    border-radius: 1px;
    overflow: hidden;
  }
`;

function PATHStyles() {
  useEffect(() => {
    const el = document.createElement("style");
    el.id = "path-styles";
    el.textContent = PATH_CSS;
    document.head.appendChild(el);
    return () => { const s = document.getElementById("path-styles"); if (s) s.remove(); };
  }, []);
  return null;
}

/* PATH localStorage */
const PATH_TRIPS_KEY = "path_trips_v1";
const PATH_VISITED_KEY = "path_visited_v1";

function loadPATHTrips() { try { const r = localStorage.getItem(PATH_TRIPS_KEY); return r ? JSON.parse(r) : []; } catch { return []; } }
function savePATHTrips(t) { try { localStorage.setItem(PATH_TRIPS_KEY, JSON.stringify(t)); } catch {} }
function usePATHTrips() {
  const [trips, setT] = useState(loadPATHTrips);
  const setTrips = React.useCallback((fn) => {
    setT(prev => { const next = typeof fn === "function" ? fn(prev) : fn; savePATHTrips(next); return next; });
  }, []);
  return [trips, setTrips];
}

function loadPATHVisited() { try { const r = localStorage.getItem(PATH_VISITED_KEY); return r ? new Set(JSON.parse(r)) : new Set(); } catch { return new Set(); } }
function savePATHVisited(s) { try { localStorage.setItem(PATH_VISITED_KEY, JSON.stringify([...s])); } catch {} }
function usePATHVisited() {
  const [visited, setV] = useState(loadPATHVisited);
  const setVisited = React.useCallback((fn) => {
    setV(prev => { const next = typeof fn === "function" ? fn(prev) : fn; savePATHVisited(next); return next; });
  }, []);
  return [visited, setVisited];
}

/* ─────────────────────────────────────────────────────────────────
   PATH LINE BADGE
   JSQ-33 gets a split blue/yellow badge matching the official dual-color
───────────────────────────────────────────────────────────────── */
function PATHLineBadge({ line, size = "md", selected, onClick }) {
  const sizes = {
    sm: { h: 20, fs: "0.6rem",  px: "0.3rem"  },
    md: { h: 26, fs: "0.7rem",  px: "0.45rem" },
    lg: { h: 34, fs: "0.82rem", px: "0.75rem" },
    xl: { h: 44, fs: "0.95rem", px: "1rem"    },
  };
  const s = sizes[size] || sizes.md;
  const isJSQ = line.id === "jsq-33";
  const borderStyle = selected
    ? `2px solid rgba(255,255,255,0.9)`
    : "2px solid transparent";
  const shadowStyle = selected
    ? `0 0 0 2px ${line.color}66, 0 2px 12px ${line.color}44`
    : "none";

  if (isJSQ) {
    return (
      <button onClick={onClick} className="path-line-badge"
        style={{
          height: s.h, padding: `0 ${s.px}`, fontSize: s.fs,
          background: "#F5C518", color: "#000",
          border: borderStyle,
          boxShadow: shadowStyle,
          cursor: onClick ? "pointer" : "default",
        }}>
        {line.bulletLabel}
      </button>
    );
  }

  return (
    <button onClick={onClick} className="path-line-badge"
      style={{
        height: s.h, padding: `0 ${s.px}`, fontSize: s.fs,
        background: line.color, color: line.textColor,
        border: borderStyle,
        boxShadow: shadowStyle,
        cursor: onClick ? "pointer" : "default",
      }}>
      {line.bulletLabel}
    </button>
  );
}

/* ─────────────────────────────────────────────────────────────────
   PATH ROUTE MAP SVG
   Accurate geographic schematic: NJ (left) → Hudson tunnel → NY (right)
   Two tunnel crossings (Downtown + Uptown), 4 lines color-coded.
───────────────────────────────────────────────────────────────── */
function PATHRouteMap({ visited }) {
  // Layout: NJ stations on left, NY on right, Hudson River in middle
  // Vertical positions chosen to match actual geography
  const W = 560, H = 300;

  // X positions
  const xNWK  = 30;   // Newark
  const xHAR  = 90;   // Harrison
  const xJSQ  = 150;  // Journal Square
  const xGRV  = 200;  // Grove Street
  const xEXP  = 250;  // Exchange Place (NJ waterfront)
  const xNEWP = 280;  // Newport (JC waterfront)
  const xHOB  = 200;  // Hoboken (north JC, set back)
  const xRIVL = 295;  // Hudson left bank
  const xRIVR = 370;  // Hudson right bank
  const xWTC  = 400;  // WTC (lower Manhattan)
  const xCHR  = 430;  // Christopher St
  const x9TH  = 460;
  const x14TH = 490;
  const x23RD = 510;
  const x33RD = 535;  // 33rd St

  // Y positions
  const yNWK_WTC  = 200;  // NWK-WTC (lower/downtown)
  const yJSQ_33   = 145;  // JSQ-33 main spine
  const yHOB_33   = 95;   // HOB-33 (upper/midtown)
  const yHOB_WTC  = 170;  // HOB-WTC
  const yHOB_term = 120;  // Hoboken terminal (shared)

  // Station dot helper
  const stationDot = (x, y, name, lineColors, labelPos = "below") => {
    const isVisited = visited.has(name);
    const r = 5;
    return (
      <g key={name}>
        <circle cx={x} cy={y} r={r + 2} fill={PATH_BRAND_BLUE} opacity={0.3}/>
        <circle cx={x} cy={y} r={r}
          fill={isVisited ? "#fff" : "#050C1F"}
          stroke={isVisited ? "#fff" : "rgba(214,224,245,0.5)"}
          strokeWidth={isVisited ? 2 : 1.5}/>
        {isVisited && (
          <circle cx={x} cy={y} r={2} fill={PATH_BRAND_BLUE}/>
        )}
        <text x={x} y={labelPos === "below" ? y + 14 : y - 8}
          textAnchor="middle"
          fontSize="7.5" fill="rgba(214,224,245,0.7)"
          fontFamily="'IBM Plex Mono',monospace" letterSpacing="0.02em">
          {name.replace("World Trade Center","WTC").replace("Christopher Street","Chr St").replace("Journal Square","JSQ")}
        </text>
      </g>
    );
  };

  return (
    <div style={{
      background: "rgba(0,16,60,0.7)",
      border: "1px solid rgba(0,71,187,0.4)",
      borderRadius: 2,
      padding: "1rem",
      overflow: "hidden",
    }}>
      {/* Legend */}
      <div style={{display:"flex",gap:"1rem",marginBottom:"0.75rem",flexWrap:"wrap"}}>
        {PATH_LINES_DATA.map(l => (
          <div key={l.id} style={{display:"flex",alignItems:"center",gap:"0.35rem"}}>
            <PATHLineBadge line={l} size="sm"/>
            <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:"0.62rem",
              color:"rgba(214,224,245,0.55)",letterSpacing:"0.04em"}}>{l.label}</span>
          </div>
        ))}
      </div>

      <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{overflow:"visible",display:"block"}}>
        <defs>
          <linearGradient id="hudsonGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="rgba(0,50,140,0.0)"/>
            <stop offset="50%" stopColor="rgba(0,50,140,0.18)"/>
            <stop offset="100%" stopColor="rgba(0,50,140,0.0)"/>
          </linearGradient>
        </defs>

        {/* Hudson River band */}
        <rect x={xRIVL} y={40} width={xRIVR - xRIVL} height={H - 60}
          fill="url(#hudsonGrad)" rx={2}/>
        <text x={(xRIVL + xRIVR)/2} y={H - 18}
          textAnchor="middle" fontSize="7" fill="rgba(0,120,255,0.35)"
          fontFamily="'IBM Plex Mono',monospace" letterSpacing="0.15em">HUDSON</text>

        {/* NJ / NY labels */}
        <text x={xJSQ} y={22} textAnchor="middle" fontSize="7.5"
          fill="rgba(214,224,245,0.35)" fontFamily="'IBM Plex Mono',monospace" letterSpacing="0.12em">NEW JERSEY</text>
        <text x={x14TH} y={22} textAnchor="middle" fontSize="7.5"
          fill="rgba(214,224,245,0.35)" fontFamily="'IBM Plex Mono',monospace" letterSpacing="0.12em">NEW YORK</text>
        <line x1={xRIVL + (xRIVR - xRIVL)/2} y1={28} x2={xRIVL + (xRIVR - xRIVL)/2} y2={H - 25}
          stroke="rgba(0,71,187,0.25)" strokeWidth={1} strokeDasharray="3 3"/>

        {/* ── NWK-WTC line (red) ── */}
        {/* NWK → JSQ straight */}
        <line x1={xNWK} y1={yNWK_WTC} x2={xJSQ} y2={yNWK_WTC}
          stroke="#DA291C" strokeWidth={3} strokeLinecap="round"/>
        {/* JSQ → Grove → Exchange (angling slightly down) */}
        <polyline points={`${xJSQ},${yNWK_WTC} ${xGRV},${yNWK_WTC} ${xEXP},${yNWK_WTC}`}
          fill="none" stroke="#DA291C" strokeWidth={3} strokeLinejoin="round"/>
        {/* Tunnel: Exchange → WTC */}
        <line x1={xEXP} y1={yNWK_WTC} x2={xWTC} y2={yNWK_WTC}
          stroke="#DA291C" strokeWidth={3} strokeDasharray="6 3" opacity={0.85}/>

        {/* ── HOB-WTC line (green) ── */}
        {/* Hoboken → Newport */}
        <polyline points={`${xHOB},${yHOB_term} ${xNEWP},${yHOB_WTC}`}
          fill="none" stroke="#00953A" strokeWidth={3} strokeLinejoin="round"/>
        {/* Newport → Exchange Place */}
        <line x1={xNEWP} y1={yHOB_WTC} x2={xEXP} y2={yNWK_WTC}
          stroke="#00953A" strokeWidth={3} opacity={0.9}/>
        {/* Tunnel: Exchange → WTC  (offset slightly) */}
        <line x1={xEXP} y1={yNWK_WTC - 4} x2={xWTC} y2={yNWK_WTC - 4}
          stroke="#00953A" strokeWidth={3} strokeDasharray="6 3" opacity={0.85}/>

        {/* ── JSQ-33 line (blue, tunnels uptown) ── */}
        {/* JSQ → Grove */}
        <line x1={xJSQ} y1={yJSQ_33} x2={xGRV} y2={yJSQ_33}
          stroke="#0082C6" strokeWidth={3}/>
        {/* Grove → Newport (curves north) */}
        <path d={`M${xGRV},${yJSQ_33} Q${xEXP},${yJSQ_33} ${xNEWP},${yJSQ_33}`}
          fill="none" stroke="#0082C6" strokeWidth={3}/>
        {/* Newport → Hoboken */}
        <line x1={xNEWP} y1={yJSQ_33} x2={xHOB} y2={yHOB_term}
          stroke="#0082C6" strokeWidth={3}/>
        {/* Hoboken → tunnel entrance (Newport level) */}
        <line x1={xHOB} y1={yHOB_term} x2={xNEWP} y2={yHOB_33}
          stroke="#0082C6" strokeWidth={3}/>
        {/* Tunnel uptown: Newport → Christopher → 33rd */}
        <polyline points={`${xNEWP},${yHOB_33} ${xRIVR},${yHOB_33} ${xCHR},${yHOB_33} ${x9TH},${yHOB_33} ${x14TH},${yHOB_33} ${x23RD},${yHOB_33} ${x33RD},${yHOB_33}`}
          fill="none" stroke="#0082C6" strokeWidth={3}
          strokeDasharray={`6 3`} opacity={0.9}/>

        {/* ── HOB-33 line (same blue, offset) ── */}
        <polyline points={`${xHOB},${yHOB_term + 6} ${xNEWP},${yHOB_33 + 6} ${xRIVR},${yHOB_33 + 6} ${xCHR},${yHOB_33 + 6} ${x9TH},${yHOB_33 + 6} ${x14TH},${yHOB_33 + 6} ${x23RD},${yHOB_33 + 6} ${x33RD},${yHOB_33 + 6}`}
          fill="none" stroke="#0082C6" strokeWidth={3} strokeOpacity={0.5}
          strokeDasharray="4 2"/>

        {/* ── Station dots ── */}
        {stationDot(xNWK,  yNWK_WTC,  "Newark",             ["nwk-wtc"], "below")}
        {stationDot(xHAR,  yNWK_WTC,  "Harrison",           ["nwk-wtc"], "below")}
        {stationDot(xJSQ,  (yNWK_WTC+yJSQ_33)/2, "Journal Square", ["nwk-wtc","jsq-33"], "above")}
        {stationDot(xGRV,  (yNWK_WTC+yJSQ_33)/2, "Grove Street",   ["nwk-wtc","jsq-33"], "below")}
        {stationDot(xEXP,  yNWK_WTC,  "Exchange Place",     ["nwk-wtc","jsq-33","hob-wtc"], "below")}
        {stationDot(xNEWP, yJSQ_33,   "Newport",            ["jsq-33","hob-33","hob-wtc"], "above")}
        {stationDot(xHOB,  yHOB_term, "Hoboken",            ["jsq-33","hob-33","hob-wtc"], "above")}
        {stationDot(xWTC,  yNWK_WTC,  "World Trade Center", ["nwk-wtc","jsq-33","hob-wtc"], "below")}
        {stationDot(xCHR,  yHOB_33,   "Christopher Street", ["jsq-33","hob-33"], "above")}
        {stationDot(x9TH,  yHOB_33,   "9th Street",         ["jsq-33","hob-33"], "below")}
        {stationDot(x14TH, yHOB_33,   "14th Street",        ["jsq-33","hob-33"], "above")}
        {stationDot(x23RD, yHOB_33,   "23rd Street",        ["jsq-33","hob-33"], "below")}
        {stationDot(x33RD, yHOB_33,   "33rd Street",        ["jsq-33","hob-33"], "above")}
      </svg>
      <div style={{marginTop:"0.5rem",fontFamily:"'IBM Plex Mono',monospace",fontSize:"0.6rem",
        color:"rgba(214,224,245,0.25)",letterSpacing:"0.08em",textTransform:"uppercase",textAlign:"center"}}>
        ○ = unvisited  ● = visited  – – = tunnel
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────
   PATH LIVE RIDER — step-based: line → board → exit
───────────────────────────────────────────────────────────────── */
function PATHLiveRider({ trips, setTrips, visited, setVisited }) {
  const [step, setStep] = useState(1);
  const [selectedLine, setSelectedLine] = useState(null);
  const [boardStation, setBoardStation] = useState(null);
  const [exitStation, setExitStation] = useState(null);
  const [lastTrip, setLastTrip] = useState(null);

  function reset() { setStep(1); setSelectedLine(null); setBoardStation(null); setExitStation(null); }
  function handleSelectLine(line) { setSelectedLine(line); setBoardStation(null); setExitStation(null); setStep(2); }
  function handleSelectBoard(st) { setBoardStation(st); setExitStation(null); setStep(3); }
  function handleSelectExit(st) { setExitStation(st); }

  const exitGroups = useMemo(() => {
    if (!selectedLine || !boardStation) return [];
    const sameLineStations = selectedLine.stations.filter(s => s !== boardStation);
    const otherLines = PATH_LINES_DATA
      .filter(l => l.id !== selectedLine.id)
      .map(l => ({ line: l, stations: l.stations.filter(s => s !== boardStation) }));
    return [{ line: selectedLine, stations: sameLineStations }, ...otherLines];
  }, [selectedLine, boardStation]);

  function handleLog() {
    if (!selectedLine || !boardStation || !exitStation) return;
    const isOnBoardLine = selectedLine.stations.includes(exitStation);
    const transferLine = isOnBoardLine ? null :
      PATH_LINES_DATA.find(l => l.id !== selectedLine.id && l.stations.includes(exitStation)) || null;
    const trip = {
      id: crypto.randomUUID(),
      lineId: selectedLine.id, lineLabel: selectedLine.label,
      lineColor: selectedLine.color, lineTextColor: selectedLine.textColor,
      boardStation, exitStation,
      transferLineId: transferLine?.id || null,
      transferLineLabel: transferLine?.label || null,
      transferLineColor: transferLine?.color || null,
      timestamp: new Date().toISOString(),
    };
    setTrips(prev => [...prev, trip]);
    setVisited(prev => {
      const next = new Set(prev);
      next.add(boardStation);
      next.add(exitStation);
      return next;
    });
    setLastTrip(trip);
    reset();
  }

  const canLog = selectedLine && boardStation && exitStation;
  const stepLabels = ["Line", "Board", "Exit"];

  const stepColor = selectedLine?.color || PATH_BRAND_BLUE;
  const stepTextColor = selectedLine?.textColor || "#fff";

  return (
    <div style={{maxWidth:580,margin:"0 auto",padding:"1.5rem 1rem 3rem"}}>

      {/* Step indicator */}
      <div style={{display:"flex",alignItems:"center",marginBottom:"2rem",gap:0}}>
        {[1,2,3].map((s,i) => (
          <React.Fragment key={s}>
            <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:"0.3rem",flex:1}}>
              <div style={{
                width:34,height:34,borderRadius:2,
                display:"flex",alignItems:"center",justifyContent:"center",
                fontFamily:"'IBM Plex Mono',monospace",fontWeight:700,fontSize:"0.88rem",
                background: step>s ? "#4ade80" : step===s ? stepColor : "rgba(0,71,187,0.15)",
                color: step>s ? "#000" : step===s ? stepTextColor : "rgba(214,224,245,0.3)",
                border: step===s ? `1px solid ${stepColor}` : "1px solid rgba(0,71,187,0.25)",
                boxShadow: step===s ? `0 0 12px ${stepColor}44` : "none",
                transition:"all 0.2s",
              }}>
                {step > s ? "✓" : s}
              </div>
              <div style={{
                fontFamily:"'IBM Plex Mono',monospace",fontSize:"0.58rem",letterSpacing:"0.14em",
                textTransform:"uppercase",
                color: step>=s ? "rgba(214,224,245,0.6)" : "rgba(214,224,245,0.2)",
              }}>{stepLabels[i]}</div>
            </div>
            {i < 2 && (
              <div style={{flex:2,height:1,
                background: step>s+1 ? "#4ade80" : step===s+1 ? stepColor : "rgba(0,71,187,0.2)",
                marginBottom:"1.4rem",transition:"background 0.3s"}}/>
            )}
          </React.Fragment>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {/* STEP 1: Select Line */}
        {step === 1 && (
          <motion.div key="p-step1" initial={{opacity:0,x:16}} animate={{opacity:1,x:0}} exit={{opacity:0,x:-16}} transition={{duration:0.18}}>
            <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:"0.62rem",letterSpacing:"0.16em",
              textTransform:"uppercase",color:"rgba(214,224,245,0.4)",marginBottom:"1rem"}}>Select your line</div>
            <div style={{display:"flex",flexDirection:"column",gap:"0.55rem"}}>
              {PATH_LINES_DATA.map(line => {
                const isJSQ = line.id === "jsq-33";
                return (
                  <motion.button key={line.id} whileHover={{x:4}} whileTap={{scale:0.99}}
                    onClick={() => handleSelectLine(line)}
                    className="path-line-select-btn"
                    style={{borderLeft:`4px solid ${isJSQ ? line.accentColor : line.color}`}}>
                    <PATHLineBadge line={line} size="xl"/>
                    <div style={{flex:1,textAlign:"left"}}>
                      <div style={{fontFamily:"'IBM Plex Mono',monospace",fontWeight:700,fontSize:"0.9rem",
                        letterSpacing:"0.04em",color:"#D6E0F5"}}>{line.label}</div>
                      <div style={{fontFamily:"'IBM Plex Sans',sans-serif",fontSize:"0.72rem",
                        color:"rgba(214,224,245,0.4)",marginTop:"0.15rem"}}>
                        {line.endpoints[0]} ↔ {line.endpoints[1]}
                      </div>
                    </div>
                    <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:"0.68rem",
                      color:"rgba(214,224,245,0.25)",letterSpacing:"0.06em"}}>
                      {line.stations.length} stops →
                    </div>
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* STEP 2: Board Station */}
        {step === 2 && selectedLine && (
          <motion.div key="p-step2" initial={{opacity:0,x:16}} animate={{opacity:1,x:0}} exit={{opacity:0,x:-16}} transition={{duration:0.18}}>
            <div style={{display:"flex",alignItems:"center",gap:"0.75rem",marginBottom:"1.25rem"}}>
              <PATHLineBadge line={selectedLine} size="xl"/>
              <div style={{flex:1}}>
                <div style={{fontFamily:"'IBM Plex Mono',monospace",fontWeight:700,fontSize:"0.9rem",
                  letterSpacing:"0.04em",color:"#D6E0F5"}}>{selectedLine.label}</div>
                <div style={{fontFamily:"'IBM Plex Sans',sans-serif",fontSize:"0.72rem",
                  color:"rgba(214,224,245,0.4)"}}>{selectedLine.endpoints[0]} ↔ {selectedLine.endpoints[1]}</div>
              </div>
              <button onClick={() => setStep(1)}
                style={{...pathSmallBtnBase,padding:"0.28rem 0.6rem"}}>← back</button>
            </div>
            <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:"0.62rem",letterSpacing:"0.16em",
              textTransform:"uppercase",color:"rgba(214,224,245,0.4)",marginBottom:"0.65rem"}}>
              Where did you board?
            </div>
            <div className="path-surface" style={{overflow:"hidden"}}>
              {selectedLine.stations.map((station, i) => {
                const stData = PATH_ALL_STATIONS.find(s => s.name === station);
                const isVisited = visited.has(station);
                return (
                  <button key={station} className="path-station-btn"
                    onClick={() => handleSelectBoard(station)}
                    style={{borderBottom:i<selectedLine.stations.length-1?"1px solid rgba(0,71,187,0.18)":"none"}}>
                    <div style={{width:10,height:10,borderRadius:1,
                      background:selectedLine.id==="jsq-33"?"#0082C6":selectedLine.color,
                      flexShrink:0,opacity:0.85}}/>
                    <div style={{flex:1}}>
                      <span style={{fontFamily:"'IBM Plex Sans',sans-serif",fontSize:"0.9rem",fontWeight:500,
                        color:"#D6E0F5"}}>{station}</span>
                      {stData && stData.lines.length > 1 && (
                        <span style={{marginLeft:"0.65rem",fontFamily:"'IBM Plex Mono',monospace",
                          fontSize:"0.6rem",color:"rgba(214,224,245,0.28)",letterSpacing:"0.04em"}}>
                          {stData.lines.length} lines
                        </span>
                      )}
                    </div>
                    <div style={{display:"flex",alignItems:"center",gap:"0.4rem",flexShrink:0}}>
                      {stData?.state && (
                        <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:"0.6rem",
                          background:"rgba(0,71,187,0.25)",padding:"0.1rem 0.3rem",borderRadius:1,
                          color:"rgba(214,224,245,0.45)",letterSpacing:"0.08em"}}>{stData.state}</span>
                      )}
                      {isVisited && (
                        <span style={{width:16,height:16,borderRadius:2,background:"rgba(0,71,187,0.4)",
                          border:"1px solid rgba(0,71,187,0.6)",
                          display:"flex",alignItems:"center",justifyContent:"center",fontSize:"0.55rem",color:"#D6E0F5"}}>✓</span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* STEP 3: Exit Station */}
        {step === 3 && selectedLine && boardStation && (
          <motion.div key="p-step3" initial={{opacity:0,x:16}} animate={{opacity:1,x:0}} exit={{opacity:0,x:-16}} transition={{duration:0.18}}>
            <div style={{display:"flex",alignItems:"center",gap:"0.75rem",marginBottom:"1rem",flexWrap:"wrap"}}>
              <PATHLineBadge line={selectedLine} size="lg"/>
              <div style={{flex:1}}>
                <div style={{fontFamily:"'IBM Plex Mono',monospace",fontWeight:700,fontSize:"0.82rem",
                  letterSpacing:"0.04em",color:"#D6E0F5"}}>
                  Boarded: <span style={{color:selectedLine.id==="jsq-33"?"#0082C6":selectedLine.color}}>{boardStation}</span>
                </div>
              </div>
              <button onClick={() => setStep(2)}
                style={{...pathSmallBtnBase,padding:"0.28rem 0.6rem"}}>← back</button>
            </div>

            <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:"0.62rem",letterSpacing:"0.16em",
              textTransform:"uppercase",color:"rgba(214,224,245,0.4)",marginBottom:"0.65rem"}}>
              Where did you exit?
            </div>

            <div className="path-surface path-hide-scroll"
              style={{maxHeight:360,overflowY:"auto",marginBottom:"1rem"}}>
              {exitGroups.map((group, gi) => (
                <div key={group.line.id}>
                  <div style={{
                    display:"flex",alignItems:"center",gap:"0.6rem",padding:"0.45rem 1rem",
                    background:"rgba(0,16,58,0.8)",
                    borderBottom:"1px solid rgba(0,71,187,0.18)",
                    borderTop:gi>0?"1px solid rgba(0,71,187,0.12)":"none",
                    position:"sticky",top:0,zIndex:2,
                  }}>
                    <PATHLineBadge line={group.line} size="sm"/>
                    <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:"0.62rem",
                      letterSpacing:"0.08em",color:"rgba(214,224,245,0.4)",textTransform:"uppercase"}}>
                      {group.line.label}
                      {gi===0 && <span style={{marginLeft:"0.5rem",opacity:0.45,fontWeight:400}}>(your line)</span>}
                      {gi>0  && <span style={{marginLeft:"0.5rem",opacity:0.45,fontWeight:400}}>transfer</span>}
                    </span>
                  </div>
                  {group.stations.map((station, i) => {
                    const isSelected = exitStation === station;
                    const stData = PATH_ALL_STATIONS.find(s => s.name === station);
                    const isVisited = visited.has(station);
                    const lineColor = group.line.id === "jsq-33" ? "#0082C6" : group.line.color;
                    return (
                      <button key={`${group.line.id}::${station}`}
                        className={`path-station-btn${isSelected?" selected":""}`}
                        onClick={() => handleSelectExit(station)}
                        style={{
                          borderBottom:i<group.stations.length-1?"1px solid rgba(0,71,187,0.12)":"none",
                          background:isSelected?`rgba(0,71,187,0.3)`:undefined,
                        }}>
                        <div style={{width:8,height:8,borderRadius:1,
                          background:isSelected?lineColor:"rgba(0,71,187,0.35)",
                          flexShrink:0,transition:"all 0.15s",
                          border:isSelected?`1px solid ${lineColor}`:"1px solid rgba(0,71,187,0.5)"}}/>
                        <span style={{fontFamily:"'IBM Plex Sans',sans-serif",fontSize:"0.88rem",
                          fontWeight:isSelected?600:400,
                          color:isSelected?lineColor:"#D6E0F5",flex:1}}>{station}</span>
                        <div style={{display:"flex",alignItems:"center",gap:"0.4rem",flexShrink:0}}>
                          {stData?.state && (
                            <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:"0.58rem",
                              background:"rgba(0,71,187,0.2)",padding:"0.1rem 0.3rem",borderRadius:1,
                              color:"rgba(214,224,245,0.35)",letterSpacing:"0.08em"}}>{stData.state}</span>
                          )}
                          {isSelected && <span style={{color:lineColor,fontSize:"0.85rem"}}>✓</span>}
                          {!isSelected && isVisited && (
                            <span style={{width:14,height:14,borderRadius:1,background:"rgba(0,71,187,0.3)",
                              border:"1px solid rgba(0,71,187,0.5)",
                              display:"flex",alignItems:"center",justifyContent:"center",
                              fontSize:"0.55rem",color:"rgba(214,224,245,0.5)"}}>✓</span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>

            <motion.button className="path-log-btn" onClick={handleLog} disabled={!canLog}
              whileTap={canLog?{scale:0.98}:{}}
              style={{
                background: canLog
                  ? `linear-gradient(90deg, ${selectedLine.id==="jsq-33"?"#F5C518":selectedLine.color} 0%, ${selectedLine.id==="jsq-33"?"#0082C6":selectedLine.color} 100%)`
                  : "rgba(0,71,187,0.12)",
                color: canLog ? (selectedLine.id==="jsq-33"?"#000":selectedLine.textColor) : "rgba(214,224,245,0.2)",
                cursor: canLog?"pointer":"not-allowed",
                boxShadow: canLog ? `0 4px 20px ${selectedLine.color}44` : "none",
              }}>
              LOG TRIP →
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Success toast */}
      <AnimatePresence>
        {lastTrip && (
          <motion.div key={lastTrip.id}
            initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} exit={{opacity:0}}
            style={{marginTop:"1.5rem",padding:"1rem 1.25rem",
              background:"rgba(0,50,30,0.5)",
              border:"1px solid rgba(0,149,58,0.4)",
              borderRadius:2,display:"flex",alignItems:"flex-start",gap:"1rem"}}>
            <PATHLineBadge line={PATH_LINES_DATA.find(l=>l.id===lastTrip.lineId)||PATH_LINES_DATA[0]} size="lg"/>
            <div>
              <div style={{fontFamily:"'IBM Plex Mono',monospace",fontWeight:700,fontSize:"0.8rem",
                color:"#4ade80",letterSpacing:"0.08em",textTransform:"uppercase"}}>✓ Trip logged</div>
              <div style={{fontFamily:"'IBM Plex Sans',sans-serif",fontSize:"0.85rem",
                color:"rgba(214,224,245,0.55)",marginTop:"0.25rem"}}>
                {lastTrip.boardStation} → {lastTrip.exitStation}
                {lastTrip.transferLineLabel && (
                  <span style={{color:"rgba(214,224,245,0.35)"}}> · via {lastTrip.transferLineLabel}</span>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────
   PATH shared micro-style  (must come before PATHStatsPage)
───────────────────────────────────────────────────────────────── */
const pathSmallBtnBase = {
  padding:"0.35rem 0.7rem",
  border:"1px solid rgba(0,71,187,0.4)",
  borderRadius:2,
  background:"rgba(0,50,150,0.2)",
  color:"rgba(214,224,245,0.65)",
  fontFamily:"'IBM Plex Mono',monospace",
  fontWeight:600,
  fontSize:"0.7rem",
  letterSpacing:"0.08em",
  textTransform:"uppercase",
  cursor:"pointer",
  display:"inline-flex",
  alignItems:"center",
  gap:"0.25rem",
  whiteSpace:"nowrap",
};

/* ─────────────────────────────────────────────────────────────────
   PATH STATS PAGE
───────────────────────────────────────────────────────────────── */
function PATHStatsPage({ trips, setTrips, visited, setVisited }) {
  const [tab, setTab] = useState("overview");

  const visitedCount = visited.size;
  const totalStations = PATH_ALL_STATIONS.length;
  const lineTrips = useMemo(() => {
    const c = {};
    trips.forEach(t => { c[t.lineId] = (c[t.lineId]||0)+1; });
    return c;
  }, [trips]);

  function deleteTrip(id) { setTrips(prev => prev.filter(t => t.id !== id)); }
  function clearTrips() { if (confirm("Delete all PATH trips?")) setTrips([]); }
  function exportData() {
    const blob = new Blob([JSON.stringify({trips,visited:[...visited]},null,2)],{type:"application/json"});
    const url=URL.createObjectURL(blob);const a=document.createElement("a");
    a.href=url;a.download=`path-data-${new Date().toISOString().slice(0,10)}.json`;a.click();URL.revokeObjectURL(url);
  }
  function importData(e) {
    const file=e.target.files?.[0];if(!file)return;
    const reader=new FileReader();
    reader.onload=()=>{
      try{
        const p=JSON.parse(String(reader.result));
        if(p.trips&&Array.isArray(p.trips))setTrips(p.trips);
        if(p.visited&&Array.isArray(p.visited))setVisited(new Set(p.visited));
        alert("Import successful!");
      }catch(err){alert("Error: "+err.message);}
    };reader.readAsText(file);
  }
  function clearVisited() { if(confirm("Clear all visited stations?")) setVisited(new Set()); }

  const activeTab = (k) => ({
    background: tab===k ? PATH_BRAND_BLUE : "transparent",
    color: tab===k ? "#fff" : "rgba(214,224,245,0.4)",
    borderBottom: tab===k ? `2px solid rgba(255,255,255,0.3)` : "2px solid transparent",
  });

  return (
    <div style={{maxWidth:900,margin:"0 auto",padding:"1.5rem 1rem 3rem"}}>
      {/* Sub-tabs */}
      <div style={{display:"flex",gap:"0.2rem",background:"rgba(0,16,58,0.7)",
        border:"1px solid rgba(0,71,187,0.3)",borderRadius:2,padding:"0.2rem",
        marginBottom:"1.5rem",overflowX:"auto"}} className="path-hide-scroll">
        {[{key:"overview",label:"Overview"},{key:"stations",label:"Stations"},{key:"history",label:"History"},{key:"manage",label:"Manage"}].map(t=>(
          <button key={t.key} onClick={()=>setTab(t.key)}
            className="path-tab-btn"
            style={activeTab(t.key)}>
            {t.label}
          </button>
        ))}
      </div>

      {/* OVERVIEW */}
      {tab === "overview" && (
        <div style={{display:"flex",flexDirection:"column",gap:"1.25rem"}}>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(130px,1fr))",gap:"0.65rem"}}>
            {[
              {label:"Total Trips",   value:trips.length,                                  color:"#DA291C"},
              {label:"Stations Visited", value:`${visitedCount}/${totalStations}`,          color:"#0082C6"},
              {label:"Transfers",     value:trips.filter(t=>t.transferLineId).length,       color:"#00953A"},
              {label:"Lines Used",    value:Object.keys(lineTrips).length+"/"+PATH_LINES_DATA.length, color:"#F5C518"},
            ].map(({label,value,color})=>(
              <div key={label} className="path-stat-chip">
                <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:"0.58rem",letterSpacing:"0.14em",
                  textTransform:"uppercase",color:"rgba(214,224,245,0.35)",marginBottom:"0.4rem"}}>{label}</div>
                <div style={{fontFamily:"'IBM Plex Mono',monospace",fontWeight:700,fontSize:"1.9rem",
                  color,lineHeight:1}}>{value}</div>
              </div>
            ))}
          </div>

          {/* Line coverage bars */}
          <div className="path-card">
            <div style={{fontFamily:"'IBM Plex Mono',monospace",fontWeight:700,fontSize:"0.72rem",
              letterSpacing:"0.12em",textTransform:"uppercase",color:"rgba(214,224,245,0.4)",
              marginBottom:"1rem"}}>Trips by line</div>
            <div style={{display:"flex",flexDirection:"column",gap:"0.8rem"}}>
              {PATH_LINES_DATA.map(line=>{
                const count = lineTrips[line.id]||0;
                const maxTrips = Math.max(...Object.values({...lineTrips,_:1}));
                const lineColor = line.id === "jsq-33" ? "#0082C6" : line.color;
                return(
                  <div key={line.id}>
                    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"0.4rem"}}>
                      <div style={{display:"flex",alignItems:"center",gap:"0.65rem"}}>
                        <PATHLineBadge line={line} size="md"/>
                        <span style={{fontFamily:"'IBM Plex Sans',sans-serif",fontWeight:500,
                          fontSize:"0.88rem",color:"#D6E0F5"}}>{line.label}</span>
                      </div>
                      <span style={{fontFamily:"'IBM Plex Mono',monospace",fontWeight:700,fontSize:"0.82rem",
                        color:count>0?lineColor:"rgba(214,224,245,0.2)"}}>{count} trip{count!==1?"s":""}</span>
                    </div>
                    <div className="path-bar-track">
                      <motion.div initial={{width:0}}
                        animate={{width:count>0?`${(count/maxTrips)*100}%`:"0%"}}
                        transition={{duration:0.7,ease:"easeOut"}}
                        style={{height:"100%",background:count>0
                          ? (line.id==="jsq-33"
                              ? "linear-gradient(90deg,#F5C518,#0082C6)"
                              : lineColor)
                          : "transparent"}}/>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Station coverage grid */}
          <div className="path-card">
            <div style={{fontFamily:"'IBM Plex Mono',monospace",fontWeight:700,fontSize:"0.72rem",
              letterSpacing:"0.12em",textTransform:"uppercase",color:"rgba(214,224,245,0.4)",
              marginBottom:"1rem"}}>Station coverage
              <span style={{marginLeft:"0.75rem",color:PATH_BRAND_BLUE}}>{visitedCount}/{totalStations}</span>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(175px,1fr))",gap:"0.45rem"}}>
              {PATH_ALL_STATIONS.map(st=>{
                const isVisited = visited.has(st.name);
                const lines = PATH_LINES_DATA.filter(l=>st.lines.includes(l.id));
                return(
                  <motion.div key={st.name} whileHover={{x:2}}
                    style={{
                      padding:"0.55rem 0.7rem",borderRadius:2,
                      border:`1px solid ${isVisited?"rgba(0,130,198,0.45)":"rgba(0,71,187,0.2)"}`,
                      background:isVisited?"rgba(0,71,187,0.15)":"rgba(0,16,58,0.4)",
                      display:"flex",alignItems:"center",gap:"0.55rem",
                    }}>
                    <div style={{display:"flex",gap:"0.2rem",flexShrink:0}}>
                      {lines.map(l=>(
                        <div key={l.id} style={{width:4,height:18,borderRadius:1,
                          background:l.id==="jsq-33"?"#0082C6":l.color,
                          opacity:isVisited?1:0.3}}/>
                      ))}
                    </div>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontFamily:"'IBM Plex Sans',sans-serif",fontSize:"0.78rem",
                        fontWeight:isVisited?600:400,
                        color:isVisited?"#D6E0F5":"rgba(214,224,245,0.4)",
                        whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{st.name}</div>
                      <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:"0.56rem",
                        color:"rgba(214,224,245,0.22)",letterSpacing:"0.08em"}}>{st.state}</div>
                    </div>
                    {isVisited && (
                      <div style={{width:14,height:14,borderRadius:1,background:PATH_BRAND_BLUE,
                        display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                        <svg width="8" height="6" viewBox="0 0 8 6" fill="none">
                          <path d="M1 3L3 5L7 1" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      

      {/* STATIONS */}
      {tab === "stations" && (
        <div className="path-card">
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",
            marginBottom:"1rem",flexWrap:"wrap",gap:"0.5rem"}}>
            <span style={{fontFamily:"'IBM Plex Mono',monospace",fontWeight:700,fontSize:"0.75rem",
              letterSpacing:"0.1em",textTransform:"uppercase",color:"rgba(214,224,245,0.5)"}}>
              Stations
              <span style={{marginLeft:"0.65rem",color:PATH_BRAND_BLUE}}>{visitedCount}/{totalStations}</span>
            </span>
            <div style={{display:"flex",gap:"0.5rem"}}>
              <button onClick={()=>setVisited(new Set(PATH_ALL_STATIONS.map(s=>s.name)))}
                style={pathSmallBtnBase}>Mark All</button>
              <button onClick={clearVisited}
                style={{...pathSmallBtnBase,borderColor:"rgba(218,41,28,0.45)",color:"rgba(255,120,100,0.8)"}}>Clear All</button>
            </div>
          </div>
          <div className="path-surface" style={{overflow:"hidden"}}>
            {PATH_ALL_STATIONS.map((st,i)=>{
              const isVisited = visited.has(st.name);
              const lines = PATH_LINES_DATA.filter(l=>st.lines.includes(l.id));
              return(
                <motion.button key={st.name}
                  onClick={()=>setVisited(prev=>{const next=new Set(prev);next.has(st.name)?next.delete(st.name):next.add(st.name);return next;})}
                  className="path-station-btn"
                  style={{
                    borderBottom:i<PATH_ALL_STATIONS.length-1?"1px solid rgba(0,71,187,0.15)":"none",
                    background:isVisited?"rgba(0,71,187,0.15)":"transparent",
                  }}
                  whileHover={{backgroundColor:"rgba(0,71,187,0.2)"}}>
                  <div style={{display:"flex",gap:"0.2rem",flexShrink:0}}>
                    {lines.map(l=>(
                      <div key={l.id} style={{width:5,height:22,borderRadius:1,
                        background:l.id==="jsq-33"?"#0082C6":l.color,opacity:isVisited?1:0.28}}/>
                    ))}
                  </div>
                  <div style={{flex:1}}>
                    <div style={{fontFamily:"'IBM Plex Sans',sans-serif",fontSize:"0.92rem",
                      fontWeight:isVisited?600:400,
                      color:isVisited?"#D6E0F5":"rgba(214,224,245,0.5)"}}>{st.name}</div>
                    <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:"0.6rem",
                      color:"rgba(214,224,245,0.22)",letterSpacing:"0.08em",marginTop:"0.1rem"}}>
                      {st.state} · {st.lines.length} line{st.lines.length>1?"s":""}
                    </div>
                  </div>
                  <div style={{width:20,height:20,borderRadius:2,flexShrink:0,
                    border:`1px solid ${isVisited?PATH_BRAND_BLUE:"rgba(0,71,187,0.3)"}`,
                    background:isVisited?PATH_BRAND_BLUE:"transparent",
                    display:"flex",alignItems:"center",justifyContent:"center",transition:"all 0.15s"}}>
                    {isVisited&&<svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                      <path d="M1 4L3.8 7L9 1" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                  </div>
                </motion.button>
              );
            })}
          </div>
        </div>
      )}

      {/* HISTORY */}
      {tab === "history" && (
        <div className="path-card">
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",
            marginBottom:"1rem",flexWrap:"wrap",gap:"0.5rem"}}>
            <span style={{fontFamily:"'IBM Plex Mono',monospace",fontWeight:700,fontSize:"0.75rem",
              letterSpacing:"0.1em",textTransform:"uppercase",color:"rgba(214,224,245,0.5)"}}>
              Trip History <span style={{color:PATH_BRAND_BLUE}}>{trips.length}</span>
            </span>
            <div style={{display:"flex",gap:"0.5rem"}}>
              <button onClick={exportData} style={pathSmallBtnBase}>⬇ Export</button>
              <button onClick={clearTrips}
                style={{...pathSmallBtnBase,borderColor:"rgba(218,41,28,0.45)",color:"rgba(255,120,100,0.8)"}}>🗑 Clear</button>
            </div>
          </div>
          {trips.length === 0 ? (
            <div style={{padding:"2.5rem",textAlign:"center",fontFamily:"'IBM Plex Mono',monospace",
              fontSize:"0.72rem",color:"rgba(214,224,245,0.18)",letterSpacing:"0.1em",textTransform:"uppercase"}}>
              No trips logged yet
            </div>
          ) : (
            <div style={{overflowX:"auto",borderRadius:2,border:"1px solid rgba(0,71,187,0.25)"}}>
              <table style={{width:"100%",borderCollapse:"collapse",fontSize:"0.85rem"}}>
                <thead>
                  <tr style={{background:"rgba(0,16,58,0.8)"}}>
                    {["Date / Time","Line","Boarded","Exited","Xfer",""].map(h=>(
                      <th key={h} style={{padding:"0.6rem 0.8rem",textAlign:"left",
                        fontFamily:"'IBM Plex Mono',monospace",fontWeight:600,fontSize:"0.62rem",
                        letterSpacing:"0.1em",textTransform:"uppercase",color:"rgba(214,224,245,0.3)",
                        borderBottom:"1px solid rgba(0,71,187,0.2)",whiteSpace:"nowrap"}}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[...trips].reverse().map((t,i)=>{
                    const line = PATH_LINES_DATA.find(l=>l.id===t.lineId)||PATH_LINES_DATA[0];
                    return(
                      <tr key={t.id} style={{
                        background:i%2===0?"transparent":"rgba(0,71,187,0.05)",
                        borderBottom:"1px solid rgba(0,71,187,0.1)"}}>
                        <td style={{padding:"0.55rem 0.8rem",fontFamily:"'IBM Plex Mono',monospace",
                          fontSize:"0.7rem",color:"rgba(214,224,245,0.3)",whiteSpace:"nowrap"}}>
                          {new Date(t.timestamp).toLocaleString()}
                        </td>
                        <td style={{padding:"0.55rem 0.8rem"}}><PATHLineBadge line={line} size="sm"/></td>
                        <td style={{padding:"0.55rem 0.8rem",fontFamily:"'IBM Plex Sans',sans-serif",
                          fontSize:"0.82rem",maxWidth:140,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",
                          color:"#D6E0F5"}}>{t.boardStation}</td>
                        <td style={{padding:"0.55rem 0.8rem",fontFamily:"'IBM Plex Sans',sans-serif",
                          fontSize:"0.82rem",maxWidth:140,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",
                          color:"#D6E0F5"}}>{t.exitStation}</td>
                        <td style={{padding:"0.55rem 0.8rem"}}>
                          {t.transferLineLabel ? (
                            <PATHLineBadge line={PATH_LINES_DATA.find(l=>l.id===t.transferLineId)||PATH_LINES_DATA[0]} size="sm"/>
                          ) : <span style={{color:"rgba(214,224,245,0.2)",fontFamily:"'IBM Plex Mono',monospace",fontSize:"0.7rem"}}>—</span>}
                        </td>
                        <td style={{padding:"0.55rem 0.8rem"}}>
                          <button onClick={()=>deleteTrip(t.id)}
                            style={{...pathSmallBtnBase,borderColor:"rgba(218,41,28,0.45)",color:"rgba(255,120,100,0.8)",
                              padding:"0.22rem 0.45rem",fontSize:"0.68rem"}}>✕</button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* MANAGE */}
      {tab === "manage" && (
        <div style={{display:"flex",flexDirection:"column",gap:"0.75rem"}}>
          {[
            {title:"Export Data",desc:`${trips.length} trips and ${visited.size} station visits → JSON`,
              action:<button onClick={exportData} style={pathSmallBtnBase}>⬇ Export</button>},
            {title:"Import Data",desc:"Restore from a previously exported JSON file",
              action:<label style={{...pathSmallBtnBase,cursor:"pointer"}}>⬆ Import
                <input type="file" accept="application/json" style={{display:"none"}} onChange={importData}/>
              </label>},
            {title:"Clear Trip History",desc:"Permanently delete all logged trips",
              action:<button onClick={clearTrips}
                style={{...pathSmallBtnBase,borderColor:"rgba(218,41,28,0.45)",color:"rgba(255,120,100,0.8)"}}>Delete All</button>},
            {title:"Clear Visited Stations",desc:"Reset all station visit records",
              action:<button onClick={clearVisited}
                style={{...pathSmallBtnBase,borderColor:"rgba(218,41,28,0.45)",color:"rgba(255,120,100,0.8)"}}>Reset</button>},
          ].map(({title,desc,action})=>(
            <div key={title} className="path-card"
              style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:"1.5rem",flexWrap:"wrap"}}>
              <div>
                <div style={{fontFamily:"'IBM Plex Mono',monospace",fontWeight:700,fontSize:"0.8rem",
                  letterSpacing:"0.06em",color:"#D6E0F5",marginBottom:"0.25rem"}}>{title}</div>
                <div style={{fontFamily:"'IBM Plex Sans',sans-serif",fontSize:"0.78rem",
                  color:"rgba(214,224,245,0.35)"}}>{desc}</div>
              </div>
              {action}
            </div>
          ))}
          {/* Fleet info */}
          <div className="path-card" style={{marginTop:"0.25rem"}}>
            <div style={{fontFamily:"'IBM Plex Mono',monospace",fontWeight:700,fontSize:"0.72rem",
              letterSpacing:"0.12em",textTransform:"uppercase",color:"rgba(214,224,245,0.4)",marginBottom:"0.85rem"}}>
              Rolling Stock
            </div>
            {[
              {car:"PA-5",builder:"Bombardier / Kawasaki",years:"2010–2024",notes:"Current fleet · 422 cars"},
              {car:"PA-4",builder:"Kinki Sharyo",years:"1984–1985",notes:"Retired"},
            ].map(s=>(
              <div key={s.car} style={{display:"flex",alignItems:"center",gap:"1rem",
                padding:"0.6rem 0",borderBottom:"1px solid rgba(0,71,187,0.15)"}}>
                <div style={{fontFamily:"'IBM Plex Mono',monospace",fontWeight:700,fontSize:"0.88rem",
                  color:"#D6E0F5",minWidth:50}}>{s.car}</div>
                <div style={{fontFamily:"'IBM Plex Sans',sans-serif",fontSize:"0.8rem",
                  color:"rgba(214,224,245,0.4)"}}>{s.builder} · {s.years}</div>
                <div style={{marginLeft:"auto",fontFamily:"'IBM Plex Mono',monospace",fontSize:"0.66rem",
                  color:"rgba(214,224,245,0.2)",letterSpacing:"0.04em"}}>{s.notes}</div>
              </div>
            ))}
            <div style={{marginTop:"0.75rem",fontFamily:"'IBM Plex Sans',sans-serif",fontSize:"0.72rem",
              color:"rgba(214,224,245,0.2)",lineHeight:1.5}}>
              PA-5 car numbers run from 5001–5422. Car-level tracking not supported for PATH.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────
   PATH APP SHELL
───────────────────────────────────────────────────────────────── */
function PATHApp({ onSwitchSystem }) {
  const [page, setPage] = useState("live");
  const [trips, setTrips] = usePATHTrips();
  const [visited, setVisited] = usePATHVisited();

  return (
    <div className="path-root">
      <PATHStyles/>
      <div className="path-tile-bg"/>

      <header style={{
        position:"sticky",top:0,zIndex:50,
        background:"rgba(0,10,38,0.92)",
        backdropFilter:"blur(16px)",
        borderBottom:"1px solid rgba(0,71,187,0.4)",
        padding:"0 1rem",
      }}>
        <div style={{maxWidth:900,margin:"0 auto",display:"flex",alignItems:"center",
          justifyContent:"space-between",padding:"0.75rem 0",gap:"1rem",flexWrap:"wrap"}}>

          {/* Brand — PATH-blue badge with the PORT AUTHORITY aesthetic */}
          <div style={{display:"flex",alignItems:"center",gap:"0.75rem"}}>
            <div style={{
              display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",
              width:50,height:40,background:PATH_BRAND_BLUE,borderRadius:2,flexShrink:0,
              boxShadow:`0 0 20px ${PATH_BRAND_BLUE}66`,
            }}>
              <div style={{fontFamily:"'IBM Plex Mono',monospace",fontWeight:500,fontSize:"0.48rem",
                letterSpacing:"0.18em",color:"rgba(255,255,255,0.65)",textTransform:"uppercase",lineHeight:1}}>PORT</div>
              <div style={{fontFamily:"'IBM Plex Mono',monospace",fontWeight:700,fontSize:"1.1rem",
                letterSpacing:"0.04em",color:"#fff",lineHeight:1.1}}>PATH</div>
              <div style={{fontFamily:"'IBM Plex Mono',monospace",fontWeight:500,fontSize:"0.44rem",
                letterSpacing:"0.12em",color:"rgba(255,255,255,0.65)",textTransform:"uppercase",lineHeight:1}}>TRAIN</div>
            </div>
            <div>
              <div style={{fontFamily:"'IBM Plex Mono',monospace",fontWeight:700,fontSize:"1.15rem",
                letterSpacing:"0.05em",lineHeight:1,color:"#D6E0F5"}}>
                HaveIRidden<span style={{color:PATH_BRAND_BLUE}}>?</span>
              </div>
              <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:"0.55rem",
                color:"rgba(214,224,245,0.3)",letterSpacing:"0.16em",textTransform:"uppercase",marginTop:"0.18rem"}}>
                PATH Train Tracker
              </div>
            </div>
          </div>

          {/* Nav */}
          <nav style={{display:"flex",gap:"0.2rem",background:"rgba(0,16,58,0.7)",
            border:"1px solid rgba(0,71,187,0.35)",borderRadius:2,padding:"0.2rem"}}>
            {[{key:"live",label:"↓ Live Rider"},{key:"stats",label:"≡ Stats"}].map(t=>(
              <button key={t.key} onClick={()=>setPage(t.key)}
                className="path-tab-btn"
                style={{
                  background:page===t.key?PATH_BRAND_BLUE:"transparent",
                  color:page===t.key?"#fff":"rgba(214,224,245,0.4)",
                }}>
                {t.label}
              </button>
            ))}
          </nav>

          {/* Counter + switch */}
          <div style={{display:"flex",alignItems:"center",gap:"1rem"}}>
            <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:"0.72rem",
              color:"rgba(214,224,245,0.3)",display:"flex",alignItems:"center",gap:"0.35rem"}}>
              <span style={{color:PATH_BRAND_BLUE,fontWeight:700,fontSize:"1.05rem"}}>{trips.length}</span> trips
            </div>
            <button onClick={onSwitchSystem}
              style={{padding:"0.3rem 0.65rem",border:`1px solid rgba(0,71,187,0.4)`,borderRadius:2,
                background:"transparent",color:"rgba(214,224,245,0.35)",
                fontFamily:"'IBM Plex Mono',monospace",fontSize:"0.62rem",letterSpacing:"0.1em",
                textTransform:"uppercase",cursor:"pointer",transition:"all 0.15s"}}>
              Switch →
            </button>
          </div>
        </div>

        {/* Line color strip */}
        <div style={{height:3,display:"flex"}}>
          <div style={{flex:1,background:"#DA291C"}}/>
          <div style={{flex:1,background:"#F5C518"}}/>
          <div style={{flex:1,background:"#0082C6"}}/>
          <div style={{flex:1,background:"#00953A"}}/>
        </div>
      </header>

      <AnimatePresence mode="wait">
        <motion.div key={page} initial={{opacity:0,y:6}} animate={{opacity:1,y:0}} exit={{opacity:0}}
          transition={{duration:0.2}} style={{position:"relative",zIndex:1}}>
          {page === "live" && <PATHLiveRider trips={trips} setTrips={setTrips} visited={visited} setVisited={setVisited}/>}
          {page === "stats" && <PATHStatsPage trips={trips} setTrips={setTrips} visited={visited} setVisited={setVisited}/>}
        </motion.div>
      </AnimatePresence>

      <footer style={{
        position:"relative",zIndex:1,
        borderTop:"1px solid rgba(0,71,187,0.25)",
        padding:"1rem",textAlign:"center",
        fontFamily:"'IBM Plex Mono',monospace",fontWeight:500,fontSize:"0.58rem",
        color:"rgba(214,224,245,0.14)",letterSpacing:"0.12em",textTransform:"uppercase",
      }}>
        HaveIRidden? · PATH Train Tracker · Not affiliated with Port Authority of NY &amp; NJ
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
        ? <motion.div key="selector" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} transition={{duration:0.25}}>
            <SystemSelector onSelect={handleSelectSystem}/>
          </motion.div>
        : system === "nyc"
          ? <motion.div key="nyc" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} transition={{duration:0.25}}>
              <NYCApp onSwitchSystem={handleSwitchSystem}/>
            </motion.div>
          : system === "dc"
            ? <motion.div key="dc" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} transition={{duration:0.25}}>
                <DCApp onSwitchSystem={handleSwitchSystem}/>
              </motion.div>
            : <motion.div key="path" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} transition={{duration:0.25}}>
                <PATHApp onSwitchSystem={handleSwitchSystem}/>
              </motion.div>}
    </AnimatePresence>
  );
}
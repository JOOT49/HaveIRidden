import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";

/**
 * NYC Subway Ride Tracker – 2-page React app
 * Pages: "Live Rider" and "Stats / Bulk Edit"
 * - Live Rider: input train car number, pick a line badge, auto-detect model, save to cookies
 * - Stats: view/edit rolling stock ranges and lines list; view, bulk edit, import/export ride history
 *
 * Notes
 * - Rides are stored in a cookie named `nyc_subway_rides` (JSON string, URI encoded)
 * - Datasets (rolling stock ranges & lines) are stored in localStorage so users can refine data
 * - Includes a "Prefill 2025 dataset" button to seed commonly used entries (you can edit later)
 * - Styling uses Tailwind utility classes available in this environment
 */

// ----------------------------- Helpers -----------------------------
const COOKIE_NAME = "nyc_subway_rides";
const DATA_KEY = "nyc_subway_datasets_v1";

function readRidesFromCookie() {
  try {
    const match = document.cookie
      .split(";")
      .map((c) => c.trim())
      .find((c) => c.startsWith(`${COOKIE_NAME}=`));
    if (!match) return [];
    const raw = decodeURIComponent(match.split("=")[1] || "");
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

function writeRidesToCookie(rides) {
  try {
    const value = encodeURIComponent(JSON.stringify(rides));
    // 400 days ~ max modern browsers allow; path=/ for site-wide
    const maxAge = 60 * 60 * 24 * 400;
    document.cookie = `${COOKIE_NAME}=${value}; Max-Age=${maxAge}; Path=/`;
  } catch {
    // no-op
  }
}

function useCookieRides() {
  const [rides, setRides] = useState(readRidesFromCookie());
  useEffect(() => writeRidesToCookie(rides), [rides]);
  return [rides, setRides];
}

function loadDatasets() {
  try {
    const raw = localStorage.getItem(DATA_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveDatasets(ds) {
  localStorage.setItem(DATA_KEY, JSON.stringify(ds));
}

// ----------------------------- Seed Data (editable) -----------------------------
// NOTE: These are pragmatic, user-editable entries intended as a helpful starting point. 
// NYC fleets/terminals do change; refine as you ride.
function prefillDatasets() {
  const datasets = {
    rollingStock: [
      // A Division (IRT, numbered lines)
      { model: "R62", ranges: [[1301, 1390], [1601, 1625]], division: "A" },
      { model: "R62A", ranges: [[1651, 2150]], division: "A" },
      { model: "R142", ranges: [[6301, 6899]], division: "A" },
      { model: "R142A", ranges: [[7211, 7590]], division: "A" },
      { model: "R188", ranges: [[7811, 7936]], division: "A" },
      // B Division (IND/BMT, lettered lines)
      { model: "R68", ranges: [[2500, 2790]], division: "B" },
      { model: "R68A", ranges: [[5001, 5296]], division: "B" },
      { model: "R160A", ranges: [[8313, 8652]], division: "B" },
      { model: "R160B", ranges: [[8713, 9942]], division: "B" },
      { model: "R179", ranges: [[3010, 3327]], division: "B" },
      { model: "R211A", ranges: [[4000, 4399]], division: "B" },
      { model: "R211S (Staten Island)", ranges: [[100, 199]], division: "SIR" },
    ],
    lines: [
      // A Division
      { id: "1", label: "1", division: "A", color: "#EE352E", terminals: ["Van Cortlandt Park–242 St", "South Ferry"] },
      { id: "2", label: "2", division: "A", color: "#EE352E", terminals: ["Wakefield–241 St", "Flatbush Av–Bklyn College"] },
      { id: "3", label: "3", division: "A", color: "#EE352E", terminals: ["Harlem–148 St", "New Lots Av"] },
      { id: "4", label: "4", division: "A", color: "#00933C", terminals: ["Woodlawn", "Crown Hts–Utica Av / New Lots Av"] },
      { id: "5", label: "5", division: "A", color: "#00933C", terminals: ["Eastchester–Dyre Av / Nereid Av", "Flatbush Av / Bowling Green"] },
      { id: "6", label: "6", division: "A", color: "#00933C", terminals: ["Pelham Bay Park", "Brooklyn Bridge–City Hall / Parkchester"] },
      { id: "7", label: "7", division: "A", color: "#B933AD", terminals: ["Flushing–Main St", "34 St–Hudson Yards"] },
      { id: "S", label: "S", division: "A", color: "#808183", terminals: ["Times Sq–42 St", "Grand Central–42 St"] },

      // B Division
      { id: "A", label: "A", division: "B", color: "#2850AD", terminals: ["Inwood–207 St", "Far Rockaway–Mott Ave / Lefferts Blvd / Rockaway Park"] },
      { id: "B", label: "B", division: "B", color: "#FF6319", terminals: ["Bedford Park Blvd", "Brighton Beach"] },
      { id: "C", label: "C", division: "B", color: "#2850AD", terminals: ["168 St", "Euclid Av"] },
      { id: "D", label: "D", division: "B", color: "#FF6319", terminals: ["Norwood–205 St", "Coney Island–Stillwell Av"] },
      { id: "E", label: "E", division: "B", color: "#2850AD", terminals: ["Jamaica Center–Parsons/Archer", "World Trade Center"] },
      { id: "F", label: "F", division: "B", color: "#FF6319", terminals: ["Jamaica–179 St / 21 St–Queensbridge", "Coney Island–Stillwell Av"] },
      { id: "G", label: "G", division: "B", color: "#6CBE45", terminals: ["Court Sq", "Church Av"] },
      { id: "J", label: "J", division: "B", color: "#996633", terminals: ["Jamaica Center–Parsons/Archer", "Broad St"] },
      { id: "Z", label: "Z", division: "B", color: "#996633", terminals: ["Jamaica Center–Parsons/Archer", "Broad St"] },
      { id: "L", label: "L", division: "B", color: "#A7A9AC", terminals: ["8 Av", "Canarsie–Rockaway Pkwy"] },
      { id: "M", label: "M", division: "B", color: "#FF6319", terminals: ["Forest Hills–71 Av / Middle Village–Metropolitan Av", "Delancey–Essex / 96 St (rush)"] },
      { id: "N", label: "N", division: "B", color: "#FCCC0A", terminals: ["Astoria–Ditmars Blvd", "Coney Island–Stillwell Av"] },
      { id: "Q", label: "Q", division: "B", color: "#FCCC0A", terminals: ["96 St", "Coney Island–Stillwell Av"] },
      { id: "R", label: "R", division: "B", color: "#FCCC0A", terminals: ["Forest Hills–71 Av", "Bay Ridge–95 St"] },
      { id: "W", label: "W", division: "B", color: "#FCCC0A", terminals: ["Astoria–Ditmars Blvd", "Whitehall St–South Ferry"] },
      { id: "SIR", label: "SIR", division: "SIR", color: "#0039A6", terminals: ["St George", "Tottenville"] },
    ],
  };
  saveDatasets(datasets);
  return datasets;
}

function getDatasets() {
  return loadDatasets() || prefillDatasets();
}

// Determine model by 4-digit/3-digit car number, using dataset ranges
function detectModelFromNumber(numStr, rollingStock) {
  const n = parseInt(numStr, 10);
  if (Number.isNaN(n)) return null;
  for (const entry of rollingStock) {
    for (const [lo, hi] of entry.ranges) {
      if (n >= lo && n <= hi) {
        return { model: entry.model, division: entry.division };
      }
    }
  }
  return null;
}

// ----------------------------- UI Bits -----------------------------
function Badge({ label, color, selected, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-white shadow ${
        selected ? "ring-4 ring-white/80 scale-105" : "hover:scale-[1.03]"
      } transition`} 
      style={{ backgroundColor: color }}
      title={label}
    >
      {label}
    </button>
  );
}

function Section({ title, children, actions }) {
  return (
    <div className="bg-white/70 backdrop-blur rounded-2xl shadow p-5 border border-black/5">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-xl font-semibold">{title}</h2>
        <div className="flex gap-2">{actions}</div>
      </div>
      {children}
    </div>
  );
}

function TopNav({ page, setPage }) {
  const tabs = [
    { key: "live", label: "Live Rider" },
    { key: "stats", label: "Stats / Bulk Edit" },
  ];
  return (
    <div className="flex gap-2 p-1 bg-white/60 backdrop-blur rounded-full shadow border border-black/5">
      {tabs.map((t) => (
        <button
          key={t.key}
          onClick={() => setPage(t.key)}
          className={`px-4 py-2 rounded-full text-sm font-medium transition ${
            page === t.key ? "bg-black text-white" : "hover:bg-black/5"
          }`}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}

// ----------------------------- Pages -----------------------------
function LiveRider({ datasets, onAddRide }) {
  const [trainNumber, setTrainNumber] = useState("");
  const [selectedLine, setSelectedLine] = useState(null);
  const [result, setResult] = useState(null);

  const lineGrid = useMemo(() => datasets.lines, [datasets]);

  function handleDetect() {
    if (!trainNumber || !selectedLine) return;
    const found = detectModelFromNumber(trainNumber, datasets.rollingStock);
    const model = found?.model || "Unknown";
    const division = found?.division || "?";
    const ride = {
      id: crypto.randomUUID(),
      trainNumber: trainNumber.trim(),
      line: selectedLine.id,
      lineColor: selectedLine.color,
      model,
      division,
      timestamp: new Date().toISOString(),
    };
    onAddRide(ride);
    setResult(ride);
    setTrainNumber("");
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <Section title="Enter Train Info">
        <div className="space-y-4">
          <label className="block text-sm font-medium">Train car number</label>
          <input
            className="w-full border rounded-xl px-4 py-3 shadow-sm focus:outline-none focus:ring-2 focus:ring-black"
            placeholder="e.g., 8778"
            inputMode="numeric"
            value={trainNumber}
            onChange={(e) => setTrainNumber(e.target.value.replace(/[^0-9]/g, ""))}
          />

          <label className="block text-sm font-medium mt-2">Line</label>
          <div className="grid grid-cols-8 gap-2">
            {lineGrid.map((l) => (
              <Badge
                key={l.id}
                label={l.label}
                color={l.color}
                selected={selectedLine?.id === l.id}
                onClick={() => setSelectedLine(l)}
              />
            ))}
          </div>

          <button
            onClick={handleDetect}
            disabled={!trainNumber || !selectedLine}
            className="mt-4 w-full bg-black text-white rounded-xl py-3 font-semibold shadow hover:opacity-90 disabled:opacity-40"
          >
            Log Ride
          </button>

          <p className="text-xs text-black/60 mt-2">
            Rides are stored in a cookie named <code>{COOKIE_NAME}</code>. Datasets are editable in the Stats page.
          </p>
        </div>
      </Section>

      <Section title="Result & Tips">
        {!result ? (
          <p className="text-black/60">Enter a train number and choose a line to detect the model and save the ride.</p>
        ) : (
          <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-4">
            <Badge label={result.line} color={result.lineColor} />
            <div>
              <div className="text-lg font-semibold">{result.model}</div>
              <div className="text-black/60 text-sm">Division: {result.division}</div>
              <div className="text-black/60 text-sm">Logged: {new Date(result.timestamp).toLocaleString()}</div>
            </div>
          </motion.div>
        )}
        <ul className="list-disc pl-5 mt-4 text-sm text-black/70 space-y-1">
          <li>If a model shows as <em>Unknown</em>, add or adjust ranges under Rolling Stock on the Stats page.</li>
          <li>Car numbers are typically 3–4 digits; SIR uses 3 digits (100–199).</li>
          <li>You can export your ride history as JSON from the Stats page.</li>
        </ul>
      </Section>

      <Section title="Recent Rides (Cookie)">
        <RecentRidesMini />
      </Section>
    </div>
  );
}

function RecentRidesMini() {
  const [rides, setRides] = useCookieRides();
  const lastTen = [...rides].reverse().slice(0, 8);
  return (
    <div className="space-y-2">
      {lastTen.length === 0 && (
        <div className="text-black/60">No rides yet.</div>
      )}
      {lastTen.map((r) => (
        <div key={r.id} className="flex items-center gap-3 p-2 bg-white rounded-xl border border-black/5 shadow-sm">
          <Badge label={r.line} color={r.lineColor} />
          <div className="text-sm">
            <div className="font-medium">{r.model} • #{r.trainNumber}</div>
            <div className="text-black/60">{new Date(r.timestamp).toLocaleString()}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

function StatsPage({ datasets, setDatasets }) {
  const [rides, setRides] = useCookieRides();

  function exportRides() {
    const blob = new Blob([JSON.stringify(rides, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `nyc-rides-${new Date().toISOString().slice(0,10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function clearRides() {
    if (!confirm("Delete ALL rides from cookies?")) return;
    setRides([]);
  }

  function addStock() {
    setDatasets({
      ...datasets,
      rollingStock: [...datasets.rollingStock, { model: "New Model", ranges: [[0, 0]], division: "A" }],
    });
  }

  function addLine() {
    setDatasets({
      ...datasets,
      lines: [...datasets.lines, { id: "X", label: "X", division: "B", color: "#000000", terminals: ["Terminus A", "Terminus B"] }],
    });
  }

  function prefill() {
    const seeded = prefillDatasets();
    setDatasets(seeded);
  }

  function updateStock(idx, field, value) {
    const next = { ...datasets };
    next.rollingStock = datasets.rollingStock.map((s, i) =>
      i === idx ? { ...s, [field]: value } : s
    );
    setDatasets(next);
  }

  function updateStockRange(idx, rIdx, which, value) {
    const v = parseInt(value || "0", 10);
    const next = { ...datasets };
    next.rollingStock = datasets.rollingStock.map((s, i) => {
      if (i !== idx) return s;
      const ranges = s.ranges.map((r, j) => (j === rIdx ? [which === 0 ? v : r[0], which === 1 ? v : r[1]] : r));
      return { ...s, ranges };
    });
    setDatasets(next);
  }

  function addRange(idx) {
    const next = { ...datasets };
    next.rollingStock[idx].ranges = [...next.rollingStock[idx].ranges, [0, 0]];
    setDatasets(next);
  }

  function removeStock(idx) {
    const next = { ...datasets };
    next.rollingStock = datasets.rollingStock.filter((_, i) => i !== idx);
    setDatasets(next);
  }

  function updateLine(idx, field, value) {
    const next = { ...datasets };
    next.lines = datasets.lines.map((l, i) => (i === idx ? { ...l, [field]: value } : l));
    setDatasets(next);
  }

  function removeLine(idx) {
    const next = { ...datasets };
    next.lines = datasets.lines.filter((_, i) => i !== idx);
    setDatasets(next);
  }

  function save() {
    saveDatasets(datasets);
    alert("Datasets saved to localStorage.");
  }

  function importRides(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result));
        if (!Array.isArray(parsed)) throw new Error("Expected an array of rides");
        setRides(parsed);
        alert("Imported rides into cookie.");
      } catch (err) {
        alert("Invalid JSON: " + err.message);
      }
    };
    reader.readAsText(file);
  }

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
      <Section
        title="Rolling Stock (Editable)"
        actions={
          <div className="flex gap-2">
            <button onClick={addStock} className="px-3 py-2 rounded-lg bg-black text-white text-sm">Add Model</button>
            <button onClick={prefill} className="px-3 py-2 rounded-lg bg-black/80 text-white text-sm">Prefill 2025 dataset</button>
            <button onClick={save} className="px-3 py-2 rounded-lg bg-emerald-600 text-white text-sm">Save</button>
          </div>
        }
      >
        <div className="space-y-3 max-h-[60vh] overflow-auto pr-1">
          {datasets.rollingStock.map((s, idx) => (
            <div key={idx} className="p-3 rounded-xl border bg-white shadow-sm">
              <div className="flex gap-3 items-center">
                <input
                  className="border rounded-lg px-3 py-2 w-40"
                  value={s.model}
                  onChange={(e) => updateStock(idx, "model", e.target.value)}
                />
                <select
                  className="border rounded-lg px-3 py-2"
                  value={s.division}
                  onChange={(e) => updateStock(idx, "division", e.target.value)}
                >
                  <option>A</option>
                  <option>B</option>
                  <option>SIR</option>
                </select>
                <button onClick={() => addRange(idx)} className="ml-auto text-sm px-2 py-1 bg-black text-white rounded-lg">Add Range</button>
                <button onClick={() => removeStock(idx)} className="text-sm px-2 py-1 bg-red-600 text-white rounded-lg">Delete</button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
                {s.ranges.map((r, rIdx) => (
                  <div key={rIdx} className="flex items-center gap-2">
                    <span className="text-xs text-black/60">Range {rIdx + 1}</span>
                    <input className="border rounded px-2 py-1 w-24" value={r[0]} onChange={(e) => updateStockRange(idx, rIdx, 0, e.target.value)} />
                    <span>–</span>
                    <input className="border rounded px-2 py-1 w-24" value={r[1]} onChange={(e) => updateStockRange(idx, rIdx, 1, e.target.value)} />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section
        title="Subway Lines (Editable)"
        actions={
          <div className="flex gap-2">
            <button onClick={addLine} className="px-3 py-2 rounded-lg bg-black text-white text-sm">Add Line</button>
            <button onClick={save} className="px-3 py-2 rounded-lg bg-emerald-600 text-white text-sm">Save</button>
          </div>
        }
      >
        <div className="space-y-3 max-h-[60vh] overflow-auto pr-1">
          {datasets.lines.map((l, idx) => (
            <div key={idx} className="p-3 rounded-xl border bg-white shadow-sm">
              <div className="flex flex-wrap gap-3 items-center">
                <div className="flex items-center gap-2">
                  <Badge label={l.label} color={l.color} />
                </div>
                <input className="border rounded px-3 py-2 w-20" value={l.id} onChange={(e) => updateLine(idx, "id", e.target.value)} />
                <input className="border rounded px-3 py-2 w-24" value={l.label} onChange={(e) => updateLine(idx, "label", e.target.value)} />
                <select className="border rounded px-3 py-2" value={l.division} onChange={(e) => updateLine(idx, "division", e.target.value)}>
                  <option>A</option>
                  <option>B</option>
                  <option>SIR</option>
                </select>
                <input className="border rounded px-3 py-2 w-36" value={l.color} onChange={(e) => updateLine(idx, "color", e.target.value)} />
                <input className="border rounded px-3 py-2 flex-1" value={l.terminals[0]} onChange={(e) => updateLine(idx, "terminals", [e.target.value, l.terminals[1]])} />
                <input className="border rounded px-3 py-2 flex-1" value={l.terminals[1]} onChange={(e) => updateLine(idx, "terminals", [l.terminals[0], e.target.value])} />
                <button onClick={() => removeLine(idx)} className="text-sm px-2 py-1 bg-red-600 text-white rounded-lg ml-auto">Delete</button>
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section
        title="Ride History (Cookie)"
        actions={
          <div className="flex gap-2">
            <button onClick={exportRides} className="px-3 py-2 rounded-lg bg-black text-white text-sm">Export JSON</button>
            <label className="px-3 py-2 rounded-lg bg-black/80 text-white text-sm cursor-pointer">
              Import JSON
              <input type="file" accept="application/json" className="hidden" onChange={importRides} />
            </label>
            <button onClick={clearRides} className="px-3 py-2 rounded-lg bg-red-600 text-white text-sm">Clear All</button>
          </div>
        }
      >
        <RideTable rides={rides} setRides={setRides} />
      </Section>
    </div>
  );
}

function RideTable({ rides, setRides }) {
  const [query, setQuery] = useState("");
  const filtered = rides.filter((r) => {
    const q = query.toLowerCase();
    return (
      r.trainNumber?.toLowerCase().includes(q) ||
      r.model?.toLowerCase().includes(q) ||
      r.line?.toLowerCase().includes(q)
    );
  });

  function deleteRide(id) {
    setRides(rides.filter((r) => r.id !== id));
  }

  function clearFilter() {
    setQuery("");
  }

  return (
    <div>
      <div className="flex gap-2 mb-3">
        <input
          className="border rounded-xl px-3 py-2 flex-1"
          placeholder="Filter by line, model, or number"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <button onClick={clearFilter} className="px-3 py-2 rounded-lg bg-black text-white text-sm">Reset</button>
      </div>

      <div className="overflow-auto max-h-[50vh] rounded-xl border">
        <table className="min-w-full text-sm">
          <thead className="bg-black text-white sticky top-0">
            <tr>
              <th className="text-left p-2">Time</th>
              <th className="text-left p-2">Line</th>
              <th className="text-left p-2">Car #</th>
              <th className="text-left p-2">Model</th>
              <th className="text-left p-2">Division</th>
              <th className="text-left p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="p-4 text-center text-black/60">No rides match.</td>
              </tr>
            )}
            {filtered.map((r) => (
              <tr key={r.id} className="odd:bg-white even:bg-black/5">
                <td className="p-2">{new Date(r.timestamp).toLocaleString()}</td>
                <td className="p-2">
                  <div className="flex items-center gap-2">
                    <Badge label={r.line} color={r.lineColor} />
                    <span>{r.line}</span>
                  </div>
                </td>
                <td className="p-2">#{r.trainNumber}</td>
                <td className="p-2">{r.model}</td>
                <td className="p-2">{r.division}</td>
                <td className="p-2">
                  <button onClick={() => deleteRide(r.id)} className="px-2 py-1 bg-red-600 text-white rounded-lg text-xs">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ----------------------------- Root App -----------------------------
export default function App() {
  const [page, setPage] = useState("live");
  const [datasets, setDatasets] = useState(getDatasets());

  const [rides, setRides] = useCookieRides();

  function onAddRide(ride) {
    setRides([...rides, ride]);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 to-slate-200 text-slate-900">
      <header className="max-w-6xl mx-auto px-4 pt-8 pb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-black text-white grid place-items-center font-bold">NYC</div>
          <div>
            <h1 className="text-2xl font-bold">Subway Ride Tracker</h1>
            <p className="text-sm text-black/60">Log rides in Live mode • Edit datasets and review history in Stats</p>
          </div>
        </div>
        <TopNav page={page} setPage={setPage} />
      </header>

      <main className="max-w-6xl mx-auto px-4 pb-12">
        {page === "live" ? (
          <LiveRider datasets={datasets} onAddRide={onAddRide} />
        ) : (
          <StatsPage datasets={datasets} setDatasets={setDatasets} />
        )}
      </main>

      <footer className="max-w-6xl mx-auto px-4 pb-8 text-xs text-black/60">
        This is a personal tracker. Fleet ranges and terminals can change; refine in Stats.
      </footer>
    </div>
  );
}

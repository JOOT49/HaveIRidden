import React, { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const COOKIE_NAME = "nyc_subway_rides";

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
    const maxAge = 60 * 60 * 24 * 400;
    document.cookie = `${COOKIE_NAME}=${value}; Max-Age=${maxAge}; Path=/`;
  } catch {}
}

function useCookieRides() {
  const [rides, setRides] = useState(readRidesFromCookie());
  useEffect(() => writeRidesToCookie(rides), [rides]);
  return [rides, setRides];
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

function Badge({ label, color, selected, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-white transition-all ${
        selected ? "ring-4 ring-white/70 scale-110" : "hover:scale-105"
      }`}
      style={{ backgroundColor: color }}
    >
      {label}
    </button>
  );
}

function Section({ title, children, actions }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-neutral-800/70 border border-neutral-700 rounded-2xl p-5 shadow-lg shadow-black/30 w-full max-w-5xl"
    >
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold text-white tracking-wide">{title}</h2>
        {actions && <div className="flex gap-2">{actions}</div>}
      </div>
      {children}
    </motion.div>
  );
}

// Map approximate build years → gradient colors
const MODEL_GRADIENTS = {
  R32: ["from-[#7f1d1d]", "to-[#ef4444]"],
  R46: ["from-[#9a3412]", "to-[#f97316]"],
  R62: ["from-[#92400e]", "to-[#f59e0b]"],
  R68: ["from-[#78350f]", "to-[#fbbf24]"],
  R142: ["from-[#0e7490]", "to-[#06b6d4]"],
  R160: ["from-[#0284c7]", "to-[#38bdf8]"],
  R188: ["from-[#0d9488]", "to-[#34d399]"],
  R211: ["from-[#16a34a]", "to-[#86efac]"],
};

function getGradientForModel(model) {
  return MODEL_GRADIENTS[model] || ["from-gray-700", "to-gray-500"];
}

function LiveRider({ datasets, onAddRide }) {
  const [trainNumber, setTrainNumber] = useState("");
  const [selectedLine, setSelectedLine] = useState(null);
  const [result, setResult] = useState(null);

  const lineGrid = useMemo(() => datasets?.lines || [], [datasets]);
  const found = detectModelFromNumber(trainNumber, datasets.rollingStock);

  function handleDetect() {
    if (!trainNumber || !selectedLine) return;
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
    <div className="pt-6 px-4 sm:px-8 space-y-5 max-w-2xl mx-auto">
      <Section title="Live Rider Mode">
        <div className="space-y-5">
          <input
            className="w-full bg-neutral-900 text-white border border-neutral-700 rounded-xl px-4 py-3 text-xl text-center font-semibold shadow-inner focus:outline-none focus:ring-2 focus:ring-white"
            placeholder="Enter train car number (e.g. 8778)"
            inputMode="numeric"
            value={trainNumber}
            onChange={(e) => setTrainNumber(e.target.value.replace(/[^0-9]/g, ""))}
          />

          <div className="text-center text-white/70 text-sm">Select the line you’re on</div>
          <div className="grid grid-cols-6 sm:grid-cols-8 gap-2 justify-center">
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

          <AnimatePresence>
            {trainNumber && selectedLine && (
              <motion.div
                key="preview"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                transition={{ duration: 0.4 }}
                className="text-center mt-3"
              >
                <p className="text-4xl sm:text-5xl font-extrabold text-white drop-shadow-lg">
                  You’re riding an{" "}
                  <span className="text-green-400">{found?.model || "Unknown"}</span>
                </p>
                <p className="text-xl text-white/70 mt-1">
                  on the <span style={{ color: selectedLine.color }}>{selectedLine.label}</span> line 🚇
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          <button
            onClick={handleDetect}
            disabled={!trainNumber || !selectedLine}
            className="w-full bg-white text-black rounded-xl py-3 mt-3 text-lg font-semibold hover:bg-neutral-200 transition disabled:opacity-40"
          >
            Log Ride
          </button>
        </div>
      </Section>

      {result && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-neutral-800/70 border border-neutral-700 rounded-2xl p-5 text-white text-center shadow-lg"
        >
          <p className="text-lg">✅ Ride logged successfully!</p>
          <p className="text-sm text-white/70 mt-1">
            {result.model} on {result.line}
          </p>
        </motion.div>
      )}
    </div>
  );
}

function RideManager({ datasets }) {
  const [rides, setRides] = useCookieRides();
  const [hideRidden, setHideRidden] = useState(false);
  const [hideUnridden, setHideUnridden] = useState(false);

  const riddenModels = new Set(rides.map((r) => r.model));
  const riddenLines = new Set(rides.map((r) => r.line));

  function clearRides() {
    if (confirm("Are you sure you want to delete all rides?")) setRides([]);
  }

  const filteredModels = datasets.rollingStock.filter((s) => {
    if (hideRidden && riddenModels.has(s.model)) return false;
    if (hideUnridden && !riddenModels.has(s.model)) return false;
    return true;
  });

  const filteredLines = datasets.lines.filter((l) => {
    if (hideRidden && riddenLines.has(l.id)) return false;
    if (hideUnridden && !riddenLines.has(l.id)) return false;
    return true;
  });

  const modelProgress = (riddenModels.size / datasets.rollingStock.length) * 100;
  const lineProgress = (riddenLines.size / datasets.lines.length) * 100;

  return (
    <div className="pt-6 px-4 sm:px-8 flex flex-col items-center text-center space-y-8">
      <Section
        title="Ride History"
        actions={
          <button
            onClick={clearRides}
            className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700"
          >
            Clear All
          </button>
        }
      >
        <div className="overflow-auto max-h-[55vh] rounded-xl border border-neutral-700">
          <table className="min-w-full text-sm text-white/80">
            <thead className="bg-neutral-900 text-white">
              <tr>
                <th className="p-2 text-left">Time</th>
                <th className="p-2 text-left">Line</th>
                <th className="p-2 text-left">Car #</th>
                <th className="p-2 text-left">Model</th>
              </tr>
            </thead>
            <tbody>
              {rides.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-5 text-center text-neutral-400">
                    No rides logged yet.
                  </td>
                </tr>
              )}
              {rides.map((r) => (
                <tr key={r.id} className="odd:bg-neutral-800 even:bg-neutral-850 hover:bg-neutral-700 transition">
                  <td className="p-2">{new Date(r.timestamp).toLocaleString()}</td>
                  <td className="p-2 flex items-center gap-2 justify-center">
                    <Badge label={r.line} color={r.lineColor} /> {r.line}
                  </td>
                  <td className="p-2">#{r.trainNumber}</td>
                  <td className="p-2">{r.model}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <Section title="Your Progress">
        <div className="flex gap-4 items-center justify-center mb-4">
          <label className="flex items-center gap-2 text-white/80">
            <input
              type="checkbox"
              checked={hideRidden}
              onChange={(e) => setHideRidden(e.target.checked)}
              className="w-4 h-4 accent-green-500"
            />
            Hide ridden
          </label>
          <label className="flex items-center gap-2 text-white/80">
            <input
              type="checkbox"
              checked={hideUnridden}
              onChange={(e) => setHideUnridden(e.target.checked)}
              className="w-4 h-4 accent-green-500"
            />
            Hide un-ridden
          </label>
        </div>

        <div className="space-y-10 w-full">
          {/* Train Models */}
          <div>
            <h3 className="font-semibold text-white/80 text-lg mb-2">
              Train Models ({riddenModels.size}/{datasets.rollingStock.length})
            </h3>
            <motion.div className="w-full bg-neutral-700 rounded-full h-2 mb-4 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${modelProgress}%` }}
                transition={{ duration: 0.6 }}
                className="h-2 bg-green-500 rounded-full"
              />
            </motion.div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredModels.map((s) => {
                const [from, to] = getGradientForModel(s.model);
                const ridden = riddenModels.has(s.model);
                return (
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.97 }}
                    key={s.model}
                    className={`p-4 rounded-xl font-medium shadow-md border border-neutral-700 text-white cursor-pointer ${
                      ridden ? "opacity-90" : "opacity-100"
                    }`}
                    style={{
                      backgroundImage: `linear-gradient(135deg, var(--tw-gradient-stops))`,
                    }}
                  >
                    <div className={`bg-gradient-to-br ${from} ${to} rounded-xl p-4`}>
                      <div className="flex justify-between items-center">
                        <span>{s.model}</span>
                        <input
                          type="checkbox"
                          checked={ridden}
                          readOnly
                          className="w-5 h-5 accent-green-400"
                        />
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* Subway Lines */}
          <div>
            <h3 className="font-semibold text-white/80 text-lg mb-2">
              Subway Lines ({riddenLines.size}/{datasets.lines.length})
            </h3>
            <motion.div className="w-full bg-neutral-700 rounded-full h-2 mb-4 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${lineProgress}%` }}
                transition={{ duration: 0.6 }}
                className="h-2 bg-green-500 rounded-full"
              />
            </motion.div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredLines.map((l) => {
                const ridden = riddenLines.has(l.id);
                return (
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.97 }}
                    key={l.id}
                    className={`p-4 rounded-xl border text-white font-medium ${
                      ridden ? "opacity-90" : "opacity-100"
                    }`}
                    style={{
                      borderColor: l.color,
                      boxShadow: `0 0 10px ${l.color}55`,
                    }}
                  >
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <Badge label={l.label} color={l.color} />
                        <span>{l.label}</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={ridden}
                        readOnly
                        className="w-5 h-5 accent-green-400"
                      />
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>
      </Section>
    </div>
  );
}

export default function App() {
  const [page, setPage] = useState("live");
  const [datasets, setDatasets] = useState(null);
  const [rides, setRides] = useCookieRides();

  useEffect(() => {
    fetch("/data/datasets.json")
      .then((r) => r.json())
      .then(setDatasets)
      .catch((err) => console.error("Failed to load datasets", err));
  }, []);

  function onAddRide(ride) {
    setRides([...rides, ride]);
  }

  if (!datasets) return <div className="p-10 text-center text-neutral-400">Loading datasets…</div>;

  return (
    <div className="min-h-screen bg-neutral-900 text-neutral-100 font-sans">
      <div className="fixed top-0 w-full backdrop-blur-lg bg-neutral-900/80 border-b border-neutral-800 shadow-md z-50 flex flex-col items-center py-3">
        <div className="text-white text-lg font-semibold mb-2">NYC Subway Tracker 🚇</div>
        <div className="flex gap-2 bg-neutral-800/80 rounded-full border border-neutral-700 p-1">
          <button
            onClick={() => setPage("live")}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition ${
              page === "live" ? "bg-white text-black" : "text-white hover:bg-neutral-700"
            }`}
          >
            Live Rider
          </button>
          <button
            onClick={() => setPage("manager")}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition ${
              page === "manager" ? "bg-white text-black" : "text-white hover:bg-neutral-700"
            }`}
          >
            Stats
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {page === "live" ? (
          <motion.div
            key="live"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
          >
            <LiveRider datasets={datasets} onAddRide={onAddRide} />
          </motion.div>
        ) : (
          <motion.div
            key="manager"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
          >
            <RideManager datasets={datasets} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

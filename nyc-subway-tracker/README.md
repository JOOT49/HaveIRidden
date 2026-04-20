# HaveIRidden?

A personal transit tracker for the NYC Subway and Washington Metro (WMATA). Log the train car you're riding, track stations you've visited, and monitor your progress across both systems.

Live at **[haveiridden.joot49.org](https://haveiridden.joot49.org)**

---

## Systems

### NYC Subway

Enter the 3–4 digit car number from inside your subway car, pick the line you're on, and the app identifies the rolling stock model (R142, R160B, R211A, etc.) based on MTA fleet number ranges. Rides are saved to localStorage so your history persists across sessions.

The **Stats** page shows your progress toward riding every model and every line, a full ride history table, and editable datasets so you can keep fleet data up to date as the MTA reassigns cars.

### Washington Metro (WMATA)

Log trips by selecting the line you boarded, where you got on, and where you got off. If you exit at a transfer station and continue on a different line, the exit station picker groups all Metro lines together — your board line appears first, and every other line is listed below it. Picking a station on a different line automatically records the transfer.

Visited stations are tracked per line and shown on the **Stats → Stations** page, where you can also manually mark or unmark stops.

---

## Features

### NYC Subway
- **Live Rider** — enter a car number and tap a line bullet to instantly see the rolling stock model before logging
- **Progress tracking** — visual checklists and progress bars for train models and subway lines
- **Ride history** — searchable table with export (JSON) and import support
- **Editable datasets** — rolling stock number ranges and line data are stored in `localStorage` and fully editable in-app under Stats → Settings

### Washington Metro
- **Live Rider** — three-step flow: pick your line, pick where you boarded, pick where you exited (with all lines available for transfers)
- **Station tracking** — tap any station to mark it visited; filter by visited/unvisited, mark entire lines at once
- **Progress tracking** — per-line coverage bars, unique station count, trip total, and transfer count
- **Trip history** — full log of every trip with board station, exit station, and transfer line
- **Export/import** — save and restore your data as JSON

---

## How to log a ride

### NYC Subway

1. Find the **car number** printed above the doors or on the end wall of your subway car — it's a 3 or 4 digit number.
2. Open the app, type the number into the input field on the **Live Rider** page.
3. Tap your line's bullet circle.
4. The model is shown instantly. Hit **LOG RIDE** to save it.

### Washington Metro

1. On the **Live Rider** page, tap the line you boarded.
2. Select the station where you got on.
3. Select the station where you got off — all six lines are shown in the picker, grouped with your board line first. If you transferred, scroll down and pick your exit station from the other line.
4. Hit **LOG TRIP** to save.

---

## System selector

On first load you'll be asked to choose between NYC Subway and WMATA. Your choice is saved in a browser cookie and persists across sessions. You can switch systems at any time using the **Switch →** button in the header.

---

## Updating fleet data (NYC)

MTA car assignments change over time. To update the rolling stock ranges or add new lines:

1. Go to **Stats → Settings**
2. Edit the number ranges per model, or add/remove lines
3. Hit **Save** — changes are stored in your browser's `localStorage`

To reset everything back to the built-in defaults, hit **↺ Reset**.

---

## Tech stack

| Thing | What |
|---|---|
| Framework | React 19 (Vite) |
| Animation | Framer Motion |
| Styling | Inline styles + CSS variables |
| Fonts | Barlow Condensed, Barlow, IBM Plex Sans (Google Fonts) |
| Storage | Cookie (system preference) + localStorage (rides, visited stations, datasets) |
| PWA | VitePWA / Workbox — full offline support |
| Hosting | Vercel / GitHub Pages |

---

## Getting started

```bash
git clone https://github.com/JOOT49/HaveIRidden.git
cd HaveIRidden/nyc-subway-tracker
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

---

## Data storage

All data is stored locally in your browser — nothing is sent to any server.

| Key | Contents |
|---|---|
| `transit_system_v1` | Cookie — which system you last used |
| `nyc_subway_rides_v2` | NYC ride history |
| `nyc_subway_datasets_v1` | Your edited NYC fleet/line data |
| `nyc_subway_remote_cache_v1` | Cached remote fleet data for offline use |
| `wmata_visited_v1` | WMATA visited station set |
| `wmata_rides_v1` | WMATA trip history |

You can export your data as JSON from **Stats → Trip History → Export** (WMATA) or **Stats → History → Export** (NYC) and re-import it on another device.

---

## License

MIT License
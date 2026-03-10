# HaveIRidden?

A personal NYC subway ride tracker. Log the train car you're riding, auto-detect the rolling stock model, and track your progress across every line and fleet type.

Live at **[haveiridden.joot49.org](https://haveiridden.joot49.org)**

---

## What it does

Enter the 3–4 digit car number from inside your subway car, pick the line you're on, and the app identifies the rolling stock model (R142, R160B, R211A, etc.) based on MTA fleet number ranges. Rides are saved to a browser cookie so your history persists across sessions.

The **Stats** page shows your progress toward riding every model and every line, a full ride history table, and editable datasets so you can keep fleet data up to date as the MTA reassigns cars.

---

## Features

- **Live Rider** — enter a car number and tap a line bullet to instantly see the rolling stock model before logging
- **Progress tracking** — visual checklists and progress bars for train models and subway lines
- **Ride history** — searchable table with export (JSON) and import support
- **Editable datasets** — rolling stock number ranges and line data are stored in `localStorage` and fully editable in-app
- **No account needed** — everything lives in your browser (cookie + localStorage)

---

## Tech stack

| Thing | What |
|---|---|
| Framework | React 18 (Vite) |
| Animation | Framer Motion |
| Styling | Inline styles + CSS variables |
| Fonts | Barlow Condensed, Barlow (Google Fonts) |
| Storage | Browser cookie (rides) + localStorage (datasets) |
| Hosting | Vercel |

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

## How to log a ride

1. Find the **car number** printed above the doors or on the end wall of your subway car — it's a 3 or 4 digit number.
2. Open the app, type the number into the input field on the **Live Rider** page.
3. Tap your line's bullet circle.
4. The model is shown instantly. Hit **LOG RIDE** to save it.

---

## Updating fleet data

MTA car assignments change over time. To update the rolling stock ranges or add new lines:

1. Go to **Stats → Settings**
2. Edit the number ranges per model, or add/remove lines
3. Hit **Save** — changes are stored in your browser's `localStorage`

To reset everything back to the built-in 2025 defaults, hit **↺ Reset**.
I'll do my best to keep the default dataset up to date, but feel free to customize it if you notice any discrepancies or want to track additional lines/models.

---

## Data storage

Rides are stored in a browser cookie named `nyc_subway_rides` (expires after 400 days). Dataset customizations are stored in `localStorage` under the key `nyc_subway_datasets_v1`. Neither is synced anywhere — it's all local to your device and browser.

You can export your ride history as a JSON file from **Stats → History → Export** and re-import it on another device.

---

## License

MIT License

Copyright (c) [2026] [JOOT49]

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

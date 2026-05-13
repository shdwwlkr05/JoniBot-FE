# Open Time 2.0 — User Guide

## Overview

Open Time 2.0 replaces the original Open Time list view with an interactive **calendar-based layout**. Available shifts are displayed directly on the day they occur, color-coded by type, and can be added to your bid with a single click. Your bid list supports drag-and-drop reordering, and the entire interface updates in real time as you make changes.

---

## Getting Started

Navigate to **Open Time 2.0** from the nav bar. The page loads automatically and displays:

- The **bid month and close date** at the top (e.g. "Open Time for April 2026 - Closes March 28 at 0600").
- Your **rank** within your workgroup (e.g. "Rank: 12 / 45").

> ![Screenshot: Full page on initial load showing the header with month, close date, and rank badge](screenshots/01-full-page.png)

---

## Calendar Grid

The calendar displays the bid month in a standard weekly grid (Sunday through Saturday). Each day cell shows all available open-time shifts as color-coded tags.

### Reading a Day Cell

- **Day number** — shown in bold at the top-left of each cell.
- **Your scheduled shift** — if you are already working that day, your assigned shift code appears in a black tag below the day number (e.g. `A06N`). The day cell background turns **yellow** to indicate a workday.
- **Available shifts** — each open shift is shown as a clickable color-coded button. Hover over any shift to see a tooltip with the shift code and start time.
- If a day has more shifts than can fit, the cell scrolls — a fade effect at the top or bottom indicates more content.

> ![Screenshot: Close-up of a few day cells — one workday (yellow) with the assigned shift tag and several available shifts, and one off day (white) with shifts](screenshots/02-day-cells.png)

### Shift Color Coding

Click the **Legend** link in the toolbar to reveal the color key.

#### FS Workgroup Colors

| Color | Meaning |
|-------|---------|
| Light Pink | Domestic AM |
| Medium Purple | Domestic PM |
| Dark Purple | Domestic Mid |
| Gold/Orange | LAT (Latin America) |
| Blue | NAT (North Atlantic) |
| Yellow | PAC (Pacific) |

#### SOM Workgroup Colors

| Color | Meaning |
|-------|---------|
| Pink | Day Fleet |
| Dark Blue | Night Fleet |
| Cyan | Terminal desks (C, D, E) |
| Light Blue | Airborne desks (F, G, H) |
| Red | Regional desks (J, K) |

The SOM legend also includes a **Fleet Desks** reference showing which letter maps to which aircraft type (e.g. **Q** = B738/B73R/B73J, **Y** = A330/A350).

> ![Screenshot: Legend panel expanded, showing the shift color key](screenshots/03-legend.png)

---

## Filters

Click the **Filters** link in the toolbar to reveal the filter panel. Filters let you narrow down which shifts are visible in the calendar. Unmatched shifts are hidden — they are not removed from your bid.

### Available Filters

| Filter | Description |
|--------|-------------|
| **Hide my workdays** | Collapses day cells where you are already scheduled, so you can focus on your off days. |
| **AM / PM / Mid** | Show only shifts starting in that time window. Check one or more; if none are checked, all times are shown. |
| **Dom / Intl** (FS only) | Filter by domestic or international. The Intl checkbox only appears if you hold an INTL qualification. |
| **Fleet / SPT** (SOM only) | Filter by fleet or SPT desk shifts. The SPT checkbox only appears if you hold an SPT qualification. |

> ![Screenshot: Filter panel expanded with some filters checked, showing the calendar with reduced shifts visible](screenshots/04-filters.png)

---

## Building Your Bid

### Adding Shifts

Click any shift tag in the calendar to add it to your bid. The shift disappears from the calendar grid to confirm it has been selected. Your pick appears at the bottom of the **My Bid** table.

### Viewing Your Bid

The **My Bid** table below the calendar shows all your current picks in priority order:

| Column | Description |
|--------|-------------|
| **#** | Your preference rank (1 = first choice) |
| **Day** | Day of the month |
| **Shift** | Shift code |
| **Start** | Shift start time (FS workgroup only) |

> ![Screenshot: My Bid table with several picks listed, showing rank numbers, day, shift code, start time, and remove buttons](screenshots/05-my-bid.png)

### Reordering Picks

Drag and drop any row in the My Bid table to change its priority. Grab a row and move it up or down — the rank numbers update automatically.

### Removing Picks

Click the **X** button on the right side of any row to remove that shift from your bid. The shift reappears in the calendar grid.

---

## Limiting Awards

Below the bid table, check **Limit My Awards** to cap how many open-time shifts you can be awarded.

When enabled, two dropdowns appear:

- **Max** — the maximum number of awards (1 through 10).
- **Per** — the award period: **Month** or **Pay Period**.

For example, setting Max to **2** and Per to **Pay Period** means you will receive at most 2 open-time awards per pay period.

> ![Screenshot: Limit My Awards section with the checkbox checked, showing the Max and Per dropdowns](screenshots/06-limit-awards.png)

---

## Saving and Reverting

At the bottom of the page are two buttons and a status indicator:

| Element | Description |
|---------|-------------|
| **Save** | Submits your current bid and award-limit settings to the server. |
| **Revert** | Discards all unsaved changes and restores your last saved bid. |
| **Status indicator** | Shows the current state of your bid: |

### Status Messages

- **Unsaved changes** (yellow) — you have made changes that have not been saved yet.
- **Saved** (green) — your bid was saved successfully.
- **Save failed** (red) — something went wrong. Try again or check your connection.

> ![Screenshot: Save/Revert buttons with the status indicator showing "Unsaved changes"](screenshots/07-save-revert.png)

---

## Tips

- **Hover for details** — hover over any shift in the calendar to see its start time in a tooltip.
- **Use filters to focus** — if you only want PM shifts, check the PM filter to hide everything else. Your existing picks are unaffected.
- **Hide workdays** — if you don't want to bid on days you're already working, toggle "Hide my workdays" to collapse those cells entirely.
- **Save often** — the app warns you about unsaved changes, but saves do not happen automatically. Click Save when you're happy with your selections.
- **Revert is safe** — Revert only rolls back to your last save. It won't clear a bid that was previously submitted.
- **Rank matters** — shifts at the top of your bid list (rank 1) are your highest priority. The system awards shifts in rank order based on your seniority position.

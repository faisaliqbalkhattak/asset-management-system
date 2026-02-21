# Process Management System — User Manual

> **Version:** 2.1 | **Updated:** 20 February 2026 | **Platform:** Offline Desktop (Windows)

---

## 1. Overview

This application manages the full lifecycle of a plant/quarry operation:

1. **Setup** — register equipment, employees, and expense categories.
2. **Record** — enter daily operations, fuel, trips, expenses, and salaries.
3. **Track** — log daily production and monthly sales/stock.
4. **Analyse** — view expense summaries (monthly, yearly) and calculate profit shares.

---

## 2. Dashboard

The landing screen shows quick-glance statistics — total equipment, active employees, and recent activity. The top navigation bar provides access to every module.

---

## 3. Modules

### 3.1 Masters (One-Time Setup)

| Section | Purpose |
|---------|---------|
| **Human Resources** | Add employees with designations and base salaries. |
| **Equipment** | Register generators, excavators, loaders, and dumpers. Toggle the *Active* flag to show/hide equipment in daily entry forms. Equipment registered here automatically generates columns in summary reports. |
| **Expense Categories** | Create categories for blasting items, plant expenses, and miscellaneous items. |

### 3.2 Daily Entries

The primary data-entry module, organised into tabs:

| Tab | What to Record |
|-----|---------------|
| **Generators** | Running hours, fuel consumed, fuel rate. Rent is pre-filled but editable. |
| **Excavator** | Hours, fuel, and up to two miscellaneous expense fields. |
| **Loaders** | Same structure as Excavator. |
| **Dumpers** | Trips and fuel per registered dumper. |
| **Blasting Material** | Explosive purchases and usage. |
| **Langar / Plant Exp / Misc** | Kitchen expenses, plant repairs, and general miscellaneous costs. |
| **Salaries** | Monthly salary records generated from base salary in Masters. Adjustable for deductions or bonuses. |

All forms display toast notifications on success or error.

### 3.3 Production

#### Daily Production

| Field | Description |
|-------|-------------|
| Gravel Input (CFT) | Total gravel processed. |
| Clay & Dust (%) | Default 33.33 %. Deducted from gravel to produce usable aggregate. |
| Net Aggregate | Equals aggregate produced (gravel minus clay/dust). Allowance is applied at the monthly level, not here. |

A process-flow diagram displays the live calculation: **Gravel → Clay/Dust Deduction → Net Aggregate**.

Use the **Edit** and **Delete** buttons in the Production History table to correct past entries.

#### Monthly Sales & Stock

| Field | Description |
|-------|-------------|
| Allowance & Margin (%) | Default 15 %. Applied to the monthly aggregate total. |
| Quantity Sold (CFT) | Material sold to customers. |
| Total Sale Amount (PKR) | Cash received from sales. |
| Expected Stock Rate (/CFT) | Estimated value per CFT of unsold stock. |

**Stock & Value Analysis** (7 cards, real-time):

| Card | Meaning |
|------|---------|
| Aggregate Produced | Monthly total before allowance. |
| Allowance Deduction | Percentage and CFT deducted. |
| Net Production | After allowance. |
| Remaining Stock | Net Production minus Sold. |
| Selling Price / CFT | Sale amount ÷ sold quantity. |
| Est. Stock Value | Remaining stock × expected rate. |
| Total Revenue | Sales + stock value. |

### 3.4 Monthly Summary

A consolidated expense report with dynamically generated columns:

- **Equipment columns** — auto-created from registered generators, excavators, and loaders.
- **Dumper columns** — one column per registered dumper, plus a misc column each.
- **Fixed categories** — Blasting, Langar, Plant Expenses, HR Salaries.
- **Misc excluded** — miscellaneous expenses are tracked in a separate reference card and are **not** included in the main Total.

Use the Month/Year filters to narrow the view. Summary cards show the expense breakdown, misc reference totals, and overall balance.

### 3.5 Yearly Summary

Annual view of all expense categories by month.

- **Dynamic categories** — cards and table columns update automatically when equipment is added or removed in Masters.
- **Quarterly breakdown** — expenses, production, and cost-per-CFT per quarter.
- **Misc excluded** — same treatment as Monthly Summary.

### 3.6 Profit Sharing

Calculates partner profit distribution:

| Step | Calculation |
|------|-------------|
| **Gross Revenue** | Cash Received + Stock Value |
| **Total Expenses** | Sum of all operational costs (excludes misc) |
| **Net Profit** | Gross Revenue − Total Expenses |

Profit is then split according to the configured partner ratios.

---

## 4. Correcting Data

| Scenario | Where to Go |
|----------|-------------|
| Wrong daily entry | **Transactions** page — filter, then Edit or Delete. |
| Wrong production entry | **Production** page → History table → Edit / Delete. |
| Wrong monthly sales | **Production** page → Monthly Sales History → Edit. |

---

## 5. Key Behaviour Notes

- **Allowance** is applied at the monthly level (Monthly Sales), not per daily entry. Default is 15 %.
- **Dynamic summaries** — Monthly and Yearly tables automatically reflect equipment changes in Masters.
- **Misc expenses** are excluded from the main Total in all summary views. They appear in a dedicated reference section.
- **Stock valuation** — if profit figures look unexpected, verify the *Expected Stock Rate* on the Production page.
- **Missing columns** — ensure the equipment is registered and marked Active in Masters → Equipment.
- **No data shown** — check that the correct Month/Year filter is selected.

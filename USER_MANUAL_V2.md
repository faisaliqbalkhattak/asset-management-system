# Process Management System - User Manual (v2.0)

**Date:** Feb 09, 2026  
**Status:** Latest Build  
**Platform:** Offline Desktop Application

---

## 1. Introduction & Workflow
This application manages the daily operations, expenses, production, and profit distribution for the plant. The workflow follows a logical sequence:
1.  **Setup Data (Masters):** Define your resources once.
2.  **Daily Entries:** Record day-to-day activities (fuel, trips, expenses).
3.  **Production Tracking:** Record monthly sales and stock levels.
4.  **Analysis:** View expense summaries and calculate profit shares.

---

## 2. Getting Started & Dashboard
Upon launching the application, you land on the **Dashboard**.
-   **Quick Stats:** View total equipment count, active employees, and recent operational snapshots.
-   **Main Navigation:** The top menu bar provides access to all modules.

---

## 3. Module Guide

### Step 1: Masters (Setup)
*Use this module to initialize your data. You rarely need to visit this after setup.*

-   **Human Resources:** Add employees, set designations (e.g., Manager, Operator), and define Base Salaries.
-   **Equipment:** Register vehicles and machines (Generators, Excavators, Dumpers).
    -   *Control:* Toggle `Active` status to hide unused equipment from daily entry forms.
-   **Expense Categories:** Create categories for miscellaneous expenses to keep reporting organized.

### Step 2: Daily Entries (Core Operations)
*This is where 90% of data entry happens. The module is divided into tabs for each operational area.*

1.  **Generators:** Record running hours, fuel consumed, and fuel rate.
    -   *Rent:* Pre-filled (e.g., ~19k/day) but editable.
2.  **Excavator & Loaders:** Similar to generators; track hours and fuel.
3.  **Dumpers:** Track trips and fuel.
    -   **Important:** Ensure trip counts are accurate as they impact cost analysis.
4.  **Blasting Material:** Log explosive purchases and usage.
5.  **Expenses (Langar, Plant, Misc):** Log daily petty cash, kitchen (Langar) expenses, and general plant repairs.
6.  **Salaries:** Generate monthly salary records based on the Base Salary defined in Masters. You can adjust the final amount for deductions or bonuses.

### Step 3: Production (Monthly Output)
*Navigate here at the end of every month to record revenue and stock.*

**Input Form:**
-   **Month/Year:** Select the reporting period.
-   **Quantity Sold:** Total cubic feet (CFT) of material sold to customers.
-   **Total Sale Amount (Cash):** The actual cash received from sales.
-   **Stock Quantity:** The volume of material produced but sitting in the yard (unsold).
-   **Expected Stock Rate:** The estimated value per CFT of the unsold stock.
    -   *Logic:* This rate is used to calculate the asset value of your stock for profit sharing.

**History Table:**
-   View a list of previous months.
-   **Edit:** Use the "Edit" button to correct mistakes in past records.

### Step 4: Monthly Summary (Expense Reports)
*A consolidated view of where money went.*

-   **Filter:** Select Month/Year to view specific reports.
-   **Breakdown:** See totals for Generator Fuel, Excavator Rent, Dumper Trips, and Salaries in a single view.
-   **Export:** Use this page to verify cost inputs before checking profit sharing.

### Step 5: Profit Sharing (Distribution)
*The final analysis tool for business partners.*

**Profit Calculation Logic:**

1.  **Gross Total (Revenue):**
    -   `Cash Received` (from Sales)
    -   `Stock Value` (Calculated for unsold material)
    -   **Gross Total** = Cash Received + Stock Value

2.  **Deductions:**
    -   **Total Expenses:** Sum of all daily operational costs (Fuel, Salaries, Rent, etc).
    -   *Note on Rates:* 
        -   **Selling Rate (Cost per CFT):** Calculated as `Total Cash` / `Sold Quantity`. This shows the actual realized rate.
        -   **Stock Rate:** The manual rate you entered in the Production page to value your unsold stock.

3.  **Net Profit:**
    -   `Gross Total` - `Total Expenses` = **Net Profit**
    -   *This profit figure includes the value of unsold stock.*

---

## 4. Common Operations & Tips

### How to Fix Data Errors
-   **Wrong Daily Entry:** Go to the `Transactions` page. It lists every single entry made in the system. Use the Filters to find the specific record and click "Delete" or "Edit".
-   **Wrong Production Data:** Go to the `Production` page history table and click "Edit".

### Application Logic Notes
-   **Stock Valuation:** If you see unexpected profit numbers, check your `Expected Stock Rate` in the Production page. A high rate will inflate your "Stock Asset Value".
-   **Rent Calculation:** Generator rent defaults to a fixed monthly divisor. Ensure this matches your actual contract terms.
-   **Zero Cost?** If records show 0 cost, ensure you have entered `Fuel Rate` and `Quantity` in your daily entries.

### Troubleshooting
-   **"No Data Found":** Ensure you have selected the correct Month/Year in the filters.
-   **Calculations look wrong:** Check `Monthly Summary` to see if a specific category (like Dumpers) has an unusually high expense entered by mistake (e.g., an extra zero).

---

*For technical support or database backups, refer to the `scripts` folder documentation.*

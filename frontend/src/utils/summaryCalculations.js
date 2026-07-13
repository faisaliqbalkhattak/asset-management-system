export const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
export const FULL_MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export const NON_EQUIPMENT_CATEGORIES = [
  { key: 'blasting', label: 'Blasting', shortLabel: 'Blast' },
  { key: 'plant_mess', label: 'Plant Mess', shortLabel: 'Mess' },
  { key: 'plant_exp', label: 'Plant Exp', shortLabel: 'Plant' },
  { key: 'human_res', label: 'Staff Salaries', shortLabel: 'Salaries' },
];

const EQUIPMENT_TYPE_MAPPING = {
  GENERATOR: { key: 'generator', label: 'Generator', shortLabel: 'Gen', hasMisc: true },
  EXCAVATOR: { key: 'excavator', label: 'Excavator', shortLabel: 'Exc', hasMisc: true },
  LOADER: { key: 'loaders', label: 'Loaders', shortLabel: 'Load', hasMisc: true },
};

const toNumber = (value) => Number(value) || 0;

const normalizeDumperCode = (code = '') => {
  return String(code)
    .toLowerCase()
    .replace('dmp-', '')
    .replace(/-/g, '');
};

export const buildEquipmentCategories = (equipment = []) => {
  const types = [...new Set((equipment || []).map((e) => e.equipment_type))];
  return types
    .filter((type) => type !== 'DUMPER' && EQUIPMENT_TYPE_MAPPING[type])
    .map((type) => EQUIPMENT_TYPE_MAPPING[type]);
};

export const buildDumpers = (equipment = []) => {
  return (equipment || [])
    .filter((e) => e.equipment_type === 'DUMPER')
    .map((d) => {
      const cleanCode = normalizeDumperCode(d.equipment_code);
      return {
        key: `dumper_${cleanCode}`,
        miscKey: `dumper_${cleanCode}_misc`,
        label: d.equipment_name,
        id: d.id,
        code: d.equipment_code,
      };
    });
};

export const buildGroupedDumpers = (equipment = []) => {
  const hasDumpers = (equipment || []).some((e) => e.equipment_type === 'DUMPER');
  if (!hasDumpers) return [];
  return [
    {
      key: 'dumpers',
      miscKey: 'dumpers_misc',
      label: 'Dumpers',
    },
  ];
};

export const buildDumperKeyMap = (dumpers = []) => {
  const map = {};
  dumpers.forEach((d) => {
    map[d.label] = d.key;
    if (d.id !== undefined && d.id !== null) {
      map[d.id] = d.key;
    }
  });
  return map;
};

export const buildGroupedDumperKeyMap = (equipment = []) => {
  const map = {};
  (equipment || [])
    .filter((e) => e.equipment_type === 'DUMPER')
    .forEach((d) => {
      map[d.equipment_name] = 'dumpers';
      if (d.id !== undefined && d.id !== null) {
        map[d.id] = 'dumpers';
      }
    });
  return map;
};

const getDateParts = (dateStr) => {
  if (!dateStr) return null;
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return null;

  return {
    monthIndex: date.getMonth(),
    year: date.getFullYear(),
  };
};

export const getMonthKey = (dateStr) => {
  const parts = getDateParts(dateStr);
  if (!parts) return null;
  return `${MONTH_NAMES[parts.monthIndex]}-${String(parts.year).slice(-2)}`;
};

const shouldIncludeDate = (dateStr, selectedMonth, selectedYear) => {
  if (!selectedMonth && !selectedYear) return true;
  const parts = getDateParts(dateStr);
  if (!parts) return false;
  if (selectedMonth) {
    const fullMonth = FULL_MONTH_NAMES[parts.monthIndex];
    const shortMonth = MONTH_NAMES[parts.monthIndex];
    if (selectedMonth !== fullMonth && selectedMonth !== shortMonth) return false;
  }
  if (selectedYear && String(parts.year) !== String(selectedYear)) return false;
  return true;
};

export const createSummaryRowTemplate = (equipmentCategories = [], dumpers = []) => {
  const template = {
    spending: 0,
    misc: 0,
    total: 0,
  };

  equipmentCategories.forEach((ec) => {
    template[ec.key] = 0;
    if (ec.hasMisc) {
      template[`${ec.key}_misc`] = 0;
    }
  });

  dumpers.forEach((d) => {
    template[d.key] = 0;
    template[d.miscKey] = 0;
  });

  NON_EQUIPMENT_CATEGORIES.forEach((cat) => {
    template[cat.key] = 0;
    template[`${cat.key}_misc`] = 0;
  });

  return template;
};

const finalizeRowTotals = (row, equipmentCategories, dumpers) => {
  let equipmentSpending = 0;
  let equipmentMiscTotal = 0;

  equipmentCategories.forEach((ec) => {
    equipmentSpending += toNumber(row[ec.key]);
    if (ec.hasMisc) {
      equipmentMiscTotal += toNumber(row[`${ec.key}_misc`]);
    }
  });

  let dumperSpending = 0;
  let dumperMiscTotal = 0;

  dumpers.forEach((d) => {
    dumperSpending += toNumber(row[d.key]);
    dumperMiscTotal += toNumber(row[d.miscKey]);
  });

  let categorySpending = 0;
  let categoryMiscTotal = 0;
  NON_EQUIPMENT_CATEGORIES.forEach((cat) => {
    categorySpending += toNumber(row[cat.key]);
    categoryMiscTotal += toNumber(row[`${cat.key}_misc`]);
  });

  row.spending = equipmentSpending + dumperSpending + categorySpending;
  row.misc = equipmentMiscTotal + dumperMiscTotal + categoryMiscTotal;
  row.total = row.spending + row.misc;
};

export const calculateSummaryByMonth = ({
  generatorOperations = [],
  excavatorOperations = [],
  loaderOperations = [],
  dumperOperations = [],
  dumperMiscExpenses = [],
  blastingMaterials = [],
  plantMessExpenses = [],
  plantExpenses = [],
  salaries = [],
  equipmentCategories = [],
  dumpers = [],
  dumperKeyMap = {},
  selectedMonth = '',
  selectedYear = '',
}) => {
  const data = {};

  const ensureMonth = (monthKey) => {
    if (!data[monthKey]) {
      data[monthKey] = createSummaryRowTemplate(equipmentCategories, dumpers);
    }
    return data[monthKey];
  };

  generatorOperations.forEach((op) => {
    if (!shouldIncludeDate(op.operation_date, selectedMonth, selectedYear)) return;
    const monthKey = getMonthKey(op.operation_date);
    if (!monthKey) return;
    const row = ensureMonth(monthKey);
    row.generator += toNumber(op.spending_amount || op.total_amount);
    row.generator_misc = toNumber(row.generator_misc) + toNumber(op.misc_expense);
  });

  excavatorOperations.forEach((op) => {
    if (!shouldIncludeDate(op.operation_date, selectedMonth, selectedYear)) return;
    const monthKey = getMonthKey(op.operation_date);
    if (!monthKey) return;
    const row = ensureMonth(monthKey);
    row.excavator += toNumber(op.spending_amount || op.total_amount);
    row.excavator_misc = toNumber(row.excavator_misc) + toNumber(op.misc_expense) + toNumber(op.misc_expense_2);
  });

  loaderOperations.forEach((op) => {
    if (!shouldIncludeDate(op.operation_date, selectedMonth, selectedYear)) return;
    const monthKey = getMonthKey(op.operation_date);
    if (!monthKey) return;
    const row = ensureMonth(monthKey);
    row.loaders += toNumber(op.spending_amount || op.total_amount);
    row.loaders_misc = toNumber(row.loaders_misc) + toNumber(op.misc_expense) + toNumber(op.misc_expense_2);
  });

  dumperOperations.forEach((op) => {
    if (!shouldIncludeDate(op.trip_date, selectedMonth, selectedYear)) return;
    const monthKey = getMonthKey(op.trip_date);
    if (!monthKey) return;

    const dumperKey = dumperKeyMap[op.equipment_id] || dumperKeyMap[op.dumper_name];
    if (!dumperKey) return;

    const row = ensureMonth(monthKey);
    row[dumperKey] = toNumber(row[dumperKey]) + toNumber(op.spending_amount || op.trip_amount);
    row[`${dumperKey}_misc`] =
      toNumber(row[`${dumperKey}_misc`]) +
      toNumber(op.misc_expense) +
      toNumber(op.misc_expense_2);
  });

  dumperMiscExpenses.forEach((exp) => {
    if (!shouldIncludeDate(exp.expense_date, selectedMonth, selectedYear)) return;
    const monthKey = getMonthKey(exp.expense_date);
    if (!monthKey) return;

    const dumperKey = dumperKeyMap[exp.dumper_id] || dumperKeyMap[exp.dumper_name];
    if (!dumperKey) return;

    const row = ensureMonth(monthKey);
    row[`${dumperKey}_misc`] = toNumber(row[`${dumperKey}_misc`]) + toNumber(exp.amount);
  });

  blastingMaterials.forEach((item) => {
    if (!shouldIncludeDate(item.purchase_date, selectedMonth, selectedYear)) return;
    const monthKey = getMonthKey(item.purchase_date);
    if (!monthKey) return;
    const row = ensureMonth(monthKey);
    row.blasting += toNumber(item.spending_amount || item.total_amount);
    row.blasting_misc = toNumber(row.blasting_misc) + toNumber(item.misc_expense);
  });

  plantMessExpenses.forEach((item) => {
    if (!shouldIncludeDate(item.expense_date, selectedMonth, selectedYear)) return;
    const monthKey = getMonthKey(item.expense_date);
    if (!monthKey) return;
    const row = ensureMonth(monthKey);
    row.plant_mess += toNumber(item.spending_amount || item.amount);
    row.plant_mess_misc = toNumber(row.plant_mess_misc) + toNumber(item.misc_expense);
  });

  plantExpenses.forEach((item) => {
    if (!shouldIncludeDate(item.expense_date, selectedMonth, selectedYear)) return;
    const monthKey = getMonthKey(item.expense_date);
    if (!monthKey) return;
    const row = ensureMonth(monthKey);
    row.plant_exp += toNumber(item.spending_amount || item.amount);
    row.plant_exp_misc = toNumber(row.plant_exp_misc) + toNumber(item.misc_expense);
  });

  salaries.forEach((item) => {
    const salaryDate = item.salary_month ? `${item.salary_month}-01` : null;
    if (!shouldIncludeDate(salaryDate, selectedMonth, selectedYear)) return;
    const monthKey = getMonthKey(salaryDate);
    if (!monthKey) return;
    const row = ensureMonth(monthKey);
    row.human_res += toNumber(item.spending_amount || item.net_salary);
    row.human_res_misc = toNumber(row.human_res_misc) + toNumber(item.misc_expense);
  });

  Object.keys(data).forEach((monthKey) => {
    finalizeRowTotals(data[monthKey], equipmentCategories, dumpers);
  });

  return data;
};

export const calculateGrandTotals = (monthlySummaryData = {}, equipmentCategories = [], dumpers = []) => {
  const totals = createSummaryRowTemplate(equipmentCategories, dumpers);

  Object.values(monthlySummaryData).forEach((row) => {
    Object.keys(totals).forEach((key) => {
      totals[key] += toNumber(row[key]);
    });
  });

  return totals;
};

export const getAvailableYears = ({
  generatorOperations = [],
  excavatorOperations = [],
  loaderOperations = [],
  dumperOperations = [],
  dumperMiscExpenses = [],
  blastingMaterials = [],
  plantMessExpenses = [],
  plantExpenses = [],
  salaries = [],
  monthlyProductionSummaries = [],
}) => {
  const years = new Set();

  const allData = [
    ...generatorOperations,
    ...excavatorOperations,
    ...loaderOperations,
    ...dumperOperations,
    ...dumperMiscExpenses,
    ...blastingMaterials,
    ...plantMessExpenses,
    ...plantExpenses,
    ...salaries,
  ];

  allData.forEach((item) => {
    const date =
      item.operation_date ||
      item.trip_date ||
      item.expense_date ||
      item.purchase_date ||
      item.production_date ||
      item.salary_month;

    const parts = getDateParts(date);
    if (parts) {
      years.add(String(parts.year));
    }
  });

  (monthlyProductionSummaries || []).forEach((summary) => {
    if (summary.summary_year) {
      years.add(String(summary.summary_year));
    }
  });

  if (years.size === 0) {
    years.add(String(new Date().getFullYear()));
  }

  return Array.from(years).sort((a, b) => Number(b) - Number(a));
};

// ============================================================
// PER-EQUIPMENT ITEM SUMMARY
// Groups transactions by individual equipment item and returns
// { spending, misc, total } for each item.
// ============================================================
export const calculatePerEquipmentItemSummary = ({
  equipment = [],
  generatorOperations = [],
  excavatorOperations = [],
  loaderOperations = [],
  dumperOperations = [],
  selectedMonth = '',
  selectedYear = '',
}) => {
  const items = {};

  const ensureItem = (key, label, type) => {
    if (!items[key]) {
      items[key] = { key, label, type, spending: 0, misc: 0, total: 0 };
    }
    return items[key];
  };

  generatorOperations.forEach((op) => {
    if (!shouldIncludeDate(op.operation_date, selectedMonth, selectedYear)) return;
    const item = ensureItem(`gen-${op.equipment_name}`, op.equipment_name, 'Generator');
    item.spending += toNumber(op.spending_amount || op.total_amount);
    item.misc += toNumber(op.misc_expense);
    item.total = item.spending + item.misc;
  });

  excavatorOperations.forEach((op) => {
    if (!shouldIncludeDate(op.operation_date, selectedMonth, selectedYear)) return;
    const item = ensureItem(`exc-${op.equipment_name}`, op.equipment_name, 'Excavator');
    item.spending += toNumber(op.spending_amount || op.total_amount);
    item.misc += toNumber(op.misc_expense) + toNumber(op.misc_expense_2);
    item.total = item.spending + item.misc;
  });

  loaderOperations.forEach((op) => {
    if (!shouldIncludeDate(op.operation_date, selectedMonth, selectedYear)) return;
    const item = ensureItem(`load-${op.equipment_name}`, op.equipment_name, 'Loader');
    item.spending += toNumber(op.spending_amount || op.total_amount);
    item.misc += toNumber(op.misc_expense) + toNumber(op.misc_expense_2);
    item.total = item.spending + item.misc;
  });

  dumperOperations.forEach((op) => {
    if (!shouldIncludeDate(op.trip_date, selectedMonth, selectedYear)) return;
    const name = op.dumper_name || op.equipment_name || 'Dumper';
    const item = ensureItem(`dmp-${name}`, name, 'Dumper');
    item.spending += toNumber(op.spending_amount || op.trip_amount);
    item.misc += toNumber(op.misc_expense) + toNumber(op.misc_expense_2);
    item.total = item.spending + item.misc;
  });

  return Object.values(items).sort((a, b) => a.label.localeCompare(b.label));
};

// ============================================================
// DETAILED ITEM SUMMARIES
// Groups blasting materials, plant mess expenses, plant expenses,
// and staff salaries by subcategories/items/employees.
// ============================================================
export const calculateDetailedItemSummaries = ({
  blastingMaterials = [],
  plantMessExpenses = [],
  plantExpenses = [],
  salaries = [],
  selectedMonth = '',
  selectedYear = '',
}) => {
  const blasting = {};
  const plantMess = {};
  const plantExp = {};
  const staff = {};

  const ensureItem = (group, key, label) => {
    if (!group[key]) {
      group[key] = { key, label, spending: 0, misc: 0, total: 0 };
    }
    return group[key];
  };

  blastingMaterials.forEach((item) => {
    if (!shouldIncludeDate(item.purchase_date, selectedMonth, selectedYear)) return;
    const label = item.description || 'Unknown Blasting Item';
    const key = label.toLowerCase().trim();
    const entry = ensureItem(blasting, key, label);
    entry.spending += toNumber(item.spending_amount || item.total_amount);
    entry.misc += toNumber(item.misc_expense);
    entry.total = entry.spending + entry.misc;
  });

  plantMessExpenses.forEach((item) => {
    if (!shouldIncludeDate(item.expense_date, selectedMonth, selectedYear)) return;
    const label = item.description || 'General Mess';
    const key = label.toLowerCase().trim();
    const entry = ensureItem(plantMess, key, label);
    entry.spending += toNumber(item.spending_amount || item.amount);
    entry.misc += toNumber(item.misc_expense);
    entry.total = entry.spending + entry.misc;
  });

  plantExpenses.forEach((item) => {
    if (!shouldIncludeDate(item.expense_date, selectedMonth, selectedYear)) return;
    const label = item.category || 'General Plant Expense';
    const key = label.toLowerCase().trim();
    const entry = ensureItem(plantExp, key, label);
    entry.spending += toNumber(item.spending_amount || item.amount);
    entry.misc += toNumber(item.misc_expense);
    entry.total = entry.spending + entry.misc;
  });

  salaries.forEach((item) => {
    const salaryDate = item.salary_month ? `${item.salary_month}-01` : null;
    if (!shouldIncludeDate(salaryDate, selectedMonth, selectedYear)) return;
    const label = item.employee_name || 'Staff Member';
    const key = label.toLowerCase().trim();
    const entry = ensureItem(staff, key, label);
    entry.spending += toNumber(item.spending_amount || item.net_salary);
    entry.misc += toNumber(item.misc_expense);
    entry.total = entry.spending + entry.misc;
  });

  return {
    blasting: Object.values(blasting).sort((a, b) => a.label.localeCompare(b.label)),
    plantMess: Object.values(plantMess).sort((a, b) => a.label.localeCompare(b.label)),
    plantExp: Object.values(plantExp).sort((a, b) => a.label.localeCompare(b.label)),
    salaries: Object.values(staff).sort((a, b) => a.label.localeCompare(b.label)),
  };
};

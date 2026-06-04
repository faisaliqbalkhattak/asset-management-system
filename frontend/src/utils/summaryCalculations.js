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
  GENERATOR: { key: 'generator', label: 'Generator', shortLabel: 'Gen', hasMisc: false },
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
    total: 0,
    total_misc: 0,
    balance: 0,
    grand_total: 0,
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
  });

  return template;
};

const finalizeRowTotals = (row, equipmentCategories, dumpers) => {
  let equipmentTotal = 0;
  let equipmentMiscTotal = 0;

  equipmentCategories.forEach((ec) => {
    equipmentTotal += toNumber(row[ec.key]);
    if (ec.hasMisc) {
      equipmentMiscTotal += toNumber(row[`${ec.key}_misc`]);
    }
  });

  let dumperTotal = 0;
  let dumperMiscTotal = 0;

  dumpers.forEach((d) => {
    dumperTotal += toNumber(row[d.key]);
    dumperMiscTotal += toNumber(row[d.miscKey]);
  });

  let categoryTotal = 0;
  NON_EQUIPMENT_CATEGORIES.forEach((cat) => {
    categoryTotal += toNumber(row[cat.key]);
  });

  row.total = equipmentTotal + dumperTotal + categoryTotal;
  row.total_misc = equipmentMiscTotal + dumperMiscTotal;
  row.balance = row.total - row.total_misc;
  row.grand_total = row.balance;
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
    row.generator += toNumber(op.total_amount);
  });

  excavatorOperations.forEach((op) => {
    if (!shouldIncludeDate(op.operation_date, selectedMonth, selectedYear)) return;
    const monthKey = getMonthKey(op.operation_date);
    if (!monthKey) return;
    const row = ensureMonth(monthKey);
    row.excavator += toNumber(op.total_amount);
    row.excavator_misc += toNumber(op.misc_expense) + toNumber(op.misc_expense_2);
  });

  loaderOperations.forEach((op) => {
    if (!shouldIncludeDate(op.operation_date, selectedMonth, selectedYear)) return;
    const monthKey = getMonthKey(op.operation_date);
    if (!monthKey) return;
    const row = ensureMonth(monthKey);
    row.loaders += toNumber(op.total_amount);
    row.loaders_misc += toNumber(op.misc_expense) + toNumber(op.misc_expense_2);
  });

  dumperOperations.forEach((op) => {
    if (!shouldIncludeDate(op.trip_date, selectedMonth, selectedYear)) return;
    const monthKey = getMonthKey(op.trip_date);
    if (!monthKey) return;

    const dumperKey = dumperKeyMap[op.equipment_id] || dumperKeyMap[op.dumper_name];
    if (!dumperKey) return;

    const row = ensureMonth(monthKey);
    row[dumperKey] = toNumber(row[dumperKey]) + toNumber(op.trip_amount);
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
    row.blasting += toNumber(item.total_amount);
  });

  plantMessExpenses.forEach((item) => {
    if (!shouldIncludeDate(item.expense_date, selectedMonth, selectedYear)) return;
    const monthKey = getMonthKey(item.expense_date);
    if (!monthKey) return;
    const row = ensureMonth(monthKey);
    row.plant_mess += toNumber(item.amount);
  });

  plantExpenses.forEach((item) => {
    if (!shouldIncludeDate(item.expense_date, selectedMonth, selectedYear)) return;
    const monthKey = getMonthKey(item.expense_date);
    if (!monthKey) return;
    const row = ensureMonth(monthKey);
    row.plant_exp += toNumber(item.amount);
  });

  salaries.forEach((item) => {
    const salaryDate = item.salary_month ? `${item.salary_month}-01` : null;
    if (!shouldIncludeDate(salaryDate, selectedMonth, selectedYear)) return;
    const monthKey = getMonthKey(salaryDate);
    if (!monthKey) return;
    const row = ensureMonth(monthKey);
    row.human_res += toNumber(item.net_salary);
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

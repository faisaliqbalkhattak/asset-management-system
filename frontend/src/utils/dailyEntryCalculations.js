/**
 * Daily Entry Calculation Utilities
 *
 * Pure functions for calculating spending and total amounts
 * for equipment daily entry forms.
 */

const toNumber = (value) => Number(value) || 0;

/**
 * Calculate Excavator spending/total.
 *
 * @param {Object} params
 * @param {number|string} params.hoursOperated
 * @param {number|string} params.ratePerHour
 * @param {number|string} params.fuelConsumptionRate
 * @param {number|string} params.fuelConsumed
 * @param {number|string} params.fuelRate
 * @param {number|string} params.miscExpense
 * @param {number|string} params.miscExpense2
 * @returns {Object} { rentAmount, effectiveFuelConsumed, fuelAmount, totalMisc, spending, total }
 */
export const calculateExcavatorTotals = ({
  hoursOperated = 0,
  ratePerHour = 0,
  fuelConsumptionRate = 0,
  fuelConsumed = 0,
  fuelRate = 0,
  miscExpense = 0,
  miscExpense2 = 0,
}) => {
  const hours = toNumber(hoursOperated);
  const rentAmount = hours * toNumber(ratePerHour);

  const consumptionRate = toNumber(fuelConsumptionRate);
  const effectiveFuelConsumed =
    consumptionRate > 0 && hours > 0
      ? consumptionRate * hours
      : toNumber(fuelConsumed);

  const fuelAmount = effectiveFuelConsumed * toNumber(fuelRate);
  const miscAmount = toNumber(miscExpense);
  const miscAmount2 = toNumber(miscExpense2);
  const totalMisc = miscAmount + miscAmount2;

  const spending = rentAmount + fuelAmount;
  const total = spending + totalMisc;

  return {
    rentAmount,
    effectiveFuelConsumed,
    fuelAmount,
    miscAmount,
    miscAmount2,
    totalMisc,
    spending,
    total,
  };
};

/**
 * Calculate Loader spending/total.
 *
 * @param {Object} params
 * @param {number|string} params.rentPerDay
 * @param {number|string} params.fuelConsumed
 * @param {number|string} params.fuelRate
 * @param {number|string} params.defunctHours
 * @param {number|string} params.defunctCostPerHour
 * @param {number|string} params.miscExpense
 * @param {number|string} params.miscExpense2
 * @returns {Object} { fuelAmount, defunctCost, totalMisc, spending, total }
 */
export const calculateLoaderTotals = ({
  rentPerDay = 0,
  fuelConsumed = 0,
  fuelRate = 0,
  defunctHours = 0,
  defunctCostPerHour = 0,
  miscExpense = 0,
  miscExpense2 = 0,
}) => {
  const fuelAmount = toNumber(fuelConsumed) * toNumber(fuelRate);
  const defunctCost = toNumber(defunctHours) * toNumber(defunctCostPerHour);
  const miscAmount = toNumber(miscExpense);
  const miscAmount2 = toNumber(miscExpense2);
  const totalMisc = miscAmount + miscAmount2;

  const spending = toNumber(rentPerDay) + fuelAmount - defunctCost;
  const total = spending + totalMisc;

  return {
    fuelAmount,
    defunctCost,
    miscAmount,
    miscAmount2,
    totalMisc,
    spending,
    total,
  };
};

/**
 * Calculate Dumper spending/total.
 *
 * @param {Object} params
 * @param {number|string} params.gravelTrips
 * @param {number|string} params.clayTrips
 * @param {number|string} params.cftPerTrip
 * @param {number|string} params.ratePerCft
 * @param {number|string} params.miscFuelQty
 * @param {number|string} params.miscFuelRate
 * @param {number|string} params.miscExpense2
 * @returns {Object} { totalTrips, totalCft, tripAmount, miscAmount, totalMisc, spending, total }
 */
export const calculateDumperTotals = ({
  gravelTrips = 0,
  clayTrips = 0,
  cftPerTrip = 0,
  ratePerCft = 0,
  miscFuelQty = 0,
  miscFuelRate = 0,
  miscExpense2 = 0,
}) => {
  const totalTrips = toNumber(gravelTrips) + toNumber(clayTrips);
  const totalCft = totalTrips * toNumber(cftPerTrip);
  const tripAmount = totalCft * toNumber(ratePerCft);

  const miscFuelQtyNum = toNumber(miscFuelQty);
  const miscFuelRateNum = toNumber(miscFuelRate);
  const fuelAmount = miscFuelQtyNum * miscFuelRateNum;
  const miscAmount2 = toNumber(miscExpense2);

  // Fuel is a direct expense and part of spending.
  // Misc (misc_expense_2) is added to total only.
  const spending = tripAmount + fuelAmount;
  const total = spending + miscAmount2;

  return {
    totalTrips,
    totalCft,
    tripAmount,
    miscFuelQty: miscFuelQtyNum,
    miscFuelRate: miscFuelRateNum,
    fuelAmount,
    miscAmount2,
    spending,
    total,
  };
};

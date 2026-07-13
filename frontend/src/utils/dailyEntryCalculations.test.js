import {
  calculateExcavatorTotals,
  calculateLoaderTotals,
  calculateDumperTotals,
} from './dailyEntryCalculations';

describe('calculateExcavatorTotals', () => {
  it('calculates spending and total with no misc', () => {
    const result = calculateExcavatorTotals({
      hoursOperated: 5,
      ratePerHour: 100,
      fuelConsumptionRate: 2,
      fuelConsumed: 0,
      fuelRate: 50,
      miscExpense: 0,
      miscExpense2: 0,
    });

    expect(result.rentAmount).toBe(500);
    expect(result.effectiveFuelConsumed).toBe(10);
    expect(result.fuelAmount).toBe(500);
    expect(result.totalMisc).toBe(0);
    expect(result.spending).toBe(1000);
    expect(result.total).toBe(1000);
  });

  it('includes misc expenses in total', () => {
    const result = calculateExcavatorTotals({
      hoursOperated: 2,
      ratePerHour: 100,
      fuelConsumptionRate: 0,
      fuelConsumed: 5,
      fuelRate: 20,
      miscExpense: 50,
      miscExpense2: 25,
    });

    expect(result.rentAmount).toBe(200);
    expect(result.effectiveFuelConsumed).toBe(5);
    expect(result.fuelAmount).toBe(100);
    expect(result.totalMisc).toBe(75);
    expect(result.spending).toBe(300);
    expect(result.total).toBe(375);
  });

  it('auto-calculates fuel consumed when fuel consumption rate and hours are provided', () => {
    const result = calculateExcavatorTotals({
      hoursOperated: 4,
      ratePerHour: 50,
      fuelConsumptionRate: 3,
      fuelConsumed: 100,
      fuelRate: 10,
      miscExpense: 0,
      miscExpense2: 0,
    });

    expect(result.effectiveFuelConsumed).toBe(12);
    expect(result.fuelAmount).toBe(120);
  });

  it('falls back to provided fuel consumed when fuel consumption rate is zero', () => {
    const result = calculateExcavatorTotals({
      hoursOperated: 4,
      ratePerHour: 50,
      fuelConsumptionRate: 0,
      fuelConsumed: 20,
      fuelRate: 10,
      miscExpense: 0,
      miscExpense2: 0,
    });

    expect(result.effectiveFuelConsumed).toBe(20);
    expect(result.fuelAmount).toBe(200);
  });

  it('handles string inputs from form fields', () => {
    const result = calculateExcavatorTotals({
      hoursOperated: '3',
      ratePerHour: '100',
      fuelConsumptionRate: '0',
      fuelConsumed: '10',
      fuelRate: '20',
      miscExpense: '15',
      miscExpense2: '5',
    });

    expect(result.spending).toBe(500);
    expect(result.totalMisc).toBe(20);
    expect(result.total).toBe(520);
  });

  it('defaults missing values to zero', () => {
    const result = calculateExcavatorTotals({});

    expect(result.rentAmount).toBe(0);
    expect(result.fuelAmount).toBe(0);
    expect(result.totalMisc).toBe(0);
    expect(result.spending).toBe(0);
    expect(result.total).toBe(0);
  });
});

describe('calculateLoaderTotals', () => {
  it('calculates spending and total with no misc', () => {
    const result = calculateLoaderTotals({
      rentPerDay: 1000,
      fuelConsumed: 10,
      fuelRate: 50,
      defunctHours: 0,
      defunctCostPerHour: 0,
      miscExpense: 0,
      miscExpense2: 0,
    });

    expect(result.fuelAmount).toBe(500);
    expect(result.defunctCost).toBe(0);
    expect(result.totalMisc).toBe(0);
    expect(result.spending).toBe(1500);
    expect(result.total).toBe(1500);
  });

  it('subtracts defunct cost from spending', () => {
    const result = calculateLoaderTotals({
      rentPerDay: 1000,
      fuelConsumed: 10,
      fuelRate: 50,
      defunctHours: 2,
      defunctCostPerHour: 100,
      miscExpense: 0,
      miscExpense2: 0,
    });

    expect(result.defunctCost).toBe(200);
    expect(result.spending).toBe(1300);
    expect(result.total).toBe(1300);
  });

  it('includes misc expenses in total', () => {
    const result = calculateLoaderTotals({
      rentPerDay: 1000,
      fuelConsumed: 10,
      fuelRate: 50,
      defunctHours: 2,
      defunctCostPerHour: 100,
      miscExpense: 100,
      miscExpense2: 50,
    });

    expect(result.spending).toBe(1300);
    expect(result.totalMisc).toBe(150);
    expect(result.total).toBe(1450);
  });

  it('handles string inputs and missing values', () => {
    const result = calculateLoaderTotals({
      rentPerDay: '500',
      fuelConsumed: '5',
      fuelRate: '20',
      defunctHours: '1',
      defunctCostPerHour: '50',
      miscExpense: '10',
      miscExpense2: '20',
    });

    expect(result.fuelAmount).toBe(100);
    expect(result.defunctCost).toBe(50);
    expect(result.spending).toBe(550);
    expect(result.total).toBe(580);
  });
});

describe('calculateDumperTotals', () => {
  it('calculates spending and total with no misc', () => {
    const result = calculateDumperTotals({
      gravelTrips: 10,
      clayTrips: 5,
      cftPerTrip: 100,
      ratePerCft: 2,
      miscFuelQty: 0,
      miscFuelRate: 0,
      miscExpense2: 0,
    });

    expect(result.totalTrips).toBe(15);
    expect(result.totalCft).toBe(1500);
    expect(result.tripAmount).toBe(3000);
    expect(result.fuelAmount).toBe(0);
    expect(result.miscAmount2).toBe(0);
    expect(result.spending).toBe(3000);
    expect(result.total).toBe(3000);
  });

  it('includes fuel as direct expense and second misc in total', () => {
    const result = calculateDumperTotals({
      gravelTrips: 10,
      clayTrips: 5,
      cftPerTrip: 100,
      ratePerCft: 2,
      miscFuelQty: 10,
      miscFuelRate: 50,
      miscExpense2: 200,
    });

    expect(result.tripAmount).toBe(3000);
    expect(result.fuelAmount).toBe(500);
    expect(result.miscAmount2).toBe(200);
    expect(result.spending).toBe(3500);
    expect(result.total).toBe(3700);
  });

  it('handles string inputs and missing values', () => {
    const result = calculateDumperTotals({
      gravelTrips: '2',
      clayTrips: '3',
      cftPerTrip: '100',
      ratePerCft: '1.5',
      miscFuelQty: '5',
      miscFuelRate: '10',
      miscExpense2: '20',
    });

    expect(result.totalTrips).toBe(5);
    expect(result.totalCft).toBe(500);
    expect(result.tripAmount).toBe(750);
    expect(result.fuelAmount).toBe(50);
    expect(result.miscAmount2).toBe(20);
    expect(result.spending).toBe(800);
    expect(result.total).toBe(820);
  });

  it('defaults missing values to zero', () => {
    const result = calculateDumperTotals({});

    expect(result.totalTrips).toBe(0);
    expect(result.tripAmount).toBe(0);
    expect(result.fuelAmount).toBe(0);
    expect(result.miscAmount2).toBe(0);
    expect(result.spending).toBe(0);
    expect(result.total).toBe(0);
  });
});

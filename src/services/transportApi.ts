import { SlipCycle } from '../types';

// Mock Fleet Data
const MOCK_FLEET_INIT = [
  { id: 'R1', name: 'Route A - Mihona', driver: 'Ramesh Singh', busNo: 'MP30-A-1111', driverUserId: 'driver_R1', totalStudents: 45, status: 'In Transit', speed: 42, stops: 12, location: { lat: 26.35, lng: 78.93 } },
  { id: 'R2', name: 'Route B - Lahar', driver: 'Suresh Yadav', busNo: 'MP30-B-2222', driverUserId: 'driver_R2', totalStudents: 38, status: 'Idle', speed: 0, stops: 8 },
  { id: 'R3', name: 'Route C - Machhand', driver: 'Dinesh Gurjar', busNo: 'MP30-C-3333', driverUserId: 'driver_R3', totalStudents: 52, status: 'Idle', speed: 0, stops: 15 },
  { id: 'R4', name: 'Route D - Raun Local', driver: 'Mukesh Sharma', busNo: 'MP30-D-4444', driverUserId: 'driver_R4', totalStudents: 60, status: 'Maintenance', speed: 0, stops: 10 },
  { id: 'R5', name: 'Route E - Daboh', driver: 'Rajesh Verma', busNo: 'MP30-E-5555', driverUserId: 'driver_R5', totalStudents: 40, status: 'Idle', speed: 0, stops: 11 },
];

export const ALL_DRIVERS = ['Ramesh Singh', 'Suresh Yadav', 'Dinesh Gurjar', 'Mukesh Sharma', 'Rajesh Verma', 'Vikram Tiwari', 'Ajay Patel'];

const MOCK_FUEL_MONTHLY: Record<string, number> = { R1: 320, R2: 280, R3: 410, R4: 0, R5: 195 };

const MOCK_ROUTE_CYCLES: Record<string, SlipCycle[]> = {
  R1: [
    { cycleId: 'c1-r1', busId: 'R1', startDate: '2026-08-01', endDate: '2026-08-12', startOdo: 45000, endOdo: 45180, totalFuelLiters: 18, totalCost: 1620, avgMileage: 10, receiptImages: [] },
    { cycleId: 'c2-r1', busId: 'R1', startDate: '2026-08-12', endDate: '2026-08-25', startOdo: 45180, endOdo: 45340, totalFuelLiters: 16, totalCost: 1440, avgMileage: 10, receiptImages: [] },
  ],
  R2: [
    { cycleId: 'c1-r2', busId: 'R2', startDate: '2026-08-05', endDate: '2026-08-20', startOdo: 32000, endOdo: 32140, totalFuelLiters: 14, totalCost: 1260, avgMileage: 10, receiptImages: [] },
  ],
  R3: [
    { cycleId: 'c1-r3', busId: 'R3', startDate: '2026-08-01', endDate: '2026-08-10', startOdo: 51000, endOdo: 51200, totalFuelLiters: 20, totalCost: 1800, avgMileage: 10, receiptImages: [] },
    { cycleId: 'c2-r3', busId: 'R3', startDate: '2026-08-10', endDate: '2026-08-22', startOdo: 51200, endOdo: 51410, totalFuelLiters: 21, totalCost: 1890, avgMileage: 10, receiptImages: [] },
  ],
  R4: [],
  R5: [
    { cycleId: 'c1-r5', busId: 'R5', startDate: '2026-08-03', endDate: '2026-08-18', startOdo: 28000, endOdo: 28195, totalFuelLiters: 19.5, totalCost: 1755, avgMileage: 10, receiptImages: [] },
  ],
};

// Seed local storage with mock data if it doesn't exist
const initializeStorage = () => {
  if (typeof window === 'undefined') return;
  if (!localStorage.getItem('ajps_fleet')) {
    localStorage.setItem('ajps_fleet', JSON.stringify(MOCK_FLEET_INIT));
  }
  if (!localStorage.getItem('ajps_fuel_monthly')) {
    localStorage.setItem('ajps_fuel_monthly', JSON.stringify(MOCK_FUEL_MONTHLY));
  }
  if (!localStorage.getItem('ajps_route_cycles_record')) {
    localStorage.setItem('ajps_route_cycles_record', JSON.stringify(MOCK_ROUTE_CYCLES));
  }
};

initializeStorage();

const simulateDelay = (ms = 500) => new Promise(resolve => setTimeout(resolve, ms));

export const fetchFleetData = async () => {
  try {
    await simulateDelay();
    const fleetData = JSON.parse(localStorage.getItem('ajps_fleet') || '[]');
    return fleetData;
  } catch (error) {
    console.error('Error fetching fleet data:', error);
    throw new Error('Failed to fetch fleet data. Please check your connection.');
  }
};

export const fetchFuelMonthly = async () => {
  try {
    await simulateDelay(300);
    const monthlyData = JSON.parse(localStorage.getItem('ajps_fuel_monthly') || '{}');
    return monthlyData;
  } catch (error) {
    console.error('Error fetching fuel monthly data:', error);
    throw new Error('Failed to fetch fuel monthly data.');
  }
};

export const fetchRouteCycles = async () => {
  try {
    await simulateDelay(600);
    // Get predefined cycles + any newly submitted slips
    const predefinedCycles = JSON.parse(localStorage.getItem('ajps_route_cycles_record') || '{}');
    
    // also merge new ones from 'ajps_slip_cycles' (the way DriverFuel was doing it)
    const newCyclesList: SlipCycle[] = JSON.parse(localStorage.getItem('ajps_slip_cycles') || '[]');
    
    const allRouteCycles: Record<string, SlipCycle[]> = { ...predefinedCycles };
    
    newCyclesList.forEach(cycle => {
      if (!allRouteCycles[cycle.busId]) {
        allRouteCycles[cycle.busId] = [];
      }
      // Avoid duplicates if we've already synced
      if (!allRouteCycles[cycle.busId].find(c => c.cycleId === cycle.cycleId)) {
        allRouteCycles[cycle.busId].push(cycle);
      }
    });
    
    return allRouteCycles;
  } catch (error) {
    console.error('Error fetching route cycles:', error);
    throw new Error('Failed to fetch route cycles. Please check your connection.');
  }
};

export const changeDriver = async (routeId: string, newDriver: string) => {
  try {
    await simulateDelay();
    const fleetData = JSON.parse(localStorage.getItem('ajps_fleet') || '[]');
    const updatedFleet = fleetData.map((r: any) => r.id === routeId ? { ...r, driver: newDriver } : r);
    localStorage.setItem('ajps_fleet', JSON.stringify(updatedFleet));
    return updatedFleet;
  } catch (error) {
    console.error('Error changing driver:', error);
    throw new Error('Failed to change driver. Please try again.');
  }
};

export const submitFuelSlip = async (slipData: SlipCycle) => {
  try {
    await simulateDelay(800);
    
    const allCycles: SlipCycle[] = JSON.parse(localStorage.getItem('ajps_slip_cycles') || '[]');
    allCycles.push(slipData);
    localStorage.setItem('ajps_slip_cycles', JSON.stringify(allCycles));
    
    return { success: true, data: slipData };
  } catch (error) {
    console.error('Error submitting fuel slip:', error);
    throw new Error('Failed to submit fuel slip. Please try again.');
  }
};

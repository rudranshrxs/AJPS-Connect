import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { SlipCycle } from '../types';
import * as transportApi from '../services/transportApi';

interface TransportContextType {
  fleet: any[];
  routeCycles: Record<string, SlipCycle[]>;
  fuelMonthly: Record<string, number>;
  isLoading: boolean;
  isSubmitting: boolean;
  loadFleet: () => Promise<void>;
  loadCycles: () => Promise<void>;
  addFuelSlip: (slipData: SlipCycle) => Promise<void>;
  updateDriver: (routeId: string, newDriver: string) => Promise<void>;
}

const TransportContext = createContext<TransportContextType | undefined>(undefined);

export function TransportProvider({ children }: { children: ReactNode }) {
  const [fleet, setFleet] = useState<any[]>([]);
  const [routeCycles, setRouteCycles] = useState<Record<string, SlipCycle[]>>({});
  const [fuelMonthly, setFuelMonthly] = useState<Record<string, number>>({});
  
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadFleet = async () => {
    setIsLoading(true);
    try {
      const [fleetData, monthlyData] = await Promise.all([
        transportApi.fetchFleetData(),
        transportApi.fetchFuelMonthly()
      ]);
      setFleet(fleetData);
      setFuelMonthly(monthlyData);
    } catch (err) {
      console.error("Failed to load fleet data", err);
    } finally {
      setIsLoading(false);
    }
  };

  const loadCycles = async () => {
    setIsLoading(true);
    try {
      const cyclesData = await transportApi.fetchRouteCycles();
      setRouteCycles(cyclesData);
    } catch (err) {
      console.error("Failed to load route cycles", err);
    } finally {
      setIsLoading(false);
    }
  };

  const addFuelSlip = async (slipData: SlipCycle) => {
    setIsSubmitting(true);
    try {
      await transportApi.submitFuelSlip(slipData);
      // Refetch cycles after submission
      await loadCycles();
    } catch (err) {
      console.error("Failed to submit fuel slip", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateDriver = async (routeId: string, newDriver: string) => {
    setIsLoading(true);
    try {
      await transportApi.changeDriver(routeId, newDriver);
      await loadFleet();
    } catch (err) {
      console.error("Failed to change driver", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Initial load
    loadFleet();
    loadCycles();
  }, []);

  return (
    <TransportContext.Provider value={{
      fleet,
      routeCycles,
      fuelMonthly,
      isLoading,
      isSubmitting,
      loadFleet,
      loadCycles,
      addFuelSlip,
      updateDriver
    }}>
      {children}
    </TransportContext.Provider>
  );
}

export function useTransport() {
  const context = useContext(TransportContext);
  if (context === undefined) {
    throw new Error('useTransport must be used within a TransportProvider');
  }
  return context;
}

import React, { useState } from 'react';
import { Bus, MapPin, Activity, FileText, ChevronRight, ChevronLeft, X, TrendingDown, TrendingUp, AlertTriangle, Users, Wrench, Fuel, UserCog, Check } from 'lucide-react';
import { TransportMap } from '../../components/transport/TransportMap';
import { SlipCycle } from '../../types';
import { useTransport } from '../../context/TransportContext';
import { ALL_DRIVERS } from '../../services/transportApi';

const SCHOOL_COORDS = { lat: 26.34234319025205, lng: 78.94191526267173 };

export function AdminTransport() {
  const { fleet, fuelMonthly, routeCycles, isLoading, updateDriver } = useTransport();

  const [activeTab, setActiveTab] = useState<'Live' | 'Analytics'>('Live');
  const [selectedBus, setSelectedBus] = useState<any | null>(null);
  
  // 3-Level drill-down state for Tab 2
  const [selectedRoute, setSelectedRoute] = useState<any | null>(null);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [selectedCycle, setSelectedCycle] = useState<SlipCycle | null>(null);

  // Change Driver state
  const [changeDriverRoute, setChangeDriverRoute] = useState<string | null>(null);
  const [driverConflict, setDriverConflict] = useState<{
    routeId: string;
    newDriver: string;
    oldRouteId: string;
    oldBusNo: string;
  } | null>(null);

  const [pendingFuelSlips, setPendingFuelSlips] = useState<any[]>([]);

  React.useEffect(() => {
    const fetchPending = () => {
      const pending = JSON.parse(localStorage.getItem('ajps_pending_fuel') || '[]');
      setPendingFuelSlips(pending);
    };
    fetchPending();
    window.addEventListener('storage', fetchPending);
    return () => window.removeEventListener('storage', fetchPending);
  }, []);

  const getStatusColor = (status: string) => {
    if (status === 'In Transit') return 'text-green-600';
    if (status === 'Maintenance') return 'text-orange-500';
    return 'text-[#6B7280]';
  };

  const getStatusBg = (status: string) => {
    if (status === 'In Transit') return 'bg-green-50 border-green-100';
    if (status === 'Maintenance') return 'bg-orange-50 border-orange-100';
    return 'bg-gray-50 border-gray-100';
  };

  const attemptChangeDriver = (routeId: string, newDriver: string) => {
    const existingRoute = fleet.find(r => r.driver === newDriver && r.id !== routeId);
    if (existingRoute) {
      setDriverConflict({
        routeId,
        newDriver,
        oldRouteId: existingRoute.id,
        oldBusNo: existingRoute.busNo
      });
      setChangeDriverRoute(null);
    } else {
      executeChangeDriver(routeId, newDriver);
    }
  };

  const executeChangeDriver = (routeId: string, newDriver: string) => {
    updateDriver(routeId, newDriver);
    setChangeDriverRoute(null);
    if (selectedRoute?.id === routeId) {
      setSelectedRoute((prev: any) => prev ? { ...prev, driver: newDriver } : prev);
    }
  };

  const confirmDriverSwap = () => {
    if (!driverConflict) return;
    executeChangeDriver(driverConflict.routeId, driverConflict.newDriver);
    updateDriver(driverConflict.oldRouteId, 'Unassigned');
    setDriverConflict(null);
  };

  const approveFuelSlip = (slip: any) => {
    // In a real app, this would append to fuelMonthly and routeCycles.
    // For now, remove from pending.
    const updated = pendingFuelSlips.filter(s => s.id !== slip.id);
    setPendingFuelSlips(updated);
    localStorage.setItem('ajps_pending_fuel', JSON.stringify(updated));
    window.dispatchEvent(new Event('storage'));
  };

  const rejectFuelSlip = (id: string) => {
    const updated = pendingFuelSlips.filter(s => s.id !== id);
    setPendingFuelSlips(updated);
    localStorage.setItem('ajps_pending_fuel', JSON.stringify(updated));
    window.dispatchEvent(new Event('storage'));
  };

  // Navigate back helpers
  const goToLevel1 = () => { setSelectedRoute(null); setShowAnalytics(false); setSelectedCycle(null); };
  const goToLevel2 = () => { setShowAnalytics(false); setSelectedCycle(null); };

  return (
    <div className="relative w-full h-[calc(100vh-4rem)] md:h-[calc(100vh-5rem)] bg-[#FAF7F2] overflow-y-auto rounded-xl border border-[#EDE8DF] animate-in fade-in transition-all duration-300">
      
      {/* Tabs */}
      <div className="flex bg-white border-b border-[#EDE8DF] shrink-0 sticky top-0 z-[100]">
        <button 
          onClick={() => { setActiveTab('Live'); goToLevel1(); }}
          className={`flex-1 py-4 text-sm font-bold text-center flex justify-center items-center gap-2 border-b-2 transition-all duration-300 ${activeTab === 'Live' ? 'border-[#8B5E2E] text-[#8B5E2E]' : 'border-transparent text-[#6B5E4E]'}`}
        >
          <Activity className="w-4 h-4" /> Live Fleet
        </button>
        <button 
          onClick={() => { setActiveTab('Analytics'); goToLevel1(); }}
          className={`flex-1 py-4 text-sm font-bold text-center flex justify-center items-center gap-2 border-b-2 transition-all duration-300 ${activeTab === 'Analytics' ? 'border-[#8B5E2E] text-[#8B5E2E]' : 'border-transparent text-[#6B5E4E]'}`}
        >
          <FileText className="w-4 h-4" /> Analytics & Slips
        </button>
      </div>

      <div className="p-4 md:p-6">
        
        {isLoading && fleet.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-[#8B5E2E] animate-in fade-in">
            <div className="w-10 h-10 border-4 border-current border-t-transparent rounded-full animate-spin mb-4" />
            <p className="font-bold text-sm text-[#6B5E4E]">Loading Fleet Data...</p>
          </div>
        )}
        {/* ━━━━━━ TAB 1: Live Fleet Overview ━━━━━━ */}
        {activeTab === 'Live' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-in fade-in duration-300">
            {fleet.map(route => (
              <div 
                key={route.id} 
                onClick={() => setSelectedBus(route)}
                className={`bg-white border cursor-pointer hover:shadow-md transition-all duration-300 rounded-2xl p-5 ${route.status === 'In Transit' ? 'border-[#8B5E2E]/30 shadow-[0_4px_20px_-4px_rgba(139,94,46,0.15)] ring-1 ring-[#8B5E2E]/10' : 'border-[#EDE8DF] shadow-sm'}`}
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="min-w-0">
                    <h3 className="font-bold text-[#1A1208] text-base truncate">{route.name}</h3>
                    <p className="text-xs text-[#6B5E4E] font-medium mt-0.5 truncate">Driver: {route.driver}</p>
                    <p className="text-[10px] text-[#6B7280] mt-0.5 truncate">{route.busNo}</p>
                  </div>
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${route.status === 'In Transit' ? 'bg-[#FDF7EE]' : route.status === 'Maintenance' ? 'bg-orange-50' : 'bg-gray-50'}`}>
                    {route.status === 'Maintenance' ? <Wrench className="w-5 h-5 text-orange-500" /> : <Bus className={`w-5 h-5 ${route.status === 'In Transit' ? 'text-[#8B5E2E]' : 'text-[#6B7280]'}`} />}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5 text-xs text-[#6B5E4E] bg-[#FAF7F2] px-2.5 py-1.5 rounded-lg border border-[#EDE8DF]">
                    <Users className="w-3 h-3" /> {route.totalStudents}
                  </div>
                  <div className="flex-1" />
                  <span className={`text-[10px] font-black uppercase tracking-widest ${getStatusColor(route.status)}`}>{route.status}</span>
                  {route.status === 'In Transit' && <span className="text-xs font-bold text-[#1A1208]">{route.speed} km/h</span>}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ━━━━━━ TAB 2: Analytics — LEVEL 1 (Fleet Overview) ━━━━━━ */}
        {activeTab === 'Analytics' && !selectedRoute && (
          <div className="animate-in fade-in duration-300">
            <h2 className="text-lg font-bold text-[#1A1208] mb-4">Fleet Analytics</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {fleet.map(route => (
                <div key={route.id} className="bg-white border border-[#EDE8DF] rounded-2xl p-5 shadow-sm">
                  <div className="flex items-start justify-between mb-3">
                    <div 
                      className="flex items-center gap-3 min-w-0 flex-1 cursor-pointer group"
                      onClick={() => setSelectedRoute(route)}
                    >
                      <div className="w-10 h-10 bg-[#FAF7F2] rounded-xl flex items-center justify-center border border-[#EDE8DF] shrink-0 group-hover:bg-[#FDF7EE] transition-colors">
                        <Bus className="w-5 h-5 text-[#8B5E2E]" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-sm font-bold text-[#1A1208] truncate group-hover:text-[#8B5E2E] transition-colors">{route.name}</h3>
                        <p className="text-[10px] text-[#6B7280] truncate">{route.busNo}</p>
                      </div>
                    </div>
                  </div>

                  {/* Driver row with Change button */}
                  <div className="flex items-center justify-between mb-3 relative">
                    <p className="text-xs text-[#6B5E4E] truncate">
                      <span className="font-medium">Driver:</span> {route.driver}
                    </p>
                    <button 
                      onClick={(e) => { e.stopPropagation(); setChangeDriverRoute(changeDriverRoute === route.id ? null : route.id); }}
                      className="flex items-center gap-1 text-[10px] font-bold text-[#8B5E2E] bg-[#FAF7F2] px-2 py-1 rounded-lg border border-[#EDE8DF] hover:bg-[#FDF7EE] transition-colors shrink-0"
                    >
                      <UserCog className="w-3 h-3" /> Change
                    </button>

                    {/* Change Driver Dropdown */}
                    {changeDriverRoute === route.id && (
                      <div className="absolute right-0 top-8 z-50 bg-white border border-[#EDE8DF] rounded-xl shadow-lg overflow-hidden w-48 animate-in fade-in zoom-in-95 duration-200">
                        {ALL_DRIVERS.filter(d => d !== route.driver).map(driverName => (
                          <button
                            key={driverName}
                            onClick={(e) => { e.stopPropagation(); attemptChangeDriver(route.id, driverName); }}
                            className="w-full text-left px-3 py-2.5 text-xs font-medium text-[#1A1208] hover:bg-[#FAF7F2] transition-colors border-b border-[#EDE8DF] last:border-0 flex items-center gap-2"
                          >
                            <Users className="w-3 h-3 text-[#8B5E2E]" /> {driverName}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  <div 
                    className="bg-[#FAF7F2] p-3 rounded-xl border border-[#EDE8DF] cursor-pointer hover:bg-[#FDF7EE] transition-colors"
                    onClick={() => setSelectedRoute(route)}
                  >
                    <div className="flex items-center gap-1.5 mb-1">
                      <Fuel className="w-3 h-3 text-[#C5873A]" />
                      <span className="text-[10px] font-bold text-[#6B5E4E] uppercase">Total Fuel This Month</span>
                    </div>
                    <span className="text-xl font-black text-[#1A1208]">
                      {fuelMonthly[route.id] || 0} <span className="text-xs font-medium text-[#6B5E4E]">L</span>
                    </span>
                  </div>

                  <div 
                    className="flex items-center justify-end mt-3 text-[#8B5E2E] cursor-pointer group"
                    onClick={() => setSelectedRoute(route)}
                  >
                    <span className="text-xs font-medium group-hover:underline">View Details</span>
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </div>
                </div>
              ))}
            </div>
            
            {/* Pending Fuel Approvals Section */}
            <div className="mt-8">
              <h2 className="text-lg font-bold text-[#1A1208] mb-4">Pending Fuel Approvals</h2>
              {pendingFuelSlips.length === 0 ? (
                <div className="p-8 bg-white border border-[#EDE8DF] rounded-2xl text-center text-sm text-[#6B5E4E] font-medium">
                  No pending fuel slips.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {pendingFuelSlips.map(slip => (
                    <div key={slip.id} className="bg-white border border-amber-200 rounded-2xl p-4 shadow-sm flex flex-col gap-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-sm font-bold text-[#1A1208]">{slip.driverName}</p>
                          <p className="text-[10px] text-[#6B5E4E]">{new Date(slip.date).toLocaleDateString()}</p>
                        </div>
                        <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded">Pending</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 bg-[#FAF7F2] p-2 rounded-lg border border-[#EDE8DF]">
                        <div>
                          <p className="text-[10px] font-bold text-[#6B5E4E] uppercase">Total Cost</p>
                          <p className="text-sm font-black text-[#1A1208]">₹{slip.totalAmount}</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-[#6B5E4E] uppercase">Liters</p>
                          <p className="text-sm font-black text-[#1A1208]">{slip.liters} L</p>
                        </div>
                      </div>
                      <div className="flex gap-2 mt-auto pt-2">
                        <button onClick={() => approveFuelSlip(slip)} className="flex-1 bg-green-50 text-green-700 text-xs font-bold py-2 rounded-lg border border-green-200 hover:bg-green-100 flex items-center justify-center gap-1"><Check className="w-4 h-4"/> Approve</button>
                        <button onClick={() => rejectFuelSlip(slip.id)} className="flex-1 bg-red-50 text-red-600 text-xs font-bold py-2 rounded-lg border border-red-100 hover:bg-red-100 flex items-center justify-center gap-1"><X className="w-4 h-4"/> Reject</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ━━━━━━ TAB 2: Analytics — LEVEL 2 (Route Details) ━━━━━━ */}
        {activeTab === 'Analytics' && selectedRoute && !showAnalytics && (
          <div className="animate-in slide-in-from-right duration-300">
            <button onClick={goToLevel1} className="flex items-center gap-1 text-[#8B5E2E] font-medium text-sm mb-4 hover:underline transition-all">
              <ChevronLeft className="w-4 h-4" /> Back to Fleet
            </button>

            <div className="bg-white border border-[#EDE8DF] rounded-2xl p-6 shadow-sm mb-6">
              <div className="flex items-center gap-4 mb-5">
                <div className="w-14 h-14 bg-[#FAF7F2] rounded-2xl flex items-center justify-center border border-[#EDE8DF]">
                  <Bus className="w-7 h-7 text-[#8B5E2E]" />
                </div>
                <div className="min-w-0">
                  <h2 className="text-xl font-bold text-[#1A1208] truncate">{selectedRoute.name}</h2>
                  <p className="text-xs text-[#6B5E4E]">{selectedRoute.busNo}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-[#FAF7F2] p-4 rounded-xl border border-[#EDE8DF] text-center">
                  <p className="text-[10px] font-bold text-[#6B5E4E] uppercase mb-1">Driver</p>
                  <p className="text-sm font-bold text-[#1A1208] truncate">{selectedRoute.driver}</p>
                </div>
                <div className="bg-[#FAF7F2] p-4 rounded-xl border border-[#EDE8DF] text-center">
                  <p className="text-[10px] font-bold text-[#6B5E4E] uppercase mb-1">Total Students</p>
                  <p className="text-sm font-bold text-[#1A1208]">{selectedRoute.totalStudents}</p>
                </div>
                <div className="bg-[#FAF7F2] p-4 rounded-xl border border-[#EDE8DF] text-center">
                  <p className="text-[10px] font-bold text-[#6B5E4E] uppercase mb-1">Stops</p>
                  <p className="text-sm font-bold text-[#1A1208]">{selectedRoute.stops}</p>
                </div>
                <div className={`p-4 rounded-xl border text-center ${getStatusBg(selectedRoute.status)}`}>
                  <p className="text-[10px] font-bold text-[#6B5E4E] uppercase mb-1">Status</p>
                  <p className={`text-sm font-bold ${getStatusColor(selectedRoute.status)}`}>{selectedRoute.status}</p>
                </div>
              </div>
            </div>

            {/* Action Button → Level 3 */}
            <button 
              onClick={() => setShowAnalytics(true)}
              className="w-full bg-[#C5873A] text-white px-6 py-4 rounded-xl font-bold text-base shadow-md hover:bg-[#b07530] transition-all duration-300 flex items-center justify-center gap-2"
            >
              <FileText className="w-5 h-5" /> View Route Analytics & Fuel Data
            </button>
          </div>
        )}

        {/* ━━━━━━ TAB 2: Analytics — LEVEL 3 (Route Analytics & Slip Cycles) ━━━━━━ */}
        {activeTab === 'Analytics' && selectedRoute && showAnalytics && (
          <div className="animate-in slide-in-from-right duration-300">
            <button onClick={goToLevel2} className="flex items-center gap-1 text-[#8B5E2E] font-medium text-sm mb-4 hover:underline transition-all">
              <ChevronLeft className="w-4 h-4" /> Back to Route Details
            </button>

            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-[#FAF7F2] rounded-xl flex items-center justify-center border border-[#EDE8DF]">
                <Bus className="w-5 h-5 text-[#8B5E2E]" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-[#1A1208]">{selectedRoute.name} Analytics</h2>
                <p className="text-xs text-[#6B5E4E]">{selectedRoute.driver} • {selectedRoute.busNo}</p>
              </div>
            </div>

            {/* Hero Metric: Last Slip Cycle Mileage */}
            {(() => {
              const cycles = routeCycles[selectedRoute.id] || [];
              const lastCycle = cycles[cycles.length - 1];
              const prevCycle = cycles.length > 1 ? cycles[cycles.length - 2] : null;
              const lastMileage = lastCycle ? ((lastCycle.endOdo - lastCycle.startOdo) / lastCycle.totalFuelLiters) : 0;
              const prevMileage = prevCycle ? ((prevCycle.endOdo - prevCycle.startOdo) / prevCycle.totalFuelLiters) : 0;
              const isImproved = prevCycle ? lastMileage >= prevMileage : true;
              
              return (
                <div className="bg-white border border-[#EDE8DF] rounded-2xl p-6 shadow-sm mb-6">
                  <h3 className="text-[10px] font-black text-[#6B5E4E] uppercase tracking-widest mb-3">Last Slip Cycle Mileage</h3>
                  {lastCycle ? (
                    <div className="flex items-center gap-4">
                      <span className="text-5xl font-black text-[#1A1208]">{lastMileage.toFixed(1)}</span>
                      <span className="text-lg font-bold text-[#6B5E4E]">KM/L</span>
                      {prevCycle && (
                        <div className={`flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-lg ml-auto ${isImproved ? 'text-green-600 bg-green-50 border border-green-100' : 'text-red-500 bg-red-50 border border-red-100'}`}>
                          {isImproved ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                          {Math.abs(lastMileage - prevMileage).toFixed(1)} vs prev
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-[#6B5E4E] font-medium">No slip cycles recorded yet.</p>
                  )}
                </div>
              );
            })()}

            {/* Daily Trip Summary */}
            <div className="bg-white border border-[#EDE8DF] rounded-2xl p-5 shadow-sm mb-6">
              <h3 className="font-bold text-[#1A1208] mb-3 text-sm">Today's Trip KMs</h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-amber-50 p-4 rounded-xl border border-amber-100 flex flex-col items-center">
                  <span className="text-[10px] font-bold text-amber-700 uppercase mb-1">Morning Trip</span>
                  <span className="text-2xl font-black text-amber-900">
                    {selectedRoute.status !== 'Maintenance' ? '23.7' : '---'} <span className="text-xs font-medium">KM</span>
                  </span>
                </div>
                <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 flex flex-col items-center">
                  <span className="text-[10px] font-bold text-blue-700 uppercase mb-1">Afternoon Trip</span>
                  <span className="text-2xl font-black text-blue-900">
                    {selectedRoute.status !== 'Maintenance' ? '22.8' : '---'} <span className="text-xs font-medium">KM</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Slip Cycle History */}
            <div className="bg-white border border-[#EDE8DF] rounded-2xl shadow-sm overflow-hidden">
              <div className="p-4 border-b border-[#EDE8DF] flex justify-between items-center bg-[#FAF7F2]">
                <h3 className="font-bold text-[#1A1208] text-sm">Slip Cycle History</h3>
                <div className="flex gap-2">
                  <select className="bg-white border border-[#EDE8DF] rounded-lg px-3 py-1.5 text-xs font-bold text-[#6B5E4E] outline-none">
                    <option>August 2026</option>
                    <option>July 2026</option>
                  </select>
                  <select className="bg-white border border-[#EDE8DF] rounded-lg px-3 py-1.5 text-xs font-bold text-[#6B5E4E] outline-none">
                    <option>2026</option>
                    <option>Lifetime</option>
                  </select>
                </div>
              </div>
              
              <div className="divide-y divide-[#EDE8DF]">
                {(routeCycles[selectedRoute.id] || []).length === 0 ? (
                  <div className="p-8 text-center text-sm text-[#6B5E4E] font-medium">
                    No slip cycles recorded for this route yet.
                  </div>
                ) : (
                  (routeCycles[selectedRoute.id] || []).map(cycle => {
                    const odoKm = cycle.endOdo - cycle.startOdo;
                    const appTracked = 120; // mock
                    const hasMismatch = Math.abs(odoKm - appTracked) > 2;
                    
                    return (
                      <div 
                        key={cycle.cycleId} 
                        onClick={() => setSelectedCycle(cycle)}
                        className="p-4 flex items-center justify-between hover:bg-gray-50 cursor-pointer transition-colors"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center border shrink-0 ${hasMismatch ? 'bg-red-50 text-red-500 border-red-100' : 'bg-amber-50 text-amber-600 border-amber-100'}`}>
                            {hasMismatch ? <AlertTriangle className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
                          </div>
                          <div className="min-w-0">
                            <h4 className="text-sm font-bold text-[#1A1208] truncate">
                              {new Date(cycle.startDate).toLocaleDateString('en-IN', {day: 'numeric', month: 'short'})} – {new Date(cycle.endDate).toLocaleDateString('en-IN', {day: 'numeric', month: 'short'})}
                            </h4>
                            <div className="flex items-center gap-2 mt-0.5">
                              <p className="text-[10px] text-[#6B5E4E]">Odo: {odoKm} KM</p>
                              <p className="text-[10px] text-blue-600">GPS: {appTracked} KM</p>
                              {hasMismatch && <span className="text-[9px] font-bold text-red-500 bg-red-50 px-1.5 py-0.5 rounded">⚠ MISMATCH</span>}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-4 shrink-0">
                          <div className="text-right hidden sm:block">
                            <p className="text-[10px] font-bold text-[#6B5E4E] uppercase">Fuel</p>
                            <p className="text-sm font-bold text-[#1A1208]">{cycle.totalFuelLiters} L</p>
                          </div>
                          <div className="text-right">
                            <p className="text-[10px] font-bold text-[#6B5E4E] uppercase">Mileage</p>
                            <p className="text-sm font-bold text-[#1A1208]">{(odoKm / cycle.totalFuelLiters).toFixed(1)} km/l</p>
                          </div>
                          <ChevronRight className="w-5 h-5 text-gray-400" />
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ━━━ Live Map Modal ━━━ */}
      {selectedBus && (
        <div className="fixed inset-0 z-[600] flex items-center justify-center p-4 sm:p-8 animate-in fade-in duration-200">
          <div className="absolute inset-0 bg-[#1A1208]/60 backdrop-blur-sm" onClick={() => setSelectedBus(null)} />
          <div className="bg-white w-full max-w-4xl h-full max-h-[800px] rounded-3xl shadow-2xl relative overflow-hidden flex flex-col animate-in zoom-in-95">
            <div className="p-4 border-b border-[#EDE8DF] flex justify-between items-center bg-[#FAF7F2] shrink-0">
              <div>
                <h2 className="font-bold text-[#1A1208] flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-[#8B5E2E]" /> {selectedBus.name}
                </h2>
                <p className="text-xs text-[#6B5E4E] mt-0.5">{selectedBus.driver} • {selectedBus.busNo}</p>
              </div>
              <button onClick={() => setSelectedBus(null)} className="p-2 hover:bg-white rounded-full transition-colors">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="flex-1 relative">
              <TransportMap 
                mode={selectedBus.status === 'In Transit' ? 'Live' : 'Admin'} 
                schoolCoords={SCHOOL_COORDS}
                currentLocation={selectedBus.location}
                remainingKm={12.4}
                currentSpeed={selectedBus.speed}
              />
            </div>
          </div>
        </div>
      )}

      {/* ━━━ Slip Cycle Detail Modal ━━━ */}
      {selectedCycle && (
        <div className="fixed inset-0 z-[600] flex items-center justify-center p-4 sm:p-8 animate-in fade-in duration-200">
          <div className="absolute inset-0 bg-[#1A1208]/60 backdrop-blur-sm" onClick={() => setSelectedCycle(null)} />
          <div className="bg-white w-full max-w-3xl rounded-3xl shadow-2xl relative flex flex-col overflow-hidden animate-in slide-in-from-bottom-8">
            <div className="p-5 border-b border-[#EDE8DF] flex justify-between items-center bg-[#FAF7F2] shrink-0">
              <div>
                <h2 className="font-bold text-[#1A1208] text-lg">Cycle Audit Report</h2>
                <p className="text-xs font-medium text-[#6B5E4E]">
                  {new Date(selectedCycle.startDate).toLocaleDateString('en-IN', {day: 'numeric', month: 'long'})} to {new Date(selectedCycle.endDate).toLocaleDateString('en-IN', {day: 'numeric', month: 'long'})}
                </p>
              </div>
              <button onClick={() => setSelectedCycle(null)} className="p-2 hover:bg-white rounded-full transition-colors">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            
            <div className="flex flex-col md:flex-row flex-1 min-h-0 overflow-y-auto">
              {/* Receipt Image Side */}
              <div className="w-full md:w-1/2 p-6 bg-gray-50/50 flex flex-col items-center justify-center border-b md:border-b-0 md:border-r border-[#EDE8DF]">
                <div className="w-full aspect-[3/4] bg-gray-200 rounded-2xl flex flex-col items-center justify-center text-gray-400 border-2 border-dashed border-gray-300 relative overflow-hidden">
                  <FileText className="w-12 h-12 mb-2 opacity-50" />
                  <span className="font-bold text-sm">Receipt Image</span>
                  <div className="absolute bottom-0 w-full bg-black/50 text-white text-[10px] text-center py-1">Mock OCR Verified</div>
                </div>
              </div>
              
              {/* Stats Side */}
              <div className="w-full md:w-1/2 p-6 space-y-5">
                <div>
                  <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Mileage Performance</h4>
                  <div className="flex items-center gap-4">
                    <span className="text-4xl font-black text-[#1A1208]">
                      {((selectedCycle.endOdo - selectedCycle.startOdo) / selectedCycle.totalFuelLiters).toFixed(1)}
                    </span>
                    <span className="text-sm font-bold text-gray-500">km/l</span>
                  </div>
                </div>
                
                <div className="h-px bg-[#EDE8DF]" />

                <div>
                  <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Distance Verification</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center bg-blue-50 p-3 rounded-xl border border-blue-100">
                      <span className="text-xs font-bold text-blue-800">App Tracked KMs</span>
                      <span className="text-sm font-black text-blue-900">120 KM</span>
                    </div>
                    <div className="flex justify-between items-center bg-gray-50 p-3 rounded-xl border border-gray-200">
                      <span className="text-xs font-bold text-gray-600">Odometer KMs</span>
                      <span className="text-sm font-black text-gray-800">{selectedCycle.endOdo - selectedCycle.startOdo} KM</span>
                    </div>
                    
                    {Math.abs(120 - (selectedCycle.endOdo - selectedCycle.startOdo)) > 2 && (
                      <div className="flex items-start gap-2 text-red-600 text-[11px] font-medium bg-red-50 p-3 rounded-xl border border-red-100">
                        <AlertTriangle className="w-4 h-4 shrink-0" />
                        Odometer discrepancy detected! The driver claimed distance exceeds the system tolerance limit.
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div className="bg-[#FAF7F2] p-3 rounded-xl border border-[#EDE8DF]">
                    <p className="text-[10px] font-bold text-[#6B5E4E] uppercase mb-1">Fuel Added</p>
                    <p className="font-bold text-[#1A1208]">{selectedCycle.totalFuelLiters} L</p>
                  </div>
                  <div className="bg-[#FAF7F2] p-3 rounded-xl border border-[#EDE8DF]">
                    <p className="text-[10px] font-bold text-[#6B5E4E] uppercase mb-1">Total Cost</p>
                    <p className="font-bold text-[#1A1208]">₹{selectedCycle.totalCost}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ━━━ Driver Swap Warning Modal ━━━ */}
      {driverConflict && (
        <div className="fixed inset-0 z-[700] flex items-center justify-center p-4 sm:p-8 animate-in fade-in duration-200">
          <div className="absolute inset-0 bg-[#1A1208]/60 backdrop-blur-sm" onClick={() => setDriverConflict(null)} />
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl relative overflow-hidden flex flex-col animate-in zoom-in-95 p-6">
            <div className="flex items-center gap-4 text-orange-600 mb-4">
              <div className="w-12 h-12 bg-orange-50 rounded-full flex items-center justify-center border border-orange-100 shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-bold">Driver Reassignment</h2>
            </div>
            <p className="text-sm text-gray-600 mb-6 leading-relaxed">
              <strong>{driverConflict.newDriver}</strong> is already assigned to <strong>{driverConflict.oldBusNo}</strong>. 
              If you proceed, they will be removed from their current bus and assigned to the new route. The old bus will become <span className="font-bold text-red-500">Unassigned</span>.
            </p>
            <div className="flex justify-end gap-3">
              <button 
                onClick={() => setDriverConflict(null)}
                className="px-5 py-2.5 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-100 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDriverSwap}
                className="px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-orange-600 hover:bg-orange-700 transition-colors shadow-md"
              >
                Overwrite & Assign
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

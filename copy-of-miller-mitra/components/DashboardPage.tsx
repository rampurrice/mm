import React, { useState, useEffect, useMemo } from 'react';
import { ReleaseOrder, LiftingRecord, DailyStockLog } from '../types';
import { getSafely, isReleaseOrder, isLiftingRecord, isDailyStockLog } from '../utils';

interface GodownSummary {
  total: number;
  lifted: number;
}

interface DashboardPageProps {
  currentSeason: string;
  currentUser: string;
}

const DashboardPage = ({ currentSeason, currentUser }: DashboardPageProps) => {
  const [summary, setSummary] = useState<Record<string, GodownSummary>>({});
  const [dailyLogs, setDailyLogs] = useState<DailyStockLog[]>([]);

  useEffect(() => {
    if (!currentSeason || !currentUser) return;

    const releaseOrders = getSafely(`${currentUser}_releaseOrders_${currentSeason}`, isReleaseOrder);
    const liftingRecords = getSafely(`${currentUser}_liftingRecords_${currentSeason}`, isLiftingRecord);
    const dailyLogsData = getSafely(`${currentUser}_dailyStockLogs_${currentSeason}`, isDailyStockLog);

    setDailyLogs(dailyLogsData);
    
    const godownSummary: Record<string, GodownSummary> = {};

    // Calculate total allotted quantity per godown
    releaseOrders.forEach(ro => {
      if (!godownSummary[ro.godown]) {
        godownSummary[ro.godown] = { total: 0, lifted: 0 };
      }
      godownSummary[ro.godown].total += parseFloat(ro.quantity) || 0;
    });

    // Calculate total lifted quantity per godown
    liftingRecords.forEach(lr => {
      if (godownSummary[lr.godown]) {
        godownSummary[lr.godown].lifted += lr.netPaddyQuantity || 0;
      }
    });
    
    setSummary(godownSummary);
      
  }, [currentSeason, currentUser]);

  const liftingTotals = useMemo(() => {
    return Object.values(summary).reduce((acc, data) => {
        acc.total += data.total;
        acc.lifted += data.lifted;
        return acc;
    }, { total: 0, lifted: 0 });
  }, [summary]);

  const productionSummary = useMemo(() => {
    if (dailyLogs.length === 0) {
        return { produced: 0 };
    }
    const totalProduced = dailyLogs.reduce((sum, log) => sum + log.riceQuantity, 0);
    return { produced: totalProduced };
  }, [dailyLogs]);

  const totalPending = liftingTotals.total - liftingTotals.lifted;

  return (
    <div className="space-y-8 animate-fade-in">
        <div>
            <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
            <p className="mt-2 text-slate-600">High-level overview of your milling operations for season <span className="font-semibold">{currentSeason}</span>.</p>
        </div>
        
        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-blue-100 p-6 rounded-lg shadow-sm border border-blue-200">
                <h3 className="text-blue-800 font-semibold text-lg">Total Allotted Paddy</h3>
                <p className="text-3xl font-bold text-blue-900 mt-2">{liftingTotals.total.toFixed(2)} <span className="text-lg font-medium">Qtls</span></p>
            </div>
             <div className="bg-green-100 p-6 rounded-lg shadow-sm border border-green-200">
                <h3 className="text-green-800 font-semibold text-lg">Total Paddy Lifted</h3>
                <p className="text-3xl font-bold text-green-900 mt-2">{liftingTotals.lifted.toFixed(3)} <span className="text-lg font-medium">Qtls</span></p>
            </div>
             <div className="bg-orange-100 p-6 rounded-lg shadow-sm border border-orange-200">
                <h3 className="text-orange-800 font-semibold text-lg">Pending for Lifting</h3>
                <p className="text-3xl font-bold text-orange-900 mt-2">{totalPending.toFixed(3)} <span className="text-lg font-medium">Qtls</span></p>
            </div>
             <div className="bg-teal-100 p-6 rounded-lg shadow-sm border border-teal-200">
                <h3 className="text-teal-800 font-semibold text-lg">Total Rice Produced</h3>
                <p className="text-3xl font-bold text-teal-900 mt-2">{productionSummary.produced.toFixed(3)} <span className="text-lg font-medium">Qtls</span></p>
            </div>
        </div>
    </div>
  );
};

export default DashboardPage;
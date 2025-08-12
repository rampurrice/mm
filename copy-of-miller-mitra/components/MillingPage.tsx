import React, { useState, useEffect, useMemo } from 'react';
import { DailyStockLog, LiftingRecord, RiceDeliveryRecord } from '../types';
import TurnoutPieChart from './TurnoutPieChart';
import { getRawArraySafely } from '../utils';

interface MillingPageProps {
  currentSeason: string;
  currentUser: string;
}

const PADDY_BAG_WEIGHT_QTL = 0.4; // 40kg per bag is 0.4 Quintals, used as a fallback.
const RICE_BAG_WEIGHT_QTL = 0.5; // 50kg per bag is 0.5 Quintals.
const FRK_BLENDING_RATIO = 0.01; // 1%

const initialLogState: Partial<DailyStockLog> = {
    paddyBagsOpenedNew: 0,
    paddyBagsOpenedUsed: 0,
    paddyConsumedQtls: 0,
    riceBagsNew: 0,
    riceQuantity: 0,
    branSold: 0,
    huskSold: 0,
    sortexBrokenSold: 0,
    nonSortexBrokenSold: 0,
    murgidanaSold: 0,
    rejectionSold: 0,
    workInProgressQtls: 0,
};

const migrateDailyLogs = (logs: any[]): DailyStockLog[] => {
    if (!Array.isArray(logs)) return [];
    return logs
        .filter(log => log && typeof log === 'object')
        .map(log => {
            if (log.hasOwnProperty('paddyBagsOpened')) {
                const { paddyBagsOpened, ...rest } = log;
                return {
                    ...initialLogState,
                    ...rest,
                    paddyBagsOpenedNew: paddyBagsOpened || 0,
                    paddyBagsOpenedUsed: 0,
                } as DailyStockLog;
            }
            return { ...initialLogState, ...log } as DailyStockLog;
        });
};

const migrateLiftingRecords = (records: any[]): LiftingRecord[] => {
    if (!Array.isArray(records)) return [];
    return records
        .filter(record => record && typeof record === 'object')
        .map(record => {
          return {
            ...record,
            numberOfNewBags: record.numberOfNewBags || 0,
            numberOfUsedBags: record.numberOfUsedBags || 0,
          } as LiftingRecord;
        });
};


const MillingPage = ({ currentSeason, currentUser }: MillingPageProps) => {
    const [dailyLogs, setDailyLogs] = useState<DailyStockLog[]>([]);
    const [liftingRecords, setLiftingRecords] = useState<LiftingRecord[]>([]);
    const [riceDeliveryRecords, setRiceDeliveryRecords] = useState<RiceDeliveryRecord[]>([]);
    
    // Modal & Form State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [currentLog, setCurrentLog] = useState<Partial<DailyStockLog>>(initialLogState);
    const [modalError, setModalError] = useState<string | null>(null);

    useEffect(() => {
        if (!currentSeason || !currentUser) return;

        const rawLogs = getRawArraySafely(`${currentUser}_dailyStockLogs_${currentSeason}`);
        const migratedLogs = migrateDailyLogs(rawLogs);
        setDailyLogs(migratedLogs);
        
        const rawLifting = getRawArraySafely(`${currentUser}_liftingRecords_${currentSeason}`);
        const migratedLifting = migrateLiftingRecords(rawLifting);
        setLiftingRecords(migratedLifting);
        
        const rawDeliveries = getRawArraySafely(`${currentUser}_riceDeliveryRecords_${currentSeason}`);
        setRiceDeliveryRecords(rawDeliveries);

    }, [currentSeason, currentUser]);

    useEffect(() => {
        if (!currentSeason || !currentUser) return;
        try {
            localStorage.setItem(`${currentUser}_dailyStockLogs_${currentSeason}`, JSON.stringify(dailyLogs));
        } catch (error) {
            console.error("Failed to save daily stock logs to localStorage", error);
        }
    }, [dailyLogs, currentSeason, currentUser]);
    
    useEffect(() => {
        // Auto-calculate rice quantity when rice bags change in the modal
        if (!isModalOpen) return;
        const newRiceQuantity = (currentLog.riceBagsNew || 0) * RICE_BAG_WEIGHT_QTL;
        if (newRiceQuantity !== currentLog.riceQuantity) {
            setCurrentLog(prev => ({
                ...prev,
                riceQuantity: newRiceQuantity
            }));
        }
    }, [currentLog.riceBagsNew, isModalOpen]);

    const paddyStats = useMemo(() => {
        const totalLiftedQtls = liftingRecords.reduce((sum, rec) => sum + rec.netPaddyQuantity, 0);
        const totalNewBagsLifted = liftingRecords.reduce((sum, rec) => sum + rec.numberOfNewBags, 0);
        const totalUsedBagsLifted = liftingRecords.reduce((sum, rec) => sum + rec.numberOfUsedBags, 0);
        const totalBagsLifted = totalNewBagsLifted + totalUsedBagsLifted;
        const averageBagWeightQtls = totalBagsLifted > 0 ? totalLiftedQtls / totalBagsLifted : PADDY_BAG_WEIGHT_QTL;
        return { totalLiftedQtls, totalNewBagsLifted, totalUsedBagsLifted, averageBagWeightQtls };
    }, [liftingRecords]);

    const sortedLogsWithWip = useMemo(() => {
        const sorted = [...dailyLogs].sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime()); // oldest to newest
        let runningWip = 0;
        
        const processedLogs = sorted.map(log => {
            const paddyConsumed = (log.paddyBagsOpenedNew + log.paddyBagsOpenedUsed) * paddyStats.averageBagWeightQtls;
            const availableForProcessing = paddyConsumed + runningWip;
            const totalOutput = log.riceQuantity + log.branSold + log.huskSold + log.sortexBrokenSold + log.nonSortexBrokenSold + log.murgidanaSold + (log.rejectionSold || 0);
            const closingWip = availableForProcessing - totalOutput;

            runningWip = closingWip > 0 ? closingWip : 0;
            
            return { 
                ...log, 
                paddyConsumedQtls: paddyConsumed, 
                workInProgressQtls: closingWip 
            };
        });
        
        return processedLogs.reverse(); // newest first for display
    }, [dailyLogs, paddyStats.averageBagWeightQtls]);
    

    const stockSummary = useMemo(() => {
        const totalNewBagsOpened = dailyLogs.reduce((sum, log) => sum + (log.paddyBagsOpenedNew || 0), 0);
        const totalUsedBagsOpened = dailyLogs.reduce((sum, log) => sum + (log.paddyBagsOpenedUsed || 0), 0);

        return {
            liftedNew: paddyStats.totalNewBagsLifted,
            liftedUsed: paddyStats.totalUsedBagsLifted,
            openedNew: totalNewBagsOpened,
            openedUsed: totalUsedBagsOpened,
            currentStockNew: paddyStats.totalNewBagsLifted - totalNewBagsOpened,
            currentStockUsed: paddyStats.totalUsedBagsLifted - totalUsedBagsOpened,
            currentStockTotalBags: (paddyStats.totalNewBagsLifted + paddyStats.totalUsedBagsLifted) - (totalNewBagsOpened + totalUsedBagsOpened),
            currentStockTotalQtls: sortedLogsWithWip[0]?.workInProgressQtls + (paddyStats.totalLiftedQtls - sortedLogsWithWip.reduce((sum,log) => sum + log.paddyConsumedQtls, 0)) || paddyStats.totalLiftedQtls,
        }
    }, [dailyLogs, paddyStats, sortedLogsWithWip]);
    
    const emptyBagSummary = useMemo(() => {
        // Supply of empty bags comes from opening new paddy bags.
        const newPaddyBagsOpened = dailyLogs.reduce((sum, log) => sum + (log.paddyBagsOpenedNew || 0), 0);
        
        // Consumption of empty bags is for delivering finished rice.
        const bagsUsedForRiceDelivery = riceDeliveryRecords.reduce((sum, rec) => sum + (rec.bagsDelivered || 0), 0);

        return {
            netAvailable: newPaddyBagsOpened - bagsUsedForRiceDelivery
        };
    }, [dailyLogs, riceDeliveryRecords]);

    const handleOpenModal = (logToEdit?: DailyStockLog) => {
        setModalError(null);
        if (logToEdit) {
            setIsEditing(true);
            setCurrentLog({ ...logToEdit });
        } else {
            setIsEditing(false);
            setCurrentLog({ ...initialLogState, date: new Date().toISOString().split('T')[0] });
        }
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setCurrentLog(initialLogState);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setCurrentLog(prev => ({
            ...prev,
            [name]: e.target.type === 'date' ? value : parseFloat(value) || 0,
        }));
    };

    const handleSaveLog = () => {
        setModalError(null);
        if (!currentLog.date) {
            setModalError('Please select a Date for the log entry.');
            return;
        }

        // --- Create a temporary list of logs to perform validation ---
        const tempLog = { ...initialLogState, ...currentLog };
        let tempLogList = isEditing 
            ? dailyLogs.map(l => l.id === tempLog.id ? (tempLog as DailyStockLog) : l)
            : [...dailyLogs, tempLog as DailyStockLog];
            
        tempLogList.sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());

        // --- Run validation across the entire chain ---
        let wip = 0;
        for (const log of tempLogList) {
            const consumed = (log.paddyBagsOpenedNew + log.paddyBagsOpenedUsed) * paddyStats.averageBagWeightQtls;
            const available = consumed + wip;
            const output = log.riceQuantity + log.branSold + log.huskSold + log.sortexBrokenSold + log.nonSortexBrokenSold + log.murgidanaSold + (log.rejectionSold || 0);

            if (output > available + 0.001) { // Add tolerance
                setModalError(`Validation Error on date ${new Date(log.date).toLocaleDateString()}: Total output (${output.toFixed(3)} Qtls) exceeds available paddy (${available.toFixed(3)} Qtls). Please check your entries.`);
                return;
            }
            wip = available - output;
            wip = wip > 0 ? wip : 0;
        }

        // --- If validation passes, save the log ---
        const finalLog = isEditing && currentLog.id 
            ? { ...currentLog } as DailyStockLog
            : { ...initialLogState, id: `daily-${Date.now()}`, ...currentLog } as DailyStockLog;

        if (isEditing) {
            setDailyLogs(prev => prev.map(log => log.id === finalLog.id ? finalLog : log));
        } else {
            setDailyLogs(prev => [...prev, finalLog]);
        }
        
        handleCloseModal();
    };
    
    const handleDeleteLog = (id: string) => {
        if(window.confirm('Are you sure you want to delete this daily log entry? This may affect WIP calculations for subsequent entries.')) {
            setDailyLogs(prev => prev.filter(log => log.id !== id));
        }
    };
    
    const totals = useMemo(() => {
        return sortedLogsWithWip.reduce((acc, log) => {
            acc.paddyBagsOpenedNew += log.paddyBagsOpenedNew || 0;
            acc.paddyBagsOpenedUsed += log.paddyBagsOpenedUsed || 0;
            acc.paddyConsumedQtls += log.paddyConsumedQtls || 0;
            acc.riceBagsNew += log.riceBagsNew || 0;
            acc.riceQuantity += log.riceQuantity;
            acc.branSold += log.branSold;
            acc.huskSold += log.huskSold;
            acc.sortexBrokenSold += log.sortexBrokenSold;
            acc.nonSortexBrokenSold += log.nonSortexBrokenSold;
            acc.murgidanaSold += log.murgidanaSold;
            acc.rejectionSold += log.rejectionSold || 0;
            return acc;
        }, { paddyBagsOpenedNew: 0, paddyBagsOpenedUsed: 0, paddyConsumedQtls: 0, riceBagsNew: 0, riceQuantity: 0, branSold: 0, huskSold: 0, sortexBrokenSold: 0, nonSortexBrokenSold: 0, murgidanaSold: 0, rejectionSold: 0 });
    }, [sortedLogsWithWip]);
    
    const inputClass = "w-full bg-white border border-slate-300 rounded-md shadow-sm px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500";
    const labelClass = "block text-sm font-medium text-slate-700 mb-1";
    
    return (
        <div className="space-y-8 animate-fade-in">
            <div className="flex justify-between items-start">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Daily Stock & Sales Log</h1>
                    <p className="mt-2 text-slate-600">Record daily production, sales, and stock for season <span className="font-semibold">{currentSeason}</span>.</p>
                </div>
                <button
                    onClick={() => handleOpenModal()}
                    className="px-6 py-3 font-semibold text-white bg-green-600 rounded-lg shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all duration-150 whitespace-nowrap"
                >
                    Log Daily Entry
                </button>
            </div>
            
             {/* Paddy Stock Summary */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-blue-100 p-4 rounded-lg border border-blue-200">
                    <h3 className="text-blue-800 font-semibold text-sm">Total Paddy Bags Lifted</h3>
                    <p className="text-2xl font-bold text-blue-900 mt-1">{(stockSummary.liftedNew + stockSummary.liftedUsed).toLocaleString()}</p>
                </div>
                <div className="bg-red-100 p-4 rounded-lg border border-red-200">
                    <h3 className="text-red-800 font-semibold text-sm">Total Paddy Bags Opened</h3>
                    <p className="text-2xl font-bold text-red-900 mt-1">{(stockSummary.openedNew + stockSummary.openedUsed).toLocaleString()}</p>
                </div>
                <div className="bg-green-100 p-4 rounded-lg border border-green-200">
                    <h3 className="text-green-800 font-semibold text-sm">Current Paddy Stock</h3>
                    <p className="text-2xl font-bold text-green-900 mt-1">{stockSummary.currentStockTotalBags.toLocaleString()} Bags</p>
                    <p className="text-xs text-green-700">~{stockSummary.currentStockTotalQtls.toFixed(3)} Qtls</p>
                </div>
                <div className="bg-purple-100 p-4 rounded-lg border border-purple-200">
                    <h3 className="text-purple-800 font-semibold text-sm">Net Empty New Bags</h3>
                    <p className="text-2xl font-bold text-purple-900 mt-1">{emptyBagSummary.netAvailable.toLocaleString()} Bags</p>
                    <p className="text-xs text-purple-700">Available for packaging</p>
                </div>
            </div>

            <TurnoutPieChart dailyLogs={sortedLogsWithWip} />

            <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full text-sm text-left text-slate-600">
                        <thead className="bg-slate-50 border-b border-slate-200 text-xs text-slate-500 uppercase tracking-wider">
                            <tr>
                                <th scope="col" className="px-4 py-3 font-medium">Date</th>
                                <th scope="col" className="px-4 py-3 font-medium text-right">Paddy Consumed (Qtls)</th>
                                <th scope="col" className="px-4 py-3 font-medium text-right">Rice Produced (Qtls)</th>
                                <th scope="col" className="px-4 py-3 font-medium text-right">Bran (Qtls)</th>
                                <th scope="col" className="px-4 py-3 font-medium text-right">Husk (Qtls)</th>
                                <th scope="col" className="px-4 py-3 font-medium text-right">Broken (Qtls)</th>
                                <th scope="col" className="px-4 py-3 font-medium text-right">Murgidana (Qtls)</th>
                                <th scope="col" className="px-4 py-3 font-medium text-right">Rejection (Qtls)</th>
                                <th scope="col" className="px-4 py-3 font-medium text-right">WIP / Loss (Qtls)</th>
                                <th scope="col" className="px-4 py-3 font-medium text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                            {sortedLogsWithWip.length > 0 ? sortedLogsWithWip.map(log => (
                                <tr key={log.id} className="hover:bg-slate-50">
                                    <td className="px-4 py-3 whitespace-nowrap">{new Date(log.date).toLocaleDateString()}</td>
                                    <td className="px-4 py-3 text-right font-semibold text-orange-600">-{log.paddyConsumedQtls.toFixed(3)}</td>
                                    <td className="px-4 py-3 text-right font-bold text-green-600">+{log.riceQuantity.toFixed(3)}</td>
                                    <td className="px-4 py-3 text-right text-purple-600">+{log.branSold.toFixed(3)}</td>
                                    <td className="px-4 py-3 text-right text-gray-500">+{log.huskSold.toFixed(3)}</td>
                                    <td className="px-4 py-3 text-right text-teal-600">+{(log.sortexBrokenSold + log.nonSortexBrokenSold).toFixed(3)}</td>
                                    <td className="px-4 py-3 text-right text-yellow-600">+{log.murgidanaSold.toFixed(3)}</td>
                                    <td className="px-4 py-3 text-right text-red-700">+{log.rejectionSold.toFixed(3)}</td>
                                    <td className="px-4 py-3 text-right font-medium text-red-500">{log.workInProgressQtls.toFixed(3)}</td>
                                    <td className="px-4 py-3 text-center whitespace-nowrap">
                                        <button onClick={() => handleOpenModal(log)} className="font-medium text-blue-600 hover:text-blue-800 px-2 py-1 rounded-md hover:bg-blue-100 transition-colors">Edit</button>
                                        <button onClick={() => handleDeleteLog(log.id)} className="ml-2 font-medium text-red-600 hover:text-red-800 px-2 py-1 rounded-md hover:bg-red-100 transition-colors">Delete</button>
                                    </td>
                                </tr>
                            )) : (
                                <tr><td colSpan={10} className="text-center py-10 text-slate-500">No daily logs recorded for this season yet.</td></tr>
                            )}
                        </tbody>
                         <tfoot className="bg-slate-100 border-t-2 border-slate-300">
                             <tr className="font-bold text-slate-800">
                                <td className="px-4 py-3">Totals</td>
                                <td className="px-4 py-3 text-right">-{totals.paddyConsumedQtls.toFixed(3)}</td>
                                <td className="px-4 py-3 text-right">+{totals.riceQuantity.toFixed(3)}</td>
                                <td className="px-4 py-3 text-right">+{totals.branSold.toFixed(3)}</td>
                                <td className="px-4 py-3 text-right">+{totals.huskSold.toFixed(3)}</td>
                                <td className="px-4 py-3 text-right">+{(totals.sortexBrokenSold + totals.nonSortexBrokenSold).toFixed(3)}</td>
                                <td className="px-4 py-3 text-right">+{totals.murgidanaSold.toFixed(3)}</td>
                                <td className="px-4 py-3 text-right">+{totals.rejectionSold.toFixed(3)}</td>
                                <td className="px-4 py-3 text-right">{sortedLogsWithWip[0]?.workInProgressQtls.toFixed(3) || '0.000'}</td>
                                <td></td>
                             </tr>
                        </tfoot>
                    </table>
                </div>
            </div>

            {isModalOpen && (
                 <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in-fast">
                    <div className="bg-white rounded-lg shadow-2xl w-full max-w-3xl m-4" role="dialog" aria-modal="true">
                        <div className="px-6 py-4 border-b border-slate-200">
                            <h3 className="text-lg font-bold text-slate-800">{isEditing ? 'Edit Daily Log' : 'Log Daily Stock & Sales'}</h3>
                        </div>
                        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                            {modalError && <p className="text-sm text-red-600 bg-red-50 p-3 rounded-md border border-red-200 whitespace-pre-wrap">{modalError}</p>}
                            
                            <div>
                                <label htmlFor="date" className={labelClass}>Date</label>
                                <input type="date" id="date" name="date" value={currentLog.date?.split('T')[0] || ''} onChange={handleInputChange} className={inputClass} />
                            </div>

                            <div className="p-4 bg-orange-50 rounded-lg border border-orange-200 space-y-4">
                                <h4 className="font-semibold text-orange-800">Paddy Consumption</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label htmlFor="paddyBagsOpenedNew" className={labelClass}>No. of New Paddy Bags Opened</label>
                                        <input type="number" id="paddyBagsOpenedNew" name="paddyBagsOpenedNew" value={currentLog.paddyBagsOpenedNew || ''} onChange={handleInputChange} className={inputClass} placeholder="e.g., 400" />
                                        <p className="text-xs text-slate-500 mt-1">Available: {stockSummary.currentStockNew.toLocaleString()}</p>
                                    </div>
                                     <div>
                                        <label htmlFor="paddyBagsOpenedUsed" className={labelClass}>No. of Used Paddy Bags Opened</label>
                                        <input type="number" id="paddyBagsOpenedUsed" name="paddyBagsOpenedUsed" value={currentLog.paddyBagsOpenedUsed || ''} onChange={handleInputChange} className={inputClass} placeholder="e.g., 100" />
                                        <p className="text-xs text-slate-500 mt-1">Available: {stockSummary.currentStockUsed.toLocaleString()}</p>
                                    </div>
                                </div>
                                <div className="text-sm text-orange-700">
                                    Approx. Paddy Consumed: <span className="font-bold">{(((currentLog.paddyBagsOpenedNew || 0) + (currentLog.paddyBagsOpenedUsed || 0)) * paddyStats.averageBagWeightQtls).toFixed(3)}</span> Qtls
                                </div>
                            </div>

                            <div className="p-4 bg-green-50 rounded-lg border border-green-200 space-y-4">
                                <h4 className="font-semibold text-green-800">Rice Production</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label htmlFor="riceBagsNew" className={labelClass}>No. of New Rice Bags</label>
                                        <input type="number" id="riceBagsNew" name="riceBagsNew" value={currentLog.riceBagsNew || ''} onChange={handleInputChange} className={inputClass} placeholder="e.g., 200" />
                                    </div>
                                    <div>
                                        <label htmlFor="riceQuantity" className={labelClass}>Rice Quantity (in Qtls)</label>
                                        <input type="number" id="riceQuantity" name="riceQuantity" value={currentLog.riceQuantity || 0} className={`${inputClass} bg-slate-100 cursor-not-allowed`} placeholder="Auto-calculated" readOnly />
                                        <p className="text-xs text-slate-500 mt-1">Auto-calculated: Bags × 50kg.</p>
                                    </div>
                                </div>
                                <div className="text-sm text-purple-700">
                                    Required FRK for this production: <span className="font-bold">{((currentLog.riceQuantity || 0) * FRK_BLENDING_RATIO).toFixed(4)}</span> Qtls
                                </div>
                            </div>
                            
                            <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200 space-y-4">
                               <h4 className="font-semibold text-yellow-800">By-product Sales (in Quintals)</h4>
                               <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div>
                                        <label htmlFor="branSold" className={labelClass}>Bran Sold</label>
                                        <input type="number" id="branSold" name="branSold" value={currentLog.branSold || ''} onChange={handleInputChange} className={inputClass} placeholder="e.g., 5.00" />
                                    </div>
                                    <div>
                                        <label htmlFor="huskSold" className={labelClass}>Husk Sold</label>
                                        <input type="number" id="huskSold" name="huskSold" value={currentLog.huskSold || ''} onChange={handleInputChange} className={inputClass} placeholder="e.g., 25.00" />
                                    </div>
                                     <div>
                                        <label htmlFor="sortexBrokenSold" className={labelClass}>Sortex Broken Sold</label>
                                        <input type="number" id="sortexBrokenSold" name="sortexBrokenSold" value={currentLog.sortexBrokenSold || ''} onChange={handleInputChange} className={inputClass} placeholder="e.g., 1.00" />
                                    </div>
                                     <div>
                                        <label htmlFor="nonSortexBrokenSold" className={labelClass}>Non-Sortex Broken Sold</label>
                                        <input type="number" id="nonSortexBrokenSold" name="nonSortexBrokenSold" value={currentLog.nonSortexBrokenSold || ''} onChange={handleInputChange} className={inputClass} placeholder="e.g., 1.50" />
                                    </div>
                                     <div>
                                        <label htmlFor="murgidanaSold" className={labelClass}>Murgidana Sold</label>
                                        <input type="number" id="murgidanaSold" name="murgidanaSold" value={currentLog.murgidanaSold || ''} onChange={handleInputChange} className={inputClass} placeholder="e.g., 0.50" />
                                    </div>
                                     <div>
                                        <label htmlFor="rejectionSold" className={labelClass}>Rejection Sold</label>
                                        <input type="number" id="rejectionSold" name="rejectionSold" value={currentLog.rejectionSold || ''} onChange={handleInputChange} className={inputClass} placeholder="e.g., 0.20" />
                                    </div>
                               </div>
                            </div>
                        </div>
                        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end space-x-3">
                            <button onClick={handleCloseModal} className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500">Cancel</button>
                            <button onClick={handleSaveLog} className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500">{isEditing ? 'Save Changes' : 'Save Log'}</button>
                        </div>
                    </div>
                 </div>
            )}
        </div>
    );
};

export default MillingPage;
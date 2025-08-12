import React, { useState, useEffect, useMemo } from 'react';
import { LiftingRecord, ReleaseOrder, DailyStockLog, RiceDeliveryRecord, FrkRecord } from '../types';
import { getSafely, getRawArraySafely, isReleaseOrder, isDailyStockLog, isRiceDeliveryRecord, isFrkRecord } from '../utils';

interface ReportsPageProps {
  currentSeason: string;
  currentUser: string;
}

const CMR_TURNOUT_RATIO = 0.67; // 67% turnout from paddy to rice
const PADDY_BAG_WEIGHT_QTL = 0.4; // 40kg per bag is 0.4 Quintals, used as a fallback.
const RICE_BAG_WEIGHT_QTL = 0.5; // 50kg per bag
const FRK_BLENDING_RATIO = 0.01; // 1% Fortified Rice Kernel blending ratio

// This utility handles the conversion of old data records to the new format.
const migrateLiftingRecords = (records: any[]): LiftingRecord[] => {
    if (!Array.isArray(records)) return [];
    return records
        .filter(record => record && typeof record === 'object')
        .map(record => {
            if (record.hasOwnProperty('bagType') && record.hasOwnProperty('numberOfBags')) {
                const { bagType, numberOfBags, ...rest } = record;
                const isNewBag = bagType === 'New Bag';
                return {
                    ...rest,
                    numberOfNewBags: isNewBag ? (numberOfBags || 0) : 0,
                    numberOfUsedBags: !isNewBag ? (numberOfBags || 0) : 0,
                };
            }
            return {
                ...record,
                numberOfNewBags: record.numberOfNewBags || 0,
                numberOfUsedBags: record.numberOfUsedBags || 0,
            };
        });
};

const ReportsPage = ({ currentSeason, currentUser }: ReportsPageProps) => {
    const [allLiftingRecords, setAllLiftingRecords] = useState<LiftingRecord[]>([]);
    const [releaseOrders, setReleaseOrders] = useState<ReleaseOrder[]>([]);
    const [dailyLogs, setDailyLogs] = useState<DailyStockLog[]>([]);
    const [riceDeliveryRecords, setRiceDeliveryRecords] = useState<RiceDeliveryRecord[]>([]);
    const [frkRecords, setFrkRecords] = useState<FrkRecord[]>([]);

    const [filteredRecords, setFilteredRecords] = useState<LiftingRecord[]>([]);
    
    // Filter states
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [godownFilter, setGodownFilter] = useState('All');
    
    const [hasGenerated, setHasGenerated] = useState(false);

    useEffect(() => {
        if (!currentSeason || !currentUser) return;

        const rawLifting = getRawArraySafely(`${currentUser}_liftingRecords_${currentSeason}`);
        setAllLiftingRecords(migrateLiftingRecords(rawLifting));

        setReleaseOrders(getSafely(`${currentUser}_releaseOrders_${currentSeason}`, isReleaseOrder));
        setDailyLogs(getSafely(`${currentUser}_dailyStockLogs_${currentSeason}`, isDailyStockLog));
        setRiceDeliveryRecords(getSafely(`${currentUser}_riceDeliveryRecords_${currentSeason}`, isRiceDeliveryRecord));
        setFrkRecords(getSafely(`${currentUser}_frkRecords_${currentSeason}`, isFrkRecord));

        // Reset report when season changes
        setFilteredRecords([]);
        setHasGenerated(false);
    }, [currentSeason, currentUser]);

    const godowns = useMemo(() => {
        const godownSet = new Set(allLiftingRecords.map(r => r.godown));
        return Array.from(godownSet).sort();
    }, [allLiftingRecords]);

    const stockSummary = useMemo(() => {
        const totalLiftedQtls = allLiftingRecords.reduce((sum, rec) => sum + rec.netPaddyQuantity, 0);
        const totalNewBagsLifted = allLiftingRecords.reduce((sum, rec) => sum + (rec.numberOfNewBags || 0), 0);
        const totalUsedBagsLifted = allLiftingRecords.reduce((sum, rec) => sum + (rec.numberOfUsedBags || 0), 0);
        const totalBagsLifted = totalNewBagsLifted + totalUsedBagsLifted;
        const averageBagWeightQtls = totalBagsLifted > 0 ? totalLiftedQtls / totalBagsLifted : PADDY_BAG_WEIGHT_QTL;

        const totalPaddyConsumedQtls = dailyLogs.reduce((sum, log) => {
            const consumedBags = (log.paddyBagsOpenedNew || 0) + (log.paddyBagsOpenedUsed || 0);
            return sum + (consumedBags * averageBagWeightQtls);
        }, 0);
        const currentPaddyStock = totalLiftedQtls - totalPaddyConsumedQtls;
        const currentPaddyStockInBags = currentPaddyStock > 0 ? Math.round(currentPaddyStock / averageBagWeightQtls) : 0;

        // Rice Stock Calculation
        const totalRiceProduced = dailyLogs.reduce((sum, log) => sum + (log.riceQuantity || 0), 0);
        const totalRiceDelivered = riceDeliveryRecords.reduce((sum, rec) => sum + (rec.quantityDeliveredQtls || 0), 0);
        const currentRiceStock = totalRiceProduced - (totalRiceDelivered * (1 - FRK_BLENDING_RATIO));
        const currentRiceStockInBags = currentRiceStock > 0 ? Math.floor(currentRiceStock / RICE_BAG_WEIGHT_QTL) : 0;

        // FRK Stock Calculation
        const totalFrkPurchased = frkRecords.reduce((sum, rec) => sum + rec.quantityQtls, 0);
        const totalFrkConsumed = totalRiceDelivered * FRK_BLENDING_RATIO;
        const currentFrkStock = totalFrkPurchased - totalFrkConsumed;

        return {
            currentPaddyStock,
            currentPaddyStockInBags,
            currentRiceStock, // This is plain rice stock
            currentRiceStockInBags,
            currentFrkStock,
        };
    }, [allLiftingRecords, dailyLogs, riceDeliveryRecords, frkRecords]);
    
    const bagSummary = useMemo(() => {
        const totalNewBagsLifted = allLiftingRecords.reduce((sum, rec) => sum + (rec.numberOfNewBags || 0), 0);
        const totalUsedBagsLifted = allLiftingRecords.reduce((sum, rec) => sum + (rec.numberOfUsedBags || 0), 0);
        const totalNewBagsOpened = dailyLogs.reduce((sum, log) => sum + (log.paddyBagsOpenedNew || 0), 0);
        const totalUsedBagsOpened = dailyLogs.reduce((sum, log) => sum + (log.paddyBagsOpenedUsed || 0), 0);
        const bagsUsedForRiceDelivery = riceDeliveryRecords.reduce((sum, rec) => sum + (rec.bagsDelivered || 0), 0);

        return {
            stockNewPaddyBags: totalNewBagsLifted - totalNewBagsOpened,
            stockUsedPaddyBags: totalUsedBagsLifted - totalUsedBagsOpened,
            availableEmptyBags: totalNewBagsOpened - bagsUsedForRiceDelivery,
        }
    }, [allLiftingRecords, dailyLogs, riceDeliveryRecords]);

    const godownWiseSummary = useMemo(() => {
        const summary: Record<string, { totalAllotted: number, totalLifted: number }> = {};
        releaseOrders.forEach(ro => {
            if (!summary[ro.godown]) {
                summary[ro.godown] = { totalAllotted: 0, totalLifted: 0 };
            }
            summary[ro.godown].totalAllotted += parseFloat(ro.quantity) || 0;
        });
        allLiftingRecords.forEach(lr => {
            if (summary[lr.godown]) {
                summary[lr.godown].totalLifted += lr.netPaddyQuantity || 0;
            }
        });
        return Object.entries(summary).map(([godown, data]) => ({
            godown,
            ...data,
            pending: data.totalAllotted - data.totalLifted,
        })).sort((a,b) => a.godown.localeCompare(b.godown));
    }, [releaseOrders, allLiftingRecords]);

    const doWiseSummary = useMemo(() => {
        return releaseOrders.map(ro => {
            const lifted = allLiftingRecords
                .filter(lr => lr.doNo === ro.doNo)
                .reduce((sum, lr) => sum + lr.netPaddyQuantity, 0);

            const delivered = riceDeliveryRecords
                .filter(dr => dr.doNo === ro.doNo)
                .reduce((sum, dr) => sum + dr.quantityDeliveredQtls, 0);

            const allotted = parseFloat(ro.quantity) || 0;
            const entitlement = lifted * CMR_TURNOUT_RATIO;
            
            // Per user request, the pending amount should not be reduced by the FRK portion of the delivery.
            // This means we subtract only the plain rice portion of the delivery from the entitlement.
            // Pending = Entitlement - (Delivered * 0.99)
            const plainRicePortionOfDelivery = delivered * (1 - FRK_BLENDING_RATIO);

            return {
                doNo: ro.doNo,
                godown: ro.godown,
                paddyAllotted: allotted,
                paddyLifted: lifted,
                paddyPending: allotted - lifted,
                riceEntitlement: entitlement,
                riceDelivered: delivered,
                ricePending: entitlement - plainRicePortionOfDelivery,
            };
        }).sort((a,b) => a.doNo.localeCompare(b.doNo));
    }, [releaseOrders, allLiftingRecords, riceDeliveryRecords]);

    const byProductSummary = useMemo(() => {
        return dailyLogs.reduce((acc, log) => {
            acc.bran += log.branSold || 0;
            acc.husk += log.huskSold || 0;
            acc.sortexBroken += log.sortexBrokenSold || 0;
            acc.nonSortexBroken += log.nonSortexBrokenSold || 0;
            acc.murgidana += log.murgidanaSold || 0;
            acc.rejection += log.rejectionSold || 0;
            return acc;
        }, { bran: 0, husk: 0, sortexBroken: 0, nonSortexBroken: 0, murgidana: 0, rejection: 0 });
    }, [dailyLogs]);


    const handleGenerateReport = () => {
        let records = [...allLiftingRecords];

        if (startDate) {
            records = records.filter(r => new Date(r.liftingDate) >= new Date(startDate));
        }
        if (endDate) {
            const endOfDay = new Date(endDate);
            endOfDay.setHours(23, 59, 59, 999);
            records = records.filter(r => new Date(r.liftingDate) <= endOfDay);
        }
        if (godownFilter !== 'All') {
            records = records.filter(r => r.godown === godownFilter);
        }
        
        setFilteredRecords(records.sort((a, b) => new Date(b.liftingDate).getTime() - new Date(a.liftingDate).getTime()));
        setHasGenerated(true);
    };

    const handlePrint = () => {
        window.print();
    };

    const reportTotals = useMemo(() => {
        return filteredRecords.reduce((acc, record) => {
            acc.gross += record.grossLiftedQuantity;
            acc.bags += record.totalBagWeight;
            acc.net += record.netPaddyQuantity;
            acc.newBags += record.numberOfNewBags || 0;
            acc.usedBags += record.numberOfUsedBags || 0;
            return acc;
        }, { gross: 0, bags: 0, net: 0, newBags: 0, usedBags: 0 });
    }, [filteredRecords]);

    return (
        <div className="space-y-8 animate-fade-in">
            <style>
            {`
                @media print {
                    body > div > main {
                        padding: 0 !important;
                    }
                    .no-print {
                        display: none !important;
                    }
                    .print-only {
                        display: block !important;
                    }
                    .report-container {
                        box-shadow: none !important;
                        border: none !important;
                        margin-top: 1rem;
                        break-inside: avoid;
                    }
                    table {
                        font-size: 10pt !important;
                    }
                    th, td {
                        padding: 6px 8px !important;
                    }
                    h1, h3 {
                        color: black !important;
                    }
                }
            `}
            </style>

            <div className="flex justify-between items-center no-print">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Operational Reports</h1>
                    <p className="mt-2 text-slate-600">Summary and detailed reports for season: {currentSeason}</p>
                </div>
                 <button onClick={handlePrint} className="bg-green-600 text-white font-semibold py-2 px-4 rounded-md shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 no-print">
                    Print All Reports
                </button>
            </div>

            {/* Current Stock Summary */}
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4 report-container">
                <h3 className="text-lg font-semibold text-slate-700 mb-4">Current Stock Summary ({currentSeason})</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-green-100 p-4 rounded-lg border border-green-200">
                        <h4 className="text-green-800 font-semibold text-sm">Current Paddy Stock</h4>
                        <p className="text-2xl font-bold text-green-900 mt-1">{stockSummary.currentPaddyStock.toFixed(3)} <span className="text-base font-medium">Qtls</span></p>
                        <p className="text-xs text-green-700">Approx. {stockSummary.currentPaddyStockInBags.toLocaleString()} Bags</p>
                    </div>
                    <div className="bg-blue-100 p-4 rounded-lg border border-blue-200">
                        <h4 className="text-blue-800 font-semibold text-sm">Current Plain Rice Stock</h4>
                        <p className="text-2xl font-bold text-blue-900 mt-1">{stockSummary.currentRiceStock.toFixed(3)} <span className="text-base font-medium">Qtls</span></p>
                        <p className="text-xs text-blue-700">Approx. {stockSummary.currentRiceStockInBags.toLocaleString()} Bags</p>
                    </div>
                    <div className="bg-purple-100 p-4 rounded-lg border border-purple-200">
                        <h4 className="text-purple-800 font-semibold text-sm">Current FRK Stock</h4>
                        <p className="text-2xl font-bold text-purple-900 mt-1">{stockSummary.currentFrkStock.toFixed(4)} <span className="text-base font-medium">Qtls</span></p>
                    </div>
                </div>
            </div>
            
            {/* Bag Inventory Summary */}
             <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4 report-container">
                <h3 className="text-lg font-semibold text-slate-700 mb-4">Bag Inventory Summary ({currentSeason})</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-indigo-100 p-4 rounded-lg border border-indigo-200">
                        <h4 className="text-indigo-800 font-semibold text-sm">Full New Paddy Bags</h4>
                        <p className="text-2xl font-bold text-indigo-900 mt-1">{bagSummary.stockNewPaddyBags.toLocaleString()}</p>
                    </div>
                    <div className="bg-gray-100 p-4 rounded-lg border border-gray-200">
                        <h4 className="text-gray-800 font-semibold text-sm">Full Used Paddy Bags</h4>
                        <p className="text-2xl font-bold text-gray-900 mt-1">{bagSummary.stockUsedPaddyBags.toLocaleString()}</p>
                    </div>
                    <div className="bg-purple-100 p-4 rounded-lg border border-purple-200">
                        <h4 className="text-purple-800 font-semibold text-sm">Empty Bags for Packing</h4>
                        <p className="text-2xl font-bold text-purple-900 mt-1">{bagSummary.availableEmptyBags.toLocaleString()}</p>
                    </div>
                </div>
            </div>

             {/* By-Product Sales Summary */}
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4 report-container">
                 <h3 className="text-lg font-semibold text-slate-700 mb-4">By-Product Sales Summary ({currentSeason})</h3>
                 <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                    <div className="bg-yellow-100 p-4 rounded-lg border border-yellow-200">
                        <h4 className="text-yellow-800 font-semibold text-sm">Total Bran Sold</h4>
                        <p className="text-xl font-bold text-yellow-900 mt-1">{byProductSummary.bran.toFixed(3)} <span className="text-sm font-medium">Qtls</span></p>
                    </div>
                     <div className="bg-orange-100 p-4 rounded-lg border border-orange-200">
                        <h4 className="text-orange-800 font-semibold text-sm">Total Husk Sold</h4>
                        <p className="text-xl font-bold text-orange-900 mt-1">{byProductSummary.husk.toFixed(3)} <span className="text-sm font-medium">Qtls</span></p>
                    </div>
                     <div className="bg-teal-100 p-4 rounded-lg border border-teal-200">
                        <h4 className="text-teal-800 font-semibold text-sm">Sortex Broken</h4>
                        <p className="text-xl font-bold text-teal-900 mt-1">{byProductSummary.sortexBroken.toFixed(3)} <span className="text-sm font-medium">Qtls</span></p>
                    </div>
                     <div className="bg-cyan-100 p-4 rounded-lg border border-cyan-200">
                        <h4 className="text-cyan-800 font-semibold text-sm">Non-Sortex Broken</h4>
                        <p className="text-xl font-bold text-cyan-900 mt-1">{byProductSummary.nonSortexBroken.toFixed(3)} <span className="text-sm font-medium">Qtls</span></p>
                    </div>
                     <div className="bg-purple-100 p-4 rounded-lg border border-purple-200">
                        <h4 className="text-purple-800 font-semibold text-sm">Murgidana Sold</h4>
                        <p className="text-xl font-bold text-purple-900 mt-1">{byProductSummary.murgidana.toFixed(3)} <span className="text-sm font-medium">Qtls</span></p>
                    </div>
                     <div className="bg-red-100 p-4 rounded-lg border border-red-200">
                        <h4 className="text-red-800 font-semibold text-sm">Rejection Sold</h4>
                        <p className="text-xl font-bold text-red-900 mt-1">{byProductSummary.rejection.toFixed(3)} <span className="text-sm font-medium">Qtls</span></p>
                    </div>
                 </div>
            </div>


            {/* Godown-wise Summary */}
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden report-container">
                <div className="p-4 border-b border-slate-200">
                    <h3 className="text-lg font-semibold text-slate-700">Godown-wise Pending Paddy Summary</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full text-sm text-left text-slate-600">
                        <thead className="bg-slate-50 border-b border-slate-200 text-xs text-slate-500 uppercase tracking-wider">
                            <tr>
                                <th scope="col" className="px-4 py-3 font-medium">Godown</th>
                                <th scope="col" className="px-4 py-3 font-medium text-right">Total Allotted (Qtls)</th>
                                <th scope="col" className="px-4 py-3 font-medium text-right">Total Lifted (Qtls)</th>
                                <th scope="col" className="px-4 py-3 font-medium text-right">Pending (Qtls)</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                            {godownWiseSummary.length > 0 ? godownWiseSummary.map(summary => (
                                <tr key={summary.godown}>
                                    <td className="px-4 py-3 font-semibold text-slate-800">{summary.godown}</td>
                                    <td className="px-4 py-3 text-right">{summary.totalAllotted.toFixed(2)}</td>
                                    <td className="px-4 py-3 text-right text-green-600">{summary.totalLifted.toFixed(3)}</td>
                                    <td className="px-4 py-3 text-right font-bold text-orange-600">{summary.pending.toFixed(3)}</td>
                                </tr>
                            )) : <tr><td colSpan={4} className="text-center py-10 text-slate-500">No data available.</td></tr>}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* DO-wise Summary */}
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden report-container">
                <div className="p-4 border-b border-slate-200">
                    <h3 className="text-lg font-semibold text-slate-700">DO-wise Fulfillment Report (Paddy &amp; Rice)</h3>
                </div>
                <div className="overflow-x-auto">
                     <table className="min-w-full text-sm text-left text-slate-600">
                        <thead className="bg-slate-50 border-b border-slate-200 text-xs text-slate-500 uppercase tracking-wider">
                            <tr>
                                <th rowSpan={2} scope="col" className="px-4 py-3 font-medium align-bottom">DO No.</th>
                                <th rowSpan={2} scope="col" className="px-4 py-3 font-medium align-bottom">Godown</th>
                                <th colSpan={3} scope="colgroup" className="px-4 py-2 font-medium text-center border-b border-l border-r">Paddy (Qtls)</th>
                                <th colSpan={3} scope="colgroup" className="px-4 py-2 font-medium text-center border-b border-l">Fortified Rice (Qtls)</th>
                            </tr>
                             <tr>
                                <th scope="col" className="px-4 py-2 font-medium text-right border-l">Allotted</th>
                                <th scope="col" className="px-4 py-2 font-medium text-right">Lifted</th>
                                <th scope="col" className="px-4 py-2 font-medium text-right border-r">Pending</th>
                                <th scope="col" className="px-4 py-2 font-medium text-right">Entitlement</th>
                                <th scope="col" className="px-4 py-2 font-medium text-right">Delivered</th>
                                <th scope="col" className="px-4 py-2 font-medium text-right">Pending</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                            {doWiseSummary.length > 0 ? doWiseSummary.map(summary => (
                                <tr key={summary.doNo} className="hover:bg-slate-50">
                                    <td className="px-4 py-3 font-semibold text-slate-800">{summary.doNo}</td>
                                    <td className="px-4 py-3">{summary.godown}</td>
                                    <td className="px-4 py-3 text-right border-l">{summary.paddyAllotted.toFixed(2)}</td>
                                    <td className="px-4 py-3 text-right text-green-600">{summary.paddyLifted.toFixed(3)}</td>
                                    <td className="px-4 py-3 text-right font-bold text-orange-600 border-r">{summary.paddyPending.toFixed(3)}</td>
                                    <td className="px-4 py-3 text-right">{summary.riceEntitlement.toFixed(3)}</td>
                                    <td className="px-4 py-3 text-right text-green-600">{summary.riceDelivered.toFixed(3)}</td>
                                    <td className="px-4 py-3 text-right font-bold text-red-600">{summary.ricePending.toFixed(3)}</td>
                                </tr>
                            )) : <tr><td colSpan={8} className="text-center py-10 text-slate-500">No data available.</td></tr>}
                        </tbody>
                    </table>
                </div>
            </div>


            {/* Filter Section */}
            <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200 no-print report-container">
                <h3 className="text-lg font-semibold text-slate-700 mb-4">Detailed Paddy Lifting Report (Filterable)</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                        <label htmlFor="startDate" className="block text-sm font-medium text-slate-700">Start Date</label>
                        <input type="date" id="startDate" value={startDate} onChange={e => setStartDate(e.target.value)} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50" />
                    </div>
                    <div>
                        <label htmlFor="endDate" className="block text-sm font-medium text-slate-700">End Date</label>
                        <input type="date" id="endDate" value={endDate} onChange={e => setEndDate(e.target.value)} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50" />
                    </div>
                    <div>
                        <label htmlFor="godownFilter" className="block text-sm font-medium text-slate-700">Godown</label>
                         <select id="godownFilter" value={godownFilter} onChange={e => setGodownFilter(e.target.value)} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50">
                            <option>All</option>
                            {godowns.map(g => <option key={g} value={g}>{g}</option>)}
                        </select>
                    </div>
                    <div className="flex items-end">
                        <button onClick={handleGenerateReport} className="w-full bg-blue-600 text-white font-semibold py-2 px-4 rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                            Generate Detailed Report
                        </button>
                    </div>
                </div>
            </div>
            
            {/* Report Display Section */}
            {hasGenerated && (
                <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden report-container">
                    <div className="p-4 flex justify-between items-center border-b border-slate-200">
                        <div>
                            <h3 className="text-lg font-semibold text-slate-700">Detailed Report Results for {currentSeason}</h3>
                            <p className="text-sm text-slate-500">
                                Showing {filteredRecords.length} of {allLiftingRecords.length} records.
                            </p>
                        </div>
                    </div>
                     <div className="overflow-x-auto">
                        <table className="min-w-full text-sm text-left text-slate-600">
                            <thead className="bg-slate-50 border-b border-slate-200 text-xs text-slate-500 uppercase tracking-wider">
                              <tr>
                                <th scope="col" className="px-4 py-3 font-medium">Lifting Date</th>
                                <th scope="col" className="px-4 py-3 font-medium">RST No.</th>
                                <th scope="col" className="px-4 py-3 font-medium">DO No.</th>
                                <th scope="col" className="px-4 py-3 font-medium">Godown</th>
                                <th scope="col" className="px-4 py-3 font-medium">Truck No.</th>
                                <th scope="col" className="px-4 py-3 font-medium text-right">Gross Qty</th>
                                <th scope="col" className="px-4 py-3 font-medium text-right">Bag Wt.</th>
                                <th scope="col" className="px-4 py-3 font-medium text-right">Net Paddy Qty</th>
                                <th scope="col" className="px-4 py-3 font-medium text-right">New Bags</th>
                                <th scope="col" className="px-4 py-3 font-medium text-right">Used Bags</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200">
                                {filteredRecords.map(record => (
                                    <tr key={record.id}>
                                        <td className="px-4 py-3 whitespace-nowrap">{new Date(record.liftingDate).toLocaleDateString()}</td>
                                        <td className="px-4 py-3 whitespace-nowrap">{record.rstNo}</td>
                                        <td className="px-4 py-3 font-semibold text-slate-800 whitespace-nowrap">{record.doNo}</td>
                                        <td className="px-4 py-3">{record.godown}</td>
                                        <td className="px-4 py-3 whitespace-nowrap">{record.truckNo}</td>
                                        <td className="px-4 py-3 text-right">{record.grossLiftedQuantity.toFixed(3)}</td>
                                        <td className="px-4 py-3 text-right text-red-500">-{record.totalBagWeight.toFixed(3)}</td>
                                        <td className="px-4 py-3 font-bold text-green-600 text-right">{record.netPaddyQuantity.toFixed(3)}</td>
                                        <td className="px-4 py-3 text-right">{record.numberOfNewBags}</td>
                                        <td className="px-4 py-3 text-right">{record.numberOfUsedBags}</td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot className="bg-slate-100 border-t-2 border-slate-300">
                                <tr className="font-bold text-slate-800">
                                    <td colSpan={5} className="px-4 py-3">Report Totals</td>
                                    <td className="px-4 py-3 text-right">{reportTotals.gross.toFixed(3)}</td>
                                    <td className="px-4 py-3 text-right text-red-500">-{reportTotals.bags.toFixed(3)}</td>
                                    <td className="px-4 py-3 text-right">{reportTotals.net.toFixed(3)}</td>
                                    <td className="px-4 py-3 text-right">{reportTotals.newBags}</td>
                                    <td className="px-4 py-3 text-right">{reportTotals.usedBags}</td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                    {filteredRecords.length === 0 && (
                        <p className="text-center py-10 text-slate-500">
                            No records match your filter criteria.
                        </p>
                    )}
                </div>
            )}
            
            {!hasGenerated && (
                 <div className="text-center py-10 text-slate-500 bg-white rounded-lg border border-slate-200 no-print">
                    <p>Please select your filters and click "Generate Detailed Report" to view data.</p>
                </div>
            )}
        </div>
    );
};

export default ReportsPage;
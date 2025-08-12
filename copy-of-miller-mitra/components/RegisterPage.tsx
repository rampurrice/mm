import React, { useState, useEffect, useMemo } from 'react';
import { LiftingRecord, ReleaseOrder, RiceDeliveryRecord } from '../types';
import { getSafely, getRawArraySafely, isReleaseOrder, isRiceDeliveryRecord } from '../utils';

interface RegisterPageProps {
  currentSeason: string;
  currentUser: string;
}

interface DoCentricLogItem {
    ro: ReleaseOrder;
    liftingRecords: LiftingRecord[];
    riceDeliveryRecords: RiceDeliveryRecord[];
    paddyLiftedTotal: number;
    riceDeliveredTotal: number;
}

// This utility handles the conversion of old data records to the new format.
const migrateLiftingRecords = (records: any[]): LiftingRecord[] => {
    if (!Array.isArray(records)) return [];
    return records
        .filter(record => record && typeof record === 'object') // Ensure we only process objects
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

const RegisterPage = ({ currentSeason, currentUser }: RegisterPageProps) => {
    const [liftingRecords, setLiftingRecords] = useState<LiftingRecord[]>([]);
    const [riceDeliveryRecords, setRiceDeliveryRecords] = useState<RiceDeliveryRecord[]>([]);
    const [releaseOrders, setReleaseOrders] = useState<ReleaseOrder[]>([]);

    // Edit Modal State
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [currentRecord, setCurrentRecord] = useState<LiftingRecord | null>(null);
    const [editedRecord, setEditedRecord] = useState<Partial<LiftingRecord>>({});
    const [modalError, setModalError] = useState<string | null>(null);

    useEffect(() => {
        if (!currentSeason || !currentUser) return;

        const rawLiftingRecords = getRawArraySafely(`${currentUser}_liftingRecords_${currentSeason}`);
        const migrated = migrateLiftingRecords(rawLiftingRecords);
        setLiftingRecords(migrated);

        setRiceDeliveryRecords(getSafely(`${currentUser}_riceDeliveryRecords_${currentSeason}`, isRiceDeliveryRecord));
        setReleaseOrders(getSafely(`${currentUser}_releaseOrders_${currentSeason}`, isReleaseOrder));

    }, [currentSeason, currentUser]);

    useEffect(() => {
        if (!currentSeason || !currentUser) return;
        try {
            localStorage.setItem(`${currentUser}_liftingRecords_${currentSeason}`, JSON.stringify(liftingRecords));
        } catch (error) {
            console.error("Failed to save lifting records to localStorage", error);
        }
    }, [liftingRecords, currentSeason, currentUser]);

    const doCentricLog = useMemo((): DoCentricLogItem[] => {
        const logMap: Record<string, DoCentricLogItem> = {};

        releaseOrders.forEach(ro => {
            logMap[ro.doNo] = {
                ro,
                liftingRecords: [],
                riceDeliveryRecords: [],
                paddyLiftedTotal: 0,
                riceDeliveredTotal: 0
            };
        });

        liftingRecords.forEach(lr => {
            if (logMap[lr.doNo]) {
                logMap[lr.doNo].liftingRecords.push(lr);
                logMap[lr.doNo].paddyLiftedTotal += lr.netPaddyQuantity;
            }
        });

        riceDeliveryRecords.forEach(dr => {
            if (logMap[dr.doNo]) {
                logMap[dr.doNo].riceDeliveryRecords.push(dr);
                logMap[dr.doNo].riceDeliveredTotal += dr.quantityDeliveredQtls;
            }
        });
        
        return Object.values(logMap).sort((a, b) => a.ro.doNo.localeCompare(b.ro.doNo));
    }, [releaseOrders, liftingRecords, riceDeliveryRecords]);

    const handleDeleteRecord = (recordId: string) => {
        if (window.confirm('Are you sure you want to delete this lifting record? This action cannot be undone.')) {
            setLiftingRecords(prev => prev.filter(r => r.id !== recordId));
        }
    };

    const handleEditClick = (record: LiftingRecord) => {
        setCurrentRecord(record);
        setEditedRecord({ ...record });
        setIsEditModalOpen(true);
        setModalError(null);
    };

    const handleCloseModal = () => {
        setIsEditModalOpen(false);
        setCurrentRecord(null);
        setEditedRecord({});
    };

    const handleModalInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setEditedRecord(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSaveEdit = () => {
        if (!currentRecord || !editedRecord) return;

        if (!editedRecord.rstNo?.trim() || !editedRecord.truckNo?.trim()) {
            setModalError('RST No. and Truck No. cannot be empty.');
            return;
        }

        setLiftingRecords(prev => prev.map(rec => (rec.id === currentRecord.id ? { ...rec, ...editedRecord } as LiftingRecord : rec)));
        handleCloseModal();
    };

    const validDoOptions = useMemo(() => {
        if (!currentRecord) return [];

        const allRosForGodown = releaseOrders.filter(ro => ro.godown === currentRecord.godown);
        
        return allRosForGodown.map(ro => {
            const liftedOnThisRo = liftingRecords
                .filter(lr => lr.doNo === ro.doNo)
                .reduce((sum, lr) => sum + lr.netPaddyQuantity, 0);

            let pending = (parseFloat(ro.quantity) || 0) - liftedOnThisRo;
            
            if (ro.doNo === currentRecord.doNo) {
                pending += currentRecord.netPaddyQuantity;
            }
            
            return { doNo: ro.doNo, pending: pending };
        }).filter(ro => {
            return ro.pending >= currentRecord.netPaddyQuantity - 0.001; // tolerance
        });
    }, [currentRecord, releaseOrders, liftingRecords]);
    
    const inputClass = "w-full bg-white border border-slate-300 rounded-md shadow-sm px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500";

    return (
        <div className="space-y-8 animate-fade-in">
             <div>
                <h1 className="text-3xl font-bold text-slate-900">Paddy &amp; Rice In/Out Register</h1>
                <p className="mt-2 text-slate-600">A complete log of all paddy lifted and rice delivered for season <span className="font-semibold">{currentSeason}</span>, grouped by Delivery Order.</p>
            </div>

            <div className="space-y-6">
                {doCentricLog.length > 0 ? (
                    doCentricLog.map(log => (
                        <div key={log.ro.doNo} className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
                            <div className="p-4 bg-slate-50 border-b border-slate-200">
                                <h3 className="text-lg font-bold text-slate-800">DO No: {log.ro.doNo}</h3>
                                <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-600 mt-2">
                                    <span><strong>Godown:</strong> {log.ro.godown}</span>
                                    <span><strong>Lot No:</strong> {log.ro.lotNo}</span>
                                    <span><strong>Allotted:</strong> {parseFloat(log.ro.quantity).toFixed(2)} Qtls</span>
                                    <span className="font-semibold text-green-700"><strong>Paddy Lifted:</strong> {log.paddyLiftedTotal.toFixed(3)} Qtls</span>
                                    <span className="font-semibold text-blue-700"><strong>Rice Delivered:</strong> {log.riceDeliveredTotal.toFixed(3)} Qtls</span>
                                </div>
                            </div>
                            
                            <div className="p-4 space-y-4">
                                <div>
                                    <h4 className="font-semibold text-slate-700 mb-2">Paddy Lifting Details (+)</h4>
                                    {log.liftingRecords.length > 0 ? (
                                    <div className="overflow-x-auto border rounded-md">
                                        <table className="min-w-full text-sm text-left text-slate-600">
                                            <thead className="bg-slate-50 text-xs text-slate-500 uppercase">
                                                <tr>
                                                    <th className="px-3 py-2">Date</th>
                                                    <th className="px-3 py-2">Truck No.</th>
                                                    <th className="px-3 py-2">RST No.</th>
                                                    <th className="px-3 py-2 text-right">Net Qty (Qtls)</th>
                                                    <th className="px-3 py-2 text-right">Bags</th>
                                                    <th className="px-3 py-2 text-center">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-200">
                                                {log.liftingRecords.map(lr => (
                                                <tr key={lr.id}>
                                                    <td className="px-3 py-2 whitespace-nowrap">{new Date(lr.liftingDate).toLocaleDateString()}</td>
                                                    <td className="px-3 py-2">{lr.truckNo}</td>
                                                    <td className="px-3 py-2">{lr.rstNo}</td>
                                                    <td className="px-3 py-2 text-right font-medium text-green-600">{lr.netPaddyQuantity.toFixed(3)}</td>
                                                    <td className="px-3 py-2 text-right">{(lr.numberOfNewBags || 0) + (lr.numberOfUsedBags || 0)}</td>
                                                    <td className="px-3 py-2 text-center whitespace-nowrap">
                                                        <button onClick={() => handleEditClick(lr)} className="font-medium text-blue-600 hover:text-blue-800 px-2 py-1 rounded-md hover:bg-blue-100 transition-colors text-xs">Edit</button>
                                                        <button onClick={() => handleDeleteRecord(lr.id)} className="ml-2 font-medium text-red-600 hover:text-red-800 px-2 py-1 rounded-md hover:bg-red-100 transition-colors text-xs">Delete</button>
                                                    </td>
                                                </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                    ) : <p className="text-sm text-slate-500 px-3 py-2 bg-slate-50 rounded-md">No paddy lifting records for this DO.</p>}
                                </div>
                                
                                <div>
                                    <h4 className="font-semibold text-slate-700 mb-2">Rice Delivery Details (-)</h4>
                                    {log.riceDeliveryRecords.length > 0 ? (
                                    <div className="overflow-x-auto border rounded-md">
                                        <table className="min-w-full text-sm text-left text-slate-600">
                                            <thead className="bg-slate-50 text-xs text-slate-500 uppercase">
                                                <tr>
                                                    <th className="px-3 py-2">Date</th>
                                                    <th className="px-3 py-2">CMR Order No.</th>
                                                    <th className="px-3 py-2">Agency</th>
                                                    <th className="px-3 py-2">Vehicle No.</th>
                                                    <th className="px-3 py-2">Batch No.</th>
                                                    <th className="px-3 py-2 text-right">Net Qty (Qtls)</th>
                                                    <th className="px-3 py-2 text-right">Bags</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-200">
                                                {log.riceDeliveryRecords.map(dr => (
                                                <tr key={dr.id}>
                                                    <td className="px-3 py-2 whitespace-nowrap">{new Date(dr.date).toLocaleDateString()}</td>
                                                    <td className="px-3 py-2">{dr.cmrOrderNo}</td>
                                                    <td className="px-3 py-2"><span className={`inline-block px-2 py-0.5 text-xs font-semibold rounded-full ${dr.agency === 'FCI' ? 'bg-teal-100 text-teal-800' : 'bg-sky-100 text-sky-800'}`}>{dr.agency}</span></td>
                                                    <td className="px-3 py-2">{dr.vehicleNo}</td>
                                                    <td className="px-3 py-2">{dr.batchNo}</td>
                                                    <td className="px-3 py-2 text-right font-medium text-red-600">{dr.quantityDeliveredQtls.toFixed(3)}</td>
                                                    <td className="px-3 py-2 text-right">{dr.bagsDelivered}</td>
                                                </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                    ) : <p className="text-sm text-slate-500 px-3 py-2 bg-slate-50 rounded-md">No rice delivery records for this DO.</p>}
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="text-center py-10 text-slate-500 bg-white rounded-lg border border-slate-200">
                        <p>No records found for season {currentSeason}.</p>
                    </div>
                )}
            </div>

            {/* Edit Modal */}
            {isEditModalOpen && currentRecord && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in-fast">
                    <div className="bg-white rounded-lg shadow-2xl w-full max-w-lg m-4" role="dialog" aria-modal="true" aria-labelledby="edit-modal-title">
                        <div className="px-6 py-4 border-b border-slate-200">
                            <h3 id="edit-modal-title" className="text-lg font-bold text-slate-800">Edit Lifting Record</h3>
                            <p className="text-sm text-slate-500">Correct the details for this lift from {currentRecord.godown}.</p>
                        </div>
                        <div className="p-6 space-y-4">
                            {modalError && <p className="text-sm text-red-600 bg-red-50 p-3 rounded-md border border-red-200">{modalError}</p>}
                            <div>
                                <label htmlFor="rstNo" className="block text-sm font-medium text-slate-700 mb-1">RST No.</label>
                                <input type="text" id="rstNo" name="rstNo" value={editedRecord.rstNo || ''} onChange={handleModalInputChange} className={inputClass} />
                            </div>
                            <div>
                                <label htmlFor="truckNo" className="block text-sm font-medium text-slate-700 mb-1">Truck No.</label>
                                <input type="text" id="truckNo" name="truckNo" value={editedRecord.truckNo || ''} onChange={handleModalInputChange} className={inputClass} />
                            </div>
                            <div>
                                <label htmlFor="doNo" className="block text-sm font-medium text-slate-700 mb-1">Delivery Order (DO)</label>
                                <select id="doNo" name="doNo" value={editedRecord.doNo || ''} onChange={handleModalInputChange} className={inputClass}>
                                    <option value="" disabled>-- Select a valid DO --</option>
                                    {validDoOptions.map(opt => (
                                        <option key={opt.doNo} value={opt.doNo}>
                                            {opt.doNo} (Available: {opt.pending.toFixed(3)} Qtls)
                                        </option>
                                    ))}
                                </select>
                                <p className="text-xs text-slate-500 mt-1">Only DOs from the same godown with enough pending quantity are shown.</p>
                            </div>
                        </div>
                        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end space-x-3">
                            <button onClick={handleCloseModal} className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500">Cancel</button>
                            <button onClick={handleSaveEdit} className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500">Save Changes</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default RegisterPage;
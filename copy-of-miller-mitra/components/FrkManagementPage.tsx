

import React, { useState, useEffect, useMemo } from 'react';
import { FrkRecord, DailyStockLog, RiceDeliveryRecord } from '../types';

interface FrkManagementPageProps {
  currentSeason: string;
}

const FRK_BLENDING_RATIO = 0.01; // 1%

const FrkManagementPage = ({ currentSeason }: FrkManagementPageProps) => {
    const [frkRecords, setFrkRecords] = useState<FrkRecord[]>([]);
    const [riceDeliveryRecords, setRiceDeliveryRecords] = useState<RiceDeliveryRecord[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentRecord, setCurrentRecord] = useState<Partial<FrkRecord>>({});
    const [modalError, setModalError] = useState<string | null>(null);

    // Load data from localStorage
    useEffect(() => {
        if (!currentSeason) return;
        try {
            const savedFrk = localStorage.getItem(`frkRecords_${currentSeason}`);
            setFrkRecords(savedFrk ? JSON.parse(savedFrk) : []);

            const savedDeliveries = localStorage.getItem(`riceDeliveryRecords_${currentSeason}`);
            setRiceDeliveryRecords(savedDeliveries ? JSON.parse(savedDeliveries) : []);
        } catch (error) {
            console.error("Error loading data for FRK Management page:", error);
            setFrkRecords([]);
            setRiceDeliveryRecords([]);
        }
    }, [currentSeason]);

    // Save data to localStorage
    useEffect(() => {
        if (!currentSeason) return;
        try {
            localStorage.setItem(`frkRecords_${currentSeason}`, JSON.stringify(frkRecords));
        } catch (error) {
            console.error("Error saving FRK records:", error);
        }
    }, [frkRecords, currentSeason]);

    const frkStock = useMemo(() => {
        const totalFrkPurchased = frkRecords.reduce((sum, rec) => sum + (rec.quantityQtls || 0), 0);
        const totalRiceDelivered = riceDeliveryRecords.reduce((sum, rec) => sum + (rec.quantityDeliveredQtls || 0), 0);
        const totalFrkConsumed = totalRiceDelivered * FRK_BLENDING_RATIO;
        return {
            purchased: totalFrkPurchased,
            consumed: totalFrkConsumed,
            available: totalFrkPurchased - totalFrkConsumed,
        };
    }, [frkRecords, riceDeliveryRecords]);

    const handleOpenModal = () => {
        setModalError(null);
        setCurrentRecord({ date: new Date().toISOString().split('T')[0] });
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setCurrentRecord(prev => ({ ...prev, [name]: name === 'quantityQtls' ? parseFloat(value) || 0 : value }));
    };

    const handleSaveRecord = () => {
        setModalError(null);
        if (!currentRecord.date || !currentRecord.invoiceNo?.trim() || !currentRecord.supplier?.trim() || !currentRecord.quantityQtls || currentRecord.quantityQtls <= 0) {
            setModalError("Please fill in all fields with valid data.");
            return;
        }

        const newRecord: FrkRecord = {
            id: `frk-${Date.now()}`,
            ...currentRecord
        } as FrkRecord;
        
        setFrkRecords(prev => [...prev, newRecord].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
        handleCloseModal();
    };

    const handleDeleteRecord = (id: string) => {
        if(window.confirm('Are you sure you want to delete this FRK purchase record? This may affect your stock calculations.')) {
            setFrkRecords(prev => prev.filter(rec => rec.id !== id));
        }
    };
    
    const sortedRecords = useMemo(() => [...frkRecords].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()), [frkRecords]);

    const inputClass = "w-full bg-white border border-slate-300 rounded-md shadow-sm px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500";
    const labelClass = "block text-sm font-medium text-slate-700 mb-1";

    return (
        <div className="space-y-8 animate-fade-in">
            <div className="flex justify-between items-start">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">FRK Management</h1>
                    <p className="mt-2 text-slate-600">Track your Fortified Rice Kernel (FRK) stock for season <span className="font-semibold">{currentSeason}</span>.</p>
                </div>
                <button
                    onClick={handleOpenModal}
                    className="px-6 py-3 font-semibold text-white bg-green-600 rounded-lg shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all duration-150 whitespace-nowrap"
                >
                    Log FRK Purchase
                </button>
            </div>

            {/* Stock Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-blue-100 p-6 rounded-lg shadow-sm border border-blue-200">
                    <h3 className="text-blue-800 font-semibold text-lg">Total FRK Purchased</h3>
                    <p className="text-3xl font-bold text-blue-900 mt-2">{frkStock.purchased.toFixed(3)} <span className="text-lg font-medium">Qtls</span></p>
                </div>
                <div className="bg-orange-100 p-6 rounded-lg shadow-sm border border-orange-200">
                    <h3 className="text-orange-800 font-semibold text-lg">Total FRK Consumed</h3>
                    <p className="text-3xl font-bold text-orange-900 mt-2">{frkStock.consumed.toFixed(4)} <span className="text-lg font-medium">Qtls</span></p>
                     <p className="text-sm text-orange-700">Calculated as 1% of total rice delivered</p>
                </div>
                <div className="bg-green-100 p-6 rounded-lg shadow-sm border border-green-200">
                    <h3 className="text-green-800 font-semibold text-lg">Current FRK Stock</h3>
                    <p className="text-3xl font-bold text-green-900 mt-2">{frkStock.available.toFixed(4)} <span className="text-lg font-medium">Qtls</span></p>
                </div>
            </div>

            {/* FRK Purchase Log */}
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-4 border-b border-slate-200">
                    <h3 className="text-lg font-semibold text-slate-700">FRK Purchase Log</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full text-sm text-left text-slate-600">
                        <thead className="bg-slate-50 border-b border-slate-200 text-xs text-slate-500 uppercase tracking-wider">
                            <tr>
                                <th scope="col" className="px-4 py-3 font-medium">Purchase Date</th>
                                <th scope="col" className="px-4 py-3 font-medium">Invoice No.</th>
                                <th scope="col" className="px-4 py-3 font-medium">Supplier</th>
                                <th scope="col" className="px-4 py-3 font-medium text-right">Quantity (Qtls)</th>
                                <th scope="col" className="px-4 py-3 font-medium text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                            {sortedRecords.length > 0 ? sortedRecords.map(rec => (
                                <tr key={rec.id} className="hover:bg-slate-50">
                                    <td className="px-4 py-3 whitespace-nowrap">{new Date(rec.date).toLocaleDateString()}</td>
                                    <td className="px-4 py-3">{rec.invoiceNo}</td>
                                    <td className="px-4 py-3">{rec.supplier}</td>
                                    <td className="px-4 py-3 text-right font-bold text-green-600">+{rec.quantityQtls.toFixed(3)}</td>
                                    <td className="px-4 py-3 text-center">
                                         <button onClick={() => handleDeleteRecord(rec.id)} className="font-medium text-red-600 hover:text-red-800 px-2 py-1 rounded-md hover:bg-red-100 transition-colors">Delete</button>
                                    </td>
                                </tr>
                            )) : (
                                <tr><td colSpan={5} className="text-center py-10 text-slate-500">No FRK purchases logged yet for this season.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Add/Edit Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in-fast">
                    <div className="bg-white rounded-lg shadow-2xl w-full max-w-lg m-4" role="dialog" aria-modal="true">
                        <div className="px-6 py-4 border-b border-slate-200">
                            <h3 className="text-lg font-bold text-slate-800">Log New FRK Purchase</h3>
                        </div>
                        <div className="p-6 space-y-4">
                            {modalError && <p className="text-sm text-red-600 bg-red-50 p-3 rounded-md border border-red-200">{modalError}</p>}
                            
                            <div>
                                <label htmlFor="date" className={labelClass}>Purchase Date</label>
                                <input type="date" id="date" name="date" value={currentRecord.date?.split('T')[0] || ''} onChange={handleInputChange} className={inputClass} />
                            </div>
                            <div>
                                <label htmlFor="invoiceNo" className={labelClass}>Invoice No.</label>
                                <input type="text" id="invoiceNo" name="invoiceNo" value={currentRecord.invoiceNo || ''} onChange={handleInputChange} className={inputClass} placeholder="e.g., INV-12345" />
                            </div>
                            <div>
                                <label htmlFor="supplier" className={labelClass}>Supplier</label>
                                <input type="text" id="supplier" name="supplier" value={currentRecord.supplier || ''} onChange={handleInputChange} className={inputClass} placeholder="e.g., Fortified Foods Inc." />
                            </div>
                             <div>
                                <label htmlFor="quantityQtls" className={labelClass}>Quantity (in Qtls)</label>
                                <input type="number" id="quantityQtls" name="quantityQtls" value={currentRecord.quantityQtls || ''} onChange={handleInputChange} className={inputClass} placeholder="e.g., 10.5" />
                            </div>
                        </div>
                        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end space-x-3">
                            <button onClick={handleCloseModal} className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50">Cancel</button>
                            <button onClick={handleSaveRecord} className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md shadow-sm hover:bg-green-700">Save Purchase</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default FrkManagementPage;
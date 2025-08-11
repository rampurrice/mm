

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { RiceDeliveryRecord, CmrDepositOrder, ReleaseOrder, DailyStockLog, DeliveryAgency, LiftingRecord, FrkRecord } from '../types';
import { validateCmrDepositOrder, extractCmroDataFromPdf } from '../services/geminiService';
import LoadingSpinner from './LoadingSpinner';

interface RiceDeliveryPageProps {
  currentSeason: string;
}

const FILE_SIZE_LIMIT = 5 * 1024 * 1024; // 5MB
const CMR_TURNOUT_RATIO = 0.67; // 67% turnout from paddy to rice
const RICE_BAG_WEIGHT_QTL = 0.5; // 50kg per bag
const FRK_BLENDING_RATIO = 0.01; // 1%

const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const base64String = (reader.result as string).split(',')[1];
      if (base64String) {
        resolve(base64String);
      } else {
        reject(new Error("Could not convert file to base64."));
      }
    };
    reader.onerror = (error) => reject(error);
  });
};

const RiceDeliveryPage = ({ currentSeason }: RiceDeliveryPageProps) => {
    const [releaseOrders, setReleaseOrders] = useState<ReleaseOrder[]>([]);
    const [liftingRecords, setLiftingRecords] = useState<LiftingRecord[]>([]);
    const [deliveryRecords, setDeliveryRecords] = useState<RiceDeliveryRecord[]>([]);
    const [cmrDepositOrders, setCmrDepositOrders] = useState<CmrDepositOrder[]>([]);
    const [dailyLogs, setDailyLogs] = useState<DailyStockLog[]>([]);
    const [frkRecords, setFrkRecords] = useState<FrkRecord[]>([]);

    // Modal State
    const [isDeliveryModalOpen, setIsDeliveryModalOpen] = useState(false);
    const [isCmrEditModalOpen, setIsCmrEditModalOpen] = useState(false);
    const [currentRecord, setCurrentRecord] = useState<Partial<RiceDeliveryRecord>>({});
    const [editingCmr, setEditingCmr] = useState<Partial<CmrDepositOrder>>({});
    const [modalError, setModalError] = useState<string | null>(null);

    // Upload State
    const [isUploading, setIsUploading] = useState(false);
    const [uploadError, setUploadError] = useState<string | null>(null);
    const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
    const cmrFileInputRef = useRef<HTMLInputElement>(null);

    // Load data from localStorage
    useEffect(() => {
        if (!currentSeason) return;
        try {
            const savedDeliveries = localStorage.getItem(`riceDeliveryRecords_${currentSeason}`);
            setDeliveryRecords(savedDeliveries ? JSON.parse(savedDeliveries) : []);

            const savedCmrOrders = localStorage.getItem(`cmrDepositOrders_${currentSeason}`);
            setCmrDepositOrders(savedCmrOrders ? JSON.parse(savedCmrOrders) : []);
            
            const savedRos = localStorage.getItem(`releaseOrders_${currentSeason}`);
            setReleaseOrders(savedRos ? JSON.parse(savedRos) : []);
            
            const savedLifting = localStorage.getItem(`liftingRecords_${currentSeason}`);
            setLiftingRecords(savedLifting ? JSON.parse(savedLifting) : []);
            
            const savedLogs = localStorage.getItem(`dailyStockLogs_${currentSeason}`);
            setDailyLogs(savedLogs ? JSON.parse(savedLogs) : []);
            
            const savedFrk = localStorage.getItem(`frkRecords_${currentSeason}`);
            setFrkRecords(savedFrk ? JSON.parse(savedFrk) : []);

        } catch (error) {
            console.error("Error loading data for Rice Delivery page:", error);
            setDeliveryRecords([]);
            setCmrDepositOrders([]);
            setReleaseOrders([]);
            setLiftingRecords([]);
            setDailyLogs([]);
            setFrkRecords([]);
        }
    }, [currentSeason]);

    // Save data to localStorage
    useEffect(() => {
        if (!currentSeason) return;
        try {
            localStorage.setItem(`riceDeliveryRecords_${currentSeason}`, JSON.stringify(deliveryRecords));
        } catch (error) {
            console.error("Error saving delivery records:", error);
        }
    }, [deliveryRecords, currentSeason]);
    
     useEffect(() => {
        if (!currentSeason) return;
        try {
            localStorage.setItem(`cmrDepositOrders_${currentSeason}`, JSON.stringify(cmrDepositOrders));
        } catch (error) {
            console.error("Error saving CMR Deposit Orders:", error);
        }
    }, [cmrDepositOrders, currentSeason]);
    
    // Calculate stock summary
    const stockSummary = useMemo(() => {
        const totalRiceProduced = dailyLogs.reduce((sum, log) => sum + (log.riceQuantity || 0), 0);
        const totalRiceDelivered = deliveryRecords.reduce((sum, rec) => sum + (rec.quantityDeliveredQtls || 0), 0);
        
        // Plain rice stock calculation
        const totalPlainRiceConsumed = totalRiceDelivered * (1 - FRK_BLENDING_RATIO);
        const availablePlainRiceStock = totalRiceProduced - totalPlainRiceConsumed;
        const availablePlainRiceStockInBags = availablePlainRiceStock > 0 ? Math.floor(availablePlainRiceStock / RICE_BAG_WEIGHT_QTL) : 0;
        
        // Agency share calculation
        const deliveredToFCI = deliveryRecords.filter(r => r.agency === 'FCI').reduce((sum, rec) => sum + rec.quantityDeliveredQtls, 0);
        const deliveredToMPSCSC = deliveryRecords.filter(r => r.agency === 'MPSCSC').reduce((sum, rec) => sum + rec.quantityDeliveredQtls, 0);
        const fciPercentage = totalRiceDelivered > 0 ? (deliveredToFCI / totalRiceDelivered) * 100 : 0;
        const mpscscPercentage = totalRiceDelivered > 0 ? (deliveredToMPSCSC / totalRiceDelivered) * 100 : 0;

        return {
            availablePlainRiceStock,
            availablePlainRiceStockInBags,
            totalRiceDelivered,
            fciPercentage,
            mpscscPercentage,
        };
    }, [dailyLogs, deliveryRecords]);

    // CMR Upload Handlers
    const handleUploadClick = () => {
        cmrFileInputRef.current?.click();
    };

    const handleCmrFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setUploadError(null);
        setUploadSuccess(null);

        if (file.type !== 'application/pdf') {
            setUploadError("Please upload a valid PDF file.");
            return;
        }
         if (file.size > FILE_SIZE_LIMIT) {
            setUploadError(`File is too large. Please upload a file smaller than ${FILE_SIZE_LIMIT / 1024 / 1024}MB.`);
            return;
        }

        setIsUploading(true);

        try {
            const base64Pdf = await fileToBase64(file);
            const isCorrectDoc = await validateCmrDepositOrder(base64Pdf);
            if (!isCorrectDoc) {
                throw new Error("Incorrect document type. Please upload a 'CMR DEPOSIT ORDER' only.");
            }

            const extractedData = await extractCmroDataFromPdf(base64Pdf);
            const targetDoNo = extractedData.doNo;
            
            if (!targetDoNo || !releaseOrders.some(ro => ro.doNo === targetDoNo)) {
                throw new Error(`The DO Number '${targetDoNo}' from the PDF was not found in your saved Release Orders for this season. Please upload the correct RO first.`);
            }

            const targetRo = releaseOrders.find(ro => ro.doNo === targetDoNo);
            const paddyLiftedForDo = liftingRecords
                .filter(lr => lr.doNo === targetDoNo)
                .reduce((sum, lr) => sum + lr.netPaddyQuantity, 0);

            if (targetRo) {
                const paddyAllotted = parseFloat(targetRo.quantity) || 0;
                const pendingLifting = paddyAllotted - paddyLiftedForDo;
                if (pendingLifting > 0.001) { // Use tolerance
                    throw new Error(`Paddy lifting is still pending for DO ${targetDoNo}. You cannot upload a CMR until lifting is complete. Pending: ${pendingLifting.toFixed(3)} Qtls.`);
                }
            }

            if (cmrDepositOrders.some(order => order.orderNo === extractedData.orderNo)) {
                throw new Error(`CMR Deposit Order with Order No. '${extractedData.orderNo}' has already been uploaded for this season.`);
            }

            const newOrder: CmrDepositOrder = {
                id: `cmr-${Date.now()}-${extractedData.orderNo}`,
                doNo: extractedData.doNo!,
                orderNo: extractedData.orderNo!,
                depositDate: extractedData.depositDate!,
                depositedAt: extractedData.depositedAt!
            };

            setCmrDepositOrders(prev => [...prev, newOrder].sort((a,b) => a.orderNo.localeCompare(b.orderNo)));
            setUploadSuccess(`CMR Deposit Order ${newOrder.orderNo} uploaded successfully. You can now create a delivery challan from it.`);

        } catch (err) {
            setUploadError(err instanceof Error ? err.message : err.toString());
        } finally {
            setIsUploading(false);
            if (cmrFileInputRef.current) {
                cmrFileInputRef.current.value = "";
            }
        }
    };
    
    const handleDeleteCmrOrder = (id: string) => {
        if (window.confirm("Are you sure you want to delete this CMR Deposit Order? This will not delete any delivery challans already created from it.")) {
            setCmrDepositOrders(prev => prev.filter(order => order.id !== id));
        }
    };

    const handleOpenCmrEditModal = (cmr: CmrDepositOrder) => {
        setEditingCmr(cmr);
        setIsCmrEditModalOpen(true);
    };

    const handleSaveCmrEdit = () => {
        setCmrDepositOrders(prev => prev.map(cmr => cmr.id === editingCmr.id ? editingCmr as CmrDepositOrder : cmr));
        setIsCmrEditModalOpen(false);
    };


    // Delivery Challan Handlers
    const handleOpenDeliveryModal = (cmrOrder: CmrDepositOrder) => {
        setModalError(null);
        setCurrentRecord({
            date: new Date().toISOString().split('T')[0],
            agency: 'FCI',
            doNo: cmrOrder.doNo,
            cmrOrderNo: cmrOrder.orderNo,
        });
        setIsDeliveryModalOpen(true);
    };

    const handleCloseDeliveryModal = () => {
        setIsDeliveryModalOpen(false);
    };

    const handleDeliveryInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        const newRecord = { ...currentRecord, [name]: (e.target as HTMLInputElement).type === 'number' ? parseFloat(value) || 0 : value };
        
        if (name === 'bagsDelivered') {
            newRecord.quantityDeliveredQtls = (parseFloat(value) || 0) * RICE_BAG_WEIGHT_QTL;
        }
        setCurrentRecord(newRecord);
    };

    const handleSaveDelivery = () => {
        setModalError(null);
        if (!currentRecord.date || !currentRecord.doNo || !currentRecord.vehicleNo?.trim() || !currentRecord.bagsDelivered || currentRecord.bagsDelivered <= 0 || !currentRecord.batchNo?.trim()) {
            setModalError("Please fill in all fields with valid data (Agency, Date, DO, Vehicle No, Batch No, and positive number of Bags).");
            return;
        }
        
        const deliveryQty = currentRecord.quantityDeliveredQtls || 0;

        // --- Stock Validation ---
        const totalRiceProduced = dailyLogs.reduce((sum, log) => sum + (log.riceQuantity || 0), 0);
        const totalRiceDeliveredSoFar = deliveryRecords.reduce((sum, rec) => sum + (rec.quantityDeliveredQtls || 0), 0);
        const availablePlainRice = totalRiceProduced - (totalRiceDeliveredSoFar * (1 - FRK_BLENDING_RATIO));
        
        const totalFrkPurchased = frkRecords.reduce((sum, rec) => sum + rec.quantityQtls, 0);
        const totalFrkConsumedSoFar = totalRiceDeliveredSoFar * FRK_BLENDING_RATIO;
        const availableFrk = totalFrkPurchased - totalFrkConsumedSoFar;

        const plainRiceNeeded = deliveryQty * (1 - FRK_BLENDING_RATIO);
        const frkNeeded = deliveryQty * FRK_BLENDING_RATIO;

        if (plainRiceNeeded > availablePlainRice + 0.001) {
            setModalError(`Not enough plain rice stock. Required: ${plainRiceNeeded.toFixed(3)} Qtls, Available: ${availablePlainRice.toFixed(3)} Qtls.`);
            return;
        }
        if (frkNeeded > availableFrk + 0.001) {
            setModalError(`Not enough FRK stock. Required: ${frkNeeded.toFixed(4)} Qtls, Available: ${availableFrk.toFixed(4)} Qtls.`);
            return;
        }

        // --- DO Entitlement Validation ---
        const targetRo = releaseOrders.find(ro => ro.doNo === currentRecord.doNo);
        if (!targetRo) {
            setModalError("Selected DO Number is not valid.");
            return;
        }

        const riceEntitlementForDo = (parseFloat(targetRo.quantity) || 0) * CMR_TURNOUT_RATIO;
        let deliveredForThisDo = deliveryRecords.filter(rec => rec.doNo === currentRecord.doNo).reduce((sum, rec) => sum + rec.quantityDeliveredQtls, 0);
        const pendingForThisDo = riceEntitlementForDo - deliveredForThisDo;

        if (deliveryQty > pendingForThisDo + 0.001) {
            setModalError(`Cannot deliver ${deliveryQty.toFixed(3)} Qtls. Only ${pendingForThisDo.toFixed(3)} Qtls remaining for DO ${currentRecord.doNo}.`);
            return;
        }
        
        const newRecord: RiceDeliveryRecord = {
            id: `delivery-${Date.now()}`,
            ...currentRecord
        } as RiceDeliveryRecord;
        setDeliveryRecords(prev => [...prev, newRecord]);
        
        handleCloseDeliveryModal();
    };
    
    const sortedDeliveryRecords = useMemo(() => [...deliveryRecords].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()), [deliveryRecords]);
    
    const inputClass = "w-full bg-white border border-slate-300 rounded-md shadow-sm px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500";
    const labelClass = "block text-sm font-medium text-slate-700 mb-1";

    return (
        <div className="space-y-8 animate-fade-in">
            <div>
                <h1 className="text-3xl font-bold text-slate-900">Rice Delivery Management</h1>
                <p className="mt-2 text-slate-600">Track rice delivered against your available stock for season <span className="font-semibold">{currentSeason}</span>.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-blue-100 p-6 rounded-lg shadow-sm border border-blue-200">
                    <h3 className="text-blue-800 font-semibold text-lg">Available Plain Rice Stock</h3>
                    <p className="text-3xl font-bold text-blue-900 mt-2">{stockSummary.availablePlainRiceStock.toFixed(3)} <span className="text-lg font-medium">Qtls</span></p>
                    <p className="text-sm text-blue-700">Approx. {stockSummary.availablePlainRiceStockInBags.toLocaleString()} Bags</p>
                </div>
                <div className="bg-green-100 p-6 rounded-lg shadow-sm border border-green-200">
                    <h3 className="text-green-800 font-semibold text-lg">Total Fortified Rice Delivered</h3>
                    <p className="text-3xl font-bold text-green-900 mt-2">{stockSummary.totalRiceDelivered.toFixed(3)} <span className="text-lg font-medium">Qtls</span></p>
                     <p className="text-sm text-green-700">Across all agencies</p>
                </div>
                 <div className="bg-teal-100 p-6 rounded-lg shadow-sm border border-teal-200">
                    <h3 className="text-teal-800 font-semibold text-lg">FCI Delivery Share</h3>
                    <p className="text-3xl font-bold text-teal-900 mt-2">{stockSummary.fciPercentage.toFixed(1)}<span className="text-lg font-medium">%</span></p>
                </div>
                 <div className="bg-sky-100 p-6 rounded-lg shadow-sm border border-sky-200">
                    <h3 className="text-sky-800 font-semibold text-lg">MPSCSC Delivery Share</h3>
                    <p className="text-3xl font-bold text-sky-900 mt-2">{stockSummary.mpscscPercentage.toFixed(1)}<span className="text-lg font-medium">%</span></p>
                </div>
            </div>

            {/* CMR Upload Section */}
            <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
                <h2 className="text-xl font-bold text-slate-800">1. Upload CMR Deposit Orders (Delivery Authorizations)</h2>
                <p className="mt-1 text-slate-500">Upload the CMR Deposit Order PDF to authorize a new delivery.</p>
                <div className="mt-4">
                    <input
                        type="file"
                        ref={cmrFileInputRef}
                        onChange={handleCmrFileChange}
                        className="hidden"
                        accept="application/pdf"
                        disabled={isUploading}
                    />
                    <button
                        onClick={handleUploadClick}
                        disabled={isUploading}
                        className="inline-flex items-center justify-center px-6 py-3 font-semibold text-white bg-blue-600 rounded-lg shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-150 disabled:bg-blue-400 disabled:cursor-not-allowed"
                    >
                        {isUploading ? (
                            <>
                                <div className="w-5 h-5"><LoadingSpinner /></div>
                                <span className="ml-2">Uploading & Analyzing...</span>
                            </>
                        ) : 'Upload CMR Order (PDF)'}
                    </button>
                </div>
                {uploadError && <p className="mt-4 text-sm text-red-600 bg-red-50 p-3 rounded-md border border-red-200 whitespace-pre-wrap">{uploadError}</p>}
                {uploadSuccess && <p className="mt-4 text-sm text-green-600 bg-green-50 p-3 rounded-md border border-green-200">{uploadSuccess}</p>}
            </div>
            
            {/* CMR Deposit Order Table */}
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-4 border-b border-slate-200">
                    <h3 className="text-lg font-semibold text-slate-700">Authorized Deliveries (from CMR Orders)</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full text-sm text-left text-slate-600">
                        <thead className="bg-slate-50 border-b border-slate-200 text-xs text-slate-500 uppercase tracking-wider">
                            <tr>
                                <th scope="col" className="px-4 py-3 font-medium">Order No.</th>
                                <th scope="col" className="px-4 py-3 font-medium">Related DO No.</th>
                                <th scope="col" className="px-4 py-3 font-medium">Order Date</th>
                                <th scope="col" className="px-4 py-3 font-medium">Deposit Godown</th>
                                <th scope="col" className="px-4 py-3 font-medium text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                            {cmrDepositOrders.length > 0 ? cmrDepositOrders.map(order => (
                                <tr key={order.id} className="hover:bg-slate-50">
                                    <td className="px-4 py-3 font-semibold text-slate-800">{order.orderNo}</td>
                                    <td className="px-4 py-3">{order.doNo}</td>
                                    <td className="px-4 py-3 whitespace-nowrap">{order.depositDate}</td>
                                    <td className="px-4 py-3">{order.depositedAt}</td>
                                    <td className="px-4 py-3 text-center whitespace-nowrap">
                                        <button onClick={() => handleOpenDeliveryModal(order)} className="font-semibold text-white bg-green-600 hover:bg-green-700 px-3 py-1 text-xs rounded-md shadow-sm transition-colors">Create Delivery</button>
                                        <button onClick={() => handleOpenCmrEditModal(order)} className="ml-2 font-medium text-blue-600 hover:text-blue-800 px-2 py-1 rounded-md hover:bg-blue-100 transition-colors">Edit</button>
                                        <button onClick={() => handleDeleteCmrOrder(order.id)} className="ml-2 font-medium text-red-600 hover:text-red-800 px-2 py-1 rounded-md hover:bg-red-100 transition-colors">Delete</button>
                                    </td>
                                </tr>
                            )) : (
                                <tr><td colSpan={5} className="text-center py-10 text-slate-500">No CMR Deposit Orders uploaded for this season yet.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Delivery Challan Register Table */}
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-4 border-b border-slate-200 flex justify-between items-center">
                    <h3 className="text-lg font-semibold text-slate-700">2. Rice Delivery Challan Register</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full text-sm text-left text-slate-600">
                        <thead className="bg-slate-50 border-b border-slate-200 text-xs text-slate-500 uppercase tracking-wider">
                            <tr>
                                <th scope="col" className="px-4 py-3 font-medium">Delivery Date</th>
                                <th scope="col" className="px-4 py-3 font-medium">Agency</th>
                                <th scope="col" className="px-4 py-3 font-medium">Vehicle No.</th>
                                <th scope="col" className="px-4 py-3 font-medium">Batch No.</th>
                                <th scope="col" className="px-4 py-3 font-medium">CMR Order No.</th>
                                <th scope="col" className="px-4 py-3 font-medium text-right">Bags</th>
                                <th scope="col" className="px-4 py-3 font-medium text-right">Quantity (Qtls)</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                            {sortedDeliveryRecords.length > 0 ? sortedDeliveryRecords.map(rec => (
                                <tr key={rec.id} className="hover:bg-slate-50">
                                    <td className="px-4 py-3 whitespace-nowrap">{new Date(rec.date).toLocaleDateString()}</td>
                                    <td className="px-4 py-3"><span className={`inline-block px-2 py-1 text-xs font-semibold rounded-full ${rec.agency === 'FCI' ? 'bg-teal-100 text-teal-800' : 'bg-sky-100 text-sky-800'}`}>{rec.agency}</span></td>
                                    <td className="px-4 py-3">{rec.vehicleNo}</td>
                                    <td className="px-4 py-3">{rec.batchNo}</td>
                                    <td className="px-4 py-3 text-slate-500">{rec.cmrOrderNo}</td>
                                    <td className="px-4 py-3 text-right">{rec.bagsDelivered.toLocaleString()}</td>
                                    <td className="px-4 py-3 text-right font-bold text-red-600">-{rec.quantityDeliveredQtls.toFixed(3)}</td>
                                </tr>
                            )) : (
                                <tr><td colSpan={7} className="text-center py-10 text-slate-500">No rice delivery challans created yet. Create one from an authorized CMR order above.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
            
            {/* Delivery Modal */}
            {isDeliveryModalOpen && (
                 <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in-fast">
                    <div className="bg-white rounded-lg shadow-2xl w-full max-w-2xl m-4" role="dialog" aria-modal="true">
                        <div className="px-6 py-4 border-b border-slate-200">
                            <h3 className="text-lg font-bold text-slate-800">Create New Delivery Challan</h3>
                            <p className="text-sm text-slate-500">Against CMR Order: <span className="font-semibold">{currentRecord.cmrOrderNo}</span></p>
                        </div>
                        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                            {modalError && <p className="text-sm text-red-600 bg-red-50 p-3 rounded-md border border-red-200 whitespace-pre-wrap">{modalError}</p>}
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className={labelClass}>Agency</label>
                                    <div className="flex items-center space-x-4 p-2 bg-slate-50 rounded-md border border-slate-200">
                                        <label className="flex items-center space-x-2 cursor-pointer">
                                            <input type="radio" name="agency" value="FCI" checked={currentRecord.agency === 'FCI'} onChange={handleDeliveryInputChange} className="h-4 w-4 text-teal-600 focus:ring-teal-500"/>
                                            <span className="text-sm font-medium text-slate-700">FCI</span>
                                        </label>
                                        <label className="flex items-center space-x-2 cursor-pointer">
                                            <input type="radio" name="agency" value="MPSCSC" checked={currentRecord.agency === 'MPSCSC'} onChange={handleDeliveryInputChange} className="h-4 w-4 text-sky-600 focus:ring-sky-500"/>
                                            <span className="text-sm font-medium text-slate-700">MPSCSC</span>
                                        </label>
                                    </div>
                                </div>
                                <div>
                                    <label htmlFor="date" className={labelClass}>Delivery Date</label>
                                    <input type="date" id="date" name="date" value={currentRecord.date?.split('T')[0] || ''} onChange={handleDeliveryInputChange} className={inputClass} />
                                </div>
                            </div>

                             <div>
                                <label htmlFor="doNo" className={labelClass}>Related Delivery Order (DO No.)</label>
                                <select id="doNo" name="doNo" value={currentRecord.doNo || ''} onChange={handleDeliveryInputChange} className={`${inputClass} bg-slate-100 cursor-not-allowed`} disabled>
                                    <option value={currentRecord.doNo}>{currentRecord.doNo}</option>
                                </select>
                            </div>
                            
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="vehicleNo" className={labelClass}>Vehicle No.</label>
                                    <input type="text" id="vehicleNo" name="vehicleNo" value={currentRecord.vehicleNo || ''} onChange={handleDeliveryInputChange} className={inputClass} placeholder="e.g., MP19AB1234" />
                                </div>
                                <div>
                                    <label htmlFor="batchNo" className={labelClass}>Batch / Lot No.</label>
                                    <input type="text" id="batchNo" name="batchNo" value={currentRecord.batchNo || ''} onChange={handleDeliveryInputChange} className={inputClass} placeholder="e.g., BATCH-001" />
                                </div>
                            </div>
                            
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="bagsDelivered" className={labelClass}>No. of Bags</label>
                                    <input type="number" id="bagsDelivered" name="bagsDelivered" value={currentRecord.bagsDelivered || ''} onChange={handleDeliveryInputChange} className={inputClass} placeholder="e.g., 580" />
                                </div>
                                <div>
                                    <label htmlFor="quantityDeliveredQtls" className={labelClass}>Quantity (Qtls)</label>
                                    <input type="number" id="quantityDeliveredQtls" name="quantityDeliveredQtls" value={currentRecord.quantityDeliveredQtls || 0} onChange={handleDeliveryInputChange} className={`${inputClass} bg-slate-50`} />
                                    <p className="text-xs text-slate-500 mt-1">Auto-calculated (50kg/bag). Can be edited.</p>
                                </div>
                            </div>
                        </div>
                        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end space-x-3">
                            <button onClick={handleCloseDeliveryModal} className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50">Cancel</button>
                            <button onClick={handleSaveDelivery} className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md shadow-sm hover:bg-green-700">Save Challan</button>
                        </div>
                    </div>
                </div>
            )}

            {/* CMR Edit Modal */}
            {isCmrEditModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in-fast">
                    <div className="bg-white rounded-lg shadow-2xl w-full max-w-lg m-4" role="dialog">
                        <div className="px-6 py-4 border-b border-slate-200">
                             <h3 className="text-lg font-bold text-slate-800">Edit CMR Authorization</h3>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label htmlFor="cmrOrderNo" className={labelClass}>Order No.</label>
                                <input type="text" id="cmrOrderNo" value={editingCmr.orderNo || ''} onChange={e => setEditingCmr(p => ({...p, orderNo: e.target.value}))} className={inputClass}/>
                            </div>
                            <div>
                                <label htmlFor="cmrDoNo" className={labelClass}>Related DO No.</label>
                                <input type="text" id="cmrDoNo" value={editingCmr.doNo || ''} onChange={e => setEditingCmr(p => ({...p, doNo: e.target.value}))} className={inputClass}/>
                            </div>
                            <div>
                                <label htmlFor="cmrDepositDate" className={labelClass}>Order Date</label>
                                <input type="text" id="cmrDepositDate" value={editingCmr.depositDate || ''} onChange={e => setEditingCmr(p => ({...p, depositDate: e.target.value}))} className={inputClass}/>
                            </div>
                            <div>
                                <label htmlFor="cmrDepositedAt" className={labelClass}>Deposit Godown</label>
                                <input type="text" id="cmrDepositedAt" value={editingCmr.depositedAt || ''} onChange={e => setEditingCmr(p => ({...p, depositedAt: e.target.value}))} className={inputClass}/>
                            </div>
                        </div>
                        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end space-x-3">
                            <button onClick={() => setIsCmrEditModalOpen(false)} className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50">Cancel</button>
                            <button onClick={handleSaveCmrEdit} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md shadow-sm hover:bg-blue-700">Save Changes</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default RiceDeliveryPage;
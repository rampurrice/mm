

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { extractRoDataFromPdf, validateDhanDeliveryOrder, extractKantaParchiData } from '../services/geminiService';
import { ReleaseOrder, LiftingRecord } from '../types';
import LoadingSpinner from './LoadingSpinner';

const FILE_SIZE_LIMIT = 5 * 1024 * 1024; // 5MB
const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const NEW_BAG_WEIGHT_G = 580;
const USED_BAG_WEIGHT_G = 500;

interface LiftDistributionItem {
  doNo: string;
  quantity: number;
  maxQuantity: number;
  isLocked: boolean;
  availableDoOptions: (ReleaseOrder & { pending: number })[];
}

interface PaddyLiftingPageProps {
  currentSeason: string;
  setCurrentSeason: (season: string) => void;
}

// This utility handles the conversion of old data records to the new format.
const migrateLiftingRecords = (records: any[]): LiftingRecord[] => {
  if (!records) return [];
  return records.map(record => {
    // If it has bagType, it's an old record needing migration.
    if (record.hasOwnProperty('bagType') && record.hasOwnProperty('numberOfBags')) {
      const { bagType, numberOfBags, ...rest } = record;
      const isNewBag = bagType === 'New Bag';
      return {
        ...rest,
        numberOfNewBags: isNewBag ? (numberOfBags || 0) : 0,
        numberOfUsedBags: !isNewBag ? (numberOfBags || 0) : 0,
      };
    }
    // For new or already migrated records, ensure fields exist.
    return {
      ...record,
      numberOfNewBags: record.numberOfNewBags || 0,
      numberOfUsedBags: record.numberOfUsedBags || 0,
    };
  });
};


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

const TrashIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm4 0a1 1 0 012 0v6a1 1 0 11-2 0V8z" clipRule="evenodd" />
    </svg>
);


const PaddyLiftingPage = ({ currentSeason, setCurrentSeason }: PaddyLiftingPageProps) => {
  const [releaseOrders, setReleaseOrders] = useState<ReleaseOrder[]>([]);
  const [liftingRecords, setLiftingRecords] = useState<LiftingRecord[]>([]);

  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [editingRoNo, setEditingRoNo] = useState<string | null>(null);
  const [editedOrder, setEditedOrder] = useState<ReleaseOrder | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentLiftingInfo, setCurrentLiftingInfo] = useState<{ godown: string; pending: number; } | null>(null);
  const [grossLiftedQuantity, setGrossLiftedQuantity] = useState(''); // This is the Net Wt from Kanta Parchi
  const [rstNo, setRstNo] = useState('');
  const [truckNo, setTruckNo] = useState('');
  const [numberOfNewBags, setNumberOfNewBags] = useState('');
  const [newBagWeight, setNewBagWeight] = useState(String(NEW_BAG_WEIGHT_G));
  const [numberOfUsedBags, setNumberOfUsedBags] = useState('');
  const [usedBagWeight, setUsedBagWeight] = useState(String(USED_BAG_WEIGHT_G));
  const [modalError, setModalError] = useState<string | null>(null);
  const [distribution, setDistribution] = useState<LiftDistributionItem[]>([]);

  // Kanta Parchi State
  const kantaParchiInputRef = useRef<HTMLInputElement>(null);
  const [isKantaParchiLoading, setIsKantaParchiLoading] = useState(false);

  // Load data based on current season
  useEffect(() => {
    if (!currentSeason) return;

    try {
      const savedOrders = localStorage.getItem(`releaseOrders_${currentSeason}`);
      const parsedOrders = savedOrders ? JSON.parse(savedOrders) : [];
      setReleaseOrders(parsedOrders.sort((a: ReleaseOrder, b: ReleaseOrder) => a.doNo.localeCompare(b.doNo)));
    } catch (error) {
      console.error(`Failed to parse release orders for season ${currentSeason}`, error);
      setReleaseOrders([]);
    }
    
    try {
      const savedRecords = localStorage.getItem(`liftingRecords_${currentSeason}`);
      const migratedRecords = migrateLiftingRecords(savedRecords ? JSON.parse(savedRecords) : []);
      setLiftingRecords(migratedRecords);
    } catch (error) {
      console.error(`Failed to parse lifting records for season ${currentSeason}`, error);
      setLiftingRecords([]);
    }
  }, [currentSeason]);

  // Save data when it changes for the current season
  useEffect(() => {
    if (!currentSeason) return;
    try {
        localStorage.setItem(`releaseOrders_${currentSeason}`, JSON.stringify(releaseOrders));
    } catch (error) {
        console.error("Failed to save release orders to localStorage", error);
    }
  }, [releaseOrders, currentSeason]);

  useEffect(() => {
    if (!currentSeason) return;
    try {
        localStorage.setItem(`liftingRecords_${currentSeason}`, JSON.stringify(liftingRecords));
    } catch (error) {
        console.error("Failed to save lifting records to localStorage", error);
    }
  }, [liftingRecords, currentSeason]);
  
  const showSuccessMessage = (message: string) => {
    setSuccessMessage(message);
    setTimeout(() => {
        setSuccessMessage(null);
    }, 4000);
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setError(null);

    if (file.type !== 'application/pdf') {
        setError("Please upload a valid PDF file.");
        return;
    }
    
    if (file.size > FILE_SIZE_LIMIT) {
        setError(`File is too large. Please upload a file smaller than ${FILE_SIZE_LIMIT / 1024 / 1024}MB.`);
        return;
    }

    setIsLoading(true);

    try {
      setLoadingMessage('Validating document...');
      const base64Pdf = await fileToBase64(file);
      
      const isCorrectDoc = await validateDhanDeliveryOrder(base64Pdf);
      if (!isCorrectDoc) {
          throw new Error("Incorrect document type. Please upload a 'Dhan Delivery Order' (धान डिलेवरी आर्डर) only.");
      }

      setLoadingMessage('Extracting RO data...');
      const newOrder = await extractRoDataFromPdf(base64Pdf);
      
      // --- SEASON VALIDATION LOGIC ---
      if (newOrder.uparjanVarsh && newOrder.uparjanVarsh !== currentSeason) {
        const userAgrees = window.confirm(
            `This Release Order is for season '${newOrder.uparjanVarsh}', but you are currently in season '${currentSeason}'.\n\nDo you want to switch to the '${newOrder.uparjanVarsh}' season and save this order?`
        );
        
        if (userAgrees) {
            try {
                const otherSeasonKey = `releaseOrders_${newOrder.uparjanVarsh}`;
                const savedOrdersRaw = localStorage.getItem(otherSeasonKey);
                const savedOrders = savedOrdersRaw ? JSON.parse(savedOrdersRaw) : [];
                
                const existingIndex = savedOrders.findIndex((ro: ReleaseOrder) => ro.doNo === newOrder.doNo);
                if (existingIndex !== -1) {
                    savedOrders[existingIndex] = newOrder;
                } else {
                    savedOrders.push(newOrder);
                }
                
                localStorage.setItem(otherSeasonKey, JSON.stringify(savedOrders));
                setCurrentSeason(newOrder.uparjanVarsh);
                showSuccessMessage(`Switched to season ${newOrder.uparjanVarsh} and saved RO ${newOrder.doNo}.`);

            } catch (e) {
                setError("Failed to save order to the new season's storage.");
            }
        } else {
            showSuccessMessage("Upload cancelled. The Release Order was not saved.");
        }
        return; // Stop further execution in this function
      }

      setReleaseOrders(prevOrders => {
        const existingIndex = prevOrders.findIndex(ro => ro.doNo === newOrder.doNo);
        let updatedOrders;
        if (existingIndex !== -1) {
          updatedOrders = [...prevOrders];
          updatedOrders[existingIndex] = newOrder;
          showSuccessMessage(`Release Order ${newOrder.doNo} updated successfully in season ${currentSeason}.`);
        } else {
          updatedOrders = [...prevOrders, newOrder];
          showSuccessMessage(`Release Order ${newOrder.doNo} added successfully to season ${currentSeason}.`);
        }
        return updatedOrders.sort((a, b) => a.doNo.localeCompare(b.doNo));
      });

    } catch (err) {
      setError(err instanceof Error ? err.message : "An unknown error occurred.");
    } finally {
      setIsLoading(false);
      setLoadingMessage('');
      if(fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleEditClick = (ro: ReleaseOrder) => {
    setError(null);
    setEditingRoNo(ro.doNo);
    setEditedOrder({ ...ro });
  };

  const handleCancelClick = () => {
    setEditingRoNo(null);
    setEditedOrder(null);
  };

  const handleSaveClick = (doNo: string) => {
    if (!editedOrder) return;
    
    if (!editedOrder.doNo.trim() || !editedOrder.quantity.trim() || !editedOrder.uparjanVarsh.trim()) {
        setError("DO No., Quantity and Uparjan Varsh cannot be empty.");
        return;
    }
    if (isNaN(parseFloat(editedOrder.quantity))) {
        setError("Quantity must be a valid number.");
        return;
    }

    setReleaseOrders(prev => prev.map(ro => ro.doNo === doNo ? editedOrder : ro).sort((a, b) => a.doNo.localeCompare(b.doNo)));
    setEditingRoNo(null);
    setEditedOrder(null);
    setError(null);
    showSuccessMessage(`Order ${editedOrder.doNo} saved.`);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (editedOrder) {
      setEditedOrder({
        ...editedOrder,
        [e.target.name]: e.target.value,
      });
    }
  };
  
  const handleDeleteClick = (doNo: string) => {
    if (window.confirm(`Are you sure you want to delete Release Order ${doNo}? This will also delete associated lifting records for this season.`)) {
        setReleaseOrders(prev => prev.filter(ro => ro.doNo !== doNo));
        setLiftingRecords(prev => prev.filter(lr => lr.doNo !== doNo));
        showSuccessMessage(`Order ${doNo} deleted from season ${currentSeason}.`);
    }
  };

  // --- Modal Logic ---
    const handleOpenLiftModal = (godown: string, pending: number) => {
      setCurrentLiftingInfo({ godown, pending });
      setIsModalOpen(true);
      setGrossLiftedQuantity('');
      setRstNo('');
      setTruckNo('');
      setNumberOfNewBags('');
      setNewBagWeight(String(NEW_BAG_WEIGHT_G));
      setNumberOfUsedBags('');
      setUsedBagWeight(String(USED_BAG_WEIGHT_G));
      setModalError(null);
      setDistribution([]);
  };

  const handleCloseModal = () => {
      setIsModalOpen(false);
      setCurrentLiftingInfo(null);
  };
  
    useEffect(() => {
        if (!isModalOpen || !currentLiftingInfo) {
            setDistribution([]);
            return;
        }

        const grossQtyNum = parseFloat(grossLiftedQuantity) || 0;
        const numNewBags = parseInt(numberOfNewBags) || 0;
        const numUsedBags = parseInt(numberOfUsedBags) || 0;
        const newBagWeightGrams = parseFloat(newBagWeight) || 0;
        const usedBagWeightGrams = parseFloat(usedBagWeight) || 0;

        const totalBagWeightInKg = ((numNewBags * newBagWeightGrams) + (numUsedBags * usedBagWeightGrams)) / 1000;
        const totalBagWeightInQtls = totalBagWeightInKg / 100;
        const netPaddyQty = grossQtyNum - totalBagWeightInQtls;

        if (netPaddyQty <= 0) {
            setDistribution([]);
            return;
        }

        const allPendingRosForGodown = releaseOrders
            .filter(ro => ro.godown === currentLiftingInfo.godown)
            .map(ro => {
                const lifted = liftingRecords.filter(lr => lr.doNo === ro.doNo).reduce((sum, lr) => sum + lr.netPaddyQuantity, 0);
                const pending = (parseFloat(ro.quantity) || 0) - lifted;
                return { ...ro, pending };
            })
            .filter(ro => ro.pending > 0.001) // Use tolerance
            .sort((a, b) => a.doNo.localeCompare(b.doNo));

        const newDistribution: LiftDistributionItem[] = [];
        let remainingToDistribute = netPaddyQty;
        let availableOptions = [...allPendingRosForGodown];
        let usedDoNos: string[] = [];

        if (availableOptions.length > 0) {
            const firstRo = availableOptions[0];
            const qtyFromFirst = Math.min(remainingToDistribute, firstRo.pending);

            newDistribution.push({
                doNo: firstRo.doNo,
                quantity: qtyFromFirst,
                maxQuantity: firstRo.pending,
                isLocked: true,
                availableDoOptions: [],
            });

            remainingToDistribute -= qtyFromFirst;
            usedDoNos.push(firstRo.doNo);
        }
        
        if (remainingToDistribute > 0 && availableOptions.some(ro => ro.doNo !== usedDoNos[0])) {
            const optionsForNext = availableOptions.filter(ro => !usedDoNos.includes(ro.doNo));
            newDistribution.push({
                doNo: '', // Let user choose
                quantity: remainingToDistribute,
                maxQuantity: remainingToDistribute, 
                isLocked: false,
                availableDoOptions: optionsForNext,
            });
        }
        setDistribution(newDistribution);
    }, [isModalOpen, grossLiftedQuantity, numberOfNewBags, newBagWeight, numberOfUsedBags, usedBagWeight, currentLiftingInfo, releaseOrders, liftingRecords]);

    const handleDoSelectionChange = (index: number, selectedDoNo: string) => {
        setDistribution(prev => {
            const newDist = [...prev];
            const item = newDist[index];
            if (item) {
                item.doNo = selectedDoNo;
                const selectedRo = item.availableDoOptions.find(ro => ro.doNo === selectedDoNo);
                if (selectedRo) {
                    item.maxQuantity = selectedRo.pending;
                }
            }
            return newDist;
        });
    };

  const handleSaveLifting = () => {
      if (!currentLiftingInfo || distribution.length === 0) return;
      setModalError(null);

      // --- Validation ---
      const grossQtyNum = parseFloat(grossLiftedQuantity);
      const numNewBags = parseInt(numberOfNewBags) || 0;
      const numUsedBags = parseInt(numberOfUsedBags) || 0;

      if (isNaN(grossQtyNum) || grossQtyNum <= 0) {
          setModalError("Please enter a valid, positive Gross Lifted Quantity.");
          return;
      }
      if ((numNewBags + numUsedBags) <= 0) {
          setModalError("Please enter a valid number of bags for at least one bag type.");
          return;
      }
       if (!rstNo.trim() || !truckNo.trim()) {
          setModalError("Please enter the RST No. and Truck No.");
          return;
      }

      const totalNetPaddyQty = distribution.reduce((sum, item) => sum + item.quantity, 0);
      
      if (totalNetPaddyQty > currentLiftingInfo.pending + 0.001) {
          setModalError(`Error: Total lifted quantity (${totalNetPaddyQty.toFixed(3)}) exceeds pending amount for godown (${currentLiftingInfo.pending.toFixed(3)}).`);
          return;
      }
      
      // Validate the user-selected part of the distribution
      if (distribution.length > 1) {
          const secondPart = distribution[1];
          if (!secondPart.isLocked && !secondPart.doNo) {
              setModalError("Please select a DO for the additional quantity.");
              return;
          }
          if (secondPart.quantity > secondPart.maxQuantity + 0.001) {
              setModalError(`Lifted quantity for DO ${secondPart.doNo} (${secondPart.quantity.toFixed(3)}) exceeds its pending amount (${secondPart.maxQuantity.toFixed(3)}).`);
              return;
          }
      }

      // --- Record Creation ---
      const newRecords: LiftingRecord[] = [];
      let totalNewBagsDistributed = 0;
      let totalUsedBagsDistributed = 0;
      const newBagWeightGrams = parseFloat(newBagWeight);
      const usedBagWeightGrams = parseFloat(usedBagWeight);

      distribution.forEach((plan, index) => {
          const { doNo, quantity } = plan;
          
          let newBagsForThisRecord: number;
          let usedBagsForThisRecord: number;

          if (index === distribution.length - 1) {
              // Assign remaining bags to the last record to avoid rounding errors
              newBagsForThisRecord = numNewBags - totalNewBagsDistributed;
              usedBagsForThisRecord = numUsedBags - totalUsedBagsDistributed;
          } else {
              const proportionOfLift = quantity / totalNetPaddyQty;
              newBagsForThisRecord = Math.round(proportionOfLift * numNewBags);
              usedBagsForThisRecord = Math.round(proportionOfLift * numUsedBags);
              totalNewBagsDistributed += newBagsForThisRecord;
              totalUsedBagsDistributed += usedBagsForThisRecord;
          }

          const bagWeightForThisRecordKg = ((newBagsForThisRecord * newBagWeightGrams) + (usedBagsForThisRecord * usedBagWeightGrams)) / 1000;
          const bagWeightInQtls = bagWeightForThisRecordKg / 100;
          const grossLiftedForThisRecord = quantity + bagWeightInQtls;

          const newRecord: LiftingRecord = {
              id: `lift-${Date.now()}-${doNo}`,
              rstNo,
              doNo: doNo,
              godown: currentLiftingInfo.godown,
              grossLiftedQuantity: grossLiftedForThisRecord,
              totalBagWeight: bagWeightInQtls,
              netPaddyQuantity: quantity,
              truckNo,
              numberOfNewBags: newBagsForThisRecord,
              numberOfUsedBags: usedBagsForThisRecord,
              liftingDate: new Date().toISOString(),
          };
          newRecords.push(newRecord);
      });

      setLiftingRecords(prev => [...prev, ...newRecords]);
      showSuccessMessage(`${totalNetPaddyQty.toFixed(3)} Qtls distributed across ${newRecords.length} DO(s) and saved successfully.`);
      handleCloseModal();
  };

  const handleKantaParchiUploadClick = () => {
    kantaParchiInputRef.current?.click();
  };
  
  const handleKantaParchiFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
  
    setModalError(null);
  
    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      setModalError("Please upload a valid image file (JPG, PNG).");
      return;
    }
    if (file.size > FILE_SIZE_LIMIT) {
      setModalError(`File is too large. Please upload a file smaller than ${FILE_SIZE_LIMIT / 1024 / 1024}MB.`);
      return;
    }
  
    setIsKantaParchiLoading(true);
    try {
      const base64Image = await fileToBase64(file);
      const data = await extractKantaParchiData(base64Image, file.type);
      
      if (data.liftedQuantityInKg) {
        const quantityInKg = parseFloat(data.liftedQuantityInKg);
        if (!isNaN(quantityInKg)) {
          const quantityInQtls = quantityInKg / 100;
          setGrossLiftedQuantity(quantityInQtls.toFixed(3));
        }
      }
      if (data.rstNo) setRstNo(data.rstNo);
      if (data.truckNo) setTruckNo(data.truckNo);
      // User must now manually enter bag counts into the new fields.

    } catch (err) {
      setModalError(err instanceof Error ? err.message : "An unknown error occurred during slip analysis.");
    } finally {
      setIsKantaParchiLoading(false);
      if(kantaParchiInputRef.current) {
        kantaParchiInputRef.current.value = "";
      }
    }
  };


  const inputClass = "w-full bg-white border border-slate-300 rounded-md shadow-sm px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500";
  
  const godownSummary = useMemo(() => {
    const summary: Record<string, { total: number, lifted: number, doNos: string[] }> = {};

    releaseOrders.forEach(ro => {
        if (!ro.godown) return;
        if (!summary[ro.godown]) {
            summary[ro.godown] = { total: 0, lifted: 0, doNos: [] };
        }
        summary[ro.godown].total += parseFloat(ro.quantity) || 0;
        summary[ro.godown].doNos.push(ro.doNo);
    });

    liftingRecords.forEach(lr => {
        if (summary[lr.godown]) {
            summary[lr.godown].lifted += lr.netPaddyQuantity || 0;
        }
    });

    return Object.entries(summary).map(([godown, data]) => ({
        godown,
        totalAllotted: data.total,
        totalLifted: data.lifted,
        pending: data.total - data.lifted,
        doNos: data.doNos.sort().join(', '),
    })).sort((a,b) => a.godown.localeCompare(b.godown));
  }, [releaseOrders, liftingRecords]);


  return (
    <div className="space-y-8 animate-fade-in">
      {/* Section 1: RO Management */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
        <h2 className="text-2xl font-bold text-slate-800">1. Release Orders (RO) Management</h2>
        <p className="mt-1 text-slate-500">Add new ROs for season <span className="font-semibold">{currentSeason}</span> by uploading the official PDF.</p>
        <div className="mt-4">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
            accept="application/pdf"
            disabled={isLoading}
          />
          <button
            onClick={handleUploadClick}
            disabled={isLoading}
            className="inline-flex items-center justify-center px-6 py-3 font-semibold text-white bg-blue-600 rounded-lg shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-150 disabled:bg-blue-400 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <div className="w-5 h-5"><LoadingSpinner /></div>
                <span className="ml-2">{loadingMessage}</span>
              </>
            ) : (
                'Upload Release Order (PDF)'
            )}
          </button>
        </div>
         {error && <p className="mt-4 text-sm text-red-600 bg-red-50 p-3 rounded-md border border-red-200">{error}</p>}
         {successMessage && <p className="mt-4 text-sm text-green-600 bg-green-50 p-3 rounded-md border border-green-200">{successMessage}</p>}
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-200">
            <h3 className="text-lg font-semibold text-slate-700">Uploaded Release Orders for {currentSeason}</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm text-left text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-200 text-xs text-slate-500 uppercase tracking-wider">
              <tr>
                <th scope="col" className="px-4 py-3 font-medium">DO NO.</th>
                <th scope="col" className="px-4 py-3 font-medium">DO Date</th>
                 <th scope="col" className="px-4 py-3 font-medium">Uparjan Varsh</th>
                <th scope="col" className="px-4 py-3 font-medium">Lot No.</th>
                <th scope="col" className="px-4 py-3 font-medium">Issue Center</th>
                <th scope="col" className="px-4 py-3 font-medium">Godown</th>
                <th scope="col" className="px-4 py-3 font-medium text-right">Quantity (Qtls)</th>
                <th scope="col" className="px-4 py-3 font-medium">Valid Upto</th>
                <th scope="col" className="px-4 py-3 font-medium text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {releaseOrders.length > 0 ? (
                releaseOrders.map((ro) => (
                  editingRoNo === ro.doNo && editedOrder ? (
                  <tr key={ro.doNo} className="bg-blue-50/50">
                    <td className="px-2 py-2"><input name="doNo" value={editedOrder.doNo} onChange={handleInputChange} className={inputClass} /></td>
                    <td className="px-2 py-2"><input name="doDate" value={editedOrder.doDate} onChange={handleInputChange} className={inputClass} /></td>
                    <td className="px-2 py-2"><input name="uparjanVarsh" value={editedOrder.uparjanVarsh} onChange={handleInputChange} className={inputClass} /></td>
                    <td className="px-2 py-2"><input name="lotNo" value={editedOrder.lotNo} onChange={handleInputChange} className={inputClass} /></td>
                    <td className="px-2 py-2"><input name="issueCenter" value={editedOrder.issueCenter} onChange={handleInputChange} className={inputClass} /></td>
                    <td className="px-2 py-2"><input name="godown" value={editedOrder.godown} onChange={handleInputChange} className={inputClass} /></td>
                    <td className="px-2 py-2"><input name="quantity" value={editedOrder.quantity} onChange={handleInputChange} className={`${inputClass} text-right`} /></td>
                    <td className="px-2 py-2"><input name="validUpto" value={editedOrder.validUpto} onChange={handleInputChange} className={inputClass} /></td>
                    <td className="px-2 py-2 text-center whitespace-nowrap">
                      <button onClick={() => handleSaveClick(ro.doNo)} className="font-medium text-green-600 hover:text-green-800 px-2 py-1 rounded-md hover:bg-green-100 transition-colors">Save</button>
                      <button onClick={handleCancelClick} className="font-medium text-slate-600 hover:text-slate-800 px-2 py-1 rounded-md hover:bg-slate-100 transition-colors">Cancel</button>
                    </td>
                  </tr>
                  ) : (
                  <tr key={ro.doNo} className="hover:bg-slate-50">
                    <td className="px-4 py-4 font-semibold text-slate-900 whitespace-nowrap">{ro.doNo}</td>
                    <td className="px-4 py-4 whitespace-nowrap">{ro.doDate}</td>
                    <td className="px-4 py-4 whitespace-nowrap">{ro.uparjanVarsh}</td>
                    <td className="px-4 py-4 whitespace-nowrap">{ro.lotNo}</td>
                    <td className="px-4 py-4">{ro.issueCenter}</td>
                    <td className="px-4 py-4">{ro.godown}</td>
                    <td className="px-4 py-4 font-medium text-slate-900 text-right whitespace-nowrap">{parseFloat(ro.quantity).toFixed(2)}</td>
                    <td className="px-4 py-4 whitespace-nowrap">{ro.validUpto}</td>
                    <td className="px-4 py-4 text-center whitespace-nowrap">
                       <button onClick={() => handleEditClick(ro)} className="font-medium text-blue-600 hover:text-blue-800 px-2 py-1 rounded-md hover:bg-blue-100 transition-colors">Edit</button>
                       <button onClick={() => handleDeleteClick(ro.doNo)} className="ml-2 font-medium text-red-600 hover:text-red-800 px-2 py-1 rounded-md hover:bg-red-100 transition-colors">Delete</button>
                    </td>
                  </tr>
                  )
                ))
              ) : (
                <tr>
                  <td colSpan={9} className="text-center py-10 text-slate-500">
                    No Release Orders have been uploaded for season {currentSeason} yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Section 2: Pending Lifting */}
       <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
        <h2 className="text-2xl font-bold text-slate-800">2. Pending Paddy for Lifting</h2>
        <p className="mt-1 text-slate-500">Record paddy lifted from godowns for season {currentSeason}.</p>
        
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-sm text-left text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-200 text-xs text-slate-500 uppercase tracking-wider">
              <tr>
                <th scope="col" className="px-4 py-3 font-medium">Godown</th>
                <th scope="col" className="px-4 py-3 font-medium">Associated DOs</th>
                <th scope="col" className="px-4 py-3 font-medium text-right">Total Allotted (Qtls)</th>
                <th scope="col" className="px-4 py-3 font-medium text-right">Total Lifted (Qtls)</th>
                <th scope="col" className="px-4 py-3 font-medium text-right">Pending (Qtls)</th>
                <th scope="col" className="px-4 py-3 font-medium text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
                {godownSummary.length > 0 ? (
                    godownSummary.map(summary => {
                        return (
                            <tr key={summary.godown} className="hover:bg-slate-50">
                                <td className="px-4 py-4 font-semibold text-slate-900">{summary.godown}</td>
                                <td className="px-4 py-4 text-slate-500 text-xs max-w-xs">{summary.doNos}</td>
                                <td className="px-4 py-4 font-medium text-slate-900 text-right whitespace-nowrap">{summary.totalAllotted.toFixed(2)}</td>
                                <td className="px-4 py-4 font-medium text-green-600 text-right whitespace-nowrap">{summary.totalLifted.toFixed(3)}</td>
                                <td className="px-4 py-4 font-bold text-orange-600 text-right whitespace-nowrap">{summary.pending.toFixed(3)}</td>
                                <td className="px-4 py-4 text-center">
                                    <button 
                                        onClick={() => handleOpenLiftModal(summary.godown, summary.pending)} 
                                        disabled={summary.pending <= 0}
                                        className="px-4 py-2 text-xs font-semibold text-white bg-green-600 rounded-md shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:bg-slate-400 disabled:cursor-not-allowed transition-colors"
                                    >
                                        Lift Paddy
                                    </button>
                                </td>
                            </tr>
                        );
                    })
                ) : (
                    <tr>
                        <td colSpan={6} className="text-center py-10 text-slate-500">
                           Upload a Release Order for season {currentSeason} to begin lifting paddy.
                        </td>
                    </tr>
                )}
            </tbody>
          </table>
        </div>
      </div>

       {/* Lifting Modal */}
      {isModalOpen && currentLiftingInfo && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in-fast">
              <div className="bg-white rounded-lg shadow-2xl w-full max-w-2xl m-4" role="dialog" aria-modal="true" aria-labelledby="modal-title">
                  <div className="px-6 py-4 border-b border-slate-200">
                      <h3 id="modal-title" className="text-lg font-bold text-slate-800">Lift Paddy from: {currentLiftingInfo.godown}</h3>
                      <p className="text-sm text-slate-500">Record a new pickup for season {currentSeason}. Pending quantity is {currentLiftingInfo.pending.toFixed(3)} Qtls.</p>
                  </div>
                  <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                      <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                        <p className="text-sm font-medium text-slate-600 mb-2">Save time with AI:</p>
                        <input
                          type="file"
                          ref={kantaParchiInputRef}
                          onChange={handleKantaParchiFileChange}
                          className="hidden"
                          accept={ACCEPTED_IMAGE_TYPES.join(',')}
                          disabled={isKantaParchiLoading}
                        />
                        <button 
                          onClick={handleKantaParchiUploadClick} 
                          disabled={isKantaParchiLoading}
                          className="w-full inline-flex items-center justify-center px-4 py-2 text-sm font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg shadow-sm hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-150 disabled:bg-slate-200"
                        >
                            {isKantaParchiLoading ? (
                              <>
                                <div className="w-5 h-5"><LoadingSpinner /></div>
                                <span className="ml-2">Analyzing Slip...</span>
                              </>
                            ) : (
                                "Upload Kanta Parchi (Weighing Slip)"
                            )}
                        </button>
                      </div>

                      {modalError && <p className="text-sm text-red-600 bg-red-50 p-3 rounded-md border border-red-200 whitespace-pre-wrap">{modalError}</p>}
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="grossLiftedQuantity" className="block text-sm font-medium text-slate-700 mb-1">Gross Lifted Quantity (Qtls)</label>
                            <input type="number" id="grossLiftedQuantity" value={grossLiftedQuantity} onChange={e => setGrossLiftedQuantity(e.target.value)} className={inputClass} placeholder="Net Wt from slip, e.g., 223.50" />
                        </div>
                         <div>
                            <label htmlFor="rstNo" className="block text-sm font-medium text-slate-700 mb-1">RST No.</label>
                            <input type="text" id="rstNo" value={rstNo} onChange={e => setRstNo(e.target.value)} className={inputClass} placeholder="Slip number" />
                        </div>
                      </div>
                       <div>
                            <label htmlFor="truckNo" className="block text-sm font-medium text-slate-700 mb-1">Truck No.</label>
                            <input type="text" id="truckNo" value={truckNo} onChange={e => setTruckNo(e.target.value)} className={inputClass} placeholder="e.g., MP19AB1234" />
                        </div>

                      <div className="space-y-4">
                          <div className="p-3 bg-blue-50/50 rounded-md border border-blue-200">
                              <div className="grid grid-cols-2 gap-4">
                                  <div>
                                      <label htmlFor="numberOfNewBags" className="block text-sm font-medium text-slate-700 mb-1">No. of New Bags</label>
                                      <input type="number" id="numberOfNewBags" value={numberOfNewBags} onChange={e => setNumberOfNewBags(e.target.value)} className={inputClass} placeholder="e.g., 400" />
                                  </div>
                                  <div>
                                      <label htmlFor="newBagWeight" className="block text-sm font-medium text-slate-700 mb-1">New Bag Wt. (g)</label>
                                      <input type="number" id="newBagWeight" value={newBagWeight} onChange={e => setNewBagWeight(e.target.value)} className={inputClass} />
                                  </div>
                              </div>
                          </div>
                          <div className="p-3 bg-green-50/50 rounded-md border border-green-200">
                              <div className="grid grid-cols-2 gap-4">
                                  <div>
                                      <label htmlFor="numberOfUsedBags" className="block text-sm font-medium text-slate-700 mb-1">No. of Once Used Bags</label>
                                      <input type="number" id="numberOfUsedBags" value={numberOfUsedBags} onChange={e => setNumberOfUsedBags(e.target.value)} className={inputClass} placeholder="e.g., 200" />
                                  </div>
                                  <div>
                                      <label htmlFor="usedBagWeight" className="block text-sm font-medium text-slate-700 mb-1">Used Bag Wt. (g)</label>
                                      <input type="number" id="usedBagWeight" value={usedBagWeight} onChange={e => setUsedBagWeight(e.target.value)} className={inputClass} />
                                  </div>
                              </div>
                          </div>
                      </div>

                       {/* Distribution Plan */}
                      {distribution.length > 0 && (
                        <div className="p-4 bg-slate-100 rounded-lg border border-slate-200 space-y-3">
                            <h4 className="font-semibold text-slate-800">Lift Distribution Plan</h4>
                            {distribution.map((item, index) => (
                                <div key={index} className="grid grid-cols-3 gap-4 items-center p-2 rounded-md bg-white">
                                    <div className="col-span-2">
                                        <label className="block text-xs font-medium text-slate-500 mb-1">DO Number</label>
                                        {item.isLocked ? (
                                            <p className="font-semibold text-slate-700 text-sm py-2">{item.doNo}</p>
                                        ) : (
                                            <select 
                                                className={`${inputClass} text-sm`} 
                                                value={item.doNo} 
                                                onChange={(e) => handleDoSelectionChange(index, e.target.value)}
                                                aria-label="Select DO for remaining quantity"
                                            >
                                                <option value="">-- Select a DO --</option>
                                                {item.availableDoOptions.map(ro => (
                                                    <option key={ro.doNo} value={ro.doNo}>
                                                        {ro.doNo} (Pending: {ro.pending.toFixed(3)} Qtls)
                                                    </option>
                                                ))}
                                            </select>
                                        )}
                                    </div>
                                    <div className="text-right">
                                        <label className="block text-xs font-medium text-slate-500 mb-1">Quantity (Qtls)</label>
                                        <p className="font-semibold text-slate-700 text-sm py-2">{item.quantity.toFixed(3)}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                      )}


                  </div>
                  <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end space-x-3">
                      <button onClick={handleCloseModal} className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500">Cancel</button>
                      <button onClick={handleSaveLifting} className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500">Save Record</button>
                  </div>
              </div>
          </div>
      )}

    </div>
  );
};

export default PaddyLiftingPage;
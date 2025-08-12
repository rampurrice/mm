

export type Tab = 'Dashboard' | 'Paddy Lifting' | 'Milling' | 'FRK' | 'Rice Delivery' | 'Register' | 'Reports' | 'Help';

export interface UserProfile {
  username: string;
  password: string; // In a real-world app with a backend, this would be a secure hash.
  recoveryPhraseHash: string; // A hash of the 12-word recovery phrase.
}

export interface ReleaseOrder {
  doNo: string;
  doDate: string;
  lotNo: string;
  issueCenter: string;
  godown: string;
  quantity: string;
  validUpto: string;
  uparjanVarsh: string;
}

export interface CmrDepositOrder {
  id: string;
  doNo: string;
  orderNo: string;
  depositDate: string;
  depositedAt: string;
}

export type DeliveryAgency = 'FCI' | 'MPSCSC';

export interface RiceDeliveryRecord {
  id: string;
  doNo: string;
  cmrOrderNo: string;
  agency: DeliveryAgency;
  date: string;
  vehicleNo: string;
  batchNo: string;
  bagsDelivered: number;
  quantityDeliveredQtls: number;
}


// This type is now deprecated for new records but kept for migrating old data.
export type BagType = 'New Bag' | 'Once Used Bag';

export interface LiftingRecord {
  id: string; 
  rstNo: string;
  doNo: string;
  godown: string;
  grossLiftedQuantity: number; // The 'NET Wt' from Kanta Parchi in Quintals
  totalBagWeight: number; // Calculated total weight of bags in Quintals
  netPaddyQuantity: number; // The final lifted quantity (gross - bag weight)
  truckNo: string;
  numberOfNewBags: number;
  numberOfUsedBags: number;
  liftingDate: string; 
}

export interface DailyStockLog {
  id: string;
  date: string;
  paddyBagsOpenedNew: number;
  paddyBagsOpenedUsed: number;
  paddyConsumedQtls: number;
  riceBagsNew: number;
  riceQuantity: number; // in Qtls
  branSold: number; // in Qtls
  huskSold: number; // in Qtls
  sortexBrokenSold: number; // in Qtls
  nonSortexBrokenSold: number; // in Qtls
  murgidanaSold: number; // in Qtls
  rejectionSold: number; // in Qtls
  workInProgressQtls: number; // Closing WIP for this log entry
}


export interface KantaParchiData {
  rstNo?: string;
  truckNo?: string;
  liftedQuantityInKg?: string;
  numberOfBags?: string;
}

export interface FrkRecord {
  id: string;
  date: string;
  invoiceNo: string;
  supplier: string;
  quantityQtls: number;
}
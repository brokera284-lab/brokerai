export interface Unit {
  id?: string;
  title: string;
  description: string;
  price: number;
  location: string;
  propertyType: string;
  legalPaperStatus: "verified_boost" | "verified" | "none";
  ownerName: string;
  ownerPhone: string;
  ownerPercentage: number;
  imageUrl?: string;
  uploaderId?: string;
  uploaderEmail?: string;
  tenantId?: string;
  ownerId?: string;
  visibility?: "public" | "private"; // "public" = AI Marketplace visible; "private" = isolated to owner CRM
  createdAt?: any;
  
  // Custom multi-step fields
  uploadType?: "primary" | "resale";
  purpose?: "Sale" | "Rent";
  negotiable?: "Yes" | "No";
  images?: string[];
  developerTrackRecord?: string;
  priceRange?: { minPrice: number; maxPrice: number };
  areaRange?: { minArea: number; maxArea: number };
  availableUnitTypes?: string[];
  legalDocuments?: {
    fileUrl?: string;
    fileName?: string;
    scanStatus?: "verified" | "pending" | "rejected";
    verificationNotes?: string;
  };
  locationDetails?: {
    governorate: string;
    city: string;
    area: string;
    compound?: string;
    address: string;
    mapPin?: { lat: number; lng: number };
  };
  details?: {
    areaSq: number;
    landArea?: number;
    builtUpArea?: number;
    bedrooms: number;
    bathrooms: number;
    receptionRooms?: number;
    floorNumber?: number;
    totalFloors?: number;
    yearBuilt?: number;
    finishingLevel: string;
    furnished: "Yes" | "No";
    orientation?: string;
    balconies?: number;
  };
  amenities?: string[];
  paymentDetails?: {
    paymentMethod: "Cash" | "Installments";
    downPayment?: number;
    installmentYears?: number;
    monthlyInstallment?: number;
    interestFree?: "Yes" | "No";
    deliveryStatus: string;
  };
  projectInfo?: {
    projectName?: string;
    developerName?: string;
    projectPhase?: string;
    constructionProgress?: string;
    deliveryDate?: string;
    developerOwners?: string[];
    developerOverview?: string;
    developerPastProjects?: Array<{ id?: string; title: string; description?: string }>;
    projectLandArea?: string;
    masterplanImage?: string;
    customAmenities?: string[];
    pricePerSqm?: number;
    unitInventoryList?: Array<{ id?: string; unitType: string; areaSq: number; bedrooms: number; startingPrice: number }>;
    paymentPlansList?: Array<{ id?: string; downPaymentPercent: number; installmentYears: number; deliveryYears: number; notes?: string }>;
    taxCardImage?: string;
    isDataTruthCertified?: boolean;
  };
  contactInfo?: {
    advertiserName: string;
    phone: string;
    whatsapp: string;
    email: string;
    advertiserType: "Owner" | "Agent" | "Developer";
    isOwner?: boolean;
    allowMarketing?: boolean;
  };
  aiAnalysis?: {
    keywords: string[];
    category: string;
    buyerPersona: string;
    luxuryLevel: string;
    bestUseCase: string;
    estimatedRoi: string;
    strengths: string[];
    weaknesses: string[];
    similarListings: string[];
    qualityScore: number;
    completenessPercentage: number;
    autoDetectedAmenities: string[];
  };
}

export interface CRMProject {
  id?: string;
  uploaderId: string;
  projectName: string;
  developerName: string;
  location: string;
  description: string;
  startingPrice: number;
  deliveryDate?: string;
  advantages: string[];
  nearbyServices: string[];
  googleMapsUrl?: string;
  mapPin?: { lat: number; lng: number };
  paymentPlans?: Array<{ downPaymentPercent: number; installmentYears: number; monthlyInstallment?: number }>;
  masterplanImage?: string;
  createdAt?: any;
}

export interface CRMTask {
  id?: string;
  uploaderId: string;
  title: string;
  dueDate: string;
  priority: "low" | "medium" | "high";
  status: "pending" | "completed";
  relatedLeadId?: string;
  createdAt?: any;
}

export interface CRMNote {
  id?: string;
  uploaderId: string;
  title: string;
  content: string;
  createdAt?: any;
}

export interface Lead {
  id?: string;
  name: string;
  email: string;
  phone?: string;
  chatId: string;
  budget: string;
  propertyType: string;
  location: string;
  legalPapersRequired: boolean;
  qualification: "cold" | "warm" | "hot";
  value: number; // 100, 500, or 1000 EGP
  status: "available" | "claimed";
  claimedBy?: string; // Broker user id
  claimedByEmail?: string;
  interestedUnitTitle?: string;
  interestedUnitId?: string;
  propertyId?: string;
  tenantId?: string;
  propertyUploaderId?: string;
  createdAt?: any;
}

export interface Message {
  id?: string;
  role: "user" | "assistant";
  content: string;
  timestamp?: any;
}

export interface ChatThread {
  id: string;
  title: string;
  messages: Message[];
  extracted: {
    budget: string;
    propertyType: string;
    location: string;
    legalPapersRequired: boolean | null;
  };
  qualification: "cold" | "warm" | "hot" | null;
  qualificationValue: number;
  leadSubmitted: boolean;
}

export interface ChatSession {
  id?: string;
  userId: string;
  messages: Message[];
  qualification: "cold" | "warm" | "hot" | null;
  budget?: string;
  propertyType?: string;
  location?: string;
  legalPapersRequired?: boolean | null;
  createdAt?: any;
}

export interface Transaction {
  id?: string;
  userId: string;
  userEmail: string;
  amount: number;
  type: "credit" | "charge" | "refund";
  description: string;
  method: "visa" | "vodafone" | "etisalat" | "orange" | "wepay" | "instapay";
  createdAt?: any;
}

export interface RefundRequest {
  id?: string;
  leadId: string;
  leadName: string;
  brokerId: string;
  brokerEmail: string;
  reason: string;
  status: "reporting" | "reviewing" | "refunded";
  amount: number;
  createdAt?: any;
}

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
  createdAt?: any;
}

export interface Lead {
  id?: string;
  name: string;
  email: string;
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
  createdAt?: any;
}

export interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp?: any;
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

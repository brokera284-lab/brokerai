export interface AdminUser {
  id: string;
  name: string;
  displayName?: string;
  email: string;
  photoUrl?: string;
  phoneNumber?: string;
  role: "broker" | "buyer" | "developer_admin" | "company_admin" | "admin";
  walletBalance: number;
  isPremium: boolean;
  status?: "active" | "suspended";
  isVerified?: boolean;
  createdAt?: any;
  updatedAt?: any;
  subscription?: AdminSubscription;
  subscriptionHistory?: SubscriptionHistoryEntry[];
}

export interface AdminSubscription {
  status: "active" | "paused" | "cancelled" | "none";
  startsAt?: string;
  expiresAt?: string;
  type?: string;
  activatedWithoutPayment?: boolean;
}

export interface SubscriptionHistoryEntry {
  action: "create" | "activate" | "extend" | "cancel" | "pause" | "resume" | "change_expiry";
  date: string;
  details: string;
  operator: string;
}

export interface AdminCompany {
  id: string;
  name: string;
  logoUrl?: string;
  commercialRegistration: string;
  website?: string;
  address?: string;
  isVerified: boolean;
  status: "pending" | "approved" | "rejected" | "suspended";
  ownerUid: string;
  ownerEmail?: string;
  createdAt?: any;
  stats?: {
    totalUnits: number;
    totalLeads: number;
  };
}

export interface AdminActivityLog {
  id: string;
  userUid: string;
  userEmail: string;
  action: string;
  details: string;
  target?: string;
  ipAddress?: string;
  userAgent?: string;
  timestamp: any;
  status: "success" | "failed";
}

export interface AdminAppSetting {
  id: string;
  leadPriceEgp: number;
  premiumSubscriptionPriceEgp: number;
  maintenanceMode: boolean;
  registrationEnabled: boolean;
  aiFeaturesEnabled: boolean;
  platformFee: number;
  featureLimits: {
    maxUnitsPerUser: number;
    maxLeadsClaimedPerDay: number;
  };
  trialDuration: number; // in days
  discountValues: {
    premiumDiscountPercentage: number;
    couponCode?: string;
  };
  contactInformation: {
    email: string;
    phone: string;
    address: string;
  };
  termsAndPolicies: string;
  announcementBanner: string;
  defaultPlatformConfig: string;
  updatedAt?: any;
}

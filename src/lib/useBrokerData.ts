import { useState, useEffect } from "react";
import { 
  db, 
  auth, 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  doc, 
  updateDoc, 
  onSnapshot, 
  setDoc,
  serverTimestamp,
  googleProvider,
  signInWithPopup,
  signOut,
  User,
  onAuthStateChanged
} from "./firebase";
import { Unit, Lead, ChatSession, Transaction, RefundRequest } from "../types";
import { COUNTRIES, autoDetectCountry } from "./countries";

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error Details: ', JSON.stringify(errInfo));
  return errInfo;
}

export function useBrokerData() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);
  
  // Real-time states
  const [units, setUnits] = useState<Unit[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [refunds, setRefunds] = useState<RefundRequest[]>([]);
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [isPremium, setIsPremium] = useState<boolean>(false);
  const [selectedCountry, setSelectedCountry] = useState<string>("EG");
  const [loadingData, setLoadingData] = useState(true);
  const [loadingAuth, setLoadingAuth] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // local in-memory fallback state flag
  const [usingLocalFallback, setUsingLocalFallback] = useState(false);

  // Handle Authentication State
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setLoadingUser(false);
    });
    return unsubscribe;
  }, []);

  // Sync data from Firestore once user is authenticated or available
  useEffect(() => {
    if (loadingUser) return;

    // Use a fixed fallback ID if user is not authenticated to ensure offline-first/demo works perfectly
    const uid = currentUser?.uid || "guest_broker_user";

    // 1. Sync Wallet Balance and Premium Status from user Profile
    const profileRef = doc(db, "users", uid);
    const unsubProfile = onSnapshot(profileRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setWalletBalance(data.walletBalance ?? 1500);
        setIsPremium(data.isPremium || false);
        if (data.country) {
          setSelectedCountry(data.country);
        } else {
          const detected = autoDetectCountry();
          setSelectedCountry(detected);
          updateDoc(profileRef, { country: detected }).catch(() => {});
        }
      } else {
        const detected = autoDetectCountry();
        setSelectedCountry(detected);
        // Initialize profile
        setDoc(profileRef, {
          walletBalance: 1500, // Pre-load with 1,500 EGP as starting allowance
          isPremium: false,
          email: currentUser?.email || "broker@example.com",
          name: currentUser?.displayName || "Elite Broker",
          country: detected
        }).catch((err) => {
          handleFirestoreError(err, OperationType.WRITE, `users/${uid}`);
        });
        setWalletBalance(1500);
        setIsPremium(false);
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, `users/${uid}`);
      setUsingLocalFallback(true);
      // Initialize starter balance in fallback
      setWalletBalance((prev) => prev || 1500);
      setSelectedCountry((prev) => prev || autoDetectCountry());
    });

    // 2. Sync Units
    const qUnits = query(collection(db, "units"), orderBy("createdAt", "desc"));
    const unsubUnits = onSnapshot(qUnits, (snapshot) => {
      const list: Unit[] = [];
      snapshot.forEach((d) => {
        list.push({ id: d.id, ...d.data() } as Unit);
      });
      setUnits(list);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, "units");
      setUsingLocalFallback(true);
    });

    // 3. Sync Leads
    const qLeads = query(collection(db, "leads"), orderBy("createdAt", "desc"));
    const unsubLeads = onSnapshot(qLeads, (snapshot) => {
      const list: Lead[] = [];
      snapshot.forEach((d) => {
        list.push({ id: d.id, ...d.data() } as Lead);
      });
      setLeads(list);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, "leads");
      setUsingLocalFallback(true);
    });

    // 4. Sync Transactions
    const qTx = query(collection(db, "transactions"), orderBy("createdAt", "desc"));
    const unsubTx = onSnapshot(qTx, (snapshot) => {
      const list: Transaction[] = [];
      snapshot.forEach((d) => {
        list.push({ id: d.id, ...d.data() } as Transaction);
      });
      setTransactions(list);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, "transactions");
      setUsingLocalFallback(true);
    });

    // 5. Sync Refunds
    const qRefunds = query(collection(db, "refunds"), orderBy("createdAt", "desc"));
    const unsubRefunds = onSnapshot(qRefunds, (snapshot) => {
      const list: RefundRequest[] = [];
      snapshot.forEach((d) => {
        list.push({ id: d.id, ...d.data() } as RefundRequest);
      });
      setRefunds(list);
      setLoadingData(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, "refunds");
      setUsingLocalFallback(true);
      setLoadingData(false);
    });

    return () => {
      unsubProfile();
      unsubUnits();
      unsubLeads();
      unsubTx();
      unsubRefunds();
    };
  }, [currentUser, loadingUser]);

  // Auth actions
  const loginWithGoogle = async () => {
    if (loadingAuth) return;
    setLoadingAuth(true);
    setAuthError(null);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err: any) {
      console.warn("Google Sign-In notice:", err);
      let userFriendlyMsg = "Google login popup was blocked or closed.";
      if (err?.code === "auth/popup-blocked") {
        userFriendlyMsg = "The Google login popup was blocked by your browser. Please allow popups or try opening the app in a new tab.";
      } else if (err?.code === "auth/cancelled-popup-request") {
        userFriendlyMsg = "The sign-in popup was cancelled because another action was triggered. Please try again or use Guest mode.";
      } else if (err?.code === "auth/popup-closed-by-user") {
        userFriendlyMsg = "The sign-in window was closed before completion. You are logged in as a Guest.";
      }
      setAuthError(userFriendlyMsg);
      
      // Create guest fallback if popup fails
      const guestUser = {
        uid: "guest_broker_user",
        email: "guest_broker@brokerai.com",
        displayName: "Guest Broker",
      } as any;
      setCurrentUser(guestUser);
    } finally {
      setLoadingAuth(false);
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (err) {
      console.error("Sign Out Error:", err);
    }
    setCurrentUser(null);
  };

  // Profile actions (Wallet & Subscription)
  const adjustWallet = async (amount: number, type: "credit" | "charge", desc: string, method: Transaction["method"]) => {
    const uid = currentUser?.uid || "guest_broker_user";
    const newBalance = type === "credit" ? walletBalance + amount : walletBalance - amount;

    // 1. Try Firestore update
    let success = false;
    if (!usingLocalFallback) {
      try {
        const userRef = doc(db, "users", uid);
        await updateDoc(userRef, { walletBalance: newBalance });
        
        await addDoc(collection(db, "transactions"), {
          userId: uid,
          userEmail: currentUser?.email || "guest_broker@brokerai.com",
          amount,
          type,
          description: desc,
          method,
          createdAt: serverTimestamp()
        });
        success = true;
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `users/${uid}`);
        setUsingLocalFallback(true);
      }
    }

    // 2. If using local fallback or Firestore failed
    if (!success || usingLocalFallback) {
      setWalletBalance(newBalance);
      
      const newTx: Transaction = {
        id: `tx_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        userId: uid,
        userEmail: currentUser?.email || "guest_broker@brokerai.com",
        amount,
        type,
        description: desc,
        method,
        createdAt: new Date().toISOString() as any
      };
      setTransactions((prev) => [newTx, ...prev]);
    }
  };

  const subscribePremium = async (method: Transaction["method"]) => {
    const uid = currentUser?.uid || "guest_broker_user";

    let success = false;
    if (!usingLocalFallback) {
      try {
        const userRef = doc(db, "users", uid);
        await updateDoc(userRef, { 
          isPremium: true
        });

        await addDoc(collection(db, "transactions"), {
          userId: uid,
          userEmail: currentUser?.email || "guest_broker@brokerai.com",
          amount: 0,
          type: "charge",
          description: "Premium CRM License Activated",
          method,
          createdAt: serverTimestamp()
        });
        success = true;
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `users/${uid}`);
        setUsingLocalFallback(true);
      }
    }

    if (!success || usingLocalFallback) {
      setIsPremium(true);

      const newTx: Transaction = {
        id: `tx_${Date.now()}_premium`,
        userId: uid,
        userEmail: currentUser?.email || "guest_broker@brokerai.com",
        amount: 0,
        type: "charge",
        description: "Premium CRM License Activated",
        method,
        createdAt: new Date().toISOString() as any
      };
      setTransactions((prev) => [newTx, ...prev]);
    }
  };

  // Units actions
  const addUnit = async (unit: Omit<Unit, "id" | "createdAt">) => {
    let success = false;
    if (!usingLocalFallback) {
      try {
        await addDoc(collection(db, "units"), {
          ...unit,
          createdAt: serverTimestamp()
        });
        success = true;
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, "units");
        setUsingLocalFallback(true);
      }
    }

    if (!success || usingLocalFallback) {
      const fallbackUnit: Unit = {
        id: `unit_${Date.now()}`,
        ...unit,
        createdAt: new Date().toISOString() as any
      };
      setUnits((prev) => [fallbackUnit, ...prev]);
    }
  };

  // Leads actions
  const addLead = async (lead: Omit<Lead, "id" | "createdAt">) => {
    let success = false;
    if (!usingLocalFallback) {
      try {
        await addDoc(collection(db, "leads"), {
          ...lead,
          createdAt: serverTimestamp()
        });
        success = true;
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, "leads");
        setUsingLocalFallback(true);
      }
    }

    if (!success || usingLocalFallback) {
      const fallbackLead: Lead = {
        id: `lead_${Date.now()}`,
        ...lead,
        createdAt: new Date().toISOString() as any
      };
      setLeads((prev) => [fallbackLead, ...prev]);
    }
  };

  const claimLead = async (leadId: string, value: number) => {
    const uid = currentUser?.uid || "guest_broker_user";
    const email = currentUser?.email || "guest_broker@brokerai.com";

    let success = false;
    if (!usingLocalFallback) {
      try {
        const leadRef = doc(db, "leads", leadId);
        await updateDoc(leadRef, {
          status: "claimed",
          claimedBy: uid,
          claimedByEmail: email
        });
        success = true;
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `leads/${leadId}`);
        setUsingLocalFallback(true);
      }
    }

    if (!success || usingLocalFallback) {
      setLeads((prev) => 
        prev.map((l) => l.id === leadId ? { ...l, status: "claimed", claimedBy: uid, claimedByEmail: email } : l)
      );
    }
  };

  // Refund actions
  const requestRefund = async (leadId: string, leadName: string, reason: string, amount: number) => {
    const uid = currentUser?.uid || "guest_broker_user";
    const email = currentUser?.email || "guest_broker@brokerai.com";

    let success = false;
    let refundId = `refund_${Date.now()}`;

    if (!usingLocalFallback) {
      try {
        const refundRef = await addDoc(collection(db, "refunds"), {
          leadId,
          leadName,
          brokerId: uid,
          brokerEmail: email,
          reason,
          status: "reporting",
          amount,
          createdAt: serverTimestamp()
        });
        refundId = refundRef.id;
        success = true;
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, "refunds");
        setUsingLocalFallback(true);
      }
    }

    if (!success || usingLocalFallback) {
      const fallbackRefund: RefundRequest = {
        id: refundId,
        leadId,
        leadName,
        brokerId: uid,
        brokerEmail: email,
        reason,
        status: "reporting",
        amount,
        createdAt: new Date().toISOString() as any
      };
      setRefunds((prev) => [fallbackRefund, ...prev]);
    }

    // Auto-advance statuses after simulated intervals for an amazing interactive demo flow!
    setTimeout(async () => {
      let step1Success = false;
      if (!usingLocalFallback) {
        try {
          const docRef = doc(db, "refunds", refundId);
          await updateDoc(docRef, { status: "reviewing" });
          step1Success = true;
        } catch (err) {
          setUsingLocalFallback(true);
        }
      }
      if (!step1Success || usingLocalFallback) {
        setRefunds((prev) => 
          prev.map((r) => r.id === refundId ? { ...r, status: "reviewing" } : r)
        );
      }
      
      setTimeout(async () => {
        let step2Success = false;
        if (!usingLocalFallback) {
          try {
            const docRef = doc(db, "refunds", refundId);
            await updateDoc(docRef, { status: "refunded" });
            step2Success = true;
          } catch (err) {
            setUsingLocalFallback(true);
          }
        }
        if (!step2Success || usingLocalFallback) {
          setRefunds((prev) => 
            prev.map((r) => r.id === refundId ? { ...r, status: "refunded" } : r)
          );
        }
        // Add credit to wallet upon successful refund
        await adjustWallet(amount, "credit", `Refund Approved for Lead: ${leadName}`, "visa");
      }, 10000); // 10 seconds to approve
    }, 5000); // 5 seconds to review
  };

  const updateCountry = async (countryCode: string) => {
    setSelectedCountry(countryCode);
    const uid = currentUser?.uid || "guest_broker_user";
    if (!usingLocalFallback) {
      try {
        const profileRef = doc(db, "users", uid);
        await updateDoc(profileRef, { country: countryCode });
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `users/${uid}`);
      }
    }
  };

  const getActiveCountryConfig = () => {
    return COUNTRIES.find(c => c.code === selectedCountry) || COUNTRIES[0];
  };

  const formatCurrency = (amountInEGP: number) => {
    const config = COUNTRIES.find(c => c.code === selectedCountry) || COUNTRIES[0];
    const converted = amountInEGP * config.rate;
    const formattedVal = converted % 1 === 0 
      ? converted.toLocaleString() 
      : converted.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 });
    return `${formattedVal} ${config.symbol}`;
  };

  return {
    currentUser,
    loadingUser,
    loadingData,
    units,
    leads,
    transactions,
    refunds,
    walletBalance,
    isPremium,
    selectedCountry,
    updateCountry,
    getActiveCountryConfig,
    formatCurrency,
    loginWithGoogle,
    logout,
    adjustWallet,
    subscribePremium,
    addUnit,
    addLead,
    claimLead,
    requestRefund,
    loadingAuth,
    authError,
    clearAuthError: () => setAuthError(null)
  };
}

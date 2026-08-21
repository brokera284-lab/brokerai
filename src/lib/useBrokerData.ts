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
  deleteDoc,
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

export function getTimestampMs(val: any): number {
  if (!val) return 0;
  if (typeof val === "string") return new Date(val).getTime();
  if (typeof val.toMillis === "function") return val.toMillis();
  if (val.seconds !== undefined) return val.seconds * 1000 + (val.nanoseconds || 0) / 1000000;
  if (val instanceof Date) return val.getTime();
  return 0;
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

export const DEFAULT_UNITS: Unit[] = [];

export function useBrokerData() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
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

  // Sync data from Firestore
  useEffect(() => {
    if (loadingUser) return;

    const uid = currentUser?.uid || null;
    const isSuper = currentUser?.email === "brokera284@gmail.com";
    const isAuthUser = auth.currentUser !== null && !!uid && uid !== "guest_broker_user";

    // 1. GLOBAL PROPERTY INVENTORY SYNC (AI Discovery & Marketplace)
    // Always sync units across all tenants so Guests, Buyers, Brokers & Admins can search global inventory
    const unsubUnits = onSnapshot(collection(db, "units"), (snapshot) => {
      const list: Unit[] = [];
      snapshot.forEach((d) => {
        const u = { id: d.id, ...d.data() } as Unit;
        // Tenant Isolation Filter for properties:
        // Private units are visible ONLY to owner or super_admin.
        // Public and AI_Searchable units are globally discoverable across ALL tenants.
        if (isSuper || (uid && u.uploaderId === uid) || u.visibility !== "private") {
          list.push(u);
        }
      });
      list.sort((a, b) => getTimestampMs(b.createdAt) - getTimestampMs(a.createdAt));
      setUnits(list);
      setLoadingData(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, "units");
      setLoadingData(false);
    });

    // If user is unauthenticated or guest, use local state only and do not attach protected Firestore listeners
    if (!isAuthUser) {
      if (currentUser?.uid === "guest_broker_user") {
        setUserProfile({
          isPremium: false,
          email: "guest_broker@brokerai.com",
          name: "Guest Broker",
          country: "EG",
          tenantId: "guest_broker_user"
        });
      }
      setLoadingData(false);
      return () => {
        unsubUnits();
      };
    }

    // 2. Sync Premium Status & Profile Data from user Profile
    const profileRef = doc(db, "users", uid!);
    const unsubProfile = onSnapshot(profileRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setUserProfile(data);
        setWalletBalance(0);
        setIsPremium(data.isPremium || isSuper);
        setSelectedCountry("EG");
        if (data.country !== "EG") {
          updateDoc(profileRef, { country: "EG" }).catch(() => {});
        }
      } else {
        const detected = "EG";
        const initialProf = {
          isPremium: isSuper || false,
          email: currentUser?.email || "",
          name: currentUser?.displayName || "Broker Account",
          country: detected,
          tenantId: currentUser?.tenantId || uid
        };
        setUserProfile(initialProf);
        setSelectedCountry(detected);
        // Initialize profile
        setDoc(profileRef, initialProf).catch((err) => {
          handleFirestoreError(err, OperationType.WRITE, `users/${uid}`);
        });
        setWalletBalance(0);
        setIsPremium(isSuper || false);
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, `users/${uid}`);
      setUsingLocalFallback(true);
      setWalletBalance(0);
      setSelectedCountry("EG");
    });

    // 3. Sync Leads (Scoped queries)
    let unsubLeads1 = () => {};
    let unsubLeadsTenant = () => {};
    let unsubLeads2 = () => {};
    let unsubLeads3 = () => {};

    if (isSuper) {
      unsubLeads1 = onSnapshot(collection(db, "leads"), (snapshot) => {
        const list: Lead[] = [];
        snapshot.forEach((d) => list.push({ id: d.id, ...d.data() } as Lead));
        list.sort((a, b) => getTimestampMs(b.createdAt) - getTimestampMs(a.createdAt));
        setLeads(list);
      }, (error) => {
        handleFirestoreError(error, OperationType.GET, "leads");
      });
    } else {
      let uploaderLeads: Lead[] = [];
      let tenantLeads: Lead[] = [];
      let claimedLeads: Lead[] = [];
      let availableLeads: Lead[] = [];

      const updateMergedLeads = () => {
        const map = new Map<string, Lead>();
        uploaderLeads.forEach(l => map.set(l.id, l));
        tenantLeads.forEach(l => map.set(l.id, l));
        claimedLeads.forEach(l => map.set(l.id, l));
        availableLeads.forEach(l => map.set(l.id, l));
        const merged = Array.from(map.values());
        merged.sort((a, b) => getTimestampMs(b.createdAt) - getTimestampMs(a.createdAt));
        setLeads(merged);
      };

      unsubLeads1 = onSnapshot(query(collection(db, "leads"), where("propertyUploaderId", "==", uid)), (snapshot) => {
        uploaderLeads = [];
        snapshot.forEach((d) => uploaderLeads.push({ id: d.id, ...d.data() } as Lead));
        updateMergedLeads();
      }, (error) => {
        handleFirestoreError(error, OperationType.GET, "leads(propertyUploaderId)");
      });

      const userTenantId = userProfile?.tenantId || uid;
      if (userTenantId && userTenantId !== uid) {
        unsubLeadsTenant = onSnapshot(query(collection(db, "leads"), where("tenantId", "==", userTenantId)), (snapshot) => {
          tenantLeads = [];
          snapshot.forEach((d) => tenantLeads.push({ id: d.id, ...d.data() } as Lead));
          updateMergedLeads();
        }, (error) => {
          handleFirestoreError(error, OperationType.GET, "leads(tenantId)");
        });
      }

      unsubLeads2 = onSnapshot(query(collection(db, "leads"), where("claimedBy", "==", uid)), (snapshot) => {
        claimedLeads = [];
        snapshot.forEach((d) => claimedLeads.push({ id: d.id, ...d.data() } as Lead));
        updateMergedLeads();
      }, (error) => {
        handleFirestoreError(error, OperationType.GET, "leads(claimedBy)");
      });

      unsubLeads3 = onSnapshot(query(collection(db, "leads"), where("status", "==", "available")), (snapshot) => {
        availableLeads = [];
        snapshot.forEach((d) => availableLeads.push({ id: d.id, ...d.data() } as Lead));
        updateMergedLeads();
      }, (error) => {
        handleFirestoreError(error, OperationType.GET, "leads(available)");
      });
    }

    // 4. Sync Transactions (Scoped query)
    const txQuery = isSuper 
      ? collection(db, "transactions")
      : query(collection(db, "transactions"), where("userId", "==", uid));

    const unsubTx = onSnapshot(txQuery, (snapshot) => {
      const list: Transaction[] = [];
      snapshot.forEach((d) => list.push({ id: d.id, ...d.data() } as Transaction));
      list.sort((a, b) => getTimestampMs(b.createdAt) - getTimestampMs(a.createdAt));
      setTransactions(list);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, "transactions");
    });

    // 5. Sync Refunds (Scoped query)
    const refundsQuery = isSuper
      ? collection(db, "refunds")
      : query(collection(db, "refunds"), where("brokerId", "==", uid));

    const unsubRefunds = onSnapshot(refundsQuery, (snapshot) => {
      const list: RefundRequest[] = [];
      snapshot.forEach((d) => list.push({ id: d.id, ...d.data() } as RefundRequest));
      list.sort((a, b) => getTimestampMs(b.createdAt) - getTimestampMs(a.createdAt));
      setRefunds(list);
      setLoadingData(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, "refunds");
      setLoadingData(false);
    });

    return () => {
      unsubUnits();
      unsubProfile();
      unsubLeads1();
      unsubLeadsTenant();
      unsubLeads2();
      unsubLeads3();
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

  // Profile actions (Immediate Direct Payments & Subscription)
  const processDirectPayment = async (amount: number, type: "credit" | "charge", desc: string, method: Transaction["method"]) => {
    const uid = currentUser?.uid || "guest_broker_user";
    const isAuthUser = auth.currentUser !== null && !!currentUser && currentUser.uid !== "guest_broker_user";

    // 1. Try Firestore update only if authenticated
    let success = false;
    if (isAuthUser && !usingLocalFallback) {
      try {
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
        handleFirestoreError(err, OperationType.WRITE, `transactions`);
        setUsingLocalFallback(true);
      }
    }

    // 2. If using local fallback, unauthenticated, or Firestore failed
    if (!success || usingLocalFallback || !isAuthUser) {
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
    const isAuthUser = auth.currentUser !== null && !!currentUser && currentUser.uid !== "guest_broker_user";

    let success = false;
    if (isAuthUser && !usingLocalFallback) {
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

    if (!success || usingLocalFallback || !isAuthUser) {
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
    const uid = currentUser?.uid || "guest_broker_user";
    const email = currentUser?.email || "guest_broker@brokerai.com";
    const tenantId = userProfile?.tenantId || uid;
    const isAuthUser = auth.currentUser !== null && !!currentUser && currentUser.uid !== "guest_broker_user";
    
    const enrichedUnit = {
      ...unit,
      uploaderId: uid,
      uploaderEmail: email,
      tenantId: tenantId
    };

    if (isAuthUser && !usingLocalFallback) {
      try {
        await addDoc(collection(db, "units"), {
          ...enrichedUnit,
          createdAt: serverTimestamp()
        });
        success = true;
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, "units");
        setUsingLocalFallback(true);
      }
    }

    if (!success || usingLocalFallback || !isAuthUser) {
      const fallbackUnit: Unit = {
        id: `unit_${Date.now()}`,
        ...enrichedUnit,
        createdAt: new Date().toISOString() as any
      };
      setUnits((prev) => [fallbackUnit, ...prev]);
    }
  };

  const updateUnit = async (unitId: string, updatedFields: Partial<Omit<Unit, "id" | "createdAt">>) => {
    let success = false;
    const isAuthUser = auth.currentUser !== null && !!currentUser && currentUser.uid !== "guest_broker_user";
    if (isAuthUser && !usingLocalFallback) {
      try {
        const unitRef = doc(db, "units", unitId);
        await updateDoc(unitRef, updatedFields);
        success = true;
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `units/${unitId}`);
        setUsingLocalFallback(true);
      }
    }

    if (!success || usingLocalFallback || !isAuthUser) {
      setUnits((prev) =>
        prev.map((u) => (u.id === unitId ? { ...u, ...updatedFields } : u))
      );
    }
  };

  const deleteUnit = async (unitId: string) => {
    let success = false;
    const isAuthUser = auth.currentUser !== null && !!currentUser && currentUser.uid !== "guest_broker_user";
    if (isAuthUser && !usingLocalFallback) {
      try {
        const unitRef = doc(db, "units", unitId);
        await deleteDoc(unitRef);
        success = true;
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, `units/${unitId}`);
        setUsingLocalFallback(true);
      }
    }

    if (!success || usingLocalFallback || !isAuthUser) {
      setUnits((prev) => prev.filter((u) => u.id !== unitId));
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
    const isAuthUser = auth.currentUser !== null && !!currentUser && currentUser.uid !== "guest_broker_user";

    // Register a direct checkout transaction
    await processDirectPayment(value, "charge", `Direct Payment: Unlocked Lead Contact Details (Lead ID: ${leadId.slice(-4)})`, "visa");

    let success = false;
    if (isAuthUser && !usingLocalFallback) {
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

    if (!success || usingLocalFallback || !isAuthUser) {
      setLeads((prev) => 
        prev.map((l) => l.id === leadId ? { ...l, status: "claimed", claimedBy: uid, claimedByEmail: email } : l)
      );
    }
  };

  const clearAllLeads = async () => {
    let success = false;
    const uid = currentUser?.uid || "guest_broker_user";
    const isSuper = currentUser?.email === "brokera284@gmail.com";
    const isAuthUser = auth.currentUser !== null && !!currentUser && currentUser.uid !== "guest_broker_user";

    // Standard users only clear their own leads. Superusers clear all.
    const leadsToClear = leads.filter((lead) => {
      if (isSuper) return true;
      return lead.propertyUploaderId === uid;
    });

    if (isAuthUser && !usingLocalFallback) {
      try {
        const promises = leadsToClear.map((lead) => {
          if (!lead.id) {
            console.warn("Skipping lead deletion due to missing document ID:", lead);
            return Promise.resolve();
          }
          const leadRef = doc(db, "leads", lead.id);
          return deleteDoc(leadRef);
        });
        await Promise.all(promises);
        success = true;
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, "leads");
        setUsingLocalFallback(true);
      }
    }

    if (!success || usingLocalFallback || !isAuthUser) {
      const idsToClear = leadsToClear.map(l => l.id);
      setLeads((prev) => prev.filter((l) => !idsToClear.includes(l.id)));
    }
  };

  const clearAllData = async () => {
    let success = false;
    const isAuthUser = auth.currentUser !== null && !!currentUser && currentUser.uid !== "guest_broker_user";
    if (isAuthUser && !usingLocalFallback) {
      try {
        // 1. Clear all units
        const unitPromises = units.map((u) => {
          if (!u.id) return Promise.resolve();
          return deleteDoc(doc(db, "units", u.id));
        });
        
        // 2. Clear all leads
        const leadPromises = leads.map((l) => {
          if (!l.id) return Promise.resolve();
          return deleteDoc(doc(db, "leads", l.id));
        });

        // 3. Clear all transactions
        const txPromises = transactions.map((t) => {
          if (!t.id) return Promise.resolve();
          return deleteDoc(doc(db, "transactions", t.id));
        });

        // 4. Clear all refunds
        const refundPromises = refunds.map((r) => {
          if (!r.id) return Promise.resolve();
          return deleteDoc(doc(db, "refunds", r.id));
        });

        await Promise.all([
          ...unitPromises,
          ...leadPromises,
          ...txPromises,
          ...refundPromises
        ]);
        success = true;
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, "all_collections");
        setUsingLocalFallback(true);
      }
    }

    setUnits([]);
    setLeads([]);
    setTransactions([]);
    setRefunds([]);
  };

  // Refund actions
  const requestRefund = async (leadId: string, leadName: string, reason: string, amount: number) => {
    const uid = currentUser?.uid || "guest_broker_user";
    const email = currentUser?.email || "guest_broker@brokerai.com";
    const isAuthUser = auth.currentUser !== null && !!currentUser && currentUser.uid !== "guest_broker_user";

    let success = false;
    let refundId = `refund_${Date.now()}`;

    if (isAuthUser && !usingLocalFallback) {
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

    if (!success || usingLocalFallback || !isAuthUser) {
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
      if (isAuthUser && !usingLocalFallback) {
        try {
          const docRef = doc(db, "refunds", refundId);
          await updateDoc(docRef, { status: "reviewing" });
          step1Success = true;
        } catch (err) {
          setUsingLocalFallback(true);
        }
      }
      if (!step1Success || usingLocalFallback || !isAuthUser) {
        setRefunds((prev) => 
          prev.map((r) => r.id === refundId ? { ...r, status: "reviewing" } : r)
        );
      }
      
      setTimeout(async () => {
        let step2Success = false;
        if (isAuthUser && !usingLocalFallback) {
          try {
            const docRef = doc(db, "refunds", refundId);
            await updateDoc(docRef, { status: "refunded" });
            step2Success = true;
          } catch (err) {
            setUsingLocalFallback(true);
          }
        }
        if (!step2Success || usingLocalFallback || !isAuthUser) {
          setRefunds((prev) => 
            prev.map((r) => r.id === refundId ? { ...r, status: "refunded" } : r)
          );
        }
        // Process direct refund payment upon successful claim approval
        await processDirectPayment(amount, "credit", `Direct Payment Refund for Lead: ${leadName}`, "visa");
      }, 10000); // 10 seconds to approve
    }, 5000); // 5 seconds to review
  };

  const updateCountry = async (countryCode: string) => {
    setSelectedCountry(countryCode);
    const uid = currentUser?.uid || "guest_broker_user";
    const isAuthUser = auth.currentUser !== null && !!currentUser && currentUser.uid !== "guest_broker_user";
    if (isAuthUser && !usingLocalFallback) {
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

  const isSuperUser = currentUser?.email === "brokera284@gmail.com";

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
    isSuperUser,
    selectedCountry,
    updateCountry,
    getActiveCountryConfig,
    formatCurrency,
    loginWithGoogle,
    logout,
    processDirectPayment,
    adjustWallet: processDirectPayment,
    subscribePremium,
    addUnit,
    updateUnit,
    deleteUnit,
    addLead,
    claimLead,
    clearAllLeads,
    clearAllData,
    requestRefund,
    loadingAuth,
    authError,
    clearAuthError: () => setAuthError(null)
  };
}

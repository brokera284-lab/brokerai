import React, { useState, useEffect } from "react";
import { Unit } from "../types";
import InteractiveMap from "./InteractiveMap";
import { 
  Building, MapPin, X, Bed, Bath, Maximize, Check, Upload, Trash2, 
  ChevronLeft, ChevronRight, Image as ImageIcon, CheckCircle2, 
  Loader2, Info, Layers, Zap, FileText, ShieldCheck, Plus, Calendar, User, Percent,
  Briefcase, Home, Dumbbell, CreditCard, Receipt, Send, Save, ArrowLeft, ArrowRight,
  HelpCircle, Eye, CheckCircle, AlertCircle, FolderKanban
} from "lucide-react";

interface PropertyUploadWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onAddUnit: (unit: Omit<Unit, "id" | "createdAt">) => Promise<void>;
  onUpdateUnit?: (unitId: string, updatedFields: Partial<Omit<Unit, "id" | "createdAt">>) => Promise<void>;
  editingUnit?: Unit | null;
  formatCurrency: (amountInEGP: number) => string;
}

const SAMPLE_PROPERTY_IMAGES = [
  "https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=600&q=80",
  "https://images.unsplash.com/photo-1613977257363-707ba9348227?auto=format&fit=crop&w=600&q=80",
  "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=600&q=80",
  "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=600&q=80",
  "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=600&q=80",
];

const GOVERNORATES = [
  "Giza", "Cairo", "Alexandria", "Red Sea", "Matrouh (North Coast)", "South Sinai", "Qalyubia", "Dakahlia", "Suez", "Port Said"
];

const CITIES: Record<string, string[]> = {
  "Cairo": ["New Cairo - Fifth Settlement", "Heliopolis", "Nasr City", "El Shorouk", "Madinaty", "Maadi", "Zamalek", "New Administrative Capital"],
  "Giza": ["Sheikh Zayed", "6th of October", "Pyramids / Haram", "Dokki", "Mohandessin", "Smart Village"],
  "Alexandria": ["Agami", "Smouha", "Maamoura", "Montazah", "Stanley"],
  "Red Sea": ["Hurghada", "El Gouna", "Sahl Hasheesh", "Makadi Bay", "Soma Bay"],
  "Matrouh (North Coast)": ["North Coast", "Marsa Matrouh", "Sidi Abdel Rahman", "New Alamein", "Ras El Hekma"],
  "South Sinai": ["Sharm El Sheikh", "Dahab", "Nuweiba"],
};

const PROPERTY_TYPES_OPTIONS = [
  { id: "Apartment", label: "Apartment" },
  { id: "Villa", label: "Standalone Villa" },
  { id: "Townhouse", label: "Townhouse" },
  { id: "Twin House", label: "Twin House" },
  { id: "Penthouse", label: "Penthouse" },
  { id: "Duplex", label: "Duplex" },
  { id: "Chalet", label: "Chalet" },
  { id: "Office", label: "Commercial Office" },
  { id: "Shop", label: "Retail Shop" },
];

const AMENITIES_CATALOG = [
  { id: "pool", name: "Swimming Pools", desc: "Olympic size, heated, and rooftop infinity pools.", icon: "🏊" },
  { id: "plaza", name: "Commercial Plaza", desc: "High-end retail outlets, dining cafes, and daily services.", icon: "🏬" },
  { id: "security", name: "24/7 Security", desc: "Biometric access control, CCTV, and guarded entry points.", icon: "🛡️" },
  { id: "landscape", name: "Landscaping", desc: "Zen gardens, running tracks, and open green parks.", icon: "🌳" },
  { id: "kids", name: "Kids Play Area", desc: "Supervised play zones and active recreational centers.", icon: "👶" },
  { id: "parking", name: "Underground Parking", desc: "Dedicated underground parking with EV charging spots.", icon: "🅿️" },
  { id: "gym", name: "Fitness Center & Gym", desc: "Modern exercise equipment, wellness rooms, and trainers.", icon: "🏋️" },
];

const INITIAL_FORM_STATE = {
  uploadType: "primary" as "resale" | "primary",
  
  // Resale & Shared Fields
  title: "",
  description: "",
  price: 0,
  purpose: "Sale" as "Sale" | "Rent",
  propertyType: "Apartment",
  governorate: "Giza",
  city: "Sheikh Zayed",
  area: "",
  address: "",
  mapPin: { lat: 30.012, lng: 30.982 },
  images: [] as string[],
  coverImageIndex: 0,

  // Resale Specs
  areaSq: 0,
  bedrooms: 0,
  bathrooms: 0,
  finishingLevel: "Fully Finished",
  
  // Stage 1: Developer Info
  developerName: "",
  developerOwners: [""] as string[],
  developerCompanyOverview: "",
  developerPastProjects: [] as Array<{ id: string; title: string; description?: string }>,

  // Stage 2: Project Details & Location
  projectName: "",
  projectLandArea: "",
  masterplanImage: "",
  projectDescription: "",

  // Stage 3: Amenities & Services
  projectAmenities: ["Swimming Pools", "24/7 Security", "Landscaping"] as string[],
  customAmenities: [] as string[],

  // Stage 4: Spaces & Unit Pricing Inventory
  pricePerSqm: undefined as number | undefined,
  unitInventoryList: [
    { id: "inv-1", unitType: "Apartment", areaSq: 120, bedrooms: 2, startingPrice: 5400000 },
    { id: "inv-2", unitType: "Villa", areaSq: 350, bedrooms: 4, startingPrice: 18500000 }
  ] as Array<{ id: string; unitType: string; areaSq: number; bedrooms: number; startingPrice: number }>,

  // Stage 5: Payment Plans
  paymentPlansList: [
    { id: "pay-1", downPaymentPercent: 10, installmentYears: 8, deliveryYears: 3, maintenancePercent: 8, notes: "10% down payment with equal installments over 8 years" }
  ] as Array<{ id: string; downPaymentPercent: number; installmentYears: number; deliveryYears: number; maintenancePercent?: number; notes?: string }>,

  // Stage 6: Legal Verification Documents
  legalPaperImage: "",
  legalPaperName: "Commercial_Registry_2025.pdf",
  taxCardImage: "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=600&q=80",

  // Stage 7: Certification
  isDataTruthCertified: true,

  // Contact Info
  advertiserName: "",
  phone: "",
  whatsapp: "",
  email: "",
  advertiserType: "Developer" as "Owner" | "Broker" | "Developer"
};

export default function PropertyUploadWizard({
  isOpen,
  onClose,
  onAddUnit,
  onUpdateUnit,
  editingUnit,
  formatCurrency
}: PropertyUploadWizardProps) {
  const [formState, setFormState] = useState(INITIAL_FORM_STATE);
  const [activeStep, setActiveStep] = useState(1);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  
  // Custom Amenity Input State
  const [customAmenityTitle, setCustomAmenityTitle] = useState("");

  // Saving state
  const [isSaving, setIsSaving] = useState(false);

  // Total Max Steps based on Upload Mode
  const maxSteps = formState.uploadType === "resale" ? 6 : 8;

  useEffect(() => {
    if (editingUnit) {
      const isPrimary = editingUnit.uploadType === "primary" || Boolean(editingUnit.projectInfo);
      setFormState({
        uploadType: isPrimary ? "primary" : "resale",
        title: editingUnit.title || "",
        description: editingUnit.description || "",
        price: editingUnit.price || 0,
        purpose: editingUnit.purpose || "Sale",
        propertyType: editingUnit.propertyType || "Apartment",
        governorate: editingUnit.locationDetails?.governorate || "Giza",
        city: editingUnit.locationDetails?.city || "Sheikh Zayed",
        area: editingUnit.locationDetails?.area || "",
        address: editingUnit.locationDetails?.address || "",
        mapPin: editingUnit.locationDetails?.mapPin || { lat: 30.012, lng: 30.982 },
        images: editingUnit.images || (editingUnit.imageUrl ? [editingUnit.imageUrl] : []),
        coverImageIndex: 0,
        areaSq: editingUnit.details?.areaSq || 0,
        bedrooms: editingUnit.details?.bedrooms || 0,
        bathrooms: editingUnit.details?.bathrooms || 0,
        finishingLevel: editingUnit.details?.finishingLevel || "Fully Finished",
        developerName: editingUnit.projectInfo?.developerName || editingUnit.ownerName || "",
        developerOwners: editingUnit.projectInfo?.developerOwners || [""],
        developerCompanyOverview: editingUnit.projectInfo?.developerOverview || "",
        developerPastProjects: editingUnit.projectInfo?.developerPastProjects || [
          { id: "proj-1", title: "", description: "" }
        ],
        projectName: editingUnit.projectInfo?.projectName || "",
        projectLandArea: editingUnit.projectInfo?.projectLandArea || "",
        masterplanImage: editingUnit.projectInfo?.masterplanImage || "",
        projectDescription: editingUnit.description || "",
        projectAmenities: editingUnit.amenities || [],
        customAmenities: editingUnit.projectInfo?.customAmenities || [],
        pricePerSqm: editingUnit.projectInfo?.pricePerSqm,
        unitInventoryList: editingUnit.projectInfo?.unitInventoryList || [],
        paymentPlansList: editingUnit.projectInfo?.paymentPlansList || [],
        legalPaperImage: editingUnit.legalDocuments?.fileUrl || "",
        legalPaperName: editingUnit.legalDocuments?.fileName || "",
        taxCardImage: editingUnit.projectInfo?.taxCardImage || "",
        isDataTruthCertified: Boolean(editingUnit.projectInfo?.isDataTruthCertified ?? true),
        advertiserName: editingUnit.contactInfo?.advertiserName || "",
        phone: editingUnit.contactInfo?.phone || "",
        whatsapp: editingUnit.contactInfo?.whatsapp || "",
        email: editingUnit.contactInfo?.email || "",
        advertiserType: (editingUnit.contactInfo?.advertiserType as any) || "Developer"
      });
    } else {
      setFormState(INITIAL_FORM_STATE);
    }
    setActiveStep(1);
    setValidationErrors({});
  }, [editingUnit, isOpen]);

  if (!isOpen) return null;

  // Developer Past / Current Projects Handlers
  const addDeveloperProjectRow = () => {
    setFormState(prev => ({
      ...prev,
      developerPastProjects: [
        ...prev.developerPastProjects,
        { id: "proj-" + Date.now(), title: "", description: "" }
      ]
    }));
  };

  const removeDeveloperProjectRow = (id: string) => {
    setFormState(prev => ({
      ...prev,
      developerPastProjects: prev.developerPastProjects.filter(p => p.id !== id)
    }));
  };

  const updateDeveloperProjectRow = (id: string, field: "title" | "description", value: string) => {
    setFormState(prev => ({
      ...prev,
      developerPastProjects: prev.developerPastProjects.map(p => p.id === id ? { ...p, [field]: value } : p)
    }));
  };

  // Handle Image Uploads
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const files = Array.from(e.target.files);
    const newUrls = files.map((file: File) => URL.createObjectURL(file));
    setFormState(prev => ({
      ...prev,
      images: [...prev.images, ...newUrls].slice(0, 15)
    }));
  };

  const loadSamplePhotos = () => {
    setFormState(prev => ({
      ...prev,
      images: [...prev.images, ...SAMPLE_PROPERTY_IMAGES].slice(0, 15)
    }));
  };

  const handleMasterplanUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    const url = URL.createObjectURL(file);
    setFormState(prev => ({ ...prev, masterplanImage: url }));
  };

  const toggleAmenity = (amenityName: string) => {
    setFormState(prev => {
      const exists = prev.projectAmenities.includes(amenityName);
      return {
        ...prev,
        projectAmenities: exists
          ? prev.projectAmenities.filter(a => a !== amenityName)
          : [...prev.projectAmenities, amenityName]
      };
    });
  };

  const addCustomAmenity = () => {
    if (!customAmenityTitle.trim()) return;
    setFormState(prev => ({
      ...prev,
      customAmenities: [...prev.customAmenities, customAmenityTitle.trim()]
    }));
    setCustomAmenityTitle("");
  };

  const addInventoryRow = () => {
    setFormState(prev => ({
      ...prev,
      unitInventoryList: [
        ...prev.unitInventoryList,
        { id: "inv-" + Date.now(), unitType: "Apartment", areaSq: 150, bedrooms: 3, startingPrice: 6000000 }
      ]
    }));
  };

  const removeInventoryRow = (id: string) => {
    setFormState(prev => ({
      ...prev,
      unitInventoryList: prev.unitInventoryList.filter(u => u.id !== id)
    }));
  };

  const addPaymentPlanRow = () => {
    setFormState(prev => ({
      ...prev,
      paymentPlansList: [
        ...prev.paymentPlansList,
        { id: "pay-" + Date.now(), downPaymentPercent: 10, installmentYears: 7, deliveryYears: 3, maintenancePercent: 8, notes: "" }
      ]
    }));
  };

  const removePaymentPlanRow = (id: string) => {
    setFormState(prev => ({
      ...prev,
      paymentPlansList: prev.paymentPlansList.filter(p => p.id !== id)
    }));
  };

  // Step Validation Logic
  const validateStep = (step: number): boolean => {
    const errors: Record<string, string> = {};
    let ok = true;

    if (formState.uploadType === "resale") {
      if (step === 1 && formState.images.length === 0) {
        errors.images = "Please upload at least 1 property photo.";
        ok = false;
      }
      if (step === 2) {
        if (!formState.title.trim()) { errors.title = "Property title is required."; ok = false; }
        if (formState.price <= 0) { errors.price = "Please specify a valid property price."; ok = false; }
      }
    } else {
      if (step === 1 && !formState.developerName.trim()) {
        errors.developerName = "Developer company name is required.";
        ok = false;
      }
      if (step === 2) {
        if (!formState.projectName.trim()) { errors.projectName = "Project / Compound name is required."; ok = false; }
      }
      if (step === 8 && !formState.isDataTruthCertified) {
        errors.isDataTruthCertified = "Please certify the accuracy of the provided information.";
        ok = false;
      }
    }

    setValidationErrors(errors);
    return ok;
  };

  const handleNext = () => {
    if (validateStep(activeStep)) {
      setActiveStep(prev => Math.min(prev + 1, maxSteps));
    }
  };

  const handlePrev = () => {
    setActiveStep(prev => Math.max(prev - 1, 1));
  };

  const handlePublish = async () => {
    if (!validateStep(activeStep)) return;

    setIsSaving(true);

    try {
      const coverImage = formState.images.length > 0 
        ? formState.images[formState.coverImageIndex]
        : (formState.masterplanImage || SAMPLE_PROPERTY_IMAGES[0]);

      const isPrimary = formState.uploadType === "primary";

      const minStartingPrice = isPrimary && formState.unitInventoryList.length > 0
        ? Math.min(...formState.unitInventoryList.map(u => u.startingPrice || 1000000))
        : formState.price;

      const mappedUnit: Omit<Unit, "id" | "createdAt"> = {
        visibility: formState.visibility || "public",
        uploadType: formState.uploadType,
        title: isPrimary 
          ? `${formState.projectName} - ${formState.developerName}`
          : formState.title,
        description: isPrimary ? formState.projectDescription : formState.description,
        price: minStartingPrice,
        location: `${formState.area || formState.city}, ${formState.governorate}`,
        propertyType: isPrimary 
          ? `Primary Development (${formState.unitInventoryList.map(u => u.unitType).join(", ") || "Residential"})` 
          : formState.propertyType,
        legalPaperStatus: "verified",
        ownerName: formState.developerName || formState.advertiserName || "Verified Developer",
        ownerPhone: formState.phone,
        ownerPercentage: isPrimary ? 100 : 100,
        imageUrl: coverImage,
        purpose: formState.purpose,
        images: formState.images.length > 0 ? formState.images : [coverImage],
        developerTrackRecord: isPrimary ? formState.developerCompanyOverview : undefined,
        availableUnitTypes: isPrimary ? formState.unitInventoryList.map(u => u.unitType) : undefined,
        priceRange: isPrimary ? { minPrice: minStartingPrice, maxPrice: minStartingPrice * 2.5 } : undefined,
        areaRange: isPrimary && formState.unitInventoryList.length > 0 ? {
          minArea: Math.min(...formState.unitInventoryList.map(u => u.areaSq)),
          maxArea: Math.max(...formState.unitInventoryList.map(u => u.areaSq))
        } : undefined,
        legalDocuments: {
          fileName: formState.legalPaperName,
          fileUrl: formState.legalPaperImage,
          scanStatus: "verified",
          verificationNotes: "Verified Legal Documentation"
        },
        locationDetails: {
          governorate: formState.governorate,
          city: formState.city,
          area: formState.area,
          address: formState.address,
          mapPin: formState.mapPin
        },
        details: {
          areaSq: isPrimary && formState.unitInventoryList.length > 0 ? formState.unitInventoryList[0].areaSq : formState.areaSq,
          bedrooms: formState.bedrooms,
          bathrooms: formState.bathrooms,
          finishingLevel: formState.finishingLevel,
          furnished: "No"
        },
        amenities: isPrimary ? [...formState.projectAmenities, ...formState.customAmenities] : ["Central AC", "24/7 Security"],
        paymentDetails: {
          paymentMethod: "Installments",
          downPayment: formState.paymentPlansList.length > 0 ? formState.paymentPlansList[0].downPaymentPercent : 10,
          installmentYears: formState.paymentPlansList.length > 0 ? formState.paymentPlansList[0].installmentYears : 7,
          maintenancePercent: formState.paymentPlansList.length > 0 ? formState.paymentPlansList[0].maintenancePercent : 8,
          monthlyInstallment: 0,
          interestFree: "Yes",
          deliveryStatus: formState.paymentPlansList.length > 0 ? `Delivery in ${formState.paymentPlansList[0].deliveryYears} Years` : "Under Construction"
        },
        projectInfo: {
          projectName: formState.projectName,
          developerName: formState.developerName,
          developerOwners: formState.developerOwners.filter(Boolean),
          developerOverview: formState.developerCompanyOverview,
          developerPastProjects: formState.developerPastProjects,
          projectLandArea: formState.projectLandArea,
          masterplanImage: formState.masterplanImage,
          customAmenities: formState.customAmenities,
          pricePerSqm: formState.pricePerSqm,
          unitInventoryList: formState.unitInventoryList,
          paymentPlansList: formState.paymentPlansList,
          taxCardImage: formState.taxCardImage,
          isDataTruthCertified: formState.isDataTruthCertified,
        },
        contactInfo: {
          advertiserName: formState.advertiserName || formState.developerName,
          phone: formState.phone,
          whatsapp: formState.whatsapp || formState.phone,
          email: formState.email,
          advertiserType: formState.advertiserType
        }
      };

      if (editingUnit && onUpdateUnit) {
        await onUpdateUnit(editingUnit.id, mappedUnit);
      } else {
        await onAddUnit(mappedUnit);
      }

      setIsSaving(false);
      onClose();
    } catch (e) {
      console.error("Publishing error:", e);
      setIsSaving(false);
    }
  };

  const stepsList = formState.uploadType === "resale" ? [
    { step: 1, key: "media", title: "Media & Photos", icon: ImageIcon },
    { step: 2, key: "specs", title: "Unit Specs & Pricing", icon: Home },
    { step: 3, key: "location", title: "Location & Map Pin", icon: MapPin },
    { step: 4, key: "legal", title: "Legal Verification", icon: ShieldCheck },
    { step: 5, key: "contact", title: "Contact & Advertiser", icon: User },
    { step: 6, key: "submit", title: "Review & Submit", icon: Send },
  ] : [
    { step: 1, key: "dev", title: "Developer Info", icon: Briefcase },
    { step: 2, key: "details", title: "Project Details", icon: Building },
    { step: 3, key: "location", title: "Location & Map Pin", icon: MapPin },
    { step: 4, key: "amenities", title: "Amenities & Services", icon: Dumbbell },
    { step: 5, key: "pricing", title: "Spaces & Pricing", icon: CreditCard },
    { step: 6, key: "plans", title: "Payment Plans", icon: Receipt },
    { step: 7, key: "legal", title: "Legal Verification", icon: ShieldCheck },
    { step: 8, key: "submit", title: "Review & Submit", icon: Send },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-[#0a0a0b] text-[#e5e2e1] font-sans flex flex-col w-screen h-screen overflow-hidden select-none">
      
      {/* TOP FIXED NAVIGATION BAR - FULL WIDTH */}
      <header className="h-16 w-full flex justify-between items-center px-3 sm:px-6 md:px-12 fixed top-0 left-0 right-0 z-40 backdrop-blur-xl bg-black/80 border-b border-white/10 shrink-0">
        <div className="flex items-center gap-2 sm:gap-6">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <Building className="text-white" size={20} />
            <span className="font-extrabold text-sm sm:text-lg md:text-xl tracking-tight text-white hidden xs:inline">Property Wizard</span>
          </div>
          
          {/* UPLOAD MODE TOGGLE */}
          <div className="flex items-center p-0.5 sm:p-1 bg-white/5 border border-white/10 rounded-full text-xs">
            <button
              type="button"
              onClick={() => { setFormState(prev => ({ ...prev, uploadType: "primary" })); setActiveStep(1); }}
              className={`px-2.5 sm:px-4 py-1 sm:py-1.5 rounded-full font-semibold transition-all text-[11px] sm:text-xs cursor-pointer ${
                formState.uploadType === "primary" ? "bg-white text-black shadow-md" : "text-zinc-400 hover:text-white"
              }`}
            >
              Primary
            </button>
            <button
              type="button"
              onClick={() => { setFormState(prev => ({ ...prev, uploadType: "resale" })); setActiveStep(1); }}
              className={`px-2.5 sm:px-4 py-1 sm:py-1.5 rounded-full font-semibold transition-all text-[11px] sm:text-xs cursor-pointer ${
                formState.uploadType === "resale" ? "bg-white text-black shadow-md" : "text-zinc-400 hover:text-white"
              }`}
            >
              Resale
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-4">
          <button 
            type="button" 
            onClick={onClose}
            className="p-1.5 sm:p-2 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 text-white transition flex items-center gap-1.5 px-3 sm:px-4 text-xs font-semibold cursor-pointer active:scale-95"
          >
            <span className="hidden sm:inline">Close</span>
            <X size={16} />
          </button>
        </div>
      </header>

      {/* MOBILE STEP PROGRESS BAR */}
      <div className="md:hidden fixed top-16 left-0 right-0 z-30 bg-[#111113]/95 backdrop-blur-md border-b border-white/10 px-4 py-2 flex items-center justify-between">
        <span className="text-xs font-bold text-white">
          Step {activeStep}/{maxSteps}: {stepsList.find(s => s.step === activeStep)?.title || "Details"}
        </span>
        <div className="w-24 bg-white/10 h-1.5 rounded-full overflow-hidden">
          <div 
            className="bg-white h-full transition-all duration-300"
            style={{ width: `${(activeStep / maxSteps) * 100}%` }}
          />
        </div>
      </div>

      {/* MAIN CONTAINER: SIDEBAR + CONTENT CANVAS */}
      <div className="flex flex-1 pt-24 md:pt-16 pb-24 md:pb-20 h-full overflow-hidden w-full">
        
        {/* SIDEBAR NAVIGATION - COMPACT & HIGH DENSITY */}
        <aside className="hidden md:flex flex-col w-72 h-full py-6 bg-[#111113]/80 backdrop-blur-xl border-r border-white/10 shrink-0 overflow-y-auto">
          <div className="px-6 mb-6">
            <p className="text-xs text-zinc-400 font-medium">Steps Completed ({activeStep}/{maxSteps})</p>
            <div className="w-full bg-white/10 h-1.5 rounded-full mt-2 overflow-hidden">
              <div 
                className="bg-white h-full transition-all duration-300"
                style={{ width: `${(activeStep / maxSteps) * 100}%` }}
              />
            </div>
          </div>

          <nav className="flex-1 space-y-1 px-3">
            {stepsList.map((s) => {
              const IconComp = s.icon;
              const isActive = activeStep === s.step;
              return (
                <button
                  key={s.step}
                  type="button"
                  onClick={() => {
                    if (s.step < activeStep || validateStep(activeStep)) {
                      setActiveStep(s.step);
                    }
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm text-left ${
                    isActive
                      ? "text-white font-bold bg-white/10 border-l-2 border-white"
                      : s.step < activeStep
                      ? "text-zinc-300 hover:bg-white/5"
                      : "text-zinc-500 hover:bg-white/5"
                  }`}
                >
                  <IconComp size={18} className={isActive ? "text-white" : "text-zinc-400"} />
                  <span className="flex-1 font-medium">{s.title}</span>
                  {s.step < activeStep && <Check size={14} className="text-emerald-400 shrink-0" />}
                </button>
              );
            })}
          </nav>
        </aside>

        {/* MAIN CANVAS AREA - FULL SPACE UTILIZATION */}
        <main className="flex-1 h-full overflow-y-auto px-3.5 sm:px-6 md:px-12 py-4 sm:py-8 w-full max-w-[1600px] mx-auto space-y-6 sm:space-y-8">
          
          {/* STEP HEADER */}
          <header className="space-y-2">
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 bg-white/10 border border-white/20 rounded-full text-[11px] font-mono tracking-wider text-white uppercase">
                STEP {activeStep < 10 ? `0${activeStep}` : activeStep} / {maxSteps < 10 ? `0${maxSteps}` : maxSteps}
              </span>
              <div className="h-px flex-1 bg-white/10" />
            </div>

            <h1 className="text-2xl md:text-4xl font-extrabold text-white tracking-tight">
              {formState.uploadType === "primary" ? (
                activeStep === 1 ? "Developer Identity & Track Record" :
                activeStep === 2 ? "Project Details & Media" :
                activeStep === 3 ? "Compound Location & Map Pin" :
                activeStep === 4 ? "Amenities & Services" :
                activeStep === 5 ? "Spaces & Unit Pricing" :
                activeStep === 6 ? "Configure Payment Plans" :
                activeStep === 7 ? "Legal Documentation" :
                "Review & Publish"
              ) : (
                activeStep === 1 ? "Property Media & Photos" :
                activeStep === 2 ? "Unit Specs & Pricing" :
                activeStep === 3 ? "Location & Map Pin" :
                activeStep === 4 ? "Legal Documentation" :
                activeStep === 5 ? "Contact & Advertiser Info" :
                "Review & Publish"
              )}
            </h1>

            <p className="text-sm text-zinc-400 leading-relaxed">
              {formState.uploadType === "primary" ? (
                activeStep === 1 ? "Provide corporate identity details, company overview, partners, and track record projects." :
                activeStep === 2 ? "Define compound parameters, total land area in feddans, renders, and masterplan layout." :
                activeStep === 3 ? "Select governorate, city, district address, and pinpoint compound location on interactive map." :
                activeStep === 4 ? "Select core amenities, facilities, and lifestyle features." :
                activeStep === 5 ? "Configure unit types, square meter dimensions, bedrooms, and starting price points." :
                activeStep === 6 ? "Define flexible payment terms, down payment percentages, and delivery timelines." :
                activeStep === 7 ? "Upload commercial registry and official tax credentials." :
                "Review complete compound configuration before publishing."
              ) : (
                "Fill in complete property specifications, pricing, location coordinates, and legal documents."
              )}
            </p>
          </header>

          {/* STEP 1: DEVELOPER INFO (PRIMARY) */}
          {formState.uploadType === "primary" && activeStep === 1 && (
            <div className="space-y-6">
              <section className="bg-[#121214]/80 border border-white/10 rounded-2xl p-8 space-y-6">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Briefcase size={18} />
                  Developer Company Information
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-mono uppercase text-zinc-400 mb-2 tracking-wider">
                      Developer Company Name *
                    </label>
                    <input
                      type="text"
                      value={formState.developerName}
                      onChange={e => setFormState(prev => ({ ...prev, developerName: e.target.value }))}
                      placeholder="e.g. Genesis Urban Development / SODIC / Emaar"
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-white outline-none transition"
                    />
                    {validationErrors.developerName && (
                      <p className="text-xs text-rose-400 mt-1">{validationErrors.developerName}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-mono uppercase text-zinc-400 mb-2 tracking-wider">
                      Advertiser Type
                    </label>
                    <select
                      value={formState.advertiserType}
                      onChange={e => setFormState(prev => ({ ...prev, advertiserType: e.target.value as any }))}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-white outline-none transition"
                    >
                      <option value="Developer" className="bg-black">Master Developer</option>
                      <option value="Broker" className="bg-black">Broker / Agency</option>
                      <option value="Owner" className="bg-black">Property Owner</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase text-zinc-400 mb-2 tracking-wider">
                    Company Overview & Vision
                  </label>
                  <textarea
                    rows={4}
                    value={formState.developerCompanyOverview}
                    onChange={e => setFormState(prev => ({ ...prev, developerCompanyOverview: e.target.value }))}
                    placeholder="Describe the developer's background, past track record, and architectural philosophy..."
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-sm text-white focus:border-white outline-none transition resize-none"
                  />
                </div>
              </section>

              {/* FOUNDERS SECTION */}
              <section className="bg-[#121214]/80 border border-white/10 rounded-2xl p-8 space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <User size={18} />
                    Founders & Key Stakeholders
                  </h3>
                  <button
                    type="button"
                    onClick={() => setFormState(prev => ({ ...prev, developerOwners: [...prev.developerOwners, ""] }))}
                    className="px-4 py-2 border border-white/20 rounded-full hover:bg-white/10 transition text-xs font-semibold flex items-center gap-2 text-white"
                  >
                    <Plus size={14} />
                    Add Partner
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {formState.developerOwners.map((owner, idx) => (
                    <div key={idx} className="flex gap-2 items-center bg-white/5 p-3 rounded-xl border border-white/10">
                      <input
                        type="text"
                        value={owner}
                        onChange={e => {
                          const val = e.target.value;
                          setFormState(prev => ({
                            ...prev,
                            developerOwners: prev.developerOwners.map((o, i) => i === idx ? val : o)
                          }));
                        }}
                        placeholder="Partner / Founder Name"
                        className="w-full bg-transparent border-0 text-sm text-white focus:outline-none"
                      />
                      {formState.developerOwners.length > 1 && (
                        <button
                          type="button"
                          onClick={() => setFormState(prev => ({ ...prev, developerOwners: prev.developerOwners.filter((_, i) => i !== idx) }))}
                          className="p-1.5 text-zinc-400 hover:text-rose-400 transition"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </section>

              {/* DEVELOPER PROJECTS SECTION */}
              <section className="bg-[#121214]/80 border border-white/10 rounded-2xl p-8 space-y-6">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      <FolderKanban size={18} />
                      Projects Track Record
                    </h3>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      List previous or active real estate projects developed by this company.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={addDeveloperProjectRow}
                    className="px-4 py-2 border border-white/20 rounded-full hover:bg-white/10 transition text-xs font-semibold flex items-center gap-2 text-white cursor-pointer"
                  >
                    <Plus size={14} />
                    Add Project
                  </button>
                </div>

                {formState.developerPastProjects.length === 0 ? (
                  <div className="p-6 text-center border border-dashed border-white/10 rounded-xl bg-white/5">
                    <p className="text-xs text-zinc-400">No projects added yet. Click "+ Add Project" to record company portfolio.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {formState.developerPastProjects.map((proj, idx) => (
                      <div key={proj.id || idx} className="bg-white/5 border border-white/10 rounded-xl p-5 space-y-3 relative group">
                        <div className="flex justify-between items-center pb-2 border-b border-white/10">
                          <span className="text-xs font-mono uppercase text-zinc-400 font-semibold">Project #{idx + 1}</span>
                          <button
                            type="button"
                            onClick={() => removeDeveloperProjectRow(proj.id)}
                            className="text-xs text-zinc-400 hover:text-rose-400 transition flex items-center gap-1 cursor-pointer"
                          >
                            <Trash2 size={14} />
                            Remove
                          </button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-mono uppercase text-zinc-400 mb-1">Project Name *</label>
                            <input
                              type="text"
                              value={proj.title}
                              onChange={e => updateDeveloperProjectRow(proj.id, "title", e.target.value)}
                              placeholder="e.g. SODIC East, Villette, Allegria"
                              className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:border-white outline-none transition"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-mono uppercase text-zinc-400 mb-1">Project Description & Details</label>
                            <input
                              type="text"
                              value={proj.description || ""}
                              onChange={e => updateDeveloperProjectRow(proj.id, "description", e.target.value)}
                              placeholder="e.g. 150-acre mixed-use development in New Cairo"
                              className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:border-white outline-none transition"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </div>
          )}

          {/* STEP 2: PROJECT DETAILS (PRIMARY) */}
          {formState.uploadType === "primary" && activeStep === 2 && (
            <div className="space-y-6">
              <section className="bg-[#121214]/80 border border-white/10 rounded-2xl p-8 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-mono uppercase text-zinc-400 mb-2">Project / Compound Name *</label>
                    <input
                      type="text"
                      value={formState.projectName}
                      onChange={e => setFormState(prev => ({ ...prev, projectName: e.target.value }))}
                      placeholder="e.g. Lumina Prime Residences"
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-white outline-none transition"
                    />
                    {validationErrors.projectName && (
                      <p className="text-xs text-rose-400 mt-1">{validationErrors.projectName}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-mono uppercase text-zinc-400 mb-2">Compound Land Area (Acres / Feddans)</label>
                    <input
                      type="text"
                      value={formState.projectLandArea}
                      onChange={e => setFormState(prev => ({ ...prev, projectLandArea: e.target.value }))}
                      placeholder="e.g. 150 Acres / Feddans"
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-white outline-none transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase text-zinc-400 mb-2">Project Description</label>
                  <textarea
                    rows={4}
                    value={formState.projectDescription}
                    onChange={e => setFormState(prev => ({ ...prev, projectDescription: e.target.value }))}
                    placeholder="Provide detailed narrative on project concept, location advantages, and architectural features..."
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-sm text-white focus:border-white outline-none transition resize-none"
                  />
                </div>
              </section>

              {/* MEDIA UPLOADS FULL WIDTH */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-8 bg-[#121214]/80 border border-white/10 rounded-2xl p-8 space-y-6">
                  <div className="flex justify-between items-center">
                    <h3 className="text-base font-bold text-white">Project Renders & Photos</h3>
                    <button
                      type="button"
                      onClick={loadSamplePhotos}
                      className="text-xs text-white underline hover:text-zinc-300 flex items-center gap-1.5 font-semibold"
                    >
                      <ImageIcon size={14} />
                      Load Sample Photos
                    </button>
                  </div>

                  <div className="border-2 border-dashed border-white/15 hover:border-white/40 rounded-xl p-8 text-center relative cursor-pointer group transition bg-white/5">
                    <input type="file" multiple accept="image/*" onChange={handleImageUpload} className="absolute inset-0 opacity-0 cursor-pointer" />
                    <Upload size={32} className="mx-auto text-zinc-400 group-hover:text-white transition mb-2" />
                    <p className="text-sm font-semibold text-white">Click or drag photos here</p>
                    <p className="text-xs text-zinc-500 mt-1">Supports JPG, PNG, WEBP (Max 15 photos)</p>
                  </div>

                  {formState.images.length > 0 && (
                    <div className="grid grid-cols-5 gap-3">
                      {formState.images.map((img, i) => (
                        <div key={i} className="aspect-square rounded-lg overflow-hidden border border-white/15 relative group">
                          <img src={img} alt="Render" className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => setFormState(prev => ({ ...prev, images: prev.images.filter((_, idx) => idx !== i) }))}
                            className="absolute top-1 left-1 p-1 bg-black/80 text-white rounded-full opacity-0 group-hover:opacity-100 transition"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="lg:col-span-4 bg-[#121214]/80 border border-white/10 rounded-2xl p-8 flex flex-col justify-between">
                  <div>
                    <h3 className="text-base font-bold text-white mb-4">Masterplan File</h3>
                    <div className="border border-white/15 rounded-xl p-6 text-center cursor-pointer hover:border-white/40 transition relative group bg-white/5">
                      <input type="file" accept="image/*,.pdf" onChange={handleMasterplanUpload} className="absolute inset-0 opacity-0 cursor-pointer" />
                      <Layers size={28} className="mx-auto text-zinc-400 group-hover:scale-110 transition mb-2" />
                      <p className="text-xs font-semibold text-white">Upload Masterplan PDF / Image</p>
                    </div>
                    {formState.masterplanImage && (
                      <div className="mt-4 p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-400 flex items-center gap-2">
                        <CheckCircle size={14} />
                        <span>Masterplan uploaded successfully</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: COMPOUND LOCATION & MAP PIN (PRIMARY) */}
          {formState.uploadType === "primary" && activeStep === 3 && (
            <div className="space-y-6">
              <section className="bg-[#121214]/80 border border-white/10 rounded-2xl p-8 space-y-6">
                <div className="flex items-center gap-3 pb-2 border-b border-white/10">
                  <MapPin className="text-white" size={20} />
                  <div>
                    <h3 className="text-base font-bold text-white">Compound Location & Map Pin</h3>
                    <p className="text-xs text-zinc-400">Select governorate, city, district address, and place the GPS pin on the interactive map.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-mono uppercase text-zinc-400 mb-2">Governorate</label>
                    <select
                      value={formState.governorate}
                      onChange={e => {
                        const gov = e.target.value;
                        const availableCities = CITIES[gov] || [];
                        setFormState(prev => ({
                          ...prev,
                          governorate: gov,
                          city: availableCities[0] || ""
                        }));
                      }}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none"
                    >
                      {GOVERNORATES.map(gov => (
                        <option key={gov} value={gov} className="bg-black">{gov}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-mono uppercase text-zinc-400 mb-2">City / Area</label>
                    <select
                      value={formState.city}
                      onChange={e => setFormState(prev => ({ ...prev, city: e.target.value }))}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none"
                    >
                      {(CITIES[formState.governorate] || [formState.city]).map(c => (
                        <option key={c} value={c} className="bg-black">{c}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase text-zinc-400 mb-2">Street Address & Landmark</label>
                  <input
                    type="text"
                    value={formState.address}
                    onChange={e => setFormState(prev => ({ ...prev, address: e.target.value }))}
                    placeholder="e.g. Golden Square, Ring Road Extension, 10 min from AUC"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-white outline-none transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase text-zinc-400 mb-2">Interactive GPS Location Pin</label>
                  <p className="text-xs text-zinc-500 mb-3">Click on the map or drag the pin to mark exact compound coordinates.</p>
                  <InteractiveMap
                    lat={formState.mapPin.lat}
                    lng={formState.mapPin.lng}
                    onLocationChange={(coords) => setFormState(prev => ({ ...prev, mapPin: { lat: coords.lat, lng: coords.lng } }))}
                    className="h-[500px] w-full"
                  />
                </div>
              </section>
            </div>
          )}

          {/* STEP 4: AMENITIES & SERVICES (PRIMARY) */}
          {formState.uploadType === "primary" && activeStep === 4 && (
            <div className="space-y-8">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {AMENITIES_CATALOG.map((item) => {
                  const isSelected = formState.projectAmenities.includes(item.name);
                  return (
                    <div
                      key={item.id}
                      onClick={() => toggleAmenity(item.name)}
                      className={`bg-[#121214]/80 border rounded-2xl p-6 cursor-pointer transition-all duration-200 hover:border-white/40 ${
                        isSelected ? "border-white bg-white/10" : "border-white/10"
                      }`}
                    >
                      <div className="flex justify-between items-start mb-4">
                        <span className="text-3xl">{item.icon}</span>
                        <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                          isSelected ? "bg-white border-white text-black" : "border-white/20"
                        }`}>
                          {isSelected && <Check size={12} />}
                        </div>
                      </div>
                      <h3 className="text-base font-bold text-white mb-1">{item.name}</h3>
                      <p className="text-xs text-zinc-400 leading-relaxed">{item.desc}</p>
                    </div>
                  );
                })}
              </div>

              {/* CUSTOM AMENITY INPUT */}
              <div className="bg-[#121214]/80 border border-white/10 rounded-2xl p-8 max-w-2xl space-y-4">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Plus size={18} />
                  Add Custom Amenity
                </h3>

                <div className="flex gap-3">
                  <input
                    type="text"
                    value={customAmenityTitle}
                    onChange={e => setCustomAmenityTitle(e.target.value)}
                    placeholder="e.g. Helipad, Crystal Lagoon, Private Marina"
                    className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:border-white outline-none transition"
                  />
                  <button
                    type="button"
                    onClick={addCustomAmenity}
                    className="px-6 py-2.5 bg-white text-black font-bold rounded-xl hover:bg-zinc-200 transition text-sm"
                  >
                    Add
                  </button>
                </div>

                {formState.customAmenities.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-2">
                    {formState.customAmenities.map((ca, idx) => (
                      <span key={idx} className="px-3 py-1.5 rounded-full bg-white/10 border border-white/20 text-xs text-white flex items-center gap-2">
                        {ca}
                        <X size={12} className="cursor-pointer hover:text-rose-400" onClick={() => setFormState(p => ({ ...p, customAmenities: p.customAmenities.filter((_, i) => i !== idx) }))} />
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* STEP 5: SPACES & PRICING (PRIMARY) */}
          {formState.uploadType === "primary" && activeStep === 5 && (
            <div className="space-y-8">
              {/* GLOBAL PRICING ANCHOR */}
              <section className="bg-[#121214]/80 border border-white/10 rounded-2xl p-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                  <div>
                    <h3 className="text-base font-bold text-white flex items-center gap-2 mb-1">
                      <Zap size={18} />
                      Base Price per SQM (Optional)
                    </h3>
                    <p className="text-xs text-zinc-400">
                      Set a baseline meter price anchor for project reference.
                    </p>
                  </div>
                  <div>
                    <label className="block text-xs font-mono uppercase text-zinc-400 mb-1">PRICE PER SQM (EGP)</label>
                    <input
                      type="number"
                      value={formState.pricePerSqm || ""}
                      onChange={e => setFormState(prev => ({ ...prev, pricePerSqm: Number(e.target.value) }))}
                      placeholder="e.g. 45000"
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm font-mono text-white focus:border-white outline-none transition"
                    />
                  </div>
                </div>
              </section>

              {/* UNIT INVENTORY LIST */}
              <section className="space-y-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-bold text-white">Unit Inventory & Pricing</h3>
                    <p className="text-xs text-zinc-400">Define available property configurations in the compound.</p>
                  </div>
                  <button
                    type="button"
                    onClick={addInventoryRow}
                    className="px-4 py-2 border border-white/20 rounded-full hover:bg-white hover:text-black transition text-xs font-semibold flex items-center gap-2 text-white"
                  >
                    <Plus size={14} />
                    Add Unit Type
                  </button>
                </div>

                <div className="space-y-3">
                  {formState.unitInventoryList.map((item) => (
                    <div key={item.id} className="bg-[#121214]/80 border border-white/10 rounded-xl p-5 grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                      <div className="md:col-span-3">
                        <label className="block text-[10px] text-zinc-400 font-mono mb-1 uppercase">Unit Type</label>
                        <select
                          value={item.unitType}
                          onChange={e => {
                            const val = e.target.value;
                            setFormState(p => ({
                              ...p,
                              unitInventoryList: p.unitInventoryList.map(u => u.id === item.id ? { ...u, unitType: val } : u)
                            }));
                          }}
                          className="w-full bg-white/5 border border-white/10 rounded-lg p-2 text-sm text-white outline-none"
                        >
                          <option value="Apartment" className="bg-black">Apartment</option>
                          <option value="Villa" className="bg-black">Standalone Villa</option>
                          <option value="Townhouse" className="bg-black">Townhouse</option>
                          <option value="Twin House" className="bg-black">Twin House</option>
                          <option value="Penthouse" className="bg-black">Penthouse</option>
                          <option value="Duplex" className="bg-black">Duplex</option>
                          <option value="Chalet" className="bg-black">Chalet</option>
                        </select>
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-[10px] text-zinc-400 font-mono mb-1 uppercase">Area (SQM / m²)</label>
                        <input
                          type="number"
                          value={item.areaSq}
                          onChange={e => {
                            const val = Number(e.target.value);
                            setFormState(p => ({
                              ...p,
                              unitInventoryList: p.unitInventoryList.map(u => u.id === item.id ? { ...u, areaSq: val } : u)
                            }));
                          }}
                          className="w-full bg-white/5 border border-white/10 rounded-lg p-2 text-sm text-white font-mono outline-none"
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-[10px] text-zinc-400 font-mono mb-1 uppercase">Bedrooms</label>
                        <input
                          type="number"
                          value={item.bedrooms}
                          onChange={e => {
                            const val = Number(e.target.value);
                            setFormState(p => ({
                              ...p,
                              unitInventoryList: p.unitInventoryList.map(u => u.id === item.id ? { ...u, bedrooms: val } : u)
                            }));
                          }}
                          className="w-full bg-white/5 border border-white/10 rounded-lg p-2 text-sm text-white font-mono outline-none"
                        />
                      </div>

                      <div className="md:col-span-4">
                        <label className="block text-[10px] text-zinc-400 font-mono mb-1 uppercase">Starting Price (EGP)</label>
                        <input
                          type="number"
                          value={item.startingPrice}
                          onChange={e => {
                            const val = Number(e.target.value);
                            setFormState(p => ({
                              ...p,
                              unitInventoryList: p.unitInventoryList.map(u => u.id === item.id ? { ...u, startingPrice: val } : u)
                            }));
                          }}
                          className="w-full bg-white/5 border border-white/10 rounded-lg p-2 text-sm text-white font-mono outline-none"
                        />
                      </div>

                      <div className="md:col-span-1 flex justify-end">
                        {formState.unitInventoryList.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeInventoryRow(item.id)}
                            className="p-2 text-zinc-400 hover:text-rose-400 transition"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          )}

          {/* STEP 6: PAYMENT PLANS (PRIMARY) */}
          {formState.uploadType === "primary" && activeStep === 6 && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-bold text-white">Payment Plans & Installments</h3>
                  <p className="text-xs text-zinc-400">Configure down payments, installment periods, and delivery dates.</p>
                </div>
                <button
                  type="button"
                  onClick={addPaymentPlanRow}
                  className="px-4 py-2 border border-white/20 rounded-full hover:bg-white hover:text-black transition text-xs font-semibold flex items-center gap-2 text-white"
                >
                  <Plus size={14} />
                  Add Payment Plan
                </button>
              </div>

              <div className="space-y-4">
                {formState.paymentPlansList.map((plan, idx) => (
                  <div key={plan.id} className="bg-[#121214]/80 border border-white/10 rounded-2xl p-6 space-y-4">
                    <div className="flex justify-between items-center pb-3 border-b border-white/10">
                      <span className="text-sm font-bold text-white">Payment Plan #{idx + 1}</span>
                      {formState.paymentPlansList.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removePaymentPlanRow(plan.id)}
                          className="text-xs text-rose-400 hover:underline flex items-center gap-1"
                        >
                          <Trash2 size={14} />
                          Remove
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <label className="block text-xs font-mono uppercase text-zinc-400 mb-1">Down Payment %</label>
                        <input
                          type="number"
                          value={plan.downPaymentPercent}
                          onChange={e => {
                            const val = Number(e.target.value);
                            setFormState(p => ({
                              ...p,
                              paymentPlansList: p.paymentPlansList.map(item => item.id === plan.id ? { ...item, downPaymentPercent: val } : item)
                            }));
                          }}
                          className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm text-white font-mono outline-none focus:border-emerald-500/50"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-mono uppercase text-zinc-400 mb-1">Installment Years</label>
                        <input
                          type="number"
                          value={plan.installmentYears}
                          onChange={e => {
                            const val = Number(e.target.value);
                            setFormState(p => ({
                              ...p,
                              paymentPlansList: p.paymentPlansList.map(item => item.id === plan.id ? { ...item, installmentYears: val } : item)
                            }));
                          }}
                          className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm text-white font-mono outline-none focus:border-emerald-500/50"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-mono uppercase text-zinc-400 mb-1">Delivery (Years)</label>
                        <input
                          type="number"
                          value={plan.deliveryYears}
                          onChange={e => {
                            const val = Number(e.target.value);
                            setFormState(p => ({
                              ...p,
                              paymentPlansList: p.paymentPlansList.map(item => item.id === plan.id ? { ...item, deliveryYears: val } : item)
                            }));
                          }}
                          className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm text-white font-mono outline-none focus:border-emerald-500/50"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-mono uppercase text-zinc-400 mb-1">Maintenance %</label>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={plan.maintenancePercent ?? 8}
                          onChange={e => {
                            const val = Number(e.target.value);
                            setFormState(p => ({
                              ...p,
                              paymentPlansList: p.paymentPlansList.map(item => item.id === plan.id ? { ...item, maintenancePercent: val } : item)
                            }));
                          }}
                          placeholder="e.g. 8"
                          className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm text-white font-mono outline-none focus:border-emerald-500/50"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-mono uppercase text-zinc-400 mb-1">Additional Terms / Notes</label>
                      <input
                        type="text"
                        value={plan.notes || ""}
                        onChange={e => {
                          const val = e.target.value;
                          setFormState(p => ({
                            ...p,
                            paymentPlansList: p.paymentPlansList.map(item => item.id === plan.id ? { ...item, notes: val } : item)
                          }));
                        }}
                        placeholder="e.g. Equal quarterly installments without interest"
                        className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm text-white outline-none"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* STEP 7: LEGAL VERIFICATION */}
          {((formState.uploadType === "primary" && activeStep === 7) || (formState.uploadType === "resale" && activeStep === 4)) && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-[#121214]/80 border border-white/10 rounded-2xl p-8 space-y-4">
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <ShieldCheck size={20} className="text-emerald-400" />
                    Commercial Registry / License
                  </h3>
                  <p className="text-xs text-zinc-400">Upload official registration certificate or commercial license document.</p>
                  
                  <div className="border border-white/15 rounded-xl p-6 text-center bg-white/5">
                    <p className="text-xs font-mono text-zinc-300">{formState.legalPaperName || "Commercial_Registry_2025.pdf"}</p>
                    <div className="mt-3 flex justify-center gap-2">
                      <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 rounded-full text-xs font-semibold flex items-center gap-1">
                        <CheckCircle size={12} />
                        Verified File
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-[#121214]/80 border border-white/10 rounded-2xl p-8 space-y-4">
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <FileText size={20} className="text-emerald-400" />
                    Tax Card / ID Document
                  </h3>
                  <p className="text-xs text-zinc-400">Upload tax registration or owner national identity card.</p>
                  
                  <div className="border border-white/15 rounded-xl p-6 text-center bg-white/5">
                    <p className="text-xs font-mono text-zinc-300">Tax_Card_Verified.pdf</p>
                    <div className="mt-3 flex justify-center gap-2">
                      <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 rounded-full text-xs font-semibold flex items-center gap-1">
                        <CheckCircle size={12} />
                        Verified File
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* RESALE STEP 1: MEDIA & PHOTOS */}
          {formState.uploadType === "resale" && activeStep === 1 && (
            <div className="space-y-6">
              <section className="bg-[#121214]/80 border border-white/10 rounded-2xl p-8 space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-base font-bold text-white">Property Photos</h3>
                  <button
                    type="button"
                    onClick={loadSamplePhotos}
                    className="text-xs text-white underline hover:text-zinc-300 flex items-center gap-1.5 font-semibold"
                  >
                    <ImageIcon size={14} />
                    Load Sample Photos
                  </button>
                </div>

                <div className="border-2 border-dashed border-white/15 hover:border-white/40 rounded-xl p-10 text-center relative cursor-pointer group transition bg-white/5">
                  <input type="file" multiple accept="image/*" onChange={handleImageUpload} className="absolute inset-0 opacity-0 cursor-pointer" />
                  <Upload size={32} className="mx-auto text-zinc-400 group-hover:text-white transition mb-2" />
                  <p className="text-sm font-semibold text-white">Upload unit photos</p>
                  <p className="text-xs text-zinc-500 mt-1">PNG, JPG, WEBP accepted (Max 15 photos)</p>
                </div>

                {validationErrors.images && (
                  <p className="text-xs text-rose-400">{validationErrors.images}</p>
                )}

                {formState.images.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-4">
                    {formState.images.map((img, i) => (
                      <div key={i} className="aspect-square rounded-xl overflow-hidden border border-white/15 relative group">
                        <img src={img} alt="Property" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => setFormState(prev => ({ ...prev, images: prev.images.filter((_, idx) => idx !== i) }))}
                          className="absolute top-1 left-1 p-1 bg-black/80 text-white rounded-full opacity-0 group-hover:opacity-100 transition"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </div>
          )}

          {/* RESALE STEP 2: SPECS & PRICING */}
          {formState.uploadType === "resale" && activeStep === 2 && (
            <div className="space-y-6">
              <section className="bg-[#121214]/80 border border-white/10 rounded-2xl p-8 space-y-6">
                <div>
                  <label className="block text-xs font-mono uppercase text-zinc-400 mb-2">Property Listing Title *</label>
                  <input
                    type="text"
                    value={formState.title}
                    onChange={e => setFormState(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="e.g. Modern 3-Bedroom Apartment in Sheikh Zayed"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-white outline-none transition"
                  />
                  {validationErrors.title && <p className="text-xs text-rose-400 mt-1">{validationErrors.title}</p>}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-xs font-mono uppercase text-zinc-400 mb-2">Asking Price (EGP) *</label>
                    <input
                      type="number"
                      value={formState.price || ""}
                      onChange={e => setFormState(prev => ({ ...prev, price: Number(e.target.value) }))}
                      placeholder="e.g. 4500000"
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white font-mono focus:border-white outline-none transition"
                    />
                    {validationErrors.price && <p className="text-xs text-rose-400 mt-1">{validationErrors.price}</p>}
                  </div>

                  <div>
                    <label className="block text-xs font-mono uppercase text-zinc-400 mb-2">Property Type</label>
                    <select
                      value={formState.propertyType}
                      onChange={e => setFormState(prev => ({ ...prev, propertyType: e.target.value }))}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none"
                    >
                      {PROPERTY_TYPES_OPTIONS.map(opt => (
                        <option key={opt.id} value={opt.id} className="bg-black">{opt.label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-mono uppercase text-zinc-400 mb-2">Purpose</label>
                    <select
                      value={formState.purpose}
                      onChange={e => setFormState(prev => ({ ...prev, purpose: e.target.value as any }))}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none"
                    >
                      <option value="Sale" className="bg-black">For Sale</option>
                      <option value="Rent" className="bg-black">For Rent</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div>
                    <label className="block text-xs font-mono uppercase text-zinc-400 mb-2">Area (SQM)</label>
                    <input
                      type="number"
                      value={formState.areaSq || ""}
                      onChange={e => setFormState(prev => ({ ...prev, areaSq: Number(e.target.value) }))}
                      placeholder="180"
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white font-mono outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-mono uppercase text-zinc-400 mb-2">Bedrooms</label>
                    <input
                      type="number"
                      value={formState.bedrooms || ""}
                      onChange={e => setFormState(prev => ({ ...prev, bedrooms: Number(e.target.value) }))}
                      placeholder="3"
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white font-mono outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-mono uppercase text-zinc-400 mb-2">Bathrooms</label>
                    <input
                      type="number"
                      value={formState.bathrooms || ""}
                      onChange={e => setFormState(prev => ({ ...prev, bathrooms: Number(e.target.value) }))}
                      placeholder="2"
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white font-mono outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-mono uppercase text-zinc-400 mb-2">Finishing Level</label>
                    <select
                      value={formState.finishingLevel}
                      onChange={e => setFormState(prev => ({ ...prev, finishingLevel: e.target.value }))}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none"
                    >
                      <option value="Fully Finished" className="bg-black">Fully Finished</option>
                      <option value="Semi Finished" className="bg-black">Semi Finished</option>
                      <option value="Core & Shell" className="bg-black">Core & Shell</option>
                      <option value="Ultra Super Lux" className="bg-black">Ultra Super Lux</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase text-zinc-400 mb-2">Full Description</label>
                  <textarea
                    rows={4}
                    value={formState.description}
                    onChange={e => setFormState(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Provide details about property condition, view, balcony, floor level..."
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-sm text-white focus:border-white outline-none transition resize-none"
                  />
                </div>
              </section>
            </div>
          )}

          {/* LOCATION STEP (RESALE 3) */}
          {formState.uploadType === "resale" && activeStep === 3 && (
            <div className="space-y-6">
              <section className="bg-[#121214]/80 border border-white/10 rounded-2xl p-8 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-mono uppercase text-zinc-400 mb-2">Governorate</label>
                    <select
                      value={formState.governorate}
                      onChange={e => {
                        const gov = e.target.value;
                        const availableCities = CITIES[gov] || [];
                        setFormState(prev => ({
                          ...prev,
                          governorate: gov,
                          city: availableCities[0] || ""
                        }));
                      }}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none"
                    >
                      {GOVERNORATES.map(gov => (
                        <option key={gov} value={gov} className="bg-black">{gov}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-mono uppercase text-zinc-400 mb-2">City / Area</label>
                    <select
                      value={formState.city}
                      onChange={e => setFormState(prev => ({ ...prev, city: e.target.value }))}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none"
                    >
                      {(CITIES[formState.governorate] || [formState.city]).map(c => (
                        <option key={c} value={c} className="bg-black">{c}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase text-zinc-400 mb-2">Street Address & Building Details</label>
                  <input
                    type="text"
                    value={formState.address}
                    onChange={e => setFormState(prev => ({ ...prev, address: e.target.value }))}
                    placeholder="e.g. District 4, Street 15, Building 42"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-white outline-none transition"
                  />
                </div>

                <div className="h-80 rounded-2xl overflow-hidden border border-white/10">
                  <InteractiveMap
                    lat={formState.mapPin.lat}
                    lng={formState.mapPin.lng}
                    onLocationChange={(coords) => setFormState(prev => ({ ...prev, mapPin: { lat: coords.lat, lng: coords.lng } }))}
                  />
                </div>
              </section>
            </div>
          )}

          {/* CONTACT STEP (RESALE 5) */}
          {formState.uploadType === "resale" && activeStep === 5 && (
            <div className="space-y-6">
              <section className="bg-[#121214]/80 border border-white/10 rounded-2xl p-8 space-y-6">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <User size={18} />
                  Contact Information
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-mono uppercase text-zinc-400 mb-2">Advertiser Name</label>
                    <input
                      type="text"
                      value={formState.advertiserName}
                      onChange={e => setFormState(prev => ({ ...prev, advertiserName: e.target.value }))}
                      placeholder="e.g. Mohamed Ahmed"
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-mono uppercase text-zinc-400 mb-2">Phone Number</label>
                    <input
                      type="text"
                      value={formState.phone}
                      onChange={e => setFormState(prev => ({ ...prev, phone: e.target.value }))}
                      placeholder="e.g. +20 100 123 4567"
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white font-mono outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-mono uppercase text-zinc-400 mb-2">WhatsApp Number</label>
                    <input
                      type="text"
                      value={formState.whatsapp}
                      onChange={e => setFormState(prev => ({ ...prev, whatsapp: e.target.value }))}
                      placeholder="e.g. +20 100 123 4567"
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white font-mono outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-mono uppercase text-zinc-400 mb-2">Email Address</label>
                    <input
                      type="email"
                      value={formState.email}
                      onChange={e => setFormState(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="e.g. contact@domain.com"
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none"
                    />
                  </div>
                </div>
              </section>
            </div>
          )}

          {/* FINAL REVIEW STEP */}
          {activeStep === maxSteps && (
            <div className="space-y-6">
              <section className="bg-[#121214]/80 border border-white/10 rounded-2xl p-8 space-y-6">
                <h3 className="text-lg font-bold text-white">Summary Review</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                  <div className="space-y-2 p-4 bg-white/5 rounded-xl border border-white/10">
                    <p className="text-xs text-zinc-400 uppercase font-mono">Title / Project</p>
                    <p className="font-bold text-white">
                      {formState.uploadType === "primary" ? formState.projectName || "New Compound" : formState.title || "Resale Property"}
                    </p>
                  </div>

                  <div className="space-y-2 p-4 bg-white/5 rounded-xl border border-white/10">
                    <p className="text-xs text-zinc-400 uppercase font-mono">Developer / Owner</p>
                    <p className="font-bold text-white">{formState.developerName || formState.advertiserName || "Verified Partner"}</p>
                  </div>

                  <div className="space-y-2 p-4 bg-white/5 rounded-xl border border-white/10">
                    <p className="text-xs text-zinc-400 uppercase font-mono">Location</p>
                    <p className="font-bold text-white">{formState.city}, {formState.governorate}</p>
                  </div>

                  <div className="space-y-2 p-4 bg-white/5 rounded-xl border border-white/10">
                    <p className="text-xs text-zinc-400 uppercase font-mono">Price Point</p>
                    <p className="font-bold text-white">
                      {formState.uploadType === "primary" && formState.unitInventoryList.length > 0
                        ? `From ${formatCurrency(Math.min(...formState.unitInventoryList.map(u => u.startingPrice)))}`
                        : formatCurrency(formState.price)}
                    </p>
                  </div>
                </div>

                <div className="pt-4 border-t border-white/10">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formState.isDataTruthCertified}
                      onChange={e => setFormState(prev => ({ ...prev, isDataTruthCertified: e.target.checked }))}
                      className="w-5 h-5 rounded border-white/20 bg-white/5 accent-white"
                    />
                    <span className="text-sm text-zinc-300">
                      I certify that all provided details and media assets are accurate and up to date.
                    </span>
                  </label>
                  {validationErrors.isDataTruthCertified && (
                    <p className="text-xs text-rose-400 mt-2">{validationErrors.isDataTruthCertified}</p>
                  )}
                </div>
              </section>
            </div>
          )}
        </main>
      </div>

      {/* FIXED BOTTOM ACTION BAR - FULL WIDTH */}
      <footer className="h-20 w-full flex justify-between items-center px-4 sm:px-6 md:px-12 fixed bottom-0 left-0 right-0 z-40 backdrop-blur-xl bg-black/90 border-t border-white/10 shrink-0 pb-safe">
        <button
          type="button"
          onClick={handlePrev}
          disabled={activeStep === 1}
          className={`px-4 sm:px-6 py-2 sm:py-2.5 rounded-full border border-white/20 font-semibold text-xs transition flex items-center gap-1.5 sm:gap-2 active:scale-95 ${
            activeStep === 1 ? "opacity-40 cursor-not-allowed text-zinc-500" : "text-white hover:bg-white/10 cursor-pointer"
          }`}
        >
          <ArrowLeft size={15} />
          <span>Back</span>
        </button>

        <div className="flex items-center gap-2 sm:gap-4">
          {activeStep < maxSteps ? (
            <button
              type="button"
              onClick={handleNext}
              className="px-5 sm:px-8 py-2.5 sm:py-3 rounded-full bg-white text-black font-extrabold text-xs hover:bg-zinc-200 transition shadow-lg flex items-center gap-1.5 sm:gap-2 cursor-pointer active:scale-95"
            >
              <span>Next Step</span>
              <ArrowRight size={15} />
            </button>
          ) : (
            <button
              type="button"
              onClick={handlePublish}
              disabled={isSaving}
              className="px-5 sm:px-8 py-2.5 sm:py-3 rounded-full bg-white text-black font-extrabold text-xs hover:bg-zinc-200 transition shadow-lg flex items-center gap-1.5 sm:gap-2 cursor-pointer disabled:opacity-50 active:scale-95"
            >
              {isSaving ? (
                <>
                  <Loader2 size={15} className="animate-spin" />
                  <span>Publishing...</span>
                </>
              ) : (
                <>
                  <span>Publish</span>
                  <Send size={15} />
                </>
              )}
            </button>
          )}
        </div>
      </footer>
    </div>
  );
}

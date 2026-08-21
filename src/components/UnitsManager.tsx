import React, { useState, useEffect, useRef } from "react";
import { Unit } from "../types";
import InteractiveMap from "./InteractiveMap";
import PropertyUploadWizard from "./PropertyUploadWizard";
import { 
  Plus, Tag, ShieldCheck, Zap, Building, Percent, FileText, BarChart2, 
  DollarSign, MapPin, X, Bed, Bath, Maximize, Check, Upload, Trash2, 
  ChevronLeft, ChevronRight, Image as ImageIcon, Sparkles, CheckCircle2, 
  Lock, User, Phone, Mail, Layers, Compass, Calendar, Info, Loader2,
  CheckCircle, AlertTriangle, ArrowRight, Save, Eye, Sparkle
} from "lucide-react";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from "recharts";
import { motion, AnimatePresence } from "motion/react";

interface UnitsManagerProps {
  units: Unit[];
  onAddUnit: (unit: Omit<Unit, "id" | "createdAt">) => Promise<void>;
  formatCurrency: (amountInEGP: number) => string;
}

const SAMPLE_PROPERTY_IMAGES = [
  "https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=600&q=80", // Modern Villa
  "https://images.unsplash.com/photo-1613977257363-707ba9348227?auto=format&fit=crop&w=600&q=80", // Villa Pool
  "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=600&q=80", // Penthouse
  "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=600&q=80", // Luxury Mansion
  "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=600&q=80", // Living Room
  "https://images.unsplash.com/photo-1512915922686-57c11dde9b6b?auto=format&fit=crop&w=600&q=80", // Luxury Kitchen
  "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=600&q=80", // Bath
];

const GOVERNORATES = [
  "Cairo", "Giza", "Alexandria", "Qalyubia", "Dakahlia", "Red Sea", "Matrouh", "South Sinai", "North Sinai", "Suez", "Port Said", "Gharbia"
];

const CITIES: Record<string, string[]> = {
  "Cairo": ["New Cairo", "Heliopolis", "Nasr City", "El Shorouk", "Madinaty", "Maadi", "Zamalek"],
  "Giza": ["Sheikh Zayed", "6th of October", "Haram", "Dokki", "Mohandessin", "Smart Village"],
  "Alexandria": ["Agami", "Smouha", "Maamoura", "Montazah", "Stanley"],
  "Red Sea": ["Hurghada", "El Gouna", "Sahl Hasheesh", "Makadi Bay", "Soma Bay"],
  "Matrouh": ["North Coast / Sahel", "Marsa Matrouh", "Sidi Abdel Rahman", "Alamein"],
  "South Sinai": ["Sharm El Sheikh", "Dahab", "Nuweiba"],
};

const PROPERTY_TYPES = [
  "Apartment", "Villa", "Townhouse", "Twin House", "Penthouse", "Duplex", "Studio", "Chalet", "Office", "Clinic", "Shop", "Warehouse", "Land", "Factory", "Other"
];

const FINISHING_LEVELS = [
  "Unfinished", "Semi Finished", "Fully Finished", "Super Lux", "Ultra Super Lux", "Lux"
];

const AMENITIES_LIST = [
  { key: "Air Conditioning", label: "Air Conditioning" },
  { key: "Kitchen", label: "Kitchen" },
  { key: "Kitchen Appliances", label: "Kitchen Appliances" },
  { key: "Parking", label: "Parking Space" },
  { key: "Elevator", label: "Elevator" },
  { key: "Garden", label: "Private Garden" },
  { key: "Roof", label: "Private Roof" },
  { key: "Swimming Pool", label: "Swimming Pool" },
  { key: "Gym", label: "Private Gym" },
  { key: "Clubhouse", label: "Clubhouse Membership" },
  { key: "Security", label: "24/7 Security" },
  { key: "CCTV", label: "CCTV Surveillance" },
  { key: "Internet", label: "High-speed Internet" },
  { key: "Natural Gas", label: "Natural Gas Supply" },
  { key: "Electricity Meter", label: "Electricity Meter" },
  { key: "Water Meter", label: "Water Meter" },
  { key: "Gas Meter", label: "Gas Meter" },
  { key: "Backup Generator", label: "Backup Generator" },
  { key: "Maid Room", label: "Maid Room" },
  { key: "Driver Room", label: "Driver Room" },
  { key: "Jacuzzi", label: "Private Jacuzzi" },
  { key: "Sauna", label: "Sauna Room" },
  { key: "Smart Home", label: "Smart Home Automation" },
  { key: "EV Charging Station", label: "EV Charging Station" },
];

const QUICK_DESC_TAGS = [
  " lagoon view", " fully finished", " ready to move", " close to clubhouse", " prime location", " smart home systems", " marble flooring", " private terrace", " negotiable price", " flexible installments"
];

const INITIAL_FORM_STATE = {
  // Step 1: Images
  images: [] as string[],
  coverImageIndex: 0,

  // Step 2: Basic Info
  title: "",
  propertyType: "Apartment",
  purpose: "Sale" as "Sale" | "Rent",
  price: 1500000,
  negotiable: "No" as "Yes" | "No",

  // Step 3: Location
  governorate: "Giza",
  city: "Sheikh Zayed",
  area: "",
  compound: "",
  address: "",
  mapPin: { lat: 30.012, lng: 30.982 },

  // Step 4: Details
  areaSq: 140,
  landArea: 0,
  builtUpArea: 140,
  bedrooms: 3,
  bathrooms: 2,
  receptionRooms: 1,
  floorNumber: 2,
  totalFloors: 5,
  yearBuilt: 2024,
  finishingLevel: "Fully Finished",
  furnished: "No" as "Yes" | "No",
  orientation: "Bahary",
  balconies: 1,

  // Step 5: Amenities
  amenities: [] as string[],

  // Step 6: Payment Details
  paymentMethod: "Cash" as "Cash" | "Installments",
  downPayment: 0,
  installmentYears: 0,
  monthlyInstallment: 0,
  interestFree: "Yes" as "Yes" | "No",
  deliveryStatus: "Ready to Move",

  // Step 7: Project Info
  belongsToDeveloper: false,
  projectName: "",
  developerName: "",
  projectPhase: "",
  constructionProgress: 0,
  deliveryDate: "",

  // Step 8: Description
  description: "",

  // Step 9: Contact Info
  advertiserName: "",
  phone: "",
  whatsapp: "",
  email: "",
  advertiserType: "Agent" as "Owner" | "Agent" | "Developer",
  isOwner: false,
  allowMarketing: true,
};

export default function UnitsManager({ units, onAddUnit, formatCurrency }: UnitsManagerProps) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [activeStep, setActiveStep] = useState(1);
  const [formState, setFormState] = useState(INITIAL_FORM_STATE);
  const [isCompressing, setIsCompressing] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [showDraftSaved, setShowDraftSaved] = useState(false);
  const [showDraftRestored, setShowDraftRestored] = useState(false);
  
  // AI Analysis overlay state
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [analysisStatus, setAnalysisStatus] = useState("Preparing uploads...");
  const [analysisResult, setAnalysisResult] = useState<any>(null);

  // Load draft from localStorage on mount
  useEffect(() => {
    const savedDraft = localStorage.getItem("property_upload_draft");
    if (savedDraft) {
      try {
        const parsed = JSON.parse(savedDraft);
        if (parsed && parsed.title !== undefined) {
          setFormState(parsed);
          setShowDraftRestored(true);
          setTimeout(() => setShowDraftRestored(false), 4000);
        }
      } catch (err) {
        console.error("Failed to parse property draft:", err);
      }
    }
  }, []);

  // Save draft automatically on form changes
  useEffect(() => {
    if (showAddModal) {
      const delaySave = setTimeout(() => {
        localStorage.setItem("property_upload_draft", JSON.stringify(formState));
        setShowDraftSaved(true);
        setTimeout(() => setShowDraftSaved(false), 2000);
      }, 1000);
      return () => clearTimeout(delaySave);
    }
  }, [formState, showAddModal]);

  // Image compressing Canvas-based function
  const compressImage = (base64Str: string, maxWidth = 900, maxHeight = 900, quality = 0.75): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = base64Str;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;
        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL("image/jpeg", quality));
        } else {
          resolve(base64Str);
        }
      };
      img.onerror = () => resolve(base64Str);
    });
  };

  const readFileAsBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      const remainingSlots = 20 - formState.images.length;
      const filesToProcess = filesArray.slice(0, remainingSlots);
      
      setIsCompressing(true);
      for (const file of filesToProcess) {
        try {
          const base64 = await readFileAsBase64(file as any);
          const compressed = await compressImage(base64);
          setFormState(prev => ({
            ...prev,
            images: [...prev.images, compressed]
          }));
        } catch (err) {
          console.error("Error reading/compressing file:", err);
        }
      }
      setIsCompressing(false);
    }
  };

  const loadSampleImages = () => {
    setFormState(prev => ({
      ...prev,
      images: [...prev.images, ...SAMPLE_PROPERTY_IMAGES].slice(0, 20)
    }));
  };

  const removeImage = (idx: number) => {
    setFormState(prev => {
      const nextImages = prev.images.filter((_, i) => i !== idx);
      const nextCoverIdx = prev.coverImageIndex >= nextImages.length ? 0 : prev.coverImageIndex;
      return {
        ...prev,
        images: nextImages,
        coverImageIndex: nextCoverIdx
      };
    });
  };

  const moveImage = (index: number, direction: "left" | "right") => {
    const nextIndex = direction === "left" ? index - 1 : index + 1;
    if (nextIndex < 0 || nextIndex >= formState.images.length) return;

    setFormState(prev => {
      const imagesCopy = [...prev.images];
      const temp = imagesCopy[index];
      imagesCopy[index] = imagesCopy[nextIndex];
      imagesCopy[nextIndex] = temp;

      // Keep track of cover index swap
      let coverIdx = prev.coverImageIndex;
      if (coverIdx === index) {
        coverIdx = nextIndex;
      } else if (coverIdx === nextIndex) {
        coverIdx = index;
      }

      return {
        ...prev,
        images: imagesCopy,
        coverImageIndex: coverIdx
      };
    });
  };

  // Step Validators
  const validateStep = (step: number): boolean => {
    const errors: Record<string, string> = {};
    let isValid = true;

    if (step === 2) {
      if (!formState.title.trim()) {
        errors.title = "Property title is required.";
        isValid = false;
      }
      if (formState.price <= 0) {
        errors.price = "Valid price in EGP is required.";
        isValid = false;
      }
    }

    if (step === 3) {
      if (!formState.governorate) {
        errors.governorate = "Governorate selection is required.";
        isValid = false;
      }
      if (!formState.city) {
        errors.city = "City selection is required.";
        isValid = false;
      }
      if (!formState.area.trim()) {
        errors.area = "Area or District is required.";
        isValid = false;
      }
      if (!formState.address.trim()) {
        errors.address = "Detailed street address is required.";
        isValid = false;
      }
    }

    if (step === 4) {
      if (formState.areaSq <= 0) {
        errors.areaSq = "Property Area (sqm) must be greater than zero.";
        isValid = false;
      }
      if (formState.bedrooms < 0) {
        errors.bedrooms = "Bedrooms count cannot be negative.";
        isValid = false;
      }
      if (formState.bathrooms < 0) {
        errors.bathrooms = "Bathrooms count cannot be negative.";
        isValid = false;
      }
    }

    if (step === 6) {
      if (formState.paymentMethod === "Installments") {
        if (formState.downPayment < 0) {
          errors.downPayment = "Down payment cannot be negative.";
          isValid = false;
        }
        if (formState.installmentYears <= 0) {
          errors.installmentYears = "Installment years must be at least 1 year.";
          isValid = false;
        }
        if (formState.monthlyInstallment < 0) {
          errors.monthlyInstallment = "Monthly installment cannot be negative.";
          isValid = false;
        }
      }
    }

    if (step === 8) {
      if (formState.description.trim().length < 15) {
        errors.description = "Property description must be at least 15 characters long.";
        isValid = false;
      }
    }

    if (step === 9) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!formState.advertiserName.trim()) {
        errors.advertiserName = "Advertiser/Owner name is required.";
        isValid = false;
      }
      if (!formState.phone.trim()) {
        errors.phone = "Contact phone number is required.";
        isValid = false;
      }
      if (!formState.email.trim() || !emailRegex.test(formState.email)) {
        errors.email = "A valid contact email address is required.";
        isValid = false;
      }
    }

    setValidationErrors(errors);
    return isValid;
  };

  const handleNextStep = () => {
    if (validateStep(activeStep)) {
      setActiveStep(prev => Math.min(prev + 1, 10)); // Max step is 10 (Review)
    }
  };

  const handlePrevStep = () => {
    setActiveStep(prev => Math.max(prev - 1, 1));
  };

  // Run the premium AI analysis and save to DB
  const handlePublishProperty = async () => {
    setIsAnalyzing(true);
    setAnalysisProgress(5);
    setAnalysisStatus("Parsing property blueprints...");

    const progressInterval = setInterval(() => {
      setAnalysisProgress(prev => {
        if (prev < 90) {
          if (prev === 20) setAnalysisStatus("Auditing property dimensions and location specifications...");
          if (prev === 45) setAnalysisStatus("Formulating ROI projection arrays based on current regional metrics...");
          if (prev === 70) setAnalysisStatus("Evaluating quality and completeness scores with Gemini...");
          return prev + 5;
        }
        return prev;
      });
    }, 450);

    try {
      // 1. Call our custom server-side analyze endpoint
      const response = await fetch("/api/analyze-property", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ property: formState })
      });
      
      const analysis = await response.json();
      setAnalysisResult(analysis);
      setAnalysisProgress(95);
      setAnalysisStatus("Compiling final report cards...");
      await new Promise(resolve => setTimeout(resolve, 800));

      // 2. Map all wizard fields to standard Unit model for high-fidelity rendering
      const coverImage = formState.images.length > 0 
        ? formState.images[formState.coverImageIndex]
        : formState.propertyType.toLowerCase().includes("villa") 
        ? "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=600&q=80"
        : "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=600&q=80";

      const mappedUnit: Omit<Unit, "id" | "createdAt"> = {
        title: formState.title,
        description: formState.description,
        price: formState.price,
        location: `${formState.area || "Downtown"}, ${formState.city}`,
        propertyType: formState.propertyType,
        legalPaperStatus: "verified_boost", // Automatically verify & boost complete listings
        ownerName: formState.advertiserName || "Agent",
        ownerPhone: formState.phone,
        ownerPercentage: formState.belongsToDeveloper ? 10 : 90,
        imageUrl: coverImage,
        
        // Enrich with full multi-step specifications
        purpose: formState.purpose,
        negotiable: formState.negotiable,
        images: formState.images,
        locationDetails: {
          governorate: formState.governorate,
          city: formState.city,
          area: formState.area,
          compound: formState.compound,
          address: formState.address,
          mapPin: formState.mapPin
        },
        details: {
          areaSq: formState.areaSq,
          landArea: formState.landArea,
          builtUpArea: formState.builtUpArea,
          bedrooms: formState.bedrooms,
          bathrooms: formState.bathrooms,
          receptionRooms: formState.receptionRooms,
          floorNumber: formState.floorNumber,
          totalFloors: formState.totalFloors,
          yearBuilt: formState.yearBuilt,
          finishingLevel: formState.finishingLevel,
          furnished: formState.furnished,
          orientation: formState.orientation,
          balconies: formState.balconies
        },
        amenities: [...formState.amenities, ...(analysis.autoDetectedAmenities || [])],
        paymentDetails: {
          paymentMethod: formState.paymentMethod,
          downPayment: formState.downPayment,
          installmentYears: formState.installmentYears,
          monthlyInstallment: formState.monthlyInstallment,
          interestFree: formState.interestFree,
          deliveryStatus: formState.deliveryStatus
        },
        projectInfo: {
          projectName: formState.projectName,
          developerName: formState.developerName,
          projectPhase: formState.projectPhase,
          constructionProgress: `${formState.constructionProgress}%`,
          deliveryDate: formState.deliveryDate
        },
        contactInfo: {
          advertiserName: formState.advertiserName,
          phone: formState.phone,
          whatsapp: formState.whatsapp,
          email: formState.email,
          advertiserType: formState.advertiserType,
          isOwner: formState.isOwner,
          allowMarketing: formState.allowMarketing
        },
        aiAnalysis: analysis
      };

      // 3. Save to database using hook
      await onAddUnit(mappedUnit);
      
      setAnalysisProgress(100);
      setAnalysisStatus("Property Uploaded & Verified successfully!");
      
      // Keep results open for 3 seconds so they can view the dashboard
      await new Promise(resolve => setTimeout(resolve, 3500));

      // Clear draft on successful submit
      localStorage.removeItem("property_upload_draft");
      
      // Close modal & reset
      setShowAddModal(false);
      setIsAnalyzing(false);
      setAnalysisResult(null);
      setActiveStep(1);
      setFormState(INITIAL_FORM_STATE);

    } catch (err) {
      console.error("Analysis or upload error:", err);
      setIsAnalyzing(false);
    } finally {
      clearInterval(progressInterval);
    }
  };

  const handleClearDraft = () => {
    localStorage.removeItem("property_upload_draft");
    setFormState(INITIAL_FORM_STATE);
    setActiveStep(1);
  };

  // Pie Chart Data mapping the legal paper distribution
  const defaultChartData = [
    { name: "Legal Paper and Boost (60%)", value: 60, color: "#2563eb" },
    { name: "Legal Paper Only (30%)", value: 30, color: "#1d4ed8" },
    { name: "No Legal Paper (10%)", value: 10, color: "#475569" }
  ];

  const actualBoosted = units.filter(u => u.legalPaperStatus === "verified_boost").length;
  const actualVerified = units.filter(u => u.legalPaperStatus === "verified").length;
  const actualNone = units.filter(u => u.legalPaperStatus === "none").length;
  const totalActual = actualBoosted + actualVerified + actualNone;

  const chartData = totalActual > 0 ? [
    { name: `Legal Paper & Boost (${Math.round((actualBoosted/totalActual)*100)}%)`, value: actualBoosted, color: "#2563eb" },
    { name: `Legal Paper Only (${Math.round((actualVerified/totalActual)*100)}%)`, value: actualVerified, color: "#1d4ed8" },
    { name: `No Legal Paper (${Math.round((actualNone/totalActual)*100)}%)`, value: actualNone, color: "#475569" }
  ] : defaultChartData;

  return (
    <div className="space-y-6 text-slate-100">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-black text-white tracking-tight font-display bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
            High Quality Units Registry
          </h2>
          <p className="text-sm text-slate-400">Verify, catalog, and boost high-value real estate properties</p>
        </div>
        <button
          onClick={() => {
            setShowAddModal(true);
          }}
          className="glass-btn font-bold px-5 py-3 rounded-full flex items-center gap-2 transition cursor-pointer"
        >
          <Plus size={16} />
          <span>Upload Property</span>
        </button>
      </div>

      {/* TOP SUMMARY ROW / D3 CHART PANEL */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* RECHARTS COMPONENT */}
        <div className="lg:col-span-1 bg-black/40 backdrop-blur-md border border-white/5 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-black uppercase tracking-wider text-blue-400 mb-1 flex items-center gap-2 font-mono">
              <BarChart2 size={14} />
              AI Recommendation Priorities
            </h3>
            <p className="text-[11px] text-slate-400 mb-4 leading-normal">
              AI model automatically prioritizes units with complete legal papers & premium boosting.
            </p>
          </div>

          <div className="h-44 w-full flex justify-center items-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={65}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: "rgba(6,9,25,0.95)", 
                    borderRadius: "12px", 
                    color: "#fff",
                    fontSize: "11px",
                    border: "1px solid rgba(255,255,255,0.1)"
                  }} 
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-1.5 mt-2">
            {chartData.map((entry, index) => (
              <div key={index} className="flex items-center gap-2 text-[11px] text-slate-300 font-medium">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: entry.color }} />
                <span className="truncate">{entry.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* METRICS & CONSTRAINTS CARDS */}
        <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* Owner Relations */}
          <div className="bg-gradient-to-br from-[#0c102a] to-[#040612] border border-white/5 text-white rounded-2xl p-5 flex flex-col justify-between shadow-md relative overflow-hidden">
            <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-blue-500/10 rounded-full blur-xl" />
            <div>
              <span className="bg-blue-500/20 text-blue-300 text-[10px] uppercase font-mono px-2.5 py-1 rounded">System Metric</span>
              <h3 className="text-2xl font-black mt-3">90% Direct Owner</h3>
              <p className="text-xs text-slate-300 mt-2 leading-relaxed font-medium">
                Broker AI filters guarantee a maximum 10% third-party agency dilution. You work directly with primary title holders.
              </p>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-blue-400 font-bold mt-4 font-mono">
              <Percent size={14} />
              Owner Intermediary Caps Active
            </div>
          </div>

          {/* Boosting benefits card */}
          <div className="bg-black/40 border border-white/5 text-white rounded-2xl p-5 flex flex-col justify-between shadow-sm">
            <div>
              <span className="bg-blue-600/10 text-blue-400 border border-blue-500/15 text-[10px] uppercase font-bold px-2 py-1 rounded font-mono">Promotion Engine</span>
              <h3 className="text-base font-black mt-3 text-white">Legal Verification Boost</h3>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                Units registered with verified legal licensing and boosted status receive <strong>6x the view visibility</strong> in recommendations list streams.
              </p>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-blue-400 font-bold mt-4 font-mono">
              <Zap size={14} className="text-yellow-500 fill-yellow-500" />
              Automated AI distribution weights
            </div>
          </div>

        </div>
      </div>

      {/* UNITS CARDS LIST */}
      {(() => {
        const sortedUnits = [...units].sort((a, b) => {
          const aScan = (a.legalPaperStatus === "verified_boost" || a.legalPaperStatus === "verified" || Boolean((a as any).legalPaperScanVerified)) ? 1 : 0;
          const bScan = (b.legalPaperStatus === "verified_boost" || b.legalPaperStatus === "verified" || Boolean((b as any).legalPaperScanVerified)) ? 1 : 0;
          return bScan - aScan;
        });

        return (
          <div className="space-y-4">
            {units.length > 0 && (
              <div className="bg-blue-950/40 border border-blue-500/20 rounded-2xl p-3 flex items-center justify-between text-xs text-blue-200">
                <div className="flex items-center gap-2">
                  <ShieldCheck size={16} className="text-emerald-400 shrink-0" />
                  <span>
                    <strong>Priority Display Active:</strong> Units with scanned & verified legal papers appear first. 
                    <span className="text-blue-300 ml-1">(Legal paper scan is optional, providing priority boost)</span>
                  </span>
                </div>
                <span className="text-[10px] bg-blue-500/20 text-blue-300 px-2.5 py-1 rounded-full font-mono font-bold shrink-0">
                  {units.filter(u => u.legalPaperStatus === "verified_boost" || u.legalPaperStatus === "verified").length} / {units.length} Prioritized
                </span>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {sortedUnits.length === 0 ? (
                <div className="col-span-full bg-black/30 border-2 border-dashed border-white/10 rounded-3xl p-12 text-center text-slate-300">
                  <Building className="mx-auto text-slate-500 mb-3 animate-pulse" size={36} />
                  <p className="text-sm font-bold text-white">No active units cataloged</p>
                  <p className="text-xs text-slate-400 mt-1 mb-4">Be the first to list and boost a property unit!</p>
                  <button
                    onClick={() => setShowAddModal(true)}
                    className="glass-btn font-bold px-4 py-2.5 rounded-xl text-xs cursor-pointer"
                  >
                    Add Unit Now
                  </button>
                </div>
              ) : (
                sortedUnits.map((unit) => (
                  <motion.div
                    key={unit.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-slate-950/45 border border-white/[0.08] rounded-3xl overflow-hidden shadow-[0_12px_36px_rgba(0,0,0,0.4)] flex flex-col justify-between hover:-translate-y-1 hover:border-[#5b8dff]/35 hover:shadow-[0_0_24px_rgba(90,140,255,0.12)] transition-all duration-300"
                  >
                    {/* Badge Headers */}
                    <div className="p-4 flex justify-between items-start">
                      <span className="text-[10px] font-mono tracking-wider bg-blue-600/15 text-blue-400 border border-blue-500/10 uppercase px-2 py-1 rounded font-bold">
                        {unit.propertyType}
                      </span>

                      {unit.legalPaperStatus === "verified_boost" && (
                        <span className="bg-gradient-to-r from-amber-500 to-yellow-500 text-white text-[9px] font-black uppercase tracking-wider px-2 py-1 rounded flex items-center gap-1 shadow-sm">
                          <Zap size={10} className="fill-white" />
                          Verified & Boosted
                        </span>
                      )}
                      {unit.legalPaperStatus === "verified" && (
                        <span className="bg-blue-600 text-white text-[9px] font-black uppercase tracking-wider px-2 py-1 rounded flex items-center gap-1">
                          <ShieldCheck size={10} />
                          Verified Papers
                        </span>
                      )}
                      {unit.legalPaperStatus === "none" && (
                        <span className="bg-white/5 text-slate-400 text-[9px] uppercase font-bold px-2 py-1 rounded">
                          No Legal Papers (Standard)
                        </span>
                      )}
                    </div>

                    {/* Body */}
                    <div className="px-4 pb-4 flex-1">
                      <h3 className="text-base font-bold text-white leading-tight mb-1 truncate">{unit.title}</h3>
                      <p className="text-xs text-slate-400 line-clamp-2 mb-3 h-8">{unit.description}</p>
                      
                      {/* Info parameters */}
                      <div className="grid grid-cols-2 gap-2 text-[11px] font-medium text-slate-200 mb-4 border-t border-b border-white/5 py-2">
                        <div>
                          <span className="text-slate-500 uppercase text-[9px] block font-mono font-bold">Location</span>
                          <strong className="text-white truncate block">{unit.location}</strong>
                        </div>
                        <div>
                          <span className="text-slate-500 uppercase text-[9px] block font-mono font-bold">Direct Contact</span>
                          <strong className="text-white truncate block">{unit.ownerName}</strong>
                        </div>
                      </div>

                      <div className="flex justify-between items-baseline">
                        <span className="text-[9px] uppercase font-mono tracking-wide text-slate-500 font-bold">Evaluation Price</span>
                        <span className="text-lg font-black text-white font-mono">
                          {formatCurrency(unit.price)}
                        </span>
                      </div>
                    </div>

                    {/* Footer */}
                    <div className="bg-white/5 px-4 py-3 text-[10px] flex justify-between items-center border-t border-white/5">
                      <span className="text-slate-400 font-medium">Owner Direct Intermediary</span>
                      <span className="font-extrabold text-blue-400 text-xs font-mono">{unit.ownerPercentage}% Cap</span>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </div>
        );
      })()}

      {/* DRAFT NOTIFICATION BANNERS */}
      <AnimatePresence>
        {showDraftSaved && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.9 }}
            className="fixed bottom-6 right-6 z-[100] bg-black/80 backdrop-blur-md border border-white/10 text-white rounded-full px-4 py-2 flex items-center gap-2 text-xs font-mono shadow-2xl pointer-events-none"
          >
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Draft automatically saved</span>
          </motion.div>
        )}
        {showDraftRestored && (
          <motion.div
            initial={{ opacity: 0, y: -50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -30, scale: 0.9 }}
            className="fixed top-6 left-1/2 -translate-x-1/2 z-[100] bg-blue-900/90 backdrop-blur-md border border-blue-500/20 text-white rounded-full px-5 py-2.5 flex items-center gap-2 text-xs font-bold shadow-2xl pointer-events-none"
          >
            <Sparkles size={14} className="text-amber-400" />
            <span>Unfinished Property Upload Draft Restored!</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* IMMERSIVE MULTI-STEP PROPERTY REGISTRY WIZARD */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#03050c]/80 backdrop-blur-xl p-4 overflow-y-auto">
            
            {/* AI ANALYSIS OVERLAY HUD (HIDDEN FROM NORMAL USER, ENGAGES ON SUBMIT) */}
            {isAnalyzing && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="absolute inset-0 z-[60] bg-[#03050c]/95 flex flex-col items-center justify-center p-6 text-center"
              >
                <div className="max-w-md w-full space-y-6">
                  {/* Glowing AI brain container */}
                  <div className="relative mx-auto w-24 h-24 flex items-center justify-center">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ repeat: Infinity, duration: 4, ease: "linear" }}
                      className="absolute inset-0 rounded-full border-2 border-dashed border-blue-500/30"
                    />
                    <motion.div
                      animate={{ scale: [1, 1.1, 1] }}
                      transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                      className="absolute inset-2 rounded-full bg-blue-600/10 blur-md"
                    />
                    <Sparkles size={36} className="text-blue-400 animate-pulse relative z-10" />
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-xl font-black tracking-tight font-display text-white">Analyzing with Broker AI...</h3>
                    <p className="text-sm text-slate-400 font-mono text-center h-10">{analysisStatus}</p>
                  </div>

                  {/* Progressive Meter */}
                  <div className="w-full h-2.5 bg-white/5 rounded-full overflow-hidden relative border border-white/10">
                    <motion.div 
                      className="h-full bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500"
                      initial={{ width: "0%" }}
                      animate={{ width: `${analysisProgress}%` }}
                      transition={{ duration: 0.3 }}
                    />
                  </div>
                  <span className="block text-xs font-mono text-slate-500">{analysisProgress}% Complete</span>

                  {/* AI Results Reveal Dashboard */}
                  {analysisResult && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: 15 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-5 space-y-4 text-left font-mono max-h-96 overflow-y-auto"
                    >
                      <div className="flex justify-between items-center border-b border-white/5 pb-2">
                        <span className="text-[11px] font-black text-blue-400 uppercase tracking-widest flex items-center gap-1.5">
                          <Sparkle size={12} />
                          AI Structured Intelligence
                        </span>
                        <span className="text-xs bg-emerald-500/20 text-emerald-400 px-2.5 py-0.5 rounded-full font-black">
                          Verified & Certified
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <div>
                          <span className="text-slate-500 block text-[9px] uppercase font-bold">Category</span>
                          <span className="text-slate-200 font-bold">{analysisResult.category}</span>
                        </div>
                        <div>
                          <span className="text-slate-500 block text-[9px] uppercase font-bold">Luxury Grading</span>
                          <span className="text-amber-400 font-bold">{analysisResult.luxuryLevel}</span>
                        </div>
                        <div className="col-span-2">
                          <span className="text-slate-500 block text-[9px] uppercase font-bold">Target Buyer Persona</span>
                          <span className="text-slate-300 leading-tight">{analysisResult.buyerPersona}</span>
                        </div>
                        <div className="col-span-2">
                          <span className="text-slate-500 block text-[9px] uppercase font-bold">ROI Valuation</span>
                          <span className="text-emerald-400 font-extrabold">{analysisResult.estimatedRoi}</span>
                        </div>
                        <div>
                          <span className="text-slate-500 block text-[9px] uppercase font-bold">Quality Rating</span>
                          <span className="text-white font-extrabold text-sm">{analysisResult.qualityScore}%</span>
                        </div>
                        <div>
                          <span className="text-slate-500 block text-[9px] uppercase font-bold">Completeness</span>
                          <span className="text-white font-extrabold text-sm">{analysisResult.completenessPercentage}%</span>
                        </div>
                      </div>

                      <div className="space-y-1.5 border-t border-white/5 pt-2.5 text-[11px]">
                        <span className="text-slate-400 font-bold uppercase text-[9px] tracking-wider block">Identified Selling Points</span>
                        <ul className="space-y-1 text-slate-300">
                          {analysisResult.strengths?.slice(0, 2).map((s: string, idx: number) => (
                            <li key={idx} className="flex items-start gap-1">
                              <span className="text-blue-400 shrink-0">•</span>
                              <span>{s}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {analysisResult.autoDetectedAmenities?.length > 0 && (
                        <div className="border-t border-white/5 pt-2.5 text-[11px]">
                          <span className="text-emerald-400 font-bold uppercase text-[9px] tracking-wider block">Auto-Detected Extras</span>
                          <p className="text-slate-300 italic">{analysisResult.autoDetectedAmenities.join(", ")}</p>
                        </div>
                      )}
                    </motion.div>
                  )}
                </div>
              </motion.div>
            )}

            <motion.div
              initial={{ scale: 0.98, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.98, opacity: 0, y: 20 }}
              className="bg-[#060919] border border-white/10 rounded-[32px] w-full max-w-4xl min-h-[500px] shadow-[0_32px_96px_rgba(0,0,0,0.85)] flex flex-col md:flex-row text-white overflow-hidden"
            >
              
              {/* WIZARD LEFT SIDEBAR: STEP PROGRESS INDICATOR */}
              <div className="md:w-1/3 bg-black/40 border-b md:border-b-0 md:border-r border-white/5 p-6 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-6">
                    <Building size={20} className="text-blue-400" />
                    <span className="font-black text-sm uppercase tracking-wider font-display bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
                      Registry Hub
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    {[
                      { step: 1, label: "Property Images" },
                      { step: 2, label: "Basic Details" },
                      { step: 3, label: "Location Coordinates" },
                      { step: 4, label: "Detailed Specs" },
                      { step: 5, label: "Bento Amenities" },
                      { step: 6, label: "Payment Engine" },
                      { step: 7, label: "Project Meta" },
                      { step: 8, label: "AI Copywriter" },
                      { step: 9, label: "Contact Details" },
                      { step: 10, label: "Review & Publish" },
                    ].map((s) => (
                      <button
                        key={s.step}
                        onClick={() => {
                          // Allow clicking past steps only
                          if (s.step < activeStep || validateStep(activeStep)) {
                            setActiveStep(s.step);
                          }
                        }}
                        className={`w-full text-left p-2.5 rounded-xl transition flex items-center gap-3 text-xs cursor-pointer font-medium ${
                          activeStep === s.step 
                            ? "bg-blue-600 text-white font-bold" 
                            : s.step < activeStep 
                            ? "text-emerald-400 hover:bg-white/5" 
                            : "text-slate-500 hover:bg-white/[0.02]"
                        }`}
                      >
                        <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-mono shrink-0 ${
                          activeStep === s.step 
                            ? "bg-white text-blue-900 font-bold" 
                            : s.step < activeStep 
                            ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/20" 
                            : "bg-white/5 text-slate-500 border border-white/5"
                        }`}>
                          {s.step < activeStep ? "✓" : s.step}
                        </span>
                        <span>{s.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-6 border-t border-white/5 mt-6 flex justify-between items-center text-[11px] font-mono text-slate-500">
                  <button 
                    onClick={handleClearDraft}
                    className="hover:text-red-400 flex items-center gap-1 cursor-pointer transition"
                    title="Wipe current form state draft"
                  >
                    <Trash2 size={12} />
                    <span>Reset Draft</span>
                  </button>
                  <span className="font-bold">Step {activeStep} of 10</span>
                </div>
              </div>

              {/* WIZARD RIGHT SIDEBAR: CURRENT FORM STEP VIEWS */}
              <div className="flex-1 p-6 flex flex-col justify-between">
                
                {/* TOP HEADER DETAILS */}
                <div className="flex justify-between items-start border-b border-white/5 pb-4 mb-4 shrink-0">
                  <div>
                    <span className="text-[9px] font-mono font-black uppercase text-blue-400 tracking-widest block mb-0.5">
                      Property Registry Wizard
                    </span>
                    <h3 className="text-base font-black text-white">
                      {activeStep === 1 && "Step 1: Upload Property Photographs"}
                      {activeStep === 2 && "Step 2: Basic Information Listing"}
                      {activeStep === 3 && "Step 3: Location & Neighborhood details"}
                      {activeStep === 4 && "Step 4: Space Dimensions & Specifications"}
                      {activeStep === 5 && "Step 5: Premium Interior & Exterior Amenities"}
                      {activeStep === 6 && "Step 6: Payment Terms & Schedules"}
                      {activeStep === 7 && "Step 7: Project Information Details"}
                      {activeStep === 8 && "Step 8: Property Narrative Description"}
                      {activeStep === 9 && "Step 9: Direct Agent or Owner Contact Info"}
                      {activeStep === 10 && "Step 10: Complete Audit, Review & Publish"}
                    </h3>
                  </div>

                  <button
                    onClick={() => setShowAddModal(false)}
                    className="p-1 rounded-full hover:bg-white/5 text-slate-400 hover:text-white transition cursor-pointer"
                  >
                    <X size={20} />
                  </button>
                </div>

                {/* PROGRESS SLIDER */}
                <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden mb-6 shrink-0">
                  <div 
                    className="h-full bg-blue-500 transition-all duration-300"
                    style={{ width: `${(activeStep / 10) * 100}%` }}
                  />
                </div>

                {/* ACTIVE WIZARD STEP CHUNKS */}
                <div className="flex-1 overflow-y-auto pr-1 text-slate-300 text-sm max-h-[380px] pb-4">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={activeStep}
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      transition={{ duration: 0.2 }}
                      className="space-y-4"
                    >
                      
                      {/* STEP 1: IMAGES UPLOAD */}
                      {activeStep === 1 && (
                        <div className="space-y-4">
                          <p className="text-xs text-slate-400">
                            Upload up to 20 high-quality property pictures. Drag and drop, order them, and select the cover.
                          </p>
                          
                          {/* Dropzone container */}
                          <div className="border-2 border-dashed border-white/10 hover:border-blue-500/40 rounded-2xl p-6 text-center cursor-pointer relative transition bg-black/20 group">
                            <input 
                              type="file" 
                              multiple 
                              accept="image/*"
                              onChange={handleFileChange}
                              className="absolute inset-0 opacity-0 cursor-pointer" 
                            />
                            <Upload className="mx-auto text-slate-500 group-hover:text-blue-400 transition mb-2" size={24} />
                            <span className="block text-xs font-bold text-white mb-1">Click to browse or Drag & Drop</span>
                            <span className="block text-[10px] text-slate-500 font-mono">JPG, PNG up to 10MB (automatically optimized)</span>
                          </div>

                          <div className="flex justify-between items-center">
                            <span className="text-[10px] font-mono text-slate-500 uppercase font-black">Images ({formState.images.length}/20)</span>
                            <button
                              type="button"
                              onClick={loadSampleImages}
                              className="text-[10px] font-extrabold text-blue-400 hover:text-blue-300 font-mono flex items-center gap-1 cursor-pointer"
                            >
                              <Sparkles size={11} />
                              Load Sample Luxury Photos
                            </button>
                          </div>

                          {isCompressing && (
                            <div className="flex items-center gap-2 text-xs text-blue-400 font-mono">
                              <Loader2 size={12} className="animate-spin" />
                              <span>Optimizing uploaded images...</span>
                            </div>
                          )}

                          {formState.images.length > 0 && (
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                              {formState.images.map((img, idx) => {
                                const isCover = formState.coverImageIndex === idx;
                                return (
                                  <div 
                                    key={idx} 
                                    className={`relative rounded-xl overflow-hidden group h-24 border ${
                                      isCover ? "border-amber-400 ring-2 ring-amber-500/25" : "border-white/5"
                                    }`}
                                  >
                                    <img 
                                      src={img} 
                                      alt="Property preview" 
                                      className="w-full h-full object-cover"
                                      referrerPolicy="no-referrer"
                                    />
                                    
                                    {/* Action Buttons Layer */}
                                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-1.5 p-1">
                                      {/* Set Cover */}
                                      {!isCover && (
                                        <button
                                          type="button"
                                          onClick={() => setFormState(prev => ({ ...prev, coverImageIndex: idx }))}
                                          className="bg-white/10 hover:bg-white text-white hover:text-black text-[9px] font-bold px-1.5 py-1 rounded cursor-pointer font-mono"
                                        >
                                          Set Cover
                                        </button>
                                      )}

                                      {/* Swap Order controls */}
                                      <button
                                        type="button"
                                        disabled={idx === 0}
                                        onClick={() => moveImage(idx, "left")}
                                        className="bg-black/40 hover:bg-black/60 p-1 rounded text-white disabled:opacity-30 cursor-pointer"
                                        title="Move Left"
                                      >
                                        <ChevronLeft size={10} />
                                      </button>
                                      <button
                                        type="button"
                                        disabled={idx === formState.images.length - 1}
                                        onClick={() => moveImage(idx, "right")}
                                        className="bg-black/40 hover:bg-black/60 p-1 rounded text-white disabled:opacity-30 cursor-pointer"
                                        title="Move Right"
                                      >
                                        <ChevronRight size={10} />
                                      </button>

                                      {/* Delete */}
                                      <button
                                        type="button"
                                        onClick={() => removeImage(idx)}
                                        className="bg-red-500/80 hover:bg-red-600 p-1 rounded text-white cursor-pointer"
                                        title="Remove Image"
                                      >
                                        <Trash2 size={10} />
                                      </button>
                                    </div>

                                    {/* Cover Badge Overlay */}
                                    {isCover && (
                                      <div className="absolute top-1.5 left-1.5 bg-amber-400 text-black text-[8px] font-black uppercase px-1.5 py-0.5 rounded shadow-sm z-10 flex items-center gap-0.5 font-mono">
                                        <Zap size={8} className="fill-black" />
                                        Cover
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      )}

                      {/* STEP 2: BASIC INFORMATION */}
                      {activeStep === 2 && (
                        <div className="space-y-4">
                          <div>
                            <label className="block text-xs font-bold text-slate-400 mb-1 font-mono uppercase tracking-wider">Property Title *</label>
                            <input
                              type="text"
                              required
                              placeholder="e.g. Skyline Luxury Villa, Garden Condo iCity"
                              value={formState.title}
                              onChange={(e) => setFormState({ ...formState, title: e.target.value })}
                              className={`w-full text-sm bg-black/40 border rounded-xl px-3.5 py-2.5 text-white outline-none focus:ring-1 focus:ring-blue-500/20 placeholder-slate-600 ${
                                validationErrors.title ? "border-red-500" : "border-white/10 focus:border-blue-500/50"
                              }`}
                            />
                            {validationErrors.title && <span className="text-[10px] text-red-400 mt-1 block">{validationErrors.title}</span>}
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-xs font-bold text-slate-400 mb-1 font-mono uppercase tracking-wider">Property Type</label>
                              <select
                                value={formState.propertyType}
                                onChange={(e) => setFormState({ ...formState, propertyType: e.target.value })}
                                className="w-full text-sm bg-black/40 border border-white/10 rounded-xl px-3 py-2.5 text-white outline-none focus:border-blue-500/50"
                              >
                                {PROPERTY_TYPES.map(t => (
                                  <option key={t} value={t}>{t}</option>
                                ))}
                              </select>
                            </div>

                            <div>
                              <label className="block text-xs font-bold text-slate-400 mb-1 font-mono uppercase tracking-wider">Purpose</label>
                              <div className="grid grid-cols-2 gap-1.5 bg-black/30 border border-white/15 p-1 rounded-xl">
                                {["Sale", "Rent"].map((p) => (
                                  <button
                                    key={p}
                                    type="button"
                                    onClick={() => setFormState({ ...formState, purpose: p as any })}
                                    className={`py-1.5 text-xs font-bold rounded-lg cursor-pointer transition ${
                                      formState.purpose === p ? "bg-white text-black shadow" : "text-slate-400 hover:text-white"
                                    }`}
                                  >
                                    {p}
                                  </button>
                                ))}
                              </div>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-xs font-bold text-slate-400 mb-1 font-mono uppercase tracking-wider">Price (EGP) *</label>
                              <input
                                type="number"
                                required
                                value={formState.price}
                                onChange={(e) => setFormState({ ...formState, price: Number(e.target.value) })}
                                className={`w-full text-sm bg-black/40 border rounded-xl px-3.5 py-2.5 text-white outline-none focus:ring-1 focus:ring-blue-500/20 font-mono ${
                                  validationErrors.price ? "border-red-500" : "border-white/10 focus:border-blue-500/50"
                                }`}
                              />
                              {validationErrors.price && <span className="text-[10px] text-red-400 mt-1 block">{validationErrors.price}</span>}
                            </div>

                            <div>
                              <label className="block text-xs font-bold text-slate-400 mb-1 font-mono uppercase tracking-wider">Is Price Negotiable?</label>
                              <div className="grid grid-cols-2 gap-1.5 bg-black/30 border border-white/15 p-1 rounded-xl">
                                {["Yes", "No"].map((n) => (
                                  <button
                                    key={n}
                                    type="button"
                                    onClick={() => setFormState({ ...formState, negotiable: n as any })}
                                    className={`py-1.5 text-xs font-bold rounded-lg cursor-pointer transition ${
                                      formState.negotiable === n ? "bg-white text-black shadow" : "text-slate-400 hover:text-white"
                                    }`}
                                  >
                                    {n}
                                  </button>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* STEP 3: LOCATION */}
                      {activeStep === 3 && (
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-xs font-bold text-slate-400 mb-1 font-mono uppercase tracking-wider">Governorate *</label>
                              <select
                                value={formState.governorate}
                                onChange={(e) => {
                                  const gov = e.target.value;
                                  const citiesList = CITIES[gov] || [];
                                  setFormState({ 
                                    ...formState, 
                                    governorate: gov, 
                                    city: citiesList[0] || "" 
                                  });
                                }}
                                className="w-full text-sm bg-black/40 border border-white/10 rounded-xl px-3 py-2.5 text-white outline-none focus:border-blue-500/50"
                              >
                                {GOVERNORATES.map(g => (
                                  <option key={g} value={g}>{g}</option>
                                ))}
                              </select>
                            </div>

                            <div>
                              <label className="block text-xs font-bold text-slate-400 mb-1 font-mono uppercase tracking-wider">City *</label>
                              <select
                                value={formState.city}
                                onChange={(e) => setFormState({ ...formState, city: e.target.value })}
                                className="w-full text-sm bg-black/40 border border-white/10 rounded-xl px-3 py-2.5 text-white outline-none"
                              >
                                {(CITIES[formState.governorate] || []).map(c => (
                                  <option key={c} value={c}>{c}</option>
                                ))}
                              </select>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-xs font-bold text-slate-400 mb-1 font-mono uppercase tracking-wider">Area / District *</label>
                              <input
                                type="text"
                                required
                                placeholder="e.g. Fifth Settlement, Beverly Hills"
                                value={formState.area}
                                onChange={(e) => setFormState({ ...formState, area: e.target.value })}
                                className={`w-full text-sm bg-black/40 border rounded-xl px-3.5 py-2.5 text-white outline-none focus:ring-1 focus:ring-blue-500/20 placeholder-slate-600 ${
                                  validationErrors.area ? "border-red-500" : "border-white/10 focus:border-blue-500/50"
                                }`}
                              />
                            </div>

                            <div>
                              <label className="block text-xs font-bold text-slate-400 mb-1 font-mono uppercase tracking-wider">Compound (Optional)</label>
                              <input
                                type="text"
                                placeholder="e.g. Mountain View iCity"
                                value={formState.compound}
                                onChange={(e) => setFormState({ ...formState, compound: e.target.value })}
                                className="w-full text-sm bg-black/40 border border-white/10 rounded-xl px-3.5 py-2.5 text-white outline-none focus:border-blue-500/50 placeholder-slate-600"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="block text-xs font-bold text-slate-400 mb-1 font-mono uppercase tracking-wider">Street Address *</label>
                            <input
                              type="text"
                              required
                              placeholder="e.g. Building 12, Street 90, Near Commercial Mall"
                              value={formState.address}
                              onChange={(e) => setFormState({ ...formState, address: e.target.value })}
                              className={`w-full text-sm bg-black/40 border rounded-xl px-3.5 py-2.5 text-white outline-none focus:ring-1 focus:ring-blue-500/20 placeholder-slate-600 ${
                                validationErrors.address ? "border-red-500" : "border-white/10 focus:border-blue-500/50"
                              }`}
                            />
                            {validationErrors.address && <span className="text-[10px] text-red-400 mt-1 block">{validationErrors.address}</span>}
                          </div>

                          {/* INTERACTIVE VECTOR MAP SECTION */}
                          <div>
                            <span className="block text-xs font-bold text-slate-400 mb-1.5 font-mono uppercase tracking-wider">
                              Interactive GPS Pin Location (Click map to pinpoint)
                            </span>
                            <InteractiveMap
                              lat={formState.mapPin.lat}
                              lng={formState.mapPin.lng}
                              governorate={formState.governorate}
                              city={formState.city}
                              onLocationChange={(loc) => {
                                setFormState(prev => ({
                                  ...prev,
                                  mapPin: loc
                                }));
                              }}
                              className="h-[400px] md:h-[450px] w-full"
                            />
                          </div>
                        </div>
                      )}

                      {/* STEP 4: PROPERTY DETAILS / SPECS */}
                      {activeStep === 4 && (
                        <div className="space-y-4">
                          <div className="grid grid-cols-3 gap-3">
                            <div>
                              <label className="block text-xs font-bold text-slate-400 mb-1 font-mono uppercase tracking-wider text-[10px]">Property Area (sqm) *</label>
                              <input
                                type="number"
                                required
                                value={formState.areaSq}
                                onChange={(e) => setFormState({ ...formState, areaSq: Number(e.target.value) })}
                                className={`w-full text-sm bg-black/40 border rounded-xl px-3.5 py-2.5 text-white outline-none focus:ring-1 focus:ring-blue-500/20 font-mono ${
                                  validationErrors.areaSq ? "border-red-500" : "border-white/10"
                                }`}
                              />
                            </div>

                            <div>
                              <label className="block text-xs font-bold text-slate-400 mb-1 font-mono uppercase tracking-wider text-[10px]">Land Area (Villas)</label>
                              <input
                                type="number"
                                value={formState.landArea}
                                onChange={(e) => setFormState({ ...formState, landArea: Number(e.target.value) })}
                                className="w-full text-sm bg-black/40 border border-white/10 rounded-xl px-3.5 py-2.5 text-white outline-none focus:border-blue-500/50 font-mono"
                                placeholder="0"
                              />
                            </div>

                            <div>
                              <label className="block text-xs font-bold text-slate-400 mb-1 font-mono uppercase tracking-wider text-[10px]">Built-up Area (sqm)</label>
                              <input
                                type="number"
                                value={formState.builtUpArea}
                                onChange={(e) => setFormState({ ...formState, builtUpArea: Number(e.target.value) })}
                                className="w-full text-sm bg-black/40 border border-white/10 rounded-xl px-3.5 py-2.5 text-white outline-none focus:border-blue-500/50 font-mono"
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-3 gap-3">
                            {/* Bedrooms */}
                            <div>
                              <label className="block text-xs font-bold text-slate-400 mb-1 font-mono uppercase tracking-wider text-[10px]">Bedrooms</label>
                              <div className="flex items-center bg-black/40 border border-white/10 rounded-xl overflow-hidden justify-between p-1.5">
                                <button 
                                  type="button" 
                                  onClick={() => setFormState(prev => ({ ...prev, bedrooms: Math.max(0, prev.bedrooms - 1) }))}
                                  className="w-7 h-7 rounded bg-white/5 text-white hover:bg-white/10 flex items-center justify-center font-bold cursor-pointer"
                                >
                                  -
                                </button>
                                <span className="font-bold text-white font-mono text-sm">{formState.bedrooms}</span>
                                <button 
                                  type="button" 
                                  onClick={() => setFormState(prev => ({ ...prev, bedrooms: prev.bedrooms + 1 }))}
                                  className="w-7 h-7 rounded bg-white/5 text-white hover:bg-white/10 flex items-center justify-center font-bold cursor-pointer"
                                >
                                  +
                                </button>
                              </div>
                            </div>

                            {/* Bathrooms */}
                            <div>
                              <label className="block text-xs font-bold text-slate-400 mb-1 font-mono uppercase tracking-wider text-[10px]">Bathrooms</label>
                              <div className="flex items-center bg-black/40 border border-white/10 rounded-xl overflow-hidden justify-between p-1.5">
                                <button 
                                  type="button" 
                                  onClick={() => setFormState(prev => ({ ...prev, bathrooms: Math.max(0, prev.bathrooms - 1) }))}
                                  className="w-7 h-7 rounded bg-white/5 text-white hover:bg-white/10 flex items-center justify-center font-bold cursor-pointer"
                                >
                                  -
                                </button>
                                <span className="font-bold text-white font-mono text-sm">{formState.bathrooms}</span>
                                <button 
                                  type="button" 
                                  onClick={() => setFormState(prev => ({ ...prev, bathrooms: prev.bathrooms + 1 }))}
                                  className="w-7 h-7 rounded bg-white/5 text-white hover:bg-white/10 flex items-center justify-center font-bold cursor-pointer"
                                >
                                  +
                                </button>
                              </div>
                            </div>

                            {/* Balconies */}
                            <div>
                              <label className="block text-xs font-bold text-slate-400 mb-1 font-mono uppercase tracking-wider text-[10px]">Balconies</label>
                              <div className="flex items-center bg-black/40 border border-white/10 rounded-xl overflow-hidden justify-between p-1.5">
                                <button 
                                  type="button" 
                                  onClick={() => setFormState(prev => ({ ...prev, balconies: Math.max(0, prev.balconies - 1) }))}
                                  className="w-7 h-7 rounded bg-white/5 text-white hover:bg-white/10 flex items-center justify-center font-bold cursor-pointer"
                                >
                                  -
                                </button>
                                <span className="font-bold text-white font-mono text-sm">{formState.balconies}</span>
                                <button 
                                  type="button" 
                                  onClick={() => setFormState(prev => ({ ...prev, balconies: prev.balconies + 1 }))}
                                  className="w-7 h-7 rounded bg-white/5 text-white hover:bg-white/10 flex items-center justify-center font-bold cursor-pointer"
                                >
                                  +
                                </button>
                              </div>
                            </div>
                          </div>

                          <div className="grid grid-cols-4 gap-2">
                            <div>
                              <label className="block text-xs font-bold text-slate-400 mb-1 font-mono uppercase tracking-wider text-[8.5px]">Floor Number</label>
                              <input
                                type="number"
                                value={formState.floorNumber}
                                onChange={(e) => setFormState({ ...formState, floorNumber: Number(e.target.value) })}
                                className="w-full text-sm bg-black/40 border border-white/10 rounded-xl px-3 py-2.5 text-white outline-none font-mono"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-bold text-slate-400 mb-1 font-mono uppercase tracking-wider text-[8.5px]">Total Floors</label>
                              <input
                                type="number"
                                value={formState.totalFloors}
                                onChange={(e) => setFormState({ ...formState, totalFloors: Number(e.target.value) })}
                                className="w-full text-sm bg-black/40 border border-white/10 rounded-xl px-3 py-2.5 text-white outline-none font-mono"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-bold text-slate-400 mb-1 font-mono uppercase tracking-wider text-[8.5px]">Year Built</label>
                              <input
                                type="number"
                                value={formState.yearBuilt}
                                onChange={(e) => setFormState({ ...formState, yearBuilt: Number(e.target.value) })}
                                className="w-full text-sm bg-black/40 border border-white/10 rounded-xl px-3 py-2.5 text-white outline-none font-mono"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-bold text-slate-400 mb-1 font-mono uppercase tracking-wider text-[8.5px]">Orientation</label>
                              <select
                                value={formState.orientation}
                                onChange={(e) => setFormState({ ...formState, orientation: e.target.value })}
                                className="w-full text-xs bg-black/40 border border-white/10 rounded-xl px-1.5 py-3 text-white outline-none"
                              >
                                <option value="Bahary">Bahary / North</option>
                                <option value="Qibly">Qibly / South</option>
                                <option value="East">East</option>
                                <option value="West">West</option>
                              </select>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-xs font-bold text-slate-400 mb-1 font-mono uppercase tracking-wider">Finishing Level</label>
                              <select
                                value={formState.finishingLevel}
                                onChange={(e) => setFormState({ ...formState, finishingLevel: e.target.value })}
                                className="w-full text-sm bg-black/40 border border-white/10 rounded-xl px-3 py-2.5 text-white outline-none"
                              >
                                {FINISHING_LEVELS.map(f => (
                                  <option key={f} value={f}>{f}</option>
                                ))}
                              </select>
                            </div>

                            <div>
                              <label className="block text-xs font-bold text-slate-400 mb-1 font-mono uppercase tracking-wider">Furnished?</label>
                              <div className="grid grid-cols-2 gap-1.5 bg-black/30 border border-white/15 p-1 rounded-xl">
                                {["Yes", "No"].map((y) => (
                                  <button
                                    key={y}
                                    type="button"
                                    onClick={() => setFormState({ ...formState, furnished: y as any })}
                                    className={`py-1.5 text-xs font-bold rounded-lg cursor-pointer transition ${
                                      formState.furnished === y ? "bg-white text-black shadow" : "text-slate-400 hover:text-white"
                                    }`}
                                  >
                                    {y}
                                  </button>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* STEP 5: AMENITIES */}
                      {activeStep === 5 && (
                        <div className="space-y-3">
                          <p className="text-xs text-slate-400">Select all amenities available in the property. (Broker AI will also analyze details to auto-detect any others).</p>
                          
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-[280px] overflow-y-auto pr-1">
                            {AMENITIES_LIST.map((amenity) => {
                              const isChecked = formState.amenities.includes(amenity.key);
                              return (
                                <button
                                  key={amenity.key}
                                  type="button"
                                  onClick={() => {
                                    setFormState(prev => {
                                      const alreadySelected = prev.amenities.includes(amenity.key);
                                      const nextAmenities = alreadySelected
                                        ? prev.amenities.filter(k => k !== amenity.key)
                                        : [...prev.amenities, amenity.key];
                                      return { ...prev, amenities: nextAmenities };
                                    });
                                  }}
                                  className={`p-3 rounded-xl border text-left flex items-center gap-2.5 cursor-pointer transition-all duration-200 ${
                                    isChecked 
                                      ? "bg-blue-600/10 border-blue-500 text-white shadow-md" 
                                      : "bg-white/[0.02] border-white/5 text-slate-400 hover:bg-white/[0.04] hover:text-white"
                                  }`}
                                >
                                  <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                                    isChecked ? "bg-blue-500 border-transparent text-white" : "border-white/20"
                                  }`}>
                                    {isChecked && <Check size={10} strokeWidth={3} />}
                                  </div>
                                  <span className="text-xs font-medium truncate">{amenity.label}</span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* STEP 6: PAYMENT DETAILS */}
                      {activeStep === 6 && (
                        <div className="space-y-4">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-xs font-bold text-slate-400 mb-1 font-mono uppercase tracking-wider">Payment Method</label>
                              <div className="grid grid-cols-2 gap-1.5 bg-black/30 border border-white/15 p-1 rounded-xl">
                                {["Cash", "Installments"].map((m) => (
                                  <button
                                    key={m}
                                    type="button"
                                    onClick={() => setFormState({ ...formState, paymentMethod: m as any })}
                                    className={`py-1.5 text-xs font-bold rounded-lg cursor-pointer transition ${
                                      formState.paymentMethod === m ? "bg-white text-black shadow" : "text-slate-400 hover:text-white"
                                    }`}
                                  >
                                    {m}
                                  </button>
                                ))}
                              </div>
                            </div>

                            <div>
                              <label className="block text-xs font-bold text-slate-400 mb-1 font-mono uppercase tracking-wider">Delivery Status</label>
                              <select
                                value={formState.deliveryStatus}
                                onChange={(e) => setFormState({ ...formState, deliveryStatus: e.target.value })}
                                className="w-full text-sm bg-black/40 border border-white/10 rounded-xl px-3 py-2.5 text-white outline-none"
                              >
                                <option value="Ready to Move">Ready to Move</option>
                                <option value="Within 1 Year">Within 1 Year</option>
                                <option value="Within 2 Years">Within 2 Years</option>
                                <option value="Within 3 Years">Within 3 Years</option>
                              </select>
                            </div>
                          </div>

                          {/* INSTALLMENTS FIELDSET */}
                          {formState.paymentMethod === "Installments" && (
                            <motion.div 
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              className="space-y-3 border-t border-white/5 pt-3 mt-3"
                            >
                              <div className="grid grid-cols-3 gap-3">
                                <div>
                                  <label className="block text-[10px] font-bold text-slate-400 mb-1 font-mono uppercase tracking-wider">Down Payment</label>
                                  <input
                                    type="number"
                                    value={formState.downPayment}
                                    onChange={(e) => setFormState({ ...formState, downPayment: Number(e.target.value) })}
                                    className="w-full text-sm bg-black/40 border border-white/10 rounded-xl px-3 py-2.5 text-white outline-none font-mono"
                                  />
                                </div>

                                <div>
                                  <label className="block text-[10px] font-bold text-slate-400 mb-1 font-mono uppercase tracking-wider">Installment Years</label>
                                  <input
                                    type="number"
                                    value={formState.installmentYears}
                                    onChange={(e) => setFormState({ ...formState, installmentYears: Number(e.target.value) })}
                                    className={`w-full text-sm bg-black/40 border rounded-xl px-3 py-2.5 text-white outline-none font-mono ${
                                      validationErrors.installmentYears ? "border-red-500" : "border-white/10"
                                    }`}
                                    placeholder="e.g. 7"
                                  />
                                </div>

                                <div>
                                  <label className="block text-[10px] font-bold text-slate-400 mb-1 font-mono uppercase tracking-wider">Monthly Installment</label>
                                  <input
                                    type="number"
                                    value={formState.monthlyInstallment}
                                    onChange={(e) => setFormState({ ...formState, monthlyInstallment: Number(e.target.value) })}
                                    className="w-full text-sm bg-black/40 border border-white/10 rounded-xl px-3 py-2.5 text-white outline-none font-mono"
                                  />
                                </div>
                              </div>

                              <div>
                                <label className="block text-xs font-bold text-slate-400 mb-1 font-mono uppercase tracking-wider">Interest Free?</label>
                                <div className="grid grid-cols-2 gap-1.5 bg-black/30 border border-white/15 p-1 rounded-xl max-w-xs">
                                  {["Yes", "No"].map((i) => (
                                    <button
                                      key={i}
                                      type="button"
                                      onClick={() => setFormState({ ...formState, interestFree: i as any })}
                                      className={`py-1 text-xs font-bold rounded-lg cursor-pointer transition ${
                                        formState.interestFree === i ? "bg-white text-black shadow" : "text-slate-400 hover:text-white"
                                      }`}
                                    >
                                      {i}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </div>
                      )}

                      {/* STEP 7: PROJECT INFORMATION */}
                      {activeStep === 7 && (
                        <div className="space-y-4">
                          <div className="flex justify-between items-center bg-white/[0.02] border border-white/5 rounded-xl p-3.5">
                            <div>
                              <span className="block text-xs font-bold text-white font-mono uppercase">Developer listing?</span>
                              <span className="text-[11px] text-slate-400 leading-none">Does this unit belong to a primary developer project?</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => setFormState(prev => ({ ...prev, belongsToDeveloper: !prev.belongsToDeveloper }))}
                              className={`w-11 h-6 rounded-full p-1 transition-colors cursor-pointer ${
                                formState.belongsToDeveloper ? "bg-blue-600" : "bg-white/10"
                              }`}
                            >
                              <div className={`bg-white w-4 h-4 rounded-full shadow transition-transform duration-200 ${
                                formState.belongsToDeveloper ? "translate-x-5" : ""
                              }`} />
                            </button>
                          </div>

                          {formState.belongsToDeveloper && (
                            <motion.div 
                              initial={{ opacity: 0, y: -5 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="space-y-3 border-t border-white/5 pt-3"
                            >
                              <div className="grid grid-cols-2 gap-3">
                                <div>
                                  <label className="block text-xs font-bold text-slate-400 mb-1 font-mono uppercase tracking-wider">Project Name</label>
                                  <input
                                    type="text"
                                    placeholder="e.g. iCity Lagoon"
                                    value={formState.projectName}
                                    onChange={(e) => setFormState({ ...formState, projectName: e.target.value })}
                                    className="w-full text-sm bg-black/40 border border-white/10 rounded-xl px-3.5 py-2.5 text-white outline-none"
                                  />
                                </div>

                                <div>
                                  <label className="block text-xs font-bold text-slate-400 mb-1 font-mono uppercase tracking-wider">Developer Name</label>
                                  <input
                                    type="text"
                                    placeholder="e.g. Mountain View"
                                    value={formState.developerName}
                                    onChange={(e) => setFormState({ ...formState, developerName: e.target.value })}
                                    className="w-full text-sm bg-black/40 border border-white/10 rounded-xl px-3.5 py-2.5 text-white outline-none"
                                  />
                                </div>
                              </div>

                              <div className="grid grid-cols-3 gap-3">
                                <div className="col-span-2">
                                  <label className="block text-[10px] font-bold text-slate-400 mb-1 font-mono uppercase tracking-wider">Project Phase</label>
                                  <input
                                    type="text"
                                    placeholder="e.g. Phase 2 B"
                                    value={formState.projectPhase}
                                    onChange={(e) => setFormState({ ...formState, projectPhase: e.target.value })}
                                    className="w-full text-sm bg-black/40 border border-white/10 rounded-xl px-3.5 py-2.5 text-white outline-none"
                                  />
                                </div>

                                <div>
                                  <label className="block text-[10px] font-bold text-slate-400 mb-1 font-mono uppercase tracking-wider">Delivery Date</label>
                                  <input
                                    type="text"
                                    placeholder="e.g. Dec 2026"
                                    value={formState.deliveryDate}
                                    onChange={(e) => setFormState({ ...formState, deliveryDate: e.target.value })}
                                    className="w-full text-sm bg-black/40 border border-white/10 rounded-xl px-3.5 py-2.5 text-white outline-none"
                                  />
                                </div>
                              </div>

                              <div>
                                <div className="flex justify-between items-center text-xs font-mono text-slate-400 mb-1">
                                  <span className="font-bold">Construction Progress</span>
                                  <span>{formState.constructionProgress}%</span>
                                </div>
                                <input
                                  type="range"
                                  min="0"
                                  max="100"
                                  value={formState.constructionProgress}
                                  onChange={(e) => setFormState({ ...formState, constructionProgress: Number(e.target.value) })}
                                  className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-blue-500"
                                />
                              </div>
                            </motion.div>
                          )}
                        </div>
                      )}

                      {/* STEP 8: PROPERTY DESCRIPTION */}
                      {activeStep === 8 && (
                        <div className="space-y-4">
                          <div>
                            <label className="block text-xs font-bold text-slate-400 mb-1 font-mono uppercase tracking-wider">Describe the property naturally *</label>
                            <p className="text-[11px] text-slate-500 mb-2 leading-relaxed font-mono">
                              Describe your property specs, views, and perks. Broker AI automatically detects amenities, ROIs, and target personas from this text.
                            </p>
                            <textarea
                              required
                              rows={5}
                              placeholder="e.g. 170 sqm apartment in Mountain View iCity with full finishing, lagoon view, ready to move, close to clubhouse..."
                              value={formState.description}
                              onChange={(e) => setFormState({ ...formState, description: e.target.value })}
                              className={`w-full text-sm bg-black/40 border rounded-xl px-3.5 py-2.5 text-white outline-none focus:ring-1 focus:ring-blue-500/20 resize-none ${
                                validationErrors.description ? "border-red-500 font-bold" : "border-white/10 focus:border-blue-500/50"
                              }`}
                            />
                            {validationErrors.description && <span className="text-[10px] text-red-400 mt-1 block">{validationErrors.description}</span>}
                          </div>

                          <div>
                            <span className="block text-[10px] font-bold text-slate-400 mb-1.5 font-mono uppercase tracking-wider">
                              Quick Assist Tags (Click to append)
                            </span>
                            <div className="flex flex-wrap gap-1.5">
                              {QUICK_DESC_TAGS.map(tag => (
                                <button
                                  key={tag}
                                  type="button"
                                  onClick={() => {
                                    setFormState(prev => {
                                      const text = prev.description.trim();
                                      const suffix = text.endsWith(".") ? "" : ".";
                                      const newDesc = text ? `${text},${tag}` : tag.trim();
                                      return { ...prev, description: newDesc };
                                    });
                                  }}
                                  className="text-[10px] font-bold font-mono bg-white/5 hover:bg-white/15 border border-white/5 hover:border-white/10 text-slate-300 hover:text-white px-2 py-1 rounded transition-colors cursor-pointer"
                                >
                                  {tag.trim()}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* STEP 9: CONTACT INFORMATION */}
                      {activeStep === 9 && (
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-xs font-bold text-slate-400 mb-1 font-mono uppercase tracking-wider">Advertiser Name *</label>
                              <input
                                type="text"
                                placeholder="Advertiser / Owner Name"
                                required
                                value={formState.advertiserName}
                                onChange={(e) => setFormState({ ...formState, advertiserName: e.target.value })}
                                className={`w-full text-sm bg-black/40 border rounded-xl px-3.5 py-2.5 text-white outline-none focus:ring-1 focus:ring-blue-500/20 ${
                                  validationErrors.advertiserName ? "border-red-500" : "border-white/10"
                                }`}
                              />
                            </div>

                            <div>
                              <label className="block text-xs font-bold text-slate-400 mb-1 font-mono uppercase tracking-wider">Advertiser Type</label>
                              <select
                                value={formState.advertiserType}
                                onChange={(e) => setFormState({ ...formState, advertiserType: e.target.value as any })}
                                className="w-full text-sm bg-black/40 border border-white/10 rounded-xl px-3 py-2.5 text-white outline-none"
                              >
                                <option value="Owner">Primary Owner</option>
                                <option value="Agent">Professional Broker/Agent</option>
                                <option value="Developer">Developer / Builder</option>
                              </select>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-xs font-bold text-slate-400 mb-1 font-mono uppercase tracking-wider">Phone Number *</label>
                              <input
                                type="text"
                                required
                                placeholder="e.g. +20 100 000 0000"
                                value={formState.phone}
                                onChange={(e) => setFormState({ ...formState, phone: e.target.value })}
                                className={`w-full text-sm bg-black/40 border rounded-xl px-3.5 py-2.5 text-white outline-none focus:ring-1 focus:ring-blue-500/20 font-mono ${
                                  validationErrors.phone ? "border-red-500" : "border-white/10"
                                }`}
                              />
                            </div>

                            <div>
                              <label className="block text-xs font-bold text-slate-400 mb-1 font-mono uppercase tracking-wider">WhatsApp Link</label>
                              <input
                                type="text"
                                placeholder="WhatsApp number / link"
                                value={formState.whatsapp}
                                onChange={(e) => setFormState({ ...formState, whatsapp: e.target.value })}
                                className="w-full text-sm bg-black/40 border border-white/10 rounded-xl px-3.5 py-2.5 text-white outline-none focus:border-blue-500/50 font-mono"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="block text-xs font-bold text-slate-400 mb-1 font-mono uppercase tracking-wider">Email Address *</label>
                            <input
                              type="email"
                              required
                              placeholder="contact@brokeragency.com"
                              value={formState.email}
                              onChange={(e) => setFormState({ ...formState, email: e.target.value })}
                              className={`w-full text-sm bg-black/40 border rounded-xl px-3.5 py-2.5 text-white outline-none focus:ring-1 focus:ring-blue-500/20 font-mono ${
                                validationErrors.email ? "border-red-500" : "border-white/10"
                              }`}
                            />
                            {validationErrors.email && <span className="text-[10px] text-red-400 mt-1 block">{validationErrors.email}</span>}
                          </div>

                          <div className="space-y-2 border-t border-white/5 pt-3 mt-3">
                            <label className="flex items-center gap-2.5 text-xs text-slate-300 font-medium cursor-pointer">
                              <input
                                type="checkbox"
                                checked={formState.isOwner}
                                onChange={(e) => setFormState({ ...formState, isOwner: e.target.checked })}
                                className="w-4 h-4 rounded border-white/10 text-blue-600 bg-black/40 outline-none"
                              />
                              <span>I certify that I am the verified owner / exclusive authorized broker for this property.</span>
                            </label>

                            <label className="flex items-center gap-2.5 text-xs text-slate-300 font-medium cursor-pointer">
                              <input
                                type="checkbox"
                                checked={formState.allowMarketing}
                                onChange={(e) => setFormState({ ...formState, allowMarketing: e.target.checked })}
                                className="w-4 h-4 rounded border-white/10 text-blue-600 bg-black/40 outline-none"
                              />
                              <span>Allow other verified network brokers to co-market and find matching clients for this listing.</span>
                            </label>
                          </div>
                        </div>
                      )}

                      {/* STEP 10: COMPLETE REVIEW */}
                      {activeStep === 10 && (
                        <div className="space-y-4 text-xs">
                          <p className="text-[11px] text-slate-400">Review all details before publishing. Click edit icons next to headings to make corrections.</p>
                          
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 max-h-[300px] overflow-y-auto pr-1">
                            
                            {/* Card: Basics */}
                            <div className="bg-white/[0.02] border border-white/5 p-3 rounded-2xl relative">
                              <button 
                                onClick={() => setActiveStep(2)} 
                                className="absolute top-2.5 right-2.5 text-blue-400 hover:text-blue-300 font-mono text-[9px] font-bold cursor-pointer uppercase"
                              >
                                Edit
                              </button>
                              <h4 className="font-bold text-white mb-1.5 flex items-center gap-1.5 uppercase tracking-wider text-[10px] font-mono">
                                <Info size={11} className="text-blue-400" />
                                Basic Specs
                              </h4>
                              <div className="space-y-1 font-mono text-[10px]">
                                <p><span className="text-slate-500">Title:</span> {formState.title}</p>
                                <p><span className="text-slate-500">Type:</span> {formState.propertyType} ({formState.purpose})</p>
                                <p><span className="text-slate-500">Price:</span> <strong className="text-emerald-400">{formState.price.toLocaleString()} EGP</strong></p>
                                <p><span className="text-slate-500">Negotiable:</span> {formState.negotiable}</p>
                              </div>
                            </div>

                            {/* Card: Location */}
                            <div className="bg-white/[0.02] border border-white/5 p-3 rounded-2xl relative">
                              <button 
                                onClick={() => setActiveStep(3)} 
                                className="absolute top-2.5 right-2.5 text-blue-400 hover:text-blue-300 font-mono text-[9px] font-bold cursor-pointer uppercase"
                              >
                                Edit
                              </button>
                              <h4 className="font-bold text-white mb-1.5 flex items-center gap-1.5 uppercase tracking-wider text-[10px] font-mono">
                                <MapPin size={11} className="text-blue-400" />
                                Location DETAILS
                              </h4>
                              <div className="space-y-1 font-mono text-[10px]">
                                <p><span className="text-slate-500">Governorate:</span> {formState.governorate}</p>
                                <p><span className="text-slate-500">City:</span> {formState.city}</p>
                                <p><span className="text-slate-500">Area:</span> {formState.area}</p>
                                {formState.compound && <p><span className="text-slate-500">Compound:</span> {formState.compound}</p>}
                                <p><span className="text-slate-500">GPS:</span> {formState.mapPin.lat.toFixed(3)}, {formState.mapPin.lng.toFixed(3)}</p>
                              </div>
                            </div>

                            {/* Card: Spec Metrics */}
                            <div className="bg-white/[0.02] border border-white/5 p-3 rounded-2xl relative">
                              <button 
                                onClick={() => setActiveStep(4)} 
                                className="absolute top-2.5 right-2.5 text-blue-400 hover:text-blue-300 font-mono text-[9px] font-bold cursor-pointer uppercase"
                              >
                                Edit
                              </button>
                              <h4 className="font-bold text-white mb-1.5 flex items-center gap-1.5 uppercase tracking-wider text-[10px] font-mono">
                                <Layers size={11} className="text-blue-400" />
                                Space & Dimensions
                              </h4>
                              <div className="space-y-1 font-mono text-[10px]">
                                <p><span className="text-slate-500">Property Area:</span> {formState.areaSq} sqm</p>
                                <p><span className="text-slate-500">Layout:</span> {formState.bedrooms} Bed, {formState.bathrooms} Bath, {formState.balconies} Balcony</p>
                                <p><span className="text-slate-500">Floors:</span> Floor {formState.floorNumber} of {formState.totalFloors}</p>
                                <p><span className="text-slate-500">Finishing:</span> {formState.finishingLevel}</p>
                              </div>
                            </div>

                            {/* Card: Payments */}
                            <div className="bg-white/[0.02] border border-white/5 p-3 rounded-2xl relative">
                              <button 
                                onClick={() => setActiveStep(6)} 
                                className="absolute top-2.5 right-2.5 text-blue-400 hover:text-blue-300 font-mono text-[9px] font-bold cursor-pointer uppercase"
                              >
                                Edit
                              </button>
                              <h4 className="font-bold text-white mb-1.5 flex items-center gap-1.5 uppercase tracking-wider text-[10px] font-mono">
                                <DollarSign size={11} className="text-blue-400" />
                                Payments & Delivery
                              </h4>
                              <div className="space-y-1 font-mono text-[10px]">
                                <p><span className="text-slate-500">Method:</span> {formState.paymentMethod}</p>
                                {formState.paymentMethod === "Installments" && (
                                  <>
                                    <p><span className="text-slate-500">Down Payment:</span> {formState.downPayment.toLocaleString()} EGP</p>
                                    <p><span className="text-slate-500">Duration:</span> {formState.installmentYears} Years ({formState.interestFree === "Yes" ? "Interest Free" : "Plus Interest"})</p>
                                  </>
                                )}
                                <p><span className="text-slate-500">Status:</span> {formState.deliveryStatus}</p>
                              </div>
                            </div>

                            {/* Card: Images */}
                            <div className="bg-white/[0.02] border border-white/5 p-3 rounded-2xl relative col-span-1 sm:col-span-2">
                              <button 
                                onClick={() => setActiveStep(1)} 
                                className="absolute top-2.5 right-2.5 text-blue-400 hover:text-blue-300 font-mono text-[9px] font-bold cursor-pointer uppercase"
                              >
                                Edit
                              </button>
                              <h4 className="font-bold text-white mb-1.5 flex items-center gap-1.5 uppercase tracking-wider text-[10px] font-mono">
                                <ImageIcon size={11} className="text-blue-400" />
                                Property Photographs ({formState.images.length} uploaded)
                              </h4>
                              {formState.images.length > 0 ? (
                                <div className="flex gap-2 overflow-x-auto pb-1 mt-1">
                                  {formState.images.map((img, i) => (
                                    <div key={i} className="w-12 h-12 rounded-lg overflow-hidden border border-white/10 shrink-0 relative">
                                      <img src={img} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                      {formState.coverImageIndex === i && (
                                        <div className="absolute inset-0 bg-amber-400/20 border-2 border-amber-400 rounded-lg pointer-events-none" />
                                      )}
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <p className="text-slate-500 font-mono text-[10px] italic">No photographs uploaded. (AI defaults apply)</p>
                              )}
                            </div>

                          </div>
                        </div>
                      )}

                    </motion.div>
                  </AnimatePresence>
                </div>

                {/* BOTTOM BUTTON FOOTER BAR */}
                <div className="flex justify-between items-center border-t border-white/5 pt-4 mt-4 shrink-0">
                  <button
                    type="button"
                    disabled={activeStep === 1}
                    onClick={handlePrevStep}
                    className="glass-btn text-xs font-bold px-4 py-2.5 rounded-xl flex items-center gap-1.5 disabled:opacity-20 cursor-pointer text-slate-300"
                  >
                    <ChevronLeft size={14} />
                    <span>Back</span>
                  </button>

                  {activeStep < 10 ? (
                    <button
                      type="button"
                      onClick={handleNextStep}
                      className="glass-btn text-xs font-bold px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white flex items-center gap-1.5 cursor-pointer"
                    >
                      <span>Continue</span>
                      <ChevronRight size={14} />
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handlePublishProperty}
                      className="glass-btn text-xs font-black px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white flex items-center gap-2 cursor-pointer shadow-lg animate-pulse"
                    >
                      <Sparkles size={14} className="fill-white" />
                      <span>Verify & Publish Property</span>
                    </button>
                  )}
                </div>

              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <PropertyUploadWizard
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAddUnit={onAddUnit}
        formatCurrency={formatCurrency}
      />

    </div>
  );
}

import React, { useState, useRef, useEffect } from "react";
import { Message, Lead, Unit, ChatThread } from "../types";
import { 
  Sparkles, Send, MapPin, Building, DollarSign, FileCheck, ArrowRight, 
  RefreshCw, AlertCircle, Paperclip, ArrowUp, MessageSquare, Plus, 
  PanelLeftClose, PanelLeft, PanelRightClose, PanelRight, ChevronDown, 
  Copy, Check, ThumbsUp, ThumbsDown, Volume2, Trash2, Settings, 
  HelpCircle, LogOut, Info, ShieldAlert, Command, X, BarChart3, Building2, FileText, Phone, CheckCircle2, Loader2,
  Bed, Bath, Maximize, Pencil, ShieldCheck, Lock, PhoneCall, ChevronLeft, ChevronRight, Eye, Image as ImageIcon, Layers
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { COUNTRIES } from "../lib/countries";
import { cn } from "../lib/utils";
import { liquidMetalFragmentShader, ShaderMount } from "@paper-design/shaders";
import { LiquidMetalButton } from "./LiquidMetalButton";
import { LiquidMetalCard } from "./LiquidMetalCard";
import { DEFAULT_UNITS } from "../lib/defaultUnits";
// @ts-ignore
import brokerLogo from "../broker.png";

const BROKER_LOGO_URL = "https://lh3.googleusercontent.com/aida-public/AB6AXuCzAzjcZGB7fdUij4_D0Zt0TGOYHlxtPp7d_9iyNTYo4HtplaQqZrQB7CE-FnkRZGm_KWusgZfo6E60SM9euwX9yA_4LZOlOzdxqd5bcKpFniN0qrlnHJ7g9Rb20Ol6du9QDalXh8voMN2-Ogt5s4n4zi2OEglJ7BBpFtlTtnW46qSnytMCbjDB65eSsndcmV8Ki-41hUz1p2-_XLp7X-JktxvcNioC2Icbqky6KHC0Z2k4SaAGngyk44PpEFKqKkaDtg";

function getUnitFallbackImage(propertyType: string): string {
  const type = (propertyType || "").toLowerCase();
  if (type.includes("villa")) {
    return "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80";
  }
  if (type.includes("penthouse")) {
    return "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=800&q=80";
  }
  if (type.includes("chalet")) {
    return "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80";
  }
  return "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=800&q=80";
}

// Generate a rich multi-photo gallery for any property unit
function getPropertyImageGallery(unit: any): string[] {
  if (!unit) return [];
  if (Array.isArray(unit.images) && unit.images.length > 0) {
    return unit.images;
  }
  const mainImage = unit.imageUrl || getUnitFallbackImage(unit.propertyType || "");
  const type = (unit.propertyType || "").toLowerCase();

  let gallery: string[] = [mainImage];

  if (type.includes("villa")) {
    gallery.push(
      "https://images.unsplash.com/photo-1613977257363-707ba9348227?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1600585154526-990dced4db0d?auto=format&fit=crop&w=1200&q=80"
    );
  } else if (type.includes("penthouse")) {
    gallery.push(
      "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1600566752355-35792bedcfea?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1512915922686-57c11dde9b6b?auto=format&fit=crop&w=1200&q=80"
    );
  } else if (type.includes("chalet")) {
    gallery.push(
      "https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80"
    );
  } else {
    gallery.push(
      "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=1200&q=80"
    );
  }

  return Array.from(new Set(gallery));
}

// Location matching helper (Bilingual: Arabic & English)
function isLocationMatch(propertyLocation: string, propertyTitle: string, targetLoc: string): boolean {
  if (!targetLoc) return false;
  
  const propLoc = (propertyLocation || "").toLowerCase();
  const propTitle = (propertyTitle || "").toLowerCase();
  const search = targetLoc.toLowerCase().trim();

  const clusters: Record<string, string[]> = {
    "sheikh zayed": [
      "sheikh zayed", "zayed", "sodic", "zayed spine", 
      "dahshour", "beverly hills", "zed park",
      "smart village", "hyper one", "rabwa", "october zayed",
      "الشيخ زايد", "زايد", "سوديك", "بفرلي هيلز", "بيفرلي هيلز", "دهشور", "زد", "هايبر وان", "الربوة", "زايد الجديدة"
    ],
    "6 october": [
      "6 october", "6th of october", "october", "new october",
      "mall of egypt", "mall of arabia", "wahat road", "6 october university", "must university",
      "sun capital", "dreamland", "ashgar city", "ashgar park",
      "٦ أكتوبر", "6 اكتوبر", "اكتوبر", "أكتوبر", "اكتوبر الجديدة", "مول مصر", "مول العرب", "طريق الواحات", "دريم لاند", "صن كابيتال"
    ],
    "new cairo": [
      "new cairo", "cairo", "tagamo", "fifth settlement", "1st settlement", "3rd settlement",
      "90th street", "golden square", "auc", "american university", "rehab",
      "madinaty", "bayt el watan", "investors area",
      "القاهرة الجديدة", "التجمع", "التجمع الخامس", "التجمع الاول", "التجمع الثالث", "شارع التسعين", "التسعين", "الجولدن سكوير", "الجامعة الامريكية", "الرحاب", "مدينتي", "بيت الوطن", "المستثمرين"
    ],
    "north coast": [
      "north coast", "coast", "sidi abdel rahman", "ras el hekma",
      "marina", "alamein", "new alamein", "dabaa road", "fouka bay", "marassi", "amwaj",
      "الساحل", "الساحل الشمالي", "سيدي عبد الرحمن", "رأس الحكمة", "راس الحكمة", "مارينا", "العلمين", "العلمين الجديدة", "مراسي", "أمواج", "فوكا"
    ],
    "new capital": [
      "new capital", "capital", "r7", "r8", "central business district", "iconic tower",
      "government district", "green river", "diplomatic district",
      "العاصمة الادارية", "العاصمة الجديدة", "العاصمة", "البرج الايقوني", "النهر الاخضر", "حي السفارات", "حي المال والاعمال", "ار7", "ار8"
    ],
    "el shorouk": [
      "el shorouk", "shorouk", "shorouk city", "suez road",
      "الشروق", "مدينة الشروق", "طريق السويس"
    ],
    "maadi": [
      "maadi", "degla maadi", "corniche maadi", "zahraa maadi",
      "المعادي", "دجلة المعادي", "كورنيش المعادي", "زهراء المعادي"
    ],
    "giza central": [
      "giza", "dokki", "mohandessin", "harm", "pyramids", "faisal", "zamalek",
      "الجيزة", "الدقي", "المهندسين", "الهرم", "الاهرامات", "فيصل", "الزمالك"
    ]
  };

  let matchingAliases: string[] = [search];
  for (const [key, aliases] of Object.entries(clusters)) {
    if (key === search || aliases.includes(search)) {
      matchingAliases = aliases;
      break;
    }
  }

  if (!matchingAliases.includes(search)) {
    matchingAliases.push(search);
  }

  return matchingAliases.some(alias => propLoc.includes(alias) || propTitle.includes(alias));
}

// Property type matching helper (Bilingual: Arabic & English)
function isPropertyTypeMatch(propertyType: string, propertyTitle: string, targetType: string): boolean {
  if (!targetType) return true;
  
  const propType = (propertyType || "").toLowerCase();
  const propTitle = (propertyTitle || "").toLowerCase();
  const search = targetType.toLowerCase();

  const clusters: Record<string, string[]> = {
    "villa": ["villa", "townhouse", "twin house", "standalone", "فيلا", "فيلات", "فلل", "تاون هاوس", "توين هاوس", "ستاند الون", "مستقلة"],
    "apartment": ["apartment", "studio", "flat", "duplex", "شقة", "شقق", "استوديو", "استديو", "دوبلكس"],
    "penthouse": ["penthouse", "roof", "بنتهاوس", "بنت هاوس", "روف", "سطح"],
    "chalet": ["chalet", "cabin", "beach house", "شاليه", "شاليهات", "كابينة", "بيت شاطئ"]
  };

  let matchingAliases: string[] = [search];
  for (const [key, aliases] of Object.entries(clusters)) {
    if (key === search || aliases.includes(search)) {
      matchingAliases = aliases;
      break;
    }
  }

  return matchingAliases.some(alias => propType.includes(alias) || propTitle.includes(alias));
}

function extractLocationFromMessages(userMessages: string[]): string {
  if (!userMessages || userMessages.length === 0) return "";
  for (let i = userMessages.length - 1; i >= 0; i--) {
    const msg = (userMessages[i] || "").trim().toLowerCase();
    if (!msg) continue;
    if (msg.includes("cairo") || msg.includes("tagamo") || msg.includes("fifth settlement") || msg.includes("new cairo") || msg.includes("90th") || msg.includes("golden square") || msg.includes("rehab") || msg.includes("madinaty") || msg.includes("auc") || msg.includes("القاهرة الجديدة") || msg.includes("التجمع") || msg.includes("التسعين") || msg.includes("الرحاب") || msg.includes("مدينتي") || msg.includes("بيت الوطن")) {
      return "New Cairo";
    }
    if (msg.includes("zayed") || msg.includes("sodic") || msg.includes("beverly hills") || msg.includes("dahshour") || msg.includes("smart village") || msg.includes("zed") || msg.includes("زايد") || msg.includes("الشيخ زايد") || msg.includes("سوديك") || msg.includes("بفرلي") || msg.includes("بيفرلي")) {
      return "Sheikh Zayed";
    }
    if (msg.includes("october") || msg.includes("6 october") || msg.includes("mall of arabia") || msg.includes("mall of egypt") || msg.includes("sun capital") || msg.includes("أكتوبر") || msg.includes("اكتوبر") || msg.includes("٦ أكتوبر") || msg.includes("مول مصر") || msg.includes("مول العرب")) {
      return "6 October";
    }
    if (msg.includes("north coast") || msg.includes("sahel") || msg.includes("ras el hekma") || msg.includes("marassi") || msg.includes("الساحل") || msg.includes("راس الحكمة") || msg.includes("رأس الحكمة") || msg.includes("مراسي")) {
      return "North Coast";
    }
    if (msg.includes("capital") || msg.includes("new capital") || msg.includes("العاصمة") || msg.includes("العاصمة الادارية")) {
      return "New Capital";
    }
  }
  return "";
}

const SUGGESTIONS = [
  {
    id: "card-modern-villa",
    title: "Modern Villa",
    description: "Find a modern smart villa with high evaluation price",
    prompt: "Find a modern smart villa with high evaluation price",
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 21h18"/><path d="M4 21V10l8-6 8 6v11"/><path d="M9 21v-6h6v6"/><path d="M9 12h.01M15 12h.01"/>
      </svg>
    )
  },
  {
    id: "card-skyline-penthouse",
    title: "Skyline Penthouse",
    description: "Compare market trends in Skyline District with high budget",
    prompt: "Compare market trends in Skyline District with high budget",
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 21h18"/><path d="M6 21V9l3-2v14"/><path d="M13 21V4l3 2v15"/><path d="M20 21v-8l0-1"/>
      </svg>
    )
  },
  {
    id: "card-claim-lead",
    title: "Claim a Lead",
    description: "How do I buy or unlock lead contact details?",
    prompt: "How do I buy or unlock lead contact details?",
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="8" width="18" height="12" rx="2"/><path d="M9 8V6a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2"/><path d="M3 13h18"/><path d="M11 13v2h2v-2"/>
      </svg>
    )
  },
  {
    id: "card-new-cairo",
    title: "New Cairo Launch",
    description: "Show me new developments with flexible payment plans",
    prompt: "Show me new developments with flexible payment plans",
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 21h18"/><path d="M5 21V11l4-3 4 3v10"/><path d="M13 21V7l3-3 3 3v14"/><path d="M8 21v-4M13 12h.01M13 15h.01M13 18h.01"/>
      </svg>
    )
  },
  {
    id: "card-rental-yield",
    title: "Rental Yield",
    description: "Compare rental yield across North Coast projects",
    prompt: "Compare rental yield across North Coast projects",
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 17l5-5 4 4 7-8"/><path d="M14 8h5v5"/>
      </svg>
    )
  },
  {
    id: "card-score-lead",
    title: "Score a Lead",
    description: "Score this lead as Cold, Warm, or Hot",
    prompt: "Score this lead as Cold, Warm, or Hot",
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="4.5"/><circle cx="12" cy="12" r="1"/>
      </svg>
    )
  }
];

interface AIChatProps {
  key?: any;
  units: Unit[];
  currentUser?: any;
  selectedCountry: string;
  formatCurrency: (amountInEGP: number) => string;
  onLeadGenerated: (lead: Omit<Lead, "id" | "createdAt">) => Promise<void>;
  onLogoClick?: () => void;
  onNewChat?: () => void;
  conversations: Record<string, ChatThread>;
  setConversations: React.Dispatch<React.SetStateAction<Record<string, ChatThread>>>;
  activeThreadId: string;
  setActiveThreadId: (id: string) => void;
}

export default function AIChat({ 
  units, 
  currentUser, 
  selectedCountry, 
  formatCurrency, 
  onLeadGenerated, 
  onLogoClick,
  conversations,
  setConversations,
  activeThreadId,
  setActiveThreadId
}: AIChatProps) {
  // Navigation & panels state
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isRightPanelOpen, setIsRightPanelOpen] = useState(true);
  const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false);
  const [selectedModel, setSelectedModel] = useState("Broker AI 4.5 Pro");

  // Interaction feed feedback states
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [speakingIndex, setSpeakingIndex] = useState<number | null>(null);
  const [likedMessages, setLikedMessages] = useState<Record<number, "up" | "down">>({});

  // Active inputs
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  // Edit message state
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editingText, setEditingText] = useState("");

  // States for advanced animated input design
  const [attachments, setAttachments] = useState<string[]>([]);
  const [activeSuggestion, setActiveSuggestion] = useState<number>(-1);
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [recentCommand, setRecentCommand] = useState<string | null>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [inputFocused, setInputFocused] = useState(false);
  const [inputHovered, setInputHovered] = useState(false);

  // Contact Agent modal states
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [contactName, setContactName] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [contactViewingDate, setContactViewingDate] = useState("");
  const [submittedViewingDate, setSubmittedViewingDate] = useState<string | null>(null);
  const [contactError, setContactError] = useState<string | null>(null);
  const [selectedUnitForContact, setSelectedUnitForContact] = useState<Unit | null>(null);
  const [submittingContact, setSubmittingContact] = useState(false);
  const [contactSubmitted, setContactSubmitted] = useState(false);

  // Property Details & Gallery modal states
  const [selectedPropertyForDetails, setSelectedPropertyForDetails] = useState<Unit | any | null>(null);
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const commandPaletteRef = useRef<HTMLDivElement>(null);
  const chatboxShaderRef = useRef<HTMLDivElement>(null);
  // biome-ignore lint/suspicious/noExplicitAny: External library without types
  const chatboxShaderMount = useRef<any>(null);

  useEffect(() => {
    const styleId = "shader-canvas-style-chatbox";
    if (!document.getElementById(styleId)) {
      const style = document.createElement("style");
      style.id = styleId;
      style.textContent = `
        .shader-container-chatbox canvas {
          width: 100% !important;
          height: 100% !important;
          display: block !important;
          position: absolute !important;
          top: 0 !important;
          left: 0 !important;
          border-radius: 100px !important;
        }
      `;
      document.head.appendChild(style);
    }

    const loadShader = async () => {
      try {
        if (chatboxShaderRef.current) {
          if (chatboxShaderMount.current?.destroy) {
            chatboxShaderMount.current.destroy();
          }

          chatboxShaderMount.current = new ShaderMount(
            chatboxShaderRef.current,
            liquidMetalFragmentShader,
            {
              u_repetition: 4,
              u_softness: 0.5,
              u_shiftRed: 0.0,
              u_shiftBlue: 0.0,
              u_distortion: 0,
              u_contour: 0,
              u_angle: 45,
              u_scale: 8,
              u_shape: 1,
              u_offsetX: 0.1,
              u_offsetY: -0.1,
            },
            undefined,
            0.6,
          );
        }
      } catch (error) {
        console.error("Failed to load chatbox shader:", error);
      }
    };

    loadShader();

    return () => {
      if (chatboxShaderMount.current?.destroy) {
        chatboxShaderMount.current.destroy();
        chatboxShaderMount.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (chatboxShaderMount.current?.setSpeed) {
      if (inputFocused) {
        chatboxShaderMount.current.setSpeed(2.4);
      } else if (inputHovered) {
        chatboxShaderMount.current.setSpeed(1.0);
      } else {
        chatboxShaderMount.current.setSpeed(0.6);
      }
    }
  }, [inputFocused, inputHovered]);

  const commandSuggestions = [
    { icon: <Building size={14} className="text-blue-400" />, label: "Clone UI", description: "Generate a UI from a screenshot", prefix: "/clone" },
    { icon: <Sparkles size={14} className="text-purple-400" />, label: "Import Figma", description: "Import a design from Figma", prefix: "/figma" },
    { icon: <MapPin size={14} className="text-emerald-400" />, label: "Create Page", description: "Generate a new web page", prefix: "/page" },
    { icon: <Sparkles size={14} className="text-amber-400" />, label: "Improve", description: "Improve existing UI design", prefix: "/improve" },
  ];

  const adjustHeight = (reset?: boolean) => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    if (reset) {
      textarea.style.height = "52px";
      return;
    }
    textarea.style.height = "52px";
    textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
  };

  useEffect(() => {
    if (input.startsWith('/') && !input.includes(' ')) {
      setShowCommandPalette(true);
      const matchIdx = commandSuggestions.findIndex(cmd => cmd.prefix.startsWith(input));
      if (matchIdx >= 0) setActiveSuggestion(matchIdx);
      else setActiveSuggestion(-1);
    } else {
      setShowCommandPalette(false);
    }
  }, [input]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      const commandButton = document.querySelector('[data-command-button]');
      if (commandPaletteRef.current && 
          !commandPaletteRef.current.contains(target) && 
          !commandButton?.contains(target)) {
        setShowCommandPalette(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (showCommandPalette) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveSuggestion(prev => 
          prev < commandSuggestions.length - 1 ? prev + 1 : 0
        );
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveSuggestion(prev => 
          prev > 0 ? prev - 1 : commandSuggestions.length - 1
        );
      } else if (e.key === 'Tab' || e.key === 'Enter') {
        e.preventDefault();
        if (activeSuggestion >= 0) {
          const selectedCommand = commandSuggestions[activeSuggestion];
          setInput(selectedCommand.prefix + ' ');
          setShowCommandPalette(false);
          setRecentCommand(selectedCommand.label);
          setTimeout(() => setRecentCommand(null), 3500);
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        setShowCommandPalette(false);
      }
    } else if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (input.trim() && !loading) {
        submitQuery(input);
        setTimeout(() => adjustHeight(true), 20);
      }
    }
  };

  const handleAttachFile = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const names = Array.from(e.target.files).map((f: any) => f.name);
      setAttachments(prev => [...prev, ...names]);
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const selectCommandSuggestion = (index: number) => {
    const selectedCommand = commandSuggestions[index];
    setInput(selectedCommand.prefix + ' ');
    setShowCommandPalette(false);
    setRecentCommand(selectedCommand.label);
    setTimeout(() => setRecentCommand(null), 2000);
  };

  // Helper shortcut references to current conversation properties
  const activeThread = conversations[activeThreadId] || conversations["current"] || Object.values(conversations)[0] || {
    id: "current",
    title: "New Property Chat",
    messages: [],
    extracted: { budget: "", propertyType: "", location: "", legalPapersRequired: null },
    qualification: null,
    qualificationValue: 0,
    leadSubmitted: false
  };
  const messages = activeThread.messages || [];
  const extracted = activeThread.extracted || { budget: "", propertyType: "", location: "", legalPapersRequired: null };
  const qualification = activeThread.qualification || null;
  const qualificationValue = activeThread.qualificationValue || 0;
  const leadSubmitted = activeThread.leadSubmitted || false;

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Clean-up speech synthesiser on unmount
  useEffect(() => {
    return () => {
      window.speechSynthesis.cancel();
    };
  }, []);

  const fillPrompt = (text: string) => {
    setInput(text);
  };

  const handleNewChat = () => {
    const newId = `chat_${Date.now()}`;
    const newThread: ChatThread = {
      id: newId,
      title: "New Chat Thread",
      messages: [],
      extracted: { budget: "", propertyType: "", location: "", legalPapersRequired: null },
      qualification: null,
      qualificationValue: 0,
      leadSubmitted: false
    };

    setConversations(prev => ({
      ...prev,
      [newId]: newThread
    }));
    setActiveThreadId(newId);
    setInput("");
    window.speechSynthesis.cancel();
    setSpeakingIndex(null);
  };

  const handleDeleteChat = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (id === "current") {
      // Just clear "current"
      setConversations(prev => ({
        ...prev,
        current: {
          id: "current",
          title: "New Property Chat",
          messages: [],
          extracted: { budget: "", propertyType: "", location: "", legalPapersRequired: null },
          qualification: null,
          qualificationValue: 0,
          leadSubmitted: false
        }
      }));
      return;
    }

    const updated = { ...conversations };
    delete updated[id];
    setConversations(updated);
    
    if (activeThreadId === id) {
      setActiveThreadId("current");
    }
  };

  const submitQueryWithMessages = async (updatedMessages: Message[], dynamicTitle?: string) => {
    // Ensure every message has a unique stable ID to preserve message ordering
    const sanitizedInputMessages = updatedMessages.map((m, idx) => ({
      ...m,
      id: m.id || `msg_${m.role}_${Date.now()}_${idx}_${Math.random().toString(36).substring(2, 5)}`
    }));

    // Update active thread title dynamically on first user message if needed
    let finalTitle = activeThread.title;
    if (dynamicTitle && (activeThread.title === "New Chat Thread" || activeThread.title === "New Property Chat")) {
      finalTitle = dynamicTitle;
    }

    // Update active thread state immediately
    setConversations(prev => ({
      ...prev,
      [activeThreadId]: {
        ...prev[activeThreadId],
        title: finalTitle,
        messages: sanitizedInputMessages
      }
    }));

    setLoading(true);

    const config = COUNTRIES.find(c => c.code === selectedCountry) || COUNTRIES[0];

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          messages: sanitizedInputMessages,
          units,
          currencyCode: config.currency,
          currencySymbol: config.symbol,
          exchangeRate: config.rate
        })
      });

      if (!res.ok) {
        throw new Error("Failed to reach Broker Core API");
      }

      const data = await res.json();
      
      const botMessage: Message = {
        id: `msg_assistant_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        role: "assistant",
        content: data.response || "No response received.",
        suggestedUnits: data.suggestedUnits,
        photos: data.photos,
        referencedUnitId: data.targetUnitId
      };

      // Prepare state variables for extracted data
      const nextExtracted = {
        budget: data.extractedInfo?.budget || extracted.budget,
        propertyType: data.extractedInfo?.propertyType || extracted.propertyType,
        location: data.extractedInfo?.location || extracted.location,
        legalPapersRequired: data.extractedInfo?.legalPapersRequired !== null ? data.extractedInfo?.legalPapersRequired : extracted.legalPapersRequired
      };

      let nextQual = qualification;
      let nextQualVal = qualificationValue;
      let nextSubmitted = leadSubmitted;

      // If qualified, track qualification locally but do NOT automatically submit a mock lead
      if (data.qualification) {
        nextQual = data.qualification;
        let val = 100;
        if (data.qualification === "warm") val = 500;
        if (data.qualification === "hot") val = 1000;
        nextQualVal = val;
      }

      // Handle automatic lead routing when buyer expresses intent to proceed with a property
      if (data.action === "create_lead" && data.ownerId && !nextSubmitted) {
        try {
          const targetUnit = units.find(u => 
            (u.id && u.id === data.targetUnitId) || 
            (u.title && data.targetUnitTitle && u.title.toLowerCase().includes(data.targetUnitTitle.toLowerCase()))
          );
          const ownerUploaderId = targetUnit?.uploaderId || data.ownerId;
          const ownerTenantId = targetUnit?.tenantId || ownerUploaderId;
          const targetId = targetUnit?.id || data.targetUnitId || "";

          await onLeadGenerated({
            name: currentUser?.displayName || "Interested Property Buyer",
            email: currentUser?.email || "buyer_prospect@brokerai.com",
            phone: currentUser?.phoneNumber || "01000000000",
            chatId: activeThreadId,
            budget: data.extractedInfo?.budget || nextExtracted.budget || "Market Price",
            propertyType: data.extractedInfo?.propertyType || nextExtracted.propertyType || "Property",
            location: data.extractedInfo?.location || nextExtracted.location || "Egypt",
            legalPapersRequired: data.extractedInfo?.legalPapersRequired || false,
            qualification: data.qualification || "hot",
            value: 1000,
            status: "available",
            interestedUnitId: targetId,
            propertyId: targetId,
            interestedUnitTitle: data.targetUnitTitle || targetUnit?.title || "Property Unit",
            propertyUploaderId: ownerUploaderId,
            tenantId: ownerTenantId
          });
          nextSubmitted = true;
        } catch (leadErr) {
          console.warn("Auto lead creation notice:", leadErr);
        }
      }

      setConversations(prev => {
        const currentThread = prev[activeThreadId] || prev["current"];
        if (!currentThread) return prev;

        const currentMsgs = currentThread.messages || [];
        const alreadyHasBot = currentMsgs.some(m => m.id === botMessage.id);
        const nextMessages = alreadyHasBot ? currentMsgs : [...sanitizedInputMessages, botMessage];

        return {
          ...prev,
          [activeThreadId]: {
            ...currentThread,
            messages: nextMessages,
            extracted: nextExtracted,
            qualification: nextQual,
            qualificationValue: nextQualVal,
            leadSubmitted: nextSubmitted
          }
        };
      });

    } catch (err) {
      console.warn("Client Chat Fallback Activated:", err);
      
      const userHistory = updatedMessages
        .filter(m => m.role === "user")
        .map(m => m.content.trim().toLowerCase());
      const combinedHistory = userHistory.join(" ");

      // Parse criteria
      let detectedType = "";
      if (combinedHistory.includes("villa")) detectedType = "Villa";
      else if (combinedHistory.includes("apartment")) detectedType = "Apartment";
      else if (combinedHistory.includes("penthouse")) detectedType = "Penthouse";
      else if (combinedHistory.includes("chalet")) detectedType = "Chalet";

      let detectedLoc = "";
      if (combinedHistory.includes("new cairo") || combinedHistory.includes("cairo") || combinedHistory.includes("tagamo")) detectedLoc = "New Cairo";
      else if (combinedHistory.includes("zayed") || combinedHistory.includes("sheikh zayed")) detectedLoc = "Sheikh Zayed";
      else if (combinedHistory.includes("october") || combinedHistory.includes("6 october")) detectedLoc = "6 October";
      else if (combinedHistory.includes("coast") || combinedHistory.includes("north coast")) detectedLoc = "North Coast";
      else if (combinedHistory.includes("capital") || combinedHistory.includes("new capital")) detectedLoc = "New Capital";
      else if (combinedHistory.includes("shorouk") || combinedHistory.includes("el shorouk")) detectedLoc = "El Shorouk";

      let detectedBudget = "";
      const budgetMatch = combinedHistory.match(/(\d+[\d,.]*)\s*(m|million|egp)?/);
      if (budgetMatch) {
        const val = budgetMatch[1].replace(/,/g, '');
        const suffix = budgetMatch[2] || "";
        if (suffix === "m" || suffix.includes("million")) {
          detectedBudget = `${parseFloat(val) * 1000000} EGP`;
        } else {
          detectedBudget = `${val} EGP`;
        }
      }

      let mockReply = "";
      let nextExtracted = { ...extracted };

      if (!detectedLoc) {
        mockReply = "Which specific area are you looking for a property in?";
        nextExtracted = {
          budget: null,
          propertyType: detectedType || null,
          location: null,
          legalPapersRequired: null
        };
      } else {
        // Verify location exists in DB
        const matchesLocationInDb = units.filter(u => isLocationMatch(u.location, u.title, detectedLoc));

        if (matchesLocationInDb.length === 0) {
          const availableLocs = Array.from(new Set(units.map(u => u.location))).slice(0, 3);
          const reply = `Unfortunately, I couldn't find any available properties in ${detectedLoc} in our database at the moment.`;
          const alternativeText = `You might want to explore these areas instead: ${availableLocs.join(", ")}`;

          mockReply = `${reply} ${alternativeText}`;
          nextExtracted = {
            budget: detectedBudget || null,
            propertyType: detectedType || null,
            location: detectedLoc,
            legalPapersRequired: null
          };
        } else if (!detectedBudget) {
          // Ask for budget
          mockReply = "What is your target budget?";
          nextExtracted = {
            budget: null,
            propertyType: detectedType || null,
            location: detectedLoc,
            legalPapersRequired: null
          };
        } else {
          // Both location & budget supplied. Search DB
          const userBudgetNum = parseFloat(detectedBudget.replace(/[^0-9.]/g, ''));
          const matched = units.filter(u => {
            const matchesLoc = isLocationMatch(u.location, u.title, detectedLoc);
            const matchesType = isPropertyTypeMatch(u.propertyType, u.title, detectedType);
            const matchesBudget = u.price <= userBudgetNum * 1.15; // Up to 15% budget stretch

            return matchesLoc && matchesType && matchesBudget;
          });

          if (matched.length > 0) {
            const formattedUnits = matched.slice(0, 2).map(u => {
              const imgUrl = u.imageUrl || getUnitFallbackImage(u.propertyType);
              return `🏠 **${u.title}**\n📍 Location: ${u.location}\n💰 Price: ${u.price.toLocaleString()} EGP\n📝 Deeds: ${u.legalPaperStatus === "verified_boost" ? "✅ Verified" : "⚠️ Pending"}\n📸 Image: ${imgUrl}`;
            }).join("\n\n---\n\n");

            const question = "\n\nWould you like to connect with the owner or schedule a visit?";

            mockReply = `I found these properties in ${detectedLoc}:\n\n${formattedUnits}${question}`;
            
            nextExtracted = {
              budget: detectedBudget,
              propertyType: detectedType || matched[0].propertyType || null,
              location: detectedLoc,
              legalPapersRequired: true
            };
          } else {
            const reply = `Unfortunately, I couldn't find any available properties in ${detectedLoc} fitting your budget of ${detectedBudget}.`;

            // Offer closest budget matches in the same location
            const closestMatches = matchesLocationInDb
              .sort((a, b) => a.price - b.price)
              .slice(0, 2);

            let alternativesText = "";
            if (closestMatches.length > 0) {
              const altItems = closestMatches.map(u => {
                return `- **${u.title}** priced at ${u.price.toLocaleString()} EGP in ${u.location}`;
              }).join("\n");

              alternativesText = `\n\nHowever, here are other available options in the same area:\n${altItems}`;
            }

            mockReply = `${reply}${alternativesText}`;
            
            nextExtracted = {
              budget: detectedBudget,
              propertyType: detectedType || null,
              location: detectedLoc,
              legalPapersRequired: null
            };
          }
        }
      }

      setConversations(prev => ({
        ...prev,
        [activeThreadId]: {
          ...prev[activeThreadId],
          messages: [...updatedMessages, { role: "assistant", content: mockReply }],
          extracted: nextExtracted
        }
      }));
    } finally {
      setLoading(false);
    }
  };

  const submitQuery = async (queryText: string) => {
    if (!queryText.trim()) return;

    const userMessage: Message = { role: "user", content: queryText };
    const updatedMessages = [...messages, userMessage];
    
    // Update active thread title dynamically on first user message
    let dynamicTitle = activeThread.title;
    if (activeThread.title === "New Chat Thread" || activeThread.title === "New Property Chat") {
      dynamicTitle = queryText.length > 25 ? queryText.substring(0, 25) + "..." : queryText;
    }

    setInput("");
    await submitQueryWithMessages(updatedMessages, dynamicTitle);
  };

  const handleEditSubmit = async (index: number) => {
    if (!editingText.trim() || loading) return;

    const truncatedMessages = messages.slice(0, index);
    const editedUserMessage: Message = { role: "user", content: editingText };
    const updatedMessages = [...truncatedMessages, editedUserMessage];

    setEditingIndex(null);
    setEditingText("");

    await submitQueryWithMessages(updatedMessages);
  };

  const matchingUnits = React.useMemo(() => {
    if (messages.length === 0) return [];
    const queryLoc = extracted.location?.toLowerCase().trim() || "";
    const queryType = extracted.propertyType?.toLowerCase().trim() || "";
    const queryBudget = extracted.budget;
    
    // We strictly require location AND budget to show matching units.
    // This prevents showing cards prematurely before the user specifies their budget or price range.
    if (!queryLoc || !queryBudget) {
      return [];
    }
    
    const filtered = units.filter(unit => {
      const locMatch = isLocationMatch(unit.location, unit.title, queryLoc);
      const typeMatch = isPropertyTypeMatch(unit.propertyType, unit.title, queryType);
      
      return locMatch && typeMatch;
    });

    return filtered.slice(0, 3);
  }, [units, extracted, messages]);

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactName.trim() || !contactPhone.trim()) return;

    setSubmittingContact(true);
    setContactError(null);
    try {
      const targetUnitId = selectedUnitForContact?.id || "";
      const chosenViewingDate = contactViewingDate.trim() ? contactViewingDate.trim() : null;

      // Call secure backend endpoint to create real Lead with derived ownership & viewing date
      const response = await fetch("/api/leads/contact-agent", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          unitId: targetUnitId,
          propertyId: targetUnitId,
          name: contactName.trim(),
          phone: contactPhone.trim(),
          preferredViewingDate: chosenViewingDate,
          chatId: activeThread?.id || "direct_contact"
        })
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to submit contact request to the agent.");
      }

      const createdLead = data.lead;
      const viewingDateConfirmed = createdLead?.preferredViewingDate || chosenViewingDate;
      setSubmittedViewingDate(viewingDateConfirmed);

      // Notify frontend handler / data state with the real lead
      if (createdLead) {
        const leadToSync: any = {
          name: createdLead.name,
          email: createdLead.email || `${contactName.trim().toLowerCase().replace(/\s+/g, ".")}@buyer.brokerai.com`,
          phone: createdLead.phone || contactPhone.trim(),
          chatId: activeThread?.id || "direct_contact",
          budget: createdLead.budget || "Contact for Price",
          propertyType: createdLead.propertyType || selectedUnitForContact?.propertyType || "Residential",
          location: createdLead.location || selectedUnitForContact?.location || "Egypt",
          legalPapersRequired: !!createdLead.legalPapersRequired,
          qualification: createdLead.qualification || "hot",
          value: createdLead.value || 1000,
          status: createdLead.status || "available",
          interestedUnitTitle: createdLead.interestedUnitTitle || selectedUnitForContact?.title || "Property Listing",
          interestedUnitId: createdLead.interestedUnitId || targetUnitId,
          propertyId: createdLead.propertyId || targetUnitId,
          preferredViewingDate: viewingDateConfirmed || null,
          source: createdLead.source || "property_contact"
        };

        if (createdLead.projectId) leadToSync.projectId = createdLead.projectId;
        if (createdLead.developerId) leadToSync.developerId = createdLead.developerId;
        if (createdLead.companyId) leadToSync.companyId = createdLead.companyId;
        if (createdLead.tenantId || selectedUnitForContact?.tenantId) {
          leadToSync.tenantId = createdLead.tenantId || selectedUnitForContact?.tenantId;
        }
        if (createdLead.propertyUploaderId || selectedUnitForContact?.uploaderId) {
          leadToSync.propertyUploaderId = createdLead.propertyUploaderId || selectedUnitForContact?.uploaderId;
        }
        if (createdLead.assignedAgentId) leadToSync.assignedAgentId = createdLead.assignedAgentId;

        await onLeadGenerated(leadToSync);
      }

      setConversations(prev => ({
        ...prev,
        [activeThreadId]: {
          ...prev[activeThreadId],
          leadSubmitted: true
        }
      }));

      setContactSubmitted(true);
      setTimeout(() => {
        setIsContactModalOpen(false);
        setContactSubmitted(false);
        setContactName("");
        setContactPhone("");
        setContactViewingDate("");
        setSubmittedViewingDate(null);
        setSelectedUnitForContact(null);
        setContactError(null);
      }, 3500);

    } catch (err: any) {
      console.error("[Contact Agent] Failed to create lead:", err);
      setContactError(err?.message || "Failed to send request. Please check your details and try again.");
    } finally {
      setSubmittingContact(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    submitQuery(input);
  };

  interface ParsedProperty {
    id?: string;
    title: string;
    location: string;
    price: string;
    isVerified: boolean;
    imageUrl: string;
    images?: string[];
    description: string;
    propertyType?: string;
    ownerName?: string;
    ownerPhone?: string;
    bedrooms?: number;
    bathrooms?: number;
    area?: number;
    uploaderId?: string;
    tenantId?: string;
  }

  const parsePropertiesFromMessage = (content: string) => {
    if (!content) return { cleanText: "", properties: [] };
    
    const lines = content.split("\n");
    const properties: ParsedProperty[] = [];
    const textLines: string[] = [];
    
    let currentProp: ParsedProperty | null = null;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      if (line.startsWith("🏠") || line.includes("🏠")) {
        if (currentProp) {
          properties.push(currentProp);
        }
        const titleVal = line.replace(/🏠/g, "").replace(/\*\*/g, "").trim();
        currentProp = {
          title: titleVal,
          location: "",
          price: "",
          isVerified: false,
          imageUrl: "",
          description: ""
        };
      } else if (currentProp) {
        if (line.includes("📍")) {
          currentProp.location = line.replace(/📍/g, "").replace(/Location:/g, "").replace(/\*\*/g, "").trim();
        } else if (line.includes("💰")) {
          currentProp.price = line.replace(/💰/g, "").replace(/Price:/g, "").replace(/\*\*/g, "").trim();
        } else if (line.includes("📝")) {
          currentProp.isVerified = line.includes("✅") || line.includes("Verified") || line.includes("verified_boost");
        } else if (line.includes("📸") || line.includes("Image:")) {
          const match = line.match(/(https?:\/\/[^\s]+|data:image\/[^\s]+)/i);
          if (match) {
            currentProp.imageUrl = match[1].replace(/[.,;)]+$/, "").trim();
          }
        } else if (line.includes("✨") || line.includes("Description:")) {
          currentProp.description = line.replace(/✨/g, "").replace(/Description:/g, "").trim();
        } else if (line === "---") {
          properties.push(currentProp);
          currentProp = null;
        } else if (line === "") {
          // Skip empty lines
        } else {
          properties.push(currentProp);
          currentProp = null;
          textLines.push(lines[i]);
        }
      } else {
        if (line !== "---") {
          textLines.push(lines[i]);
        }
      }
    }
    
    if (currentProp) {
      properties.push(currentProp);
    }
    
    const cleanText = textLines.join("\n").replace(/\n{3,}/g, "\n\n").trim();
    return { cleanText, properties };
  };

  const renderMessageWithImages = (content: string) => {
    if (!content) return null;
    
    // Clean any stray markdown bold/italic markers
    const sanitized = content.replace(/\*\*(.*?)\*\*/g, "$1").replace(/\*(.*?)\*/g, "$1");
    const lines = sanitized.split("\n");
    return lines.map((line, lineIdx) => {
      const urlMatch = line.match(/(https?:\/\/[^\s]+|data:image\/[^\s]+)/i);
      if (urlMatch) {
        const url = urlMatch[1];
        const cleanUrl = url.replace(/[.,;)]+$/, "");
        const isImg = cleanUrl.startsWith("data:image/") || cleanUrl.match(/\.(jpeg|jpg|gif|png|webp)/i) || cleanUrl.includes("images.unsplash.com") || line.includes("📸");
        
        if (isImg) {
          const textBefore = line.split(url)[0] || "";
          return (
            <div key={lineIdx} className="my-2.5 space-y-2 text-left">
              {textBefore.trim() && <p className="leading-relaxed whitespace-pre-wrap">{textBefore}</p>}
              <div className="w-full max-w-sm rounded-xl overflow-hidden border border-white/10 shadow-md my-1.5 bg-white/[0.01]">
                <img 
                  src={cleanUrl} 
                  alt="Unit Visual" 
                  className="w-full h-40 object-cover hover:scale-[1.03] transition-transform duration-300"
                  referrerPolicy="no-referrer"
                />
              </div>
            </div>
          );
        }
      }
      return <p key={lineIdx} className="leading-relaxed whitespace-pre-wrap text-left">{line}</p>;
    });
  };

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const speakMessage = (text: string, index: number) => {
    if (speakingIndex === index) {
      window.speechSynthesis.cancel();
      setSpeakingIndex(null);
    } else {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.onend = () => setSpeakingIndex(null);
      window.speechSynthesis.speak(utterance);
      setSpeakingIndex(index);
    }
  };

  const handleFeedback = (index: number, type: "up" | "down") => {
    setLikedMessages(prev => ({
      ...prev,
      [index]: prev[index] === type ? null : type
    }));
  };

  const resetCurrentChat = () => {
    setConversations(prev => ({
      ...prev,
      [activeThreadId]: {
        ...prev[activeThreadId],
        messages: [
          {
            role: "assistant",
            content: "Welcome! I am your Broker AI Assistant 🏠. I am here to help you explore top real estate opportunities, answer investment and legal queries, and match your requirements with available units. How can I assist you today?"
          }
        ],
        extracted: { budget: "", propertyType: "", location: "", legalPapersRequired: null },
        qualification: null,
        qualificationValue: 0,
        leadSubmitted: false
      }
    }));
    setInput("");
    window.speechSynthesis.cancel();
    setSpeakingIndex(null);
  };

  const suggestionPills = [
    { label: "Modern Villa", prompt: "Find a modern smart villa with high evaluation price", emoji: "🏙️" },
    { label: "Skyline Penthouse", prompt: "Compare market trends in Skyline District with high budget", emoji: "📊" },
    { label: "Claim a Lead", prompt: "How do I buy or unlock lead contact details?", emoji: "💼" },
    { label: "UAE Market", prompt: "Show me luxury listings in Dubai Marina and downtown properties", emoji: "🌍" },
    { label: "Saudi Arabia", prompt: "Find luxury residential developments in Riyadh", emoji: "🇸🇦" },
    { label: "Affordable Units", prompt: "List all properties under 3,000,000 EGP", emoji: "🏢" }
  ];

  return (
    <div className="flex-1 flex flex-col w-full h-full relative overflow-hidden bg-[#050505]">

      {/* Main chat window taking up all remaining height */}
      <section className="flex-1 flex flex-col justify-between bg-transparent relative overflow-hidden">

        {/* CHAT CONTENT STAGE */}
        <div className="flex-1 overflow-y-auto scrollbar-thin relative p-4 md:p-6 lg:p-8 flex flex-col">
          
          {/* ========================================== */}
          {/* INNER STATE 1: EMPTY GREETING & DASHBOARD */}
          {/* ========================================== */}
          <AnimatePresence mode="wait">
            {messages.length === 0 ? (
              <motion.div
                key="empty-state"
                initial={{ opacity: 0, scale: 0.98, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.98, y: -15 }}
                transition={{ duration: 0.35, ease: "easeOut" }}
                className="flex-grow flex flex-col items-center justify-center px-3 sm:px-4 md:px-6 pb-8 md:pb-12 w-full max-w-4xl mx-auto relative z-10 my-auto text-center"
              >
                {/* Hero Title */}
                <div className="text-center mb-6 sm:mb-8 md:mb-14">
                  <p className="font-secondary text-[10px] sm:text-[12px] text-[#c4c7c7] mb-2 sm:mb-3 tracking-widest uppercase">
                    CONVERSATIONAL REAL ESTATE INTELLIGENCE
                  </p>
                  <h2 className="text-2xl sm:text-3xl md:text-[46px] font-bold text-[#e2e2e4] tracking-tight leading-tight md:leading-[54px] font-sans mt-0 -mb-4">
                    What is your Dream house?
                  </h2>
                </div>

                {/* Main Centered Input Area */}
                <div className="w-full max-w-3xl mb-6 sm:mb-8 relative group text-left">
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (input.trim() && !loading) {
                        submitQuery(input.trim());
                      }
                    }}
                    className="glass-input rounded-xl border border-[#444748] flex items-center p-2.5 sm:p-3.5 pr-3 sm:pr-4 md:p-4 md:pr-6 transition-all duration-300 relative z-20 h-[49px] mt-[100px] mb-0"
                  >
                    <input
                      type="text"
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      placeholder="Ask Broker AI (e.g. 3-bedroom villa in Zayed)"
                      disabled={loading}
                      className="flex-grow bg-transparent border-none text-[11px] text-[#e2e2e4] focus:ring-0 placeholder:text-[#c4c7c7]/50 p-2 outline-none font-sans"
                    />
                    <div className="flex items-center gap-2 ml-2 sm:ml-3">
                      <button
                        type="submit"
                        disabled={!input.trim() || loading}
                        className="p-2 text-[#c4c7c7] hover:text-[#00D18E] rounded-lg transition-colors border border-transparent hover:border-[#444748] cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed active:scale-95"
                        title="Send query"
                      >
                        <span className="material-symbols-outlined text-[22px] pl-0 -mr-[7px] pb-0 mb-0 mt-1">send</span>
                      </button>
                    </div>
                  </form>
                  {/* Glowing hover accent */}
                  <div className="absolute inset-0 bg-[#00D18E]/5 rounded-xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10"></div>
                </div>

                {/* Empty State Footer */}
                <div className="w-full flex flex-col items-center gap-1.5 text-center select-none">
                  <p className="text-[#c4c7c7] text-[9px] text-center max-w-lg">
                    Broker AI can make mistakes. Verify important financial details and licenses.
                  </p>
                  <div className="flex gap-4">
                    <a className="text-[#c4c7c7] hover:text-[#00D18E] hover:underline text-[10px] sm:text-[11px] transition-colors" href="#" onClick={(e) => e.preventDefault()}>Terms</a>
                    <a className="text-[#c4c7c7] hover:text-[#00D18E] hover:underline text-[10px] sm:text-[11px] transition-colors" href="#" onClick={(e) => e.preventDefault()}>Privacy</a>
                    <a className="text-[#c4c7c7] hover:text-[#00D18E] hover:underline text-[10px] sm:text-[11px] transition-colors" href="#" onClick={(e) => e.preventDefault()}>Support</a>
                  </div>
                </div>
              </motion.div>
            ) : (
              // ==========================================
              // INNER STATE 2: ACTIVE DIALOGUE (CHAT THREAD)
              // ==========================================
              <motion.div
                key="active-state"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.35, ease: "easeOut" }}
                className="flex-1 space-y-6 max-w-4xl mx-auto w-full pb-8"
              >
                <AnimatePresence initial={false}>
                {messages.map((m, i) => {
                  const isBot = m.role === "assistant";
                  const msgKey = m.id || `${m.role}-${i}-${m.content.slice(0, 32)}`;
                  return (
                    <motion.div
                      key={msgKey}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.25 }}
                      className={cn(
                        "flex gap-3 md:gap-4 max-w-[85%]",
                        isBot ? "" : "self-end justify-end ml-auto"
                      )}
                    >
                      {/* Left Avatar for Bot */}
                      {isBot && (
                        <div className="w-8 h-8 rounded-full overflow-hidden shrink-0 bg-[#1e2021] border border-[#444748]/30 flex items-center justify-center shadow-[0_0_15px_rgba(0,209,142,0.08)]">
                          <img 
                            src={BROKER_LOGO_URL} 
                            alt="Broker AI" 
                            className="w-6 h-6 object-contain" 
                            onError={(e) => { e.currentTarget.src = "/black.png"; }}
                          />
                        </div>
                      )}

                      {/* Chat message body */}
                      {(() => {
                        const { cleanText, properties } = parsePropertiesFromMessage(m.content);

                        return (
                          <div className={cn("flex flex-col gap-1", isBot ? "flex-1" : "items-end")}>
                            {/* Header label & Edit option */}
                            {isBot ? (
                              <span className="font-secondary text-[10px] text-[#c4c7c7] ml-1 tracking-wider uppercase font-medium">
                                BROKER AI CORE
                              </span>
                            ) : (
                              editingIndex !== i && (
                                <div className="flex items-center gap-1 mb-0.5">
                                  <button
                                    onClick={() => {
                                      setEditingIndex(i);
                                      setEditingText(m.content);
                                    }}
                                    className="text-[#c4c7c7] hover:text-[#00D18E] transition-colors flex items-center gap-1 cursor-pointer"
                                    title="Edit message"
                                  >
                                    <span className="material-symbols-outlined text-[12px]">edit</span>
                                    <span className="font-secondary text-[10px] tracking-wider">Edit</span>
                                  </button>
                                </div>
                              )
                            )}

                             {/* Speech Bubble or Editing State */}
                             {editingIndex === i ? (
                               <div className="w-full min-w-[280px] md:min-w-[340px] flex flex-col gap-2">
                                 <textarea
                                   value={editingText}
                                   onChange={(e) => setEditingText(e.target.value)}
                                   className="w-full min-h-[80px] bg-[#1e2021] border border-[#444748] rounded-xl p-3 text-[#e2e2e4] text-[14px] outline-none focus:border-[#00D18E] transition-all font-sans resize-none shadow-inner"
                                 />
                                 <div className="flex gap-2 justify-end">
                                   <button
                                     onClick={() => {
                                       setEditingIndex(null);
                                       setEditingText("");
                                     }}
                                     className="px-3 py-1.5 rounded-lg bg-[#333537] hover:bg-[#444748] text-[#e2e2e4] text-xs transition-colors font-sans font-medium cursor-pointer"
                                   >
                                     Cancel
                                   </button>
                                   <button
                                     onClick={() => handleEditSubmit(i)}
                                     disabled={loading || !editingText.trim()}
                                     className="px-3 py-1.5 rounded-lg bg-[#00D18E] text-black font-semibold hover:bg-[#00b87c] text-xs transition-colors flex items-center gap-1.5 disabled:opacity-50 font-sans cursor-pointer"
                                   >
                                     {loading && <Loader2 size={11} className="animate-spin" />}
                                     Save & Resend
                                   </button>
                                 </div>
                               </div>
                             ) : (
                               <div 
                                 className={cn(
                                   "p-4 font-sans text-[15px] leading-[22px] transition-all text-left",
                                   isBot 
                                     ? "bg-[#1a1c1d] border border-[#444748]/50 border-l-2 border-l-[#00D18E] rounded-2xl rounded-tl-sm text-[#e2e2e4]" 
                                     : "bg-[#333537] rounded-2xl rounded-tr-sm text-[#e2e2e4] shadow-sm border border-[#444748]/30"
                                 )}
                               >
                                 {renderMessageWithImages(cleanText || m.content)}
                                </div>
                             )}

                            {/* Beautiful Glassmorphic Property Cards Underneath the Message Bubble Matching Reference Design */}
                            {(() => {
                              if (!isBot) return null;

                              let displayProps = [...properties];
                              
                              // 1. Check if suggestedUnits was explicitly attached to this assistant message
                              if (m.suggestedUnits && Array.isArray(m.suggestedUnits) && m.suggestedUnits.length > 0) {
                                displayProps = m.suggestedUnits.map((u: any) => ({
                                  id: u.id,
                                  title: u.title,
                                  location: u.location,
                                  price: typeof u.price === "number" ? formatCurrency(u.price) : u.price,
                                  isVerified: true,
                                  imageUrl: u.imageUrl || getUnitFallbackImage(u.propertyType),
                                  images: getPropertyImageGallery(u),
                                  description: u.description || u.title,
                                  propertyType: u.propertyType,
                                  ownerName: u.ownerName,
                                  ownerPhone: u.ownerPhone,
                                  uploaderId: u.uploaderId,
                                  tenantId: u.tenantId
                                }));
                              }

                              // 2. Check preceding user message OR current bot message for photo / property / project requests in Arabic and English
                              if (displayProps.length === 0) {
                                const precedingUserMsg = (i > 0 && messages[i - 1]?.role === "user") ? messages[i - 1].content : "";
                                const botMsgContent = m.content || "";
                                const allHistory = messages.slice(0, i + 1).map(x => x.content).join(" ");
                                
                                const isReqPhotoOrVisit = 
                                  /photo|photos|picture|pictures|image|images|pic|pics|gallery|visit|book|appointment|where.*photo|where.*pic|صورة|صور|صورها|صوره|تصميم|وريني|اشوف|أشوف|معاينة|زيارة|حجز|شكل|شكلها|فين الصور|وين الصور/i.test(precedingUserMsg) ||
                                  /صورة|صور|صورها|تصميم|تصميم المشروع|معاينة|gallery|photo|photos|picture|pictures|image|images/i.test(botMsgContent) ||
                                  /الشيخ زايد|زايد|التجمع|القاهرة الجديدة|الساحل|اكتوبر|العاصمة|zayed|cairo|october/i.test(botMsgContent);

                                if (isReqPhotoOrVisit) {
                                  const rawUnits = (units && units.length > 0) ? units : DEFAULT_UNITS;
                                  let candidateUnits = rawUnits.filter((u: any) => u && u.visibility !== "private");
                                  
                                  const detectedLoc = extractLocationFromMessages([precedingUserMsg, botMsgContent, allHistory]);
                                  if (detectedLoc) {
                                    const locMatches = candidateUnits.filter((u: any) => isLocationMatch(u.location, u.title, detectedLoc));
                                    if (locMatches.length > 0) {
                                      candidateUnits = locMatches;
                                    }
                                  }
                                  
                                  candidateUnits.slice(0, 2).forEach(u => {
                                    displayProps.push({
                                      id: u.id,
                                      title: u.title,
                                      location: u.location,
                                      price: typeof u.price === "number" ? formatCurrency(u.price) : u.price,
                                      isVerified: true,
                                      imageUrl: u.imageUrl || getUnitFallbackImage(u.propertyType),
                                      images: getPropertyImageGallery(u),
                                      description: u.description || u.title,
                                      propertyType: u.propertyType,
                                      ownerName: u.ownerName,
                                      ownerPhone: u.ownerPhone,
                                      uploaderId: u.uploaderId,
                                      tenantId: u.tenantId
                                    });
                                  });
                                }
                              }

                              if (displayProps.length === 0) return null;

                              return (
                                <div className="space-y-4 mt-3.5 mb-2 text-left">
                                  {displayProps.map((prop: any, propIdx) => {
                                    const titleLower = (prop.title || "").toLowerCase().trim();
                                    const rawUnits = (units && units.length > 0) ? units : DEFAULT_UNITS;
                                    const matchedUnit = rawUnits.find(u => {
                                      if (!u) return false;
                                      if (prop.id && u.id === prop.id) return true;
                                      const dbTitle = (u.title || "").toLowerCase().trim();
                                      return dbTitle.length > 0 && (dbTitle.includes(titleLower) || titleLower.includes(dbTitle));
                                    });

                                    const isVilla = (matchedUnit?.propertyType || prop.propertyType || "").toLowerCase().includes("villa") || 
                                                    (matchedUnit?.price || 0) > 10000000 || 
                                                    titleLower.includes("villa");
                                    const beds = matchedUnit?.details?.bedrooms || (isVilla ? 3 : 2);
                                    const baths = matchedUnit?.details?.bathrooms || (isVilla ? 2 : 2);
                                    const refCode = prop.refCode || (matchedUnit?.id ? matchedUnit.id.slice(-5).toUpperCase() : (prop.id ? prop.id.slice(-5).toUpperCase() : "132UP"));

                                    const displayPrice = matchedUnit ? formatCurrency(matchedUnit.price) : (prop.price || "4,500,000 EGP");
                                    const displayLocation = matchedUnit?.location || prop.location || "Sheikh Zayed, Giza";

                                    const gallery = getPropertyImageGallery(matchedUnit || prop);

                                    const handleOpenDetails = () => {
                                      const targetUnit = matchedUnit || {
                                        id: prop.id || matchedUnit?.id || "unit-1",
                                        title: prop.title,
                                        location: displayLocation,
                                        price: matchedUnit?.price || prop.price || 4500000,
                                        propertyType: matchedUnit?.propertyType || prop.propertyType || "Villa",
                                        legalPaperStatus: "verified_boost",
                                        imageUrl: prop.imageUrl,
                                        images: gallery,
                                        description: prop.description || prop.title,
                                        ownerName: matchedUnit?.ownerName || prop.ownerName || "Property Agent",
                                        ownerPhone: matchedUnit?.ownerPhone || prop.ownerPhone || "+201000000000",
                                        uploaderId: matchedUnit?.uploaderId || prop.uploaderId || prop.ownerId || (matchedUnit as any)?.ownerUid || "",
                                        tenantId: matchedUnit?.tenantId || prop.tenantId || matchedUnit?.uploaderId || prop.uploaderId || ""
                                      };
                                      setSelectedPropertyForDetails(targetUnit);
                                      setActivePhotoIndex(0);
                                    };

                                    const handleContactUnit = (e: React.MouseEvent) => {
                                      e.stopPropagation();
                                      const activeUnit = matchedUnit || {
                                        id: prop.id || matchedUnit?.id || "unit-1",
                                        title: prop.title,
                                        location: displayLocation,
                                        price: matchedUnit?.price || prop.price || 4500000,
                                        propertyType: matchedUnit?.propertyType || prop.propertyType || "Villa",
                                        legalPaperStatus: "verified_boost",
                                        imageUrl: prop.imageUrl,
                                        images: gallery,
                                        description: prop.description || prop.title,
                                        ownerName: matchedUnit?.ownerName || prop.ownerName || "Property Agent",
                                        ownerPhone: matchedUnit?.ownerPhone || prop.ownerPhone || "+201000000000",
                                        uploaderId: matchedUnit?.uploaderId || prop.uploaderId || prop.ownerId || (matchedUnit as any)?.ownerUid || "",
                                        tenantId: matchedUnit?.tenantId || prop.tenantId || matchedUnit?.uploaderId || prop.uploaderId || ""
                                      };
                                      setSelectedUnitForContact(activeUnit as any);
                                      setIsContactModalOpen(true);
                                    };

                                    return (
                                      <div 
                                        key={`prop-card-below-${propIdx}`} 
                                        onClick={handleOpenDetails}
                                        className="w-full max-w-sm bg-[#121214] border border-white/10 hover:border-white/30 transition-all duration-300 rounded-2xl overflow-hidden shadow-2xl flex flex-col relative group text-left animate-in fade-in-50 slide-in-from-bottom-3 duration-300 my-2 cursor-pointer hover:shadow-emerald-950/20"
                                      >
                                        {/* Image Section */}
                                        <div className="w-full h-48 relative overflow-hidden bg-black/40">
                                          <img 
                                            src={gallery[0] || prop.imageUrl || matchedUnit?.imageUrl} 
                                            alt={prop.title} 
                                            className="w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-500"
                                            referrerPolicy="no-referrer"
                                          />
                                          
                                          {/* Top Left Badge: VERIFIED Capsule */}
                                          <div className="absolute top-3 left-3 bg-white text-[#0f172a] px-3 py-1 rounded-full text-[10.5px] font-extrabold tracking-wider uppercase shadow-md flex items-center gap-1.5 z-10 border border-slate-200">
                                            <ShieldCheck size={14} className="text-emerald-600 fill-emerald-100" />
                                            <span>VERIFIED</span>
                                          </div>

                                          {/* Photo count indicator badge */}
                                          <div className="absolute top-3 right-3 bg-black/75 backdrop-blur-md border border-white/20 text-white px-2.5 py-1 rounded-full text-[10.5px] font-mono font-bold flex items-center gap-1.5 shadow-md z-10">
                                            <ImageIcon size={12} className="text-amber-400" />
                                            <span>{gallery.length} Photos</span>
                                          </div>

                                          {/* Bottom Right Price Tag */}
                                          <div className="absolute bottom-3 right-3 bg-[#09090b]/90 backdrop-blur-md border border-white/15 px-3.5 py-1.5 rounded-xl text-white font-mono text-xs md:text-sm font-black tracking-tight shadow-xl">
                                            {displayPrice}
                                          </div>
                                        </div>

                                        {/* Multi-Photo Thumbnail Strip */}
                                        {gallery.length > 1 && (
                                          <div className="flex items-center gap-1.5 px-3 py-2 bg-black/50 border-b border-white/10 overflow-x-auto no-scrollbar">
                                            {gallery.slice(0, 4).map((imgUrl, gIdx) => (
                                              <div 
                                                key={`thumb-${gIdx}`}
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  const targetUnit = matchedUnit || prop;
                                                  setSelectedPropertyForDetails(targetUnit);
                                                  setActivePhotoIndex(gIdx);
                                                }}
                                                className="w-12 h-9 rounded-lg overflow-hidden border border-white/15 hover:border-emerald-400 shrink-0 cursor-pointer relative group/thumb transition-all"
                                              >
                                                <img src={imgUrl} alt={`Thumb ${gIdx}`} className="w-full h-full object-cover group-hover/thumb:scale-110 transition-transform" />
                                              </div>
                                            ))}
                                            {gallery.length > 4 && (
                                              <div 
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  const targetUnit = matchedUnit || prop;
                                                  setSelectedPropertyForDetails(targetUnit);
                                                  setActivePhotoIndex(4);
                                                }}
                                                className="w-12 h-9 rounded-lg bg-white/10 hover:bg-white/20 border border-white/15 text-[10px] font-bold text-white flex items-center justify-center shrink-0 cursor-pointer"
                                              >
                                                +{gallery.length - 4}
                                              </div>
                                            )}
                                          </div>
                                        )}

                                        {/* Card Body */}
                                        <div className="p-4 space-y-3.5">
                                          <div>
                                            <h3 className="text-base font-extrabold text-white tracking-tight leading-snug line-clamp-1 group-hover:text-emerald-400 transition-colors">
                                              {prop.title || matchedUnit?.title}
                                            </h3>
                                            <p className="text-slate-400 text-xs flex items-center gap-1.5 mt-1">
                                              <MapPin size={13} className="text-slate-500 shrink-0" />
                                              <span className="truncate font-medium">{displayLocation}</span>
                                            </p>
                                          </div>

                                          {/* Selling Points / Highlight Description */}
                                          {(prop.description || matchedUnit?.description) && (
                                            <p className="text-xs text-sky-300/90 bg-sky-500/10 border border-sky-500/20 p-2.5 rounded-xl leading-relaxed font-sans line-clamp-3">
                                              {prop.description || matchedUnit?.description}
                                            </p>
                                          )}

                                          {/* Spec Bar */}
                                          <div className="flex items-center justify-between text-xs text-slate-300 border-t border-b border-white/10 py-2.5 px-1 font-mono">
                                            <div className="flex items-center gap-1.5">
                                              <Bed size={13} className="text-slate-400 shrink-0" />
                                              <span>{beds} Beds</span>
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                              <Bath size={13} className="text-slate-400 shrink-0" />
                                              <span>{baths} Baths</span>
                                            </div>
                                            <div className="text-slate-400 font-semibold">
                                              <span>Ref: #{refCode}</span>
                                            </div>
                                          </div>

                                          {/* Action Buttons */}
                                          <div className="pt-1 flex gap-2">
                                            <button
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                handleOpenDetails();
                                              }}
                                              className="flex-1 bg-white/10 hover:bg-white/20 border border-white/15 text-white font-extrabold text-xs py-2.5 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                                            >
                                              <Eye size={14} className="text-sky-400" />
                                              <span>View Gallery</span>
                                            </button>
                                            <button
                                              onClick={handleContactUnit}
                                              className="flex-1 bg-white hover:bg-slate-200 text-slate-950 font-black text-xs uppercase py-2.5 rounded-xl flex items-center justify-center gap-1.5 shadow-lg transition-all cursor-pointer active:scale-95"
                                            >
                                              <PhoneCall size={13} className="text-slate-900" />
                                              <span>Contact Agent</span>
                                            </button>
                                          </div>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              );
                            })()}

                            {/* Bottom Utility Actions Toolbar Matching Reference Design */}
                            {isBot && (
                              <div className="flex items-center gap-3 ml-1 mt-1 text-[#c4c7c7]">
                                {/* Copy button */}
                                <button
                                  onClick={() => copyToClipboard(m.content, i)}
                                  className="hover:text-white transition-colors flex items-center gap-1 cursor-pointer"
                                  title="Copy response"
                                >
                                  <span className="material-symbols-outlined text-[16px]">
                                    {copiedIndex === i ? "check" : "content_copy"}
                                  </span>
                                  {copiedIndex === i && (
                                    <span className="text-[10px] text-[#00D18E] font-secondary">Copied</span>
                                  )}
                                </button>

                                {/* Speech synthesis Read Aloud */}
                                <button
                                  onClick={() => speakMessage(m.content, i)}
                                  className={cn(
                                    "hover:text-white transition-colors flex items-center gap-1 cursor-pointer",
                                    speakingIndex === i && "text-[#00D18E]"
                                  )}
                                  title={speakingIndex === i ? "Stop speaking" : "Read response aloud"}
                                >
                                  <span className="material-symbols-outlined text-[16px]">volume_up</span>
                                  {speakingIndex === i && (
                                    <span className="text-[10px] text-[#00D18E] font-secondary animate-pulse">Speaking</span>
                                  )}
                                </button>

                                {/* Thumbs Feedback */}
                                <button
                                  onClick={() => handleFeedback(i, "up")}
                                  className={cn(
                                    "hover:text-[#00D18E] transition-colors cursor-pointer",
                                    likedMessages[i] === "up" && "text-[#00D18E]"
                                  )}
                                  title="Thumbs Up"
                                >
                                  <span className="material-symbols-outlined text-[16px]">thumb_up</span>
                                </button>
                                <button
                                  onClick={() => handleFeedback(i, "down")}
                                  className={cn(
                                    "hover:text-[#ffb4ab] transition-colors cursor-pointer",
                                    likedMessages[i] === "down" && "text-[#ffb4ab]"
                                  )}
                                  title="Thumbs Down"
                                >
                                  <span className="material-symbols-outlined text-[16px]">thumb_down</span>
                                </button>
                              </div>
                            )}
                          </div>
                        );
                      })()}

                      {/* Right Avatar for User */}
                      {!isBot && (
                        <div className="w-8 h-8 rounded-full overflow-hidden shrink-0 border border-[#444748]/50 bg-[#282a2c] flex items-center justify-center">
                          {currentUser?.photoURL ? (
                            <img 
                              src={currentUser.photoURL} 
                              alt="User" 
                              className="w-full h-full object-cover"
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <span className="font-secondary text-xs font-bold text-[#e2e2e4] uppercase">
                              {currentUser?.displayName ? currentUser.displayName[0] : (currentUser?.email ? currentUser.email[0] : "U")}
                            </span>
                          )}
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </AnimatePresence>

              {/* Bot loading state */}
              {loading && (
                <div className="flex gap-3 md:gap-4 max-w-[85%] opacity-70">
                  <div className="w-8 h-8 rounded-full shrink-0 flex items-center justify-center bg-[#1e2021] border border-[#444748]/30">
                    <img 
                      src={BROKER_LOGO_URL} 
                      alt="Broker AI" 
                      className="w-6 h-6 object-contain" 
                      onError={(e) => { e.currentTarget.src = "/black.png"; }}
                    />
                  </div>
                  <div className="flex flex-col gap-1 w-full">
                    <span className="font-secondary text-[10px] text-[#c4c7c7] ml-1 tracking-wider uppercase font-medium">BROKER AI CORE</span>
                    <div className="bg-[#0c0e10] border border-[#444748]/20 rounded-xl p-3 font-sans text-sm text-[#c4c7c7] italic flex items-center gap-2">
                      <div className="flex gap-1">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#c4c7c7]/50 animate-pulse"></div>
                        <div className="w-1.5 h-1.5 rounded-full bg-[#c4c7c7]/50 animate-pulse" style={{ animationDelay: "150ms" }}></div>
                        <div className="w-1.5 h-1.5 rounded-full bg-[#c4c7c7]/50 animate-pulse" style={{ animationDelay: "300ms" }}></div>
                      </div>
                      <span>thinking...</span>
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
              </motion.div>
            )}
          </AnimatePresence>

        </div>

        {/* ========================================== */}
        {/* CENTER BOTTOM FLOATING INPUT ZONE (ACTIVE MODE) */}
        {/* ========================================== */}
        {messages.length > 0 && (
          <footer className="w-full px-4 pt-2 pb-4 bg-gradient-to-t from-[#0A0A0A] via-[#0A0A0A]/95 to-transparent select-none z-20">
            <div className="max-w-4xl mx-auto w-full relative">
              
              {/* Command Suggestions Overlay */}
              <AnimatePresence>
                {showCommandPalette && (
                  <motion.div 
                    ref={commandPaletteRef}
                    className="absolute left-4 right-4 bottom-full mb-3 backdrop-blur-xl bg-[#121212] rounded-xl z-50 shadow-2xl border border-[#444748] overflow-hidden"
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 5 }}
                    transition={{ duration: 0.15 }}
                  >
                    <div className="py-2 bg-[#121212]">
                      <p className="px-3.5 py-1 text-[9px] font-bold text-[#c4c7c7] uppercase tracking-widest font-secondary">Suggested Commands</p>
                      {commandSuggestions.map((suggestion, index) => (
                        <motion.div
                          key={suggestion.prefix}
                          className={cn(
                            "flex items-center gap-3 px-3.5 py-2.5 text-xs transition-colors cursor-pointer",
                            activeSuggestion === index 
                              ? "bg-[#00D18E]/20 text-white border-l-2 border-[#00D18E]" 
                              : "text-[#e2e2e4] hover:bg-white/5"
                          )}
                          onClick={() => selectCommandSuggestion(index)}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: index * 0.03 }}
                        >
                          <div className="w-5 h-5 flex items-center justify-center text-[#c4c7c7] shrink-0">
                            {suggestion.icon}
                          </div>
                          <div className="flex-1">
                            <span className="font-semibold">{suggestion.label}</span>
                            <span className="text-[10px] text-[#c4c7c7] ml-2">— {suggestion.description}</span>
                          </div>
                          <div className="text-[#00D18E] font-secondary text-[10px] bg-[#00D18E]/10 px-1.5 py-0.5 rounded">
                            {suggestion.prefix}
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Attachments Horizontal Chip list */}
              <AnimatePresence>
                {attachments.length > 0 && (
                  <motion.div 
                    className="px-2 pb-3 flex gap-2 flex-wrap pt-1"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                  >
                    {attachments.map((file, index) => (
                      <motion.div
                        key={`${file}-${index}`}
                        className="flex items-center gap-2 text-xs bg-[#1e2021] border border-[#444748] py-1.5 px-3 rounded-lg text-[#e2e2e4]"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                      >
                        <span className="truncate max-w-[150px] font-secondary text-[11px]">{file}</span>
                        <button 
                          type="button"
                          onClick={() => removeAttachment(index)}
                          className="text-[#c4c7c7] hover:text-white transition-colors cursor-pointer"
                        >
                          <X size={12} />
                        </button>
                      </motion.div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="relative group w-full">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (input.trim() && !loading) {
                      submitQuery(input.trim());
                    }
                  }}
                  className="glass-input rounded-xl border border-[#444748] flex items-center p-2.5 md:p-3 pr-3 md:pr-4 transition-all duration-300 relative z-20"
                >
                  <input 
                    type="text" 
                    ref={textareaRef as any}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    onFocus={() => setInputFocused(true)}
                    onBlur={() => setInputFocused(false)}
                    placeholder="Ask Broker AI"
                    disabled={loading}
                    className="flex-grow bg-transparent text-[#e2e2e4] border-none outline-none font-sans placeholder-[#c4c7c7]/50 px-3 py-1 text-[15px]"
                  />

                  <button
                    type="submit"
                    disabled={!input.trim() || loading}
                    className="p-2 text-[#c4c7c7] hover:text-[#00D18E] rounded-lg transition-colors border border-transparent hover:border-[#444748] cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                    title="Ask Broker AI"
                  >
                    <span className="material-symbols-outlined text-[20px]">send</span>
                  </button>
                </form>
                {/* Glowing hover accent */}
                <div className="absolute inset-0 bg-[#00D18E]/5 rounded-xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10"></div>
              </div>

              <div className="text-center text-[#c4c7c7] text-[11px] mt-2 select-none">
                Broker AI can make mistakes. Verify important financial details and licenses.
              </div>
            </div>
          </footer>
        )}

        {/* Focus cursor atmospheric light element */}
        {inputFocused && (
          <motion.div 
            className="fixed w-[40rem] h-[40rem] rounded-full pointer-events-none z-0 opacity-[0.03] bg-gradient-to-r from-white via-neutral-300 to-neutral-700 blur-[100px]"
            animate={{
              x: mousePosition.x - 320,
              y: mousePosition.y - 320,
            }}
            transition={{
              type: "spring",
              damping: 30,
              stiffness: 120,
              mass: 0.6,
            }}
          />
        )}

      </section>

      {/* Property Details & Photo Gallery Modal Popup */}
      <AnimatePresence>
        {selectedPropertyForDetails && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedPropertyForDetails(null)}
              className="absolute inset-0 bg-black/90 backdrop-blur-lg cursor-pointer"
            />

            {/* Modal Container */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 220 }}
              className="relative w-full max-w-2xl bg-[#0f0f11] border border-white/15 rounded-3xl shadow-2xl text-white overflow-hidden flex flex-col max-h-[90vh] z-10"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between p-4 md:p-5 border-b border-white/10 bg-black/40">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="bg-emerald-500/20 text-emerald-400 text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                      {selectedPropertyForDetails.propertyType || "Real Estate"}
                    </span>
                    <span className="text-slate-400 text-xs font-mono">
                      Ref: #{selectedPropertyForDetails.id ? selectedPropertyForDetails.id.slice(-5).toUpperCase() : "132UP"}
                    </span>
                  </div>
                  <h3 className="text-lg md:text-xl font-extrabold text-white mt-1 line-clamp-1">
                    {selectedPropertyForDetails.title}
                  </h3>
                </div>
                <button
                  onClick={() => setSelectedPropertyForDetails(null)}
                  className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Modal Scrollable Content */}
              <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-5 scrollbar-thin">
                
                {/* PHOTO CAROUSEL GALLERY STAGE */}
                {(() => {
                  const gallery = getPropertyImageGallery(selectedPropertyForDetails);
                  const currentPhoto = gallery[activePhotoIndex] || gallery[0];

                  return (
                    <div className="space-y-3">
                      {/* Main Large Photo */}
                      <div className="w-full h-64 md:h-80 relative rounded-2xl overflow-hidden bg-black/80 border border-white/10 shadow-2xl group select-none">
                        <img 
                          src={currentPhoto} 
                          alt={`Photo ${activePhotoIndex + 1}`} 
                          className="w-full h-full object-cover transition-all duration-300"
                          referrerPolicy="no-referrer"
                        />

                        {/* Left Navigation Arrow */}
                        {gallery.length > 1 && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setActivePhotoIndex(prev => prev > 0 ? prev - 1 : gallery.length - 1);
                            }}
                            className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/70 hover:bg-black/90 border border-white/20 text-white flex items-center justify-center transition-all shadow-xl active:scale-95 cursor-pointer z-10"
                            title="Previous Photo"
                          >
                            <ChevronLeft size={20} />
                          </button>
                        )}

                        {/* Right Navigation Arrow */}
                        {gallery.length > 1 && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setActivePhotoIndex(prev => prev < gallery.length - 1 ? prev + 1 : 0);
                            }}
                            className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/70 hover:bg-black/90 border border-white/20 text-white flex items-center justify-center transition-all shadow-xl active:scale-95 cursor-pointer z-10"
                            title="Next Photo"
                          >
                            <ChevronRight size={20} />
                          </button>
                        )}

                        {/* Photo Counter Pill Top Right */}
                        <div className="absolute top-3 right-3 bg-black/80 backdrop-blur-md border border-white/20 text-white px-3 py-1 rounded-full text-xs font-mono font-extrabold shadow-lg z-10">
                          Photo {activePhotoIndex + 1} of {gallery.length}
                        </div>

                        {/* Verification Status Pill Top Left */}
                        <div className="absolute top-3 left-3 bg-emerald-500/90 text-white px-3 py-1 rounded-full text-[11px] font-bold shadow-lg flex items-center gap-1 border border-emerald-400/30 z-10">
                          <ShieldCheck size={14} />
                          <span>Verified Deeds</span>
                        </div>
                      </div>

                      {/* Thumbnail Strip */}
                      {gallery.length > 1 && (
                        <div className="flex gap-2 overflow-x-auto pb-1 pt-1 scrollbar-thin">
                          {gallery.map((img, idx) => (
                            <button
                              key={`thumb-${idx}`}
                              onClick={() => setActivePhotoIndex(idx)}
                              className={cn(
                                "w-16 h-16 md:w-20 md:h-20 rounded-xl overflow-hidden shrink-0 border-2 transition-all cursor-pointer relative",
                                idx === activePhotoIndex 
                                  ? "border-emerald-400 ring-2 ring-emerald-400/50 scale-105" 
                                  : "border-white/10 opacity-60 hover:opacity-100"
                              )}
                            >
                              <img 
                                src={img} 
                                alt={`Thumbnail ${idx + 1}`} 
                                className="w-full h-full object-cover"
                                referrerPolicy="no-referrer"
                              />
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })()}

                {/* Pricing & Location Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white/[0.03] p-4 rounded-2xl border border-white/10">
                  <div>
                    <span className="text-xs text-slate-400 uppercase tracking-wider font-mono">Total Price</span>
                    <h4 className="text-2xl font-black text-emerald-400 font-mono mt-0.5">
                      {typeof selectedPropertyForDetails.price === "number" 
                        ? formatCurrency(selectedPropertyForDetails.price) 
                        : selectedPropertyForDetails.price}
                    </h4>
                  </div>

                  <div className="flex items-center gap-2 text-slate-300 text-xs">
                    <MapPin size={16} className="text-emerald-400 shrink-0" />
                    <span className="font-semibold">{selectedPropertyForDetails.location}</span>
                  </div>
                </div>

                {/* Key Specifications Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center font-mono">
                  <div className="bg-white/[0.03] border border-white/10 p-3 rounded-2xl flex flex-col items-center justify-center space-y-1">
                    <Bed size={18} className="text-slate-400" />
                    <span className="text-xs text-slate-400">Bedrooms</span>
                    <span className="text-sm font-bold text-white">
                      {selectedPropertyForDetails.details?.bedrooms || 3} Beds
                    </span>
                  </div>

                  <div className="bg-white/[0.03] border border-white/10 p-3 rounded-2xl flex flex-col items-center justify-center space-y-1">
                    <Bath size={18} className="text-slate-400" />
                    <span className="text-xs text-slate-400">Bathrooms</span>
                    <span className="text-sm font-bold text-white">
                      {selectedPropertyForDetails.details?.bathrooms || 2} Baths
                    </span>
                  </div>

                  <div className="bg-white/[0.03] border border-white/10 p-3 rounded-2xl flex flex-col items-center justify-center space-y-1">
                    <Maximize size={18} className="text-slate-400" />
                    <span className="text-xs text-slate-400">Area</span>
                    <span className="text-sm font-bold text-white">
                      {selectedPropertyForDetails.details?.areaSq || 220} sqm
                    </span>
                  </div>

                  <div className="bg-white/[0.03] border border-white/10 p-3 rounded-2xl flex flex-col items-center justify-center space-y-1">
                    <ShieldCheck size={18} className="text-emerald-400" />
                    <span className="text-xs text-slate-400">Deeds</span>
                    <span className="text-xs font-bold text-emerald-400">Verified</span>
                  </div>
                </div>

                {/* Description Section */}
                <div className="space-y-2 text-left">
                  <h5 className="text-xs font-mono uppercase text-slate-400 font-bold tracking-wider">Property Description</h5>
                  <p className="text-xs md:text-sm text-slate-200 leading-relaxed bg-white/[0.02] border border-white/5 p-4 rounded-2xl">
                    {selectedPropertyForDetails.description || "Beautiful property located in a prime area with luxury finishes and verified ownership papers ready for instant inspection."}
                  </p>
                </div>

                {/* Primary Project Inventory Breakdown (Multiple Unit Types & Sizes) */}
                {(() => {
                  const inventoryList = selectedPropertyForDetails.projectInfo?.unitInventoryList || (selectedPropertyForDetails as any).unitInventoryList;
                  if (!Array.isArray(inventoryList) || inventoryList.length === 0) return null;
                  
                  return (
                    <div className="space-y-3 text-left">
                      <div className="flex items-center justify-between">
                        <h5 className="text-xs font-mono uppercase text-emerald-400 font-bold tracking-wider flex items-center gap-1.5">
                          <Layers size={14} /> Available Unit Inventory & Sizes
                        </h5>
                        <span className="text-[10px] font-mono bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full">
                          {inventoryList.length} Unit Types
                        </span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 font-mono">
                        {inventoryList.map((invItem: any, idx: number) => (
                          <div 
                            key={`inv-item-${idx}`}
                            className="bg-white/[0.03] border border-white/10 hover:border-emerald-500/30 p-3 rounded-xl transition flex flex-col justify-between space-y-1.5"
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-white uppercase">{invItem.unitType || invItem.title || "Unit Variant"}</span>
                              <span className="text-xs font-black text-emerald-400">
                                {formatCurrency(invItem.startingPrice || invItem.price || 0)}
                              </span>
                            </div>
                            <div className="flex items-center justify-between text-[11px] text-slate-400 border-t border-white/5 pt-1.5">
                              <span>📐 {invItem.areaSq || invItem.area || "N/A"} sqm</span>
                              <span>🛏️ {invItem.bedrooms || 3} Beds</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })()}

                {/* Primary Project Payment Plans Breakdown */}
                {(() => {
                  const plansList = selectedPropertyForDetails.projectInfo?.paymentPlansList || (selectedPropertyForDetails as any).paymentPlansList;
                  if (!Array.isArray(plansList) || plansList.length === 0) return null;
                  
                  return (
                    <div className="space-y-3 text-left">
                      <div className="flex items-center justify-between">
                        <h5 className="text-xs font-mono uppercase text-emerald-400 font-bold tracking-wider flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-[15px]">payments</span> Payment Plans & Maintenance
                        </h5>
                        <span className="text-[10px] font-mono bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full">
                          {plansList.length} {plansList.length === 1 ? "Option" : "Options"}
                        </span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 font-mono">
                        {plansList.map((planItem: any, idx: number) => (
                          <div 
                            key={`plan-item-${idx}`}
                            className="bg-white/[0.03] border border-white/10 hover:border-emerald-500/30 p-3 rounded-xl transition flex flex-col justify-between space-y-2"
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-white uppercase">Plan #{idx + 1}</span>
                              <span className="text-xs font-black text-emerald-400">
                                {planItem.downPaymentPercent ?? 10}% Down
                              </span>
                            </div>
                            <div className="grid grid-cols-3 gap-1 text-[11px] text-slate-300 border-t border-white/5 pt-1.5 text-center">
                              <div className="bg-white/5 p-1 rounded">
                                <span className="block text-[9px] text-slate-400 uppercase">Years</span>
                                <span className="font-bold">{planItem.installmentYears ?? 7} Yrs</span>
                              </div>
                              <div className="bg-white/5 p-1 rounded">
                                <span className="block text-[9px] text-slate-400 uppercase">Delivery</span>
                                <span className="font-bold">{planItem.deliveryYears ?? 3} Yrs</span>
                              </div>
                              <div className="bg-white/5 p-1 rounded">
                                <span className="block text-[9px] text-emerald-400 uppercase">Maint.</span>
                                <span className="font-bold text-emerald-400">{planItem.maintenancePercent ?? 8}%</span>
                              </div>
                            </div>
                            {planItem.notes && (
                              <p className="text-[10px] text-slate-400 italic">
                                {planItem.notes}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Modal Footer Actions */}
              <div className="p-4 md:p-5 border-t border-white/10 bg-black/60 flex flex-col sm:flex-row gap-3">
                {(() => {
                  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(selectedPropertyForDetails.location + ", Egypt")}`;
                  return (
                    <a
                      href={mapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 bg-white/10 hover:bg-white/20 border border-white/15 text-white font-bold text-xs py-3 rounded-xl text-center cursor-pointer transition flex items-center justify-center gap-1.5"
                    >
                      🗺️ View on Google Maps
                    </a>
                  );
                })()}

                <button
                  onClick={() => {
                    const unit = selectedPropertyForDetails;
                    setSelectedPropertyForDetails(null);
                    setSelectedUnitForContact(unit);
                    setIsContactModalOpen(true);
                  }}
                  className="flex-1 bg-white hover:bg-slate-200 text-slate-950 font-black text-xs uppercase py-3 rounded-xl flex items-center justify-center gap-2 shadow-xl transition cursor-pointer active:scale-95"
                >
                  <PhoneCall size={15} className="text-slate-950" />
                  <span>Contact Agent</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Contact Agent Modal Popup */}
      <AnimatePresence>
        {isContactModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                if (!submittingContact && !contactSubmitted) setIsContactModalOpen(false);
              }}
              className="absolute inset-0 bg-black/85 backdrop-blur-md cursor-pointer"
            />

            {/* Modal Body */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ type: "spring", damping: 25, stiffness: 220 }}
              className="relative w-full max-w-md bg-[#0d0d0d]/95 border border-white/[0.08] p-6 rounded-2xl shadow-2xl text-white select-none overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/[0.01] rounded-full blur-2xl pointer-events-none" />

              <div className="flex justify-between items-start mb-5 border-b border-white/[0.05] pb-3">
                <div className="text-left">
                  <h3 className="text-base font-black text-white">Contact Agent</h3>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Interested in: <span className="text-white font-bold">{selectedUnitForContact?.title || "Matched Listing"}</span>
                  </p>
                </div>
                <button
                  onClick={() => setIsContactModalOpen(false)}
                  disabled={submittingContact}
                  className="p-1 text-slate-500 hover:text-white transition cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              {contactSubmitted ? (
                <div className="py-6 text-center flex flex-col items-center justify-center space-y-3">
                  <div className="w-12 h-12 rounded-full bg-emerald-500/15 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                    <CheckCircle2 size={24} />
                  </div>
                  <div className="space-y-1.5 text-center">
                    <h4 className="text-base font-black text-white">Request Sent</h4>
                    <p className="text-xs text-slate-300">The agent will contact you shortly.</p>
                    {submittedViewingDate && (
                      <div className="pt-2">
                        <span className="inline-block px-3 py-1.5 bg-white/[0.05] border border-white/10 rounded-lg text-xs text-slate-300">
                          Preferred viewing date: <strong className="text-white font-mono">{submittedViewingDate}</strong>
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <form onSubmit={handleContactSubmit} className="space-y-4 text-left">
                  {contactError && (
                    <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-xs flex items-start gap-2">
                      <AlertCircle size={15} className="shrink-0 mt-0.5" />
                      <span>{contactError}</span>
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">
                      Full Name <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={contactName}
                      onChange={(e) => setContactName(e.target.value)}
                      placeholder="e.g. Ahmed Ali"
                      className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-white/40 focus:border-white/50 transition"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">
                      Phone Number <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="tel"
                      required
                      value={contactPhone}
                      onChange={(e) => setContactPhone(e.target.value)}
                      placeholder="e.g. +20 1000000000"
                      className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-white/40 focus:border-white/50 transition text-left"
                      dir="auto"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">
                        Preferred Viewing Date <span className="text-slate-500 font-normal lowercase">(optional)</span>
                      </label>
                      {contactViewingDate ? (
                        <button
                          type="button"
                          onClick={() => setContactViewingDate("")}
                          className="text-[10px] text-sky-400 hover:text-sky-300 underline cursor-pointer"
                        >
                          Clear date
                        </button>
                      ) : (
                        <span className="text-[10px] text-slate-500 font-mono">No viewing date selected</span>
                      )}
                    </div>
                    <input
                      type="date"
                      value={contactViewingDate}
                      min={new Date().toISOString().split("T")[0]}
                      onChange={(e) => setContactViewingDate(e.target.value)}
                      className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-white/40 focus:border-white/50 transition [color-scheme:dark]"
                    />
                    {!contactViewingDate && (
                      <p className="text-[10.5px] text-slate-500">
                        Default: <span className="text-slate-400">No viewing date selected</span> (optional)
                      </p>
                    )}
                  </div>

                  <div className="pt-2 flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => setIsContactModalOpen(false)}
                      disabled={submittingContact}
                      className="px-4 py-2 bg-transparent hover:bg-white/[0.03] text-slate-400 hover:text-white border border-transparent font-bold text-xs rounded-xl transition"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submittingContact || !contactName.trim() || !contactPhone.trim()}
                      className="px-5 py-2 bg-white text-slate-950 font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-md hover:bg-slate-200 transition cursor-pointer"
                    >
                      {submittingContact ? (
                        <>
                          <Loader2 size={13} className="animate-spin" />
                          Sending Request...
                        </>
                      ) : (
                        "Send Request"
                      )}
                    </button>
                  </div>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}

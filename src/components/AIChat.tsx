import React, { useState, useRef, useEffect } from "react";
import { Message, Lead, Unit } from "../types";
import { 
  Sparkles, Send, MapPin, Building, DollarSign, FileCheck, ArrowRight, 
  RefreshCw, AlertCircle, Paperclip, ArrowUp, MessageSquare, Plus, 
  PanelLeftClose, PanelLeft, PanelRightClose, PanelRight, ChevronDown, 
  Copy, Check, ThumbsUp, ThumbsDown, Volume2, Trash2, Settings, 
  HelpCircle, LogOut, Info, ShieldAlert, Command, X 
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { COUNTRIES } from "../lib/countries";
import { cn } from "../lib/utils";
import { liquidMetalFragmentShader, ShaderMount } from "@paper-design/shaders";
import { LiquidMetalButton } from "./LiquidMetalButton";
import { LiquidMetalCard } from "./LiquidMetalCard";

interface AIChatProps {
  key?: any;
  units: Unit[];
  selectedCountry: string;
  formatCurrency: (amountInEGP: number) => string;
  onLeadGenerated: (lead: Omit<Lead, "id" | "createdAt">) => Promise<void>;
}

interface ChatThread {
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

export default function AIChat({ units, selectedCountry, formatCurrency, onLeadGenerated }: AIChatProps) {
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

  // States for advanced animated input design
  const [attachments, setAttachments] = useState<string[]>([]);
  const [activeSuggestion, setActiveSuggestion] = useState<number>(-1);
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [recentCommand, setRecentCommand] = useState<string | null>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [inputFocused, setInputFocused] = useState(false);
  const [inputHovered, setInputHovered] = useState(false);
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
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
    const mockFileNames = ["deed-decal.pdf", "registration-license.pdf", "tax-clearance.pdf", "estate-plan.png", "evaluation-report.docx"];
    const mockFileName = mockFileNames[Math.floor(Math.random() * mockFileNames.length)];
    setAttachments(prev => [...prev, mockFileName]);
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

  // Chat Thread Histories - simulated & real
  const [conversations, setConversations] = useState<Record<string, ChatThread>>({
    "current": {
      id: "current",
      title: "New Property Chat",
      messages: [
        {
          role: "assistant",
          content: "Hello, Explorer. I am Broker AI. I'm here to analyze your requirements and connect you with elite properties. What location, budget, and features are you looking for in your ideal estate?"
        }
      ],
      extracted: { budget: "", propertyType: "", location: "", legalPapersRequired: null },
      qualification: null,
      qualificationValue: 0,
      leadSubmitted: false
    },
    "history-1": {
      id: "history-1",
      title: "🏙️ Modern Smart Villa",
      messages: [
        { role: "user", content: "Looking for a luxury smart villa with verified registration." },
        { role: "assistant", content: "I've analyzed our registry for high-tier smart villas. Riyadh and Dubai Marina have multiple certified smart architecture estates with legal papers cleared. What is your estimated investment range?" },
        { role: "user", content: "My budget is around 12,000,000 EGP." },
        { role: "assistant", content: "Perfect! A budget of 12,000,000 EGP is ideal for prime location villas. I have updated our registry. We are processing verified smart developments with high evaluation margins." }
      ],
      extracted: { budget: "12M EGP", propertyType: "Villa", location: "Riyadh & Dubai", legalPapersRequired: true },
      qualification: "hot",
      qualificationValue: 1000,
      leadSubmitted: true
    },
    "history-2": {
      id: "history-2",
      title: "📊 Skyline Penthouse",
      messages: [
        { role: "user", content: "Compare market trends in Dubai Skyline District." },
        { role: "assistant", content: "Excellent selection. The Skyline District is showing 12% YoY capital appreciation. Are you seeking personal residence or high-yield rental returns?" }
      ],
      extracted: { budget: "High-end", propertyType: "Penthouse", location: "Skyline District", legalPapersRequired: null },
      qualification: "warm",
      qualificationValue: 500,
      leadSubmitted: true
    },
    "history-3": {
      id: "history-3",
      title: "🏢 Under 3,000,000 EGP",
      messages: [
        { role: "user", content: "List all properties under 3,000,000 EGP" },
        { role: "assistant", content: "We have multiple certified properties in that range, including cozy apartments and townhouses. Do you need immediate delivery or flexible installments?" }
      ],
      extracted: { budget: "< 3M EGP", propertyType: "Apartment", location: "Flexible", legalPapersRequired: false },
      qualification: "cold",
      qualificationValue: 100,
      leadSubmitted: true
    }
  });

  const [activeThreadId, setActiveThreadId] = useState<string>("current");

  // Helper shortcut references to current conversation properties
  const activeThread = conversations[activeThreadId] || conversations["current"];
  const messages = activeThread.messages;
  const extracted = activeThread.extracted;
  const qualification = activeThread.qualification;
  const qualificationValue = activeThread.qualificationValue;
  const leadSubmitted = activeThread.leadSubmitted;

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
      messages: [
        {
          role: "assistant",
          content: "Hello, Explorer. I am Broker AI. I'm here to analyze your requirements and connect you with elite properties. What location, budget, and features are you looking for in your ideal estate?"
        }
      ],
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
          messages: [
            {
              role: "assistant",
              content: "Hello, Explorer. I am Broker AI. I'm here to analyze your requirements and connect you with elite properties. What location, budget, and features are you looking for in your ideal estate?"
            }
          ],
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

  const submitQuery = async (queryText: string) => {
    if (!queryText.trim()) return;

    const userMessage: Message = { role: "user", content: queryText };
    const updatedMessages = [...messages, userMessage];
    
    // Update active thread title dynamically on first user message
    let dynamicTitle = activeThread.title;
    if (activeThread.title === "New Chat Thread" || activeThread.title === "New Property Chat") {
      dynamicTitle = queryText.length > 25 ? queryText.substring(0, 25) + "..." : queryText;
    }

    // Update active thread state immediately
    setConversations(prev => ({
      ...prev,
      [activeThreadId]: {
        ...prev[activeThreadId],
        title: dynamicTitle,
        messages: updatedMessages
      }
    }));

    setInput("");
    setLoading(true);

    const config = COUNTRIES.find(c => c.code === selectedCountry) || COUNTRIES[0];

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          messages: updatedMessages,
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
        role: "assistant",
        content: data.response || "No response received."
      };
      
      const nextMessages = [...updatedMessages, botMessage];

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

      // If qualified and not already logged/submitted
      if (data.qualification && !leadSubmitted) {
        nextQual = data.qualification;
        let val = 100;
        if (data.qualification === "warm") val = 500;
        if (data.qualification === "hot") val = 1000;
        nextQualVal = val;

        // Submit to Firestore as qualified lead
        const finalLead: Omit<Lead, "id" | "createdAt"> = {
          name: `Explorer #${Math.floor(Math.random() * 9000 + 1000)}`,
          email: `explorer.${Math.floor(Math.random() * 1000)}@brokerai.com`,
          chatId: `chat_${Date.now()}`,
          budget: data.extractedInfo?.budget || "Flexible",
          propertyType: data.extractedInfo?.propertyType || "Residential",
          location: data.extractedInfo?.location || "Prime District",
          legalPapersRequired: !!data.extractedInfo?.legalPapersRequired,
          qualification: data.qualification,
          value: val,
          status: "available"
        };

        await onLeadGenerated(finalLead);
        nextSubmitted = true;
      }

      setConversations(prev => ({
        ...prev,
        [activeThreadId]: {
          ...prev[activeThreadId],
          messages: nextMessages,
          extracted: nextExtracted,
          qualification: nextQual,
          qualificationValue: nextQualVal,
          leadSubmitted: nextSubmitted
        }
      }));

    } catch (err) {
      console.error("Chat Error:", err);
      // Simulate/mock responses on credentials error
      const mockReply = "I understand. Let me log your parameters into our registry. What specific documents or licenses do you require?";
      
      setConversations(prev => ({
        ...prev,
        [activeThreadId]: {
          ...prev[activeThreadId],
          messages: [...updatedMessages, { role: "assistant", content: mockReply }]
        }
      }));
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    submitQuery(input);
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
            content: "Hello, Explorer. I am Broker AI. I'm here to analyze your requirements and connect you with elite properties. What location, budget, and features are you looking for in your ideal estate?"
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
    <div className="flex-1 flex flex-col w-full h-full relative overflow-hidden bg-[#05070c]">
      
      {/* Custom Mockup Header */}
      <header className="flex items-center justify-between px-6 py-5 border-b border-white/[0.06] select-none shrink-0 bg-[#05070c]/90 backdrop-blur-md z-30">
        <div className="logo flex items-center gap-2.5 font-extrabold text-[15px] tracking-wider text-[#F5F7FA] font-sans">
          <span className="logo-dot"></span>
          <span>BROKER AI</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="custom-tag font-mono">AI CHAT</span>
        </div>
      </header>

      {/* Main chat window taking up all remaining height */}
      <section className="flex-1 flex flex-col justify-between bg-transparent relative overflow-hidden">

        {/* CHAT CONTENT STAGE */}
        <div className="flex-1 overflow-y-auto scrollbar-thin relative p-4 md:p-6 lg:p-8 flex flex-col">
          
          {/* ========================================== */}
          {/* INNER STATE 1: EMPTY GREETING WITH SUGGESTIONS */}
          {/* ========================================== */}
          {messages.length === 1 ? (
            <div className="w-full my-auto flex flex-col items-center justify-start animate-fade-in text-white py-2 md:py-6">
              
              {/* Custom Hero */}
              <div className="custom-hero select-none shrink-0">
                <div className="custom-eyebrow">Conversational Property Assistant</div>
                <h1 className="custom-title">
                  broker <span className="ai">ai</span>
                </h1>
                <p className="custom-sub">
                  Analyze property guidelines, compare budgets, and extract qualified estate criteria seamlessly.
                </p>
              </div>

              {/* Custom suggestions Grid */}
              <div className="custom-grid z-10 shrink-0">
                <LiquidMetalCard
                  id="card-modern-villa"
                  title="Modern Villa"
                  description="Find a modern smart villa with high evaluation price"
                  icon={
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M3 21h18"/><path d="M4 21V10l8-6 8 6v11"/><path d="M9 21v-6h6v6"/><path d="M9 12h.01M15 12h.01"/>
                    </svg>
                  }
                  onClick={() => fillPrompt("Find a modern smart villa with high evaluation price")}
                />

                <LiquidMetalCard
                  id="card-skyline-penthouse"
                  title="Skyline Penthouse"
                  description="Compare market trends in Skyline District with high budget"
                  icon={
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M3 21h18"/><path d="M6 21V9l3-2v14"/><path d="M13 21V4l3 2v15"/><path d="M20 21v-8l0-1"/>
                    </svg>
                  }
                  onClick={() => fillPrompt("Compare market trends in Skyline District with high budget")}
                />

                <LiquidMetalCard
                  id="card-claim-lead"
                  title="Claim a Lead"
                  description="How do I buy or unlock lead contact details?"
                  icon={
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="8" width="18" height="12" rx="2"/><path d="M9 8V6a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2"/><path d="M3 13h18"/><path d="M11 13v2h2v-2"/>
                    </svg>
                  }
                  onClick={() => fillPrompt("How do I buy or unlock lead contact details?")}
                />

                <LiquidMetalCard
                  id="card-new-cairo"
                  title="New Cairo Launch"
                  description="Show me new developments with flexible payment plans"
                  icon={
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M3 21h18"/><path d="M5 21V11l4-3 4 3v10"/><path d="M13 21V7l3-3 3 3v14"/><path d="M8 21v-4M13 12h.01M13 15h.01M13 18h.01"/>
                    </svg>
                  }
                  onClick={() => fillPrompt("Show me new developments with flexible payment plans")}
                />

                <LiquidMetalCard
                  id="card-rental-yield"
                  title="Rental Yield"
                  description="Compare rental yield across North Coast projects"
                  icon={
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M3 17l5-5 4 4 7-8"/><path d="M14 8h5v5"/>
                    </svg>
                  }
                  onClick={() => fillPrompt("Compare rental yield across North Coast projects")}
                />

                <LiquidMetalCard
                  id="card-score-lead"
                  title="Score a Lead"
                  description="Score this lead as Cold, Warm, or Hot"
                  icon={
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="4.5"/><circle cx="12" cy="12" r="1"/>
                    </svg>
                  }
                  onClick={() => fillPrompt("Score this lead as Cold, Warm, or Hot")}
                />
              </div>

              <div className="custom-scroll-hint select-none shrink-0 mt-4">
                ↓ scroll for more suggestions
              </div>

            </div>
          ) : (
            // ==========================================
            // INNER STATE 2: ACTIVE DIALOGUE (CHAT THREAD)
            // ==========================================
            <div className="flex-1 space-y-6 max-w-4xl mx-auto w-full pb-8">
              <AnimatePresence initial={false}>
                {messages.map((m, i) => {
                  const isBot = m.role === "assistant";
                  return (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.25 }}
                      className={`flex gap-4 md:gap-6 ${isBot ? "" : "justify-end"}`}
                    >
                      {/* Left Avatar for Bot */}
                      {isBot && (
                        <div className="w-[34px] h-[34px] rounded-full bg-white/[0.08] border border-white/20 shadow-md flex items-center justify-center shrink-0">
                          <Sparkles size={15} className="text-white" />
                        </div>
                      )}

                      {/* Chat message body with ChatGPT styling */}
                      <div className={`flex flex-col ${isBot ? "flex-1 max-w-[85%]" : "max-w-[75%]"}`}>
                        {/* Name Header */}
                        <span className="text-[10px] font-extrabold text-slate-500 tracking-wider uppercase mb-1 px-1 font-mono">
                          {isBot ? "Broker AI" : "Prospect Explorer"}
                        </span>

                        {/* Speech Bubble */}
                        <div className={`p-4 rounded-2xl leading-relaxed text-sm shadow-sm transition-all relative ${
                          isBot 
                            ? "bg-white/[0.03] border border-white/[0.05] text-slate-100 rounded-tl-none" 
                            : "bg-white text-[#040404] rounded-tr-none shadow-[0_4px_12px_rgba(255,255,255,0.05)] font-medium"
                        }`}>
                          <p className="whitespace-pre-line">{m.content}</p>
                        </div>

                        {/* Bottom Utility Actions Toolbar (ChatGPT Style) */}
                        {isBot && (
                          <div className="flex items-center gap-3.5 mt-2 px-1 text-slate-500">
                            {/* Copy button */}
                            <button
                              onClick={() => copyToClipboard(m.content, i)}
                              className="hover:text-white transition flex items-center gap-1 cursor-pointer text-xs"
                              title="Copy response"
                            >
                              {copiedIndex === i ? (
                                <>
                                  <Check size={12} className="text-emerald-400" />
                                  <span className="text-[10px] text-emerald-400 font-bold font-mono">Copied</span>
                                </>
                              ) : (
                                <Copy size={12} />
                              )}
                            </button>

                            {/* Speech synthesis Read Aloud */}
                            <button
                              onClick={() => speakMessage(m.content, i)}
                              className={`hover:text-white transition flex items-center gap-1 cursor-pointer text-xs ${
                                speakingIndex === i ? "text-white" : ""
                              }`}
                              title={speakingIndex === i ? "Stop speaking" : "Read response aloud"}
                            >
                              <Volume2 size={12} className={speakingIndex === i ? "animate-pulse text-white" : ""} />
                              {speakingIndex === i && (
                                <span className="text-[10px] text-white font-bold font-mono">Speaking</span>
                              )}
                            </button>

                            {/* Thumbs Feedback */}
                            <button
                              onClick={() => handleFeedback(i, "up")}
                              className={`hover:text-emerald-400 transition cursor-pointer ${
                                likedMessages[i] === "up" ? "text-emerald-400" : ""
                              }`}
                              title="Thumbs Up"
                            >
                              <ThumbsUp size={11} />
                            </button>
                            <button
                              onClick={() => handleFeedback(i, "down")}
                              className={`hover:text-red-400 transition cursor-pointer ${
                                likedMessages[i] === "down" ? "text-red-400" : ""
                              }`}
                              title="Thumbs Down"
                            >
                              <ThumbsDown size={11} />
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Right Avatar for User */}
                      {!isBot && (
                        <div className="w-[34px] h-[34px] rounded-full bg-slate-800 border border-white/10 flex items-center justify-center shrink-0">
                          <span className="text-xs font-black text-slate-200">U</span>
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </AnimatePresence>

              {/* Bot loading state */}
              {loading && (
                <div className="flex gap-4 md:gap-6">
                  <div className="w-[34px] h-[34px] rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 animate-spin shrink-0">
                    <RefreshCw size={14} />
                  </div>
                  <div className="flex-1 max-w-[85%]">
                    <span className="text-[10px] font-extrabold text-slate-500 tracking-wider uppercase mb-1 font-mono">Broker AI Core</span>
                    <div className="bg-white/5 border border-white/[0.05] text-slate-400 italic rounded-2xl rounded-tl-none p-4 text-xs shadow-sm flex items-center gap-2">
                      <div className="flex space-x-1">
                        <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                        <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                        <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                      </div>
                      <span>Analyzing credentials & extracting legal registry parameters...</span>
                    </div>
                  </div>
                </div>
              )}

              {/* AI Qualified Stream Banner */}
              {qualification && (
                <motion.div 
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="p-4 bg-emerald-950/40 border border-emerald-500/20 rounded-2xl flex items-center justify-between gap-3.5 max-w-xl mx-auto shadow-lg backdrop-blur-md"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-9 h-9 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(16,185,129,0.35)]">
                      <FileCheck size={18} />
                    </div>
                    <div className="text-left">
                      <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest font-mono leading-none mb-0.5">Real-time Stream Sync</p>
                      <p className="text-xs text-emerald-100">
                        Qualified as <strong className="uppercase text-white">{qualification} Lead</strong> ({formatCurrency(qualificationValue)} Value)
                      </p>
                    </div>
                  </div>
                  <span className="text-[9px] font-black font-mono uppercase bg-emerald-500/25 text-emerald-300 px-2 py-0.5 rounded shadow">CRM Synced</span>
                </motion.div>
              )}

              <div ref={messagesEndRef} />
            </div>
          )}

        </div>

        {/* ========================================== */}
        {/* CENTER BOTTOM FLOATING INPUT ZONE */}
        {/* ========================================== */}
        <footer className="custom-console-wrap select-none z-20">
          <div className="max-w-4xl mx-auto w-full relative">
            
            {/* Command Suggestions Overlay */}
            <AnimatePresence>
              {showCommandPalette && (
                <motion.div 
                  ref={commandPaletteRef}
                  className="absolute left-4 right-4 bottom-full mb-3 backdrop-blur-xl bg-slate-950/95 rounded-xl z-50 shadow-2xl border border-white/10 overflow-hidden"
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 5 }}
                  transition={{ duration: 0.15 }}
                >
                  <div className="py-2 bg-slate-950/95">
                    <p className="px-3.5 py-1 text-[9px] font-bold text-slate-500 uppercase tracking-widest font-mono">Suggested Commands</p>
                    {commandSuggestions.map((suggestion, index) => (
                      <motion.div
                        key={suggestion.prefix}
                        className={cn(
                          "flex items-center gap-3 px-3.5 py-2.5 text-xs transition-colors cursor-pointer",
                          activeSuggestion === index 
                            ? "bg-blue-600/25 text-white border-l-2 border-blue-500" 
                            : "text-slate-300 hover:bg-white/5"
                        )}
                        onClick={() => selectCommandSuggestion(index)}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: index * 0.03 }}
                      >
                        <div className="w-5 h-5 flex items-center justify-center text-slate-400 shrink-0">
                          {suggestion.icon}
                        </div>
                        <div className="flex-1">
                          <span className="font-semibold">{suggestion.label}</span>
                          <span className="text-[10px] text-slate-500 ml-2">— {suggestion.description}</span>
                        </div>
                        <div className="text-blue-400 font-mono text-[10px] bg-blue-500/10 px-1.5 py-0.5 rounded">
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
                  className="px-4 pb-3 flex gap-2 flex-wrap pt-2"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  {attachments.map((file, index) => (
                    <motion.div
                      key={index}
                      className="flex items-center gap-2 text-xs bg-white/[0.04] border border-white/5 py-1.5 px-3 rounded-lg text-slate-200"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                    >
                      <span className="truncate max-w-[150px] font-mono text-[11px]">{file}</span>
                      <button 
                        type="button"
                        onClick={() => removeAttachment(index)}
                        className="text-slate-500 hover:text-white transition-colors cursor-pointer"
                      >
                        <X size={12} />
                      </button>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>

            <div 
              style={{
                perspective: "1000px",
                perspectiveOrigin: "50% 50%",
              }}
              className="relative w-full"
              onMouseEnter={() => setInputHovered(true)}
              onMouseLeave={() => setInputHovered(false)}
            >
              <div
                style={{
                  position: "relative",
                  width: "100%",
                  transformStyle: "preserve-3d",
                  transition: "all 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)",
                }}
              >
                {/* 1. Shader Background Layer */}
                <div
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: "100%",
                    transformStyle: "preserve-3d",
                    transform: "translateZ(0px)",
                    zIndex: 10,
                    transition: "all 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)",
                  }}
                >
                  <div
                    style={{
                      height: "100%",
                      width: "100%",
                      borderRadius: "100px",
                      boxShadow: inputFocused
                        ? "0px 0px 0px 1px rgba(255, 255, 255, 0.4), 0px 0px 20px 0px rgba(255, 255, 255, 0.15), 0px 12px 24px 0px rgba(0, 0, 0, 0.4)"
                        : inputHovered
                          ? "0px 0px 0px 1px rgba(255, 255, 255, 0.2), 0px 12px 6px 0px rgba(0, 0, 0, 0.05), 0px 8px 5px 0px rgba(0, 0, 0, 0.1), 0px 4px 4px 0px rgba(0, 0, 0, 0.15), 0px 1px 2px 0px rgba(0, 0, 0, 0.2)"
                          : "0px 0px 0px 1px rgba(255, 255, 255, 0.1), 0px 36px 14px 0px rgba(0, 0, 0, 0.02), 0px 20px 12px 0px rgba(0, 0, 0, 0.08), 0px 9px 9px 0px rgba(0, 0, 0, 0.12), 0px 2px 5px 0px rgba(0, 0, 0, 0.15)",
                      transition: "all 0.8s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.2s ease",
                      background: "transparent",
                    }}
                  >
                    <div
                      ref={chatboxShaderRef}
                      className="shader-container-chatbox"
                      style={{
                        borderRadius: "100px",
                        overflow: "hidden",
                        position: "relative",
                        width: "100%",
                        height: "100%",
                      }}
                    />
                  </div>
                </div>

                {/* 2. Dark Inner Plate Layer */}
                <div
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: "100%",
                    transformStyle: "preserve-3d",
                    transform: "translateZ(10px)",
                    zIndex: 20,
                    pointerEvents: "none",
                    transition: "all 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)",
                  }}
                >
                  <div
                    style={{
                      width: "calc(100% - 4px)",
                      height: "calc(100% - 4px)",
                      margin: "2px",
                      borderRadius: "100px",
                      background: "linear-gradient(180deg, #181818 0%, #050505 100%)",
                      boxShadow: inputFocused
                        ? "inset 0px 2px 4px rgba(0, 0, 0, 0.5)"
                        : "none",
                      transition: "all 0.8s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.2s ease",
                    }}
                  />
                </div>

                {/* 3. Interactive Controls Layer */}
                <div
                  style={{
                    position: "relative",
                    transformStyle: "preserve-3d",
                    transform: "translateZ(20px)",
                    zIndex: 30,
                    transition: "all 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)",
                    boxShadow: "none",
                    padding: "6px 10px 6px 24px",
                    minHeight: "58px",
                  }}
                  className="custom-field !bg-transparent !border-none !shadow-none"
                >
                  {/* Paperclip button */}
                  <svg 
                    onClick={handleAttachFile}
                    className="custom-icon-btn text-[#F5F7FA]" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="1.6"
                    title="Attach deeds or licenses"
                  >
                    <path d="M21 12.5V7a4 4 0 0 0-4-4H10a4 4 0 0 0-4 4v11a3 3 0 0 0 3 3h9a3 3 0 0 0 3-3v-1"/>
                    <path d="M12 8v8M8 12h8"/>
                  </svg>

                  <input 
                    type="text" 
                    ref={textareaRef as any}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    onFocus={() => setInputFocused(true)}
                    onBlur={() => setInputFocused(false)}
                    placeholder="Ask Broker AI, or type '/' for suggested commands..."
                    disabled={loading}
                    className="bg-transparent text-white border-none outline-none flex-1 font-medium placeholder-slate-500 z-10 py-2 text-[14px]"
                  />

                  {/* Command suggestions button */}
                  <svg 
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowCommandPalette(prev => !prev);
                    }}
                    className={cn(
                      "custom-icon-btn text-[#F5F7FA]",
                      showCommandPalette && "opacity-100 scale-110"
                    )} 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="1.6"
                    title="Suggested commands"
                  >
                    <rect x="4" y="4" width="16" height="16" rx="4"/>
                    <path d="M9 9h.01M15 9h.01M9 15h6"/>
                  </svg>

                  <LiquidMetalButton
                    onClick={() => {
                      if (input.trim() && !loading) {
                        submitQuery(input);
                      }
                    }}
                    viewMode="icon"
                  />
                </div>
              </div>
            </div>
            <div className="custom-footnote">
              Broker AI can make mistakes. Verify important financial details and licenses.
            </div>
          </div>
        </footer>

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

    </div>
  );
}

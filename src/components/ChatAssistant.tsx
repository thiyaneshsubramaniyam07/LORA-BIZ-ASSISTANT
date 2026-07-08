import React, { useState, useRef, useEffect } from "react";
import { 
  Send, Sparkles, AlertCircle, Copy, Check, Play, Square, 
  Mic, MicOff, FileText, Upload, Volume2, ArrowRight, Globe,
  Phone, PhoneOff, ChevronDown, DollarSign, Shield, Flame, Trash2, HelpCircle
} from "lucide-react";
import { ChatMessage } from "../types";
import { motion, AnimatePresence } from "motion/react";

interface ChatAssistantProps {
  chatMessages: ChatMessage[];
  onSendMessage: (text: string, model?: string, role?: string, useSearch?: boolean) => Promise<void>;
  isSending: boolean;
  onClearHistory?: () => void;
}

// Roles definitions
const ASSISTANT_ROLES = [
  { id: "advisor", name: "Business Advisor", icon: Sparkles, color: "text-violet-400 border-violet-500/20 bg-violet-950/20", description: "Streamline workflows, operations, and general corporate strategy." },
  { id: "finance", name: "Financial Analyst", icon: DollarSign, color: "text-emerald-400 border-emerald-500/20 bg-emerald-950/20", description: "Audit profit-and-loss margins, SaaS expenses, and tax-saving plans." },
  { id: "legal", name: "Legal Strategist", icon: Shield, color: "text-blue-400 border-blue-500/20 bg-blue-950/20", description: "Mitigate corporate liability, NDAs, and warning letters." },
  { id: "marketing", name: "Growth CMO", icon: Flame, color: "text-amber-400 border-amber-500/20 bg-amber-950/20", description: "Harness organic SEO funnels and LinkedIn client pipelines." }
];

// Models definition
const AI_MODELS = [
  { id: "gemini-3.5-flash", name: "Gemini 3.5 Flash", type: "General Tasks", desc: "Fast, versatile, and ideal for standard workflows." },
  { id: "gemini-3.1-pro-preview", name: "Gemini 3.1 Pro", type: "Complex Logic", desc: "Deep reasoning, legal analysis, and advanced calculations." },
  { id: "gemini-3.1-flash-lite", name: "Gemini 3.1 Lite", type: "Fast Execution", desc: "Snappy, lightweight responses for immediate queries." }
];

export default function ChatAssistant({ 
  chatMessages, onSendMessage, isSending, onClearHistory 
}: ChatAssistantProps) {
  // Input and settings states
  const [inputText, setInputText] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [speakingId, setSpeakingId] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [documentName, setDocumentName] = useState<string | null>(null);
  const [documentContent, setDocumentContent] = useState<string | null>(null);
  
  // Custom chatbot options
  const [selectedRole, setSelectedRole] = useState("advisor");
  const [selectedModel, setSelectedModel] = useState("gemini-3.5-flash");
  const [useSearch, setUseSearch] = useState(false);
  const [roleMenuOpen, setRoleMenuOpen] = useState(false);
  const [modelMenuOpen, setModelMenuOpen] = useState(false);

  // Live Voice Call state
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const [voiceState, setVoiceState] = useState<'connecting' | 'connected' | 'disconnected'>('disconnected');
  const [isVoiceMuted, setIsVoiceMuted] = useState(false);
  const [voiceLog, setVoiceLog] = useState<string[]>([]);
  
  const chatBottomRef = useRef<HTMLDivElement>(null);
  const speechUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const recognitionRef = useRef<any>(null);

  // WebSocket Live Voice Refs
  const wsRef = useRef<WebSocket | null>(null);
  const audioInputCtxRef = useRef<AudioContext | null>(null);
  const audioOutputCtxRef = useRef<AudioContext | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const processorNodeRef = useRef<ScriptProcessorNode | null>(null);
  const playSourcesRef = useRef<AudioBufferSourceNode[]>([]);
  const nextPlayTimeRef = useRef<number>(0);

  // Auto-scroll to chat bottom
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages, isSending]);

  // Clean up speech synthesis & audio streams on unmount
  useEffect(() => {
    return () => {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
      stopVoiceSession();
    };
  }, []);

  // Initialize Speech Recognition for Dictation input
  useEffect(() => {
    const SpeechObj = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechObj) {
      const rec = new SpeechObj();
      rec.continuous = false;
      rec.interimResults = false;
      rec.lang = "en-US";
      
      rec.onstart = () => {
        setIsRecording(true);
      };
      
      rec.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          setInputText(prev => prev ? prev + " " + transcript : transcript);
        }
      };
      
      rec.onerror = (err: any) => {
        console.error("Speech Recognition Error:", err);
        setIsRecording(false);
      };
      
      rec.onend = () => {
        setIsRecording(false);
      };
      
      recognitionRef.current = rec;
    }
  }, []);

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() && !documentContent) return;

    let finalPrompt = inputText;
    if (documentContent) {
      finalPrompt = `[Document: ${documentName || "uploaded_file.txt"}]\n\`\`\`\n${documentContent}\n\`\`\`\n\nUser request regarding this document: ${inputText || "Please summarize this document and list key takeaways."}`;
    }

    setInputText("");
    setDocumentContent(null);
    setDocumentName(null);

    await onSendMessage(finalPrompt, selectedModel, selectedRole, useSearch);
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Text to Speech for individual messages
  const handleToggleSpeech = (id: string, text: string) => {
    if (!window.speechSynthesis) return;

    if (speakingId === id) {
      window.speechSynthesis.cancel();
      setSpeakingId(null);
      return;
    }

    window.speechSynthesis.cancel();
    
    // Strip markdown tags before reading
    const cleanText = text
      .replace(/[#*`_-]/g, "")
      .replace(/\[.*?\]\(.*?\)/g, "");

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 1.0;
    utterance.onend = () => {
      setSpeakingId(null);
    };
    utterance.onerror = () => {
      setSpeakingId(null);
    };

    speechUtteranceRef.current = utterance;
    setSpeakingId(id);
    window.speechSynthesis.speak(utterance);
  };

  // Dictation handler
  const handleToggleRecording = () => {
    if (!recognitionRef.current) {
      alert("Speech recognition is not supported in this browser. Please type your query.");
      return;
    }

    if (isRecording) {
      recognitionRef.current.stop();
    } else {
      recognitionRef.current.start();
    }
  };

  // File Upload handler
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setDocumentName(file.name);
      setDocumentContent(text);
    };
    reader.readAsText(file);
  };

  const handlePromptPillClick = (prompt: string) => {
    setInputText(prompt);
  };

  // Real-time Voice Consultation Session Functions
  const startVoiceSession = async () => {
    setIsVoiceActive(true);
    setVoiceState('connecting');
    setVoiceLog(["Establishing secure real-time audio uplink..."]);

    // Create play context (24kHz is standard Gemini output audio)
    const outCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    audioOutputCtxRef.current = outCtx;
    nextPlayTimeRef.current = 0;
    playSourcesRef.current = [];

    // Open WebSocket to node backend Live bridge
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const host = window.location.host;
    const wsUrl = `${protocol}//${host}/api/live`;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = async () => {
      setVoiceState('connected');
      setVoiceLog(prev => [...prev, "Connected to voice node server. Activating local microphone..."]);

      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          audio: { 
            echoCancellation: true, 
            noiseSuppression: true,
            autoGainControl: true
          } 
        });
        micStreamRef.current = stream;

        // Capture voice at 16kHz PCM (Gemini required input audio format)
        const inCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
        audioInputCtxRef.current = inCtx;

        const source = inCtx.createMediaStreamSource(stream);
        const processor = inCtx.createScriptProcessor(2048, 1, 1);
        processorNodeRef.current = processor;

        processor.onaudioprocess = (e) => {
          if (isVoiceMuted) return;
          const inputData = e.inputBuffer.getChannelData(0);
          
          // Float32 input buffer to Int16 array representation
          const pcm16 = new Int16Array(inputData.length);
          for (let i = 0; i < inputData.length; i++) {
            let s = Math.max(-1, Math.min(1, inputData[i]));
            pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
          }

          // ArrayBuffer chunk to Base64 format
          let binary = '';
          const bytes = new Uint8Array(pcm16.buffer);
          const len = bytes.byteLength;
          for (let i = 0; i < len; i++) {
            binary += String.fromCharCode(bytes[i]);
          }
          const base64 = window.btoa(binary);

          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ audio: base64 }));
          }
        };

        source.connect(processor);
        processor.connect(inCtx.destination);
        setVoiceLog(prev => [...prev, "Real-time consult online. Start speaking now!"]);
      } catch (err: any) {
        console.error("Microphone capture failed:", err);
        setVoiceLog(prev => [...prev, "⚠️ Microphone capture failed. Please confirm permissions in your browser bar."]);
      }
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        if (data.simulation) {
          setVoiceLog(prev => [...prev, `[Simulation Mode active]: ${data.text}`]);
          // Fallback simulation text reading
          if (window.speechSynthesis) {
            window.speechSynthesis.cancel();
            const utterance = new SpeechSynthesisUtterance(data.text);
            window.speechSynthesis.speak(utterance);
          }
          return;
        }

        if (data.audio) {
          // Playback 24kHz raw audio chunk from server
          const base64 = data.audio;
          const binary = window.atob(base64);
          const bytes = new Uint8Array(binary.length);
          for (let i = 0; i < binary.length; i++) {
            bytes[i] = binary.charCodeAt(i);
          }
          const int16 = new Int16Array(bytes.buffer);
          const float32 = new Float32Array(int16.length);
          for (let i = 0; i < int16.length; i++) {
            float32[i] = int16[i] / (int16[i] < 0 ? 0x8000 : 0x7FFF);
          }

          if (audioOutputCtxRef.current) {
            const buffer = audioOutputCtxRef.current.createBuffer(1, float32.length, 24000);
            buffer.getChannelData(0).set(float32);

            const sourceNode = audioOutputCtxRef.current.createBufferSource();
            sourceNode.buffer = buffer;
            sourceNode.connect(audioOutputCtxRef.current.destination);

            const now = audioOutputCtxRef.current.currentTime;
            if (nextPlayTimeRef.current < now) {
              nextPlayTimeRef.current = now;
            }
            sourceNode.start(nextPlayTimeRef.current);
            nextPlayTimeRef.current += buffer.duration;
            playSourcesRef.current.push(sourceNode);
          }
        }

        if (data.interrupted) {
          // Instantly interrupt audio playback queue on voice interruption event
          playSourcesRef.current.forEach(src => {
            try { src.stop(); } catch (e) {}
          });
          playSourcesRef.current = [];
          nextPlayTimeRef.current = 0;
          setVoiceLog(prev => [...prev, "⚡ Model interrupted (you spoke over the response)"]);
        }

        if (data.error) {
          setVoiceLog(prev => [...prev, `⚠️ ${data.error}`]);
        }
      } catch (e) {
        console.error("Error reading websocket message:", e);
      }
    };

    ws.onclose = () => {
      setVoiceState('disconnected');
      setVoiceLog(prev => [...prev, "Secure voice uplink terminated."]);
      stopVoiceSession();
    };

    ws.onerror = (err) => {
      console.error("WebSocket server bridge error:", err);
      setVoiceLog(prev => [...prev, "⚠️ Voice link connection failed."]);
    };
  };

  const stopVoiceSession = () => {
    setIsVoiceActive(false);
    setVoiceState('disconnected');

    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }

    if (wsRef.current) {
      try { wsRef.current.close(); } catch (e) {}
      wsRef.current = null;
    }

    if (processorNodeRef.current) {
      try { processorNodeRef.current.disconnect(); } catch (e) {}
      processorNodeRef.current = null;
    }

    if (audioInputCtxRef.current) {
      try { audioInputCtxRef.current.close(); } catch (e) {}
      audioInputCtxRef.current = null;
    }

    if (audioOutputCtxRef.current) {
      try { audioOutputCtxRef.current.close(); } catch (e) {}
      audioOutputCtxRef.current = null;
    }

    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach(track => track.stop());
      micStreamRef.current = null;
    }

    playSourcesRef.current.forEach(src => {
      try { src.stop(); } catch (e) {}
    });
    playSourcesRef.current = [];
    nextPlayTimeRef.current = 0;
  };

  const currentRoleObj = ASSISTANT_ROLES.find(r => r.id === selectedRole) || ASSISTANT_ROLES[0];
  const currentModelObj = AI_MODELS.find(m => m.id === selectedModel) || AI_MODELS[0];

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] max-w-4xl mx-auto bg-[#171717] rounded-2xl border border-[#262626] shadow-sm overflow-hidden relative">
      
      {/* Dynamic Header & Model Router Controls */}
      <div className="px-5 py-3 border-b border-[#262626] bg-[#1c1c1c] flex flex-wrap gap-3 items-center justify-between z-10">
        
        {/* Left Side: Copilot Identity & Controls */}
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-xl border ${currentRoleObj.color.split(" ")[1]} ${currentRoleObj.color.split(" ")[2]}`}>
            <currentRoleObj.icon className={`w-4 h-4 ${currentRoleObj.color.split(" ")[0]}`} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-white">AI Consult Copilot</span>
              <span className="text-[10px] bg-violet-500/10 text-violet-400 border border-violet-500/10 px-1.5 py-0.5 rounded font-mono font-bold uppercase">{selectedModel.split("-")[1].toUpperCase()}</span>
            </div>
            <p className="text-[10px] text-neutral-400">Current Role: <span className="font-semibold text-neutral-200">{currentRoleObj.name}</span></p>
          </div>
        </div>

        {/* Right Side: Options Bar */}
        <div className="flex items-center gap-2">
          
          {/* Web Search Grounding Button */}
          <button
            onClick={() => setUseSearch(!useSearch)}
            className={`p-1.5 px-2.5 rounded-lg border text-[11px] font-bold flex items-center gap-1.5 transition cursor-pointer ${
              useSearch 
                ? "bg-blue-600/10 text-blue-400 border-blue-500/30 shadow-sm shadow-blue-500/5 animate-pulse" 
                : "bg-[#0F0F0F] text-neutral-400 border-[#262626] hover:text-neutral-200"
            }`}
            title="Ground AI responses with Google Search"
          >
            <Globe className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{useSearch ? "Google Grounding: On" : "Google Grounding: Off"}</span>
          </button>

          {/* Role selector dropdown */}
          <div className="relative">
            <button
              onClick={() => { setRoleMenuOpen(!roleMenuOpen); setModelMenuOpen(false); }}
              className="p-1.5 px-2.5 bg-[#0F0F0F] hover:bg-[#1c1c1c] border border-[#262626] rounded-lg text-[11px] font-bold text-neutral-300 hover:text-white flex items-center gap-1 cursor-pointer"
            >
              <span>Role: {currentRoleObj.name}</span>
              <ChevronDown className="w-3 h-3 text-neutral-500" />
            </button>
            <AnimatePresence>
              {roleMenuOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 5 }}
                  className="absolute right-0 mt-1.5 w-60 bg-[#0F0F0F] border border-[#262626] rounded-xl shadow-xl p-1.5 z-20 space-y-1"
                >
                  {ASSISTANT_ROLES.map((role) => (
                    <button
                      key={role.id}
                      onClick={() => { setSelectedRole(role.id); setRoleMenuOpen(false); }}
                      className={`w-full text-left p-2 rounded-lg flex gap-2.5 items-start text-xs transition cursor-pointer ${
                        selectedRole === role.id ? "bg-[#1c1c1c] text-white" : "hover:bg-[#141414] text-neutral-400 hover:text-white"
                      }`}
                    >
                      <role.icon className={`w-4 h-4 mt-0.5 shrink-0 ${role.color.split(" ")[0]}`} />
                      <div>
                        <span className="font-bold block">{role.name}</span>
                        <span className="text-[10px] text-neutral-500 leading-none">{role.description}</span>
                      </div>
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Model selection dropdown */}
          <div className="relative">
            <button
              onClick={() => { setModelMenuOpen(!modelMenuOpen); setRoleMenuOpen(false); }}
              className="p-1.5 px-2.5 bg-[#0F0F0F] hover:bg-[#1c1c1c] border border-[#262626] rounded-lg text-[11px] font-bold text-neutral-300 hover:text-white flex items-center gap-1 cursor-pointer"
            >
              <span>Model: {currentModelObj.name.split(" ")[1]}</span>
              <ChevronDown className="w-3 h-3 text-neutral-500" />
            </button>
            <AnimatePresence>
              {modelMenuOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 5 }}
                  className="absolute right-0 mt-1.5 w-60 bg-[#0F0F0F] border border-[#262626] rounded-xl shadow-xl p-1.5 z-20 space-y-1"
                >
                  {AI_MODELS.map((model) => (
                    <button
                      key={model.id}
                      onClick={() => { setSelectedModel(model.id); setModelMenuOpen(false); }}
                      className={`w-full text-left p-2 rounded-lg flex flex-col text-xs transition cursor-pointer ${
                        selectedModel === model.id ? "bg-[#1c1c1c] text-white" : "hover:bg-[#141414] text-neutral-400 hover:text-white"
                      }`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span className="font-bold">{model.name}</span>
                        <span className="text-[9px] px-1 bg-neutral-800 rounded text-neutral-400 font-mono">{model.type}</span>
                      </div>
                      <span className="text-[10px] text-neutral-500 mt-0.5 leading-snug">{model.desc}</span>
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Live Voice Consult Trigger button */}
          <button
            onClick={startVoiceSession}
            className="p-1.5 px-3.5 bg-violet-600 hover:bg-violet-700 text-white rounded-lg text-[11px] font-bold flex items-center gap-1.5 transition cursor-pointer shadow-md shadow-violet-600/10 hover:shadow-violet-600/20"
            title="Start Real-time Voice Consultation"
          >
            <Mic className="w-3.5 h-3.5" />
            <span>Voice Call</span>
          </button>
        </div>
      </div>

      {/* Message Log View */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {chatMessages.length === 0 ? (
          <div className="h-full flex flex-col justify-center items-center text-center max-w-md mx-auto space-y-6 py-10">
            <div className="p-4 bg-gradient-to-tr from-[#171717] to-violet-950/20 rounded-3xl border border-[#262626] text-violet-400 shadow-sm">
              <Sparkles className="w-10 h-10 text-violet-400" />
            </div>
            <div>
              <h3 className="text-md font-bold text-white">Advisory Portal</h3>
              <p className="text-xs text-neutral-400 mt-2">
                Consult strategy recommendations, audit business expenses, review client legal warning matrices, or formulate brand campaigns in real-time.
              </p>
            </div>

            {/* Quick Prompt Suggestions */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full mt-4">
              {[
                { label: "Draft invoice late-fee policy", prompt: "Write a polite yet firm invoice reminder to a client whose payment is 14 days overdue. Include a 1.5% late-fee schedule." },
                { label: "Optimize business revenue strategy", prompt: "As my Financial Advisor, look at how to expand service margins by moving from hourly to fixed retainer pricing packages." },
                { label: "Mitigate project liability risks", prompt: "As my Corporate Legal strategist, provide a clear 5-step checklist to protect client delivery timelines and limit operational liability." },
                { label: "Draft a high-conversion pitch", prompt: "Create a 3-stage SEO marketing and brand pitch layout targeting regional developers looking to build on CRM platforms." }
              ].map((pill, idx) => (
                <button
                  key={idx}
                  onClick={() => handlePromptPillClick(pill.prompt)}
                  className="p-3 text-left bg-[#0F0F0F] hover:bg-[#1c1c1c] text-xs font-medium text-[#E5E5E5] rounded-xl border border-[#262626] transition cursor-pointer"
                >
                  <span className="block font-semibold text-white">{pill.label}</span>
                  <span className="text-[10px] text-neutral-500 line-clamp-1 mt-0.5">{pill.prompt}</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          chatMessages.map((msg) => {
            const isUser = msg.role === "user";
            return (
              <div 
                key={msg.id}
                className={`flex gap-4 ${isUser ? "justify-end" : "justify-start"}`}
              >
                {/* Avatar */}
                {!isUser && (
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-violet-600 to-indigo-600 text-white flex items-center justify-center font-display font-semibold text-xs flex-shrink-0">
                    AI
                  </div>
                )}
                
                {/* Bubble Container */}
                <div className={`max-w-[85%] rounded-2xl p-4 shadow-sm relative group ${
                  isUser 
                    ? "bg-violet-600/10 text-white rounded-tr-none border border-violet-500/20" 
                    : "bg-[#0F0F0F] text-neutral-100 border border-[#262626] rounded-tl-none"
                }`}>
                  {/* Rich Formatted Text */}
                  <div className="prose prose-sm dark:prose-invert max-w-none text-xs font-sans leading-relaxed whitespace-pre-wrap">
                    {msg.text}
                  </div>

                  {/* Verified Grounding Sources */}
                  {msg.sources && msg.sources.length > 0 && (
                    <div className="mt-3.5 pt-3 border-t border-[#262626]/60">
                      <div className="flex items-center gap-1.5 text-[10px] font-bold text-blue-400 mb-2">
                        <Globe className="w-3.5 h-3.5" />
                        <span>Google Search Grounding References:</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {msg.sources.map((src, sIdx) => (
                          <a
                            key={sIdx}
                            href={src.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center px-2 py-1 bg-[#141414] hover:bg-[#1a1a1a] border border-[#262626] rounded-lg text-[9px] text-neutral-300 hover:text-blue-400 font-mono transition max-w-[220px] truncate cursor-pointer"
                          >
                            <span className="truncate">{src.title}</span>
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Actions (Copy/Speak) */}
                  <div className="flex items-center gap-2 mt-3 text-[10px] text-neutral-400 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => handleCopy(msg.id, msg.text)}
                      className="p-1 hover:bg-[#1c1c1c] rounded transition flex items-center gap-1 cursor-pointer text-neutral-400 hover:text-white"
                      title="Copy text"
                    >
                      {copiedId === msg.id ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-500" />
                          <span>Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                    {!isUser && (
                      <button 
                      onClick={() => handleToggleSpeech(msg.id, msg.text)}
                        className={`p-1 rounded transition flex items-center gap-1 cursor-pointer ${speakingId === msg.id ? "bg-violet-950/40 text-violet-400" : "hover:bg-[#1c1c1c] text-neutral-400 hover:text-white"}`}
                        title={speakingId === msg.id ? "Stop reading" : "Read aloud"}
                      >
                        <Volume2 className="w-3 h-3" />
                        <span>{speakingId === msg.id ? "Stop" : "Read"}</span>
                      </button>
                    )}
                    <span className="text-[9px] font-mono select-none pl-1 text-neutral-500">{msg.timestamp}</span>
                  </div>
                </div>

                {isUser && (
                  <div className="w-8 h-8 rounded-lg bg-neutral-800 text-neutral-300 border border-neutral-700 flex items-center justify-center font-display font-semibold text-xs flex-shrink-0">
                    U
                  </div>
                )}
              </div>
            );
          })
        )}

        {/* Loading Bubble */}
        {isSending && (
          <div className="flex gap-4 justify-start">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-violet-600 to-indigo-600 text-white flex items-center justify-center font-display font-semibold text-xs flex-shrink-0">
              AI
            </div>
            <div className="bg-[#0F0F0F] rounded-2xl rounded-tl-none p-4 border border-[#262626] shadow-sm flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-bounce"></span>
              <span className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-bounce [animation-delay:0.2s]"></span>
              <span className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-bounce [animation-delay:0.4s]"></span>
              <span className="text-xs text-neutral-400 ml-1 font-mono">Formulating strategy...</span>
            </div>
          </div>
        )}

        <div ref={chatBottomRef} />
      </div>

      {/* Upload files attachment pill */}
      {(documentContent || documentName) && (
        <div className="px-6 py-2.5 bg-violet-950/20 border-t border-[#262626] flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-medium text-violet-400">
            <FileText className="w-4 h-4 text-violet-400" />
            <span className="font-semibold truncate max-w-[200px]">{documentName}</span>
            <span className="text-[10px] text-neutral-400">(ready for summarization)</span>
          </div>
          <button 
            onClick={() => {
              setDocumentContent(null);
              setDocumentName(null);
            }}
            className="text-xs text-rose-400 hover:underline cursor-pointer"
          >
            Remove
          </button>
        </div>
      )}

      {/* Input Action Form */}
      <form onSubmit={handleSend} className="p-4 border-t border-[#262626] bg-[#1c1c1c] flex gap-2 items-center">
        {/* Upload Button */}
        <label className="p-3 bg-[#0F0F0F] hover:bg-[#171717] border border-[#262626] text-neutral-400 hover:text-white rounded-xl cursor-pointer transition flex-shrink-0">
          <Upload className="w-4 h-4" />
          <input 
            type="file" 
            accept=".txt,.csv,.md,.json" 
            onChange={handleFileUpload} 
            className="hidden" 
          />
        </label>

        {/* Text Input Box */}
        <div className="flex-1 relative">
          <input 
            type="text" 
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={documentContent ? "Ask anything about this document..." : `Consult your ${currentRoleObj.name}...`}
            disabled={isSending}
            className="w-full pl-4 pr-10 py-3 bg-[#0F0F0F] border border-[#262626] text-white rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20"
          />
          {/* Dictation mic button */}
          <button
            type="button"
            onClick={handleToggleRecording}
            className={`absolute right-3 top-3.5 p-0.5 rounded-full transition cursor-pointer ${isRecording ? "text-rose-400 animate-pulse bg-rose-950/40" : "text-neutral-500 hover:text-white"}`}
            title="Dictate with voice"
          >
            {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </button>
        </div>

        {/* Send Submit */}
        <button 
          type="submit"
          disabled={isSending || (!inputText.trim() && !documentContent)}
          className="p-3 bg-violet-600 hover:bg-violet-700 text-white rounded-xl transition disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0 cursor-pointer"
        >
          <Send className="w-4 h-4 text-white" />
        </button>
      </form>

      {/* IMMERSIVE REAL-TIME VOICE SESSION CARD PANEL */}
      <AnimatePresence>
        {isVoiceActive && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="absolute inset-0 bg-neutral-950/95 flex flex-col justify-between p-8 z-30"
          >
            {/* Top Status */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className={`w-2.5 h-2.5 rounded-full ${
                  voiceState === 'connected' ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500 animate-bounce'
                }`} />
                <div>
                  <h4 className="text-xs font-mono uppercase tracking-widest text-neutral-400">Secure Live Consult</h4>
                  <span className="text-sm font-bold text-white capitalize">{currentRoleObj.name} Voice Link</span>
                </div>
              </div>
              <span className="text-[10px] px-2 py-0.5 bg-neutral-900 border border-neutral-800 rounded text-neutral-500 font-mono">
                Model: 3.1-flash-live
              </span>
            </div>

            {/* Immersive Soundwave Ripple Center */}
            <div className="flex flex-col items-center justify-center space-y-6">
              <div className="relative flex items-center justify-center">
                
                {/* Multi-layered custom motion pulse rings */}
                {voiceState === 'connected' && !isVoiceMuted && (
                  <>
                    <motion.div 
                      animate={{ scale: [1, 2, 1], opacity: [0.15, 0, 0.15] }}
                      transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
                      className="absolute w-32 h-32 bg-violet-500/20 rounded-full filter blur-md"
                    />
                    <motion.div 
                      animate={{ scale: [1, 1.6, 1], opacity: [0.25, 0, 0.25] }}
                      transition={{ repeat: Infinity, duration: 2, ease: "easeInOut", delay: 0.5 }}
                      className="absolute w-32 h-32 bg-violet-600/30 rounded-full filter blur-md"
                    />
                  </>
                )}

                {/* Inner Glow Core Orb */}
                <div className={`w-28 h-28 rounded-full border flex items-center justify-center transition-all duration-300 ${
                  isVoiceMuted 
                    ? "bg-rose-950/20 border-rose-500/30 text-rose-400" 
                    : voiceState === 'connected'
                      ? "bg-violet-950/30 border-violet-500/40 text-violet-400"
                      : "bg-neutral-900 border-neutral-800 text-neutral-500 animate-pulse"
                }`}>
                  {isVoiceMuted ? (
                    <MicOff className="w-10 h-10" />
                  ) : (
                    <Mic className="w-10 h-10" />
                  )}
                </div>
              </div>

              {/* Status Indicator */}
              <div className="text-center space-y-1">
                <span className="text-sm font-bold text-white">
                  {voiceState === 'connecting' ? 'Connecting Secure Uplink...' : isVoiceMuted ? 'Microphone Muted' : 'Uplink Established & Live'}
                </span>
                <p className="text-[11px] text-neutral-400 max-w-xs mx-auto">
                  {isVoiceMuted ? 'Gemini cannot hear you. Click unmute to continue.' : 'Speak naturally. The advisor will respond in real-time.'}
                </p>
              </div>
            </div>

            {/* Live Audio Logs/Captions terminal view */}
            <div className="bg-[#0A0A0A]/80 border border-neutral-900 rounded-xl p-4 h-32 overflow-y-auto space-y-1.5 font-mono text-[10px]">
              <span className="text-[9px] text-[#737373] font-bold block uppercase border-b border-neutral-900/60 pb-1 mb-2">consultation feed logs:</span>
              {voiceLog.slice(-5).map((log, idx) => (
                <div key={idx} className="flex gap-2 text-neutral-300">
                  <span className="text-neutral-600 select-none">&gt;</span>
                  <span className={log.includes("⚠️") ? "text-rose-400" : log.includes("⚡") ? "text-amber-400" : "text-neutral-300"}>
                    {log}
                  </span>
                </div>
              ))}
            </div>

            {/* Bottom Controls */}
            <div className="flex items-center justify-center gap-6">
              {/* Toggle Mute */}
              <button
                onClick={() => setIsVoiceMuted(!isVoiceMuted)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                  isVoiceMuted 
                    ? 'bg-rose-600 border-rose-500 text-white shadow-lg shadow-rose-600/10' 
                    : 'bg-neutral-900 border-neutral-800 hover:bg-neutral-800 text-neutral-300 hover:text-white'
                }`}
                title={isVoiceMuted ? "Unmute Microphone" : "Mute Microphone"}
              >
                {isVoiceMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              </button>

              {/* End Call Phone Button */}
              <button
                onClick={stopVoiceSession}
                className="p-4 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white shadow-lg shadow-rose-600/20 cursor-pointer border border-rose-500/20"
                title="End Voice Conversation"
              >
                <PhoneOff className="w-5 h-5" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}

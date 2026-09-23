/// <reference types="vite/client" />
import React, {
  useState,
  useRef,
  useEffect,
  useCallback,
  useMemo,
} from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Send,
  BotMessageSquare,
  ChevronDown,
  Paperclip,
  Camera,
  ImageIcon,
  XCircle,
  Maximize2,
  Minimize2,
  Mic,
  ThumbsUp,
  ThumbsDown,
  FileDown,
  Check,
  Copy
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { NAV_ITEMS } from '../layout/Sidebar';
import ReactMarkdown from 'react-markdown';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { useSuccess } from '../../context/SuccessContext';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import { jsPDF } from 'jspdf';

// ── Types ─────────────────────────────────────────────────────────────────────
interface AttachedImage {
  data: string;      // base64 string WITHOUT the data-URL prefix
  mimeType: string;  // e.g. "image/jpeg"
  previewUrl: string; // full data-URL for UI preview
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  timestamp: number; // Unix ms
  image?: { previewUrl: string }; // optional thumbnail shown in bubble
  isSimplified?: boolean;
  userVote?: 'up' | 'down';
}

interface SuggestedQuestion {
  text: string;
  role: string[];
}

// Gemini-compatible history entry
interface GeminiHistoryEntry {
  role: 'user' | 'model';
  parts: [{ text: string }];
}

interface SahayakChatProps {
  isOpen: boolean;
  onClose: () => void;
  startFullscreen?: boolean; // when opened from sidebar
}

// ── Constants ─────────────────────────────────────────────────────────────────
const TWO_HOURS_MS = 2 * 60 * 60 * 1000;
const LS_TIMESTAMP_KEY = 'sahayak_last_activity';
const LS_HISTORY_KEY = 'sahayak_chat_history';

const SUGGESTED_QUESTIONS: SuggestedQuestion[] = [
  { text: "Mera UT-2 ka syllabus kya hai?", role: ['Student'] },
  { text: "Leave kaise apply karu?", role: ['Student'] },
  { text: "Kal ka homework kya hai?", role: ['Student'] },
  { text: "Meri attendance kitni hai?", role: ['Student'] },

  { text: "Aaj kitne bacche absent hain?", role: ['Teacher'] },
  { text: "Marks upload kaise karu?", role: ['Teacher'] },
  { text: "Class ki performance kaisi hai?", role: ['Teacher'] },
  { text: "Weakest students kaun hain?", role: ['Teacher'] },

  { text: "Total fee collection kitni hai?", role: ['Admin'] },
  { text: "Kitne students absent hain aaj?", role: ['Admin'] },
  { text: "New notice kaise banau?", role: ['Admin'] },
];

// ── Helpers ───────────────────────────────────────────────────────────────────
function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

function fileToBase64(file: File): Promise<AttachedImage> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      // dataUrl = "data:<mime>;base64,<data>"
      const [meta, data] = dataUrl.split(',');
      const mimeType = meta.replace('data:', '').replace(';base64', '');
      resolve({ data, mimeType, previewUrl: dataUrl });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// ── TypingIndicator ───────────────────────────────────────────────────────────
function TypingIndicator({ botName }: { botName: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 8 }}
      transition={{ duration: 0.2 }}
      className="flex items-end gap-2 self-start mb-2"
    >
      <div className="w-7 h-7 rounded-full bg-[#8B5E2E] flex items-center justify-center shrink-0">
        <BotMessageSquare className="w-4 h-4 text-white" />
      </div>
      <div className="bg-white border border-gray-100 rounded-2xl rounded-bl-none px-4 py-3 shadow-sm">
        <p className="text-[10px] text-gray-400 font-medium mb-1">{botName} is thinking…</p>
        <div className="flex items-center gap-1 h-4">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="w-2 h-2 rounded-full bg-[#C5873A] block"
              style={{
                animation: 'bounce-dot 1.2s ease-in-out infinite',
                animationDelay: `${i * 0.2}s`,
              }}
            />
          ))}
        </div>
      </div>
    </motion.div>
  );
}

// ── ImagePreviewBadge ─────────────────────────────────────────────────────────
function ImagePreviewBadge({
  image,
  onRemove,
}: {
  image: AttachedImage;
  onRemove: () => void;
}) {
  return (
    <div className="relative inline-block mr-2">
      <img
        src={image.previewUrl}
        alt="Attached"
        className="w-14 h-14 rounded-xl object-cover border-2 border-[#C5873A]"
      />
      <button
        onClick={onRemove}
        className="absolute -top-1.5 -right-1.5 bg-white rounded-full text-red-500 shadow"
        aria-label="Remove image"
      >
        <XCircle className="w-4 h-4" />
      </button>
    </div>
  );
}

// (Removed custom regex markdown renderer in favor of react-markdown)

// ── Main SahayakChat ──────────────────────────────────────────────────────────
export function SahayakChat({ isOpen, onClose, startFullscreen = false }: SahayakChatProps) {
  const { currentUser } = useAuth();
  const { triggerError } = useSuccess();

  // ── Persona ─────────────────────────────────────────────────────────────────
  const userGender = currentUser?.personalDetails?.gender?.toLowerCase();
  const isUserMale = userGender === 'male';
  const botName = isUserMale ? 'Shahayika' : 'Sahayak';
  const uiTitle = `Chat with ${botName}`;

  // ── Welcome message factory ─────────────────────────────────────────────────
  const welcomeMessage = useCallback((): Message => ({
    id: 'welcome',
    role: 'assistant',
    text: `Namaste! Main ${botName} hun 👋 AJPS Connect का official AI assistant. Aaj main aapki kya madad kar sakta${isUserMale ? 'i' : ''} hun${currentUser?.name ? `, ${currentUser.name.split(' ')[0]}` : ''}?`,
    timestamp: Date.now(),
  }), [botName, isUserMale, currentUser?.name]);

  // ── State ───────────────────────────────────────────────────────────────────
  const [messages, setMessages] = useState<Message[]>([welcomeMessage()]);
  const [input, setInput] = useState('');
  const [autoScroll, setAutoScroll] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };
  const [isTyping, setIsTyping] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [attachedImage, setAttachedImage] = useState<AttachedImage | null>(null);
  const [chatHistory, setChatHistory] = useState<GeminiHistoryEntry[]>([]);
  const [isFullscreen, setIsFullscreen] = useState(startFullscreen);
  const [keyboardOffset, setKeyboardOffset] = useState(0);

  // Selection Mode State
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedMessageIds, setSelectedMessageIds] = useState<Set<string>>(new Set());

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);   // 📎 attachment
  const cameraInputRef = useRef<HTMLInputElement>(null);   // 📷 camera
  const containerRef = useRef<HTMLDivElement>(null);

  // Sync startFullscreen prop
  useEffect(() => {
    setIsFullscreen(startFullscreen);
  }, [startFullscreen]);

  // ── RBAC Identity ──────────────────────────────────────────────────────────
  const userRole = currentUser?.role || 'Student';
  const userName = currentUser?.name || 'User';
  const userClass = currentUser?.classId || currentUser?.className || '';
  const userSection = currentUser?.section || '';
  const studentId = currentUser?.id || '';

  // ── System instruction (RBAC-aware) ────────────────────────────────────────
  const systemInstruction = useMemo(() => {
    const isFeminine = isUserMale;

    const grammarNote = isFeminine
      ? `STRICT GRAMMAR & PERSONA RULES:
1. Your name is 'Miss Sahayika'. You are assisting a MALE user.
   You MUST speak Hindi/Hinglish strictly using FEMININE verbs and pronouns.
   Examples: "Main aapki madad karungi", "Main check kar rahi hun", "Main bataungi", "Main samajh sakti hun".
2. NEVER use masculine verb forms (karunga, raha hun, bata raha hun). Always use feminine forms.`
      : `STRICT GRAMMAR & PERSONA RULES:
1. Your name is 'Mr. Sahayak'. You are assisting a FEMALE user.
   You MUST speak Hindi/Hinglish strictly using MASCULINE verbs and pronouns.
   Examples: "Main aapka kaam karunga", "Main bata raha hun", "Main samajh sakta hun".
2. NEVER use feminine verb forms (karungi, rahi hun, bataungi). Always use masculine forms.`;

    // Role-based context
    let roleContext = '';
    if (userRole === 'Student') {
      // Build attendance summary if available
      const attendanceSummary = currentUser?.attendanceHistory
        ? (() => {
          const total = currentUser.attendanceHistory.length;
          const present = currentUser.attendanceHistory.filter(a => a.status === 'Present' || a.status === 'present').length;
          return `\nStudent's Attendance Summary: ${present}/${total} days present (${total > 0 ? Math.round((present / total) * 100) : 0}%).`;
        })()
        : '';

      roleContext = `
ROLE: STUDENT
You are assisting a STUDENT named ${userName}, Class ${userClass}, Section ${userSection}, ID: ${studentId}.
${attendanceSummary}

STRICT PRIVACY RULES FOR STUDENTS:
- You may ONLY discuss this student's own academic data (attendance, marks, fees, timetable).
- NEVER disclose another student's marks, performance, rank, or personal details under ANY circumstances.
- If asked about another student, respond: "Privacy policy ke anusaar main kisi doosre student ki details share nahi kar sakti/sakta."
- Limit syllabus and academic guidance strictly to Class ${userClass}.`;
    } else if (userRole === 'Admin' || userRole === 'Teacher') {
      let analyticsSummary = '';
      if (userRole === 'Teacher') {
        try {
          const users = JSON.parse(localStorage.getItem('ajps_users') || '[]');
          const classStudents = users.filter((u: any) => u.role === 'Student' && currentUser?.assignedClasses?.includes(u.className));
          analyticsSummary = `\nCLASS ANALYTICS: You have access to class analytics for classes: ${currentUser?.assignedClasses?.join(', ')}. Total students: ${classStudents.length}. Use this data to answer analytics queries.`;
        } catch (e) { }
      }

      roleContext = `
ROLE: ${userRole.toUpperCase()}
You are assisting a ${userRole} named ${userName}.
${userRole === 'Teacher' && currentUser?.assignedClasses ? `Assigned Classes: ${currentUser.assignedClasses.join(', ')}` : ''}
${userRole === 'Teacher' && currentUser?.subjects ? `Subjects: ${currentUser.subjects.join(', ')}` : ''}
${analyticsSummary}

STAFF ACCESS RULES:
- You may discuss class-wide statistics, directory searches, and general school records.
- You may help with administrative queries about students, fees, attendance patterns, and results.
- Maintain professional tone while being helpful and efficient.`;
    } else {
      roleContext = `
ROLE: ${userRole.toUpperCase()}
You are assisting ${userName} (${userRole}).
- Answer only queries relevant to their role.
- For anything beyond your scope, direct them to the school office.`;
    }

    const appManual = `
APPLICATION MANUAL — Guide users with these exact routes (only guide them to routes they are allowed to see based on their role):
- Allowed routes for this user: ${NAV_ITEMS.filter(n => n.allowedRoles.includes(userRole as any)).map(n => n.path).join(', ')}

Available routes and their purpose:
- /fees → Fee Payment & Due Status: View pending dues, make payments, download fee receipts.
- /exams → Exams & Results: View datesheets, syllabus breakdowns, and scorecards.
- /attendance → Attendance Records: Check daily attendance, monthly reports, and history.
- /students → Student/Staff Directory: Browse records using Class/Section filters.
- /timetable → Time Table: View daily class schedules, period timings, and subject teachers.
- /dashboard → Home Dashboard: Overview of announcements, quick stats, and shortcuts.
- /notices → Notices: View school announcements and circulars.
- /transport → Transport: Check bus routes, driver info, and tracking.
- /settings → Settings: Update profile, preferences, and app configuration.
- /classes → Class management (Admin only)
When a user asks HOW to do something in the app, give step-by-step navigation instructions based on this manual.
If they ask to do something their role cannot do, politely inform them they don't have access.`;

    return `You are ${botName}, the official AI assistant for Amar Jyoti Public School (AJPS Connect).
${roleContext}

${grammarNote}

GENERAL RULES:
- Before answering an academic/study question, you MUST format the answer beautifully. If they haven't specified length, ask: "Aapko kitne marks ya words ka answer chahiye?". 
- For Math/Physics: Output equations in strict LaTeX format (using $$ for block and $ for inline).
- For CS/IT: Use proper markdown code blocks with syntax highlighting (\`\`\`lang ... \`\`\`).
- For History/Bio: Use bold headings, bullet points, and timelines.
- Only answer school-related questions: attendance, homework, timetable, fees, exams, results, events, teacher info.
- Respond in the same language the user writes — Hindi, English, or Hinglish.
- Keep replies short: 2 to 4 lines max unless more detail is needed.
- If you don't know something, say: "Iske liye school office se contact karein."
- Politely decline non-school topics and redirect to school matters.
- NEVER mention Gemini, Google AI, or any AI company. You are ONLY ${botName}.
- Tone: warm, helpful, like a friendly school staff member.
- If a student seems stressed (exams, homework), respond empathetically and encouragingly.
- When analysing an image, describe what you see briefly, then help the user.

${appManual}`;
  }, [botName, isUserMale, userRole, userName, userClass, userSection, studentId, currentUser?.attendanceHistory, currentUser?.assignedClasses, currentUser?.subjects]);

  // ── Mobile Keyboard Handling (visualViewport API) ──────────────────────────
  useEffect(() => {
    if (!isOpen) return;

    const vv = window.visualViewport;
    if (!vv) return;

    const handleResize = () => {
      // When keyboard opens, visualViewport.height shrinks
      const windowHeight = window.innerHeight;
      const viewportHeight = vv.height;
      const offset = windowHeight - viewportHeight;
      setKeyboardOffset(offset > 50 ? offset : 0); // threshold to avoid false positives
    };

    vv.addEventListener('resize', handleResize);
    vv.addEventListener('scroll', handleResize);

    return () => {
      vv.removeEventListener('resize', handleResize);
      vv.removeEventListener('scroll', handleResize);
      setKeyboardOffset(0);
    };
  }, [isOpen]);

  // ── 2-Hour Auto-Expiry ──────────────────────────────────────────────────────
  const updateActivity = useCallback(() => {
    localStorage.setItem(LS_TIMESTAMP_KEY, String(Date.now()));
  }, []);

  const checkExpiry = useCallback(() => {
    const stored = localStorage.getItem(LS_TIMESTAMP_KEY);
    if (!stored) return; // first time — nothing to expire
    const lastActivity = Number(stored);
    if (Date.now() - lastActivity > TWO_HOURS_MS) {
      // Clear chat
      setMessages([welcomeMessage()]);
      setChatHistory([]);
      localStorage.removeItem(LS_HISTORY_KEY);
      localStorage.setItem(LS_TIMESTAMP_KEY, String(Date.now()));
      console.info('[Sahayak] Chat auto-cleared after 2 hours of inactivity.');
    }
  }, [welcomeMessage]);

  // Check on mount and every 60 seconds
  useEffect(() => {
    checkExpiry();
    const interval = setInterval(checkExpiry, 60_000);
    return () => clearInterval(interval);
  }, [checkExpiry]);

  // ── Scroll to bottom ────────────────────────────────────────────────────────
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping, scrollToBottom]);

  // Auto-focus input when chat opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen]);

  // ── File / Camera Handlers ──────────────────────────────────────────────────
  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const img = await fileToBase64(file);
      setAttachedImage(img);
    } catch (err) {
      console.error('[Sahayak] Failed to read image:', err);
    }
    // Reset input value so the same file can be re-selected if removed
    e.target.value = '';
  }, []);

  // ── Speech to Text (Feature 2) ──────────────────────────────────────────────
  const toggleListening = useCallback(() => {
    if (isListening) {
      setIsListening(false);
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      triggerError("Voice recognition is not supported in this browser.");
      return;
    }

    const recognition = new SpeechRecognition();

    // Auto-detect lang based on last input heuristically, default to Hindi-IN
    // For simplicity, we stick to hi-IN which handles both Hindi and Hinglish well
    recognition.lang = 'hi-IN';
    recognition.interimResults = true;
    recognition.continuous = false;

    recognition.onstart = () => setIsListening(true);

    recognition.onresult = (event: any) => {
      const transcript = Array.from(event.results)
        .map((result: any) => result[0].transcript)
        .join('');
      setInput(transcript);
    };

    recognition.onerror = (event: any) => {
      console.error("[Sahayak] Speech recognition error", event.error);
      setIsListening(false);
    };

    recognition.onend = () => setIsListening(false);

    recognition.start();
  }, [isListening]);

  // ── PDF Export (Feature 7) ──────────────────────────────────────────────────
  const exportSelectedToPDF = useCallback(() => {
    try {
      const doc = new jsPDF();
      doc.setFont("helvetica");
      doc.setFontSize(16);
      doc.text("AJPS Connect - Sahayak AI Notes", 15, 20);

      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text(`Generated by ${botName} on ${new Date().toLocaleString('en-IN')}`, 15, 28);

      doc.setLineWidth(0.5);
      doc.line(15, 32, 195, 32);

      doc.setFontSize(12);
      doc.setTextColor(20);

      let yOffset = 42;

      const selectedMsgs = messages.filter(m => selectedMessageIds.has(m.id)).sort((a, b) => a.timestamp - b.timestamp);

      if (selectedMsgs.length === 0) return;

      selectedMsgs.forEach(msg => {
        const roleStr = msg.role === 'user' ? 'You' : botName;
        const timeStr = new Date(msg.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

        doc.setFont("helvetica", "bold");
        doc.text(`[${timeStr}] ${roleStr}:`, 15, yOffset);
        yOffset += 6;

        // Strip markdown symbols roughly for simple text PDF output
        const cleanText = msg.text
          .replace(/\*\*(.*?)\*\*/g, '$1')
          .replace(/\$\$(.*?)\$\$/g, '$1')
          .replace(/\$(.*?)\$/g, '$1')
          .replace(/```.*?([\s\S]*?)```/g, '$1');

        doc.setFont("helvetica", "normal");
        const splitText = doc.splitTextToSize(cleanText, 180);
        doc.text(splitText, 15, yOffset);

        yOffset += (splitText.length * 5) + 6;

        if (yOffset > 280) {
          doc.addPage();
          yOffset = 20;
        }
      });

      doc.save(`sahayak-notes-${Date.now()}.pdf`);

      setIsSelectionMode(false);
      setSelectedMessageIds(new Set());
    } catch (e) {
      console.error("PDF Export failed", e);
    }
  }, [botName, messages, selectedMessageIds]);

  const exportToPDF = useCallback((msgText: string, timestamp: number) => {
    try {
      const doc = new jsPDF();
      doc.setFont("helvetica");
      doc.setFontSize(16);
      doc.text("AJPS Connect - Sahayak AI Notes", 15, 20);

      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text(`Generated by ${botName} on ${new Date(timestamp).toLocaleString('en-IN')}`, 15, 28);

      doc.setLineWidth(0.5);
      doc.line(15, 32, 195, 32);

      doc.setFontSize(12);
      doc.setTextColor(20);

      // Strip markdown symbols roughly for simple text PDF output
      const cleanText = msgText
        .replace(/\*\*(.*?)\*\*/g, '$1')
        .replace(/\$\$(.*?)\$\$/g, '$1')
        .replace(/\$(.*?)\$/g, '$1')
        .replace(/```.*?([\s\S]*?)```/g, '$1');

      const splitText = doc.splitTextToSize(cleanText, 180);
      doc.text(splitText, 15, 42);

      doc.save(`sahayak-notes-${Date.now()}.pdf`);
    } catch (e) {
      console.error("PDF Export failed", e);
    }
  }, [botName]);

  // ── Send Message (text + optional image) ───────────────────────────────────
  const sendMessage = useCallback(async (forcedText?: string) => {
    const userText = forcedText ?? input.trim();
    const hasImage = !!attachedImage;

    if (!userText && !hasImage) return;
    if (isTyping) return;

    if (!forcedText) setInput('');
    const imageSnapshot = attachedImage;
    setAttachedImage(null);

    // Optimistically add user message
    const userMsg: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      text: userText || '📸 [Image shared]',
      timestamp: Date.now(),
      image: imageSnapshot ? { previewUrl: imageSnapshot.previewUrl } : undefined,
    };
    setMessages((prev) => [...prev, userMsg]);
    setIsTyping(true);
    updateActivity();

    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    console.log("KEY CHECK:", import.meta.env.VITE_GEMINI_API_KEY?.slice(0, 8));

    try {
      if (!apiKey) {
        console.error('[Sahayak] VITE_GEMINI_API_KEY is missing. Check .env and restart the dev server.');
        throw new Error('Assistant core not configured.');
      }

      // Build current user parts — supports text + optional image
      const userParts: any[] = [];
      if (imageSnapshot) {
        userParts.push({
          inlineData: {
            mimeType: imageSnapshot.mimeType,
            data: imageSnapshot.data,
          },
        });
      }
      userParts.push({ text: userText || 'Please look at this image and help me with it.' });

      // Build Gemini contents: history + current user turn
      const contents: any[] = [
        ...chatHistory,
        { role: 'user', parts: userParts },
      ];

      const requestBody = {
        systemInstruction: {
          parts: [{ text: systemInstruction }],
        },
        contents,
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 500,
        },
      };

      console.log("FULL URL KEY:", import.meta.env.VITE_GEMINI_API_KEY);
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent?key=${import.meta.env.VITE_GEMINI_API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody),
        }
      );

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(`Gemini API error ${response.status}: ${JSON.stringify(errData)}`);
      }

      const data = await response.json();
      const responseText =
        data.candidates?.[0]?.content?.parts?.[0]?.text ??
        'Oops! Kuch problem aayi, please try again. 🙏';

      // Update Gemini-format history (text-only; images are omitted for lean history)
      setChatHistory((prev) => [
        ...prev,
        { role: 'user', parts: [{ text: userText || '[image shared]' }] },
        { role: 'model', parts: [{ text: responseText }] },
      ]);

      const assistantMsg: Message = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        text: responseText,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, assistantMsg]);
      updateActivity();
    } catch (err: any) {
      console.error('[Sahayak] API Error:', err?.message || err);
      const isKeyError =
        err?.message?.includes('not configured') ||
        err?.message?.includes('API_KEY') ||
        err?.message?.includes('403') ||
        err?.message?.includes('401');
      const errMsg: Message = {
        id: `err-${Date.now()}`,
        role: 'assistant',
        text: isKeyError
          ? "The assistant core isn't configured yet. Please ask your school admin to set up the API key. 🙏"
          : "Oops! Kuch problem aayi, please try again. 🙏",
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, errMsg]);
    } finally {
      setIsTyping(false);
    }
  }, [input, attachedImage, isTyping, chatHistory, systemInstruction, updateActivity]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleVote = useCallback(async (msgId: string, vote: 'up' | 'down') => {
    setMessages(prev => prev.map(m => m.id === msgId ? { ...m, userVote: vote } : m));

    if (vote === 'down') {
      const targetMsg = messages.find(m => m.id === msgId);
      if (!targetMsg) return;

      const topic = targetMsg.text.substring(0, 50);
      const hiddenPrompt = `The user did not understand your previous answer about "${topic}...". Explain it again in a much simpler, easier way, using basic analogies.`;

      setIsTyping(true);
      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent?key=${import.meta.env.VITE_GEMINI_API_KEY}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [
                ...chatHistory,
                { role: 'user', parts: [{ text: hiddenPrompt }] }
              ],
              generationConfig: { temperature: 0.7, maxOutputTokens: 500 }
            })
          }
        );
        const data = await response.json();
        const simplifiedText = data.candidates?.[0]?.content?.parts?.[0]?.text;

        if (simplifiedText) {
          setMessages(prev => {
            const newMsgs = [...prev];
            const idx = newMsgs.findIndex(m => m.id === msgId);
            if (idx !== -1) {
              newMsgs.splice(idx + 1, 0, {
                id: `assistant-${Date.now()}-simplified`,
                role: 'assistant',
                text: simplifiedText,
                timestamp: Date.now(),
                isSimplified: true
              });
            }
            return newMsgs;
          });
        }
      } catch (e) {
        console.error("Failed to fetch simplified response", e);
      } finally {
        setIsTyping(false);
      }
    }
  }, [messages, chatHistory]);

  const activeFaqs = SUGGESTED_QUESTIONS.filter(q => q.role.includes(userRole as string));
  const showFaqs = messages.length <= 2 && activeFaqs.length > 0;

  // ── Container classes ──────────────────────────────────────────────────────
  const containerClass = isFullscreen
    ? 'fixed inset-0 w-full h-full flex flex-col bg-[#FAF7F2] z-[9999] overflow-hidden'
    : 'fixed bottom-[88px] right-4 w-[22rem] max-w-[calc(100vw-2rem)] h-[32rem] flex flex-col bg-[#FAF7F2] rounded-2xl shadow-2xl z-[9999] overflow-hidden border border-[#EDE8DF]';

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={containerRef}
          initial={{ opacity: 0, y: isFullscreen ? 0 : 32, scale: isFullscreen ? 1 : 0.94 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: isFullscreen ? 0 : 32, scale: isFullscreen ? 1 : 0.94 }}
          transition={{ type: 'spring', stiffness: 320, damping: 28 }}
          className={containerClass}
          style={{
            boxShadow: isFullscreen ? 'none' : '0 20px 60px rgba(139, 94, 46, 0.22)',
            paddingBottom: keyboardOffset > 0 ? `${keyboardOffset}px` : undefined,
          }}
        >
          {/* ── Header ─────────────────────────────────────────────────────── */}
          <div className="shrink-0 bg-gradient-to-r from-[#7A4F26] to-[#A0642E] px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative w-9 h-9 rounded-full bg-white/20 flex items-center justify-center">
                <BotMessageSquare className="w-5 h-5 text-white" />
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-[#8B5E2E]" />
              </div>
              <div>
                <p className="text-white font-bold text-sm leading-tight">{uiTitle}</p>
                <p className="text-white/70 text-[10px] font-medium">AJPS School Assistant · Online</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              {isSelectionMode ? (
                <>
                  <button
                    onClick={exportSelectedToPDF}
                    disabled={selectedMessageIds.size === 0}
                    className="px-2 py-1.5 rounded-full hover:bg-white/20 text-white/80 hover:text-white transition-colors flex items-center gap-1.5 disabled:opacity-50"
                    title="Export selected messages to PDF"
                  >
                    <FileDown className="w-4 h-4" /> <span className="text-xs font-medium">Export ({selectedMessageIds.size})</span>
                  </button>
                  <button
                    onClick={() => { setIsSelectionMode(false); setSelectedMessageIds(new Set()); }}
                    className="p-1.5 rounded-full hover:bg-white/20 text-white/80 hover:text-white transition-colors ml-1"
                    title="Cancel selection"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </>
              ) : (
                <>
                  {messages.length > 1 && (
                    <button
                      onClick={() => setIsSelectionMode(true)}
                      className="p-1.5 rounded-full hover:bg-white/20 text-white/80 hover:text-white transition-colors"
                      title="Select messages to export"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                  )}
                  {/* Expand / Minimize button */}
                  <button
                    onClick={() => setIsFullscreen((f) => !f)}
                    className="p-1.5 rounded-full hover:bg-white/20 text-white/80 hover:text-white transition-colors"
                    aria-label={isFullscreen ? 'Minimize chat' : 'Expand chat'}
                  >
                    {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                  </button>
                  {/* Close button */}
                  <button
                    onClick={onClose}
                    className="p-1.5 rounded-full hover:bg-white/20 text-white/80 hover:text-white transition-colors"
                    aria-label="Close chat"
                  >
                    {isFullscreen ? <X className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                  </button>
                </>
              )}
            </div>
          </div>

          {/* ── Messages Area ───────────────────────────────────────────────── */}
          <div className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-2">
            <AnimatePresence initial={false}>
              {messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  className={`flex items-end gap-2 ${msg.role === 'user' ? 'self-end flex-row-reverse' : 'self-start'} ${isSelectionMode ? 'cursor-pointer hover:bg-black/5 p-1 rounded-xl transition-colors w-full' : ''}`}
                  onClick={() => {
                    if (isSelectionMode) {
                      const next = new Set(selectedMessageIds);
                      if (next.has(msg.id)) next.delete(msg.id);
                      else next.add(msg.id);
                      setSelectedMessageIds(next);
                    }
                  }}
                >
                  {isSelectionMode && (
                    <div className={`w-5 h-5 border-2 rounded flex items-center justify-center shrink-0 mb-1 ${msg.role === 'user' ? 'ml-2' : 'mr-2'} ${selectedMessageIds.has(msg.id) ? 'bg-[#A05C2B] border-[#A05C2B]' : 'border-gray-300'}`}>
                      {selectedMessageIds.has(msg.id) && <Check className="w-3 h-3 text-white" />}
                    </div>
                  )}
                  {/* Bot avatar */}
                  {msg.role === 'assistant' && (
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#8B5E2E] to-[#C5873A] flex items-center justify-center shrink-0 shadow-sm">
                      <BotMessageSquare className="w-4 h-4 text-white" />
                    </div>
                  )}

                  {/* Bubble */}
                  <div className={`flex flex-col gap-1 max-w-[78%] ${isSelectionMode && msg.role === 'user' ? 'mr-auto' : ''}`}>
                    {msg.role === 'assistant' && msg.text.split(' ').length > 50 && !isSelectionMode && (
                      <div className="flex justify-end gap-1 mb-1">
                        <button
                          onClick={() => handleCopy(msg.text, msg.id)}
                          className="p-1 rounded bg-black/20 hover:bg-black/40 text-white transition-colors"
                          title="Copy Answer"
                        >
                          {copiedId === msg.id ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                        </button>
                        <button
                          onClick={() => exportToPDF(msg.text, msg.timestamp)}
                          className="p-1 rounded bg-black/20 hover:bg-black/40 text-white transition-colors"
                          title="Download as PDF"
                        >
                          <FileDown className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                    <div
                      className={`px-3.5 py-2.5 text-sm leading-relaxed shadow-sm ${isFullscreen ? 'max-w-[100%]' : 'max-w-[100%]'} ${msg.role === 'user'
                        ? 'bg-gradient-to-br from-[#C5873A] to-[#A05C2B] text-white rounded-2xl rounded-br-none'
                        : 'bg-white text-gray-800 border border-gray-100 rounded-2xl rounded-bl-none'
                        }`}
                    >
                      {/* Inline image thumbnail */}
                      {msg.image && (
                        <img
                          src={msg.image.previewUrl}
                          alt="Shared"
                          className="w-full max-h-36 object-cover rounded-xl mb-2 border border-white/30"
                        />
                      )}

                      {/* Message text */}
                      {msg.isSimplified && (
                        <div className="text-[10px] font-bold text-[#A05C2B] flex items-center gap-1 mb-1 bg-orange-50 px-2 py-1 rounded w-max">
                          🔄 Simplified Version
                        </div>
                      )}
                      <div className={`prose prose-sm max-w-none ${msg.role === 'user' ? 'prose-invert text-white' : 'text-gray-800'} break-words overflow-x-auto`}>
                        <ReactMarkdown
                          remarkPlugins={[remarkMath]}
                          rehypePlugins={[rehypeKatex]}
                        >
                          {msg.text}
                        </ReactMarkdown>
                      </div>

                      {/* Timestamp */}
                      <span
                        className={`block text-[9px] mt-1 leading-none ${msg.role === 'user' ? 'text-white/60 text-right' : 'text-gray-400 text-left'
                          }`}
                      >
                        {formatTime(msg.timestamp)}
                      </span>
                    </div>

                    {/* Rate & Simplify */}
                    {msg.role === 'assistant' && (
                      <div className="flex items-center gap-2 mt-0.5 ml-2">
                        <button
                          onClick={() => handleVote(msg.id, 'up')}
                          disabled={!!msg.userVote}
                          className={`p-1 rounded-full ${msg.userVote === 'up' ? 'text-emerald-500 bg-emerald-50' : 'text-gray-400 hover:text-emerald-500 hover:bg-emerald-50'}`}
                        >
                          <ThumbsUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleVote(msg.id, 'down')}
                          disabled={!!msg.userVote}
                          className={`p-1 rounded-full ${msg.userVote === 'down' ? 'text-red-500 bg-red-50' : 'text-gray-400 hover:text-red-500 hover:bg-red-50'}`}
                        >
                          <ThumbsDown className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            <AnimatePresence>
              {isTyping && <TypingIndicator botName={botName} />}
            </AnimatePresence>

            <div ref={messagesEndRef} />
          </div>

          {/* ── Attached image preview strip ────────────────────────────────── */}
          <AnimatePresence>
            {attachedImage && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="shrink-0 px-3 pt-2 bg-white border-t border-[#EDE8DF] flex items-center overflow-hidden"
              >
                <ImagePreviewBadge
                  image={attachedImage}
                  onRemove={() => setAttachedImage(null)}
                />
                <span className="text-xs text-gray-500 italic">Image ready to send</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── FAQ Chips ───────────────────────────────────────────────────── */}
          <AnimatePresence>
            {showFaqs && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="shrink-0 px-3 py-2 bg-white border-t border-[#EDE8DF] flex gap-2 overflow-x-auto scrollbar-hide"
              >
                {activeFaqs.map((faq, idx) => (
                  <button
                    key={idx}
                    onClick={() => sendMessage(faq.text)}
                    className="whitespace-nowrap px-3 py-1.5 bg-[#FAF7F2] text-[#A05C2B] border border-[#EDE8DF] rounded-full text-xs font-medium hover:bg-[#FDF3E7] hover:border-[#C5873A] transition-colors"
                  >
                    {faq.text}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Input Row ───────────────────────────────────────────────────── */}
          <div className="shrink-0 px-3 py-3 border-t border-[#EDE8DF] bg-white flex items-center gap-1.5">
            {/* Hidden file inputs */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,.pdf"
              className="hidden"
              onChange={handleFileChange}
              aria-label="Attach file"
            />
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={handleFileChange}
              aria-label="Open camera"
            />

            {/* Mic button */}
            <button
              onClick={toggleListening}
              disabled={isTyping}
              className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors shrink-0 disabled:opacity-40 ${isListening ? 'text-red-500 bg-red-50' : 'text-gray-400 hover:text-[#C5873A] hover:bg-[#FAF7F2]'}`}
              title="Voice Input"
              aria-label="Voice Input"
            >
              {isListening ? (
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                </span>
              ) : (
                <Mic className="w-4 h-4" />
              )}
            </button>

            {/* Attachment button */}
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isTyping}
              className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-[#C5873A] hover:bg-[#FAF7F2] transition-colors disabled:opacity-40 shrink-0"
              title="Attach image"
              aria-label="Attach image"
            >
              <Paperclip className="w-4 h-4" />
            </button>

            {/* Camera button */}
            <button
              onClick={() => cameraInputRef.current?.click()}
              disabled={isTyping}
              className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-[#C5873A] hover:bg-[#FAF7F2] transition-colors disabled:opacity-40 shrink-0"
              title="Take photo"
              aria-label="Take photo"
            >
              <Camera className="w-4 h-4" />
            </button>

            {/* Text input */}
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={`Ask ${botName}…`}
              disabled={isTyping}
              className="flex-1 bg-[#FAF7F2] border border-[#EDE8DF] rounded-full px-4 py-2.5 text-sm text-gray-800 placeholder-gray-400 outline-none focus:border-[#C5873A] transition-colors disabled:opacity-60"
            />

            {/* Send button */}
            <button
              onClick={() => sendMessage()}
              disabled={(!input.trim() && !attachedImage) || isTyping}
              className="w-10 h-10 rounded-full bg-gradient-to-br from-[#C5873A] to-[#A05C2B] hover:brightness-110 disabled:bg-gray-300 disabled:from-gray-300 disabled:to-gray-300 flex items-center justify-center text-white transition-all shrink-0 active:scale-90 shadow-md"
              aria-label="Send message"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ── SahayakFAB ────────────────────────────────────────────────────────────────
interface SahayakFABProps {
  onClick: () => void;
  isOpen: boolean;
  botName: string;
}

export function SahayakFAB({ onClick, isOpen, botName }: SahayakFABProps) {
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.08 }}
      whileTap={{ scale: 0.92 }}
      className="fixed bottom-[88px] right-4 z-[9998] w-14 h-14 rounded-full bg-gradient-to-br from-[#8B5E2E] to-[#C5873A] shadow-lg flex items-center justify-center text-white"
      style={{ boxShadow: '0 8px 30px rgba(139, 94, 46, 0.42)' }}
      aria-label={`Toggle ${botName} Chat`}
    >
      <AnimatePresence mode="wait" initial={false}>
        {isOpen ? (
          <motion.span
            key="close"
            initial={{ rotate: -90, opacity: 0 }}
            animate={{ rotate: 0, opacity: 1 }}
            exit={{ rotate: 90, opacity: 0 }}
            transition={{ duration: 0.18 }}
          >
            <X className="w-6 h-6" />
          </motion.span>
        ) : (
          <motion.span
            key="open"
            initial={{ rotate: 90, opacity: 0 }}
            animate={{ rotate: 0, opacity: 1 }}
            exit={{ rotate: -90, opacity: 0 }}
            transition={{ duration: 0.18 }}
          >
            <BotMessageSquare className="w-6 h-6" />
          </motion.span>
        )}
      </AnimatePresence>
    </motion.button>
  );
}

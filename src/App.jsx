export default function App() {
import React, { useState, useEffect, useMemo, useRef } from "react";
import * as math from "mathjs";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Plus, Trash2, Calendar, BookOpen, Clock, ChevronDown, ChevronUp, ChevronLeft, ChevronRight, AlertCircle, TrendingUp, Send, Languages, Loader2, Palette, RotateCcw, Timer as TimerIcon, Play, Pause, RefreshCw, Ban, Globe } from "lucide-react";

const STORAGE_KEY = "exam-ledger-v1";

const SUGGESTED_SUBJECTS = [
  "Myanmar", "English", "Mathematics", "Physics", "Chemistry",
  "Biology", "Myanmar History", "Geography", "Economics"
];

const GRAPH_COLOR_PALETTE = ["#10b981", "#ef4444", "#38bdf8", "#a78bfa", "#f472b6"];

const UI_TEXT = {
  tabSubjects: { en: "Subjects", my: "ဘာသာရပ်များ" },
  tabPlan: { en: "Study Plan", my: "စာလေ့လာမှုအစီအစဉ်" },
  tabCalendar: { en: "Calendar", my: "ပြက္ခဒိန်" },
  tabGraph: { en: "Graphing Calc", my: "ဂရပ်ဖ်ဂဏန်းတွက်စက်" },
  tabV: { en: "Ask V", my: "V ကိုမေးရန်" },
  tabTimer: { en: "Timer", my: "အချိန်ဇယား" },
  tabSettings: { en: "Settings", my: "ဆက်တင်များ" },
  heroSubtitle: { en: "Study schedule & progress", my: "စာလေ့လာမှုအစီအစဉ်နှင့် တိုးတက်မှု" },
  heroTagline: {
    en: "Track chapters from your government textbooks against every exam date.",
    my: "အစိုးရသင်ရိုးစာအုပ်ရှိ အခန်းများကို စာမေးပွဲရက်စွဲများနှင့်တွဲ၍ ခြေရာခံပါ။",
  },
  daysTo: { en: "days to", my: "ရက်အလိုတွင်" },
  noExams: { en: "No exams added yet", my: "စာမေးပွဲများ မထည့်ရသေးပါ" },
  saveErrorMsg: {
    en: "Couldn't save progress — changes may be lost on reload.",
    my: "တိုးတက်မှုကို သိမ်းဆည်း၍မရပါ — ပြန်ဖွင့်လျှင် ပြောင်းလဲမှုများ ပျောက်ဆုံးနိုင်ပါသည်။",
  },
  addSubject: { en: "Add a subject", my: "ဘာသာရပ်တစ်ခု ထည့်ပါ" },
  subjectNamePh: { en: "Subject name", my: "ဘာသာရပ်အမည်" },
  add: { en: "Add", my: "ထည့်ရန်" },
  noSubjectsYet: {
    en: "No subjects yet. Add one above with its exam date to get started.",
    my: "ဘာသာရပ်များ မရှိသေးပါ။ စတင်ရန် အထက်တွင် စာမေးပွဲရက်စွဲနှင့်အတူ ထည့်ပါ။",
  },
  daysLeft: { en: "days left", my: "ရက်လိုသေး" },
  datePassed: { en: "date passed", my: "ရက်လွန်သွားပြီ" },
  chapterPh: { en: "Chapter or topic from the textbook", my: "စာအုပ်ရှိ အခန်း သို့မဟုတ် ခေါင်းစဉ်" },
  addChapter: { en: "+ Chapter", my: "+ အခန်း" },
  studySlotsPerDay: { en: "Study slots per day", my: "တစ်ရက်လျှင် လေ့လာမှုအကြိမ်ရေ" },
  planHint: {
    en: "Chapters closest to their exam date and with the most work left are scheduled first.",
    my: "စာမေးပွဲရက်နီးသည့်၊ လုပ်ငန်းအများဆုံးကျန်သော အခန်းများကို ဦးစွာစီစဉ်ပေးသည်။",
  },
  planEmpty: {
    en: "Add subjects with an exam date and a few chapters to generate a plan.",
    my: "အစီအစဉ်ထုတ်ရန် စာမေးပွဲရက်စွဲနှင့် အခန်းအချို့ပါသော ဘာသာရပ်များ ထည့်ပါ။",
  },
  legendExam: { en: "exam date", my: "စာမေးပွဲရက်" },
  legendStudy: { en: "study session", my: "လေ့လာမှုအချိန်" },
  legendBusy: { en: "busy day", my: "အလုပ်များသောရက်" },
  selectDateHint: { en: "Select a date to see what's on it.", my: "အသေးစိတ်ကြည့်ရန် ရက်စွဲတစ်ခုကို ရွေးပါ။" },
  nothingScheduled: { en: "Nothing scheduled.", my: "ဘာမျှ စီစဉ်မထားပါ။" },
  examLabel: { en: "Exam:", my: "စာမေးပွဲ -" },
  markBusy: { en: "Mark as busy day", my: "အလုပ်များသောရက်အဖြစ် သတ်မှတ်ရန်" },
  unmarkBusy: { en: "Unmark busy day", my: "အလုပ်များသောရက် ပယ်ဖျက်ရန်" },
  busyHint: {
    en: "Busy days are skipped when generating your study plan.",
    my: "အလုပ်များသောရက်များကို စာလေ့လာမှုအစီအစဉ် ထုတ်ရာတွင် ကျော်သွားပါမည်။",
  },
  scientificCalc: { en: "Graphing Calculator", my: "ဂရပ်ဖ်ဂဏန်းတွက်စက်" },
  plotPh: { en: "e.g. x^2 - 3, sin(x), sqrt(x)", my: "ဥပမာ- x^2 - 3, sin(x), sqrt(x)" },
  plot: { en: "Plot", my: "ဆွဲရန်" },
  plotEmptyHint: { en: "Add a function above to plot it, e.g.", my: "အထက်တွင် ဖန်ရှင်တစ်ခုထည့်ပြီး ဆွဲပါ၊ ဥပမာ-" },
  evaluateAt: { en: "Evaluate at x =", my: "x = တွင် တွက်ချက်ရန်" },
  studyHelper: { en: "your study helper", my: "သင့်စာလေ့လာမှုအကူအညီ" },
  vThinking: { en: "V is thinking…", my: "V စဉ်းစားနေသည်…" },
  askVPh: { en: "Ask V to explain something...", my: "V ကို ရှင်းပြခိုင်းရန် မေးပါ..." },
  timerHeader: { en: "Study Timer", my: "စာလေ့လာမှုအချိန်ကိုက်" },
  hours: { en: "Hours", my: "နာရီ" },
  minutes: { en: "Minutes", my: "မိနစ်" },
  seconds: { en: "Seconds", my: "စက္ကန့်" },
  start: { en: "Start", my: "စတင်ရန်" },
  pause: { en: "Pause", my: "ခေတ္တရပ်ရန်" },
  reset: { en: "Reset", my: "ပြန်စရန်" },
  timerMaxHint: { en: "Maximum 10 hours.", my: "အများဆုံး ၁၀ နာရီ။" },
  timesUp: { en: "Time's up!", my: "အချိန်ပြည့်ပါပြီ!" },
  appearance: { en: "Appearance", my: "ပုံပန်းသဏ္ဌာန်" },
  primaryColor: { en: "Primary color", my: "အဓိကအရောင်" },
  primaryColorDesc: { en: "Page background", my: "စာမျက်နှာနောက်ခံ" },
  secondaryColor: { en: "Secondary color", my: "ဒုတိယအရောင်" },
  secondaryColorDesc: { en: "Buttons & accents", my: "ခလုတ်များနှင့် အထူးအရောင်" },
  cardColor: { en: "Card color", my: "ကတ်ဘောင်အရောင်" },
  cardColorDesc: { en: "Panel & card backgrounds", my: "ပැနယ်နှင့်ကတ်နောက်ခံများ" },
  textColor: { en: "Text color", my: "စာသားအရောင်" },
  textColorDesc: { en: "Main heading & body text", my: "ခေါင်းစဉ်နှင့် စာသားအဓိကအရောင်" },
  appearanceHint: {
    en: "Very light primary colors may make light-colored text harder to read.",
    my: "အဓိကအရောင် အလွန်ဖျော့သွားပါက စာသားများ ဖတ်ရခက်နိုင်ပါသည်။",
  },
  preview: { en: "Preview", my: "အစမ်းကြည့်ရှုမှု" },
  sampleButton: { en: "Sample button", my: "နမူနာခလုတ်" },
  accentTextSample: { en: "Accent text", my: "အထူးစာသား" },
  language: { en: "Language", my: "ဘာသာစကား" },
  languageDesc: {
    en: "Translate the site's interface text.",
    my: "ဝဘ်ဆိုက်၏ မျက်နှာပြင်စာသားများကို ဘာသာပြန်ပါ။",
  },
  account: { en: "Account", my: "အကောင့်" },
  accountDesc: {
    en: "There's no sign-up or login here — your subjects, schedule, and settings save automatically on this device, so everything is right where you left it next time.",
    my: "ဤနေရာတွင် အကောင့်ဖွင့်ရန် သို့မဟုတ် ဝင်ရန် မလိုအပ်ပါ — သင့်ဘာသာရပ်များ၊ အစီအစဉ်နှင့် ဆက်တင်များကို ဤစက်ပေါ်တွင် အလိုအလျောက် သိမ်းဆည်းပေးပါသည်။",
  },
  vColorHint: { en: "Click V's icon to change its color.", my: "V ၏ အိုင်ကွန်ကို နှိပ်၍ အရောင်ပြောင်းနိုင်သည်။" },
};

function t(key, lang) {
  return UI_TEXT[key]?.[lang] || UI_TEXT[key]?.en || key;
}

function useKatexReady() {
  const [ready, setReady] = useState(
    typeof window !== "undefined" && !!window.katex
  );
  useEffect(() => {
    if (ready || typeof window === "undefined") return;
    if (window.katex) {
      setReady(true);
      return;
    }
    let script = document.getElementById("katex-script");
    if (!script) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = "https://cdnjs.cloudflare.com/ajax/libs/KaTeX/0.16.9/katex.min.css";
      document.head.appendChild(link);

      script = document.createElement("script");
      script.id = "katex-script";
      script.src = "https://cdnjs.cloudflare.com/ajax/libs/KaTeX/0.16.9/katex.min.js";
      document.head.appendChild(script);
    }
    script.addEventListener("load", () => setReady(true));
    if (window.katex) setReady(true);
  }, [ready]);
  return ready;
}

function Latex({ tex, display = false, className = "" }) {
  const ready = useKatexReady();
  if (!ready || typeof window === "undefined" || !window.katex) {
    return <span className={className}>{tex}</span>;
  }
  try {
    const html = window.katex.renderToString(tex, {
      throwOnError: false,
      displayMode: display,
    });
    return <span className={className} dangerouslySetInnerHTML={{ __html: html }} />;
  } catch (e) {
    return <span className={className}>{tex}</span>;
  }
}

// Best-effort conversion of a plain math expression (as typed into the
// graphing calculator) into LaTeX, e.g. "sin(x)^2 + sqrt(x)" -> "\sin(x)^{2} + \sqrt{x}"
function exprToLatex(expr) {
  let s = expr;
  s = s.replace(/sqrt\(([^()]*)\)/g, "\\sqrt{$1}");
  s = s.replace(/\b(asin|acos|atan|sin|cos|tan|log10|log)\(/g, (m, fn) => {
    const map = {
      asin: "\\sin^{-1}",
      acos: "\\cos^{-1}",
      atan: "\\tan^{-1}",
      sin: "\\sin",
      cos: "\\cos",
      tan: "\\tan",
      log10: "\\log_{10}",
      log: "\\ln",
    };
    return `${map[fn] || fn}(`;
  });
  s = s.replace(/\bpi\b/g, "\\pi");
  s = s.replace(/\*/g, " \\cdot ");
  s = s.replace(/\^\(([^()]*)\)/g, "^{$1}");
  s = s.replace(/\^(-?\w+)/g, "^{$1}");
  return s;
}

// Splits chat text on $$...$$ (block) and $...$ (inline) LaTeX delimiters
// so plain text and math can be rendered separately.
function parseLatexSegments(text) {
  const parts = text.split(/(\$\$[\s\S]+?\$\$|\$[^$\n]+?\$)/g).filter((p) => p !== "");
  return parts.map((part, i) => {
    if (part.startsWith("$$") && part.endsWith("$$") && part.length >= 4) {
      return { type: "block", tex: part.slice(2, -2).trim(), key: i };
    }
    if (part.startsWith("$") && part.endsWith("$") && part.length >= 2) {
      return { type: "inline", tex: part.slice(1, -1).trim(), key: i };
    }
    return { type: "text", tex: part, key: i };
  });
}

// Renders **bold**, *italic*/_italic_ and `code` spans within a plain-text run.
function renderInlineMarkdown(text, keyPrefix) {
  const parts = text
    .split(/(\*\*[^*]+\*\*|`[^`]+`|\*[^*]+\*|_[^_]+_)/g)
    .filter((p) => p !== undefined && p !== "");
  return parts.map((part, idx) => {
    const key = `${keyPrefix}-md-${idx}`;
    if (/^\*\*[^*]+\*\*$/.test(part)) {
      return (
        <strong key={key} className="vd-text">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (/^`[^`]+`$/.test(part)) {
      return (
        <code key={key} className="vd-card-bg px-1 py-0.5 rounded-sm text-amber-400 text-xs">
          {part.slice(1, -1)}
        </code>
      );
    }
    if (/^\*[^*]+\*$/.test(part) || /^_[^_]+_$/.test(part)) {
      return (
        <em key={key} className="italic">
          {part.slice(1, -1)}
        </em>
      );
    }
    return <span key={key}>{part}</span>;
  });
}

// Runs LaTeX segmentation, then inline markdown, over one block's raw text.
function renderInlineContent(content, keyPrefix) {
  return parseLatexSegments(content).map((seg) => {
    if (seg.type !== "text") {
      return (
        <Latex
          key={`${keyPrefix}-${seg.key}`}
          tex={seg.tex}
          display={seg.type === "block"}
          className={seg.type === "block" ? "block my-1" : ""}
        />
      );
    }
    return (
      <React.Fragment key={`${keyPrefix}-${seg.key}`}>
        {renderInlineMarkdown(seg.tex, `${keyPrefix}-${seg.key}`)}
      </React.Fragment>
    );
  });
}

// Splits full message text into block-level markdown units: headings,
// fenced code blocks, bullet/numbered lists, and paragraphs.
function parseMarkdownBlocks(text) {
  const lines = text.split("\n");
  const blocks = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (line.trim() === "") {
      i++;
      continue;
    }
    if (line.trim().startsWith("```")) {
      const codeLines = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith("```")) {
        codeLines.push(lines[i]);
        i++;
      }
      i++;
      blocks.push({ type: "code", content: codeLines.join("\n") });
      continue;
    }
    const heading = line.match(/^(#{1,3})\s+(.*)/);
    if (heading) {
      blocks.push({ type: "heading", level: heading[1].length, content: heading[2] });
      i++;
      continue;
    }
    if (/^\s*[-*]\s+/.test(line)) {
      const items = [];
      while (i < lines.length && /^\s*[-*]\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^\s*[-*]\s+/, ""));
        i++;
      }
      blocks.push({ type: "list", ordered: false, items });
      continue;
    }
    if (/^\s*\d+\.\s+/.test(line)) {
      const items = [];
      while (i < lines.length && /^\s*\d+\.\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^\s*\d+\.\s+/, ""));
        i++;
      }
      blocks.push({ type: "list", ordered: true, items });
      continue;
    }
    const paraLines = [line];
    i++;
    while (
      i < lines.length &&
      lines[i].trim() !== "" &&
      !lines[i].trim().startsWith("```") &&
      !/^(#{1,3})\s+/.test(lines[i]) &&
      !/^\s*[-*]\s+/.test(lines[i]) &&
      !/^\s*\d+\.\s+/.test(lines[i])
    ) {
      paraLines.push(lines[i]);
      i++;
    }
    blocks.push({ type: "paragraph", content: paraLines.join("\n") });
  }
  return blocks;
}

function renderMarkdown(text) {
  return parseMarkdownBlocks(text).map((block, bi) => {
    const key = `b${bi}`;
    if (block.type === "heading") {
      const cls = "font-serif vd-text font-semibold mt-2 mb-1 first:mt-0";
      if (block.level === 1) return <h3 key={key} className={`text-base ${cls}`}>{renderInlineContent(block.content, key)}</h3>;
      if (block.level === 2) return <h4 key={key} className={`text-sm ${cls}`}>{renderInlineContent(block.content, key)}</h4>;
      return <h5 key={key} className={`text-sm ${cls}`}>{renderInlineContent(block.content, key)}</h5>;
    }
    if (block.type === "code") {
      return (
        <pre
          key={key}
          className="bg-slate-950 border border-stone-800 rounded-sm p-2 overflow-x-auto text-xs font-mono text-emerald-300 my-1.5"
        >
          <code>{block.content}</code>
        </pre>
      );
    }
    if (block.type === "list") {
      const ListTag = block.ordered ? "ol" : "ul";
      return (
        <ListTag
          key={key}
          className={`${block.ordered ? "list-decimal" : "list-disc"} list-inside space-y-0.5 my-1`}
        >
          {block.items.map((item, ii) => (
            <li key={`${key}-${ii}`}>{renderInlineContent(item, `${key}-${ii}`)}</li>
          ))}
        </ListTag>
      );
    }
    return (
      <p key={key} className="my-1 first:mt-0 last:mb-0 whitespace-pre-wrap">
        {renderInlineContent(block.content, key)}
      </p>
    );
  });
}

function daysUntil(dateStr) {
  if (!dateStr) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(dateStr);
  target.setHours(0, 0, 0, 0);
  return Math.round((target - today) / 86400000);
}

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

function toKey(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function shadeHex(hex, amount) {
  try {
    let c = hex.replace("#", "");
    if (c.length === 3) c = c.split("").map((ch) => ch + ch).join("");
    const num = parseInt(c, 16);
    let r = (num >> 16) + amount;
    let g = ((num >> 8) & 0x00ff) + amount;
    let b = (num & 0x0000ff) + amount;
    r = Math.min(255, Math.max(0, r));
    g = Math.min(255, Math.max(0, g));
    b = Math.min(255, Math.max(0, b));
    return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`;
  } catch (e) {
    return hex;
  }
}

export default function StudyLedger() {
  const [subjects, setSubjects] = useState([]);
  const [activeTab, setActiveTab] = useState("subjects");
  const [slotsPerDay, setSlotsPerDay] = useState(3);
  const [primaryColor, setPrimaryColor] = useState("#020617");
  const [secondaryColor, setSecondaryColor] = useState("#f59e0b");
  const [cardColor, setCardColor] = useState("#0f172a");
  const [textColor, setTextColor] = useState("#f5f5f4");
  const [language, setLanguage] = useState("en");
  const [busyDays, setBusyDays] = useState([]);
  const [vIconColor, setVIconColor] = useState("#ef4444");
  const [loaded, setLoaded] = useState(false);
  const [saveError, setSaveError] = useState(false);
  const [newSubjectName, setNewSubjectName] = useState("");
  const [newSubjectDate, setNewSubjectDate] = useState("");
  const [expanded, setExpanded] = useState({});
  const [chapterDrafts, setChapterDrafts] = useState({});
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const [selectedDate, setSelectedDate] = useState(null);
  const [graphFns, setGraphFns] = useState([{ id: uid(), expr: "sin(x)", visible: true }]);
  const graphColors = [secondaryColor, ...GRAPH_COLOR_PALETTE];
  const [graphDraft, setGraphDraft] = useState("");
  const [xMin, setXMin] = useState(-10);
  const [xMax, setXMax] = useState(10);
  const [evalX, setEvalX] = useState("");
  const [chatLang, setChatLang] = useState("en");
  const [chatMessages, setChatMessages] = useState([
    {
      role: "assistant",
      content:
        "Hi, I'm V! Ask me to explain anything from your subjects — a chapter, a formula, a tricky problem — and I'll walk you through it in detail.",
    },
  ]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef(null);
  const [timerH, setTimerH] = useState(0);
  const [timerM, setTimerM] = useState(25);
  const [timerS, setTimerS] = useState(0);
  const [timerRemaining, setTimerRemaining] = useState(null);
  const [timerRunning, setTimerRunning] = useState(false);
  const [timerDone, setTimerDone] = useState(false);
  const timerIntervalRef = useRef(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await window.storage.get(STORAGE_KEY);
        if (res && res.value) {
          const data = JSON.parse(res.value);
          setSubjects(data.subjects || []);
          setSlotsPerDay(data.slotsPerDay || 3);
          if (data.primaryColor) setPrimaryColor(data.primaryColor);
          if (data.secondaryColor) setSecondaryColor(data.secondaryColor);
          if (data.cardColor) setCardColor(data.cardColor);
          if (data.textColor) setTextColor(data.textColor);
          if (data.language) setLanguage(data.language);
          if (data.busyDays) setBusyDays(data.busyDays);
          if (data.vIconColor) setVIconColor(data.vIconColor);
        }
      } catch (e) {
        // no saved data yet, that's fine
      }
      setLoaded(true);
    })();
  }, []);

  useEffect(() => {
    if (!loaded) return;
    (async () => {
      try {
        const result = await window.storage.set(
          STORAGE_KEY,
          JSON.stringify({
            subjects,
            slotsPerDay,
            primaryColor,
            secondaryColor,
            cardColor,
            textColor,
            language,
            busyDays,
            vIconColor,
          })
        );
        setSaveError(!result);
      } catch (e) {
        setSaveError(true);
      }
    })();
  }, [
    subjects,
    slotsPerDay,
    primaryColor,
    secondaryColor,
    cardColor,
    textColor,
    language,
    busyDays,
    vIconColor,
    loaded,
  ]);

  const addSubject = () => {
    if (!newSubjectName.trim() || !newSubjectDate) return;
    setSubjects((prev) => [
      ...prev,
      { id: uid(), name: newSubjectName.trim(), examDate: newSubjectDate, chapters: [] },
    ]);
    setNewSubjectName("");
    setNewSubjectDate("");
  };

  const removeSubject = (id) => {
    setSubjects((prev) => prev.filter((s) => s.id !== id));
  };

  const addChapter = (subjectId) => {
    const title = (chapterDrafts[subjectId] || "").trim();
    if (!title) return;
    setSubjects((prev) =>
      prev.map((s) =>
        s.id === subjectId
          ? { ...s, chapters: [...s.chapters, { id: uid(), title, done: false }] }
          : s
      )
    );
    setChapterDrafts((prev) => ({ ...prev, [subjectId]: "" }));
  };

  const toggleChapter = (subjectId, chapterId) => {
    setSubjects((prev) =>
      prev.map((s) =>
        s.id === subjectId
          ? {
              ...s,
              chapters: s.chapters.map((c) =>
                c.id === chapterId ? { ...c, done: !c.done } : c
              ),
            }
          : s
      )
    );
  };

  const removeChapter = (subjectId, chapterId) => {
    setSubjects((prev) =>
      prev.map((s) =>
        s.id === subjectId
          ? { ...s, chapters: s.chapters.filter((c) => c.id !== chapterId) }
          : s
      )
    );
  };

  const addGraphFn = () => {
    const expr = graphDraft.trim();
    if (!expr) return;
    setGraphFns((prev) => [...prev, { id: uid(), expr, visible: true }]);
    setGraphDraft("");
  };

  const removeGraphFn = (id) => {
    setGraphFns((prev) => prev.filter((f) => f.id !== id));
  };

  const toggleGraphFn = (id) => {
    setGraphFns((prev) =>
      prev.map((f) => (f.id === id ? { ...f, visible: !f.visible } : f))
    );
  };

  const chartData = useMemo(() => {
    const lo = Number(xMin);
    const hi = Number(xMax);
    if (isNaN(lo) || isNaN(hi) || lo >= hi) return [];
    const steps = 120;
    const data = [];
    for (let i = 0; i <= steps; i++) {
      const x = lo + ((hi - lo) * i) / steps;
      const point = { x: math.round(x, 4) };
      graphFns.forEach((f, idx) => {
        if (!f.visible || !f.expr.trim()) return;
        try {
          const y = math.evaluate(f.expr, { x });
          point[`f${idx}`] = typeof y === "number" && isFinite(y) ? y : null;
        } catch (e) {
          point[`f${idx}`] = null;
        }
      });
      data.push(point);
    }
    return data;
  }, [graphFns, xMin, xMax]);

  const evalResults = useMemo(() => {
    if (evalX.trim() === "" || isNaN(Number(evalX))) return [];
    const x = Number(evalX);
    return graphFns
      .filter((f) => f.expr.trim())
      .map((f, idx) => {
        try {
          const y = math.evaluate(f.expr, { x });
          return { expr: f.expr, value: typeof y === "number" ? math.round(y, 6) : String(y) };
        } catch (e) {
          return { expr: f.expr, value: "undefined" };
        }
      });
  }, [evalX, graphFns]);

  useEffect(() => {
    document.title = "Veridel";
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages, chatLoading]);

  const toggleBusyDay = (key) => {
    if (!key) return;
    setBusyDays((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  const playRingtone = () => {
    try {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      const ctx = new Ctx();
      const now = ctx.currentTime;
      for (let i = 0; i < 4; i++) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.value = i % 2 === 0 ? 880 : 660;
        const start = now + i * 0.42;
        gain.gain.setValueAtTime(0.0001, start);
        gain.gain.exponentialRampToValueAtTime(0.3, start + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.35);
        osc.connect(gain).connect(ctx.destination);
        osc.start(start);
        osc.stop(start + 0.38);
      }
      setTimeout(() => ctx.close(), 2200);
    } catch (e) {
      // Web Audio not available — fail silently.
    }
  };

  const timerTotalSeconds = Math.min(
    36000,
    Math.max(0, Number(timerH) || 0) * 3600 +
      Math.max(0, Math.min(59, Number(timerM) || 0)) * 60 +
      Math.max(0, Math.min(59, Number(timerS) || 0))
  );

  const startTimer = () => {
    if (timerRunning) return;
    const startFrom = timerRemaining ?? timerTotalSeconds;
    if (startFrom <= 0) return;
    setTimerRemaining(startFrom);
    setTimerDone(false);
    setTimerRunning(true);
  };

  const pauseTimer = () => {
    setTimerRunning(false);
  };

  const resetTimer = () => {
    setTimerRunning(false);
    setTimerDone(false);
    setTimerRemaining(null);
  };

  useEffect(() => {
    if (!timerRunning) {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      return;
    }
    timerIntervalRef.current = setInterval(() => {
      setTimerRemaining((prev) => {
        if (prev === null) return prev;
        if (prev <= 1) {
          clearInterval(timerIntervalRef.current);
          setTimerRunning(false);
          setTimerDone(true);
          playRingtone();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timerIntervalRef.current);
  }, [timerRunning]);

  const timerDisplay = (() => {
    const total = timerRemaining ?? timerTotalSeconds;
    const h = Math.floor(total / 3600);
    const m = Math.floor((total % 3600) / 60);
    const s = total % 60;
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  })();

  const sendChatMessage = async () => {
    const text = chatInput.trim();
    if (!text || chatLoading) return;
    const newMessages = [...chatMessages, { role: "user", content: text }];
    setChatMessages(newMessages);
    setChatInput("");
    setChatLoading(true);
    try {
      const systemPrompt =
        chatLang === "my"
          ? "You are V, a friendly, patient AI study helper for students preparing for exams. Explain topics from Mathematics, Physics, Chemistry, and other school subjects in clear, detailed, step-by-step terms with examples, and encourage the student. Always respond in Burmese (Myanmar script), even if the student writes in English. Use markdown formatting to structure your answers (headings with #, **bold** for key terms, - or 1. for lists). Whenever you write a mathematical formula or equation, format it in LaTeX: wrap inline math in single dollar signs like $x^2 + 1$ and standalone/display equations in double dollar signs like $$\\frac{-b \\pm \\sqrt{b^2-4ac}}{2a}$$."
          : "You are V, a friendly, patient AI study helper for students preparing for exams. Explain topics from Mathematics, Physics, Chemistry, and other school subjects in clear, detailed, step-by-step terms with examples, and encourage the student. Always respond in English, even if the student writes in Burmese. Use markdown formatting to structure your answers (headings with #, **bold** for key terms, - or 1. for lists). Whenever you write a mathematical formula or equation, format it in LaTeX: wrap inline math in single dollar signs like $x^2 + 1$ and standalone/display equations in double dollar signs like $$\\frac{-b \\pm \\sqrt{b^2-4ac}}{2a}$$.";

      // The API requires the conversation to start with a "user" message —
      // our seeded welcome message from V is "assistant", so drop everything
      // before the first real user message when building the request.
      const firstUserIdx = newMessages.findIndex((m) => m.role === "user");
      const apiMessages = newMessages
        .slice(firstUserIdx === -1 ? 0 : firstUserIdx)
        .map((m) => ({ role: m.role, content: m.content }));

      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-6",
          max_tokens: 1000,
          system: systemPrompt,
          messages: apiMessages,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error("V API error:", data);
        throw new Error(data?.error?.message || `Request failed (${response.status})`);
      }

      const reply =
        (data.content || [])
          .map((block) => block.text || "")
          .join("\n")
          .trim() || "Sorry, I couldn't come up with a response — try asking again.";
      setChatMessages((prev) => [...prev, { role: "assistant", content: reply }]);
    } catch (e) {
      console.error("V chat error:", e);
      setChatMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            chatLang === "my"
              ? "တစ်ခုခုမှားယွင်းသွားပါသည်။ နောက်တစ်ကြိမ်ပြန်ကြိုးစားကြည့်ပါ။"
              : "Something went wrong reaching V. Please try again.",
        },
      ]);
    } finally {
      setChatLoading(false);
    }
  };

  const nearestExam = useMemo(() => {
    const withDays = subjects
      .map((s) => ({ ...s, d: daysUntil(s.examDate) }))
      .filter((s) => s.d !== null && s.d >= 0)
      .sort((a, b) => a.d - b.d);
    return withDays[0] || null;
  }, [subjects]);

  const overallProgress = useMemo(() => {
    const total = subjects.reduce((sum, s) => sum + s.chapters.length, 0);
    const done = subjects.reduce(
      (sum, s) => sum + s.chapters.filter((c) => c.done).length,
      0
    );
    return { total, done, pct: total ? Math.round((done / total) * 100) : 0 };
  }, [subjects]);

  const plan = useMemo(() => {
    const active = subjects
      .map((s) => ({
        id: s.id,
        name: s.name,
        daysLeft: Math.max(daysUntil(s.examDate) ?? 0, 0),
        queue: s.chapters.filter((c) => !c.done).map((c) => c.title),
      }))
      .filter((s) => s.queue.length > 0 && s.daysLeft > 0);

    if (active.length === 0) return [];

    const horizon = Math.min(
      21,
      Math.max(...active.map((s) => s.daysLeft), 7)
    );
    const weight = {};
    active.forEach((s) => {
      weight[s.id] = s.queue.length / s.daysLeft;
    });
    const accumulator = {};
    active.forEach((s) => (accumulator[s.id] = 0));

    const days = [];
    for (let d = 1; d <= horizon; d++) {
      const date = new Date();
      date.setDate(date.getDate() + d - 1);
      const key = toKey(date);
      const isBusy = busyDays.includes(key);

      active.forEach((s) => {
        if (s.queue.length > 0) accumulator[s.id] += weight[s.id];
      });

      if (isBusy) {
        if (active.every((s) => s.queue.length === 0)) break;
        continue;
      }

      const slots = [];
      for (let i = 0; i < slotsPerDay; i++) {
        const candidates = active.filter((s) => s.queue.length > 0);
        if (candidates.length === 0) break;
        candidates.sort((a, b) => accumulator[b.id] - accumulator[a.id]);
        const chosen = candidates[0];
        const chapter = chosen.queue.shift();
        accumulator[chosen.id] -= 1;
        slots.push({ subject: chosen.name, chapter });
      }
      if (slots.length > 0) {
        days.push({
          key,
          label: date.toLocaleDateString(undefined, {
            weekday: "short",
            month: "short",
            day: "numeric",
          }),
          slots,
        });
      }
      if (active.every((s) => s.queue.length === 0)) break;
    }
    return days;
  }, [subjects, slotsPerDay, busyDays]);

  const calendarData = useMemo(() => {
    const map = {};
    subjects.forEach((s) => {
      if (!s.examDate) return;
      if (!map[s.examDate]) map[s.examDate] = { exams: [], slots: [] };
      map[s.examDate].exams.push(s.name);
    });
    plan.forEach((day) => {
      if (!map[day.key]) map[day.key] = { exams: [], slots: [] };
      map[day.key].slots.push(...day.slots);
    });
    return map;
  }, [subjects, plan]);

  const monthGrid = useMemo(() => {
    const year = calendarMonth.getFullYear();
    const month = calendarMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const startOffset = firstDay.getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const todayKey = toKey(new Date());

    const cells = [];
    for (let i = 0; i < startOffset; i++) cells.push(null);
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const key = toKey(date);
      cells.push({
        day,
        key,
        isToday: key === todayKey,
        exams: calendarData[key]?.exams || [],
        slots: calendarData[key]?.slots || [],
        busy: busyDays.includes(key),
      });
    }
    return cells;
  }, [calendarMonth, calendarData, busyDays]);

  return (
    <div
      className="min-h-screen vd-text font-sans"
      style={{ backgroundColor: primaryColor }}
    >
      <style>{`
        .vd-accent-bg { background-color: ${secondaryColor}; }
        .vd-accent-text { color: ${secondaryColor}; }
        .vd-accent-border { border-color: ${secondaryColor}; }
        .vd-btn { background-color: ${secondaryColor}; transition: filter 0.15s ease; }
        .vd-btn:hover { filter: brightness(1.12); }
        .vd-hover-accent { transition: color 0.15s ease; }
        .vd-hover-accent:hover { color: ${secondaryColor}; }
        .vd-ring { outline: none; }
        .vd-ring:focus { outline: none; box-shadow: 0 0 0 2px ${secondaryColor}66; }
        .vd-card-bg { background-color: ${cardColor}; }
        .vd-panel-bg { background-color: ${shadeHex(cardColor, 18)}; }
        .vd-text { color: ${textColor}; }
        .vd-busy-cell { background-image: repeating-linear-gradient(135deg, rgba(120,113,108,0.35) 0px, rgba(120,113,108,0.35) 2px, transparent 2px, transparent 6px); }
      `}</style>
      <div className="max-w-3xl mx-auto px-3 py-6 sm:px-5 sm:py-10">
        {/* Hero / ledger header */}
        <div className="border border-stone-700 vd-card-bg rounded-sm p-4 sm:p-6 mb-6 sm:mb-8 relative overflow-hidden">
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span
                  className="w-8 h-8 rounded-full border-2 vd-accent-border vd-accent-text flex items-center justify-center font-serif font-bold -rotate-3 select-none shrink-0"
                >
                  V
                </span>
                <span className="font-serif text-2xl vd-text tracking-wide">
                  Veridel
                </span>
              </div>
              <h1 className="font-serif text-lg sm:text-xl text-stone-200">
                {t("heroSubtitle", language)}
              </h1>
              <p className="text-stone-400 text-sm mt-1 font-sans">
                {t("heroTagline", language)}
              </p>
            </div>
            <div className="text-right font-mono">
              {nearestExam ? (
                <>
                  <p className="text-4xl vd-text leading-none">{nearestExam.d}</p>
                  <p className="text-stone-400 text-xs uppercase tracking-wide">
                    {t("daysTo", language)} {nearestExam.name}
                  </p>
                </>
              ) : (
                <p className="text-stone-500 text-sm">{t("noExams", language)}</p>
              )}
            </div>
          </div>
          <div className="mt-5 flex items-center gap-3">
            <div className="flex-1 h-2 vd-panel-bg rounded-full overflow-hidden">
              <div
                className="h-full vd-accent-bg transition-all"
                style={{ width: `${overallProgress.pct}%` }}
              />
            </div>
            <span className="font-mono text-xs text-stone-400">
              {overallProgress.done}/{overallProgress.total} chapters ({overallProgress.pct}%)
            </span>
          </div>
          {saveError && (
            <p className="mt-3 flex items-center gap-1 text-red-400 text-xs">
              <AlertCircle size={14} /> {t("saveErrorMsg", language)}
            </p>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 border-b border-stone-800 flex-wrap">
          {["subjects", "plan", "calendar", "graph", "v", "timer", "settings"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-2.5 sm:px-4 py-2 text-xs sm:text-sm font-mono uppercase tracking-wide border-b-2 transition-colors ${
                activeTab === tab
                  ? "vd-accent-border vd-accent-text"
                  : "border-transparent text-stone-500 hover:text-stone-300"
              }`}
            >
              {tab === "subjects"
                ? t("tabSubjects", language)
                : tab === "plan"
                ? t("tabPlan", language)
                : tab === "calendar"
                ? t("tabCalendar", language)
                : tab === "graph"
                ? t("tabGraph", language)
                : tab === "v"
                ? t("tabV", language)
                : tab === "timer"
                ? t("tabTimer", language)
                : t("tabSettings", language)}
            </button>
          ))}
        </div>

        {activeTab === "subjects" && (
          <div className="space-y-4">
            {/* Add subject form */}
            <div className="border border-stone-800 vd-card-bg rounded-sm p-4">
              <p className="text-stone-300 text-sm font-medium mb-3 flex items-center gap-2">
                <Plus size={16} className="vd-accent-text" /> {t("addSubject", language)}
              </p>
              <div className="flex flex-wrap gap-2">
                <input
                  list="subject-suggestions"
                  value={newSubjectName}
                  onChange={(e) => setNewSubjectName(e.target.value)}
                  placeholder={t("subjectNamePh", language)}
                  className="flex-1 min-w-[160px] vd-panel-bg border border-stone-700 rounded-sm px-3 py-2 text-sm vd-text placeholder-stone-500 vd-ring"
                />
                <datalist id="subject-suggestions">
                  {SUGGESTED_SUBJECTS.map((s) => (
                    <option key={s} value={s} />
                  ))}
                </datalist>
                <input
                  type="date"
                  value={newSubjectDate}
                  onChange={(e) => setNewSubjectDate(e.target.value)}
                  className="vd-panel-bg border border-stone-700 rounded-sm px-3 py-2 text-sm vd-text vd-ring"
                />
                <button
                  onClick={addSubject}
                  className="vd-btn text-slate-950 font-medium text-sm px-4 py-2 rounded-sm transition-colors"
                >
                  {t("add", language)}
                </button>
              </div>
            </div>

            {subjects.length === 0 && (
              <p className="text-stone-500 text-sm text-center py-10">
                {t("noSubjectsYet", language)}
              </p>
            )}

            {subjects.map((s) => {
              const d = daysUntil(s.examDate);
              const done = s.chapters.filter((c) => c.done).length;
              const total = s.chapters.length;
              const pct = total ? Math.round((done / total) * 100) : 0;
              const isOpen = expanded[s.id];
              return (
                <div key={s.id} className="border border-stone-800 vd-card-bg rounded-sm">
                  <div
                    className="p-4 flex items-center justify-between cursor-pointer"
                    onClick={() => setExpanded((p) => ({ ...p, [s.id]: !p[s.id] }))}
                  >
                    <div className="flex items-center gap-3">
                      <BookOpen size={18} className="vd-accent-text shrink-0" />
                      <div>
                        <p className="vd-text font-medium">{s.name}</p>
                        <p className="text-stone-500 text-xs font-mono flex items-center gap-1 mt-0.5">
                          <Calendar size={12} />
                          {s.examDate} ·{" "}
                          {d >= 0
                            ? `${d} ${t("daysLeft", language)}`
                            : t("datePassed", language)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="hidden sm:flex items-center gap-2 w-32">
                        <div className="flex-1 h-1.5 vd-panel-bg rounded-full overflow-hidden">
                          <div
                            className="h-full bg-emerald-600"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="font-mono text-xs text-stone-400">{pct}%</span>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeSubject(s.id);
                        }}
                        className="text-stone-600 hover:text-red-400 transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                      {isOpen ? <ChevronUp size={16} className="text-stone-500" /> : <ChevronDown size={16} className="text-stone-500" />}
                    </div>
                  </div>

                  {isOpen && (
                    <div className="border-t border-stone-800 p-4 space-y-2">
                      {s.chapters.map((c) => (
                        <div
                          key={c.id}
                          className="flex items-center justify-between gap-3 vd-panel-bg rounded-sm px-3 py-2"
                        >
                          <label className="flex items-center gap-3 flex-1 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={c.done}
                              onChange={() => toggleChapter(s.id, c.id)}
                              className="w-4 h-4"
                              style={{ accentColor: secondaryColor }}
                            />
                            <span
                              className={`text-sm ${
                                c.done ? "text-stone-500 line-through" : "text-stone-200"
                              }`}
                            >
                              {c.title}
                            </span>
                          </label>
                          {c.done && (
                            <span className="font-mono text-[10px] tracking-wider text-red-500 border border-red-500/60 rounded-full px-2 py-0.5 -rotate-6 select-none">
                              DONE
                            </span>
                          )}
                          <button
                            onClick={() => removeChapter(s.id, c.id)}
                            className="text-stone-600 hover:text-red-400 transition-colors"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      ))}
                      <div className="flex gap-2 pt-1">
                        <input
                          value={chapterDrafts[s.id] || ""}
                          onChange={(e) =>
                            setChapterDrafts((p) => ({ ...p, [s.id]: e.target.value }))
                          }
                          onKeyDown={(e) => e.key === "Enter" && addChapter(s.id)}
                          placeholder={t("chapterPh", language)}
                          className="flex-1 vd-panel-bg border border-stone-700 rounded-sm px-3 py-1.5 text-sm vd-text placeholder-stone-500 vd-ring"
                        />
                        <button
                          onClick={() => addChapter(s.id)}
                          className="vd-accent-text hover:opacity-80 border vd-accent-border rounded-sm px-3 text-sm"
                        >
                          {t("addChapter", language)}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {activeTab === "plan" && (
          <div className="space-y-4">
            <div className="border border-stone-800 vd-card-bg rounded-sm p-4 flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-2 text-stone-300 text-sm">
                <Clock size={16} className="vd-accent-text" />
                {t("studySlotsPerDay", language)}
              </div>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    onClick={() => setSlotsPerDay(n)}
                    className={`w-8 h-8 rounded-sm text-sm font-mono border transition-colors ${
                      slotsPerDay === n
                        ? "vd-accent-bg vd-accent-border text-slate-950"
                        : "border-stone-700 text-stone-400 hover:border-stone-500"
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>

            <p className="text-stone-500 text-xs font-mono px-1">
              {t("planHint", language)}
            </p>

            {plan.length === 0 && (
              <p className="text-stone-500 text-sm text-center py-10">
                {t("planEmpty", language)}
              </p>
            )}

            {plan.map((day, i) => (
              <div key={i} className="border border-stone-800 vd-card-bg rounded-sm p-4">
                <p className="font-mono text-xs vd-accent-text uppercase tracking-wide mb-2">
                  {day.label}
                </p>
                <div className="space-y-1.5">
                  {day.slots.map((slot, j) => (
                    <div
                      key={j}
                      className="flex items-center justify-between vd-panel-bg rounded-sm px-3 py-2"
                    >
                      <span className="text-sm text-stone-200">
                        <span className="text-stone-500">{slot.subject} — </span>
                        {slot.chapter}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
        {activeTab === "calendar" && (
          <div className="space-y-4">
            <div className="border border-stone-800 vd-card-bg rounded-sm p-4">
              <div className="flex items-center justify-between mb-4">
                <button
                  onClick={() =>
                    setCalendarMonth(
                      (m) => new Date(m.getFullYear(), m.getMonth() - 1, 1)
                    )
                  }
                  className="text-stone-500 vd-hover-accent transition-colors p-1"
                >
                  <ChevronLeft size={18} />
                </button>
                <p className="font-serif text-lg vd-text">
                  {calendarMonth.toLocaleDateString(undefined, {
                    month: "long",
                    year: "numeric",
                  })}
                </p>
                <button
                  onClick={() =>
                    setCalendarMonth(
                      (m) => new Date(m.getFullYear(), m.getMonth() + 1, 1)
                    )
                  }
                  className="text-stone-500 vd-hover-accent transition-colors p-1"
                >
                  <ChevronRight size={18} />
                </button>
              </div>

              <div className="grid grid-cols-7 gap-1 mb-1">
                {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
                  <p
                    key={d}
                    className="text-center text-[10px] font-mono uppercase tracking-wide text-stone-500 py-1"
                  >
                    {d}
                  </p>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-1">
                {monthGrid.map((cell, i) =>
                  cell === null ? (
                    <div key={i} />
                  ) : (
                    <button
                      key={i}
                      onClick={() => setSelectedDate(cell.key)}
                      className={`relative aspect-square rounded-sm border text-left p-1 transition-colors ${
                        cell.busy ? "vd-busy-cell" : ""
                      } ${
                        selectedDate === cell.key
                          ? "vd-accent-border vd-panel-bg"
                          : cell.isToday
                          ? "vd-accent-border vd-card-bg"
                          : "border-stone-800 vd-card-bg hover:border-stone-600"
                      }`}
                    >
                      <span
                        className={`text-xs font-mono ${
                          cell.isToday ? "vd-accent-text" : "text-stone-400"
                        }`}
                      >
                        {cell.day}
                      </span>
                      {cell.exams.length > 0 && (
                        <span className="absolute top-1 right-1 w-4 h-4 rounded-full border border-red-500 flex items-center justify-center">
                          <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                        </span>
                      )}
                      {cell.slots.length > 0 && (
                        <div className="absolute bottom-1 left-1 right-1 flex gap-0.5 flex-wrap">
                          {Array.from({ length: Math.min(cell.slots.length, 4) }).map((_, k) => (
                            <span key={k} className="w-1.5 h-1.5 rounded-full vd-accent-bg" />
                          ))}
                        </div>
                      )}
                    </button>
                  )
                )}
              </div>

              <div className="flex items-center gap-4 mt-4 text-[11px] text-stone-500 font-mono flex-wrap">
                <span className="flex items-center gap-1">
                  <span className="w-3 h-3 rounded-full border border-red-500 inline-block" /> {t("legendExam", language)}
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full vd-accent-bg inline-block" /> {t("legendStudy", language)}
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-3 h-3 rounded-sm border border-stone-500 vd-busy-cell inline-block" /> {t("legendBusy", language)}
                </span>
              </div>
            </div>

            <div className="border border-stone-800 vd-card-bg rounded-sm p-4 min-h-[100px]">
              {!selectedDate ? (
                <p className="text-stone-500 text-sm">{t("selectDateHint", language)}</p>
              ) : (
                (() => {
                  const info = calendarData[selectedDate] || { exams: [], slots: [] };
                  const isBusy = busyDays.includes(selectedDate);
                  const niceDate = new Date(selectedDate + "T00:00:00").toLocaleDateString(
                    undefined,
                    { weekday: "long", month: "long", day: "numeric", year: "numeric" }
                  );
                  return (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <p className="font-serif vd-text">{niceDate}</p>
                        <button
                          onClick={() => toggleBusyDay(selectedDate)}
                          className={`flex items-center gap-1.5 text-xs font-mono px-2.5 py-1.5 rounded-sm border transition-colors ${
                            isBusy
                              ? "border-red-500 text-red-400 hover:opacity-80"
                              : "border-stone-700 text-stone-400 hover:border-stone-500"
                          }`}
                        >
                          <Ban size={13} />
                          {isBusy ? t("unmarkBusy", language) : t("markBusy", language)}
                        </button>
                      </div>
                      {isBusy && (
                        <p className="text-stone-500 text-xs font-mono">{t("busyHint", language)}</p>
                      )}
                      {info.exams.length === 0 && info.slots.length === 0 && (
                        <p className="text-stone-500 text-sm">{t("nothingScheduled", language)}</p>
                      )}
                      {info.exams.map((name, i) => (
                        <p
                          key={i}
                          className="text-sm text-red-400 flex items-center gap-2 font-mono"
                        >
                          <span className="w-2.5 h-2.5 rounded-full border border-red-500 inline-block" />
                          {t("examLabel", language)} {name}
                        </p>
                      ))}
                      {info.slots.length > 0 && (
                        <div className="space-y-1.5 pt-1">
                          {info.slots.map((slot, i) => (
                            <div
                              key={i}
                              className="flex items-center justify-between vd-panel-bg rounded-sm px-3 py-2"
                            >
                              <span className="text-sm text-stone-200">
                                <span className="text-stone-500">{slot.subject} — </span>
                                {slot.chapter}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })()
              )}
            </div>
          </div>
        )}
        {activeTab === "graph" && (
          <div className="space-y-4">
            <div className="border border-stone-800 vd-card-bg rounded-sm p-4">
              <div className="flex items-center gap-2 mb-3 text-stone-400 text-xs font-mono uppercase tracking-wide">
                <TrendingUp size={14} className="vd-accent-text" />
                {t("scientificCalc", language)}
              </div>

              <div className="flex flex-wrap gap-2 mb-3">
                <input
                  value={graphDraft}
                  onChange={(e) => setGraphDraft(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addGraphFn()}
                  placeholder={t("plotPh", language)}
                  className="flex-1 min-w-[160px] vd-panel-bg border border-stone-700 rounded-sm px-3 py-2 text-sm font-mono vd-text placeholder-stone-500 vd-ring"
                />
                <button
                  onClick={addGraphFn}
                  className="vd-btn text-slate-950 font-medium text-sm px-4 py-2 rounded-sm flex items-center gap-1"
                >
                  <Plus size={14} /> {t("plot", language)}
                </button>
              </div>

              <div className="space-y-1.5 mb-4">
                {graphFns.map((f, idx) => (
                  <div
                    key={f.id}
                    className="flex items-center justify-between vd-panel-bg rounded-sm px-3 py-1.5"
                  >
                    <button
                      onClick={() => toggleGraphFn(f.id)}
                      className="flex items-center gap-2 flex-1 text-left"
                    >
                      <span
                        className="w-3 h-3 rounded-full shrink-0"
                        style={{
                          backgroundColor: graphColors[idx % graphColors.length],
                          opacity: f.visible ? 1 : 0.25,
                        }}
                      />
                      <span
                        className={`text-sm font-mono ${
                          f.visible ? "text-stone-200" : "text-stone-600 line-through"
                        }`}
                      >
                        y = <Latex tex={exprToLatex(f.expr)} />
                      </span>
                    </button>
                    <button
                      onClick={() => removeGraphFn(f.id)}
                      className="text-stone-600 hover:text-red-400 transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
                {graphFns.length === 0 && (
                  <p className="text-stone-500 text-sm py-2">
                    {t("plotEmptyHint", language)} <span className="font-mono">x^2 - 3</span>.
                  </p>
                )}
              </div>

              <div className="flex items-center gap-3 mb-3 text-xs font-mono text-stone-400">
                <span>x min</span>
                <input
                  type="number"
                  value={xMin}
                  onChange={(e) => setXMin(e.target.value)}
                  className="w-20 vd-panel-bg border border-stone-700 rounded-sm px-2 py-1 vd-text"
                />
                <span>x max</span>
                <input
                  type="number"
                  value={xMax}
                  onChange={(e) => setXMax(e.target.value)}
                  className="w-20 vd-panel-bg border border-stone-700 rounded-sm px-2 py-1 vd-text"
                />
              </div>

              <div className="bg-slate-950 border border-stone-800 rounded-sm p-2 h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 8, right: 12, bottom: 0, left: -12 }}>
                    <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" />
                    <XAxis
                      dataKey="x"
                      type="number"
                      domain={["dataMin", "dataMax"]}
                      stroke="#f5f5f4"
                      tick={{ fontSize: 11, fontFamily: "monospace", fill: "#f5f5f4" }}
                    />
                    <YAxis
                      stroke="#f5f5f4"
                      tick={{ fontSize: 11, fontFamily: "monospace", fill: "#f5f5f4" }}
                    />
                    <Tooltip
                      contentStyle={{
                        background: "#0f172a",
                        border: "1px solid #292524",
                        fontSize: 12,
                        fontFamily: "monospace",
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: 11, fontFamily: "monospace" }} />
                    {graphFns.map(
                      (f, idx) =>
                        f.visible && (
                          <Line
                            key={f.id}
                            type="monotone"
                            dataKey={`f${idx}`}
                            name={`y = ${f.expr}`}
                            stroke={graphColors[idx % graphColors.length]}
                            dot={false}
                            strokeWidth={2}
                            connectNulls={false}
                            isAnimationActive={false}
                          />
                        )
                    )}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="border border-stone-800 vd-card-bg rounded-sm p-4">
              <div className="flex items-center gap-2 text-sm">
                <span className="text-stone-400 font-mono">{t("evaluateAt", language)}</span>
                <input
                  type="number"
                  value={evalX}
                  onChange={(e) => setEvalX(e.target.value)}
                  className="w-24 vd-panel-bg border border-stone-700 rounded-sm px-2 py-1 vd-text font-mono"
                />
              </div>
              {evalResults.length > 0 && (
                <div className="mt-3 space-y-1">
                  {evalResults.map((r, i) => (
                    <p key={i} className="text-sm font-mono text-stone-300">
                      y = <Latex tex={exprToLatex(r.expr)} /> →{" "}
                      <span className="vd-accent-text">{r.value}</span>
                    </p>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "v" && (
          <div className="border border-stone-800 vd-card-bg rounded-sm flex flex-col h-[26rem] sm:h-[32rem]">
            <div className="flex items-center justify-between p-3 border-b border-stone-800">
              <div className="flex items-center gap-2">
                <label
                  className="relative w-8 h-8 rounded-full border-2 flex items-center justify-center font-serif font-bold -rotate-6 select-none cursor-pointer shrink-0"
                  style={{ borderColor: vIconColor, color: vIconColor }}
                  title={t("vColorHint", language)}
                >
                  V
                  <input
                    type="color"
                    value={vIconColor}
                    onChange={(e) => setVIconColor(e.target.value)}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                </label>
                <div>
                  <p className="vd-text text-sm font-medium">V</p>
                  <p className="text-stone-500 text-xs">{t("studyHelper", language)}</p>
                </div>
              </div>
              <div className="flex items-center gap-1 vd-panel-bg rounded-sm p-0.5">
                <button
                  onClick={() => setChatLang("en")}
                  className={`px-2.5 py-1 text-xs font-mono rounded-sm transition-colors ${
                    chatLang === "en"
                      ? "vd-accent-bg text-slate-950 font-semibold"
                      : "text-stone-400"
                  }`}
                >
                  EN
                </button>
                <button
                  onClick={() => setChatLang("my")}
                  className={`px-2.5 py-1 text-xs font-mono rounded-sm transition-colors ${
                    chatLang === "my"
                      ? "vd-accent-bg text-slate-950 font-semibold"
                      : "text-stone-400"
                  }`}
                >
                  MY
                </button>
                <Languages size={14} className="text-stone-500 mx-1" />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {chatMessages.map((m, i) => (
                <div
                  key={i}
                  className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[80%] rounded-sm px-3 py-2 text-sm ${
                      m.role === "user"
                        ? "vd-accent-bg text-slate-950"
                        : "vd-panel-bg text-stone-200"
                    }`}
                  >
                    {renderMarkdown(m.content)}
                  </div>
                </div>
              ))}
              {chatLoading && (
                <div className="flex justify-start">
                  <div className="vd-panel-bg text-stone-400 rounded-sm px-3 py-2 text-sm flex items-center gap-2">
                    <Loader2 size={14} className="animate-spin" /> {t("vThinking", language)}
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            <div className="border-t border-stone-800 p-3 flex gap-2">
              <input
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendChatMessage()}
                placeholder={
                  chatLang === "my"
                    ? "V ကို မေးမြန်းလိုသည့်အကြောင်းအရာကို ရိုက်ထည့်ပါ..."
                    : "Ask V to explain something..."
                }
                className="flex-1 vd-panel-bg border border-stone-700 rounded-sm px-3 py-2 text-sm vd-text placeholder-stone-500 vd-ring"
              />
              <button
                onClick={sendChatMessage}
                disabled={chatLoading}
                className="vd-btn disabled:opacity-50 text-slate-950 rounded-sm px-4 flex items-center justify-center"
              >
                <Send size={16} />
              </button>
            </div>
          </div>
        )}

        {activeTab === "timer" && (
          <div className="max-w-sm mx-auto space-y-4">
            <div className="border border-stone-800 vd-card-bg rounded-sm p-4">
              <div className="flex items-center gap-2 mb-4 text-stone-400 text-xs font-mono uppercase tracking-wide">
                <TimerIcon size={14} className="vd-accent-text" />
                {t("timerHeader", language)}
              </div>

              <div className="flex items-center justify-center gap-2 mb-2">
                {[
                  { value: timerH, setValue: setTimerH, max: 10, label: t("hours", language) },
                  { value: timerM, setValue: setTimerM, max: 59, label: t("minutes", language) },
                  { value: timerS, setValue: setTimerS, max: 59, label: t("seconds", language) },
                ].map((field, i) => (
                  <div key={i} className="flex flex-col items-center gap-1">
                    <input
                      type="number"
                      min={0}
                      max={field.max}
                      value={field.value}
                      disabled={timerRunning}
                      onChange={(e) =>
                        field.setValue(
                          Math.max(0, Math.min(field.max, Number(e.target.value) || 0))
                        )
                      }
                      className="w-16 text-center vd-panel-bg border border-stone-700 rounded-sm px-2 py-2 text-lg font-mono vd-text vd-ring disabled:opacity-50"
                    />
                    <span className="text-stone-500 text-[10px] font-mono uppercase">
                      {field.label}
                    </span>
                  </div>
                ))}
              </div>
              <p className="text-stone-600 text-[11px] font-mono text-center mb-4">
                {t("timerMaxHint", language)}
              </p>

              <div className="vd-panel-bg rounded-sm py-6 text-center mb-4">
                <p
                  className={`text-4xl font-mono tracking-wider ${
                    timerDone ? "vd-accent-text" : "vd-text"
                  }`}
                >
                  {timerDisplay}
                </p>
                {timerDone && (
                  <p className="vd-accent-text text-sm font-mono mt-2">{t("timesUp", language)}</p>
                )}
              </div>

              <div className="flex items-center justify-center gap-2">
                {!timerRunning ? (
                  <button
                    onClick={startTimer}
                    disabled={timerTotalSeconds <= 0 && (timerRemaining ?? 0) <= 0}
                    className="vd-btn disabled:opacity-40 text-slate-950 font-medium text-sm px-4 py-2 rounded-sm flex items-center gap-1.5"
                  >
                    <Play size={14} /> {t("start", language)}
                  </button>
                ) : (
                  <button
                    onClick={pauseTimer}
                    className="border vd-accent-border vd-accent-text hover:opacity-80 font-medium text-sm px-4 py-2 rounded-sm flex items-center gap-1.5"
                  >
                    <Pause size={14} /> {t("pause", language)}
                  </button>
                )}
                <button
                  onClick={resetTimer}
                  className="border border-stone-700 text-stone-400 hover:border-stone-500 text-sm px-4 py-2 rounded-sm flex items-center gap-1.5"
                >
                  <RefreshCw size={14} /> {t("reset", language)}
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === "settings" && (
          <div className="space-y-4 max-w-md">
            <div className="border border-stone-800 vd-card-bg rounded-sm p-4">
              <div className="flex items-center justify-between mb-4">
                <p className="flex items-center gap-2 text-stone-400 text-xs font-mono uppercase tracking-wide">
                  <Palette size={14} className="vd-accent-text" /> {t("appearance", language)}
                </p>
                <button
                  onClick={() => {
                    setPrimaryColor("#020617");
                    setSecondaryColor("#f59e0b");
                    setCardColor("#0f172a");
                    setTextColor("#f5f5f4");
                  }}
                  className="flex items-center gap-1 text-stone-500 hover:text-stone-300 text-xs font-mono transition-colors"
                >
                  <RotateCcw size={12} /> {t("reset", language)}
                </button>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="vd-text text-sm">{t("primaryColor", language)}</p>
                    <p className="text-stone-500 text-xs">{t("primaryColorDesc", language)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={primaryColor}
                      onChange={(e) => setPrimaryColor(e.target.value)}
                      className="w-9 h-9 rounded-sm border border-stone-700 bg-transparent cursor-pointer"
                    />
                    <input
                      value={primaryColor}
                      onChange={(e) => setPrimaryColor(e.target.value)}
                      className="w-24 vd-panel-bg border border-stone-700 rounded-sm px-2 py-1.5 text-xs font-mono vd-text vd-ring"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="vd-text text-sm">{t("secondaryColor", language)}</p>
                    <p className="text-stone-500 text-xs">{t("secondaryColorDesc", language)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={secondaryColor}
                      onChange={(e) => setSecondaryColor(e.target.value)}
                      className="w-9 h-9 rounded-sm border border-stone-700 bg-transparent cursor-pointer"
                    />
                    <input
                      value={secondaryColor}
                      onChange={(e) => setSecondaryColor(e.target.value)}
                      className="w-24 vd-panel-bg border border-stone-700 rounded-sm px-2 py-1.5 text-xs font-mono vd-text vd-ring"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="vd-text text-sm">{t("cardColor", language)}</p>
                    <p className="text-stone-500 text-xs">{t("cardColorDesc", language)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={cardColor}
                      onChange={(e) => setCardColor(e.target.value)}
                      className="w-9 h-9 rounded-sm border border-stone-700 bg-transparent cursor-pointer"
                    />
                    <input
                      value={cardColor}
                      onChange={(e) => setCardColor(e.target.value)}
                      className="w-24 vd-panel-bg border border-stone-700 rounded-sm px-2 py-1.5 text-xs font-mono vd-text vd-ring"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="vd-text text-sm">{t("textColor", language)}</p>
                    <p className="text-stone-500 text-xs">{t("textColorDesc", language)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={textColor}
                      onChange={(e) => setTextColor(e.target.value)}
                      className="w-9 h-9 rounded-sm border border-stone-700 bg-transparent cursor-pointer"
                    />
                    <input
                      value={textColor}
                      onChange={(e) => setTextColor(e.target.value)}
                      className="w-24 vd-panel-bg border border-stone-700 rounded-sm px-2 py-1.5 text-xs font-mono vd-text vd-ring"
                    />
                  </div>
                </div>
              </div>

              <p className="text-stone-600 text-[11px] font-mono mt-4 leading-relaxed">
                {t("appearanceHint", language)}
              </p>
            </div>

            <div className="border border-stone-800 vd-card-bg rounded-sm p-4">
              <p className="text-stone-400 text-xs font-mono uppercase tracking-wide mb-2">
                {t("preview", language)}
              </p>
              <button className="vd-btn text-slate-950 font-medium text-sm px-4 py-2 rounded-sm mr-2">
                {t("sampleButton", language)}
              </button>
              <span className="vd-accent-text text-sm font-mono">{t("accentTextSample", language)}</span>
            </div>

            <div className="border border-stone-800 vd-card-bg rounded-sm p-4">
              <p className="flex items-center gap-2 text-stone-400 text-xs font-mono uppercase tracking-wide mb-3">
                <Globe size={14} className="vd-accent-text" /> {t("language", language)}
              </p>
              <p className="text-stone-500 text-xs mb-3">{t("languageDesc", language)}</p>
              <div className="flex items-center gap-1 vd-panel-bg rounded-sm p-0.5 w-fit">
                <button
                  onClick={() => setLanguage("en")}
                  className={`px-3 py-1.5 text-xs font-mono rounded-sm transition-colors ${
                    language === "en" ? "vd-accent-bg text-slate-950 font-semibold" : "text-stone-400"
                  }`}
                >
                  English
                </button>
                <button
                  onClick={() => setLanguage("my")}
                  className={`px-3 py-1.5 text-xs font-mono rounded-sm transition-colors ${
                    language === "my" ? "vd-accent-bg text-slate-950 font-semibold" : "text-stone-400"
                  }`}
                >
                  မြန်မာ
                </button>
              </div>
            </div>

            <div className="border border-stone-800 vd-card-bg rounded-sm p-4">
              <p className="text-stone-400 text-xs font-mono uppercase tracking-wide mb-2">
                {t("account", language)}
              </p>
              <p className="text-stone-500 text-xs leading-relaxed">{t("accountDesc", language)}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

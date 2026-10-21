import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  X, 
  Play, 
  Pause, 
  RotateCcw, 
  Volume2, 
  VolumeX, 
  Download, 
  Maximize2, 
  Minimize2, 
  SkipForward, 
  SkipBack, 
  Sparkles, 
  CheckCircle2, 
  ShieldCheck, 
  FileSpreadsheet, 
  Users, 
  Briefcase, 
  Clock, 
  DollarSign, 
  FileText, 
  Mail, 
  Video,
  ArrowRight,
  ExternalLink,
  Laptop,
  AlertTriangle,
  UserCheck,
  Check,
  Layers,
  Search,
  Filter,
  Eye,
  Send,
  Building,
  Key,
  Calendar,
  Lock,
  ChevronRight,
  Fingerprint
} from 'lucide-react';
import { UserRole } from '../types';

interface ProductDemoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateToFeature?: (feature: 'onboarding' | 'offboarding' | 'bgv' | 'excel' | 'outbox' | 'role_pmo' | 'role_supplier' | 'role_admin') => void;
}

interface DemoChapter {
  id: string;
  title: string;
  shortTitle: string;
  durationSec: number;
  roleContext: string;
  tagline: string;
  description: string;
  narration: string;
  keyHighlights: string[];
  actionLabel: string;
  actionFeature: 'onboarding' | 'offboarding' | 'bgv' | 'excel' | 'outbox' | 'role_pmo';
}

const DEMO_CHAPTERS: DemoChapter[] = [
  {
    id: 'intro',
    title: 'Platform Overview & Executive Command Center',
    shortTitle: '1. Executive Overview',
    durationSec: 12,
    roleContext: 'Admin & Executive Governance',
    tagline: 'End-to-end governance of global contingent workforce lifecycles',
    description: 'Unified command center tracking SLA adherence, same-day onboarding velocity, and $5,420 non-billable KT transition efficiency across vendor partners.',
    narration: 'Welcome to AB Sutra, the enterprise contingent workforce governance portal. Our executive dashboard delivers unified visibility across supplier submissions, PMO sign-offs, and automated Workday synchronization with real-time financial savings tracking.',
    keyHighlights: [
      'Real-time SLA velocity tracking & risk alerting',
      '$5,420 captured knowledge transition efficiency',
      'Unified cross-persona view: Supplier, PMO/Hiring Manager, and Admin'
    ],
    actionLabel: 'Explore Dashboard View',
    actionFeature: 'role_pmo'
  },
  {
    id: 'onboarding',
    title: 'Vendor Partner 32-Field Onboarding & BGV Verification',
    shortTitle: '2. 32-Field Onboarding',
    durationSec: 14,
    roleContext: 'Supplier (Vendor Partner)',
    tagline: 'Guaranteed compliance with zero-omission form validation',
    description: 'Suppliers submit prospective contractors with automated 7-year BGV email proof, replacement resource knowledge-transition alerts, and instant field auditing.',
    narration: 'Suppliers initiate onboarding with thirty-two mandatory enterprise fields. The built-in compliance engine audits background verification clearance proof and flags billing start date gaps for replacement contractors before submission.',
    keyHighlights: [
      'Mandatory BGV confirmation email attachment verification',
      'Automated date-gap policy alert for replacement resources ($5,420 saved)',
      '3-resource roster support with localized compliance checks'
    ],
    actionLabel: 'Launch Onboarding Form',
    actionFeature: 'onboarding'
  },
  {
    id: 'excel_sync',
    title: 'Excel Smart Parser & Bulk Batch Synchronization',
    shortTitle: '3. Excel Bulk Parser',
    durationSec: 11,
    roleContext: 'Supplier & PMO Operations',
    tagline: 'Instant batch ingestion of multi-resource workbooks',
    description: 'Drag-and-drop enterprise spreadsheet ingestion with Apache POI & XLSX synchronization, cell-level validation, and instant multi-contractor intake.',
    narration: 'Accelerate high-volume intakes with our smart Excel batch synchronizer. Upload multi-resource workbooks to parse, validate, and stage dozens of onboarding records simultaneously with cell-level error highlighting.',
    keyHighlights: [
      'One-click sample template download with column hints',
      'Real-time cell parsing with automated header normalization',
      'Direct batch push to PMO review queue'
    ],
    actionLabel: 'Test Excel Ingestion',
    actionFeature: 'excel'
  },
  {
    id: 'pmo_governance',
    title: 'Autonomous PMO & Hiring Manager Review (Workday Push)',
    shortTitle: '4. PMO Review & Workday',
    durationSec: 13,
    roleContext: 'PMO Governance Lead / Hiring Manager',
    tagline: 'Single-click approvals with Workday profile initiation',
    description: 'Managers verify technical evaluation scores, review SOW alignment, commit target onboarding dates, and push directly into Workday with automated corporate email generation.',
    narration: 'PMO leads and Hiring Managers review submissions with complete autonomy. Evaluate technical test scores, verify purchase order allocations, initiate Workday contractor profiles, and assign official AB.com email identities in seconds.',
    keyHighlights: [
      'Technical assessment (92/100) & SOW funding verification',
      'Direct Workday ID push and official @ab.com email allocation',
      'Autonomous backup authority delegation for out-of-office coverage'
    ],
    actionLabel: 'Review Pending Workday Queues',
    actionFeature: 'role_pmo'
  },
  {
    id: 'offboarding',
    title: '14-Field Offboarding & Hardware Asset Recovery Protocol',
    shortTitle: '5. 14-Point Offboarding',
    durationSec: 12,
    roleContext: 'Enterprise Security & IT Operations',
    tagline: 'Total risk mitigation for departing contingent resources',
    description: 'Fourteen-point protocol ensuring corporate laptop retrieval, security badge neutralization, timesheet locks, and Workday termination screenshot auditing.',
    narration: 'When an assignment concludes, initiate offboarding using the fourteen-point protocol. Track IT laptop recovery, badge deactivation, timesheet locking, and upload verified Workday termination screenshots.',
    keyHighlights: [
      'Hardware serial and tracking number verification',
      'Mandatory Workday termination screenshot upload & verification',
      'Automated email notification to IT asset recovery desk'
    ],
    actionLabel: 'Open Offboarding Form',
    actionFeature: 'offboarding'
  },
  {
    id: 'audit_outbox',
    title: 'Immutable Audit Trail & Stakeholder Email Dispatch',
    shortTitle: '6. Outbox & Audit Trail',
    durationSec: 11,
    roleContext: 'Admin Governance & Compliance Office',
    tagline: '100% auditable communications and tamper-evident history',
    description: 'Complete cross-request outbox inspecting every dispatched corporate notification, paired with SHA-256 traceable audit logs and one-click Excel governance exports.',
    narration: 'Every state transition automatically generates an enterprise email dispatched to the sponsor, vendor delivery manager, and central PMO. Inspect the full communications outbox and export SHA-256 compliant audit records at any moment.',
    keyHighlights: [
      'Cross-stakeholder corporate email delivery outbox with full HTML previews',
      'Immutable timestamped SHA-256 audit log with actor identity',
      'One-click multi-tab Excel compliance report generation'
    ],
    actionLabel: 'Inspect Communications Outbox',
    actionFeature: 'outbox'
  }
];

export const ProductDemoModal: React.FC<ProductDemoModalProps> = ({
  isOpen,
  onClose,
  onNavigateToFeature
}) => {
  const [currentChapterIdx, setCurrentChapterIdx] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const [chapterElapsedSec, setChapterElapsedSec] = useState(0);
  const [isVoiceoverMuted, setIsVoiceoverMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingProgress, setRecordingProgress] = useState(0);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const hiddenCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const lastTickTimeRef = useRef<number>(Date.now());
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);

  const totalChapters = DEMO_CHAPTERS.length;
  const safeChapterIdx = Math.max(0, Math.min(currentChapterIdx, totalChapters - 1));
  const currentChapter = DEMO_CHAPTERS[safeChapterIdx] || DEMO_CHAPTERS[0];

  // Total duration of entire demo
  const totalDemoDurationSec = DEMO_CHAPTERS.reduce((acc, c) => acc + (c?.durationSec || 10), 0);
  const elapsedTotalSec = DEMO_CHAPTERS.slice(0, safeChapterIdx).reduce((acc, c) => acc + (c?.durationSec || 10), 0) + chapterElapsedSec;
  const currentProgressRatio = Math.min(1, Math.max(0, chapterElapsedSec / (currentChapter?.durationSec || 10)));

  // Voiceover Speech Synthesis
  useEffect(() => {
    if (!isOpen) {
      if ('speechSynthesis' in window) window.speechSynthesis.cancel();
      return;
    }

    if (!isVoiceoverMuted && 'speechSynthesis' in window && isPlaying && currentChapter) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(currentChapter.narration);
      utterance.rate = playbackSpeed * 1.05;
      utterance.pitch = 1.0;
      
      const voices = window.speechSynthesis.getVoices();
      const preferred = voices.find(v => v.lang.startsWith('en') && (v.name.includes('Google') || v.name.includes('Natural') || v.name.includes('Samantha')));
      if (preferred) utterance.voice = preferred;

      window.speechSynthesis.speak(utterance);
    } else if (isVoiceoverMuted && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }, [safeChapterIdx, isVoiceoverMuted, isOpen, isPlaying, playbackSpeed, currentChapter]);

  // Cleanup speech on unmount
  useEffect(() => {
    return () => {
      if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    };
  }, []);

  // Main playback timer
  useEffect(() => {
    if (!isOpen || !isPlaying) return;

    lastTickTimeRef.current = Date.now();
    const interval = setInterval(() => {
      const now = Date.now();
      const deltaSec = ((now - lastTickTimeRef.current) / 1000) * playbackSpeed;
      lastTickTimeRef.current = now;

      setChapterElapsedSec((prevElapsed) => {
        const chapDuration = currentChapter?.durationSec || 10;
        const nextElapsed = prevElapsed + deltaSec;

        if (nextElapsed >= chapDuration) {
          if (safeChapterIdx < totalChapters - 1) {
            setTimeout(() => {
              setCurrentChapterIdx((c) => Math.min(c + 1, totalChapters - 1));
              setChapterElapsedSec(0);
            }, 0);
            return chapDuration;
          } else {
            setIsPlaying(false);
            return chapDuration;
          }
        }
        return nextElapsed;
      });
    }, 50);

    return () => clearInterval(interval);
  }, [isOpen, isPlaying, playbackSpeed, safeChapterIdx, currentChapter?.durationSec, totalChapters]);

  // Jump to specific chapter
  const handleSelectChapter = (idx: number) => {
    const safeIdx = Math.max(0, Math.min(idx, totalChapters - 1));
    setCurrentChapterIdx(safeIdx);
    setChapterElapsedSec(0);
    setIsPlaying(true);
  };

  // Skip forward 5s / backward 5s
  const handleSkip = (seconds: number) => {
    const chapDuration = currentChapter?.durationSec || 10;
    const next = chapterElapsedSec + seconds;

    if (next < 0) {
      if (safeChapterIdx > 0) {
        setCurrentChapterIdx((c) => Math.max(0, c - 1));
        setChapterElapsedSec(0);
      } else {
        setChapterElapsedSec(0);
      }
    } else if (next >= chapDuration) {
      if (safeChapterIdx < totalChapters - 1) {
        setCurrentChapterIdx((c) => Math.min(c + 1, totalChapters - 1));
        setChapterElapsedSec(0);
      } else {
        setChapterElapsedSec(chapDuration);
        setIsPlaying(false);
      }
    } else {
      setChapterElapsedSec(next);
    }
  };

  // Toggle fullscreen
  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  // Video Export / Download Feature
  const handleExportVideo = async () => {
    if (!hiddenCanvasRef.current || isRecording) return;
    try {
      setIsRecording(true);
      setRecordingProgress(0);
      recordedChunksRef.current = [];

      setCurrentChapterIdx(0);
      setChapterElapsedSec(0);
      setIsPlaying(true);

      const canvas = hiddenCanvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const stream = canvas.captureStream(30);
      const options = { mimeType: 'video/webm;codecs=vp9,opus' };
      let recorder: MediaRecorder;
      try {
        recorder = new MediaRecorder(stream, options);
      } catch (e) {
        recorder = new MediaRecorder(stream);
      }

      mediaRecorderRef.current = recorder;
      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `AB-SUTRA-Product-Demo-${new Date().toISOString().substring(0, 10)}.webm`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        setIsRecording(false);
      };

      recorder.start();

      const totalMs = totalDemoDurationSec * 1000;
      const startRecordTime = Date.now();
      
      const renderExportFrame = () => {
        if (!isRecording) return;
        // Draw high quality frame
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(20, 20, canvas.width - 40, canvas.height - 40);

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 24px Inter, sans-serif';
        ctx.fillText(`AB-SUTRA Enterprise Demo: Chapter ${safeChapterIdx + 1} - ${currentChapter.title}`, 40, 60);

        ctx.fillStyle = '#94a3b8';
        ctx.font = '16px Inter, sans-serif';
        ctx.fillText(currentChapter.description, 40, 95);

        ctx.fillStyle = '#38bdf8';
        ctx.font = '14px Inter, sans-serif';
        ctx.fillText(`Narration: ${currentChapter.narration}`, 40, 130);

        if (isRecording) {
          requestAnimationFrame(renderExportFrame);
        }
      };
      requestAnimationFrame(renderExportFrame);

      const progressTimer = setInterval(() => {
        const elapsed = Date.now() - startRecordTime;
        const pct = Math.min(100, Math.round((elapsed / totalMs) * 100));
        setRecordingProgress(pct);

        if (elapsed >= totalMs) {
          clearInterval(progressTimer);
          if (recorder.state !== 'inactive') {
            recorder.stop();
          }
        }
      }, 500);
    } catch (err) {
      console.error('Video recording failed:', err);
      setIsRecording(false);
    }
  };

  // Cursor position simulation based on progressRatio
  const getCursorCoords = (ratio: number, chapterId: string) => {
    switch (chapterId) {
      case 'intro':
        // Moves from KPI card to Request Table row
        if (ratio < 0.4) {
          return { x: 25 + ratio * 30, y: 35 + Math.sin(ratio * 10) * 8, label: 'Inspecting $5,420 KT Efficiency' };
        } else if (ratio < 0.75) {
          return { x: 55 + (ratio - 0.4) * 50, y: 68, label: 'Hovering Active Contractor Roster' };
        }
        return { x: 80, y: 72, label: 'Viewing PMO Status' };
      case 'onboarding':
        // Moves through tabs and forms
        if (ratio < 0.25) {
          return { x: 30 + ratio * 20, y: 28, label: 'Typing Candidate: Ananya Krishnan' };
        } else if (ratio < 0.55) {
          return { x: 48, y: 52, label: 'Validating KT Date Gap ($5,420 Efficiency)' };
        } else if (ratio < 0.85) {
          return { x: 75, y: 76, label: 'Verifying 7-Yr BGV Clearance Email' };
        }
        return { x: 86, y: 88, label: 'Submitting 32-Field Onboarding' };
      case 'excel_sync':
        // Moves across spreadsheet rows
        if (ratio < 0.5) {
          return { x: 35 + ratio * 40, y: 46, label: 'Parsing 32-Column XLSX Batch' };
        }
        return { x: 82, y: 86, label: 'Ingesting 4 Validated Contractors' };
      case 'pmo_governance':
        // Checks off compliance toggles then hits Workday push
        if (ratio < 0.3) {
          return { x: 38, y: 42, label: 'Verifying Tech Score (92/100)' };
        } else if (ratio < 0.7) {
          return { x: 62, y: 58, label: 'Signing Off 6-Point PMO Checklist' };
        }
        return { x: 84, y: 85, label: 'Pushing to Workday & Generating @ab.com' };
      case 'offboarding':
        // Hardware serial -> Workday screenshot -> Submit
        if (ratio < 0.4) {
          return { x: 42, y: 45, label: 'Auditing Laptop Serial MBP-2024-X99281' };
        } else if (ratio < 0.75) {
          return { x: 68, y: 62, label: 'Verifying Workday Termination Screenshot' };
        }
        return { x: 85, y: 88, label: 'Neutralizing Badge & Locking Timesheet' };
      case 'audit_outbox':
        // Dispatched email -> SHA-256 stamp
        if (ratio < 0.5) {
          return { x: 45, y: 44, label: 'Previewing Corporate Dispatch Email' };
        }
        return { x: 72, y: 78, label: 'Auditing SHA-256 Tamper-Proof Hash' };
      default:
        return { x: 50, y: 50, label: 'Simulating Activity' };
    }
  };

  const cursorState = getCursorCoords(currentProgressRatio, currentChapter.id);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4">
      {/* Hidden canvas for offline recording stream */}
      <canvas ref={hiddenCanvasRef} width={1280} height={720} className="hidden" />

      <div 
        ref={containerRef}
        className="relative bg-slate-900 border border-slate-700 w-full max-w-6xl rounded-2xl shadow-2xl overflow-hidden flex flex-col text-slate-100 max-h-[96vh]"
      >
        {/* Top Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-slate-800 bg-slate-900/95 z-20">
          <div className="flex items-center space-x-3">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-500 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Video className="w-5 h-5 text-white animate-pulse" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-bold text-sm sm:text-base tracking-tight text-white flex items-center gap-2">
                  <span>AB-SUTRA Product Tour &amp; Workflow Simulator</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                    Live UI Demo
                  </span>
                </h3>
                <span className="hidden md:inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Full 6-Workflow Coverage
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Scene {safeChapterIdx + 1} of {totalChapters}: <span className="text-slate-200 font-medium">{currentChapter?.title}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {/* Direct action button to launch real feature */}
            {onNavigateToFeature && (
              <button
                onClick={() => {
                  onClose();
                  onNavigateToFeature(currentChapter.actionFeature);
                }}
                className="hidden sm:flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white transition shadow-sm border border-blue-400/40"
                title="Directly launch this real feature inside the application"
              >
                <span>{currentChapter.actionLabel}</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            )}

            {/* Video Export button */}
            <button
              onClick={handleExportVideo}
              disabled={isRecording}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition border ${
                isRecording 
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 animate-pulse'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
              }`}
              title="Export complete animated video as WebM"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{isRecording ? `Recording (${recordingProgress}%)` : 'Export .webm'}</span>
            </button>

            {/* Fullscreen Toggle */}
            <button
              onClick={toggleFullscreen}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
              title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>

            {/* Close */}
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
              title="Close Demo"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* =========================================================================
            PRIMARY VIDEO VIEWPORT: High-Fidelity Photorealistic Interactive Screen
           ========================================================================= */}
        <div className="relative bg-slate-950 aspect-[16/9] w-full overflow-hidden select-none flex flex-col justify-between border-b border-slate-800">
          
          {/* Top Simulated Browser Chrome / App Header */}
          <div className="bg-slate-900 border-b border-slate-800 px-4 py-2 flex items-center justify-between z-10 shrink-0">
            <div className="flex items-center space-x-2">
              <div className="flex space-x-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500/80"></span>
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80"></span>
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80"></span>
              </div>
              <div className="bg-slate-950/80 border border-slate-800 rounded-md px-3 py-1 flex items-center space-x-2 text-[11px] text-slate-400 w-64 md:w-80">
                <Lock className="w-3 h-3 text-emerald-400" />
                <span className="truncate text-slate-300 font-mono">ab-sutra.corp.ab.com/governance/{currentChapter.id}</span>
              </div>
            </div>

            <div className="flex items-center space-x-3 text-xs">
              <div className="hidden sm:flex items-center space-x-1.5 bg-blue-950/50 border border-blue-800/40 rounded px-2 py-0.5 text-blue-300 font-medium text-[11px]">
                <UserCheck className="w-3.5 h-3.5 text-blue-400" />
                <span>Active Role: {currentChapter.roleContext}</span>
              </div>
              <div className="flex items-center space-x-1 text-slate-400 text-[11px]">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                <span className="text-emerald-400 font-medium">SIMULATED LIVE</span>
              </div>
            </div>
          </div>

          {/* MAIN SIMULATED CANVAS/VIEWPORT AREA */}
          <div className="relative flex-1 overflow-hidden p-3 sm:p-5 flex flex-col justify-center bg-gradient-to-b from-slate-950 to-slate-900">

            {/* ---------------- SCENE 1: EXECUTIVE COMMAND CENTER ---------------- */}
            {currentChapter.id === 'intro' && (
              <div className="w-full h-full flex flex-col justify-between max-w-5xl mx-auto space-y-3 animate-fadeIn">
                {/* Stats Row */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  <div className="bg-slate-900/90 border border-slate-700/70 rounded-xl p-3 shadow-md">
                    <div className="flex items-center justify-between text-slate-400 text-[11px] font-medium">
                      <span>Active Contingent</span>
                      <Users className="w-3.5 h-3.5 text-blue-400" />
                    </div>
                    <div className="text-xl sm:text-2xl font-bold text-white mt-1">142 <span className="text-xs font-normal text-slate-400">workers</span></div>
                    <div className="text-[10px] text-emerald-400 flex items-center mt-1">
                      <span>↑ 14% vs last quarter</span>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-emerald-950/40 to-slate-900 border border-emerald-500/30 rounded-xl p-3 shadow-md">
                    <div className="flex items-center justify-between text-emerald-300 text-[11px] font-medium">
                      <span>Non-Billable KT Savings</span>
                      <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                    </div>
                    <div className="text-xl sm:text-2xl font-bold text-emerald-400 mt-1">$5,420</div>
                    <div className="text-[10px] text-emerald-300/80 flex items-center mt-1">
                      <span>Zero financial billing gaps</span>
                    </div>
                  </div>

                  <div className="bg-slate-900/90 border border-slate-700/70 rounded-xl p-3 shadow-md">
                    <div className="flex items-center justify-between text-slate-400 text-[11px] font-medium">
                      <span>Onboarding Velocity</span>
                      <Clock className="w-3.5 h-3.5 text-amber-400" />
                    </div>
                    <div className="text-xl sm:text-2xl font-bold text-white mt-1">3.2 <span className="text-xs font-normal text-slate-400">days avg</span></div>
                    <div className="text-[10px] text-emerald-400 flex items-center mt-1">
                      <span>72% faster than industry standard</span>
                    </div>
                  </div>

                  <div className="bg-slate-900/90 border border-slate-700/70 rounded-xl p-3 shadow-md">
                    <div className="flex items-center justify-between text-slate-400 text-[11px] font-medium">
                      <span>SLA Compliance</span>
                      <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
                    </div>
                    <div className="text-xl sm:text-2xl font-bold text-indigo-300 mt-1">98.4%</div>
                    <div className="text-[10px] text-slate-400 flex items-center mt-1">
                      <span>Zero non-compliant entries</span>
                    </div>
                  </div>
                </div>

                {/* Simulated Real Request Table */}
                <div className="bg-slate-900/90 border border-slate-800 rounded-xl overflow-hidden shadow-lg flex-1 flex flex-col">
                  <div className="px-3.5 py-2 border-b border-slate-800 bg-slate-900/95 flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-bold text-white">Active Requisition Governance Pipeline</span>
                      <span className="px-2 py-0.5 rounded text-[10px] bg-slate-800 text-slate-300">Live 4 Records</span>
                    </div>
                    <div className="flex items-center space-x-1.5 text-[11px]">
                      <span className="px-2 py-0.5 rounded bg-blue-600/20 text-blue-300 border border-blue-500/30 font-medium">All (4)</span>
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-400 hover:text-slate-200">Pending PMO (2)</span>
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-400 hover:text-slate-200">Workday Synced (1)</span>
                    </div>
                  </div>

                  <div className="overflow-x-auto flex-1">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-950/60 text-slate-400 text-[10px] uppercase font-semibold border-b border-slate-800">
                        <tr>
                          <th className="py-2 px-3">Demand ID</th>
                          <th className="py-2 px-3">Contractor Name</th>
                          <th className="py-2 px-3">Vendor Partner</th>
                          <th className="py-2 px-3">Role / Tech Stack</th>
                          <th className="py-2 px-3">BGV Status</th>
                          <th className="py-2 px-3">Lifecycle State</th>
                          <th className="py-2 px-3 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60 text-[11px]">
                        <tr className="hover:bg-slate-800/40 transition bg-blue-950/10">
                          <td className="py-2 px-3 font-mono text-blue-400 font-semibold">DEMAND-2026-8841</td>
                          <td className="py-2 px-3 font-medium text-white flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                            <span>Ananya Krishnan</span>
                          </td>
                          <td className="py-2 px-3 text-slate-300">Infosys Ltd</td>
                          <td className="py-2 px-3 text-slate-400">Sr. Cloud Architect</td>
                          <td className="py-2 px-3"><span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">Cleared (7-Yr)</span></td>
                          <td className="py-2 px-3"><span className="px-2 py-0.5 rounded-full text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30 font-medium">PMO Review Pending</span></td>
                          <td className="py-2 px-3 text-right">
                            <span className="text-blue-400 font-medium hover:underline cursor-pointer">Open File →</span>
                          </td>
                        </tr>
                        <tr className="hover:bg-slate-800/40 transition">
                          <td className="py-2 px-3 font-mono text-blue-400">DEMAND-2026-8842</td>
                          <td className="py-2 px-3 font-medium text-white flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-blue-400"></span>
                            <span>Kevin O'Connor</span>
                          </td>
                          <td className="py-2 px-3 text-slate-300">Wipro Technologies</td>
                          <td className="py-2 px-3 text-slate-400">Kubernetes DevOps</td>
                          <td className="py-2 px-3"><span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">Cleared (7-Yr)</span></td>
                          <td className="py-2 px-3"><span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-medium">Workday Synced</span></td>
                          <td className="py-2 px-3 text-right"><span className="text-slate-400">Inspect</span></td>
                        </tr>
                        <tr className="hover:bg-slate-800/40 transition">
                          <td className="py-2 px-3 font-mono text-blue-400">DEMAND-2026-8843</td>
                          <td className="py-2 px-3 font-medium text-white flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                            <span>Priya Nambiar</span>
                          </td>
                          <td className="py-2 px-3 text-slate-300">TCS Global</td>
                          <td className="py-2 px-3 text-slate-400">Data Platform Lead</td>
                          <td className="py-2 px-3"><span className="px-2 py-0.5 rounded-full text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30">Agency Review</span></td>
                          <td className="py-2 px-3"><span className="px-2 py-0.5 rounded-full text-[10px] bg-slate-700 text-slate-300">BGV In Progress</span></td>
                          <td className="py-2 px-3 text-right"><span className="text-slate-400">Audit</span></td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* ---------------- SCENE 2: 32-FIELD ONBOARDING MODAL & BGV ---------------- */}
            {currentChapter.id === 'onboarding' && (
              <div className="w-full h-full flex flex-col max-w-4xl mx-auto bg-slate-900 border border-blue-500/40 rounded-xl overflow-hidden shadow-2xl animate-fadeIn">
                {/* Onboarding Dialog Header */}
                <div className="px-4 py-2.5 bg-gradient-to-r from-blue-900/60 to-slate-900 border-b border-blue-500/30 flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Briefcase className="w-4 h-4 text-blue-400" />
                    <span className="font-bold text-xs sm:text-sm text-white">
                      Contractor Onboarding Initiation (32 Mandatory Enterprise Fields)
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-500/20 text-emerald-300 font-semibold border border-emerald-500/30">
                      Standardized Compliance Spec
                    </span>
                  </div>
                  <span className="text-[11px] text-blue-300 font-mono">Step 1 of 1 • Multi-Resource Roster</span>
                </div>

                {/* Sub-tabs inside modal */}
                <div className="flex border-b border-slate-800 bg-slate-950/60 text-[11px] px-3">
                  <div className={`py-2 px-3 font-semibold border-b-2 flex items-center gap-1.5 ${currentProgressRatio < 0.3 ? 'border-blue-500 text-blue-400 bg-blue-950/30' : 'border-transparent text-slate-400'}`}>
                    <span>1. Demand &amp; Identity</span>
                  </div>
                  <div className={`py-2 px-3 font-semibold border-b-2 flex items-center gap-1.5 ${currentProgressRatio >= 0.3 && currentProgressRatio < 0.65 ? 'border-amber-500 text-amber-300 bg-amber-950/30' : 'border-transparent text-slate-400'}`}>
                    <span>2. KT Policy &amp; Date Gap Analysis</span>
                    <span className="px-1.5 py-0.2 rounded text-[9px] bg-amber-500/30 text-amber-300">Policy Trigger</span>
                  </div>
                  <div className={`py-2 px-3 font-semibold border-b-2 flex items-center gap-1.5 ${currentProgressRatio >= 0.65 ? 'border-emerald-500 text-emerald-300 bg-emerald-950/30' : 'border-transparent text-slate-400'}`}>
                    <span>3. BGV 7-Year Proof &amp; IT Setup</span>
                    <span className="px-1.5 py-0.2 rounded text-[9px] bg-emerald-500/30 text-emerald-300">Verified</span>
                  </div>
                </div>

                {/* Form Body with 32 Real Fields Mockup */}
                <div className="p-3.5 space-y-3 flex-1 overflow-y-auto">
                  {/* Grid 1: Demand & Supplier Details */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
                    <div>
                      <label className="text-[10px] text-slate-400 font-medium">1. Demand / Requisition ID *</label>
                      <input 
                        readOnly 
                        value="DEMAND-2026-8841" 
                        className="w-full mt-1 bg-slate-950 border border-slate-700 rounded px-2.5 py-1 text-slate-100 font-mono text-[11px]"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-400 font-medium">2. Candidate Legal Name *</label>
                      <input 
                        readOnly 
                        value={currentProgressRatio > 0.15 ? "Ananya Krishnan" : "Anan..."} 
                        className="w-full mt-1 bg-slate-950 border border-emerald-500/50 rounded px-2.5 py-1 text-emerald-300 font-medium text-[11px]"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-400 font-medium">3. Vendor Partner *</label>
                      <input 
                        readOnly 
                        value="Infosys Technologies Ltd" 
                        className="w-full mt-1 bg-slate-950 border border-slate-700 rounded px-2.5 py-1 text-slate-200 text-[11px]"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-400 font-medium">4. SOW / PO Reference *</label>
                      <input 
                        readOnly 
                        value="PO-AB-77492-EXP" 
                        className="w-full mt-1 bg-slate-950 border border-slate-700 rounded px-2.5 py-1 text-slate-200 text-[11px]"
                      />
                    </div>
                  </div>

                  {/* Grid 2: Dates, Location, and Replacement KT */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
                    <div>
                      <label className="text-[10px] text-slate-400 font-medium">5. Demand Type *</label>
                      <div className="mt-1 flex items-center space-x-1.5">
                        <span className="px-2 py-0.5 rounded bg-blue-600/30 text-blue-300 border border-blue-500/40 text-[10px] font-semibold">
                          Replacement
                        </span>
                        <span className="text-[10px] text-slate-400">Old: R. Deshmukh</span>
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-400 font-medium">6. Tentative Joining Date *</label>
                      <input 
                        readOnly 
                        value="01/11/2026" 
                        className="w-full mt-1 bg-slate-950 border border-blue-500/40 rounded px-2.5 py-1 text-blue-300 text-[11px] font-semibold"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-400 font-medium">7. Billing Start Date *</label>
                      <input 
                        readOnly 
                        value="15/11/2026 (14 Days KT)" 
                        className="w-full mt-1 bg-slate-950 border border-amber-500/50 rounded px-2.5 py-1 text-amber-300 text-[11px] font-semibold"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-400 font-medium">8. Resource Work Location *</label>
                      <input 
                        readOnly 
                        value="Bangalore BLR-04 Campus" 
                        className="w-full mt-1 bg-slate-950 border border-slate-700 rounded px-2.5 py-1 text-slate-200 text-[11px]"
                      />
                    </div>
                  </div>

                  {/* Policy Verification Warning Card */}
                  <div className="bg-amber-950/40 border border-amber-500/50 rounded-lg p-2.5 flex items-start space-x-2.5 animate-pulse">
                    <AlertTriangle className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
                    <div className="text-xs">
                      <div className="font-bold text-amber-300 flex items-center space-x-2">
                        <span>Compliance Warning: Non-Billable Knowledge Transition Period Detected</span>
                        <span className="px-1.5 py-0.2 rounded bg-amber-400 text-slate-950 font-extrabold text-[9px]">$5,420 CAPTURED EFFICIENCY</span>
                      </div>
                      <p className="text-[11px] text-amber-200/90 mt-0.5">
                        Tentative joining date (01/11/2026) is 14 calendar days prior to billing start date (15/11/2026). Vendor agrees this period is non-billable KT. Zero financial leakage confirmed.
                      </p>
                    </div>
                  </div>

                  {/* Mandatory Background Verification (BGV) Card */}
                  <div className="bg-slate-950 border border-slate-800 rounded-lg p-2.5 flex items-center justify-between">
                    <div className="flex items-center space-x-2.5">
                      <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                        <ShieldCheck className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="text-xs font-bold text-white">7-Year BGV Clearance Verification</span>
                          <span className="px-1.5 py-0.2 rounded text-[9px] bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/40">
                            CLEARED &amp; ATTACHED
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400">
                          Attachment: <span className="text-slate-200 font-mono">BGV_Clearance_Infosys_AnanyaKrishnan.pdf (1.4MB)</span> • FirstAdvantage Corp
                        </p>
                      </div>
                    </div>
                    <div className="text-right text-[10px] text-slate-400 font-mono">
                      Ref: FA-2026-BGV-9941
                    </div>
                  </div>
                </div>

                {/* Form Footer */}
                <div className="px-4 py-2 border-t border-slate-800 bg-slate-950/70 flex items-center justify-between text-xs">
                  <span className="text-emerald-400 text-[11px] flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>All 32 mandatory compliance fields validated without errors</span>
                  </span>
                  <div className="flex space-x-2">
                    <button className="px-3 py-1 rounded bg-slate-800 text-slate-300 text-[11px]">Save Draft</button>
                    <button className="px-3.5 py-1 rounded bg-blue-600 text-white font-semibold text-[11px] flex items-center gap-1 shadow-md shadow-blue-500/30">
                      <span>Submit to PMO Review</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ---------------- SCENE 3: EXCEL SMART BATCH PARSER ---------------- */}
            {currentChapter.id === 'excel_sync' && (
              <div className="w-full h-full flex flex-col max-w-4xl mx-auto bg-slate-900 border border-emerald-500/40 rounded-xl overflow-hidden shadow-2xl animate-fadeIn">
                {/* Excel Ingestion Header */}
                <div className="px-4 py-2.5 bg-gradient-to-r from-emerald-950 to-slate-900 border-b border-emerald-500/30 flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                    <span className="font-bold text-xs sm:text-sm text-white">
                      Excel Bulk Ingestion Engine (.xlsx / Apache POI Synchronized)
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-500/20 text-emerald-300 font-semibold border border-emerald-500/30">
                      32-Column Strict Schema
                    </span>
                  </div>
                  <span className="text-[11px] text-emerald-300 font-mono">File: AB_SUTRA_Q4_Batch_Intake.xlsx</span>
                </div>

                {/* Batch File Stats */}
                <div className="bg-slate-950/60 px-4 py-2 border-b border-slate-800 flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-1.5 text-slate-300">
                      <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                      <span>Parsed: <strong className="text-white">4 Contractor Rows</strong></span>
                    </div>
                    <div className="flex items-center space-x-1.5 text-slate-300">
                      <span>Columns: <strong className="text-white">32 / 32 Standardized</strong></span>
                    </div>
                    <div className="flex items-center space-x-1.5 text-emerald-400">
                      <span>Errors: <strong className="text-emerald-300">0 Cells Flagged</strong></span>
                    </div>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">CRC32: 9b8821f0</span>
                </div>

                {/* Spreadsheet Grid Table */}
                <div className="p-3 flex-1 overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-950 text-slate-400 text-[10px] uppercase font-semibold border-b border-slate-800">
                      <tr>
                        <th className="py-2 px-2.5">Row</th>
                        <th className="py-2 px-2.5">Candidate Legal Name</th>
                        <th className="py-2 px-2.5">Supplier Partner</th>
                        <th className="py-2 px-2.5">Job Role / Level</th>
                        <th className="py-2 px-2.5">PO Line</th>
                        <th className="py-2 px-2.5">Work Location</th>
                        <th className="py-2 px-2.5">Validation Audit</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800 text-[11px]">
                      <tr className="hover:bg-slate-800/40 bg-emerald-950/10">
                        <td className="py-2 px-2.5 font-mono text-slate-400">#1</td>
                        <td className="py-2 px-2.5 font-semibold text-white">Ananya Krishnan</td>
                        <td className="py-2 px-2.5 text-slate-300">Infosys Ltd</td>
                        <td className="py-2 px-2.5 text-slate-300">Sr. Cloud Architect</td>
                        <td className="py-2 px-2.5 font-mono text-slate-400">PO-9941-A</td>
                        <td className="py-2 px-2.5 text-slate-400">Bangalore BLR</td>
                        <td className="py-2 px-2.5"><span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-semibold">VALID (32/32)</span></td>
                      </tr>
                      <tr className="hover:bg-slate-800/40">
                        <td className="py-2 px-2.5 font-mono text-slate-400">#2</td>
                        <td className="py-2 px-2.5 font-semibold text-white">Kevin O'Connor</td>
                        <td className="py-2 px-2.5 text-slate-300">Wipro Technologies</td>
                        <td className="py-2 px-2.5 text-slate-300">Kubernetes DevOps</td>
                        <td className="py-2 px-2.5 font-mono text-slate-400">PO-9941-B</td>
                        <td className="py-2 px-2.5 text-slate-400">London Canary</td>
                        <td className="py-2 px-2.5"><span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-semibold">VALID (32/32)</span></td>
                      </tr>
                      <tr className="hover:bg-slate-800/40">
                        <td className="py-2 px-2.5 font-mono text-slate-400">#3</td>
                        <td className="py-2 px-2.5 font-semibold text-white">Priya Nambiar</td>
                        <td className="py-2 px-2.5 text-slate-300">Tata Consultancy</td>
                        <td className="py-2 px-2.5 text-slate-300">Data Platform Eng</td>
                        <td className="py-2 px-2.5 font-mono text-slate-400">PO-9942-C</td>
                        <td className="py-2 px-2.5 text-slate-400">Bangalore BLR</td>
                        <td className="py-2 px-2.5"><span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-semibold">VALID (32/32)</span></td>
                      </tr>
                      <tr className="hover:bg-slate-800/40">
                        <td className="py-2 px-2.5 font-mono text-slate-400">#4</td>
                        <td className="py-2 px-2.5 font-semibold text-white">Marcus Vance</td>
                        <td className="py-2 px-2.5 text-slate-300">Cognizant Global</td>
                        <td className="py-2 px-2.5 text-slate-300">Cybersecurity Lead</td>
                        <td className="py-2 px-2.5 font-mono text-slate-400">PO-9943-D</td>
                        <td className="py-2 px-2.5 text-slate-400">New York 5th</td>
                        <td className="py-2 px-2.5"><span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-semibold">VALID (32/32)</span></td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Footer action bar */}
                <div className="px-4 py-2 border-t border-slate-800 bg-slate-950/70 flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-2 text-slate-400 text-[11px]">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Schema matched to AB-SUTRA Enterprise Dictionary v4.2</span>
                  </div>
                  <button className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-600/30 flex items-center gap-1.5">
                    <span>Ingest All 4 Records into PMO Queue</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            {/* ---------------- SCENE 4: PMO & HIRING MANAGER WORKDAY PUSH ---------------- */}
            {currentChapter.id === 'pmo_governance' && (
              <div className="w-full h-full flex flex-col max-w-4xl mx-auto bg-slate-900 border border-indigo-500/40 rounded-xl overflow-hidden shadow-2xl animate-fadeIn">
                {/* PMO Review Header */}
                <div className="px-4 py-2.5 bg-gradient-to-r from-indigo-950 to-slate-900 border-b border-indigo-500/30 flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <UserCheck className="w-4 h-4 text-indigo-400" />
                    <span className="font-bold text-xs sm:text-sm text-white">
                      PMO &amp; Hiring Manager Review: DEMAND-2026-8841
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] bg-indigo-500/20 text-indigo-300 font-semibold border border-indigo-500/30">
                      Autonomous Governance
                    </span>
                  </div>
                  <span className="text-[11px] text-indigo-300 font-mono">Candidate: Ananya Krishnan</span>
                </div>

                <div className="p-3.5 space-y-3 flex-1 overflow-y-auto">
                  {/* Score & Funding Metrics Card */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                    <div className="bg-slate-950 border border-slate-800 rounded-lg p-2.5">
                      <div className="text-[10px] text-slate-400 font-medium">Technical Evaluation Score</div>
                      <div className="text-xl font-bold text-emerald-400 mt-0.5 flex items-center gap-1.5">
                        <span>92 / 100</span>
                        <span className="text-[10px] font-normal text-emerald-300 px-1.5 py-0.2 rounded bg-emerald-500/20">Strong Hire</span>
                      </div>
                      <p className="text-[10px] text-slate-400 mt-1">Interviewer: S. Ramanathan (Lead Architect)</p>
                    </div>

                    <div className="bg-slate-950 border border-slate-800 rounded-lg p-2.5">
                      <div className="text-[10px] text-slate-400 font-medium">SOW Budget Allocation</div>
                      <div className="text-xl font-bold text-white mt-0.5">$145,000 <span className="text-xs text-slate-400">Available</span></div>
                      <p className="text-[10px] text-slate-400 mt-1">PO-AB-77492-EXP • Division: Core Banking</p>
                    </div>

                    <div className="bg-slate-950 border border-emerald-500/30 rounded-lg p-2.5">
                      <div className="text-[10px] text-emerald-400 font-medium">Workday Synchronization</div>
                      <div className="text-sm font-bold text-emerald-300 mt-1 flex items-center gap-1">
                        <Check className="w-4 h-4 text-emerald-400" />
                        <span>Ready for Auto-Push</span>
                      </div>
                      <p className="text-[10px] text-slate-400 mt-0.5 font-mono">ID: WD-CONT-2026-00481</p>
                    </div>
                  </div>

                  {/* 6-Point Compliance Checklist */}
                  <div className="bg-slate-950 border border-slate-800 rounded-lg p-3">
                    <div className="text-xs font-bold text-white mb-2 flex items-center justify-between">
                      <span>Mandatory 6-Point PMO Compliance Checklist</span>
                      <span className="text-[10px] text-emerald-400 font-medium">6 of 6 Verified (100%)</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                      <div className="flex items-center space-x-2 bg-slate-900/80 p-1.5 rounded border border-emerald-500/30">
                        <div className="w-4 h-4 rounded bg-emerald-500 flex items-center justify-center text-slate-950">
                          <Check className="w-3 h-3 stroke-[3]" />
                        </div>
                        <span className="text-slate-200">7-Year BGV cleared by FirstAdvantage</span>
                      </div>

                      <div className="flex items-center space-x-2 bg-slate-900/80 p-1.5 rounded border border-emerald-500/30">
                        <div className="w-4 h-4 rounded bg-emerald-500 flex items-center justify-center text-slate-950">
                          <Check className="w-3 h-3 stroke-[3]" />
                        </div>
                        <span className="text-slate-200">Technical test score &gt; 85% benchmark</span>
                      </div>

                      <div className="flex items-center space-x-2 bg-slate-900/80 p-1.5 rounded border border-emerald-500/30">
                        <div className="w-4 h-4 rounded bg-emerald-500 flex items-center justify-center text-slate-950">
                          <Check className="w-3 h-3 stroke-[3]" />
                        </div>
                        <span className="text-slate-200">SOW funding &amp; Cost Center verified</span>
                      </div>

                      <div className="flex items-center space-x-2 bg-slate-900/80 p-1.5 rounded border border-emerald-500/30">
                        <div className="w-4 h-4 rounded bg-emerald-500 flex items-center justify-center text-slate-950">
                          <Check className="w-3 h-3 stroke-[3]" />
                        </div>
                        <span className="text-slate-200">14-day non-billable KT acknowledged ($5,420)</span>
                      </div>

                      <div className="flex items-center space-x-2 bg-slate-900/80 p-1.5 rounded border border-emerald-500/30">
                        <div className="w-4 h-4 rounded bg-emerald-500 flex items-center justify-center text-slate-950">
                          <Check className="w-3 h-3 stroke-[3]" />
                        </div>
                        <span className="text-slate-200">IT security &amp; NDA compliance executed</span>
                      </div>

                      <div className="flex items-center space-x-2 bg-slate-900/80 p-1.5 rounded border border-emerald-500/30">
                        <div className="w-4 h-4 rounded bg-emerald-500 flex items-center justify-center text-slate-950">
                          <Check className="w-3 h-3 stroke-[3]" />
                        </div>
                        <span className="text-slate-200">Manager delegation / sign-off approved</span>
                      </div>
                    </div>
                  </div>

                  {/* Generated Credentials Preview */}
                  <div className="bg-gradient-to-r from-blue-950/40 via-indigo-950/40 to-slate-950 border border-blue-500/30 rounded-lg p-2.5 flex items-center justify-between text-xs">
                    <div>
                      <div className="text-[10px] text-blue-300 font-semibold uppercase tracking-wider">Automated Workday Identity Staging</div>
                      <div className="flex items-center space-x-3 mt-1">
                        <span className="font-mono text-white text-[11px]">WD-CONT-2026-00481</span>
                        <span className="text-slate-500">•</span>
                        <span className="text-blue-300 font-mono text-[11px]">ananya.krishnan@ab.com</span>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] bg-blue-500/20 text-blue-300 font-medium">Ready to Dispatch</span>
                  </div>
                </div>

                {/* Footer action bar */}
                <div className="px-4 py-2 border-t border-slate-800 bg-slate-950/70 flex items-center justify-between text-xs">
                  <div className="flex space-x-2">
                    <button className="px-3 py-1 rounded bg-slate-800 text-slate-400 text-[11px]">Request Clarification</button>
                    <button className="px-3 py-1 rounded bg-rose-950/40 text-rose-300 border border-rose-800/40 text-[11px]">Reject</button>
                  </div>
                  <button className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md shadow-indigo-600/30 flex items-center gap-1.5">
                    <UserCheck className="w-3.5 h-3.5" />
                    <span>Approve &amp; Push to Workday</span>
                  </button>
                </div>
              </div>
            )}

            {/* ---------------- SCENE 5: 14-POINT OFFBOARDING PROTOCOL ---------------- */}
            {currentChapter.id === 'offboarding' && (
              <div className="w-full h-full flex flex-col max-w-4xl mx-auto bg-slate-900 border border-rose-500/40 rounded-xl overflow-hidden shadow-2xl animate-fadeIn">
                {/* Offboarding Header */}
                <div className="px-4 py-2.5 bg-gradient-to-r from-rose-950 to-slate-900 border-b border-rose-500/30 flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Laptop className="w-4 h-4 text-rose-400" />
                    <span className="font-bold text-xs sm:text-sm text-white">
                      14-Field Offboarding &amp; Hardware Asset Recovery Protocol
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] bg-rose-500/20 text-rose-300 font-semibold border border-rose-500/30">
                      Audit Compliant
                    </span>
                  </div>
                  <span className="text-[11px] text-rose-300 font-mono">Resource: Vikramaditya Rao (WD-884192)</span>
                </div>

                <div className="p-3.5 space-y-3 flex-1 overflow-y-auto">
                  {/* Departure Reason & LWD */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
                    <div>
                      <label className="text-[10px] text-slate-400 font-medium">Last Working Day (LWD)</label>
                      <input 
                        readOnly 
                        value="30/10/2026" 
                        className="w-full mt-1 bg-slate-950 border border-slate-700 rounded px-2.5 py-1 text-slate-200 font-mono text-[11px]"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-400 font-medium">Departure Reason</label>
                      <input 
                        readOnly 
                        value="Project Completion / SOW Delivered" 
                        className="w-full mt-1 bg-slate-950 border border-slate-700 rounded px-2.5 py-1 text-slate-200 text-[11px]"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-400 font-medium">Workday Contractor ID</label>
                      <input 
                        readOnly 
                        value="WD-CONT-2024-00192" 
                        className="w-full mt-1 bg-slate-950 border border-slate-700 rounded px-2.5 py-1 text-slate-200 font-mono text-[11px]"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-400 font-medium">PO Line Reconciliation</label>
                      <input 
                        readOnly 
                        value="PO-AB-6612 - Closed" 
                        className="w-full mt-1 bg-slate-950 border border-slate-700 rounded px-2.5 py-1 text-emerald-400 font-mono text-[11px]"
                      />
                    </div>
                  </div>

                  {/* IT Hardware & Access Neutralization */}
                  <div className="bg-slate-950 border border-slate-800 rounded-lg p-2.5 space-y-2">
                    <div className="text-xs font-bold text-white flex items-center justify-between">
                      <span>IT Hardware &amp; Security Neutralization Checklist</span>
                      <span className="text-[10px] text-emerald-400 font-mono">14 of 14 Points Clear</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                      <div className="bg-slate-900 p-2 rounded border border-slate-700">
                        <div className="text-[10px] text-slate-400">Corporate Laptop Recovery</div>
                        <div className="font-semibold text-slate-200 mt-0.5 text-[11px]">MBP-2024-X99281</div>
                        <div className="text-[10px] text-emerald-400 mt-1 flex items-center gap-1">
                          <Check className="w-3 h-3" />
                          <span>Hardware Inspected (Clean)</span>
                        </div>
                      </div>

                      <div className="bg-slate-900 p-2 rounded border border-slate-700">
                        <div className="text-[10px] text-slate-400">Campus Access Badge</div>
                        <div className="font-semibold text-slate-200 mt-0.5 text-[11px]">BADGE-BLR-4421</div>
                        <div className="text-[10px] text-rose-400 mt-1 flex items-center gap-1">
                          <Check className="w-3 h-3" />
                          <span>Revoked / Neutralized</span>
                        </div>
                      </div>

                      <div className="bg-slate-900 p-2 rounded border border-slate-700">
                        <div className="text-[10px] text-slate-400">Timesheet Freeze</div>
                        <div className="font-semibold text-slate-200 mt-0.5 text-[11px]">Status: Locked</div>
                        <div className="text-[10px] text-emerald-400 mt-1 flex items-center gap-1">
                          <Check className="w-3 h-3" />
                          <span>Zero Post-LWD Billing</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Workday Termination Screenshot Upload Card */}
                  <div className="bg-gradient-to-r from-slate-950 to-slate-900 border border-blue-500/30 rounded-lg p-2.5 flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded bg-blue-500/20 text-blue-400 flex items-center justify-center">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-white flex items-center gap-2">
                          <span>Workday Termination Screenshot Proof</span>
                          <span className="px-1.5 py-0.2 rounded text-[9px] bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                            UPLOADED &amp; VERIFIED
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400">
                          File: <span className="text-slate-200 font-mono">Workday_Term_WD884192_Oct2026.png (2.1MB)</span>
                        </p>
                      </div>
                    </div>
                    <button className="px-2.5 py-1 rounded bg-slate-800 text-slate-300 hover:text-white text-[10px] border border-slate-700">
                      View Attachment
                    </button>
                  </div>
                </div>

                {/* Footer action bar */}
                <div className="px-4 py-2 border-t border-slate-800 bg-slate-950/70 flex items-center justify-between text-xs">
                  <span className="text-emerald-400 text-[11px] flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Risk mitigation validated: Access terminated across all 18 enterprise clusters</span>
                  </span>
                  <button className="px-4 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-md shadow-rose-600/30 flex items-center gap-1.5">
                    <span>Execute Offboarding Protocol</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            )}

            {/* ---------------- SCENE 6: IMMUTABLE AUDIT TRAIL & COMMUNICATIONS OUTBOX ---------------- */}
            {currentChapter.id === 'audit_outbox' && (
              <div className="w-full h-full flex flex-col max-w-4xl mx-auto bg-slate-900 border border-cyan-500/40 rounded-xl overflow-hidden shadow-2xl animate-fadeIn">
                {/* Outbox Header */}
                <div className="px-4 py-2.5 bg-gradient-to-r from-cyan-950 to-slate-900 border-b border-cyan-500/30 flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Mail className="w-4 h-4 text-cyan-400" />
                    <span className="font-bold text-xs sm:text-sm text-white">
                      Dispatched Corporate Email Outbox &amp; Tamper-Evident SHA-256 Audit Trail
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] bg-cyan-500/20 text-cyan-300 font-semibold border border-cyan-500/30">
                      100% Auditable
                    </span>
                  </div>
                  <span className="text-[11px] text-cyan-300 font-mono">18 Dispatch Records</span>
                </div>

                <div className="p-3.5 space-y-3 flex-1 overflow-y-auto">
                  {/* Live HTML Email Preview Card */}
                  <div className="bg-slate-950 border border-slate-800 rounded-lg overflow-hidden shadow-md">
                    <div className="px-3 py-1.5 bg-slate-900 border-b border-slate-800 flex items-center justify-between text-xs">
                      <div className="flex items-center space-x-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                        <span className="font-semibold text-white text-[11px]">Corporate Email Dispatch (HTML Generated)</span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono">Dispatched: 2 mins ago</span>
                    </div>

                    <div className="p-3 space-y-1.5 text-xs">
                      <div className="text-[11px] text-slate-400">
                        <strong className="text-slate-300">To:</strong> ananya.krishnan@ab.com, suresh.k@infosys.com, pmo-governance@ab.com
                      </div>
                      <div className="text-[11px] text-slate-400">
                        <strong className="text-slate-300">Subject:</strong> <span className="text-cyan-300 font-semibold">[AB-SUTRA] APPROVED: Contractor Onboarding DEMAND-2026-8841 (Workday ID: WD-CONT-00481)</span>
                      </div>

                      {/* Rendered HTML snippet */}
                      <div className="mt-2 p-2.5 bg-slate-900/90 rounded border border-slate-800 space-y-1.5">
                        <div className="text-[11px] text-slate-200">
                          Dear <strong>Ananya Krishnan</strong> &amp; <strong>Infosys Team</strong>,
                        </div>
                        <p className="text-[10px] text-slate-400 leading-relaxed">
                          Your contingent workforce requisition for <strong>DEMAND-2026-8841</strong> has been successfully reviewed and approved by the PMO Lead. Workday contractor profile has been provisioned under Worker ID <strong className="text-white font-mono">WD-CONT-00481</strong>.
                        </p>
                        <div className="pt-1 flex items-center space-x-2">
                          <span className="px-2 py-0.5 rounded bg-blue-600 text-white text-[9px] font-bold">Access Day-1 Pass</span>
                          <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[9px]">View IT Hardware Tracking</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Tamper-Evident SHA-256 Audit Log */}
                  <div className="bg-slate-950 border border-slate-800 rounded-lg p-2.5">
                    <div className="text-xs font-bold text-white mb-1.5 flex items-center justify-between">
                      <div className="flex items-center space-x-1.5">
                        <Fingerprint className="w-3.5 h-3.5 text-indigo-400" />
                        <span>SHA-256 Cryptographic Audit Hash Verification</span>
                      </div>
                      <span className="text-[10px] text-emerald-400 font-mono">Status: Verified Unbroken</span>
                    </div>

                    <div className="bg-slate-900 p-2 rounded border border-slate-800 font-mono text-[10px] text-slate-400 truncate">
                      Hash: <span className="text-indigo-300">e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855</span>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1">
                      Zero tampering guarantee across all 18 lifecycle state transitions, manager sign-offs, and email dispatches.
                    </p>
                  </div>
                </div>

                {/* Footer action bar */}
                <div className="px-4 py-2 border-t border-slate-800 bg-slate-950/70 flex items-center justify-between text-xs">
                  <span className="text-slate-400 text-[11px]">
                    Exportable to Excel with full stakeholder email body copies
                  </span>
                  <button className="px-3.5 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs shadow-md shadow-cyan-600/30 flex items-center gap-1.5">
                    <FileSpreadsheet className="w-3.5 h-3.5" />
                    <span>Download Full Audit Report (.xlsx)</span>
                  </button>
                </div>
              </div>
            )}

            {/* ---------------- ANIMATED SIMULATED CURSOR & INTERACTION POINTER ---------------- */}
            <div 
              className="absolute pointer-events-none transition-all duration-300 ease-out z-30"
              style={{
                left: `${cursorState.x}%`,
                top: `${cursorState.y}%`,
                transform: 'translate(-5px, -5px)'
              }}
            >
              {/* Cursor SVG */}
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="drop-shadow-lg">
                <path 
                  d="M5 3L19 12L12 14L9 21L5 3Z" 
                  fill="#ffffff" 
                  stroke="#000000" 
                  strokeWidth="1.5" 
                  strokeLinejoin="round" 
                />
              </svg>

              {/* Pulsating click wave */}
              <span className="absolute -top-1 -left-1 w-6 h-6 rounded-full bg-blue-500/40 animate-ping"></span>

              {/* Dynamic activity tooltip pill */}
              <div className="ml-5 -mt-3 bg-slate-900/95 text-white text-[10px] font-semibold px-2 py-0.5 rounded-full border border-blue-400/50 shadow-xl whitespace-nowrap flex items-center space-x-1">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse"></span>
                <span>{cursorState.label}</span>
              </div>
            </div>

          </div>

          {/* Subtitles / Audio Captions Overlay at Bottom of Screen */}
          <div className="px-5 py-2.5 bg-slate-950/90 border-t border-slate-800/80 backdrop-blur-sm flex items-center justify-between z-10">
            <div className="flex items-center space-x-2 text-xs truncate max-w-4xl">
              <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 font-bold text-[10px] uppercase tracking-wider shrink-0">
                {currentChapter.shortTitle}
              </span>
              <p className="text-slate-300 text-xs truncate">
                "{currentChapter.narration}"
              </p>
            </div>

            <div className="flex items-center space-x-2 shrink-0">
              <span className="text-[11px] font-mono text-slate-400">
                {Math.floor(elapsedTotalSec / 60)}:{String(Math.floor(elapsedTotalSec % 60)).padStart(2, '0')} / {Math.floor(totalDemoDurationSec / 60)}:{String(Math.floor(totalDemoDurationSec % 60)).padStart(2, '0')}
              </span>
            </div>
          </div>
        </div>

        {/* =========================================================================
            BOTTOM TIMELINE & VIDEO CONTROLS BAR
           ========================================================================= */}
        <div className="p-4 bg-slate-900 space-y-3">
          {/* Timeline Chapter Progress Bars */}
          <div className="grid grid-cols-6 gap-1.5">
            {DEMO_CHAPTERS.map((ch, idx) => {
              const isPast = idx < safeChapterIdx;
              const isCurrent = idx === safeChapterIdx;
              const fillPct = isPast ? 100 : isCurrent ? currentProgressRatio * 100 : 0;

              return (
                <button
                  key={ch.id}
                  onClick={() => handleSelectChapter(idx)}
                  className="group flex flex-col text-left focus:outline-none"
                  title={`Jump to Scene ${idx + 1}: ${ch.title}`}
                >
                  <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden mb-1">
                    <div 
                      className={`h-full transition-all duration-100 ${
                        isCurrent 
                          ? 'bg-gradient-to-r from-blue-500 to-cyan-400' 
                          : isPast 
                            ? 'bg-blue-600' 
                            : 'bg-transparent'
                      }`}
                      style={{ width: `${fillPct}%` }}
                    />
                  </div>
                  <span className={`text-[10px] font-medium truncate ${
                    isCurrent ? 'text-blue-300 font-bold' : isPast ? 'text-slate-300' : 'text-slate-500'
                  }`}>
                    {ch.shortTitle}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Playback Controls Row */}
          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center space-x-2">
              {/* Play / Pause */}
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="h-9 w-9 rounded-lg bg-blue-600 hover:bg-blue-500 text-white flex items-center justify-center transition shadow-md shadow-blue-600/30"
                title={isPlaying ? 'Pause' : 'Play'}
              >
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
              </button>

              {/* Rewind 5s */}
              <button
                onClick={() => handleSkip(-5)}
                className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
                title="Rewind 5 seconds"
              >
                <SkipBack className="w-4 h-4" />
              </button>

              {/* Forward 5s */}
              <button
                onClick={() => handleSkip(5)}
                className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
                title="Skip forward 5 seconds"
              >
                <SkipForward className="w-4 h-4" />
              </button>

              {/* Restart */}
              <button
                onClick={() => {
                  setCurrentChapterIdx(0);
                  setChapterElapsedSec(0);
                  setIsPlaying(true);
                }}
                className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
                title="Restart from beginning"
              >
                <RotateCcw className="w-4 h-4" />
              </button>

              {/* Speed toggle */}
              <div className="flex items-center space-x-1 pl-2">
                {[1, 1.25, 1.5].map((speed) => (
                  <button
                    key={speed}
                    onClick={() => setPlaybackSpeed(speed)}
                    className={`px-2 py-0.5 rounded text-[10px] font-semibold transition ${
                      playbackSpeed === speed 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {speed}x
                  </button>
                ))}
              </div>
            </div>

            {/* Audio Voiceover Toggle */}
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setIsVoiceoverMuted(!isVoiceoverMuted)}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition border ${
                  isVoiceoverMuted
                    ? 'bg-slate-800 text-slate-400 border-slate-700'
                    : 'bg-indigo-950/50 text-indigo-300 border-indigo-700/50'
                }`}
                title={isVoiceoverMuted ? 'Unmute voiceover narration' : 'Mute voiceover narration'}
              >
                {isVoiceoverMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5 text-indigo-400" />}
                <span className="hidden sm:inline">{isVoiceoverMuted ? 'Voiceover Muted' : 'Voiceover Narration Active'}</span>
              </button>

              {/* Direct Launch Button */}
              {onNavigateToFeature && (
                <button
                  onClick={() => {
                    onClose();
                    onNavigateToFeature(currentChapter.actionFeature);
                  }}
                  className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white transition shadow-sm flex items-center space-x-1"
                >
                  <span>Open {currentChapter.shortTitle}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

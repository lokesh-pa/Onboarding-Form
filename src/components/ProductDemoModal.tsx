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
  ExternalLink
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
    shortTitle: '1. Overview',
    durationSec: 10,
    roleContext: 'Admin & Executive Governance',
    tagline: 'End-to-end governance of global contingent workforce lifecycles',
    description: 'Unified command center tracking SLA adherence, same-day onboarding velocity, and zero billing gap loss across vendor partners.',
    narration: 'Welcome to AB Sutra, the enterprise contingent workforce governance portal. Our executive dashboard delivers unified visibility across supplier submissions, PMO sign-offs, and automated Workday synchronization with real-time financial savings tracking.',
    keyHighlights: [
      'Same-day SLA velocity monitoring & risk alerts',
      '$5,420 captured knowledge transition efficiency',
      'Instant persona switching: Supplier, PMO/Manager, and Admin'
    ],
    actionLabel: 'Explore Dashboard View',
    actionFeature: 'role_pmo'
  },
  {
    id: 'onboarding',
    title: 'Vendor Partner 32-Field Onboarding & BGV Verification',
    shortTitle: '2. Onboarding',
    durationSec: 12,
    roleContext: 'Supplier (Vendor Partner)',
    tagline: 'Guaranteed compliance with zero-omission form validation',
    description: 'Suppliers submit prospective contractors with automated 7-year BGV email proof, replacement resource knowledge-transition alerts, and instant field auditing.',
    narration: 'Suppliers initiate onboarding with thirty-two mandatory enterprise fields. The built-in compliance engine audits background verification clearance proof and flags billing start date gaps for replacement contractors before submission.',
    keyHighlights: [
      'Mandatory BGV confirmation email attachment verification',
      'Automated date-gap policy alert for replacement resources',
      'Dynamic field validation preventing incomplete submissions'
    ],
    actionLabel: 'Launch Onboarding Form',
    actionFeature: 'onboarding'
  },
  {
    id: 'excel_sync',
    title: 'Excel Smart Parser & Bulk Batch Synchronization',
    shortTitle: '3. Excel Sync',
    durationSec: 10,
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
    title: 'Autonomous PMO & Hiring Manager Review',
    shortTitle: '4. PMO Review',
    durationSec: 12,
    roleContext: 'PMO Governance Lead / Hiring Manager',
    tagline: 'Single-click approvals with Workday profile initiation',
    description: 'Managers verify technical evaluation scores, review SOW alignment, commit target onboarding dates, and push directly into Workday with automated corporate email generation.',
    narration: 'PMO leads and Hiring Managers review submissions with complete autonomy. Evaluate technical test scores, verify purchase order allocations, initiate Workday contractor profiles, and assign official AB.com email identities in seconds.',
    keyHighlights: [
      'Technical assessment & SOW funding verification',
      'Direct Workday ID push and official AB email allocation',
      'Autonomous backup authority delegation for out-of-office coverage'
    ],
    actionLabel: 'Review Pending Workday Queues',
    actionFeature: 'role_pmo'
  },
  {
    id: 'offboarding',
    title: '14-Field Offboarding & Hardware Asset Recovery Protocol',
    shortTitle: '5. Offboarding',
    durationSec: 11,
    roleContext: 'Enterprise Security & IT Operations',
    tagline: 'Total risk mitigation for departing contingent resources',
    description: 'Fourteen-point protocol ensuring corporate laptop retrieval, security badge neutralization, timesheet locks, and Workday termination screenshot auditing.',
    narration: 'When an assignment concludes, initiate offboarding using the fourteen-point protocol. Track IT laptop recovery, badge deactivation, timesheet locking, and upload verified Workday termination screenshots.',
    keyHighlights: [
      'Hardware serial and tracking number verification',
      'Mandatory Workday termination screenshot upload',
      'Automated email notification to IT asset recovery desk'
    ],
    actionLabel: 'Open Offboarding Form',
    actionFeature: 'offboarding'
  },
  {
    id: 'audit_outbox',
    title: 'Immutable Audit Trail & Stakeholder Email Dispatch',
    shortTitle: '6. Audit & Outbox',
    durationSec: 10,
    roleContext: 'Admin Governance & Compliance Office',
    tagline: '100% auditable communications and tamper-evident history',
    description: 'Complete cross-request outbox inspecting every dispatched corporate notification, paired with SHA-256 traceable audit logs and one-click Excel governance exports.',
    narration: 'Every state transition automatically generates an enterprise email dispatched to the sponsor, vendor delivery manager, and central PMO. Inspect the full communications outbox and export SHA-256 compliant audit records at any moment.',
    keyHighlights: [
      'Cross-stakeholder corporate email delivery outbox',
      'Immutable timestamped audit log with actor identity',
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

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const animFrameIdRef = useRef<number | null>(null);
  const lastTickTimeRef = useRef<number>(Date.now());
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);

  const totalChapters = DEMO_CHAPTERS.length;
  const safeChapterIdx = Math.max(0, Math.min(currentChapterIdx, totalChapters - 1));
  const currentChapter = DEMO_CHAPTERS[safeChapterIdx] || DEMO_CHAPTERS[0];

  // Total duration of entire demo
  const totalDemoDurationSec = DEMO_CHAPTERS.reduce((acc, c) => acc + (c?.durationSec || 10), 0);
  const elapsedTotalSec = DEMO_CHAPTERS.slice(0, safeChapterIdx).reduce((acc, c) => acc + (c?.durationSec || 10), 0) + chapterElapsedSec;

  // Speak narration when chapter changes (if voiceover enabled)
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
      // Prefer clear natural english voice if available
      const voices = window.speechSynthesis.getVoices();
      const preferred = voices.find(v => v.lang.startsWith('en') && (v.name.includes('Google') || v.name.includes('Natural') || v.name.includes('Samantha')));
      if (preferred) utterance.voice = preferred;
      window.speechSynthesis.speak(utterance);
    } else if (isVoiceoverMuted && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }, [safeChapterIdx, isVoiceoverMuted, isOpen, isPlaying, playbackSpeed, currentChapter]);

  // Clean up speech on unmount or close
  useEffect(() => {
    return () => {
      if ('speechSynthesis' in window) window.speechSynthesis.cancel();
      if (animFrameIdRef.current) cancelAnimationFrame(animFrameIdRef.current);
    };
  }, []);

  // Playback timer ticker
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
          // If there are more chapters, advance to next chapter safely
          if (safeChapterIdx < totalChapters - 1) {
            setTimeout(() => {
              setCurrentChapterIdx((c) => Math.min(c + 1, totalChapters - 1));
              setChapterElapsedSec(0);
            }, 0);
            return chapDuration;
          } else {
            // Reached the end of the entire demo
            setIsPlaying(false);
            return chapDuration;
          }
        }
        return nextElapsed;
      });
    }, 50);

    return () => clearInterval(interval);
  }, [isOpen, isPlaying, playbackSpeed, safeChapterIdx, currentChapter?.durationSec, totalChapters]);

  // Canvas drawing loop: draws high-definition animated mock UI and scene visuals
  const renderCanvasScene = useCallback((ctx: CanvasRenderingContext2D, width: number, height: number, progressRatio: number) => {
    ctx.clearRect(0, 0, width, height);

    // 1. Background dark enterprise theme
    const bgGrad = ctx.createLinearGradient(0, 0, width, height);
    bgGrad.addColorStop(0, '#0f172a'); // slate-900
    bgGrad.addColorStop(0.5, '#1e293b'); // slate-800
    bgGrad.addColorStop(1, '#090d16');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // Subtle grid pattern
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
    ctx.lineWidth = 1;
    for (let x = 0; x < width; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 0; y < height; y += 40) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // 2. Mock Browser Chrome
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(40, 30, width - 80, 48);
    // Window dots
    ctx.fillStyle = '#ef4444';
    ctx.beginPath(); ctx.arc(60, 54, 5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#f59e0b';
    ctx.beginPath(); ctx.arc(76, 54, 5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#10b981';
    ctx.beginPath(); ctx.arc(92, 54, 5, 0, Math.PI * 2); ctx.fill();

    // URL bar
    ctx.fillStyle = '#1e293b';
    ctx.roundRect ? ctx.roundRect(120, 42, width - 240, 24, 6) : ctx.fillRect(120, 42, width - 240, 24);
    ctx.fill();
    ctx.fillStyle = '#94a3b8';
    ctx.font = '11px Inter, system-ui, sans-serif';
    ctx.fillText('https://ab-sutra.workforce.internal/dashboard?persona=' + currentChapter.roleContext.toLowerCase().split(' ')[0], 140, 58);

    // 3. Application Main Top Navigation Bar
    const navY = 78;
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(40, navY, width - 80, 52);
    ctx.strokeStyle = '#334155';
    ctx.beginPath(); ctx.moveTo(40, navY + 52); ctx.lineTo(width - 40, navY + 52); ctx.stroke();

    // Logo
    ctx.fillStyle = '#2563eb';
    ctx.fillRect(60, navY + 11, 30, 30);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 14px Inter, system-ui, sans-serif';
    ctx.fillText('AB', 66, navY + 31);
    ctx.fillText('AB-SUTRA', 100, navY + 28);
    ctx.fillStyle = '#94a3b8';
    ctx.font = '10px Inter, system-ui, sans-serif';
    ctx.fillText('Workforce Lifecycle & Governance Portal', 100, navY + 41);

    // Active Role Pill
    ctx.fillStyle = currentChapterIdx === 1 ? '#2563eb' : currentChapterIdx === 3 ? '#4f46e5' : '#7c3aed';
    const rolePillW = 160;
    const rolePillX = width - 40 - rolePillW - 20;
    ctx.roundRect ? ctx.roundRect(rolePillX, navY + 12, rolePillW, 28, 6) : ctx.fillRect(rolePillX, navY + 12, rolePillW, 28);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 11px Inter, sans-serif';
    ctx.fillText('● ' + currentChapter.roleContext.split(' ')[0] + ' View', rolePillX + 16, navY + 30);

    // 4. Content Area Based on Chapter
    const contentY = navY + 68;
    const contentH = height - contentY - 80;

    if (currentChapter.id === 'intro') {
      // Scene 1: Executive KPI Cards & Velocity Meter
      const cardW = (width - 120) / 3;
      const kpis = [
        { label: 'Same-Day SLA Compliance', val: '98.4%', sub: 'Target: >95% within 24h', color: '#10b981' },
        { label: 'Knowledge Transition Gain', val: '$5,420', sub: 'Non-billable gap captured', color: '#3b82f6' },
        { label: 'Active Workday Profiles', val: '142 Active', sub: 'Zero pending sync bottlenecks', color: '#8b5cf6' }
      ];

      kpis.forEach((kpi, idx) => {
        const cx = 60 + idx * (cardW + 10);
        ctx.fillStyle = 'rgba(30, 41, 59, 0.7)';
        ctx.strokeStyle = 'rgba(51, 65, 85, 0.8)';
        ctx.roundRect ? ctx.roundRect(cx, contentY, cardW - 10, 110, 8) : ctx.fillRect(cx, contentY, cardW - 10, 110);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#94a3b8';
        ctx.font = '11px Inter, sans-serif';
        ctx.fillText(kpi.label, cx + 16, contentY + 30);

        ctx.fillStyle = kpi.color;
        ctx.font = 'bold 26px Inter, sans-serif';
        ctx.fillText(kpi.val, cx + 16, contentY + 65);

        ctx.fillStyle = '#64748b';
        ctx.font = '10px Inter, sans-serif';
        ctx.fillText(kpi.sub, cx + 16, contentY + 92);
      });

      // Flow visual below cards
      const flowY = contentY + 130;
      ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
      ctx.strokeStyle = '#334155';
      ctx.roundRect ? ctx.roundRect(60, flowY, width - 120, contentH - 140, 8) : ctx.fillRect(60, flowY, width - 120, contentH - 140);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#e2e8f0';
      ctx.font = 'bold 14px Inter, sans-serif';
      ctx.fillText('Live Contingent Request Pipeline', 80, flowY + 35);

      // Simulated Pipeline Rows
      const rows = [
        { id: 'CW-2026-089', name: 'Rohan Sharma', role: 'Full Stack Java Engineer', status: 'Approved → Workday Sync', color: '#10b981' },
        { id: 'CW-2026-090', name: 'Emily Watson', role: 'Cloud Platform Architect', status: 'Pending Manager Sign-off', color: '#f59e0b' },
        { id: 'CW-2026-091', name: 'Vikram Mehta', role: 'Data Governance Lead', status: 'BGV Screening Verified', color: '#3b82f6' }
      ];

      rows.forEach((row, rIdx) => {
        const ry = flowY + 55 + rIdx * 40;
        ctx.fillStyle = rIdx % 2 === 0 ? 'rgba(30, 41, 59, 0.4)' : 'transparent';
        ctx.fillRect(80, ry, width - 160, 32);

        ctx.fillStyle = '#cbd5e1';
        ctx.font = '11px monospace';
        ctx.fillText(row.id, 96, ry + 20);

        ctx.fillStyle = '#f8fafc';
        ctx.font = '11px Inter, sans-serif';
        ctx.fillText(row.name, 220, ry + 20);

        ctx.fillStyle = '#94a3b8';
        ctx.fillText(row.role, 360, ry + 20);

        ctx.fillStyle = row.color;
        ctx.font = 'bold 11px Inter, sans-serif';
        ctx.fillText('● ' + row.status, width - 260, ry + 20);
      });

    } else if (currentChapter.id === 'onboarding') {
      // Scene 2: 32-Field Onboarding & BGV Form
      const formW = width - 120;
      ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
      ctx.strokeStyle = '#3b82f6';
      ctx.lineWidth = 1.5;
      ctx.roundRect ? ctx.roundRect(60, contentY, formW, contentH, 8) : ctx.fillRect(60, contentY, formW, contentH);
      ctx.fill();
      ctx.stroke();

      // Form Header
      ctx.fillStyle = '#1e3a8a';
      ctx.fillRect(60, contentY, formW, 38);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 13px Inter, sans-serif';
      ctx.fillText('New Contractor Onboarding Initiation (32 Mandatory Compliance Fields)', 80, contentY + 24);

      // Form Fields Grid Simulation
      const fields = [
        { label: 'Demand / Job ID', val: 'DEMAND-77492', valid: true },
        { label: 'Full Legal Name', val: 'Ananya Krishnan', valid: true },
        { label: 'Supplier / Partner Name', val: 'Infosys Global Tech', valid: true },
        { label: 'Demand Type', val: 'Replacement', valid: true },
        { label: 'Tentative Joining Date', val: '2026-11-01', valid: true },
        { label: 'Billing Start Date', val: '2026-11-15 (14-day KT)', valid: true }
      ];

      fields.forEach((f, idx) => {
        const col = idx % 2;
        const row = Math.floor(idx / 2);
        const fx = 85 + col * ((formW - 50) / 2);
        const fy = contentY + 55 + row * 52;

        ctx.fillStyle = '#94a3b8';
        ctx.font = '10px Inter, sans-serif';
        ctx.fillText(f.label, fx, fy);

        ctx.fillStyle = '#1e293b';
        ctx.strokeStyle = f.valid ? '#10b981' : '#475569';
        ctx.roundRect ? ctx.roundRect(fx, fy + 6, (formW - 70) / 2, 26, 4) : ctx.fillRect(fx, fy + 6, (formW - 70) / 2, 26);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#f8fafc';
        ctx.font = '11px Inter, sans-serif';
        ctx.fillText(f.val, fx + 10, fy + 23);

        ctx.fillStyle = '#10b981';
        ctx.fillText('✓', fx + (formW - 70) / 2 - 18, fy + 23);
      });

      // Date Gap Warning Banner
      const bannerY = contentY + 215;
      ctx.fillStyle = 'rgba(245, 158, 11, 0.15)';
      ctx.strokeStyle = 'rgba(245, 158, 11, 0.5)';
      ctx.roundRect ? ctx.roundRect(85, bannerY, formW - 50, 48, 6) : ctx.fillRect(85, bannerY, formW - 50, 48);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#fbbf24';
      ctx.font = 'bold 11px Inter, sans-serif';
      ctx.fillText('⚠ Policy Verification Notice: Knowledge Transition Gap Detected', 100, bannerY + 20);
      ctx.font = '10px Inter, sans-serif';
      ctx.fillStyle = '#e2e8f0';
      ctx.fillText('Non-billable knowledge transition period captured as per agreement. Zero financial billing gap risk.', 100, bannerY + 36);

    } else if (currentChapter.id === 'excel_sync') {
      // Scene 3: Excel Batch Ingestion
      const sheetW = width - 120;
      ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
      ctx.strokeStyle = '#10b981';
      ctx.roundRect ? ctx.roundRect(60, contentY, sheetW, contentH, 8) : ctx.fillRect(60, contentY, sheetW, contentH);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#065f46';
      ctx.fillRect(60, contentY, sheetW, 38);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 13px Inter, sans-serif';
      ctx.fillText('Excel Bulk Ingestion Engine (.xlsx / Apache POI Synchronized)', 80, contentY + 24);

      // Table Header Row
      const tableHeaders = ['Row #', 'Candidate Name', 'Supplier', 'Job Role', 'PO Line', 'Validation Status'];
      const headerColsW = [60, 160, 160, 180, 120, 140];
      let hx = 75;
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(75, contentY + 50, sheetW - 30, 26);
      tableHeaders.forEach((h, hIdx) => {
        ctx.fillStyle = '#94a3b8';
        ctx.font = 'bold 10px Inter, sans-serif';
        ctx.fillText(h, hx + 10, contentY + 67);
        hx += headerColsW[hIdx] || 120;
      });

      // Sample Data Rows
      const batchRows = [
        ['1', 'Priya Nambiar', 'Tata Consultancy', 'Sr. Cloud Architect', 'PO-9941-A', 'PASSED (32/32)'],
        ['2', 'Kevin O\'Connor', 'Wipro Technologies', 'Kubernetes DevOps', 'PO-9941-B', 'PASSED (32/32)'],
        ['3', 'Aarav Gupta', 'Cognizant Global', 'Cybersecurity Specialist', 'PO-9942-C', 'PASSED (32/32)'],
        ['4', 'Maria Santos', 'Accenture Tech', 'React Native Lead', 'PO-9943-D', 'PASSED (32/32)']
      ];

      batchRows.forEach((r, rIdx) => {
        const ry = contentY + 80 + rIdx * 34;
        ctx.fillStyle = rIdx % 2 === 0 ? 'rgba(30, 41, 59, 0.5)' : 'rgba(15, 23, 42, 0.5)';
        ctx.fillRect(75, ry, sheetW - 30, 30);

        let rx = 75;
        r.forEach((cell, cIdx) => {
          ctx.fillStyle = cIdx === 5 ? '#10b981' : '#e2e8f0';
          ctx.font = cIdx === 5 ? 'bold 10px Inter, sans-serif' : '10px Inter, sans-serif';
          ctx.fillText(cell, rx + 10, ry + 19);
          rx += headerColsW[cIdx] || 120;
        });
      });

      // Batch Ingestion Success Footer
      const footerY = contentY + 230;
      ctx.fillStyle = '#064e3b';
      ctx.roundRect ? ctx.roundRect(75, footerY, sheetW - 30, 40, 6) : ctx.fillRect(75, footerY, sheetW - 30, 40);
      ctx.fill();
      ctx.fillStyle = '#34d399';
      ctx.font = 'bold 12px Inter, sans-serif';
      ctx.fillText('✓ 4/4 Records Parsed Successfully — Direct Sync with Workday Pre-Check Queue', 95, footerY + 25);

    } else if (currentChapter.id === 'pmo_governance') {
      // Scene 4: PMO & Hiring Manager Review & Workday Push
      const govW = width - 120;
      ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
      ctx.strokeStyle = '#6366f1';
      ctx.roundRect ? ctx.roundRect(60, contentY, govW, contentH, 8) : ctx.fillRect(60, contentY, govW, contentH);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#312e81';
      ctx.fillRect(60, contentY, govW, 38);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 13px Inter, sans-serif';
      ctx.fillText('PMO Governance & Workday Initiation Sign-Off', 80, contentY + 24);

      // Review Details Cards
      ctx.fillStyle = 'rgba(30, 41, 59, 0.7)';
      ctx.roundRect ? ctx.roundRect(80, contentY + 50, (govW - 50) / 2, 140, 6) : ctx.fillRect(80, contentY + 50, (govW - 50) / 2, 140);
      ctx.fill();

      ctx.fillStyle = '#818cf8';
      ctx.font = 'bold 11px Inter, sans-serif';
      ctx.fillText('Technical Evaluation & Approval', 95, contentY + 70);
      ctx.fillStyle = '#cbd5e1';
      ctx.font = '10px Inter, sans-serif';
      ctx.fillText('• Evaluation Score: 92/100 (Certified)', 95, contentY + 92);
      ctx.fillText('• SOW Rate Card Alignment: Confirmed', 95, contentY + 110);
      ctx.fillText('• PO Funding Duration: Validated (6 Mos)', 95, contentY + 128);
      ctx.fillText('• Status: Ready for Workday Contract Sync', 95, contentY + 146);

      // Workday Sync Simulation Box
      const rightX = 80 + (govW - 50) / 2 + 10;
      ctx.fillStyle = 'rgba(16, 185, 129, 0.1)';
      ctx.strokeStyle = 'rgba(16, 185, 129, 0.4)';
      ctx.roundRect ? ctx.roundRect(rightX, contentY + 50, (govW - 50) / 2, 140, 6) : ctx.fillRect(rightX, contentY + 50, (govW - 50) / 2, 140);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#34d399';
      ctx.font = 'bold 11px Inter, sans-serif';
      ctx.fillText('Workday Identity Allocation', rightX + 15, contentY + 70);
      ctx.fillStyle = '#e2e8f0';
      ctx.font = '10px Inter, sans-serif';
      ctx.fillText('• Generated Workday ID: WD-889104', rightX + 15, contentY + 92);
      ctx.fillText('• Allocated Identity: rohan.sharma@ab.com', rightX + 15, contentY + 110);
      ctx.fillText('• Target Start Committed: 2026-11-15', rightX + 15, contentY + 128);
      ctx.fillText('• Authority: Executed by PMO Lead', rightX + 15, contentY + 146);

      // Action Button in review
      ctx.fillStyle = '#22c55e';
      ctx.roundRect ? ctx.roundRect(80, contentY + 205, govW - 40, 40, 6) : ctx.fillRect(80, contentY + 205, govW - 40, 40);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 12px Inter, sans-serif';
      ctx.fillText('✓ Sign-Off & Push Profile Directly into Workday', 100, contentY + 230);

    } else if (currentChapter.id === 'offboarding') {
      // Scene 5: 14-Field Offboarding & Hardware Asset Recovery
      const offW = width - 120;
      ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
      ctx.strokeStyle = '#e11d48';
      ctx.roundRect ? ctx.roundRect(60, contentY, offW, contentH, 8) : ctx.fillRect(60, contentY, offW, contentH);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#881337';
      ctx.fillRect(60, contentY, offW, 38);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 13px Inter, sans-serif';
      ctx.fillText('14-Field Contingent Worker Offboarding & IT Asset Recovery Protocol', 80, contentY + 24);

      const items = [
        { title: 'Corporate Laptop Returned', val: 'Dell Latitude 7440 (SN: AB-LT-99214)', done: true },
        { title: 'Building Access Badge', val: 'Deactivated at Security Hub', done: true },
        { title: 'Workday Termination Screenshot', val: 'Verified & Archived in Audit Log', done: true },
        { title: 'Timesheet & Financial Lock', val: 'Final Invoicing Certified', done: true }
      ];

      items.forEach((item, idx) => {
        const iy = contentY + 55 + idx * 48;
        ctx.fillStyle = 'rgba(30, 41, 59, 0.6)';
        ctx.roundRect ? ctx.roundRect(80, iy, offW - 40, 40, 6) : ctx.fillRect(80, iy, offW - 40, 40);
        ctx.fill();

        ctx.fillStyle = item.done ? '#10b981' : '#f59e0b';
        ctx.font = 'bold 14px Inter, sans-serif';
        ctx.fillText(item.done ? '☑' : '☐', 95, iy + 25);

        ctx.fillStyle = '#f8fafc';
        ctx.font = 'bold 11px Inter, sans-serif';
        ctx.fillText(item.title, 120, iy + 20);

        ctx.fillStyle = '#94a3b8';
        ctx.font = '10px Inter, sans-serif';
        ctx.fillText(item.val, 120, iy + 33);
      });

    } else if (currentChapter.id === 'audit_outbox') {
      // Scene 6: Outbox & Audit History
      const audW = width - 120;
      ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
      ctx.strokeStyle = '#8b5cf6';
      ctx.roundRect ? ctx.roundRect(60, contentY, audW, contentH, 8) : ctx.fillRect(60, contentY, audW, contentH);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#4c1d95';
      ctx.fillRect(60, contentY, audW, 38);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 13px Inter, sans-serif';
      ctx.fillText('Communications Outbox & Cryptographic SHA-256 Audit Trail', 80, contentY + 24);

      // Outbox Email Entries
      const emails = [
        { to: 'robert.sponsor@ab.com', subject: 'Workforce Onboarding Initiated: Rohan Sharma', time: 'Just now' },
        { to: 'contingentworker.bgv@ab.com', subject: 'BGV Screening Notification: Emily Watson', time: '12m ago' },
        { to: 'it.assets@ab.com', subject: 'Offboarding Hardware Recovery Notice: Alex Stone', time: '1h ago' }
      ];

      emails.forEach((em, eIdx) => {
        const ey = contentY + 55 + eIdx * 45;
        ctx.fillStyle = 'rgba(30, 41, 59, 0.5)';
        ctx.roundRect ? ctx.roundRect(80, ey, audW - 40, 38, 4) : ctx.fillRect(80, ey, audW - 40, 38);
        ctx.fill();

        ctx.fillStyle = '#38bdf8';
        ctx.font = 'bold 10px Inter, sans-serif';
        ctx.fillText('✉ ' + em.to, 95, ey + 18);

        ctx.fillStyle = '#e2e8f0';
        ctx.font = '10px Inter, sans-serif';
        ctx.fillText(em.subject, 95, ey + 31);

        ctx.fillStyle = '#64748b';
        ctx.fillText(em.time, audW - 40, ey + 23);
      });

      // Audit Stamp
      const stampY = contentY + 205;
      ctx.fillStyle = 'rgba(139, 92, 246, 0.15)';
      ctx.roundRect ? ctx.roundRect(80, stampY, audW - 40, 45, 6) : ctx.fillRect(80, stampY, audW - 40, 45);
      ctx.fill();
      ctx.fillStyle = '#c084fc';
      ctx.font = 'bold 11px Inter, sans-serif';
      ctx.fillText('SHA-256 Audit Hash: e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855', 95, stampY + 22);
      ctx.fillStyle = '#94a3b8';
      ctx.font = '10px Inter, sans-serif';
      ctx.fillText('Zero tampering guarantee across all 18 lifecycle state transitions and email events.', 95, stampY + 37);
    }

    // 5. Simulated Animated Pointer / Cursor
    const cursorProgress = progressRatio;
    const cursorStartX = 80;
    const cursorStartY = height - 120;
    const cursorEndX = width - 180;
    const cursorEndY = contentY + 120;
    const currentCursorX = cursorStartX + (cursorEndX - cursorStartX) * cursorProgress;
    const currentCursorY = cursorStartY + (cursorEndY - cursorStartY) * Math.sin(cursorProgress * Math.PI);

    // Draw pointer
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(currentCursorX, currentCursorY);
    ctx.lineTo(currentCursorX + 10, currentCursorY + 14);
    ctx.lineTo(currentCursorX + 4, currentCursorY + 14);
    ctx.lineTo(currentCursorX + 2, currentCursorY + 20);
    ctx.lineTo(currentCursorX - 2, currentCursorY + 19);
    ctx.lineTo(currentCursorX, currentCursorY + 13);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Pulse effect at cursor
    ctx.strokeStyle = `rgba(59, 130, 246, ${0.8 - cursorProgress * 0.5})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(currentCursorX + 2, currentCursorY + 2, 8 + cursorProgress * 15, 0, Math.PI * 2);
    ctx.stroke();

    // 6. Subtitle Overlay at Bottom of Video Canvas
    const subH = 44;
    const subY = height - subH - 12;
    ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
    ctx.roundRect ? ctx.roundRect(80, subY, width - 160, subH, 8) : ctx.fillRect(80, subY, width - 160, subH);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.stroke();

    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 10px Inter, sans-serif';
    ctx.fillText(currentChapter.shortTitle.toUpperCase() + ' //', 95, subY + 18);

    ctx.fillStyle = '#ffffff';
    ctx.font = '11px Inter, sans-serif';
    // Truncate narration to fit nicely
    const captionText = currentChapter.narration.length > 120 
      ? currentChapter.narration.substring(0, 117) + '...'
      : currentChapter.narration;
    ctx.fillText(captionText, 95, subY + 34);

  }, [currentChapter, currentChapterIdx]);

  // RequestAnimationFrame rendering loop
  useEffect(() => {
    if (!isOpen) return;

    let animId: number;
    const render = () => {
      if (canvasRef.current) {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          const progressRatio = Math.min(1, Math.max(0, chapterElapsedSec / currentChapter.durationSec));
          renderCanvasScene(ctx, canvas.width, canvas.height, progressRatio);
        }
      }
      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    animFrameIdRef.current = animId;

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [isOpen, chapterElapsedSec, currentChapter?.durationSec, renderCanvasScene]);

  // Handle Fullscreen
  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

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

  // Video Export / Download Feature using Canvas MediaRecorder
  const handleExportVideo = async () => {
    if (!canvasRef.current || isRecording) return;

    try {
      setIsRecording(true);
      setRecordingProgress(0);
      recordedChunksRef.current = [];

      // Reset to beginning for full recording
      setCurrentChapterIdx(0);
      setChapterElapsedSec(0);
      setIsPlaying(true);

      const canvas = canvasRef.current;
      const stream = canvas.captureStream(30); // 30 FPS video stream

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

      // Record for entire demo duration at 1x speed
      const totalMs = totalDemoDurationSec * 1000;
      const startRecordTime = Date.now();
      
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
      alert('Video export could not start. You can preview all chapters directly inside the player.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4">
      <div 
        ref={containerRef}
        className="relative bg-slate-900 border border-slate-700 w-full max-w-5xl rounded-2xl shadow-2xl overflow-hidden flex flex-col text-slate-100 max-h-[96vh]"
      >
        {/* Top Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center space-x-3">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center shadow-md">
              <Video className="w-4 h-4 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-bold text-sm tracking-tight text-white">
                  AB-SUTRA Product Demo Video &amp; Interactive Walkthrough
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  HD 1080p
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Full 6-Scene Lifecycle
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Chapter {safeChapterIdx + 1} of {totalChapters}: {currentChapter?.title || ''}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleExportVideo}
              disabled={isRecording}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition border ${
                isRecording 
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 animate-pulse'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-500 shadow-sm'
              }`}
              title="Record and download this animated product demo as an offline WebM video file"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{isRecording ? `Recording (${recordingProgress}%)` : 'Export Video (.webm)'}</span>
            </button>

            <button
              onClick={toggleFullscreen}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
              title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen Video'}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
              title="Close Demo"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Video Canvas Container */}
        <div className="relative bg-slate-950 flex items-center justify-center aspect-video w-full overflow-hidden border-b border-slate-800">
          <canvas
            ref={canvasRef}
            width={960}
            height={540}
            className="w-full h-full object-contain"
          />

          {/* Quick Overlay controls on hover */}
          {!isPlaying && (
            <div className="absolute inset-0 bg-slate-950/40 flex items-center justify-center">
              <button
                onClick={() => setIsPlaying(true)}
                className="h-16 w-16 rounded-full bg-blue-600/90 hover:bg-blue-500 text-white flex items-center justify-center shadow-xl transition transform hover:scale-110"
              >
                <Play className="w-8 h-8 ml-1" />
              </button>
            </div>
          )}

          {/* Recording Badge */}
          {isRecording && (
            <div className="absolute top-4 left-4 bg-red-600/90 text-white text-[11px] font-bold px-3 py-1 rounded-full flex items-center space-x-2 shadow-lg animate-pulse">
              <span className="w-2 h-2 rounded-full bg-white"></span>
              <span>RECORDING VIDEO STREAM — {recordingProgress}%</span>
            </div>
          )}
        </div>

        {/* Timeline Scrubber & Player Controls */}
        <div className="bg-slate-900 px-5 py-3 border-b border-slate-800 flex flex-col space-y-2">
          {/* Chapter Division Scrubber Bar */}
          <div className="flex items-center space-x-1.5 w-full">
            {DEMO_CHAPTERS.map((chap, idx) => {
              const isPast = idx < safeChapterIdx;
              const isCurrent = idx === safeChapterIdx;
              const currentProgressPct = isCurrent ? (chapterElapsedSec / (chap?.durationSec || 10)) * 100 : isPast ? 100 : 0;

              return (
                <button
                  key={chap.id}
                  onClick={() => handleSelectChapter(idx)}
                  className="group relative flex-1 h-3 rounded-full bg-slate-800 overflow-hidden transition cursor-pointer hover:h-3.5"
                  title={`${chap.shortTitle}: ${chap.title}`}
                >
                  <div 
                    className={`h-full transition-all duration-75 ${
                      isPast 
                        ? 'bg-blue-600' 
                        : isCurrent 
                          ? 'bg-gradient-to-r from-blue-500 to-indigo-500' 
                          : 'bg-transparent'
                    }`}
                    style={{ width: `${currentProgressPct}%` }}
                  />
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition text-[9px] font-bold text-white bg-slate-950/60">
                    {chap.shortTitle}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Bottom Player Action Toolbar */}
          <div className="flex items-center justify-between text-xs text-slate-300 pt-1">
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white transition"
                title={isPlaying ? 'Pause Demo (Space)' : 'Play Demo (Space)'}
              >
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              </button>

              <button
                onClick={() => handleSkip(-5)}
                className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition"
                title="Rewind 5s"
              >
                <SkipBack className="w-4 h-4" />
              </button>

              <button
                onClick={() => handleSkip(5)}
                className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition"
                title="Skip forward 5s"
              >
                <SkipForward className="w-4 h-4" />
              </button>

              <button
                onClick={() => {
                  setCurrentChapterIdx(0);
                  setChapterElapsedSec(0);
                  setIsPlaying(true);
                }}
                className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition"
                title="Restart from beginning"
              >
                <RotateCcw className="w-4 h-4" />
              </button>

              <div className="h-4 w-px bg-slate-800 mx-1"></div>

              {/* Time display */}
              <span className="font-mono text-slate-400 text-[11px]">
                {Math.floor(elapsedTotalSec)}s / {totalDemoDurationSec}s
              </span>
            </div>

            {/* Middle: Active Tagline */}
            <div className="hidden md:flex items-center space-x-2 text-[11px] text-slate-400 font-medium">
              <Sparkles className="w-3.5 h-3.5 text-blue-400" />
              <span className="text-slate-300">{currentChapter?.tagline || ''}</span>
            </div>

            {/* Right: Audio Narration, Speed & Live Action */}
            <div className="flex items-center space-x-2">
              {/* Voiceover Mute Toggle */}
              <button
                onClick={() => setIsVoiceoverMuted(!isVoiceoverMuted)}
                className={`flex items-center space-x-1 px-2.5 py-1 rounded-lg text-[11px] font-medium border transition ${
                  isVoiceoverMuted
                    ? 'bg-slate-800 text-slate-400 border-slate-700'
                    : 'bg-blue-950/60 text-blue-300 border-blue-600/40'
                }`}
                title={isVoiceoverMuted ? 'Turn Narration Voice On' : 'Mute Voiceover'}
              >
                {isVoiceoverMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5 text-blue-400" />}
                <span>{isVoiceoverMuted ? 'Muted' : 'Voiceover'}</span>
              </button>

              {/* Speed Selector */}
              <div className="flex items-center bg-slate-800 rounded-lg p-0.5 border border-slate-700">
                {[1, 1.25, 1.5].map((spd) => (
                  <button
                    key={spd}
                    onClick={() => setPlaybackSpeed(spd)}
                    className={`px-2 py-0.5 rounded text-[10px] font-semibold transition ${
                      playbackSpeed === spd ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {spd}x
                  </button>
                ))}
              </div>

              {/* Try Feature Live Button */}
              {onNavigateToFeature && currentChapter?.actionFeature && (
                <button
                  onClick={() => {
                    onClose();
                    onNavigateToFeature(currentChapter.actionFeature);
                  }}
                  className="flex items-center space-x-1.5 px-3 py-1 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm transition"
                >
                  <span>{currentChapter?.actionLabel || 'Try Feature'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Chapters Strip & Deep Highlights */}
        <div className="bg-slate-900/95 p-4 overflow-y-auto max-h-48 border-t border-slate-800">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Left: Chapter Selector Pills */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Chapters &amp; Workflows</span>
              <div className="space-y-1">
                {DEMO_CHAPTERS.map((c, i) => (
                  <button
                    key={c.id}
                    onClick={() => handleSelectChapter(i)}
                    className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center justify-between transition ${
                      i === safeChapterIdx
                        ? 'bg-blue-600/20 text-blue-300 border border-blue-500/40 font-semibold'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                    }`}
                  >
                    <span>{c.shortTitle}</span>
                    <span className="text-[10px] font-mono opacity-60">{c.durationSec}s</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Middle: Key Highlights of Active Chapter */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Governance &amp; Features Shown</span>
              <ul className="space-y-1.5">
                {(currentChapter?.keyHighlights || []).map((hl, hIdx) => (
                  <li key={hIdx} className="flex items-start text-xs text-slate-300 space-x-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 mt-0.5 shrink-0" />
                    <span>{hl}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Right: Technical Architecture & Compliance Certification */}
            <div className="space-y-1.5 bg-slate-950/50 p-2.5 rounded-xl border border-slate-800/80">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Underlying Enterprise Stack</span>
              <p className="text-xs text-slate-300 leading-relaxed">
                Powered by React 19, Spring Boot 3 enterprise JPA models, Apache POI XLSX sync, automated Thymeleaf HTML mailers, and cryptographic SHA-256 audit logs.
              </p>
              <div className="pt-1 flex items-center space-x-2 text-[11px] text-blue-400">
                <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
                <span>Enterprise SOC2 / BGV 7-Year Verified</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

import React, { useState, useRef, useEffect } from 'react';
import { 
  X, 
  FileSpreadsheet, 
  UploadCloud, 
  Paperclip, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  FileText, 
  Award, 
  Mail, 
  ShieldCheck, 
  Sparkles,
  Download,
  AlertCircle,
  AlertTriangle,
  ExternalLink,
  Edit3,
  Sliders,
  Layers,
  User,
  Users,
  Check,
  Eye,
  ArrowRight,
  ChevronDown,
  Building
} from 'lucide-react';
import { OnboardingDetails, BgvData, UploadedEvidence, EmailDistribution, WorkforceRequest, CustomFieldItem } from '../types';
import { AB_DIVISIONS, DEMO_PREFILL_DATA } from '../data/mockData';
import { parseExcelOnboardingFile, downloadSampleExcelTemplate } from '../utils/excelParser';
import { checkOnboardingDateGap } from '../utils/billingMetrics';

export interface CandidateRosterItem {
  id: string;
  firstName: string;
  middleName: string;
  lastName: string;
  resourceLocation: string; // side by side with name
  candidateEmailId: string;
  mobileNumber: string;
  admRole: string;
  admSeniority: 'Junior' | 'Professional' | 'Senior';
  billingRateWithCurrency: string;
  technicalEvaluationScore: string;
}

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (newRequest: WorkforceRequest | WorkforceRequest[]) => void;
  defaultBgvData?: Partial<BgvData>;
  onOpenBgvModal?: () => void;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  defaultBgvData,
  onOpenBgvModal
}) => {
  const [activeTab, setActiveTab] = useState<'form' | 'evidence' | 'email'>('form');
  const [excelLoading, setExcelLoading] = useState(false);
  const [excelSuccessMsg, setExcelSuccessMsg] = useState<string | null>(null);

  // Dynamic Candidate Roster - defaults to 3 resources with locations side-by-side
  const [candidates, setCandidates] = useState<CandidateRosterItem[]>(() => {
    if (defaultBgvData?.resources && defaultBgvData.resources.length > 0) {
      return defaultBgvData.resources.map((res, i) => {
        const parts = res.name.trim().split(/\s+/);
        const fName = parts[0] || '';
        const mName = parts.length > 2 ? parts[1] : '';
        const lName = parts.length > 2 ? parts.slice(2).join(' ') : parts[1] || '';
        return {
          id: res.id || `res-${Date.now()}-${i}`,
          firstName: fName,
          middleName: mName,
          lastName: lName,
          resourceLocation: res.location || defaultBgvData.location || '',
          candidateEmailId: `${fName.toLowerCase() || 'resource'}.${lName.toLowerCase() || 'cw'}@apextech.com`,
          mobileNumber: '+91 98765 ' + String(10000 + i).substring(1),
          admRole: i === 0 ? 'Lead Cloud Architect' : i === 1 ? 'Full Stack Java Engineer' : 'Data Platform Engineer',
          admSeniority: i === 0 ? 'Senior' : 'Professional',
          billingRateWithCurrency: i === 0 ? '$85/hr' : '$72/hr',
          technicalEvaluationScore: i === 0 ? '92/100' : '86/100'
        };
      });
    }

    return [
      {
        id: 'cand-1',
        firstName: 'Sarah',
        middleName: 'Jane',
        lastName: 'Connor',
        resourceLocation: 'Bengaluru, India',
        candidateEmailId: 'sarah.connor@apextech.com',
        mobileNumber: '+91 98765 43210',
        admRole: 'Lead Cloud Architect',
        admSeniority: 'Senior',
        billingRateWithCurrency: '$85/hr',
        technicalEvaluationScore: '92/100'
      },
      {
        id: 'cand-2',
        firstName: 'Michael',
        middleName: 'Anthony',
        lastName: 'Scott',
        resourceLocation: 'Hyderabad, India',
        candidateEmailId: 'michael.scott@apextech.com',
        mobileNumber: '+91 98765 88990',
        admRole: 'Full Stack Java Engineer',
        admSeniority: 'Professional',
        billingRateWithCurrency: '$70/hr',
        technicalEvaluationScore: '86/100'
      },
      {
        id: 'cand-3',
        firstName: '',
        middleName: '',
        lastName: '',
        resourceLocation: '',
        candidateEmailId: '',
        mobileNumber: '',
        admRole: 'Data Platform Engineer',
        admSeniority: 'Professional',
        billingRateWithCurrency: '$75/hr',
        technicalEvaluationScore: ''
      }
    ];
  });

  const [activeCandidateIdx, setActiveCandidateIdx] = useState(0);
  const [activeEvidenceResourceIdx, setActiveEvidenceResourceIdx] = useState<number | 'shared' | 'all'>(0);

  // Form State - 32 fields + BGV fields
  const [formData, setFormData] = useState<OnboardingDetails>({
    firstName: defaultBgvData?.resources?.[0]?.name?.split(' ')[0] || defaultBgvData?.workerNames?.[0]?.split(' ')[0] || 'Sarah',
    middleName: defaultBgvData?.resources?.[0]?.name?.split(' ')[1] || defaultBgvData?.workerNames?.[0]?.split(' ')[1] || 'Jane',
    lastName: defaultBgvData?.resources?.[0]?.name?.split(' ').slice(2).join(' ') || defaultBgvData?.workerNames?.[0]?.split(' ').slice(2).join(' ') || 'Connor',
    vendorName: defaultBgvData?.supplierName || 'Apex Global Solutions Ltd',
    vendorDeliveryManagerEmail: 'dm.apex@apextech.com',
    resourceLocation: defaultBgvData?.resources?.[0]?.location || defaultBgvData?.location || 'Bengaluru, India',
    workedWithABEarlier: false,
    abLoginId: 'NA',
    abEmailId: 'NA',
    mobileNumber: '+91 98765 43210',
    mobileOperatingSystem: 'Android',
    candidateEmailId: 'sarah.connor@apextech.com',
    abManagerNameOrEmail: 'robert.smith@ab.com',
    divisionName: defaultBgvData?.divisionAtAB || AB_DIVISIONS[0],
    bgvStatus: 'Completed',
    bgvEmailSentToBgTeam: true,
    joiningDateInAB: '15/10/2026',
    billingStartDate: '15/10/2026',
    billingRateWithCurrency: '$85/hr',
    purchaseOrderNumber: 'PO-9948201',
    purchaseOrderEndDate: '31/12/2026',
    admSeniority: 'Senior',
    admRole: 'Lead Cloud Architect',
    projectName: 'Global Cloud Migration Wave 2',
    totalExperiencePriorToAB: '8.5 Years',
    relevantExperiencePriorToAB: '6.0 Years',
    technicalEvaluationScore: '92/100',
    noticePeriodDays: '30',
    isSubcontractor: false,
    areSubcontractorsAllowedForPO: 'NA',
    demandType: 'New Demand',
    incumbentEmailId: 'NA'
  });

  const [bgvData, setBgvData] = useState<BgvData>({
    supplierName: defaultBgvData?.supplierName || 'Apex Global Solutions Ltd',
    workerNames: defaultBgvData?.workerNames || ['Sarah Connor', 'Michael Scott'],
    resources: defaultBgvData?.resources || [
      { id: 'bgv-1', name: 'Sarah Connor', location: 'Bengaluru, India' },
      { id: 'bgv-2', name: 'Michael Scott', location: 'Hyderabad, India' },
      { id: 'bgv-3', name: '', location: '' }
    ],
    location: defaultBgvData?.location || 'Bengaluru, India',
    performedCountrySpecificChecks: defaultBgvData?.performedCountrySpecificChecks ?? true,
    divisionAtAB: defaultBgvData?.divisionAtAB || AB_DIVISIONS[0],
    screeningStatus: 'Complete',
    completionDate: defaultBgvData?.completionDate || '05/09/2026',
    bgvEmailProofName: defaultBgvData?.bgvEmailProofName
  });

  // Evidences State with per-resource attribution
  const [evidences, setEvidences] = useState<UploadedEvidence[]>([
    {
      id: 'ev-init-bgv',
      name: 'BGV_Verification_Confirmation_SarahConnor.pdf',
      size: '1.2 MB',
      type: 'application/pdf',
      category: 'bgv_proof',
      uploadedAt: new Date().toISOString(),
      resourceId: 'cand-1',
      resourceName: 'Sarah Connor'
    },
    {
      id: 'ev-init-tech',
      name: 'Technical_Evaluation_Scorecard_SarahConnor.pdf',
      size: '940 KB',
      type: 'application/pdf',
      category: 'technical_evaluation',
      uploadedAt: new Date().toISOString(),
      resourceId: 'cand-1',
      resourceName: 'Sarah Connor'
    },
    {
      id: 'ev-init-tech-2',
      name: 'Technical_Evaluation_Scorecard_MichaelScott.pdf',
      size: '880 KB',
      type: 'application/pdf',
      category: 'technical_evaluation',
      uploadedAt: new Date().toISOString(),
      resourceId: 'cand-2',
      resourceName: 'Michael Scott'
    },
    {
      id: 'ev-init-bgv-2',
      name: 'BGV_Clearance_Notice_MichaelScott.pdf',
      size: '1.1 MB',
      type: 'application/pdf',
      category: 'bgv_proof',
      uploadedAt: new Date().toISOString(),
      resourceId: 'cand-2',
      resourceName: 'Michael Scott'
    },
    {
      id: 'ev-init-sow',
      name: 'SOW_Schedule_B_Master_Agreement.pdf',
      size: '3.4 MB',
      type: 'application/pdf',
      category: 'sow_contract',
      uploadedAt: new Date().toISOString()
    }
  ]);

  // Email Distribution State with manual email adding
  const [emailDist, setEmailDist] = useState<EmailDistribution>({
    toSponsorEmail: 'robert.smith@ab.com',
    toPmoEmail: 'pmo.contingent@ab.com',
    toAdditionalEmails: [],
    ccVendorDeliveryManagerEmail: 'dm.apex@apextech.com',
    ccRamEmail: 'ram.apex@apextech.com',
    copyMyself: true,
    senderEmail: 'vendor.coordinator@apextech.com',
    additionalCcEmails: []
  });

  // Manual Email Adder state
  const [manualEmailInput, setManualEmailInput] = useState('');
  const [manualEmailTarget, setManualEmailTarget] = useState<'to' | 'cc'>('to');

  // Custom Provisioned Fields (Captured from unknown Excel columns or added manually)
  const [customFields, setCustomFields] = useState<CustomFieldItem[]>([]);

  const handleAddCustomField = () => {
    const newField: CustomFieldItem = {
      id: `cf-onb-${Date.now()}`,
      key: `custom_field_${customFields.length + 1}`,
      label: `Additional Field ${customFields.length + 1}`,
      value: '',
      fieldType: 'text',
      source: 'manual'
    };
    setCustomFields((prev) => [...prev, newField]);
  };

  const handleUpdateCustomFieldLabel = (id: string, newLabel: string) => {
    setCustomFields((prev) =>
      prev.map((f) => (f.id === id ? { ...f, label: newLabel } : f))
    );
  };

  const handleUpdateCustomFieldValue = (id: string, newValue: string) => {
    setCustomFields((prev) =>
      prev.map((f) => (f.id === id ? { ...f, value: newValue } : f))
    );
  };

  const handleRemoveCustomField = (id: string) => {
    setCustomFields((prev) => prev.filter((f) => f.id !== id));
  };

  // Helper to guarantee BGV clearance email evidence is attached
  const ensureBgvEvidenceAttached = (proofFileName?: string) => {
    const filename =
      proofFileName ||
      defaultBgvData?.bgvEmailProofName ||
      'BGV_Clearance_Confirmation_Signed.pdf';

    setEvidences((prev) => {
      const existingIdx = prev.findIndex((e) => e.category === 'bgv_proof');
      if (existingIdx >= 0) {
        return prev.map((e, idx) =>
          idx === existingIdx ? { ...e, name: filename } : e
        );
      }
      return [
        {
          id: 'ev-bgv-proof-' + Date.now(),
          name: filename,
          size: '1.2 MB',
          type: 'application/pdf',
          category: 'bgv_proof',
          uploadedAt: new Date().toISOString()
        },
        ...prev
      ];
    });
  };

  // Synchronize when defaultBgvData arrives or updates (e.g. from BGV submission screen)
  useEffect(() => {
    if (defaultBgvData) {
      if (defaultBgvData.supplierName) {
        setFormData((prev) => ({
          ...prev,
          vendorName: defaultBgvData.supplierName || prev.vendorName
        }));
      }
      if (defaultBgvData.bgvEmailProofName || defaultBgvData.screeningStatus === 'Complete') {
        setFormData((prev) => ({
          ...prev,
          bgvEmailSentToBgTeam: true,
          bgvStatus: 'Completed'
        }));
        ensureBgvEvidenceAttached(defaultBgvData.bgvEmailProofName);
      }
      if (defaultBgvData.divisionAtAB) {
        setFormData((prev) => ({
          ...prev,
          divisionName: defaultBgvData.divisionAtAB || prev.divisionName
        }));
      }
      setBgvData((prev) => ({
        ...prev,
        ...defaultBgvData
      }));
    }
  }, [defaultBgvData]);

  const techEvalInputRef = useRef<HTMLInputElement>(null);
  const generalEvidenceInputRef = useRef<HTMLInputElement>(null);
  const excelInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleInputChange = (field: keyof OnboardingDetails, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    // Keep candidate row in sync
    const active = candidates[activeCandidateIdx];
    if (active) {
      setCandidates((prev) =>
        prev.map((c, i) => {
          if (i !== activeCandidateIdx) return c;
          if (field === 'firstName') return { ...c, firstName: value };
          if (field === 'middleName') return { ...c, middleName: value };
          if (field === 'lastName') return { ...c, lastName: value };
          if (field === 'resourceLocation') return { ...c, resourceLocation: value };
          if (field === 'candidateEmailId') return { ...c, candidateEmailId: value };
          if (field === 'mobileNumber') return { ...c, mobileNumber: value };
          if (field === 'admRole') return { ...c, admRole: value };
          if (field === 'billingRateWithCurrency') return { ...c, billingRateWithCurrency: value };
          if (field === 'technicalEvaluationScore') return { ...c, technicalEvaluationScore: value };
          return c;
        })
      );
    }
  };

  // Candidate Roster Actions
  const handleAddCandidateRow = () => {
    const newRow: CandidateRosterItem = {
      id: `cand-${Date.now()}-${candidates.length + 1}`,
      firstName: '',
      middleName: '',
      lastName: '',
      resourceLocation: '',
      candidateEmailId: '',
      mobileNumber: '',
      admRole: 'Full Stack Engineer',
      admSeniority: 'Professional',
      billingRateWithCurrency: '$75/hr',
      technicalEvaluationScore: ''
    };
    setCandidates((prev) => [...prev, newRow]);
    setActiveCandidateIdx(candidates.length);
  };

  const handleRemoveCandidateRow = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (candidates.length <= 1) {
      alert('At least one candidate must remain in the roster.');
      return;
    }
    const remaining = candidates.filter((c) => c.id !== id);
    setCandidates(remaining);
    if (activeCandidateIdx >= remaining.length) {
      setActiveCandidateIdx(Math.max(0, remaining.length - 1));
    }
  };

  const handleCandidateRowChange = (id: string, field: keyof CandidateRosterItem, val: string) => {
    setCandidates((prev) =>
      prev.map((c) => {
        if (c.id !== id) return c;
        return { ...c, [field]: val };
      })
    );

    const active = candidates[activeCandidateIdx];
    if (active && active.id === id) {
      if (field === 'firstName') handleInputChange('firstName', val);
      if (field === 'middleName') handleInputChange('middleName', val);
      if (field === 'lastName') handleInputChange('lastName', val);
      if (field === 'resourceLocation') handleInputChange('resourceLocation', val);
      if (field === 'candidateEmailId') handleInputChange('candidateEmailId', val);
      if (field === 'mobileNumber') handleInputChange('mobileNumber', val);
      if (field === 'admRole') handleInputChange('admRole', val);
      if (field === 'billingRateWithCurrency') handleInputChange('billingRateWithCurrency', val);
      if (field === 'technicalEvaluationScore') handleInputChange('technicalEvaluationScore', val);
    }
  };

  const handleSelectActiveCandidate = (idx: number) => {
    setActiveCandidateIdx(idx);
    const target = candidates[idx];
    if (target) {
      setFormData((prev) => ({
        ...prev,
        firstName: target.firstName,
        middleName: target.middleName,
        lastName: target.lastName,
        resourceLocation: target.resourceLocation,
        candidateEmailId: target.candidateEmailId,
        mobileNumber: target.mobileNumber,
        admRole: target.admRole,
        admSeniority: target.admSeniority,
        billingRateWithCurrency: target.billingRateWithCurrency,
        technicalEvaluationScore: target.technicalEvaluationScore
      }));
    }
  };

  // Manual Email Management
  const handleAddManualEmail = (customEmail?: string) => {
    const raw = customEmail !== undefined ? customEmail : manualEmailInput;
    if (!raw.trim()) return;

    const parsed = raw
      .split(/[,;\s]+/)
      .map((e) => e.trim().toLowerCase())
      .filter((e) => e && e.includes('@'));

    if (parsed.length === 0) {
      alert('Please enter a valid email address containing @');
      return;
    }

    setEmailDist((prev) => {
      if (manualEmailTarget === 'to') {
        const current = prev.toAdditionalEmails || [];
        return { ...prev, toAdditionalEmails: Array.from(new Set([...current, ...parsed])) };
      } else {
        const current = prev.additionalCcEmails || [];
        return { ...prev, additionalCcEmails: Array.from(new Set([...current, ...parsed])) };
      }
    });

    setManualEmailInput('');
  };

  const handleRemoveToEmail = (emailToRemove: string) => {
    setEmailDist((prev) => ({
      ...prev,
      toAdditionalEmails: (prev.toAdditionalEmails || []).filter((e) => e !== emailToRemove)
    }));
  };

  const handleRemoveCustomCc = (emailToRemove: string) => {
    setEmailDist((prev) => ({
      ...prev,
      additionalCcEmails: prev.additionalCcEmails.filter((e) => e !== emailToRemove)
    }));
  };

  // Excel File Parsing
  const handleExcelUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setExcelLoading(true);
      setExcelSuccessMsg(null);
      const { details, bgv, customFields: parsedCustomFields, rawRowsCount } = await parseExcelOnboardingFile(file);

      setFormData((prev) => ({
        ...prev,
        ...details
      }));

      if (details.bgvEmailSentToBgTeam) {
        ensureBgvEvidenceAttached();
      }

      if (parsedCustomFields && parsedCustomFields.length > 0) {
        setCustomFields((prev) => {
          const map = new Map(prev.map((f) => [f.key, f]));
          parsedCustomFields.forEach((cf) => map.set(cf.key, cf));
          return Array.from(map.values());
        });
      }

      // Sync active candidate roster item so switching candidates or submitting doesn't revert
      setCandidates((prev) => {
        const next = [...prev];
        const targetIdx = activeCandidateIdx < next.length ? activeCandidateIdx : 0;
        if (next[targetIdx]) {
          next[targetIdx] = {
            ...next[targetIdx],
            firstName: details.firstName !== undefined ? details.firstName : next[targetIdx].firstName,
            middleName: details.middleName !== undefined ? details.middleName : next[targetIdx].middleName,
            lastName: details.lastName !== undefined ? details.lastName : next[targetIdx].lastName,
            resourceLocation: details.resourceLocation !== undefined ? details.resourceLocation : next[targetIdx].resourceLocation,
            candidateEmailId: details.candidateEmailId !== undefined ? details.candidateEmailId : next[targetIdx].candidateEmailId,
            mobileNumber: details.mobileNumber !== undefined ? details.mobileNumber : next[targetIdx].mobileNumber,
            admRole: details.admRole !== undefined ? details.admRole : next[targetIdx].admRole,
            admSeniority: details.admSeniority !== undefined ? details.admSeniority : next[targetIdx].admSeniority,
            billingRateWithCurrency: details.billingRateWithCurrency !== undefined ? details.billingRateWithCurrency : next[targetIdx].billingRateWithCurrency,
            technicalEvaluationScore: details.technicalEvaluationScore !== undefined ? details.technicalEvaluationScore : next[targetIdx].technicalEvaluationScore
          };
        }
        return next;
      });

      if (details.abManagerNameOrEmail || details.vendorDeliveryManagerEmail) {
        setEmailDist((prev) => ({
          ...prev,
          toSponsorEmail: details.abManagerNameOrEmail || prev.toSponsorEmail,
          ccVendorDeliveryManagerEmail: details.vendorDeliveryManagerEmail || prev.ccVendorDeliveryManagerEmail
        }));
      }

      if (Object.keys(bgv).length > 0) {
        setBgvData((prev) => ({
          ...prev,
          ...bgv
        }));
      }

      setExcelSuccessMsg(`Successfully parsed "${file.name}"! All 32 onboarding fields and BGV details populated.`);
    } catch (err: any) {
      alert('Error parsing Excel spreadsheet: ' + (err.message || 'Unknown error'));
    } finally {
      setExcelLoading(false);
      if (excelInputRef.current) excelInputRef.current.value = '';
    }
  };

  // Prefill Demo
  const handlePrefillDemo = () => {
    setFormData(DEMO_PREFILL_DATA.details);
    setBgvData(DEMO_PREFILL_DATA.bgv);
    setEmailDist((prev) => ({
      ...prev,
      toSponsorEmail: DEMO_PREFILL_DATA.details.abManagerNameOrEmail,
      ccVendorDeliveryManagerEmail: DEMO_PREFILL_DATA.details.vendorDeliveryManagerEmail,
      ccRamEmail: 'ram.acc@accenture.com'
    }));

    if (!evidences.some((e) => e.category === 'technical_evaluation')) {
      setEvidences((prev) => [
        ...prev,
        {
          id: 'ev-demo-tech',
          name: 'Technical_Evaluation_Scorecard_Meera_Kalyan.pdf',
          size: '860 KB',
          type: 'application/pdf',
          category: 'technical_evaluation',
          uploadedAt: new Date().toISOString()
        }
      ]);
    }
  };

  // Technical Evaluation Evidence Upload
  const handleTechEvalFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const cand = typeof activeEvidenceResourceIdx === 'number' && candidates[activeEvidenceResourceIdx] 
      ? candidates[activeEvidenceResourceIdx] 
      : candidates[0];
    const candId = cand?.id;
    const candName = cand ? `${cand.firstName} ${cand.lastName}`.trim() : `${formData.firstName} ${formData.lastName}`.trim();

    handleUploadTechScorecardForResource(file, candId, candName);
    if (techEvalInputRef.current) techEvalInputRef.current.value = '';
  };

  // Dedicated BGV Proof Upload for active or specific resource
  const handleUploadBgvProofForResource = (file: File, targetCandId?: string, targetCandName?: string) => {
    const defaultCand = typeof activeEvidenceResourceIdx === 'number' && candidates[activeEvidenceResourceIdx] 
      ? candidates[activeEvidenceResourceIdx] 
      : candidates[0];
    const candId = targetCandId || defaultCand?.id;
    const candName = targetCandName || (defaultCand ? `${defaultCand.firstName} ${defaultCand.lastName}`.trim() : `${formData.firstName} ${formData.lastName}`.trim());

    const newProof: UploadedEvidence = {
      id: 'ev-bgv-' + Date.now(),
      name: file.name,
      size: file.size > 1024 * 1024 ? (file.size / (1024 * 1024)).toFixed(1) + ' MB' : Math.round(file.size / 1024) + ' KB',
      type: file.type || 'application/pdf',
      category: 'bgv_proof',
      uploadedAt: new Date().toISOString(),
      resourceId: candId,
      resourceName: candName
    };

    setEvidences((prev) => [
      newProof,
      ...prev.filter((x) => !(x.category === 'bgv_proof' && (x.resourceId === candId || (!x.resourceId && !candId))))
    ]);

    handleInputChange('bgvEmailSentToBgTeam', true);
    handleInputChange('bgvStatus', 'Completed');
  };

  // Dedicated Technical Scorecard Upload for active or specific resource
  const handleUploadTechScorecardForResource = (file: File, targetCandId?: string, targetCandName?: string) => {
    const defaultCand = typeof activeEvidenceResourceIdx === 'number' && candidates[activeEvidenceResourceIdx] 
      ? candidates[activeEvidenceResourceIdx] 
      : candidates[0];
    const candId = targetCandId || defaultCand?.id;
    const candName = targetCandName || (defaultCand ? `${defaultCand.firstName} ${defaultCand.lastName}`.trim() : `${formData.firstName} ${formData.lastName}`.trim());

    const newEvidence: UploadedEvidence = {
      id: 'ev-tech-' + Date.now(),
      name: file.name,
      size: file.size > 1024 * 1024 ? (file.size / (1024 * 1024)).toFixed(1) + ' MB' : Math.round(file.size / 1024) + ' KB',
      type: file.type || 'application/pdf',
      category: 'technical_evaluation',
      uploadedAt: new Date().toISOString(),
      resourceId: candId,
      resourceName: candName
    };

    setEvidences((prev) => [
      newEvidence,
      ...prev.filter((item) => !(item.category === 'technical_evaluation' && (item.resourceId === candId || (!item.resourceId && !candId))))
    ]);
  };

  // General Evidences Upload (Supporting Docs, SOW, or Certificates)
  const handleGeneralEvidenceSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const files = Array.from(e.target.files) as File[];
    handleUploadGeneralForResource(files);
    if (generalEvidenceInputRef.current) generalEvidenceInputRef.current.value = '';
  };

  const handleUploadGeneralForResource = (files: FileList | File[], targetCandId?: string, targetCandName?: string) => {
    const isShared = activeEvidenceResourceIdx === 'shared';
    const defaultCand = typeof activeEvidenceResourceIdx === 'number' && candidates[activeEvidenceResourceIdx] 
      ? candidates[activeEvidenceResourceIdx] 
      : null;
    
    const candId = isShared ? 'shared' : (targetCandId || defaultCand?.id);
    const candName = isShared 
      ? 'Shared (All Resources)' 
      : (targetCandName || (defaultCand ? `${defaultCand.firstName} ${defaultCand.lastName}`.trim() : 'Shared'));

    const newItems: UploadedEvidence[] = Array.from(files).map((file: File, idx: number) => ({
      id: 'ev-gen-' + Date.now() + '-' + idx,
      name: file.name,
      size: file.size > 1024 * 1024 ? (file.size / (1024 * 1024)).toFixed(1) + ' MB' : Math.round(file.size / 1024) + ' KB',
      type: file.type || 'application/octet-stream',
      category: file.name.toLowerCase().includes('sow') 
        ? 'sow_contract' 
        : file.name.toLowerCase().includes('sub') 
        ? 'subcontractor_approval' 
        : file.name.toLowerCase().includes('id') || file.name.toLowerCase().includes('passport')
        ? 'id_proof'
        : 'other',
      uploadedAt: new Date().toISOString(),
      resourceId: candId,
      resourceName: candName
    }));

    setEvidences((prev) => [...prev, ...newItems]);
  };

  // Re-assign document to a specific candidate or shared pool
  const handleReassignEvidenceResource = (evidenceId: string, targetResourceId: string) => {
    setEvidences((prev) =>
      prev.map((e) => {
        if (e.id !== evidenceId) return e;
        if (targetResourceId === 'shared') {
          return { ...e, resourceId: 'shared', resourceName: 'Shared (All Resources)' };
        }
        const targetCand = candidates.find((c) => c.id === targetResourceId);
        if (targetCand) {
          const targetName = `${targetCand.firstName} ${targetCand.lastName}`.trim() || 'Candidate';
          return { ...e, resourceId: targetCand.id, resourceName: targetName };
        }
        return e;
      })
    );
  };

  const handleRemoveEvidence = (id: string) => {
    setEvidences((prev) => prev.filter((item) => item.id !== id));
  };

  // Form Submit: Handles Single or Multi-Resource Batch
  const handleSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();

    // Auto-capture any pending un-added email typed in the input
    let finalToAdditional = [...(emailDist.toAdditionalEmails || [])];
    let finalCcAdditional = [...(emailDist.additionalCcEmails || [])];

    if (manualEmailInput.trim()) {
      const parsed = manualEmailInput
        .split(/[,;\s]+/)
        .map((x) => x.trim().toLowerCase())
        .filter((x) => x && x.includes('@'));
      if (parsed.length > 0) {
        if (manualEmailTarget === 'to') {
          finalToAdditional = Array.from(new Set([...finalToAdditional, ...parsed]));
        } else {
          finalCcAdditional = Array.from(new Set([...finalCcAdditional, ...parsed]));
        }
      }
    }

    const finalEmailDist: EmailDistribution = {
      ...emailDist,
      toAdditionalEmails: finalToAdditional,
      additionalCcEmails: finalCcAdditional
    };

    if (!formData.vendorName) {
      alert('Vendor Name is required.');
      return;
    }
    if (!formData.purchaseOrderNumber) {
      alert('Purchase Order Number is mandatory.');
      return;
    }
    if (!formData.joiningDateInAB) {
      alert('Joining Date in AB is required.');
      return;
    }

    // Filter valid candidate rows that have at least a first name or last name
    const validCandidates = candidates.filter((c) => c.firstName.trim() || c.lastName.trim());

    if (validCandidates.length === 0) {
      alert('Please provide at least one candidate with First and Last Name in the roster.');
      return;
    }

    const batchId = `BATCH-AB-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const batchSummaryRoster = validCandidates.map((c) => ({
      name: `${c.firstName} ${c.middleName ? c.middleName + ' ' : ''}${c.lastName}`.trim(),
      location: c.resourceLocation,
      role: c.admRole,
      rate: c.billingRateWithCurrency,
      techScore: c.technicalEvaluationScore
    }));

    const requestsToCreate: WorkforceRequest[] = validCandidates.map((cand, idx) => {
      const fullName = `${cand.firstName} ${cand.middleName ? cand.middleName + ' ' : ''}${cand.lastName}`.trim();
      const refCode = `AB-CW-2026-${Math.floor(1000 + Math.random() * 8999)}`;
      
      const candidateDetails: OnboardingDetails = {
        ...formData,
        firstName: cand.firstName,
        middleName: cand.middleName,
        lastName: cand.lastName,
        resourceLocation: cand.resourceLocation,
        candidateEmailId: cand.candidateEmailId || `${cand.firstName.toLowerCase()}.${cand.lastName.toLowerCase()}@partner.com`,
        mobileNumber: cand.mobileNumber || formData.mobileNumber,
        admRole: cand.admRole || formData.admRole,
        admSeniority: cand.admSeniority || formData.admSeniority,
        billingRateWithCurrency: cand.billingRateWithCurrency || formData.billingRateWithCurrency,
        technicalEvaluationScore: cand.technicalEvaluationScore || formData.technicalEvaluationScore
      };

      // Isolate candidate's specific files + shared files for this dossier
      const candSpecificEvidences = evidences.filter((e) => {
        if (!e.resourceId || e.resourceId === 'shared' || e.category === 'sow_contract') return true;
        return e.resourceId === cand.id || e.resourceName === fullName;
      });

      return {
        id: `req-${Date.now()}-${idx}`,
        referenceCode: refCode,
        batchId: validCandidates.length > 1 ? batchId : undefined,
        batchResources: validCandidates.length > 1 ? batchSummaryRoster : undefined,
        type: 'onboarding',
        status: 'under_review',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        supplierName: formData.vendorName,
        candidateName: fullName,
        bgv: {
          ...bgvData,
          supplierName: formData.vendorName,
          workerNames: [fullName],
          location: cand.resourceLocation || bgvData.location
        },
        details: candidateDetails,
        customFields: customFields.length > 0 ? customFields : undefined,
        evidences: candSpecificEvidences.length > 0 ? candSpecificEvidences : evidences,
        emailDistribution: finalEmailDist,
        validationChecklist: {
          bgvVerified: formData.bgvStatus === 'Completed',
          bgvVerifiedBy: 'Vendor Self-Attested',
          poActiveAndFunded: false,
          subcontractorCompliant: !formData.isSubcontractor,
          technicalEvaluationVerified: false,
          sowRoleAligned: false,
          managerApproved: false
        },
        dispatchedEmails: [
          {
            id: `email-onb-${Date.now()}-${idx}`,
            timestamp: new Date().toISOString(),
            from: finalEmailDist.senderEmail || 'vendor.portal@ab-onboarding.com',
            to: Array.from(new Set([
              finalEmailDist.toSponsorEmail,
              finalEmailDist.toPmoEmail,
              ...(finalEmailDist.toAdditionalEmails || [])
            ])).filter(Boolean),
            cc: Array.from(new Set([
              finalEmailDist.senderEmail,
              candidateDetails.candidateEmailId,
              finalEmailDist.ccVendorDeliveryManagerEmail,
              finalEmailDist.ccRamEmail,
              ...(finalEmailDist.additionalCcEmails || [])
            ])).filter((e) => Boolean(e) && e !== finalEmailDist.toSponsorEmail && e !== finalEmailDist.toPmoEmail),
            subject: `[AB Contingent Onboarding] New Resource Initiation: ${candidateDetails.firstName} ${candidateDetails.lastName} (${candidateDetails.vendorName}) - PO: ${candidateDetails.purchaseOrderNumber}`,
            bodyType: 'onboarding_initiated',
            actionableLink: {
              label: 'Review Onboarding Dossier & Validate Checklist',
              url: `#review-${refCode}`
            },
            attachment: {
              name: `AB-SUTRA_${refCode}_${fullName.replace(/\s+/g, '_')}.xlsx`,
              size: '32.1 KB',
              type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            }
          }
        ],
        auditTrail: [
          {
            id: `aud-${Date.now()}-${idx}`,
            timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
            actor: finalEmailDist.senderEmail || 'vendor@partner.com',
            role: 'Supplier',
            action: 'Onboarding Request Submitted',
            notes: `Initiated onboarding for ${fullName} (${cand.resourceLocation}) under PO ${formData.purchaseOrderNumber}. Batch Ref: ${validCandidates.length > 1 ? batchId : 'Single'}. Actionable email dispatched to Sponsor (${finalEmailDist.toSponsorEmail}) and PMO (${finalEmailDist.toPmoEmail}).`
          }
        ]
      };
    });

    if (requestsToCreate.length === 1) {
      onSubmit(requestsToCreate[0]);
    } else {
      onSubmit(requestsToCreate);
    }
    onClose();
  };

  // Active Candidate in Evidence tab
  const activeEvidenceCandidate = typeof activeEvidenceResourceIdx === 'number' && activeEvidenceResourceIdx < candidates.length
    ? candidates[activeEvidenceResourceIdx]
    : null;

  const activeEvidenceCandName = activeEvidenceCandidate
    ? `${activeEvidenceCandidate.firstName} ${activeEvidenceCandidate.lastName}`.trim() || `Resource #${(activeEvidenceResourceIdx as number) + 1}`
    : '';

  // Filter evidences for the active view
  const displayedEvidences = evidences.filter((e) => {
    if (activeEvidenceResourceIdx === 'all') return true;
    if (activeEvidenceResourceIdx === 'shared') {
      return e.resourceId === 'shared' || (!e.resourceId && e.category === 'sow_contract');
    }
    if (typeof activeEvidenceResourceIdx === 'number' && activeEvidenceCandidate) {
      return e.resourceId === activeEvidenceCandidate.id || e.resourceName === activeEvidenceCandName;
    }
    return true;
  });

  const activeTechEvalEvidence = activeEvidenceCandidate
    ? evidences.find((e) => e.category === 'technical_evaluation' && (e.resourceId === activeEvidenceCandidate.id || e.resourceName === activeEvidenceCandName))
    : evidences.find((e) => e.category === 'technical_evaluation');

  const activeBgvEvidence = activeEvidenceCandidate
    ? evidences.find((e) => e.category === 'bgv_proof' && (e.resourceId === activeEvidenceCandidate.id || e.resourceName === activeEvidenceCandName))
    : evidences.find((e) => e.category === 'bgv_proof');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-5xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[92vh]">
        {/* Top Header */}
        <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 px-6 py-4 text-white flex items-center justify-between shrink-0 border-b border-blue-900/50">
          <div className="flex items-center space-x-3">
            <div className="h-9 w-9 rounded-lg bg-blue-600 flex items-center justify-center font-bold text-white shadow-inner">
              AB
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="font-semibold text-lg text-white">
                  Contingent Worker Onboarding Data Form (2026)
                </h2>
                <span className="text-[11px] px-2 py-0.5 rounded-full font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Compliance Gateway
                </span>
              </div>
              <p className="text-xs text-blue-200/80">
                Supplier submission for PMO & Sponsor validation to initiate Workday profile
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={handlePrefillDemo}
              className="inline-flex items-center space-x-1 px-3 py-1 rounded-lg bg-blue-500/20 hover:bg-blue-500/30 text-blue-200 border border-blue-400/30 text-xs transition"
              title="Autofill form with realistic sample engineer details"
            >
              <Sparkles className="w-3.5 h-3.5 text-blue-300" />
              <span>Fill Sample Data</span>
            </button>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Excel Import & Extraction Bar */}
        <div className="bg-slate-100/90 border-b border-slate-200 px-6 py-3 shrink-0 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center space-x-2 text-slate-700">
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span className="font-semibold">Automated Spreadsheet Intake:</span>
            <span className="text-slate-500 hidden sm:inline">
              Upload existing onboarding Excel file to populate the Onboarding Data Form
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="file"
              ref={excelInputRef}
              onChange={handleExcelUpload}
              accept=".xlsx,.xls,.csv"
              className="hidden"
            />
            <button
              type="button"
              onClick={() => excelInputRef.current?.click()}
              disabled={excelLoading}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-medium shadow-xs transition"
            >
              <UploadCloud className="w-3.5 h-3.5" />
              <span>{excelLoading ? 'Parsing Spreadsheet...' : 'Upload Excel (.xlsx)'}</span>
            </button>

            <button
              type="button"
              onClick={downloadSampleExcelTemplate}
              className="inline-flex items-center space-x-1 px-2.5 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-lg transition"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>Get Blank Template</span>
            </button>
          </div>
        </div>

        {excelSuccessMsg && (
          <div className="bg-emerald-50 border-b border-emerald-200 px-6 py-2 text-xs text-emerald-800 flex items-center justify-between">
            <span className="flex items-center">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 mr-1.5" />
              {excelSuccessMsg}
            </span>
            <button onClick={() => setExcelSuccessMsg(null)} className="text-emerald-700 font-bold ml-2">
              ×
            </button>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="bg-slate-50 border-b border-slate-200 px-6 py-2 flex items-center space-x-3 text-xs shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('form')}
            className={`px-3 py-1.5 rounded-lg font-medium transition ${
              activeTab === 'form'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-200/70'
            }`}
          >
            1. Onboarding Data Form &amp; BGV
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('evidence')}
            className={`px-3 py-1.5 rounded-lg font-medium transition flex items-center space-x-1.5 ${
              activeTab === 'evidence'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-200/70'
            }`}
          >
            <Paperclip className="w-3.5 h-3.5" />
            <span>2. Evidences & Tech Eval</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white/20 text-current font-bold">
              {evidences.length}
            </span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('email')}
            className={`px-3 py-1.5 rounded-lg font-medium transition flex items-center space-x-1.5 ${
              activeTab === 'email'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-200/70'
            }`}
          >
            <Mail className="w-3.5 h-3.5" />
            <span>3. Email Distribution & Thread</span>
          </button>
        </div>

        {/* Scrollable Form Content */}
        <form onSubmit={handleSubmitForm} className="flex-1 overflow-y-auto p-6 space-y-6">
          {activeTab === 'form' && (
            <div className="space-y-6">
              {/* Batch Onboarding Resource Roster (Multiple Resources & Locations) */}
              <div className="bg-slate-900 text-white rounded-xl p-4 border border-slate-800 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 mb-3 border-b border-slate-800">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold">
                        ★
                      </span>
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-100">
                        Batch Resource Roster (Multi-Resource Onboarding in One Email)
                      </h3>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-400/30">
                        {candidates.filter(c => c.firstName.trim() || c.lastName.trim()).length} Active Workers
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Add multiple resources with their individual work locations right next to their name. Trigger batch onboarding in a single submission.
                    </p>
                  </div>

                  <button
                    type="button"
                    id="add-candidate-row-btn"
                    onClick={handleAddCandidateRow}
                    className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold shadow-xs transition self-start sm:self-center"
                    title="Add another resource line to this onboarding submission"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Resource Line</span>
                  </button>
                </div>

                {/* Dedicated Resource Selector Buttons (Quick 1-Click Switcher) */}
                <div className="flex flex-wrap items-center gap-2 p-2 bg-slate-950/80 rounded-lg border border-slate-800 mb-3">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider shrink-0 mr-1">
                    Select Resource to Edit:
                  </span>
                  {candidates.map((cand, idx) => {
                    const isSelected = idx === activeCandidateIdx;
                    const candName = `${cand.firstName} ${cand.lastName}`.trim() || `Resource #${idx + 1}`;
                    return (
                      <button
                        key={cand.id}
                        type="button"
                        onClick={() => handleSelectActiveCandidate(idx)}
                        className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                          isSelected
                            ? 'bg-blue-600 text-white shadow-md ring-2 ring-blue-400'
                            : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white border border-slate-700'
                        }`}
                      >
                        <User className="w-3.5 h-3.5" />
                        <span>#{idx + 1}: {candName}</span>
                        {cand.resourceLocation && (
                          <span className="text-[10px] text-blue-200 hidden sm:inline">
                            • {cand.resourceLocation}
                          </span>
                        )}
                        {isSelected && (
                          <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span>
                        )}
                      </button>
                    );
                  })}
                  <button
                    type="button"
                    onClick={handleAddCandidateRow}
                    className="inline-flex items-center space-x-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-blue-600 text-slate-300 hover:text-white border border-slate-700 transition"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Add Resource</span>
                  </button>
                </div>

                {/* Candidate Rows (Default 3 items with side-by-side Location) */}
                <div className="space-y-2.5">
                  {candidates.map((cand, idx) => {
                    const isSelected = idx === activeCandidateIdx;
                    return (
                      <div
                        key={cand.id}
                        onClick={() => handleSelectActiveCandidate(idx)}
                        className={`p-3 rounded-lg border transition cursor-pointer ${
                          isSelected
                            ? 'bg-slate-800/90 border-blue-500 ring-1 ring-blue-500/50'
                            : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 text-xs">
                          {/* Row Index & Active Status */}
                          <div className="flex items-center space-x-2 shrink-0">
                            <span className="w-6 h-6 rounded-full bg-slate-800 text-slate-300 font-mono text-xs flex items-center justify-center font-semibold">
                              #{idx + 1}
                            </span>
                            {isSelected ? (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-600 text-white shadow-xs">
                                Active in Matrix Below
                              </span>
                            ) : (
                              <span className="text-[10px] text-slate-400 hover:text-slate-200">
                                Click to Edit Full Form
                              </span>
                            )}
                          </div>

                          {/* Side-by-side: Resource Name and Location */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5 flex-1">
                            {/* Candidate First & Last Name */}
                            <div>
                              <label className="block text-[10px] font-medium text-slate-400 mb-0.5">
                                Resource Name (First, Last) <span className="text-rose-400">*</span>
                              </label>
                              <div className="flex space-x-1">
                                <input
                                  type="text"
                                  placeholder="First"
                                  value={cand.firstName}
                                  onChange={(e) => handleCandidateRowChange(cand.id, 'firstName', e.target.value)}
                                  className="w-1/2 px-2 py-1 bg-slate-900 border border-slate-700 rounded text-slate-100 text-xs focus:ring-1 focus:ring-blue-400"
                                />
                                <input
                                  type="text"
                                  placeholder="Last"
                                  value={cand.lastName}
                                  onChange={(e) => handleCandidateRowChange(cand.id, 'lastName', e.target.value)}
                                  className="w-1/2 px-2 py-1 bg-slate-900 border border-slate-700 rounded text-slate-100 text-xs focus:ring-1 focus:ring-blue-400"
                                />
                              </div>
                            </div>

                            {/* Location - Right Next to Candidate Name! */}
                            <div>
                              <label className="block text-[10px] font-medium text-slate-400 mb-0.5">
                                Work Location <span className="text-rose-400">*</span>
                              </label>
                              <input
                                type="text"
                                placeholder="e.g. Bengaluru, India"
                                value={cand.resourceLocation}
                                onChange={(e) => handleCandidateRowChange(cand.id, 'resourceLocation', e.target.value)}
                                className="w-full px-2 py-1 bg-slate-900 border border-slate-700 rounded text-slate-100 text-xs focus:ring-1 focus:ring-blue-400"
                              />
                            </div>

                            {/* ADM Role */}
                            <div>
                              <label className="block text-[10px] font-medium text-slate-400 mb-0.5">
                                ADM Role
                              </label>
                              <input
                                type="text"
                                placeholder="e.g. Lead Cloud Architect"
                                value={cand.admRole}
                                onChange={(e) => handleCandidateRowChange(cand.id, 'admRole', e.target.value)}
                                className="w-full px-2 py-1 bg-slate-900 border border-slate-700 rounded text-slate-100 text-xs focus:ring-1 focus:ring-blue-400"
                              />
                            </div>

                            {/* Rate & Tech Score */}
                            <div className="flex space-x-1.5">
                              <div className="w-1/2">
                                <label className="block text-[10px] font-medium text-slate-400 mb-0.5">
                                  Billing Rate
                                </label>
                                <input
                                  type="text"
                                  placeholder="$85/hr"
                                  value={cand.billingRateWithCurrency}
                                  onChange={(e) => handleCandidateRowChange(cand.id, 'billingRateWithCurrency', e.target.value)}
                                  className="w-full px-2 py-1 bg-slate-900 border border-slate-700 rounded text-slate-100 text-xs focus:ring-1 focus:ring-blue-400"
                                />
                              </div>
                              <div className="w-1/2">
                                <label className="block text-[10px] font-medium text-slate-400 mb-0.5">
                                  Tech Score
                                </label>
                                <input
                                  type="text"
                                  placeholder="92/100"
                                  value={cand.technicalEvaluationScore}
                                  onChange={(e) => handleCandidateRowChange(cand.id, 'technicalEvaluationScore', e.target.value)}
                                  className="w-full px-2 py-1 bg-slate-900 border border-slate-700 rounded text-slate-100 text-xs focus:ring-1 focus:ring-blue-400"
                                />
                              </div>
                            </div>
                          </div>

                          {/* Row Actions */}
                          <div className="flex items-center space-x-1.5 shrink-0 self-end lg:self-center">
                            {candidates.length > 1 && (
                              <button
                                type="button"
                                onClick={(e) => handleRemoveCandidateRow(cand.id, e)}
                                className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded transition"
                                title="Remove resource row"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                  <span>
                    Currently editing: <strong className="text-blue-400">{formData.firstName} {formData.lastName || '(Row #' + (activeCandidateIdx + 1) + ')'}</strong>
                  </span>
                  <span className="text-slate-500">
                    Common PO, contract terms & BGV apply across this batch
                  </span>
                </div>
              </div>

              {/* Section 0: Background Verification (BGV) Pre-requisite */}
              <div className="bg-blue-50/60 rounded-xl p-4 border border-blue-200/80">
                <div className="flex items-center justify-between mb-3 pb-2 border-b border-blue-200">
                  <div className="flex items-center space-x-2">
                    <ShieldCheck className="w-4 h-4 text-blue-600" />
                    <h3 className="text-xs font-bold uppercase tracking-wider text-blue-900">
                      Pre-Onboarding Step: Background Verification (BGV) Clearance
                    </h3>
                  </div>
                  <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                    BGV Notice Prerequisite
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <label className="block font-medium text-slate-700 mb-1">
                      BGV Screening Status (Field 15)
                    </label>
                    <select
                      value={formData.bgvStatus}
                      onChange={(e) => handleInputChange('bgvStatus', e.target.value)}
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white"
                    >
                      <option value="Completed">Completed</option>
                      <option value="Pending">Pending</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-medium text-slate-700 mb-1">
                      Date of BGV Completion (Image 1)
                    </label>
                    <input
                      type="text"
                      value={bgvData.completionDate}
                      onChange={(e) => setBgvData({ ...bgvData, completionDate: e.target.value })}
                      placeholder="dd/mm/yyyy"
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white"
                    >
                    </input>
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-900 mb-1">
                      Has BGV clearance email been sent to Contingentworker.Backgroundscreening@ab.com? <span className="text-rose-600">*</span>
                    </label>
                    <div className="flex items-center space-x-4 mt-1.5">
                      <label className="flex items-center space-x-1.5 text-slate-800 cursor-pointer">
                        <input
                          type="radio"
                          name="bgvSentCheck"
                          checked={formData.bgvEmailSentToBgTeam === true}
                          onChange={() => {
                            handleInputChange('bgvEmailSentToBgTeam', true);
                            ensureBgvEvidenceAttached();
                          }}
                          className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="font-semibold text-emerald-800">Yes (Email Sent &amp; Cleared)</span>
                      </label>
                      <label className="flex items-center space-x-1.5 text-slate-800 cursor-pointer">
                        <input
                          type="radio"
                          name="bgvSentCheck"
                          checked={formData.bgvEmailSentToBgTeam === false}
                          onChange={() => handleInputChange('bgvEmailSentToBgTeam', false)}
                          className="w-4 h-4 text-rose-600 focus:ring-rose-500"
                        />
                        <span className="font-semibold text-rose-700">No (Pending / Not Sent)</span>
                      </label>
                    </div>
                  </div>
                </div>

                {!formData.bgvEmailSentToBgTeam && (
                  <div className="mt-3 p-3 bg-amber-500/15 border-2 border-amber-500/40 rounded-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 text-xs text-amber-950 animate-pulse">
                    <div className="flex items-start space-x-2">
                      <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                      <div>
                        <strong className="font-bold text-amber-900 block">BGV Clearance Email Not Dispatched!</strong>
                        <span>
                          AB contingent compliance mandates that background clearance confirmation must be dispatched to <strong>Contingentworker.Backgroundscreening@ab.com</strong> prior to PMO sign-off.
                        </span>
                      </div>
                    </div>
                    {onOpenBgvModal && (
                      <button
                        type="button"
                        onClick={onOpenBgvModal}
                        className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-md text-xs font-bold shadow-xs transition shrink-0 self-end sm:self-center"
                      >
                        <ShieldCheck className="w-4 h-4" />
                        <span>Open BGV Screening Format</span>
                        <ExternalLink className="w-3.5 h-3.5 ml-0.5" />
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Part 1: Candidate Identity & Vendor Contact (Image 3: Items 1 to 13) */}
              <div>
                <div className="flex items-center space-x-2 mb-3 pb-2 border-b border-slate-200">
                  <span className="w-5 h-5 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs font-bold">
                    1
                  </span>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                    Candidate Identity & Vendor Details (Sr. No. 1 - 13)
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      1. First Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.firstName}
                      onChange={(e) => handleInputChange('firstName', e.target.value)}
                      placeholder="e.g. Sarah"
                      className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      2. Middle Name
                    </label>
                    <input
                      type="text"
                      value={formData.middleName}
                      onChange={(e) => handleInputChange('middleName', e.target.value)}
                      placeholder="e.g. Jane"
                      className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      3. Last Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.lastName}
                      onChange={(e) => handleInputChange('lastName', e.target.value)}
                      placeholder="e.g. Connor"
                      className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      4. Name of the Vendor <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.vendorName}
                      onChange={(e) => handleInputChange('vendorName', e.target.value)}
                      placeholder="e.g. Apex Global Solutions Ltd"
                      className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      5. Vendor Delivery Manager Email <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="email"
                      required
                      value={formData.vendorDeliveryManagerEmail}
                      onChange={(e) => handleInputChange('vendorDeliveryManagerEmail', e.target.value)}
                      placeholder="e.g. dm.apex@apextech.com"
                      className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      6. Resource Location <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.resourceLocation}
                      onChange={(e) => handleInputChange('resourceLocation', e.target.value)}
                      placeholder="e.g. Bengaluru, India"
                      className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      7. Worked with AB earlier?
                    </label>
                    <select
                      value={formData.workedWithABEarlier ? 'Yes' : 'No'}
                      onChange={(e) => handleInputChange('workedWithABEarlier', e.target.value === 'Yes')}
                      className="w-full px-3 py-1.5 border border-slate-300 rounded-lg bg-white"
                    >
                      <option value="No">No</option>
                      <option value="Yes">Yes</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      8. AB Login ID (or NA)
                    </label>
                    <input
                      type="text"
                      value={formData.abLoginId}
                      onChange={(e) => handleInputChange('abLoginId', e.target.value)}
                      placeholder="e.g. AB91823 or NA"
                      className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      9. AB Email ID (or NA)
                    </label>
                    <input
                      type="text"
                      value={formData.abEmailId}
                      onChange={(e) => handleInputChange('abEmailId', e.target.value)}
                      placeholder="e.g. sarah.connor@ab.com or NA"
                      className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      10. Mobile Number <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.mobileNumber}
                      onChange={(e) => handleInputChange('mobileNumber', e.target.value)}
                      placeholder="e.g. +91 98765 43210"
                      className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      11. Mobile Operating System <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={formData.mobileOperatingSystem}
                      onChange={(e) => handleInputChange('mobileOperatingSystem', e.target.value as any)}
                      className="w-full px-3 py-1.5 border border-slate-300 rounded-lg bg-white"
                    >
                      <option value="Android">Android</option>
                      <option value="iOS">iOS</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      12. Email id (Personal/Vendor) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="email"
                      required
                      value={formData.candidateEmailId}
                      onChange={(e) => handleInputChange('candidateEmailId', e.target.value)}
                      placeholder="e.g. sarah.c@apextech.com"
                      className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="sm:col-span-3">
                    <label className="block font-semibold text-slate-700 mb-1">
                      13. AB Manager / Person of Contact Name or Email ID <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.abManagerNameOrEmail}
                      onChange={(e) => handleInputChange('abManagerNameOrEmail', e.target.value)}
                      placeholder="e.g. robert.smith@ab.com (Hiring Sponsor)"
                      className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Part 2: Engagement, PO & SOW Role (Image 2: Items 14 to 24) */}
              <div>
                <div className="flex items-center space-x-2 mb-3 pb-2 border-b border-slate-200">
                  <span className="w-5 h-5 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs font-bold">
                    2
                  </span>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                    Engagement, PO & Financial Details (Sr. No. 14 - 24)
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      14. Division Name <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={formData.divisionName}
                      onChange={(e) => handleInputChange('divisionName', e.target.value)}
                      className="w-full px-3 py-1.5 border border-slate-300 rounded-lg bg-white"
                    >
                      {AB_DIVISIONS.map((d) => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      15. BGV Status <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={formData.bgvStatus}
                      onChange={(e) => {
                        const val = e.target.value as 'Completed' | 'Pending';
                        handleInputChange('bgvStatus', val);
                        if (val === 'Completed') {
                          handleInputChange('bgvEmailSentToBgTeam', true);
                          ensureBgvEvidenceAttached();
                        }
                      }}
                      className="w-full px-3 py-1.5 border border-slate-300 rounded-lg bg-white"
                    >
                      <option value="Completed">Completed</option>
                      <option value="Pending">Pending</option>
                    </select>
                  </div>

                  {/* 16. Confirmation of BGV Email Submission with Yes/No toggle and link */}
                  <div className="sm:col-span-3 bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2.5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <div className="flex items-center space-x-2">
                          <label className="block font-bold text-slate-800 text-xs">
                            16. Has email been sent to BGV clearance? <span className="text-rose-500">*</span>
                          </label>
                          <span className="text-[10px] bg-blue-100 text-blue-800 font-semibold px-2 py-0.5 rounded-full font-mono">
                            Contingentworker.Backgroundscreening@ab.com
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          Confirms screening submission to AB Screening Desk with worker details and country-specific checks.
                        </p>
                      </div>

                      {/* Yes / No Interactive Buttons */}
                      <div className="inline-flex rounded-lg border border-slate-300 p-0.5 bg-slate-200/70 shrink-0">
                        <button
                          type="button"
                          id="bgv-email-sent-yes-btn"
                          onClick={() => {
                            handleInputChange('bgvEmailSentToBgTeam', true);
                            ensureBgvEvidenceAttached();
                          }}
                          className={`px-3 py-1.5 text-xs font-semibold rounded-md transition ${
                            formData.bgvEmailSentToBgTeam
                              ? 'bg-emerald-600 text-white shadow-xs'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          ✓ Yes, Email Sent
                        </button>
                        <button
                          type="button"
                          id="bgv-email-sent-no-btn"
                          onClick={() => handleInputChange('bgvEmailSentToBgTeam', false)}
                          className={`px-3 py-1.5 text-xs font-semibold rounded-md transition ${
                            !formData.bgvEmailSentToBgTeam
                              ? 'bg-rose-600 text-white shadow-xs'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          ✕ No, Not Sent Yet
                        </button>
                      </div>
                    </div>

                    {/* Conditional Alert / Action Link */}
                    {!formData.bgvEmailSentToBgTeam ? (
                      <div className="p-3 bg-amber-50 border border-amber-300 rounded-lg text-amber-950 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in duration-150">
                        <div className="flex items-start space-x-2.5">
                          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                          <div className="text-xs">
                            <span className="font-bold">BGV clearance email notice has not been submitted yet.</span>
                            <p className="text-[11px] text-amber-800 mt-0.5">
                              Please dispatch the BGV notice to the AB Screening desk. Once submitted, it will be automatically confirmed here and the clearance confirmation will be attached in the Evidence/Attachments tab.
                            </p>
                          </div>
                        </div>

                        {onOpenBgvModal && (
                          <button
                            type="button"
                            id="goto-bgv-screen-btn"
                            onClick={onOpenBgvModal}
                            className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-blue-700 hover:bg-blue-800 text-white rounded-lg text-xs font-semibold shadow-xs transition shrink-0"
                          >
                            <ShieldCheck className="w-4 h-4" />
                            <span>Go to BGV Screen for Email Submission</span>
                            <ExternalLink className="w-3.5 h-3.5 ml-0.5" />
                          </button>
                        )}
                      </div>
                    ) : (
                      <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-900 flex items-center justify-between text-xs animate-in fade-in duration-150">
                        <div className="flex items-center space-x-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span>
                            <strong>BGV Clearance Email Confirmed.</strong> Official confirmation is automatically attached in the Evidence/Attachments tab.
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setActiveTab('evidence')}
                          className="text-xs font-semibold text-blue-700 hover:underline shrink-0 ml-3"
                        >
                          View in Attachments Tab →
                        </button>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      17. Joining Date (in AB) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="date"
                      required
                      value={formData.joiningDateInAB}
                      onChange={(e) => handleInputChange('joiningDateInAB', e.target.value)}
                      className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      18. Billing Start Date <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="date"
                      required
                      value={formData.billingStartDate}
                      onChange={(e) => handleInputChange('billingStartDate', e.target.value)}
                      className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {/* Date Gap Policy Reminder Banner for Supplier (Non-blocking) */}
                  {(() => {
                    const gapCheck = checkOnboardingDateGap(formData.demandType, formData.joiningDateInAB, formData.billingStartDate);
                    if (!gapCheck.hasPolicyReminder) return null;
                    return (
                      <div className="sm:col-span-3 p-3.5 bg-blue-50 border border-blue-300 rounded-xl space-y-1.5 text-xs text-blue-950 animate-in fade-in">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-1.5 font-bold text-blue-900 text-xs">
                            <AlertCircle className="w-4 h-4 text-blue-600 shrink-0" />
                            <span>Policy Reminder ({formData.demandType})</span>
                          </div>
                          <span className="text-[10px] bg-blue-100 text-blue-800 font-semibold px-2 py-0.5 rounded-full border border-blue-200">
                            Advisory Only — Form Submission Allowed
                          </span>
                        </div>
                        <p className="text-blue-900 font-semibold leading-relaxed">
                          &ldquo;{gapCheck.supplierMessage}&rdquo;
                        </p>
                        <div className="text-[11px] text-blue-700 font-mono">
                          Onboarding (Joining): {formData.joiningDateInAB} &rarr; Billing Start: {formData.billingStartDate} ({gapCheck.gapDays} calendar day gap)
                        </div>
                      </div>
                    );
                  })()}

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      19. Billing Rate with Currency <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.billingRateWithCurrency}
                      onChange={(e) => handleInputChange('billingRateWithCurrency', e.target.value)}
                      placeholder="e.g. $85/hr or €75/hr"
                      className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      20. Purchase Order Number <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.purchaseOrderNumber}
                      onChange={(e) => handleInputChange('purchaseOrderNumber', e.target.value)}
                      placeholder="e.g. PO-AB-2026-98114"
                      className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      21. Purchase Order End Date <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="date"
                      required
                      value={formData.purchaseOrderEndDate}
                      onChange={(e) => handleInputChange('purchaseOrderEndDate', e.target.value)}
                      className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      22. ADM Seniority <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={formData.admSeniority}
                      onChange={(e) => handleInputChange('admSeniority', e.target.value as any)}
                      className="w-full px-3 py-1.5 border border-slate-300 rounded-lg bg-white"
                    >
                      <option value="Senior">Senior</option>
                      <option value="Professional">Professional</option>
                      <option value="Junior">Junior</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      23. ADM Role (as per SOW) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.admRole}
                      onChange={(e) => handleInputChange('admRole', e.target.value)}
                      placeholder="e.g. Senior Full Stack Lead"
                      className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      24. Project Name as per Agreement <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.projectName}
                      onChange={(e) => handleInputChange('projectName', e.target.value)}
                      placeholder="e.g. Phoenix Core Banking"
                      className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Part 3: Technical Evaluation & Compliance (Image 2: Items 25 to 32) */}
              <div>
                <div className="flex items-center space-x-2 mb-3 pb-2 border-b border-slate-200">
                  <span className="w-5 h-5 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs font-bold">
                    3
                  </span>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                    Technical Evaluation & Compliance (Sr. No. 25 - 32)
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      25. Total Experience Prior to AB <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.totalExperiencePriorToAB}
                      onChange={(e) => handleInputChange('totalExperiencePriorToAB', e.target.value)}
                      placeholder="e.g. 8.5 Years"
                      className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      26. Relevant Experience Prior to AB <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.relevantExperiencePriorToAB}
                      onChange={(e) => handleInputChange('relevantExperiencePriorToAB', e.target.value)}
                      placeholder="e.g. 6.0 Years"
                      className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="bg-amber-50 p-2.5 rounded-lg border border-amber-200">
                    <label className="block font-bold text-amber-900 mb-1">
                      27. Technical Evaluation Score <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.technicalEvaluationScore}
                      onChange={(e) => handleInputChange('technicalEvaluationScore', e.target.value)}
                      placeholder="e.g. 92/100"
                      className="w-full px-3 py-1 border border-amber-300 rounded-lg bg-white font-bold text-blue-900"
                    />
                    <span className="text-[10px] text-amber-700 block mt-0.5">
                      Required for engineers; attach scorecard in step 2
                    </span>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      28. Notice Period to Terminate (Days) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.noticePeriodDays}
                      onChange={(e) => handleInputChange('noticePeriodDays', e.target.value)}
                      placeholder="e.g. 30"
                      className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      29. Is Resource a Subcontractor?
                    </label>
                    <select
                      value={formData.isSubcontractor ? 'Yes' : 'No'}
                      onChange={(e) => handleInputChange('isSubcontractor', e.target.value === 'Yes')}
                      className="w-full px-3 py-1.5 border border-slate-300 rounded-lg bg-white"
                    >
                      <option value="No">No</option>
                      <option value="Yes">Yes</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      30. Subcontractors Allowed for this PO?
                    </label>
                    <select
                      value={formData.areSubcontractorsAllowedForPO}
                      onChange={(e) => handleInputChange('areSubcontractorsAllowedForPO', e.target.value as any)}
                      className="w-full px-3 py-1.5 border border-slate-300 rounded-lg bg-white"
                    >
                      <option value="NA">NA</option>
                      <option value="Yes">Yes</option>
                      <option value="No">No</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      31. Is this Replacement? Or New Demand <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={formData.demandType}
                      onChange={(e) => handleInputChange('demandType', e.target.value as any)}
                      className="w-full px-3 py-1.5 border border-slate-300 rounded-lg bg-white"
                    >
                      <option value="New Demand">New Demand</option>
                      <option value="Replacement">Replacement</option>
                    </select>
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block font-semibold text-slate-700 mb-1">
                      32. AB Email ID of Incumbent (if replacement)
                    </label>
                    <input
                      type="text"
                      value={formData.incumbentEmailId}
                      onChange={(e) => handleInputChange('incumbentEmailId', e.target.value)}
                      placeholder="e.g. incumbent.name@ab.com or NA"
                      className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {/* Policy Reminder specifically for Demand Type Selection */}
                  {(() => {
                    const gapCheck = checkOnboardingDateGap(formData.demandType, formData.joiningDateInAB, formData.billingStartDate);
                    if (!gapCheck.hasPolicyReminder) return null;
                    return (
                      <div className="sm:col-span-3 p-3 bg-amber-50/90 border border-amber-300 rounded-xl space-y-1 text-xs text-amber-950 animate-in fade-in">
                        <div className="flex items-center space-x-1.5 font-bold text-amber-900 text-xs">
                          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                          <span>Policy Advisory for {formData.demandType}:</span>
                        </div>
                        <p className="text-amber-900 font-semibold leading-relaxed">
                          &ldquo;{gapCheck.supplierMessage}&rdquo;
                        </p>
                      </div>
                    );
                  })()}
                </div>
              </div>

              {/* Section 4: Extensible / Provisioned Fields (Excel Dynamic Capture & Custom Fields) */}
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                  <div className="flex items-center space-x-2">
                    <span className="w-5 h-5 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs font-bold">
                      4
                    </span>
                    <div>
                      <div className="flex items-center space-x-2">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                          Additional &amp; Provisioned Fields ({customFields.length})
                        </h3>
                        <span className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-medium">
                          Extensible Schema
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500">
                        Extra columns from uploaded Excel templates are automatically ingested here. You can also add custom fields and rename labels at any time.
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    id="add-custom-field-onb-btn"
                    onClick={handleAddCustomField}
                    className="inline-flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold bg-slate-900 hover:bg-blue-600 text-white rounded-lg transition shadow-xs shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Additional Field</span>
                  </button>
                </div>

                {customFields.length === 0 ? (
                  <div className="p-4 bg-slate-50 rounded-lg border border-dashed border-slate-300 text-center space-y-1">
                    <p className="text-xs text-slate-600 font-medium">
                      No additional custom fields attached yet.
                    </p>
                    <p className="text-[11px] text-slate-400">
                      Any non-standard rows in uploaded Excel files will automatically populate here, or you can provision new fields with custom labels and values.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    {customFields.map((cf) => (
                      <div
                        key={cf.id}
                        className="p-3 bg-slate-50/90 border border-slate-200 rounded-lg space-y-2 hover:border-slate-300 transition"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-1 text-[11px] text-slate-600 font-medium">
                            <Edit3 className="w-3 h-3 text-blue-600" />
                            <span>Field Label (Renameable):</span>
                            {cf.source === 'excel' && (
                              <span className="bg-blue-100 text-blue-700 px-1.5 py-0.2 rounded font-semibold text-[9px]">
                                Excel Ingested
                              </span>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveCustomField(cf.id)}
                            className="text-slate-400 hover:text-rose-600 p-0.5 transition"
                            title="Remove Field"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <input
                          type="text"
                          value={cf.label}
                          onChange={(e) => handleUpdateCustomFieldLabel(cf.id, e.target.value)}
                          placeholder="e.g. Cost Center / Desk Location / Security Clearance..."
                          className="w-full px-2.5 py-1.5 text-xs font-semibold text-slate-900 border border-slate-300 rounded-md bg-white focus:ring-1 focus:ring-blue-500"
                        />
                        <div>
                          <label className="block text-[10px] text-slate-500 font-medium mb-0.5">
                            Value:
                          </label>
                          <input
                            type="text"
                            value={cf.value}
                            onChange={(e) => handleUpdateCustomFieldValue(cf.id, e.target.value)}
                            placeholder={`Enter ${cf.label || 'value'}...`}
                            className="w-full px-2.5 py-1.5 text-xs text-slate-800 border border-slate-300 rounded-md bg-white focus:ring-1 focus:ring-blue-500"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'evidence' && (
            <div className="space-y-6">
              {/* Dedicated Resource Selection Button Bar for Multi-Resource Onboarding */}
              <div className="bg-slate-900 text-white rounded-xl p-4 border border-slate-800 shadow-sm space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-2.5">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold">
                        📎
                      </span>
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-100">
                        Dedicated Resource Document Upload &amp; Evidence Matrix
                      </h3>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-400/30">
                        {candidates.length} Resources in Submission
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Select each resource below to upload their dedicated BGV proof and Technical Scorecard, or upload shared batch contract documents.
                    </p>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={() => setActiveEvidenceResourceIdx('all')}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium transition flex items-center space-x-1 ${
                        activeEvidenceResourceIdx === 'all'
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                      }`}
                      title="View all files across all resources"
                    >
                      <Layers className="w-3.5 h-3.5" />
                      <span>All Resources Overview</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleAddCandidateRow}
                      className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-blue-600 text-slate-300 hover:text-white border border-slate-700 transition flex items-center space-x-1"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Add Resource</span>
                    </button>
                  </div>
                </div>

                {/* Dedicated Resource Buttons */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 pt-1">
                  {candidates.map((cand, idx) => {
                    const isSelected = activeEvidenceResourceIdx === idx;
                    const candName = `${cand.firstName} ${cand.lastName}`.trim() || `Resource #${idx + 1}`;
                    const candBgv = evidences.find(
                      (e) => (e.resourceId === cand.id || e.resourceName === candName) && e.category === 'bgv_proof'
                    );
                    const candTech = evidences.find(
                      (e) => (e.resourceId === cand.id || e.resourceName === candName) && e.category === 'technical_evaluation'
                    );
                    const candFiles = evidences.filter(
                      (e) => e.resourceId === cand.id || e.resourceName === candName
                    );

                    return (
                      <button
                        key={cand.id}
                        type="button"
                        onClick={() => setActiveEvidenceResourceIdx(idx)}
                        className={`text-left p-3 rounded-xl border transition flex flex-col justify-between space-y-2 ${
                          isSelected
                            ? 'bg-blue-950/80 border-blue-500 ring-2 ring-blue-500 shadow-md'
                            : 'bg-slate-950/70 border-slate-800 hover:border-slate-700 hover:bg-slate-800/60'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-center space-x-2">
                            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                              isSelected ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-300'
                            }`}>
                              #{idx + 1}
                            </span>
                            <div>
                              <div className="font-semibold text-xs text-white truncate max-w-[160px]">
                                {candName}
                              </div>
                              <div className="text-[10px] text-slate-400 truncate max-w-[160px]">
                                {cand.admRole || 'Contingent Engineer'}
                                {cand.resourceLocation ? ` • ${cand.resourceLocation}` : ''}
                              </div>
                            </div>
                          </div>
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-slate-300 border border-slate-700">
                            {candFiles.length} files
                          </span>
                        </div>

                        {/* Evidence Checklist Indicators */}
                        <div className="flex flex-wrap gap-1 text-[10px]">
                          <span className={`px-1.5 py-0.5 rounded flex items-center space-x-1 ${
                            candBgv 
                              ? 'bg-emerald-950 text-emerald-300 border border-emerald-600/40' 
                              : 'bg-amber-950/60 text-amber-300 border border-amber-600/40'
                          }`}>
                            <span>{candBgv ? '✓ BGV Proof' : '⚠️ Need BGV'}</span>
                          </span>
                          <span className={`px-1.5 py-0.5 rounded flex items-center space-x-1 ${
                            candTech 
                              ? 'bg-blue-950 text-blue-300 border border-blue-600/40' 
                              : 'bg-amber-950/60 text-amber-300 border border-amber-600/40'
                          }`}>
                            <span>{candTech ? '✓ Tech Scorecard' : '⚠️ Need Scorecard'}</span>
                          </span>
                        </div>
                      </button>
                    );
                  })}

                  {/* Shared Documents Button */}
                  <button
                    type="button"
                    onClick={() => setActiveEvidenceResourceIdx('shared')}
                    className={`text-left p-3 rounded-xl border transition flex flex-col justify-between space-y-2 ${
                      activeEvidenceResourceIdx === 'shared'
                        ? 'bg-purple-950/80 border-purple-500 ring-2 ring-purple-500 shadow-md'
                        : 'bg-slate-950/70 border-slate-800 hover:border-slate-700 hover:bg-slate-800/60'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-2">
                        <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                          activeEvidenceResourceIdx === 'shared' ? 'bg-purple-600 text-white' : 'bg-slate-800 text-slate-300'
                        }`}>
                          🏢
                        </span>
                        <div>
                          <div className="font-semibold text-xs text-white">
                            Shared Contract / SOW
                          </div>
                          <div className="text-[10px] text-slate-400">
                            Applies to all resources in PO
                          </div>
                        </div>
                      </div>
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-slate-300 border border-slate-700">
                        {evidences.filter((e) => e.resourceId === 'shared' || (!e.resourceId && e.category === 'sow_contract')).length} files
                      </span>
                    </div>

                    <div className="text-[10px] text-purple-300 bg-purple-950/60 border border-purple-700/40 px-2 py-0.5 rounded">
                      Master Agreement &amp; PO Schedule
                    </div>
                  </button>
                </div>
              </div>

              {/* VIEW MODE 1: DEDICATED VIEW FOR A SPECIFIC RESOURCE */}
              {typeof activeEvidenceResourceIdx === 'number' && activeEvidenceCandidate && (
                <div className="space-y-6 animate-in fade-in duration-150">
                  {/* Active Resource Context Banner */}
                  <div className="bg-gradient-to-r from-blue-950 via-slate-900 to-indigo-950 p-4 rounded-xl text-white border border-blue-800/50 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-sm shadow-inner shrink-0">
                        #{activeEvidenceResourceIdx + 1}
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <h4 className="font-bold text-sm text-white">
                            {activeEvidenceCandName}
                          </h4>
                          <span className="text-[10px] bg-blue-500/20 text-blue-300 border border-blue-500/30 px-2 py-0.5 rounded font-mono">
                            {activeEvidenceCandidate.admRole || 'Contingent Worker'}
                          </span>
                        </div>
                        <p className="text-xs text-slate-300 mt-0.5">
                          Location: <strong className="text-white">{activeEvidenceCandidate.resourceLocation || 'Not specified'}</strong> | 
                          Rate: <strong className="text-emerald-300 font-mono">{activeEvidenceCandidate.billingRateWithCurrency || formData.billingRateWithCurrency}</strong> | 
                          PO: <strong className="text-blue-300 font-mono">{formData.purchaseOrderNumber}</strong>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 shrink-0">
                      <span className="text-xs text-slate-300">Switch Resource:</span>
                      <select
                        value={activeEvidenceResourceIdx}
                        onChange={(e) => setActiveEvidenceResourceIdx(Number(e.target.value))}
                        className="bg-slate-800 text-white border border-slate-700 text-xs rounded-lg px-2.5 py-1.5 focus:ring-1 focus:ring-blue-500"
                      >
                        {candidates.map((c, i) => (
                          <option key={c.id} value={i}>
                            #{i + 1}: {c.firstName} {c.lastName} ({c.admRole})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Dedicated Card 1: BGV Clearance Proof for this Resource */}
                  <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-teal-950 p-5 rounded-xl text-white shadow-md border border-emerald-900/60">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <ShieldCheck className="w-5 h-5 text-emerald-400" />
                          <h4 className="font-semibold text-sm">
                            BGV Clearance Email Verification for {activeEvidenceCandName}
                          </h4>
                        </div>
                        <p className="text-xs text-slate-300 max-w-xl">
                          Attach the official Background Verification clearance confirmation for {activeEvidenceCandName} dispatched to the AB Background Screening desk (Contingentworker.Backgroundscreening@ab.com).
                        </p>
                      </div>

                      <div className="flex items-center space-x-2 shrink-0">
                        {onOpenBgvModal && (
                          <button
                            type="button"
                            onClick={onOpenBgvModal}
                            className="inline-flex items-center space-x-1.5 px-3 py-2 bg-blue-700 hover:bg-blue-600 text-white font-semibold text-xs rounded-lg shadow-xs transition"
                          >
                            <ShieldCheck className="w-3.5 h-3.5" />
                            <span>Open BGV Screen</span>
                          </button>
                        )}
                        <label className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-lg shadow-xs transition cursor-pointer">
                          <UploadCloud className="w-4 h-4" />
                          <span>Upload BGV Proof for {activeEvidenceCandidate.firstName || 'Resource'}</span>
                          <input
                            type="file"
                            accept=".pdf,.png,.jpg,.jpeg,.eml,.msg,.docx"
                            className="hidden"
                            onChange={(e) => {
                              const f = e.target.files?.[0];
                              if (f) handleUploadBgvProofForResource(f);
                            }}
                          />
                        </label>
                      </div>
                    </div>

                    {activeBgvEvidence ? (
                      <div className="mt-3.5 pt-3 border-t border-emerald-900/60 flex items-center justify-between bg-emerald-950/40 px-3 py-2 rounded-lg text-xs">
                        <div className="flex items-center space-x-2 text-emerald-300">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          <span className="font-semibold text-white">{activeBgvEvidence.name}</span>
                          <span className="text-emerald-300 text-[11px]">({activeBgvEvidence.size})</span>
                          <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-semibold border border-emerald-500/30">
                            Assigned to {activeEvidenceCandName}
                          </span>
                        </div>
                        <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-semibold border border-emerald-500/30">
                          ✓ Attached &amp; Attested
                        </span>
                      </div>
                    ) : (
                      <div className="mt-2 text-[11px] text-amber-300/80 flex items-center space-x-1.5">
                        <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
                        <span>
                          No BGV proof attached for {activeEvidenceCandName}. Click the upload button above to attach.
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Dedicated Card 2: Technical Evaluation Scorecard for this Resource */}
                  <div className="bg-gradient-to-r from-blue-900 to-indigo-950 p-5 rounded-xl text-white shadow-md border border-blue-800/60">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <Award className="w-5 h-5 text-amber-400" />
                          <h4 className="font-semibold text-sm">
                            Technical Evaluation Scorecard for {activeEvidenceCandName}
                          </h4>
                          {activeEvidenceCandidate.technicalEvaluationScore && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-400 text-slate-950">
                              Score: {activeEvidenceCandidate.technicalEvaluationScore}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-blue-200/90 max-w-xl">
                          As mandated for engineering contingent workers, attach the candidate's verified Technical Assessment scorecard, interview evaluation notes, or technical test result.
                        </p>
                      </div>

                      <label className="inline-flex items-center space-x-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-lg shadow-md transition cursor-pointer shrink-0">
                        <Award className="w-4 h-4 text-slate-950" />
                        <span>Upload Technical Scorecard for {activeEvidenceCandidate.firstName || 'Resource'}</span>
                        <input
                          type="file"
                          accept=".pdf,.png,.jpg,.jpeg,.docx"
                          className="hidden"
                          onChange={(e) => {
                            const f = e.target.files?.[0];
                            if (f) handleUploadTechScorecardForResource(f);
                          }}
                        />
                      </label>
                    </div>

                    {activeTechEvalEvidence ? (
                      <div className="mt-3.5 pt-3 border-t border-blue-800/80 flex items-center justify-between bg-blue-950/40 px-3 py-2 rounded-lg text-xs">
                        <div className="flex items-center space-x-2 text-emerald-300">
                          <CheckCircle2 className="w-4 h-4" />
                          <span className="font-medium text-white">{activeTechEvalEvidence.name}</span>
                          <span className="text-blue-300 text-[11px]">({activeTechEvalEvidence.size})</span>
                          <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-200 text-[10px] font-semibold border border-blue-500/30">
                            Assigned to {activeEvidenceCandName}
                          </span>
                        </div>
                        <span className="px-2 py-0.5 rounded bg-amber-400/20 text-amber-300 text-[10px] font-semibold border border-amber-400/30">
                          Score: {activeEvidenceCandidate.technicalEvaluationScore || 'Provided'}
                        </span>
                      </div>
                    ) : (
                      <div className="mt-2 text-[11px] text-amber-200/70 flex items-center space-x-1">
                        <AlertCircle className="w-3.5 h-3.5" />
                        <span>No technical scorecard attached yet for {activeEvidenceCandName}.</span>
                      </div>
                    )}
                  </div>

                  {/* Dedicated Card 3: General & Supporting Documents for this Resource */}
                  <div className="border border-slate-200 rounded-xl p-5 bg-slate-50/50 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                          General &amp; Supporting Documents for {activeEvidenceCandName}
                        </h4>
                        <p className="text-xs text-slate-500">
                          Attach identity proof, educational credentials, certifications, or signed offer acceptance for {activeEvidenceCandName}.
                        </p>
                      </div>

                      <label className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-medium transition cursor-pointer">
                        <Plus className="w-3.5 h-3.5" />
                        <span>Attach Documents for {activeEvidenceCandidate.firstName || 'Resource'}</span>
                        <input
                          type="file"
                          multiple
                          accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
                          className="hidden"
                          onChange={(e) => {
                            if (e.target.files) handleUploadGeneralForResource(e.target.files);
                          }}
                        />
                      </label>
                    </div>

                    {/* Uploaded Files Table for this Candidate */}
                    <div className="space-y-2">
                      <div className="text-[11px] font-semibold text-slate-600 flex items-center justify-between">
                        <span>Documents Attributed to {activeEvidenceCandName} ({displayedEvidences.length}):</span>
                        <span className="text-slate-400 text-[10px]">Use dropdown to reassign documents to another resource</span>
                      </div>

                      {displayedEvidences.length === 0 ? (
                        <div className="p-4 bg-white rounded-lg border border-dashed border-slate-300 text-center text-xs text-slate-500">
                          No documents attached specifically for {activeEvidenceCandName} yet. Click the upload buttons above.
                        </div>
                      ) : (
                        displayedEvidences.map((ev) => (
                          <div
                            key={ev.id}
                            className="p-3 bg-white rounded-lg border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs hover:border-slate-300 transition"
                          >
                            <div className="flex items-center space-x-2.5 truncate">
                              <FileText className="w-4 h-4 text-blue-600 shrink-0" />
                              <span className="font-medium text-slate-800 truncate">{ev.name}</span>
                              <span className="text-slate-400 text-[11px]">({ev.size})</span>
                            </div>

                            <div className="flex items-center space-x-2 shrink-0">
                              {/* Document Category Badge */}
                              <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                                ev.category === 'technical_evaluation'
                                  ? 'bg-amber-100 text-amber-800 border border-amber-200'
                                  : ev.category === 'bgv_proof'
                                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                  : 'bg-slate-100 text-slate-700'
                              }`}>
                                {ev.category === 'technical_evaluation'
                                  ? 'Technical Scorecard'
                                  : ev.category === 'bgv_proof'
                                  ? 'BGV Proof'
                                  : 'Supporting Doc'}
                              </span>

                              {/* Attribution Reassign Dropdown */}
                              <div className="flex items-center space-x-1 bg-slate-100 px-2 py-1 rounded text-[10px]">
                                <span className="text-slate-500 font-medium">Assigned to:</span>
                                <select
                                  value={ev.resourceId || activeEvidenceCandidate.id}
                                  onChange={(e) => handleReassignEvidenceResource(ev.id, e.target.value)}
                                  className="bg-transparent font-semibold text-slate-800 focus:outline-hidden"
                                >
                                  {candidates.map((c) => (
                                    <option key={c.id} value={c.id}>
                                      {c.firstName} {c.lastName || 'Candidate'}
                                    </option>
                                  ))}
                                  <option value="shared">🏢 Shared (All Resources)</option>
                                </select>
                              </div>

                              <button
                                type="button"
                                onClick={() => handleRemoveEvidence(ev.id)}
                                className="text-slate-400 hover:text-rose-600 p-1 transition"
                                title="Remove File"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* VIEW MODE 2: SHARED BATCH CONTRACT DOCUMENTS */}
              {activeEvidenceResourceIdx === 'shared' && (
                <div className="space-y-5 animate-in fade-in duration-150">
                  <div className="bg-gradient-to-r from-purple-950 via-slate-900 to-slate-950 p-5 rounded-xl text-white border border-purple-800/50 shadow-md">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <Building className="w-5 h-5 text-purple-400" />
                          <h4 className="font-semibold text-sm">
                            Shared Batch SOW &amp; Contract Agreement (Applies to All Resources)
                          </h4>
                        </div>
                        <p className="text-xs text-purple-200/90 max-w-xl">
                          Upload contractual documents that govern all {candidates.length} resources in this submission—such as the Master Services Agreement, Statement of Work (SOW) Schedule B, PO authorization email, or Subcontractor blanket approval.
                        </p>
                      </div>

                      <label className="inline-flex items-center space-x-2 px-4 py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-lg shadow-md transition cursor-pointer shrink-0">
                        <UploadCloud className="w-4 h-4" />
                        <span>Upload Shared SOW / Contract</span>
                        <input
                          type="file"
                          multiple
                          accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
                          className="hidden"
                          onChange={(e) => {
                            if (e.target.files) handleUploadGeneralForResource(e.target.files, 'shared', 'Shared (All Resources)');
                          }}
                        />
                      </label>
                    </div>
                  </div>

                  {/* Shared Documents List */}
                  <div className="border border-slate-200 rounded-xl p-5 bg-white space-y-3">
                    <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                      Shared Contract Documents ({displayedEvidences.length})
                    </h4>
                    {displayedEvidences.length === 0 ? (
                      <div className="p-4 bg-slate-50 rounded-lg border border-dashed border-slate-300 text-center text-xs text-slate-500">
                        No shared contract documents attached yet.
                      </div>
                    ) : (
                      displayedEvidences.map((ev) => (
                        <div
                          key={ev.id}
                          className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between text-xs"
                        >
                          <div className="flex items-center space-x-2.5 truncate">
                            <FileText className="w-4 h-4 text-purple-600 shrink-0" />
                            <span className="font-medium text-slate-800 truncate">{ev.name}</span>
                            <span className="text-slate-400 text-[11px]">({ev.size})</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-purple-100 text-purple-800 border border-purple-200">
                              Shared Across Batch
                            </span>
                            <button
                              type="button"
                              onClick={() => handleRemoveEvidence(ev.id)}
                              className="text-slate-400 hover:text-rose-600 p-1 transition"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* VIEW MODE 3: ALL RESOURCES OVERVIEW MATRIX */}
              {activeEvidenceResourceIdx === 'all' && (
                <div className="space-y-5 animate-in fade-in duration-150">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                      Master Evidence Matrix — All Resources &amp; Files ({evidences.length} Total Attachments)
                    </h4>
                    <span className="text-[11px] text-slate-500">
                      Total {candidates.length} resources in batch
                    </span>
                  </div>

                  <div className="space-y-4">
                    {candidates.map((cand, idx) => {
                      const candName = `${cand.firstName} ${cand.lastName}`.trim() || `Resource #${idx + 1}`;
                      const candFiles = evidences.filter(
                        (e) => e.resourceId === cand.id || e.resourceName === candName
                      );
                      const hasBgv = candFiles.some((e) => e.category === 'bgv_proof');
                      const hasTech = candFiles.some((e) => e.category === 'technical_evaluation');

                      return (
                        <div key={cand.id} className="border border-slate-200 rounded-xl p-4 bg-white shadow-2xs space-y-3">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                            <div className="flex items-center space-x-2.5">
                              <span className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold">
                                #{idx + 1}
                              </span>
                              <div>
                                <h5 className="font-bold text-xs text-slate-900">{candName}</h5>
                                <p className="text-[11px] text-slate-500">
                                  {cand.admRole || 'Engineer'} • {cand.resourceLocation || 'Location'} • {cand.billingRateWithCurrency || formData.billingRateWithCurrency}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center space-x-2">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                                hasBgv ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                              }`}>
                                {hasBgv ? '✓ BGV Proof' : '⚠️ Missing BGV'}
                              </span>
                              <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                                hasTech ? 'bg-blue-100 text-blue-800' : 'bg-amber-100 text-amber-800'
                              }`}>
                                {hasTech ? '✓ Tech Scorecard' : '⚠️ Missing Tech'}
                              </span>
                              <button
                                type="button"
                                onClick={() => setActiveEvidenceResourceIdx(idx)}
                                className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold rounded text-xs transition"
                              >
                                Manage Dedicated Files &rarr;
                              </button>
                            </div>
                          </div>

                          {/* List of files for this resource */}
                          <div className="space-y-1.5">
                            {candFiles.length === 0 ? (
                              <p className="text-xs text-slate-400 italic py-1">
                                No files attached for {candName} yet.
                              </p>
                            ) : (
                              candFiles.map((ev) => (
                                <div
                                  key={ev.id}
                                  className="p-2 bg-slate-50 rounded-lg flex items-center justify-between text-xs border border-slate-100"
                                >
                                  <div className="flex items-center space-x-2 truncate">
                                    <FileText className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                                    <span className="font-medium text-slate-800 truncate">{ev.name}</span>
                                    <span className="text-slate-400 text-[10px]">({ev.size})</span>
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-white border border-slate-200 text-slate-700">
                                      {ev.category === 'technical_evaluation' ? 'Technical Scorecard' : ev.category === 'bgv_proof' ? 'BGV Proof' : 'Supporting'}
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => handleRemoveEvidence(ev.id)}
                                      className="text-slate-400 hover:text-rose-600 p-0.5 transition"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </button>
                                  </div>
                                </div>
                              ))
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'email' && (
            <div className="space-y-5">
              <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-200 text-xs text-blue-900">
                <div className="flex items-center space-x-2 mb-1">
                  <Mail className="w-4 h-4 text-blue-600" />
                  <strong className="font-semibold text-blue-950">
                    Onboarding Email Notification Dispatch
                  </strong>
                </div>
                <p>
                  Submitting this request will automatically generate and trigger a formal onboarding notification email to the AB Hiring Sponsor, PMO, and CC list configured below.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                {/* To: Sponsor */}
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    AB Sponsor (Hiring Manager) Email <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={emailDist.toSponsorEmail}
                    onChange={(e) => setEmailDist({ ...emailDist, toSponsorEmail: e.target.value })}
                    placeholder="sponsor.manager@ab.com"
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* To: PMO */}
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    PMO Workday Onboarding Desk Email <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={emailDist.toPmoEmail}
                    onChange={(e) => setEmailDist({ ...emailDist, toPmoEmail: e.target.value })}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-mono"
                  />
                </div>

                {/* CC: Vendor Delivery Manager */}
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Vendor Delivery Manager Email (CC) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={emailDist.ccVendorDeliveryManagerEmail}
                    onChange={(e) => setEmailDist({ ...emailDist, ccVendorDeliveryManagerEmail: e.target.value })}
                    placeholder="dm.vendor@partner.com"
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* CC: Vendor RAM (Resource Account Manager) */}
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Vendor RAM Email (Relationship / Account Mgr CC) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={emailDist.ccRamEmail}
                    onChange={(e) => setEmailDist({ ...emailDist, ccRamEmail: e.target.value })}
                    placeholder="ram.account@partner.com"
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Copy Myself Checkbox */}
                <div className="sm:col-span-2 bg-slate-50 p-3 rounded-lg border border-slate-200 flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="copy-myself-chk"
                      checked={emailDist.copyMyself}
                      onChange={(e) => setEmailDist({ ...emailDist, copyMyself: e.target.checked })}
                      className="rounded text-blue-600 focus:ring-blue-500 h-4 w-4"
                    />
                    <label htmlFor="copy-myself-chk" className="text-xs font-semibold text-slate-800 cursor-pointer">
                      Copy myself on this onboarding submission thread
                    </label>
                  </div>
                  <input
                    type="email"
                    value={emailDist.senderEmail}
                    onChange={(e) => setEmailDist({ ...emailDist, senderEmail: e.target.value })}
                    placeholder="My Email (e.g. coordinator@vendor.com)"
                    className="text-xs px-2.5 py-1 border border-slate-300 rounded-md w-60"
                  />
                </div>

                {/* Manual Email Entry Console for Vendor Partner */}
                <div className="sm:col-span-2 bg-slate-900 text-white p-4 rounded-xl border border-slate-800 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-100 flex items-center">
                        <Mail className="w-3.5 h-3.5 mr-1.5 text-blue-400" />
                        Manually Add Email IDs to Trigger Onboarding Request
                      </h4>
                      <p className="text-[11px] text-slate-400">
                        Add individual or comma-separated email addresses for additional Approvers (To) or Stakeholders (CC).
                      </p>
                    </div>
                    <span className="text-[10px] text-blue-300 bg-blue-900/50 px-2 py-0.5 rounded border border-blue-800 self-start sm:self-center">
                      Manual Email Entry Enabled
                    </span>
                  </div>

                  {/* Input row */}
                  <div className="flex flex-col sm:flex-row gap-2">
                    <div className="flex items-center space-x-1 bg-slate-800 p-1 rounded-lg border border-slate-700 shrink-0">
                      <button
                        type="button"
                        onClick={() => setManualEmailTarget('to')}
                        className={`px-2.5 py-1 rounded text-xs font-semibold transition ${
                          manualEmailTarget === 'to'
                            ? 'bg-blue-600 text-white'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                        title="Add as primary action required recipient"
                      >
                        To (Approver)
                      </button>
                      <button
                        type="button"
                        onClick={() => setManualEmailTarget('cc')}
                        className={`px-2.5 py-1 rounded text-xs font-semibold transition ${
                          manualEmailTarget === 'cc'
                            ? 'bg-blue-600 text-white'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                        title="Add as carbon copy recipient"
                      >
                        CC (Copy)
                      </button>
                    </div>

                    <div className="flex-1 flex space-x-2">
                      <input
                        type="text"
                        value={manualEmailInput}
                        onChange={(e) => setManualEmailInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddManualEmail();
                          }
                        }}
                        placeholder={
                          manualEmailTarget === 'to'
                            ? 'Enter approver email (e.g. sponsor.co-lead@ab.com) or paste comma-separated...'
                            : 'Enter CC email (e.g. audit.team@partner.com) or paste comma-separated...'
                        }
                        className="flex-1 px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-slate-100 placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                      />
                      <button
                        type="button"
                        onClick={() => handleAddManualEmail()}
                        className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold transition shrink-0"
                      >
                        + Add Email ID
                      </button>
                    </div>
                  </div>

                  {/* Quick Preset Chips */}
                  <div className="flex flex-wrap items-center gap-1.5 text-[11px] pt-1">
                    <span className="text-slate-400 font-medium">Quick suggestions:</span>
                    <button
                      type="button"
                      onClick={() => handleAddManualEmail('onboarding.governance@ab.com')}
                      className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded border border-slate-700 transition"
                    >
                      + Onboarding Desk
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddManualEmail('procurement.cw@ab.com')}
                      className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded border border-slate-700 transition"
                    >
                      + Procurement CW
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddManualEmail('bgv.compliance@ab.com')}
                      className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded border border-slate-700 transition"
                    >
                      + BGV Compliance
                    </button>
                  </div>

                  {/* Added Email Badges */}
                  <div className="space-y-2 pt-2 border-t border-slate-800">
                    {/* Additional TO recipients */}
                    {emailDist.toAdditionalEmails && emailDist.toAdditionalEmails.length > 0 && (
                      <div>
                        <span className="text-[10px] font-bold text-amber-300 uppercase tracking-wider block mb-1">
                          Additional Approver Emails (To - Action Required):
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {emailDist.toAdditionalEmails.map((email, idx) => (
                            <span
                              key={idx}
                              className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-amber-950/80 text-amber-200 border border-amber-800/80 text-[11px]"
                            >
                              <span>{email}</span>
                              <button
                                type="button"
                                onClick={() => handleRemoveToEmail(email)}
                                className="text-amber-400 hover:text-rose-400 ml-1 font-bold"
                                title="Remove email"
                              >
                                ×
                              </button>
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Additional CC recipients */}
                    {emailDist.additionalCcEmails.length > 0 && (
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                          Additional CC Emails:
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {emailDist.additionalCcEmails.map((email, idx) => (
                            <span
                              key={idx}
                              className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-200 border border-slate-700 text-[11px]"
                            >
                              <span>{email}</span>
                              <button
                                type="button"
                                onClick={() => handleRemoveCustomCc(email)}
                                className="text-slate-400 hover:text-rose-400 ml-1 font-bold"
                                title="Remove email"
                              >
                                ×
                              </button>
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Footer Submit Buttons */}
          <div className="bg-slate-50 -mx-6 -mb-6 px-6 py-4 border-t border-slate-200 flex items-center justify-between shrink-0">
            <div className="text-xs text-slate-500 flex items-center space-x-2">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-500"></span>
              <span>All mandatory fields validated per AB 2026 guidelines</span>
            </div>

            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-200/60 rounded-lg transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                id="submit-onboarding-btn"
                className="inline-flex items-center space-x-2 px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg shadow-sm transition"
              >
                <Mail className="w-4 h-4" />
                <span>Submit Request & Trigger Email</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { 
  Server, 
  Database, 
  FileSpreadsheet, 
  Mail, 
  ShieldCheck, 
  Layers, 
  Code2, 
  X, 
  Check, 
  Copy, 
  ExternalLink, 
  Workflow, 
  Cpu,
  BookOpen
} from 'lucide-react';

interface ArchitectureModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ArchitectureModal: React.FC<ArchitectureModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'entities' | 'poi' | 'email' | 'rest' | 'pom'>('overview');
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  if (!isOpen) return null;

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(id);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-5xl w-full border border-slate-200 shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
        {/* Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between shrink-0 border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center font-bold text-white shadow-md">
              <Server className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-bold text-base text-white">
                  AB-SUTRA Enterprise Architecture &amp; Spring Boot 3 Backend
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold">
                  Java 17 &bull; Spring Boot 3.2.4
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Production REST APIs, JPA Entities, Apache POI 5.x Excel Engine &amp; Thymeleaf Emailer
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-slate-100 border-b border-slate-200 px-6 py-2 flex items-center space-x-2 overflow-x-auto shrink-0 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-3 py-1.5 rounded-lg transition flex items-center space-x-1.5 ${
              activeTab === 'overview' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Architecture Overview</span>
          </button>
          <button
            onClick={() => setActiveTab('entities')}
            className={`px-3 py-1.5 rounded-lg transition flex items-center space-x-1.5 ${
              activeTab === 'entities' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span>Domain Entities (JPA)</span>
          </button>
          <button
            onClick={() => setActiveTab('poi')}
            className={`px-3 py-1.5 rounded-lg transition flex items-center space-x-1.5 ${
              activeTab === 'poi' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-200'
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Apache POI Excel Service</span>
          </button>
          <button
            onClick={() => setActiveTab('email')}
            className={`px-3 py-1.5 rounded-lg transition flex items-center space-x-1.5 ${
              activeTab === 'email' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Mail className="w-3.5 h-3.5" />
            <span>Thymeleaf Notification Engine</span>
          </button>
          <button
            onClick={() => setActiveTab('rest')}
            className={`px-3 py-1.5 rounded-lg transition flex items-center space-x-1.5 ${
              activeTab === 'rest' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Workflow className="w-3.5 h-3.5" />
            <span>REST API Matrix (/api/v1)</span>
          </button>
          <button
            onClick={() => setActiveTab('pom')}
            className={`px-3 py-1.5 rounded-lg transition flex items-center space-x-1.5 ${
              activeTab === 'pom' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>Maven pom.xml</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6 text-slate-800 text-xs">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Architecture Diagram */}
              <div className="bg-slate-900 text-slate-100 rounded-xl p-5 border border-slate-800 shadow-inner">
                <h4 className="text-sm font-bold text-white mb-3 flex items-center space-x-2">
                  <Cpu className="w-4 h-4 text-blue-400" />
                  <span>AB-SUTRA End-to-End Enterprise Architecture</span>
                </h4>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono">
                  {/* Presentation Tier */}
                  <div className="bg-slate-800/80 p-3.5 rounded-lg border border-slate-700">
                    <div className="text-blue-400 font-bold text-[11px] uppercase mb-1.5 flex items-center justify-between">
                      <span>Presentation Tier</span>
                      <span className="text-[10px] text-slate-400 font-normal">React 19</span>
                    </div>
                    <ul className="space-y-1.5 text-slate-300">
                      <li>&bull; React 19 + TypeScript 5.8</li>
                      <li>&bull; Tailwind CSS v4 Modern Styling</li>
                      <li>&bull; Multi-Role Switcher (Supplier / PMO / Manager / Admin)</li>
                      <li>&bull; Dual-Channel Broadcast Ticker</li>
                      <li>&bull; Live Financial Variance &amp; Efficiency Gain Metrics</li>
                      <li>&bull; Directory Corporate Email Autocomplete</li>
                    </ul>
                  </div>

                  {/* Backend & Business Logic Tier */}
                  <div className="bg-slate-800/80 p-3.5 rounded-lg border border-slate-700">
                    <div className="text-emerald-400 font-bold text-[11px] uppercase mb-1.5 flex items-center justify-between">
                      <span>Application Tier</span>
                      <span className="text-[10px] text-slate-400 font-normal">Spring Boot 3.2</span>
                    </div>
                    <ul className="space-y-1.5 text-slate-300">
                      <li>&bull; Java 17 + Spring Boot 3.2.4</li>
                      <li>&bull; Spring Web REST Controllers (/api/v1)</li>
                      <li>&bull; Spring Data JPA (Hibernate 6)</li>
                      <li>&bull; Apache POI 5.2.5 (32-Field &amp; 14-Field XLSX)</li>
                      <li>&bull; JavaMailSender + Thymeleaf HTML Mailer</li>
                      <li>&bull; Two-Tier Delegation Governance Engine</li>
                    </ul>
                  </div>

                  {/* Data & Persistence Tier */}
                  <div className="bg-slate-800/80 p-3.5 rounded-lg border border-slate-700">
                    <div className="text-purple-400 font-bold text-[11px] uppercase mb-1.5 flex items-center justify-between">
                      <span>Data &amp; Security Tier</span>
                      <span className="text-[10px] text-slate-400 font-normal">Postgres / H2</span>
                    </div>
                    <ul className="space-y-1.5 text-slate-300">
                      <li>&bull; PostgreSQL (Enterprise Production Profile)</li>
                      <li>&bull; H2 In-Memory (Dev/Testing Profile)</li>
                      <li>&bull; JSONB Custom Dynamic Fields for PO Extensibility</li>
                      <li>&bull; Spring Security 6 Stateless RBAC + CORS</li>
                      <li>&bull; Full Audit Trail &amp; Stakeholder Dispatched Mails</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Core Governance Principles */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                  <h5 className="font-bold text-blue-900 text-sm mb-2 flex items-center space-x-1.5">
                    <ShieldCheck className="w-4 h-4 text-blue-700" />
                    <span>BGV Clearance Verification Gate</span>
                  </h5>
                  <p className="text-blue-950 leading-relaxed text-xs">
                    Suppliers are prompted: <em>&quot;Has BGV clearance email been sent to Contingentworker.Backgroundscreening@ab.com?&quot;</em>. 
                    If &quot;No&quot;, an instant warning banner links directly to the screening format. Once verified, BGV proof is automatically staged in evidence and archived in the dossier.
                  </p>
                </div>

                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
                  <h5 className="font-bold text-emerald-900 text-sm mb-2 flex items-center space-x-1.5">
                    <Check className="w-4 h-4 text-emerald-700" />
                    <span>Strict Financial Variance Terminology</span>
                  </h5>
                  <p className="text-emerald-950 leading-relaxed text-xs">
                    <strong>Rule:</strong> Never designate negative billing variances as &quot;negative loss&quot;. 
                    Faster SLA turnaround is always designated as <strong>&quot;Efficiency Gain&quot;</strong> in emerald badges:
                    <span className="block mt-1 font-mono bg-white/70 p-1 rounded border border-emerald-300">
                      Working Days = (Current Date - Expected Joining Date, excl. weekends) * Daily Rate
                    </span>
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'entities' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-slate-900 text-sm">Java 17 JPA Domain Entities (`com.ab.sutra.domain.*`)</h4>
                <span className="text-slate-500 font-mono text-[11px]">backend/src/main/java/com/ab/sutra/domain/</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="border border-slate-200 rounded-lg p-3 bg-slate-50">
                  <span className="font-bold text-blue-700 font-mono">WorkforceRequest.java</span>
                  <p className="text-slate-600 mt-1">
                    Aggregate root. UUID, referenceCode (AB-ONB-2026-XXXX / AB-OFF-2026-XXXX), RequestType, RequestStatus, WorkdayId, Corporate @ab.com email, JSONB customFields.
                  </p>
                </div>

                <div className="border border-slate-200 rounded-lg p-3 bg-slate-50">
                  <span className="font-bold text-blue-700 font-mono">OnboardingDetails.java</span>
                  <p className="text-slate-600 mt-1">
                    32-Field intake form: candidate identity, vendor delivery manager, worked earlier flag, mobile OS, BGV status, PO number, SOW role, ADM seniority, tech evaluation score.
                  </p>
                </div>

                <div className="border border-slate-200 rounded-lg p-3 bg-slate-50">
                  <span className="font-bold text-blue-700 font-mono">OffboardingDetails.java</span>
                  <p className="text-slate-600 mt-1">
                    14-Field termination form: LWD, sponsor email, billed days, timesheet sync check, Workday termination screenshot confirmation URL, asset recovery gates.
                  </p>
                </div>

                <div className="border border-slate-200 rounded-lg p-3 bg-slate-50">
                  <span className="font-bold text-blue-700 font-mono">ValidationChecklist.java</span>
                  <p className="text-slate-600 mt-1">
                    Compliance Matrix: bgvVerified, poActiveAndFunded, subcontractorCompliant, technicalEvaluationVerified, sowRoleAligned, managerApproved with audit actor timestamps.
                  </p>
                </div>

                <div className="border border-slate-200 rounded-lg p-3 bg-slate-50">
                  <span className="font-bold text-blue-700 font-mono">LongTermDelegation.java</span>
                  <p className="text-slate-600 mt-1">
                    Tier 2 Manager Backup Coverage: managerEmail, delegateeEmail, startDate, endDate, reason, joint notification flags.
                  </p>
                </div>

                <div className="border border-slate-200 rounded-lg p-3 bg-slate-50">
                  <span className="font-bold text-blue-700 font-mono">BroadcastTickerConfig.java</span>
                  <p className="text-slate-600 mt-1">
                    Dual-channel broadcast: supplierTicker &amp; managerPmoTicker with copyPmoToSupplier auto-sync flag and priority levels (INFO, WARNING, URGENT).
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'poi' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">Apache POI 5.x Excel Workbook Generator</h4>
                  <p className="text-slate-500 text-xs">Generates official 32-field onboarding, 14-field offboarding, and governance audit reports.</p>
                </div>
                <button
                  onClick={() => copyToClipboard(`// ExcelServiceImpl.java\nWorkbook workbook = new XSSFWorkbook();...`, 'poi-code')}
                  className="inline-flex items-center space-x-1 px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium"
                >
                  {copiedSection === 'poi-code' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedSection === 'poi-code' ? 'Copied' : 'Copy Excerpt'}</span>
                </button>
              </div>

              <div className="bg-slate-900 text-slate-200 p-4 rounded-xl font-mono text-[11px] overflow-x-auto space-y-2 border border-slate-800">
                <p className="text-emerald-400 font-semibold">// Apache POI 5.2.5 Implementation Highlights</p>
                <p className="text-slate-300">1. `parseOnboardingWorkbook(InputStream, supplierName)` &rarr; Parses 32 columns with DateUtil cell type checking.</p>
                <p className="text-slate-300">2. `generateOnboardingWorkbook(WorkforceRequest)` &rarr; XSSFWorkbook with corporate navy headers and auto-sized columns.</p>
                <p className="text-slate-300">3. `generateOffboardingWorkbook(OffboardingDetails)` &rarr; 14 standard columns formatted per 2026 AB specifications.</p>
                <p className="text-slate-300">4. `generateGovernanceAuditReport(List&lt;WorkforceRequest&gt;)` &rarr; Full audit workbook with SLA adherence &amp; Efficiency Gain metrics.</p>
              </div>
            </div>
          )}

          {activeTab === 'email' && (
            <div className="space-y-4">
              <div>
                <h4 className="font-bold text-slate-900 text-sm">JavaMailSender &amp; Thymeleaf Email Engine</h4>
                <p className="text-slate-500 text-xs">Automated action triggers dispatching to all 6 stakeholder categories.</p>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
                <div className="font-bold text-slate-900">Stakeholder Recipient Distribution Matrix (Mandatory to/cc):</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 text-xs">
                  <span className="p-2 bg-white rounded border border-slate-200 font-medium text-slate-800">1. Hiring Sponsor</span>
                  <span className="p-2 bg-white rounded border border-slate-200 font-medium text-slate-800">2. Central PMO Desk</span>
                  <span className="p-2 bg-white rounded border border-slate-200 font-medium text-slate-800">3. Vendor Delivery Manager</span>
                  <span className="p-2 bg-white rounded border border-slate-200 font-medium text-slate-800">4. Regional Account Manager (RAM)</span>
                  <span className="p-2 bg-white rounded border border-slate-200 font-medium text-slate-800">5. Candidate / Worker</span>
                  <span className="p-2 bg-white rounded border border-slate-200 font-medium text-slate-800">6. Executing Action Actor</span>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'rest' && (
            <div className="space-y-3">
              <h4 className="font-bold text-slate-900 text-sm">Production REST Endpoints (`/api/v1/*`)</h4>
              
              <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="bg-slate-900 text-white font-mono uppercase text-[10px]">
                    <tr>
                      <th className="py-2.5 px-3 w-20">Method</th>
                      <th className="py-2.5 px-3 w-1/3">Endpoint</th>
                      <th className="py-2.5 px-3">Description &amp; Email Triggers</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 bg-white font-mono text-[11px]">
                    <tr><td className="py-2 px-3 text-blue-700 font-bold">GET</td><td className="py-2 px-3">/api/v1/requests</td><td className="py-2 px-3 font-sans text-slate-700">Filter by type, status, role, and text search</td></tr>
                    <tr><td className="py-2 px-3 text-emerald-700 font-bold">POST</td><td className="py-2 px-3">/api/v1/requests/onboarding</td><td className="py-2 px-3 font-sans text-slate-700">Intake 32 fields or batch multipart Excel upload</td></tr>
                    <tr><td className="py-2 px-3 text-emerald-700 font-bold">POST</td><td className="py-2 px-3">/api/v1/requests/offboarding</td><td className="py-2 px-3 font-sans text-slate-700">Intake 14 standard offboarding fields</td></tr>
                    <tr><td className="py-2 px-3 text-amber-700 font-bold">PUT</td><td className="py-2 px-3">/api/v1/requests/&#123;id&#125;/compliance-checklist</td><td className="py-2 px-3 font-sans text-slate-700">Toggle BGV, PO, SOW, and Tech Eval gates</td></tr>
                    <tr><td className="py-2 px-3 text-emerald-700 font-bold">POST</td><td className="py-2 px-3">/api/v1/requests/&#123;id&#125;/manager-signoff</td><td className="py-2 px-3 font-sans text-slate-700">Hiring Manager certification + email trigger</td></tr>
                    <tr><td className="py-2 px-3 text-emerald-700 font-bold">POST</td><td className="py-2 px-3">/api/v1/requests/&#123;id&#125;/initiate-workday</td><td className="py-2 px-3 font-sans text-slate-700">PMO records Workday ID + email trigger</td></tr>
                    <tr><td className="py-2 px-3 text-emerald-700 font-bold">POST</td><td className="py-2 px-3">/api/v1/requests/&#123;id&#125;/complete-onboarding</td><td className="py-2 px-3 font-sans text-slate-700">Assigns corporate @ab.com email + email trigger</td></tr>
                    <tr><td className="py-2 px-3 text-emerald-700 font-bold">POST</td><td className="py-2 px-3">/api/v1/requests/&#123;id&#125;/delegate</td><td className="py-2 px-3 font-sans text-slate-700">Single request delegation with corporate email autocomplete</td></tr>
                    <tr><td className="py-2 px-3 text-emerald-700 font-bold">POST</td><td className="py-2 px-3">/api/v1/requests/&#123;id&#125;/upload-termination</td><td className="py-2 px-3 font-sans text-slate-700">Uploads Workday screenshot + completes offboarding</td></tr>
                    <tr><td className="py-2 px-3 text-blue-700 font-bold">GET</td><td className="py-2 px-3">/api/v1/directory/search?email=&#123;query&#125;</td><td className="py-2 px-3 font-sans text-slate-700">Internal company directory corporate email autocomplete</td></tr>
                    <tr><td className="py-2 px-3 text-blue-700 font-bold">GET</td><td className="py-2 px-3">/api/v1/reports/governance-excel</td><td className="py-2 px-3 font-sans text-slate-700">Download Apache POI governance audit workbook</td></tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'pom' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-slate-900 text-sm">Maven Build Descriptor (`/backend/pom.xml`)</h4>
                <button
                  onClick={() => copyToClipboard(`<!-- backend/pom.xml -->...`, 'pom-code')}
                  className="inline-flex items-center space-x-1 px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium"
                >
                  {copiedSection === 'pom-code' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedSection === 'pom-code' ? 'Copied' : 'Copy POM'}</span>
                </button>
              </div>

              <div className="bg-slate-900 text-slate-200 p-4 rounded-xl font-mono text-[11px] max-h-96 overflow-y-auto border border-slate-800">
                <pre>{`<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 https://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>
    <parent>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-parent</artifactId>
        <version>3.2.4</version>
    </parent>
    <groupId>com.ab.sutra</groupId>
    <artifactId>ab-sutra-backend</artifactId>
    <version>1.0.0-SNAPSHOT</version>
    <name>AB-SUTRA Backend</name>

    <properties>
        <java.version>17</java.version>
        <poi.version>5.2.5</poi.version>
    </properties>

    <dependencies>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-web</artifactId>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-data-jpa</artifactId>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-security</artifactId>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-mail</artifactId>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-thymeleaf</artifactId>
        </dependency>
        <dependency>
            <groupId>org.apache.poi</groupId>
            <artifactId>poi-ooxml</artifactId>
            <version>\${poi.version}</version>
        </dependency>
        <dependency>
            <groupId>org.postgresql</groupId>
            <artifactId>postgresql</artifactId>
        </dependency>
        <dependency>
            <groupId>com.h2database</groupId>
            <artifactId>h2</artifactId>
        </dependency>
    </dependencies>
</project>`}</pre>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-100 px-6 py-3 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500 shrink-0">
          <span>AB-SUTRA Governance &bull; Enterprise Spring Boot 3.2 + React 19 Architecture</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-medium rounded-lg shadow-xs transition"
          >
            Close Architecture Explorer
          </button>
        </div>
      </div>
    </div>
  );
};

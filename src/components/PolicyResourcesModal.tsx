import React, { useState } from 'react';
import { 
  X, 
  ExternalLink, 
  FileText, 
  Video, 
  BookOpen, 
  ShieldCheck, 
  Search, 
  Plus, 
  Trash2, 
  Copy, 
  Check, 
  Lock, 
  Globe, 
  Filter,
  Sparkles,
  Layers,
  HelpCircle
} from 'lucide-react';
import { PolicyResourceLink, UserRole } from '../types';

interface PolicyResourcesModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentRole: UserRole;
  resources: PolicyResourceLink[];
  onAddResource: (resource: PolicyResourceLink) => void;
  onDeleteResource?: (id: string) => void;
}

export const PolicyResourcesModal: React.FC<PolicyResourcesModalProps> = ({
  isOpen,
  onClose,
  currentRole,
  resources,
  onAddResource,
  onDeleteResource
}) => {
  const [activeTab, setActiveTab] = useState<'all' | 'policy' | 'training_video' | 'sop' | 'workday_guide' | 'compliance'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddFormOpen, setIsAddFormOpen] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // New Link form state
  const [newTitle, setNewTitle] = useState('');
  const [newUrl, setNewUrl] = useState('');
  const [newCategory, setNewCategory] = useState<PolicyResourceLink['category']>('policy');
  const [newDescription, setNewDescription] = useState('');
  const [newTargetRole, setNewTargetRole] = useState<PolicyResourceLink['targetRole']>('all');
  const [newIsInternal, setNewIsInternal] = useState(true);

  if (!isOpen) return null;

  const handleCopyLink = (url: string, id: string) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleCreateResource = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newUrl.trim()) {
      alert('Please provide both title and hyperlink URL.');
      return;
    }

    const created: PolicyResourceLink = {
      id: `res-${Date.now()}`,
      title: newTitle.trim(),
      category: newCategory,
      description: newDescription.trim() || 'Internal governance and operational guidance link.',
      url: newUrl.trim(),
      targetRole: newTargetRole,
      addedBy: currentRole === 'admin' ? 'Admin / Governance Team' : 'PMO Specialist',
      addedAt: new Date().toISOString().substring(0, 10),
      isInternal: newIsInternal,
      iconType: newCategory === 'training_video' ? 'video' : newCategory === 'compliance' ? 'shield' : 'file-text'
    };

    onAddResource(created);
    setNewTitle('');
    setNewUrl('');
    setNewDescription('');
    setIsAddFormOpen(false);
  };

  // Filter resources based on tab, search, and visibility
  const filteredResources = resources.filter((res) => {
    if (activeTab !== 'all' && res.category !== activeTab) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = res.title.toLowerCase().includes(q);
      const matchDesc = res.description.toLowerCase().includes(q);
      const matchUrl = res.url.toLowerCase().includes(q);
      if (!matchTitle && !matchDesc && !matchUrl) return false;
    }
    return true;
  });

  const getCategoryIcon = (category: PolicyResourceLink['category']) => {
    switch (category) {
      case 'training_video':
        return <Video className="w-4 h-4 text-rose-500" />;
      case 'compliance':
        return <ShieldCheck className="w-4 h-4 text-emerald-500" />;
      case 'sop':
        return <BookOpen className="w-4 h-4 text-amber-500" />;
      case 'workday_guide':
        return <Layers className="w-4 h-4 text-indigo-500" />;
      default:
        return <FileText className="w-4 h-4 text-blue-500" />;
    }
  };

  const getCategoryLabel = (cat: PolicyResourceLink['category']) => {
    switch (cat) {
      case 'policy': return 'Policy Document';
      case 'training_video': return 'Training Video';
      case 'sop': return 'Standard Operating Procedure (SOP)';
      case 'workday_guide': return 'Workday & System Guide';
      case 'compliance': return 'Compliance Checklist';
      default: return 'Resource';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 px-6 py-4 text-white flex items-center justify-between shrink-0 border-b border-blue-900/50">
          <div className="flex items-center space-x-3">
            <div className="h-9 w-9 rounded-lg bg-blue-600 flex items-center justify-center font-bold text-white shadow-inner">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="font-semibold text-base sm:text-lg text-white">
                  Contingent Workforce Policy &amp; Training Resource Center
                </h2>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  Internal Knowledge Hub
                </span>
              </div>
              <p className="text-xs text-blue-200/80">
                Official links to company policies, training modules, SOP guidelines, and Workday video walkthroughs
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              id="open-add-resource-form-btn"
              onClick={() => setIsAddFormOpen(!isAddFormOpen)}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold shadow-xs transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Hyperlink / Resource</span>
            </button>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Add Resource Panel */}
        {isAddFormOpen && (
          <form onSubmit={handleCreateResource} className="bg-slate-50 border-b border-slate-200 p-5 space-y-4 shrink-0 text-xs animate-in slide-in-from-top duration-150">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-800 text-xs flex items-center space-x-1.5">
                <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                <span>Add Hyperlink or Link to Internal Website</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsAddFormOpen(false)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕ Cancel
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Resource Title *
                </label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. 2026 Contingent Worker Code of Conduct Policy"
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Hyperlink / Internal Website URL *
                </label>
                <input
                  type="url"
                  required
                  value={newUrl}
                  onChange={(e) => setNewUrl(e.target.value)}
                  placeholder="e.g. https://intranet.ab.com/compliance/policy-2026.pdf"
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg bg-white font-mono text-[11px] focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Category Tab
                </label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value as any)}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg bg-white"
                >
                  <option value="policy">Policy Related Documents</option>
                  <option value="training_video">Training Videos &amp; Walkthroughs</option>
                  <option value="sop">Standard Operating Procedures (SOP)</option>
                  <option value="workday_guide">Workday &amp; System Guides</option>
                  <option value="compliance">Compliance &amp; Screening Checklists</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Target Audience
                </label>
                <select
                  value={newTargetRole}
                  onChange={(e) => setNewTargetRole(e.target.value as any)}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg bg-white"
                >
                  <option value="all">All Stakeholders (Suppliers, PMO &amp; Managers)</option>
                  <option value="supplier">Supplier Partners Only</option>
                  <option value="manager_pmo">PMO &amp; Hiring Managers Only</option>
                  <option value="admin">Admin &amp; Governance Only</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block font-semibold text-slate-700 mb-1">
                  Description / Guidance Summary
                </label>
                <input
                  type="text"
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Brief summary of what this document or training video covers..."
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg bg-white"
                />
              </div>

              <div className="sm:col-span-2 flex items-center justify-between pt-1">
                <label className="inline-flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newIsInternal}
                    onChange={(e) => setNewIsInternal(e.target.checked)}
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="font-medium text-slate-700">
                    Internal Intranet Link (Requires Enterprise SSO)
                  </span>
                </label>

                <button
                  type="submit"
                  id="confirm-add-policy-resource-btn"
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg shadow-sm transition"
                >
                  Save &amp; Add Hyperlink
                </button>
              </div>
            </div>
          </form>
        )}

        {/* Tab Strip */}
        <div className="bg-slate-100/90 border-b border-slate-200 px-6 py-2.5 flex flex-wrap items-center justify-between gap-3 shrink-0 text-xs">
          <div className="flex items-center space-x-1.5 overflow-x-auto">
            <button
              type="button"
              onClick={() => setActiveTab('all')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition ${
                activeTab === 'all'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-200'
              }`}
            >
              All Links ({resources.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('policy')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition flex items-center space-x-1.5 ${
                activeTab === 'policy'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-200'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Policy Documents</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('training_video')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition flex items-center space-x-1.5 ${
                activeTab === 'training_video'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-200'
              }`}
            >
              <Video className="w-3.5 h-3.5" />
              <span>Training Videos</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('sop')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition flex items-center space-x-1.5 ${
                activeTab === 'sop'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-200'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>SOPs</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('workday_guide')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition flex items-center space-x-1.5 ${
                activeTab === 'workday_guide'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-200'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Workday Guides</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('compliance')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition flex items-center space-x-1.5 ${
                activeTab === 'compliance'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-200'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Compliance</span>
            </button>
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search policy or video..."
              className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Resources Cards List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-3">
          {filteredResources.length === 0 ? (
            <div className="text-center py-12 text-slate-500 space-y-2">
              <BookOpen className="w-10 h-10 mx-auto text-slate-400" />
              <p className="font-semibold text-sm text-slate-700">No resources found matching this filter</p>
              <p className="text-xs">Click &quot;Add Hyperlink / Resource&quot; to link your internal websites or documents.</p>
            </div>
          ) : (
            filteredResources.map((res) => (
              <div
                key={res.id}
                className="bg-white border border-slate-200 hover:border-blue-400 rounded-xl p-4 shadow-2xs hover:shadow-xs transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs group"
              >
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                    <span className="p-1.5 rounded-lg bg-slate-100 group-hover:bg-blue-50 transition">
                      {getCategoryIcon(res.category)}
                    </span>
                    <h4 className="font-bold text-slate-900 text-sm group-hover:text-blue-600 transition">
                      {res.title}
                    </h4>

                    {res.isInternal ? (
                      <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                        <Lock className="w-2.5 h-2.5 text-emerald-600" />
                        <span>Internal Intranet</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-700">
                        <Globe className="w-2.5 h-2.5 text-slate-500" />
                        <span>External Portal</span>
                      </span>
                    )}

                    <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-blue-50 text-blue-800">
                      {getCategoryLabel(res.category)}
                    </span>
                  </div>

                  <p className="text-slate-600 text-[11px] leading-relaxed">
                    {res.description}
                  </p>

                  <div className="flex items-center space-x-3 text-[10px] text-slate-400 font-mono">
                    <span className="truncate max-w-md text-blue-600 font-sans">
                      {res.url}
                    </span>
                    <span>•</span>
                    <span>Added: {res.addedAt}</span>
                    <span>•</span>
                    <span>By: {res.addedBy}</span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center space-x-2 shrink-0 self-end sm:self-center">
                  <button
                    type="button"
                    onClick={() => handleCopyLink(res.url, res.id)}
                    className="inline-flex items-center space-x-1 px-2.5 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs transition"
                    title="Copy hyperlink to clipboard"
                  >
                    {copiedId === res.id ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-emerald-700 font-semibold">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-slate-500" />
                        <span>Copy Link</span>
                      </>
                    )}
                  </button>

                  <a
                    href={res.url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs shadow-2xs transition"
                  >
                    <span>Open Link</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>

                  {onDeleteResource && (
                    <button
                      type="button"
                      onClick={() => onDeleteResource(res.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition"
                      title="Remove resource link"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-50 border-t border-slate-200 px-6 py-3 flex items-center justify-between text-xs text-slate-500 shrink-0">
          <div className="flex items-center space-x-2">
            <HelpCircle className="w-4 h-4 text-blue-500" />
            <span>Need a custom internal link added? Contact PMO Governance Desk or use the &quot;Add Hyperlink&quot; form above.</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white font-semibold rounded-lg transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

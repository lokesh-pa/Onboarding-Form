import React, { useState } from 'react';
import { 
  Bell, 
  Megaphone, 
  Settings, 
  AlertTriangle, 
  Info, 
  CheckCircle2, 
  Copy, 
  X, 
  Check, 
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { TickerConfig, UserRole } from '../types';

interface BroadcastTickerProps {
  currentRole: UserRole;
  tickerConfig: TickerConfig;
  onUpdateTickerConfig?: (newConfig: TickerConfig) => void;
  onUpdateConfig?: (newConfig: TickerConfig) => void;
}

export const BroadcastTicker: React.FC<BroadcastTickerProps> = ({
  currentRole,
  tickerConfig,
  onUpdateTickerConfig,
  onUpdateConfig
}) => {
  const [isEditorOpen, setIsEditorOpen] = useState(false);

  // Editor form state
  const [supplierText, setSupplierText] = useState(tickerConfig.supplierTicker.text);
  const [supplierLevel, setSupplierLevel] = useState(tickerConfig.supplierTicker.level);
  const [supplierEnabled, setSupplierEnabled] = useState(tickerConfig.supplierTicker.enabled);

  const [pmoText, setPmoText] = useState(tickerConfig.managerPmoTicker.text);
  const [pmoLevel, setPmoLevel] = useState(tickerConfig.managerPmoTicker.level);
  const [pmoEnabled, setPmoEnabled] = useState(tickerConfig.managerPmoTicker.enabled);

  const [copyPmoToSupplier, setCopyPmoToSupplier] = useState(tickerConfig.copyPmoToSupplier);

  // Synchronize when copying is checked
  const handlePmoTextChange = (text: string) => {
    setPmoText(text);
    if (copyPmoToSupplier) {
      setSupplierText(text);
    }
  };

  const handleCopyCheckboxChange = (checked: boolean) => {
    setCopyPmoToSupplier(checked);
    if (checked) {
      setSupplierText(pmoText);
      setSupplierLevel(pmoLevel);
    }
  };

  const handleSaveTicker = (e: React.FormEvent) => {
    e.preventDefault();
    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 16);
    const updated: TickerConfig = {
      supplierTicker: {
        enabled: supplierEnabled,
        text: (copyPmoToSupplier ? pmoText : supplierText).trim(),
        level: copyPmoToSupplier ? pmoLevel : supplierLevel,
        updatedAt: nowStr,
        updatedBy: 'Admin / Global Governance'
      },
      managerPmoTicker: {
        enabled: pmoEnabled,
        text: pmoText.trim(),
        level: pmoLevel,
        updatedAt: nowStr,
        updatedBy: 'Admin / Global Governance'
      },
      copyPmoToSupplier
    };
    if (onUpdateConfig) {
      onUpdateConfig(updated);
    } else if (onUpdateTickerConfig) {
      onUpdateTickerConfig(updated);
    }
    setIsEditorOpen(false);
  };

  // Determine active channel for display
  const isSupplier = currentRole === 'supplier';
  const isAdmin = currentRole === 'admin';
  const activeChannel = isSupplier ? tickerConfig.supplierTicker : tickerConfig.managerPmoTicker;

  if (!activeChannel.enabled && !isAdmin) {
    return null;
  }

  const getLevelStyles = (level: 'info' | 'warning' | 'alert') => {
    switch (level) {
      case 'warning':
        return {
          bg: 'bg-amber-500/10 border-amber-500/30 text-amber-900',
          badge: 'bg-amber-500 text-white',
          icon: <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
        };
      case 'alert':
        return {
          bg: 'bg-rose-500/10 border-rose-500/30 text-rose-900',
          badge: 'bg-rose-600 text-white',
          icon: <Megaphone className="w-3.5 h-3.5 text-rose-600 shrink-0" />
        };
      default:
        return {
          bg: 'bg-blue-500/10 border-blue-500/30 text-blue-950',
          badge: 'bg-blue-600 text-white',
          icon: <Info className="w-3.5 h-3.5 text-blue-600 shrink-0" />
        };
    }
  };

  const currentStyles = getLevelStyles(activeChannel.level);

  return (
    <>
      {/* Ticker Bar */}
      <div className={`border-b px-4 sm:px-6 lg:px-8 py-2 text-xs transition-colors ${currentStyles.bg} flex items-center justify-between gap-3 shrink-0`}>
        <div className="flex items-center space-x-2.5 overflow-hidden flex-1">
          <span className={`px-2 py-0.5 rounded font-bold uppercase text-[10px] tracking-wider shrink-0 ${currentStyles.badge}`}>
            {isSupplier ? 'Supplier Bulletin' : isAdmin ? 'Admin & Governance Ticker' : 'PMO / Manager Bulletin'}
          </span>
          <div className="flex items-center space-x-2 truncate">
            {currentStyles.icon}
            <span className="font-medium text-slate-800 truncate">
              {activeChannel.text || 'No active broadcast announcements.'}
            </span>
            <span className="text-[10px] text-slate-500 hidden sm:inline whitespace-nowrap">
              ({activeChannel.updatedAt})
            </span>
          </div>
        </div>

        {/* Admin Controls */}
        {isAdmin && (
          <button
            type="button"
            id="admin-edit-ticker-btn"
            onClick={() => {
              setSupplierText(tickerConfig.supplierTicker.text);
              setSupplierLevel(tickerConfig.supplierTicker.level);
              setSupplierEnabled(tickerConfig.supplierTicker.enabled);
              setPmoText(tickerConfig.managerPmoTicker.text);
              setPmoLevel(tickerConfig.managerPmoTicker.level);
              setPmoEnabled(tickerConfig.managerPmoTicker.enabled);
              setCopyPmoToSupplier(tickerConfig.copyPmoToSupplier);
              setIsEditorOpen(true);
            }}
            className="inline-flex items-center space-x-1 px-2.5 py-1 bg-white/90 hover:bg-white text-slate-800 border border-slate-300 rounded-md font-semibold text-[11px] shadow-2xs transition shrink-0"
            title="Configure Supplier and PMO/Manager broadcast tickers"
          >
            <Settings className="w-3 h-3 text-purple-600" />
            <span>Admin Ticker Options</span>
          </button>
        )}
      </div>

      {/* Admin Ticker Configuration Modal */}
      {isEditorOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-purple-950 via-slate-900 to-purple-900 px-6 py-4 text-white flex items-center justify-between border-b border-purple-800/50">
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-lg bg-purple-600/30 border border-purple-500/40">
                  <Megaphone className="w-5 h-5 text-purple-300" />
                </div>
                <div>
                  <h3 className="font-semibold text-base leading-tight">
                    Admin Broadcast Ticker Channels
                  </h3>
                  <p className="text-xs text-purple-200/80 mt-0.5">
                    Broadcast real-time announcements, policy alerts, and operational notices to Suppliers and Managers.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsEditorOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveTicker} className="p-6 space-y-5 text-xs">
              {/* PMO / Manager Channel Configuration */}
              <div className="bg-indigo-50/50 border border-indigo-200/80 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-indigo-600"></span>
                    <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
                      Option 1: PMO / Hiring Manager Ticker
                    </h4>
                  </div>
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={pmoEnabled}
                      onChange={(e) => setPmoEnabled(e.target.checked)}
                      className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="font-semibold text-slate-700">Display Active</span>
                  </label>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Bulletin Text &amp; Updates for PMO / Managers
                  </label>
                  <textarea
                    rows={2}
                    value={pmoText}
                    onChange={(e) => handlePmoTextChange(e.target.value)}
                    placeholder="e.g. FY26 Q4 Contingent Billing freeze begins Friday 5 PM. All pending approvals must be completed."
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="flex items-center space-x-4">
                  <span className="font-semibold text-slate-600">Alert Priority Level:</span>
                  <div className="flex items-center space-x-3">
                    <label className="inline-flex items-center space-x-1 cursor-pointer">
                      <input
                        type="radio"
                        name="pmoLevel"
                        value="info"
                        checked={pmoLevel === 'info'}
                        onChange={() => setPmoLevel('info')}
                        className="text-blue-600"
                      />
                      <span className="text-slate-700">Info (Blue)</span>
                    </label>
                    <label className="inline-flex items-center space-x-1 cursor-pointer">
                      <input
                        type="radio"
                        name="pmoLevel"
                        value="warning"
                        checked={pmoLevel === 'warning'}
                        onChange={() => setPmoLevel('warning')}
                        className="text-amber-600"
                      />
                      <span className="text-amber-800 font-medium">Notice (Amber)</span>
                    </label>
                    <label className="inline-flex items-center space-x-1 cursor-pointer">
                      <input
                        type="radio"
                        name="pmoLevel"
                        value="alert"
                        checked={pmoLevel === 'alert'}
                        onChange={() => setPmoLevel('alert')}
                        className="text-rose-600"
                      />
                      <span className="text-rose-800 font-medium">Critical Alert (Red)</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Synchronize Checkbox Feature */}
              <div className="p-3 bg-purple-50 border border-purple-200 rounded-xl flex items-center justify-between">
                <div className="flex items-center space-x-2.5">
                  <Copy className="w-4 h-4 text-purple-600 shrink-0" />
                  <div>
                    <span className="font-bold text-purple-950 block">
                      Copy Ticker Updates from PMO to Supplier Ticker
                    </span>
                    <span className="text-[11px] text-purple-800">
                      When checked, announcements written for PMO/Managers will automatically mirror to the Supplier bulletin.
                    </span>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer ml-3 shrink-0">
                  <input
                    type="checkbox"
                    id="copy-pmo-to-supplier-checkbox"
                    checked={copyPmoToSupplier}
                    onChange={(e) => handleCopyCheckboxChange(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-purple-600"></div>
                </label>
              </div>

              {/* Supplier Channel Configuration */}
              <div className={`border rounded-xl p-4 space-y-3 transition-opacity ${
                copyPmoToSupplier 
                  ? 'bg-slate-100/70 border-slate-200 opacity-80' 
                  : 'bg-blue-50/50 border-blue-200/80'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
                    <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
                      Option 2: Supplier Partner Ticker
                    </h4>
                    {copyPmoToSupplier && (
                      <span className="text-[10px] bg-purple-100 text-purple-800 font-semibold px-2 py-0.5 rounded-full">
                        Mirrored from PMO
                      </span>
                    )}
                  </div>
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={supplierEnabled}
                      onChange={(e) => setSupplierEnabled(e.target.checked)}
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="font-semibold text-slate-700">Display Active</span>
                  </label>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Bulletin Text &amp; Updates for Suppliers
                  </label>
                  <textarea
                    rows={2}
                    disabled={copyPmoToSupplier}
                    value={copyPmoToSupplier ? pmoText : supplierText}
                    onChange={(e) => setSupplierText(e.target.value)}
                    placeholder="e.g. Ensure all background screening verification reports are submitted with initial onboarding forms."
                    className={`w-full px-3 py-2 border rounded-lg text-xs ${
                      copyPmoToSupplier 
                        ? 'bg-slate-100 border-slate-300 text-slate-600 cursor-not-allowed' 
                        : 'bg-white border-slate-300 focus:ring-2 focus:ring-blue-500'
                    }`}
                  />
                </div>

                {!copyPmoToSupplier && (
                  <div className="flex items-center space-x-4">
                    <span className="font-semibold text-slate-600">Alert Priority Level:</span>
                    <div className="flex items-center space-x-3">
                      <label className="inline-flex items-center space-x-1 cursor-pointer">
                        <input
                          type="radio"
                          name="supplierLevel"
                          value="info"
                          checked={supplierLevel === 'info'}
                          onChange={() => setSupplierLevel('info')}
                          className="text-blue-600"
                        />
                        <span className="text-slate-700">Info (Blue)</span>
                      </label>
                      <label className="inline-flex items-center space-x-1 cursor-pointer">
                        <input
                          type="radio"
                          name="supplierLevel"
                          value="warning"
                          checked={supplierLevel === 'warning'}
                          onChange={() => setSupplierLevel('warning')}
                          className="text-amber-600"
                        />
                        <span className="text-amber-800 font-medium">Notice (Amber)</span>
                      </label>
                      <label className="inline-flex items-center space-x-1 cursor-pointer">
                        <input
                          type="radio"
                          name="supplierLevel"
                          value="alert"
                          checked={supplierLevel === 'alert'}
                          onChange={() => setSupplierLevel('alert')}
                          className="text-rose-600"
                        />
                        <span className="text-rose-800 font-medium">Critical Alert (Red)</span>
                      </label>
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Buttons */}
              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsEditorOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 font-semibold hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  id="save-ticker-updates-btn"
                  className="inline-flex items-center space-x-1.5 px-5 py-2 bg-purple-700 hover:bg-purple-600 text-white font-bold rounded-lg shadow-md transition"
                >
                  <Check className="w-4 h-4" />
                  <span>Publish Ticker Updates</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

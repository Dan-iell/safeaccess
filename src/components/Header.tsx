import React, { useState } from 'react';
import { useSafeAccess } from '../context/SafeAccessContext';
import { SafeAccessLogo } from './SafeAccessLogo';
import { Wifi, WifiOff, AlertTriangle, ShieldCheck, UserCheck, ChevronDown, RefreshCw } from 'lucide-react';
import { DutyStatus } from '../types';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenBreakGlass: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  onOpenBreakGlass,
}) => {
  const {
    currentUser,
    allStaff,
    switchStaff,
    updateStaffDutyStatus,
    overrideEvents,
    isOffline,
    toggleOffline,
    offlineQueueCount,
    isSyncing,
    lastIntegrityResult,
  } = useSafeAccess();

  const [isStaffMenuOpen, setIsStaffMenuOpen] = useState(false);

  const pendingOverridesCount = overrideEvents.filter((o) => o.reviewStatus === 'pending').length;
  const isChainBroken = lastIntegrityResult && !lastIntegrityResult.isValid;

  const dutyBadgeColors: Record<DutyStatus, string> = {
    'on shift': 'bg-[#2F6F4E] text-white',
    'on call': 'bg-[#D98E2A] text-white',
    'off shift': 'bg-[#5B6470] text-white',
  };

  return (
    <header className="border-b border-[#D8DCD4] bg-[#FFFFFF] sticky top-0 z-30">
      {/* Top hospital & hackathon strip: slim status line, not a title bar */}
      <div className="bg-[#14213D] text-[#F3F5F1] px-4 py-1 text-xs flex items-center justify-between font-mono whitespace-nowrap overflow-hidden gap-4">
        <div className="flex items-center gap-2 min-w-0">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#2F6F4E] shrink-0"></span>
          <span className="truncate">ICSC 2026 Universities Hackathon &middot; Track C: Health & Medical Systems</span>
        </div>
        <div className="hidden sm:flex items-center gap-4 text-[#A8B2C4] shrink-0">
          <span>LUTH Apex Access-Control Node #04</span>
          <span>Sha-256 Ledger: {isChainBroken ? 'COMPROMISED' : 'CONTINUOUS'}</span>
        </div>
      </div>

      {/* Main Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2 flex flex-wrap items-center justify-between gap-4">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <SafeAccessLogo size={32} />
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-lg tracking-tight text-[#14213D]">
                SafeAccess
              </span>
              <span className="text-sm font-mono uppercase px-1.5 py-0.5 bg-[#F3F5F1] text-[#5B6470] border border-[#D8DCD4] rounded">
                Prototype v1.0
              </span>
            </div>
            <p className="text-xs text-[#5B6470]">
              Role, Ward & Duty-Scoped Access Layer
            </p>
          </div>
        </div>

        {/* Staff Credential + Persona Switcher */}
        {currentUser && (
          <div className="flex items-center gap-2 relative">
            <div className="border border-[#D8DCD4] bg-[#F3F5F1] p-1.5 rounded flex items-center gap-3">
              <div className="w-8 h-8 rounded bg-[#14213D] text-white flex items-center justify-center font-serif text-sm font-semibold">
                {currentUser.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
              </div>
              <div className="text-left">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-base text-[#14213D] leading-tight">
                    {currentUser.name}
                  </span>
                  <span className={`text-sm font-mono px-1.5 py-0.2 rounded uppercase ${dutyBadgeColors[currentUser.dutyStatus]}`}>
                    {currentUser.dutyStatus}
                  </span>
                </div>
                <div className="text-xs text-[#5B6470] flex items-center gap-1.5">
                  <span className="capitalize font-medium">{currentUser.role}</span>
                  <span>&bull;</span>
                  <span>{currentUser.ward} Ward</span>
                  {currentUser.extraDutyWards && currentUser.extraDutyWards.length > 0 && (
                    <span className="text-[#2F6F4E] font-medium">
                      (+{currentUser.extraDutyWards.join(', ')} Grant)
                    </span>
                  )}
                </div>
              </div>

              {/* Duty toggle */}
              <div className="border-l border-[#D8DCD4] pl-2 flex flex-col gap-0.5">
                <span className="text-xs font-mono text-[#5B6470] uppercase">Duty:</span>
                <select
                  value={currentUser.dutyStatus}
                  onChange={(e) => updateStaffDutyStatus(currentUser.id, e.target.value as DutyStatus)}
                  className="text-xs bg-white border border-[#D8DCD4] rounded px-1 py-0.5 font-medium text-[#14213D]"
                  aria-label="Change duty status"
                >
                  <option value="on shift">On Shift</option>
                  <option value="on call">On Call</option>
                  <option value="off shift">Off Shift</option>
                </select>
              </div>

              {/* Persona switch button */}
              <button
                onClick={() => setIsStaffMenuOpen(!isStaffMenuOpen)}
                className="ml-1 p-1 text-[#5B6470] hover:text-[#14213D] hover:bg-[#E2E6DE] rounded border border-transparent hover:border-[#D8DCD4] text-xs flex items-center gap-1"
                title="Switch Staff Persona for Testing"
              >
                <UserCheck className="w-3.5 h-3.5" />
                <span className="hidden md:inline text-sm">Switch</span>
                <ChevronDown className="w-3 h-3" />
              </button>
            </div>

            {/* Quick Switch Dropdown */}
            {isStaffMenuOpen && (
              <div className="absolute right-0 top-full mt-1.5 w-80 bg-white border border-[#14213D] shadow-none z-50 p-2">
                <div className="text-sm font-mono uppercase text-[#5B6470] px-2 py-1 border-b border-[#D8DCD4] mb-1 flex justify-between">
                  <span>Judge Persona Quick-Switch</span>
                  <span>PIN: (mocked)</span>
                </div>
                <div className="max-h-72 overflow-y-auto space-y-1">
                  {allStaff.map((staff) => (
                    <button
                      key={staff.id}
                      onClick={() => {
                        switchStaff(staff.id);
                        setIsStaffMenuOpen(false);
                      }}
                      className={`w-full text-left p-2 text-xs border transition-colors flex items-start justify-between ${
                        currentUser.id === staff.id
                          ? 'bg-[#F3F5F1] border-[#14213D] font-medium'
                          : 'border-transparent hover:bg-[#F3F5F1] hover:border-[#D8DCD4]'
                      }`}
                    >
                      <div>
                        <div className="text-[#14213D] font-semibold text-base">{staff.name}</div>
                        <div className="text-[#5B6470] text-sm capitalize">
                          {staff.role} &middot; {staff.ward} Ward
                        </div>
                        {staff.extraDutyWards && (
                          <div className="text-sm text-[#2F6F4E]">
                            Covering: {staff.extraDutyWards.join(', ')}
                          </div>
                        )}
                      </div>
                      <span className={`text-xs font-mono px-1 py-0.5 uppercase ${dutyBadgeColors[staff.dutyStatus]}`}>
                        {staff.dutyStatus}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Action controls: Emergency Override Button + Offline simulator toggle */}
        <div className="flex items-center gap-2">
          {/* Emergency Access Button: OUTLINE STYLE per spec */}
          <button
            onClick={onOpenBreakGlass}
            id="emergency-access-btn"
            className="border-2 border-[#D98E2A] text-[#14213D] bg-transparent hover:bg-[#FBF1E3] font-mono text-xs font-semibold px-3 py-1.5 rounded flex items-center gap-1.5 transition-colors"
          >
            <AlertTriangle className="w-4 h-4 text-[#D98E2A]" />
            <span>Emergency Access</span>
          </button>

          {/* Network Outage Simulator Toggle */}
          <button
            onClick={toggleOffline}
            id="network-simulator-toggle"
            className={`text-xs font-mono px-3 py-1.5 rounded border flex items-center gap-1.5 transition-colors ${
              isOffline
                ? 'bg-[#D98E2A] text-white border-[#D98E2A]'
                : 'bg-white text-[#5B6470] border-[#D8DCD4] hover:bg-[#F3F5F1] hover:text-[#14213D]'
            }`}
            title="Toggle offline state simulation"
          >
            {isOffline ? (
              <>
                <WifiOff className="w-3.5 h-3.5 text-white" />
                <span>Simulating Outage ({offlineQueueCount})</span>
              </>
            ) : (
              <>
                <Wifi className="w-3.5 h-3.5 text-[#2F6F4E]" />
                <span>Online</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Navigation tabs */}
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center border-t border-[#D8DCD4] overflow-x-auto">
        <button
          onClick={() => setActiveTab('patients')}
          id="nav-tab-patients"
          className={`px-4 py-1.5 text-base font-medium border-b-2 whitespace-nowrap transition-colors ${
            activeTab === 'patients'
              ? 'border-[#14213D] text-[#14213D] font-semibold bg-[#F3F5F1]'
              : 'border-transparent text-[#5B6470] hover:text-[#14213D] hover:bg-[#FAFAF8]'
          }`}
        >
          Scoped Patient List
        </button>

        <button
          onClick={() => setActiveTab('review-queue')}
          id="nav-tab-review-queue"
          className={`px-4 py-1.5 text-base font-medium border-b-2 whitespace-nowrap transition-colors flex items-center gap-1.5 ${
            activeTab === 'review-queue'
              ? 'border-[#14213D] text-[#14213D] font-semibold bg-[#F3F5F1]'
              : 'border-transparent text-[#5B6470] hover:text-[#14213D] hover:bg-[#FAFAF8]'
          }`}
        >
          <span>Supervisor Review Queue</span>
          {pendingOverridesCount > 0 && (
            <span className="bg-[#D98E2A] text-white text-sm font-mono px-1.5 py-0.2 rounded-full">
              {pendingOverridesCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('integrity')}
          id="nav-tab-integrity"
          className={`px-4 py-1.5 text-base font-medium border-b-2 whitespace-nowrap transition-colors flex items-center gap-1.5 ${
            activeTab === 'integrity'
              ? 'border-[#14213D] text-[#14213D] font-semibold bg-[#F3F5F1]'
              : 'border-transparent text-[#5B6470] hover:text-[#14213D] hover:bg-[#FAFAF8]'
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Tamper & Integrity Check</span>
          {isChainBroken && (
            <span className="bg-[#B23A2E] text-white text-sm font-mono px-1.5 py-0.2 rounded-full">
              BROKEN
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('abuse-demo')}
          id="nav-tab-abuse-demo"
          className={`px-4 py-1.5 text-base font-medium border-b-2 whitespace-nowrap transition-colors ${
            activeTab === 'abuse-demo'
              ? 'border-[#14213D] text-[#14213D] font-semibold bg-[#F3F5F1]'
              : 'border-transparent text-[#5B6470] hover:text-[#14213D] hover:bg-[#FAFAF8]'
          }`}
        >
          Abuse Scenario Demo
        </button>

        <button
          onClick={() => setActiveTab('qr-cards')}
          id="nav-tab-qr-cards"
          className={`px-4 py-1.5 text-base font-medium border-b-2 whitespace-nowrap transition-colors ${
            activeTab === 'qr-cards'
              ? 'border-[#14213D] text-[#14213D] font-semibold bg-[#F3F5F1]'
              : 'border-transparent text-[#5B6470] hover:text-[#14213D] hover:bg-[#FAFAF8]'
          }`}
        >
          Patient QR / Emergency Cards
        </button>
      </nav>

      {/* Offline Alert Strip if network is down */}
      {isOffline && (
        <div className="bg-[#FBF1E3] border-t border-b border-[#D98E2A] text-[#14213D] px-4 py-1.5 text-xs font-mono flex items-center justify-between">
          <div className="flex items-center gap-2">
            <WifiOff className="w-4 h-4 text-[#D98E2A] shrink-0" />
            <span>
              Working offline. Access and overrides are still logged locally ({offlineQueueCount} queued) and will sync automatically.
            </span>
          </div>
          <button
            onClick={toggleOffline}
            className="underline hover:text-[#D98E2A] font-semibold ml-2 cursor-pointer"
          >
            Restore Network
          </button>
        </div>
      )}

      {/* Syncing Progress Banner */}
      {isSyncing && (
        <div className="bg-[#E6F0EA] border-t border-b border-[#2F6F4E] text-[#14213D] px-4 py-1.5 text-xs font-mono flex items-center gap-2">
          <RefreshCw className="w-3.5 h-3.5 text-[#2F6F4E] animate-spin" />
          <span>Synchronizing offline access logs and verifying SHA-256 chain...</span>
        </div>
      )}
    </header>
  );
};

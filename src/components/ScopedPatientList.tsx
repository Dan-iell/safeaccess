import React, { useState, useMemo } from 'react';
import { useSafeAccess } from '../context/SafeAccessContext';
import { Patient, Ward } from '../types';
import { AlertTriangle, Lock, Search, Eye, ShieldCheck, Filter } from 'lucide-react';

interface ScopedPatientListProps {
  onSelectPatient: (patient: Patient) => void;
  onOpenBreakGlass: (patient?: Patient) => void;
}

export const ScopedPatientList: React.FC<ScopedPatientListProps> = ({
  onSelectPatient,
  onOpenBreakGlass,
}) => {
  const { currentUser, patients, isScopeVisible, dutyGrants } = useSafeAccess();
  const [searchQuery, setSearchQuery] = useState('');
  const [showAllHospitalWards, setShowAllHospitalWards] = useState(false);
  const [selectedWardFilter, setSelectedWardFilter] = useState<Ward | 'All'>('All');

  // Compute live in-scope patients
  const { scopedPatients, hiddenCount, outOfScopePatients } = useMemo(() => {
    if (!currentUser) {
      return { scopedPatients: [], hiddenCount: patients.length, outOfScopePatients: patients };
    }

    const inScope: { patient: Patient; reason: string; viaOverride?: boolean; viaGrant?: boolean }[] = [];
    const outScope: { patient: Patient; reason: string }[] = [];

    patients.forEach((p) => {
      const res = isScopeVisible(p);
      if (res.visible) {
        inScope.push({ patient: p, reason: res.reason, viaOverride: res.viaOverride, viaGrant: res.viaGrant });
      } else {
        outScope.push({ patient: p, reason: res.reason });
      }
    });

    return {
      scopedPatients: inScope,
      hiddenCount: outScope.length,
      outOfScopePatients: outScope,
    };
  }, [currentUser, patients, isScopeVisible]);

  // Filtered lists
  const filteredInScope = useMemo(() => {
    return scopedPatients.filter((item) => {
      const matchesSearch =
        item.patient.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.patient.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.patient.roomBed.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesWard = selectedWardFilter === 'All' || item.patient.ward === selectedWardFilter;
      return matchesSearch && matchesWard;
    });
  }, [scopedPatients, searchQuery, selectedWardFilter]);

  const filteredOutOfScope = useMemo(() => {
    return outOfScopePatients.filter((item) => {
      const matchesSearch =
        item.patient.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.patient.id.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesWard = selectedWardFilter === 'All' || item.patient.ward === selectedWardFilter;
      return matchesSearch && matchesWard;
    });
  }, [outOfScopePatients, searchQuery, selectedWardFilter]);

  const activeGrantsForUser = dutyGrants.filter(
    (g) => g.staffId === currentUser?.id && g.active
  );

  // Consolidated banner area: at most one banner shows at a time, highest priority wins,
  // with a plain count of any other notices that are currently true but suppressed.
  type BannerInfo = { key: string; priority: number; content: React.ReactNode };
  const banners: BannerInfo[] = [];

  if (currentUser?.dutyStatus === 'off shift') {
    banners.push({
      key: 'off-shift',
      priority: 1,
      content: (
        <div className="bg-[#FBEAE7] border-l-4 border-[#B23A2E] p-4 text-sm">
          <div className="font-semibold text-[#14213D] font-mono mb-1">
            OFF-SHIFT STATUS: SCOPE SUSPENDED
          </div>
          <p className="text-[#5B6470]">
            You are currently logged in as off-duty ({currentUser.name}). SafeAccess hides normal patient lists while off-shift to protect confidential health information. In an urgent bedside emergency, use the Break-Glass override button above.
          </p>
        </div>
      ),
    });
  }

  if (showAllHospitalWards) {
    banners.push({
      key: 'show-all',
      priority: 2,
      content: (
        <div className="bg-[#FBF1E3] border border-[#D98E2A] px-4 py-2.5 text-sm text-[#14213D] flex items-center justify-between">
          <div className="flex items-center gap-2 font-mono">
            <AlertTriangle className="w-3.5 h-3.5 text-[#D98E2A]" />
            <span>
              Viewing full hospital directory. Records outside your scope are locked unless unlocked via Break-Glass.
            </span>
          </div>
          <button
            onClick={() => setShowAllHospitalWards(false)}
            className="font-mono text-[#5B6470] underline hover:text-[#14213D] cursor-pointer"
          >
            Filter Back to Scoped Only
          </button>
        </div>
      ),
    });
  } else if (hiddenCount > 0) {
    banners.push({
      key: 'hidden-count',
      priority: 3,
      content: (
        <div className="bg-[#F3F5F1] border border-[#D8DCD4] px-4 py-2.5 text-sm text-[#5B6470] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Lock className="w-3.5 h-3.5 text-[#5B6470]" />
            <span>
              <strong className="text-[#14213D]">{hiddenCount} patients</strong> outside your current ward and duty scope are not shown here.
            </span>
          </div>
          <button
            onClick={() => setShowAllHospitalWards(true)}
            className="text-[#14213D] font-mono underline hover:text-[#2F6F4E] cursor-pointer"
          >
            Show Out-of-Scope Registry
          </button>
        </div>
      ),
    });
  }

  if (activeGrantsForUser.length > 0) {
    banners.push({
      key: 'duty-grant',
      priority: 4,
      content: (
        <div className="bg-[#E6F0EA] border border-[#2F6F4E] px-4 py-2.5 text-sm font-mono text-[#14213D] flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#2F6F4E] shrink-0"></span>
          <span>
            Active Duty Grant: Covering {activeGrantsForUser.map((g) => g.ward).join(', ')} Ward (Exp: 18:00)
          </span>
        </div>
      ),
    });
  }

  banners.sort((a, b) => a.priority - b.priority);
  const topBanner = banners[0];
  const suppressedBannerCount = banners.length - 1;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 text-left">
      {/* Ward Status Bar */}
      <div className="border border-[#D8DCD4] bg-white p-4 mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-serif text-xl font-medium text-[#14213D]">
              Active Clinical Roster
            </span>
            <span className="font-mono text-xs px-2 py-0.5 bg-[#F3F5F1] text-[#5B6470] border border-[#D8DCD4]">
              {currentUser?.ward} Ward
            </span>
          </div>
          <p className="text-xs text-[#5B6470] mt-0.5 font-mono">
            Access Scope: {currentUser?.name} &middot; Role: <span className="capitalize font-semibold text-[#14213D]">{currentUser?.role}</span> &middot; Duty: <span className="font-semibold text-[#14213D]">{currentUser?.dutyStatus}</span>
          </p>
        </div>

        {/* Emergency Access Button: Visually separated outline style */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => onOpenBreakGlass()}
            id="list-emergency-btn"
            className="border-2 border-[#D98E2A] text-[#14213D] bg-transparent hover:bg-[#FBF1E3] font-mono text-xs font-semibold px-4 py-2 rounded flex items-center gap-2 transition-colors cursor-pointer"
          >
            <AlertTriangle className="w-4 h-4 text-[#D98E2A]" />
            <span>Emergency Access (Override)</span>
          </button>
        </div>
      </div>

      {/* Consolidated Notice Banner: shows at most one banner at a time, highest priority first */}
      {topBanner && (
        <div className="mb-4">
          {topBanner.content}
          {suppressedBannerCount > 0 && (
            <div className="mt-1 px-1 text-xs font-mono text-[#5B6470]">
              +{suppressedBannerCount} more notice{suppressedBannerCount > 1 ? 's' : ''} for this view
            </div>
          )}
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-[#5B6470]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search patient name, ID, or bed number..."
            className="w-full bg-white border border-[#D8DCD4] pl-9 pr-4 py-2 text-xs text-[#14213D] focus:outline-none focus:border-[#14213D]"
          />
        </div>

        <div className="flex items-center gap-2 text-sm font-mono">
          <Filter className={`w-3.5 h-3.5 ${selectedWardFilter !== 'All' ? 'text-[#2F6F4E]' : 'text-[#5B6470]'}`} />
          <span className={selectedWardFilter !== 'All' ? 'text-[#2F6F4E] font-semibold' : 'text-[#5B6470]'}>Ward:</span>
          <select
            value={selectedWardFilter}
            onChange={(e) => setSelectedWardFilter(e.target.value as Ward | 'All')}
            className={`bg-[#F3F5F1] border px-2 py-1 text-[#14213D] font-mono text-sm focus:outline-none focus:border-[#14213D] ${
              selectedWardFilter !== 'All' ? 'border-[#2F6F4E]' : 'border-[#D8DCD4]'
            }`}
          >
            <option value="All">All Wards</option>
            <option value="Cardiology">Cardiology</option>
            <option value="Pediatrics">Pediatrics</option>
            <option value="Emergency">Emergency</option>
            <option value="General Medicine">General Medicine</option>
          </select>
        </div>
      </div>

      {/* Flat List (Not Card Grid) with Hairline Dividers */}
      <div className="border border-[#D8DCD4] bg-white divide-y divide-[#D8DCD4]">
        {/* Table Header */}
        <div className="bg-[#F3F5F1] px-4 py-2 text-sm font-mono uppercase text-[#5B6470] grid grid-cols-12 gap-2">
          <div className="col-span-1"><span className="hidden sm:inline">Status</span></div>
          <div className="col-span-4 sm:col-span-3">Patient</div>
          <div className="col-span-2 hidden sm:block">Ward / Bed</div>
          <div className="col-span-3 lg:col-span-2 hidden md:block">Active Conditions</div>
          <div className="col-span-2 hidden lg:block">Blood / Genotype</div>
          <div className="col-span-7 sm:col-span-4 md:col-span-3 lg:col-span-2 text-right">Actions</div>
        </div>

        {/* In-Scope Rows */}
        {filteredInScope.length > 0 ? (
          filteredInScope.map(({ patient, reason, viaOverride, viaGrant }) => (
            <div
              key={patient.id}
              className={`px-4 py-2 grid grid-cols-12 gap-2 items-center hover:bg-[#FAFAF8] transition-colors ${
                viaOverride
                  ? 'border-l-4 border-[#D98E2A] bg-[#FBF1E3]/20'
                  : 'border-l-4 border-[#2F6F4E]'
              }`}
            >
              {/* Status Indicator */}
              <div className="col-span-1 flex items-center">
                {viaOverride ? (
                  <span
                    className="w-2.5 h-2.5 rounded-full bg-[#D98E2A]"
                    title="Active Emergency Override"
                  ></span>
                ) : (
                  <span
                    className="w-2.5 h-2.5 rounded-full bg-[#2F6F4E]"
                    title="In-Scope Access"
                  ></span>
                )}
              </div>

              {/* Patient Info */}
              <div className="col-span-4 sm:col-span-3">
                <div className="font-semibold text-base text-[#14213D] truncate">{patient.name}</div>
                <div className="text-sm font-mono text-[#5B6470] flex items-center gap-1.5">
                  <span>{patient.id}</span>
                  {patient.isSensitive && (
                    <span className="text-[#D98E2A] font-semibold uppercase">&bull; Sensitive</span>
                  )}
                </div>
              </div>

              {/* Ward / Bed */}
              <div className="col-span-2 hidden sm:block text-xs font-mono">
                <span className="text-[#14213D] block">{patient.ward}</span>
                <span className="text-[#5B6470] text-sm">{patient.roomBed}</span>
              </div>

              {/* Conditions */}
              <div className="col-span-3 lg:col-span-2 hidden md:block text-xs text-[#5B6470] truncate">
                <span>{patient.majorConditions[0]}</span>
                {patient.majorConditions.length > 1 && (
                  <span className="text-sm text-[#5B6470] ml-1">
                    (+{patient.majorConditions.length - 1} more)
                  </span>
                )}
              </div>

              {/* Blood / Genotype */}
              <div className="col-span-2 hidden lg:block text-xs font-mono">
                <span className="font-semibold text-[#14213D] mr-2">{patient.bloodType}</span>
                <span className="text-[#5B6470]">{patient.genotype}</span>
              </div>

              {/* Action Buttons: inline, right-aligned within the same row */}
              <div className="col-span-7 sm:col-span-4 md:col-span-3 lg:col-span-2 text-right flex items-center justify-end gap-2">
                <button
                  onClick={() => onSelectPatient(patient)}
                  className="px-3 py-1 bg-[#14213D] text-white hover:bg-[#1E3056] text-xs font-mono font-medium flex items-center gap-1 cursor-pointer"
                >
                  <Eye className="w-3 h-3" />
                  <span>View Chart</span>
                </button>
              </div>
            </div>
          ))
        ) : (
          !showAllHospitalWards && (
            <div className="p-8 text-center text-xs text-[#5B6470]">
              <p className="font-serif text-sm text-[#14213D] mb-1">
                No patients currently in scope for this roster filter.
              </p>
              <p>
                Staff scope is computed from your assigned ward ({currentUser?.ward}), role ({currentUser?.role}), and active status ({currentUser?.dutyStatus}).
              </p>
            </div>
          )
        )}

        {/* Out-of-Scope Rows (Visible when toggled) */}
        {showAllHospitalWards &&
          filteredOutOfScope.map(({ patient, reason }) => (
            <div
              key={patient.id}
              className="px-4 py-2 grid grid-cols-12 gap-2 items-center bg-[#F3F5F1]/50 border-l-4 border-[#5B6470]"
            >
              <div className="col-span-1 flex items-center">
                <Lock className="w-3.5 h-3.5 text-[#5B6470]" />
              </div>

              <div className="col-span-4 sm:col-span-3 opacity-80">
                <div className="font-semibold text-base text-[#14213D] truncate">{patient.name}</div>
                <div className="text-sm font-mono text-[#5B6470]">{patient.id}</div>
              </div>

              <div className="col-span-2 hidden sm:block text-xs font-mono text-[#5B6470]">
                <span>{patient.ward}</span>
                <span className="text-sm block">{patient.roomBed}</span>
              </div>

              <div className="col-span-3 lg:col-span-2 hidden md:block text-xs text-[#5B6470] italic">
                <span>[Clinical record hidden outside ward scope]</span>
              </div>

              <div className="col-span-2 hidden lg:block text-xs font-mono text-[#5B6470]">
                <span>{patient.bloodType}</span>
              </div>

              <div className="col-span-7 sm:col-span-4 md:col-span-3 lg:col-span-2 text-right">
                <button
                  onClick={() => onOpenBreakGlass(patient)}
                  className="px-2.5 py-1 border border-[#D98E2A] text-[#14213D] hover:bg-[#FBF1E3] text-sm font-mono font-semibold flex items-center gap-1 ml-auto cursor-pointer"
                >
                  <AlertTriangle className="w-3 h-3 text-[#D98E2A]" />
                  <span>Break Glass</span>
                </button>
              </div>
            </div>
          ))}
      </div>

      {/* Explanatory footnote in calm nurse voice */}
      <div className="mt-4 p-3 bg-[#F3F5F1] border border-[#D8DCD4] text-xs text-[#5B6470]">
        <span className="font-mono text-[#14213D] font-semibold uppercase mr-2">
          Scope Rule:
        </span>
        Only patients in your assigned ward are accessible during active shifts. Clinical staff covering additional wards must receive an explicit time-bound duty grant or use the emergency override.
      </div>
    </div>
  );
};

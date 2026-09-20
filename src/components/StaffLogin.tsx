import React, { useState } from 'react';
import { useSafeAccess } from '../context/SafeAccessContext';
import { SafeAccessLogo } from './SafeAccessLogo';
import { Lock, ArrowRight, AlertCircle } from 'lucide-react';

interface StaffLoginProps {
  onSuccess?: () => void;
}

export const StaffLogin: React.FC<StaffLoginProps> = ({ onSuccess }) => {
  const { login, allStaff, switchStaff } = useSafeAccess();
  const [staffId, setStaffId] = useState('ST-DOC-01');
  const [pin, setPin] = useState('1234');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const ok = login(staffId.trim(), pin.trim());
    if (ok) {
      if (onSuccess) onSuccess();
    } else {
      setError('Staff ID or PIN not recognized. Check credential list below.');
    }
  };

  const handleSelectPreset = (id: string, presetPin: string) => {
    setStaffId(id);
    setPin(presetPin);
    switchStaff(id);
    if (onSuccess) onSuccess();
  };

  return (
    <div className="max-w-md mx-auto py-12 px-4 text-left">
      <div className="flex items-center gap-3 mb-6">
        <SafeAccessLogo size={36} />
        <div>
          <h1 className="font-serif text-2xl font-medium text-[#14213D]">
            Staff Authentication
          </h1>
          <p className="text-xs text-[#5B6470] font-mono">
            ICSC 2026 Universities Hackathon &middot; Track C: Health & Medical Systems
          </p>
        </div>
      </div>

      <div className="bg-white border border-[#D8DCD4] p-6 rounded-none">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-mono uppercase text-[#5B6470] mb-1">
              Staff ID
            </label>
            <input
              type="text"
              id="staff-id-input"
              value={staffId}
              onChange={(e) => setStaffId(e.target.value)}
              className="w-full bg-[#F3F5F1] border border-[#D8DCD4] px-3 py-2 text-sm font-mono text-[#14213D] focus:outline-none focus:border-[#14213D]"
              placeholder="ST-DOC-01"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-mono uppercase text-[#5B6470] mb-1">
              Security PIN
            </label>
            <input
              type="password"
              id="staff-pin-input"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              className="w-full bg-[#F3F5F1] border border-[#D8DCD4] px-3 py-2 text-sm font-mono text-[#14213D] focus:outline-none focus:border-[#14213D]"
              placeholder="••••"
              maxLength={6}
              required
            />
          </div>

          {error && (
            <div className="p-2.5 bg-[#FBEAE7] border-l-4 border-[#B23A2E] text-xs text-[#14213D] flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-[#B23A2E] shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            id="staff-login-submit"
            className="w-full bg-[#14213D] text-white hover:bg-[#1E3056] py-2.5 px-4 text-xs font-mono uppercase tracking-wider font-semibold flex items-center justify-center gap-2 transition-colors"
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Authenticate Session</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>

          {/* Explicit requirement: One line under the form */}
          <p className="text-xs text-[#5B6470] text-left pt-1 border-t border-[#D8DCD4]">
            Access is scoped to your current role, ward and shift.
          </p>
        </form>
      </div>

      {/* Quick persona presets for hackathon judges */}
      <div className="mt-8 border border-[#D8DCD4] bg-[#FFFFFF] p-4 text-left">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-mono uppercase font-semibold text-[#14213D]">
            Judge Quick-Select Roster
          </span>
          <span className="text-[11px] text-[#5B6470]">Click to sign in instantly</span>
        </div>
        <div className="space-y-1.5 text-xs">
          {allStaff.slice(0, 6).map((staff) => (
            <button
              key={staff.id}
              onClick={() => handleSelectPreset(staff.id, staff.pin)}
              className="w-full text-left p-2 border border-[#D8DCD4] hover:border-[#14213D] hover:bg-[#F3F5F1] flex items-center justify-between transition-colors"
            >
              <div>
                <span className="font-semibold text-[#14213D]">{staff.name}</span>
                <span className="text-[#5B6470] text-[11px] ml-1.5">
                  ({staff.role} &middot; {staff.ward})
                </span>
                {staff.extraDutyWards && (
                  <span className="text-[10px] text-[#2F6F4E] block">
                    + Duty Grant: {staff.extraDutyWards.join(', ')}
                  </span>
                )}
              </div>
              <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded uppercase ${
                staff.dutyStatus === 'on shift' ? 'bg-[#2F6F4E] text-white' :
                staff.dutyStatus === 'on call' ? 'bg-[#D98E2A] text-white' :
                'bg-[#5B6470] text-white'
              }`}>
                {staff.dutyStatus}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { useSafeAccess } from '../context/SafeAccessContext';
import { AlertTriangle, X, ShieldAlert, ArrowRight, Clock } from 'lucide-react';
import { Patient } from '../types';

interface BreakGlassModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetPatient?: Patient | null;
  onAccessGranted?: (patient: Patient) => void;
}

export const BreakGlassModal: React.FC<BreakGlassModalProps> = ({
  isOpen,
  onClose,
  targetPatient,
  onAccessGranted,
}) => {
  const { currentUser, patients, grantEmergencyAccess } = useSafeAccess();
  const [selectedPatientId, setSelectedPatientId] = useState<string>(
    targetPatient ? targetPatient.id : patients[0]?.id || ''
  );
  const [reason, setReason] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const currentTarget = targetPatient || patients.find((p) => p.id === selectedPatientId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentTarget) return;
    if (!reason.trim()) return;

    setIsSubmitting(true);
    const success = await grantEmergencyAccess(currentTarget.id, reason.trim());
    setIsSubmitting(false);

    if (success) {
      if (onAccessGranted) {
        onAccessGranted(currentTarget);
      }
      onClose();
      setReason('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#14213D]/60 backdrop-blur-none">
      <div className="bg-[#FFFFFF] border-2 border-[#D98E2A] w-full max-w-lg text-left shadow-none">
        {/* Signal Amber Header */}
        <div className="bg-[#FBF1E3] border-b border-[#D98E2A] p-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded bg-[#D98E2A] text-white flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="font-serif text-lg font-medium text-[#14213D] leading-tight">
                Break-Glass Emergency Override
              </h2>
              <p className="text-[11px] font-mono text-[#9A6413]">
                Unconditional Clinical Access &middot; Never Blocked
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-[#5B6470] hover:text-[#14213D] p-1 cursor-pointer"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Active staff credential confirmation */}
          <div className="bg-[#F3F5F1] border-l-4 border-[#14213D] p-3 text-xs">
            <span className="font-mono text-[#5B6470] uppercase block text-[10px]">
              Attributed Healthcare Worker
            </span>
            <span className="font-semibold text-[#14213D]">
              {currentUser?.name || 'Unauthenticated'}
            </span>
            <span className="text-[#5B6470] ml-2">
              ({currentUser?.role} &middot; {currentUser?.ward} Ward &middot; {currentUser?.dutyStatus})
            </span>
          </div>

          {/* Patient identification */}
          {targetPatient ? (
            <div className="bg-[#F3F5F1] border border-[#D8DCD4] p-3 text-xs">
              <span className="font-mono text-[#5B6470] uppercase block text-[10px]">
                Target Patient Record
              </span>
              <div className="flex items-center justify-between mt-1">
                <span className="font-semibold text-sm text-[#14213D]">{targetPatient.name}</span>
                <span className="font-mono text-[11px] bg-white px-2 py-0.5 border border-[#D8DCD4]">
                  {targetPatient.id} &middot; {targetPatient.ward} Ward
                </span>
              </div>
            </div>
          ) : (
            <div>
              <label className="block text-xs font-mono uppercase text-[#5B6470] mb-1">
                Select Patient Record to Unlock
              </label>
              <select
                id="emergency-patient-select"
                value={selectedPatientId}
                onChange={(e) => setSelectedPatientId(e.target.value)}
                className="w-full bg-[#F3F5F1] border border-[#D8DCD4] px-3 py-2 text-xs font-mono text-[#14213D]"
              >
                {patients.map((p) => (
                  <option key={p.id} value={p.id}>
                    [{p.id}] {p.name} — {p.ward} ({p.roomBed})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Single required free-text reason (no dropdown per spec!) */}
          <div>
            <label className="block text-xs font-mono uppercase text-[#14213D] font-semibold mb-1">
              Required One-Line Reason (Free Text)
            </label>
            <input
              type="text"
              id="emergency-reason-input"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Acute cardiac arrest in triage corridor; requiring immediate allergy check"
              className="w-full bg-[#F3F5F1] border-2 border-[#D98E2A] px-3 py-2.5 text-sm text-[#14213D] placeholder:text-[#5B6470]/60 focus:outline-none focus:bg-white"
              required
              autoFocus
            />
            <p className="text-[11px] text-[#5B6470] mt-1">
              Specify the clinical emergency triggering this override. No dropdown selection is enforced.
            </p>
          </div>

          {/* Single Action Button: "Grant Access Now" — must never be blocked, no confirmation step */}
          <div className="pt-2">
            <button
              type="submit"
              id="grant-access-now-btn"
              disabled={isSubmitting || !reason.trim()}
              className="w-full bg-[#D98E2A] hover:bg-[#B8741E] text-white py-3 px-4 text-xs font-mono uppercase tracking-wider font-semibold flex items-center justify-center gap-2 transition-colors disabled:opacity-50 cursor-pointer"
            >
              <ShieldAlert className="w-4 h-4" />
              <span>{isSubmitting ? 'Sealing Cryptographic Log...' : 'Grant Access Now'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            {/* Required text below the button before they click per spec */}
            <div className="mt-3 p-2 bg-[#F3F5F1] border border-[#D8DCD4] text-xs text-[#5B6470] flex items-center gap-2">
              <Clock className="w-3.5 h-3.5 text-[#D98E2A] shrink-0" />
              <span>
                This will be logged and flagged for supervisor review within 4 hours.
              </span>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

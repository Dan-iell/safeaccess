import React, { useEffect } from 'react';
import { Patient, Role } from '../types';
import { useSafeAccess } from '../context/SafeAccessContext';
import { X, ShieldCheck, AlertTriangle, Lock, Clock, Heart, AlertCircle, FileText, User } from 'lucide-react';

interface PatientRecordModalProps {
  patient: Patient | null;
  onClose: () => void;
  onTriggerEmergency: (patient: Patient) => void;
  isQrSubsetOnly?: boolean;
}

export const PatientRecordModal: React.FC<PatientRecordModalProps> = ({
  patient,
  onClose,
  onTriggerEmergency,
  isQrSubsetOnly = false,
}) => {
  const { currentUser, isScopeVisible, logNormalView } = useSafeAccess();

  useEffect(() => {
    if (patient && currentUser) {
      const scope = isScopeVisible(patient);
      if (scope.visible && !scope.viaOverride && !isQrSubsetOnly) {
        logNormalView(patient);
      }
    }
  }, [patient?.id]);

  if (!patient) return null;

  const scope = isScopeVisible(patient);
  const isAccessible = scope.visible || isQrSubsetOnly;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#14213D]/60 backdrop-blur-none">
      <div className="bg-[#FFFFFF] border border-[#14213D] w-full max-w-2xl max-h-[90vh] flex flex-col text-left">
        {/* Header */}
        <div className="p-4 border-b border-[#D8DCD4] flex items-center justify-between bg-[#F3F5F1]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded bg-[#14213D] text-white flex items-center justify-center font-mono text-sm font-semibold">
              {patient.bloodType}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-serif text-lg font-semibold text-[#14213D]">
                  {patient.name}
                </h2>
                <span className="font-mono text-xs text-[#5B6470] bg-white px-2 py-0.5 border border-[#D8DCD4]">
                  {patient.id}
                </span>
              </div>
              <p className="text-xs text-[#5B6470] font-mono">
                {patient.ward} Ward &middot; {patient.roomBed} &middot; Genotype: <span className="font-semibold text-[#14213D]">{patient.genotype}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-[#5B6470] hover:text-[#14213D] p-1 cursor-pointer"
            aria-label="Close record view"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Access Status Banner */}
        {isAccessible ? (
          scope.viaOverride ? (
            <div className="bg-[#FBF1E3] border-b-2 border-[#D98E2A] p-3 text-xs text-[#14213D] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-[#D98E2A] shrink-0" />
                <div>
                  <span className="font-semibold uppercase tracking-wide text-[#9A6413] font-mono">
                    Emergency Override Active:
                  </span>
                  <span className="ml-1.5 font-medium">
                    This access is logged to the SHA-256 chain and queued for supervisor review within 4 hours.
                  </span>
                </div>
              </div>
              <span className="font-mono text-sm bg-white px-2 py-0.5 border border-[#D98E2A] text-[#9A6413] shrink-0">
                4h Auto-Expiry
              </span>
            </div>
          ) : isQrSubsetOnly ? (
            <div className="bg-[#FBF1E3] border-b-2 border-[#D98E2A] p-3 text-xs text-[#14213D] flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-[#D98E2A] shrink-0" />
              <div>
                <span className="font-semibold uppercase tracking-wide text-[#9A6413] font-mono">
                  Emergency QR Subset Released:
                </span>
                <span className="ml-1.5 text-[#5B6470]">
                  Releasing vital emergency fields only. Full clinical history remains locked under duty scope.
                </span>
              </div>
            </div>
          ) : (
            <div className="bg-[#E6F0EA] border-b border-[#2F6F4E] p-2.5 text-xs text-[#14213D] flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#2F6F4E] shrink-0" />
              <span className="font-medium">
                {scope.reason}
              </span>
            </div>
          )
        ) : (
          <div className="bg-[#FBEAE7] border-b-2 border-[#B23A2E] p-4 text-xs text-[#14213D]">
            <div className="flex items-center gap-2 font-semibold font-mono text-[#B23A2E] mb-1">
              <Lock className="w-4 h-4" />
              <span>RECORD SCOPE RESTRICTION</span>
            </div>
            <p className="text-[#5B6470] mb-3">
              {currentUser?.name || 'User'} is assigned to {currentUser?.ward} Ward ({currentUser?.dutyStatus}). This patient is admitted to {patient.ward} Ward.
            </p>
            <button
              onClick={() => onTriggerEmergency(patient)}
              className="border-2 border-[#D98E2A] bg-white hover:bg-[#FBF1E3] text-[#14213D] font-mono text-xs font-semibold px-4 py-2 flex items-center gap-2 transition-colors cursor-pointer"
            >
              <AlertTriangle className="w-4 h-4 text-[#D98E2A]" />
              <span>Invoke Break-Glass Emergency Access</span>
            </button>
          </div>
        )}

        {/* Content Body */}
        {isAccessible ? (
          <div className="p-6 overflow-y-auto space-y-6 text-xs">
            {/* Critical Emergency Subset (Always visible if accessible) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Allergies */}
              <div className="border border-[#D8DCD4] p-3 bg-[#F3F5F1]">
                <div className="flex items-center gap-1.5 font-mono uppercase text-sm text-[#5B6470] font-semibold mb-2">
                  <AlertCircle className="w-3.5 h-3.5 text-[#D98E2A]" />
                  <span>Documented Allergies</span>
                </div>
                {patient.allergies.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {patient.allergies.map((a, i) => (
                      <span
                        key={i}
                        className="bg-white border border-[#D98E2A] text-[#14213D] font-semibold px-2 py-0.5 rounded-none font-mono"
                      >
                        {a}
                      </span>
                    ))}
                  </div>
                ) : (
                  <span className="text-[#5B6470] italic">No known drug allergies recorded (NKDA)</span>
                )}
              </div>

              {/* Blood & Genotype */}
              <div className="border border-[#D8DCD4] p-3 bg-[#F3F5F1]">
                <div className="flex items-center gap-1.5 font-mono uppercase text-sm text-[#5B6470] font-semibold mb-2">
                  <Heart className="w-3.5 h-3.5 text-[#2F6F4E]" />
                  <span>Blood Group & Genotype</span>
                </div>
                <div className="flex items-center gap-4 text-sm font-semibold text-[#14213D]">
                  <div>
                    <span className="text-sm text-[#5B6470] block font-mono">ABO/Rh:</span>
                    <span>{patient.bloodType}</span>
                  </div>
                  <div className="border-l border-[#D8DCD4] pl-4">
                    <span className="text-sm text-[#5B6470] block font-mono">Hemoglobin Genotype:</span>
                    <span className={patient.genotype === 'SS' ? 'text-[#D98E2A]' : ''}>{patient.genotype}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Major Clinical Conditions */}
            <div>
              <span className="font-mono uppercase text-sm text-[#5B6470] font-semibold block mb-2">
                Primary Diagnoses & Active Conditions
              </span>
              <ul className="border border-[#D8DCD4] divide-y divide-[#D8DCD4] bg-white">
                {patient.majorConditions.map((cond, i) => (
                  <li key={i} className="p-2.5 flex items-center justify-between">
                    <span className="font-medium text-[#14213D]">{cond}</span>
                    <span className="text-sm font-mono text-[#5B6470] uppercase">Active</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Current Medications */}
            <div>
              <span className="font-mono uppercase text-sm text-[#5B6470] font-semibold block mb-2">
                Current Active Medications & Regimen
              </span>
              <ul className="border border-[#D8DCD4] divide-y divide-[#D8DCD4] bg-white font-mono text-xs">
                {patient.currentMedications.map((med, i) => (
                  <li key={i} className="p-2.5 text-[#14213D]">
                    {med}
                  </li>
                ))}
              </ul>
            </div>

            {/* Emergency Contact */}
            <div className="border border-[#D8DCD4] p-3 bg-[#F3F5F1]">
              <div className="flex items-center gap-1.5 font-mono uppercase text-sm text-[#5B6470] font-semibold mb-1">
                <User className="w-3.5 h-3.5 text-[#5B6470]" />
                <span>Next of Kin / Emergency Contact</span>
              </div>
              <div className="text-xs text-[#14213D] flex flex-wrap items-center gap-4 mt-1 font-mono">
                <span className="font-semibold">{patient.emergencyContact.name}</span>
                <span className="text-[#5B6470]">({patient.emergencyContact.relationship})</span>
                <span className="text-[#2F6F4E] font-medium">{patient.emergencyContact.phone}</span>
              </div>
            </div>

            {/* Full Clinical Progress Notes — OMITTED if QR subset per specification! */}
            {!isQrSubsetOnly ? (
              <div>
                <div className="flex items-center gap-1.5 font-mono uppercase text-sm text-[#5B6470] font-semibold mb-2">
                  <FileText className="w-3.5 h-3.5 text-[#14213D]" />
                  <span>Clinical Progress & Attending Physician Notes</span>
                </div>
                <div className="border border-[#D8DCD4] p-3.5 bg-white text-xs leading-relaxed text-[#14213D]">
                  <p>{patient.clinicalNotes}</p>
                  <div className="mt-3 pt-2 border-t border-[#D8DCD4] flex items-center justify-between text-xs text-[#5B6470] font-mono">
                    <span>Admitted: {new Date(patient.admittedAt).toLocaleDateString()} at {new Date(patient.admittedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    {patient.isSensitive && (
                      <span className="text-[#D98E2A] font-semibold">Confidential Patient File</span>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-3 bg-[#F3F5F1] border border-[#D8DCD4] text-sm text-[#5B6470] italic">
                Full clinical chart notes and longitudinal history are withheld on physical QR scan. Only immediate resuscitation & allergy parameters have been decrypted.
              </div>
            )}
          </div>
        ) : (
          <div className="p-8 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-[#FBEAE7] mx-auto flex items-center justify-center">
              <Lock className="w-6 h-6 text-[#B23A2E]" />
            </div>
            <div className="max-w-md mx-auto">
              <h3 className="font-serif text-base font-semibold text-[#14213D] mb-1">
                Access Restricted by Ward Policy
              </h3>
              <p className="text-xs text-[#5B6470]">
                SafeAccess enforces least-privilege scoping. If you are treating this patient in an acute clinical situation, you may unlock the record immediately using Break-Glass Emergency Access.
              </p>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="p-3 border-t border-[#D8DCD4] bg-[#F3F5F1] flex items-center justify-between text-xs font-mono text-[#5B6470]">
          <span>Audit Attribution: {currentUser?.id || 'ANONYMOUS'}</span>
          <button
            onClick={onClose}
            className="px-3 py-1.5 bg-[#14213D] text-white text-xs font-mono font-medium hover:bg-[#1E3056] cursor-pointer"
          >
            Close Record
          </button>
        </div>
      </div>
    </div>
  );
};

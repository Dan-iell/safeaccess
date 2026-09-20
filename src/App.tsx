import React, { useState } from 'react';
import { SafeAccessProvider, useSafeAccess } from './context/SafeAccessContext';
import { Header } from './components/Header';
import { StaffLogin } from './components/StaffLogin';
import { ScopedPatientList } from './components/ScopedPatientList';
import { ReviewQueue } from './components/ReviewQueue';
import { IntegrityCheck } from './components/IntegrityCheck';
import { AbuseDemoView } from './components/AbuseDemoView';
import { PatientQRCardView } from './components/PatientQRCardView';
import { BreakGlassModal } from './components/BreakGlassModal';
import { PatientRecordModal } from './components/PatientRecordModal';
import { Patient } from './types';
import { BookOpen, Shield, ChevronRight, X } from 'lucide-react';

const MainApp: React.FC = () => {
  const { currentUser, syncMessage } = useSafeAccess();
  const [activeTab, setActiveTab] = useState<string>('patients');
  const [isBreakGlassOpen, setIsBreakGlassOpen] = useState<boolean>(false);
  const [breakGlassTargetPatient, setBreakGlassTargetPatient] = useState<Patient | null>(null);
  const [viewingPatient, setViewingPatient] = useState<Patient | null>(null);
  const [isDossierOpen, setIsDossierOpen] = useState<boolean>(false);

  const handleOpenBreakGlass = (patient?: Patient) => {
    setBreakGlassTargetPatient(patient || null);
    setIsBreakGlassOpen(true);
  };

  const handleAccessGranted = (patient: Patient) => {
    setViewingPatient(patient);
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-[#F3F5F1] flex flex-col justify-between">
        <StaffLogin />
        <footer className="py-6 border-t border-[#D8DCD4] text-center text-xs text-[#5B6470] font-mono">
          SafeAccess &middot; ICSC 2026 Universities Hackathon, Track C: Health & Medical Systems, Nigeria
        </footer>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F3F5F1] flex flex-col text-[#14213D]">
      {/* Ward Signage Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenBreakGlass={() => handleOpenBreakGlass()}
      />

      {/* Sync notification strip if message present */}
      {syncMessage && (
        <div className="bg-[#E6F0EA] border-b border-[#2F6F4E] px-4 py-2 text-xs font-mono text-[#14213D] text-left">
          {syncMessage}
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1">
        {activeTab === 'patients' && (
          <ScopedPatientList
            onSelectPatient={(patient) => setViewingPatient(patient)}
            onOpenBreakGlass={(patient) => handleOpenBreakGlass(patient)}
          />
        )}

        {activeTab === 'review-queue' && <ReviewQueue />}

        {activeTab === 'integrity' && <IntegrityCheck />}

        {activeTab === 'abuse-demo' && (
          <AbuseDemoView onGoToQueue={() => setActiveTab('review-queue')} />
        )}

        {activeTab === 'qr-cards' && <PatientQRCardView />}
      </main>

      {/* Break-Glass Modal */}
      <BreakGlassModal
        isOpen={isBreakGlassOpen}
        onClose={() => setIsBreakGlassOpen(false)}
        targetPatient={breakGlassTargetPatient}
        onAccessGranted={handleAccessGranted}
      />

      {/* Patient Record Drawer / Modal */}
      <PatientRecordModal
        patient={viewingPatient}
        onClose={() => setViewingPatient(null)}
        onTriggerEmergency={(p) => {
          setViewingPatient(null);
          handleOpenBreakGlass(p);
        }}
      />

      {/* Nigerian Healthcare Systems Context Dossier Modal (For judges) */}
      {isDossierOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#14213D]/60 backdrop-blur-none">
          <div className="bg-white border-2 border-[#14213D] w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 text-left">
            <div className="flex items-center justify-between border-b border-[#D8DCD4] pb-3 mb-4">
              <div>
                <h2 className="font-serif text-xl font-bold text-[#14213D]">
                  SafeAccess &middot; Clinical System Architecture Brief
                </h2>
                <p className="text-xs font-mono text-[#5B6470]">
                  ICSC 2026 Universities Hackathon &middot; Track C: Health & Medical Systems, Nigeria
                </p>
              </div>
              <button
                onClick={() => setIsDossierOpen(false)}
                className="text-[#5B6470] hover:text-[#14213D] p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs text-[#14213D]">
              <div>
                <h3 className="font-serif font-semibold text-sm text-[#14213D] mb-1">
                  1. The Ground Reality in Nigeria
                </h3>
                <p className="text-[#5B6470] leading-relaxed">
                  Electronic Health Record adoption in Nigerian tertiary hospitals sits at only 18–23%. In 2024, the Plateau State Contributory Healthcare Management Agency (PLASCHEMA) suffered an exposure of 45GB of unencrypted records affecting over 37,000 citizens. Concurrently, severe staffing pressures (1 doctor per 3,474–15,000+ patients nationally, and up to 1:54,000 in northern states) force staff to share logins across shifts and rotate rapidly between wards.
                </p>
              </div>

              <div>
                <h3 className="font-serif font-semibold text-sm text-[#14213D] mb-1">
                  2. The Core Tension Solved
                </h3>
                <p className="text-[#5B6470] leading-relaxed">
                  In an acute resuscitation, a doctor cannot be blocked by a login screen. However, an unmonitored override is a backdoor for quiet leaks (HIV status, genotype compatibility for marriage, political VIP admissions). SafeAccess resolves this: <strong>Emergency override is never blocked, but it is never silent.</strong> Every override is permanently written to a SHA-256 hash chain and flagged for mandatory supervisor review within 4 hours.
                </p>
              </div>

              <div className="border border-[#D8DCD4] p-3 bg-[#F3F5F1]">
                <h3 className="font-serif font-semibold text-sm text-[#14213D] mb-1">
                  3. Key Architectural Pillars
                </h3>
                <ul className="space-y-1.5 text-[11px] font-mono text-[#5B6470]">
                  <li>&bull; <strong className="text-[#14213D]">Role + Ward + Duty Scoping:</strong> Access is computed live from shift assignment, not blanket logins.</li>
                  <li>&bull; <strong className="text-[#14213D]">Tamper-Evident Ledger:</strong> SHA-256 hash chain via browser SubtleCrypto; directly editing records severs the chain visibly.</li>
                  <li>&bull; <strong className="text-[#14213D]">Offline Resilience:</strong> Fully functional during grid outages; queues logs and re-verifies chain continuity upon reconnect.</li>
                  <li>&bull; <strong className="text-[#14213D]">Minimal Emergency QR Tokens:</strong> Bedside scanning releases only vital resuscitation parameters (blood group, allergies, active meds), never full clinical history.</li>
                </ul>
              </div>
            </div>

            <div className="mt-6 pt-3 border-t border-[#D8DCD4] text-right">
              <button
                onClick={() => setIsDossierOpen(false)}
                className="px-4 py-2 bg-[#14213D] text-white text-xs font-mono font-semibold"
              >
                Close Briefing
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t border-[#D8DCD4] bg-white py-3 px-4 sm:px-6 flex flex-wrap items-center justify-between text-xs text-[#5B6470] font-mono">
        <div>
          <span>SafeAccess &middot; ICSC 2026 Universities Hackathon, Track C</span>
          <span className="mx-2">&bull;</span>
          <span>Zero AI/LLM &middot; Deterministic Rule-Based Access Control</span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsDossierOpen(true)}
            className="text-[#14213D] font-semibold underline hover:text-[#2F6F4E] flex items-center gap-1 cursor-pointer"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Judge Systems Briefing</span>
          </button>
          <span>LUTH Apex Node #04</span>
        </div>
      </footer>
    </div>
  );
};

export default function App() {
  return (
    <SafeAccessProvider>
      <MainApp />
    </SafeAccessProvider>
  );
}

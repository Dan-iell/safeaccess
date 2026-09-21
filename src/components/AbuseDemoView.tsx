import React, { useState } from 'react';
import { useSafeAccess } from '../context/SafeAccessContext';
import { AlertOctagon, UserX, ArrowRight, ShieldAlert, CheckCircle2 } from 'lucide-react';

interface AbuseDemoViewProps {
  onGoToQueue: () => void;
}

export const AbuseDemoView: React.FC<AbuseDemoViewProps> = ({ onGoToQueue }) => {
  const { triggerAbuseScenario, overrideEvents, allStaff, patients } = useSafeAccess();
  const [isRunning, setIsRunning] = useState(false);
  const [hasRun, setHasRun] = useState(false);

  const clerk = allStaff.find((s) => s.id === 'ST-CLK-03') || allStaff[2];
  const targetPatient = patients.find((p) => p.id === 'NG-PT-1007') || patients[6];

  const recentAbuseEvent = overrideEvents.find((e) => e.isAbuseScenario);

  const handleRunDemo = async () => {
    setIsRunning(true);
    await triggerAbuseScenario();
    setIsRunning(false);
    setHasRun(true);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 text-left">
      {/* Header */}
      <div className="border-b border-[#D8DCD4] pb-4 mb-6">
        <h1 className="font-serif text-2xl font-medium text-[#14213D]">
          Abuse Detection Scenario
        </h1>
        <p className="text-xs text-[#5B6470] mt-1">
          Automated rule-based detection of unassigned record inspections &middot; Zero AI/LLM guesswork
        </p>
      </div>

      {/* Narrative Context Card */}
      <div className="border border-[#D8DCD4] bg-white p-6 mb-6">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-7 h-7 rounded bg-[#FBEAE7] flex items-center justify-center">
            <UserX className="w-4 h-4 text-[#B23A2E]" />
          </div>
          <h2 className="font-serif text-base font-semibold text-[#14213D]">
            The Scenario: Unassigned Clerk Inspection
          </h2>
        </div>

        <p className="text-xs text-[#5B6470] leading-relaxed mb-4">
          In typical hospital leaks (such as the 45GB PLASCHEMA breach in Nigeria), staff with general system logins browse files outside their assignment. SafeAccess eliminates blanket trust. When a medical clerk attempts to inspect clinical charts outside their assigned ward without an active duty grant, the access is immediately intercepted, recorded to the tamper-evident ledger, and auto-flagged for supervisor disciplinary review.
        </p>

        {/* The two actors */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 text-xs">
          <div className="bg-[#F3F5F1] p-3 border-l-4 border-[#14213D]">
            <span className="font-mono text-sm uppercase text-[#5B6470] block">Staff Actor</span>
            <span className="font-semibold text-base text-[#14213D] block">{clerk.name}</span>
            <span className="text-[#5B6470]">Role: {clerk.role} &middot; Ward: {clerk.ward}</span>
            <span className="text-sm text-[#B23A2E] block mt-1 font-mono">
              [No Duty Grant for Cardiology]
            </span>
          </div>

          <div className="bg-[#F3F5F1] p-3 border-l-4 border-[#D98E2A]">
            <span className="font-mono text-sm uppercase text-[#5B6470] block">Target Patient File</span>
            <span className="font-semibold text-base text-[#14213D] block">{targetPatient.name}</span>
            <span className="text-[#5B6470]">Ward: {targetPatient.ward} &middot; Room: {targetPatient.roomBed}</span>
            <span className="text-sm text-[#D98E2A] block mt-1 font-mono">
              [Confidential VIP Cardiac Chart]
            </span>
          </div>
        </div>

        {/* Trigger Button */}
        <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-[#D8DCD4]">
          <button
            onClick={handleRunDemo}
            disabled={isRunning}
            id="run-abuse-demo-btn"
            className="px-5 py-2.5 bg-[#B23A2E] hover:bg-[#8C2E24] text-white text-xs font-mono font-semibold uppercase tracking-wider flex items-center gap-2 transition-colors cursor-pointer disabled:opacity-50"
          >
            <AlertOctagon className="w-4 h-4" />
            <span>{isRunning ? 'Executing Scenario...' : 'Run Scripted Abuse Scenario'}</span>
          </button>
          <span className="text-xs text-[#5B6470]">
            Simulates Clerk opening unassigned record with one click.
          </span>
        </div>
      </div>

      {/* Outcome Card if run */}
      {(hasRun || recentAbuseEvent) && (
        <div className="border-2 border-[#B23A2E] bg-white p-6 text-xs">
          <div className="flex items-center gap-2 text-[#B23A2E] font-mono font-semibold uppercase text-xs mb-2">
            <ShieldAlert className="w-4 h-4" />
            <span>Abuse Flagged & Sealed</span>
          </div>

          <div className="p-4 bg-[#FBEAE7] border-l-4 border-[#B23A2E] mb-4 text-[#14213D]">
            <div className="font-serif text-sm font-semibold mb-1">
              Plain-Language Clinical Audit Log:
            </div>
            <p className="text-xs text-[#14213D] leading-relaxed">
              &ldquo;Folake Adebayo opened this record without a duty assignment or clinical emergency reason. Auto-flagged for immediate supervisor review and NDPA compliance audit.&rdquo;
            </p>
          </div>

          <div className="space-y-2 font-mono text-sm text-[#5B6470] bg-[#F3F5F1] p-3 border border-[#D8DCD4] mb-4">
            <div>
              <span className="text-[#14213D] font-semibold">Violation:</span> Role-Ward Duty Mismatch (Clerk &rarr; Cardiology VIP file)
            </div>
            <div>
              <span className="text-[#14213D] font-semibold">Action:</span> Sealed into SHA-256 Ledger &middot; Status: FLAGGED ABUSE
            </div>
            <div>
              <span className="text-[#14213D] font-semibold">Resolution Window:</span> Supervisor Queue &middot; Requires Ward Head Sign-Off
            </div>
          </div>

          <button
            onClick={onGoToQueue}
            className="px-4 py-2 bg-[#14213D] hover:bg-[#1E3056] text-white font-mono text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer"
          >
            <span>View in Supervisor Review Queue</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
};

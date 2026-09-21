import React, { useState } from 'react';
import { useSafeAccess } from '../context/SafeAccessContext';
import { ShieldCheck, AlertOctagon, RefreshCw, Edit3, RotateCcw, CheckCircle2, Lock } from 'lucide-react';
import { AccessLogEntry } from '../types';

export const IntegrityCheck: React.FC = () => {
  const {
    accessLogs,
    verifyIntegrity,
    tamperLogEntry,
    restoreOriginalLogs,
    lastIntegrityResult,
    tamperedOriginalSnapshot,
  } = useSafeAccess();

  const [selectedEntryIndex, setSelectedEntryIndex] = useState<number>(1);
  const [tamperField, setTamperField] = useState<'patientName' | 'actorName' | 'reason' | 'timestamp' | 'action'>('reason');
  const [tamperValue, setTamperValue] = useState<string>('Routine consultation note (tampered retroactively)');
  const [isVerifying, setIsVerifying] = useState<boolean>(false);

  const handleVerify = async () => {
    setIsVerifying(true);
    await verifyIntegrity();
    setIsVerifying(false);
  };

  const handleApplyTamper = async () => {
    if (selectedEntryIndex < 0 || selectedEntryIndex >= accessLogs.length) return;
    await tamperLogEntry(selectedEntryIndex, tamperField, tamperValue);
  };

  const isBroken = lastIntegrityResult && !lastIntegrityResult.isValid;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 text-left">
      {/* Screen Header */}
      <div className="border-b border-[#D8DCD4] pb-4 mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-serif text-2xl font-medium text-[#14213D]">
              Tamper-Evident Access Ledger
            </h1>
            <span className="font-mono text-xs px-2 py-0.5 bg-white border border-[#D8DCD4] text-[#5B6470]">
              SHA-256 Hash Chain
            </span>
          </div>
          <p className="text-xs text-[#5B6470] mt-1">
            Independent audit chain using browser SubtleCrypto API &middot; Every entry cryptographically seals the previous
          </p>
        </div>

        {/* Verification Trigger Button */}
        <div className="flex items-center gap-2">
          {tamperedOriginalSnapshot && (
            <button
              onClick={restoreOriginalLogs}
              className="px-3 py-2 border border-[#D8DCD4] bg-white hover:bg-[#F3F5F1] text-xs font-mono font-medium text-[#14213D] flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5 text-[#5B6470]" />
              <span>Restore Sealed Log</span>
            </button>
          )}

          <button
            onClick={handleVerify}
            disabled={isVerifying}
            id="verify-chain-btn"
            className="px-4 py-2 bg-[#14213D] hover:bg-[#1E3056] text-white text-xs font-mono font-semibold uppercase tracking-wider flex items-center gap-2 transition-colors cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isVerifying ? 'animate-spin' : ''}`} />
            <span>{isVerifying ? 'Hashing entries...' : 'Verify Log Integrity'}</span>
          </button>
        </div>
      </div>

      {/* Verification Result Banner (Plain-language senior nurse voice!) */}
      {lastIntegrityResult && (
        <div
          className={`p-4 mb-6 border-l-4 ${
            lastIntegrityResult.isValid
              ? 'bg-[#E6F0EA] border-[#2F6F4E] text-[#14213D]'
              : 'bg-[#FBEAE7] border-[#B23A2E] text-[#14213D]'
          }`}
        >
          <div className="flex items-start gap-3">
            {lastIntegrityResult.isValid ? (
              <ShieldCheck className="w-6 h-6 text-[#2F6F4E] shrink-0 mt-0.5" />
            ) : (
              <AlertOctagon className="w-6 h-6 text-[#B23A2E] shrink-0 mt-0.5" />
            )}
            <div>
              <div className="font-serif text-lg font-medium leading-tight">
                {lastIntegrityResult.message}
              </div>
              <p className="text-xs text-[#5B6470] mt-1.5 leading-relaxed">
                {lastIntegrityResult.explanation}
              </p>

              {!lastIntegrityResult.isValid && lastIntegrityResult.brokenIndex !== undefined && (
                <div className="mt-3 p-3 bg-white border border-[#B23A2E] font-mono text-xs">
                  <div className="text-sm text-[#B23A2E] font-semibold uppercase mb-1">
                    Cryptographic Proof of Tampering:
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-[#5B6470] block">Stored Hash in Log:</span>
                      <code className="text-[#B23A2E] font-semibold">
                        {lastIntegrityResult.actualHash}
                      </code>
                    </div>
                    <div>
                      <span className="text-[#5B6470] block">Recomputed SHA-256 Digest:</span>
                      <code className="text-[#2F6F4E] font-semibold">
                        {lastIntegrityResult.expectedHash}
                      </code>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Interactive Hackathon Judge Tamper Simulator Tool */}
      <div className="border border-[#14213D] bg-white p-5 mb-8">
        <div className="flex items-center justify-between border-b border-[#D8DCD4] pb-3 mb-4">
          <div className="flex items-center gap-2">
            <Edit3 className="w-4 h-4 text-[#D98E2A]" />
            <h2 className="font-serif text-base font-semibold text-[#14213D]">
              Judge Demonstration Tool: Simulate Unauthorized Database Tamper
            </h2>
          </div>
          <span className="text-sm font-mono bg-[#FBF1E3] text-[#9A6413] px-2 py-0.5 border border-[#D98E2A]">
            Direct Database Injection Simulator
          </span>
        </div>

        <p className="text-xs text-[#5B6470] mb-4">
          In legacy systems, a rogue IT staffer or database administrator can quietly edit database tables to erase evidence of illicit snooping. In SafeAccess, modifying even a single character breaks the SHA-256 chain permanently.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end bg-[#F3F5F1] p-3 border border-[#D8DCD4]">
          <div className="sm:col-span-3">
            <label className="block text-sm font-mono uppercase text-[#5B6470] mb-1">
              Select Log Entry Index
            </label>
            <select
              value={selectedEntryIndex}
              onChange={(e) => setSelectedEntryIndex(Number(e.target.value))}
              className="w-full bg-white border border-[#D8DCD4] px-2 py-1.5 text-xs font-mono"
            >
              {accessLogs.map((entry) => (
                <option key={entry.index} value={entry.index}>
                  Entry #{entry.index} ({entry.actorName.split(' ')[0]} &rarr; {entry.patientName.split(' ')[0]})
                </option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-3">
            <label className="block text-sm font-mono uppercase text-[#5B6470] mb-1">
              Field to Tamper
            </label>
            <select
              value={tamperField}
              onChange={(e) => setTamperField(e.target.value as any)}
              className="w-full bg-white border border-[#D8DCD4] px-2 py-1.5 text-xs font-mono"
            >
              <option value="reason">Reason text</option>
              <option value="actorName">Actor / Staff Name</option>
              <option value="patientName">Patient Name</option>
              <option value="timestamp">Timestamp</option>
            </select>
          </div>

          <div className="sm:col-span-4">
            <label className="block text-sm font-mono uppercase text-[#5B6470] mb-1">
              Injected Forged Value
            </label>
            <input
              type="text"
              value={tamperValue}
              onChange={(e) => setTamperValue(e.target.value)}
              className="w-full bg-white border border-[#D8DCD4] px-2 py-1.5 text-xs text-[#14213D]"
            />
          </div>

          <div className="sm:col-span-2">
            <button
              onClick={handleApplyTamper}
              id="tamper-entry-btn"
              className="w-full bg-[#B23A2E] hover:bg-[#8C2E24] text-white py-1.5 px-3 text-xs font-mono font-semibold uppercase tracking-wider transition-colors cursor-pointer"
            >
              Tamper File
            </button>
          </div>
        </div>
      </div>

      {/* Hash Chain Stream Display */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-serif text-lg font-medium text-[#14213D]">
            Live SHA-256 Ledger Entries ({accessLogs.length} Sealed Blocks)
          </h3>
          <span className="text-xs font-mono text-[#5B6470]">
            SubtleCrypto SHA-256 &middot; Genesis: 00000000...
          </span>
        </div>

        <div className="border border-[#D8DCD4] bg-white divide-y divide-[#D8DCD4]">
          {accessLogs.map((entry) => {
            const isSeveredHere =
              lastIntegrityResult &&
              !lastIntegrityResult.isValid &&
              lastIntegrityResult.brokenIndex === entry.index;
            const isDownstreamBroken =
              lastIntegrityResult &&
              !lastIntegrityResult.isValid &&
              lastIntegrityResult.brokenIndex !== undefined &&
              entry.index > lastIntegrityResult.brokenIndex;

            return (
              <div
                key={entry.id}
                className={`p-4 font-mono text-xs transition-colors ${
                  isSeveredHere
                    ? 'border-l-8 border-[#B23A2E] bg-[#FBEAE7]/40'
                    : isDownstreamBroken
                    ? 'border-l-8 border-[#5B6470] bg-[#F3F5F1]/30 opacity-70'
                    : 'border-l-8 border-[#2F6F4E]'
                }`}
              >
                {/* Header row of block */}
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="bg-[#14213D] text-white px-2 py-0.5 font-bold text-sm">
                      #{entry.index}
                    </span>
                    <span className="font-semibold text-base text-[#14213D]">
                      {entry.action.toUpperCase()}
                    </span>
                    <span className="text-[#5B6470] text-sm">
                      by {entry.actorName} ({entry.actorRole})
                    </span>
                    {entry.isOffline && (
                      <span className="bg-[#FBF1E3] border border-[#D98E2A] text-[#9A6413] px-1.5 text-sm">
                        Queued Offline
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-[#5B6470]">
                    {new Date(entry.timestamp).toLocaleString()}
                  </div>
                </div>

                {/* Target & Payload Details */}
                <div className="bg-[#F3F5F1] p-2.5 border border-[#D8DCD4] text-sm space-y-1 mb-2">
                  <div className="flex flex-wrap gap-4">
                    <div>
                      <span className="text-[#5B6470]">Patient:</span>{' '}
                      <span className="font-semibold text-[#14213D]">{entry.patientName}</span>{' '}
                      <span className="text-[#5B6470]">({entry.patientId})</span>
                    </div>
                    <div>
                      <span className="text-[#5B6470]">Ward:</span>{' '}
                      <span className="text-[#14213D]">{entry.actorWard}</span>
                    </div>
                    <div>
                      <span className="text-[#5B6470]">Status at Event:</span>{' '}
                      <span className="text-[#14213D] uppercase">{entry.actorDutyStatus}</span>
                    </div>
                  </div>
                  {entry.reason && (
                    <div>
                      <span className="text-[#5B6470]">Reason:</span>{' '}
                      <span className="text-[#14213D] italic">"{entry.reason}"</span>
                    </div>
                  )}
                </div>

                {/* Cryptographic Linkage */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs bg-white p-2 border border-[#D8DCD4]">
                  <div className="truncate">
                    <span className="text-[#5B6470] block">prev_hash (Link to #{entry.index - 1}):</span>
                    <code className="text-[#5B6470]">{entry.prev_hash}</code>
                  </div>
                  <div className="truncate">
                    <span className="text-[#5B6470] block">this_hash (SHA-256):</span>
                    <code
                      className={`font-semibold ${
                        isSeveredHere ? 'text-[#B23A2E]' : 'text-[#2F6F4E]'
                      }`}
                    >
                      {entry.this_hash}
                    </code>
                  </div>
                </div>

                {/* Warning note if severed */}
                {isSeveredHere && (
                  <div className="mt-2 text-sm text-[#B23A2E] font-semibold">
                    &uarr; INTEGRITY FAILURE: Data within entry #{entry.index} does not compute to this hash.
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

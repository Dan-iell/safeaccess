import React, { useState } from 'react';
import { useSafeAccess } from '../context/SafeAccessContext';
import { OverrideEvent } from '../types';
import { Clock, ShieldAlert, CheckCircle2, AlertOctagon, ChevronDown, ChevronUp, FileText, Check } from 'lucide-react';

export const ReviewQueue: React.FC = () => {
  const { overrideEvents, markOverrideReviewed, flagOverrideAsAbuse, accessLogs } = useSafeAccess();
  const [expandedId, setExpandedId] = useState<string | null>(overrideEvents[0]?.id || null);
  const [reviewNote, setReviewNote] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // Sort: oldest/most urgent first per spec (ascending by timestamp)
  const sortedEvents = [...overrideEvents].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  const filteredEvents = sortedEvents.filter((ev) => {
    if (filterStatus === 'all') return true;
    return ev.reviewStatus === filterStatus;
  });

  const getTimeElapsed = (timestamp: string) => {
    const diffMs = Date.now() - new Date(timestamp).getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    return `${diffHours}h ${diffMins % 60}m ago`;
  };

  const getTimeRemaining = (expiryTimestamp: string) => {
    const diffMs = new Date(expiryTimestamp).getTime() - Date.now();
    if (diffMs <= 0) return 'Expired';
    const diffMins = Math.floor(diffMs / 60000);
    const hours = Math.floor(diffMins / 60);
    const mins = diffMins % 60;
    return `${hours}h ${mins}m remaining`;
  };

  const handleMarkReviewed = (id: string) => {
    markOverrideReviewed(id, reviewNote || 'Clinical emergency confirmed; necessary for bedside resuscitation.');
    setReviewNote('');
  };

  const handleFlagAbuse = (id: string) => {
    flagOverrideAsAbuse(id, reviewNote || 'No medical justification identified. Forwarded to NDPA audit officer.');
    setReviewNote('');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 text-left">
      {/* Screen Header */}
      <div className="border-b border-[#D8DCD4] pb-4 mb-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="font-serif text-2xl font-medium text-[#14213D]">
              Supervisor Review Queue
            </h1>
            <p className="text-xs text-[#5B6470] mt-1">
              Accountable audit stream for all break-glass overrides &middot; 4-hour mandatory resolution window
            </p>
          </div>

          {/* Filter chips */}
          <div className="flex items-center gap-1 font-mono text-xs">
            {(['all', 'pending', 'reviewed', 'flagged as abuse'] as const).map((status) => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`px-3 py-1 border uppercase text-sm font-medium transition-colors cursor-pointer ${
                  filterStatus === status
                    ? 'bg-[#14213D] text-white border-[#14213D]'
                    : 'bg-white text-[#5B6470] border-[#D8DCD4] hover:border-[#14213D]'
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Senior Nurse Voice Principle Banner */}
      <div className="bg-[#F3F5F1] border-l-4 border-[#D98E2A] p-3.5 mb-6 text-xs text-[#14213D]">
        <div className="font-semibold font-mono text-[#9A6413] uppercase mb-0.5">
          Clinical Accountability Mandate
        </div>
        <p className="text-[#5B6470]">
          Emergency overrides are never blocked at the point of care, but every single override must be reviewed by the ward supervisor within 4 hours. Every event shown here is irreversibly sealed into the SHA-256 ledger.
        </p>
      </div>

      {/* Flat List of Override Events */}
      <div className="border border-[#D8DCD4] bg-white divide-y divide-[#D8DCD4]">
        {/* Table header */}
        <div className="bg-[#F3F5F1] px-4 py-2.5 text-sm font-mono uppercase text-[#5B6470] grid grid-cols-12 gap-2">
          <div className="col-span-3 sm:col-span-3">Healthcare Worker</div>
          <div className="col-span-3 sm:col-span-3">Patient Record</div>
          <div className="col-span-3 sm:col-span-3">Override Reason</div>
          <div className="col-span-2 hidden sm:block">Time Elapsed</div>
          <div className="col-span-3 sm:col-span-1 text-right">Status</div>
        </div>

        {filteredEvents.length > 0 ? (
          filteredEvents.map((event) => {
            const isExpanded = expandedId === event.id;
            const linkedLog = accessLogs.find((l) => l.id === event.logEntryId);

            return (
              <div
                key={event.id}
                className={`transition-colors ${
                  event.reviewStatus === 'pending'
                    ? 'border-l-4 border-[#D98E2A]'
                    : event.reviewStatus === 'flagged as abuse'
                    ? 'border-l-4 border-[#B23A2E] bg-[#FBEAE7]/20'
                    : 'border-l-4 border-[#2F6F4E]'
                }`}
              >
                {/* Main Row */}
                <div
                  onClick={() => setExpandedId(isExpanded ? null : event.id)}
                  className="px-4 py-3.5 grid grid-cols-12 gap-2 items-center cursor-pointer hover:bg-[#FAFAF8]"
                >
                  {/* Staff Member */}
                  <div className="col-span-3 sm:col-span-3">
                    <div className="font-semibold text-base text-[#14213D]">
                      {event.staffName}
                    </div>
                    <div className="text-sm font-mono text-[#5B6470] capitalize">
                      {event.staffRole} &middot; {event.staffWard} Ward
                    </div>
                  </div>

                  {/* Patient */}
                  <div className="col-span-3 sm:col-span-3">
                    <div className="font-semibold text-base text-[#14213D]">
                      {event.patientName}
                    </div>
                    <div className="text-sm font-mono text-[#5B6470]">
                      {event.patientId} &middot; {event.patientWard}
                    </div>
                  </div>

                  {/* Reason */}
                  <div className="col-span-3 sm:col-span-3 text-xs text-[#14213D] truncate">
                    <span>{event.reason}</span>
                  </div>

                  {/* Elapsed / Timer */}
                  <div className="col-span-2 hidden sm:block font-mono text-xs">
                    <span className="text-[#14213D] block">{getTimeElapsed(event.timestamp)}</span>
                    <span className="text-xs text-[#D98E2A]">
                      {getTimeRemaining(event.autoExpiry)}
                    </span>
                  </div>

                  {/* Status chip */}
                  <div className="col-span-3 sm:col-span-1 text-right flex items-center justify-end gap-1.5">
                    <span
                      className={`text-sm font-mono px-2 py-0.5 uppercase whitespace-nowrap ${
                        event.reviewStatus === 'pending'
                          ? 'bg-[#FBF1E3] text-[#9A6413] border border-[#D98E2A]'
                          : event.reviewStatus === 'flagged as abuse'
                          ? 'bg-[#B23A2E] text-white'
                          : 'bg-[#E6F0EA] text-[#2F6F4E] border border-[#2F6F4E]'
                      }`}
                    >
                      {event.reviewStatus === 'flagged as abuse' ? 'Abuse' : event.reviewStatus}
                    </span>
                    {isExpanded ? (
                      <ChevronUp className="w-3.5 h-3.5 text-[#5B6470]" />
                    ) : (
                      <ChevronDown className="w-3.5 h-3.5 text-[#5B6470]" />
                    )}
                  </div>
                </div>

                {/* Inline Expansion: Full Log Entry + Review Controls */}
                {isExpanded && (
                  <div className="bg-[#F3F5F1] p-4 border-t border-[#D8DCD4] text-xs space-y-4">
                    {/* Calm Plain-Language Voice Summary */}
                    <div className="p-3 bg-white border border-[#D8DCD4]">
                      <span className="text-sm font-mono text-[#5B6470] uppercase block mb-1">
                        Audited Event Summary
                      </span>
                      <p className="text-sm font-serif text-[#14213D]">
                        {event.isAbuseScenario
                          ? `${event.staffName} opened this record without a duty assignment or clinical reason. Auto-flagged for immediate supervisor review.`
                          : `${event.staffName} (${event.staffRole}) accessed ${event.patientName} outside standard ward scope: "${event.reason}". Auto-expires in 4 hours unless confirmed.`}
                      </p>
                    </div>

                    {/* Cryptographic Ledger Record */}
                    <div className="bg-white border border-[#D8DCD4] p-3 font-mono text-sm space-y-1.5">
                      <div className="text-xs text-[#5B6470] uppercase flex justify-between border-b border-[#D8DCD4] pb-1">
                        <span>Ledger Entry Metadata</span>
                        <span>Log ID: {event.logEntryId}</span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                        <div>
                          <span className="text-[#5B6470]">Timestamp:</span>{' '}
                          <span className="text-[#14213D]">{new Date(event.timestamp).toLocaleString()}</span>
                        </div>
                        <div>
                          <span className="text-[#5B6470]">Auto-Expiry:</span>{' '}
                          <span className="text-[#D98E2A]">{new Date(event.autoExpiry).toLocaleString()}</span>
                        </div>
                        {linkedLog && (
                          <>
                            <div className="truncate">
                              <span className="text-[#5B6470]">SHA-256 Hash:</span>{' '}
                              <span className="text-[#2F6F4E]">{linkedLog.this_hash.slice(0, 24)}...</span>
                            </div>
                            <div className="truncate">
                              <span className="text-[#5B6470]">Previous Link:</span>{' '}
                              <span className="text-[#5B6470]">{linkedLog.prev_hash.slice(0, 24)}...</span>
                            </div>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Reviewer notes if already reviewed */}
                    {event.reviewedAt && (
                      <div className="bg-white border border-[#D8DCD4] p-3">
                        <span className="text-sm font-mono text-[#5B6470] uppercase block">
                          Supervisor Decision Record
                        </span>
                        <div className="mt-1 flex items-center gap-2">
                          <span className="font-semibold text-[#14213D]">{event.reviewedBy}</span>
                          <span className="text-sm text-[#5B6470]">
                            at {new Date(event.reviewedAt).toLocaleTimeString()}
                          </span>
                        </div>
                        <p className="text-xs text-[#5B6470] mt-1">{event.supervisorNotes}</p>
                      </div>
                    )}

                    {/* Action Controls if pending */}
                    {event.reviewStatus === 'pending' && (
                      <div className="pt-2 border-t border-[#D8DCD4] flex flex-wrap items-center justify-between gap-3">
                        <div className="flex-1 min-w-[260px]">
                          <input
                            type="text"
                            value={reviewNote}
                            onChange={(e) => setReviewNote(e.target.value)}
                            placeholder="Optional supervisor clinical review comment..."
                            className="w-full bg-white border border-[#D8DCD4] px-3 py-1.5 text-xs text-[#14213D] focus:outline-none focus:border-[#14213D]"
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleFlagAbuse(event.id)}
                            className="px-3 py-1.5 border border-[#B23A2E] text-[#B23A2E] hover:bg-[#FBEAE7] text-xs font-mono font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                          >
                            <AlertOctagon className="w-3.5 h-3.5" />
                            <span>Flag as Abuse</span>
                          </button>
                          <button
                            onClick={() => handleMarkReviewed(event.id)}
                            className="px-4 py-1.5 bg-[#2F6F4E] hover:bg-[#25573E] text-white text-xs font-mono font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Mark Reviewed</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div className="p-8 text-center text-xs text-[#5B6470]">
            No override events found in this category.
          </div>
        )}
      </div>
    </div>
  );
};

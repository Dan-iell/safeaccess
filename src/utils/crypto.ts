import { AccessLogEntry, IntegrityVerificationResult } from '../types';

export const GENESIS_PREV_HASH = '0000000000000000000000000000000000000000000000000000000000000000';

/**
 * Computes SHA-256 hex string using browser SubtleCrypto API.
 */
export async function computeSha256(data: string): Promise<string> {
  const encoder = new TextEncoder();
  const buffer = encoder.encode(data);
  const hashBuffer = await window.crypto.subtle.digest('SHA-256', buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Canonical payload serialization for consistent hash generation.
 */
export function getEntryCanonicalPayload(
  entry: Omit<AccessLogEntry, 'this_hash'>,
  prevHash: string
): string {
  return JSON.stringify({
    index: entry.index,
    prev_hash: prevHash,
    actorId: entry.actorId,
    actorName: entry.actorName,
    actorRole: entry.actorRole,
    actorWard: entry.actorWard,
    actorDutyStatus: entry.actorDutyStatus,
    patientId: entry.patientId,
    patientName: entry.patientName,
    action: entry.action,
    reason: entry.reason || '',
    timestamp: entry.timestamp,
  });
}

/**
 * Create a new sealed log entry linked to previous entry's hash.
 */
export async function createSealedLogEntry(
  params: {
    index: number;
    prev_hash: string;
    actorId: string;
    actorName: string;
    actorRole: AccessLogEntry['actorRole'];
    actorWard: AccessLogEntry['actorWard'];
    actorDutyStatus: AccessLogEntry['actorDutyStatus'];
    patientId: string;
    patientName: string;
    action: AccessLogEntry['action'];
    reason?: string;
    timestamp?: string;
    isOffline?: boolean;
    synced?: boolean;
  }
): Promise<AccessLogEntry> {
  const timestamp = params.timestamp || new Date().toISOString();
  const id = `LOG-${String(params.index).padStart(4, '0')}-${Date.now().toString(36).toUpperCase()}`;

  const partial: Omit<AccessLogEntry, 'this_hash'> = {
    id,
    index: params.index,
    prev_hash: params.prev_hash,
    actorId: params.actorId,
    actorName: params.actorName,
    actorRole: params.actorRole,
    actorWard: params.actorWard,
    actorDutyStatus: params.actorDutyStatus,
    patientId: params.patientId,
    patientName: params.patientName,
    action: params.action,
    reason: params.reason || '',
    timestamp,
    isOffline: !!params.isOffline,
    synced: params.synced !== undefined ? params.synced : true,
  };

  const payload = getEntryCanonicalPayload(partial, params.prev_hash);
  const this_hash = await computeSha256(payload);

  return {
    ...partial,
    this_hash,
  };
}

/**
 * Recomputes the entire hash chain to test for tampering.
 * Reports exactly where the chain breaks and what changed.
 */
export async function verifyLogIntegrity(
  entries: AccessLogEntry[]
): Promise<IntegrityVerificationResult> {
  if (entries.length === 0) {
    return {
      isValid: true,
      totalEntries: 0,
      message: 'Log is empty.',
      explanation: 'No access log entries have been recorded yet.',
    };
  }

  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i];
    const expectedPrevHash = i === 0 ? GENESIS_PREV_HASH : entries[i - 1].this_hash;

    // 1. Check prev_hash linkage
    if (entry.prev_hash !== expectedPrevHash) {
      return {
        isValid: false,
        brokenIndex: entry.index,
        totalEntries: entries.length,
        expectedHash: expectedPrevHash,
        actualHash: entry.prev_hash,
        tamperedEntry: entry,
        message: `Chain linkage severed at entry #${entry.index}`,
        explanation: `This entry points to previous hash (${entry.prev_hash.slice(0, 12)}...), but entry #${i > 0 ? entries[i - 1].index : 0} actually produced (${expectedPrevHash.slice(0, 12)}...). The link between these two records was altered. Everything before entry #${entry.index} is still verified; everything after is not.`,
      };
    }

    // 2. Recompute current hash to verify internal data hasn't been edited
    const payload = getEntryCanonicalPayload(entry, entry.prev_hash);
    const computedHash = await computeSha256(payload);

    if (computedHash !== entry.this_hash) {
      return {
        isValid: false,
        brokenIndex: entry.index,
        totalEntries: entries.length,
        expectedHash: computedHash,
        actualHash: entry.this_hash,
        tamperedEntry: entry,
        message: `Internal data altered in entry #${entry.index}`,
        explanation: `This file changed after it was sealed. Here is exactly what changed: Entry #${entry.index} contains stored SHA-256 (${entry.this_hash.slice(0, 12)}...), but recomputing the hash from its recorded fields yields (${computedHash.slice(0, 12)}...). Someone directly modified the text or fields of this record. Everything before entry #${entry.index} is still verified; everything after is not.`,
      };
    }
  }

  const latestHash = entries[entries.length - 1].this_hash;
  return {
    isValid: true,
    totalEntries: entries.length,
    expectedHash: latestHash,
    actualHash: latestHash,
    message: `All ${entries.length} entries cryptographically verified`,
    explanation: `The hash chain is continuous and unsevered from entry #0 through #${entries[entries.length - 1].index}. Every SHA-256 digest matches its canonical payload. No records have been modified, deleted, or inserted out of sequence.`,
  };
}

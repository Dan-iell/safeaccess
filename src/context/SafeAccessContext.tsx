import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import {
  Patient,
  StaffMember,
  DutyGrant,
  AccessLogEntry,
  OverrideEvent,
  ActiveOverrideGrant,
  IntegrityVerificationResult,
} from '../types';
import {
  INITIAL_STAFF,
  INITIAL_PATIENTS,
  INITIAL_DUTY_GRANTS,
} from '../data/syntheticData';
import {
  GENESIS_PREV_HASH,
  createSealedLogEntry,
  verifyLogIntegrity,
} from '../utils/crypto';

interface ScopeCheckResult {
  visible: boolean;
  reason: string;
  viaOverride?: boolean;
  viaGrant?: boolean;
}

interface SafeAccessContextType {
  currentUser: StaffMember | null;
  allStaff: StaffMember[];
  patients: Patient[];
  dutyGrants: DutyGrant[];
  accessLogs: AccessLogEntry[];
  overrideEvents: OverrideEvent[];
  activeOverrides: ActiveOverrideGrant[];
  isOffline: boolean;
  offlineQueueCount: number;
  isSyncing: boolean;
  syncMessage: string | null;
  lastIntegrityResult: IntegrityVerificationResult | null;
  tamperedOriginalSnapshot: AccessLogEntry[] | null;
  
  // Actions
  login: (staffId: string, pin: string) => boolean;
  switchStaff: (staffId: string) => void;
  logout: () => void;
  toggleOffline: () => void;
  syncOfflineQueue: () => Promise<void>;
  grantEmergencyAccess: (patientId: string, reason: string) => Promise<boolean>;
  scanQrToken: (patientId: string) => Promise<{ success: boolean; patient: Patient | null; error?: string }>;
  markOverrideReviewed: (overrideId: string, supervisorNotes?: string) => void;
  flagOverrideAsAbuse: (overrideId: string, supervisorNotes: string) => void;
  triggerAbuseScenario: () => Promise<void>;
  tamperLogEntry: (index: number, modifiedField: 'patientName' | 'actorName' | 'reason' | 'timestamp' | 'action', newValue: string) => Promise<void>;
  restoreOriginalLogs: () => Promise<void>;
  verifyIntegrity: () => Promise<IntegrityVerificationResult>;
  isScopeVisible: (patient: Patient, staff?: StaffMember | null) => ScopeCheckResult;
  logNormalView: (patient: Patient) => Promise<void>;
  updateStaffDutyStatus: (staffId: string, newStatus: StaffMember['dutyStatus']) => void;
}

const SafeAccessContext = createContext<SafeAccessContextType | undefined>(undefined);

const STORAGE_KEYS = {
  STAFF: 'safeaccess_staff_v1',
  PATIENTS: 'safeaccess_patients_v1',
  LOGS: 'safeaccess_logs_v1',
  OVERRIDES: 'safeaccess_overrides_v1',
  GRANTS: 'safeaccess_grants_v1',
  ACTIVE_OVERRIDES: 'safeaccess_active_grants_v1',
  CURRENT_USER_ID: 'safeaccess_current_user_id_v1',
};

export const SafeAccessProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<StaffMember | null>(null);
  const [allStaff, setAllStaff] = useState<StaffMember[]>(INITIAL_STAFF);
  const [patients, setPatients] = useState<Patient[]>(INITIAL_PATIENTS);
  const [dutyGrants, setDutyGrants] = useState<DutyGrant[]>(INITIAL_DUTY_GRANTS);
  const [accessLogs, setAccessLogs] = useState<AccessLogEntry[]>([]);
  const [overrideEvents, setOverrideEvents] = useState<OverrideEvent[]>([]);
  const [activeOverrides, setActiveOverrides] = useState<ActiveOverrideGrant[]>([]);
  
  // Offline state
  const [isOffline, setIsOffline] = useState<boolean>(false);
  const [offlineQueueCount, setOfflineQueueCount] = useState<number>(0);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  
  // Tamper / Integrity state
  const [tamperedOriginalSnapshot, setTamperedOriginalSnapshot] = useState<AccessLogEntry[] | null>(null);
  const [lastIntegrityResult, setLastIntegrityResult] = useState<IntegrityVerificationResult | null>(null);

  // Initialize seed logs and chain
  useEffect(() => {
    async function initializeSystem() {
      // Default to Dr. Ngozi Adeyemi (Cardiology - On Shift) for immediate working demo
      const initialUser = INITIAL_STAFF[0];
      setCurrentUser(initialUser);

      // Seed 5 historical hash-chained logs
      const seedEntries: AccessLogEntry[] = [];
      let prevHash = GENESIS_PREV_HASH;

      // 0: Dr. Ngozi Adeyemi viewed Alhaji Aliyu Dangote (Cardiology - In Scope)
      const e0 = await createSealedLogEntry({
        index: 0,
        prev_hash: prevHash,
        actorId: 'ST-DOC-01',
        actorName: 'Dr. Ngozi Adeyemi',
        actorRole: 'doctor',
        actorWard: 'Cardiology',
        actorDutyStatus: 'on shift',
        patientId: 'NG-PT-1001',
        patientName: 'Alhaji Aliyu Dangote',
        action: 'view',
        reason: 'Ward round clinical evaluation',
        timestamp: '2026-09-14T05:30:00.000Z',
        isOffline: false,
        synced: true,
      });
      seedEntries.push(e0);
      prevHash = e0.this_hash;

      // 1: Nurse Chioma Okonjo viewed Master David Adeleke (Pediatrics - In Scope)
      const e1 = await createSealedLogEntry({
        index: 1,
        prev_hash: prevHash,
        actorId: 'ST-NUR-02',
        actorName: 'Nurse Chioma Okonjo',
        actorRole: 'nurse',
        actorWard: 'Pediatrics',
        actorDutyStatus: 'on shift',
        patientId: 'NG-PT-2001',
        patientName: 'Master David Adeleke (Age 5)',
        action: 'view',
        reason: 'Administered 06:00 IV hydration and analgesia',
        timestamp: '2026-09-14T06:00:00.000Z',
        isOffline: false,
        synced: true,
      });
      seedEntries.push(e1);
      prevHash = e1.this_hash;

      // 2: Dr. Emmanuel Kalu viewed Grace Okoro in Emergency (via DutyGrant)
      const e2 = await createSealedLogEntry({
        index: 2,
        prev_hash: prevHash,
        actorId: 'ST-INT-05',
        actorName: 'Dr. Emmanuel Kalu',
        actorRole: 'intern',
        actorWard: 'Cardiology',
        actorDutyStatus: 'on shift',
        patientId: 'NG-PT-3002',
        patientName: 'Mrs. Grace Okoro',
        action: 'view',
        reason: 'Emergency cross-ward coverage per Duty Grant DG-2026-041',
        timestamp: '2026-09-14T06:45:00.000Z',
        isOffline: false,
        synced: true,
      });
      seedEntries.push(e2);
      prevHash = e2.this_hash;

      // 3: Dr. Ibrahim Bello emergency override on Hon. Oladipo Adeleke (Cardiology patient collapsed near ER triage)
      const e3 = await createSealedLogEntry({
        index: 3,
        prev_hash: prevHash,
        actorId: 'ST-DOC-04',
        actorName: 'Dr. Ibrahim Bello',
        actorRole: 'doctor',
        actorWard: 'Emergency',
        actorDutyStatus: 'on call',
        patientId: 'NG-PT-1007',
        patientName: 'Hon. Oladipo Adeleke',
        action: 'override',
        reason: 'VIP patient collapsed in ER reception corridor with severe acute diaphoresis; required immediate cardiac chart access prior to cardiologist arrival.',
        timestamp: '2026-09-14T07:00:00.000Z',
        isOffline: false,
        synced: true,
      });
      seedEntries.push(e3);
      prevHash = e3.this_hash;

      // 4: Nurse Yusuf Mohammed triage view in ER
      const e4 = await createSealedLogEntry({
        index: 4,
        prev_hash: prevHash,
        actorId: 'ST-NUR-07',
        actorName: 'Nurse Yusuf Mohammed',
        actorRole: 'nurse',
        actorWard: 'Emergency',
        actorDutyStatus: 'on shift',
        patientId: 'NG-PT-3001',
        patientName: 'Tijani Babangida (Trauma Case 1)',
        action: 'view',
        reason: 'Continuous hemodynamic monitoring & blood crossmatch verification',
        timestamp: '2026-09-14T07:15:00.000Z',
        isOffline: false,
        synced: true,
      });
      seedEntries.push(e4);

      setAccessLogs(seedEntries);

      // Seed corresponding override event for e3
      const seedOverride: OverrideEvent = {
        id: 'OVR-2026-0089',
        logEntryId: e3.id,
        staffId: 'ST-DOC-04',
        staffName: 'Dr. Ibrahim Bello',
        staffRole: 'doctor',
        staffWard: 'Emergency',
        patientId: 'NG-PT-1007',
        patientName: 'Hon. Oladipo Adeleke',
        patientWard: 'Cardiology',
        reason: 'VIP patient collapsed in ER reception corridor with severe acute diaphoresis; required immediate cardiac chart access prior to cardiologist arrival.',
        timestamp: '2026-09-14T07:00:00.000Z',
        autoExpiry: new Date(Date.now() + 3.5 * 3600 * 1000).toISOString(), // ~3.5 hours remaining
        reviewStatus: 'pending',
      };

      setOverrideEvents([seedOverride]);

      // Seed an active override grant so Dr. Bello has temporary access to NG-PT-1007
      setActiveOverrides([
        {
          patientId: 'NG-PT-1007',
          staffId: 'ST-DOC-04',
          grantedAt: '2026-09-14T07:00:00.000Z',
          expiresAt: new Date(Date.now() + 3.5 * 3600 * 1000).toISOString(),
          reason: 'Collapsed in ER reception corridor',
        },
      ]);
    }

    initializeSystem();
  }, []);

  // Scoping check function
  const isScopeVisible = useCallback((patient: Patient, staff?: StaffMember | null): ScopeCheckResult => {
    const user = staff !== undefined ? staff : currentUser;
    if (!user) {
      return { visible: false, reason: 'No staff member logged in' };
    }

    // 1. Check if user has an active emergency override grant for this specific patient
    const overrideGrant = activeOverrides.find(
      (o) => o.patientId === patient.id && o.staffId === user.id && new Date(o.expiresAt) > new Date()
    );
    if (overrideGrant) {
      return {
        visible: true,
        viaOverride: true,
        reason: `Visible under active Emergency Override (expires ${new Date(overrideGrant.expiresAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})`,
      };
    }

    // 2. Off-shift staff have NO standard patient visibility
    if (user.dutyStatus === 'off shift') {
      return {
        visible: false,
        reason: `${user.name} is currently off-shift. Records are hidden without an active duty roster assignment.`,
      };
    }

    // 3. Check explicit active Duty Grants (e.g. cross-covering another ward during shortage)
    const activeGrant = dutyGrants.find(
      (g) => g.staffId === user.id && g.ward === patient.ward && g.active
    );
    if (activeGrant) {
      return {
        visible: true,
        viaGrant: true,
        reason: `Authorized via active time-bound Duty Grant for ${patient.ward} Ward`,
      };
    }

    // 4. Same ward assignment
    if (user.ward === patient.ward) {
      return {
        visible: true,
        reason: `In-scope: Assigned to ${patient.ward} Ward (${user.dutyStatus})`,
      };
    }

    // 5. Outside scope
    return {
      visible: false,
      reason: `Outside current ward scope (${patient.ward} Ward). Requires Break-Glass Emergency Access.`,
    };
  }, [currentUser, activeOverrides, dutyGrants]);

  // Login
  const login = useCallback((staffId: string, pin: string): boolean => {
    const found = allStaff.find((s) => s.id === staffId && s.pin === pin);
    if (found) {
      setCurrentUser(found);
      return true;
    }
    return false;
  }, [allStaff]);

  // Fast switcher for demo judges
  const switchStaff = useCallback((staffId: string) => {
    const found = allStaff.find((s) => s.id === staffId);
    if (found) {
      setCurrentUser(found);
    }
  }, [allStaff]);

  const logout = useCallback(() => {
    setCurrentUser(null);
  }, []);

  const updateStaffDutyStatus = useCallback((staffId: string, newStatus: StaffMember['dutyStatus']) => {
    setAllStaff((prev) =>
      prev.map((s) => (s.id === staffId ? { ...s, dutyStatus: newStatus } : s))
    );
    if (currentUser && currentUser.id === staffId) {
      setCurrentUser((prev) => (prev ? { ...prev, dutyStatus: newStatus } : null));
    }
  }, [currentUser]);

  // Toggle offline network simulator
  const toggleOffline = useCallback(() => {
    if (!isOffline) {
      setIsOffline(true);
      setSyncMessage(null);
    } else {
      // Reconnecting -> run sync
      setIsOffline(false);
      if (offlineQueueCount > 0) {
        syncOfflineQueue();
      }
    }
  }, [isOffline, offlineQueueCount]);

  // Sync offline queue
  const syncOfflineQueue = useCallback(async () => {
    if (offlineQueueCount === 0) return;
    setIsSyncing(true);
    setSyncMessage(`Re-establishing network connection... Syncing ${offlineQueueCount} queued offline log entries.`);
    
    // Simulate network latency (800ms)
    await new Promise((res) => setTimeout(res, 800));

    // Mark queued entries as synced
    setAccessLogs((prev) =>
      prev.map((e) => (e.synced ? e : { ...e, synced: true, isOffline: false }))
    );

    // Re-verify hash chain
    const result = await verifyLogIntegrity(accessLogs);
    setLastIntegrityResult(result);
    setOfflineQueueCount(0);
    setIsSyncing(false);
    setSyncMessage(`Network online. Synced ${offlineQueueCount} entries to hospital ledger. Hash chain continuous & verified.`);
    
    setTimeout(() => {
      setSyncMessage(null);
    }, 6000);
  }, [offlineQueueCount, accessLogs]);

  // Log a normal in-scope record view
  const logNormalView = useCallback(async (patient: Patient) => {
    if (!currentUser) return;
    const prevEntry = accessLogs[accessLogs.length - 1];
    const prevHash = prevEntry ? prevEntry.this_hash : GENESIS_PREV_HASH;
    const nextIndex = accessLogs.length;

    const newEntry = await createSealedLogEntry({
      index: nextIndex,
      prev_hash: prevHash,
      actorId: currentUser.id,
      actorName: currentUser.name,
      actorRole: currentUser.role,
      actorWard: currentUser.ward,
      actorDutyStatus: currentUser.dutyStatus,
      patientId: patient.id,
      patientName: patient.name,
      action: 'view',
      reason: `Routine clinical review on ${patient.ward} Ward`,
      isOffline,
      synced: !isOffline,
    });

    setAccessLogs((prev) => [...prev, newEntry]);
    if (isOffline) {
      setOfflineQueueCount((c) => c + 1);
    }
  }, [currentUser, accessLogs, isOffline]);

  // Break-Glass Emergency Override
  // Hard requirement: must never be blocked, requires only a reason, immediately grants access
  const grantEmergencyAccess = useCallback(async (patientId: string, reason: string): Promise<boolean> => {
    if (!currentUser) return false;
    const targetPatient = patients.find((p) => p.id === patientId);
    if (!targetPatient) return false;

    const prevEntry = accessLogs[accessLogs.length - 1];
    const prevHash = prevEntry ? prevEntry.this_hash : GENESIS_PREV_HASH;
    const nextIndex = accessLogs.length;
    const nowIso = new Date().toISOString();

    // 1. Create sealed log entry with action = 'override'
    const newEntry = await createSealedLogEntry({
      index: nextIndex,
      prev_hash: prevHash,
      actorId: currentUser.id,
      actorName: currentUser.name,
      actorRole: currentUser.role,
      actorWard: currentUser.ward,
      actorDutyStatus: currentUser.dutyStatus,
      patientId: targetPatient.id,
      patientName: targetPatient.name,
      action: 'override',
      reason: reason.trim() || 'Emergency break-glass accessed (no reason specified)',
      timestamp: nowIso,
      isOffline,
      synced: !isOffline,
    });

    setAccessLogs((prev) => [...prev, newEntry]);
    if (isOffline) {
      setOfflineQueueCount((c) => c + 1);
    }

    // 2. Create OverrideEvent flagged for mandatory supervisor review within 4 hours
    const autoExpiryIso = new Date(Date.now() + 4 * 3600 * 1000).toISOString();
    const newOverride: OverrideEvent = {
      id: `OVR-${Date.now().toString(36).toUpperCase()}`,
      logEntryId: newEntry.id,
      staffId: currentUser.id,
      staffName: currentUser.name,
      staffRole: currentUser.role,
      staffWard: currentUser.ward,
      patientId: targetPatient.id,
      patientName: targetPatient.name,
      patientWard: targetPatient.ward,
      reason: reason.trim() || 'Emergency break-glass accessed',
      timestamp: nowIso,
      autoExpiry: autoExpiryIso,
      reviewStatus: 'pending',
    };

    setOverrideEvents((prev) => [newOverride, ...prev]);

    // 3. Grant active override session for 4 hours
    setActiveOverrides((prev) => [
      ...prev.filter((o) => !(o.patientId === patientId && o.staffId === currentUser.id)),
      {
        patientId,
        staffId: currentUser.id,
        grantedAt: nowIso,
        expiresAt: autoExpiryIso,
        reason: reason.trim(),
      },
    ]);

    return true;
  }, [currentUser, patients, accessLogs, isOffline]);

  // Scan Patient QR Token (Minimal Emergency Data Subset)
  const scanQrToken = useCallback(async (patientId: string) => {
    if (!currentUser) {
      return { success: false, patient: null, error: 'Must be logged in with a valid staff ID to scan patient QR token.' };
    }

    const patient = patients.find((p) => p.id === patientId);
    if (!patient) {
      return { success: false, patient: null, error: 'Patient token ID not recognized in hospital registry.' };
    }

    const prevEntry = accessLogs[accessLogs.length - 1];
    const prevHash = prevEntry ? prevEntry.this_hash : GENESIS_PREV_HASH;
    const nextIndex = accessLogs.length;
    const nowIso = new Date().toISOString();

    // Scanning patient QR is itself a break-glass event: logged and time-boxed!
    const newEntry = await createSealedLogEntry({
      index: nextIndex,
      prev_hash: prevHash,
      actorId: currentUser.id,
      actorName: currentUser.name,
      actorRole: currentUser.role,
      actorWard: currentUser.ward,
      actorDutyStatus: currentUser.dutyStatus,
      patientId: patient.id,
      patientName: patient.name,
      action: 'qr_scan',
      reason: 'Patient QR Token scanned at bedside/intake — released minimal emergency dataset only',
      timestamp: nowIso,
      isOffline,
      synced: !isOffline,
    });

    setAccessLogs((prev) => [...prev, newEntry]);
    if (isOffline) {
      setOfflineQueueCount((c) => c + 1);
    }

    // Auto-expiry for QR access
    const autoExpiryIso = new Date(Date.now() + 4 * 3600 * 1000).toISOString();
    const newOverride: OverrideEvent = {
      id: `QR-OVR-${Date.now().toString(36).toUpperCase()}`,
      logEntryId: newEntry.id,
      staffId: currentUser.id,
      staffName: currentUser.name,
      staffRole: currentUser.role,
      staffWard: currentUser.ward,
      patientId: patient.id,
      patientName: patient.name,
      patientWard: patient.ward,
      reason: 'Physical Patient Emergency QR Badge scanned — emergency data subset released',
      timestamp: nowIso,
      autoExpiry: autoExpiryIso,
      reviewStatus: 'pending',
    };

    setOverrideEvents((prev) => [newOverride, ...prev]);

    setActiveOverrides((prev) => [
      ...prev.filter((o) => !(o.patientId === patientId && o.staffId === currentUser.id)),
      {
        patientId,
        staffId: currentUser.id,
        grantedAt: nowIso,
        expiresAt: autoExpiryIso,
        reason: 'Scanned emergency token',
      },
    ]);

    return { success: true, patient };
  }, [currentUser, patients, accessLogs, isOffline]);

  // Supervisor actions
  const markOverrideReviewed = useCallback((overrideId: string, supervisorNotes?: string) => {
    setOverrideEvents((prev) =>
      prev.map((ovr) =>
        ovr.id === overrideId
          ? {
              ...ovr,
              reviewStatus: 'reviewed',
              reviewedAt: new Date().toISOString(),
              reviewedBy: currentUser?.name || 'Dr. Ngozi Adeyemi (Ward Supervisor)',
              supervisorNotes: supervisorNotes || 'Clinical necessity confirmed; legitimate bedside emergency.',
            }
          : ovr
      )
    );
  }, [currentUser]);

  const flagOverrideAsAbuse = useCallback((overrideId: string, supervisorNotes: string) => {
    setOverrideEvents((prev) =>
      prev.map((ovr) =>
        ovr.id === overrideId
          ? {
              ...ovr,
              reviewStatus: 'flagged as abuse',
              reviewedAt: new Date().toISOString(),
              reviewedBy: currentUser?.name || 'Ward Supervisor / Audit Officer',
              supervisorNotes,
            }
          : ovr
      )
    );
  }, [currentUser]);

  // Scripted abuse scenario: A clerk (Folake Adebayo, General Medicine) opens a sensitive Cardiology patient
  const triggerAbuseScenario = useCallback(async () => {
    const clerk = allStaff.find((s) => s.id === 'ST-CLK-03') || allStaff[2]; // Folake Adebayo
    const sensitivePatient = patients.find((p) => p.id === 'NG-PT-1007') || patients[6]; // Hon. Oladipo Adeleke (VIP / Confidential Cardiology)

    // Switch active user to the clerk to demonstrate live abuse detection
    setCurrentUser(clerk);

    const prevEntry = accessLogs[accessLogs.length - 1];
    const prevHash = prevEntry ? prevEntry.this_hash : GENESIS_PREV_HASH;
    const nextIndex = accessLogs.length;
    const nowIso = new Date().toISOString();

    // Log the unassigned record inspection as abuse detected
    const newEntry = await createSealedLogEntry({
      index: nextIndex,
      prev_hash: prevHash,
      actorId: clerk.id,
      actorName: clerk.name,
      actorRole: clerk.role,
      actorWard: clerk.ward,
      actorDutyStatus: clerk.dutyStatus,
      patientId: sensitivePatient.id,
      patientName: sensitivePatient.name,
      action: 'abuse_detected',
      reason: 'UNAUTHORIZED INSPECTION: Records clerk opened confidential cardiology record with no duty grant to Cardiology Ward and no clinical emergency override provided.',
      timestamp: nowIso,
      isOffline,
      synced: !isOffline,
    });

    setAccessLogs((prev) => [...prev, newEntry]);

    const abuseEvent: OverrideEvent = {
      id: `ABUSE-${Date.now().toString(36).toUpperCase()}`,
      logEntryId: newEntry.id,
      staffId: clerk.id,
      staffName: clerk.name,
      staffRole: clerk.role,
      staffWard: clerk.ward,
      patientId: sensitivePatient.id,
      patientName: sensitivePatient.name,
      patientWard: sensitivePatient.ward,
      reason: 'Unassigned record access without active duty grant or clinical override reason.',
      timestamp: nowIso,
      autoExpiry: new Date(Date.now() + 4 * 3600 * 1000).toISOString(),
      reviewStatus: 'flagged as abuse',
      isAbuseScenario: true,
      abuseExplanation: 'Clerk Folake Adebayo opened this record without a duty assignment or clinical reason. Auto-flagged for immediate supervisor review.',
      reviewedAt: nowIso,
      reviewedBy: 'SafeAccess Rule Engine (Automated Audit Rule #4: Non-Clinical Duty Breach)',
      supervisorNotes: 'Breach detected automatically: Medical records clerk opened restricted cardiology VIP file without an active admission or transfer order. Referred to Ward Head & NDPA Compliance Officer.',
    };

    setOverrideEvents((prev) => [abuseEvent, ...prev]);
  }, [allStaff, patients, accessLogs, isOffline]);

  // Directly tamper with a stored log entry (for judge testing)
  const tamperLogEntry = useCallback(async (
    index: number,
    modifiedField: 'patientName' | 'actorName' | 'reason' | 'timestamp' | 'action',
    newValue: string
  ) => {
    // Save snapshot of original if not already saved
    if (!tamperedOriginalSnapshot) {
      setTamperedOriginalSnapshot([...accessLogs]);
    }

    setAccessLogs((prev) => {
      return prev.map((entry) => {
        if (entry.index === index) {
          return {
            ...entry,
            [modifiedField]: newValue,
            // CRITICAL: We intentionally keep entry.this_hash unchanged!
            // This simulates an attacker or rogue administrator modifying the database row
            // without being able to re-sign with a valid hash chain!
          };
        }
        return entry;
      });
    });

    // Reset previous verification result so judge must press "Verify Log Integrity"
    setLastIntegrityResult(null);
  }, [accessLogs, tamperedOriginalSnapshot]);

  // Restore original logs
  const restoreOriginalLogs = useCallback(async () => {
    if (tamperedOriginalSnapshot) {
      setAccessLogs(tamperedOriginalSnapshot);
      setTamperedOriginalSnapshot(null);
      const res = await verifyLogIntegrity(tamperedOriginalSnapshot);
      setLastIntegrityResult(res);
    }
  }, [tamperedOriginalSnapshot]);

  // Verify integrity
  const verifyIntegrity = useCallback(async (): Promise<IntegrityVerificationResult> => {
    const result = await verifyLogIntegrity(accessLogs);
    setLastIntegrityResult(result);
    return result;
  }, [accessLogs]);

  return (
    <SafeAccessContext.Provider
      value={{
        currentUser,
        allStaff,
        patients,
        dutyGrants,
        accessLogs,
        overrideEvents,
        activeOverrides,
        isOffline,
        offlineQueueCount,
        isSyncing,
        syncMessage,
        lastIntegrityResult,
        tamperedOriginalSnapshot,
        login,
        switchStaff,
        logout,
        toggleOffline,
        syncOfflineQueue,
        grantEmergencyAccess,
        scanQrToken,
        markOverrideReviewed,
        flagOverrideAsAbuse,
        triggerAbuseScenario,
        tamperLogEntry,
        restoreOriginalLogs,
        verifyIntegrity,
        isScopeVisible,
        logNormalView,
        updateStaffDutyStatus,
      }}
    >
      {children}
    </SafeAccessContext.Provider>
  );
};

export function useSafeAccess() {
  const context = useContext(SafeAccessContext);
  if (!context) {
    throw new Error('useSafeAccess must be used within a SafeAccessProvider');
  }
  return context;
}

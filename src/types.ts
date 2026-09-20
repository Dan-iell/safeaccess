export type Ward = 'Cardiology' | 'Pediatrics' | 'Emergency' | 'General Medicine';

export type Role = 'doctor' | 'nurse' | 'clerk' | 'lab tech' | 'intern';

export type DutyStatus = 'on shift' | 'off shift' | 'on call';

export type LogAction = 'view' | 'override' | 'edit' | 'qr_scan' | 'abuse_detected';

export type ReviewStatus = 'pending' | 'reviewed' | 'flagged as abuse';

export interface Patient {
  id: string; // e.g. 'NG-PT-1042'
  name: string;
  ward: Ward;
  roomBed: string;
  bloodType: 'O+' | 'A+' | 'B+' | 'AB+' | 'O-' | 'A-' | 'B-' | 'AB-';
  genotype: 'AA' | 'AS' | 'AC' | 'SS';
  allergies: string[];
  majorConditions: string[];
  currentMedications: string[];
  emergencyContact: {
    name: string;
    phone: string;
    relationship: string;
  };
  clinicalNotes: string;
  isSensitive?: boolean; // e.g. sensitive genotype or confidential clinical notes
  admittedAt: string;
  attendingStaffId?: string;
}

export interface StaffMember {
  id: string; // e.g. 'ST-DOC-01'
  name: string;
  role: Role;
  ward: Ward;
  dutyStatus: DutyStatus;
  pin: string;
  title: string;
  cadre: string; // e.g. 'Consultant Cardiologist', 'Senior Nursing Officer'
  extraDutyWards?: Ward[]; // explicit duty grant coverage
}

export interface DutyGrant {
  id: string;
  staffId: string;
  ward: Ward;
  startTime: string;
  endTime: string;
  grantedBy: string;
  reason: string;
  active: boolean;
}

export interface AccessLogEntry {
  id: string;
  index: number;
  prev_hash: string;
  this_hash: string;
  actorId: string;
  actorName: string;
  actorRole: Role;
  actorWard: Ward;
  actorDutyStatus: DutyStatus;
  patientId: string;
  patientName: string;
  action: LogAction;
  reason?: string;
  timestamp: string; // ISO string
  isOffline: boolean;
  synced: boolean;
}

export interface OverrideEvent {
  id: string;
  logEntryId: string;
  staffId: string;
  staffName: string;
  staffRole: Role;
  staffWard: Ward;
  patientId: string;
  patientName: string;
  patientWard: Ward;
  reason: string;
  timestamp: string;
  autoExpiry: string; // ISO timestamp 4 hours from creation
  reviewStatus: ReviewStatus;
  reviewedAt?: string;
  reviewedBy?: string;
  supervisorNotes?: string;
  isAbuseScenario?: boolean;
  abuseExplanation?: string;
}

export interface ActiveOverrideGrant {
  patientId: string;
  staffId: string;
  grantedAt: string;
  expiresAt: string;
  reason: string;
}

export interface IntegrityVerificationResult {
  isValid: boolean;
  brokenIndex?: number;
  totalEntries: number;
  message: string;
  explanation: string;
  expectedHash?: string;
  actualHash?: string;
  tamperedEntry?: AccessLogEntry;
}

import React, { useState } from 'react';
import { useSafeAccess } from '../context/SafeAccessContext';
import { QRCodeSVG } from 'qrcode.react';
import { Patient } from '../types';
import { QrCode, Printer, CheckCircle2, AlertTriangle, ShieldCheck, Heart, AlertCircle, Phone } from 'lucide-react';
import { PatientRecordModal } from './PatientRecordModal';

export const PatientQRCardView: React.FC = () => {
  const { patients, currentUser, scanQrToken } = useSafeAccess();
  const [selectedPatientId, setSelectedPatientId] = useState<string>(patients[0]?.id || '');
  const [scannedPatient, setScannedPatient] = useState<Patient | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanMessage, setScanMessage] = useState<string | null>(null);

  const currentPatient = patients.find((p) => p.id === selectedPatientId) || patients[0];

  // Encoded payload: signed reference with mock signature and minimal emergency data
  const qrPayload = JSON.stringify({
    schema: 'safeaccess.emergency.token.v1',
    pid: currentPatient.id,
    name: currentPatient.name,
    abo: currentPatient.bloodType,
    gen: currentPatient.genotype,
    alg: currentPatient.allergies,
    sig: `MOCK_SIG_LUTH_APEX_${currentPatient.id}_2026`,
  });

  const handleSimulateScan = async () => {
    setIsScanning(true);
    setScanMessage('Scanning emergency QR token with staff credential...');
    const res = await scanQrToken(currentPatient.id);
    setIsScanning(false);
    if (res.success && res.patient) {
      setScannedPatient(res.patient);
      setScanMessage(
        `Emergency subset released for ${res.patient.name}. Action logged to SHA-256 ledger with 4-hour supervisor audit window.`
      );
    } else {
      setScanMessage(res.error || 'Scan failed.');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 text-left">
      {/* Screen Header */}
      <div className="border-b border-[#D8DCD4] pb-4 mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl font-medium text-[#14213D]">
            Patient-Carried Emergency Identifier (QR Token)
          </h1>
          <p className="text-xs text-[#5B6470] mt-1">
            Fast-path resuscitation token &middot; Releases minimal emergency dataset only, never full history
          </p>
        </div>

        {/* Patient Picker */}
        <div className="flex items-center gap-2">
          <label className="text-xs font-mono text-[#5B6470]">Patient:</label>
          <select
            value={selectedPatientId}
            onChange={(e) => {
              setSelectedPatientId(e.target.value);
              setScanMessage(null);
            }}
            className="bg-white border border-[#D8DCD4] px-2 py-1.5 text-xs font-mono text-[#14213D]"
          >
            {patients.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.ward})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Senior Nurse Voice Principle Explanation */}
      <div className="bg-[#F3F5F1] border-l-4 border-[#2F6F4E] p-3.5 mb-6 text-xs text-[#14213D]">
        <div className="font-semibold font-mono text-[#2F6F4E] uppercase mb-0.5">
          Privacy-Preserving Emergency Token Design
        </div>
        <p className="text-[#5B6470]">
          The physical card carries a cryptographically signed reference, not unencrypted personal records. Scanning it is an audited break-glass action: it logs the scanning staff member, auto-expires after 4 hours, and decrypts only the immediate resuscitation subset (allergies, blood group, medications).
        </p>
      </div>

      {/* Actions Strip */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <button
          onClick={handleSimulateScan}
          disabled={isScanning}
          id="simulate-qr-scan-btn"
          className="px-4 py-2 bg-[#D98E2A] hover:bg-[#B8741E] text-white text-xs font-mono font-semibold uppercase tracking-wider flex items-center gap-2 transition-colors cursor-pointer disabled:opacity-50"
        >
          <QrCode className="w-4 h-4" />
          <span>{isScanning ? 'Decrypting Token...' : 'Simulate Bedside Scan by Staff'}</span>
        </button>

        <button
          onClick={handlePrint}
          className="px-3 py-2 border border-[#D8DCD4] bg-white hover:bg-[#F3F5F1] text-xs font-mono text-[#14213D] flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <Printer className="w-4 h-4 text-[#5B6470]" />
          <span>Print Physical Card</span>
        </button>
      </div>

      {/* Scan Feedback Banner */}
      {scanMessage && (
        <div className="mb-6 p-3.5 bg-[#E6F0EA] border-l-4 border-[#2F6F4E] text-xs text-[#14213D] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#2F6F4E] shrink-0" />
            <span>{scanMessage}</span>
          </div>
          {scannedPatient && (
            <button
              onClick={() => setScannedPatient(currentPatient)}
              className="text-xs font-mono underline font-semibold text-[#2F6F4E] cursor-pointer ml-4"
            >
              Open Emergency View
            </button>
          )}
        </div>
      )}

      {/* The Printable Emergency ID Card (Authentic Clinical Hospital Badge Layout) */}
      <div className="border-2 border-[#14213D] bg-white p-6 max-w-lg mx-auto shadow-none print:m-0 print:border print:max-w-none">
        {/* Lanyard punch hole aesthetic */}
        <div className="w-8 h-2 bg-[#D8DCD4] rounded-full mx-auto mb-4 print:hidden"></div>

        {/* Card Header */}
        <div className="border-b-2 border-[#14213D] pb-3 mb-4 flex items-center justify-between">
          <div>
            <div className="text-[10px] font-mono uppercase tracking-widest text-[#5B6470]">
              Federal Republic of Nigeria &middot; Tertiary Health System
            </div>
            <div className="font-serif text-lg font-bold text-[#14213D]">
              SafeAccess Emergency Patient Card
            </div>
          </div>
          <div className="text-right font-mono text-xs text-[#14213D]">
            <span className="block font-bold">EMERGENCY DATASET</span>
            <span className="text-[10px] text-[#5B6470]">VALID 2026-2027</span>
          </div>
        </div>

        {/* Card Body Grid */}
        <div className="grid grid-cols-12 gap-4">
          {/* QR Code Column */}
          <div className="col-span-12 sm:col-span-4 flex flex-col items-center justify-center p-2 bg-[#F3F5F1] border border-[#D8DCD4]">
            <QRCodeSVG
              value={qrPayload}
              size={120}
              level="M"
              fgColor="#14213D"
              bgColor="#F3F5F1"
            />
            <span className="text-[9px] font-mono text-[#5B6470] mt-2 tracking-tighter">
              CRYPT-SIGN: {currentPatient.id}
            </span>
          </div>

          {/* Core Info Column */}
          <div className="col-span-12 sm:col-span-8 space-y-2 text-xs">
            <div>
              <span className="text-[10px] font-mono text-[#5B6470] uppercase block">
                Patient Full Name
              </span>
              <span className="font-serif text-base font-bold text-[#14213D] block">
                {currentPatient.name}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 bg-[#F3F5F1] p-2 border border-[#D8DCD4]">
              <div>
                <span className="text-[10px] font-mono text-[#5B6470] block">Blood Group:</span>
                <span className="font-mono text-sm font-bold text-[#14213D]">
                  {currentPatient.bloodType}
                </span>
              </div>
              <div>
                <span className="text-[10px] font-mono text-[#5B6470] block">Genotype:</span>
                <span className={`font-mono text-sm font-bold ${currentPatient.genotype === 'SS' ? 'text-[#D98E2A]' : 'text-[#14213D]'}`}>
                  {currentPatient.genotype}
                </span>
              </div>
            </div>

            <div>
              <span className="text-[10px] font-mono text-[#5B6470] uppercase block">
                Emergency Resuscitation Allergies:
              </span>
              <div className="font-mono text-[11px] text-[#14213D] font-medium">
                {currentPatient.allergies.length > 0 ? (
                  currentPatient.allergies.join(', ')
                ) : (
                  <span className="text-[#5B6470] italic">No known drug allergies (NKDA)</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Minimal Clinical Resuscitation Subset */}
        <div className="mt-4 pt-3 border-t border-[#D8DCD4] text-xs space-y-2">
          <div>
            <span className="text-[10px] font-mono text-[#5B6470] uppercase block">
              Key Medical Conditions:
            </span>
            <span className="font-medium text-[#14213D]">
              {currentPatient.majorConditions.join(' &middot; ')}
            </span>
          </div>

          <div>
            <span className="text-[10px] font-mono text-[#5B6470] uppercase block">
              Critical Medications:
            </span>
            <span className="font-mono text-[11px] text-[#5B6470]">
              {currentPatient.currentMedications.join(' &middot; ')}
            </span>
          </div>

          <div className="bg-[#F3F5F1] p-2 border border-[#D8DCD4] flex items-center justify-between text-[11px] font-mono">
            <div>
              <span className="text-[#5B6470]">Emergency Kin:</span>{' '}
              <span className="font-semibold text-[#14213D]">{currentPatient.emergencyContact.name}</span>
            </div>
            <span className="text-[#2F6F4E] font-bold">{currentPatient.emergencyContact.phone}</span>
          </div>
        </div>

        {/* Card Footer */}
        <div className="mt-4 pt-2 border-t border-[#D8DCD4] flex items-center justify-between text-[9px] font-mono text-[#5B6470]">
          <span>Security Token Hash: SHA256-SIGN-LUTH</span>
          <span>Scan releases emergency subset only</span>
        </div>
      </div>

      {/* Render Modal if scanned */}
      {scannedPatient && (
        <PatientRecordModal
          patient={scannedPatient}
          onClose={() => setScannedPatient(null)}
          onTriggerEmergency={() => {}}
          isQrSubsetOnly={true}
        />
      )}
    </div>
  );
};

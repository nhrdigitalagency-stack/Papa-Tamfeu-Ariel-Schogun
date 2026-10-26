import React, { useMemo, useState } from 'react';
import { CheckCircle2, Feather, Users, X } from 'lucide-react';
import { AttendanceItem } from '../types/memorial';

interface DoveParticle {
  id: number;
  leftPercent: number;
  sizePx: number;
  durationSec: number;
  delaySec: number;
  swayPx: number;
}

interface DovesOverlayProps {
  activeFlightId: number | null;
  isModalOpen: boolean;
  onCloseModal: () => void;
  onTriggerDoves: () => void;
  displayName: string;
  attendances: AttendanceItem[];
  onAttendanceSaved: () => void;
}

const DAY_OPTIONS = [
  'Veillée sans corps (Nkolbisson — Date à confirmer)',
  '9 novembre — Levée de corps, Messe & Veillée (À confirmer)',
  '10 novembre — Messe, Témoignages & Inhumation (À confirmer)',
  '11 novembre — Suite des funérailles (À confirmer)',
  'En pensée et par la prière à distance',
];

export const DovesOverlay: React.FC<DovesOverlayProps> = ({
  activeFlightId,
  isModalOpen,
  onCloseModal,
  onTriggerDoves,
  displayName,
  attendances,
  onAttendanceSaved,
}) => {
  const [fullName, setFullName] = useState('');
  const [relationship, setRelationship] = useState('');
  const [selectedDays, setSelectedDays] = useState<string[]>([
    '10 novembre — Messe, Témoignages & Inhumation (À confirmer)',
  ]);
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [confirmedSuccess, setConfirmedSuccess] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Generate 30 doves spread across the screen from top to bottom
  const doves: DoveParticle[] = useMemo(() => {
    if (!activeFlightId) return [];
    return Array.from({ length: 30 }, (_, idx) => ({
      id: idx,
      leftPercent: 3 + ((idx * 94) / 29) + ((idx % 3) - 1) * 1.5,
      sizePx: 36 + (idx % 4) * 10,
      durationSec: 4.2 + (idx % 5) * 0.65,
      delaySec: (idx % 8) * 0.22,
      swayPx: (idx % 2 === 0 ? 1 : -1) * (25 + (idx % 4) * 14),
    }));
  }, [activeFlightId]);

  const toggleDayOption = (dayLabel: string) => {
    setSelectedDays((prev) =>
      prev.includes(dayLabel)
        ? prev.filter((d) => d !== dayLabel)
        : [...prev, dayLabel]
    );
  };

  const handleConfirmSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!fullName.trim() || fullName.trim().length < 2) {
      setErrorMsg('Veuillez indiquer votre prénom et nom.');
      return;
    }

    setSubmitting(true);
    // Launch the top-to-bottom dove animation immediately on confirmation click
    onTriggerDoves();

    try {
      const res = await fetch('/api/attendances', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: fullName.trim(),
          relationship: relationship.trim(),
          selectedDays:
            selectedDays.length > 0
              ? selectedDays
              : ['Présence aux cérémonies'],
          message: message.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(
          data?.error || 'Impossible d’enregistrer votre confirmation.'
        );
      }

      setConfirmedSuccess(
        `Merci ${fullName.trim()}. Votre présence a bien été enregistrée auprès de la famille.`
      );
      setFullName('');
      setRelationship('');
      setMessage('');
      onAttendanceSaved();
    } catch (err) {
      setErrorMsg(
        err instanceof Error
          ? err.message
          : 'Erreur lors de l’enregistrement.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      {/* Full-Screen Top-to-Bottom White Doves Overlay */}
      {activeFlightId && (
        <div
          key={activeFlightId}
          aria-hidden="true"
          className="doves-overlay-layer fixed inset-0 pointer-events-none z-50 overflow-hidden no-print"
        >
          {/* Soft top-down sky light wash accompanying the doves */}
          <div className="absolute inset-0 bg-gradient-to-b from-[#A9D7F2]/25 via-transparent to-transparent animate-gentle-fade" />

          {doves.map((dove) => (
            <div
              key={dove.id}
              style={
                {
                  left: `${Math.max(2, Math.min(94, dove.leftPercent))}%`,
                  top: '-10vh',
                  width: `${dove.sizePx}px`,
                  height: `${dove.sizePx}px`,
                  '--dove-duration': `${dove.durationSec}s`,
                  '--dove-delay': `${dove.delaySec}s`,
                  '--dove-sway': `${dove.swayPx}px`,
                } as React.CSSProperties
              }
              className="absolute animate-dove-descend"
            >
              <svg
                viewBox="0 0 64 64"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="w-full h-full drop-shadow-[0_4px_10px_rgba(36,91,122,0.28)] animate-dove-wings"
              >
                {/* Graceful White Dove Silhouette with Olive Branch / Sky Detail */}
                <path
                  d="M32 36C24 34 15 26 6 14C14 14 23 18 29 25C27 17 22 9 14 4C24 7 32 15 35 24C38 15 46 7 56 4C48 9 43 17 41 25C47 18 56 14 64 14C55 26 46 34 38 36C41 42 45 49 52 54C43 52 37 48 35 43C33 48 27 52 18 54C25 49 29 42 32 36Z"
                  fill="#FFFFFF"
                  stroke="#245B7A"
                  strokeWidth="1.5"
                  strokeLinejoin="round"
                />
                <circle cx="35" cy="28" r="1.5" fill="#245B7A" />
              </svg>
            </div>
          ))}
        </div>
      )}

      {/* Presence Confirmation Modal */}
      {isModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="presence-modal-title"
          className="fixed inset-0 z-40 bg-[#17191C]/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto no-print"
          onClick={onCloseModal}
        >
          <div
            className="bg-white border border-[#DCE8EF] rounded-lg max-w-xl w-full p-6 sm:p-8 space-y-6 shadow-xl my-8"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4 border-b border-[#DCE8EF] pb-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-[#245B7A] font-semibold">
                  <Feather className="w-3.5 h-3.5" />
                  <span>Participation & Recueillement</span>
                </div>
                <h2
                  id="presence-modal-title"
                  className="font-serif-editorial text-2xl sm:text-3xl font-semibold text-[#17191C]"
                >
                  Confirmer ma présence aux obsèques
                </h2>
                <p className="text-xs text-[#56616A]">
                  Indiquez votre présence auprès de la famille de {displayName}.
                </p>
              </div>
              <button
                type="button"
                onClick={onCloseModal}
                aria-label="Fermer la fenêtre"
                className="p-1.5 rounded-md text-[#56616A] hover:text-[#17191C] hover:bg-[#EFF8FD]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {confirmedSuccess && (
              <div
                role="status"
                className="p-4 rounded-md bg-[#EFF8FD] border border-[#245B7A] text-xs sm:text-sm text-[#17191C] flex items-start gap-2.5"
              >
                <CheckCircle2 className="w-5 h-5 text-[#245B7A] shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-semibold">{confirmedSuccess}</p>
                  <button
                    type="button"
                    onClick={onTriggerDoves}
                    className="text-xs text-[#245B7A] underline underline-offset-4 hover:text-[#17191C]"
                  >
                    Revoir l’envolée de colombes
                  </button>
                </div>
              </div>
            )}

            <form onSubmit={handleConfirmSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="presence-fullname"
                    className="block text-xs font-semibold uppercase tracking-wider text-[#17191C] mb-1.5"
                  >
                    Votre prénom et nom *
                  </label>
                  <input
                    id="presence-fullname"
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Ex. : Marie-Claire Tchoua"
                    className="w-full px-3.5 py-2 text-sm bg-white border border-[#DCE8EF] rounded-md text-[#17191C] focus:outline-none focus:border-[#245B7A]"
                  />
                </div>

                <div>
                  <label
                    htmlFor="presence-relationship"
                    className="block text-xs font-semibold uppercase tracking-wider text-[#17191C] mb-1.5"
                  >
                    Lien avec le défunt ou la famille
                  </label>
                  <input
                    id="presence-relationship"
                    type="text"
                    value={relationship}
                    onChange={(e) => setRelationship(e.target.value)}
                    placeholder="Ex. : Collègue, Ami, Ancien élève, Famille..."
                    className="w-full px-3.5 py-2 text-sm bg-white border border-[#DCE8EF] rounded-md text-[#17191C] focus:outline-none focus:border-[#245B7A]"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <span className="block text-xs font-semibold uppercase tracking-wider text-[#17191C]">
                  Moments auxquels vous prévoyez d’assister
                </span>
                <div className="space-y-1.5">
                  {DAY_OPTIONS.map((option) => (
                    <label
                      key={option}
                      className="flex items-center gap-2.5 p-2.5 rounded-md border border-[#DCE8EF] bg-[#EFF8FD]/40 hover:bg-[#EFF8FD] cursor-pointer text-xs sm:text-sm text-[#17191C]"
                    >
                      <input
                        type="checkbox"
                        checked={selectedDays.includes(option)}
                        onChange={() => toggleDayOption(option)}
                        className="h-4 w-4 rounded border-[#DCE8EF] text-[#245B7A]"
                      />
                      <span>{option}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label
                  htmlFor="presence-note"
                  className="block text-xs font-semibold uppercase tracking-wider text-[#17191C] mb-1.5"
                >
                  Mot d’accompagnement (facultatif)
                </label>
                <input
                  id="presence-note"
                  type="text"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Ex. : Nous serons présents avec une délégation de collègues..."
                  className="w-full px-3.5 py-2 text-sm bg-white border border-[#DCE8EF] rounded-md text-[#17191C] focus:outline-none focus:border-[#245B7A]"
                />
              </div>

              {errorMsg && (
                <p className="text-xs text-red-800 bg-red-50 border border-red-200 p-3 rounded-md">
                  {errorMsg}
                </p>
              )}

              <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-[#DCE8EF]">
                <div className="flex items-center gap-1.5 text-xs text-[#56616A]">
                  <Users className="w-3.5 h-3.5 text-[#245B7A]" />
                  <span>
                    {attendances.length > 0
                      ? `${attendances.length} présence(s) déjà confirmée(s)`
                      : 'Soyez le premier proche à confirmer votre présence'}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={onCloseModal}
                    className="px-3.5 py-2 text-xs font-medium text-[#56616A] hover:text-[#17191C]"
                  >
                    Fermer
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-5 py-2.5 text-xs sm:text-sm font-medium text-white bg-[#245B7A] hover:bg-[#1B465E] rounded-md transition-colors"
                  >
                    {submitting
                      ? 'Confirmation...'
                      : 'Confirmer ma présence'}
                  </button>
                </div>
              </div>
            </form>

            {/* Recent Confirmed Presences List */}
            {attendances.length > 0 && (
              <div className="pt-4 border-t border-[#DCE8EF] space-y-2.5">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-[#56616A]">
                  Proches ayant confirmé leur présence ({attendances.length})
                </h3>
                <div className="max-h-36 overflow-y-auto divide-y divide-[#DCE8EF] border border-[#DCE8EF] rounded-md bg-[#EFF8FD]/30">
                  {attendances.slice(0, 12).map((att) => (
                    <div
                      key={att.id}
                      className="px-3.5 py-2 text-xs flex flex-wrap items-center justify-between gap-2"
                    >
                      <div>
                        <strong className="text-[#17191C]">{att.fullName}</strong>
                        {att.relationship && (
                          <span className="text-[#56616A]">
                            {' '}
                            · {att.relationship}
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-[#245B7A]">
                        {att.selectedDays[0] || 'Présence confirmée'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

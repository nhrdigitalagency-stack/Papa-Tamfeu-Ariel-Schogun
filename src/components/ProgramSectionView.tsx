import React, { useState } from 'react';
import {
  AlertCircle,
  CalendarPlus,
  Feather,
  Printer,
  Share2,
} from 'lucide-react';
import { MemorialPublicPayload, ProgramEventItem } from '../types/memorial';
import {
  downloadValidatedProgramIcs,
  shareMemorialUrl,
  triggerBrowserPrint,
} from '../utils/imageAndShare';
import { ProgramCalendar } from './ProgramCalendar';

interface ProgramSectionViewProps {
  settings: MemorialPublicPayload['settings'];
  events: ProgramEventItem[];
  isDedicatedPage?: boolean;
  onOpenPresenceModal: () => void;
}

export const ProgramSectionView: React.FC<ProgramSectionViewProps> = ({
  settings,
  events,
  isDedicatedPage = false,
  onOpenPresenceModal,
}) => {
  const [shareStatus, setShareStatus] = useState<string | null>(null);

  const handleShare = async () => {
    const res = await shareMemorialUrl(
      `Programme des obsèques — ${settings.displayName}`,
      `Consultez le programme des cérémonies en mémoire de ${settings.displayName}.`
    );
    if (res === 'copied') {
      setShareStatus('Lien du programme copié');
      setTimeout(() => setShareStatus(null), 3500);
    } else if (res === 'shared') {
      setShareStatus('Programme partagé');
      setTimeout(() => setShareStatus(null), 3500);
    }
  };

  const canExportAgenda =
    settings.programConfirmed && settings.weekdayInconsistencyResolved;

  return (
    <section
      id="programme"
      aria-labelledby="programme-heading"
      className={`py-14 sm:py-20 bg-[#EFF8FD]/45 border-b border-[#DCE8EF] print-break-inside-avoid ${
        isDedicatedPage ? 'min-h-[75vh]' : ''
      }`}
    >
      <div className="max-w-[1080px] mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        {/* Section Title & Utility Actions */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[#DCE8EF] pb-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2 text-xs tracking-widest uppercase text-[#56616A] font-medium">
              <span>Déroulement des obsèques</span>
              <span aria-hidden="true">·</span>
              <span>Fuseau horaire : {settings.timeZone}</span>
            </div>
            <h2
              id="programme-heading"
              className="font-serif-editorial text-3xl sm:text-4xl font-semibold text-[#17191C]"
            >
              Programme des cérémonies
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 no-print">
            <button
              type="button"
              onClick={onOpenPresenceModal}
              className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-medium text-white bg-[#245B7A] hover:bg-[#1B465E] rounded-md transition-colors whitespace-nowrap"
            >
              <Feather className="w-3.5 h-3.5" />
              <span>Confirmer ma présence</span>
            </button>

            <button
              type="button"
              onClick={triggerBrowserPrint}
              className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-medium text-[#17191C] bg-white hover:bg-[#EFF8FD] border border-[#DCE8EF] rounded-md transition-colors whitespace-nowrap"
            >
              <Printer className="w-3.5 h-3.5 text-[#245B7A]" />
              <span>Imprimer</span>
            </button>

            <button
              type="button"
              onClick={handleShare}
              className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-medium text-[#17191C] bg-white hover:bg-[#EFF8FD] border border-[#DCE8EF] rounded-md transition-colors whitespace-nowrap"
            >
              <Share2 className="w-3.5 h-3.5 text-[#245B7A]" />
              <span>Partager</span>
            </button>

            <button
              type="button"
              disabled={!canExportAgenda}
              onClick={() => {
                if (canExportAgenda) {
                  downloadValidatedProgramIcs(events, settings.displayName);
                }
              }}
              title={
                canExportAgenda
                  ? 'Télécharger le fichier agenda (.ics)'
                  : 'L’export agenda est désactivé tant que les dates ne sont pas définitivement confirmées par la famille'
              }
              className={`inline-flex items-center gap-2 px-3.5 py-2 text-xs font-medium rounded-md border transition-colors whitespace-nowrap ${
                canExportAgenda
                  ? 'text-white bg-[#245B7A] hover:bg-[#1B465E] border-[#245B7A]'
                  : 'text-[#56616A] bg-white/70 border-[#DCE8EF] opacity-65 cursor-not-allowed'
              }`}
            >
              <CalendarPlus className="w-3.5 h-3.5" />
              <span>
                {canExportAgenda
                  ? 'Exporter l’agenda (.ics)'
                  : 'Export agenda (à confirmer)'}
              </span>
            </button>
          </div>
        </div>

        {shareStatus && (
          <p role="status" className="text-xs font-medium text-[#245B7A] no-print">
            {shareStatus}
          </p>
        )}

        {/* Mandatory Provisional Program Notice Banner */}
        {!settings.programConfirmed && (
          <div
            role="region"
            aria-label="Avertissement programme provisoire"
            className="bg-white/95 border border-[#245B7A]/40 rounded-lg p-5 sm:p-6 space-y-3"
          >
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-[#245B7A] shrink-0 mt-0.5" />
              <div className="space-y-1.5">
                <p className="text-sm sm:text-base font-semibold text-[#17191C]">
                  Programme provisoire — certaines dates et informations restent à
                  confirmer par la famille.
                </p>
                <p className="text-xs sm:text-sm text-[#56616A] leading-relaxed">
                  Programme provisoire — dates à confirmer par la famille : les
                  dates transmises (9, 10 et 11 novembre) et les jours de semaine
                  initialement mentionnés font l’objet d’une vérification
                  calendaire avec la famille. Par souci d’exactitude, les jours de
                  semaine ne sont pas affichés et l’export agenda reste désactivé
                  tant que les dates définitives, l’heure exacte de la levée de
                  corps (« 00 h ») et les lieux précis des cérémonies ne sont pas
                  validés.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ProgramCalendar Component (Minimalist Chronological Timeline with visual 'À confirmer' mentions) */}
        <ProgramCalendar
          settings={settings}
          events={events}
          onOpenPresenceModal={onOpenPresenceModal}
        />

        {/* Summary of Points Pending Family Confirmation */}
        {!settings.programConfirmed && (
          <div className="bg-white/95 border border-[#DCE8EF] rounded-lg p-5 sm:p-6 space-y-3">
            <h3 className="font-serif-editorial text-xl font-semibold text-[#17191C]">
              Points en attente de confirmation par la famille avant publication définitive
            </h3>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs sm:text-sm text-[#56616A]">
              <li>
                · Concordance entre les jours et les dates de novembre 2026 (9, 10 et 11 novembre).
              </li>
              <li>· Date exacte et adresse de la veillée sans corps à Nkolbisson.</li>
              <li>
                · Confirmation de l’heure « 00 h » (minuit) et identification exacte de la morgue du CHU.
              </li>
              <li>
                · Adresse exacte et orthographe validée de la chefferie Guigui.
              </li>
              <li>· Lieu exact de l’inhumation et de la collation.</li>
              <li>
                · Localisation des cérémonies après le départ de la morgue.
              </li>
            </ul>
          </div>
        )}
      </div>
    </section>
  );
};

import React, { useState } from 'react';
import {
  AlertCircle,
  Calendar as CalendarIcon,
  CheckCircle2,
  Clock,
  Feather,
  MapPin,
} from 'lucide-react';
import { MemorialPublicPayload, ProgramEventItem } from '../types/memorial';

interface ProgramCalendarProps {
  settings: MemorialPublicPayload['settings'];
  events: ProgramEventItem[];
  onOpenPresenceModal?: () => void;
}

interface TimelineStage {
  dayKey: ProgramEventItem['dayKey'];
  stepLabel: string;
  dateLabel: string;
  periodSubtitle: string;
}

const TIMELINE_STAGES: TimelineStage[] = [
  {
    dayKey: 'veillee_sans_corps',
    stepLabel: 'Étape 01',
    dateLabel: 'Veillée sans corps',
    periodSubtitle: 'Domicile familial à Nkolbisson',
  },
  {
    dayKey: 'jour_1',
    stepLabel: 'Étape 02',
    dateLabel: '9 novembre',
    periodSubtitle: 'Levée de corps, messe et veillée',
  },
  {
    dayKey: 'jour_2',
    stepLabel: 'Étape 03',
    dateLabel: '10 novembre',
    periodSubtitle: 'Accueil, messe, témoignages, inhumation et collation',
  },
  {
    dayKey: 'jour_3',
    stepLabel: 'Étape 04',
    dateLabel: '11 novembre',
    periodSubtitle: 'Suite des funérailles',
  },
];

export const ProgramCalendar: React.FC<ProgramCalendarProps> = ({
  settings,
  events,
  onOpenPresenceModal,
}) => {
  const [activeStageKey, setActiveStageKey] = useState<
    'all' | ProgramEventItem['dayKey']
  >('all');

  const sortedEvents = [...events].sort(
    (a, b) => a.displayOrder - b.displayOrder
  );

  const visibleStages =
    activeStageKey === 'all'
      ? TIMELINE_STAGES
      : TIMELINE_STAGES.filter((s) => s.dayKey === activeStageKey);

  return (
    <div
      aria-labelledby="program-calendar-title"
      className="bg-white/95 border border-[#DCE8EF] rounded-lg p-6 sm:p-8 lg:p-10 space-y-8 print-break-inside-avoid"
    >
      {/* Header of the ProgramCalendar Timeline */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-[#DCE8EF] pb-6">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-[#245B7A] font-semibold">
            <CalendarIcon className="w-4 h-4" />
            <span>Frise chronologique des obsèques</span>
          </div>
          <h3
            id="program-calendar-title"
            className="font-serif-editorial text-2xl sm:text-3xl font-semibold text-[#17191C]"
          >
            Calendrier chronologique du programme
          </h3>
          <p className="text-xs sm:text-sm text-[#56616A]">
            Déroulement séquentiel des cérémonies avec mention de confirmation
            pour chaque date ({settings.timeZone}).
          </p>
        </div>

        {/* Stage Filter & Presence CTA */}
        <div className="flex flex-wrap items-center gap-3 no-print">
          <div className="inline-flex flex-wrap items-center gap-1 p-1 bg-[#EFF8FD] border border-[#DCE8EF] rounded-md">
            <button
              type="button"
              onClick={() => setActiveStageKey('all')}
              className={`px-2.5 py-1.5 text-xs font-medium rounded transition-colors whitespace-nowrap ${
                activeStageKey === 'all'
                  ? 'bg-[#245B7A] text-white'
                  : 'text-[#56616A] hover:text-[#17191C]'
              }`}
            >
              Toutes les dates
            </button>
            {TIMELINE_STAGES.map((stage) => (
              <button
                key={stage.dayKey}
                type="button"
                onClick={() => setActiveStageKey(stage.dayKey)}
                className={`px-2.5 py-1.5 text-xs font-medium rounded transition-colors whitespace-nowrap ${
                  activeStageKey === stage.dayKey
                    ? 'bg-[#245B7A] text-white'
                    : 'text-[#56616A] hover:text-[#17191C]'
                }`}
              >
                {stage.dateLabel}
              </button>
            ))}
          </div>

          {onOpenPresenceModal && (
            <button
              type="button"
              onClick={onOpenPresenceModal}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-medium text-white bg-[#245B7A] hover:bg-[#1B465E] rounded-md transition-colors whitespace-nowrap"
            >
              <Feather className="w-3.5 h-3.5" />
              <span>Confirmer ma présence</span>
            </button>
          )}
        </div>
      </div>

      {/* Horizontal Summary Rail (Desktop) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {TIMELINE_STAGES.map((stage, idx) => {
          const stageEvents = sortedEvents.filter(
            (e) => e.dayKey === stage.dayKey
          );
          const isDateConfirmed =
            stageEvents.length > 0 &&
            stageEvents.every((e) => e.dateConfirmed);

          return (
            <div
              key={stage.dayKey}
              onClick={() =>
                setActiveStageKey((prev) =>
                  prev === stage.dayKey ? 'all' : stage.dayKey
                )
              }
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setActiveStageKey((prev) =>
                    prev === stage.dayKey ? 'all' : stage.dayKey
                  );
                }
              }}
              className={`p-4 rounded-md border transition-colors cursor-pointer flex flex-col justify-between gap-2 ${
                activeStageKey === stage.dayKey
                  ? 'bg-[#EFF8FD] border-[#245B7A]'
                  : 'bg-[#EFF8FD]/35 hover:bg-[#EFF8FD]/70 border-[#DCE8EF]'
              }`}
            >
              <div className="flex items-center justify-between gap-2 text-xs">
                <span className="font-semibold uppercase tracking-wider text-[#245B7A] tabular-nums">
                  0{idx + 1}. {stage.stepLabel}
                </span>
                {/* Visual "À confirmer" Mention for Each Date */}
                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[#56616A]">
                  {isDateConfirmed ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#245B7A]" />
                      <span className="text-[#245B7A]">Confirmé</span>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="w-3.5 h-3.5 text-[#245B7A]" />
                      <span>À confirmer</span>
                    </>
                  )}
                </span>
              </div>

              <div>
                <p className="font-serif-editorial text-xl font-semibold text-[#17191C]">
                  {stage.dateLabel}
                </p>
                <p className="text-xs text-[#56616A] line-clamp-1">
                  {stage.periodSubtitle}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Minimalist Chronological Timeline (Frise Chronologique Épurée) */}
      <div className="relative pl-6 sm:pl-8 before:content-[''] before:absolute before:top-2 before:bottom-2 before:left-2.5 sm:before:left-3.5 before:w-[1px] before:bg-[#A9D7F2] space-y-10">
        {visibleStages.map((stage) => {
          const stageEvents = sortedEvents.filter(
            (e) => e.dayKey === stage.dayKey
          );
          if (stageEvents.length === 0) return null;

          const firstEvent = stageEvents[0];
          const isDateConfirmed = stageEvents.every((e) => e.dateConfirmed);
          const weekdayPrefix =
            settings.weekdayInconsistencyResolved &&
            firstEvent.weekdayTransmitted
              ? `${firstEvent.weekdayTransmitted} `
              : '';

          return (
            <div key={stage.dayKey} className="relative space-y-4">
              {/* Timeline Node Marker */}
              <div
                aria-hidden="true"
                className="absolute -left-[21px] sm:-left-[25px] top-1.5 w-3.5 h-3.5 rounded-full bg-white border-2 border-[#245B7A]"
              />

              {/* Date Node Header with Visual "À confirmer" Mention */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-[#DCE8EF]">
                <div className="space-y-0.5">
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className="uppercase tracking-widest font-semibold text-[#245B7A]">
                      {stage.stepLabel}
                    </span>
                    <span aria-hidden="true" className="text-[#DCE8EF]">
                      ·
                    </span>
                    <span className="inline-flex items-center gap-1 font-medium text-[#56616A]">
                      {isDateConfirmed ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#245B7A]" />
                          <span className="text-[#245B7A]">Date confirmée</span>
                        </>
                      ) : (
                        <>
                          <AlertCircle className="w-3.5 h-3.5 text-[#245B7A]" />
                          <span>À confirmer</span>
                        </>
                      )}
                    </span>
                  </div>

                  <h4 className="font-serif-editorial text-2xl sm:text-3xl font-semibold text-[#17191C]">
                    {weekdayPrefix}
                    {stage.dateLabel}
                  </h4>
                </div>

                <p className="text-xs text-[#56616A]">{stage.periodSubtitle}</p>
              </div>

              {/* Chronological Events for this Date */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {stageEvents.map((evt) => {
                  const isEvtConfirmed =
                    evt.dateConfirmed &&
                    evt.timeConfirmed &&
                    evt.locationConfirmed;

                  return (
                    <div
                      key={evt.id}
                      className="p-4 sm:p-5 rounded-md bg-[#EFF8FD]/40 border border-[#DCE8EF] flex flex-col justify-between gap-3"
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between gap-2 text-xs border-b border-[#DCE8EF]/80 pb-2">
                          <span className="inline-flex items-center gap-1.5 font-serif-editorial text-lg font-semibold text-[#245B7A] tabular-nums">
                            <Clock className="w-3.5 h-3.5 shrink-0" />
                            <span>{evt.timeLabel}</span>
                          </span>

                          <span className="inline-flex items-center gap-1 text-xs font-medium text-[#56616A]">
                            {isEvtConfirmed ? (
                              <>
                                <CheckCircle2 className="w-3.5 h-3.5 text-[#245B7A]" />
                                <span className="text-[#245B7A]">Confirmé</span>
                              </>
                            ) : (
                              <>
                                <AlertCircle className="w-3.5 h-3.5 text-[#245B7A]" />
                                <span>À confirmer</span>
                              </>
                            )}
                          </span>
                        </div>

                        <h5 className="font-serif-editorial text-xl font-semibold text-[#17191C]">
                          {evt.title}
                        </h5>

                        <div className="flex items-start gap-1.5 text-xs sm:text-sm text-[#17191C]">
                          <MapPin className="w-3.5 h-3.5 text-[#245B7A] shrink-0 mt-0.5" />
                          <span>{evt.location}</span>
                        </div>

                        {evt.locationDetails && (
                          <p className="text-xs text-[#56616A] leading-relaxed">
                            {evt.locationDetails}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

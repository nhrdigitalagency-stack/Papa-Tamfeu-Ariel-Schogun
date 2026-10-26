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

interface FuneralCalendarProps {
  settings: MemorialPublicPayload['settings'];
  events: ProgramEventItem[];
  onOpenPresenceModal: () => void;
}

interface CalendarDayColumn {
  dayKey: ProgramEventItem['dayKey'];
  orderLabel: string;
  monthLabel: string;
  dayNumberLabel: string;
  titleLabel: string;
}

const CALENDAR_DAYS: CalendarDayColumn[] = [
  {
    dayKey: 'veillee_sans_corps',
    orderLabel: 'Étape 01',
    monthLabel: 'Date à préciser',
    dayNumberLabel: 'Veillée',
    titleLabel: 'Veillée sans corps',
  },
  {
    dayKey: 'jour_1',
    orderLabel: 'Étape 02',
    monthLabel: 'Novembre 2026',
    dayNumberLabel: '09',
    titleLabel: '9 novembre',
  },
  {
    dayKey: 'jour_2',
    orderLabel: 'Étape 03',
    monthLabel: 'Novembre 2026',
    dayNumberLabel: '10',
    titleLabel: '10 novembre',
  },
  {
    dayKey: 'jour_3',
    orderLabel: 'Étape 04',
    monthLabel: 'Novembre 2026',
    dayNumberLabel: '11',
    titleLabel: '11 novembre',
  },
];

export const FuneralCalendar: React.FC<FuneralCalendarProps> = ({
  settings,
  events,
  onOpenPresenceModal,
}) => {
  const [selectedDayKey, setSelectedDayKey] = useState<
    'all' | ProgramEventItem['dayKey']
  >('all');

  const sortedEvents = [...events].sort(
    (a, b) => a.displayOrder - b.displayOrder
  );

  return (
    <div
      aria-labelledby="calendrier-obseques-title"
      className="bg-white/95 border border-[#DCE8EF] rounded-lg p-5 sm:p-8 space-y-8 print-break-inside-avoid"
    >
      {/* Calendar Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-[#DCE8EF] pb-5">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-[#245B7A] font-semibold">
            <CalendarIcon className="w-4 h-4" />
            <span>Calendrier chronologique des obsèques</span>
          </div>
          <h3
            id="calendrier-obseques-title"
            className="font-serif-editorial text-2xl sm:text-3xl font-semibold text-[#17191C]"
          >
            Calendrier des dates et cérémonies
          </h3>
          <p className="text-xs sm:text-sm text-[#56616A]">
            Vue chronologique des étapes du deuil avec l’état de confirmation de
            chaque événement ({settings.timeZone}).
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 no-print">
          <button
            type="button"
            onClick={onOpenPresenceModal}
            className="inline-flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-medium text-white bg-[#245B7A] hover:bg-[#1B465E] rounded-md transition-colors whitespace-nowrap"
          >
            <Feather className="w-4 h-4" />
            <span>Confirmer ma présence</span>
          </button>
        </div>
      </div>

      {/* 4-Column Chronological Calendar Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {CALENDAR_DAYS.map((col) => {
          const dayEvents = sortedEvents.filter((e) => e.dayKey === col.dayKey);
          const allConfirmed =
            dayEvents.length > 0 &&
            dayEvents.every(
              (e) => e.dateConfirmed && e.timeConfirmed && e.locationConfirmed
            );
          const isSelected = selectedDayKey === col.dayKey;

          const firstEvent = dayEvents[0];
          const weekdayPrefix =
            settings.weekdayInconsistencyResolved &&
            firstEvent?.weekdayTransmitted
              ? `${firstEvent.weekdayTransmitted} · `
              : '';

          return (
            <div
              key={col.dayKey}
              onClick={() =>
                setSelectedDayKey((prev) =>
                  prev === col.dayKey ? 'all' : col.dayKey
                )
              }
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setSelectedDayKey((prev) =>
                    prev === col.dayKey ? 'all' : col.dayKey
                  );
                }
              }}
              className={`rounded-lg border p-4 flex flex-col justify-between gap-4 cursor-pointer transition-colors ${
                isSelected
                  ? 'bg-[#EFF8FD] border-[#245B7A]'
                  : 'bg-[#EFF8FD]/35 hover:bg-[#EFF8FD]/70 border-[#DCE8EF]'
              }`}
            >
              {/* Top Date Sheet Header */}
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2 border-b border-[#DCE8EF] pb-2 text-xs">
                  <span className="font-semibold uppercase tracking-wider text-[#245B7A] tabular-nums">
                    {col.orderLabel}
                  </span>
                  <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[#56616A]">
                    {allConfirmed ? (
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

                {/* Calendar Date Display */}
                <div className="bg-white border border-[#DCE8EF] rounded-md p-3 text-center space-y-0.5">
                  <p className="text-[11px] uppercase tracking-widest text-[#56616A]">
                    {weekdayPrefix}
                    {col.monthLabel}
                  </p>
                  <p className="font-serif-editorial text-3xl font-semibold text-[#17191C] tabular-nums">
                    {col.dayNumberLabel}
                  </p>
                  <p className="text-xs font-medium text-[#245B7A]">
                    {col.titleLabel}
                  </p>
                </div>

                {/* Chronological Events inside this Calendar Day */}
                <ul className="space-y-2.5 pt-1">
                  {dayEvents.map((evt) => {
                    const isEventFullyConfirmed =
                      evt.dateConfirmed &&
                      evt.timeConfirmed &&
                      evt.locationConfirmed;

                    return (
                      <li
                        key={evt.id}
                        className="p-2.5 rounded bg-white border border-[#DCE8EF] space-y-1 text-left"
                      >
                        <div className="flex items-center justify-between gap-1 text-[11px]">
                          <span className="inline-flex items-center gap-1 font-semibold text-[#245B7A] tabular-nums">
                            <Clock className="w-3 h-3" />
                            {evt.timeLabel}
                          </span>
                          <span className="inline-flex items-center gap-1 text-[#56616A] font-medium">
                            {isEventFullyConfirmed ? (
                              <span className="text-[#245B7A]">Confirmé</span>
                            ) : (
                              <>
                                <AlertCircle className="w-3 h-3 text-[#245B7A]" />
                                <span>À confirmer</span>
                              </>
                            )}
                          </span>
                        </div>

                        <p className="text-xs font-semibold text-[#17191C] leading-snug">
                          {evt.title}
                        </p>

                        <p className="text-[11px] text-[#56616A] flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-[#245B7A] shrink-0" />
                          <span className="truncate">{evt.location}</span>
                        </p>
                      </li>
                    );
                  })}
                </ul>
              </div>

              <div className="pt-2 border-t border-[#DCE8EF]/80 flex items-center justify-between text-[11px] text-[#56616A]">
                <span>{dayEvents.length} cérémonie(s)</span>
                <span className="text-[#245B7A] font-medium">
                  {isSelected ? 'Afficher tout' : 'Filtrer ce jour'}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Chronological Summary Strip */}
      <div className="pt-2 border-t border-[#DCE8EF] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-[#56616A]">
        <div className="flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-[#245B7A] shrink-0" />
          <span>
            Indication visuelle <strong>« À confirmer »</strong> : chaque horaire,
            date et lieu reste soumis à la validation définitive de la famille.
          </span>
        </div>

        {selectedDayKey !== 'all' && (
          <button
            type="button"
            onClick={() => setSelectedDayKey('all')}
            className="text-xs font-medium text-[#245B7A] underline underline-offset-4 self-start sm:self-auto"
          >
            Réinitialiser le filtre du calendrier
          </button>
        )}
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import {
  Check,
  Copy,
  ExternalLink,
  HelpCircle,
  MapPin,
  Navigation,
  Printer,
} from 'lucide-react';
import { LOCATION_LANDMARKS } from '../data/initialMemorialData';
import { MemorialPublicPayload } from '../types/memorial';
import { copyTextToClipboard, triggerBrowserPrint } from '../utils/imageAndShare';
import { ActiveRoute } from './Header';

interface LocationSectionViewProps {
  settings: MemorialPublicPayload['settings'];
  onNavigate: (route: ActiveRoute, sectionId?: string) => void;
}

export const LocationSectionView: React.FC<LocationSectionViewProps> = ({
  settings,
  onNavigate,
}) => {
  const [copied, setCopied] = useState(false);

  const formattedLandmarksText = [
    `Repères pour rejoindre le domicile familial (${settings.displayName}) — Schéma indicatif :`,
    '1. Poste central (point de départ indicatif) → direction Mokolo',
    '2. Mokolo → continuer vers Carrefour Nkolbisson',
    '3. Carrefour Nkolbisson → rejoindre le secteur de l’Église catholique de Nkolbisson',
    '4. Église catholique de Nkolbisson (repère intermédiaire, pas la destination finale)',
    `5. Domicile familial à Nkolbisson (${
      settings.homeAddress ||
      'Le point exact du domicile et les derniers repères seront précisés par la famille.'
    })`,
  ].join('\n');

  const handleCopyLandmarks = async () => {
    const ok = await copyTextToClipboard(formattedLandmarksText);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 3500);
    }
  };

  const hasExactGoogleMaps = Boolean(
    settings.homeMapsUrl && settings.homeMapsUrl.trim().startsWith('http')
  );

  return (
    <section
      id="localisation"
      aria-labelledby="localisation-heading"
      className="py-14 sm:py-20 bg-white border-b border-[#DCE8EF] print-break-inside-avoid"
    >
      <div className="max-w-[1050px] mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[#DCE8EF] pb-6">
          <div className="space-y-2">
            <p className="text-xs tracking-widest uppercase text-[#56616A] font-medium">
              Schéma indicatif fourni par la famille · Nkolbisson
            </p>
            <h2
              id="localisation-heading"
              className="font-serif-editorial text-3xl sm:text-4xl font-semibold text-[#17191C]"
            >
              Repères pour rejoindre le domicile
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 no-print">
            <button
              type="button"
              onClick={handleCopyLandmarks}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-medium text-white bg-[#245B7A] hover:bg-[#1B465E] rounded-md transition-colors whitespace-nowrap"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Repères copiés</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>Copier les repères</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={triggerBrowserPrint}
              className="inline-flex items-center gap-2 px-3.5 py-2 text-xs sm:text-sm font-medium text-[#17191C] bg-[#EFF8FD] hover:bg-[#A9D7F2]/30 border border-[#DCE8EF] rounded-md transition-colors whitespace-nowrap"
            >
              <Printer className="w-4 h-4 text-[#245B7A]" />
              <span>Imprimer l’itinéraire</span>
            </button>
          </div>
        </div>

        {/* Explanatory Notice */}
        <div className="bg-[#EFF8FD]/60 border border-[#DCE8EF] rounded-lg p-5 sm:p-6 space-y-2">
          <p className="text-sm sm:text-base font-medium text-[#17191C]">
            Le point exact du domicile et les derniers repères seront précisés par
            la famille.
          </p>
          <p className="text-xs sm:text-sm text-[#56616A] leading-relaxed">
            Ce parcours constitue un schéma d’orientation indicatif vers le
            domicile familial à Nkolbisson (et non un tracé GPS certifié). Il ne
            s’applique pas aux autres lieux de cérémonie (morgue du CHU, chefferie
            Guigui ou lieu d’inhumation) dont les adresses font l’objet d’une
            confirmation distincte.
          </p>
        </div>

        {/* Visual Schematic Diagram (SVG / Responsive Horizontal & Vertical Pathway) */}
        <div className="bg-white border border-[#DCE8EF] rounded-lg p-6 sm:p-8 space-y-6">
          <div className="flex items-center justify-between gap-4 border-b border-[#DCE8EF] pb-4">
            <h3 className="font-serif-editorial text-2xl font-semibold text-[#17191C]">
              Schéma du parcours : Poste central → Domicile (Nkolbisson)
            </h3>
            <span className="text-xs text-[#56616A] hidden sm:inline">
              5 étapes de repérage
            </span>
          </div>

          {/* Visual Schematic Pathway */}
          <div
            aria-label="Carte schématique des repères d'accès"
            className="py-4"
          >
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 relative">
              {LOCATION_LANDMARKS.map((landmark, idx) => {
                const isLast = idx === LOCATION_LANDMARKS.length - 1;
                return (
                  <div
                    key={landmark.step}
                    className={`relative rounded-md p-4 border flex flex-col justify-between gap-3 ${
                      isLast
                        ? 'bg-[#EFF8FD] border-[#245B7A]'
                        : 'bg-white border-[#DCE8EF]'
                    }`}
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-semibold uppercase tracking-wider text-[#245B7A] tabular-nums">
                          Repère 0{landmark.step}
                        </span>
                        {isLast ? (
                          <MapPin className="w-4 h-4 text-[#245B7A]" />
                        ) : (
                          <Navigation className="w-3.5 h-3.5 text-[#56616A] rotate-45" />
                        )}
                      </div>
                      <h4 className="font-serif-editorial text-xl font-semibold text-[#17191C]">
                        {landmark.name}
                      </h4>
                    </div>

                    <p className="text-xs text-[#56616A] leading-relaxed">
                      {landmark.direction}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Accessible Textual Step-by-Step List */}
          <div className="pt-4 border-t border-[#DCE8EF] space-y-4">
            <h4 className="text-xs uppercase tracking-widest font-semibold text-[#56616A]">
              Description textuelle détaillée des repères
            </h4>
            <ol className="divide-y divide-[#DCE8EF] border border-[#DCE8EF] rounded-md">
              {LOCATION_LANDMARKS.map((landmark) => (
                <li
                  key={landmark.step}
                  className="p-4 sm:px-5 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                >
                  <div className="space-y-0.5">
                    <p className="text-sm font-semibold text-[#17191C]">
                      <span className="text-[#245B7A] tabular-nums mr-2">
                        {landmark.step}.
                      </span>
                      {landmark.name}
                    </p>
                    <p className="text-xs sm:text-sm text-[#56616A]">
                      {landmark.direction}
                    </p>
                  </div>
                  <p className="text-xs text-[#56616A] sm:text-right max-w-xs">
                    {landmark.detail}
                  </p>
                </li>
              ))}
            </ol>
          </div>
        </div>

        {/* Dedicated Slot for Real Family-Provided Plan Image & Google Maps / Contact Assistance */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Slot for Real Plan Provided by Family */}
          <div className="bg-white border border-[#DCE8EF] rounded-lg p-6 flex flex-col justify-between gap-4">
            <div className="space-y-2">
              <h3 className="font-serif-editorial text-xl font-semibold text-[#17191C]">
                Plan d’accès détaillé de la famille
              </h3>
              {settings.customMapImageUrl ? (
                <div className="space-y-3 pt-2">
                  <img
                    src={settings.customMapImageUrl}
                    alt="Plan d'accès fourni par la famille"
                    referrerPolicy="no-referrer"
                    className="w-full h-auto rounded border border-[#DCE8EF]"
                  />
                  {settings.homeAddress && (
                    <p className="text-sm text-[#17191C] font-medium">
                      Adresse communiquée : {settings.homeAddress}
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-sm text-[#56616A] leading-relaxed">
                  Cet encadré est réservé à l’affichage du plan détaillé ou croquis
                  des derniers mètres vers le domicile à Nkolbisson dès sa
                  validation par la famille.
                </p>
              )}
            </div>

            {hasExactGoogleMaps ? (
              <div className="pt-2 no-print">
                <a
                  href={settings.homeMapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-medium text-white bg-[#245B7A] hover:bg-[#1B465E] rounded-md transition-colors"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>Ouvrir le point exact dans Google Maps</span>
                </a>
              </div>
            ) : (
              <p className="text-xs text-[#56616A] pt-2 border-t border-[#DCE8EF]">
                Le bouton Google Maps s’activera automatiquement dès que le point
                exact du domicile aura été confirmé par la famille (l’Église
                catholique de Nkolbisson n’est qu’un repère de passage).
              </p>
            )}
          </div>

          {/* Help & Orientation Contact Card */}
          <div className="bg-[#EFF8FD]/50 border border-[#DCE8EF] rounded-lg p-6 flex flex-col justify-between gap-4">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 text-xs uppercase tracking-widest font-semibold text-[#245B7A]">
                <HelpCircle className="w-4 h-4" />
                <span>Assistance itinéraire</span>
              </div>
              <h3 className="font-serif-editorial text-xl font-semibold text-[#17191C]">
                Besoin d’aide pour rejoindre le domicile ?
              </h3>
              <p className="text-sm text-[#56616A] leading-relaxed">
                Si vous souhaitez demander une précision sur l’itinéraire ou les
                derniers repères après l’Église catholique de Nkolbisson, vous
                pouvez adresser un message à la famille via la rubrique Contact.
              </p>
            </div>

            <div className="pt-2 no-print">
              <button
                type="button"
                onClick={() => onNavigate('/', 'contact')}
                className="inline-flex items-center justify-center px-4 py-2.5 text-xs sm:text-sm font-medium text-[#17191C] bg-white hover:bg-[#EFF8FD] border border-[#DCE8EF] rounded-md transition-colors"
              >
                Demander de l’aide à la famille
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

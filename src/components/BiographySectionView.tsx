import React from 'react';
import { Printer } from 'lucide-react';
import { BiographySection, MemorialPublicPayload } from '../types/memorial';
import { triggerBrowserPrint } from '../utils/imageAndShare';

interface BiographySectionViewProps {
  settings: MemorialPublicPayload['settings'];
  sections: BiographySection[];
  isDedicatedPage?: boolean;
}

export const BiographySectionView: React.FC<BiographySectionViewProps> = ({
  settings,
  sections,
  isDedicatedPage = false,
}) => {
  const visibleSections = sections.filter(
    (s) => s.isVisiblePublic && s.content.trim().length > 0
  );

  return (
    <section
      id="biographie"
      aria-labelledby="biographie-heading"
      className={`py-14 sm:py-20 bg-white border-b border-[#DCE8EF] print-break-inside-avoid ${
        isDedicatedPage ? 'min-h-[75vh]' : ''
      }`}
    >
      <div className="max-w-[1000px] mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[#DCE8EF] pb-6">
          <div className="space-y-2">
            <p className="text-xs tracking-widest uppercase text-[#56616A] font-medium">
              Son histoire, son parcours
            </p>
            <h2
              id="biographie-heading"
              className="font-serif-editorial text-3xl sm:text-4xl font-semibold text-[#17191C]"
            >
              Biographie
            </h2>
          </div>

          <button
            type="button"
            onClick={triggerBrowserPrint}
            className="no-print self-start sm:self-auto inline-flex items-center gap-2 px-3.5 py-2 text-xs font-medium text-[#245B7A] bg-[#EFF8FD] hover:bg-[#A9D7F2]/30 border border-[#DCE8EF] rounded-md transition-colors whitespace-nowrap"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Imprimer la biographie</span>
          </button>
        </div>

        {/* Known Factual Summary & Verified Chronology */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          {/* Left Column: Repères d'état civil & Chronologie attestée */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-[#EFF8FD]/60 border border-[#DCE8EF] rounded-lg p-6 space-y-4">
              <h3 className="font-serif-editorial text-xl font-semibold text-[#17191C] border-b border-[#DCE8EF] pb-2">
                Repères d’état civil
              </h3>
              <dl className="space-y-3 text-sm">
                <div className="flex flex-col gap-0.5 border-b border-[#DCE8EF]/70 pb-2.5">
                  <dt className="text-xs uppercase tracking-wider text-[#56616A]">
                    Nom d’affichage
                  </dt>
                  <dd className="font-medium text-[#17191C]">
                    {settings.displayName}
                  </dd>
                </div>
                <div className="flex flex-col gap-0.5 border-b border-[#DCE8EF]/70 pb-2.5">
                  <dt className="text-xs uppercase tracking-wider text-[#56616A]">
                    Année et lieu de naissance
                  </dt>
                  <dd className="font-medium text-[#17191C] tabular-nums">
                    {settings.birthYear} · {settings.birthPlace}
                  </dd>
                </div>
                <div className="flex flex-col gap-0.5 border-b border-[#DCE8EF]/70 pb-2.5">
                  <dt className="text-xs uppercase tracking-wider text-[#56616A]">
                    Situation matrimoniale
                  </dt>
                  <dd className="font-medium text-[#17191C]">
                    {settings.maritalStatus}
                  </dd>
                </div>
                <div className="flex flex-col gap-0.5 border-b border-[#DCE8EF]/70 pb-2.5">
                  <dt className="text-xs uppercase tracking-wider text-[#56616A]">
                    Vie professionnelle communiquée
                  </dt>
                  <dd className="font-medium text-[#17191C]">
                    Enseignant à l’Université de Douala · Enseignant au Collège La
                    Retraite à Yaoundé
                  </dd>
                </div>
                <div className="flex flex-col gap-0.5">
                  <dt className="text-xs uppercase tracking-wider text-[#56616A]">
                    Année du décès
                  </dt>
                  <dd className="font-medium text-[#17191C] tabular-nums">
                    {settings.deathYear}
                  </dd>
                </div>
              </dl>
            </div>

            {/* Chronologie uniquement pour les dates et repères connus */}
            <div className="bg-white border border-[#DCE8EF] rounded-lg p-6 space-y-4">
              <h3 className="font-serif-editorial text-xl font-semibold text-[#17191C] border-b border-[#DCE8EF] pb-2">
                Repères chronologiques
              </h3>
              <ol className="space-y-5 relative">
                <li className="space-y-1">
                  <span className="text-xs font-semibold uppercase tracking-widest text-[#245B7A] tabular-nums">
                    {settings.birthYear} — Naissance
                  </span>
                  <p className="text-sm text-[#56616A] leading-relaxed">
                    Né à {settings.birthPlace}, {settings.displayName} entame un
                    parcours marqué par l’attachement familial et la transmission du
                    savoir.
                  </p>
                </li>

                <li className="pt-3 border-t border-[#DCE8EF] space-y-1">
                  <span className="text-xs font-semibold uppercase tracking-widest text-[#245B7A]">
                    Vocation — L’enseignement
                  </span>
                  <p className="text-sm text-[#56616A] leading-relaxed">
                    Il exerce comme enseignant à l’Université de Douala ainsi qu’au
                    Collège La Retraite à Yaoundé, contribuant à la formation et à
                    l’accompagnement des jeunes.
                  </p>
                </li>

                <li className="pt-3 border-t border-[#DCE8EF] space-y-1">
                  <span className="text-xs font-semibold uppercase tracking-widest text-[#245B7A] tabular-nums">
                    {settings.deathYear} — Son départ
                  </span>
                  <p className="text-sm text-[#56616A] leading-relaxed">
                    Son départ laisse un grand vide auprès de ses proches, de ses
                    collègues et de ses élèves.
                  </p>
                </li>
              </ol>
            </div>
          </div>

          {/* Right Column: Structured Editorial Narrative (Only populated sections) */}
          <div className="lg:col-span-7 space-y-8">
            {visibleSections.map((section, idx) => (
              <article
                key={section.id}
                className="space-y-2.5 pb-6 border-b border-[#DCE8EF] last:border-b-0 last:pb-0"
              >
                <div className="flex items-baseline gap-2.5">
                  <span className="text-xs font-semibold uppercase tracking-widest text-[#245B7A] tabular-nums">
                    0{idx + 1}.
                  </span>
                  <h3 className="font-serif-editorial text-2xl font-semibold text-[#17191C]">
                    {section.title}
                  </h3>
                </div>
                <div className="text-base text-[#17191C] leading-relaxed space-y-3 max-w-prose">
                  {section.content
                    .split('\n')
                    .filter((p) => p.trim().length > 0)
                    .map((paragraph, pIdx) => (
                      <p key={pIdx} className="text-[#17191C]/90">
                        {paragraph}
                      </p>
                    ))}
                </div>
              </article>
            ))}

            <div className="p-4 rounded-md bg-[#EFF8FD]/60 border border-[#DCE8EF] text-xs text-[#56616A] leading-relaxed">
              Les rubriques complémentaires (parcours scolaire et universitaire
              détaillé, vie associative, vie religieuse) ne sont affichées qu’après
              transmission et validation des informations exactes par la famille.
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

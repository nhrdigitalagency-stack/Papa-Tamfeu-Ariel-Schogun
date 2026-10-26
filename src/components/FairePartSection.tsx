import React from 'react';
import { FamilyCategory, FamilyEntry, MemorialPublicPayload } from '../types/memorial';

interface FairePartSectionProps {
  settings: MemorialPublicPayload['settings'];
  families: FamilyEntry[];
}

const CATEGORY_LABELS: Record<Exclude<FamilyCategory, null>, string> = {
  paternelle: 'Famille paternelle',
  maternelle: 'Famille maternelle',
  belle_famille: 'Belle-famille',
  alliee: 'Familles alliées',
};

export const FairePartSection: React.FC<FairePartSectionProps> = ({
  settings,
  families,
}) => {
  // Check if any family has an explicit category assigned by the administrator
  const categorizedFamilies = families.filter((f) => f.category !== null);
  const uncategorizedFamilies = families.filter((f) => f.category === null);

  const activeCategories = (
    ['paternelle', 'maternelle', 'belle_famille', 'alliee'] as const
  ).filter((cat) => categorizedFamilies.some((f) => f.category === cat));

  return (
    <section
      id="faire-part"
      aria-labelledby="faire-part-heading"
      className="py-14 sm:py-20 bg-[#EFF8FD]/60 border-b border-[#DCE8EF] print-break-inside-avoid"
    >
      <div className="max-w-[1000px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white border border-[#DCE8EF] rounded-lg p-6 sm:p-10 lg:p-12 space-y-8">
          {/* Header & Optional Sober Lily Motif */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-[#DCE8EF] pb-6">
            <div className="space-y-2 max-w-2xl">
              <p className="text-xs tracking-widest uppercase text-[#56616A] font-medium">
                Faire-part familial
              </p>
              <h2
                id="faire-part-heading"
                className="font-serif-editorial text-3xl sm:text-4xl font-semibold text-[#17191C]"
              >
                Les familles vous font part
              </h2>
            </div>

            {settings.floralImageUrl && (
              <div className="w-28 sm:w-32 shrink-0 overflow-hidden rounded border border-[#DCE8EF] bg-white">
                <img
                  src={settings.floralImageUrl}
                  alt="Fleurs blanches de recueillement"
                  referrerPolicy="no-referrer"
                  className="w-full h-16 object-cover object-left-bottom"
                />
              </div>
            )}
          </div>

          {/* Introductory Text */}
          <p className="text-base sm:text-lg text-[#17191C] leading-relaxed max-w-3xl">
            Les familles ci-dessous s’associent pour vous faire part du décès de{' '}
            <strong className="font-semibold">{settings.displayName}</strong> et
            vous remercient pour votre soutien, votre présence et vos marques
            d’affection.
          </p>

          {/* Uncategorized Families (Default initial state for Tamfeu & Carlade) */}
          {uncategorizedFamilies.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {uncategorizedFamilies.map((fam) => (
                <div
                  key={fam.id}
                  className="p-5 rounded-md bg-[#EFF8FD]/50 border border-[#DCE8EF] flex flex-col justify-between gap-1.5"
                >
                  <h3 className="font-serif-editorial text-2xl font-semibold text-[#17191C]">
                    {fam.name}
                  </h3>
                  {fam.note && (
                    <p className="text-sm text-[#56616A] leading-relaxed">
                      {fam.note}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Categorized Families (Only rendered if categories have been explicitly populated) */}
          {activeCategories.length > 0 && (
            <div className="space-y-6 pt-2">
              {activeCategories.map((categoryKey) => {
                const items = categorizedFamilies.filter(
                  (f) => f.category === categoryKey
                );
                return (
                  <div key={categoryKey} className="space-y-3">
                    <h3 className="text-xs tracking-widest uppercase font-semibold text-[#245B7A] border-b border-[#DCE8EF] pb-1.5">
                      {CATEGORY_LABELS[categoryKey]}
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {items.map((fam) => (
                        <div
                          key={fam.id}
                          className="p-4 rounded-md bg-[#EFF8FD]/40 border border-[#DCE8EF]"
                        >
                          <p className="font-serif-editorial text-xl font-semibold text-[#17191C]">
                            {fam.name}
                          </p>
                          {fam.note && (
                            <p className="text-sm text-[#56616A] mt-1">
                              {fam.note}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Invitation text */}
          <div className="pt-4 border-t border-[#DCE8EF] space-y-3">
            <p className="font-serif-editorial italic text-xl sm:text-2xl text-[#17191C] leading-relaxed">
              « Parents, amis, collègues, anciens élèves et connaissances sont
              invités à se joindre à la famille pour lui rendre un dernier
              hommage. »
            </p>

            {!settings.familyListConfirmed && (
              <p className="text-xs text-[#56616A]">
                Note éditoriale : la liste complète des familles et familles alliées
                est en cours de validation par les proches.
              </p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

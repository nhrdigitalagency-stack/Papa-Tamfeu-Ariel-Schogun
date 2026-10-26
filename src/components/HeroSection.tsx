import React, { useEffect, useState } from 'react';
import { Feather, Printer, Share2 } from 'lucide-react';
import { MemorialPublicPayload } from '../types/memorial';
import { ActiveRoute } from './Header';
import { shareMemorialUrl, triggerBrowserPrint } from '../utils/imageAndShare';

interface HeroSectionProps {
  settings: MemorialPublicPayload['settings'];
  portraitUrl?: string;
  onNavigate: (route: ActiveRoute, sectionId?: string) => void;
  onOpenPresenceModal: () => void;
  onTriggerDoves: () => void;
}

const DEFAULT_LILY_BG =
  '/assets/aistudio/jWzG97KwgJ2vECFkAxtco_S5j64_fR3jAP8UqTFz0ot1B0UvjNq0gMNANjsuVw0wuIfdApvjSnRin5XquNxTuQlKddDoxye91uNc0BgareId3H9Fjm-eNShx2FGNhWU82Tfc2LIkxOv_PtuFFAqGQOEWsRTBBYPTqUnBr6PJ7ZD2KZifpr-3ByOS0sV_iUWO_2e0dc6a2.jpg';

export const HeroSection: React.FC<HeroSectionProps> = ({
  settings,
  portraitUrl,
  onNavigate,
  onOpenPresenceModal,
  onTriggerDoves,
}) => {
  const [imageFailed, setImageFailed] = useState(false);
  const [shareFeedback, setShareFeedback] = useState<string | null>(null);

  const resolvedPortraitUrl = (portraitUrl ?? settings.portraitUrl ?? '').trim();

  useEffect(() => {
    setImageFailed(false);
  }, [resolvedPortraitUrl]);

  const hasValidPortrait =
    Boolean(resolvedPortraitUrl.length > 0) && !imageFailed;

  const heroBgUrl = settings.floralImageUrl || DEFAULT_LILY_BG;

  const initials = settings.displayName
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word[0]?.toUpperCase())
    .slice(0, 4)
    .join(' · ');

  const handleShare = async () => {
    const res = await shareMemorialUrl(
      `En mémoire de ${settings.displayName} | ${settings.birthYear}–${settings.deathYear}`,
      `Faire-part de deuil et hommage à ${settings.displayName} (${settings.birthYear}–${settings.deathYear}).`
    );
    if (res === 'copied') {
      setShareFeedback('Lien copié dans le presse-papiers');
      setTimeout(() => setShareFeedback(null), 3500);
    } else if (res === 'shared') {
      setShareFeedback('Lien partagé');
      setTimeout(() => setShareFeedback(null), 3500);
    }
  };

  return (
    <section
      id="accueil"
      aria-labelledby="hero-memorial-title"
      className="relative overflow-hidden border-b border-[#DCE8EF] py-12 sm:py-16 lg:py-22 print-break-inside-avoid"
    >
      {/* Attached White Lilies & Black Mourning Ribbon Image as Hero Background */}
      <div
        aria-hidden="true"
        className="absolute inset-0 z-0 pointer-events-none overflow-hidden"
      >
        <img
          src={heroBgUrl}
          alt=""
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover object-left-bottom opacity-85 scale-105 transition-transform duration-700"
        />
        {/* Subtle Sky & Editorial Contrast Veil so text remains 100% legible while showcasing the lilies */}
        <div className="absolute inset-0 bg-gradient-to-r from-white/92 via-white/80 to-[#EFF8FD]/75" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#A9D7F2]/20 via-transparent to-white/65" />
      </div>

      <div className="relative z-10 max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
          {/* Left Editorial Column (7 cols) */}
          <div className="lg:col-span-7 space-y-6 bg-white/75 backdrop-blur-[2px] p-6 sm:p-8 rounded-lg border border-[#DCE8EF]/80 shadow-xs">
            {/* Configurable Religious Symbol (only when confirmed by family) */}
            {settings.religiousSymbolConfirmed &&
              settings.religiousSymbol === 'cross' && (
                <div
                  aria-label="Symbole de recueillement"
                  className="text-[#245B7A] font-serif-editorial text-2xl select-none"
                >
                  ✝
                </div>
              )}

            {/* Kicker (unboxed quiet text, zero-pill discipline) */}
            <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm tracking-widest uppercase text-[#56616A] font-medium">
              <span>Faire-part de deuil et hommage</span>
              <span aria-hidden="true">·</span>
              <span>{settings.birthPlace}</span>
            </div>

            {/* Title Header Block with Portrait on the Right on Mobile/Tablet & Full Frame on the Right Column */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
              <div className="space-y-2">
                <h1
                  id="hero-memorial-title"
                  className="font-serif-editorial text-4xl sm:text-5xl lg:text-[3.4rem] font-semibold text-[#17191C] leading-[1.12] tracking-tight"
                  style={{ textWrap: 'balance' }}
                >
                  {settings.displayName}
                </h1>

                {/* Years (Tabular numerals, no calculated age) */}
                <p className="font-serif-editorial text-2xl sm:text-3xl text-[#245B7A] font-medium tabular-nums tracking-wide pt-1">
                  {settings.birthYear} — {settings.deathYear}
                </p>
              </div>

              {/* Elegant Portrait Badge on the Right of the Title (visible on compact viewports) */}
              {hasValidPortrait && (
                <div className="lg:hidden shrink-0 self-start sm:self-center">
                  <div className="w-24 h-28 sm:w-28 sm:h-32 rounded-md overflow-hidden border border-[#DCE8EF] bg-[#EFF8FD] p-1 shadow-xs">
                    <img
                      src={resolvedPortraitUrl}
                      alt={`Portrait de ${settings.displayName}`}
                      referrerPolicy="no-referrer"
                      onError={() => setImageFailed(true)}
                      className="w-full h-full object-cover object-top rounded-xs"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Hairline divider */}
            <div className="w-20 h-[1px] bg-[#A9D7F2]" aria-hidden="true" />

            {/* Phrase d'hommage */}
            <blockquote className="font-serif-editorial italic text-xl sm:text-2xl text-[#17191C] leading-relaxed max-w-2xl">
              « Une vie de transmission, une présence qui demeure dans nos mémoires. »
            </blockquote>

            {/* Texte d'introduction officiel */}
            <div className="space-y-3 text-base sm:text-[17px] text-[#56616A] leading-relaxed max-w-2xl">
              <p>
                Les familles ont la profonde douleur de vous annoncer le décès de{' '}
                <strong className="font-semibold text-[#17191C]">
                  {settings.displayName}
                </strong>
                . Elles vous invitent à les entourer de votre présence et de vos
                pensées durant les cérémonies organisées en sa mémoire.
              </p>
              <p className="text-sm sm:text-base text-[#56616A]">
                Homme de famille, enseignant à l’Université de Douala et au Collège
                La Retraite à Yaoundé, il laisse le souvenir d’un parcours dédié à
                l’éducation et au partage des connaissances.
              </p>
            </div>

            {/* Primary & Secondary Actions */}
            <div className="pt-2 flex flex-wrap items-center gap-3 no-print">
              <button
                type="button"
                onClick={() => onNavigate('/programme', 'programme')}
                className="px-5 py-3 text-sm font-medium text-white bg-[#245B7A] hover:bg-[#1B465E] rounded-md transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#245B7A]"
              >
                Consulter le programme
              </button>

              <button
                type="button"
                onClick={() => {
                  onTriggerDoves();
                  onOpenPresenceModal();
                }}
                className="inline-flex items-center gap-2 px-5 py-3 text-sm font-medium text-[#17191C] bg-[#A9D7F2]/45 hover:bg-[#A9D7F2]/70 border border-[#245B7A]/30 rounded-md transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#245B7A]"
              >
                <Feather className="w-4 h-4 text-[#245B7A]" />
                <span>Confirmer ma présence</span>
              </button>

              <button
                type="button"
                onClick={() => onNavigate('/biographie', 'biographie')}
                className="px-4 py-3 text-sm font-medium text-[#17191C] bg-white hover:bg-[#EFF8FD] border border-[#DCE8EF] rounded-md transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#245B7A]"
              >
                Lire sa biographie
              </button>
            </div>

            {/* Quick Links & Print/Share Utility Bar */}
            <div className="pt-3 border-t border-[#DCE8EF] flex flex-wrap items-center gap-4 text-xs sm:text-sm text-[#56616A] no-print">
              <button
                type="button"
                onClick={() => onNavigate('/', 'temoignages')}
                className="font-medium text-[#245B7A] hover:text-[#17191C] underline underline-offset-4 transition-colors whitespace-nowrap"
              >
                Témoigner sur le défunt
              </button>

              <span aria-hidden="true" className="text-[#DCE8EF]">
                ·
              </span>

              <button
                type="button"
                onClick={() => onNavigate('/', 'souvenirs')}
                className="font-medium text-[#245B7A] hover:text-[#17191C] underline underline-offset-4 transition-colors whitespace-nowrap"
              >
                Partager des photos du deuil
              </button>

              <span aria-hidden="true" className="text-[#DCE8EF]">
                ·
              </span>

              <button
                type="button"
                onClick={triggerBrowserPrint}
                className="inline-flex items-center gap-1.5 hover:text-[#17191C] transition-colors py-1 whitespace-nowrap"
              >
                <Printer className="w-3.5 h-3.5 text-[#245B7A]" />
                <span>Imprimer</span>
              </button>

              <span aria-hidden="true" className="text-[#DCE8EF]">
                ·
              </span>

              <button
                type="button"
                onClick={handleShare}
                className="inline-flex items-center gap-1.5 hover:text-[#17191C] transition-colors py-1 whitespace-nowrap"
              >
                <Share2 className="w-3.5 h-3.5 text-[#245B7A]" />
                <span>Partager</span>
              </button>

              {shareFeedback && (
                <span role="status" className="text-xs font-medium text-[#245B7A]">
                  — {shareFeedback}
                </span>
              )}
            </div>
          </div>

          {/* Right Column (5 cols): Portrait of the Deceased via portraitUrl displayed on the Right of the Title */}
          <div className="lg:col-span-5 flex flex-col items-center lg:items-end">
            <div className="w-full max-w-[400px] bg-white/95 backdrop-blur-xs p-3.5 sm:p-5 rounded-lg border border-[#DCE8EF] shadow-sm">
              {hasValidPortrait ? (
                <figure className="space-y-3">
                  <div className="overflow-hidden rounded-md bg-[#EFF8FD] border border-[#DCE8EF]">
                    <img
                      src={resolvedPortraitUrl}
                      alt={`Portrait de ${settings.displayName}`}
                      referrerPolicy="no-referrer"
                      onError={() => setImageFailed(true)}
                      className="w-full h-auto max-h-[470px] object-cover object-top block"
                    />
                  </div>
                  <figcaption className="text-center space-y-0.5 pt-1">
                    <p className="font-serif-editorial font-semibold text-base text-[#17191C]">
                      {settings.displayName}
                    </p>
                    <p className="font-serif-editorial italic text-sm text-[#56616A] tabular-nums">
                      {settings.birthYear} — {settings.deathYear}
                    </p>
                  </figcaption>
                </figure>
              ) : (
                /* Typographic Monogram Fallback if no portraitUrl is configured */
                <div className="aspect-[3/4] w-full rounded-md bg-white border border-[#DCE8EF] flex flex-col items-center justify-center p-8 text-center space-y-4">
                  <div className="w-16 h-[1px] bg-[#A9D7F2]" aria-hidden="true" />
                  <p className="font-serif-editorial text-3xl sm:text-4xl font-semibold tracking-widest text-[#245B7A]">
                    {initials}
                  </p>
                  <p className="font-serif-editorial text-lg text-[#17191C]">
                    {settings.displayName}
                  </p>
                  <p className="font-serif-editorial text-base text-[#56616A] tabular-nums">
                    {settings.birthYear} — {settings.deathYear}
                  </p>
                  <div className="w-16 h-[1px] bg-[#A9D7F2]" aria-hidden="true" />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

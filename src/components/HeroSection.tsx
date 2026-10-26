import React, { useState } from 'react';
import { Feather, MessageCircle, Printer, Share2 } from 'lucide-react';
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

const CHEFFERIE_HERO_IMAGE =
  '/assets/aistudio/Portrait_c_r_moniel_devant_la_chefferie_de_Bandjoun_f1aac569.png';

export const HeroSection: React.FC<HeroSectionProps> = ({
  settings,
  portraitUrl,
  onNavigate,
  onOpenPresenceModal,
  onTriggerDoves,
}) => {
  const [shareFeedback, setShareFeedback] = useState<string | null>(null);

  // Always default to 'Portrait cérémoniel devant la chefferie de Bandjoun' as the Hero background
  const heroImageUrl =
    portraitUrl &&
    !portraitUrl.includes('Portrait_professionnel_en_costume_sombre') &&
    !portraitUrl.includes('Capture_d__cran_2026-10-26_091336')
      ? portraitUrl
      : CHEFFERIE_HERO_IMAGE;

  const shareTitleText = `En mémoire de ${settings.displayName} | ${settings.birthYear}–${settings.deathYear}`;

  const handleShare = async () => {
    const res = await shareMemorialUrl(shareTitleText, shareTitleText);
    if (res === 'copied') {
      setShareFeedback('Lien copié dans le presse-papiers');
      setTimeout(() => setShareFeedback(null), 3500);
    } else if (res === 'shared') {
      setShareFeedback('Lien partagé');
      setTimeout(() => setShareFeedback(null), 3500);
    }
  };

  const whatsappShareHref =
    typeof window !== 'undefined'
      ? `https://wa.me/?text=${encodeURIComponent(
          `${shareTitleText}\n${window.location.origin}`
        )}`
      : `https://wa.me/?text=${encodeURIComponent(shareTitleText)}`;

  return (
    <section
      id="accueil"
      aria-labelledby="hero-memorial-title"
      className="relative overflow-hidden border-b border-[#DCE8EF] min-h-[660px] sm:min-h-[740px] flex items-center justify-center py-16 sm:py-24 lg:py-28 print-break-inside-avoid"
    >
      {/* Full-Bleed 'Portrait cérémonie devant la chefferie' Background */}
      <div
        aria-hidden="true"
        className="absolute inset-0 z-0 pointer-events-none overflow-hidden bg-[#17191C]"
      >
        <img
          src={heroImageUrl}
          alt={`Portrait cérémoniel de ${settings.displayName} devant la Chefferie de Bandjoun`}
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover object-[center_18%] scale-[1.01]"
        />
        {/* Balanced Editorial Gradient preserving the Chefferie portrait visibility while guaranteeing high contrast */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#17191C]/40 via-[#17191C]/55 to-[#17191C]/80" />
      </div>

      {/* Centered High-Contrast Editorial Content Block */}
      <div className="relative z-10 max-w-[880px] mx-auto px-4 sm:px-6 lg:px-8 w-full text-center">
        <div className="bg-[#17191C]/75 backdrop-blur-md border border-[#A9D7F2]/35 rounded-xl p-6 sm:p-10 lg:p-12 space-y-6 shadow-xl">
          {/* Configurable Religious Symbol (only when confirmed by family) */}
          {settings.religiousSymbolConfirmed &&
            settings.religiousSymbol === 'cross' && (
              <div
                aria-label="Symbole de recueillement"
                className="text-[#A9D7F2] font-serif-editorial text-2xl select-none"
              >
                ✝
              </div>
            )}

          {/* Centered Kicker */}
          <div className="flex flex-wrap items-center justify-center gap-2 text-xs sm:text-sm tracking-widest uppercase text-[#A9D7F2] font-semibold">
            <span>Faire-part de deuil et hommage</span>
            <span aria-hidden="true">·</span>
            <span>{settings.birthPlace}</span>
          </div>

          {/* Centered Primary Title & Years */}
          <div className="space-y-2.5">
            <h1
              id="hero-memorial-title"
              className="font-serif-editorial text-4xl sm:text-5xl lg:text-6xl font-semibold text-white leading-[1.12] tracking-tight mx-auto"
              style={{ textWrap: 'balance' }}
            >
              {settings.displayName}
            </h1>

            <p className="font-serif-editorial text-2xl sm:text-3xl text-[#A9D7F2] font-semibold tabular-nums tracking-wide pt-1">
              {settings.birthYear} — {settings.deathYear}
            </p>
          </div>

          {/* Centered Hairline Divider */}
          <div
            className="w-24 h-[1px] bg-[#A9D7F2]/80 mx-auto"
            aria-hidden="true"
          />

          {/* Centered Tribute Quote */}
          <blockquote className="font-serif-editorial italic text-xl sm:text-2xl text-white leading-relaxed max-w-2xl mx-auto">
            « Une vie de transmission, une présence qui demeure dans nos
            mémoires. »
          </blockquote>

          {/* Centered Introductory Text */}
          <div className="space-y-3 text-base sm:text-[17px] text-[#EFF8FD] leading-relaxed max-w-2xl mx-auto">
            <p>
              Les familles ont la profonde douleur de vous annoncer le décès de{' '}
              <strong className="font-semibold text-white">
                {settings.displayName}
              </strong>
              . Elles vous invitent à les entourer de votre présence et de vos
              pensées durant les cérémonies organisées en sa mémoire.
            </p>
            <p className="text-sm sm:text-base text-white/90">
              Homme de famille, enseignant à l’Université de Douala et au
              Collège La Retraite à Yaoundé, il laisse le souvenir d’un parcours
              dédié à l’éducation et au partage des connaissances.
            </p>
          </div>

          {/* Centered Primary & Secondary Actions (High Contrast Palette) */}
          <div className="pt-3 flex flex-wrap items-center justify-center gap-3 sm:gap-4 no-print">
            <button
              type="button"
              onClick={() => onNavigate('/programme', 'programme')}
              className="px-5 py-3 text-sm font-semibold text-[#17191C] bg-white hover:bg-[#EFF8FD] border border-[#DCE8EF] rounded-md transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#A9D7F2]"
            >
              Consulter le programme
            </button>

            <button
              type="button"
              onClick={() => {
                onTriggerDoves();
                onOpenPresenceModal();
              }}
              className="inline-flex items-center gap-2 px-5 py-3 text-sm font-medium text-white bg-[#245B7A] hover:bg-[#1B465E] border border-[#A9D7F2]/50 rounded-md transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#A9D7F2]"
            >
              <Feather className="w-4 h-4 text-[#A9D7F2]" />
              <span>Confirmer ma présence</span>
            </button>

            <button
              type="button"
              onClick={() => onNavigate('/biographie', 'biographie')}
              className="px-4 py-3 text-sm font-medium text-white bg-white/15 hover:bg-white/25 border border-white/35 rounded-md transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              Lire sa biographie
            </button>
          </div>

          {/* Centered Utility Bar: WhatsApp Share, Direct Testimony, Print & Share */}
          <div className="pt-4 border-t border-white/20 flex flex-wrap items-center justify-center gap-4 text-xs sm:text-sm text-white/90 no-print">
            <a
              href={whatsappShareHref}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 font-semibold text-[#A9D7F2] hover:text-white transition-colors py-1 whitespace-nowrap"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Partager sur WhatsApp</span>
            </a>

            <span aria-hidden="true" className="text-white/35">
              ·
            </span>

            <button
              type="button"
              onClick={() => onNavigate('/', 'temoignages')}
              className="font-medium text-white hover:text-[#A9D7F2] underline underline-offset-4 transition-colors whitespace-nowrap"
            >
              Témoigner sur le défunt
            </button>

            <span aria-hidden="true" className="text-white/35">
              ·
            </span>

            <button
              type="button"
              onClick={() => onNavigate('/', 'souvenirs')}
              className="font-medium text-white hover:text-[#A9D7F2] underline underline-offset-4 transition-colors whitespace-nowrap"
            >
              Voir et partager les photos
            </button>

            <span aria-hidden="true" className="text-white/35">
              ·
            </span>

            <button
              type="button"
              onClick={triggerBrowserPrint}
              className="inline-flex items-center gap-1.5 hover:text-[#A9D7F2] transition-colors py-1 whitespace-nowrap"
            >
              <Printer className="w-3.5 h-3.5 text-[#A9D7F2]" />
              <span>Imprimer</span>
            </button>

            <span aria-hidden="true" className="text-white/35">
              ·
            </span>

            <button
              type="button"
              onClick={handleShare}
              className="inline-flex items-center gap-1.5 hover:text-[#A9D7F2] transition-colors py-1 whitespace-nowrap"
            >
              <Share2 className="w-3.5 h-3.5 text-[#A9D7F2]" />
              <span>Copier le lien</span>
            </button>

            {shareFeedback && (
              <span
                role="status"
                className="text-xs font-semibold text-[#A9D7F2]"
              >
                — {shareFeedback}
              </span>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

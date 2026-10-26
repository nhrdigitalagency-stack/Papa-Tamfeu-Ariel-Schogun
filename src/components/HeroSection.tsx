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

  // Use the ceremonial portrait in front of the Chefferie de Bandjoun as the Hero image
  const heroImageUrl =
    portraitUrl &&
    !portraitUrl.includes('Portrait_professionnel_en_costume_sombre')
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
      className="relative overflow-hidden border-b border-[#DCE8EF] min-h-[640px] sm:min-h-[700px] flex items-center justify-center py-16 sm:py-24 lg:py-28 print-break-inside-avoid"
    >
      {/* Full-Bleed Ceremonial Portrait in front of Chefferie de Bandjoun as Hero Background */}
      <div
        aria-hidden="true"
        className="absolute inset-0 z-0 pointer-events-none overflow-hidden bg-[#17191C]"
      >
        <img
          src={heroImageUrl}
          alt={`Portrait cérémoniel de ${settings.displayName} devant la Chefferie de Bandjoun`}
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover object-[center_22%] opacity-90"
        />
        {/* Measured Contrast Scrim ensuring clear visibility of the Chefferie portrait and 4.5:1+ centered text legibility */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#17191C]/55 via-[#17191C]/65 to-[#17191C]/85" />
      </div>

      {/* Centered Editorial Content Container */}
      <div className="relative z-10 max-w-[900px] mx-auto px-4 sm:px-6 lg:px-8 w-full text-center">
        <div className="bg-[#17191C]/45 backdrop-blur-[3px] border border-white/20 rounded-xl p-6 sm:p-10 lg:p-12 space-y-6 shadow-lg">
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
          <div className="flex flex-wrap items-center justify-center gap-2 text-xs sm:text-sm tracking-widest uppercase text-[#A9D7F2] font-medium">
            <span>Faire-part de deuil et hommage</span>
            <span aria-hidden="true">·</span>
            <span>{settings.birthPlace}</span>
          </div>

          {/* Centered Primary Title & Years */}
          <div className="space-y-2">
            <h1
              id="hero-memorial-title"
              className="font-serif-editorial text-4xl sm:text-5xl lg:text-6xl font-semibold text-white leading-[1.12] tracking-tight mx-auto"
              style={{ textWrap: 'balance' }}
            >
              {settings.displayName}
            </h1>

            <p className="font-serif-editorial text-2xl sm:text-3xl text-[#A9D7F2] font-medium tabular-nums tracking-wide pt-1">
              {settings.birthYear} — {settings.deathYear}
            </p>
          </div>

          {/* Centered Hairline Divider */}
          <div className="w-24 h-[1px] bg-[#A9D7F2]/80 mx-auto" aria-hidden="true" />

          {/* Centered Tribute Quote */}
          <blockquote className="font-serif-editorial italic text-xl sm:text-2xl text-white/95 leading-relaxed max-w-2xl mx-auto">
            « Une vie de transmission, une présence qui demeure dans nos mémoires. »
          </blockquote>

          {/* Centered Introductory Text */}
          <div className="space-y-3 text-base sm:text-[17px] text-white/90 leading-relaxed max-w-2xl mx-auto">
            <p>
              Les familles ont la profonde douleur de vous annoncer le décès de{' '}
              <strong className="font-semibold text-white">
                {settings.displayName}
              </strong>
              . Elles vous invitent à les entourer de votre présence et de vos
              pensées durant les cérémonies organisées en sa mémoire.
            </p>
            <p className="text-sm sm:text-base text-white/80">
              Homme de famille, enseignant à l’Université de Douala et au Collège
              La Retraite à Yaoundé, il laisse le souvenir d’un parcours dédié à
              l’éducation et au partage des connaissances.
            </p>
          </div>

          {/* Centered Primary & Secondary Actions */}
          <div className="pt-3 flex flex-wrap items-center justify-center gap-3 sm:gap-4 no-print">
            <button
              type="button"
              onClick={() => onNavigate('/programme', 'programme')}
              className="px-5 py-3 text-sm font-medium text-[#17191C] bg-[#A9D7F2] hover:bg-white rounded-md transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#A9D7F2]"
            >
              Consulter le programme
            </button>

            <button
              type="button"
              onClick={() => {
                onTriggerDoves();
                onOpenPresenceModal();
              }}
              className="inline-flex items-center gap-2 px-5 py-3 text-sm font-medium text-white bg-[#245B7A] hover:bg-[#1B465E] border border-[#A9D7F2]/40 rounded-md transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#A9D7F2]"
            >
              <Feather className="w-4 h-4 text-[#A9D7F2]" />
              <span>Confirmer ma présence</span>
            </button>

            <button
              type="button"
              onClick={() => onNavigate('/biographie', 'biographie')}
              className="px-4 py-3 text-sm font-medium text-white bg-white/10 hover:bg-white/20 border border-white/30 rounded-md transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              Lire sa biographie
            </button>
          </div>

          {/* Centered Utility Bar: WhatsApp Share, Direct Testimony, Print & Share */}
          <div className="pt-4 border-t border-white/20 flex flex-wrap items-center justify-center gap-4 text-xs sm:text-sm text-white/85 no-print">
            <a
              href={whatsappShareHref}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 font-medium text-[#A9D7F2] hover:text-white transition-colors py-1 whitespace-nowrap"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Partager sur WhatsApp</span>
            </a>

            <span aria-hidden="true" className="text-white/30">
              ·
            </span>

            <button
              type="button"
              onClick={() => onNavigate('/', 'temoignages')}
              className="font-medium text-white/90 hover:text-[#A9D7F2] underline underline-offset-4 transition-colors whitespace-nowrap"
            >
              Témoigner sur le défunt
            </button>

            <span aria-hidden="true" className="text-white/30">
              ·
            </span>

            <button
              type="button"
              onClick={() => onNavigate('/', 'souvenirs')}
              className="font-medium text-white/90 hover:text-[#A9D7F2] underline underline-offset-4 transition-colors whitespace-nowrap"
            >
              Voir et partager les photos
            </button>

            <span aria-hidden="true" className="text-white/30">
              ·
            </span>

            <button
              type="button"
              onClick={triggerBrowserPrint}
              className="inline-flex items-center gap-1.5 hover:text-white transition-colors py-1 whitespace-nowrap"
            >
              <Printer className="w-3.5 h-3.5 text-[#A9D7F2]" />
              <span>Imprimer</span>
            </button>

            <span aria-hidden="true" className="text-white/30">
              ·
            </span>

            <button
              type="button"
              onClick={handleShare}
              className="inline-flex items-center gap-1.5 hover:text-white transition-colors py-1 whitespace-nowrap"
            >
              <Share2 className="w-3.5 h-3.5 text-[#A9D7F2]" />
              <span>Copier le lien</span>
            </button>

            {shareFeedback && (
              <span role="status" className="text-xs font-medium text-[#A9D7F2]">
                — {shareFeedback}
              </span>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

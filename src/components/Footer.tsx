import React from 'react';
import { Printer, Share2 } from 'lucide-react';
import { MemorialPublicPayload } from '../types/memorial';
import { shareMemorialUrl, triggerBrowserPrint } from '../utils/imageAndShare';
import { ActiveRoute } from './Header';

interface FooterProps {
  settings: MemorialPublicPayload['settings'];
  onNavigate: (route: ActiveRoute, sectionId?: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ settings, onNavigate }) => {
  return (
    <footer className="bg-[#17191C] text-white py-12 sm:py-16 pb-20 sm:pb-16 border-t border-[#DCE8EF] no-print">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 pb-8 border-b border-white/15">
          {/* Memorial Identity */}
          <div className="md:col-span-6 space-y-3">
            <p className="text-xs uppercase tracking-widest text-[#A9D7F2] font-medium">
              Faire-part de deuil et d’hommage
            </p>
            <h2 className="font-serif-editorial text-2xl sm:text-3xl font-semibold text-white">
              {settings.displayName}
            </h2>
            <p className="font-serif-editorial text-lg text-[#A9D7F2] tabular-nums">
              {settings.birthYear} — {settings.deathYear}
            </p>
            <p className="text-xs sm:text-sm text-white/75 max-w-md leading-relaxed">
              « Une vie de transmission, une présence qui demeure dans nos
              mémoires. »
            </p>
          </div>

          {/* Direct Pages & Rubrics */}
          <div className="md:col-span-3 space-y-3">
            <h3 className="text-xs uppercase tracking-widest text-[#A9D7F2] font-semibold">
              Rubriques du mémorial
            </h3>
            <ul className="space-y-2 text-xs sm:text-sm text-white/80">
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('/', 'accueil')}
                  className="hover:text-white transition-colors"
                >
                  Accueil & Faire-part
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('/biographie', 'biographie')}
                  className="hover:text-white transition-colors"
                >
                  Biographie (/biographie)
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('/programme', 'programme')}
                  className="hover:text-white transition-colors"
                >
                  Programme des cérémonies (/programme)
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('/', 'localisation')}
                  className="hover:text-white transition-colors"
                >
                  Repères vers le domicile
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('/souvenirs', 'souvenirs')}
                  className="hover:text-white transition-colors"
                >
                  Photos et souvenirs (/souvenirs)
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('/', 'contact')}
                  className="hover:text-white transition-colors"
                >
                  Contact et condoléances
                </button>
              </li>
            </ul>
          </div>

          {/* Actions & Legal / Family Admin */}
          <div className="md:col-span-3 space-y-3">
            <h3 className="text-xs uppercase tracking-widest text-[#A9D7F2] font-semibold">
              Informations & Accès
            </h3>
            <ul className="space-y-2 text-xs sm:text-sm text-white/80">
              <li>
                <button
                  type="button"
                  onClick={triggerBrowserPrint}
                  className="inline-flex items-center gap-2 hover:text-white transition-colors"
                >
                  <Printer className="w-3.5 h-3.5 text-[#A9D7F2]" />
                  <span>Imprimer le faire-part</span>
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => shareMemorialUrl()}
                  className="inline-flex items-center gap-2 hover:text-white transition-colors"
                >
                  <Share2 className="w-3.5 h-3.5 text-[#A9D7F2]" />
                  <span>Partager le lien</span>
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('/confidentialite')}
                  className="hover:text-white transition-colors"
                >
                  Confidentialité & Modération (/confidentialite)
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('/admin')}
                  className="hover:text-white transition-colors text-[#A9D7F2]"
                >
                  Administration familiale (/admin)
                </button>
              </li>
            </ul>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-white/60">
          <p>
            En mémoire de {settings.displayName} ({settings.birthYear}–
            {settings.deathYear}). Famille Tamfeu, Famille Carlade et familles
            alliées.
          </p>
          <p>Fuseau horaire de référence : {settings.timeZone}</p>
        </div>
      </div>
    </footer>
  );
};

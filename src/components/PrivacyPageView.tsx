import React from 'react';
import { ArrowLeft, ShieldCheck } from 'lucide-react';
import { MemorialPublicPayload } from '../types/memorial';
import { ActiveRoute } from './Header';

interface PrivacyPageViewProps {
  settings: MemorialPublicPayload['settings'];
  onNavigate: (route: ActiveRoute, sectionId?: string) => void;
}

export const PrivacyPageView: React.FC<PrivacyPageViewProps> = ({
  settings,
  onNavigate,
}) => {
  return (
    <section
      aria-labelledby="confidentialite-heading"
      className="py-14 sm:py-20 bg-white min-h-[75vh]"
    >
      <div className="max-w-[900px] mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        <div className="space-y-4 border-b border-[#DCE8EF] pb-6">
          <button
            type="button"
            onClick={() => onNavigate('/', 'accueil')}
            className="inline-flex items-center gap-2 text-xs font-medium text-[#245B7A] hover:text-[#17191C]"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Retour au faire-part</span>
          </button>

          <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-[#245B7A] font-semibold">
            <ShieldCheck className="w-4 h-4" />
            <span>Respect de la vie privée et des familles</span>
          </div>

          <h1
            id="confidentialite-heading"
            className="font-serif-editorial text-3xl sm:text-4xl font-semibold text-[#17191C]"
          >
            Confidentialité, modération et protection des données
          </h1>
        </div>

        <div className="space-y-8 text-sm sm:text-base text-[#17191C] leading-relaxed">
          <div className="space-y-2">
            <h2 className="font-serif-editorial text-2xl font-semibold text-[#17191C]">
              1. Vocation du site
            </h2>
            <p className="text-[#56616A]">
              Ce site est consacré exclusivement au faire-part de deuil et à
              l’hommage rendu à{' '}
              <strong className="text-[#17191C]">{settings.displayName}</strong>{' '}
              ({settings.birthYear} — {settings.deathYear}). Il ne comporte
              aucune finalité commerciale, publicitaire ou promotionnelle.
            </p>
          </div>

          <div className="space-y-2">
            <h2 className="font-serif-editorial text-2xl font-semibold text-[#17191C]">
              2. Modération des témoignages et condoléances
            </h2>
            <p className="text-[#56616A]">
              Les messages déposés via le formulaire de condoléances permettent
              de choisir entre un envoi strictement privé à l’attention de la
              famille ou une proposition de publication dans le livre d’hommages.
              Les témoignages destinés à la galerie publique sont enregistrés avec
              le statut « en attente » et ne sont affichés qu’après validation
              explicite par la famille.
            </p>
          </div>

          <div className="space-y-2">
            <h2 className="font-serif-editorial text-2xl font-semibold text-[#17191C]">
              3. Souvenirs photographiques et retrait des métadonnées GPS
            </h2>
            <p className="text-[#56616A]">
              Lorsqu’une contribution photographique est activée par la famille,
              chaque image est re-traitée avant son envoi afin de supprimer
              automatiquement les métadonnées EXIF et les coordonnées de
              géolocalisation GPS. Aucune image n’est publiée sans le consentement
              de son auteur et la validation de l’administration familiale.
            </p>
          </div>

          <div className="space-y-2">
            <h2 className="font-serif-editorial text-2xl font-semibold text-[#17191C]">
              4. Droit de rectification et de retrait
            </h2>
            <p className="text-[#56616A]">
              Tout proche ou contributeur peut demander à tout moment la
              modification ou la suppression d’un témoignage ou d’une photographie
              en utilisant le bouton « Demander un retrait » sous la photo
              concernée ou en adressant un message privé à la famille via la
              rubrique Contact.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

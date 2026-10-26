import React, { useRef, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Feather,
  MessageSquarePlus,
  Send,
} from 'lucide-react';
import { DRAFT_TRIBUTE_PROPOSALS } from '../data/initialMemorialData';
import { DraftTributeProposal, TributeItem } from '../types/memorial';

interface TributesSectionViewProps {
  approvedTributes: TributeItem[];
  backendConnected: boolean;
  onSelectDraftProposal: (draft: DraftTributeProposal) => void;
  onRefreshData: () => void;
}

export const TributesSectionView: React.FC<TributesSectionViewProps> = ({
  approvedTributes,
  backendConnected,
  onSelectDraftProposal,
  onRefreshData,
}) => {
  const [showDrafts, setShowDrafts] = useState(false);
  const [activeSeries, setActiveSeries] = useState<'destinataires' | 'thematiques'>(
    'destinataires'
  );

  // Direct Inline Testimony Form State
  const inlineFormRef = useRef<HTMLFormElement | null>(null);
  const [authorFirstName, setAuthorFirstName] = useState('');
  const [authorLastName, setAuthorLastName] = useState('');
  const [relationship, setRelationship] = useState('');
  const [message, setMessage] = useState('');
  const [consentPublication, setConsentPublication] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  const visibleDrafts = DRAFT_TRIBUTE_PROPOSALS.filter(
    (d) => d.series === activeSeries
  );

  const handleLoadDraftIntoInlineForm = (draft: DraftTributeProposal) => {
    setMessage(draft.text);
    if (!relationship) {
      setRelationship(draft.suggestedRelationship);
    }
    setFeedback(null);
    onSelectDraftProposal(draft);
    if (inlineFormRef.current) {
      inlineFormRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
  };

  const handleSubmitDirectTribute = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    if (!authorFirstName.trim() || authorFirstName.trim().length < 2) {
      setFeedback({
        type: 'error',
        message: 'Veuillez indiquer votre prénom ou pseudonyme.',
      });
      return;
    }

    if (!message.trim() || message.trim().length < 10) {
      setFeedback({
        type: 'error',
        message: 'Veuillez rédiger un témoignage d’au moins 10 caractères.',
      });
      return;
    }

    if (!consentPublication) {
      setFeedback({
        type: 'error',
        message: 'Veuillez confirmer votre accord de publication sur le site.',
      });
      return;
    }

    if (!backendConnected) {
      setFeedback({
        type: 'error',
        message:
          'Le serveur n’est pas joignable actuellement. Veuillez réessayer dans un instant.',
      });
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/tributes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          authorFirstName: authorFirstName.trim(),
          authorLastName: authorLastName.trim(),
          relationship: relationship.trim(),
          message: message.trim(),
          isPrivateToFamily: false,
          consentPublication: true,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || 'Impossible de publier votre témoignage.');
      }

      setAuthorFirstName('');
      setAuthorLastName('');
      setRelationship('');
      setMessage('');
      setFeedback({
        type: 'success',
        message:
          data.message ||
          'Votre témoignage a été publié directement sur le mur d’hommages.',
      });
      onRefreshData();
    } catch (err) {
      setFeedback({
        type: 'error',
        message:
          err instanceof Error
            ? err.message
            : 'Erreur lors de la publication du témoignage.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section
      id="temoignages"
      aria-labelledby="temoignages-heading"
      className="py-14 sm:py-20 bg-white/90 border-b border-[#DCE8EF]"
    >
      <div className="max-w-[1080px] mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[#DCE8EF] pb-6">
          <div className="space-y-2">
            <p className="text-xs tracking-widest uppercase text-[#56616A] font-medium">
              Livre d’hommages et de souvenir
            </p>
            <h2
              id="temoignages-heading"
              className="font-serif-editorial text-3xl sm:text-4xl font-semibold text-[#17191C]"
            >
              Témoignages sur le défunt
            </h2>
          </div>

          <button
            type="button"
            onClick={() =>
              inlineFormRef.current?.scrollIntoView({
                behavior: 'smooth',
                block: 'center',
              })
            }
            className="no-print self-start sm:self-auto inline-flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-medium text-white bg-[#245B7A] hover:bg-[#1B465E] rounded-md transition-colors whitespace-nowrap"
          >
            <MessageSquarePlus className="w-4 h-4" />
            <span>Témoigner maintenant</span>
          </button>
        </div>

        {/* Part 1: Published Tributes Wall + Direct Testimony Form */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">
          {/* Left Column (7 cols): Published Tributes */}
          <div className="lg:col-span-7 space-y-6">
            <div className="space-y-1">
              <h3 className="font-serif-editorial text-2xl font-semibold text-[#17191C]">
                Hommages et témoignages partagés ({approvedTributes.length})
              </h3>
              <p className="text-xs sm:text-sm text-[#56616A]">
                Souvenirs, paroles de réconfort et témoignages laissés par la
                famille, les collègues, les anciens élèves et les amis.
              </p>
            </div>

            {approvedTributes.length > 0 ? (
              <div className="space-y-4">
                {approvedTributes.map((tribute) => (
                  <article
                    key={tribute.id}
                    className="p-6 rounded-lg bg-[#EFF8FD]/60 border border-[#DCE8EF] flex flex-col justify-between gap-4 print-break-inside-avoid"
                  >
                    <blockquote className="text-[#17191C] leading-relaxed font-serif-editorial italic text-lg sm:text-xl">
                      « {tribute.message} »
                    </blockquote>
                    <footer className="pt-3 border-t border-[#DCE8EF] flex flex-wrap items-center justify-between gap-2 text-xs text-[#56616A]">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold text-[#17191C]">
                          {tribute.authorFirstName}{' '}
                          {tribute.authorLastName ? tribute.authorLastName : ''}
                        </span>
                        {tribute.relationship && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span>{tribute.relationship}</span>
                          </>
                        )}
                      </div>
                      <span className="tabular-nums text-[11px]">
                        {new Date(tribute.createdAt).toLocaleDateString('fr-FR')}
                      </span>
                    </footer>
                  </article>
                ))}
              </div>
            ) : (
              <div className="bg-[#EFF8FD]/45 border border-[#DCE8EF] rounded-lg p-6 sm:p-8 space-y-3">
                <p className="font-serif-editorial text-xl text-[#17191C]">
                  Soyez le premier à partager un témoignage en mémoire de Papa
                  Tamfeu Ariel Schogun.
                </p>
                <p className="text-sm text-[#56616A] leading-relaxed">
                  Utilisez le formulaire ci-contre pour publier directement votre
                  témoignage, un souvenir de cours, de collègue ou d’amitié sur le
                  site.
                </p>
              </div>
            )}
          </div>

          {/* Right Column (5 cols): Direct Testimony Form */}
          <div className="lg:col-span-5 no-print">
            <form
              ref={inlineFormRef}
              onSubmit={handleSubmitDirectTribute}
              className="bg-white border border-[#DCE8EF] rounded-lg p-5 sm:p-6 space-y-4 shadow-xs"
            >
              <div className="space-y-1 border-b border-[#DCE8EF] pb-3">
                <p className="text-xs uppercase tracking-widest text-[#245B7A] font-semibold">
                  Publication directe sur le site
                </p>
                <h3 className="font-serif-editorial text-2xl font-semibold text-[#17191C]">
                  Témoigner sur le défunt
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label
                    htmlFor="direct-trib-firstname"
                    className="block text-xs font-semibold text-[#17191C] mb-1"
                  >
                    Prénom *
                  </label>
                  <input
                    id="direct-trib-firstname"
                    type="text"
                    required
                    value={authorFirstName}
                    onChange={(e) => setAuthorFirstName(e.target.value)}
                    placeholder="Votre prénom"
                    className="w-full px-3 py-2 text-sm bg-white border border-[#DCE8EF] rounded-md text-[#17191C] focus:outline-none focus:border-[#245B7A]"
                  />
                </div>
                <div>
                  <label
                    htmlFor="direct-trib-lastname"
                    className="block text-xs font-semibold text-[#17191C] mb-1"
                  >
                    Nom (facultatif)
                  </label>
                  <input
                    id="direct-trib-lastname"
                    type="text"
                    value={authorLastName}
                    onChange={(e) => setAuthorLastName(e.target.value)}
                    placeholder="Votre nom"
                    className="w-full px-3 py-2 text-sm bg-white border border-[#DCE8EF] rounded-md text-[#17191C] focus:outline-none focus:border-[#245B7A]"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="direct-trib-relation"
                  className="block text-xs font-semibold text-[#17191C] mb-1"
                >
                  Votre lien avec le défunt
                </label>
                <input
                  id="direct-trib-relation"
                  type="text"
                  value={relationship}
                  onChange={(e) => setRelationship(e.target.value)}
                  placeholder="Ex. : Collègue, Ancien élève, Ami, Proche..."
                  className="w-full px-3 py-2 text-sm bg-white border border-[#DCE8EF] rounded-md text-[#17191C] focus:outline-none focus:border-[#245B7A]"
                />
              </div>

              <div>
                <label
                  htmlFor="direct-trib-message"
                  className="block text-xs font-semibold text-[#17191C] mb-1"
                >
                  Votre témoignage *
                </label>
                <textarea
                  id="direct-trib-message"
                  rows={4}
                  required
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Partagez un souvenir, un hommage ou un mot pour honorer sa mémoire..."
                  className="w-full px-3 py-2 text-sm bg-white border border-[#DCE8EF] rounded-md text-[#17191C] leading-relaxed focus:outline-none focus:border-[#245B7A]"
                />
              </div>

              <label className="flex items-start gap-2.5 text-xs text-[#56616A] cursor-pointer">
                <input
                  type="checkbox"
                  checked={consentPublication}
                  onChange={(e) => setConsentPublication(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-[#DCE8EF] text-[#245B7A]"
                />
                <span>
                  J’accepte que mon témoignage apparaisse sur cette page d’hommage
                  (la famille conserve la possibilité de modérer les publications).
                </span>
              </label>

              {feedback && (
                <div
                  role="alert"
                  className={`p-3 rounded-md border text-xs flex items-start gap-2 ${
                    feedback.type === 'success'
                      ? 'bg-[#EFF8FD] border-[#245B7A] text-[#17191C]'
                      : 'bg-red-50 border-red-200 text-red-900'
                  }`}
                >
                  {feedback.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 text-[#245B7A] shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-red-700 shrink-0 mt-0.5" />
                  )}
                  <span>{feedback.message}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-medium text-white bg-[#245B7A] hover:bg-[#1B465E] disabled:opacity-50 rounded-md transition-colors"
              >
                <Send className="w-4 h-4" />
                <span>
                  {submitting
                    ? 'Publication en cours...'
                    : 'Publier mon témoignage sur le site'}
                </span>
              </button>
            </form>
          </div>
        </div>

        {/* Part 2: 10 Editorial Tribute Proposals (Brouillons éditoriaux) */}
        <div className="bg-[#EFF8FD]/45 border border-[#DCE8EF] rounded-lg overflow-hidden no-print">
          <div className="p-5 sm:p-6 bg-[#EFF8FD] border-b border-[#DCE8EF] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-[#245B7A] font-semibold">
                <Feather className="w-3.5 h-3.5" />
                <span>Brouillons éditoriaux — Aide à la rédaction</span>
              </div>
              <h3 className="font-serif-editorial text-2xl font-semibold text-[#17191C]">
                Dix propositions de témoignages à personnaliser
              </h3>
              <p className="text-xs sm:text-sm text-[#56616A]">
                Vous manquez de mots ? Consultez ces dix modèles préparés pour
                aider les proches et cliquez sur « Utiliser ce modèle » pour le
                personnaliser dans le formulaire ci-dessus.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setShowDrafts((prev) => !prev)}
              aria-expanded={showDrafts}
              aria-controls="editorial-drafts-panel"
              className="self-start sm:self-center inline-flex items-center gap-2 px-3.5 py-2 text-xs font-medium text-[#17191C] bg-white hover:bg-[#EFF8FD] border border-[#DCE8EF] rounded-md transition-colors whitespace-nowrap shrink-0"
            >
              <span>
                {showDrafts
                  ? 'Masquer les propositions'
                  : 'Afficher les 10 propositions'}
              </span>
              {showDrafts ? (
                <ChevronUp className="w-4 h-4 text-[#245B7A]" />
              ) : (
                <ChevronDown className="w-4 h-4 text-[#245B7A]" />
              )}
            </button>
          </div>

          {showDrafts && (
            <div id="editorial-drafts-panel" className="p-5 sm:p-7 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#DCE8EF]">
                <p className="text-xs text-[#56616A]">
                  Choisissez une série de brouillons éditoriaux :
                </p>
                <div className="inline-flex items-center gap-1 p-1 bg-white border border-[#DCE8EF] rounded-md self-start">
                  <button
                    type="button"
                    onClick={() => setActiveSeries('destinataires')}
                    className={`px-3 py-1.5 text-xs font-medium rounded transition-colors whitespace-nowrap ${
                      activeSeries === 'destinataires'
                        ? 'bg-[#245B7A] text-white'
                        : 'text-[#56616A] hover:text-[#17191C]'
                    }`}
                  >
                    Selon le lien avec le défunt (10)
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveSeries('thematiques')}
                    className={`px-3 py-1.5 text-xs font-medium rounded transition-colors whitespace-nowrap ${
                      activeSeries === 'thematiques'
                        ? 'bg-[#245B7A] text-white'
                        : 'text-[#56616A] hover:text-[#17191C]'
                    }`}
                  >
                    Selon le thème d’hommage (10)
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {visibleDrafts.map((draft) => (
                  <div
                    key={draft.id}
                    className="bg-white border border-[#DCE8EF] rounded-md p-5 flex flex-col justify-between gap-4"
                  >
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between gap-2 text-xs text-[#56616A] border-b border-[#DCE8EF] pb-2">
                        <span className="font-semibold text-[#245B7A] tabular-nums">
                          Proposition {draft.numberLabel}
                        </span>
                        <span>
                          Proposition de témoignage — à personnaliser et à valider
                        </span>
                      </div>

                      <h4 className="font-serif-editorial text-xl font-semibold text-[#17191C]">
                        {draft.recipientOrTitle}
                      </h4>

                      <p className="text-sm text-[#56616A] leading-relaxed italic">
                        « {draft.text} »
                      </p>
                    </div>

                    <div className="pt-2 border-t border-[#DCE8EF]/70 flex items-center justify-between gap-2">
                      <span className="text-xs text-[#56616A]">
                        Destinataire suggéré : {draft.suggestedRelationship}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleLoadDraftIntoInlineForm(draft)}
                        className="text-xs font-medium text-[#245B7A] hover:text-[#17191C] underline underline-offset-4 whitespace-nowrap"
                      >
                        Utiliser et personnaliser
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

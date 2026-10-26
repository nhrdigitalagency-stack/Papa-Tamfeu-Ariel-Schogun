import React, { useEffect, useState } from 'react';
import {
  AlertCircle,
  Check,
  CheckCircle2,
  Copy,
  ExternalLink,
  Lock,
  MessageCircle,
  Send,
} from 'lucide-react';
import { DraftTributeProposal, MemorialPublicPayload } from '../types/memorial';
import {
  buildWhatsAppUrl,
  copyTextToClipboard,
} from '../utils/imageAndShare';

interface ContactCondolencesSectionProps {
  settings: MemorialPublicPayload['settings'];
  backendConnected: boolean;
  prefilledDraft: DraftTributeProposal | null;
  onClearDraft: () => void;
  onRefreshData: () => void;
}

export const ContactCondolencesSection: React.FC<
  ContactCondolencesSectionProps
> = ({
  settings,
  backendConnected,
  prefilledDraft,
  onClearDraft,
  onRefreshData,
}) => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [relationship, setRelationship] = useState('');
  const [message, setMessage] = useState('');
  const [deliveryMode, setDeliveryMode] = useState<'public' | 'private'>(
    'public'
  );
  const [consentPublication, setConsentPublication] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);
  const [copiedMessage, setCopiedMessage] = useState(false);

  // When a visitor clicks "Personnaliser ce texte" on one of the 10 draft proposals
  useEffect(() => {
    if (prefilledDraft) {
      setMessage(prefilledDraft.text);
      if (!relationship) {
        setRelationship(prefilledDraft.suggestedRelationship);
      }
      setDeliveryMode('public');
      setFeedback(null);
    }
  }, [prefilledDraft]);

  const formattedFullMessage = [
    `Hommage à ${settings.displayName} (${settings.birthYear}–${settings.deathYear})`,
    `De la part de : ${firstName.trim()}${
      lastName.trim() ? ` ${lastName.trim()}` : ''
    }${relationship.trim() ? ` (${relationship.trim()})` : ''}`,
    '',
    message.trim(),
  ].join('\n');

  const canUsePublicWhatsApp = Boolean(
    settings.contactConfirmed &&
      settings.whatsappNumber &&
      settings.whatsappNumber.replace(/[^\d]/g, '').length >= 8
  );

  const handleCopyMessage = async () => {
    if (!message.trim()) return;
    const ok = await copyTextToClipboard(formattedFullMessage);
    if (ok) {
      setCopiedMessage(true);
      setTimeout(() => setCopiedMessage(false), 3500);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    if (!firstName.trim() || firstName.trim().length < 2) {
      setFeedback({
        type: 'error',
        message: 'Veuillez renseigner votre prénom (au moins 2 caractères).',
      });
      return;
    }

    if (!message.trim() || message.trim().length < 10) {
      setFeedback({
        type: 'error',
        message: 'Veuillez rédiger votre message (au moins 10 caractères).',
      });
      return;
    }

    if (deliveryMode === 'public' && !consentPublication) {
      setFeedback({
        type: 'error',
        message:
          'Veuillez cocher la case de consentement pour proposer votre message dans le livre de condoléances public.',
      });
      return;
    }

    if (!backendConnected) {
      setFeedback({
        type: 'error',
        message:
          'La connexion au serveur de données n’est pas disponible actuellement. Vous pouvez copier votre message ci-dessous.',
      });
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/tributes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          authorFirstName: firstName.trim(),
          authorLastName: lastName.trim(),
          relationship: relationship.trim(),
          message: message.trim(),
          isPrivateToFamily: deliveryMode === 'private',
          consentPublication:
            deliveryMode === 'public' ? consentPublication : false,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(
          data?.error || 'Impossible d’enregistrer votre message.'
        );
      }

      setFeedback({
        type: 'success',
        message: data.message,
      });

      if (deliveryMode === 'public') {
        setMessage('');
        setConsentPublication(false);
        onClearDraft();
      }
      onRefreshData();
    } catch (err) {
      setFeedback({
        type: 'error',
        message:
          err instanceof Error
            ? err.message
            : 'Une erreur est survenue lors de l’enregistrement.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section
      id="contact"
      aria-labelledby="contact-heading"
      className="py-14 sm:py-20 bg-white border-b border-[#DCE8EF] no-print"
    >
      <div className="max-w-[1050px] mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        {/* Section Header */}
        <div className="border-b border-[#DCE8EF] pb-6 space-y-2">
          <p className="text-xs tracking-widest uppercase text-[#56616A] font-medium">
            Soutien et messages à la famille
          </p>
          <h2
            id="contact-heading"
            className="font-serif-editorial text-3xl sm:text-4xl font-semibold text-[#17191C]"
          >
            Contact et condoléances
          </h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          {/* Left Column: Family Contact Status */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-[#EFF8FD]/60 border border-[#DCE8EF] rounded-lg p-6 space-y-4">
              <h3 className="font-serif-editorial text-2xl font-semibold text-[#17191C]">
                Coordonnées de la famille
              </h3>

              {canUsePublicWhatsApp ? (
                <div className="space-y-4">
                  <p className="text-sm text-[#17191C] leading-relaxed">
                    Référent familial confirmé :{' '}
                    <strong className="font-semibold">
                      {settings.contactName || 'Famille Tamfeu'}
                    </strong>
                  </p>
                  <p className="text-xs text-[#56616A] leading-relaxed">
                    Vous pouvez utiliser le formulaire ci-contre ou préparer un
                    message privé via WhatsApp. Notez que l’ouverture de WhatsApp
                    prépare votre texte : vous devrez appuyer sur le bouton{' '}
                    <strong className="text-[#17191C]">Envoyer</strong> dans
                    l’application WhatsApp pour transmettre réellement votre
                    message.
                  </p>
                  <a
                    href={buildWhatsAppUrl(
                      settings.whatsappNumber,
                      message.trim()
                        ? formattedFullMessage
                        : `Bonjour, je souhaite adresser mes sincères condoléances à la famille de ${settings.displayName}.`
                    )}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-medium text-white bg-[#245B7A] hover:bg-[#1B465E] rounded-md transition-colors"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>Préparer un message dans WhatsApp</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              ) : (
                /* Honest state when contactConfirmed === false: WhatsApp buttons are hidden */
                <div className="space-y-3">
                  <p className="text-sm text-[#17191C] leading-relaxed">
                    Le numéro de contact direct de la famille est actuellement en
                    attente de confirmation.
                  </p>
                  <p className="text-xs text-[#56616A] leading-relaxed">
                    Par respect pour les proches, aucun bouton WhatsApp public
                    n’est affiché tant que le contact référent n’a pas été
                    explicitement validé dans l’espace d’administration familial.
                  </p>
                  <div className="pt-2 border-t border-[#DCE8EF] text-xs text-[#245B7A]">
                    Vous pouvez dès maintenant déposer un message privé ou un
                    témoignage via le formulaire ci-contre.
                  </div>
                </div>
              )}
            </div>

            <div className="bg-white border border-[#DCE8EF] rounded-lg p-5 space-y-2 text-xs text-[#56616A] leading-relaxed">
              <p className="font-semibold text-[#17191C]">
                Respect et modération familiale
              </p>
              <p>
                Les messages destinés au livre de condoléances public sont
                enregistrés avec le statut « en attente » et ne deviennent
                visibles qu’après relecture et validation par la famille.
              </p>
            </div>
          </div>

          {/* Right Column: Condolence & Tribute Form */}
          <div className="lg:col-span-7">
            <form
              onSubmit={handleSubmit}
              className="bg-white border border-[#DCE8EF] rounded-lg p-6 sm:p-8 space-y-6"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#DCE8EF] pb-4">
                <h3 className="font-serif-editorial text-2xl font-semibold text-[#17191C]">
                  Adresser ses condoléances ou un témoignage
                </h3>
                {prefilledDraft && (
                  <div className="flex items-center gap-2 text-xs text-[#245B7A]">
                    <span>Modèle #{prefilledDraft.numberLabel} chargé</span>
                    <button
                      type="button"
                      onClick={() => {
                        onClearDraft();
                        setMessage('');
                      }}
                      className="underline hover:text-[#17191C]"
                    >
                      Effacer
                    </button>
                  </div>
                )}
              </div>

              {/* Delivery Mode Selector */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#17191C]">
                  Destination de votre message
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setDeliveryMode('public')}
                    className={`p-3.5 rounded-md border text-left transition-colors ${
                      deliveryMode === 'public'
                        ? 'bg-[#EFF8FD] border-[#245B7A] text-[#17191C]'
                        : 'bg-white border-[#DCE8EF] text-[#56616A] hover:text-[#17191C]'
                    }`}
                  >
                    <p className="text-xs sm:text-sm font-semibold text-[#17191C]">
                      Proposition pour le livre d’hommages
                    </p>
                    <p className="text-xs text-[#56616A] mt-0.5">
                      Publié sur le site après modération de la famille.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDeliveryMode('private')}
                    className={`p-3.5 rounded-md border text-left transition-colors ${
                      deliveryMode === 'private'
                        ? 'bg-[#EFF8FD] border-[#245B7A] text-[#17191C]'
                        : 'bg-white border-[#DCE8EF] text-[#56616A] hover:text-[#17191C]'
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5 text-[#245B7A]" />
                      <p className="text-xs sm:text-sm font-semibold text-[#17191C]">
                        Message privé à la famille
                      </p>
                    </div>
                    <p className="text-xs text-[#56616A] mt-0.5">
                      Transmis uniquement aux proches, jamais publié en ligne.
                    </p>
                  </button>
                </div>
              </div>

              {/* Author Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="condolence-first-name"
                    className="block text-xs font-semibold uppercase tracking-wider text-[#17191C] mb-1.5"
                  >
                    Prénom (ou pseudonyme) *
                  </label>
                  <input
                    id="condolence-first-name"
                    type="text"
                    required
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="Votre prénom"
                    className="w-full px-3.5 py-2.5 text-sm bg-white border border-[#DCE8EF] rounded-md text-[#17191C] focus:outline-none focus:border-[#245B7A]"
                  />
                </div>

                <div>
                  <label
                    htmlFor="condolence-last-name"
                    className="block text-xs font-semibold uppercase tracking-wider text-[#17191C] mb-1.5"
                  >
                    Nom (facultatif)
                  </label>
                  <input
                    id="condolence-last-name"
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Votre nom de famille"
                    className="w-full px-3.5 py-2.5 text-sm bg-white border border-[#DCE8EF] rounded-md text-[#17191C] focus:outline-none focus:border-[#245B7A]"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="condolence-relationship"
                  className="block text-xs font-semibold uppercase tracking-wider text-[#17191C] mb-1.5"
                >
                  Lien avec le défunt (facultatif)
                </label>
                <input
                  id="condolence-relationship"
                  type="text"
                  value={relationship}
                  onChange={(e) => setRelationship(e.target.value)}
                  placeholder="Ex. : Collègue à l’Université de Douala, Ancien élève au Collège La Retraite, Ami..."
                  className="w-full px-3.5 py-2.5 text-sm bg-white border border-[#DCE8EF] rounded-md text-[#17191C] focus:outline-none focus:border-[#245B7A]"
                />
              </div>

              <div>
                <label
                  htmlFor="condolence-message"
                  className="block text-xs font-semibold uppercase tracking-wider text-[#17191C] mb-1.5"
                >
                  Votre message *
                </label>
                <textarea
                  id="condolence-message"
                  rows={5}
                  required
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Rédigez vos condoléances ou personnalisez une proposition de témoignage..."
                  className="w-full px-3.5 py-2.5 text-sm bg-white border border-[#DCE8EF] rounded-md text-[#17191C] leading-relaxed focus:outline-none focus:border-[#245B7A]"
                />
              </div>

              {/* Consent Checkbox for Public Tributes */}
              {deliveryMode === 'public' && (
                <label className="flex items-start gap-3 text-xs sm:text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={consentPublication}
                    onChange={(e) => setConsentPublication(e.target.checked)}
                    className="mt-1 h-4 w-4 rounded border-[#DCE8EF] text-[#245B7A] focus:ring-[#245B7A]"
                  />
                  <span className="text-[#56616A] leading-relaxed">
                    J’accepte que ce témoignage soit publié sur cette page d’hommage
                    après relecture et validation par la famille.
                  </span>
                </label>
              )}

              {/* Feedback Banner */}
              {feedback && (
                <div
                  role="alert"
                  className={`p-4 rounded-md border text-xs sm:text-sm flex items-start gap-2.5 ${
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

              {/* Form Actions */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="submit"
                    disabled={submitting || !settings.allowPublicTributes}
                    className="inline-flex items-center gap-2 px-5 py-2.5 text-xs sm:text-sm font-medium text-white bg-[#245B7A] hover:bg-[#1B465E] disabled:opacity-50 rounded-md transition-colors whitespace-nowrap"
                  >
                    <Send className="w-4 h-4" />
                    <span>
                      {submitting
                        ? 'Enregistrement...'
                        : deliveryMode === 'private'
                        ? 'Transmettre en privé à la famille'
                        : 'Soumettre pour validation familiale'}
                    </span>
                  </button>

                  {deliveryMode === 'private' && canUsePublicWhatsApp && (
                    <a
                      href={buildWhatsAppUrl(
                        settings.whatsappNumber,
                        formattedFullMessage
                      )}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-medium text-[#245B7A] bg-[#EFF8FD] hover:bg-[#A9D7F2]/30 border border-[#DCE8EF] rounded-md transition-colors whitespace-nowrap"
                    >
                      <MessageCircle className="w-4 h-4" />
                      <span>Ouvrir dans WhatsApp</span>
                    </a>
                  )}
                </div>

                <button
                  type="button"
                  onClick={handleCopyMessage}
                  disabled={!message.trim()}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-[#56616A] hover:text-[#17191C] disabled:opacity-40 border border-[#DCE8EF] rounded-md transition-colors whitespace-nowrap"
                >
                  {copiedMessage ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-[#245B7A]" />
                      <span>Message copié</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copier le message</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
};

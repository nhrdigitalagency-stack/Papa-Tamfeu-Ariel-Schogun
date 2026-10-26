import React, { useRef, useState } from 'react';
import {
  AlertCircle,
  Camera,
  CheckCircle2,
  Flag,
  ImagePlus,
  ShieldCheck,
  Trash2,
  X,
} from 'lucide-react';
import { MemorialPublicPayload, PhotoItem } from '../types/memorial';
import {
  ProcessedPhotoUpload,
  stripExifAndPrepareImage,
} from '../utils/imageAndShare';

interface PhotosSectionViewProps {
  settings: MemorialPublicPayload['settings'];
  approvedPhotos: PhotoItem[];
  backendConnected: boolean;
  isDedicatedPage?: boolean;
  onRefreshData: () => void;
}

const CATEGORY_LABELS: Record<PhotoItem['category'], string> = {
  portrait: 'Portrait',
  famille: 'Souvenir familial',
  professionnel: 'Vie professionnelle',
  ceremonie: 'Hommage & Cérémonie',
  souvenir: 'Souvenir partagé',
};

export const PhotosSectionView: React.FC<PhotosSectionViewProps> = ({
  settings,
  approvedPhotos,
  backendConnected,
  isDedicatedPage = false,
  onRefreshData,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<
    'all' | PhotoItem['category']
  >('all');
  const [lightboxPhoto, setLightboxPhoto] = useState<PhotoItem | null>(null);

  // Deletion request state
  const [deletionModalPhoto, setDeletionModalPhoto] = useState<PhotoItem | null>(
    null
  );
  const [deletionRequester, setDeletionRequester] = useState('');
  const [deletionReason, setDeletionReason] = useState('');
  const [deletionStatus, setDeletionStatus] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);
  const [submittingDeletion, setSubmittingDeletion] = useState(false);

  // Guest upload state
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [authorName, setAuthorName] = useState('');
  const [uploadCategory, setUploadCategory] =
    useState<PhotoItem['category']>('ceremonie');
  const [consentPublication, setConsentPublication] = useState(true);
  const [preparedFiles, setPreparedFiles] = useState<ProcessedPhotoUpload[]>([]);
  const [processingFiles, setProcessingFiles] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadFeedback, setUploadFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  const filteredPhotos =
    selectedCategory === 'all'
      ? approvedPhotos
      : approvedPhotos.filter((p) => p.category === selectedCategory);

  const handleFilesSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;

    setUploadFeedback(null);
    const incomingFiles = Array.from(fileList);

    if (preparedFiles.length + incomingFiles.length > 10) {
      setUploadFeedback({
        type: 'error',
        message: 'Vous pouvez sélectionner au maximum 10 fichiers par envoi.',
      });
      return;
    }

    setProcessingFiles(true);
    try {
      const processed: ProcessedPhotoUpload[] = [];
      for (const file of incomingFiles) {
        const cleanItem = await stripExifAndPrepareImage(file);
        processed.push(cleanItem);
      }
      setPreparedFiles((prev) => [...prev, ...processed]);
    } catch (err) {
      setUploadFeedback({
        type: 'error',
        message:
          err instanceof Error
            ? err.message
            : 'Erreur lors de la préparation des fichiers.',
      });
    } finally {
      setProcessingFiles(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemovePrepared = (index: number) => {
    setPreparedFiles((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleUpdatePreparedMeta = (
    index: number,
    field: 'title' | 'caption',
    value: string
  ) => {
    setPreparedFiles((prev) =>
      prev.map((item, idx) =>
        idx === index ? { ...item, [field]: value } : item
      )
    );
  };

  const handleSubmitPhotos = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploadFeedback(null);

    if (!backendConnected) {
      setUploadFeedback({
        type: 'error',
        message:
          'Le serveur de stockage n’est pas joignable actuellement. Aucun fichier n’a été transmis.',
      });
      return;
    }

    if (!authorName.trim() || authorName.trim().length < 2) {
      setUploadFeedback({
        type: 'error',
        message: 'Veuillez indiquer votre nom ou prénom.',
      });
      return;
    }

    if (preparedFiles.length === 0) {
      setUploadFeedback({
        type: 'error',
        message: 'Veuillez sélectionner au moins une photographie.',
      });
      return;
    }

    if (!consentPublication) {
      setUploadFeedback({
        type: 'error',
        message:
          'Veuillez confirmer votre accord de publication sous réserve de validation par la famille.',
      });
      return;
    }

    setUploading(true);
    try {
      const response = await fetch('/api/photos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          authorName: authorName.trim(),
          category: uploadCategory,
          consentPublication,
          items: preparedFiles,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(
          data?.error || 'Erreur lors du transfert des photographies.'
        );
      }

      setPreparedFiles([]);
      setConsentPublication(false);
      setUploadFeedback({
        type: 'success',
        message:
          data.message ||
          'Photographies transférées et enregistrées en attente de modération familiale.',
      });
      onRefreshData();
    } catch (err) {
      setUploadFeedback({
        type: 'error',
        message:
          err instanceof Error
            ? err.message
            : 'Le transfert des photographies a échoué.',
      });
    } finally {
      setUploading(false);
    }
  };

  const handleRequestDeletion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deletionModalPhoto) return;

    setSubmittingDeletion(true);
    setDeletionStatus(null);
    try {
      const res = await fetch(
        `/api/photos/${deletionModalPhoto.id}/request-deletion`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            requesterName: deletionRequester.trim(),
            reason: deletionReason.trim(),
          }),
        }
      );
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || 'Impossible d’enregistrer la demande.');
      }

      setDeletionStatus({
        type: 'success',
        message: data.message,
      });
      setDeletionReason('');
    } catch (err) {
      setDeletionStatus({
        type: 'error',
        message:
          err instanceof Error
            ? err.message
            : 'Erreur lors de l’envoi de la demande.',
      });
    } finally {
      setSubmittingDeletion(false);
    }
  };

  return (
    <section
      id="souvenirs"
      aria-labelledby="souvenirs-heading"
      className={`py-14 sm:py-20 bg-[#EFF8FD]/40 border-b border-[#DCE8EF] no-print ${
        isDedicatedPage ? 'min-h-[75vh]' : ''
      }`}
    >
      <div className="max-w-[1050px] mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[#DCE8EF] pb-6">
          <div className="space-y-2">
            <p className="text-xs tracking-widest uppercase text-[#56616A] font-medium">
              Album de recueillement · Avec l’accord de la famille
            </p>
            <h2
              id="souvenirs-heading"
              className="font-serif-editorial text-3xl sm:text-4xl font-semibold text-[#17191C]"
            >
              Photos et souvenirs
            </h2>
          </div>

          {/* Interactive Category Filter */}
          <div className="inline-flex flex-wrap items-center gap-1 p-1 bg-white border border-[#DCE8EF] rounded-md self-start">
            {(
              [
                { key: 'all', label: 'Tous' },
                { key: 'portrait', label: 'Portraits' },
                { key: 'famille', label: 'Famille' },
                { key: 'professionnel', label: 'Vie professionnelle' },
                { key: 'ceremonie', label: 'Cérémonies' },
              ] as const
            ).map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setSelectedCategory(tab.key)}
                className={`px-3 py-1.5 text-xs font-medium rounded transition-colors whitespace-nowrap ${
                  selectedCategory === tab.key
                    ? 'bg-[#245B7A] text-white'
                    : 'text-[#56616A] hover:text-[#17191C]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Approved Photos Grid */}
        {filteredPhotos.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPhotos.map((photo) => (
              <figure
                key={photo.id}
                className="bg-white border border-[#DCE8EF] rounded-lg overflow-hidden flex flex-col justify-between"
              >
                <button
                  type="button"
                  onClick={() => setLightboxPhoto(photo)}
                  className="w-full text-left overflow-hidden bg-[#EFF8FD] focus-visible:outline-2 focus-visible:outline-[#245B7A]"
                >
                  <img
                    src={photo.imageDataUrl}
                    alt={photo.title}
                    referrerPolicy="no-referrer"
                    className="w-full h-64 object-cover object-top hover:opacity-95 transition-opacity"
                  />
                </button>

                <figcaption className="p-4 space-y-2 flex-1 flex flex-col justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center justify-between gap-2 text-xs text-[#56616A]">
                      <span>{CATEGORY_LABELS[photo.category]}</span>
                      <span>·</span>
                      <span>Partagé par {photo.authorName}</span>
                    </div>
                    <h3 className="font-serif-editorial text-lg font-semibold text-[#17191C]">
                      {photo.title}
                    </h3>
                    {photo.caption && (
                      <p className="text-xs text-[#56616A] leading-relaxed">
                        {photo.caption}
                      </p>
                    )}
                  </div>

                  <div className="pt-2 border-t border-[#DCE8EF] flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => setLightboxPhoto(photo)}
                      className="text-xs font-medium text-[#245B7A] hover:underline"
                    >
                      Agrandir
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setDeletionModalPhoto(photo);
                        setDeletionStatus(null);
                      }}
                      className="inline-flex items-center gap-1 text-xs text-[#56616A] hover:text-[#17191C]"
                    >
                      <Flag className="w-3 h-3" />
                      <span>Demander un retrait</span>
                    </button>
                  </div>
                </figcaption>
              </figure>
            ))}
          </div>
        ) : (
          <div className="bg-white border border-[#DCE8EF] rounded-lg p-8 text-center space-y-2">
            <p className="font-serif-editorial text-xl text-[#17191C]">
              Aucune photographie dans cette catégorie pour le moment.
            </p>
            <p className="text-xs sm:text-sm text-[#56616A]">
              Seules les photographies autorisées et validées par la famille sont
              affichées publiquement.
            </p>
          </div>
        )}

        {/* Guest Photo Contribution Block */}
        {settings.allowGuestPhotos ? (
          <div className="bg-white/95 border border-[#DCE8EF] rounded-lg p-6 sm:p-8 space-y-6">
            <div className="space-y-2 border-b border-[#DCE8EF] pb-4">
              <div className="flex items-center gap-2 text-xs uppercase tracking-widest font-semibold text-[#245B7A]">
                <Camera className="w-4 h-4" />
                <span>Partage direct des photos du deuil et des souvenirs</span>
              </div>
              <h3 className="font-serif-editorial text-2xl font-semibold text-[#17191C]">
                Partager vos photographies prises lors du deuil
              </h3>
              <p className="text-xs sm:text-sm text-[#56616A] leading-relaxed">
                Les proches, collègues, amis et connaissances ayant assisté aux
                cérémonies ou disposant de souvenirs de Papa Tamfeu Ariel Schogun
                peuvent partager leurs photos directement ici. Les métadonnées GPS
                sont automatiquement retirées avant la mise en ligne (jusqu’à 10
                fichiers par envoi, 10 Mo max par fichier).
              </p>
            </div>

            <form onSubmit={handleSubmitPhotos} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="photo-author-name"
                    className="block text-xs font-semibold uppercase tracking-wider text-[#17191C] mb-1.5"
                  >
                    Votre prénom et nom *
                  </label>
                  <input
                    id="photo-author-name"
                    type="text"
                    required
                    value={authorName}
                    onChange={(e) => setAuthorName(e.target.value)}
                    placeholder="Ex. : Jean-Paul Kamga"
                    className="w-full px-3.5 py-2.5 text-sm bg-white border border-[#DCE8EF] rounded-md text-[#17191C] focus:outline-none focus:border-[#245B7A]"
                  />
                </div>

                <div>
                  <label
                    htmlFor="photo-category-select"
                    className="block text-xs font-semibold uppercase tracking-wider text-[#17191C] mb-1.5"
                  >
                    Catégorie du souvenir
                  </label>
                  <select
                    id="photo-category-select"
                    value={uploadCategory}
                    onChange={(e) =>
                      setUploadCategory(e.target.value as PhotoItem['category'])
                    }
                    className="w-full px-3.5 py-2.5 text-sm bg-white border border-[#DCE8EF] rounded-md text-[#17191C] focus:outline-none focus:border-[#245B7A]"
                  >
                    <option value="souvenir">Souvenir partagé</option>
                    <option value="professionnel">
                      Vie professionnelle (Université de Douala / Collège La Retraite)
                    </option>
                    <option value="famille">Photo familiale autorisée</option>
                    <option value="portrait">Portrait</option>
                    <option value="ceremonie">Hommage & Cérémonie</option>
                  </select>
                </div>
              </div>

              {/* File Picker */}
              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  multiple
                  onChange={handleFilesSelected}
                  className="hidden"
                  id="guest-photo-input"
                />
                <label
                  htmlFor="guest-photo-input"
                  className="cursor-pointer flex flex-col items-center justify-center border-2 border-dashed border-[#A9D7F2] hover:border-[#245B7A] bg-[#EFF8FD]/50 rounded-lg p-6 text-center transition-colors"
                >
                  <ImagePlus className="w-6 h-6 text-[#245B7A] mb-2" />
                  <span className="text-sm font-medium text-[#17191C]">
                    {processingFiles
                      ? 'Nettoyage des métadonnées GPS et préparation...'
                      : 'Sélectionner des photographies (JPEG, PNG, WebP)'}
                  </span>
                  <span className="text-xs text-[#56616A] mt-1">
                    Maximum 10 fichiers · 10 Mo max par fichier · Métadonnées GPS
                    retirées automatiquement
                  </span>
                </label>
              </div>

              {/* Preview of Prepared Files */}
              {preparedFiles.length > 0 && (
                <div className="space-y-3">
                  <p className="text-xs font-semibold uppercase tracking-wider text-[#245B7A]">
                    Prévisualisation ({preparedFiles.length} / 10 fichier(s) prêt(s),
                    EXIF/GPS retirés)
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {preparedFiles.map((item, idx) => (
                      <div
                        key={idx}
                        className="p-3 rounded-md border border-[#DCE8EF] bg-[#EFF8FD]/30 flex gap-3 items-start"
                      >
                        <img
                          src={item.imageDataUrl}
                          alt={item.title}
                          className="w-20 h-20 object-cover rounded border border-[#DCE8EF] shrink-0"
                        />
                        <div className="flex-1 space-y-2 min-w-0">
                          <input
                            type="text"
                            value={item.title}
                            onChange={(e) =>
                              handleUpdatePreparedMeta(idx, 'title', e.target.value)
                            }
                            placeholder="Titre de la photo"
                            className="w-full px-2.5 py-1 text-xs bg-white border border-[#DCE8EF] rounded text-[#17191C]"
                          />
                          <input
                            type="text"
                            value={item.caption}
                            onChange={(e) =>
                              handleUpdatePreparedMeta(
                                idx,
                                'caption',
                                e.target.value
                              )
                            }
                            placeholder="Légende ou contexte (facultatif)"
                            className="w-full px-2.5 py-1 text-xs bg-white border border-[#DCE8EF] rounded text-[#17191C]"
                          />
                          <div className="flex items-center justify-between text-[11px] text-[#56616A]">
                            <span className="inline-flex items-center gap-1 text-[#245B7A]">
                              <ShieldCheck className="w-3 h-3" />
                              Sans données GPS
                            </span>
                            <button
                              type="button"
                              onClick={() => handleRemovePrepared(idx)}
                              className="inline-flex items-center gap-1 text-red-700 hover:underline"
                            >
                              <Trash2 className="w-3 h-3" />
                              Retirer
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Consent Checkbox */}
              <label className="flex items-start gap-3 text-xs sm:text-sm text-[#17191C] cursor-pointer">
                <input
                  type="checkbox"
                  checked={consentPublication}
                  onChange={(e) => setConsentPublication(e.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-[#DCE8EF] text-[#245B7A] focus:ring-[#245B7A]"
                />
                <span className="text-[#56616A] leading-relaxed">
                  Je confirme être autorisé(e) à transmettre ces photographies, qu’elles
                  respectent la dignité du défunt et de ses proches, et j’accepte
                  qu’elles soient examinées par la famille avant toute publication.
                </span>
              </label>

              {uploadFeedback && (
                <div
                  role="alert"
                  className={`p-4 rounded-md border text-xs sm:text-sm flex items-start gap-2.5 ${
                    uploadFeedback.type === 'success'
                      ? 'bg-[#EFF8FD] border-[#245B7A] text-[#17191C]'
                      : 'bg-red-50 border-red-200 text-red-900'
                  }`}
                >
                  {uploadFeedback.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 text-[#245B7A] shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-red-700 shrink-0 mt-0.5" />
                  )}
                  <span>{uploadFeedback.message}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={uploading || processingFiles || preparedFiles.length === 0}
                className="px-5 py-2.5 text-xs sm:text-sm font-medium text-white bg-[#245B7A] hover:bg-[#1B465E] disabled:opacity-50 rounded-md transition-colors"
              >
                {uploading
                  ? 'Publication des photographies en cours...'
                  : 'Publier les photographies sur le site'}
              </button>
            </form>
          </div>
        ) : (
          <div className="bg-white border border-[#DCE8EF] rounded-lg p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <h3 className="font-serif-editorial text-xl font-semibold text-[#17191C]">
                Contributions photographiques des invités
              </h3>
              <p className="text-xs sm:text-sm text-[#56616A]">
                L’envoi public de photographies par les invités est actuellement
                désactivé par la famille. Seules les photos validées par
                l’administration familiale sont affichées ci-dessus.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Lightbox Modal */}
      {lightboxPhoto && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={lightboxPhoto.title}
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setLightboxPhoto(null)}
        >
          <div
            className="bg-white rounded-lg max-w-3xl w-full overflow-hidden border border-[#DCE8EF]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#DCE8EF]">
              <h3 className="font-serif-editorial text-xl font-semibold text-[#17191C]">
                {lightboxPhoto.title}
              </h3>
              <button
                type="button"
                onClick={() => setLightboxPhoto(null)}
                aria-label="Fermer l'aperçu"
                className="p-1.5 rounded-md text-[#56616A] hover:text-[#17191C] hover:bg-[#EFF8FD]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="bg-[#17191C] flex items-center justify-center max-h-[70vh] overflow-hidden">
              <img
                src={lightboxPhoto.imageDataUrl}
                alt={lightboxPhoto.title}
                referrerPolicy="no-referrer"
                className="max-h-[70vh] w-auto object-contain"
              />
            </div>
            <div className="p-4 bg-white flex flex-wrap items-center justify-between gap-2 text-xs text-[#56616A]">
              <span>
                {lightboxPhoto.caption ||
                  `Souvenir partagé par ${lightboxPhoto.authorName}`}
              </span>
              <span>Catégorie : {CATEGORY_LABELS[lightboxPhoto.category]}</span>
            </div>
          </div>
        </div>
      )}

      {/* Photo Deletion Request Modal */}
      {deletionModalPhoto && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="deletion-modal-title"
          className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4"
          onClick={() => setDeletionModalPhoto(null)}
        >
          <div
            className="bg-white rounded-lg max-w-md w-full p-6 border border-[#DCE8EF] space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[#DCE8EF] pb-3">
              <h3
                id="deletion-modal-title"
                className="font-serif-editorial text-xl font-semibold text-[#17191C]"
              >
                Demander le retrait d’une photographie
              </h3>
              <button
                type="button"
                onClick={() => setDeletionModalPhoto(null)}
                className="text-[#56616A] hover:text-[#17191C]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-[#56616A] leading-relaxed">
              Vous demandez la vérification ou le retrait de la photographie «{' '}
              <strong className="text-[#17191C]">{deletionModalPhoto.title}</strong>{' '}
              ». Votre demande sera immédiatement signalée à l’administration
              familiale.
            </p>

            <form onSubmit={handleRequestDeletion} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-[#17191C] mb-1">
                  Votre nom
                </label>
                <input
                  type="text"
                  required
                  value={deletionRequester}
                  onChange={(e) => setDeletionRequester(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-[#DCE8EF] rounded-md"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#17191C] mb-1">
                  Motif de la demande *
                </label>
                <textarea
                  rows={3}
                  required
                  value={deletionReason}
                  onChange={(e) => setDeletionReason(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-[#DCE8EF] rounded-md"
                  placeholder="Précisez pourquoi vous souhaitez le retrait de cette image..."
                />
              </div>

              {deletionStatus && (
                <p
                  className={`text-xs p-2.5 rounded border ${
                    deletionStatus.type === 'success'
                      ? 'bg-[#EFF8FD] border-[#245B7A] text-[#17191C]'
                      : 'bg-red-50 border-red-200 text-red-900'
                  }`}
                >
                  {deletionStatus.message}
                </p>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setDeletionModalPhoto(null)}
                  className="px-3.5 py-2 text-xs font-medium text-[#56616A] hover:text-[#17191C]"
                >
                  Fermer
                </button>
                <button
                  type="submit"
                  disabled={submittingDeletion}
                  className="px-4 py-2 text-xs font-medium text-white bg-[#245B7A] hover:bg-[#1B465E] rounded-md"
                >
                  {submittingDeletion ? 'Envoi...' : 'Transmettre la demande'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
};

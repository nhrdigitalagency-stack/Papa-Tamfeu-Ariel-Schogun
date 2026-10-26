import React, { useRef, useState } from 'react';
import {
  AlertCircle,
  Camera,
  CheckCircle2,
  Eye,
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
  portrait: 'Portrait & Tradition',
  famille: 'Souvenir familial',
  professionnel: 'Vie professionnelle & Rayonnement',
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
          'Veuillez confirmer votre accord de publication sur le site.',
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
      setUploadFeedback({
        type: 'success',
        message:
          data.message ||
          'Photographies partagées et publiées directement dans la galerie.',
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
      <div className="max-w-[1120px] mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[#DCE8EF] pb-6">
          <div className="space-y-2">
            <p className="text-xs tracking-widest uppercase text-[#56616A] font-medium">
              Album de recueillement · Survolez une image pour lire sa description
            </p>
            <h2
              id="souvenirs-heading"
              className="font-serif-editorial text-3xl sm:text-4xl font-semibold text-[#17191C]"
            >
              Galerie de souvenirs et moments de vie
            </h2>
          </div>

          {/* Interactive Category Filter */}
          <div className="inline-flex flex-wrap items-center gap-1 p-1 bg-white border border-[#DCE8EF] rounded-md self-start">
            {(
              [
                { key: 'all', label: 'Tous' },
                { key: 'portrait', label: 'Portraits' },
                { key: 'professionnel', label: 'Parcours & Rencontres' },
                { key: 'famille', label: 'Famille' },
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

        {/* Interactive Hover-Description Photo Gallery */}
        {filteredPhotos.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPhotos.map((photo) => (
              <figure
                key={photo.id}
                className="group relative bg-white border border-[#DCE8EF] rounded-lg overflow-hidden shadow-xs flex flex-col justify-between"
              >
                {/* Image Container with Automatic Hover Description Overlay (Caption) */}
                <div
                  onClick={() => setLightboxPhoto(photo)}
                  role="button"
                  tabIndex={0}
                  aria-label={`${photo.title} — ${
                    photo.caption ||
                    `Souvenir partagé en mémoire de ${settings.displayName}`
                  }`}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setLightboxPhoto(photo);
                    }
                  }}
                  className="relative w-full h-80 sm:h-88 overflow-hidden bg-[#17191C] cursor-pointer focus-visible:outline-2 focus-visible:outline-[#245B7A]"
                >
                  <img
                    src={photo.imageDataUrl}
                    alt={photo.title}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover object-top transition-transform duration-500 ease-out group-hover:scale-105"
                  />

                  {/* Subtle resting indicator that fades out on hover */}
                  <div className="absolute bottom-3 right-3 px-2.5 py-1 rounded bg-[#17191C]/75 backdrop-blur-xs border border-white/15 text-[11px] font-medium text-[#EFF8FD] transition-opacity duration-300 group-hover:opacity-0 pointer-events-none">
                    Survoler pour lire la description
                  </div>

                  {/* Elegant Embedded Caption Overlay on Hover */}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#17191C]/95 via-[#17191C]/75 to-[#17191C]/25 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-all duration-300 flex flex-col justify-end p-5 sm:p-6 text-left">
                    <div className="transform translate-y-3 group-hover:translate-y-0 group-focus-within:translate-y-0 transition-transform duration-300 space-y-2.5">
                      <span className="text-[11px] uppercase tracking-widest text-[#A9D7F2] font-semibold block">
                        {CATEGORY_LABELS[photo.category]}
                      </span>
                      <h3 className="font-serif-editorial text-xl sm:text-2xl font-semibold text-white leading-snug">
                        {photo.title}
                      </h3>
                      <div
                        className="w-12 h-[1px] bg-[#A9D7F2]/75"
                        aria-hidden="true"
                      />
                      <p className="text-xs sm:text-sm text-[#EFF8FD] leading-relaxed">
                        {photo.caption ||
                          `Souvenir photographique partagé en mémoire de ${settings.displayName}.`}
                      </p>
                      <div className="pt-2.5 flex items-center justify-between text-[11px] text-[#A9D7F2] border-t border-white/20">
                        <span>Partagé par {photo.authorName}</span>
                        <span className="inline-flex items-center gap-1 font-medium text-white">
                          <Eye className="w-3.5 h-3.5" />
                          Agrandir
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Subtle Bottom Bar for Mobile & Action Controls */}
                <figcaption className="px-4 py-3 bg-white border-t border-[#DCE8EF] flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-serif-editorial text-base font-semibold text-[#17191C] truncate">
                      {photo.title}
                    </p>
                    <p className="text-xs text-[#56616A] truncate sm:hidden">
                      {photo.caption}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <button
                      type="button"
                      onClick={() => setLightboxPhoto(photo)}
                      className="text-xs font-medium text-[#245B7A] hover:underline"
                    >
                      Voir
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setDeletionModalPhoto(photo);
                        setDeletionStatus(null);
                      }}
                      title="Signaler ou demander un retrait"
                      className="inline-flex items-center gap-1 text-xs text-[#56616A] hover:text-[#17191C]"
                    >
                      <Flag className="w-3 h-3" />
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
          </div>
        )}

        {/* Guest Photo Contribution Block */}
        {settings.allowGuestPhotos && (
          <div className="bg-white/95 border border-[#DCE8EF] rounded-lg p-6 sm:p-8 space-y-6">
            <div className="space-y-2 border-b border-[#DCE8EF] pb-4">
              <div className="flex items-center gap-2 text-xs uppercase tracking-widest font-semibold text-[#245B7A]">
                <Camera className="w-4 h-4" />
                <span>Partage direct des photos du deuil et des souvenirs</span>
              </div>
              <h3 className="font-serif-editorial text-2xl font-semibold text-[#17191C]">
                Partager vos photographies avec une courte description
              </h3>
              <p className="text-xs sm:text-sm text-[#56616A] leading-relaxed">
                Les proches, collègues, amis et connaissances ayant assisté aux
                cérémonies peuvent partager leurs photos directement ici avec une
                courte description (qui s’affichera au survol de l’image). Les
                métadonnées GPS sont automatiquement retirées avant la mise en
                ligne.
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
                    <option value="ceremonie">Hommage & Cérémonie</option>
                    <option value="souvenir">Souvenir partagé</option>
                    <option value="professionnel">
                      Parcours professionnel & Rencontres
                    </option>
                    <option value="famille">Photo familiale</option>
                    <option value="portrait">Portrait</option>
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
                    Vous pourrez saisir le titre et la courte description de chaque
                    image juste après sélection
                  </span>
                </label>
              </div>

              {/* Preview of Prepared Files */}
              {preparedFiles.length > 0 && (
                <div className="space-y-3">
                  <p className="text-xs font-semibold uppercase tracking-wider text-[#245B7A]">
                    Prévisualisation et description au survol ({preparedFiles.length}{' '}
                    / 10 fichier(s))
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
                            placeholder="Courte description affichée au survol..."
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
                  Je confirme que ces photographies respectent la dignité du défunt
                  et de ses proches et j’accepte leur publication dans la galerie.
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
            <div className="p-4 bg-white space-y-1 text-xs text-[#56616A]">
              <p className="text-sm text-[#17191C] font-medium">
                {lightboxPhoto.caption ||
                  `Souvenir partagé par ${lightboxPhoto.authorName}`}
              </p>
              <p>
                Partagé par {lightboxPhoto.authorName} · Catégorie :{' '}
                {CATEGORY_LABELS[lightboxPhoto.category]}
              </p>
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

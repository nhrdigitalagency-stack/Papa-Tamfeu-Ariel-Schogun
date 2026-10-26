import React, { useEffect, useState } from 'react';
import {
  AlertCircle,
  ArrowLeft,
  Calendar,
  Check,
  CheckCircle2,
  FileText,
  Image as ImageIcon,
  Lock,
  LogOut,
  MessageSquare,
  Plus,
  Save,
  Settings,
  ShieldCheck,
  Trash2,
  User,
  Users,
  X,
} from 'lucide-react';
import {
  BiographySection,
  ContributionStatus,
  FamilyCategory,
  FamilyEntry,
  MemorialAdminPayload,
  MemorialSettings,
  PhotoItem,
  ProgramEventItem,
} from '../types/memorial';
import { ActiveRoute } from './Header';

interface AdminPageViewProps {
  onNavigate: (route: ActiveRoute, sectionId?: string) => void;
  onPublicDataChanged: () => void;
}

type AdminTab =
  | 'program'
  | 'settings_contact'
  | 'families'
  | 'biography'
  | 'tributes'
  | 'photos';

export const AdminPageView: React.FC<AdminPageViewProps> = ({
  onNavigate,
  onPublicDataChanged,
}) => {
  const [token, setToken] = useState<string | null>(() =>
    sessionStorage.getItem('memorial_admin_token')
  );
  const [usernameInput, setUsernameInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loggingIn, setLoggingIn] = useState(false);

  const [adminData, setAdminData] = useState<MemorialAdminPayload | null>(null);
  const [loadingData, setLoadingData] = useState(false);
  const [activeTab, setActiveTab] = useState<AdminTab>('program');
  const [saveBanner, setSaveBanner] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  // Editable local states
  const [draftSettings, setDraftSettings] = useState<MemorialSettings | null>(
    null
  );
  const [draftFamilies, setDraftFamilies] = useState<FamilyEntry[]>([]);
  const [draftBiography, setDraftBiography] = useState<BiographySection[]>([]);
  const [draftEvents, setDraftEvents] = useState<ProgramEventItem[]>([]);
  const [draftPhotos, setDraftPhotos] = useState<PhotoItem[]>([]);

  const fetchAdminPayload = async (activeToken: string) => {
    setLoadingData(true);
    try {
      const res = await fetch('/api/admin/data', {
        headers: { Authorization: `Bearer ${activeToken}` },
      });
      if (res.status === 401) {
        sessionStorage.removeItem('memorial_admin_token');
        setToken(null);
        return;
      }
      const data = (await res.json()) as MemorialAdminPayload;
      setAdminData(data);
      setDraftSettings(data.settings);
      setDraftFamilies(data.families);
      setDraftBiography(data.biographySections);
      setDraftEvents(data.programEvents);
      setDraftPhotos(data.photos);
    } catch {
      setSaveBanner({
        type: 'error',
        message: 'Impossible de charger les données du Super Administrateur.',
      });
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchAdminPayload(token);
    }
  }, [token]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setLoggingIn(true);
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: usernameInput.trim(),
          password: passwordInput,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || 'Authentification refusée.');
      }
      sessionStorage.setItem('memorial_admin_token', data.token);
      setToken(data.token);
      setUsernameInput('');
      setPasswordInput('');
    } catch (err) {
      setLoginError(
        err instanceof Error ? err.message : 'Erreur d’authentification.'
      );
    } finally {
      setLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    if (token) {
      await fetch('/api/admin/logout', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      }).catch(() => {});
    }
    sessionStorage.removeItem('memorial_admin_token');
    setToken(null);
    setAdminData(null);
  };

  const showNotice = (type: 'success' | 'error', message: string) => {
    setSaveBanner({ type, message });
    setTimeout(() => setSaveBanner(null), 4500);
  };

  const handleSaveSettings = async (customSettings?: MemorialSettings) => {
    const target = customSettings || draftSettings;
    if (!token || !target) return;
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(target),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Erreur de sauvegarde.');
      setDraftSettings(data.settings);
      onPublicDataChanged();
      showNotice(
        'success',
        'Paramètres et informations du site mis à jour avec succès.'
      );
    } catch (err) {
      showNotice(
        'error',
        err instanceof Error ? err.message : 'Échec de la sauvegarde.'
      );
    }
  };

  const handleSaveFamilies = async () => {
    if (!token || !draftSettings) return;
    try {
      const res = await fetch('/api/admin/families', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ families: draftFamilies }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Erreur de sauvegarde.');
      setDraftFamilies(data.families);
      await handleSaveSettings(draftSettings);
      onPublicDataChanged();
      showNotice('success', 'Liste des familles mise à jour.');
    } catch (err) {
      showNotice(
        'error',
        err instanceof Error ? err.message : 'Échec de la sauvegarde.'
      );
    }
  };

  const handleSaveBiography = async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/admin/biography', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ biographySections: draftBiography }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Erreur de sauvegarde.');
      setDraftBiography(data.biographySections);
      onPublicDataChanged();
      showNotice('success', 'Sections biographiques enregistrées.');
    } catch (err) {
      showNotice(
        'error',
        err instanceof Error ? err.message : 'Échec de la sauvegarde.'
      );
    }
  };

  const handleSaveProgram = async () => {
    if (!token || !draftSettings) return;
    try {
      const res = await fetch('/api/admin/program', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ programEvents: draftEvents }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Erreur de sauvegarde.');
      setDraftEvents(data.programEvents);
      await handleSaveSettings(draftSettings);
      onPublicDataChanged();
      showNotice(
        'success',
        'Horaires, planning et états de validation enregistrés sur tout le site.'
      );
    } catch (err) {
      showNotice(
        'error',
        err instanceof Error ? err.message : 'Échec de la sauvegarde.'
      );
    }
  };

  const handleModerateTribute = async (
    id: string,
    status: ContributionStatus
  ) => {
    if (!token) return;
    try {
      const res = await fetch(`/api/admin/tributes/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error('Erreur lors de la modération.');
      await fetchAdminPayload(token);
      onPublicDataChanged();
      showNotice('success', `Statut du témoignage mis à jour (${status}).`);
    } catch {
      showNotice('error', 'Impossible de modifier le témoignage.');
    }
  };

  const handleDeleteTribute = async (id: string) => {
    if (!token) return;
    try {
      const res = await fetch(`/api/admin/tributes/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Erreur de suppression.');
      await fetchAdminPayload(token);
      onPublicDataChanged();
      showNotice('success', 'Témoignage supprimé définitivement.');
    } catch {
      showNotice('error', 'Impossible de supprimer ce témoignage.');
    }
  };

  const handleUpdatePhotoDetails = async (
    photo: PhotoItem,
    statusOverride?: ContributionStatus,
    clearDeletionRequest?: boolean
  ) => {
    if (!token) return;
    try {
      const res = await fetch(`/api/admin/photos/${photo.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: photo.title,
          caption: photo.caption,
          category: photo.category,
          status: statusOverride || photo.status,
          clearDeletionRequest,
        }),
      });
      if (!res.ok) throw new Error('Erreur de mise à jour.');
      await fetchAdminPayload(token);
      onPublicDataChanged();
      showNotice(
        'success',
        'Photographie et description au survol mises à jour.'
      );
    } catch {
      showNotice('error', 'Impossible de mettre à jour la photographie.');
    }
  };

  const handleDeletePhoto = async (id: string) => {
    if (!token) return;
    try {
      const res = await fetch(`/api/admin/photos/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Erreur de suppression.');
      await fetchAdminPayload(token);
      onPublicDataChanged();
      showNotice(
        'success',
        'Photographie et données associées supprimées définitivement.'
      );
    } catch {
      showNotice('error', 'Impossible de supprimer la photographie.');
    }
  };

  // Unauthenticated view: Super Admin Username + Password Form
  if (!token) {
    return (
      <section className="py-16 sm:py-24 bg-[#EFF8FD]/40 min-h-[80vh]">
        <div className="max-w-md mx-auto px-4">
          <div className="bg-white border border-[#DCE8EF] rounded-lg p-6 sm:p-8 space-y-6 shadow-sm">
            <div className="space-y-2 border-b border-[#DCE8EF] pb-4">
              <button
                type="button"
                onClick={() => onNavigate('/', 'accueil')}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-[#245B7A] hover:text-[#17191C]"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Retour au faire-part</span>
              </button>
              <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-[#245B7A] font-semibold pt-2">
                <ShieldCheck className="w-4 h-4" />
                <span>Accès réservé aux Super Administrateurs</span>
              </div>
              <h1 className="font-serif-editorial text-2xl sm:text-3xl font-semibold text-[#17191C]">
                Ajuster les informations du site
              </h1>
              <p className="text-xs text-[#56616A] leading-relaxed">
                Veuillez renseigner votre nom d’utilisateur et votre mot de
                passe Super Administrateur pour modifier les horaires, le
                planning, les textes, les familles et la galerie.
              </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label
                  htmlFor="admin-username"
                  className="block text-xs font-semibold uppercase tracking-wider text-[#17191C] mb-1.5"
                >
                  Nom d’utilisateur (Username)
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-[#56616A] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    id="admin-username"
                    type="text"
                    required
                    autoComplete="username"
                    placeholder="Ex. : admin"
                    value={usernameInput}
                    onChange={(e) => setUsernameInput(e.target.value)}
                    className="w-full pl-10 pr-3.5 py-2.5 text-sm border border-[#DCE8EF] rounded-md text-[#17191C] focus:outline-none focus:border-[#245B7A]"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="admin-password"
                  className="block text-xs font-semibold uppercase tracking-wider text-[#17191C] mb-1.5"
                >
                  Mot de passe (Password)
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-[#56616A] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    id="admin-password"
                    type="password"
                    required
                    autoComplete="current-password"
                    placeholder="••••••••"
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    className="w-full pl-10 pr-3.5 py-2.5 text-sm border border-[#DCE8EF] rounded-md text-[#17191C] focus:outline-none focus:border-[#245B7A]"
                  />
                </div>
              </div>

              {loginError && (
                <p className="text-xs text-red-800 bg-red-50 border border-red-200 p-3 rounded-md">
                  {loginError}
                </p>
              )}

              <button
                type="submit"
                disabled={loggingIn}
                className="w-full py-2.5 px-4 text-xs sm:text-sm font-medium text-white bg-[#245B7A] hover:bg-[#1B465E] rounded-md transition-colors"
              >
                {loggingIn
                  ? 'Vérification des identifiants...'
                  : 'Se connecter à l’espace Super Administrateur'}
              </button>
            </form>
          </div>
        </div>
      </section>
    );
  }

  if (loadingData || !adminData || !draftSettings) {
    return (
      <div className="py-20 text-center text-sm text-[#56616A]">
        Chargement de l’espace Super Administrateur...
      </div>
    );
  }

  const pendingTributesCount = adminData.tributes.filter(
    (t) => t.status === 'pending'
  ).length;
  const pendingPhotosCount = adminData.photos.filter(
    (p) => p.status === 'pending' || p.deletionRequested
  ).length;

  return (
    <section className="py-10 sm:py-14 bg-[#EFF8FD]/30 min-h-[85vh]">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Top Admin Header */}
        <div className="bg-white border border-[#DCE8EF] rounded-lg p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2 text-xs text-[#56616A]">
              <span className="inline-flex items-center gap-1 font-semibold text-[#245B7A]">
                <ShieldCheck className="w-3.5 h-3.5" />
                Espace Super Administrateur (Ajuster)
              </span>
              <span>·</span>
              <span>
                Base de données :{' '}
                <strong className="text-[#17191C]">
                  {adminData.backendStatus.storageEngine === 'sanity'
                    ? 'Sanity Cloud synchronisé (Projet 0q8sd30m)'
                    : adminData.backendStatus.supabaseConfigured
                    ? 'Supabase Cloud connecté'
                    : 'Serveur persistant local (/data/memorial-db.json)'}
                </strong>
              </span>
            </div>
            <h1 className="font-serif-editorial text-2xl sm:text-3xl font-semibold text-[#17191C]">
              Administration complète — {draftSettings.displayName}
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => onNavigate('/', 'accueil')}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-[#17191C] bg-[#EFF8FD] hover:bg-[#A9D7F2]/30 border border-[#DCE8EF] rounded-md"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Voir le site public</span>
            </button>

            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-red-800 bg-red-50 hover:bg-red-100 border border-red-200 rounded-md"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Déconnexion</span>
            </button>
          </div>
        </div>

        {/* Save / Action Feedback Banner */}
        {saveBanner && (
          <div
            role="status"
            className={`p-4 rounded-md border text-xs sm:text-sm flex items-center gap-2.5 ${
              saveBanner.type === 'success'
                ? 'bg-[#EFF8FD] border-[#245B7A] text-[#17191C]'
                : 'bg-red-50 border-red-200 text-red-900'
            }`}
          >
            {saveBanner.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-[#245B7A] shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-700 shrink-0" />
            )}
            <span>{saveBanner.message}</span>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 p-1.5 bg-white border border-[#DCE8EF] rounded-lg">
          <button
            type="button"
            onClick={() => setActiveTab('program')}
            className={`inline-flex items-center gap-2 px-3.5 py-2 text-xs font-medium rounded-md transition-colors ${
              activeTab === 'program'
                ? 'bg-[#245B7A] text-white'
                : 'text-[#56616A] hover:text-[#17191C]'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>1. Horaires & Planning</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('settings_contact')}
            className={`inline-flex items-center gap-2 px-3.5 py-2 text-xs font-medium rounded-md transition-colors ${
              activeTab === 'settings_contact'
                ? 'bg-[#245B7A] text-white'
                : 'text-[#56616A] hover:text-[#17191C]'
            }`}
          >
            <Settings className="w-3.5 h-3.5" />
            <span>2. Identité, Hero, Contact & Lieux</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('families')}
            className={`inline-flex items-center gap-2 px-3.5 py-2 text-xs font-medium rounded-md transition-colors ${
              activeTab === 'families'
                ? 'bg-[#245B7A] text-white'
                : 'text-[#56616A] hover:text-[#17191C]'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>3. Familles</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('biography')}
            className={`inline-flex items-center gap-2 px-3.5 py-2 text-xs font-medium rounded-md transition-colors ${
              activeTab === 'biography'
                ? 'bg-[#245B7A] text-white'
                : 'text-[#56616A] hover:text-[#17191C]'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>4. Biographie</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('tributes')}
            className={`inline-flex items-center gap-2 px-3.5 py-2 text-xs font-medium rounded-md transition-colors ${
              activeTab === 'tributes'
                ? 'bg-[#245B7A] text-white'
                : 'text-[#56616A] hover:text-[#17191C]'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>
              5. Témoignages ({pendingTributesCount} en attente)
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('photos')}
            className={`inline-flex items-center gap-2 px-3.5 py-2 text-xs font-medium rounded-md transition-colors ${
              activeTab === 'photos'
                ? 'bg-[#245B7A] text-white'
                : 'text-[#56616A] hover:text-[#17191C]'
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5" />
            <span>
              6. Photos & Descriptions ({draftPhotos.length} photos
              {pendingPhotosCount > 0 ? ` · ${pendingPhotosCount} à traiter` : ''})
            </span>
          </button>
        </div>

        {/* TAB 1: PROGRAM, SCHEDULES & PLANNING */}
        {activeTab === 'program' && (
          <div className="bg-white border border-[#DCE8EF] rounded-lg p-6 sm:p-8 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#DCE8EF] pb-4">
              <div className="space-y-1">
                <h2 className="font-serif-editorial text-2xl font-semibold text-[#17191C]">
                  Gestion complète des horaires et du planning des obsèques
                </h2>
                <p className="text-xs sm:text-sm text-[#56616A] leading-relaxed">
                  Modifiez librement les dates, les horaires, les intitulés de
                  cérémonies et les lieux, ou ajoutez de nouvelles étapes au
                  planning.
                </p>
              </div>
              <button
                type="button"
                onClick={() =>
                  setDraftEvents([
                    ...draftEvents,
                    {
                      id: `evt-${Date.now()}`,
                      dayKey: 'jour_2',
                      dayTitleTransmitted: '10 novembre 2026',
                      weekdayTransmitted: 'Mardi',
                      dateConfirmed: false,
                      timeLabel: '12 h 00',
                      timeConfirmed: false,
                      title: 'Nouvelle étape du programme',
                      location: 'À préciser',
                      locationDetails: '',
                      locationConfirmed: false,
                      verificationNote: '',
                      displayOrder: draftEvents.length + 1,
                    },
                  ])
                }
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-[#245B7A] bg-[#EFF8FD] hover:bg-[#A9D7F2]/30 border border-[#DCE8EF] rounded-md shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Ajouter un créneau / événement</span>
              </button>
            </div>

            {/* Global Program Confirmation Checkboxes */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded-md bg-[#EFF8FD]/60 border border-[#DCE8EF]">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={draftSettings.weekdayInconsistencyResolved}
                  onChange={(e) =>
                    setDraftSettings({
                      ...draftSettings,
                      weekdayInconsistencyResolved: e.target.checked,
                    })
                  }
                  className="mt-1 h-4 w-4 rounded border-[#DCE8EF] text-[#245B7A]"
                />
                <div className="text-xs sm:text-sm">
                  <p className="font-semibold text-[#17191C]">
                    Afficher les jours de semaine sur le programme public
                  </p>
                  <p className="text-xs text-[#56616A]">
                    Cochez cette case lorsque les jours de semaine (ex. Lundi,
                    Mardi, Mercredi ou Vendredi, Samedi, Dimanche) sont vérifiés.
                  </p>
                </div>
              </label>

              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={draftSettings.programConfirmed}
                  onChange={(e) =>
                    setDraftSettings({
                      ...draftSettings,
                      programConfirmed: e.target.checked,
                    })
                  }
                  className="mt-1 h-4 w-4 rounded border-[#DCE8EF] text-[#245B7A]"
                />
                <div className="text-xs sm:text-sm">
                  <p className="font-semibold text-[#17191C]">
                    Programme définitivement confirmé par la famille
                  </p>
                  <p className="text-xs text-[#56616A]">
                    Retire le bandeau « Programme provisoire » et active l’export
                    agenda (.ics).
                  </p>
                </div>
              </label>
            </div>

            {/* Events Editor */}
            <div className="space-y-4">
              {draftEvents.map((evt, idx) => (
                <div
                  key={evt.id}
                  className="p-4 rounded-md border border-[#DCE8EF] bg-white space-y-3"
                >
                  <div className="flex items-center justify-between border-b border-[#DCE8EF]/60 pb-2">
                    <span className="text-xs font-semibold text-[#245B7A]">
                      Créneau #{idx + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setDraftEvents(draftEvents.filter((_, i) => i !== idx))
                      }
                      className="inline-flex items-center gap-1 text-xs text-red-700 hover:bg-red-50 px-2 py-1 rounded"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Supprimer ce créneau</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold uppercase text-[#56616A] mb-1">
                        Intitulé de date
                      </label>
                      <input
                        type="text"
                        value={evt.dayTitleTransmitted}
                        onChange={(e) => {
                          const next = [...draftEvents];
                          next[idx] = {
                            ...evt,
                            dayTitleTransmitted: e.target.value,
                          };
                          setDraftEvents(next);
                        }}
                        className="w-full px-2.5 py-1.5 text-xs border border-[#DCE8EF] rounded"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold uppercase text-[#56616A] mb-1">
                        Jour de semaine
                      </label>
                      <input
                        type="text"
                        value={evt.weekdayTransmitted}
                        onChange={(e) => {
                          const next = [...draftEvents];
                          next[idx] = {
                            ...evt,
                            weekdayTransmitted: e.target.value,
                          };
                          setDraftEvents(next);
                        }}
                        placeholder="Ex. : Vendredi ou Lundi"
                        className="w-full px-2.5 py-1.5 text-xs border border-[#DCE8EF] rounded"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold uppercase text-[#56616A] mb-1">
                        Horaire
                      </label>
                      <input
                        type="text"
                        value={evt.timeLabel}
                        onChange={(e) => {
                          const next = [...draftEvents];
                          next[idx] = { ...evt, timeLabel: e.target.value };
                          setDraftEvents(next);
                        }}
                        className="w-full px-2.5 py-1.5 text-xs border border-[#DCE8EF] rounded"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold uppercase text-[#56616A] mb-1">
                        Titre de la cérémonie
                      </label>
                      <input
                        type="text"
                        value={evt.title}
                        onChange={(e) => {
                          const next = [...draftEvents];
                          next[idx] = { ...evt, title: e.target.value };
                          setDraftEvents(next);
                        }}
                        className="w-full px-2.5 py-1.5 text-xs border border-[#DCE8EF] rounded"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold uppercase text-[#56616A] mb-1">
                        Lieu
                      </label>
                      <input
                        type="text"
                        value={evt.location}
                        onChange={(e) => {
                          const next = [...draftEvents];
                          next[idx] = { ...evt, location: e.target.value };
                          setDraftEvents(next);
                        }}
                        className="w-full px-2.5 py-1.5 text-xs border border-[#DCE8EF] rounded"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold uppercase text-[#56616A] mb-1">
                        Précisions / Adresse
                      </label>
                      <input
                        type="text"
                        value={evt.locationDetails}
                        onChange={(e) => {
                          const next = [...draftEvents];
                          next[idx] = {
                            ...evt,
                            locationDetails: e.target.value,
                          };
                          setDraftEvents(next);
                        }}
                        className="w-full px-2.5 py-1.5 text-xs border border-[#DCE8EF] rounded"
                      />
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-5 pt-1 text-xs">
                    <label className="inline-flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={evt.dateConfirmed}
                        onChange={(e) => {
                          const next = [...draftEvents];
                          next[idx] = {
                            ...evt,
                            dateConfirmed: e.target.checked,
                          };
                          setDraftEvents(next);
                        }}
                      />
                      <span>Date confirmée</span>
                    </label>
                    <label className="inline-flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={evt.timeConfirmed}
                        onChange={(e) => {
                          const next = [...draftEvents];
                          next[idx] = {
                            ...evt,
                            timeConfirmed: e.target.checked,
                          };
                          setDraftEvents(next);
                        }}
                      />
                      <span>Horaire confirmé</span>
                    </label>
                    <label className="inline-flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={evt.locationConfirmed}
                        onChange={(e) => {
                          const next = [...draftEvents];
                          next[idx] = {
                            ...evt,
                            locationConfirmed: e.target.checked,
                          };
                          setDraftEvents(next);
                        }}
                      />
                      <span>Lieu précis confirmé</span>
                    </label>
                  </div>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={handleSaveProgram}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-xs sm:text-sm font-medium text-white bg-[#245B7A] hover:bg-[#1B465E] rounded-md"
            >
              <Save className="w-4 h-4" />
              <span>Enregistrer les horaires et le planning</span>
            </button>
          </div>
        )}

        {/* TAB 2: IDENTITY, HERO IMAGE, CONTACT & LOCATIONS */}
        {activeTab === 'settings_contact' && (
          <div className="bg-white border border-[#DCE8EF] rounded-lg p-6 sm:p-8 space-y-6">
            <h2 className="font-serif-editorial text-2xl font-semibold text-[#17191C] border-b border-[#DCE8EF] pb-3">
              Identité, Image Hero d’accueil, Contact WhatsApp et Localisation
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Identity & Hero Image */}
              <div className="space-y-4">
                <h3 className="font-semibold text-sm text-[#245B7A] uppercase tracking-wider">
                  Identité du défunt & Image Hero
                </h3>

                <div>
                  <label className="block text-xs font-semibold text-[#17191C] mb-1">
                    Nom complet affiché sur le site
                  </label>
                  <input
                    type="text"
                    value={draftSettings.displayName}
                    onChange={(e) =>
                      setDraftSettings({
                        ...draftSettings,
                        displayName: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 text-xs border border-[#DCE8EF] rounded-md"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-[#17191C] mb-1">
                      Année de naissance
                    </label>
                    <input
                      type="number"
                      value={draftSettings.birthYear}
                      onChange={(e) =>
                        setDraftSettings({
                          ...draftSettings,
                          birthYear: Number(e.target.value) || 1989,
                        })
                      }
                      className="w-full px-3 py-2 text-xs border border-[#DCE8EF] rounded-md"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#17191C] mb-1">
                      Année de décès
                    </label>
                    <input
                      type="number"
                      value={draftSettings.deathYear}
                      onChange={(e) =>
                        setDraftSettings({
                          ...draftSettings,
                          deathYear: Number(e.target.value) || 2026,
                        })
                      }
                      className="w-full px-3 py-2 text-xs border border-[#DCE8EF] rounded-md"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-[#17191C] mb-1">
                      Lieu de naissance
                    </label>
                    <input
                      type="text"
                      value={draftSettings.birthPlace}
                      onChange={(e) =>
                        setDraftSettings({
                          ...draftSettings,
                          birthPlace: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 text-xs border border-[#DCE8EF] rounded-md"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#17191C] mb-1">
                      Situation matrimoniale
                    </label>
                    <input
                      type="text"
                      value={draftSettings.maritalStatus}
                      onChange={(e) =>
                        setDraftSettings({
                          ...draftSettings,
                          maritalStatus: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 text-xs border border-[#DCE8EF] rounded-md"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#17191C] mb-1">
                    Image de la Hero Page (arrière-plan d’accueil & aperçu WhatsApp)
                  </label>
                  <input
                    type="text"
                    value={draftSettings.portraitUrl}
                    onChange={(e) =>
                      setDraftSettings({
                        ...draftSettings,
                        portraitUrl: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 text-xs border border-[#DCE8EF] rounded-md"
                  />
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    <button
                      type="button"
                      onClick={() =>
                        setDraftSettings({
                          ...draftSettings,
                          portraitUrl:
                            '/assets/aistudio/Portrait_c_r_moniel_devant_la_chefferie_de_Bandjoun_f1aac569.png',
                        })
                      }
                      className="px-2.5 py-1 text-[11px] bg-[#EFF8FD] hover:bg-[#A9D7F2]/40 text-[#245B7A] border border-[#DCE8EF] rounded"
                    >
                      Portrait Chefferie Bandjoun (Par défaut)
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setDraftSettings({
                          ...draftSettings,
                          portraitUrl:
                            '/assets/aistudio/Poign_e_de_main_diplomatique_devant_les_drapeaux_da7da34b.png',
                        })
                      }
                      className="px-2.5 py-1 text-[11px] bg-[#EFF8FD] hover:bg-[#A9D7F2]/40 text-[#245B7A] border border-[#DCE8EF] rounded"
                    >
                      Rencontre diplomatique
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#17191C] mb-1">
                    Symbole de recueillement
                  </label>
                  <select
                    value={draftSettings.religiousSymbol}
                    onChange={(e) =>
                      setDraftSettings({
                        ...draftSettings,
                        religiousSymbol: e.target.value as any,
                      })
                    }
                    className="w-full px-3 py-2 text-xs border border-[#DCE8EF] rounded-md"
                  >
                    <option value="none">Aucun symbole affiché</option>
                    <option value="cross">Croix discrète (✝)</option>
                  </select>
                </div>

                <label className="flex items-center gap-2 text-xs cursor-pointer">
                  <input
                    type="checkbox"
                    checked={draftSettings.religiousSymbolConfirmed}
                    onChange={(e) =>
                      setDraftSettings({
                        ...draftSettings,
                        religiousSymbolConfirmed: e.target.checked,
                      })
                    }
                  />
                  <span>Confirmer l’affichage du symbole choisi</span>
                </label>
              </div>

              {/* Contact WhatsApp Validation */}
              <div className="space-y-4">
                <h3 className="font-semibold text-sm text-[#245B7A] uppercase tracking-wider">
                  Contact familial & WhatsApp
                </h3>
                <p className="text-xs text-[#56616A] leading-relaxed">
                  Configurez le numéro de téléphone ou WhatsApp familial et
                  cochez « Confirmer ce numéro » pour activer le bouton de
                  contact direct sur le site public.
                </p>

                <div>
                  <label className="block text-xs font-semibold text-[#17191C] mb-1">
                    Nom de la personne de contact
                  </label>
                  <input
                    type="text"
                    value={draftSettings.contactName}
                    onChange={(e) =>
                      setDraftSettings({
                        ...draftSettings,
                        contactName: e.target.value,
                      })
                    }
                    placeholder="Ex. : Représentant de la famille Tamfeu"
                    className="w-full px-3 py-2 text-xs border border-[#DCE8EF] rounded-md"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#17191C] mb-1">
                    Numéro WhatsApp international
                  </label>
                  <input
                    type="text"
                    value={draftSettings.whatsappNumber}
                    onChange={(e) =>
                      setDraftSettings({
                        ...draftSettings,
                        whatsappNumber: e.target.value,
                      })
                    }
                    placeholder="+33 7 53 04 93 53 ou +237 ..."
                    className="w-full px-3 py-2 text-xs border border-[#DCE8EF] rounded-md"
                  />
                </div>

                <label className="flex items-start gap-2.5 text-xs cursor-pointer p-3 rounded bg-[#EFF8FD] border border-[#DCE8EF]">
                  <input
                    type="checkbox"
                    checked={draftSettings.contactConfirmed}
                    onChange={(e) =>
                      setDraftSettings({
                        ...draftSettings,
                        contactConfirmed: e.target.checked,
                      })
                    }
                    className="mt-0.5 h-4 w-4"
                  />
                  <span>
                    <strong className="text-[#17191C]">
                      Confirmer ce numéro comme contact officiel de la famille
                    </strong>{' '}
                    (active les boutons WhatsApp sur le site public)
                  </span>
                </label>
              </div>
            </div>

            {/* Domicile & Contributions Toggles */}
            <div className="pt-4 border-t border-[#DCE8EF] grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <h3 className="font-semibold text-sm text-[#245B7A] uppercase tracking-wider">
                  Localisation exacte du domicile (Nkolbisson)
                </h3>
                <div>
                  <label className="block text-xs font-semibold text-[#17191C] mb-1">
                    Précisions d’adresse après l’Église catholique de Nkolbisson
                  </label>
                  <input
                    type="text"
                    value={draftSettings.homeAddress}
                    onChange={(e) =>
                      setDraftSettings({
                        ...draftSettings,
                        homeAddress: e.target.value,
                      })
                    }
                    placeholder="Repères finaux validés par la famille..."
                    className="w-full px-3 py-2 text-xs border border-[#DCE8EF] rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#17191C] mb-1">
                    Lien Google Maps exact (active le bouton Google Maps public)
                  </label>
                  <input
                    type="url"
                    value={draftSettings.homeMapsUrl}
                    onChange={(e) =>
                      setDraftSettings({
                        ...draftSettings,
                        homeMapsUrl: e.target.value,
                      })
                    }
                    placeholder="https://maps.google.com/..."
                    className="w-full px-3 py-2 text-xs border border-[#DCE8EF] rounded-md"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="font-semibold text-sm text-[#245B7A] uppercase tracking-wider">
                  Ouverture des contributions publiques
                </h3>
                <label className="flex items-start gap-2.5 text-xs cursor-pointer p-3 rounded border border-[#DCE8EF]">
                  <input
                    type="checkbox"
                    checked={draftSettings.allowPublicTributes}
                    onChange={(e) =>
                      setDraftSettings({
                        ...draftSettings,
                        allowPublicTributes: e.target.checked,
                      })
                    }
                    className="mt-0.5 h-4 w-4"
                  />
                  <span>
                    Autoriser l’envoi de condoléances et témoignages sur le site
                  </span>
                </label>

                <label className="flex items-start gap-2.5 text-xs cursor-pointer p-3 rounded border border-[#DCE8EF]">
                  <input
                    type="checkbox"
                    checked={draftSettings.allowGuestPhotos}
                    onChange={(e) =>
                      setDraftSettings({
                        ...draftSettings,
                        allowGuestPhotos: e.target.checked,
                      })
                    }
                    className="mt-0.5 h-4 w-4"
                  />
                  <span>
                    Autoriser les invités à partager des photos souvenirs sur le
                    site
                  </span>
                </label>
              </div>
            </div>

            <button
              type="button"
              onClick={() => handleSaveSettings()}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-xs sm:text-sm font-medium text-white bg-[#245B7A] hover:bg-[#1B465E] rounded-md"
            >
              <Save className="w-4 h-4" />
              <span>Enregistrer les paramètres</span>
            </button>
          </div>
        )}

        {/* TAB 3: FAMILIES */}
        {activeTab === 'families' && (
          <div className="bg-white border border-[#DCE8EF] rounded-lg p-6 sm:p-8 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#DCE8EF] pb-4">
              <div>
                <h2 className="font-serif-editorial text-2xl font-semibold text-[#17191C]">
                  Familles annoncées dans le faire-part
                </h2>
                <p className="text-xs text-[#56616A]">
                  Ajoutez ou complétez les noms des familles et familles alliées.
                </p>
              </div>
              <button
                type="button"
                onClick={() =>
                  setDraftFamilies([
                    ...draftFamilies,
                    {
                      id: `fam-${Date.now()}`,
                      name: '',
                      category: null,
                      note: '',
                      displayOrder: draftFamilies.length + 1,
                    },
                  ])
                }
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-[#245B7A] bg-[#EFF8FD] border border-[#DCE8EF] rounded-md"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Ajouter une famille</span>
              </button>
            </div>

            <div className="space-y-3">
              {draftFamilies.map((fam, idx) => (
                <div
                  key={fam.id}
                  className="p-4 rounded-md border border-[#DCE8EF] grid grid-cols-1 sm:grid-cols-12 gap-3 items-center"
                >
                  <div className="sm:col-span-4">
                    <input
                      type="text"
                      value={fam.name}
                      onChange={(e) => {
                        const next = [...draftFamilies];
                        next[idx] = { ...fam, name: e.target.value };
                        setDraftFamilies(next);
                      }}
                      placeholder="Nom de la famille (ex. : Famille Tamfeu)"
                      className="w-full px-3 py-2 text-xs border border-[#DCE8EF] rounded"
                    />
                  </div>
                  <div className="sm:col-span-3">
                    <select
                      value={fam.category || ''}
                      onChange={(e) => {
                        const val = e.target.value
                          ? (e.target.value as FamilyCategory)
                          : null;
                        const next = [...draftFamilies];
                        next[idx] = { ...fam, category: val };
                        setDraftFamilies(next);
                      }}
                      className="w-full px-3 py-2 text-xs border border-[#DCE8EF] rounded"
                    >
                      <option value="">Sans catégorie spécifique</option>
                      <option value="paternelle">Famille paternelle</option>
                      <option value="maternelle">Famille maternelle</option>
                      <option value="belle_famille">Belle-famille</option>
                      <option value="alliee">Familles alliées</option>
                    </select>
                  </div>
                  <div className="sm:col-span-4">
                    <input
                      type="text"
                      value={fam.note || ''}
                      onChange={(e) => {
                        const next = [...draftFamilies];
                        next[idx] = { ...fam, note: e.target.value };
                        setDraftFamilies(next);
                      }}
                      placeholder="Précision facultative (localité, lignée...)"
                      className="w-full px-3 py-2 text-xs border border-[#DCE8EF] rounded"
                    />
                  </div>
                  <div className="sm:col-span-1 flex justify-end">
                    <button
                      type="button"
                      onClick={() =>
                        setDraftFamilies(
                          draftFamilies.filter((_, i) => i !== idx)
                        )
                      }
                      className="p-2 text-red-700 hover:bg-red-50 rounded"
                      aria-label="Supprimer cette famille"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <label className="flex items-center gap-2 text-xs cursor-pointer">
              <input
                type="checkbox"
                checked={draftSettings.familyListConfirmed}
                onChange={(e) =>
                  setDraftSettings({
                    ...draftSettings,
                    familyListConfirmed: e.target.checked,
                  })
                }
              />
              <span>
                Marquer la liste des familles comme définitivement validée
              </span>
            </label>

            <button
              type="button"
              onClick={handleSaveFamilies}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-xs sm:text-sm font-medium text-white bg-[#245B7A] hover:bg-[#1B465E] rounded-md"
            >
              <Save className="w-4 h-4" />
              <span>Enregistrer les familles</span>
            </button>
          </div>
        )}

        {/* TAB 4: BIOGRAPHY */}
        {activeTab === 'biography' && (
          <div className="bg-white border border-[#DCE8EF] rounded-lg p-6 sm:p-8 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#DCE8EF] pb-4">
              <div className="space-y-1">
                <h2 className="font-serif-editorial text-2xl font-semibold text-[#17191C]">
                  Sections de la biographie
                </h2>
                <p className="text-xs text-[#56616A]">
                  Modifiez les titres et textes biographiques ou activez de
                  nouvelles rubriques sur le site public.
                </p>
              </div>
              <button
                type="button"
                onClick={() =>
                  setDraftBiography([
                    ...draftBiography,
                    {
                      id: `bio-${Date.now()}`,
                      code: 'souvenir_transmission',
                      title: 'Nouvelle rubrique biographique',
                      content: '',
                      isVisiblePublic: true,
                      isValidated: true,
                      displayOrder: draftBiography.length + 1,
                    },
                  ])
                }
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-[#245B7A] bg-[#EFF8FD] border border-[#DCE8EF] rounded-md shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Ajouter une section</span>
              </button>
            </div>

            <div className="space-y-5">
              {draftBiography.map((sec, idx) => (
                <div
                  key={sec.id}
                  className="p-4 rounded-md border border-[#DCE8EF] space-y-3"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <input
                      type="text"
                      value={sec.title}
                      onChange={(e) => {
                        const next = [...draftBiography];
                        next[idx] = { ...sec, title: e.target.value };
                        setDraftBiography(next);
                      }}
                      className="font-serif-editorial text-xl font-semibold text-[#17191C] border border-[#DCE8EF] rounded px-2.5 py-1 flex-1 min-w-[220px]"
                    />
                    <label className="inline-flex items-center gap-2 text-xs font-medium text-[#245B7A] cursor-pointer">
                      <input
                        type="checkbox"
                        checked={sec.isVisiblePublic}
                        onChange={(e) => {
                          const next = [...draftBiography];
                          next[idx] = {
                            ...sec,
                            isVisiblePublic: e.target.checked,
                            isValidated: e.target.checked,
                          };
                          setDraftBiography(next);
                        }}
                      />
                      <span>Afficher sur le site public</span>
                    </label>
                  </div>

                  <textarea
                    rows={4}
                    value={sec.content}
                    onChange={(e) => {
                      const next = [...draftBiography];
                      next[idx] = { ...sec, content: e.target.value };
                      setDraftBiography(next);
                    }}
                    placeholder={`Contenu validé pour la rubrique « ${sec.title} »...`}
                    className="w-full px-3 py-2 text-xs sm:text-sm border border-[#DCE8EF] rounded-md leading-relaxed"
                  />
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={handleSaveBiography}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-xs sm:text-sm font-medium text-white bg-[#245B7A] hover:bg-[#1B465E] rounded-md"
            >
              <Save className="w-4 h-4" />
              <span>Enregistrer la biographie</span>
            </button>
          </div>
        )}

        {/* TAB 5: TRIBUTES MODERATION */}
        {activeTab === 'tributes' && (
          <div className="bg-white border border-[#DCE8EF] rounded-lg p-6 sm:p-8 space-y-6">
            <div className="border-b border-[#DCE8EF] pb-4 space-y-1">
              <h2 className="font-serif-editorial text-2xl font-semibold text-[#17191C]">
                Modération des témoignages et messages privés
              </h2>
              <p className="text-xs text-[#56616A]">
                Gérez les témoignages publiés dans le livre d’hommages ou
                consultez les messages privés adressés à la famille.
              </p>
            </div>

            {adminData.tributes.length === 0 ? (
              <p className="text-sm text-[#56616A] py-8 text-center">
                Aucun témoignage ou message reçu pour le moment.
              </p>
            ) : (
              <div className="space-y-4">
                {adminData.tributes.map((trib) => (
                  <div
                    key={trib.id}
                    className="p-5 rounded-md border border-[#DCE8EF] bg-[#EFF8FD]/30 space-y-3"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                      <div className="flex flex-wrap items-center gap-2">
                        <strong className="text-sm text-[#17191C]">
                          {trib.authorFirstName} {trib.authorLastName}
                        </strong>
                        {trib.relationship && (
                          <span className="text-[#56616A]">
                            · {trib.relationship}
                          </span>
                        )}
                        <span>·</span>
                        <span className="font-medium text-[#245B7A]">
                          {trib.isPrivateToFamily
                            ? 'Message strictement privé (non publiable)'
                            : `Statut : ${trib.status.toUpperCase()}`}
                        </span>
                      </div>
                      <span className="text-[#56616A] tabular-nums">
                        {new Date(trib.createdAt).toLocaleString('fr-FR')}
                      </span>
                    </div>

                    <p className="text-sm text-[#17191C] bg-white p-3.5 rounded border border-[#DCE8EF] leading-relaxed">
                      {trib.message}
                    </p>

                    <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                      <div className="flex flex-wrap items-center gap-2">
                        {!trib.isPrivateToFamily && (
                          <>
                            <button
                              type="button"
                              onClick={() =>
                                handleModerateTribute(trib.id, 'approved')
                              }
                              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-white bg-[#245B7A] hover:bg-[#1B465E] rounded"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>Approuver et publier</span>
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                handleModerateTribute(trib.id, 'rejected')
                              }
                              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-[#56616A] bg-white border border-[#DCE8EF] hover:text-[#17191C] rounded"
                            >
                              <X className="w-3.5 h-3.5" />
                              <span>Masquer / Rejeter</span>
                            </button>
                          </>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => handleDeleteTribute(trib.id)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-50 rounded"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Supprimer définitivement</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 6: PHOTOS & HOVER CAPTIONS MANAGEMENT */}
        {activeTab === 'photos' && (
          <div className="bg-white border border-[#DCE8EF] rounded-lg p-6 sm:p-8 space-y-6">
            <div className="border-b border-[#DCE8EF] pb-4 space-y-1">
              <h2 className="font-serif-editorial text-2xl font-semibold text-[#17191C]">
                Galerie photographique et courtes descriptions au survol
              </h2>
              <p className="text-xs text-[#56616A]">
                Modifiez le titre, la catégorie et la courte description qui
                s’affiche lorsque le curseur survole chaque image sur le site.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {draftPhotos.map((photo, idx) => (
                <div
                  key={photo.id}
                  className="border border-[#DCE8EF] rounded-lg overflow-hidden bg-white flex flex-col justify-between"
                >
                  <div className="p-4 space-y-3">
                    <div className="flex gap-4 items-start">
                      <img
                        src={photo.imageDataUrl}
                        alt={photo.title}
                        className="w-24 h-24 object-cover rounded border border-[#DCE8EF] shrink-0"
                      />
                      <div className="space-y-2 flex-1 text-xs">
                        <div>
                          <label className="block text-[11px] font-semibold uppercase text-[#56616A] mb-0.5">
                            Titre de l’image
                          </label>
                          <input
                            type="text"
                            value={photo.title}
                            onChange={(e) => {
                              const next = [...draftPhotos];
                              next[idx] = { ...photo, title: e.target.value };
                              setDraftPhotos(next);
                            }}
                            className="w-full px-2.5 py-1.5 text-xs border border-[#DCE8EF] rounded font-medium text-[#17191C]"
                          />
                        </div>

                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[#56616A]">
                            Auteur : {photo.authorName}
                          </span>
                          <span className="font-semibold text-[#245B7A]">
                            {photo.status.toUpperCase()}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold uppercase text-[#56616A] mb-1">
                        Courte description affichée au survol de la souris
                      </label>
                      <textarea
                        rows={2}
                        value={photo.caption}
                        onChange={(e) => {
                          const next = [...draftPhotos];
                          next[idx] = { ...photo, caption: e.target.value };
                          setDraftPhotos(next);
                        }}
                        placeholder="Courte description qui apparaît sur l’image au passage du curseur..."
                        className="w-full px-2.5 py-1.5 text-xs border border-[#DCE8EF] rounded leading-relaxed"
                      />
                    </div>

                    {photo.deletionRequested && (
                      <div className="p-2 rounded bg-red-50 border border-red-200 text-xs text-red-900">
                        <p className="font-semibold">
                          Demande de retrait signalée :
                        </p>
                        <p>{photo.deletionReason}</p>
                      </div>
                    )}
                  </div>

                  <div className="p-3 bg-[#EFF8FD]/50 border-t border-[#DCE8EF] flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          handleUpdatePhotoDetails(photo, 'approved', true)
                        }
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-white bg-[#245B7A] hover:bg-[#1B465E] rounded"
                      >
                        <Save className="w-3.5 h-3.5" />
                        <span>Enregistrer & Publier</span>
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          handleUpdatePhotoDetails(photo, 'rejected')
                        }
                        className="px-2.5 py-1.5 text-xs font-medium text-[#56616A] bg-white border border-[#DCE8EF] rounded"
                      >
                        Masquer
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDeletePhoto(photo.id)}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-red-700 hover:bg-red-50 rounded"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Supprimer</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

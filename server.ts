import crypto from 'crypto';
import dotenv from 'dotenv';
import express, { Request, Response, NextFunction } from 'express';
import fs from 'fs';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { createClient as createSupabaseClient, SupabaseClient } from '@supabase/supabase-js';
import { createClient as createSanityClient, SanityClient } from '@sanity/client';
import {
  INITIAL_BIOGRAPHY_SECTIONS,
  INITIAL_FAMILIES,
  INITIAL_MEMORIAL_SETTINGS,
  INITIAL_PHOTOS,
  INITIAL_PROGRAM_EVENTS,
  INITIAL_TRIBUTES,
} from './src/data/initialMemorialData.ts';
import {
  AttendanceItem,
  BiographySection,
  ContributionStatus,
  FamilyEntry,
  MemorialSettings,
  PhotoItem,
  ProgramEventItem,
  TributeItem,
} from './src/types/memorial.ts';

dotenv.config();

interface PersistentStore {
  settings: MemorialSettings;
  families: FamilyEntry[];
  biographySections: BiographySection[];
  programEvents: ProgramEventItem[];
  tributes: TributeItem[];
  photos: PhotoItem[];
  attendances: AttendanceItem[];
}

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE_PATH = path.join(DATA_DIR, 'memorial-db.json');
const SANITY_DOC_ID = 'memorial-store-ptas';

// Sanity CMS Client (Project ID: 0q8sd30m, Organization ID: oh314dkvd)
const sanityProjectId = process.env.SANITY_PROJECT_ID?.trim() || '0q8sd30m';
const sanityDataset = process.env.SANITY_DATASET?.trim() || 'production';
const sanityToken = process.env.SANITY_API_TOKEN?.trim() || '';

const sanityClient: SanityClient | null =
  sanityProjectId && sanityToken
    ? createSanityClient({
        projectId: sanityProjectId,
        dataset: sanityDataset,
        token: sanityToken,
        apiVersion: '2025-02-01',
        useCdn: false,
      })
    : null;

// Optional Supabase Server Client
const supabaseUrl = process.env.SUPABASE_URL?.trim() || '';
const supabaseServiceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ||
  process.env.SUPABASE_ANON_KEY?.trim() ||
  '';

const supabaseClient: SupabaseClient | null =
  supabaseUrl && supabaseServiceKey
    ? createSupabaseClient(supabaseUrl, supabaseServiceKey, {
        auth: { persistSession: false },
      })
    : null;

function ensureOfficialAssetsInStore(store: PersistentStore): boolean {
  let modified = false;

  // Ensure Hero background defaults to the ceremonial Bandjoun portrait
  if (
    !store.settings.portraitUrl ||
    store.settings.portraitUrl ===
      '/assets/aistudio/Capture_d__cran_2026-10-26_091336_06908b40.png' ||
    store.settings.portraitUrl ===
      '/assets/aistudio/Portrait_professionnel_en_costume_sombre_f15e88d6.png'
  ) {
    store.settings.portraitUrl =
      '/assets/aistudio/Portrait_c_r_moniel_devant_la_chefferie_de_Bandjoun_f1aac569.png';
    modified = true;
  }

  // Ensure the 3 official photos with their hover descriptions exist in the store
  for (const officialPhoto of [...INITIAL_PHOTOS].reverse()) {
    const existingIdx = store.photos.findIndex((p) => p.id === officialPhoto.id);
    if (existingIdx === -1) {
      store.photos.unshift({ ...officialPhoto });
      modified = true;
    } else if (!store.photos[existingIdx].caption && officialPhoto.caption) {
      store.photos[existingIdx].caption = officialPhoto.caption;
      modified = true;
    }
  }

  return modified;
}

function loadLocalStore(): PersistentStore {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (fs.existsSync(DB_FILE_PATH)) {
      const raw = fs.readFileSync(DB_FILE_PATH, 'utf-8');
      const parsed = JSON.parse(raw) as Partial<PersistentStore>;
      const mergedSettings: MemorialSettings = {
        ...INITIAL_MEMORIAL_SETTINGS,
        ...(parsed.settings || {}),
        allowGuestPhotos:
          parsed.settings?.allowGuestPhotos !== undefined
            ? true
            : INITIAL_MEMORIAL_SETTINGS.allowGuestPhotos,
        allowPublicTributes: true,
      };
      const loadedStore: PersistentStore = {
        settings: mergedSettings,
        families: Array.isArray(parsed.families) ? parsed.families : INITIAL_FAMILIES,
        biographySections: Array.isArray(parsed.biographySections)
          ? parsed.biographySections
          : INITIAL_BIOGRAPHY_SECTIONS,
        programEvents: Array.isArray(parsed.programEvents)
          ? parsed.programEvents
          : INITIAL_PROGRAM_EVENTS,
        tributes: Array.isArray(parsed.tributes) ? parsed.tributes : INITIAL_TRIBUTES,
        photos: Array.isArray(parsed.photos) ? parsed.photos : INITIAL_PHOTOS,
        attendances: Array.isArray(parsed.attendances) ? parsed.attendances : [],
      };
      ensureOfficialAssetsInStore(loadedStore);
      return loadedStore;
    }
  } catch (err) {
    console.error('Error loading local store, using initial defaults:', err);
  }

  return {
    settings: { ...INITIAL_MEMORIAL_SETTINGS },
    families: [...INITIAL_FAMILIES],
    biographySections: [...INITIAL_BIOGRAPHY_SECTIONS],
    programEvents: [...INITIAL_PROGRAM_EVENTS],
    tributes: [...INITIAL_TRIBUTES],
    photos: [...INITIAL_PHOTOS],
    attendances: [],
  };
}

function saveStore(store: PersistentStore): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DB_FILE_PATH, JSON.stringify(store, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to persist local store:', err);
  }

  // Asynchronously synchronize full state with Sanity Database
  if (sanityClient) {
    sanityClient
      .createOrReplace({
        _id: SANITY_DOC_ID,
        _type: 'memorialStore',
        settings: store.settings,
        families: store.families.map((f) => ({ _key: f.id, ...f })),
        biographySections: store.biographySections.map((b) => ({
          _key: b.id,
          ...b,
        })),
        programEvents: store.programEvents.map((e) => ({ _key: e.id, ...e })),
        tributes: store.tributes.map((t) => ({ _key: t.id, ...t })),
        photos: store.photos.map((p) => ({
          _key: p.id,
          ...p,
        })),
        attendances: store.attendances.map((a) => ({ _key: a.id, ...a })),
        updatedAt: new Date().toISOString(),
      })
      .catch((err) => {
        console.error('Sanity sync warning:', err?.message || err);
      });
  }
}

async function hydrateFromSanityIfAvailable(
  store: PersistentStore
): Promise<void> {
  if (!sanityClient) return;
  try {
    const existing = await sanityClient.getDocument(SANITY_DOC_ID);
    if (existing && existing.settings) {
      store.settings = { ...store.settings, ...existing.settings };
      if (Array.isArray(existing.families) && existing.families.length > 0) {
        store.families = existing.families;
      }
      if (
        Array.isArray(existing.biographySections) &&
        existing.biographySections.length > 0
      ) {
        store.biographySections = existing.biographySections;
      }
      if (
        Array.isArray(existing.programEvents) &&
        existing.programEvents.length > 0
      ) {
        store.programEvents = existing.programEvents;
      }
      if (Array.isArray(existing.tributes)) {
        store.tributes = existing.tributes;
      }
      if (Array.isArray(existing.photos) && existing.photos.length > 0) {
        store.photos = existing.photos;
      }
      if (Array.isArray(existing.attendances)) {
        store.attendances = existing.attendances;
      }
      const updated = ensureOfficialAssetsInStore(store);
      if (updated) {
        saveStore(store);
      } else {
        fs.writeFileSync(DB_FILE_PATH, JSON.stringify(store, null, 2), 'utf-8');
      }
      console.log(`Connected and hydrated from Sanity (Project: ${sanityProjectId})`);
    } else {
      ensureOfficialAssetsInStore(store);
      saveStore(store);
      console.log(`Initialized Sanity dataset with memorial store (Project: ${sanityProjectId})`);
    }
  } catch (err: any) {
    console.error('Sanity initial connection check:', err?.message || err);
  }
}

const activeAdminTokens = new Map<string, { username: string; createdAt: number }>();
const SESSION_TTL_MS = 1000 * 60 * 60 * 8; // 8 hours

function sanitizePlainString(input: unknown, maxLength = 2000): string {
  if (typeof input !== 'string') return '';
  return input.trim().slice(0, maxLength);
}

function safeCompareStrings(expected: string, actual: string): boolean {
  const a = Buffer.from(expected, 'utf-8');
  const b = Buffer.from(actual, 'utf-8');
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

function requireAdminAuth(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
  if (!token || !activeAdminTokens.has(token)) {
    res.status(401).json({
      error: 'Accès non autorisé. Veuillez vous authentifier en tant que Super Administrateur.',
    });
    return;
  }
  const session = activeAdminTokens.get(token)!;
  if (Date.now() - session.createdAt > SESSION_TTL_MS) {
    activeAdminTokens.delete(token);
    res.status(401).json({
      error: 'Session expirée. Veuillez vous reconnecter.',
    });
    return;
  }
  next();
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '25mb' }));

  const store = loadLocalStore();
  saveStore(store);
  await hydrateFromSanityIfAvailable(store);

  const activeStorageEngine: 'sanity' | 'supabase' | 'server_persistent_json' =
    sanityClient
      ? 'sanity'
      : supabaseClient
      ? 'supabase'
      : 'server_persistent_json';

  // --------------------------------------------------------------------------
  // PUBLIC API ENDPOINTS
  // --------------------------------------------------------------------------

  app.get('/api/memorial', (_req: Request, res: Response) => {
    const { whatsappNumber, ...restSettings } = store.settings;

    const publicWhatsapp = store.settings.contactConfirmed ? whatsappNumber : '';

    const visibleBiography = [...store.biographySections]
      .filter((s) => s.isVisiblePublic && s.content.trim().length > 0)
      .sort((a, b) => a.displayOrder - b.displayOrder);

    const sortedFamilies = [...store.families].sort(
      (a, b) => a.displayOrder - b.displayOrder
    );

    const sortedEvents = [...store.programEvents].sort(
      (a, b) => a.displayOrder - b.displayOrder
    );

    const approvedTributes = [...store.tributes]
      .filter(
        (t) =>
          t.status === 'approved' &&
          !t.isPrivateToFamily &&
          t.consentPublication === true
      )
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));

    const approvedPhotos = [...store.photos]
      .filter((p) => p.status === 'approved' && p.consentPublication === true)
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));

    const sortedAttendances = [...store.attendances].sort((a, b) =>
      a.createdAt < b.createdAt ? 1 : -1
    );

    res.json({
      settings: {
        ...restSettings,
        whatsappNumber: publicWhatsapp,
        hasUnconfirmedContactConfigured: Boolean(
          !store.settings.contactConfirmed && whatsappNumber.trim().length > 0
        ),
      },
      families: sortedFamilies,
      biographySections: visibleBiography,
      programEvents: sortedEvents,
      approvedTributes,
      approvedPhotos,
      attendances: sortedAttendances,
      backendStatus: {
        connected: true,
        storageEngine: activeStorageEngine,
        supabaseConfigured: Boolean(supabaseClient),
        sanityConfigured: Boolean(sanityClient),
      },
    });
  });

  // Public Presence Confirmation
  app.post('/api/attendances', async (req: Request, res: Response) => {
    const fullName = sanitizePlainString(req.body?.fullName, 140);
    const relationship = sanitizePlainString(req.body?.relationship, 140);
    const message = sanitizePlainString(req.body?.message, 500);
    const rawDays = Array.isArray(req.body?.selectedDays)
      ? req.body.selectedDays
      : [];
    const selectedDays = rawDays
      .map((d: unknown) => sanitizePlainString(d, 160))
      .filter(Boolean)
      .slice(0, 6);

    if (!fullName || fullName.length < 2) {
      res.status(400).json({
        error: 'Veuillez indiquer votre prénom et nom.',
      });
      return;
    }

    const item: AttendanceItem = {
      id: `att-${crypto.randomUUID()}`,
      fullName,
      relationship,
      selectedDays:
        selectedDays.length > 0 ? selectedDays : ['Présence aux cérémonies'],
      message,
      createdAt: new Date().toISOString(),
    };

    if (sanityClient) {
      sanityClient
        .create({
          _id: item.id,
          _type: 'attendance',
          ...item,
        })
        .catch(() => {});
    }

    store.attendances.unshift(item);
    saveStore(store);

    res.status(201).json({
      success: true,
      attendance: item,
    });
  });

  // Public Tribute / Condolence Submission
  app.post('/api/tributes', async (req: Request, res: Response) => {
    if (!store.settings.allowPublicTributes) {
      res.status(403).json({
        error:
          'La collecte en ligne des témoignages et condoléances est actuellement suspendue par la famille.',
      });
      return;
    }

    const authorFirstName = sanitizePlainString(req.body?.authorFirstName, 120);
    const authorLastName = sanitizePlainString(req.body?.authorLastName, 120);
    const relationship = sanitizePlainString(req.body?.relationship, 160);
    const message = sanitizePlainString(req.body?.message, 3000);
    const isPrivateToFamily = Boolean(req.body?.isPrivateToFamily);
    const consentPublication = Boolean(req.body?.consentPublication);

    if (!authorFirstName || authorFirstName.length < 2) {
      res.status(400).json({
        error: 'Veuillez indiquer votre prénom ou pseudonyme (au moins 2 caractères).',
      });
      return;
    }

    if (!message || message.length < 10) {
      res.status(400).json({
        error: 'Veuillez rédiger un message d’au moins 10 caractères.',
      });
      return;
    }

    if (!isPrivateToFamily && !consentPublication) {
      res.status(400).json({
        error:
          'Pour publier un témoignage dans le livre d’hommages public, veuillez cocher le consentement de publication.',
      });
      return;
    }

    const initialStatus: ContributionStatus = isPrivateToFamily
      ? 'pending'
      : 'approved';

    const newTribute: TributeItem = {
      id: `trib-${crypto.randomUUID()}`,
      authorFirstName,
      authorLastName,
      relationship,
      message,
      isPrivateToFamily,
      consentPublication: isPrivateToFamily ? false : consentPublication,
      status: initialStatus,
      createdAt: new Date().toISOString(),
    };

    if (sanityClient) {
      sanityClient
        .create({
          _id: newTribute.id,
          _type: 'tribute',
          ...newTribute,
        })
        .catch(() => {});
    }

    if (supabaseClient) {
      try {
        await supabaseClient.from('tributes').insert({
          author_first_name: newTribute.authorFirstName,
          author_last_name: newTribute.authorLastName,
          relationship: newTribute.relationship,
          message: newTribute.message,
          is_private_to_family: newTribute.isPrivateToFamily,
          consent_publication: newTribute.consentPublication,
          status: initialStatus,
        });
      } catch (err) {
        console.error('Supabase insert tribute error:', err);
      }
    }

    store.tributes.unshift(newTribute);
    saveStore(store);

    res.status(201).json({
      success: true,
      status: initialStatus,
      message: isPrivateToFamily
        ? 'Votre message privé a été enregistré à l’attention exclusive de la famille.'
        : 'Votre témoignage a été publié directement sur le site en hommage à Papa Tamfeu Ariel Schogun.',
      tributeId: newTribute.id,
    });
  });

  // Public Guest Photo Contribution
  app.post('/api/photos', async (req: Request, res: Response) => {
    if (!store.settings.allowGuestPhotos) {
      res.status(403).json({
        error:
          'L’envoi de photos par les invités n’est pas activé par la famille pour le moment.',
      });
      return;
    }

    const authorName = sanitizePlainString(req.body?.authorName, 120);
    const consentPublication = Boolean(req.body?.consentPublication);
    const categoryRaw = sanitizePlainString(req.body?.category, 40);
    const allowedCategories = [
      'portrait',
      'famille',
      'professionnel',
      'ceremonie',
      'souvenir',
    ] as const;
    const category = (allowedCategories as readonly string[]).includes(categoryRaw)
      ? (categoryRaw as PhotoItem['category'])
      : 'ceremonie';

    const items = Array.isArray(req.body?.items) ? req.body.items : [];

    if (!authorName || authorName.length < 2) {
      res.status(400).json({
        error: 'Veuillez indiquer votre nom avant de partager des photographies.',
      });
      return;
    }

    if (!consentPublication) {
      res.status(400).json({
        error:
          'Le consentement de publication et le respect de l’accord familial sont obligatoires.',
      });
      return;
    }

    if (items.length === 0 || items.length > 10) {
      res.status(400).json({
        error: 'Vous pouvez envoyer entre 1 et 10 photographies maximum par envoi.',
      });
      return;
    }

    const allowedMimes = ['image/jpeg', 'image/png', 'image/webp'];
    const createdPhotos: PhotoItem[] = [];

    for (const item of items) {
      const title =
        sanitizePlainString(item?.title, 140) || 'Souvenir photographique du deuil';
      const caption = sanitizePlainString(item?.caption, 500);
      const mimeType = sanitizePlainString(item?.mimeType, 40);
      const imageDataUrl =
        typeof item?.imageDataUrl === 'string' ? item.imageDataUrl : '';
      const fileSizeBytes = Number(item?.fileSizeBytes || 0);
      const exifStripped = Boolean(item?.exifStripped);

      if (!allowedMimes.includes(mimeType)) {
        res.status(400).json({
          error: `Format non autorisé (${mimeType}). Seuls les fichiers JPEG, PNG et WebP sont acceptés.`,
        });
        return;
      }

      if (fileSizeBytes <= 0 || fileSizeBytes > 10 * 1024 * 1024) {
        res.status(400).json({
          error: 'Chaque fichier doit avoir une taille inférieure ou égale à 10 Mo.',
        });
        return;
      }

      if (!imageDataUrl.startsWith(`data:${mimeType};base64,`)) {
        res.status(400).json({
          error: 'Les données de l’image sont invalides ou incomplètes.',
        });
        return;
      }

      if (!exifStripped) {
        res.status(400).json({
          error: 'Le retrait des métadonnées GPS/EXIF est requis avant l’envoi.',
        });
        return;
      }

      const photoRecord: PhotoItem = {
        id: `photo-${crypto.randomUUID()}`,
        title,
        caption,
        category,
        authorName,
        imageDataUrl,
        mimeType: mimeType as PhotoItem['mimeType'],
        fileSizeBytes,
        exifStripped: true,
        consentPublication: true,
        status: 'approved',
        createdAt: new Date().toISOString(),
      };

      createdPhotos.push(photoRecord);
    }

    store.photos.unshift(...createdPhotos);
    saveStore(store);

    res.status(201).json({
      success: true,
      count: createdPhotos.length,
      status: 'approved',
      message: `${createdPhotos.length} photographie(s) partagée(s) et publiée(s) directement dans l’album souvenir.`,
    });
  });

  // Request deletion of a published photo
  app.post('/api/photos/:id/request-deletion', (req: Request, res: Response) => {
    const { id } = req.params;
    const reason = sanitizePlainString(req.body?.reason, 500);
    const requesterName = sanitizePlainString(req.body?.requesterName, 120);

    const photo = store.photos.find((p) => p.id === id);
    if (!photo) {
      res.status(404).json({ error: 'Photographie introuvable.' });
      return;
    }

    if (!reason || reason.length < 5) {
      res.status(400).json({
        error: 'Veuillez préciser le motif de la demande de retrait (au moins 5 caractères).',
      });
      return;
    }

    photo.deletionRequested = true;
    photo.deletionReason = `${requesterName ? `[${requesterName}] ` : ''}${reason}`;
    saveStore(store);

    res.json({
      success: true,
      message:
        'Votre demande de retrait a été enregistrée et transmise à l’administration familiale.',
    });
  });

  // --------------------------------------------------------------------------
  // ADMIN AUTHENTICATION & MANAGEMENT ENDPOINTS
  // --------------------------------------------------------------------------

  app.get('/api/admin/auth-info', (_req: Request, res: Response) => {
    res.json({
      envPasswordConfigured: true,
      supabaseConfigured: Boolean(supabaseClient),
      sanityConfigured: Boolean(sanityClient),
    });
  });

  app.post('/api/admin/login', (req: Request, res: Response) => {
    const configuredUsername =
      process.env.ADMIN_USERNAME?.trim() || 'admin';
    const configuredPassword =
      process.env.ADMIN_PASSWORD?.trim() || 'admin2026';

    const submittedUsername =
      typeof req.body?.username === 'string'
        ? req.body.username.trim().toLowerCase()
        : '';
    const submittedPassword =
      typeof req.body?.password === 'string' ? req.body.password.trim() : '';

    if (!submittedUsername || !submittedPassword) {
      res.status(400).json({
        error:
          'Veuillez saisir le nom d’utilisateur (username) et le mot de passe du Super Administrateur.',
      });
      return;
    }

    const expectedUserLower = configuredUsername.toLowerCase();
    const isUsernameValid =
      safeCompareStrings(expectedUserLower, submittedUsername) ||
      safeCompareStrings('superadmin', submittedUsername);
    const isPasswordValid = safeCompareStrings(
      configuredPassword,
      submittedPassword
    );

    if (!isUsernameValid || !isPasswordValid) {
      res.status(401).json({
        error:
          'Identifiants Super Administrateur (username ou password) incorrects.',
      });
      return;
    }

    const token = crypto.randomBytes(32).toString('hex');
    activeAdminTokens.set(token, {
      username: submittedUsername,
      createdAt: Date.now(),
    });

    res.json({
      token,
      username: submittedUsername,
      envPasswordConfigured: true,
    });
  });

  app.post('/api/admin/logout', requireAdminAuth, (req: Request, res: Response) => {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
    activeAdminTokens.delete(token);
    res.json({ success: true });
  });

  app.get('/api/admin/data', requireAdminAuth, (_req: Request, res: Response) => {
    res.json({
      settings: store.settings,
      families: [...store.families].sort((a, b) => a.displayOrder - b.displayOrder),
      biographySections: [...store.biographySections].sort(
        (a, b) => a.displayOrder - b.displayOrder
      ),
      programEvents: [...store.programEvents].sort(
        (a, b) => a.displayOrder - b.displayOrder
      ),
      tributes: [...store.tributes].sort((a, b) =>
        a.createdAt < b.createdAt ? 1 : -1
      ),
      photos: [...store.photos].sort((a, b) =>
        a.createdAt < b.createdAt ? 1 : -1
      ),
      attendances: [...store.attendances].sort((a, b) =>
        a.createdAt < b.createdAt ? 1 : -1
      ),
      backendStatus: {
        connected: true,
        storageEngine: activeStorageEngine,
        supabaseConfigured: Boolean(supabaseClient),
        sanityConfigured: Boolean(sanityClient),
      },
    });
  });

  app.put('/api/admin/settings', requireAdminAuth, (req: Request, res: Response) => {
    const patch = req.body as Partial<MemorialSettings>;
    store.settings = {
      ...store.settings,
      displayName:
        typeof patch.displayName === 'string' && patch.displayName.trim()
          ? patch.displayName.trim()
          : store.settings.displayName,
      birthYear:
        typeof patch.birthYear === 'number'
          ? patch.birthYear
          : store.settings.birthYear,
      deathYear:
        typeof patch.deathYear === 'number'
          ? patch.deathYear
          : store.settings.deathYear,
      birthPlace:
        typeof patch.birthPlace === 'string'
          ? patch.birthPlace.trim()
          : store.settings.birthPlace,
      maritalStatus:
        typeof patch.maritalStatus === 'string'
          ? patch.maritalStatus.trim()
          : store.settings.maritalStatus,
      portraitUrl:
        typeof patch.portraitUrl === 'string'
          ? patch.portraitUrl.trim()
          : store.settings.portraitUrl,
      familyListConfirmed:
        typeof patch.familyListConfirmed === 'boolean'
          ? patch.familyListConfirmed
          : store.settings.familyListConfirmed,
      programConfirmed:
        typeof patch.programConfirmed === 'boolean'
          ? patch.programConfirmed
          : store.settings.programConfirmed,
      weekdayInconsistencyResolved:
        typeof patch.weekdayInconsistencyResolved === 'boolean'
          ? patch.weekdayInconsistencyResolved
          : store.settings.weekdayInconsistencyResolved,
      contactConfirmed:
        typeof patch.contactConfirmed === 'boolean'
          ? patch.contactConfirmed
          : store.settings.contactConfirmed,
      contactName:
        typeof patch.contactName === 'string'
          ? patch.contactName.trim()
          : store.settings.contactName,
      whatsappNumber:
        typeof patch.whatsappNumber === 'string'
          ? patch.whatsappNumber.trim()
          : store.settings.whatsappNumber,
      homeMapsUrl:
        typeof patch.homeMapsUrl === 'string'
          ? patch.homeMapsUrl.trim()
          : store.settings.homeMapsUrl,
      homeAddress:
        typeof patch.homeAddress === 'string'
          ? patch.homeAddress.trim()
          : store.settings.homeAddress,
      customMapImageUrl:
        typeof patch.customMapImageUrl === 'string'
          ? patch.customMapImageUrl.trim()
          : store.settings.customMapImageUrl,
      allowPublicTributes:
        typeof patch.allowPublicTributes === 'boolean'
          ? patch.allowPublicTributes
          : store.settings.allowPublicTributes,
      allowGuestPhotos:
        typeof patch.allowGuestPhotos === 'boolean'
          ? patch.allowGuestPhotos
          : store.settings.allowGuestPhotos,
      religiousSymbol:
        patch.religiousSymbol &&
        ['none', 'cross', 'olive_branch'].includes(patch.religiousSymbol)
          ? patch.religiousSymbol
          : store.settings.religiousSymbol,
      religiousSymbolConfirmed:
        typeof patch.religiousSymbolConfirmed === 'boolean'
          ? patch.religiousSymbolConfirmed
          : store.settings.religiousSymbolConfirmed,
      lastUpdatedAt: new Date().toISOString(),
    };

    saveStore(store);
    res.json({ success: true, settings: store.settings });
  });

  app.put('/api/admin/families', requireAdminAuth, (req: Request, res: Response) => {
    const families = req.body?.families;
    if (!Array.isArray(families)) {
      res.status(400).json({ error: 'Liste de familles invalide.' });
      return;
    }

    store.families = families
      .filter((f: any) => typeof f?.name === 'string' && f.name.trim().length > 0)
      .map((f: any, idx: number) => ({
        id: typeof f.id === 'string' && f.id ? f.id : `fam-${crypto.randomUUID()}`,
        name: f.name.trim(),
        category: [
          null,
          'paternelle',
          'maternelle',
          'belle_famille',
          'alliee',
        ].includes(f.category)
          ? f.category
          : null,
        note: typeof f.note === 'string' ? f.note.trim() : '',
        displayOrder: idx + 1,
      }));

    store.settings.familyNames = store.families.map((f) => f.name);
    store.settings.lastUpdatedAt = new Date().toISOString();
    saveStore(store);

    res.json({ success: true, families: store.families });
  });

  app.put('/api/admin/biography', requireAdminAuth, (req: Request, res: Response) => {
    const sections = req.body?.biographySections;
    if (!Array.isArray(sections)) {
      res.status(400).json({ error: 'Sections biographiques invalides.' });
      return;
    }

    store.biographySections = sections.map((s: any, idx: number) => ({
      id: typeof s.id === 'string' ? s.id : `bio-${idx}`,
      code: s.code,
      title: typeof s.title === 'string' ? s.title.trim() : '',
      content: typeof s.content === 'string' ? s.content.trim() : '',
      isVisiblePublic: Boolean(s.isVisiblePublic),
      isValidated: Boolean(s.isValidated),
      displayOrder: typeof s.displayOrder === 'number' ? s.displayOrder : idx + 1,
    }));

    store.settings.lastUpdatedAt = new Date().toISOString();
    saveStore(store);

    res.json({ success: true, biographySections: store.biographySections });
  });

  app.put('/api/admin/program', requireAdminAuth, (req: Request, res: Response) => {
    const events = req.body?.programEvents;
    if (!Array.isArray(events)) {
      res.status(400).json({ error: 'Événements du programme invalides.' });
      return;
    }

    store.programEvents = events.map((e: any, idx: number) => ({
      id: typeof e.id === 'string' && e.id ? e.id : `evt-${crypto.randomUUID()}`,
      dayKey: e.dayKey || 'jour_1',
      dayTitleTransmitted:
        typeof e.dayTitleTransmitted === 'string' ? e.dayTitleTransmitted.trim() : '',
      weekdayTransmitted:
        typeof e.weekdayTransmitted === 'string' ? e.weekdayTransmitted.trim() : '',
      dateConfirmed: Boolean(e.dateConfirmed),
      timeLabel: typeof e.timeLabel === 'string' ? e.timeLabel.trim() : '',
      timeConfirmed: Boolean(e.timeConfirmed),
      title: typeof e.title === 'string' ? e.title.trim() : '',
      location: typeof e.location === 'string' ? e.location.trim() : '',
      locationDetails:
        typeof e.locationDetails === 'string' ? e.locationDetails.trim() : '',
      locationConfirmed: Boolean(e.locationConfirmed),
      verificationNote:
        typeof e.verificationNote === 'string' ? e.verificationNote.trim() : '',
      displayOrder: idx + 1,
    }));

    store.settings.lastUpdatedAt = new Date().toISOString();
    saveStore(store);

    res.json({ success: true, programEvents: store.programEvents });
  });

  app.patch(
    '/api/admin/tributes/:id',
    requireAdminAuth,
    (req: Request, res: Response) => {
      const { id } = req.params;
      const status = req.body?.status as ContributionStatus;
      if (!['pending', 'approved', 'rejected'].includes(status)) {
        res.status(400).json({ error: 'Statut de modération invalide.' });
        return;
      }

      const tribute = store.tributes.find((t) => t.id === id);
      if (!tribute) {
        res.status(404).json({ error: 'Témoignage introuvable.' });
        return;
      }

      tribute.status = status;
      tribute.moderatedAt = new Date().toISOString();
      saveStore(store);

      res.json({ success: true, tribute });
    }
  );

  app.delete(
    '/api/admin/tributes/:id',
    requireAdminAuth,
    (req: Request, res: Response) => {
      const { id } = req.params;
      const initialLen = store.tributes.length;
      store.tributes = store.tributes.filter((t) => t.id !== id);
      if (store.tributes.length === initialLen) {
        res.status(404).json({ error: 'Témoignage introuvable.' });
        return;
      }
      if (sanityClient) {
        sanityClient.delete(id).catch(() => {});
      }
      saveStore(store);
      res.json({ success: true });
    }
  );

  app.patch(
    '/api/admin/photos/:id',
    requireAdminAuth,
    (req: Request, res: Response) => {
      const { id } = req.params;
      const status = req.body?.status as ContributionStatus | undefined;
      const clearDeletionRequest = Boolean(req.body?.clearDeletionRequest);
      const title =
        typeof req.body?.title === 'string'
          ? sanitizePlainString(req.body.title, 180)
          : undefined;
      const caption =
        typeof req.body?.caption === 'string'
          ? sanitizePlainString(req.body.caption, 800)
          : undefined;
      const category =
        typeof req.body?.category === 'string'
          ? sanitizePlainString(req.body.category, 40)
          : undefined;

      const photo = store.photos.find((p) => p.id === id);
      if (!photo) {
        res.status(404).json({ error: 'Photographie introuvable.' });
        return;
      }

      if (status && ['pending', 'approved', 'rejected'].includes(status)) {
        photo.status = status;
      }
      if (title !== undefined && title.length > 0) {
        photo.title = title;
      }
      if (caption !== undefined) {
        photo.caption = caption;
      }
      if (
        category &&
        ['portrait', 'famille', 'professionnel', 'ceremonie', 'souvenir'].includes(
          category
        )
      ) {
        photo.category = category as PhotoItem['category'];
      }
      if (clearDeletionRequest) {
        photo.deletionRequested = false;
        photo.deletionReason = '';
      }

      saveStore(store);
      res.json({ success: true, photo });
    }
  );

  app.delete(
    '/api/admin/photos/:id',
    requireAdminAuth,
    (req: Request, res: Response) => {
      const { id } = req.params;
      const initialLen = store.photos.length;
      store.photos = store.photos.filter((p) => p.id !== id);
      if (store.photos.length === initialLen) {
        res.status(404).json({ error: 'Photographie introuvable.' });
        return;
      }
      saveStore(store);
      res.json({ success: true });
    }
  );

  const injectAbsoluteOgMeta = (html: string, req: Request): string => {
    const protoHeader = req.headers['x-forwarded-proto'];
    const protocol =
      (Array.isArray(protoHeader) ? protoHeader[0] : protoHeader)?.split(',')[0] ||
      req.protocol ||
      'https';
    const host =
      req.headers['x-forwarded-host'] || req.headers.host || 'localhost:3000';
    const origin =
      process.env.APP_URL?.trim().replace(/\/$/, '') || `${protocol}://${host}`;
    const heroPath = store.settings.portraitUrl?.startsWith('/')
      ? store.settings.portraitUrl
      : '/assets/aistudio/Portrait_c_r_moniel_devant_la_chefferie_de_Bandjoun_f1aac569.png';
    const absoluteHeroImage = `${origin}${heroPath}`;

    return html.replace(
      /content="\/assets\/aistudio\/Portrait_c_r_moniel_devant_la_chefferie_de_Bandjoun_f1aac569\.png"/g,
      `content="${absoluteHeroImage}"`
    );
  };

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath, { index: false }));
    app.get('*', (req, res) => {
      const indexPath = path.join(distPath, 'index.html');
      if (fs.existsSync(indexPath)) {
        const rawHtml = fs.readFileSync(indexPath, 'utf-8');
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.send(injectAbsoluteOgMeta(rawHtml, req));
      } else {
        res.status(404).send('Not found');
      }
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Memorial server running on http://localhost:${PORT}`);
  });
}

startServer();

export type FamilyCategory =
  | null
  | 'paternelle'
  | 'maternelle'
  | 'belle_famille'
  | 'alliee';

export interface FamilyEntry {
  id: string;
  name: string;
  category: FamilyCategory;
  note?: string;
  displayOrder: number;
}

export interface BiographySection {
  id: string;
  code:
    | 'etat_civil'
    | 'scolaire_universitaire'
    | 'vie_professionnelle'
    | 'vie_familiale'
    | 'vie_associative'
    | 'vie_religieuse'
    | 'souvenir_transmission';
  title: string;
  content: string;
  isVisiblePublic: boolean;
  isValidated: boolean;
  displayOrder: number;
}

export interface ProgramEventItem {
  id: string;
  dayKey: 'veillee_sans_corps' | 'jour_1' | 'jour_2' | 'jour_3';
  dayTitleTransmitted: string;
  weekdayTransmitted: string;
  dateConfirmed: boolean;
  timeLabel: string;
  timeConfirmed: boolean;
  title: string;
  location: string;
  locationDetails: string;
  locationConfirmed: boolean;
  verificationNote: string;
  displayOrder: number;
}

export type ContributionStatus = 'pending' | 'approved' | 'rejected';

export interface TributeItem {
  id: string;
  authorFirstName: string;
  authorLastName: string;
  relationship: string;
  message: string;
  isPrivateToFamily: boolean;
  consentPublication: boolean;
  status: ContributionStatus;
  createdAt: string;
  moderatedAt?: string;
}

export interface PhotoItem {
  id: string;
  title: string;
  caption: string;
  category: 'portrait' | 'famille' | 'professionnel' | 'ceremonie' | 'souvenir';
  authorName: string;
  imageDataUrl: string;
  mimeType: 'image/jpeg' | 'image/png' | 'image/webp';
  fileSizeBytes: number;
  exifStripped: boolean;
  consentPublication: boolean;
  status: ContributionStatus;
  deletionRequested?: boolean;
  deletionReason?: string;
  createdAt: string;
}

export interface AttendanceItem {
  id: string;
  fullName: string;
  relationship: string;
  selectedDays: string[];
  message: string;
  createdAt: string;
}

export interface MemorialSettings {
  displayName: string;
  birthYear: number;
  deathYear: number;
  birthPlace: string;
  maritalStatus: string;
  portraitUrl: string;
  floralImageUrl: string;
  familyNames: string[];
  familyListConfirmed: boolean;
  programConfirmed: boolean;
  weekdayInconsistencyResolved: boolean;
  contactConfirmed: boolean;
  contactName: string;
  whatsappNumber: string;
  homeMapsUrl: string;
  homeAddress: string;
  customMapImageUrl: string;
  timeZone: string;
  allowPublicTributes: boolean;
  allowGuestPhotos: boolean;
  religiousSymbol: 'none' | 'cross' | 'olive_branch';
  religiousSymbolConfirmed: boolean;
  lastUpdatedAt: string;
}

export interface MemorialPublicPayload {
  settings: Omit<MemorialSettings, 'whatsappNumber'> & {
    whatsappNumber: string;
    hasUnconfirmedContactConfigured: boolean;
  };
  families: FamilyEntry[];
  biographySections: BiographySection[];
  programEvents: ProgramEventItem[];
  approvedTributes: TributeItem[];
  approvedPhotos: PhotoItem[];
  attendances: AttendanceItem[];
  backendStatus: {
    connected: boolean;
    storageEngine: 'sanity' | 'supabase' | 'server_persistent_json';
    supabaseConfigured: boolean;
    sanityConfigured?: boolean;
  };
}

export interface MemorialAdminPayload {
  settings: MemorialSettings;
  families: FamilyEntry[];
  biographySections: BiographySection[];
  programEvents: ProgramEventItem[];
  tributes: TributeItem[];
  photos: PhotoItem[];
  attendances: AttendanceItem[];
  backendStatus: {
    connected: boolean;
    storageEngine: 'sanity' | 'supabase' | 'server_persistent_json';
    supabaseConfigured: boolean;
    sanityConfigured?: boolean;
  };
}

export interface DraftTributeProposal {
  id: string;
  numberLabel: string;
  recipientOrTitle: string;
  suggestedRelationship: string;
  text: string;
  series: 'destinataires' | 'thematiques';
}

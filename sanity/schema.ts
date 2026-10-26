/**
 * Schémas Sanity CMS pour le site de faire-part et d'hommage :
 * Papa Tamfeu Ariel Schogun (1989 — 2026)
 * Project ID : 0q8sd30m | Organization ID : oh314dkvd
 */

export const memorialSchemas = [
  {
    name: 'memorialStore',
    title: 'Configuration & Données du Mémorial',
    type: 'document',
    fields: [
      { name: 'settings', title: 'Paramètres généraux', type: 'object' },
      {
        name: 'families',
        title: 'Familles annoncées',
        type: 'array',
        of: [{ type: 'object' }],
      },
      {
        name: 'biographySections',
        title: 'Sections de la biographie',
        type: 'array',
        of: [{ type: 'object' }],
      },
      {
        name: 'programEvents',
        title: 'Événements du programme',
        type: 'array',
        of: [{ type: 'object' }],
      },
      {
        name: 'tributes',
        title: 'Témoignages et condoléances',
        type: 'array',
        of: [{ type: 'object' }],
      },
      {
        name: 'photos',
        title: 'Souvenirs photographiques',
        type: 'array',
        of: [{ type: 'object' }],
      },
      {
        name: 'attendances',
        title: 'Confirmations de présence',
        type: 'array',
        of: [{ type: 'object' }],
      },
    ],
  },
  {
    name: 'tribute',
    title: 'Témoignage',
    type: 'document',
    fields: [
      { name: 'authorFirstName', title: 'Prénom', type: 'string' },
      { name: 'authorLastName', title: 'Nom', type: 'string' },
      { name: 'relationship', title: 'Lien avec le défunt', type: 'string' },
      { name: 'message', title: 'Message', type: 'text' },
      { name: 'isPrivateToFamily', title: 'Privé', type: 'boolean' },
      { name: 'consentPublication', title: 'Consentement', type: 'boolean' },
      { name: 'status', title: 'Statut', type: 'string' },
      { name: 'createdAt', title: 'Date de création', type: 'datetime' },
    ],
  },
  {
    name: 'attendance',
    title: 'Confirmation de présence',
    type: 'document',
    fields: [
      { name: 'fullName', title: 'Nom complet', type: 'string' },
      { name: 'relationship', title: 'Lien', type: 'string' },
      {
        name: 'selectedDays',
        title: 'Jours sélectionnés',
        type: 'array',
        of: [{ type: 'string' }],
      },
      { name: 'message', title: 'Message', type: 'text' },
      { name: 'createdAt', title: 'Date', type: 'datetime' },
    ],
  },
];

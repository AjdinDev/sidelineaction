export interface Photo {
  name: string;
  width: number;
  height: number;
}

export interface Shoot {
  slug: string;
  title: string;
  type: string;
  location: string;
  date?: string;
  cover: string;
  intro: string;
  hidden?: boolean;
  photos: Photo[];
}

const ternessePhotos: Photo[] = [
  ['ternesse-001', 900, 1350],
  ['ternesse-002', 900, 1350],
  ['ternesse-003', 900, 1350],
  ['ternesse-004', 900, 1350],
  ['ternesse-005', 900, 1350],
  ['ternesse-006', 900, 1338],
  ['ternesse-007', 900, 1350],
  ['ternesse-008', 900, 1350],
  ['ternesse-009', 900, 1350],
  ['ternesse-010', 900, 1350],
  ['ternesse-011', 900, 1350],
  ['ternesse-012', 900, 1350],
  ['ternesse-013', 900, 1350],
  ['ternesse-014', 900, 1200],
  ['ternesse-015', 900, 1350],
  ['ternesse-016', 900, 1350],
  ['ternesse-017', 900, 1277],
  ['ternesse-018', 900, 1350],
  ['ternesse-019', 900, 1350],
  ['ternesse-020', 900, 1196],
  ['ternesse-021', 900, 1350],
  ['ternesse-022', 900, 1378],
  ['ternesse-023', 900, 1438],
  ['ternesse-024', 900, 1350],
  ['ternesse-025', 900, 1350],
  ['ternesse-026', 900, 1293],
  ['ternesse-027', 900, 1200],
  ['ternesse-028', 900, 1350],
  ['ternesse-029', 900, 1350],
  ['ternesse-030', 900, 1350],
  ['ternesse-031', 900, 1350],
  ['ternesse-032', 900, 1350],
  ['ternesse-033', 900, 1350],
  ['ternesse-034', 900, 1350],
  ['ternesse-035', 900, 1350],
  ['ternesse-036', 900, 1350],
].map(([name, width, height]) => ({
  name: String(name),
  width: Number(width),
  height: Number(height),
}));

const otherMatchesPhotos: Photo[] = [
  ['img-0298', 900, 1350],
  ['img-0633', 900, 1350],
  ['img-6584', 900, 985],
  ['img-6585', 900, 1135],
  ['img-6586', 900, 1350],
  ['img-6587', 900, 1350],
  ['img-6588', 900, 1350],
  ['img-6589', 900, 600],
  ['img-6590', 900, 1350],
  ['img-6591', 900, 1350],
  ['img-6592', 900, 1350],
  ['img-6593', 900, 1350],
  ['img-6594', 900, 1350],
  ['img-6595', 900, 1350],
  ['img-6596', 900, 1350],
  ['img-6597', 900, 1350],
  ['img-6598', 900, 1350],
  ['img-6599', 900, 1350],
  ['img-6601', 900, 1350],
].map(([name, width, height]) => ({
  name: String(name),
  width: Number(width),
  height: Number(height),
}));

export const shoots: Shoot[] = [
  {
    slug: 'ternesse',
    title: 'Ternesse',
    type: 'Voetbalwedstrijd',
    location: 'Antwerpen en omgeving',
    cover: 'ternesse-002',
    intro: 'Een volledige wedstrijd, van de opwarming tot het laatste fluitsignaal.',
    photos: ternessePhotos,
  },
  {
    slug: 'andere-wedstrijden',
    title: 'Andere wedstrijden',
    type: 'Voetbalwedstrijden',
    location: 'Antwerpen en omgeving',
    cover: 'img-6584',
    intro: 'Een selectie van actie, spelers en momenten uit andere wedstrijden.',
    photos: otherMatchesPhotos,
  },
];

export const publishedShoots = shoots.filter((shoot) => !shoot.hidden && shoot.photos.length > 0);

export function photoUrl(shoot: Shoot, photo: Photo): string {
  return `/assets/img/${shoot.slug}/${photo.name}.webp`;
}

export function photoAlt(shoot: Shoot, index: number): string {
  return `${shoot.title} — ${shoot.type.toLowerCase()} in ${shoot.location} — foto ${index + 1} van Sideline Action`;
}

export function formatShootDate(date?: string): string | null {
  if (!date) return null;
  const parsed = new Date(`${date}T12:00:00`);
  if (Number.isNaN(parsed.valueOf())) return date;
  return new Intl.DateTimeFormat('nl-BE', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(parsed);
}

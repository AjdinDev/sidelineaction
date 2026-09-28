import { getCollection, type CollectionEntry } from 'astro:content';
import { getImage } from 'astro:assets';
import type { ImageMetadata } from 'astro';

type ShootData = Omit<CollectionEntry<'shoots'>['data'], 'type'>;

export type Shoot = ShootData & {
  slug: string;
  type: string;
  typeReference: string;
};

export interface RenderedPhoto {
  src: string;
  width: number;
  height: number;
}

function slugFromEntryId(id: string): string {
  const filename = id.replace(/\\/g, '/').split('/').pop() ?? id;
  return filename.replace(/\.[^.]+$/, '');
}

function validateShoot(shoot: Shoot): void {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(shoot.slug)) {
    throw new Error(`Portfolio-item "${shoot.title}" heeft een ongeldige URL-slug: ${shoot.slug}`);
  }

  const photoUrls = shoot.photos.map((photo) => photo.src);
  if (!photoUrls.includes(shoot.cover.src)) {
    throw new Error(`De cover van portfolio-item "${shoot.title}" staat niet in de fotogalerij.`);
  }

  if (new Set(photoUrls).size !== photoUrls.length) {
    throw new Error(`Portfolio-item "${shoot.title}" bevat dezelfde foto meer dan eens.`);
  }
}

export async function getPublishedShoots(): Promise<Shoot[]> {
  const [entries, typeEntries] = await Promise.all([
    getCollection('shoots', ({ data }) => data.published),
    getCollection('shootTypes'),
  ]);
  const typeNames = new Map(typeEntries.map((entry) => [slugFromEntryId(entry.id), entry.data.name]));
  const shoots = entries.map((entry) => {
    const typeReference = entry.data.type;
    const typeId = slugFromEntryId(typeReference);
    const type = typeNames.get(typeId);

    if (!type) {
      throw new Error(`Portfolio-item "${entry.data.title}" verwijst naar een onbekend type: ${typeReference}`);
    }

    return {
      ...entry.data,
      slug: slugFromEntryId(entry.id),
      type,
      typeReference,
    };
  });

  shoots.forEach(validateShoot);

  return shoots.sort((left, right) => (
    left.order - right.order
    || left.title.localeCompare(right.title, 'nl-BE')
  ));
}

export async function preparePhoto(photo: ImageMetadata): Promise<RenderedPhoto> {
  if (photo.format === 'webp') {
    return photo;
  }

  const optimized = await getImage({
    src: photo,
    format: 'webp',
    quality: 'high',
  });

  return {
    src: optimized.src,
    width: photo.width,
    height: photo.height,
  };
}

export function photoAlt(shoot: Shoot, index: number, brandName: string): string {
  return `${shoot.title}, ${shoot.type.toLowerCase()} in ${shoot.location}, foto ${index + 1} van ${brandName}`;
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

import { getCollection, type CollectionEntry } from 'astro:content';

export type SiteSettings = CollectionEntry<'site'>['data'];

function onlyEntry<T>(entries: T[], label: string): T {
  if (entries.length !== 1) {
    throw new Error(`${label} moet exact één contentbestand bevatten; gevonden: ${entries.length}.`);
  }

  return entries[0];
}

export async function getSiteSettings() {
  return onlyEntry(await getCollection('site'), 'Algemene instellingen').data;
}

export async function getHomePage() {
  return onlyEntry(await getCollection('homePage'), 'Homepage').data;
}

export async function getServicesPage() {
  return onlyEntry(await getCollection('servicesPage'), 'Dienstenpagina').data;
}

export async function getOfferPage() {
  return onlyEntry(await getCollection('offerPage'), 'Aanbodpagina').data;
}

export async function getAboutPage() {
  return onlyEntry(await getCollection('aboutPage'), 'Over-mij-pagina').data;
}

export async function getContactPage() {
  return onlyEntry(await getCollection('contactPage'), 'Contactpagina').data;
}

export async function getBookingPage() {
  return onlyEntry(await getCollection('bookingPage'), 'Boekingspagina').data;
}

export async function getCollaborationPage() {
  return onlyEntry(await getCollection('collaborationPage'), 'Samenwerkingspagina').data;
}

export async function getPortfolioPage() {
  return onlyEntry(await getCollection('portfolioPage'), 'Portfoliopagina').data;
}

export async function getNotFoundPage() {
  return onlyEntry(await getCollection('notFoundPage'), '404-pagina').data;
}

export async function getThanksPage() {
  return onlyEntry(await getCollection('thanksPage'), 'Bedanktpagina').data;
}

function siteTokenValues(settings: SiteSettings): Record<string, string> {
  return {
    brand_name: settings.brand_name,
    photographer_name: settings.photographer_name,
    photographer_age: String(settings.photographer_age),
    region: settings.region,
    region_full: settings.region_full,
    email: settings.contact.email,
    instagram_handle: settings.contact.instagram_handle,
    tiktok_handle: settings.contact.tiktok_handle,
    delivery_days: String(settings.commitments.delivery_days),
    photo_minimum: String(settings.commitments.photo_minimum),
    photo_range: settings.commitments.photo_range,
    delivery_format: settings.commitments.delivery_format,
  };
}

export function resolveSiteText(value: string, settings: SiteSettings): string {
  const tokens = siteTokenValues(settings);
  return value.replace(/\{([a-z_]+)\}/g, (_match, name: string) => {
    const replacement = tokens[name];
    if (replacement === undefined) {
      throw new Error(`Onbekende contenttoken: {${name}}`);
    }

    return replacement;
  });
}

export function resolveSiteTokens<T>(value: T, settings: SiteSettings): T {
  if (typeof value === 'string') {
    return resolveSiteText(value, settings) as T;
  }

  if (Array.isArray(value)) {
    return value.map((item) => resolveSiteTokens(item, settings)) as T;
  }

  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [key, resolveSiteTokens(item, settings)]),
    ) as T;
  }

  return value;
}

export function slugFromContentReference(reference: string): string {
  const filename = reference.replace(/\\/g, '/').split('/').pop() ?? reference;
  return filename.replace(/\.[^.]+$/, '');
}

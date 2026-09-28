import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const requiredText = z.string().trim().min(1);
const siteImage = z.object({
  src: z.string().regex(/^\/assets\/img\/site\/[a-zA-Z0-9/_-]+\.(?:avif|jpe?g|png|webp)$/),
  alt: requiredText,
});
const seo = z.object({
  title: requiredText,
  description: requiredText,
  image: z.string().optional(),
});
const pageHeader = z.object({
  label: requiredText,
  title: requiredText,
  intro: requiredText,
});
const textItem = z.object({
  title: requiredText,
  text: requiredText,
});
const fact = z.object({
  value: requiredText,
  label: requiredText,
});
const callToAction = z.object({
  label: requiredText,
  title: requiredText,
  text: requiredText,
  primary_label: requiredText,
  secondary_label: requiredText.optional(),
  image: siteImage,
});

const isoDate = z.string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine((value) => {
    const [year, month, day] = value.split('-').map(Number);
    const date = new Date(Date.UTC(year, month - 1, day));

    return date.getUTCFullYear() === year
      && date.getUTCMonth() === month - 1
      && date.getUTCDate() === day;
  }, 'Gebruik een geldige datum in het formaat JJJJ-MM-DD.');

const singletonLoader = (pattern: string) => glob({ base: './src/content', pattern });

const shoots = defineCollection({
  loader: glob({
    base: './src/content/shoots',
    pattern: '**/*.{md,mdx}',
  }),
  schema: ({ image }) => z.object({
    title: requiredText,
    type: requiredText,
    location: requiredText,
    date: z.preprocess(
      (value) => {
        if (value === '' || value === null) return undefined;
        if (value instanceof Date) return value.toISOString().slice(0, 10);
        return value;
      },
      isoDate.optional(),
    ),
    intro: requiredText,
    published: z.boolean().default(true),
    order: z.number().int().min(0).default(0),
    cover: image(),
    photos: z.array(image()).min(1),
  }),
});

const shootTypes = defineCollection({
  loader: glob({
    base: './src/content/shoot-types',
    pattern: '**/*.{yml,yaml}',
  }),
  schema: z.object({
    name: requiredText,
  }),
});

const site = defineCollection({
  loader: singletonLoader('site/settings.yml'),
  schema: z.object({
  brand_name: requiredText,
  photographer_name: requiredText,
  photographer_age: z.number().int().min(1).max(120),
  region: requiredText,
  region_full: requiredText,
  contact: z.object({
    email: z.email(),
    instagram_url: z.url(),
    instagram_handle: requiredText,
    tiktok_url: z.url(),
    tiktok_handle: requiredText,
  }),
  commitments: z.object({
    delivery_days: z.number().int().min(1).max(365),
    photo_minimum: z.number().int().min(1),
    photo_range: requiredText,
    delivery_format: requiredText,
  }),
  navigation: z.object({
    home: requiredText,
    portfolio: requiredText,
    services: requiredText,
    offer: requiredText,
    about: requiredText,
    contact: requiredText,
    booking: requiredText,
    collaboration: requiredText,
    menu: requiredText,
  }),
  footer: z.object({
    tagline: requiredText,
    navigation_heading: requiredText,
    contact_heading: requiredText,
    collaboration_label: requiredText,
  }),
  default_og_image: siteImage,
  }),
});

const homePage = defineCollection({
  loader: singletonLoader('pages/home.yml'),
  schema: ({ image }) => z.object({
  seo,
  hero: z.object({
    eyebrow: requiredText,
    title_lines: z.array(requiredText).min(1).max(3),
    subtitle: requiredText,
    primary_label: requiredText,
    secondary_label: requiredText,
    meta: requiredText,
    image: siteImage,
  }),
  intro: z.object({
    label: requiredText,
    title: requiredText,
    lead: requiredText,
    text: requiredText,
    link_label: requiredText,
    images: z.array(siteImage).length(2),
  }),
  featured: z.object({
    label: requiredText,
    shoot: requiredText,
    text: requiredText,
    link_label: requiredText,
    portfolio_label: requiredText,
    caption: requiredText,
    images: z.array(image()).length(3),
  }),
  band_image: siteImage,
  services: z.object({
    label: requiredText,
    title: requiredText,
    text: requiredText,
    link_label: requiredText,
    items: z.array(textItem).min(1),
  }),
  about: z.object({
    label: requiredText,
    title: requiredText,
    lead: requiredText,
    text: requiredText,
    link_label: requiredText,
    image: siteImage,
  }),
  facts: z.object({
    label: requiredText,
    items: z.array(fact).min(1),
  }),
  offer: z.object({
    label: requiredText,
    title: requiredText,
    text: requiredText,
    email_label: requiredText,
    instagram_label: requiredText,
    link_label: requiredText,
  }),
  booking: callToAction,
  contact: z.object({
    label: requiredText,
    title_lines: z.array(requiredText).min(1).max(3),
  }),
  }),
});

const servicesPage = defineCollection({
  loader: singletonLoader('pages/services.yml'),
  schema: z.object({
  seo,
  header: pageHeader,
  audiences: z.array(textItem.extend({ link_label: requiredText })).min(1),
  gallery: z.object({
    label: requiredText,
    title: requiredText,
    intro: requiredText,
    items: z.array(textItem.extend({ summary: requiredText, image: siteImage })).min(1),
  }),
  process: z.object({
    label: requiredText,
    title: requiredText,
    intro: requiredText,
    steps: z.array(textItem).min(1),
  }),
  facts: z.object({
    label: requiredText,
    items: z.array(fact).min(1),
  }),
  cta: callToAction,
  }),
});

const offerPage = defineCollection({
  loader: singletonLoader('pages/offer.yml'),
  schema: z.object({
  seo,
  header: pageHeader,
  overview: z.object({
    image: siteImage,
    items: z.array(requiredText).min(1),
    button_label: requiredText,
  }),
  faq: z.object({
    label: requiredText,
    items: z.array(textItem).min(1),
  }),
  agreements: z.object({
    title: requiredText,
    text: requiredText,
    link_label: requiredText,
  }),
  cta: callToAction,
  }),
});

const aboutPage = defineCollection({
  loader: singletonLoader('pages/about.yml'),
  schema: z.object({
  seo,
  header: pageHeader,
  story: z.object({
    label: requiredText,
    paragraphs: z.array(requiredText).min(1),
    link_label: requiredText,
    image: siteImage,
  }),
  equipment: z.object({
    label: requiredText,
    title: requiredText,
    intro: requiredText,
    items: z.array(z.object({ name: requiredText, description: requiredText })).min(1),
  }),
  process: z.object({
    label: requiredText,
    title: requiredText,
    intro: requiredText,
    steps: z.array(textItem).min(1),
  }),
  cta: callToAction,
  }),
});

const contactPage = defineCollection({
  loader: singletonLoader('pages/contact.yml'),
  schema: z.object({
  seo,
  header: pageHeader,
  company_label: requiredText,
  photographer_label: requiredText,
  email_label: requiredText,
  instagram_label: requiredText,
  tiktok_label: requiredText,
  region_label: requiredText,
  booking_note: z.object({ title: requiredText, text: requiredText, button_label: requiredText }),
  image: siteImage,
  }),
});

const bookingPage = defineCollection({
  loader: singletonLoader('pages/booking.yml'),
  schema: z.object({
  seo,
  header: pageHeader,
  sidebar: z.object({
    label: requiredText,
    items: z.array(requiredText).min(1),
    direct_email_label: requiredText,
    image: siteImage,
  }),
  privacy_text: requiredText,
  submit_label: requiredText,
  }),
});

const collaborationPage = defineCollection({
  loader: singletonLoader('pages/collaboration.yml'),
  schema: z.object({
  seo,
  header: pageHeader,
  terms: z.array(textItem).min(1),
  privacy: z.object({
    label: requiredText,
    title: requiredText,
    intro: requiredText,
    items: z.array(requiredText).min(1),
    closing: requiredText,
  }),
  cta: callToAction,
  }),
});

const portfolioPage = defineCollection({
  loader: singletonLoader('pages/portfolio.yml'),
  schema: z.object({
  seo,
  header: pageHeader,
  empty: z.object({ title: requiredText, text: requiredText }),
  detail: z.object({
    home_label: requiredText,
    portfolio_label: requiredText,
    type_label: requiredText,
    location_label: requiredText,
    date_label: requiredText,
    photos_label: requiredText,
    next_label: requiredText,
  }),
  cta: callToAction,
  detail_cta: callToAction,
  }),
});

const notFoundPage = defineCollection({
  loader: singletonLoader('pages/not-found.yml'),
  schema: z.object({
  seo,
  label: requiredText,
  title: requiredText,
  text: requiredText,
  primary_label: requiredText,
  secondary_label: requiredText,
  }),
});

const thanksPage = defineCollection({
  loader: singletonLoader('pages/thanks.yml'),
  schema: z.object({
  seo,
  label: requiredText,
  title: requiredText,
  text: requiredText,
  follow_up_text: requiredText,
  portfolio_label: requiredText,
  home_label: requiredText,
  }),
});

export const collections = {
  shoots,
  shootTypes,
  site,
  homePage,
  servicesPage,
  offerPage,
  aboutPage,
  contactPage,
  bookingPage,
  collaborationPage,
  portfolioPage,
  notFoundPage,
  thanksPage,
};

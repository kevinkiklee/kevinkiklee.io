import type { Crumb } from './crumbs';
import { SITE as SITE_CONFIG } from './site-config';

const SITE = SITE_CONFIG.url;

export const ENTITY_IDS = {
  website: `${SITE}#website`,
  person: `${SITE}/about#person`,
  blog: `${SITE}/posts#blog`,
} as const;

type GraphPart = Record<string, unknown>;

/**
 * Compose multiple JSON-LD entities into a single @graph wrapper.
 * Deduplicates by @id: a "full" entity (more keys) replaces a bare ref.
 */
export function buildPageGraph(parts: GraphPart[]): {
  '@context': 'https://schema.org';
  '@graph': GraphPart[];
} {
  const byId = new Map<string, GraphPart>();
  const noId: GraphPart[] = [];

  for (const part of parts) {
    const id = part['@id'];
    if (typeof id !== 'string') {
      noId.push(part);
      continue;
    }
    const existing = byId.get(id);
    if (!existing) {
      byId.set(id, part);
      continue;
    }
    if (Object.keys(part).length > Object.keys(existing).length) {
      byId.set(id, part);
    }
  }

  return {
    '@context': 'https://schema.org',
    '@graph': [...byId.values(), ...noId],
  };
}

const HEADLINE_MAX = 110;

export interface BlogPostingArgs {
  url: string;
  title: string;
  description: string;
  pubDate: Date;
  updatedDate?: Date | undefined;
  tags: string[];
  imageUrl: string;
  wordCount?: number | undefined;
  minutesRead?: number | undefined;
  authorUrl: string;
  faq?: { q: string; a: string }[] | undefined;
  license?: string | undefined;
}

export function buildBlogPosting(args: BlogPostingArgs) {
  if (args.title.length > HEADLINE_MAX) {
    throw new Error(`headline exceeds ${HEADLINE_MAX} chars: ${args.title.length}`);
  }
  const out: Record<string, unknown> = {
    '@type': 'BlogPosting',
    '@id': args.url,
    mainEntityOfPage: { '@type': 'WebPage', '@id': args.url },
    isPartOf: { '@id': ENTITY_IDS.blog },
    headline: args.title,
    description: args.description,
    image: args.imageUrl,
    primaryImageOfPage: { '@type': 'ImageObject', url: args.imageUrl },
    datePublished: args.pubDate.toISOString(),
    dateModified: (args.updatedDate ?? args.pubDate).toISOString(),
    author: buildAuthorRef(),
    publisher: buildAuthorRef(),
    keywords: args.tags.join(','),
    inLanguage: 'en-US',
    speakable: buildSpeakable(),
    accessibilityFeature: ['structuralNavigation', 'highContrastDisplay'],
    accessibilityHazard: 'none',
    accessibilityAPI: 'ARIA',
  };
  if (args.tags[0]) out.articleSection = args.tags[0];
  if (args.wordCount) out.wordCount = args.wordCount;
  if (args.minutesRead) out.timeRequired = `PT${args.minutesRead}M`;
  if (args.faq && args.faq.length > 0) {
    out.mainEntity = {
      '@type': 'FAQPage',
      mainEntity: args.faq.map((f) => ({
        '@type': 'Question',
        name: f.q,
        acceptedAnswer: { '@type': 'Answer', text: f.a },
      })),
    };
  }
  if (args.license) {
    out.license = args.license;
    out.copyrightYear = args.pubDate.getUTCFullYear();
  }
  return out;
}

const KNOWS_ABOUT = [
  'Web platform',
  'Chrome DevTools',
  'Developer Relations',
  'JavaScript',
  'AI tooling',
  'Web performance',
  'Browser engines',
] as const;

export interface PersonArgs {
  mastodon: string;
  github: string;
  bio: string;
  linkedin?: string | undefined;
  bluesky?: string | undefined;
  portraitUrl?: string | undefined;
}

export function buildPerson(args: PersonArgs) {
  const sameAs = [args.mastodon, args.github, args.linkedin, args.bluesky].filter(
    (s): s is string => typeof s === 'string' && s.length > 0,
  );
  const out: Record<string, unknown> = {
    '@type': 'Person',
    '@id': ENTITY_IDS.person,
    name: SITE_CONFIG.author,
    url: `${SITE}/about`,
    jobTitle: SITE_CONFIG.jobTitle,
    worksFor: { '@type': 'Organization', name: SITE_CONFIG.org },
    description: args.bio,
    knowsAbout: [...KNOWS_ABOUT],
    sameAs,
  };
  if (args.portraitUrl) out.image = args.portraitUrl;
  return out;
}

export function buildWebSite() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_CONFIG.title,
    url: SITE,
    potentialAction: {
      '@type': 'SearchAction',
      target: { '@type': 'EntryPoint', urlTemplate: `${SITE}/search?q={query}` },
      'query-input': 'required name=query',
    },
  } as const;
}

export function buildBreadcrumbs(items: Crumb[], origin: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((it, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: it.name,
      item: new URL(it.url, origin).toString(),
    })),
  } as const;
}

export const SPEAKABLE_SELECTORS = ['.lead', 'h1'] as const;

export function buildSpeakable() {
  return {
    '@type': 'SpeakableSpecification',
    cssSelector: [...SPEAKABLE_SELECTORS],
  } as const;
}

export function buildAuthorRef() {
  return { '@id': ENTITY_IDS.person } as const;
}

export function buildBlog() {
  return {
    '@type': 'Blog',
    '@id': ENTITY_IDS.blog,
    name: SITE_CONFIG.title,
    url: `${SITE}/posts`,
    inLanguage: 'en-US',
    publisher: { '@id': ENTITY_IDS.person },
  } as const;
}

export interface WebPageArgs {
  url: string;
  name: string;
  description: string;
  accessibilityFeature?: string[] | undefined;
  accessibilityHazard?: string | undefined;
  accessibilityAPI?: string | undefined;
}

export function buildWebPage(args: WebPageArgs): Record<string, unknown> {
  const out: Record<string, unknown> = {
    '@type': 'WebPage',
    '@id': args.url,
    name: args.name,
    description: args.description,
    inLanguage: 'en-US',
  };
  if (args.accessibilityFeature) out.accessibilityFeature = args.accessibilityFeature;
  if (args.accessibilityHazard !== undefined) out.accessibilityHazard = args.accessibilityHazard;
  if (args.accessibilityAPI !== undefined) out.accessibilityAPI = args.accessibilityAPI;
  return out;
}

export function buildCollectionPage(args: {
  url: string;
  name: string;
  description: string;
  itemListId: string;
}) {
  return {
    '@type': 'CollectionPage',
    '@id': args.url,
    name: args.name,
    description: args.description,
    inLanguage: 'en-US',
    mainEntity: { '@id': args.itemListId },
  } as const;
}

export function buildItemListOfBlogPostings(args: {
  id: string;
  posts: { url: string; title: string }[];
}) {
  return {
    '@type': 'ItemList',
    '@id': args.id,
    itemListElement: args.posts.map((p, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      url: p.url,
      name: p.title,
      item: { '@id': p.url },
    })),
  } as const;
}

export function buildItemListOfSoftwareSourceCode(args: {
  id: string;
  projects: {
    name: string;
    url: string;
    repoUrl?: string | undefined;
    blurb: string;
    tech: string[];
  }[];
}) {
  return {
    '@type': 'ItemList',
    '@id': args.id,
    itemListElement: args.projects.map((p, i) => {
      const item: Record<string, unknown> = {
        '@type': 'SoftwareSourceCode',
        name: p.name,
        url: p.url,
        description: p.blurb,
      };
      if (p.repoUrl) item.codeRepository = p.repoUrl;
      if (p.tech.length > 0) item.programmingLanguage = p.tech;
      return {
        '@type': 'ListItem',
        position: i + 1,
        url: p.url,
        name: p.name,
        item,
      };
    }),
  } as const;
}

export function buildItemListOfDefinedTerms(args: {
  id: string;
  tags: { name: string; url: string }[];
}) {
  return {
    '@type': 'ItemList',
    '@id': args.id,
    itemListElement: args.tags.map((t, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      url: t.url,
      name: t.name,
      item: {
        '@type': 'DefinedTerm',
        name: t.name,
        url: t.url,
      },
    })),
  } as const;
}

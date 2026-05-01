const SITE = 'https://kevinkiklee.io';
const PERSON_REF = { '@type': 'Person', name: 'Kevin Lee', url: `${SITE}/about` } as const;

export const ENTITY_IDS = {
  website: 'https://kevinkiklee.io#website',
  person: 'https://kevinkiklee.io/about#person',
  blog: 'https://kevinkiklee.io/posts#blog',
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

export function buildBlogPosting(args: {
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
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    mainEntityOfPage: { '@type': 'WebPage', '@id': args.url },
    headline: args.title,
    description: args.description,
    image: args.imageUrl,
    datePublished: args.pubDate.toISOString(),
    dateModified: (args.updatedDate ?? args.pubDate).toISOString(),
    author: PERSON_REF,
    publisher: PERSON_REF,
    keywords: args.tags.join(','),
    inLanguage: 'en-US',
    ...(args.wordCount && { wordCount: args.wordCount }),
    ...(args.minutesRead && { timeRequired: `PT${args.minutesRead}M` }),
  } as const;
}

export function buildPerson(args: { mastodon: string; github: string; linkedin?: string }) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: 'Kevin Lee',
    url: `${SITE}/about`,
    jobTitle: 'Developer Relations Engineer',
    worksFor: { '@type': 'Organization', name: 'Google Chrome' },
    sameAs: [args.mastodon, args.github, args.linkedin].filter(Boolean),
  } as const;
}

export function buildWebSite() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'kevinkiklee.io',
    url: SITE,
    potentialAction: {
      '@type': 'SearchAction',
      target: { '@type': 'EntryPoint', urlTemplate: `${SITE}/search?q={query}` },
      'query-input': 'required name=query',
    },
  } as const;
}

export function buildBreadcrumbs(items: { name: string; url: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((it, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: it.name,
      item: it.url,
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
    name: 'kevinkiklee.io',
    url: 'https://kevinkiklee.io/posts',
    inLanguage: 'en-US',
    publisher: { '@id': ENTITY_IDS.person },
  } as const;
}

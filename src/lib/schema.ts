const SITE = 'https://kevinkiklee.io';
const PERSON_REF = { '@type': 'Person', name: 'Kevin Lee', url: `${SITE}/about` } as const;

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
  hasHeadings?: boolean | undefined;
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
    ...(args.hasHeadings && { speakable: buildSpeakable() }),
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

/**
 * Speakable schema fragment for AEO read-aloud surfaces (Google Assistant,
 * Perplexity). Points to article H2/H3 headings as the speakable content.
 *
 * Designed to be merged into a BlogPosting via `speakable: buildSpeakable()`.
 */
export function buildSpeakable() {
  return {
    '@type': 'SpeakableSpecification',
    xpath: ['/html/body//article//h2', '/html/body//article//h3'],
  } as const;
}

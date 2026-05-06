module.exports = {
  ci: {
    collect: {
      url: [
        'http://localhost:4321/',
        'http://localhost:4321/posts',
        'http://localhost:4321/posts/hello-world',
        'http://localhost:4321/about',
        'http://localhost:4321/search',
      ],
      numberOfRuns: 1,
    },
    assert: {
      // Per-URL category floors. Accessibility is the strict gate (1.0 most
      // routes; 0.92 on home where the wontfix homepage h2-first structure
      // costs points). Performance / best-practices / SEO floors are
      // conservative starting values; tighten as the site stabilises.
      assertMatrix: [
        {
          matchingUrlPattern: 'http://localhost:4321/$',
          assertions: {
            'categories:accessibility': ['error', { minScore: 0.92 }],
            'categories:performance': ['error', { minScore: 0.9 }],
            'categories:best-practices': ['error', { minScore: 0.9 }],
            'categories:seo': ['error', { minScore: 0.9 }],
          },
        },
        {
          matchingUrlPattern: 'http://localhost:4321/posts$',
          assertions: {
            'categories:accessibility': ['error', { minScore: 1.0 }],
            'categories:performance': ['error', { minScore: 0.9 }],
            'categories:best-practices': ['error', { minScore: 0.9 }],
            'categories:seo': ['error', { minScore: 0.9 }],
          },
        },
        {
          matchingUrlPattern: 'http://localhost:4321/posts/hello-world$',
          assertions: {
            'categories:accessibility': ['error', { minScore: 1.0 }],
            'categories:performance': ['error', { minScore: 0.9 }],
            'categories:best-practices': ['error', { minScore: 0.9 }],
            'categories:seo': ['error', { minScore: 0.9 }],
          },
        },
        {
          matchingUrlPattern: 'http://localhost:4321/about$',
          assertions: {
            'categories:accessibility': ['error', { minScore: 1.0 }],
            'categories:performance': ['error', { minScore: 0.9 }],
            'categories:best-practices': ['error', { minScore: 0.9 }],
            'categories:seo': ['error', { minScore: 0.9 }],
          },
        },
        {
          matchingUrlPattern: 'http://localhost:4321/search$',
          assertions: {
            'categories:accessibility': ['error', { minScore: 1.0 }],
            'categories:performance': ['error', { minScore: 0.9 }],
            'categories:best-practices': ['error', { minScore: 0.9 }],
            'categories:seo': ['error', { minScore: 0.9 }],
          },
        },
      ],
    },
    upload: { target: 'temporary-public-storage' },
  },
};

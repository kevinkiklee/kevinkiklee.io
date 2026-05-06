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
      // Per-URL accessibility floors (Phase 4 lifts all to 1.0 once Phase 3 fixes land)
      // Non-a11y performance/quality assertions are out of scope for this PR.
      assertMatrix: [
        {
          matchingUrlPattern: 'http://localhost:4321/$',
          assertions: { 'categories:accessibility': ['error', { minScore: 0.92 }] },
        },
        {
          matchingUrlPattern: 'http://localhost:4321/posts$',
          assertions: { 'categories:accessibility': ['error', { minScore: 1.0 }] },
        },
        {
          matchingUrlPattern: 'http://localhost:4321/posts/hello-world$',
          assertions: { 'categories:accessibility': ['error', { minScore: 1.0 }] },
        },
        {
          matchingUrlPattern: 'http://localhost:4321/about$',
          assertions: { 'categories:accessibility': ['error', { minScore: 1.0 }] },
        },
        {
          matchingUrlPattern: 'http://localhost:4321/search$',
          assertions: { 'categories:accessibility': ['error', { minScore: 1.0 }] },
        },
      ],
    },
    upload: { target: 'temporary-public-storage' },
  },
};

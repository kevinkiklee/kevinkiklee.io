module.exports = {
  version: '0.2',
  language: 'en',
  words: [],
  dictionaryDefinitions: [{ name: 'project-words', path: './cspell-words.txt', addWords: true }],
  dictionaries: ['project-words'],
  ignorePaths: [
    'dist',
    '.astro',
    'node_modules',
    'pnpm-lock.yaml',
    'docs/',
    // Transient audit artifacts (gitignored). Match the .gitignore entries so
    // spell-check doesn't trip on machine-generated tokens like axe rule ids.
    'a11y-findings.md',
    'a11y-findings.json',
    'audit-static-review.md',
    'audit-axe-raw.json',
  ],
};

module.exports = {
  version: '0.2',
  language: 'en',
  words: [],
  dictionaryDefinitions: [{ name: 'project-words', path: './cspell-words.txt', addWords: true }],
  // 'lorem-ipsum' is a cspell built-in (off by default): the site content is
  // placeholder Latin while under construction.
  dictionaries: ['project-words', 'lorem-ipsum'],
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
  ],
};

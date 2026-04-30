module.exports = {
  version: '0.2',
  language: 'en',
  words: [],
  dictionaryDefinitions: [
    { name: 'project-words', path: './cspell-words.txt', addWords: true },
  ],
  dictionaries: ['project-words'],
  ignorePaths: ['dist', '.astro', 'node_modules', 'pnpm-lock.yaml'],
};

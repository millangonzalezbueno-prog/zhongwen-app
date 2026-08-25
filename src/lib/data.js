let _characters = null;
let _vocab = null;
let _grammar = null;

export async function loadCharacters() {
  if (!_characters) {
    const res = await fetch('/data/characters.json');
    _characters = await res.json();
  }
  return _characters;
}

export async function loadVocab() {
  if (!_vocab) {
    const res = await fetch('/data/vocab.json');
    _vocab = await res.json();
  }
  return _vocab;
}

export async function loadGrammar() {
  if (!_grammar) {
    const res = await fetch('/data/grammar.json');
    _grammar = await res.json();
  }
  return _grammar;
}

export function filterByTier(items, tiers) {
  const tierSet = new Set(tiers);
  return items.filter(item => tierSet.has(item.intro_tier || item.tier));
}

export function filterByTheme(items, theme) {
  return items.filter(item => {
    if (Array.isArray(item.themes)) return item.themes.includes(theme);
    return item.theme === theme;
  });
}

export function getNewAtB1(characters) {
  return characters.filter(c => c.new_at_B1);
}

export function getGapChars(characters) {
  return characters.filter(c => c.gap_char);
}

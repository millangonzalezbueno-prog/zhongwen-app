import { pinyin } from 'pinyin-pro';

const HAN = /[一-鿿]/;
const MAX_WORD = 6;
const norm = (p) => (p || '').toLowerCase().replace(/[\s·]/g, '');

// One merged entry per word: class material first (French glosses), CC-CEDICT as the fallback.
export function buildDict({ lessons = [], vocab = [], characters = [], glossary = {} }) {
  const dict = new Map();
  const get = (w) => {
    if (!dict.has(w)) dict.set(w, { word: w, lessons: [] });
    return dict.get(w);
  };
  for (const l of lessons) {
    for (const v of l.vocab) {
      const e = get(v.word);
      e.pinyin ??= v.pinyin;
      e.fr ??= v.gloss_fr;
      e.en ??= v.gloss_en;
      if (!e.lessons.includes(l.id)) e.lessons.push(l.id);
    }
  }
  for (const v of vocab) {
    const e = get(v.word);
    e.pinyin ??= v.pinyin_marked;
    e.fr ??= v.gloss_fr;
    e.en ??= v.gloss_en;
  }
  for (const c of characters) {
    const e = get(c.hanzi);
    e.pinyin ??= c.pinyin_marked;
    e.fr ??= c.gloss_fr;
    e.en ??= c.gloss_en;
    e.char = c;
  }
  for (const [w, readings] of Object.entries(glossary)) {
    get(w).readings = readings;
  }
  return dict;
}

// Contextual pinyin for every character of a string (null for non-Han characters).
export function contextPinyin(text) {
  const out = pinyin(text, { type: 'all' }).map(x => (x.isZh ? x.pinyin : null));
  return out.length === text.length ? out : [...text].map(ch => (HAN.test(ch) ? pinyin(ch) : null));
}

// Greedy longest-match segmentation; unknown characters become their own token.
export function segment(text, dict) {
  const py = contextPinyin(text);
  const tokens = [];
  let i = 0;
  while (i < text.length) {
    if (!HAN.test(text[i])) {
      let j = i;
      while (j < text.length && !HAN.test(text[j])) j++;
      tokens.push({ text: text.slice(i, j), han: false });
      i = j;
      continue;
    }
    let len = 1;
    for (let n = Math.min(MAX_WORD, text.length - i); n > 1; n--) {
      const cand = text.slice(i, i + n);
      if (HAN.test(cand[n - 1]) && dict.has(cand)) { len = n; break; }
    }
    const word = text.slice(i, i + len);
    const syllables = py.slice(i, i + len).map(s => s || '');
    // Structural 得 on its own (V得 + complement) is read "de".
    if (word === '得') syllables[0] = 'de';
    tokens.push({ text: word, han: true, pinyin: syllables, entry: dict.get(word) || null });
    i += len;
  }
  return tokens;
}

// Pick the CEDICT reading that matches the pinyin heard in context.
export function describe(token, dict) {
  const e = token.entry || dict.get(token.text) || { word: token.text, lessons: [] };
  const heard = token.pinyin?.join(' ');
  const readings = e.readings || [];
  const match = readings.find(r => norm(r.p) === norm(heard)) || readings[0];
  // A single character read differently in context (行 xíng / háng) gets the matching CEDICT sense.
  const sameReading = token.text.length > 1 || !e.pinyin || !heard || norm(e.pinyin) === norm(heard);
  return {
    word: token.text,
    // Single characters take the reading heard in context (了 le / liǎo); words keep the course pinyin.
    pinyin: (token.text.length > 1 && e.pinyin) || heard || e.pinyin || match?.p || '',
    fr: sameReading ? e.fr || null : null,
    en: sameReading ? e.en || match?.en || null : match?.en || e.en || null,
    lessons: e.lessons || [],
  };
}

// Details for the character popup when a character is not in the 361-character bank.
export function charDetails(ch, dict) {
  const e = dict.get(ch) || {};
  if (e.char) return e.char;
  const r = e.readings?.[0];
  return {
    hanzi: ch,
    pinyin_marked: e.pinyin || r?.p || pinyin(ch),
    gloss_fr: e.fr,
    gloss_en: e.en || e.readings?.map(x => `${x.p} — ${x.en}`).join(' · '),
  };
}

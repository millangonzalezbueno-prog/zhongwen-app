import {
  ORANGE_HANZI, CLASSIFIERS, WORD_BANKS, GRAMMAR_FILLS, GRAMMAR_MCQ, ERROR_CORRECTIONS,
  ORDERS, TRANSLATIONS, READINGS, OPEN_QUESTIONS, L05_TRUE_FALSE, TOPICS,
} from '../data/examPrep.js';

export function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function pick(arr, n) { return shuffle(arr).slice(0, n); }

const ALL_CLASSIFIERS = [...new Set(CLASSIFIERS.map(c => c.answer))];

// Order exercises keep their chunks shuffled per session.
const prepOrder = (q) => ({ ...q, chunks: shuffle(q.chunks) });
const prepOptions = (q) => (q.options ? { ...q, options: shuffle(q.options) } : q);

// ---------- Builders ----------

// Classifier drag-and-drop: distinct answers so the bank is unambiguous, plus two distractor tiles.
export function classifierDnd(n = 8, filter = () => true) {
  const items = [];
  const used = new Set();
  for (const c of shuffle(CLASSIFIERS.filter(filter))) {
    if (used.has(c.answer) || (c.accept || []).some(a => used.has(a))) continue;
    if (items.some(it => (it.accept || []).includes(c.answer))) continue;
    used.add(c.answer);
    items.push(c);
    if (items.length === n) break;
  }
  const distractors = pick(ALL_CLASSIFIERS.filter(a => !used.has(a) && !items.some(it => (it.accept || []).includes(a))), 2);
  return {
    type: 'dnd-fill',
    label: '量词 — Glissez le bon classificateur',
    instruction: 'Chaque classificateur ne sert qu\'une fois ; deux sont en trop.',
    items,
    bank: shuffle([...items.map(i => i.answer), ...distractors]),
  };
}

export function wordBankDnd(set) {
  return {
    type: 'dnd-fill',
    label: `选词填空 — ${set.title}`,
    instruction: 'Placez chaque mot une seule fois.',
    items: shuffle(set.items),
    bank: shuffle(set.items.map(i => i.answer)),
  };
}

export function classifierChoice(c) {
  const wrong = pick(ALL_CLASSIFIERS.filter(a => a !== c.answer && !(c.accept || []).includes(a)), 3);
  return {
    type: 'fill-mcq', sentence: c.sentence, correct: c.answer, accept: c.accept, options: shuffle([c.answer, ...wrong]),
    hint: 'Quel classificateur ?', explanation_fr: c.explanation_fr, explanation_en: c.explanation_en,
  };
}

export function hanziWrite(h) {
  return { type: 'hanzi-write', ...h };
}

export function vocabMcq(lessons, n) {
  const pool = lessons.flatMap(l => l.vocab.map(v => ({ ...v, lesson: l.id })))
    .filter(v => v.word.length >= 1 && v.gloss_fr && !/^clf\./.test(v.gloss_fr));
  return pick(pool, n).map(v => {
    const sameCat = pool.filter(x => x.word !== v.word && x.lesson === v.lesson && x.category === v.category);
    const others = pool.filter(x => x.word !== v.word);
    const distractors = [];
    for (const x of [...shuffle(sameCat), ...shuffle(others)]) {
      if (distractors.length === 3) break;
      if (!distractors.includes(x.word) && x.word !== v.word) distractors.push(x.word);
    }
    return {
      type: 'vocab-mcq',
      prompt: v.gloss_fr.split('—')[0].split('(')[0].trim(),
      correct: v.word,
      options: shuffle([v.word, ...distractors]),
      pinyin: v.pinyin,
    };
  });
}

const byTopic = (pool, topic) => pool.filter(q => q.topic === topic);
const HAN = /[一-鿿]/g;

// "Choose the right word" from the curated word banks: distractors come from the same bank,
// so they are plausible but only one fits.
function bankChoice(set, item) {
  const others = pick(set.items.filter(i => i.answer !== item.answer && !(item.accept || []).includes(i.answer)), 3).map(i => i.answer);
  return {
    type: 'fill-mcq', topic: 'vocabfill', l: set.l, sentence: item.sentence, correct: item.answer, accept: item.accept,
    options: shuffle([item.answer, ...others]), hint: 'Choisissez le bon mot.',
  };
}

// "Choose the right word" generated from each lesson's vocabulary examples. Distractors come
// from the same lesson but another category; the meaning hint rules out the cases where a
// distractor would still be grammatical (他___很早起床: 总是 vs 现在).
function exampleChoices(lessons) {
  const out = [];
  for (const l of lessons) {
    for (const v of l.vocab) {
      const ex = v.example || '';
      if (ex.startsWith('*') || ex.split(v.word).length !== 2) continue;
      if ((ex.match(HAN) || []).length < v.word.length + 3 || /^clf\./.test(v.gloss_fr || '')) continue;
      const pool = l.vocab.filter(x => x.word !== v.word && x.category !== v.category && !ex.includes(x.word)
        && !/^clf\./.test(x.gloss_fr || '') && x.word.length === v.word.length);
      if (pool.length < 3) continue;
      out.push({
        type: 'fill-mcq', topic: 'vocabfill', l: l.id, sentence: ex.replace(v.word, '___'), correct: v.word,
        options: shuffle([v.word, ...pick(pool, 3).map(x => x.word)]),
        hint: `Sens : ${v.gloss_fr.split('—')[0].split(';')[0].trim()}`,
        explanation_fr: `${v.word} (${v.pinyin}) : ${v.gloss_fr}`, explanation_en: v.gloss_en,
      });
    }
  }
  return out;
}

export function vocabChoices(lessons, n, { bankShare = 0.6 } = {}) {
  const fromBanks = shuffle(WORD_BANKS.flatMap(set => set.items.map(item => bankChoice(set, item))));
  const fromExamples = shuffle(exampleChoices(lessons));
  const nBank = Math.round(n * bankShare);
  const chosen = [...fromBanks.slice(0, nBank), ...fromExamples.slice(0, n - nBank)];
  return shuffle(chosen);
}

export function topicSession(topicId, lessons) {
  const topic = TOPICS.find(t => t.id === topicId) || { title: 'Mélange', desc: '' };
  let exercises = [];
  switch (topicId) {
    case 'clf':
      exercises = [
        classifierDnd(8), classifierDnd(8),
        ...pick(CLASSIFIERS, 8).map(classifierChoice),
        ...byTopic(ERROR_CORRECTIONS, 'clf'),
      ];
      break;
    case 'bank':
      exercises = pick(WORD_BANKS, 4).map(wordBankDnd);
      break;
    case 'order':
      exercises = pick(ORDERS, 10).map(prepOrder);
      break;
    case 'lecture':
      exercises = pick(READINGS, 8);
      break;
    case 'ecrit':
      exercises = pick(OPEN_QUESTIONS, 6);
      break;
    case 'trad':
      exercises = pick(TRANSLATIONS, 8);
      break;
    case 'vocab':
      exercises = vocabMcq(lessons, 20);
      break;
    case 'vocabfill':
      exercises = vocabChoices(lessons, 15);
      break;
    case 'mix':
      exercises = [
        classifierDnd(6),
        wordBankDnd(pick(WORD_BANKS, 1)[0]),
        ...pick(GRAMMAR_FILLS, 8).map(prepOptions),
        ...pick(GRAMMAR_MCQ, 3).map(prepOptions),
        ...pick(ERROR_CORRECTIONS, 3),
        ...pick(ORDERS, 3).map(prepOrder),
        ...pick(READINGS, 3),
        ...pick(TRANSLATIONS, 2),
        ...pick(OPEN_QUESTIONS, 1),
      ];
      break;
    default:
      exercises = [
        ...byTopic(GRAMMAR_FILLS, topicId).map(prepOptions),
        ...byTopic(GRAMMAR_MCQ, topicId).map(prepOptions),
        ...byTopic(ERROR_CORRECTIONS, topicId),
      ];
  }
  const keepOrder = topicId === 'clf';
  return {
    rounds: [{ title: topic.title, subtitle: topic.desc, exercises: keepOrder ? exercises : shuffle(exercises) }],
  };
}

// Mock exam with the real structure: 1 hour, word order ×5, 汉字 ×5, vocabulary ×5, grammar ×10.
// Points follow the number of items (4 / 4 / 4 / 8 = 20).
export function mockExam(lessons) {
  const isNew = (q) => q.l === 'L06';
  const grammarPool = [...GRAMMAR_FILLS, ...GRAMMAR_MCQ];
  const grammar = [
    ...pick(grammarPool.filter(isNew), 4),
    ...pick(byTopic(GRAMMAR_FILLS, 'yzh'), 1),
    ...pick(grammarPool.filter(q => !isNew(q) && q.topic !== 'yzh'), 4),
    ...pick(ERROR_CORRECTIONS, 1),
  ].map(prepOptions);
  const week5 = ORANGE_HANZI.filter(h => h.week === 5);
  const hanzi = [...pick(week5, 2), ...pick(ORANGE_HANZI.filter(h => h.week !== 5), 3)];
  return {
    timeLimit: 60,
    rounds: [
      { title: 'Section 1 — Ordre des mots', subtitle: 'Remettez les mots dans le bon ordre', points: 4,
        exercises: shuffle([...pick(ORDERS.filter(isNew), 2), ...pick(ORDERS.filter(q => !isNew(q)), 3)]).map(prepOrder) },
      { title: 'Section 2 — 汉字', subtitle: 'Écrivez les caractères (diapositives orange)', points: 4,
        exercises: shuffle(hanzi).map(hanziWrite) },
      { title: 'Section 3 — Vocabulaire', subtitle: 'Choisissez le bon mot', points: 4,
        exercises: vocabChoices(lessons, 5, { bankShare: 0.8 }) },
      { title: 'Section 4 — Grammaire', subtitle: 'Toutes les leçons, semaine 5 comprise', points: 8,
        exercises: shuffle(grammar) },
    ],
  };
}

export function hanziDictation(chars = ORANGE_HANZI) {
  return {
    rounds: [{ title: 'Dictée — 汉字', subtitle: `${chars.length} caractères de mémoire`, exercises: shuffle(chars).map(hanziWrite) }],
  };
}

// Lesson 5 exercises draw on the same bank, filtered to L05.
export function lessonL05(lesson) {
  const L5 = (q) => q.l === 'L05';
  return {
    rounds: [
      { title: 'Évaluation', subtitle: 'Vocabulaire et texte', exercises: shuffle([
        ...vocabMcq([lesson], 5),
        ...pick(L05_TRUE_FALSE, 4).map(q => ({ type: 'true-false', ...q })),
        ...pick(byTopic(GRAMMAR_FILLS, 'yzh'), 3).map(prepOptions),
      ]) },
      { title: 'Renforcement', subtitle: 'Classificateurs, 是…的, 合适/适合', exercises: shuffle([
        classifierDnd(6, L5),
        wordBankDnd(WORD_BANKS.find(b => b.id === 'achats')),
        ...pick(GRAMMAR_FILLS.filter(q => L5(q) && q.topic !== 'yzh'), 5).map(prepOptions),
        ...pick(ERROR_CORRECTIONS.filter(L5), 3),
      ]) },
      { title: 'Défi', subtitle: 'Traduction, lecture, production', exercises: shuffle([
        ...pick(TRANSLATIONS.filter(L5), 3),
        ...pick(READINGS.filter(L5), 3),
        ...pick(ORDERS.filter(L5), 3).map(prepOrder),
        ...pick(GRAMMAR_MCQ.filter(L5), 2).map(prepOptions),
        ...pick(OPEN_QUESTIONS.filter(L5), 1),
      ]) },
    ],
  };
}

// Lesson 6 exercises, drawn from the week 5 part of the bank.
export function lessonL06(lesson) {
  const L6 = (q) => q.l === 'L06';
  return {
    rounds: [
      { title: 'Évaluation', subtitle: 'Vocabulaire et textes', exercises: shuffle([
        ...vocabMcq([lesson], 5),
        ...pick(READINGS.filter(L6), 4),
        ...pick(ORANGE_HANZI.filter(h => h.week === 5), 2).map(hanziWrite),
      ]) },
      { title: 'Renforcement', subtitle: '正在…呢, 快要…了, 着, 一点儿/有点儿, 还是/或者', exercises: shuffle([
        ...pick(GRAMMAR_FILLS.filter(L6), 8).map(prepOptions),
        ...pick(ERROR_CORRECTIONS.filter(L6), 3),
        wordBankDnd(pick(WORD_BANKS.filter(L6), 1)[0]),
      ]) },
      { title: 'Défi', subtitle: 'Ordre, traduction, production', exercises: shuffle([
        ...pick(ORDERS.filter(L6), 4).map(prepOrder),
        ...pick(GRAMMAR_MCQ.filter(L6), 3).map(prepOptions),
        ...pick(TRANSLATIONS.filter(L6), 3),
        ...pick(OPEN_QUESTIONS.filter(L6), 1),
      ]) },
    ],
  };
}

// Replays the exercises missed earlier (stored by the exam page).
export function mistakesSession(items) {
  const exercises = shuffle(items).slice(0, 20).map(q => (q.type === 'order' ? prepOrder(q) : prepOptions(q)));
  return { rounds: [{ title: 'Mes erreurs', subtitle: `${items.length} exercice${items.length > 1 ? 's' : ''} à revoir`, exercises }] };
}

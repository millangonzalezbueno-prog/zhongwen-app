import {
  HANZI, CLASSIFIERS, WORD_BANKS, GRAMMAR_FILLS, GRAMMAR_MCQ, ERROR_CORRECTIONS,
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

// Mock exam: same families as the homework, weighted to 20 points.
export function mockExam() {
  const grammar = [
    ...pick(byTopic(GRAMMAR_FILLS, 'yzh'), 2),
    ...pick(GRAMMAR_FILLS.filter(q => q.topic !== 'yzh'), 2),
    ...pick(GRAMMAR_MCQ, 1),
    ...pick(ERROR_CORRECTIONS, 1),
  ].map(prepOptions);
  return {
    rounds: [
      { title: 'Partie 1 — 汉字', subtitle: 'Écrivez les caractères de mémoire', points: 3, exercises: pick(HANZI, 6).map(hanziWrite) },
      { title: 'Partie 2 — 回答问题', subtitle: 'Répondez en chinois', points: 4, exercises: pick(OPEN_QUESTIONS, 4) },
      { title: 'Partie 3 — 完成句子', subtitle: 'Remettez les mots dans l\'ordre', points: 3, exercises: pick(ORDERS, 5).map(prepOrder) },
      { title: 'Partie 4 — 选词填空', subtitle: 'Chaque mot une fois', points: 2, exercises: [wordBankDnd(pick(WORD_BANKS, 1)[0])] },
      { title: 'Partie 5 — 量词', subtitle: 'Glisser-déposer', points: 3, exercises: [classifierDnd(8)] },
      { title: 'Partie 6 — 语法', subtitle: 'Choisissez, corrigez', points: 2, exercises: shuffle(grammar) },
      { title: 'Partie 7 — 阅读', subtitle: 'Choisissez la bonne réponse', points: 3, exercises: pick(READINGS, 4) },
    ],
  };
}

export function hanziDictation(chars = HANZI) {
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

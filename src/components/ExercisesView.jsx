import { useState, useMemo } from 'react';
import { filterByTier } from '../lib/data';

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function pick(arr, n) {
  return shuffle(arr).slice(0, n);
}

const EXERCISE_TYPES = [
  { id: 'gap-fill', label: 'Compléter', desc: 'Remplir le blanc' },
  { id: 'sentence', label: 'Phrases', desc: 'Associer sens et phrase' },
  { id: 'prompt', label: 'Répondre', desc: 'Traduire ou répondre' },
  { id: 'pinyin', label: 'Pinyin', desc: 'Identifier la prononciation' },
];

export default function ExercisesView({ data }) {
  const [exerciseType, setExerciseType] = useState(null);
  const [tierFilter, setTierFilter] = useState(['A1', 'A2']);

  if (!exerciseType) {
    return (
      <div>
        <h2 className="text-xl font-semibold mb-2">Exercices interactifs</h2>
        <p className="text-muted mb-6">Choisissez un type d'exercice et le niveau.</p>

        <div className="flex gap-2 mb-6">
          {['A1', 'A2', 'B1'].map(t => (
            <button key={t} onClick={() => {
              setTierFilter(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t]);
            }} className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
              tierFilter.includes(t)
                ? (t === 'A1' ? 'bg-a1 text-white' : t === 'A2' ? 'bg-a2 text-white' : 'bg-b1 text-white')
                : 'bg-border/50 text-muted'
            }`}>{t}</button>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-4">
          {EXERCISE_TYPES.map(ex => (
            <button key={ex.id} onClick={() => setExerciseType(ex.id)}
              className="bg-surface-alt border border-border rounded-xl p-6 text-left hover:border-accent/50 hover:shadow-sm transition-all">
              <p className="text-lg font-semibold mb-1">{ex.label}</p>
              <p className="text-sm text-muted">{ex.desc}</p>
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <button onClick={() => setExerciseType(null)}
        className="text-sm text-accent mb-4 hover:underline">&larr; Retour aux exercices</button>

      {exerciseType === 'gap-fill' && <GapFillSession data={data} tiers={tierFilter} />}
      {exerciseType === 'sentence' && <SentenceSession data={data} tiers={tierFilter} />}
      {exerciseType === 'prompt' && <PromptSession data={data} tiers={tierFilter} />}
      {exerciseType === 'pinyin' && <PinyinSession data={data} tiers={tierFilter} />}
    </div>
  );
}

function GapFillSession({ data, tiers }) {
  const exercises = useMemo(() => {
    const items = [];

    const grammarDrills = data.grammar
      .filter(g => tiers.includes(g.tier))
      .flatMap(g => (g.drill_items || g.drills || [])
        .filter(d => d.type === 'gap_fill' || d.type === 'gap-fill')
        .map(d => ({
          type: 'grammar',
          prompt: d.prompt || d.prompt_zh,
          answer: d.answer,
          hint: d.hint_fr || d.prompt_fr || '',
          pattern: g.pattern,
        }))
      );
    items.push(...grammarDrills);

    const vocabItems = filterByTier(data.vocab, tiers);
    const vocabDrills = pick(vocabItems, 20).map(v => {
      const word = v.word;
      const charIdx = Math.floor(Math.random() * word.length);
      const blanked = word.substring(0, charIdx) + '___' + word.substring(charIdx + 1);
      return {
        type: 'vocab',
        prompt: `${blanked}（${v.pinyin_marked}）`,
        answer: word[charIdx],
        hint: v.gloss_fr,
        fullWord: word,
      };
    });
    items.push(...vocabDrills);

    return shuffle(items).slice(0, 12);
  }, [data, tiers.join(',')]);

  return <ExerciseRunner exercises={exercises} title="Compléter" renderExercise={(ex, state, onAnswer) => (
    <div className="text-center">
      <p className="text-2xl hanzi-display mb-4 font-medium">{ex.prompt}</p>
      <p className="text-muted mb-6">{ex.hint}</p>
      {state === 'answering' ? (
        <AnswerInput onSubmit={onAnswer} placeholder="Votre réponse..." />
      ) : (
        <AnswerFeedback correct={state === 'correct'} answer={ex.answer}
          extra={ex.fullWord ? `Mot complet : ${ex.fullWord}` : ex.pattern} />
      )}
    </div>
  )} />;
}

function SentenceSession({ data, tiers }) {
  const exercises = useMemo(() => {
    const vocabItems = filterByTier(data.vocab, tiers).filter(v => v.example_zh && v.example_fr);
    const items = pick(vocabItems, 12).map(v => {
      const allVocab = filterByTier(data.vocab, tiers).filter(x => x.id !== v.id && x.example_fr);
      const distractors = pick(allVocab, 3).map(x => x.example_fr);
      const options = shuffle([v.example_fr, ...distractors]);
      return {
        sentence_zh: v.example_zh,
        pinyin: v.pinyin_marked,
        correct: v.example_fr,
        options,
        word: v.word,
      };
    });
    return items;
  }, [data, tiers.join(',')]);

  return <ExerciseRunner exercises={exercises} title="Phrases" renderExercise={(ex, state, onAnswer) => (
    <div className="text-center">
      <p className="text-3xl hanzi-display mb-2 font-medium">{ex.sentence_zh}</p>
      <p className="text-accent text-sm mb-6">{ex.pinyin}</p>
      <p className="text-muted text-sm mb-4">Quelle est la bonne traduction ?</p>
      {state === 'answering' ? (
        <div className="space-y-2 max-w-md mx-auto">
          {ex.options.map((opt, i) => (
            <button key={i} onClick={() => onAnswer(opt)}
              className="w-full text-left px-4 py-3 rounded-xl border border-border bg-surface-alt hover:border-accent/50 hover:bg-accent/5 transition-colors text-sm">
              {opt}
            </button>
          ))}
        </div>
      ) : (
        <AnswerFeedback correct={state === 'correct'} answer={ex.correct}
          extra={`${ex.word} — ${ex.sentence_zh}`} />
      )}
    </div>
  )} />;
}

function PromptSession({ data, tiers }) {
  const exercises = useMemo(() => {
    const items = [];

    const grammarTranslate = data.grammar
      .filter(g => tiers.includes(g.tier))
      .flatMap(g => (g.drill_items || g.drills || [])
        .filter(d => d.type === 'translate')
        .map(d => ({
          type: 'translate',
          prompt_fr: d.prompt_fr,
          answer: d.answer || d.answer_zh,
          pattern: g.pattern,
        }))
      );
    items.push(...grammarTranslate);

    const vocabItems = filterByTier(data.vocab, tiers).filter(v => v.example_zh && v.example_fr);
    const vocabTranslate = pick(vocabItems, 10).map(v => ({
      type: 'vocab-translate',
      prompt_fr: v.example_fr,
      answer: v.example_zh,
      word: v.word,
    }));
    items.push(...vocabTranslate);

    return shuffle(items).slice(0, 12);
  }, [data, tiers.join(',')]);

  return <ExerciseRunner exercises={exercises} title="Répondre" renderExercise={(ex, state, onAnswer) => (
    <div className="text-center">
      <p className="text-sm text-muted mb-2">Traduisez en chinois :</p>
      <p className="text-xl mb-6 font-medium">{ex.prompt_fr}</p>
      {state === 'answering' ? (
        <AnswerInput onSubmit={onAnswer} placeholder="Écrivez en chinois..." />
      ) : (
        <AnswerFeedback correct={state === 'correct'} answer={ex.answer}
          extra={ex.pattern || ex.word} />
      )}
    </div>
  )} />;
}

function PinyinSession({ data, tiers }) {
  const exercises = useMemo(() => {
    const chars = filterByTier(data.characters, tiers);
    return pick(chars, 12).map(c => {
      const allChars = filterByTier(data.characters, tiers).filter(x => x.hanzi !== c.hanzi);
      const distractors = pick(allChars, 3).map(x => x.pinyin_marked);
      const options = shuffle([c.pinyin_marked, ...distractors]);
      return { hanzi: c.hanzi, correct: c.pinyin_marked, gloss: c.gloss_fr, options };
    });
  }, [data, tiers.join(',')]);

  return <ExerciseRunner exercises={exercises} title="Pinyin" renderExercise={(ex, state, onAnswer) => (
    <div className="text-center">
      <p className="text-7xl hanzi-display mb-4 font-medium">{ex.hanzi}</p>
      <p className="text-muted text-sm mb-6">Quel est le bon pinyin ?</p>
      {state === 'answering' ? (
        <div className="grid grid-cols-2 gap-3 max-w-sm mx-auto">
          {ex.options.map((opt, i) => (
            <button key={i} onClick={() => onAnswer(opt)}
              className="px-4 py-3 rounded-xl border border-border bg-surface-alt hover:border-accent/50 hover:bg-accent/5 transition-colors text-lg font-medium text-accent">
              {opt}
            </button>
          ))}
        </div>
      ) : (
        <AnswerFeedback correct={state === 'correct'} answer={ex.correct} extra={ex.gloss} />
      )}
    </div>
  )} />;
}

function ExerciseRunner({ exercises, title, renderExercise }) {
  const [index, setIndex] = useState(0);
  const [state, setState] = useState('answering');
  const [stats, setStats] = useState({ total: 0, correct: 0 });

  if (exercises.length === 0) {
    return <p className="text-muted text-center py-12">Pas assez de données pour ce niveau.</p>;
  }

  if (index >= exercises.length) {
    const pct = stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0;
    return (
      <div className="text-center py-16">
        <p className="text-4xl mb-4">&#x2705;</p>
        <p className="text-xl font-medium mb-2">{title} — Terminé !</p>
        <p className="text-muted mb-1">{stats.correct} / {stats.total} correct</p>
        <p className="text-muted mb-6">Précision : {pct}%</p>
      </div>
    );
  }

  const ex = exercises[index];

  const handleAnswer = (answer) => {
    const normalizedAnswer = (answer || '').replace(/\s+/g, '').replace(/[。？！，]/g, '');
    const normalizedCorrect = (ex.answer || ex.correct || '').replace(/\s+/g, '').replace(/[。？！，]/g, '');
    const isCorrect = normalizedAnswer === normalizedCorrect;
    setState(isCorrect ? 'correct' : 'wrong');
    setStats(prev => ({ total: prev.total + 1, correct: prev.correct + (isCorrect ? 1 : 0) }));
  };

  const next = () => {
    setIndex(prev => prev + 1);
    setState('answering');
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold">{title}</h3>
        <span className="text-sm text-muted">{index + 1} / {exercises.length}</span>
      </div>
      <div className="w-full bg-border rounded-full h-1.5 mb-6">
        <div className="bg-accent h-1.5 rounded-full transition-all duration-300"
          style={{ width: `${(index / exercises.length) * 100}%` }} />
      </div>
      <div className="bg-surface-alt border border-border rounded-2xl p-8 max-w-lg mx-auto">
        {renderExercise(ex, state, handleAnswer)}
        {state !== 'answering' && (
          <button onClick={next}
            className="mt-6 w-full py-3 bg-accent text-white rounded-xl font-medium hover:bg-accent/90 transition-colors">
            Suivant
          </button>
        )}
      </div>
    </div>
  );
}

function AnswerInput({ onSubmit, placeholder }) {
  const [value, setValue] = useState('');
  return (
    <form onSubmit={e => { e.preventDefault(); if (value.trim()) onSubmit(value.trim()); }}
      className="flex gap-2 max-w-sm mx-auto">
      <input type="text" value={value} onChange={e => setValue(e.target.value)}
        placeholder={placeholder} autoFocus
        className="flex-1 px-4 py-3 rounded-xl border border-border bg-white focus:border-accent focus:outline-none text-center text-lg hanzi-display" />
      <button type="submit"
        className="px-6 py-3 bg-accent text-white rounded-xl font-medium hover:bg-accent/90 transition-colors">
        OK
      </button>
    </form>
  );
}

function AnswerFeedback({ correct, answer, extra }) {
  return (
    <div className={`rounded-xl p-4 ${correct ? 'bg-success/10' : 'bg-primary/10'}`}>
      <p className={`font-medium mb-1 ${correct ? 'text-success' : 'text-primary'}`}>
        {correct ? 'Correct !' : 'Incorrect'}
      </p>
      <p className="text-lg hanzi-display font-medium">{answer}</p>
      {extra && <p className="text-sm text-muted mt-1">{extra}</p>}
    </div>
  );
}

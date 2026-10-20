import { useState, useCallback } from 'react';
import LessonExercises from './LessonExercises';
import Zh from './Zh';

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Fresh copy of the paper for one attempt: tiles and banks reshuffled, everything else as printed.
function buildAttempt(paper) {
  return {
    rounds: paper.parts.map(part => ({
      title: part.title,
      subtitle: part.subtitle,
      points: part.points,
      exercises: part.exercises.map(ex => {
        if (ex.type === 'order') return { ...ex, chunks: shuffle(ex.chunks) };
        if (ex.type === 'dnd-fill') return { ...ex, bank: shuffle(ex.bank) };
        return ex;
      }),
    })),
  };
}

// One row of the answer key per question, whatever the exercise type.
function keyRows(ex) {
  switch (ex.type) {
    case 'order':
      return [{ prompt: ex.chunks.join(' / '), answer: [ex.answer, ...(ex.alts || [])].map(a => `${a}。`).join(' / '), note: ex.explanation_fr }];
    case 'hanzi-write':
      return [{ prompt: ex.context.replace('___', `（${ex.contextPinyin}）`), answer: ex.context.replace('___', ex.char), note: ex.explanation_fr }];
    case 'dnd-fill':
      return ex.items.map(i => ({ prompt: i.sentence.replace('___', '（　）'), answer: i.answer, note: i.explanation_fr }));
    case 'translate':
      return [{ prompt: ex.fr, answer: [ex.zh, ...(ex.alts || [])].join(' / '), note: ex.explanation_fr }];
    case 'error-correction':
      return [{ prompt: ex.wrong, answer: [ex.correct, ...(ex.alts || [])].join(' / '), note: ex.explanation_fr }];
    default:
      return [];
  }
}

export default function PaperView({ paper }) {
  const [tab, setTab] = useState('do');
  const [runId, setRunId] = useState(0);
  const [shown, setShown] = useState(false);
  const build = useCallback(() => buildAttempt(paper), [paper]);
  const total = paper.parts.reduce((s, p) => s + p.points, 0);

  return (
    <div>
      <div className="mb-6">
        <p className="text-xs font-semibold text-accent uppercase tracking-wider mb-1">{paper.kicker}</p>
        <h2 className="text-2xl font-semibold hanzi-display">{paper.title}</h2>
        <p className="text-sm text-muted">{paper.intro} · {total} points</p>
      </div>

      <div className="flex gap-1 mb-6 border-b border-border pb-px">
        {[{ id: 'do', label: 'Faire le sujet' }, { id: 'key', label: 'Sujet & corrigé' }].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
              tab === t.id ? 'bg-surface-alt text-accent border border-border border-b-transparent -mb-px' : 'text-muted hover:text-primary'
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'do' && (
        <>
          <div className="flex justify-end mb-3">
            <button onClick={() => setRunId(r => r + 1)} className="text-sm text-accent hover:underline">Recommencer ↻</button>
          </div>
          <LessonExercises key={`${paper.id}-${runId}`} buildSession={build} />
        </>
      )}

      {tab === 'key' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted">Le sujet tel qu'il a été distribué. Essayez d'abord sans le corrigé.</p>
            <button onClick={() => setShown(s => !s)}
              className={`text-xs px-3 py-1.5 rounded-full font-medium transition-colors ${shown ? 'bg-accent text-white' : 'bg-accent/10 text-accent hover:bg-accent/20'}`}>
              {shown ? 'Masquer le corrigé' : 'Afficher le corrigé'}
            </button>
          </div>
          {paper.parts.map(part => (
            <section key={part.title} className="bg-surface-alt border border-border rounded-2xl p-5">
              <div className="flex items-baseline justify-between mb-1">
                <h3 className="font-semibold hanzi-display">{part.title}</h3>
                <span className="text-xs text-muted tabular-nums">{part.points} pts</span>
              </div>
              <p className="text-sm text-muted hanzi-display mb-3">{part.subtitle}</p>
              <ol className="space-y-3">
                {part.exercises.flatMap(keyRows).map((row, i) => (
                  <li key={i} className="text-sm">
                    <p className="hanzi-display text-base"><span className="text-muted mr-2 tabular-nums">{i + 1}.</span><Zh text={row.prompt} /></p>
                    {shown && (
                      <div className="mt-1 pl-6">
                        <p className="hanzi-display text-success font-medium"><Zh text={row.answer} /></p>
                        {row.note && <p className="text-xs text-muted mt-0.5"><Zh text={row.note} pinyin={false} /></p>}
                      </div>
                    )}
                  </li>
                ))}
              </ol>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}

import { useState, useCallback, useEffect, useRef } from 'react';
import HanziWriter from 'hanzi-writer';
import LessonExercises from './LessonExercises';
import Zh from './Zh';
import { HANZI } from '../data/examPrep';
import { hanziDictation, shuffle } from '../lib/examSessions';

const HANZI_KEY = 'zw-exam-hanzi-v1';

function loadJson(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; }
}
function saveJson(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* storage unavailable */ }
}

const MODES = [
  { id: 'animate', label: 'Animation' },
  { id: 'guided', label: 'Guidé' },
  { id: 'memory', label: 'De mémoire' },
];

// chars: the characters to practise (defaults to every character to know for the exam).
// grouped: show them by week. Mastery is stored per character and shared across the app.
export default function HanziStudio({ chars = HANZI, onResult, grouped = true }) {
  const [selected, setSelected] = useState(chars[0]?.char);
  const [mode, setMode] = useState('animate');
  const [scores, setScores] = useState(() => loadJson(HANZI_KEY, {}));
  const [dictation, setDictation] = useState(null);
  const buildDictation = useCallback(() => hanziDictation(
    dictation?.size ? shuffle(chars).slice(0, dictation.size) : chars,
  ), [dictation, chars]);

  const current = chars.find(h => h.char === selected) || chars[0];
  const mastered = chars.filter(h => scores[h.char] === 'ok').length;

  const record = (char, ok) => {
    setScores(prev => {
      const next = { ...prev, [char]: ok ? 'ok' : (prev[char] === 'ok' ? 'ok' : 'todo') };
      saveJson(HANZI_KEY, next);
      return next;
    });
  };

  const recordDictation = (ex, score) => { onResult?.(ex, score); if (ex?.char) record(ex.char, score >= 1); };

  if (dictation) {
    return (
      <div>
        <div className="flex items-center justify-between mb-3">
          <button onClick={() => setDictation(null)} className="text-sm text-accent hover:underline">&larr; Caractères</button>
          <button onClick={() => setDictation(d => ({ ...d, run: d.run + 1 }))} className="text-sm text-accent hover:underline">Recommencer ↻</button>
        </div>
        <LessonExercises key={`dict-${dictation.run}-${dictation.size}`} buildSession={buildDictation} onResult={recordDictation} />
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <p className="text-sm text-muted max-w-md">
          {chars.length} caractère{chars.length > 1 ? 's' : ''} à savoir écrire (diapositives orange et listes « 我会写 »).{' '}
          <span className="font-medium text-ink">{mastered} / {chars.length} maîtrisés</span>
        </p>
        <div className="flex gap-2">
          {chars.length > 5 && <button onClick={() => setDictation({ size: 5, run: 1 })}
            className="px-4 py-2 border border-accent text-accent rounded-xl text-sm font-medium hover:bg-accent/5 transition-colors">
            Dictée express (5)
          </button>}
          <button onClick={() => setDictation({ size: 0, run: 1 })}
            className="px-4 py-2 bg-accent text-white rounded-xl text-sm font-medium hover:bg-accent/90 transition-colors">
            Dictée : {chars.length > 1 ? `les ${chars.length}` : 'le caractère'}
          </button>
        </div>
      </div>

      {(grouped ? [...new Set(chars.map(h => h.week))] : [null]).map(week => (
        <div key={week ?? 'all'} className="mb-4">
          {week !== null && <p className="text-xs font-semibold text-muted uppercase tracking-wider mb-2">Semaine {week}</p>}
          <div className="flex flex-wrap gap-2">
            {chars.filter(h => week === null || h.week === week).map(h => {
              const st = scores[h.char];
              return (
                <button key={h.char} onClick={() => setSelected(h.char)}
                  className={`relative w-12 h-12 rounded-xl border hanzi-display text-2xl transition-colors ${
                    selected === h.char ? 'border-accent bg-accent/10' : 'border-border bg-surface-alt hover:border-accent/40'
                  }`}
                  aria-label={`${h.char} ${h.pinyin}${st === 'ok' ? ', maîtrisé' : ''}`}>
                  {h.char}
                  {st === 'ok' && <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-success text-white text-[10px] leading-4">✓</span>}
                  {st === 'todo' && <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-primary" />}
                </button>
              );
            })}
          </div>
        </div>
      ))}

      {current && (
        <div className="grid gap-6 md:grid-cols-[1fr_auto] bg-surface-alt border border-border rounded-2xl p-5 mt-2">
          <div>
            <p className="text-5xl hanzi-display font-medium">{current.char}</p>
            <p className="text-accent font-medium mt-1">{current.pinyin}</p>
            <p className="text-sm text-muted">{current.fr}</p>
            <p className="text-sm text-muted/70 italic">{current.en}</p>
            {current.parts && (
              <p className="mt-3 text-sm"><span className="text-muted">Composants : </span><span className="hanzi-display text-base">{current.char} = {current.parts}</span></p>
            )}
            <p className="mt-2 text-sm"><span className="text-muted">Mot : </span><span className="hanzi-display text-base"><Zh text={current.word} pinyin={false} /></span> <span className="text-accent">{current.wordPinyin}</span></p>
            <p className="mt-2 text-sm hanzi-display leading-relaxed bg-accent/5 rounded-lg p-3"><Zh text={current.sentence} /></p>
          </div>
          <div className="flex flex-col items-center">
            <div className="flex gap-1 mb-3" role="tablist">
              {MODES.map(m => (
                <button key={m.id} onClick={() => setMode(m.id)} role="tab" aria-selected={mode === m.id}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                    mode === m.id ? 'bg-accent text-white' : 'bg-border/50 text-muted hover:bg-border'
                  }`}>
                  {m.label}
                </button>
              ))}
            </div>
            <TraceBox key={`${current.char}-${mode}`} char={current.char} mode={mode}
              onResult={(ok) => record(current.char, ok)} />
          </div>
        </div>
      )}
    </div>
  );
}

function TraceBox({ char, mode, onResult }) {
  const boxRef = useRef(null);
  const writerRef = useRef(null);
  const onResultRef = useRef(onResult);
  const [result, setResult] = useState(null);
  onResultRef.current = onResult;

  useEffect(() => {
    const el = boxRef.current;
    if (!el) return;
    el.innerHTML = '';
    const writer = HanziWriter.create(el, char, {
      width: 220, height: 220, padding: 10,
      showOutline: mode !== 'memory', showCharacter: mode === 'animate',
      strokeColor: '#1d4ed8', outlineColor: '#dbeafe', drawingColor: '#1b2230',
      delayBetweenStrokes: 250,
    });
    writerRef.current = writer;
    if (mode === 'animate') {
      writer.loopCharacterAnimation();
    } else {
      writer.quiz({
        onComplete: ({ totalMistakes }) => {
          setResult(totalMistakes);
          if (mode === 'memory') onResultRef.current(totalMistakes <= 1);
        },
      });
    }
    return () => { el.innerHTML = ''; writerRef.current = null; };
  }, [char, mode]);

  const restart = () => {
    setResult(null);
    writerRef.current?.hideCharacter();
    writerRef.current?.quiz({
      onComplete: ({ totalMistakes }) => {
        setResult(totalMistakes);
        if (mode === 'memory') onResultRef.current(totalMistakes <= 1);
      },
    });
  };

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-[220px] h-[220px] rounded-xl border border-border bg-white">
        <svg className="absolute inset-0 pointer-events-none" width="220" height="220" aria-hidden="true">
          <line x1="0" y1="0" x2="220" y2="220" stroke="#e5e7eb" strokeDasharray="4 4" />
          <line x1="220" y1="0" x2="0" y2="220" stroke="#e5e7eb" strokeDasharray="4 4" />
          <line x1="110" y1="0" x2="110" y2="220" stroke="#e5e7eb" strokeDasharray="4 4" />
          <line x1="0" y1="110" x2="220" y2="110" stroke="#e5e7eb" strokeDasharray="4 4" />
        </svg>
        <div ref={boxRef} className="relative" />
      </div>
      <p className="text-xs text-muted mt-2 h-4">
        {mode === 'animate' && 'Regardez l\'ordre des traits.'}
        {mode !== 'animate' && result === null && (mode === 'guided' ? 'Tracez sur le contour.' : 'Tracez sans modèle.')}
        {mode !== 'animate' && result !== null && (
          <span className={result <= 1 ? 'text-success' : 'text-primary'}>
            {result <= 1 ? 'Parfait' : 'À revoir'} — {result} erreur{result > 1 ? 's' : ''}
          </span>
        )}
      </p>
      {mode !== 'animate' && (
        <button onClick={restart} className="mt-2 text-sm text-accent hover:underline">Recommencer</button>
      )}
    </div>
  );
}


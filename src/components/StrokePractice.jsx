import { useState, useEffect, useRef, useCallback } from 'react';
import HanziWriter from 'hanzi-writer';
import { filterByTier } from '../lib/data';

const STROKE_RULES = [
  { title: 'Horizontal puis vertical', rule: '先横后竖', desc: "D'abord horizontal, puis vertical." },
  { title: 'Piě puis nà', rule: '先撇后捺', desc: "D'abord la piě, puis la nà." },
  { title: 'De haut en bas', rule: '从上到下', desc: 'Écrire de haut en bas.' },
  { title: 'De gauche à droite', rule: '从左到右', desc: 'Écrire de gauche à droite.' },
  { title: 'Extérieur puis intérieur', rule: '先外后内', desc: "D'abord l'extérieur, puis l'intérieur." },
  { title: 'Ext. → int. → fermer', rule: '先外后内再封口', desc: "Extérieur, intérieur, puis fermer." },
  { title: 'Milieu puis côtés', rule: '先中间后两边', desc: "D'abord le milieu, puis les deux côtés." },
];

function useHanziWriter(ref, character, options) {
  const writerRef = useRef(null);

  useEffect(() => {
    if (!ref.current || !character) return;
    ref.current.innerHTML = '';
    try {
      writerRef.current = HanziWriter.create(ref.current, character, {
        width: 200,
        height: 200,
        padding: 5,
        strokeColor: '#2563eb',
        outlineColor: '#dbeafe',
        showOutline: true,
        delayBetweenStrokes: 200,
        ...options,
      });
    } catch {
      writerRef.current = null;
    }
    return () => {
      if (ref.current) ref.current.innerHTML = '';
      writerRef.current = null;
    };
  }, [character]);

  return writerRef;
}

export default function StrokePractice({ data, onCharClick }) {
  const [view, setView] = useState('ANIMATE');
  const [charIndex, setCharIndex] = useState(0);
  const [tierFilter, setTierFilter] = useState(['A1', 'A2']);

  const chars = filterByTier(data.characters, tierFilter);
  const current = chars[charIndex] || chars[0];

  if (!current) {
    return <p className="text-muted text-center py-12">Aucun caractère pour ce niveau.</p>;
  }

  const goNext = () => setCharIndex(i => Math.min(i + 1, chars.length - 1));
  const goPrev = () => setCharIndex(i => Math.max(i - 1, 0));

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="flex gap-1">
          {['A1', 'A2', 'B1'].map(t => (
            <button key={t} onClick={() => {
              setTierFilter(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t]);
              setCharIndex(0);
            }} className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
              tierFilter.includes(t)
                ? (t === 'A1' ? 'bg-a1 text-white' : t === 'A2' ? 'bg-a2 text-white' : 'bg-b1 text-white')
                : 'bg-border/50 text-muted'
            }`}>{t}</button>
          ))}
        </div>
        <div className="flex gap-1 ml-auto">
          {[
            { id: 'ANIMATE', label: 'Animation' },
            { id: 'PRACTICE', label: 'Guidé' },
            { id: 'WHITEBOARD', label: 'Ardoise' },
          ].map(m => (
            <button key={m.id} onClick={() => setView(m.id)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                view === m.id ? 'bg-accent text-white' : 'bg-surface-alt text-muted border border-border hover:bg-border/50'
              }`}>{m.label}</button>
          ))}
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        <div className="flex-1 bg-surface-alt border border-border rounded-2xl p-8 flex flex-col items-center">
          {view === 'WHITEBOARD' ? (
            <WhiteboardMode chars={chars} onCharClick={onCharClick} />
          ) : view === 'PRACTICE' ? (
            <GuidedMode character={current.hanzi} pinyin={current.pinyin_marked}
              glossFr={current.gloss_fr} onCharClick={onCharClick} />
          ) : (
            <AnimateMode character={current.hanzi} pinyin={current.pinyin_marked}
              glossFr={current.gloss_fr} onCharClick={onCharClick} />
          )}

          {view !== 'WHITEBOARD' && (
            <div className="flex items-center gap-6 mt-6">
              <button onClick={goPrev} disabled={charIndex === 0}
                className="px-3 py-2 rounded-lg text-sm font-medium bg-border/50 text-muted hover:bg-border disabled:opacity-30 transition-colors">
                &larr; Préc.
              </button>
              <span className="text-sm text-muted">{charIndex + 1} / {chars.length}</span>
              <button onClick={goNext} disabled={charIndex >= chars.length - 1}
                className="px-3 py-2 rounded-lg text-sm font-medium bg-border/50 text-muted hover:bg-border disabled:opacity-30 transition-colors">
                Suiv. &rarr;
              </button>
            </div>
          )}
        </div>

        <div className="w-full md:w-64 bg-surface-alt border border-border rounded-2xl p-5">
          <h3 className="text-xs font-semibold text-muted uppercase tracking-wider mb-3">Règles de tracé</h3>
          <ul className="space-y-2.5">
            {STROKE_RULES.map((rule, i) => (
              <li key={i} className="flex gap-2.5 text-sm">
                <span className="w-5 h-5 bg-accent/10 text-accent rounded-full flex items-center justify-center text-xs font-bold shrink-0">{i + 1}</span>
                <div>
                  <p className="font-medium text-sm">{rule.title}</p>
                  <p className="text-xs text-muted">{rule.rule}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

function AnimateMode({ character, pinyin, glossFr, onCharClick }) {
  const containerRef = useRef(null);
  const writer = useHanziWriter(containerRef, character);

  return (
    <>
      <button onClick={() => onCharClick?.(character)} className="text-center mb-2 hover:opacity-80 transition-opacity">
        <p className="text-5xl hanzi-display font-medium">{character}</p>
      </button>
      <p className="text-accent font-medium mb-1">{pinyin}</p>
      <p className="text-sm text-muted mb-6">{glossFr}</p>

      <div className="bg-accent/5 rounded-2xl p-6 border border-accent/10 relative">
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-5">
          <div className="w-full h-px bg-ink" />
          <div className="h-full w-px bg-ink absolute" />
        </div>
        <div ref={containerRef} className="mx-auto relative z-10" />
      </div>

      <button onClick={() => writer.current?.animateCharacter()}
        className="mt-6 px-6 py-3 bg-accent text-white rounded-xl font-medium hover:bg-accent/90 transition-colors flex items-center gap-2">
        <span>&#9654;</span> Animer les traits
      </button>
    </>
  );
}

function GuidedMode({ character, pinyin, glossFr, onCharClick }) {
  const containerRef = useRef(null);
  const [complete, setComplete] = useState(false);
  const writerRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;
    containerRef.current.innerHTML = '';
    setComplete(false);
    try {
      writerRef.current = HanziWriter.create(containerRef.current, character, {
        width: 200,
        height: 200,
        padding: 5,
        showOutline: true,
        strokeColor: '#2563eb',
        outlineColor: '#dbeafe',
      });
      writerRef.current.quiz({ onComplete: () => setComplete(true) });
    } catch {
      writerRef.current = null;
    }
    return () => {
      if (containerRef.current) containerRef.current.innerHTML = '';
    };
  }, [character]);

  const reset = () => {
    setComplete(false);
    writerRef.current?.quiz({ onComplete: () => setComplete(true) });
  };

  return (
    <>
      <button onClick={() => onCharClick?.(character)} className="text-center mb-2 hover:opacity-80 transition-opacity">
        <p className="text-5xl hanzi-display font-medium">{character}</p>
      </button>
      <p className="text-accent font-medium mb-1">{pinyin}</p>
      <p className="text-sm text-muted mb-6">{glossFr}</p>

      <div className="bg-accent/5 rounded-2xl p-6 border border-accent/10 relative">
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-5">
          <div className="w-full h-px bg-ink" />
          <div className="h-full w-px bg-ink absolute" />
        </div>
        <div ref={containerRef} className="mx-auto relative z-10" />
        {complete && (
          <div className="absolute inset-0 bg-success/90 rounded-2xl flex flex-col items-center justify-center text-white z-20">
            <p className="text-5xl mb-2">&#10003;</p>
            <p className="text-xl font-semibold">Parfait !</p>
          </div>
        )}
      </div>

      <p className="text-xs text-muted mt-4">Tracez les traits dans l'ordre correct</p>
      <button onClick={reset}
        className="mt-3 px-6 py-3 bg-accent text-white rounded-xl font-medium hover:bg-accent/90 transition-colors">
        Recommencer
      </button>
    </>
  );
}

function WhiteboardMode({ chars, onCharClick }) {
  const containerRef = useRef(null);
  const writerRef = useRef(null);
  const [target, setTarget] = useState(null);
  const [complete, setComplete] = useState(false);
  const [showHint, setShowHint] = useState(false);

  const pickRandom = useCallback(() => {
    const c = chars[Math.floor(Math.random() * chars.length)];
    return c;
  }, [chars]);

  const startNew = useCallback(() => {
    const c = pickRandom();
    setTarget(c);
    setComplete(false);
    setShowHint(false);

    if (!containerRef.current) return;
    containerRef.current.innerHTML = '';
    try {
      writerRef.current = HanziWriter.create(containerRef.current, c.hanzi, {
        width: 220,
        height: 220,
        padding: 10,
        showOutline: false,
        showCharacter: false,
        strokeColor: '#2563eb',
        outlineColor: '#dbeafe',
      });
      writerRef.current.quiz({ onComplete: () => setComplete(true) });
    } catch {
      writerRef.current = null;
    }
  }, [pickRandom]);

  useEffect(() => {
    startNew();
    return () => {
      if (containerRef.current) containerRef.current.innerHTML = '';
    };
  }, [startNew]);

  const handleHint = () => {
    setShowHint(true);
    writerRef.current?.showOutline();
  };

  if (!target) return null;

  return (
    <div className="w-full flex flex-col items-center">
      <p className="text-xs font-semibold text-accent uppercase tracking-wider mb-1">Écrivez le caractère pour :</p>
      <p className="text-3xl font-semibold text-accent mb-1">{target.pinyin_marked}</p>
      <p className="text-sm text-muted mb-6">{target.gloss_fr}</p>

      <div className="bg-white rounded-2xl p-8 border-2 border-accent/20 relative cursor-crosshair">
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-5">
          <div className="w-full h-px bg-ink" />
          <div className="h-full w-px bg-ink absolute" />
        </div>
        <div ref={containerRef} className="mx-auto relative z-10" />
        {complete && (
          <div className="absolute inset-0 bg-success/90 rounded-xl flex flex-col items-center justify-center text-white z-20">
            <p className="text-6xl hanzi-display mb-2">{target.hanzi}</p>
            <p className="text-xl font-semibold mb-4">Correct !</p>
            <button onClick={startNew}
              className="px-6 py-2 bg-white text-success rounded-xl font-medium hover:bg-success-light transition-colors">
              Suivant
            </button>
          </div>
        )}
      </div>

      <div className="flex gap-3 mt-6">
        <button onClick={handleHint} disabled={complete || showHint}
          className="px-5 py-2.5 bg-accent/10 text-accent rounded-xl font-medium hover:bg-accent/20 transition-colors disabled:opacity-40">
          Indice
        </button>
        <button onClick={startNew}
          className="px-5 py-2.5 bg-border/50 text-muted rounded-xl font-medium hover:bg-border transition-colors">
          Passer
        </button>
      </div>
    </div>
  );
}

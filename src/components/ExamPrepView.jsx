import { useState, useCallback, useEffect, useRef } from 'react';
import HanziWriter from 'hanzi-writer';
import LessonExercises from './LessonExercises';
import Zh from './Zh';
import { EXAM_DATE, HANZI, TOPICS } from '../data/examPrep';
import { mockExam, topicSession, hanziDictation } from '../lib/examSessions';

const HANZI_KEY = 'zw-exam-hanzi-v1';
const CHECK_KEY = 'zw-exam-checklist-v1';

function loadJson(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; }
}
function saveJson(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* storage unavailable */ }
}

const TABS = [
  { id: 'exam', label: 'Examen blanc' },
  { id: 'train', label: 'Entraînement' },
  { id: 'hanzi', label: '汉字 à tracer' },
  { id: 'program', label: 'Programme' },
];

export default function ExamPrepView({ data }) {
  const [tab, setTab] = useState('exam');
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const daysLeft = Math.round((EXAM_DATE - today) / 86400000);

  return (
    <div>
      <div className="mb-6">
        <p className="text-xs font-semibold text-primary uppercase tracking-wider mb-1">Examen — semaines 1 à 4</p>
        <h2 className="text-2xl font-semibold">Préparation à l'examen du 14 octobre</h2>
        <p className="text-sm text-muted">
          Tout le programme : L01 à L05, devoir 1, caractères des diapositives orange ·{' '}
          <span className={`font-semibold ${daysLeft <= 3 ? 'text-primary' : 'text-accent'}`}>
            {daysLeft > 0 ? `J-${daysLeft}` : daysLeft === 0 ? 'c\'est aujourd\'hui !' : 'examen passé'}
          </span>
        </p>
      </div>

      <div className="flex gap-1 mb-6 border-b border-border pb-px overflow-x-auto">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`px-4 py-2 text-sm font-medium rounded-t-lg whitespace-nowrap transition-colors ${
              tab === t.id
                ? 'bg-surface-alt text-accent border border-border border-b-transparent -mb-px'
                : 'text-muted hover:text-primary'
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'exam' && <MockExamTab />}
      {tab === 'train' && <TrainingTab lessons={data.lessons} />}
      {tab === 'hanzi' && <HanziStudio />}
      {tab === 'program' && <ProgramTab lessons={data.lessons} />}
    </div>
  );
}

// ---------- Examen blanc ----------

const EXAM_PARTS = [
  ['汉字', 'écrire 6 caractères de mémoire', 3],
  ['回答问题', '4 questions, réponse courte', 4],
  ['完成句子', '5 phrases à remettre dans l\'ordre', 3],
  ['选词填空', '6 mots à placer', 2],
  ['量词', '8 classificateurs à glisser', 3],
  ['语法', '6 questions de grammaire', 2],
  ['阅读', '4 textes courts', 3],
];

function MockExamTab() {
  const [runId, setRunId] = useState(0);
  const build = useCallback(() => mockExam(), []);

  if (runId === 0) {
    return (
      <div className="max-w-lg mx-auto">
        <div className="bg-surface-alt border border-border rounded-2xl p-6">
          <h3 className="font-semibold mb-1">Sujet blanc noté sur 20</h3>
          <p className="text-sm text-muted mb-4">Chaque sujet est tiré au hasard dans toute la banque d'exercices du semestre : refaites-en plusieurs.</p>
          <table className="w-full text-sm mb-5">
            <tbody>
              {EXAM_PARTS.map(([zh, desc, pts], i) => (
                <tr key={zh} className="border-t border-border/60">
                  <td className="py-2 pr-2 text-muted tabular-nums">{i + 1}</td>
                  <td className="py-2 pr-3 hanzi-display font-medium whitespace-nowrap">{zh}</td>
                  <td className="py-2 text-muted">{desc}</td>
                  <td className="py-2 text-right tabular-nums font-medium">{pts} pts</td>
                </tr>
              ))}
            </tbody>
          </table>
          <button onClick={() => setRunId(1)}
            className="w-full py-3 bg-accent text-white rounded-xl font-medium hover:bg-accent/90 transition-colors">
            Commencer un sujet
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-end mb-3">
        <button onClick={() => setRunId(r => r + 1)} className="text-sm text-accent hover:underline">Nouveau sujet ↻</button>
      </div>
      <LessonExercises key={`exam-${runId}`} buildSession={build} />
    </div>
  );
}

// ---------- Entraînement par thème ----------

function TrainingTab({ lessons }) {
  const [topic, setTopic] = useState(null);
  const [runId, setRunId] = useState(0);
  const build = useCallback(() => topicSession(topic, lessons), [topic, lessons]);

  if (topic) {
    const meta = TOPICS.find(t => t.id === topic) || { title: 'Tout mélanger' };
    return (
      <div>
        <div className="flex items-center justify-between mb-3">
          <button onClick={() => setTopic(null)} className="text-sm text-accent hover:underline">&larr; Thèmes</button>
          <p className="text-sm font-medium">{meta.title}</p>
          <button onClick={() => setRunId(r => r + 1)} className="text-sm text-accent hover:underline">Nouvelle série ↻</button>
        </div>
        <LessonExercises key={`${topic}-${runId}`} buildSession={build} />
      </div>
    );
  }

  return (
    <div>
      <button onClick={() => setTopic('mix')}
        className="w-full mb-4 bg-ink text-white rounded-2xl p-4 text-left hover:opacity-90 transition-opacity">
        <p className="font-semibold">Tout mélanger</p>
        <p className="text-sm opacity-80">25 exercices tirés de tous les thèmes</p>
      </button>
      <div className="grid gap-3 sm:grid-cols-2">
        {TOPICS.map(t => (
          <button key={t.id} onClick={() => setTopic(t.id)}
            className="bg-surface-alt border border-border rounded-xl p-4 text-left hover:border-accent/40 hover:shadow-sm transition-all flex items-center gap-3">
            <span className="w-10 h-10 shrink-0 rounded-lg bg-accent/10 text-accent hanzi-display text-xl font-semibold flex items-center justify-center">{t.badge}</span>
            <span>
              <span className="block font-medium hanzi-display">{t.title}</span>
              <span className="block text-xs text-muted">{t.desc}</span>
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

// ---------- 汉字 à tracer ----------

const MODES = [
  { id: 'animate', label: 'Animation' },
  { id: 'guided', label: 'Guidé' },
  { id: 'memory', label: 'De mémoire' },
];

function HanziStudio() {
  const [selected, setSelected] = useState(HANZI[0].char);
  const [mode, setMode] = useState('animate');
  const [scores, setScores] = useState(() => loadJson(HANZI_KEY, {}));
  const [dictation, setDictation] = useState(0);
  const buildDictation = useCallback(() => hanziDictation(), []);

  const current = HANZI.find(h => h.char === selected);
  const mastered = HANZI.filter(h => scores[h.char] === 'ok').length;

  const record = (char, ok) => {
    setScores(prev => {
      const next = { ...prev, [char]: ok ? 'ok' : (prev[char] === 'ok' ? 'ok' : 'todo') };
      saveJson(HANZI_KEY, next);
      return next;
    });
  };

  if (dictation) {
    return (
      <div>
        <div className="flex items-center justify-between mb-3">
          <button onClick={() => setDictation(0)} className="text-sm text-accent hover:underline">&larr; Caractères</button>
          <button onClick={() => setDictation(d => d + 1)} className="text-sm text-accent hover:underline">Recommencer ↻</button>
        </div>
        <LessonExercises key={`dict-${dictation}`} buildSession={buildDictation} />
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <p className="text-sm text-muted">
          Les 20 caractères des diapositives orange et des listes « 我会写 ».{' '}
          <span className="font-medium text-ink">{mastered} / {HANZI.length} maîtrisés</span>
        </p>
        <button onClick={() => setDictation(1)}
          className="px-4 py-2 bg-accent text-white rounded-xl text-sm font-medium hover:bg-accent/90 transition-colors">
          Dictée des 20 caractères
        </button>
      </div>

      {[3, 4].map(week => (
        <div key={week} className="mb-4">
          <p className="text-xs font-semibold text-muted uppercase tracking-wider mb-2">Semaine {week}</p>
          <div className="flex flex-wrap gap-2">
            {HANZI.filter(h => h.week === week).map(h => {
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

// ---------- Programme (checklist) ----------

function ProgramTab({ lessons }) {
  const [checked, setChecked] = useState(() => loadJson(CHECK_KEY, {}));
  const [open, setOpen] = useState(null);
  const total = lessons.reduce((s, l) => s + l.grammar.length, 0);
  const done = Object.values(checked).filter(Boolean).length;

  const toggle = (key) => {
    setChecked(prev => {
      const next = { ...prev, [key]: !prev[key] };
      saveJson(CHECK_KEY, next);
      return next;
    });
  };

  return (
    <div>
      <div className="mb-4">
        <div className="flex justify-between text-sm mb-1">
          <span className="text-muted">Points de grammaire maîtrisés</span>
          <span className="font-medium tabular-nums">{done} / {total}</span>
        </div>
        <div className="w-full bg-border rounded-full h-1.5">
          <div className="bg-success h-1.5 rounded-full transition-all" style={{ width: `${total ? (done / total) * 100 : 0}%` }} />
        </div>
      </div>
      <div className="space-y-5">
        {lessons.map(l => (
          <section key={l.id}>
            <p className="text-xs font-semibold text-accent uppercase tracking-wider mb-2">Semaine {l.week} — {l.title_fr}</p>
            <ul className="space-y-1">
              {l.grammar.map((g, i) => {
                const key = `${l.id}-${i}`;
                const isOpen = open === key;
                return (
                  <li key={key} className="bg-surface-alt border border-border rounded-lg">
                    <div className="flex items-center gap-3 px-3 py-2">
                      <input id={`chk-${key}`} type="checkbox" checked={!!checked[key]} onChange={() => toggle(key)}
                        className="w-4 h-4 accent-green-600" />
                      <label htmlFor={`chk-${key}`} className={`flex-1 text-sm ${checked[key] ? 'text-muted line-through' : ''}`}>{g.pattern}</label>
                      <button onClick={() => setOpen(isOpen ? null : key)} className="text-xs text-accent hover:underline shrink-0">
                        {isOpen ? 'Fermer' : 'Revoir'}
                      </button>
                    </div>
                    {isOpen && (
                      <div className="px-3 pb-3 text-sm border-t border-border/50 pt-2">
                        <p className="text-muted"><Zh text={g.explanation_fr} pinyin={false} /></p>
                        {g.examples?.[0] && (
                          <p className="mt-2 hanzi-display"><Zh text={g.examples[0].zh} /> <span className="text-xs text-muted">— {g.examples[0].fr}</span></p>
                        )}
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}

import { useState, useCallback, useEffect, useRef } from 'react';
import LessonExercises from './LessonExercises';
import Zh from './Zh';
import HanziStudio from './HanziStudio';
import { EXAM_DATE, HANZI, TOPICS } from '../data/examPrep';
import { mockExam, topicSession, mistakesSession, shuffle } from '../lib/examSessions';

const CHECK_KEY = 'zw-exam-checklist-v1';
const MISTAKES_KEY = 'zw-exam-mistakes-v1';
const HISTORY_KEY = 'zw-exam-history-v1';

function loadJson(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; }
}
function saveJson(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* storage unavailable */ }
}

// Stable identity for an exercise, so a mistake is stored once and cleared when answered right.
const exerciseKey = (q) => [q.type, q.sentence || q.wrong || q.fr || q.question || q.prompt || q.char || q.statement || '', q.correct || q.answer || q.zh || ''].join('|');

// Shared mistake list, kept in this browser.
function useMistakes() {
  const [items, setItems] = useState(() => loadJson(MISTAKES_KEY, []));
  const onResult = useCallback((ex, score) => {
    if (!ex || ex.type === 'open-answer' || ex.type === 'dnd-fill') return;
    const key = exerciseKey(ex);
    setItems(prev => {
      const rest = prev.filter(q => exerciseKey(q) !== key);
      const next = score >= 1 ? rest : [{ ...ex, missedAt: Date.now() }, ...rest].slice(0, 80);
      saveJson(MISTAKES_KEY, next);
      return next;
    });
  }, []);
  const clear = useCallback(() => { setItems([]); saveJson(MISTAKES_KEY, []); }, []);
  return { items, onResult, clear };
}

const TABS = [
  { id: 'exam', label: 'Examen blanc', en: 'Mock exam' },
  { id: 'train', label: 'Entraînement', en: 'Practice' },
  { id: 'hanzi', label: '汉字 à tracer', en: 'Characters' },
  { id: 'mistakes', label: 'Mes erreurs', en: 'My mistakes' },
  { id: 'program', label: 'Programme', en: 'Syllabus' },
];

export default function ExamPrepView({ data }) {
  const [tab, setTab] = useState('exam');
  const mistakes = useMistakes();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const daysLeft = Math.round((EXAM_DATE - today) / 86400000);

  return (
    <div>
      <div className="mb-6">
        <p className="text-xs font-semibold text-primary uppercase tracking-wider mb-1">
          {daysLeft >= 0 ? 'Examen — semaines 1 à 5 · 1 heure' : `Révisions — ${data.lessons.length} leçons`}
        </p>
        <h2 className="text-2xl font-semibold">{daysLeft >= 0 ? 'Préparation à l\'examen du 14 octobre' : 'Révisions & entraînement'}</h2>
        <p className="text-sm text-muted/70 italic">{daysLeft >= 0 ? 'Preparing for the 14 October exam' : 'Revision & practice'}</p>
        <p className="text-sm text-muted">
          Leçons L01 à L{String(data.lessons.length).padStart(2, '0')} et les {HANZI.length} caractères à savoir écrire
          {daysLeft >= 0 && <> ·{' '}
            <span className={`font-semibold ${daysLeft <= 3 ? 'text-primary' : 'text-accent'}`}>
              {daysLeft > 0 ? `J-${daysLeft}` : 'c\'est aujourd\'hui !'}
            </span></>}
          {daysLeft < 0 && ' · le sujet blanc suit le format du partiel du 14 octobre'}
        </p>
        <p className="text-sm text-muted/70 italic">
          Lessons L01 to L{String(data.lessons.length).padStart(2, '0')} and the {HANZI.length} characters to write
          {daysLeft < 0 && ' · the mock exam follows the format of the 14 October midterm'}
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
            {t.label}{t.en && <span className="block text-[10px] font-normal opacity-70 italic">{t.en}</span>}
            {t.id === 'mistakes' && mistakes.items.length > 0 && (
              <span className="ml-1.5 px-1.5 py-0.5 rounded-full bg-primary text-white text-[10px] tabular-nums">{mistakes.items.length}</span>
            )}
          </button>
        ))}
      </div>

      {tab === 'exam' && <MockExamTab lessons={data.lessons} onResult={mistakes.onResult} />}
      {tab === 'train' && <TrainingTab lessons={data.lessons} onResult={mistakes.onResult} />}
      {tab === 'hanzi' && <HanziStudio onResult={mistakes.onResult} />}
      {tab === 'mistakes' && <MistakesTab mistakes={mistakes} />}
      {tab === 'program' && <ProgramTab lessons={data.lessons} />}
    </div>
  );
}

// ---------- Examen blanc ----------

const EXAM_SECTIONS = [
  ['完成句子', 'Remettre les mots dans l\'ordre', 5, 4, 'Put the words in order'],
  ['用汉字填空', 'Écrire le caractère dans la phrase, d\'après le pinyin', 5, 4, 'Write the character in the sentence, from its pinyin'],
  ['选词填空', 'Placer cinq mots dans cinq phrases', 5, 4, 'Place five words in five sentences'],
  ['Grammaire', 'Toutes les leçons', 10, 8, 'Grammar — all lessons'],
];

function formatClock(sec) {
  const m = Math.floor(Math.abs(sec) / 60);
  const s = Math.abs(sec) % 60;
  return `${sec < 0 ? '+' : ''}${m}:${String(s).padStart(2, '0')}`;
}

function ExamTimer({ minutes, running }) {
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    if (!running) return undefined;
    const t = setInterval(() => setElapsed(e => e + 1), 1000);
    return () => clearInterval(t);
  }, [running]);
  const left = minutes * 60 - elapsed;
  const pct = Math.min(100, (elapsed / (minutes * 60)) * 100);
  return (
    <div className="sticky top-[env(safe-area-inset-top,0px)] z-10 bg-surface/95 backdrop-blur py-2 mb-3">
      <div className="flex items-center justify-between text-sm mb-1">
        <span className="text-muted">{running ? 'Temps restant' : 'Temps utilisé'}</span>
        <span className={`font-semibold tabular-nums ${left < 0 ? 'text-primary' : left < 300 ? 'text-warning' : 'text-ink'}`}>
          {running ? formatClock(left) : formatClock(elapsed)}
          {left < 0 && running && ' (dépassé)'}
        </span>
      </div>
      <div className="w-full bg-border rounded-full h-1">
        <div className={`h-1 rounded-full ${left < 300 ? 'bg-primary' : 'bg-accent'}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function MockExamTab({ lessons, onResult }) {
  const [runId, setRunId] = useState(0);
  const [running, setRunning] = useState(false);
  const [history, setHistory] = useState(() => loadJson(HISTORY_KEY, []));
  const build = useCallback(() => mockExam(lessons), [lessons]);

  const start = () => { setRunId(r => r + 1); setRunning(true); };
  const onFinish = useCallback((summary) => {
    setRunning(false);
    if (summary.score === null) return;
    setHistory(prev => {
      const next = [{ at: Date.now(), score: Math.round(summary.score * 2) / 2, rounds: summary.rounds.map(r => Math.round((r.total ? r.correct / r.total : 0) * 100)) }, ...prev].slice(0, 20);
      saveJson(HISTORY_KEY, next);
      return next;
    });
  }, []);

  if (runId === 0) {
    return (
      <div className="max-w-lg mx-auto space-y-4">
        <div className="bg-surface-alt border border-border rounded-2xl p-6">
          <h3 className="font-semibold mb-1">Sujet blanc — format du partiel du 14 octobre</h3>
          <p className="text-sm text-muted mb-1">1 heure, 4 sections, 25 questions, comme le vrai sujet. Le chronomètre démarre avec le sujet ; chaque sujet est tiré au hasard dans toute la banque.</p>
          <p className="text-sm text-muted/70 italic mb-4">1 hour, 4 sections, 25 questions, like the real paper. The timer starts with the paper; each paper is drawn at random from the whole bank.</p>
          <table className="w-full text-sm mb-5">
            <thead>
              <tr className="text-xs text-muted uppercase tracking-wider">
                <th className="text-left font-semibold pb-1" colSpan={2}>Section</th>
                <th className="text-right font-semibold pb-1">Questions</th>
                <th className="text-right font-semibold pb-1">Points</th>
              </tr>
            </thead>
            <tbody>
              {EXAM_SECTIONS.map(([name, desc, n, pts, descEn], i) => (
                <tr key={name} className="border-t border-border/60">
                  <td className="py-2 pr-2 text-muted tabular-nums align-top">{i + 1}</td>
                  <td className="py-2 pr-3"><span className="font-medium hanzi-display">{name}</span><span className="block text-xs text-muted">{desc}</span><span className="block text-xs text-muted/70 italic">{descEn}</span></td>
                  <td className="py-2 text-right tabular-nums align-top">{n}</td>
                  <td className="py-2 text-right tabular-nums align-top font-medium">{pts}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="text-xs text-muted mb-4">Le barème réel n'est pas connu : les points suivent ici le nombre de questions.<br /><span className="italic opacity-70">The real marking scheme isn't known: points here follow the number of questions.</span></p>
          <button onClick={start}
            className="w-full py-3 bg-accent text-white rounded-xl font-medium hover:bg-accent/90 transition-colors">
            Commencer un sujet (60 min) · Start a paper
          </button>
        </div>
        {history.length > 0 && (
          <div className="bg-surface-alt border border-border rounded-2xl p-5">
            <h3 className="font-semibold mb-2 text-sm">Mes sujets blancs <span className="font-normal text-muted italic opacity-70">· My mock exams</span></h3>
            <ul className="space-y-1.5">
              {history.slice(0, 8).map(h => (
                <li key={h.at} className="flex items-center gap-3 text-sm">
                  <span className="text-muted w-24 shrink-0 tabular-nums">{new Date(h.at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })} {new Date(h.at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
                  <span className="flex-1 bg-border rounded-full h-1.5"><span className={`block h-1.5 rounded-full ${h.score >= 16 ? 'bg-success' : h.score >= 10 ? 'bg-accent' : 'bg-primary'}`} style={{ width: `${(h.score / 20) * 100}%` }} /></span>
                  <span className="font-semibold tabular-nums w-14 text-right">{h.score} / 20</span>
                </li>
              ))}
            </ul>
            <p className="text-xs text-muted mt-2">Détail par section du dernier sujet : {history[0].rounds.map((r, i) => `${EXAM_SECTIONS[i]?.[0] ?? i + 1} ${r} %`).join(' · ')}</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div>
      <ExamTimer key={`timer-${runId}`} minutes={60} running={running} />
      <div className="flex justify-end mb-3">
        <button onClick={start} className="text-sm text-accent hover:underline">Nouveau sujet ↻</button>
      </div>
      <LessonExercises key={`exam-${runId}`} buildSession={build} onResult={onResult} onFinish={onFinish} />
    </div>
  );
}

// ---------- Entraînement par thème ----------

function TrainingTab({ lessons, onResult }) {
  const [topic, setTopic] = useState(null);
  const [runId, setRunId] = useState(0);
  const build = useCallback(() => topicSession(topic, lessons), [topic, lessons]);

  if (topic) {
    const meta = TOPICS.find(t => t.id === topic) || { title: 'Tout mélanger' };
    return (
      <div>
        <div className="flex items-center justify-between mb-3">
          <button onClick={() => setTopic(null)} className="text-sm text-accent hover:underline">&larr; Thèmes</button>
          <p className="text-sm font-medium hanzi-display">{meta.title}</p>
          <button onClick={() => setRunId(r => r + 1)} className="text-sm text-accent hover:underline">Nouvelle série ↻</button>
        </div>
        <LessonExercises key={`${topic}-${runId}`} buildSession={build} onResult={onResult} />
      </div>
    );
  }

  return (
    <div>
      <button onClick={() => setTopic('mix')}
        className="w-full mb-4 bg-ink text-white rounded-2xl p-4 text-left hover:opacity-90 transition-opacity">
        <p className="font-semibold">Tout mélanger <span className="font-normal opacity-70 italic">· Mix everything</span></p>
        <p className="text-sm opacity-80">25 exercices tirés de tous les thèmes · <span className="italic">25 exercises from every topic</span></p>
      </button>
      <div className="grid gap-3 sm:grid-cols-2">
        {TOPICS.map(t => (
          <button key={t.id} onClick={() => setTopic(t.id)}
            className="bg-surface-alt border border-border rounded-xl p-4 text-left hover:border-accent/40 hover:shadow-sm transition-all flex items-center gap-3">
            <span className="w-10 h-10 shrink-0 rounded-lg bg-accent/10 text-accent hanzi-display text-xl font-semibold flex items-center justify-center">{t.badge}</span>
            <span className="flex-1 min-w-0">
              <span className="block font-medium hanzi-display">{t.title}</span>
              {t.title_en && t.title_en !== t.title && <span className="block text-xs text-muted/70 italic">{t.title_en}</span>}
              <span className="block text-xs text-muted">{t.desc}</span>
              {t.desc_en && <span className="block text-xs text-muted/70 italic">{t.desc_en}</span>}
            </span>
            {t.tag && <span className="text-[10px] font-semibold uppercase tracking-wider text-primary bg-primary/10 px-2 py-0.5 rounded-full shrink-0">{t.tag}</span>}
            {t.exam && <span className="text-[10px] font-semibold uppercase tracking-wider text-accent bg-accent/10 px-2 py-0.5 rounded-full shrink-0">Examen</span>}
          </button>
        ))}
      </div>
    </div>
  );
}

// ---------- Mes erreurs ----------

const TYPE_LABELS = {
  'fill-mcq': 'Choix', 'grammar-mcq': 'Grammaire', 'error-correction': 'Correction', order: 'Ordre des mots',
  'hanzi-write': '汉字', translate: 'Traduction', 'reading-mcq': 'Lecture', 'vocab-mcq': 'Vocabulaire', 'true-false': 'Vrai/faux',
};

function MistakesTab({ mistakes }) {
  const [runId, setRunId] = useState(0);
  const snapshot = useRef([]);
  const build = useCallback(() => mistakesSession(snapshot.current), [runId]); // eslint-disable-line react-hooks/exhaustive-deps
  const { items } = mistakes;

  if (runId > 0) {
    return (
      <div>
        <div className="flex items-center justify-between mb-3">
          <button onClick={() => setRunId(0)} className="text-sm text-accent hover:underline">&larr; Mes erreurs</button>
          <p className="text-sm text-muted">Une bonne réponse retire l'exercice de la liste. <span className="italic opacity-70">A correct answer removes it from the list.</span></p>
        </div>
        <LessonExercises key={`mist-${runId}`} buildSession={build} onResult={mistakes.onResult} />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="text-center py-12 text-muted">
        <p className="text-lg font-medium text-ink mb-1">Aucune erreur enregistrée</p>
        <p className="text-sm italic opacity-70 mb-2">No mistakes recorded yet</p>
        <p className="text-sm">Chaque exercice raté dans l'examen blanc, l'entraînement ou la dictée arrive ici, pour être refait.</p>
        <p className="text-sm italic opacity-70">Every exercise you miss in the mock exam, practice or dictation lands here so you can redo it.</p>
      </div>
    );
  }

  const counts = items.reduce((acc, q) => { acc[q.type] = (acc[q.type] || 0) + 1; return acc; }, {});
  return (
    <div className="max-w-lg mx-auto">
      <div className="bg-surface-alt border border-border rounded-2xl p-5 mb-4">
        <p className="text-3xl font-semibold tabular-nums">{items.length}</p>
        <p className="text-sm text-muted mb-3">exercice{items.length > 1 ? 's' : ''} à revoir · <span className="italic opacity-70">to review</span></p>
        <div className="flex flex-wrap gap-1.5 mb-4">
          {Object.entries(counts).map(([type, n]) => (
            <span key={type} className="text-xs px-2 py-1 rounded-full bg-border/60 hanzi-display">{TYPE_LABELS[type] || type} · {n}</span>
          ))}
        </div>
        <button onClick={() => { snapshot.current = shuffle(items); setRunId(r => r + 1); }}
          className="w-full py-3 bg-accent text-white rounded-xl font-medium hover:bg-accent/90 transition-colors">
          Refaire mes erreurs {items.length > 20 ? '(20 au hasard)' : ''} · Redo my mistakes
        </button>
        <button onClick={mistakes.clear} className="w-full mt-2 py-2 text-sm text-muted hover:text-primary">Vider la liste · Clear the list</button>
      </div>
      <ul className="space-y-1.5">
        {items.slice(0, 12).map(q => (
          <li key={exerciseKey(q)} className="text-sm bg-surface-alt border border-border rounded-lg px-3 py-2 flex gap-2">
            <span className="text-xs text-muted w-24 shrink-0">{TYPE_LABELS[q.type] || q.type}</span>
            <span className="hanzi-display truncate">{q.sentence || q.wrong || q.fr || q.question || (q.pattern && `${q.pattern} — ${q.correct}`) || (q.char && `${q.word} (${q.char})`) || q.statement || q.prompt}</span>
          </li>
        ))}
      </ul>
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
          <span className="text-muted">Points de grammaire maîtrisés · <span className="italic opacity-70">Grammar points mastered</span></span>
          <span className="font-medium tabular-nums">{done} / {total}</span>
        </div>
        <div className="w-full bg-border rounded-full h-1.5">
          <div className="bg-success h-1.5 rounded-full transition-all" style={{ width: `${total ? (done / total) * 100 : 0}%` }} />
        </div>
      </div>
      <div className="space-y-5">
        {lessons.map(l => (
          <section key={l.id}>
            <p className="text-xs font-semibold text-accent uppercase tracking-wider mb-2">Semaine {l.week} — {l.title_fr}{l.title_en && <span className="normal-case font-normal text-muted italic opacity-70"> · {l.title_en}</span>}</p>
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
                        {g.explanation_en && <p className="text-muted/70 italic mt-1"><Zh text={g.explanation_en} pinyin={false} /></p>}
                        {g.examples?.[0] && (
                          <p className="mt-2 hanzi-display"><Zh text={g.examples[0].zh} /> <span className="text-xs text-muted">— {g.examples[0].fr}{g.examples[0].en && <span className="italic opacity-70"> / {g.examples[0].en}</span>}</span></p>
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

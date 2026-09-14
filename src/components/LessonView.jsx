import { useState } from 'react';
import LessonReader from './LessonReader';
import LessonExercises from './LessonExercises';

const TABS = [
  { id: 'lecture', label: 'Lecture' },
  { id: 'vocab', label: 'Vocabulaire' },
  { id: 'grammar', label: 'Grammaire' },
  { id: 'exercices', label: 'Exercices' },
];

export default function LessonView({ lesson, appData, onCharClick }) {
  const [tab, setTab] = useState('lecture');

  return (
    <div>
      <div className="mb-6">
        <p className="text-xs font-semibold text-accent uppercase tracking-wider mb-1">
          Semaine {lesson.week} — {lesson.theme}
        </p>
        <h2 className="text-2xl font-semibold">{lesson.title_fr}</h2>
      </div>

      <div className="flex gap-1 mb-6 border-b border-border pb-px">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
              tab === t.id
                ? 'bg-surface-alt text-accent border border-border border-b-transparent -mb-px'
                : 'text-muted hover:text-primary'
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'lecture' && (
        <LessonReader lesson={lesson} appData={appData} />
      )}

      {tab === 'vocab' && (
        <VocabTab lesson={lesson} onCharClick={onCharClick} />
      )}

      {tab === 'grammar' && (
        <GrammarTab lesson={lesson} />
      )}

      {tab === 'exercices' && (
        <LessonExercises lesson={lesson} />
      )}
    </div>
  );
}

function VocabTab({ lesson, onCharClick }) {
  const [flipped, setFlipped] = useState(new Set());
  const [filter, setFilter] = useState('all');

  const vocabFiltered = filter === 'all'
    ? lesson.vocab
    : filter === 'locatifs'
      ? lesson.vocab.filter(v => v.forms || ['左','右','前','后','里','外','上','下','旁边','中间','附近','东','南','西','北','对面'].includes(v.word))
      : lesson.vocab.filter(v => !v.forms && !['左','右','前','后','里','外','上','下','旁边','中间','附近','东','南','西','北','对面'].includes(v.word));

  const toggle = (word) => {
    setFlipped(prev => {
      const next = new Set(prev);
      next.has(word) ? next.delete(word) : next.add(word);
      return next;
    });
  };

  const speak = (text) => {
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'zh-CN';
    u.rate = 0.85;
    speechSynthesis.speak(u);
  };

  return (
    <div>
      <div className="flex gap-2 mb-4">
        {[
          { id: 'all', label: `Tous (${lesson.vocab.length})` },
          { id: 'locatifs', label: 'Locatifs' },
          { id: 'general', label: 'Vocabulaire' },
        ].map(f => (
          <button key={f.id} onClick={() => setFilter(f.id)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
              filter === f.id ? 'bg-accent text-white' : 'bg-border/50 text-muted hover:bg-border'
            }`}>
            {f.label}
          </button>
        ))}
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        {vocabFiltered.map(v => {
          const isFlipped = flipped.has(v.word);
          return (
            <button key={v.word} onClick={() => toggle(v.word)}
              className="bg-surface-alt border border-border rounded-xl p-4 text-left hover:shadow-sm transition-all group">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <p className="text-xl hanzi-display font-medium mb-1"
                    onClick={(e) => { e.stopPropagation(); onCharClick?.(v.word[0]); }}>
                    {v.word}
                  </p>
                  {isFlipped ? (
                    <>
                      <p className="text-accent text-sm font-medium">{v.pinyin}</p>
                      <p className="text-sm text-muted mt-0.5">{v.gloss_fr}</p>
                      {v.forms && <p className="text-xs text-muted mt-1 italic">{v.forms}</p>}
                      {v.example && (
                        <p className="text-xs text-muted mt-2 border-t border-border/50 pt-2 leading-relaxed">
                          {v.example}
                        </p>
                      )}
                    </>
                  ) : (
                    <p className="text-xs text-muted">Touchez pour révéler</p>
                  )}
                </div>
                <button onClick={(e) => { e.stopPropagation(); speak(v.word); }}
                  className="text-muted hover:text-accent transition-colors shrink-0 mt-1"
                  title="Écouter">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                    <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                    <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
                  </svg>
                </button>
              </div>
              {v.hsk && (
                <span className={`inline-block mt-2 text-xs px-1.5 py-0.5 rounded-full font-medium ${
                  v.hsk <= 1 ? 'bg-a1/10 text-a1' : v.hsk <= 2 ? 'bg-a2/10 text-a2' : 'bg-b1/10 text-b1'
                }`}>HSK{v.hsk}</span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function GrammarTab({ lesson }) {
  const [expanded, setExpanded] = useState(new Set([0]));

  const toggle = (i) => {
    setExpanded(prev => {
      const next = new Set(prev);
      next.has(i) ? next.delete(i) : next.add(i);
      return next;
    });
  };

  return (
    <div className="space-y-3">
      {lesson.grammar.map((g, i) => (
        <div key={i} className="bg-surface-alt border border-border rounded-xl overflow-hidden">
          <button onClick={() => toggle(i)}
            className="w-full text-left p-4 flex items-center justify-between hover:bg-border/30 transition-colors">
            <span className="font-semibold text-sm">{g.pattern}</span>
            <span className="text-muted text-xs">{expanded.has(i) ? '−' : '+'}</span>
          </button>
          {expanded.has(i) && (
            <div className="px-4 pb-4 border-t border-border/50 pt-3">
              <p className="text-sm text-muted mb-4">{g.explanation_fr}</p>
              <div className="space-y-3">
                {g.examples.map((ex, j) => (
                  <div key={j} className="bg-accent/5 rounded-lg p-3">
                    <p className="text-base hanzi-display mb-1">{ex.zh}</p>
                    <p className="text-xs text-accent">{ex.pinyin}</p>
                    <p className="text-xs text-muted mt-1">{ex.fr}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

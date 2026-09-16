import { useState, useRef, useEffect, useMemo } from 'react';

function buildDict(lessonVocab, appChars, appVocab) {
  const dict = new Map();
  for (const v of lessonVocab) {
    dict.set(v.word, { pinyin: v.pinyin, gloss: v.gloss_fr, source: 'lesson' });
  }
  for (const v of appVocab) {
    if (!dict.has(v.word)) {
      dict.set(v.word, { pinyin: v.pinyin_marked, gloss: v.gloss_fr, source: 'app' });
    }
  }
  for (const c of appChars) {
    if (!dict.has(c.hanzi)) {
      dict.set(c.hanzi, { pinyin: c.pinyin_marked, gloss: c.gloss_fr, source: 'char' });
    }
  }
  return dict;
}

function segmentText(text, dict) {
  const tokens = [];
  let i = 0;
  while (i < text.length) {
    const ch = text[i];
    if (/[一-鿿]/.test(ch)) {
      let best = null;
      for (let len = Math.min(4, text.length - i); len >= 1; len--) {
        const candidate = text.substring(i, i + len);
        if (dict.has(candidate)) {
          best = { text: candidate, type: 'word', entry: dict.get(candidate) };
          break;
        }
      }
      if (best) {
        tokens.push(best);
        i += best.text.length;
      } else {
        tokens.push({ text: ch, type: 'char', entry: dict.get(ch) || null });
        i++;
      }
    } else {
      let run = '';
      while (i < text.length && !/[一-鿿]/.test(text[i])) {
        run += text[i];
        i++;
      }
      tokens.push({ text: run, type: 'punct' });
    }
  }
  return tokens;
}

function WordPopup({ entry, text, rect, onClose }) {
  const popupRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (popupRef.current && !popupRef.current.contains(e.target)) onClose();
    };
    document.addEventListener('pointerdown', handler);
    return () => document.removeEventListener('pointerdown', handler);
  }, [onClose]);

  const style = {
    position: 'fixed',
    left: `${Math.max(8, Math.min(rect.left + rect.width / 2 - 100, window.innerWidth - 208))}px`,
    top: rect.top < 160 ? `${rect.bottom + 8}px` : undefined,
    bottom: rect.top >= 160 ? `${window.innerHeight - rect.top + 8}px` : undefined,
    width: '200px',
    zIndex: 60,
  };

  return (
    <div ref={popupRef} style={style}
      className="bg-surface-alt border border-border rounded-xl shadow-lg p-3 animate-fade-in">
      <p className="text-2xl hanzi-display text-center mb-1">{text}</p>
      <p className="text-accent font-medium text-center text-sm">{entry.pinyin}</p>
      <p className="text-muted text-center text-xs mt-1">{entry.gloss}</p>
    </div>
  );
}

export default function LessonReader({ lesson, appData }) {
  const [popup, setPopup] = useState(null);
  const [showEnglish, setShowEnglish] = useState(false);
  const lessonVocabSet = useMemo(
    () => new Set(lesson.vocab.map(v => v.word)),
    [lesson]
  );

  const dict = useMemo(
    () => buildDict(lesson.vocab, appData.characters, appData.vocab),
    [lesson, appData]
  );

  const handleWordClick = (token, e) => {
    if (!token.entry) return;
    const rect = e.currentTarget.getBoundingClientRect();
    setPopup({ text: token.text, entry: token.entry, rect });
  };

  const speak = (text) => {
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'zh-CN';
    u.rate = 0.85;
    speechSynthesis.speak(u);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-lg font-semibold">Lecture interactive</h3>
        <div className="flex gap-2">
          {lesson.reading.paragraphs_en && (
            <button
              onClick={() => setShowEnglish(prev => !prev)}
              className={`text-xs px-3 py-1.5 rounded-full font-medium transition-colors ${
                showEnglish ? 'bg-accent text-white' : 'bg-accent/10 text-accent hover:bg-accent/20'
              }`}
            >
              {showEnglish ? 'Hide EN' : 'Show EN'}
            </button>
          )}
          <button
            onClick={() => speak(lesson.reading.paragraphs.join('\n'))}
            className="text-xs px-3 py-1.5 rounded-full bg-accent/10 text-accent font-medium hover:bg-accent/20 transition-colors"
          >
            Écouter le texte
          </button>
        </div>
      </div>

      <p className="text-xs text-muted -mt-4">Touchez un mot pour voir sa définition. Les mots de la leçon sont soulignés.</p>

      <div className="bg-surface-alt border border-border rounded-2xl p-5 md:p-8 space-y-5">
        {lesson.reading.paragraphs.map((para, pi) => {
          const tokens = segmentText(para, dict);
          return (
            <div key={pi}>
              <p className="text-lg leading-relaxed hanzi-display">
                {tokens.map((tok, ti) => {
                  if (tok.type === 'punct') return <span key={ti}>{tok.text}</span>;
                  const isLesson = lessonVocabSet.has(tok.text);
                  const hasEntry = !!tok.entry;
                  return (
                    <span
                      key={ti}
                      onClick={hasEntry ? (e) => handleWordClick(tok, e) : undefined}
                      className={[
                        hasEntry ? 'cursor-pointer hover:bg-accent/10 rounded-sm transition-colors' : '',
                        isLesson ? 'underline decoration-accent/40 decoration-2 underline-offset-4' : '',
                      ].filter(Boolean).join(' ')}
                    >
                      {tok.text}
                    </span>
                  );
                })}
              </p>
              {showEnglish && lesson.reading.paragraphs_en?.[pi] && (
                <p className="text-sm text-muted/70 italic mt-1 leading-relaxed">{lesson.reading.paragraphs_en[pi]}</p>
              )}
            </div>
          );
        })}
      </div>

      {popup && (
        <WordPopup
          text={popup.text}
          entry={popup.entry}
          rect={popup.rect}
          onClose={() => setPopup(null)}
        />
      )}
    </div>
  );
}

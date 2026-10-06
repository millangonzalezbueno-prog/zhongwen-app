import { createContext, useContext, useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { segment, describe } from '../lib/gloss';

const PINYIN_KEY = 'zw-show-pinyin';

const GlossContext = createContext(null);

export function useGloss() {
  return useContext(GlossContext);
}

export function GlossProvider({ dict, onCharClick, children }) {
  const [showPinyin, setShowPinyin] = useState(() => {
    try { return localStorage.getItem(PINYIN_KEY) === '1'; } catch { return false; }
  });
  const [popup, setPopup] = useState(null);

  const togglePinyin = useCallback(() => {
    setShowPinyin(v => {
      try { localStorage.setItem(PINYIN_KEY, v ? '0' : '1'); } catch { /* storage unavailable */ }
      return !v;
    });
  }, []);

  const value = useMemo(() => ({ dict, showPinyin, togglePinyin, setPopup, onCharClick }), [dict, showPinyin, togglePinyin, onCharClick]);

  return (
    <GlossContext.Provider value={value}>
      {children}
      {popup && <WordPopup popup={popup} dict={dict} onClose={() => setPopup(null)} onCharClick={onCharClick} />}
    </GlossContext.Provider>
  );
}

export function PinyinToggle() {
  const g = useGloss();
  if (!g) return null;
  return (
    <button onClick={g.togglePinyin} aria-pressed={g.showPinyin} title="Afficher le pinyin au-dessus des caractères"
      className={`px-2.5 py-1.5 rounded-md text-sm font-medium transition-colors ${
        g.showPinyin ? 'bg-accent text-white' : 'text-muted hover:bg-border/50'
      }`}>
      <span className="hanzi-display">拼音</span>
    </button>
  );
}

// Renders Chinese (mixed with any other text): each word is tappable for a gloss,
// with optional pinyin above. gloss={false} keeps the pinyin but disables popups
// (used on answer choices so the gloss can't give the answer away).
export default function Zh({ text, gloss = true, pinyin, className = '', highlight }) {
  const g = useGloss();
  const tokens = useMemo(() => (g && text ? segment(String(text), g.dict) : null), [g, text]);
  if (!g || !tokens) return <span className={className}>{text}</span>;
  const withPinyin = pinyin ?? g.showPinyin;

  // Hover previews never replace a popup the user pinned with a click.
  const open = (e, tok, pinned) => {
    const rect = e.currentTarget.getBoundingClientRect();
    g.setPopup(p => (!pinned && p?.pinned ? p : { token: tok, rect, pinned }));
  };

  return (
    <span className={className}>
      {tokens.map((tok, i) => {
        if (!tok.han) return <span key={i}>{tok.text}</span>;
        const body = withPinyin
          ? [...tok.text].map((ch, k) => (
            <ruby key={k} className="zh-ruby">{ch}<rt>{tok.pinyin[k]}</rt></ruby>
          ))
          : tok.text;
        if (!gloss) return <span key={i}>{body}</span>;
        const inLesson = highlight?.has(tok.text);
        return (
          <span key={i} role="button" tabIndex={0}
            onClick={(e) => { e.stopPropagation(); e.preventDefault(); open(e, tok, true); }}
            onPointerEnter={(e) => { if (e.pointerType === 'mouse') open(e, tok, false); }}
            onPointerLeave={(e) => { if (e.pointerType === 'mouse') g.setPopup(p => (p && !p.pinned && p.token === tok ? null : p)); }}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.stopPropagation(); open(e, tok, true); } }}
            className={`cursor-pointer rounded-sm hover:bg-accent/10 transition-colors ${
              inLesson ? 'underline decoration-accent/40 decoration-2 underline-offset-4' : ''
            }`}>
            {body}
          </span>
        );
      })}
    </span>
  );
}

function WordPopup({ popup, dict, onClose, onCharClick }) {
  const ref = useRef(null);
  const info = describe(popup.token, dict);
  const { rect, pinned } = popup;

  useEffect(() => {
    if (!pinned) return undefined;
    const onDown = (e) => { if (ref.current && !ref.current.contains(e.target)) onClose(); };
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    const onScroll = () => onClose();
    document.addEventListener('pointerdown', onDown);
    document.addEventListener('keydown', onKey);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      document.removeEventListener('pointerdown', onDown);
      document.removeEventListener('keydown', onKey);
      window.removeEventListener('scroll', onScroll);
    };
  }, [pinned, onClose]);

  const speak = () => {
    try {
      const u = new SpeechSynthesisUtterance(info.word);
      u.lang = 'zh-CN';
      u.rate = 0.8;
      speechSynthesis.speak(u);
    } catch { /* speech unavailable */ }
  };

  const width = 240;
  const above = rect.top > 220;
  const style = {
    position: 'fixed',
    left: Math.max(8, Math.min(rect.left + rect.width / 2 - width / 2, window.innerWidth - width - 8)),
    top: above ? undefined : rect.bottom + 8,
    bottom: above ? window.innerHeight - rect.top + 8 : undefined,
    width,
    zIndex: 60,
  };

  return (
    <div ref={ref} style={style} role="dialog" aria-label={`${info.word} ${info.pinyin}`}
      className={`bg-surface-alt border border-border rounded-xl shadow-lg p-3 text-left ${pinned ? '' : 'pointer-events-none'}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex gap-0.5">
          {[...info.word].map((ch, i) => (
            <button key={i} onClick={() => { onClose(); onCharClick?.(ch); }} disabled={!pinned}
              title="Ordre des traits"
              className="text-3xl hanzi-display leading-none px-1 py-0.5 rounded-md hover:bg-accent/10 disabled:hover:bg-transparent">
              {ch}
            </button>
          ))}
        </div>
        {pinned && (
          <button onClick={speak} title="Écouter" className="text-muted hover:text-accent shrink-0 mt-1" aria-label="Écouter">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" /><path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
            </svg>
          </button>
        )}
      </div>
      <p className="text-accent font-medium mt-1">{info.pinyin}</p>
      {info.fr && <p className="text-sm mt-1">{info.fr}</p>}
      {info.en && <p className="text-xs text-muted italic mt-0.5 line-clamp-3">{info.en}</p>}
      {!info.fr && !info.en && <p className="text-xs text-muted mt-1">Pas de définition — voir chaque caractère.</p>}
      <p className="text-[11px] text-muted mt-2">
        {info.lessons.length > 0 && <span className="text-accent font-medium">{info.lessons.join(', ')} · </span>}
        {pinned ? 'Touchez un caractère pour l\'ordre des traits' : 'Cliquez pour épingler'}
      </p>
    </div>
  );
}

import { useEffect, useRef } from 'react';
import HanziWriter from 'hanzi-writer';

export default function CharacterPopup({ character, charData, onClose }) {
  const containerRef = useRef(null);
  const writerRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current || !character) return;
    containerRef.current.innerHTML = '';
    try {
      writerRef.current = HanziWriter.create(containerRef.current, character, {
        width: 160,
        height: 160,
        padding: 5,
        strokeColor: '#2563eb',
        outlineColor: '#dbeafe',
        showOutline: true,
        delayBetweenStrokes: 200,
      });
      writerRef.current.animateCharacter();
    } catch {
      writerRef.current = null;
    }
    return () => {
      if (containerRef.current) containerRef.current.innerHTML = '';
    };
  }, [character]);

  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  if (!character) return null;

  const d = charData || {};

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-ink/30 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-surface-alt rounded-2xl shadow-xl border border-border w-full max-w-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3 border-b border-border bg-accent/5">
          <span className="text-xs font-semibold text-accent uppercase tracking-wider">Détails du caractère</span>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-border/50 text-muted transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 flex flex-col items-center">
          <div className="bg-accent/5 rounded-2xl p-4 border border-accent/10 mb-4 relative">
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-5">
              <div className="w-full h-px bg-ink" />
              <div className="h-full w-px bg-ink absolute" />
            </div>
            <div ref={containerRef} className="relative z-10" />
          </div>

          <button onClick={() => writerRef.current?.animateCharacter()}
            className="text-xs text-accent font-medium hover:underline mb-4">
            &#9654; Rejouer l'animation
          </button>

          <div className="text-center mb-4">
            <p className="text-4xl hanzi-display font-medium">{character}</p>
            {d.pinyin_marked && <p className="text-lg text-accent font-medium mt-1">{d.pinyin_marked}</p>}
          </div>

          {(d.gloss_fr || d.gloss_en) && (
            <div className="w-full space-y-1.5 text-sm">
              {d.gloss_fr && <InfoRow label="Français" value={d.gloss_fr} />}
              {d.gloss_en && <InfoRow label="English" value={d.gloss_en} />}
              {d.radical && <InfoRow label="Radical" value={d.radical} />}
              {d.stroke_count && <InfoRow label="Traits" value={d.stroke_count} />}
              {d.structure_type && <InfoRow label="Structure" value={d.structure_type} />}
              {d.pos && <InfoRow label="Classe" value={d.pos} />}
              {(d.intro_tier || d.tier) && <InfoRow label="Niveau" value={d.intro_tier || d.tier} />}
              {d.themes && <InfoRow label="Thèmes" value={d.themes.join(', ')} />}
              {d.example_zh && (
                <div className="pt-2 mt-2 border-t border-border">
                  <p className="text-xs text-muted mb-1">Exemple</p>
                  <p className="hanzi-display">{d.example_zh}</p>
                  {d.example_fr && <p className="text-muted text-xs">{d.example_fr}</p>}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="px-5 py-3 border-t border-border">
          <button onClick={onClose}
            className="w-full py-2.5 bg-ink text-white rounded-xl text-sm font-medium hover:bg-ink/90 transition-colors">
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div className="flex justify-between">
      <span className="text-muted">{label}</span>
      <span className="font-medium text-right">{value}</span>
    </div>
  );
}

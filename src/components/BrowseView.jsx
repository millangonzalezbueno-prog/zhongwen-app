import { useState, useMemo } from 'react';

const TIER_OPTIONS = ['Tous', 'A1', 'A2', 'B1'];
const SOURCE_OPTIONS = ['Caractères', 'Vocabulaire', 'Grammaire'];

export default function BrowseView({ data }) {
  const [tierFilter, setTierFilter] = useState('Tous');
  const [sourceFilter, setSourceFilter] = useState('Caractères');
  const [search, setSearch] = useState('');
  const [selectedItem, setSelectedItem] = useState(null);

  const items = useMemo(() => {
    let list;
    if (sourceFilter === 'Caractères') {
      list = data.characters.map(c => ({
        id: c.hanzi,
        primary: c.hanzi,
        secondary: c.pinyin_marked,
        gloss: c.gloss_fr,
        tier: c.intro_tier,
        type: 'character',
        raw: c,
      }));
    } else if (sourceFilter === 'Vocabulaire') {
      list = data.vocab.map(v => ({
        id: v.id,
        primary: v.word,
        secondary: v.pinyin_marked,
        gloss: v.gloss_fr,
        tier: v.tier,
        type: 'vocab',
        raw: v,
      }));
    } else {
      list = data.grammar.map(g => ({
        id: g.id,
        primary: g.pattern_zh || g.pattern,
        secondary: g.pattern,
        gloss: g.explanation_fr,
        tier: g.tier,
        type: 'grammar',
        raw: g,
      }));
    }

    if (tierFilter !== 'Tous') {
      list = list.filter(i => i.tier === tierFilter);
    }

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(i =>
        i.primary.includes(q) ||
        i.secondary?.toLowerCase().includes(q) ||
        i.gloss?.toLowerCase().includes(q)
      );
    }

    return list;
  }, [data, sourceFilter, tierFilter, search]);

  return (
    <div>
      <div className="flex flex-wrap gap-3 mb-4">
        <div className="flex gap-1">
          {SOURCE_OPTIONS.map(s => (
            <button
              key={s}
              onClick={() => { setSourceFilter(s); setSelectedItem(null); }}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                sourceFilter === s ? 'bg-accent text-white' : 'bg-surface-alt text-muted border border-border hover:bg-border/50'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
        <div className="flex gap-1">
          {TIER_OPTIONS.map(t => (
            <button
              key={t}
              onClick={() => setTierFilter(t)}
              className={`px-2.5 py-1.5 rounded-md text-sm font-medium transition-colors ${
                tierFilter === t ? 'bg-ink text-white' : 'bg-surface-alt text-muted border border-border hover:bg-border/50'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <input
        type="text"
        value={search}
        onChange={e => setSearch(e.target.value)}
        placeholder="Chercher (汉字, pinyin, français)..."
        className="w-full px-4 py-2.5 rounded-xl border border-border bg-surface-alt text-sm mb-4 outline-none focus:border-accent transition-colors"
      />

      <p className="text-xs text-muted mb-3">{items.length} résultats</p>

      {selectedItem ? (
        <DetailPanel item={selectedItem} onBack={() => setSelectedItem(null)} />
      ) : (
        <div className="grid gap-1.5">
          {items.slice(0, 100).map(item => (
            <button
              key={item.id}
              onClick={() => setSelectedItem(item)}
              className="flex items-center gap-4 px-4 py-3 bg-surface-alt rounded-xl border border-border text-left hover:border-accent/40 transition-colors"
            >
              <span className="text-2xl hanzi-display w-12 text-center flex-shrink-0">{item.primary}</span>
              <div className="flex-1 min-w-0">
                <span className="text-sm text-accent font-medium">{item.secondary}</span>
                <span className="text-sm text-muted ml-2 truncate">{item.gloss}</span>
              </div>
              <TierBadge tier={item.tier} />
            </button>
          ))}
          {items.length > 100 && (
            <p className="text-sm text-muted text-center py-2">
              ... et {items.length - 100} de plus. Affinez votre recherche.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function DetailPanel({ item, onBack }) {
  const r = item.raw;
  return (
    <div className="bg-surface-alt rounded-2xl border border-border p-6">
      <button onClick={onBack} className="text-sm text-accent mb-4 hover:underline">&larr; Retour</button>

      <div className="text-center mb-6">
        <p className="text-6xl hanzi-display font-medium mb-2">{item.primary}</p>
        <p className="text-xl text-accent font-medium">{r.pinyin_marked}</p>
        <TierBadge tier={item.tier} />
      </div>

      <div className="space-y-3 text-sm">
        <Row label="Français" value={r.gloss_fr} />
        {r.gloss_en && <Row label="English" value={r.gloss_en} />}
        {r.pos && <Row label="Classe" value={r.pos} />}
        {r.radical && <Row label="Radical" value={r.radical} />}
        {r.stroke_count && <Row label="Traits" value={r.stroke_count} />}
        {r.structure_type && <Row label="Structure" value={r.structure_type} />}
        {r.themes && <Row label="Thèmes" value={r.themes.join(', ')} />}
        {r.theme && <Row label="Thème" value={r.theme} />}
        {r.example_zh && (
          <div className="pt-3 border-t border-border">
            <p className="text-muted text-xs mb-1">Exemple</p>
            <p className="hanzi-display text-base">{r.example_zh}</p>
            {r.example_fr && <p className="text-muted">{r.example_fr}</p>}
          </div>
        )}
        {r.new_at_B1 && (
          <span className="inline-block px-2 py-0.5 bg-b1/10 text-b1 text-xs rounded-full font-medium">
            Nouveau au B1
          </span>
        )}
        {r.gap_char && (
          <span className="inline-block px-2 py-0.5 bg-warning/10 text-warning text-xs rounded-full font-medium">
            Caractère manquant (gap)
          </span>
        )}

        {item.type === 'grammar' && r.examples && (
          <div className="pt-3 border-t border-border space-y-3">
            <p className="text-muted text-xs">Exemples</p>
            {r.examples.map((ex, i) => (
              <div key={i}>
                <p className="hanzi-display">{ex.zh}</p>
                <p className="text-accent text-xs">{ex.pinyin}</p>
                <p className="text-muted">{ex.fr}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex justify-between">
      <span className="text-muted">{label}</span>
      <span className="font-medium text-right">{value}</span>
    </div>
  );
}

function TierBadge({ tier }) {
  const color = tier === 'A1' ? 'bg-a1/10 text-a1' : tier === 'A2' ? 'bg-a2/10 text-a2' : 'bg-b1/10 text-b1';
  return <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${color}`}>{tier}</span>;
}

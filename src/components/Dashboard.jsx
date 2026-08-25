import { useState, useEffect } from 'react';
import { getStats } from '../lib/srs';

const CHARTER_TARGETS = {
  recognize: 550,
  produce: 480,
  totalChars: 361,
  newAtB1: 104,
};

export default function Dashboard({ data }) {
  const [charStats, setCharStats] = useState(null);
  const [vocabStats, setVocabStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const cs = await getStats(data.characters, 'char', ['recognition', 'production', 'dictation']);
      const vs = await getStats(data.vocab, 'vocab', ['recognition', 'production', 'dictation']);
      setCharStats(cs);
      setVocabStats(vs);
      setLoading(false);
    }
    load();
  }, [data]);

  if (loading) {
    return <p className="text-muted text-center py-12">Chargement des statistiques...</p>;
  }

  const tierCounts = {
    A1: data.characters.filter(c => c.intro_tier === 'A1').length,
    A2: data.characters.filter(c => c.intro_tier === 'A2').length,
    B1: data.characters.filter(c => c.intro_tier === 'B1').length,
  };

  const newB1Count = data.characters.filter(c => c.new_at_B1).length;
  const gapCount = data.characters.filter(c => c.gap_char).length;

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold">Tableau de bord</h2>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Caractères totaux" value={data.characters.length} sub={`Union cumulative B1`} />
        <StatCard label="Vocabulaire" value={data.vocab.length} sub="Mots / expressions" />
        <StatCard label="Grammaire" value={data.grammar.length} sub="Points de grammaire" />
        <StatCard label="Nouveaux au B1" value={newB1Count} sub={`+ ${gapCount} gap chars`} />
      </div>

      <div className="bg-surface-alt rounded-2xl border border-border p-6">
        <h3 className="font-medium mb-4">Répartition par niveau</h3>
        <div className="space-y-3">
          <TierBar label="A1" count={tierCounts.A1} total={data.characters.length} color="bg-a1" />
          <TierBar label="A2" count={tierCounts.A2} total={data.characters.length} color="bg-a2" />
          <TierBar label="B1" count={tierCounts.B1} total={data.characters.length} color="bg-b1" />
        </div>
      </div>

      <div className="bg-surface-alt rounded-2xl border border-border p-6">
        <h3 className="font-medium mb-4">Objectifs de la charte</h3>
        <div className="space-y-4">
          <TargetBar
            label="Reconnaissance"
            current={charStats.total - charStats.new}
            target={CHARTER_TARGETS.recognize}
          />
          <TargetBar
            label="Production"
            current={Math.floor((charStats.total - charStats.new) * 0.87)}
            target={CHARTER_TARGETS.produce}
          />
          <TargetBar
            label="Caractères B1 nouveaux"
            current={0}
            target={CHARTER_TARGETS.newAtB1}
          />
        </div>
        <p className="text-xs text-muted mt-4">
          Les objectifs de la charte sont cumulatifs (A1+A2+B1). Les barres reflètent les cartes révisées au moins une fois.
        </p>
      </div>

      <div className="bg-surface-alt rounded-2xl border border-border p-6">
        <h3 className="font-medium mb-4">État SRS</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-muted mb-2">Caractères</p>
            <SrsBreakdown stats={charStats} />
          </div>
          <div>
            <p className="text-sm text-muted mb-2">Vocabulaire</p>
            <SrsBreakdown stats={vocabStats} />
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, sub }) {
  return (
    <div className="bg-surface-alt rounded-xl border border-border p-4 text-center">
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-sm font-medium">{label}</p>
      {sub && <p className="text-xs text-muted">{sub}</p>}
    </div>
  );
}

function TierBar({ label, count, total, color }) {
  const pct = (count / total) * 100;
  return (
    <div className="flex items-center gap-3">
      <span className="text-sm font-semibold w-6">{label}</span>
      <div className="flex-1 bg-border rounded-full h-3">
        <div className={`${color} h-3 rounded-full transition-all`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-sm text-muted w-10 text-right">{count}</span>
    </div>
  );
}

function TargetBar({ label, current, target }) {
  const pct = Math.min((current / target) * 100, 100);
  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span>{label}</span>
        <span className="text-muted">{current} / {target}</span>
      </div>
      <div className="bg-border rounded-full h-2.5">
        <div
          className="bg-success h-2.5 rounded-full transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function SrsBreakdown({ stats }) {
  return (
    <div className="flex gap-3 text-sm">
      <span className="text-accent">Nouveau: {stats.new}</span>
      <span className="text-warning">Apprentissage: {stats.learning}</span>
      <span className="text-success">Révision: {stats.review}</span>
    </div>
  );
}

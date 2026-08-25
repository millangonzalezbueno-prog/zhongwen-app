import { useState, useEffect, useCallback } from 'react';
import { getDueCards, reviewCard, Rating } from '../lib/srs';
import { filterByTier } from '../lib/data';
import ReviewCard from './ReviewCard';

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function ReviewSession({ data, filters, mode = 'review' }) {
  const [queue, setQueue] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [sessionStats, setSessionStats] = useState({ reviewed: 0, correct: 0 });
  const [loading, setLoading] = useState(true);

  const tiers = mode === 'b1study' ? ['B1'] : ['A1', 'A2'];
  const newPerSession = mode === 'b1study' ? 8 : 15;

  const loadQueue = useCallback(async () => {
    setLoading(true);
    const items = [];
    const dirs = filters.directions;

    const chars = filterByTier(data.characters, tiers);
    const dueChars = await getDueCards(chars, 'char', dirs);
    items.push(...dueChars);

    const vocab = filterByTier(data.vocab, tiers);
    const dueVocab = await getDueCards(vocab, 'vocab', dirs);
    items.push(...dueVocab);

    const allNew = shuffle(items.filter(i => i.card.state === 0));
    const reviewCards = items.filter(i => i.card.state !== 0);
    const newCards = allNew.slice(0, newPerSession);
    const combined = shuffle([...reviewCards, ...newCards]);

    setQueue(combined);
    setCurrentIndex(0);
    setSessionStats({ reviewed: 0, correct: 0 });
    setLoading(false);
  }, [data, filters.directions, tiers.join(','), newPerSession]);

  useEffect(() => {
    loadQueue();
  }, [loadQueue]);

  const handleRating = async (rating) => {
    const current = queue[currentIndex];
    await reviewCard(current.cardId, rating);
    setSessionStats(prev => ({
      reviewed: prev.reviewed + 1,
      correct: prev.correct + (rating >= Rating.Good ? 1 : 0),
    }));
    setCurrentIndex(prev => prev + 1);
  };

  if (loading) {
    return <p className="text-muted text-center py-12">Chargement...</p>;
  }

  if (queue.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-4xl mb-4 hanzi-display">&#x1F389;</p>
        <p className="text-xl font-medium mb-2">
          {mode === 'b1study' ? 'Tous les caractères B1 sont étudiés !' : 'Aucune carte à réviser !'}
        </p>
        <p className="text-muted mb-6">Revenez plus tard ou essayez un autre mode.</p>
        <button onClick={loadQueue} className="px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent/90 transition-colors">
          Rafraîchir
        </button>
      </div>
    );
  }

  if (currentIndex >= queue.length) {
    const accuracy = sessionStats.reviewed > 0
      ? Math.round((sessionStats.correct / sessionStats.reviewed) * 100) : 0;
    return (
      <div className="text-center py-16">
        <p className="text-4xl mb-4">&#x2705;</p>
        <p className="text-xl font-medium mb-2">Session terminée !</p>
        <p className="text-muted mb-1">{sessionStats.reviewed} cartes révisées</p>
        <p className="text-muted mb-6">Précision : {accuracy}%</p>
        <button
          onClick={loadQueue}
          className="px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent/90 transition-colors"
        >
          Nouvelle session
        </button>
      </div>
    );
  }

  const current = queue[currentIndex];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex gap-1">
          {tiers.map(t => (
            <span key={t} className={`text-xs px-2 py-0.5 rounded-full font-medium ${
              t === 'A1' ? 'bg-a1/10 text-a1' : t === 'A2' ? 'bg-a2/10 text-a2' : 'bg-b1/10 text-b1'
            }`}>{t}</span>
          ))}
        </div>
        <div className="text-sm text-muted">{currentIndex + 1} / {queue.length}</div>
      </div>

      <div className="w-full bg-border rounded-full h-1.5 mb-6">
        <div className="bg-accent h-1.5 rounded-full transition-all duration-300"
          style={{ width: `${(currentIndex / queue.length) * 100}%` }} />
      </div>

      <ReviewCard key={current.cardId} item={current} onRate={handleRating} />
    </div>
  );
}

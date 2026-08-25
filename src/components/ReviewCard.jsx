import { useState } from 'react';
import { Rating } from '../lib/srs';

export default function ReviewCard({ item, onRate }) {
  const [revealed, setRevealed] = useState(false);
  const { source, direction } = item;

  const hanzi = source.hanzi || source.word;
  const pinyin = source.pinyin_marked;
  const glossFr = source.gloss_fr;
  const glossEn = source.gloss_en;
  const tier = source.intro_tier || source.tier;

  const tierColor = tier === 'A1' ? 'text-a1' : tier === 'A2' ? 'text-a2' : 'text-b1';

  return (
    <div className="bg-surface-alt rounded-2xl shadow-sm border border-border p-8 max-w-lg mx-auto">
      <div className="flex items-center justify-between mb-6">
        <span className={`text-xs font-semibold ${tierColor}`}>{tier}</span>
        <span className="text-xs text-muted">
          {direction === 'recognition' ? 'Reconnaissance' :
           direction === 'production' ? 'Production' :
           'Dictée'}
        </span>
      </div>

      {direction === 'recognition' && (
        <RecognitionCard
          hanzi={hanzi}
          pinyin={pinyin}
          glossFr={glossFr}
          glossEn={glossEn}
          revealed={revealed}
        />
      )}

      {direction === 'production' && (
        <ProductionCard
          hanzi={hanzi}
          pinyin={pinyin}
          glossFr={glossFr}
          glossEn={glossEn}
          revealed={revealed}
        />
      )}

      {direction === 'dictation' && (
        <DictationCard
          hanzi={hanzi}
          pinyin={pinyin}
          glossFr={glossFr}
          glossEn={glossEn}
          revealed={revealed}
        />
      )}

      {!revealed ? (
        <button
          onClick={() => setRevealed(true)}
          className="w-full mt-8 py-3 bg-accent text-white rounded-xl text-base font-medium hover:bg-accent/90 transition-colors"
        >
          Montrer la réponse
        </button>
      ) : (
        <div className="mt-8 grid grid-cols-4 gap-2">
          <RatingButton label="Oublié" sub="Again" rating={Rating.Again} onRate={onRate} color="bg-primary" />
          <RatingButton label="Difficile" sub="Hard" rating={Rating.Hard} onRate={onRate} color="bg-warning" />
          <RatingButton label="Bien" sub="Good" rating={Rating.Good} onRate={onRate} color="bg-success" />
          <RatingButton label="Facile" sub="Easy" rating={Rating.Easy} onRate={onRate} color="bg-accent" />
        </div>
      )}
    </div>
  );
}

function RecognitionCard({ hanzi, pinyin, glossFr, glossEn, revealed }) {
  return (
    <div className="text-center">
      <p className="text-7xl mb-2 hanzi-display font-medium">{hanzi}</p>
      {revealed && (
        <div className="mt-6 space-y-2 animate-fadeIn">
          <p className="text-xl text-accent font-medium">{pinyin}</p>
          <p className="text-lg">{glossFr}</p>
          {glossEn && <p className="text-sm text-muted">{glossEn}</p>}
        </div>
      )}
    </div>
  );
}

function ProductionCard({ hanzi, pinyin, glossFr, glossEn, revealed }) {
  return (
    <div className="text-center">
      <p className="text-xl text-accent font-medium mb-1">{pinyin}</p>
      <p className="text-lg mb-1">{glossFr}</p>
      {glossEn && <p className="text-sm text-muted mb-2">{glossEn}</p>}
      {revealed && (
        <div className="mt-6 animate-fadeIn">
          <p className="text-7xl hanzi-display font-medium">{hanzi}</p>
        </div>
      )}
    </div>
  );
}

function DictationCard({ hanzi, pinyin, glossFr, glossEn, revealed }) {
  const speak = () => {
    const utterance = new SpeechSynthesisUtterance(hanzi);
    utterance.lang = 'zh-CN';
    utterance.rate = 0.8;
    speechSynthesis.speak(utterance);
  };

  return (
    <div className="text-center">
      <button
        onClick={speak}
        className="w-20 h-20 rounded-full bg-accent/10 text-accent flex items-center justify-center mx-auto mb-4 hover:bg-accent/20 transition-colors text-3xl"
      >
        &#x1F50A;
      </button>
      <p className="text-sm text-muted mb-2">Écoutez et devinez le caractère</p>
      {revealed && (
        <div className="mt-6 space-y-2 animate-fadeIn">
          <p className="text-7xl hanzi-display font-medium">{hanzi}</p>
          <p className="text-xl text-accent font-medium">{pinyin}</p>
          <p className="text-lg">{glossFr}</p>
        </div>
      )}
    </div>
  );
}

function RatingButton({ label, sub, rating, onRate, color }) {
  return (
    <button
      onClick={() => onRate(rating)}
      className={`${color} text-white py-2.5 rounded-xl text-sm font-medium hover:opacity-90 transition-opacity`}
    >
      <span className="block">{label}</span>
    </button>
  );
}

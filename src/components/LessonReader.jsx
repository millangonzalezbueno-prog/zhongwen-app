import { useState, useMemo } from 'react';
import Zh from './Zh';

export default function LessonReader({ lesson }) {
  const [showEnglish, setShowEnglish] = useState(false);
  const lessonVocabSet = useMemo(
    () => new Set(lesson.vocab.map(v => v.word)),
    [lesson]
  );


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

      <p className="text-xs text-muted -mt-3">Touchez un mot pour sa traduction (survol à la souris), puis un caractère pour l'ordre des traits. Les mots de la leçon sont soulignés.</p>

      <div className="bg-surface-alt border border-border rounded-2xl p-5 md:p-8 space-y-5">
        {lesson.reading.paragraphs.map((para, pi) => {
          return (
            <div key={pi}>
              <p className="text-lg leading-relaxed hanzi-display">
                <Zh text={para} highlight={lessonVocabSet} />
              </p>
              {showEnglish && lesson.reading.paragraphs_en?.[pi] && (
                <p className="text-sm text-muted/70 italic mt-1 leading-relaxed">{lesson.reading.paragraphs_en[pi]}</p>
              )}
            </div>
          );
        })}
      </div>

    </div>
  );
}

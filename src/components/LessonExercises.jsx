import { useState, useMemo, useCallback } from 'react';

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function pick(arr, n) { return shuffle(arr).slice(0, n); }

function buildExercises(lesson) {
  const vocab = lesson.vocab;
  const grammar = lesson.grammar;
  const reading = lesson.reading;

  const round1 = [];
  const round2 = [];
  const round3 = [];

  // === ROUND 1: ÉVALUATION ===

  // 1a. Vocab recall: French → pick Chinese (MCQ)
  const vocabWithGloss = vocab.filter(v => v.word.length >= 2 && !v.type);
  for (const v of pick(vocabWithGloss, 5)) {
    const distractors = pick(
      vocabWithGloss.filter(x => x.word !== v.word),
      3
    ).map(x => x.word);
    round1.push({
      type: 'vocab-mcq',
      prompt: v.gloss_fr.split('—')[0].split('(')[0].trim(),
      correct: v.word,
      options: shuffle([v.word, ...distractors]),
      pinyin: v.pinyin,
    });
  }

  // 1b. Pinyin → Hanzi for locatives
  const locatives = vocab.filter(v => v.forms);
  for (const v of pick(locatives, 3)) {
    const others = pick(locatives.filter(x => x.word !== v.word), 3).map(x => x.word);
    round1.push({
      type: 'vocab-mcq',
      prompt: `${v.pinyin} — ${v.gloss_fr}`,
      correct: v.word,
      options: shuffle([v.word, ...others]),
      pinyin: v.pinyin,
    });
  }

  // 1c. Reading comprehension — true/false
  const readingTF = [
    { statement: '巴黎政治学院的校园很大。', answer: false, explanation: '课文说校园"不太大，可是很漂亮"。' },
    { statement: '学校左边有一个很大的书店。', answer: false, explanation: '书店在学校的右边，左边是塞纳河。' },
    { statement: '商店里的东西都不太贵。', answer: true, explanation: '课文原文：商店里有很多东西，都不太贵。' },
    { statement: '从卢森堡公园到火车站要走一个小时。', answer: false, explanation: '课文说只要走五分钟。' },
    { statement: '学校旁边的中国饭馆儿的面条又好吃又便宜。', answer: false, explanation: '面条很好吃，可是不便宜。' },
    { statement: '学生们的课每个星期差不多有24节。', answer: true, explanation: '课文原文。' },
    { statement: '宿舍的房间里有做饭的地方。', answer: true, explanation: '课文原文：房间里还有做饭的地方。' },
    { statement: '学院的很多学生开车来上课。', answer: false, explanation: '学生坐地铁或公共汽车，不用开车来学校。' },
  ];
  for (const q of pick(readingTF, 4)) {
    round1.push({
      type: 'true-false',
      statement: q.statement,
      correct: q.answer,
      explanation: q.explanation,
    });
  }

  // === ROUND 2: RENFORCEMENT ===

  // 2a. Locative fill-in (which locative fits?)
  const locativeFills = [
    { sentence: '图书馆在书店___。', answer: '前面', options: ['前面', '后面', '旁边', '对面'], hint: 'La bibliothèque est devant la librairie.' },
    { sentence: '学校___有一个商店。', answer: '后面', options: ['前面', '后面', '里面', '外面'], hint: 'Il y a un magasin derrière l\'école.' },
    { sentence: '公园___有很多年轻人跑步。', answer: '里', options: ['里', '外', '上', '下'], hint: 'Beaucoup de jeunes courent dans le parc.' },
    { sentence: '学校___有一个很大的书店。', answer: '右边', options: ['左边', '右边', '前面', '后面'], hint: 'Il y a une grande librairie à droite de l\'école.' },
    { sentence: '桌子___有一本书。', answer: '上面', options: ['上面', '下面', '里面', '旁边'], hint: 'Il y a un livre sur la table.' },
    { sentence: '学校___有好几个地铁站。', answer: '对面', options: ['对面', '附近', '旁边', '里面'], hint: 'Il y a plusieurs stations de métro en face de l\'école.' },
  ];
  for (const q of pick(locativeFills, 4)) {
    round2.push({
      type: 'fill-mcq',
      sentence: q.sentence,
      correct: q.answer,
      options: shuffle(q.options),
      hint: q.hint,
    });
  }

  // 2b. Aspect marker selection (过/了/着)
  const aspectMarkers = [
    { sentence: '你去___中国吗？', answer: '过', options: ['过', '了', '着'], hint: 'As-tu déjà été en Chine ? (expérience)' },
    { sentence: '他买___两条鱼。', answer: '了', options: ['过', '了', '着'], hint: 'Il a acheté deux poissons. (action accomplie)' },
    { sentence: '门开___。', answer: '着', options: ['过', '了', '着'], hint: 'La porte est ouverte. (état continu)' },
    { sentence: '我没吃___臭豆腐。', answer: '过', options: ['过', '了', '着'], hint: 'Je n\'ai jamais mangé de tofu puant.' },
    { sentence: '草黄___。', answer: '了', options: ['过', '了', '着'], hint: 'L\'herbe a jauni. (changement d\'état)' },
    { sentence: '他穿___一件红色的衣服。', answer: '着', options: ['过', '了', '着'], hint: 'Il porte un vêtement rouge. (en ce moment)' },
    { sentence: '我不爱你___。', answer: '了', options: ['过', '了', '着'], hint: 'Je ne t\'aime plus. (changement de situation)' },
    { sentence: '你学___汉语吗？', answer: '过', options: ['过', '了', '着'], hint: 'As-tu déjà étudié le chinois ? (expérience passée)' },
  ];
  for (const q of pick(aspectMarkers, 4)) {
    round2.push({
      type: 'fill-mcq',
      sentence: q.sentence,
      correct: q.answer,
      options: shuffle(q.options),
      hint: q.hint,
    });
  }

  // 2c. Error correction (改错) — inspired by the PPT 练习
  const errorCorrections = [
    { wrong: '你学汉语过吗？', correct: '你学过汉语吗？', rule: '过 se place juste après le verbe, pas après le complément.' },
    { wrong: '他也没去中国过。', correct: '他也没去过中国。', rule: '过 se place directement après le verbe, avant le CO.' },
    { wrong: '他们来过在法国。', correct: '他们来过法国。', rule: '在 est superflu ici — 来过 + lieu suffit.' },
    { wrong: '我们二个人都学过中文。', correct: '我们两个人都学过中文。', rule: '两 (pas 二) s\'utilise devant un classificateur.' },
    { wrong: '他不去过美国。', correct: '他没去过美国。', rule: 'La négation de 过 utilise 没, pas 不.' },
    { wrong: '书包里书在。', correct: '书在书包里。', rule: 'Structure : sujet + 在 + lieu (不是 lieu + 在).' },
  ];
  for (const q of pick(errorCorrections, 4)) {
    round2.push({
      type: 'error-correction',
      wrong: q.wrong,
      correct: q.correct,
      rule: q.rule,
    });
  }

  // === ROUND 3: DÉFI ===

  // 3a. FR → ZH translation (type answer)
  const translations = [
    { fr: 'Il y a un supermarché à côté de l\'école.', zh: '学校旁边有一个超市。', pattern: 'Lieu + 有 + Chose' },
    { fr: 'Le livre est sur la table.', zh: '书在桌子上面。', pattern: '在 + Lieu' },
    { fr: 'Il y a beaucoup de monde dans le parc.', zh: '公园里有很多人。', pattern: 'Lieu + 有 + Chose' },
    { fr: 'Il a déjà été en Chine.', zh: '他去过中国。', pattern: 'V + 过' },
    { fr: 'Je ne t\'aime plus.', zh: '我不爱你了。', pattern: '不…了₂' },
    { fr: 'La porte est ouverte.', zh: '门开着。', pattern: 'V + 着' },
    { fr: 'Du Luxembourg à Montparnasse, c\'est très proche.', zh: '从卢森堡到蒙帕纳斯很近。', pattern: '从 A 到 B' },
    { fr: 'Il y a un magasin derrière l\'école.', zh: '学校后面有一个商店。', pattern: 'Lieu + 有 + Chose' },
  ];
  for (const q of pick(translations, 3)) {
    round3.push({
      type: 'translate',
      fr: q.fr,
      zh: q.zh,
      pattern: q.pattern,
    });
  }

  // 3b. Reading comprehension — open-ended MCQ
  const readingMCQ = [
    {
      question: '学校的图书馆在哪儿？',
      correct: '在书店前面',
      options: shuffle(['在书店前面', '在学校后面', '在商店旁边', '在宿舍里面']),
    },
    {
      question: '学校左边是什么？',
      correct: '有名的塞纳河',
      options: shuffle(['有名的塞纳河', '一个很大的书店', '一个中国饭馆儿', '卢森堡公园']),
    },
    {
      question: '从卢森堡公园到火车站要多长时间？',
      correct: '走五分钟',
      options: shuffle(['走五分钟', '走十五分钟', '坐地铁十分钟', '开车二十分钟']),
    },
    {
      question: '宿舍的房间里有什么？',
      correct: '一张床、两张桌子、几把椅子和一个书架',
      options: shuffle([
        '一张床、两张桌子、几把椅子和一个书架',
        '两张床、一张桌子和一个衣柜',
        '一张床、一张桌子和一个沙发',
        '三张床和一个书架',
      ]),
    },
    {
      question: '学生们每个星期有几节汉语课？',
      correct: '两节',
      options: shuffle(['两节', '三节', '四节', '二十四节']),
    },
  ];
  for (const q of pick(readingMCQ, 3)) {
    round3.push({
      type: 'reading-mcq',
      question: q.question,
      correct: q.correct,
      options: q.options,
    });
  }

  // 3c. Classifier match (pick the right 量词)
  const classifierItems = [
    { noun: '床', answer: '张', options: ['张', '把', '节', '个'] },
    { noun: '椅子', answer: '把', options: ['张', '把', '节', '个'] },
    { noun: '汉语课', answer: '节', options: ['张', '把', '节', '个'] },
    { noun: '桌子', answer: '张', options: ['张', '把', '节', '个'] },
  ];
  for (const q of pick(classifierItems, 2)) {
    round3.push({
      type: 'classifier',
      noun: q.noun,
      correct: q.answer,
      options: shuffle(q.options),
    });
  }

  // 3d. Sentence construction — order words
  const orderItems = [
    { fr: 'Beaucoup d\'étudiants prennent le métro pour venir en cours.', chunks: ['很多', '学生', '坐', '地铁', '来', '上课'], answer: '很多学生坐地铁来上课' },
    { fr: 'Il y a un restaurant chinois à côté de l\'école.', chunks: ['学校', '旁边', '有', '一个', '中国', '饭馆'], answer: '学校旁边有一个中国饭馆' },
    { fr: 'Les jeunes aiment aller courir le matin.', chunks: ['年轻人', '早上', '喜欢', '去', '跑步'], answer: '年轻人早上喜欢去跑步' },
    { fr: 'La chambre de la résidence n\'est pas très grande mais elle est confortable.', chunks: ['宿舍', '的', '房间', '不太大', '可是', '很', '舒服'], answer: '宿舍的房间不太大可是很舒服' },
  ];
  for (const q of pick(orderItems, 2)) {
    round3.push({
      type: 'order',
      fr: q.fr,
      chunks: q.chunks,
      answer: q.answer,
    });
  }

  return {
    rounds: [
      { title: 'Évaluation', subtitle: 'Testez vos acquis', exercises: shuffle(round1) },
      { title: 'Renforcement', subtitle: 'Grammaire et locatifs en action', exercises: shuffle(round2) },
      { title: 'Défi', subtitle: 'Production et compréhension avancée', exercises: shuffle(round3) },
    ],
  };
}

export default function LessonExercises({ lesson }) {
  const session = useMemo(() => buildExercises(lesson), [lesson]);
  const [roundIdx, setRoundIdx] = useState(0);
  const [exIdx, setExIdx] = useState(0);
  const [state, setState] = useState('answering');
  const [roundStats, setRoundStats] = useState([]);
  const [currentCorrect, setCurrentCorrect] = useState(0);
  const [currentTotal, setCurrentTotal] = useState(0);
  const [finished, setFinished] = useState(false);

  const round = session.rounds[roundIdx];
  const exercise = round?.exercises[exIdx];
  const totalExercises = session.rounds.reduce((s, r) => s + r.exercises.length, 0);
  const globalIdx = session.rounds.slice(0, roundIdx).reduce((s, r) => s + r.exercises.length, 0) + exIdx;

  const recordAnswer = useCallback((isCorrect) => {
    setState(isCorrect ? 'correct' : 'wrong');
    setCurrentCorrect(c => c + (isCorrect ? 1 : 0));
    setCurrentTotal(c => c + 1);
  }, []);

  const next = useCallback(() => {
    if (exIdx + 1 < round.exercises.length) {
      setExIdx(i => i + 1);
      setState('answering');
    } else {
      setRoundStats(prev => [...prev, { correct: currentCorrect + (state === 'correct' ? 0 : 0), total: currentTotal }]);
      if (roundIdx + 1 < session.rounds.length) {
        setRoundIdx(r => r + 1);
        setExIdx(0);
        setState('answering');
        setCurrentCorrect(0);
        setCurrentTotal(0);
      } else {
        setFinished(true);
      }
    }
  }, [exIdx, round, roundIdx, session, currentCorrect, currentTotal, state]);

  if (finished) {
    const allCorrect = roundStats.reduce((s, r) => s + r.correct, 0) + currentCorrect;
    const allTotal = roundStats.reduce((s, r) => s + r.total, 0) + currentTotal;
    const pct = allTotal > 0 ? Math.round((allCorrect / allTotal) * 100) : 0;
    const grade = pct >= 90 ? 'Excellent !' : pct >= 70 ? 'Bon travail !' : pct >= 50 ? 'Pas mal, continuez !' : 'À retravailler';
    return (
      <div className="text-center py-12">
        <p className="text-6xl mb-4">{pct >= 90 ? '🏆' : pct >= 70 ? '👏' : pct >= 50 ? '💪' : '📚'}</p>
        <p className="text-2xl font-semibold mb-2">{grade}</p>
        <p className="text-muted mb-1">{allCorrect} / {allTotal} correct</p>
        <p className="text-3xl font-bold text-accent mb-6">{pct}%</p>

        <div className="space-y-2 max-w-sm mx-auto mb-8">
          {session.rounds.map((r, i) => {
            const s = i < roundStats.length ? roundStats[i] : { correct: currentCorrect, total: currentTotal };
            const rPct = s.total > 0 ? Math.round((s.correct / s.total) * 100) : 0;
            return (
              <div key={i} className="flex items-center justify-between bg-surface-alt border border-border rounded-lg px-4 py-2">
                <span className="text-sm font-medium">{r.title}</span>
                <span className={`text-sm font-bold ${rPct >= 70 ? 'text-success' : rPct >= 50 ? 'text-accent' : 'text-primary'}`}>{rPct}%</span>
              </div>
            );
          })}
        </div>

        <button onClick={() => { setRoundIdx(0); setExIdx(0); setState('answering'); setRoundStats([]); setCurrentCorrect(0); setCurrentTotal(0); setFinished(false); }}
          className="px-6 py-3 bg-accent text-white rounded-xl font-medium hover:bg-accent/90 transition-colors">
          Recommencer
        </button>
      </div>
    );
  }

  return (
    <div>
      {/* Round header */}
      <div className="flex items-center justify-between mb-2">
        <div>
          <p className="text-xs font-semibold text-accent uppercase tracking-wider">{round.title}</p>
          <p className="text-xs text-muted">{round.subtitle}</p>
        </div>
        <span className="text-sm text-muted font-medium">{globalIdx + 1} / {totalExercises}</span>
      </div>

      {/* Global progress */}
      <div className="w-full bg-border rounded-full h-1.5 mb-1">
        <div className="bg-accent h-1.5 rounded-full transition-all duration-300"
          style={{ width: `${(globalIdx / totalExercises) * 100}%` }} />
      </div>
      {/* Round progress dots */}
      <div className="flex gap-1 mb-6 justify-center">
        {session.rounds.map((_, i) => (
          <div key={i} className={`w-2 h-2 rounded-full transition-colors ${i === roundIdx ? 'bg-accent' : i < roundIdx ? 'bg-success' : 'bg-border'}`} />
        ))}
      </div>

      {/* Exercise card */}
      <div className="bg-surface-alt border border-border rounded-2xl p-6 sm:p-8 max-w-lg mx-auto">
        <ExerciseCard exercise={exercise} state={state} onAnswer={recordAnswer} />
        {state !== 'answering' && (
          <button onClick={next}
            className="mt-6 w-full py-3 bg-accent text-white rounded-xl font-medium hover:bg-accent/90 transition-colors">
            {exIdx + 1 >= round.exercises.length && roundIdx + 1 >= session.rounds.length
              ? 'Voir les résultats'
              : exIdx + 1 >= round.exercises.length
                ? `Passer au ${session.rounds[roundIdx + 1].title}`
                : 'Suivant'}
          </button>
        )}
      </div>
    </div>
  );
}

function ExerciseCard({ exercise, state, onAnswer }) {
  switch (exercise.type) {
    case 'vocab-mcq': return <VocabMCQ ex={exercise} state={state} onAnswer={onAnswer} />;
    case 'true-false': return <TrueFalse ex={exercise} state={state} onAnswer={onAnswer} />;
    case 'fill-mcq': return <FillMCQ ex={exercise} state={state} onAnswer={onAnswer} />;
    case 'error-correction': return <ErrorCorrection ex={exercise} state={state} onAnswer={onAnswer} />;
    case 'translate': return <TranslateExercise ex={exercise} state={state} onAnswer={onAnswer} />;
    case 'reading-mcq': return <ReadingMCQ ex={exercise} state={state} onAnswer={onAnswer} />;
    case 'classifier': return <ClassifierExercise ex={exercise} state={state} onAnswer={onAnswer} />;
    case 'order': return <OrderExercise ex={exercise} state={state} onAnswer={onAnswer} />;
    default: return null;
  }
}

// --- Exercise type components ---

function VocabMCQ({ ex, state, onAnswer }) {
  const handlePick = (opt) => { if (state !== 'answering') return; onAnswer(opt === ex.correct); };
  return (
    <div className="text-center">
      <p className="text-xs text-muted mb-1 uppercase tracking-wider">Vocabulaire</p>
      <p className="text-lg font-medium mb-6">{ex.prompt}</p>
      <div className="grid grid-cols-2 gap-3">
        {ex.options.map((opt, i) => (
          <button key={i} onClick={() => handlePick(opt)} disabled={state !== 'answering'}
            className={`px-4 py-3 rounded-xl border text-xl hanzi-display font-medium transition-colors ${
              state !== 'answering'
                ? opt === ex.correct ? 'bg-success/10 border-success text-success' :
                  'bg-surface-alt border-border text-muted opacity-50'
                : 'bg-surface-alt border-border hover:border-accent/50 hover:bg-accent/5'
            }`}>
            {opt}
          </button>
        ))}
      </div>
      {state !== 'answering' && (
        <Feedback correct={state === 'correct'} answer={ex.correct} extra={ex.pinyin} />
      )}
    </div>
  );
}

function TrueFalse({ ex, state, onAnswer }) {
  const handlePick = (val) => { if (state !== 'answering') return; onAnswer(val === ex.correct); };
  return (
    <div className="text-center">
      <p className="text-xs text-muted mb-1 uppercase tracking-wider">Compréhension — Vrai ou faux ?</p>
      <p className="text-xl hanzi-display font-medium mb-6 leading-relaxed">{ex.statement}</p>
      {state === 'answering' ? (
        <div className="flex gap-3 justify-center">
          <button onClick={() => handlePick(true)}
            className="flex-1 max-w-[140px] py-3 rounded-xl border border-border bg-surface-alt font-medium hover:border-success hover:bg-success/5 transition-colors">
            Vrai ✓
          </button>
          <button onClick={() => handlePick(false)}
            className="flex-1 max-w-[140px] py-3 rounded-xl border border-border bg-surface-alt font-medium hover:border-primary hover:bg-primary/5 transition-colors">
            Faux ✗
          </button>
        </div>
      ) : (
        <Feedback correct={state === 'correct'} answer={ex.correct ? 'Vrai' : 'Faux'} extra={ex.explanation} />
      )}
    </div>
  );
}

function FillMCQ({ ex, state, onAnswer }) {
  const [picked, setPicked] = useState(null);
  const handlePick = (opt) => {
    if (state !== 'answering') return;
    setPicked(opt);
    onAnswer(opt === ex.correct);
  };

  const parts = ex.sentence.split('___');

  return (
    <div className="text-center">
      <p className="text-xs text-muted mb-1 uppercase tracking-wider">Complétez</p>
      <p className="text-xl hanzi-display font-medium mb-2 leading-relaxed">
        {parts[0]}<span className="inline-block min-w-[3em] border-b-2 border-accent mx-1 text-accent">
          {state !== 'answering' ? ex.correct : picked || '　　'}
        </span>{parts[1]}
      </p>
      <p className="text-sm text-muted mb-6">{ex.hint}</p>
      {state === 'answering' ? (
        <div className="flex flex-wrap gap-2 justify-center">
          {ex.options.map((opt, i) => (
            <button key={i} onClick={() => handlePick(opt)}
              className="px-5 py-2.5 rounded-xl border border-border bg-surface-alt hanzi-display text-lg font-medium hover:border-accent/50 hover:bg-accent/5 transition-colors">
              {opt}
            </button>
          ))}
        </div>
      ) : (
        <Feedback correct={state === 'correct'} answer={ex.correct} />
      )}
    </div>
  );
}

function ErrorCorrection({ ex, state, onAnswer }) {
  const [input, setInput] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    const norm = (s) => s.replace(/\s+/g, '').replace(/[。？！，]/g, '');
    onAnswer(norm(input) === norm(ex.correct));
  };

  return (
    <div className="text-center">
      <p className="text-xs text-muted mb-1 uppercase tracking-wider">改错 — Corrigez l'erreur</p>
      <p className="text-2xl hanzi-display font-medium mb-2 text-primary leading-relaxed">{ex.wrong}</p>
      <p className="text-xs text-muted mb-6">Cette phrase contient une erreur. Réécrivez-la correctement.</p>
      {state === 'answering' ? (
        <form onSubmit={handleSubmit} className="space-y-3">
          <input type="text" value={input} onChange={e => setInput(e.target.value)}
            placeholder="Phrase corrigée..." autoFocus
            className="w-full px-4 py-3 rounded-xl border border-border bg-white focus:border-accent focus:outline-none text-center text-lg hanzi-display" />
          <button type="submit" disabled={!input.trim()}
            className="w-full py-3 bg-ink text-white rounded-xl font-medium hover:bg-ink/90 transition-colors disabled:opacity-40">
            Vérifier
          </button>
        </form>
      ) : (
        <Feedback correct={state === 'correct'} answer={ex.correct} extra={ex.rule} />
      )}
    </div>
  );
}

function TranslateExercise({ ex, state, onAnswer }) {
  const [input, setInput] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    const norm = (s) => s.replace(/\s+/g, '').replace(/[。？！，]/g, '');
    onAnswer(norm(input) === norm(ex.zh));
  };

  return (
    <div className="text-center">
      <p className="text-xs text-muted mb-1 uppercase tracking-wider">Traduisez en chinois</p>
      <p className="text-lg font-medium mb-2">{ex.fr}</p>
      <p className="text-xs text-accent mb-6">Structure : {ex.pattern}</p>
      {state === 'answering' ? (
        <form onSubmit={handleSubmit} className="space-y-3">
          <input type="text" value={input} onChange={e => setInput(e.target.value)}
            placeholder="Écrivez en chinois..." autoFocus
            className="w-full px-4 py-3 rounded-xl border border-border bg-white focus:border-accent focus:outline-none text-center text-lg hanzi-display" />
          <button type="submit" disabled={!input.trim()}
            className="w-full py-3 bg-ink text-white rounded-xl font-medium hover:bg-ink/90 transition-colors disabled:opacity-40">
            Vérifier
          </button>
        </form>
      ) : (
        <Feedback correct={state === 'correct'} answer={ex.zh} extra={ex.pattern} />
      )}
    </div>
  );
}

function ReadingMCQ({ ex, state, onAnswer }) {
  const handlePick = (opt) => { if (state !== 'answering') return; onAnswer(opt === ex.correct); };
  return (
    <div className="text-center">
      <p className="text-xs text-muted mb-1 uppercase tracking-wider">Compréhension du texte</p>
      <p className="text-xl hanzi-display font-medium mb-6 leading-relaxed">{ex.question}</p>
      {state === 'answering' ? (
        <div className="space-y-2">
          {ex.options.map((opt, i) => (
            <button key={i} onClick={() => handlePick(opt)}
              className="w-full text-left px-4 py-3 rounded-xl border border-border bg-surface-alt hover:border-accent/50 hover:bg-accent/5 transition-colors text-sm hanzi-display">
              {opt}
            </button>
          ))}
        </div>
      ) : (
        <Feedback correct={state === 'correct'} answer={ex.correct} />
      )}
    </div>
  );
}

function ClassifierExercise({ ex, state, onAnswer }) {
  const handlePick = (opt) => { if (state !== 'answering') return; onAnswer(opt === ex.correct); };
  return (
    <div className="text-center">
      <p className="text-xs text-muted mb-1 uppercase tracking-wider">Classificateur (量词)</p>
      <p className="text-sm text-muted mb-2">Quel classificateur utiliser avec :</p>
      <p className="text-3xl hanzi-display font-medium mb-6">{ex.noun}</p>
      {state === 'answering' ? (
        <div className="flex flex-wrap gap-3 justify-center">
          {ex.options.map((opt, i) => (
            <button key={i} onClick={() => handlePick(opt)}
              className="w-16 h-16 rounded-xl border border-border bg-surface-alt hanzi-display text-2xl font-medium hover:border-accent/50 hover:bg-accent/5 transition-colors">
              {opt}
            </button>
          ))}
        </div>
      ) : (
        <Feedback correct={state === 'correct'} answer={`一${ex.correct}${ex.noun}`} />
      )}
    </div>
  );
}

function OrderExercise({ ex, state, onAnswer }) {
  const [placed, setPlaced] = useState([]);
  const [available, setAvailable] = useState(() => shuffle(ex.chunks.map((c, i) => ({ id: i, text: c }))));

  const handleTile = (item, source) => {
    if (state !== 'answering') return;
    if (source === 'available') {
      setAvailable(prev => prev.filter(i => i.id !== item.id));
      setPlaced(prev => [...prev, item]);
    } else {
      setPlaced(prev => prev.filter(i => i.id !== item.id));
      setAvailable(prev => [...prev, item]);
    }
  };

  const check = () => {
    const user = placed.map(i => i.text).join('');
    const norm = (s) => s.replace(/\s+/g, '');
    onAnswer(norm(user) === norm(ex.answer));
  };

  return (
    <div className="text-center">
      <p className="text-xs text-muted mb-1 uppercase tracking-wider">Remettez dans l'ordre</p>
      <p className="text-base font-medium mb-6">{ex.fr}</p>

      <div className={`flex flex-wrap gap-2 justify-center min-h-[56px] p-3 rounded-xl border-2 mb-4 transition-colors ${
        state === 'correct' ? 'bg-success/10 border-success/40' :
        state === 'wrong' ? 'bg-primary/10 border-primary/40' :
        'bg-border/20 border-dashed border-border'
      }`}>
        {placed.length === 0 && <span className="text-muted text-sm self-center">Cliquez les mots</span>}
        {placed.map(item => (
          <button key={item.id} onClick={() => handleTile(item, 'placed')} disabled={state !== 'answering'}
            className="px-3 py-2 bg-white shadow-sm border border-border rounded-lg font-medium hanzi-display text-lg hover:bg-primary-light transition-colors">
            {item.text}
          </button>
        ))}
      </div>

      {state === 'answering' && (
        <div className="flex flex-wrap gap-2 justify-center min-h-[44px] mb-4">
          {available.map(item => (
            <button key={item.id} onClick={() => handleTile(item, 'available')}
              className="px-3 py-2 bg-surface-alt border border-border rounded-lg font-medium hanzi-display text-lg hover:border-accent/50 hover:bg-accent/5 transition-colors">
              {item.text}
            </button>
          ))}
        </div>
      )}

      {state === 'answering' && placed.length > 0 && available.length === 0 && (
        <button onClick={check}
          className="w-full py-3 bg-ink text-white rounded-xl font-medium hover:bg-ink/90 transition-colors">
          Vérifier
        </button>
      )}

      {state !== 'answering' && (
        <Feedback correct={state === 'correct'} answer={ex.answer} />
      )}
    </div>
  );
}

function Feedback({ correct, answer, extra }) {
  return (
    <div className={`rounded-xl p-4 mt-4 ${correct ? 'bg-success/10' : 'bg-primary/10'}`}>
      <p className={`font-medium mb-1 ${correct ? 'text-success' : 'text-primary'}`}>
        {correct ? 'Correct !' : 'Incorrect'}
      </p>
      <p className="text-lg hanzi-display font-medium">{answer}</p>
      {extra && <p className="text-sm text-muted mt-1">{extra}</p>}
    </div>
  );
}

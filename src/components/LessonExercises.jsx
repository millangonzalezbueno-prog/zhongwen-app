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
  if (lesson.id === 'L02') return buildExercisesL02(lesson);
  return buildExercisesL01(lesson);
}

function buildExercisesL01(lesson) {
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

function buildExercisesL02(lesson) {
  const vocab = lesson.vocab;

  const round1 = [];
  const round2 = [];
  const round3 = [];

  // === ROUND 1: ÉVALUATION ===

  const vocabWithGloss = vocab.filter(v => v.word.length >= 2);
  for (const v of pick(vocabWithGloss, 5)) {
    const distractors = pick(vocabWithGloss.filter(x => x.word !== v.word), 3).map(x => x.word);
    round1.push({
      type: 'vocab-mcq',
      prompt: v.gloss_fr.split('—')[0].split('(')[0].trim(),
      correct: v.word,
      options: shuffle([v.word, ...distractors]),
      pinyin: v.pinyin,
    });
  }

  const adverbs = vocab.filter(v => v.category === 'adverbe' && v.word.length >= 2);
  for (const v of pick(adverbs, 3)) {
    const others = pick(adverbs.filter(x => x.word !== v.word), 3).map(x => x.word);
    round1.push({
      type: 'vocab-mcq',
      prompt: `${v.pinyin} — ${v.gloss_fr.split('—')[0].trim()}`,
      correct: v.word,
      options: shuffle([v.word, ...others]),
      pinyin: v.pinyin,
    });
  }

  const classifiers = vocab.filter(v => v.category === 'classificateur');
  const classifierFill = [
    { sentence: '我买了三___书。', answer: '本', options: ['本', '条', '张', '个'], hint: 'Books are bound objects.' },
    { sentence: '他家有两___猫。', answer: '只', options: ['只', '条', '个', '口'], hint: 'Cats use the animal classifier.' },
    { sentence: '我喝了一___咖啡。', answer: '杯', options: ['杯', '瓶', '碗', '个'], hint: 'A cup/glass of something.' },
    { sentence: '他有一___新车。', answer: '辆', options: ['辆', '个', '条', '张'], hint: 'For wheeled vehicles.' },
    { sentence: '她买了三___衣服。', answer: '件', options: ['件', '条', '只', '张'], hint: 'For clothing items.' },
    { sentence: '我买了一___鞋。', answer: '双', options: ['双', '只', '个', '件'], hint: 'Things that come in pairs.' },
    { sentence: '我去过三___中国。', answer: '次', options: ['次', '遍', '回', '个'], hint: 'Counting the number of times.' },
    { sentence: '我看了三___这本书。', answer: '遍', options: ['遍', '次', '回', '本'], hint: 'Full process — read from start to finish.' },
    { sentence: '他家有五___人。', answer: '口', options: ['口', '个', '位', '只'], hint: 'For counting family members.' },
    { sentence: '这___老师教得很好。', answer: '位', options: ['位', '个', '只', '口'], hint: 'Polite classifier for people.' },
    { sentence: '我看了一___电影。', answer: '场', options: ['场', '个', '本', '次'], hint: 'For events and screenings.' },
    { sentence: '我吃了两___米饭。', answer: '碗', options: ['碗', '杯', '瓶', '块'], hint: 'A bowl of something.' },
  ];
  for (const q of pick(classifierFill, 4)) {
    round1.push({ type: 'fill-mcq', sentence: q.sentence, correct: q.answer, options: shuffle(q.options), hint: q.hint });
  }

  const readingTF = [
    { statement: '王小明每天早上七点起床。', answer: false, explanation: '他每天早上七点半起床，不是七点。' },
    { statement: '以前他总是起得很晚。', answer: true, explanation: '课文原文：以前他总是起得很晚。' },
    { statement: '从宿舍到学校坐地铁要二十分钟。', answer: true, explanation: '课文原文。' },
    { statement: '他中午在宿舍吃午饭。', answer: false, explanation: '他和同学们一起去饭馆吃午饭。' },
    { statement: '下午的课从三点开始。', answer: false, explanation: '下午的课从两点开始。' },
    { statement: '他最近正在准备考试。', answer: true, explanation: '课文原文。' },
    { statement: '他的朋友问他周末有没有时间，他说没有。', answer: false, explanation: '他说周末有时间去看电影。' },
    { statement: '明天是星期天。', answer: false, explanation: '明天是星期六。' },
  ];
  for (const q of pick(readingTF, 4)) {
    round1.push({ type: 'true-false', statement: q.statement, correct: q.answer, explanation: q.explanation });
  }

  // === ROUND 2: RENFORCEMENT ===

  const timeAdverbs = [
    { sentence: '他___回家了。', answer: '已经', options: ['已经', '正在', '马上', '刚才'], hint: 'Il est déjà rentré.' },
    { sentence: '弟弟___吃饭。', answer: '正在', options: ['正在', '已经', '马上', '终于'], hint: 'Le petit frère est en train de manger.' },
    { sentence: '我___给他打电话。', answer: '马上', options: ['马上', '刚才', '总是', '以前'], hint: 'Je vais l\'appeler tout de suite.' },
    { sentence: '我___看见他了。', answer: '刚才', options: ['刚才', '马上', '总是', '经常'], hint: 'Je viens de le voir à l\'instant.' },
    { sentence: '太阳___出来了！', answer: '终于', options: ['终于', '已经', '马上', '正在'], hint: 'Le soleil est enfin sorti !' },
    { sentence: '他___很早起床。', answer: '总是', options: ['总是', '经常', '最近', '马上'], hint: 'Il se lève toujours tôt.' },
    { sentence: '他周末___在家看书。', answer: '经常', options: ['经常', '总是', '马上', '正在'], hint: 'Le week-end, il lit souvent à la maison.' },
    { sentence: '我___很忙。', answer: '最近', options: ['最近', '马上', '已经', '终于'], hint: 'Je suis occupé ces derniers temps.' },
  ];
  for (const q of pick(timeAdverbs, 4)) {
    round2.push({ type: 'fill-mcq', sentence: q.sentence, correct: q.answer, options: shuffle(q.options), hint: q.hint });
  }

  const beforeAfter = [
    { sentence: '吃完早饭___，他马上去学校。', answer: '以后', options: ['以前', '以后', '的时候', '最近'], hint: 'Après le petit-déjeuner, il va à l\'école.' },
    { sentence: '我们看电影___，先去吃饭吧。', answer: '以前', options: ['以前', '以后', '的时候', '马上'], hint: 'Avant le film, allons d\'abord manger.' },
    { sentence: '五点___回来。', answer: '以前', options: ['以前', '以后', '正在', '已经'], hint: 'Reviens avant 5 heures.' },
    { sentence: '下课___，我要去图书馆看书。', answer: '以后', options: ['以前', '以后', '的时候', '总是'], hint: 'Après les cours, je vais lire à la bibliothèque.' },
    { sentence: '九点___，请不要给我打电话。', answer: '以后', options: ['以前', '以后', '马上', '刚才'], hint: 'Après 9h, ne m\'appelle plus.' },
    { sentence: '来中国___，他不会说中文。', answer: '以前', options: ['以前', '以后', '最近', '正在'], hint: 'Avant de venir en Chine, il ne parlait pas chinois.' },
  ];
  for (const q of pick(beforeAfter, 4)) {
    round2.push({ type: 'fill-mcq', sentence: q.sentence, correct: q.answer, options: shuffle(q.options), hint: q.hint });
  }

  const durationFill = [
    { sentence: '我学了三年中文___。', answer: '了', options: ['了', '的', '着', '过'], hint: 'With 了₁ + 了₂, the action continues to the present.' },
    { sentence: '你学汉语学了___？', answer: '多长时间了', options: ['多长时间了', '怎么样', '什么', '多大'], hint: 'Asking about duration.' },
    { sentence: '他在北京住了十年，现在不住了。没有了₂说明___。', answer: '动作已经结束', options: ['动作已经结束', '动作还在继续', '动作刚开始', '动作没发生'], hint: 'Without 了₂ at the end, the action is over.' },
  ];
  for (const q of pick(durationFill, 2)) {
    round2.push({ type: 'fill-mcq', sentence: q.sentence, correct: q.answer, options: shuffle(q.options), hint: q.hint });
  }

  const degreeFill = [
    { sentence: '你说汉语说___很好。', answer: '得', options: ['得', '的', '地', '了'], hint: 'V + 得 + Adj for degree complement.' },
    { sentence: '他昨天睡___很晚。', answer: '得', options: ['得', '的', '了', '着'], hint: 'Describes how the action was done.' },
  ];
  for (const q of pick(degreeFill, 1)) {
    round2.push({ type: 'fill-mcq', sentence: q.sentence, correct: q.answer, options: shuffle(q.options), hint: q.hint });
  }

  const errorCorrections = [
    { wrong: '我已经吃饭。', correct: '我已经吃饭了。', rule: '已经 nécessite 了 en fin de phrase : 已经…了 vont ensemble.' },
    { wrong: '他在正看电视。', correct: '他正在看电视。', rule: '正在 est un seul mot inséparable.' },
    { wrong: '我们看电影以后先去吃饭吧。', correct: '我们看电影以前先去吃饭吧。', rule: '先 (d\'abord) implique « avant », donc 以前, pas 以后.' },
    { wrong: '下课以后我图书馆去。', correct: '下课以后我去图书馆。', rule: 'Le verbe 去 se place avant la destination : 去 + lieu.' },
    { wrong: '九点以后不要打电话我。', correct: '九点以后不要给我打电话。', rule: 'Structure : 给 + personne + 打电话.' },
    { wrong: '他正在已经回家了。', correct: '他已经回家了。', rule: '正在 (en cours) et 已经 (déjà) se contredisent.' },
    { wrong: '我买了三个书。', correct: '我买了三本书。', rule: 'Les livres utilisent le classificateur 本, pas 个.' },
    { wrong: '他说中文说的很好。', correct: '他说中文说得很好。', rule: 'Le complément de degré utilise 得 (de), pas 的 (de).' },
    { wrong: '老师让学生们汉字写。', correct: '老师让学生们写汉字。', rule: 'Dans A+让+B+V, le verbe précède le COD : 写汉字.' },
  ];
  for (const q of pick(errorCorrections, 4)) {
    round2.push({ type: 'error-correction', wrong: q.wrong, correct: q.correct, rule: q.rule });
  }

  // === ROUND 3: DÉFI ===

  const translations = [
    { fr: 'Il est en train de faire ses devoirs.', zh: '他正在做作业。', pattern: '正在 + V' },
    { fr: 'Il est déjà rentré.', zh: '他已经回家了。', pattern: '已经…了' },
    { fr: 'Après les cours, je vais à la bibliothèque.', zh: '下课以后我去图书馆。', pattern: '以后' },
    { fr: 'Il se lève toujours très tôt.', zh: '他总是很早起床。', pattern: '总是' },
    { fr: 'Avant le film, allons d\'abord manger.', zh: '看电影以前，先去吃饭吧。', pattern: '以前' },
    { fr: 'Du lundi au vendredi, il a cours.', zh: '从星期一到星期五，他上课。', pattern: '从…到…' },
    { fr: 'J\'étudie le chinois depuis trois ans.', zh: '我学了三年中文了。', pattern: 'V+了+durée+了' },
    { fr: 'Tu parles chinois très bien.', zh: '你说汉语说得很好。', pattern: 'V+得+Adj' },
    { fr: 'J\'ai acheté trois livres et deux poissons.', zh: '我买了三本书、两条鱼。', pattern: 'classificateurs' },
    { fr: 'Le professeur fait écrire des caractères aux étudiants.', zh: '老师让学生们写汉字。', pattern: '让+B+V' },
    { fr: 'Chaque étudiant étudie le chinois tous les jours.', zh: '每个学生每天都学中文。', pattern: '每…都' },
    { fr: 'J\'ai été en Chine trois fois.', zh: '我去过三次中国。', pattern: 'V+次' },
  ];
  for (const q of pick(translations, 3)) {
    round3.push({ type: 'translate', fr: q.fr, zh: q.zh, pattern: q.pattern });
  }

  const readingMCQ = [
    { question: '王小明每天怎么去学校？', correct: '坐地铁', options: shuffle(['坐地铁', '坐公共汽车', '走路', '开车']) },
    { question: '他下午几点下课？', correct: '四点半', options: shuffle(['四点半', '三点', '五点', '四点']) },
    { question: '他最近在做什么？', correct: '准备考试', options: shuffle(['准备考试', '写作业', '学做饭', '看小说']) },
    { question: '他的朋友在电话里问他什么？', correct: '周末有没有时间去看电影', options: shuffle(['周末有没有时间去看电影', '明天去不去吃饭', '今天去不去图书馆', '下课以后去不去跑步']) },
    { question: '为什么他今天很累？', correct: '昨天睡得很晚', options: shuffle(['昨天睡得很晚', '上午课很多', '没吃早饭', '走路去学校']) },
  ];
  for (const q of pick(readingMCQ, 3)) {
    round3.push({ type: 'reading-mcq', question: q.question, correct: q.correct, options: q.options });
  }

  const timeTelling = [
    { prompt: '9:00 (matin)', correct: '上午九点', options: ['上午九点', '下午九点', '早上八点', '上午十点'] },
    { prompt: '14:30', correct: '下午两点半', options: ['下午两点半', '上午两点半', '下午三点半', '下午两点'] },
    { prompt: '12:00 (midi)', correct: '中午十二点', options: ['中午十二点', '上午十二点', '下午十二点', '中午十一点'] },
    { prompt: '19:45', correct: '晚上七点四十五分', options: ['晚上七点四十五分', '下午七点半', '晚上八点', '下午七点'] },
  ];
  for (const q of pick(timeTelling, 2)) {
    round3.push({ type: 'vocab-mcq', prompt: q.prompt, correct: q.correct, options: shuffle(q.options), pinyin: '' });
  }

  const orderItems = [
    { fr: 'Après les cours, il va à la bibliothèque lire.', chunks: ['下课', '以后', '他', '去', '图书馆', '看书'], answer: '下课以后他去图书馆看书' },
    { fr: 'Du lundi au vendredi, il a cours tous les jours.', chunks: ['从', '星期一', '到', '星期五', '他', '每天', '上课'], answer: '从星期一到星期五他每天上课' },
    { fr: 'Après le petit-déjeuner, il va tout de suite à l\'école.', chunks: ['吃完', '早饭', '以后', '他', '马上', '去', '学校'], answer: '吃完早饭以后他马上去学校' },
    { fr: 'J\'apprends le chinois depuis trois ans.', chunks: ['我', '学了', '三年', '中文', '了'], answer: '我学了三年中文了' },
    { fr: 'Il parle chinois très bien.', chunks: ['他', '说', '汉语', '说得', '很好'], answer: '他说汉语说得很好' },
    { fr: 'Le prof demande aux étudiants de faire les exercices.', chunks: ['老师', '让', '学生们', '做', '练习'], answer: '老师让学生们做练习' },
  ];
  for (const q of pick(orderItems, 2)) {
    round3.push({ type: 'order', fr: q.fr, chunks: q.chunks, answer: q.answer });
  }

  return {
    rounds: [
      { title: 'Évaluation', subtitle: 'Testez vos acquis', exercises: shuffle(round1) },
      { title: 'Renforcement', subtitle: 'Grammaire et expressions temporelles', exercises: shuffle(round2) },
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

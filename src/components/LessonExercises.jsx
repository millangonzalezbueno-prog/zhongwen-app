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
  if (lesson.id === 'L03') return buildExercisesL03(lesson);
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
    { sentence: '图书馆在书店___。', answer: '前面', options: ['前面', '后面', '旁边', '对面'], hint: 'La bibliothèque est devant la librairie.',
      explanation_fr: '前面 signifie « devant ». Le locatif composé se forme avec le monosyllabe 前 (avant) + 面. D\'après le texte, la bibliothèque se trouve devant la librairie.',
      explanation_en: '前面 means "in front of." The compound locative is formed with 前 (front) + 面. According to the text, the library is in front of the bookstore.' },
    { sentence: '学校___有一个商店。', answer: '后面', options: ['前面', '后面', '里面', '外面'], hint: 'Il y a un magasin derrière l\'école.',
      explanation_fr: '后面 signifie « derrière ». Structure Lieu + 后面 + 有 + Chose = « derrière [lieu], il y a [chose] ». 前面 (devant), 里面 (dedans) et 外面 (dehors) ne correspondent pas au texte.',
      explanation_en: '后面 means "behind." The structure Lieu + 后面 + 有 + Thing = "behind [place], there is [thing]." 前面 (in front), 里面 (inside), and 外面 (outside) don\'t match the text.' },
    { sentence: '公园___有很多年轻人跑步。', answer: '里', options: ['里', '外', '上', '下'], hint: 'Beaucoup de jeunes courent dans le parc.',
      explanation_fr: '里 signifie « à l\'intérieur de ». On utilise 里 (ou 里面) après un lieu pour dire « dans » ce lieu. Les jeunes courent dans le parc, pas dehors (外), dessus (上) ou dessous (下).',
      explanation_en: '里 means "inside." We use 里 (or 里面) after a place to say "in" that place. The young people are running in the park, not outside (外), on top of (上), or below (下).' },
    { sentence: '学校___有一个很大的书店。', answer: '右边', options: ['左边', '右边', '前面', '后面'], hint: 'Il y a une grande librairie à droite de l\'école.',
      explanation_fr: '右边 signifie « à droite ». C\'est un locatif composé : 右 (droite) + 边. Le texte dit « 学校右边有一个很大的书店 » (à droite de l\'école il y a une grande librairie).',
      explanation_en: '右边 means "to the right." It\'s a compound locative: 右 (right) + 边. The text says "学校右边有一个很大的书店" (to the right of the school there\'s a big bookstore).' },
    { sentence: '桌子___有一本书。', answer: '上面', options: ['上面', '下面', '里面', '旁边'], hint: 'Il y a un livre sur la table.',
      explanation_fr: '上面 signifie « au-dessus, sur ». On place le locatif après le nom de référence : 桌子上面 = « sur la table ». Les autres options placeraient le livre sous (下面), dans (里面) ou à côté de (旁边) la table.',
      explanation_en: '上面 means "on top of, on." The locative goes after the reference noun: 桌子上面 = "on the table." The other options would place the book under (下面), inside (里面), or next to (旁边) the table.' },
    { sentence: '学校___有好几个地铁站。', answer: '对面', options: ['对面', '附近', '旁边', '里面'], hint: 'Il y a plusieurs stations de métro en face de l\'école.',
      explanation_fr: '对面 signifie « en face de ». Le texte dit « 巴黎政治学院对面有好几个地铁站 ». 附近 (aux environs) et 旁边 (à côté) sont proches en sens mais ne correspondent pas au texte.',
      explanation_en: '对面 means "opposite, across from." The text says "巴黎政治学院对面有好几个地铁站." 附近 (nearby) and 旁边 (beside) are close in meaning but don\'t match the text.' },
  ];
  for (const q of pick(locativeFills, 4)) {
    round2.push({
      type: 'fill-mcq',
      sentence: q.sentence,
      correct: q.answer,
      options: shuffle(q.options),
      hint: q.hint,
      explanation_fr: q.explanation_fr,
      explanation_en: q.explanation_en,
    });
  }

  // 2b. Aspect marker selection (过/了/着)
  const aspectMarkers = [
    { sentence: '你去___中国吗？', answer: '过', options: ['过', '了', '着'], hint: 'As-tu déjà été en Chine ? (expérience)',
      explanation_fr: '过 marque l\'aspect expérientiel : « avoir déjà fait quelque chose au moins une fois ». Ici on demande si la personne est déjà allée en Chine (expérience de vie). 了 marquerait une action accomplie ponctuelle, 着 un état continu — ni l\'un ni l\'autre ne convient.',
      explanation_en: '过 marks the experiential aspect: "to have done something at least once." Here we\'re asking if the person has ever been to China (life experience). 了 would mark a specific completed action, 着 a continuing state — neither fits here.' },
    { sentence: '他买___两条鱼。', answer: '了', options: ['过', '了', '着'], hint: 'Il a acheté deux poissons. (action accomplie)',
      explanation_fr: '了₁ se place après le verbe pour indiquer une action accomplie. « 他买了两条鱼 » = il a acheté deux poissons (action terminée à un moment précis). 过 indiquerait une expérience générale (« il a déjà acheté du poisson »), 着 un état continu.',
      explanation_en: '了₁ goes after the verb to indicate a completed action. "他买了两条鱼" = he bought two fish (action completed at a specific moment). 过 would indicate a general experience ("he has bought fish before"), 着 a continuing state.' },
    { sentence: '门开___。', answer: '着', options: ['过', '了', '着'], hint: 'La porte est ouverte. (état continu)',
      explanation_fr: '着 après un verbe indique un état qui dure. « 门开着 » = la porte est (et reste) ouverte — on décrit l\'état actuel, pas une action ponctuelle. 了 (门开了) signifierait « la porte s\'est ouverte » (changement), 过 (门开过) « la porte a déjà été ouverte » (expérience).',
      explanation_en: '着 after a verb indicates a continuing state. "门开着" = the door is (and stays) open — describing the current state, not a punctual action. 了 (门开了) would mean "the door opened" (change), 过 (门开过) "the door has been opened before" (experience).' },
    { sentence: '我没吃___臭豆腐。', answer: '过', options: ['过', '了', '着'], hint: 'Je n\'ai jamais mangé de tofu puant.',
      explanation_fr: '没 + V + 过 = « n\'avoir jamais fait ». C\'est la forme négative de l\'aspect expérientiel. « 我没吃过臭豆腐 » = je n\'ai jamais mangé de tofu puant (aucune expérience). Attention : la négation de 过 utilise toujours 没, jamais 不.',
      explanation_en: '没 + V + 过 = "to have never done." This is the negative form of the experiential aspect. "我没吃过臭豆腐" = I\'ve never eaten stinky tofu (no experience). Note: the negation of 过 always uses 没, never 不.' },
    { sentence: '草黄___。', answer: '了', options: ['过', '了', '着'], hint: 'L\'herbe a jauni. (changement d\'état)',
      explanation_fr: 'Ici 了 est 了₂ (en fin de phrase), qui indique un changement d\'état : « l\'herbe est devenue jaune » — une situation nouvelle. Ce n\'est pas une expérience (过) ni un état permanent (着), mais une transformation : l\'herbe n\'était pas jaune, maintenant elle l\'est.',
      explanation_en: 'Here 了 is 了₂ (sentence-final), indicating a change of state: "the grass has turned yellow" — a new situation. It\'s not an experience (过) or a permanent state (着), but a transformation: the grass wasn\'t yellow, now it is.' },
    { sentence: '他穿___一件红色的衣服。', answer: '着', options: ['过', '了', '着'], hint: 'Il porte un vêtement rouge. (en ce moment)',
      explanation_fr: '着 décrit un état résultant qui persiste : « 他穿着一件红色的衣服 » = il porte (en ce moment) un vêtement rouge. L\'accent est sur l\'état actuel (le vêtement est sur lui), pas sur l\'action de s\'habiller. 了 (穿了) décrirait l\'action de mettre le vêtement.',
      explanation_en: '着 describes a resulting state that persists: "他穿着一件红色的衣服" = he is wearing a red garment (right now). The focus is on the current state (the garment is on him), not the action of putting it on. 了 (穿了) would describe the action of putting on the garment.' },
    { sentence: '我不爱你___。', answer: '了', options: ['过', '了', '着'], hint: 'Je ne t\'aime plus. (changement de situation)',
      explanation_fr: '不…了₂ exprime « ne plus » — un changement par rapport à avant. « 我不爱你了 » = je ne t\'aime plus (avant je t\'aimais, maintenant non). Ce 了 est en fin de phrase (了₂) et marque le basculement d\'une situation à une autre.',
      explanation_en: '不…了₂ expresses "no longer" — a change from before. "我不爱你了" = I don\'t love you anymore (I used to love you, now I don\'t). This 了 is sentence-final (了₂) marking the shift from one situation to another.' },
    { sentence: '你学___汉语吗？', answer: '过', options: ['过', '了', '着'], hint: 'As-tu déjà étudié le chinois ? (expérience passée)',
      explanation_fr: '过 après le verbe 学 pose la question de l\'expérience : « as-tu déjà (dans ta vie) étudié le chinois ? ». La structure est S + V + 过 + CO + 吗？On s\'intéresse à l\'expérience passée, pas à un moment précis.',
      explanation_en: '过 after the verb 学 asks about experience: "have you ever studied Chinese (in your life)?" The structure is S + V + 过 + Object + 吗? We\'re asking about past experience, not a specific moment.' },
  ];
  for (const q of pick(aspectMarkers, 4)) {
    round2.push({
      type: 'fill-mcq',
      sentence: q.sentence,
      correct: q.answer,
      options: shuffle(q.options),
      hint: q.hint,
      explanation_fr: q.explanation_fr,
      explanation_en: q.explanation_en,
    });
  }

  // 2c. Error correction (改错) — inspired by the PPT 练习
  const errorCorrections = [
    { wrong: '你学汉语过吗？', correct: '你学过汉语吗？',
      explanation_fr: '过 se place toujours immédiatement après le verbe, jamais après le complément d\'objet. L\'ordre correct est : S + V + 过 + CO + 吗？Ici : 你 + 学 + 过 + 汉语 + 吗？',
      explanation_en: '过 always goes directly after the verb, never after the object. The correct order is: S + V + 过 + Object + 吗? Here: 你 + 学 + 过 + 汉语 + 吗?' },
    { wrong: '他也没去中国过。', correct: '他也没去过中国。',
      explanation_fr: '过 se place directement après le verbe 去, avant le COD 中国. L\'ordre est : 没 + V + 过 + CO. La position de 过 est fixe : il est inséparable du verbe.',
      explanation_en: '过 goes directly after the verb 去, before the object 中国. The order is: 没 + V + 过 + Object. The position of 过 is fixed: it cannot be separated from the verb.' },
    { wrong: '他们来过在法国。', correct: '他们来过法国。',
      explanation_fr: '在 est superflu ici. Avec V + 过 + lieu, on ne met pas de préposition 在 devant le lieu. 来过法国 suffit pour dire « être déjà venu en France ». L\'ajout de 在 crée une construction grammaticalement incorrecte.',
      explanation_en: '在 is unnecessary here. With V + 过 + place, we don\'t put the preposition 在 before the place. 来过法国 is enough to say "to have been to France." Adding 在 creates a grammatically incorrect construction.' },
    { wrong: '我们二个人都学过中文。', correct: '我们两个人都学过中文。',
      explanation_fr: '两 (et non 二) s\'utilise devant un classificateur. 二 est le chiffre (numérotation, mathématiques), tandis que 两 est le nombre (quantité). Devant 个, on dit toujours 两个, jamais 二个.',
      explanation_en: '两 (not 二) is used before a classifier. 二 is the digit (numbering, math), while 两 is the number (quantity). Before 个, we always say 两个, never 二个.' },
    { wrong: '他不去过美国。', correct: '他没去过美国。',
      explanation_fr: 'La négation de 过 (aspect expérientiel) utilise toujours 没, jamais 不. 不 nie une habitude ou une volonté présente, tandis que 没 nie une action passée ou une expérience. Règle : 没 + V + 过 = « ne jamais avoir fait ».',
      explanation_en: 'The negation of 过 (experiential aspect) always uses 没, never 不. 不 negates a present habit or willingness, while 没 negates a past action or experience. Rule: 没 + V + 过 = "to have never done."' },
    { wrong: '书包里书在。', correct: '书在书包里。',
      explanation_fr: 'La structure 在 + lieu suit le sujet : S + 在 + lieu. Ici : 书 (sujet) + 在 (verbe) + 书包里 (lieu). L\'ordre sujet-verbe-lieu est fixe en chinois pour la localisation. On ne peut pas placer le lieu avant 在.',
      explanation_en: 'The structure 在 + place follows the subject: S + 在 + place. Here: 书 (subject) + 在 (verb) + 书包里 (place). The subject-verb-place order is fixed in Chinese for location. You cannot place the location before 在.' },
  ];
  for (const q of pick(errorCorrections, 4)) {
    round2.push({
      type: 'error-correction',
      wrong: q.wrong,
      correct: q.correct,
      explanation_fr: q.explanation_fr,
      explanation_en: q.explanation_en,
    });
  }

  // === ROUND 3: DÉFI ===

  // 3a. FR → ZH translation (type answer)
  const translations = [
    { fr: 'Il y a un supermarché à côté de l\'école.', zh: '学校旁边有一个超市。', pattern: 'Lieu + 有 + Chose',
      explanation_fr: 'Structure Lieu + 有 + Chose : on place d\'abord le lieu (学校旁边 = à côté de l\'école), puis 有 (il y a), puis ce qui existe (一个超市 = un supermarché). L\'ordre est l\'inverse du français.',
      explanation_en: 'Structure Place + 有 + Thing: first the place (学校旁边 = next to school), then 有 (there is), then what exists (一个超市 = a supermarket). The order is the reverse of English "there is... near...".' },
    { fr: 'Le livre est sur la table.', zh: '书在桌子上面。', pattern: '在 + Lieu',
      explanation_fr: 'Structure S + 在 + lieu : 书 (le livre) + 在 (se trouve) + 桌子上面 (sur la table). Le locatif 上面 (dessus) suit le nom de référence 桌子.',
      explanation_en: 'Structure S + 在 + place: 书 (the book) + 在 (is at) + 桌子上面 (on the table). The locative 上面 (on top) follows the reference noun 桌子.' },
    { fr: 'Il y a beaucoup de monde dans le parc.', zh: '公园里有很多人。', pattern: 'Lieu + 有 + Chose',
      explanation_fr: 'Même structure : 公园里 (dans le parc, avec le locatif 里) + 有 (il y a) + 很多人 (beaucoup de gens). 很多 est un quantifieur indéfini qui ne nécessite pas de classificateur.',
      explanation_en: 'Same structure: 公园里 (in the park, with locative 里) + 有 (there are) + 很多人 (many people). 很多 is an indefinite quantifier that doesn\'t require a classifier.' },
    { fr: 'Il a déjà été en Chine.', zh: '他去过中国。', pattern: 'V + 过',
      explanation_fr: 'V + 过 exprime l\'expérience : 去过 = « être déjà allé ». 过 se place directement après le verbe, avant le complément 中国. Pas de 了 ici — 过 suffit pour marquer l\'expérience.',
      explanation_en: 'V + 过 expresses experience: 去过 = "to have been to." 过 goes directly after the verb, before the object 中国. No 了 needed here — 过 alone marks the experience.' },
    { fr: 'Je ne t\'aime plus.', zh: '我不爱你了。', pattern: '不…了₂',
      explanation_fr: '不…了₂ exprime « ne plus ». 了₂ en fin de phrase indique un changement de situation : avant, je t\'aimais, maintenant non. Les verbes d\'état (爱, 想, 喜欢) utilisent 不 pour la négation, jamais 没.',
      explanation_en: '不…了₂ expresses "no longer." 了₂ at the end signals a change of situation: before, I loved you, now I don\'t. Stative verbs (爱, 想, 喜欢) use 不 for negation, never 没.' },
    { fr: 'La porte est ouverte.', zh: '门开着。', pattern: 'V + 着',
      explanation_fr: '着 après le verbe 开 décrit un état qui dure : la porte est et reste ouverte. Ce n\'est pas une action en cours, mais un état résultant. Comparer : 门开了 (la porte s\'est ouverte — changement) vs. 门开着 (la porte est ouverte — état).',
      explanation_en: '着 after the verb 开 describes a lasting state: the door is and remains open. It\'s not an ongoing action, but a resulting state. Compare: 门开了 (the door opened — change) vs. 门开着 (the door is open — state).' },
    { fr: 'Du Luxembourg à Montparnasse, c\'est très proche.', zh: '从卢森堡到蒙帕纳斯很近。', pattern: '从 A 到 B',
      explanation_fr: '从 A 到 B indique un trajet entre deux points : 从 (de) + lieu A + 到 (à) + lieu B. L\'adjectif 很近 (très proche) décrit la distance. Pas de verbe 是 nécessaire ici.',
      explanation_en: '从 A 到 B indicates a journey between two points: 从 (from) + place A + 到 (to) + place B. The adjective 很近 (very close) describes the distance. No verb 是 needed here.' },
    { fr: 'Il y a un magasin derrière l\'école.', zh: '学校后面有一个商店。', pattern: 'Lieu + 有 + Chose',
      explanation_fr: '学校后面 (derrière l\'école) + 有 (il y a) + 一个商店 (un magasin). Le classificateur 个 est nécessaire entre le nombre et le nom. Le locatif 后面 suit le nom de référence 学校.',
      explanation_en: '学校后面 (behind the school) + 有 (there is) + 一个商店 (a shop). The classifier 个 is needed between the number and the noun. The locative 后面 follows the reference noun 学校.' },
  ];
  for (const q of pick(translations, 3)) {
    round3.push({
      type: 'translate',
      fr: q.fr,
      zh: q.zh,
      pattern: q.pattern,
      explanation_fr: q.explanation_fr,
      explanation_en: q.explanation_en,
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
    { noun: '床', answer: '张', options: ['张', '把', '节', '个'],
      explanation_fr: '张 est le classificateur pour les objets à surface plane : lit (床), table (桌子), photo (照片), billet (票). Le lit est considéré comme un objet plat.',
      explanation_en: '张 is the classifier for objects with a flat surface: bed (床), table (桌子), photo (照片), ticket (票). A bed is considered a flat object.' },
    { noun: '椅子', answer: '把', options: ['张', '把', '节', '个'],
      explanation_fr: '把 est le classificateur pour les objets qu\'on saisit par une poignée : chaise (椅子), parapluie (伞), clé (钥匙), couteau (刀). On « attrape » (把) une chaise par le dossier.',
      explanation_en: '把 is the classifier for objects you grab by a handle: chair (椅子), umbrella (伞), key (钥匙), knife (刀). You "grasp" (把) a chair by its back.' },
    { noun: '汉语课', answer: '节', options: ['张', '把', '节', '个'],
      explanation_fr: '节 est le classificateur pour les cours (périodes d\'enseignement) : 一节课 = un cours, 两节汉语课 = deux cours de chinois. Il mesure une unité de temps scolaire.',
      explanation_en: '节 is the classifier for class periods: 一节课 = one class, 两节汉语课 = two Chinese classes. It measures a unit of school time.' },
    { noun: '桌子', answer: '张', options: ['张', '把', '节', '个'],
      explanation_fr: '张 pour les objets à surface plane. Une table est l\'exemple classique d\'objet plat. Mnémotechnique : 张 contient le radical 弓 (arc) — imaginez une surface tendue et plate.',
      explanation_en: '张 for flat-surfaced objects. A table is the classic example of a flat object. Mnemonic: 张 contains the radical 弓 (bow) — imagine a taut, flat surface.' },
  ];
  for (const q of pick(classifierItems, 2)) {
    round3.push({
      type: 'classifier',
      noun: q.noun,
      correct: q.answer,
      options: shuffle(q.options),
      explanation_fr: q.explanation_fr,
      explanation_en: q.explanation_en,
    });
  }

  // 3d. Grammar MCQ — choose the correct sentence
  const grammarMCQ = [
    { pattern: 'V + 过', prompt: 'Quelle phrase utilise correctement 过 (aspect expérientiel) ? / Which sentence correctly uses 过 (experiential)?',
      correct: '你吃过臭豆腐吗？', options: shuffle(['你吃过臭豆腐吗？', '你吃臭豆腐过吗？', '你不吃过臭豆腐吗？']),
      explanation_fr: '过 se place directement après le verbe 吃, avant le COD 臭豆腐. « 你吃臭豆腐过吗？ » est faux car 过 ne peut pas aller après le COD. « 你不吃过臭豆腐吗？ » est faux car la négation de 过 utilise 没, pas 不.',
      explanation_en: '过 goes directly after the verb 吃, before the object 臭豆腐. "你吃臭豆腐过吗？" is wrong because 过 can\'t follow the object. "你不吃过臭豆腐吗？" is wrong because negation of 过 uses 没, not 不.' },
    { pattern: 'V + 了₁', prompt: 'Quelle phrase utilise correctement 了₁ (action accomplie) ? / Which sentence correctly uses 了₁ (completed action)?',
      correct: '我昨天买了两条鱼。', options: shuffle(['我昨天买了两条鱼。', '我昨天了买两条鱼。', '我昨天买两条鱼了。']),
      explanation_fr: '了₁ se place immédiatement après le verbe 买 : 买了. « 了买 » est impossible car 了₁ doit suivre le verbe. « 买两条鱼了 » — ce 了 en fin de phrase serait 了₂ (changement de situation), pas 了₁ (action accomplie), ce qui change le sens.',
      explanation_en: '了₁ goes immediately after the verb 买: 买了. "了买" is impossible because 了₁ must follow the verb. "买两条鱼了" — this sentence-final 了 would be 了₂ (change of situation), not 了₁ (completed action), which changes the meaning.' },
    { pattern: '在 + Lieu', prompt: 'Quelle phrase exprime correctement la localisation ? / Which sentence correctly expresses location?',
      correct: '书在桌子上面。', options: shuffle(['书在桌子上面。', '在书桌子上面。', '书桌子上面在。']),
      explanation_fr: 'La structure est S + 在 + lieu : 书 (sujet) + 在 (se trouve) + 桌子上面 (sur la table). Le verbe 在 ne peut pas précéder le sujet (在书), et il ne peut pas aller en fin de phrase.',
      explanation_en: 'The structure is S + 在 + place: 书 (subject) + 在 (is at) + 桌子上面 (on the table). The verb 在 cannot precede the subject (在书), and it cannot go at the end of the sentence.' },
    { pattern: 'V + 着', prompt: 'Quelle phrase décrit un état continu avec 着 ? / Which sentence describes a continuing state with 着?',
      correct: '他穿着一件红色的衣服。', options: shuffle(['他穿着一件红色的衣服。', '他着穿一件红色的衣服。', '他穿一件红色的着衣服。']),
      explanation_fr: '着 se place directement après le verbe 穿 : 穿着 = « porter (en ce moment) ». Il ne peut jamais précéder le verbe (着穿) ni s\'intercaler dans le COD (着衣服). L\'état décrit est que le vêtement est actuellement porté.',
      explanation_en: '着 goes directly after the verb 穿: 穿着 = "wearing (right now)." It can never precede the verb (着穿) or be inserted in the object (着衣服). The state described is that the garment is currently being worn.' },
    { pattern: 'Lieu + 有', prompt: 'Quelle phrase exprime correctement l\'existence ? / Which sentence correctly expresses existence?',
      correct: '学校旁边有一个超市。', options: shuffle(['学校旁边有一个超市。', '有一个超市学校旁边。', '一个超市有学校旁边。']),
      explanation_fr: 'La structure d\'existence est : Lieu + 有 + Chose. Le lieu (学校旁边) vient en premier, suivi de 有, puis de ce qui existe (一个超市). En français on dit « il y a un supermarché à côté de l\'école », mais en chinois le lieu précède toujours 有.',
      explanation_en: 'The existence structure is: Place + 有 + Thing. The place (学校旁边) comes first, followed by 有, then what exists (一个超市). In English we say "there is a supermarket next to school," but in Chinese the place always precedes 有.' },
  ];
  for (const q of pick(grammarMCQ, 3)) {
    round3.push({ type: 'grammar-mcq', ...q });
  }

  // 3e. Sentence construction — order words
  const orderItems = [
    { fr: 'Beaucoup d\'étudiants prennent le métro pour venir en cours.', chunks: ['很多', '学生', '坐', '地铁', '来', '上课'], answer: '很多学生坐地铁来上课',
      explanation_fr: 'L\'ordre est : sujet (很多学生) + moyen de transport (坐地铁) + verbe directionnel (来) + but (上课). En chinois, le moyen précède le verbe de mouvement.',
      explanation_en: 'The order is: subject (很多学生) + transport (坐地铁) + directional verb (来) + purpose (上课). In Chinese, the means precedes the movement verb.' },
    { fr: 'Il y a un restaurant chinois à côté de l\'école.', chunks: ['学校', '旁边', '有', '一个', '中国', '饭馆'], answer: '学校旁边有一个中国饭馆',
      explanation_fr: 'Structure Lieu + 有 + Chose : 学校旁边 (lieu) + 有 (il y a) + 一个中国饭馆 (un restaurant chinois). Le modificateur 中国 précède directement le nom 饭馆.',
      explanation_en: 'Structure Place + 有 + Thing: 学校旁边 (place) + 有 (there is) + 一个中国饭馆 (a Chinese restaurant). The modifier 中国 directly precedes the noun 饭馆.' },
    { fr: 'Les jeunes aiment aller courir le matin.', chunks: ['年轻人', '早上', '喜欢', '去', '跑步'], answer: '年轻人早上喜欢去跑步',
      explanation_fr: 'Ordre : sujet (年轻人) + temps (早上) + verbe modal (喜欢) + verbe de mouvement (去) + activité (跑步). En chinois, le complément de temps se place avant le verbe.',
      explanation_en: 'Order: subject (年轻人) + time (早上) + modal verb (喜欢) + movement verb (去) + activity (跑步). In Chinese, the time complement goes before the verb.' },
    { fr: 'La chambre de la résidence n\'est pas très grande mais elle est confortable.', chunks: ['宿舍', '的', '房间', '不太大', '可是', '很', '舒服'], answer: '宿舍的房间不太大可是很舒服',
      explanation_fr: '宿舍的房间 = « la chambre de la résidence » (modificateur + 的 + nom). 不太大 = « pas très grande ». 可是 = « mais ». 很舒服 = « très confortable ». La structure A-mais-B est : A, 可是/但是, B.',
      explanation_en: '宿舍的房间 = "the dorm room" (modifier + 的 + noun). 不太大 = "not very big." 可是 = "but." 很舒服 = "very comfortable." The A-but-B structure is: A, 可是/但是, B.' },
  ];
  for (const q of pick(orderItems, 2)) {
    round3.push({
      type: 'order',
      fr: q.fr,
      chunks: q.chunks,
      answer: q.answer,
      explanation_fr: q.explanation_fr,
      explanation_en: q.explanation_en,
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
    { sentence: '我买了三___书。', answer: '本', options: ['本', '条', '张', '个'], hint: 'Books are bound objects.',
      explanation_fr: '本 est le classificateur pour les objets reliés : livres, revues, cahiers. On ne dit jamais 三个书 en chinois standard. 条 est pour les objets longs (poisson, route), 张 pour les objets plats (table, photo).',
      explanation_en: '本 is the classifier for bound objects: books, magazines, notebooks. You never say 三个书 in standard Chinese. 条 is for long objects (fish, road), 张 for flat objects (table, photo).' },
    { sentence: '他家有两___猫。', answer: '只', options: ['只', '条', '个', '口'], hint: 'Cats use the animal classifier.',
      explanation_fr: '只 est le classificateur pour certains animaux : chien (狗), chat (猫), oiseau (鸟). 条 s\'utilise pour les animaux longs (poisson, serpent). 口 est réservé aux membres de la famille. 个 serait compris mais n\'est pas standard.',
      explanation_en: '只 is the classifier for certain animals: dog (狗), cat (猫), bird (鸟). 条 is used for long animals (fish, snake). 口 is reserved for family members. 个 would be understood but is not standard.' },
    { sentence: '我喝了一___咖啡。', answer: '杯', options: ['杯', '瓶', '碗', '个'], hint: 'A cup/glass of something.',
      explanation_fr: '杯 est le classificateur de contenance pour une tasse ou un verre : 一杯咖啡 (un café), 一杯水 (un verre d\'eau). 瓶 = une bouteille de, 碗 = un bol de. Ce sont des classificateurs de contenance (容器量词).',
      explanation_en: '杯 is the container classifier for a cup or glass: 一杯咖啡 (a coffee), 一杯水 (a glass of water). 瓶 = a bottle of, 碗 = a bowl of. These are container classifiers (容器量词).' },
    { sentence: '他有一___新车。', answer: '辆', options: ['辆', '个', '条', '张'], hint: 'For wheeled vehicles.',
      explanation_fr: '辆 est le classificateur spécifique pour les véhicules à roues : voiture, vélo, moto, bus. On dit 一辆车 (une voiture), 一辆自行车 (un vélo). 个 serait incorrect ici car les véhicules ont leur classificateur dédié.',
      explanation_en: '辆 is the specific classifier for wheeled vehicles: car, bicycle, motorcycle, bus. We say 一辆车 (a car), 一辆自行车 (a bicycle). 个 would be incorrect here because vehicles have their own dedicated classifier.' },
    { sentence: '她买了三___衣服。', answer: '件', options: ['件', '条', '只', '张'], hint: 'For clothing items.',
      explanation_fr: '件 est le classificateur pour les vêtements (un haut, une veste), les bagages et les affaires. 条 s\'utilise pour les vêtements longs et étroits (pantalon : 一条裤子, écharpe : 一条围巾). Une chemise = 一件衬衫, un pantalon = 一条裤子.',
      explanation_en: '件 is the classifier for clothing items (a top, a jacket), luggage, and matters. 条 is used for long narrow garments (pants: 一条裤子, scarf: 一条围巾). A shirt = 一件衬衫, pants = 一条裤子.' },
    { sentence: '我买了一___鞋。', answer: '双', options: ['双', '只', '个', '件'], hint: 'Things that come in pairs.',
      explanation_fr: '双 est le classificateur pour les objets qui vont par paire : chaussures (鞋), chaussettes (袜子), baguettes (筷子), mains (手). 只 compterait un seul objet de la paire (une seule chaussure).',
      explanation_en: '双 is the classifier for things that come in pairs: shoes (鞋), socks (袜子), chopsticks (筷子), hands (手). 只 would count a single item from the pair (one shoe).' },
    { sentence: '我去过三___中国。', answer: '次', options: ['次', '遍', '回', '个'], hint: 'Counting the number of times.',
      explanation_fr: '次 est un classificateur verbal qui compte le nombre de fois qu\'une action a eu lieu. 三次 = trois fois. 遍 compterait plutôt le nombre de fois qu\'on a fait quelque chose du début à la fin (lire un livre en entier, écouter une chanson).',
      explanation_en: '次 is a verbal classifier counting how many times an action occurred. 三次 = three times. 遍 would count how many times something was done from start to finish (reading a whole book, listening to a whole song).' },
    { sentence: '我看了三___这本书。', answer: '遍', options: ['遍', '次', '回', '本'], hint: 'Full process — read from start to finish.',
      explanation_fr: '遍 indique qu\'on a fait quelque chose du début à la fin, en entier. 看了三遍这本书 = j\'ai lu ce livre trois fois (intégralement). 次 compterait simplement le nombre de fois, sans insister sur le processus complet.',
      explanation_en: '遍 indicates doing something from beginning to end, in full. 看了三遍这本书 = I read this book three times (all the way through). 次 would simply count the number of times without emphasizing the complete process.' },
    { sentence: '他家有五___人。', answer: '口', options: ['口', '个', '位', '只'], hint: 'For counting family members.',
      explanation_fr: '口 est le classificateur spécifique pour compter les membres d\'une famille : 五口人 = une famille de cinq personnes. 个 est acceptable dans d\'autres contextes (五个人 = cinq personnes), mais pour la famille on préfère 口.',
      explanation_en: '口 is the specific classifier for counting family members: 五口人 = a family of five. 个 is acceptable in other contexts (五个人 = five people), but for family we prefer 口.' },
    { sentence: '这___老师教得很好。', answer: '位', options: ['位', '个', '只', '口'], hint: 'Polite classifier for people.',
      explanation_fr: '位 est le classificateur poli pour les personnes. On l\'utilise par respect, surtout pour les professeurs, médecins, invités. 这位老师 = « ce professeur » (ton respectueux). 个 serait correct mais moins poli. 只 est pour les animaux !',
      explanation_en: '位 is the polite classifier for people. It\'s used out of respect, especially for teachers, doctors, guests. 这位老师 = "this teacher" (respectful tone). 个 would be correct but less polite. 只 is for animals!' },
    { sentence: '我看了一___电影。', answer: '场', options: ['场', '个', '本', '次'], hint: 'For events and screenings.',
      explanation_fr: '场 est le classificateur pour les événements et séances : un film (一场电影), un match (一场比赛), une pluie (一场雨). Il mesure l\'événement en tant que séance. 次 compterait le nombre de fois qu\'on a vu un film.',
      explanation_en: '场 is the classifier for events and sessions: a movie (一场电影), a match (一场比赛), a rain (一场雨). It measures the event as a session. 次 would count how many times you saw a movie.' },
    { sentence: '我吃了两___米饭。', answer: '碗', options: ['碗', '杯', '瓶', '块'], hint: 'A bowl of something.',
      explanation_fr: '碗 est le classificateur de contenance pour un bol : 两碗米饭 = deux bols de riz. Le riz se sert dans des bols, pas dans des tasses (杯), bouteilles (瓶) ou morceaux (块). C\'est un classificateur de contenance (容器量词).',
      explanation_en: '碗 is the container classifier for a bowl: 两碗米饭 = two bowls of rice. Rice is served in bowls, not in cups (杯), bottles (瓶), or pieces (块). It\'s a container classifier (容器量词).' },
  ];
  for (const q of pick(classifierFill, 4)) {
    round1.push({ type: 'fill-mcq', sentence: q.sentence, correct: q.answer, options: shuffle(q.options), hint: q.hint, explanation_fr: q.explanation_fr, explanation_en: q.explanation_en });
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
    { sentence: '他___回家了。', answer: '已经', options: ['已经', '正在', '马上', '刚才'], hint: 'Il est déjà rentré.',
      explanation_fr: '已经 signifie « déjà » et fonctionne avec 了 en fin de phrase : 已经…了. « Il est déjà rentré » = action accomplie confirmée. 正在 (en train de) et 马上 (tout de suite) décrivent des actions en cours ou futures, pas accomplies.',
      explanation_en: '已经 means "already" and works with 了 at the end: 已经…了. "He has already gone home" = confirmed completed action. 正在 (in the process of) and 马上 (right away) describe ongoing or future actions, not completed ones.' },
    { sentence: '弟弟___吃饭。', answer: '正在', options: ['正在', '已经', '马上', '终于'], hint: 'Le petit frère est en train de manger.',
      explanation_fr: '正在 se place avant le verbe pour indiquer une action en cours : « être en train de ». L\'absence de 了 confirme que l\'action n\'est pas terminée. 已经 (déjà) impliquerait que c\'est fini, 马上 (tout de suite) que ça va commencer.',
      explanation_en: '正在 goes before the verb to indicate an action in progress: "in the process of." The absence of 了 confirms the action isn\'t finished. 已经 (already) would imply it\'s done, 马上 (right away) that it\'s about to start.' },
    { sentence: '我___给他打电话。', answer: '马上', options: ['马上', '刚才', '总是', '以前'], hint: 'Je vais l\'appeler tout de suite.',
      explanation_fr: '马上 signifie « tout de suite, immédiatement ». L\'action est sur le point de se produire. 刚才 (tout à l\'heure) réfère au passé immédiat. 总是 (toujours) et 以前 (avant) ne correspondent pas au sens d\'imminence.',
      explanation_en: '马上 means "right away, immediately." The action is about to happen. 刚才 (just now) refers to the immediate past. 总是 (always) and 以前 (before) don\'t match the sense of imminence.' },
    { sentence: '我___看见他了。', answer: '刚才', options: ['刚才', '马上', '总是', '经常'], hint: 'Je viens de le voir à l\'instant.',
      explanation_fr: '刚才 signifie « tout à l\'heure, à l\'instant ». Avec 了 en fin de phrase, il confirme qu\'une action vient de se produire dans le passé très récent. 马上 (tout de suite) réfère au futur immédiat, pas au passé.',
      explanation_en: '刚才 means "just now, a moment ago." With 了 at the end, it confirms an action that just happened in the very recent past. 马上 (right away) refers to the immediate future, not the past.' },
    { sentence: '太阳___出来了！', answer: '终于', options: ['终于', '已经', '马上', '正在'], hint: 'Le soleil est enfin sorti !',
      explanation_fr: '终于 signifie « enfin, finalement » — après une longue attente. Il implique qu\'on attendait cet événement depuis un moment. 已经 (déjà) n\'exprime pas cette notion d\'attente. Le point d\'exclamation renforce l\'idée de soulagement.',
      explanation_en: '终于 means "finally, at last" — after a long wait. It implies we\'ve been waiting for this event. 已经 (already) doesn\'t express this notion of anticipation. The exclamation mark reinforces the sense of relief.' },
    { sentence: '他___很早起床。', answer: '总是', options: ['总是', '经常', '最近', '马上'], hint: 'Il se lève toujours tôt.',
      explanation_fr: '总是 signifie « toujours » (100% du temps). C\'est une habitude constante et invariable. 经常 (souvent, ~70-80%) indiquerait une habitude fréquente mais pas systématique. 最近 (récemment) limiterait à une période récente.',
      explanation_en: '总是 means "always" (100% of the time). It\'s a constant, invariable habit. 经常 (often, ~70-80%) would indicate a frequent but not systematic habit. 最近 (recently) would limit it to a recent period.' },
    { sentence: '他周末___在家看书。', answer: '经常', options: ['经常', '总是', '马上', '正在'], hint: 'Le week-end, il lit souvent à la maison.',
      explanation_fr: '经常 signifie « souvent, fréquemment » — une habitude régulière mais pas systématique. 总是 (toujours) serait trop absolu pour « souvent ». Les adverbes de fréquence se placent avant le verbe, après le sujet et le complément de temps (周末).',
      explanation_en: '经常 means "often, frequently" — a regular but not systematic habit. 总是 (always) would be too absolute for "often." Frequency adverbs go before the verb, after the subject and time complement (周末).' },
    { sentence: '我___很忙。', answer: '最近', options: ['最近', '马上', '已经', '终于'], hint: 'Je suis occupé ces derniers temps.',
      explanation_fr: '最近 signifie « récemment, ces derniers temps ». Il situe l\'état (忙 = occupé) dans une période récente. 马上 (tout de suite) indiquerait le futur immédiat. 已经 (déjà) nécessiterait 了 en fin de phrase.',
      explanation_en: '最近 means "recently, lately." It places the state (忙 = busy) in a recent period. 马上 (right away) would indicate the immediate future. 已经 (already) would require 了 at the end of the sentence.' },
  ];
  for (const q of pick(timeAdverbs, 4)) {
    round2.push({ type: 'fill-mcq', sentence: q.sentence, correct: q.answer, options: shuffle(q.options), hint: q.hint, explanation_fr: q.explanation_fr, explanation_en: q.explanation_en });
  }

  const beforeAfter = [
    { sentence: '吃完早饭___，他马上去学校。', answer: '以后', options: ['以前', '以后', '的时候', '最近'], hint: 'Après le petit-déjeuner, il va à l\'école.',
      explanation_fr: '以后 signifie « après ». Structure : V/temps + 以后 + action suivante. Ici : « après avoir fini le petit-déjeuner (吃完早饭以后), il va tout de suite à l\'école ». 马上 (tout de suite) confirme la séquence temporelle.',
      explanation_en: '以后 means "after." Structure: V/time + 以后 + next action. Here: "after finishing breakfast (吃完早饭以后), he immediately goes to school." 马上 (right away) confirms the time sequence.' },
    { sentence: '我们看电影___，先去吃饭吧。', answer: '以前', options: ['以前', '以后', '的时候', '马上'], hint: 'Avant le film, allons d\'abord manger.',
      explanation_fr: '以前 signifie « avant ». L\'indice est 先 (d\'abord) qui implique que manger vient en premier, donc c\'est avant le film. Structure : V + 以前, 先 + V. Attention : 以后 + 先 serait contradictoire (« après... d\'abord »).',
      explanation_en: '以前 means "before." The clue is 先 (first) which implies eating comes first, so it\'s before the movie. Structure: V + 以前, 先 + V. Note: 以后 + 先 would be contradictory ("after... first").' },
    { sentence: '五点___回来。', answer: '以前', options: ['以前', '以后', '正在', '已经'], hint: 'Reviens avant 5 heures.',
      explanation_fr: '以前 après une heure signifie « avant cette heure ». 五点以前回来 = « reviens avant 5 heures » (= il faut être là avant 5h). 以后 donnerait « reviens après 5 heures » — sens opposé.',
      explanation_en: '以前 after a time means "before that time." 五点以前回来 = "come back before 5 o\'clock" (= you need to be here before 5). 以后 would give "come back after 5" — opposite meaning.' },
    { sentence: '下课___，我要去图书馆看书。', answer: '以后', options: ['以前', '以后', '的时候', '总是'], hint: 'Après les cours, je vais lire à la bibliothèque.',
      explanation_fr: '以后 après un verbe/événement signifie « après cet événement ». 下课以后 = « après les cours ». La deuxième partie (我要去图书馆看书) est ce qu\'on fera ensuite. 的时候 (quand) décrirait un moment simultané, pas une séquence.',
      explanation_en: '以后 after a verb/event means "after that event." 下课以后 = "after class." The second part (我要去图书馆看书) is what will be done next. 的时候 (when) would describe a simultaneous moment, not a sequence.' },
    { sentence: '九点___，请不要给我打电话。', answer: '以后', options: ['以前', '以后', '马上', '刚才'], hint: 'Après 9h, ne m\'appelle plus.',
      explanation_fr: '九点以后 = « après 9 heures ». On demande de ne pas appeler après cette heure (parce qu\'on dort, par exemple). 以前 donnerait « avant 9h, ne m\'appelle pas », ce qui est un sens différent.',
      explanation_en: '九点以后 = "after 9 o\'clock." The request is not to call after that hour (because one is sleeping, for example). 以前 would give "before 9, don\'t call me" — a different meaning.' },
    { sentence: '来中国___，他不会说中文。', answer: '以前', options: ['以前', '以后', '最近', '正在'], hint: 'Avant de venir en Chine, il ne parlait pas chinois.',
      explanation_fr: '来中国以前 = « avant de venir en Chine ». Le contexte (不会说中文 = ne savait pas parler chinois) indique une situation passée qui a changé depuis. 以后 signifierait « après être venu en Chine, il ne parle pas chinois » — logiquement peu probable.',
      explanation_en: '来中国以前 = "before coming to China." The context (不会说中文 = couldn\'t speak Chinese) indicates a past situation that has since changed. 以后 would mean "after coming to China, he can\'t speak Chinese" — logically unlikely.' },
  ];
  for (const q of pick(beforeAfter, 4)) {
    round2.push({ type: 'fill-mcq', sentence: q.sentence, correct: q.answer, options: shuffle(q.options), hint: q.hint, explanation_fr: q.explanation_fr, explanation_en: q.explanation_en });
  }

  const durationFill = [
    { sentence: '我学了三年中文___。', answer: '了', options: ['了', '的', '着', '过'], hint: 'With 了₁ + 了₂, the action continues to the present.',
      explanation_fr: 'Le premier 了 (après 学) est 了₁ = action accomplie. Le deuxième 了 (en fin de phrase) est 了₂ = la situation continue au moment présent. 了₁ + 了₂ ensemble = « depuis + durée, et ça continue ». Sans le 了₂ final, ça signifierait « j\'ai appris pendant 3 ans (mais plus maintenant) ».',
      explanation_en: 'The first 了 (after 学) is 了₁ = completed action. The second 了 (at sentence end) is 了₂ = the situation continues to the present. 了₁ + 了₂ together = "for + duration, and still going." Without the final 了₂, it would mean "I studied for 3 years (but not anymore)."' },
    { sentence: '你学汉语学了___？', answer: '多长时间了', options: ['多长时间了', '怎么样', '什么', '多大'], hint: 'Asking about duration.',
      explanation_fr: '多长时间 signifie « combien de temps ». Avec le 了 final, on demande la durée d\'une action qui continue : « depuis combien de temps apprends-tu le chinois ? ». La structure est : S + V + COD + V + 了 + 多长时间 + 了 (répétition du verbe car il a un COD).',
      explanation_en: '多长时间 means "how long." With the final 了, we\'re asking about the duration of an ongoing action: "how long have you been learning Chinese?" The structure is: S + V + Object + V + 了 + 多长时间 + 了 (verb repeated because it has an object).' },
    { sentence: '他在北京住了十年，现在不住了。没有了₂说明___。', answer: '动作已经结束', options: ['动作已经结束', '动作还在继续', '动作刚开始', '动作没发生'], hint: 'Without 了₂ at the end, the action is over.',
      explanation_fr: '住了十年 (avec seulement 了₁) signifie que l\'action est terminée : il a habité 10 ans, mais n\'y habite plus. Le contexte « 现在不住了 » le confirme. Si la phrase avait 了₂ (住了十年了), l\'action continuerait au présent. Cette distinction 了₁ / 了₁+了₂ est cruciale pour le complément de durée.',
      explanation_en: '住了十年 (with only 了₁) means the action is finished: he lived there for 10 years but no longer does. The context "现在不住了" confirms this. If the sentence had 了₂ (住了十年了), the action would continue to the present. This 了₁ / 了₁+了₂ distinction is crucial for duration complements.' },
  ];
  for (const q of pick(durationFill, 2)) {
    round2.push({ type: 'fill-mcq', sentence: q.sentence, correct: q.answer, options: shuffle(q.options), hint: q.hint, explanation_fr: q.explanation_fr, explanation_en: q.explanation_en });
  }

  const degreeFill = [
    { sentence: '你说汉语说___很好。', answer: '得', options: ['得', '的', '地', '了'], hint: 'V + 得 + Adj for degree complement.',
      explanation_fr: '得 (de) introduit le complément de degré après le verbe. Structure avec COD : S + V + COD + V + 得 + Adj. Ici le verbe 说 est répété car il a un COD (汉语). Attention aux trois « de » : 得 (degré, après verbe), 的 (possessif/descriptif, avant nom), 地 (manière, avant verbe).',
      explanation_en: '得 (de) introduces the degree complement after the verb. Structure with object: S + V + Object + V + 得 + Adj. Here the verb 说 is repeated because it has an object (汉语). Watch out for the three "de"s: 得 (degree, after verb), 的 (possessive/descriptive, before noun), 地 (manner, before verb).' },
    { sentence: '他昨天睡___很晚。', answer: '得', options: ['得', '的', '了', '着'], hint: 'Describes how the action was done.',
      explanation_fr: '得 après 睡 introduit un complément de degré : 睡得很晚 = « dormir très tard » (= se coucher tard). Quand le verbe n\'a pas de COD, pas besoin de le répéter. 的 serait incorrect ici (的 modifie un nom, pas un adjectif après un verbe). 了 indiquerait une action accomplie, pas la manière.',
      explanation_en: '得 after 睡 introduces a degree complement: 睡得很晚 = "to sleep very late" (= go to bed late). When the verb has no object, no need to repeat it. 的 would be incorrect here (的 modifies a noun, not an adjective after a verb). 了 would indicate a completed action, not the manner.' },
  ];
  for (const q of pick(degreeFill, 1)) {
    round2.push({ type: 'fill-mcq', sentence: q.sentence, correct: q.answer, options: shuffle(q.options), hint: q.hint, explanation_fr: q.explanation_fr, explanation_en: q.explanation_en });
  }

  const errorCorrections = [
    { wrong: '我已经吃饭。', correct: '我已经吃饭了。',
      explanation_fr: '已经 et 了 fonctionnent ensemble : 已经…了. Sans le 了 final, la phrase est incomplète grammaticalement. 已经 signale que l\'action est déjà accomplie, et 了₂ en fin de phrase confirme le changement de situation.',
      explanation_en: '已经 and 了 work together: 已经…了. Without the final 了, the sentence is grammatically incomplete. 已经 signals the action is already done, and 了₂ at the end confirms the change of situation.' },
    { wrong: '他在正看电视。', correct: '他正在看电视。',
      explanation_fr: '正在 est un mot composé inséparable signifiant « en train de ». On ne peut pas inverser les deux caractères. L\'ordre est fixe : 正在 + V. Variantes correctes : 他正看电视 ou 他在看电视 (正 seul ou 在 seul sont aussi possibles).',
      explanation_en: '正在 is an inseparable compound word meaning "in the process of." You cannot reverse the two characters. The order is fixed: 正在 + V. Correct variants: 他正看电视 or 他在看电视 (正 alone or 在 alone also work).' },
    { wrong: '我们看电影以后先去吃饭吧。', correct: '我们看电影以前先去吃饭吧。',
      explanation_fr: '先 (d\'abord) implique que manger vient en premier dans la séquence, donc c\'est AVANT le film → 以前. Avec 以后, la phrase dirait « après le film, allons d\'abord manger » — 以后 + 先 crée une contradiction logique (« après... d\'abord »).',
      explanation_en: '先 (first) implies eating comes first in the sequence, so it\'s BEFORE the movie → 以前. With 以后, the sentence would say "after the movie, let\'s first eat" — 以后 + 先 creates a logical contradiction ("after... first").' },
    { wrong: '下课以后我图书馆去。', correct: '下课以后我去图书馆。',
      explanation_fr: 'En chinois, le verbe de mouvement (去) précède toujours la destination : 去 + lieu. L\'ordre est : S + 去 + 图书馆. On ne peut pas placer la destination avant le verbe (图书馆去). C\'est l\'inverse du japonais mais similaire à l\'anglais (go to the library).',
      explanation_en: 'In Chinese, the movement verb (去) always precedes the destination: 去 + place. The order is: S + 去 + 图书馆. You cannot place the destination before the verb (图书馆去). This is the opposite of Japanese but similar to English (go to the library).' },
    { wrong: '九点以后不要打电话我。', correct: '九点以后不要给我打电话。',
      explanation_fr: '打电话 est un verbe à objet intégré (离合词). Pour ajouter un destinataire, on utilise la structure 给 + personne + 打电话. On ne peut pas dire 打电话我 — la personne doit être introduite par 给 avant le verbe.',
      explanation_en: '"打电话" is a separable verb (离合词). To add a recipient, use 给 + person + 打电话. You cannot say 打电话我 — the person must be introduced by 给 before the verb.' },
    { wrong: '他正在已经回家了。', correct: '他已经回家了。',
      explanation_fr: '正在 (en cours) et 已经 (déjà accompli) se contredisent logiquement. Une action ne peut pas être « en train de se faire » et « déjà finie » en même temps. Il faut choisir : 正在回家 (en train de rentrer) OU 已经回家了 (déjà rentré).',
      explanation_en: '正在 (in progress) and 已经 (already completed) contradict each other. An action cannot be "in the process of happening" and "already done" at the same time. Choose one: 正在回家 (going home now) OR 已经回家了 (already home).' },
    { wrong: '我买了三个书。', correct: '我买了三本书。',
      explanation_fr: '本 est le classificateur obligatoire pour les livres (objets reliés). 个 est le classificateur général, mais il ne s\'utilise PAS avec les livres en chinois standard. Chaque nom a son classificateur spécifique : 本 pour les livres, 条 pour les poissons, 张 pour les tables.',
      explanation_en: '本 is the mandatory classifier for books (bound objects). 个 is the general classifier, but it is NOT used with books in standard Chinese. Each noun has its specific classifier: 本 for books, 条 for fish, 张 for tables.' },
    { wrong: '他说中文说的很好。', correct: '他说中文说得很好。',
      explanation_fr: 'Le complément de degré utilise 得 (de), PAS 的 (de). Les trois « de » ont des fonctions différentes : 得 après un verbe évalue la qualité (说得好 = parle bien), 的 avant un nom modifie (我的书 = mon livre), 地 avant un verbe modifie la manière (快地跑 = courir vite).',
      explanation_en: 'The degree complement uses 得 (de), NOT 的 (de). The three "de"s have different functions: 得 after a verb evaluates quality (说得好 = speaks well), 的 before a noun modifies (我的书 = my book), 地 before a verb modifies manner (快地跑 = runs fast).' },
    { wrong: '老师让学生们汉字写。', correct: '老师让学生们写汉字。',
      explanation_fr: 'Dans la structure causative A + 让 + B + V + COD, le verbe (写) doit précéder le COD (汉字). L\'ordre est fixe : 让学生们写汉字 = « faire écrire des caractères aux étudiants ». Le COD ne peut pas précéder le verbe (汉字写 est incorrect).',
      explanation_en: 'In the causative structure A + 让 + B + V + Object, the verb (写) must precede the object (汉字). The order is fixed: 让学生们写汉字 = "have students write characters." The object cannot precede the verb (汉字写 is incorrect).' },
  ];
  for (const q of pick(errorCorrections, 4)) {
    round2.push({ type: 'error-correction', wrong: q.wrong, correct: q.correct, explanation_fr: q.explanation_fr, explanation_en: q.explanation_en });
  }

  // === ROUND 3: DÉFI ===

  const translations = [
    { fr: 'Il est en train de faire ses devoirs.', zh: '他正在做作业。', pattern: '正在 + V',
      explanation_fr: '正在 se place avant le verbe pour indiquer une action en cours. Structure : S + 正在 + V. 做作业 = faire ses devoirs (verbe-objet intégré). Pas de 了 car l\'action n\'est pas terminée.',
      explanation_en: '正在 goes before the verb to indicate an ongoing action. Structure: S + 正在 + V. 做作业 = to do homework (verb-object compound). No 了 because the action isn\'t finished.' },
    { fr: 'Il est déjà rentré.', zh: '他已经回家了。', pattern: '已经…了',
      explanation_fr: '已经 (déjà) + V + 了 (changement). Les deux éléments fonctionnent ensemble. 回家 = rentrer (verbe directionnel composé). Le 了 final confirme que l\'action est accomplie et que la situation a changé.',
      explanation_en: '已经 (already) + V + 了 (change). Both elements work together. 回家 = to go home (directional verb compound). The final 了 confirms the action is completed and the situation has changed.' },
    { fr: 'Après les cours, je vais à la bibliothèque.', zh: '下课以后我去图书馆。', pattern: '以后',
      explanation_fr: 'V + 以后 = « après V ». 下课 (finir les cours) + 以后 (après). Puis : 我 + 去 + 图书馆. Le verbe de mouvement 去 précède la destination.',
      explanation_en: 'V + 以后 = "after V." 下课 (finish class) + 以后 (after). Then: 我 + 去 + 图书馆. The movement verb 去 precedes the destination.' },
    { fr: 'Il se lève toujours très tôt.', zh: '他总是很早起床。', pattern: '总是',
      explanation_fr: 'L\'adverbe 总是 (toujours) se place avant le verbe, après le sujet : 他 + 总是 + 很早 + 起床. 很早 (très tôt) est un adverbe qui modifie 起床 (se lever). 起床 est un verbe à objet intégré (离合词).',
      explanation_en: 'The adverb 总是 (always) goes before the verb, after the subject: 他 + 总是 + 很早 + 起床. 很早 (very early) is an adverb modifying 起床 (get up). 起床 is a separable verb (离合词).' },
    { fr: 'Avant le film, allons d\'abord manger.', zh: '看电影以前，先去吃饭吧。', pattern: '以前',
      explanation_fr: 'V + 以前 = « avant de V ». 看电影以前 = « avant de voir le film ». 先 (d\'abord) renforce la séquence. 吧 en fin de phrase est la particule de suggestion (« allons... »).',
      explanation_en: 'V + 以前 = "before V-ing." 看电影以前 = "before watching the movie." 先 (first) reinforces the sequence. 吧 at the end is the suggestion particle ("let\'s...").' },
    { fr: 'Du lundi au vendredi, il a cours.', zh: '从星期一到星期五，他上课。', pattern: '从…到…',
      explanation_fr: '从 A 到 B = « de A à B ». S\'utilise pour le temps et l\'espace. 从星期一到星期五 = du lundi au vendredi. En chinois, le complément de temps se place avant le verbe.',
      explanation_en: '从 A 到 B = "from A to B." Used for both time and space. 从星期一到星期五 = from Monday to Friday. In Chinese, the time complement goes before the verb.' },
    { fr: 'J\'étudie le chinois depuis trois ans.', zh: '我学了三年中文了。', pattern: 'V+了+durée+了',
      explanation_fr: 'Deux 了 : 了₁ (après 学 = action accomplie) + 了₂ (en fin = continue au présent). Ensemble, ils signifient « depuis + durée, et ça continue ». Sans le 了₂ final (我学了三年中文), ça signifierait « j\'ai appris pendant 3 ans (mais plus maintenant) ».',
      explanation_en: 'Two 了s: 了₁ (after 学 = completed action) + 了₂ (at end = continues to present). Together they mean "for + duration, and still going." Without the final 了₂ (我学了三年中文), it would mean "I studied for 3 years (but not anymore)."' },
    { fr: 'Tu parles chinois très bien.', zh: '你说汉语说得很好。', pattern: 'V+得+Adj',
      explanation_fr: 'V + COD + V + 得 + Adj. Quand le verbe a un COD (汉语), on doit répéter le verbe (说) avant 得. Structure complète : 你 + 说 + 汉语 + 说 + 得 + 很好. C\'est le complément de degré (程度补语).',
      explanation_en: 'V + Object + V + 得 + Adj. When the verb has an object (汉语), you must repeat the verb (说) before 得. Full structure: 你 + 说 + 汉语 + 说 + 得 + 很好. This is the degree complement (程度补语).' },
    { fr: 'J\'ai acheté trois livres et deux poissons.', zh: '我买了三本书、两条鱼。', pattern: 'classificateurs',
      explanation_fr: 'Chaque nom a son classificateur : 本 pour les livres, 条 pour les poissons (longs et minces). Structure : nombre + classificateur + nom. Le 、est la virgule d\'énumération chinoise (顿号).',
      explanation_en: 'Each noun has its classifier: 本 for books, 条 for fish (long and thin). Structure: number + classifier + noun. The 、is the Chinese enumeration comma (顿号).' },
    { fr: 'Le professeur fait écrire des caractères aux étudiants.', zh: '老师让学生们写汉字。', pattern: '让+B+V',
      explanation_fr: 'Structure causative : A + 让 + B + V + COD. A (老师) demande/fait que B (学生们) fasse V (写) + COD (汉字). L\'ordre des compléments est fixe : le verbe 写 précède le COD 汉字.',
      explanation_en: 'Causative structure: A + 让 + B + V + Object. A (老师) asks/makes B (学生们) do V (写) + Object (汉字). The order is fixed: the verb 写 precedes the object 汉字.' },
    { fr: 'Chaque étudiant étudie le chinois tous les jours.', zh: '每个学生每天都学中文。', pattern: '每…都',
      explanation_fr: '每 + classificateur + nom + 都 + V. 每个学生 = chaque étudiant (个 = classificateur). 每天 = chaque jour (天 est déjà une unité, pas besoin de classificateur). 都 reprend la totalité (« tous sans exception »).',
      explanation_en: '每 + classifier + noun + 都 + V. 每个学生 = every student (个 = classifier). 每天 = every day (天 is already a unit, no classifier needed). 都 picks up the totality ("all without exception").' },
    { fr: 'J\'ai été en Chine trois fois.', zh: '我去过三次中国。', pattern: 'V+次',
      explanation_fr: '次 est un classificateur verbal qui se place après le verbe pour compter les occurrences : 去过三次 = « être allé trois fois ». L\'objet (中国) vient après le classificateur verbal. 过 marque l\'expérience passée.',
      explanation_en: '次 is a verbal classifier placed after the verb to count occurrences: 去过三次 = "to have been three times." The object (中国) comes after the verbal classifier. 过 marks past experience.' },
  ];
  for (const q of pick(translations, 3)) {
    round3.push({ type: 'translate', fr: q.fr, zh: q.zh, pattern: q.pattern, explanation_fr: q.explanation_fr, explanation_en: q.explanation_en });
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

  // Grammar MCQ for L02
  const grammarMCQ = [
    { pattern: 'V+了+durée', prompt: 'Quelle phrase exprime correctement une durée ? / Which sentence correctly expresses duration?',
      correct: '我学了三年中文了。', options: shuffle(['我学了三年中文了。', '我了学三年中文。', '我学三年了中文了。']),
      explanation_fr: '了₁ se place après le verbe (学了), la durée (三年) et le COD (中文) suivent, puis 了₂ en fin de phrase indique que l\'action continue. « 了学 » est impossible (了₁ doit suivre le verbe). « 学三年了中文了 » place 了 au mauvais endroit.',
      explanation_en: '了₁ goes after the verb (学了), the duration (三年) and object (中文) follow, then 了₂ at the end indicates the action continues. "了学" is impossible (了₁ must follow the verb). "学三年了中文了" places 了 in the wrong position.' },
    { pattern: 'V+得+Adj', prompt: 'Quelle phrase utilise correctement le complément de degré ? / Which sentence correctly uses the degree complement?',
      correct: '他说汉语说得很好。', options: shuffle(['他说汉语说得很好。', '他说得汉语很好。', '他说汉语得很好。']),
      explanation_fr: 'Quand le verbe a un COD, on doit répéter le verbe : S + V + COD + V + 得 + Adj. 得 s\'attache au verbe répété : 说得很好. « 说得汉语很好 » place le COD après 得 (incorrect). « 说汉语得很好 » omet la répétition du verbe.',
      explanation_en: 'When the verb has an object, you must repeat the verb: S + V + Object + V + 得 + Adj. 得 attaches to the repeated verb: 说得很好. "说得汉语很好" places the object after 得 (incorrect). "说汉语得很好" omits the verb repetition.' },
    { pattern: '每+clf+N+都+V', prompt: 'Quelle phrase utilise correctement 每...都 ? / Which sentence correctly uses 每...都?',
      correct: '每个学生都很可爱。', options: shuffle(['每个学生都很可爱。', '每学生个都很可爱。', '每个学生很都可爱。']),
      explanation_fr: '每 est suivi d\'un classificateur (个) puis du nom (学生) : 每个学生. 都 se place avant le verbe/adjectif (都很可爱). « 每学生个 » place le classificateur après le nom. « 很都可爱 » place 都 au mauvais endroit (都 doit précéder le groupe verbal).',
      explanation_en: '每 is followed by a classifier (个) then the noun (学生): 每个学生. 都 goes before the verb/adjective (都很可爱). "每学生个" places the classifier after the noun. "很都可爱" puts 都 in the wrong place (都 must precede the verb phrase).' },
    { pattern: 'A+让+B+V', prompt: 'Quelle phrase utilise correctement la structure causative 让 ? / Which sentence correctly uses causative 让?',
      correct: '老师让学生们写汉字。', options: shuffle(['老师让学生们写汉字。', '老师让写汉字学生们。', '让老师学生们写汉字。']),
      explanation_fr: 'Structure : A (celui qui ordonne) + 让 + B (celui qui exécute) + V + COD. 老师 (A) + 让 + 学生们 (B) + 写 (V) + 汉字 (COD). B doit être entre 让 et le verbe. Le verbe 写 doit précéder le COD 汉字.',
      explanation_en: 'Structure: A (the one who orders) + 让 + B (the one who acts) + V + Object. 老师 (A) + 让 + 学生们 (B) + 写 (V) + 汉字 (Object). B must be between 让 and the verb. The verb 写 must precede the object 汉字.' },
    { pattern: '已经…了', prompt: 'Quelle phrase exprime correctement « déjà » ? / Which sentence correctly expresses "already"?',
      correct: '他已经回家了。', options: shuffle(['他已经回家了。', '他回家已经了。', '他已经回家。']),
      explanation_fr: '已经 se place avant le verbe, 了 en fin de phrase. Les deux éléments fonctionnent ensemble : 已经…了. « 回家已经了 » place 已经 après le verbe (incorrect). « 他已经回家 » sans 了 est grammaticalement incomplet — 已经 exige 了 en fin de phrase.',
      explanation_en: '已经 goes before the verb, 了 at the end. Both elements work together: 已经…了. "回家已经了" places 已经 after the verb (incorrect). "他已经回家" without 了 is grammatically incomplete — 已经 requires 了 at sentence end.' },
  ];
  for (const q of pick(grammarMCQ, 3)) {
    round3.push({ type: 'grammar-mcq', ...q });
  }

  const orderItems = [
    { fr: 'Après les cours, il va à la bibliothèque lire.', chunks: ['下课', '以后', '他', '去', '图书馆', '看书'], answer: '下课以后他去图书馆看书',
      explanation_fr: 'Ordre : événement + 以后 (下课以后) + sujet (他) + verbe mouvement (去) + lieu (图书馆) + but (看书). Le temps/contexte se place avant le sujet en chinois.',
      explanation_en: 'Order: event + 以后 (下课以后) + subject (他) + movement verb (去) + place (图书馆) + purpose (看书). Time/context goes before the subject in Chinese.' },
    { fr: 'Du lundi au vendredi, il a cours tous les jours.', chunks: ['从', '星期一', '到', '星期五', '他', '每天', '上课'], answer: '从星期一到星期五他每天上课',
      explanation_fr: '从 A 到 B forme le cadre temporel (从星期一到星期五), suivi du sujet (他), de l\'adverbe de fréquence (每天) et du verbe (上课). Le cadre temporel précède le sujet.',
      explanation_en: '从 A 到 B forms the time frame (从星期一到星期五), followed by the subject (他), frequency adverb (每天), and verb (上课). The time frame precedes the subject.' },
    { fr: 'Après le petit-déjeuner, il va tout de suite à l\'école.', chunks: ['吃完', '早饭', '以后', '他', '马上', '去', '学校'], answer: '吃完早饭以后他马上去学校',
      explanation_fr: 'V + résultat (吃完 = finir de manger) + COD (早饭) + 以后 + sujet (他) + adverbe (马上) + verbe mouvement (去) + destination (学校). Les adverbes comme 马上 se placent avant le verbe.',
      explanation_en: 'V + result (吃完 = finish eating) + Object (早饭) + 以后 + subject (他) + adverb (马上) + movement verb (去) + destination (学校). Adverbs like 马上 go before the verb.' },
    { fr: 'J\'apprends le chinois depuis trois ans.', chunks: ['我', '学了', '三年', '中文', '了'], answer: '我学了三年中文了',
      explanation_fr: 'S (我) + V + 了₁ (学了) + durée (三年) + COD (中文) + 了₂ (了). Les deux 了 sont essentiels : 了₁ = action accomplie, 了₂ = continue au présent. Sans 了₂, l\'action serait terminée.',
      explanation_en: 'S (我) + V + 了₁ (学了) + duration (三年) + Object (中文) + 了₂ (了). Both 了s are essential: 了₁ = completed action, 了₂ = continues to present. Without 了₂, the action would be over.' },
    { fr: 'Il parle chinois très bien.', chunks: ['他', '说', '汉语', '说得', '很好'], answer: '他说汉语说得很好',
      explanation_fr: 'Complément de degré avec COD : S (他) + V (说) + COD (汉语) + V+得 (说得) + Adj (很好). Le verbe est répété car il a un objet. C\'est la seule construction possible quand un complément de degré suit un verbe transitif.',
      explanation_en: 'Degree complement with object: S (他) + V (说) + Object (汉语) + V+得 (说得) + Adj (很好). The verb is repeated because it has an object. This is the only possible construction when a degree complement follows a transitive verb.' },
    { fr: 'Le prof demande aux étudiants de faire les exercices.', chunks: ['老师', '让', '学生们', '做', '练习'], answer: '老师让学生们做练习',
      explanation_fr: 'Structure causative : A (老师) + 让 + B (学生们) + V (做) + COD (练习). L\'ordre est strict — le « doer » (B) se place entre 让 et le verbe.',
      explanation_en: 'Causative structure: A (老师) + 让 + B (学生们) + V (做) + Object (练习). The order is strict — the "doer" (B) goes between 让 and the verb.' },
  ];
  for (const q of pick(orderItems, 2)) {
    round3.push({ type: 'order', fr: q.fr, chunks: q.chunks, answer: q.answer, explanation_fr: q.explanation_fr, explanation_en: q.explanation_en });
  }

  return {
    rounds: [
      { title: 'Évaluation', subtitle: 'Testez vos acquis', exercises: shuffle(round1) },
      { title: 'Renforcement', subtitle: 'Grammaire et expressions temporelles', exercises: shuffle(round2) },
      { title: 'Défi', subtitle: 'Production et compréhension avancée', exercises: shuffle(round3) },
    ],
  };
}

function buildExercisesL03(lesson) {
  const vocab = lesson.vocab;
  const round1 = [];
  const round2 = [];
  const round3 = [];

  // === ROUND 1: ÉVALUATION ===

  // 1a. Vocab recall: French → pick Chinese (MCQ)
  const vocabWithGloss = vocab.filter(v => v.word.length >= 2 && !v.type);
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

  // 1b. Season/weather pinyin → Hanzi
  const weatherWords = vocab.filter(v => v.category === 'météo' && v.word.length >= 2);
  for (const v of pick(weatherWords, 3)) {
    const others = pick(weatherWords.filter(x => x.word !== v.word), 3).map(x => x.word);
    round1.push({
      type: 'vocab-mcq',
      prompt: `${v.pinyin} — ${v.gloss_fr.split('—')[0].split('(')[0].trim()}`,
      correct: v.word,
      options: shuffle([v.word, ...others]),
      pinyin: v.pinyin,
    });
  }

  // 1c. Season fill-in: which season matches the months?
  const seasonFills = [
    { sentence: '从三月到五月是___。', answer: '春天', options: ['春天', '夏天', '秋天', '冬天'], hint: 'De mars à mai.',
      explanation_fr: '春天 (printemps) correspond à la période de mars à mai. Le texte dit : « 从三月到五月是春天 ». 夏天 (été) va de juin à août, 秋天 (automne) de septembre à novembre, 冬天 (hiver) de décembre à février.',
      explanation_en: '春天 (spring) corresponds to March through May. The text says: "从三月到五月是春天." 夏天 (summer) is June–August, 秋天 (autumn) September–November, 冬天 (winter) December–February.' },
    { sentence: '从六月到八月是___。', answer: '夏天', options: ['春天', '夏天', '秋天', '冬天'], hint: 'De juin à août.',
      explanation_fr: '夏天 (été) correspond à la période de juin à août. Le texte dit : « 从六月到八月是夏天 ».',
      explanation_en: '夏天 (summer) corresponds to June through August. The text says: "从六月到八月是夏天."' },
    { sentence: '从九月到十一月是___。', answer: '秋天', options: ['春天', '夏天', '秋天', '冬天'], hint: 'De septembre à novembre.',
      explanation_fr: '秋天 (automne) correspond à la période de septembre à novembre. C\'est aussi décrite comme « 北京最好的季节 » (la meilleure saison de Pékin).',
      explanation_en: '秋天 (autumn) corresponds to September through November. It\'s also described as "北京最好的季节" (Beijing\'s best season).' },
    { sentence: '从十二月到二月是___。', answer: '冬天', options: ['春天', '夏天', '秋天', '冬天'], hint: 'De décembre à février.',
      explanation_fr: '冬天 (hiver) correspond à la période de décembre à février. Le texte dit que Pékin en hiver est très froid, avec de la neige et des températures en dessous de zéro.',
      explanation_en: '冬天 (winter) corresponds to December through February. The text says Beijing in winter is very cold, with snow and temperatures below zero.' },
  ];
  for (const q of pick(seasonFills, 3)) {
    round1.push({ type: 'fill-mcq', sentence: q.sentence, correct: q.answer, options: shuffle(q.options), hint: q.hint, explanation_fr: q.explanation_fr, explanation_en: q.explanation_en });
  }

  // 1d. Reading comprehension — true/false
  const readingTF = [
    { statement: '秋天是北京最好的季节。', answer: true, explanation: '课文原文：秋天是北京最好的季节。' },
    { statement: '夏天去北京，天气不太热。', answer: false, explanation: '课文说夏天天气会很热，气温常常在三十度以上。' },
    { statement: '北京的冬天常常下雨。', answer: false, explanation: '课文说冬天不下雨，可是会下雪。' },
    { statement: '春天是去北京旅游最好的季节。', answer: false, explanation: '课文说春天最好不要到北京旅游，风很大，天气不太好。' },
    { statement: '冬天去北京要带帽子和围巾。', answer: true, explanation: '课文说冬天去要带大衣、毛衣、帽子和围巾。' },
    { statement: '北京冬天气温常常在零下。', answer: true, explanation: '课文原文：气温常常在零下。' },
    { statement: '秋天的北京不冷也不热。', answer: true, explanation: '课文原文：不冷也不热，不刮风也不下雨。' },
    { statement: '夏天去北京不需要带雨伞。', answer: false, explanation: '课文说夏天要带雨伞，因为常常下雨。' },
  ];
  for (const q of pick(readingTF, 4)) {
    round1.push({ type: 'true-false', statement: q.statement, correct: q.answer, explanation: q.explanation });
  }

  // === ROUND 2: RENFORCEMENT ===

  // 2a. Weather phenomenon fill-in
  const weatherFills = [
    { sentence: '夏天常常___，要带雨伞。', answer: '下雨', options: ['下雨', '下雪', '刮风', '晴天'], hint: 'Il pleut souvent en été.',
      explanation_fr: '下雨 signifie « pleuvoir » (下 tomber + 雨 pluie). Le texte dit que l\'été à Pékin « 常常阴天下雨 » (il fait souvent couvert et il pleut). C\'est pour cela qu\'il faut apporter un parapluie.',
      explanation_en: '下雨 means "to rain" (下 to fall + 雨 rain). The text says Beijing summers are "常常阴天下雨" (often overcast and rainy). That\'s why you need to bring an umbrella.' },
    { sentence: '冬天很冷，常常___。', answer: '下雪', options: ['下雨', '下雪', '刮风', '晴天'], hint: 'Il neige souvent en hiver.',
      explanation_fr: '下雪 signifie « neiger » (下 tomber + 雪 neige). Le texte dit que l\'hiver à Pékin « 会下雪 » (il va neiger). 下雨 (pleuvoir) est explicitement nié : « 不下雨 ».',
      explanation_en: '下雪 means "to snow" (下 to fall + 雪 snow). The text says Beijing winters "会下雪" (it will snow). 下雨 (rain) is explicitly negated: "不下雨."' },
    { sentence: '春天___很大。', answer: '风', options: ['风', '雨', '雪', '气温'], hint: 'Le vent est fort au printemps.',
      explanation_fr: '风 signifie « vent ». Le texte dit que le printemps à Pékin « 风很大 » (le vent est très fort). 雨 (pluie) et 雪 (neige) ne conviennent pas car on ne dit pas « 雨很大 » dans ce contexte.',
      explanation_en: '风 means "wind." The text says Beijing in spring has "风很大" (very strong wind). 雨 (rain) and 雪 (snow) don\'t fit because we don\'t say "雨很大" in this context.' },
    { sentence: '秋天常常是___，天气很好。', answer: '晴天', options: ['晴天', '阴天', '下雨', '刮风'], hint: 'Il fait souvent beau en automne.',
      explanation_fr: '晴天 signifie « beau temps, ciel clair » (晴 clair + 天 ciel). Le texte dit que l\'automne à Pékin « 常常是晴天 ». 阴天 (couvert) est le contraire : un ciel gris.',
      explanation_en: '晴天 means "clear/sunny day" (晴 clear + 天 sky). The text says Beijing in autumn is "常常是晴天." 阴天 (overcast) is the opposite: a gray sky.' },
    { sentence: '夏天常常___下雨。', answer: '阴天', options: ['阴天', '晴天', '暖和', '下雪'], hint: 'Il fait souvent couvert et il pleut en été.',
      explanation_fr: '阴天 signifie « temps couvert, ciel gris ». Le texte dit « 常常阴天下雨 » — ici 阴天 et 下雨 sont juxtaposés pour décrire le temps d\'été. 晴天 (beau temps) est le contraire.',
      explanation_en: '阴天 means "overcast, gray sky." The text says "常常阴天下雨" — here 阴天 and 下雨 are juxtaposed to describe summer weather. 晴天 (sunny) is the opposite.' },
  ];
  for (const q of pick(weatherFills, 4)) {
    round2.push({ type: 'fill-mcq', sentence: q.sentence, correct: q.answer, options: shuffle(q.options), hint: q.hint, explanation_fr: q.explanation_fr, explanation_en: q.explanation_en });
  }

  // 2b. Grammar fill-in: 如果/就/要/最/会
  const grammarFills = [
    { sentence: '___你想到北京旅游，最好秋天去。', answer: '如果', options: ['如果', '因为', '可是', '所以'], hint: 'Si tu veux voyager à Pékin...',
      explanation_fr: '如果 introduit une condition (« si »). La structure est : 如果 + condition, conséquence. 因为 (parce que) introduit une cause, 可是 (mais) une opposition, 所以 (donc) une conséquence — aucun ne convient pour introduire une hypothèse.',
      explanation_en: '如果 introduces a condition ("if"). The structure is: 如果 + condition, consequence. 因为 (because) introduces a cause, 可是 (but) an opposition, 所以 (therefore) a consequence — none fit for introducing a hypothesis.' },
    { sentence: '怕冷___不要冬天去北京。', answer: '就', options: ['就', '还', '也', '都'], hint: 'Alors ne va pas à Pékin en hiver.',
      explanation_fr: '就 introduit la conséquence logique après une condition implicite : « (如果) 怕冷，就不要去 ». 就 signifie « alors » ici. 还 (encore), 也 (aussi) et 都 (tout) ne marquent pas une conséquence conditionnelle.',
      explanation_en: '就 introduces the logical consequence after an implicit condition: "(如果) 怕冷，就不要去." 就 means "then" here. 还 (still), 也 (also), and 都 (all) don\'t mark a conditional consequence.' },
    { sentence: '夏天去北京，天气___很热。', answer: '会', options: ['会', '能', '要', '想'], hint: 'Il va faire très chaud.',
      explanation_fr: '会 exprime la probabilité future : « il va / il est probable que ». Ici, ce n\'est pas le 会 de savoir-faire. 能 (pouvoir physique), 要 (obligation), 想 (envie) ne correspondent pas à une prédiction météo.',
      explanation_en: '会 expresses future probability: "will / is going to." Here it\'s not the 会 of ability. 能 (physical ability), 要 (obligation), 想 (desire) don\'t fit for a weather prediction.' },
    { sentence: '秋天是北京___好的季节。', answer: '最', options: ['最', '很', '太', '真'], hint: 'La meilleure saison.',
      explanation_fr: '最 forme le superlatif : 最好 = « le/la meilleur(e) ». 很好 (très bien), 太好 (trop bien) et 真好 (vraiment bien) expriment un degré mais pas le superlatif.',
      explanation_en: '最 forms the superlative: 最好 = "the best." 很好 (very good), 太好 (too good), and 真好 (really good) express degree but not the superlative.' },
    { sentence: '夏天去北京旅游，___带雨伞。', answer: '要', options: ['要', '会', '能', '想'], hint: 'Il faut apporter un parapluie.',
      explanation_fr: '要 exprime l\'obligation ou la nécessité : « il faut ». Le texte donne un conseil pratique : 要带短裤、T恤、雨衣雨伞. 会 (probabilité), 能 (capacité) et 想 (envie) ne conviennent pas pour un conseil.',
      explanation_en: '要 expresses obligation or necessity: "must, need to." The text gives practical advice: 要带短裤、T恤、雨衣雨伞. 会 (probability), 能 (ability), and 想 (desire) don\'t fit for advice.' },
    { sentence: '春天还___冷。', answer: '有点儿', options: ['有点儿', '一点儿', '很', '不'], hint: 'Un peu froid (connotation négative).',
      explanation_fr: '有点儿 + adjectif exprime « un peu » avec une connotation négative/insatisfaisante. 一点儿 ne se place pas devant l\'adjectif (on dit 冷一点儿, pas 一点儿冷). 很 (très) est trop fort, 不 (pas) contredit le sens.',
      explanation_en: '有点儿 + adjective means "a bit" with a negative/unsatisfactory connotation. 一点儿 doesn\'t go before the adjective (we say 冷一点儿, not 一点儿冷). 很 (very) is too strong, 不 (not) contradicts the meaning.' },
  ];
  for (const q of pick(grammarFills, 4)) {
    round2.push({ type: 'fill-mcq', sentence: q.sentence, correct: q.answer, options: shuffle(q.options), hint: q.hint, explanation_fr: q.explanation_fr, explanation_en: q.explanation_en });
  }

  // 2c. Error correction
  const errorCorrections = [
    { wrong: '秋天是北京好最的季节。', correct: '秋天是北京最好的季节。',
      explanation_fr: '最 se place toujours devant l\'adjectif, pas après. L\'ordre est : 最 + Adj + 的 + Nom. Ici : 最好的季节 = la meilleure saison. *好最 n\'existe pas en chinois.',
      explanation_en: '最 always goes before the adjective, not after. The order is: 最 + Adj + 的 + Noun. Here: 最好的季节 = the best season. *好最 doesn\'t exist in Chinese.' },
    { wrong: '如果你冬天去，就要带了大衣。', correct: '如果你冬天去，就要带大衣。',
      explanation_fr: '了 est inutile ici. Avec 要 + V (obligation/conseil), le verbe reste à l\'infinitif. 了 marquerait une action déjà accomplie, ce qui contredit le sens d\'un conseil futur.',
      explanation_en: '了 is unnecessary here. With 要 + V (obligation/advice), the verb stays uninflected. 了 would mark an already completed action, which contradicts the meaning of future advice.' },
    { wrong: '天气会热很。', correct: '天气会很热。',
      explanation_fr: 'L\'adverbe de degré 很 se place avant l\'adjectif, pas après. L\'ordre est : 会 + 很 + Adj. Ici : 会很热 = il fera très chaud. En chinois, le modificateur précède toujours le modifié.',
      explanation_en: 'The degree adverb 很 goes before the adjective, not after. The order is: 会 + 很 + Adj. Here: 会很热 = it will be very hot. In Chinese, the modifier always precedes what it modifies.' },
    { wrong: '北京的冬天冷很。', correct: '北京的冬天很冷。',
      explanation_fr: 'Même règle : 很 (très) précède toujours l\'adjectif. 很冷 = très froid. *冷很 n\'existe pas. L\'ordre est fixe : adverbe de degré + adjectif.',
      explanation_en: 'Same rule: 很 (very) always precedes the adjective. 很冷 = very cold. *冷很 doesn\'t exist. The order is fixed: degree adverb + adjective.' },
    { wrong: '我有点儿喜欢春天。', correct: '我有点儿不喜欢春天。',
      explanation_fr: '有点儿 s\'utilise uniquement avec des qualités négatives ou indésirables. On ne dit pas 有点儿喜欢 (un peu aimer — positif), mais 有点儿不喜欢 (un peu ne pas aimer) ou 有点儿冷 (un peu froid — négatif). Pour du positif, on utilise 一点儿 : 喜欢一点儿.',
      explanation_en: '有点儿 is only used with negative or undesirable qualities. We don\'t say 有点儿喜欢 (a bit like — positive), but 有点儿不喜欢 (a bit don\'t like) or 有点儿冷 (a bit cold — negative). For positive, use 一点儿: 喜欢一点儿.' },
    { wrong: '从三月从五月是春天。', correct: '从三月到五月是春天。',
      explanation_fr: 'La structure est 从 A 到 B (de A à B). Le deuxième marqueur doit être 到 (jusqu\'à), pas un deuxième 从. 从 marque le point de départ, 到 le point d\'arrivée.',
      explanation_en: 'The structure is 从 A 到 B (from A to B). The second marker must be 到 (to/until), not a second 从. 从 marks the starting point, 到 the ending point.' },
  ];
  for (const q of pick(errorCorrections, 4)) {
    round2.push({ type: 'error-correction', wrong: q.wrong, correct: q.correct, explanation_fr: q.explanation_fr, explanation_en: q.explanation_en });
  }

  // === ROUND 3: DÉFI ===

  // 3a. FR → ZH translation
  const translations = [
    { fr: 'Si tu veux aller à Pékin, le mieux est d\'y aller en automne.', zh: '如果你想到北京旅游，最好秋天去。', pattern: '如果...最好...',
      explanation_fr: 'Structure 如果 + condition + 最好 + conseil. 如果 = si ; 想 = vouloir ; 到北京旅游 = voyager à Pékin ; 最好 = le mieux (superlatif de 好) ; 秋天去 = y aller en automne.',
      explanation_en: 'Structure 如果 + condition + 最好 + advice. 如果 = if; 想 = to want; 到北京旅游 = travel to Beijing; 最好 = the best (superlative of 好); 秋天去 = go in autumn.' },
    { fr: 'La température est souvent au-dessus de 30 degrés.', zh: '气温常常在三十度以上。', pattern: 'N + 以上',
      explanation_fr: '气温 = température ; 常常 = souvent ; 在 = se trouver ; 三十度以上 = au-dessus de 30 degrés. Le nombre + 以上 se place après l\'unité : 度 (degrés) + 以上 (au-dessus de).',
      explanation_en: '气温 = temperature; 常常 = often; 在 = to be at; 三十度以上 = above 30 degrees. Number + 以上 comes after the unit: 度 (degrees) + 以上 (above).' },
    { fr: 'En hiver, il faut apporter un manteau et une écharpe.', zh: '冬天要带大衣和围巾。', pattern: '要 + V',
      explanation_fr: '冬天 = en hiver (le temps est en tête de phrase) ; 要 = il faut ; 带 = apporter ; 大衣 = manteau ; 和 = et ; 围巾 = écharpe. La structure est : Temps + 要 + V + objet.',
      explanation_en: '冬天 = in winter (time goes at the start); 要 = must; 带 = to bring; 大衣 = coat; 和 = and; 围巾 = scarf. The structure is: Time + 要 + V + object.' },
    { fr: 'Il ne fait ni froid ni chaud.', zh: '不冷也不热。', pattern: '不 A 也不 B',
      explanation_fr: 'Double négation : 不 + Adj₁ + 也 + 不 + Adj₂. 不冷 = pas froid, 也不热 = ni chaud non plus. 也 lie les deux négations. L\'ordre est fixe.',
      explanation_en: 'Double negation: 不 + Adj₁ + 也 + 不 + Adj₂. 不冷 = not cold, 也不热 = not hot either. 也 links the two negations. The order is fixed.' },
    { fr: 'Le temps va être très chaud.', zh: '天气会很热。', pattern: '会 + V/Adj',
      explanation_fr: '会 exprime une prédiction : « va / il est probable que ». 天气 = le temps (météo) ; 会 = va ; 很 = très ; 热 = chaud. Structure : S + 会 + (很) + Adj.',
      explanation_en: '会 expresses a prediction: "will / is going to." 天气 = the weather; 会 = will; 很 = very; 热 = hot. Structure: S + 会 + (很) + Adj.' },
  ];
  for (const q of pick(translations, 3)) {
    round3.push({ type: 'translate', fr: q.fr, zh: q.zh, pattern: q.pattern, explanation_fr: q.explanation_fr, explanation_en: q.explanation_en });
  }

  // 3b. Reading MCQ
  const readingMCQ = [
    { question: '北京最好的季节是什么？', correct: '秋天', options: shuffle(['春天', '夏天', '秋天', '冬天']) },
    { question: '夏天去北京要带什么？', correct: '雨伞', options: shuffle(['雨伞', '围巾', '帽子', '大衣']) },
    { question: '北京的冬天气温怎么样？', correct: '常常在零下', options: shuffle(['常常在零下', '三十度以上', '很暖和', '不太冷']) },
    { question: '为什么春天最好不去北京？', correct: '风很大，有点儿冷', options: shuffle(['风很大，有点儿冷', '太热了', '常常下雪', '没有晴天']) },
  ];
  for (const q of pick(readingMCQ, 3)) {
    round3.push({ type: 'reading-mcq', question: q.question, correct: q.correct, options: q.options });
  }

  // 3c. Clothing match: which season needs these items?
  const clothingMatch = [
    { prompt: '短裤、T恤、雨衣、雨伞 — 哪个季节？', correct: '夏天', options: shuffle(['春天', '夏天', '秋天', '冬天']),
      explanation_fr: 'Le texte dit : « 如果你夏天去北京旅游，要带短裤、T恤、雨衣雨伞 ». Ces vêtements légers et de pluie correspondent à l\'été chaud et pluvieux.',
      explanation_en: 'The text says: "如果你夏天去北京旅游，要带短裤、T恤、雨衣雨伞." These light clothing and rain gear correspond to the hot and rainy summer.' },
    { prompt: '大衣、毛衣、帽子、围巾 — 哪个季节？', correct: '冬天', options: shuffle(['春天', '夏天', '秋天', '冬天']),
      explanation_fr: 'Le texte dit : « 如果你冬天去，就要带大衣、毛衣、帽子和围巾 ». Ces vêtements chauds correspondent à l\'hiver froid avec des températures en dessous de zéro.',
      explanation_en: 'The text says: "如果你冬天去，就要带大衣、毛衣、帽子和围巾." These warm clothes correspond to the cold winter with temperatures below zero.' },
  ];
  for (const q of clothingMatch) {
    round3.push({ type: 'grammar-mcq', prompt: q.prompt, correct: q.correct, options: q.options, pattern: '季节与服装', explanation_fr: q.explanation_fr, explanation_en: q.explanation_en });
  }

  // 3d. Grammar MCQ
  const grammarMCQ = [
    { prompt: '哪个句子正确使用了「如果...就...」？', correct: '如果你怕冷，就不要冬天去。', pattern: '如果...就...',
      options: shuffle(['如果你怕冷，就不要冬天去。', '你怕冷如果，就不要冬天去。', '如果你怕冷，不要就冬天去。', '就你怕冷，如果不要冬天去。']),
      explanation_fr: '如果 (si) se place en tête de la proposition de condition, 就 (alors) en tête de la conséquence. L\'ordre est fixe : 如果 + condition，就 + conséquence. On ne peut pas mettre 如果 après le sujet ni 就 après le verbe.',
      explanation_en: '如果 (if) goes at the start of the condition clause, 就 (then) at the start of the consequence. The order is fixed: 如果 + condition, 就 + consequence. You can\'t put 如果 after the subject or 就 after the verb.' },
    { prompt: '哪个句子正确使用了「最」？', correct: '秋天是北京最好的季节。', pattern: '最 + Adj',
      options: shuffle(['秋天是北京最好的季节。', '秋天是北京好最的季节。', '秋天是北京的最好季节。', '秋天是最北京好的季节。']),
      explanation_fr: '最 se place directement devant l\'adjectif : 最好 = le meilleur. Puis on ajoute 的 avant le nom : 最好的季节. *好最 ou *的最好 sont incorrects. L\'ordre est toujours 最 + Adj + 的 + Nom.',
      explanation_en: '最 goes directly before the adjective: 最好 = the best. Then 的 before the noun: 最好的季节. *好最 or *的最好 are incorrect. The order is always 最 + Adj + 的 + Noun.' },
    { prompt: '哪个句子正确使用了「有点儿」？', correct: '春天有点儿冷。', pattern: '有点儿 + Adj',
      options: shuffle(['春天有点儿冷。', '春天冷有点儿。', '有点儿春天冷。', '春天有点儿好。']),
      explanation_fr: '有点儿 se place devant l\'adjectif (négatif) : 有点儿冷 = un peu froid. *冷有点儿 est incorrect (有点儿 ne suit pas l\'adjectif). 有点儿好 est incorrect car 好 est positif — 有点儿 s\'emploie pour des qualités négatives.',
      explanation_en: '有点儿 goes before the (negative) adjective: 有点儿冷 = a bit cold. *冷有点儿 is wrong (有点儿 doesn\'t follow the adjective). 有点儿好 is wrong because 好 is positive — 有点儿 is used for negative qualities.' },
    { prompt: '哪个句子正确使用了「会」表示推测？', correct: '明天会下雨。', pattern: '会 + V (probabilité)',
      options: shuffle(['明天会下雨。', '明天下雨会。', '会明天下雨。', '明天下会雨。']),
      explanation_fr: '会 (probabilité) se place avant le verbe : 会下雨 = il va pleuvoir. L\'ordre est : Temps + 会 + V. 会 ne peut pas se mettre en fin de phrase ni séparer le verbe et son objet.',
      explanation_en: '会 (probability) goes before the verb: 会下雨 = it will rain. The order is: Time + 会 + V. 会 can\'t go at the end of the sentence or split the verb and its object.' },
  ];
  for (const q of pick(grammarMCQ, 3)) {
    round3.push({ type: 'grammar-mcq', ...q });
  }

  // 3e. Order exercises
  const orderItems = [
    { fr: 'Si tu veux aller à Pékin, le mieux est d\'y aller en automne.', chunks: shuffle(['如果', '你', '想到', '北京', '旅游', '最好', '秋天', '去']), answer: '如果你想到北京旅游最好秋天去',
      explanation_fr: 'Ordre : 如果 (si) + 你 (tu) + 想到 (vouloir aller à) + 北京 (Pékin) + 旅游 (voyager) = condition ; 最好 (le mieux) + 秋天 (en automne) + 去 (aller) = conseil.',
      explanation_en: 'Order: 如果 (if) + 你 (you) + 想到 (want to go to) + 北京 (Beijing) + 旅游 (travel) = condition; 最好 (best) + 秋天 (in autumn) + 去 (go) = advice.' },
    { fr: 'La température est souvent au-dessus de 30 degrés.', chunks: shuffle(['气温', '常常', '在', '三十度', '以上']), answer: '气温常常在三十度以上',
      explanation_fr: 'Ordre : 气温 (température) + 常常 (souvent) + 在 (se trouver) + 三十度 (30 degrés) + 以上 (au-dessus de). L\'adverbe 常常 se place avant le verbe 在.',
      explanation_en: 'Order: 气温 (temperature) + 常常 (often) + 在 (to be at) + 三十度 (30 degrees) + 以上 (above). The adverb 常常 goes before the verb 在.' },
    { fr: 'En hiver il faut apporter un manteau et une écharpe.', chunks: shuffle(['冬天', '要', '带', '大衣', '和', '围巾']), answer: '冬天要带大衣和围巾',
      explanation_fr: 'Ordre : 冬天 (en hiver, temps en tête) + 要 (il faut) + 带 (apporter) + 大衣 (manteau) + 和 (et) + 围巾 (écharpe). Le temps se place toujours en début de phrase.',
      explanation_en: 'Order: 冬天 (in winter, time first) + 要 (must) + 带 (bring) + 大衣 (coat) + 和 (and) + 围巾 (scarf). Time always goes at the start of the sentence.' },
  ];
  for (const q of pick(orderItems, 2)) {
    round3.push({ type: 'order', fr: q.fr, chunks: q.chunks, answer: q.answer, explanation_fr: q.explanation_fr, explanation_en: q.explanation_en });
  }

  return {
    rounds: [
      { title: 'Évaluation', subtitle: 'Testez vos acquis', exercises: shuffle(round1) },
      { title: 'Renforcement', subtitle: 'Météo et grammaire', exercises: shuffle(round2) },
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
    case 'grammar-mcq': return <GrammarMCQ ex={exercise} state={state} onAnswer={onAnswer} />;
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
        <Feedback correct={state === 'correct'} answer={ex.correct ? 'Vrai' : 'Faux'} extra={ex.explanation} explanation_fr={ex.explanation_fr} explanation_en={ex.explanation_en} />
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
        <Feedback correct={state === 'correct'} answer={ex.correct} explanation_fr={ex.explanation_fr} explanation_en={ex.explanation_en} />
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
        <Feedback correct={state === 'correct'} answer={ex.correct} explanation_fr={ex.explanation_fr || ex.rule} explanation_en={ex.explanation_en} />
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
        <Feedback correct={state === 'correct'} answer={ex.zh} extra={ex.pattern} explanation_fr={ex.explanation_fr} explanation_en={ex.explanation_en} />
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
        <Feedback correct={state === 'correct'} answer={ex.correct} explanation_fr={ex.explanation_fr} explanation_en={ex.explanation_en} />
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
        <Feedback correct={state === 'correct'} answer={`一${ex.correct}${ex.noun}`} explanation_fr={ex.explanation_fr} explanation_en={ex.explanation_en} />
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
        <Feedback correct={state === 'correct'} answer={ex.answer} explanation_fr={ex.explanation_fr} explanation_en={ex.explanation_en} />
      )}
    </div>
  );
}

function GrammarMCQ({ ex, state, onAnswer }) {
  const handlePick = (opt) => { if (state !== 'answering') return; onAnswer(opt === ex.correct); };
  return (
    <div className="text-center">
      <p className="text-xs text-muted mb-1 uppercase tracking-wider">Grammaire — {ex.pattern}</p>
      <p className="text-base font-medium mb-6">{ex.prompt}</p>
      {state === 'answering' ? (
        <div className="space-y-2">
          {ex.options.map((opt, i) => (
            <button key={i} onClick={() => handlePick(opt)}
              className="w-full text-left px-4 py-3 rounded-xl border border-border bg-surface-alt hover:border-accent/50 hover:bg-accent/5 transition-colors text-base hanzi-display">
              {opt}
            </button>
          ))}
        </div>
      ) : (
        <div className="space-y-2 mb-2">
          {ex.options.map((opt, i) => (
            <div key={i} className={`w-full text-left px-4 py-3 rounded-xl border text-base hanzi-display ${
              opt === ex.correct ? 'bg-success/10 border-success text-success font-medium' : 'bg-surface-alt border-border text-muted opacity-50'
            }`}>{opt}</div>
          ))}
        </div>
      )}
      {state !== 'answering' && (
        <Feedback correct={state === 'correct'} answer={ex.correct} explanation_fr={ex.explanation_fr} explanation_en={ex.explanation_en} />
      )}
    </div>
  );
}

function Feedback({ correct, answer, extra, explanation_fr, explanation_en }) {
  return (
    <div className={`rounded-xl p-4 mt-4 ${correct ? 'bg-success/10' : 'bg-primary/10'}`}>
      <p className={`font-medium mb-1 ${correct ? 'text-success' : 'text-primary'}`}>
        {correct ? 'Correct !' : 'Incorrect'}
      </p>
      <p className="text-lg hanzi-display font-medium">{answer}</p>
      {extra && <p className="text-sm text-muted mt-1">{extra}</p>}
      {(explanation_fr || explanation_en) && (
        <div className="mt-3 pt-3 border-t border-border/50 space-y-2 text-left">
          {explanation_fr && (
            <div>
              <p className="text-xs font-semibold text-accent uppercase tracking-wider mb-0.5">Explication</p>
              <p className="text-sm text-muted leading-relaxed">{explanation_fr}</p>
            </div>
          )}
          {explanation_en && (
            <div>
              <p className="text-xs font-semibold text-accent uppercase tracking-wider mb-0.5">Explanation</p>
              <p className="text-sm text-muted/70 leading-relaxed italic">{explanation_en}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

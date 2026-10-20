// Real papers handed out in class, rebuilt as interactive exercises with an answer key.
import { HANZI } from './examPrep.js';

const order = (fr, chunks, answer, alts, efr) => ({
  type: 'order', hideFr: true, fr, chunks, answer, alts, explanation_fr: efr,
});

const inContext = (char, context, pinyin, efr) => ({
  type: 'hanzi-write', ...HANZI.find(h => h.char === char), context, contextPinyin: pinyin, explanation_fr: efr,
});

const rewrite = (label, prompt, answer, alts, efr) => ({
  type: 'translate', label, fr: prompt, zh: answer, alts, explanation_fr: efr,
});

const fix = (wrong, correct, alts, efr, een) => ({ type: 'error-correction', wrong, correct, alts, explanation_fr: efr, explanation_en: een });

const bank = (label, instruction, items, extra = []) => ({
  type: 'dnd-fill', label, instruction, items, bank: [...items.map(i => i.answer), ...extra],
});

// ---------- 期中考试 — 14 octobre 2026 ----------

export const MIDTERM = {
  id: 'midterm-2026-10-14',
  title: '中文课期中考试',
  kicker: 'Examen de mi-semestre — 14 octobre 2026',
  intro: 'Le sujet réel du 14 octobre, à refaire en conditions d\'examen, puis le corrigé.',
  parts: [
    { title: '1 — 完成句子', subtitle: 'Remettez les mots dans le bon ordre', points: 5, exercises: [
      order('Demain, nous irons ensemble au magasin.', ['明天', '一起', '我们', '去', '商店'], '我们明天一起去商店', ['明天我们一起去商店'],
        'Temps (明天) avant le verbe, avant ou après le sujet ; 一起 juste devant le verbe.'),
      order('Je trouve ce cours très intéressant.', ['觉得', '很', '这门课', '有意思', '我'], '我觉得这门课很有意思', [],
        '我觉得 + proposition (这门课 + 很 + 有意思). 门 : classificateur des matières.'),
      order('Hier, j\'ai téléphoné à un ami.', ['昨天', '朋友', '了', '我', '给', '打电话'], '我昨天给朋友打电话了', ['昨天我给朋友打电话了'],
        '给 + personne + 打电话 ; 了 en fin de phrase (fait accompli).'),
      order('Il étudie le chinois deux heures par jour.', ['每天', '小时', '两个', '学习', '汉语', '他'], '他每天学习两个小时汉语', ['每天他学习两个小时汉语'],
        'La durée (两个小时) se place entre le verbe et l\'objet.'),
      order('Nous sommes en train de faire nos devoirs.', ['呢', '我们', '写作业', '正在'], '我们正在写作业呢', [],
        'S + 正在 + V + O + 呢.'),
    ] },
    { title: '2 — 用汉字填空', subtitle: 'Écrivez les caractères chinois', points: 5, exercises: [
      inContext('分', '你带钱了吗？我还差3角5___。', 'fēn', '3角5分 : 角 (dixième de yuan) puis 分 (centième).'),
      inContext('号', '4月7___是我的生日，中午你们来我家吃饭吧。', 'hào', 'Date : 月 + 号.'),
      inContext('岁', '妹妹长大了，她明年就八___了。', 'suì', 'Âge : nombre + 岁 ; 就…了 = déjà.'),
      inContext('半', '我们___个小时以后在火车站见面。', 'bàn', '半个小时 = une demi-heure.'),
      inContext('年', '她是我一___级时候的老师，她教得很好，大家都很喜欢她。', 'nián', '一年级 = première année.'),
    ] },
    { title: '3 — 选词填空', subtitle: '比较 开始 旁边 有名 练习', points: 5, exercises: [
      bank('选词填空', 'Chaque mot une fois.', [
        { sentence: '明天早上考试，请大家八点以前到，考试八点半___。', answer: '开始', explanation_fr: 'L\'examen commence (开始) à 8 h 30.' },
        { sentence: '王老师___喜欢喝茶，下午常常喝一杯茶。', answer: '比较', explanation_fr: '比较 + V : « assez, plutôt ».' },
        { sentence: '这个地方很___，每年有很多外国人来旅游。', answer: '有名', explanation_fr: 'Beaucoup de touristes → célèbre (有名).' },
        { sentence: '我每天晚上都___说汉语，所以现在说得越来越好了。', answer: '练习', explanation_fr: '练习 + V : s\'entraîner à.' },
        { sentence: '银行就在超市的___，走过去只要两分钟。', answer: '旁边', explanation_fr: 'Lieu + 的 + 旁边 = à côté de.' },
      ]),
    ] },
    { title: '4 — 用下面的词填空', subtitle: '虽然…但是，要是…就，节，过，了，快要，正在，段，再，每…都', points: 5, exercises: [
      bank('用下面的词填空', 'Chaque mot une fois. « … » marque la deuxième partie d\'une structure en deux temps.', [
        { sentence: '别给我打电话，我___开车呢。', answer: '正在', explanation_fr: '正在…呢 : action en cours.' },
        { sentence: '___你明天有时间，我们…一起去游泳。', answer: '要是…就', explanation_fr: '要是你明天有时间，我们就一起去游泳。' },
        { sentence: '火车___到巴黎站了，请大家拿好自己的东西准备下车。', answer: '快要', explanation_fr: '快要…了 : imminent.' },
        { sentence: '我今天上了四___课，现在觉得非常累。', answer: '节', explanation_fr: '节 : classificateur des séances de cours.' },
        { sentence: '这___路很难走，你要小心一点。', answer: '段', explanation_fr: '段 : un tronçon (de route), une période.' },
        { sentence: '___这个菜很辣，…非常好吃。', answer: '虽然…但是', explanation_fr: '虽然这个菜很辣，但是非常好吃。' },
        { sentence: '我没见___这个人。', answer: '过', explanation_fr: '没 + V + 过 : jamais.' },
        { sentence: '我买___飞机票就去你家。', answer: '了', explanation_fr: 'V₁ + 了 + O + 就 + V₂.' },
        { sentence: '请你___说一遍。', answer: '再', explanation_fr: '再说一遍 : répéter.' },
        { sentence: '我和妹妹___个星期六…去公园跑步。', answer: '每…都', explanation_fr: '我和妹妹每个星期六都去公园跑步。' },
      ]),
    ] },
  ],
};

// ---------- 中文作业 2 ----------

export const HOMEWORK2 = {
  id: 'devoir-2',
  title: '中文作业 2',
  kicker: 'Devoir 2 — distribué le 14 octobre',
  intro: 'Les exercices du devoir, à faire ici puis à comparer avec le corrigé. Date de rendu : à confirmer en cours.',
  parts: [
    { title: '1 — Quel habit dois-je prendre ?', subtitle: 'Reliez les deux colonnes', points: 2.5, exercises: [
      bank('Quel habit ?', 'Glissez la bonne tenue.', [
        { sentence: '今天下雪，___', answer: '我穿两件毛衣，戴帽子、围巾和手套', explanation_fr: 'Neige → pulls, bonnet, écharpe, gants (戴 pour les accessoires).' },
        { sentence: '今天下雨，___', answer: '我穿雨衣', explanation_fr: 'Pluie → imperméable.' },
        { sentence: '我去游泳，___', answer: '我穿游泳衣', explanation_fr: 'Natation → maillot de bain.' },
        { sentence: '我去海边晒太阳，___', answer: '我穿游泳衣', accept: ['我穿短裤和T恤'], explanation_fr: 'Bronzer à la plage → maillot de bain (le sujet en propose deux).' },
        { sentence: '我去打网球，___', answer: '我穿短裤和T恤', explanation_fr: 'Tennis → short et T-shirt.' },
        { sentence: '今天气温十四度，___', answer: '我穿牛仔裤和外衣', explanation_fr: '14 °C → jean et veste.' },
        { sentence: '今晚学校有晚会，___', answer: '我穿漂亮的裙子', explanation_fr: 'Soirée → jolie robe.' },
      ]),
    ] },
    { title: '2 — Une seule proposition avec 的', subtitle: 'Ex. : 你喜欢喝花茶，花茶在那儿 → 你喜欢喝的花茶在那儿。', points: 2, exercises: [
      rewrite('Une seule phrase avec 的', '我要地图，地图很贵', '我要的地图很贵。', [], 'La première proposition devient une relative devant 地图.'),
      rewrite('Une seule phrase avec 的', '你要看语法书，语法书在图书馆', '你要看的语法书在图书馆。', [], '你要看的 + 语法书.'),
      rewrite('Une seule phrase avec 的', '你喜欢喝红酒，他们没有红酒', '他们没有你喜欢喝的红酒。', ['你喜欢喝的红酒他们没有'], 'Relative 你喜欢喝的 devant 红酒, objet de 没有.'),
      rewrite('Une seule phrase avec 的', '你想去茶馆，茶馆在什么地方', '你想去的茶馆在什么地方？', [], '你想去的 + 茶馆.'),
    ] },
    { title: '3 — Reformulez avec 别', subtitle: 'Ex. : 你们不要在这儿唱歌 → 你们别在这儿唱歌。', points: 2.5, exercises: [
      rewrite('Reformulez avec 别', '吃饭以后不要马上游泳。', '吃饭以后别马上游泳。', [], '别 remplace 不要 à la même place.'),
      rewrite('Reformulez avec 别', '喝酒以后不要开车。', '喝酒以后别开车。', [], '别 = 不要.'),
      rewrite('Reformulez avec 别', '你不要在他家说日语。', '你别在他家说日语。', [], '别 juste après le sujet.'),
      rewrite('Reformulez avec 别', '你早上九点以前不要给他打电话。', '你早上九点以前别给他打电话。', ['早上九点以前你别给他打电话'], '别 devant 给他打电话.'),
      rewrite('Reformulez avec 别', '我看书的时候，你不要听音乐。', '我看书的时候，你别听音乐。', [], '别 + 听音乐.'),
    ] },
    { title: '4 — Mettez les mots dans l\'ordre', subtitle: 'Formez une phrase correcte', points: 7, exercises: [
      order('Du vent fort d\'aujourd\'hui à demain.', ['今天', '到', '有大风', '从', '明天'], '从今天到明天有大风', [], '从 A 到 B + 有大风.'),
      order('Il pleut tous les jours cette semaine.', ['星期', '这个', '下雨', '天天'], '这个星期天天下雨', [], 'Temps (这个星期) + 天天 + V.'),
      order('Aujourd\'hui, de 18 à 24 degrés.', ['今天', '度', '气温', '二十四', '十八', '到'], '今天气温十八到二十四度', [], '气温 + 十八到二十四度.'),
      order('L\'été, il fait environ 25 degrés.', ['二十五', '夏天', '度', '有', '左右'], '夏天有二十五度左右', [], 'Nombre + 度 + 左右.'),
      order('L\'été, il va bronzer à la plage avec ses parents.', ['去', '他', '夏天', '海边', '和', '爸爸', '晒', '妈妈', '太阳'], '夏天他和爸爸妈妈去海边晒太阳', ['他夏天和爸爸妈妈去海边晒太阳'], 'Temps + S + 和… + 去 + lieu + but.'),
      order('L\'automne est la meilleure saison à Pékin.', ['季节', '最', '秋天', '好', '北京', '是', '的'], '秋天是北京最好的季节', ['北京最好的季节是秋天'], '最 + Adj + 的 + N.'),
      order('En hiver, il neige.', ['下', '冬天', '雪', '会'], '冬天会下雪', [], 'Temps + 会 + V.'),
    ] },
    { title: '5 — Placez chaque mot', subtitle: '帮，应该，得 (děi)，再，别的', points: 3.5, exercises: [
      bank('Placez chaque mot', 'Chaque mot une fois.', [
        { sentence: '请你___说一遍。', answer: '再', explanation_fr: '再说一遍 = répéter.' },
        { sentence: '我买花茶，___都不要。', answer: '别的', explanation_fr: '别的都不要 = rien d\'autre.' },
        { sentence: '你下午来___我练习汉语口语，好吗？', answer: '帮', explanation_fr: '帮 + qqn + V = aider qqn à.' },
        { sentence: '明天是她的生日，我们___送她什么呢？', answer: '应该', explanation_fr: '应该 = devoir (ce qui convient).' },
        { sentence: '星期天我没有时间，我___去看我妈妈。', answer: '得', explanation_fr: '得 děi = devoir (obligation).' },
      ]),
    ] },
    { title: '6 — Guérissez les phrases malades', subtitle: 'Réécrivez la phrase correcte', points: 2.5, exercises: [
      fix('我一点儿饿。', '我有点儿饿。', ['我有点饿'], 'Sentiment négatif → 有点儿 + Adj.', 'Negative feeling → 有点儿 + Adj.'),
      fix('我一天三次吃饭。', '我一天吃三次饭。', ['我一天吃饭吃三次', '我一天吃三顿饭'], 'Le nombre de fois suit le verbe : 吃三次饭.', 'The number of times follows the verb: 吃三次饭.'),
      fix('我说他：我明天来。', '我跟他说：我明天来。', ['我对他说：我明天来', '我跟他说我明天来'], 'Dire à qqn : 跟 / 对 + qqn + 说.', 'Tell someone: 跟 / 对 + someone + 说.'),
      fix('他问我开车到大学来。', '他请我开车到大学来。', ['他让我开车到大学来', '他问我是不是开车到大学来', '他问我开不开车到大学来'],
        '问 = poser une question : il faut une vraie question (是不是…, 开不开车…). Pour « demander de faire », on dit 请 / 让.', '问 = ask a question: it needs a real question (是不是…). To "ask someone to do", use 请 / 让.'),
      fix('小张在大学门口一定等她。', '小张一定在大学门口等她。', [], '一定 (adverbe) se place avant le complément de lieu 在….', '一定 (adverb) goes before the 在… phrase.'),
    ] },
  ],
};

export const PAPERS = { midterm: MIDTERM, devoir2: HOMEWORK2 };

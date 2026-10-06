import { useState, useCallback } from 'react';
import LessonExercises from './LessonExercises';
import Zh from './Zh';

const DUE_DATE = new Date(2026, 9, 6); // 6 octobre 2026

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ---------- Partie 1 : questions ouvertes ----------

const NOT_BU_GUO = { label: 'Pas de *不 + V + 过 (négation = 没)', re: '不[看去吃学]过', absent: true };

const OPEN_ORIGINAL = [
  { question: '你想去中国吗？', instruction_fr: 'Répondez par une phrase complète (+ une raison si possible).',
    checks: [{ label: 'Reprend 想去 (ou 不想去)', re: '想去' }, { label: 'Phrase complète avec sujet 我', re: '我' }],
    models: ['我很想去中国，因为我想练习汉语。', '我想去中国，我打算明年去北京旅游。', '我去过中国，还想再去。'],
    explanation_fr: 'Reprenez le verbe de la question : 想去中国. Pour enrichir : ajoutez 很, une raison (因为…) ou un projet (打算 + V).',
    explanation_en: 'Reuse the verb from the question: 想去中国. To enrich: add 很, a reason (因为…) or a plan (打算 + V).' },
  { question: '你看过中国电影吗？', instruction_fr: 'Utilisez V + 过 (ou 没 + V + 过).',
    checks: [{ label: 'Utilise 看过', re: '看过' }, NOT_BU_GUO],
    models: ['我看过两三个中国电影，都很有意思。', '我没看过中国电影，但是我很想看。', '我看过《英雄》，我觉得很好看。'],
    explanation_fr: 'Expérience vécue : 看过. Négation : 没看过 (jamais *不看过). Vous pouvez préciser combien : 看过两三个.',
    explanation_en: 'Past experience: 看过. Negation: 没看过 (never *不看过). You can say how many: 看过两三个.' },
  { question: '你最喜欢巴黎的什么地方？', instruction_fr: 'Nommez un lieu précis.',
    checks: [{ label: 'Reprend 最喜欢', re: '最喜欢' }, { label: 'Nomme un lieu (…的… ou 地方)', re: '的' }],
    models: ['我最喜欢巴黎的卢森堡公园。', '我最喜欢的地方是塞纳河边。', '我最喜欢巴黎的拉丁区，因为那儿有很多书店和咖啡馆。'],
    explanation_fr: 'Remplacez 什么地方 par le lieu : 我最喜欢巴黎的 + lieu. Ou avec une relative : 我最喜欢的地方是…',
    explanation_en: 'Replace 什么地方 with the place: 我最喜欢巴黎的 + place. Or with a relative: 我最喜欢的地方是…' },
  { question: '你每个星期说多长时间汉语？', instruction_fr: 'Attention à la place de la durée !',
    checks: [{ label: 'Contient 每个星期', re: '每(个)?星期|每周' }, { label: 'Durée (小时 / 分钟)', re: '小时|分钟' },
      { label: 'Durée avant l\'objet (…小时汉语) ou verbe répété (说汉语说…)', re: '(小时|分钟)(的)?(汉语|中文)|说(汉语|中文)说' }],
    models: ['我每个星期说五个小时汉语。', '我每个星期说汉语说三个小时。', '我每个星期说四个半小时（的）汉语。'],
    explanation_fr: 'La durée suit le verbe et précède l\'objet : 说 + 五个小时 + 汉语. Ou on répète le verbe : 说汉语说三个小时. *我每个星期五个小时说汉语 est faux.',
    explanation_en: 'Duration follows the verb and precedes the object: 说 + 五个小时 + 汉语. Or repeat the verb: 说汉语说三个小时. *我每个星期五个小时说汉语 is wrong.' },
  { question: '你学了几年汉语了？', instruction_fr: 'Gardez les deux 了 !',
    checks: [{ label: 'Contient 学了', re: '学了|学(汉语|中文)学了' }, { label: 'Durée en 年', re: '年' }, { label: '了₂ en fin de phrase', re: '了[。！!]?$' }],
    models: ['我学了两年汉语了。', '我学汉语学了三年了。', '我学了一年半汉语了。'],
    explanation_fr: 'V + 了₁ + durée + O + 了₂ : 学了两年汉语了 = « j\'apprends le chinois depuis deux ans ». Le 了₂ final indique que ça continue.',
    explanation_en: 'V + 了₁ + duration + O + 了₂: 学了两年汉语了 = "I\'ve been learning Chinese for two years". The final 了₂ shows it\'s still going on.' },
];

const OPEN_VARIANTS = [
  { question: '你想去北京吗？', instruction_fr: 'Répondez par une phrase complète.',
    checks: [{ label: 'Reprend 想去 (ou 不想去)', re: '想去' }],
    models: ['我很想去北京，因为我想看长城。', '我想去北京，也想去上海。'],
    explanation_fr: 'Même structure que 1-1 : reprenez 想去 + lieu, ajoutez une raison avec 因为.',
    explanation_en: 'Same structure as 1-1: reuse 想去 + place, add a reason with 因为.' },
  { question: '你去过中国吗？', instruction_fr: 'Utilisez V + 过.',
    checks: [{ label: 'Utilise 去过', re: '去过' }, NOT_BU_GUO],
    models: ['我去过两次中国。', '我没去过中国，但是我很想去。'],
    explanation_fr: '去过 + (nombre de fois) + 中国. Négation : 没去过. Le classificateur verbal 次 suit 过.',
    explanation_en: '去过 + (number of times) + 中国. Negation: 没去过. The verbal classifier 次 follows 过.' },
  { question: '你最喜欢巴黎政治学院的什么地方？', instruction_fr: 'Nommez un lieu de l\'école.',
    checks: [{ label: 'Reprend 最喜欢', re: '最喜欢' }],
    models: ['我最喜欢学校的图书馆。', '我最喜欢巴黎政治学院的小公园。'],
    explanation_fr: 'Remplacez 什么地方 par le lieu : 我最喜欢 + (学校的) + 图书馆.',
    explanation_en: 'Replace 什么地方 with the place: 我最喜欢 + (学校的) + 图书馆.' },
  { question: '你每天学习多长时间汉语？', instruction_fr: 'Attention à la place de la durée !',
    checks: [{ label: 'Contient 每天', re: '每天' }, { label: 'Durée (小时 / 分钟)', re: '小时|分钟' },
      { label: 'Durée avant l\'objet ou verbe répété', re: '(小时|分钟)(的)?(汉语|中文)|学(习)?(汉语|中文)学' }],
    models: ['我每天学习一个小时汉语。', '我每天学汉语学半个小时。'],
    explanation_fr: 'V + durée + O : 学习一个小时汉语. Ou V + O + V + durée : 学汉语学半个小时.',
    explanation_en: 'V + duration + O: 学习一个小时汉语. Or V + O + V + duration: 学汉语学半个小时.' },
  { question: '你在巴黎住了几年了？', instruction_fr: 'Gardez les deux 了 !',
    checks: [{ label: 'Contient 住了', re: '住了' }, { label: 'Durée en 年', re: '年' }, { label: '了₂ en fin de phrase', re: '了[。！!]?$' }],
    models: ['我在巴黎住了三年了。', '我在巴黎住了半年了。'],
    explanation_fr: '在 + lieu + V + 了₁ + durée + 了₂ : 在巴黎住了三年了 = « j\'habite à Paris depuis trois ans ».',
    explanation_en: '在 + place + V + 了₁ + duration + 了₂: 在巴黎住了三年了 = "I\'ve lived in Paris for three years".' },
];

// ---------- Partie 2 : ordre des mots ----------

const ORDER_ORIGINAL = [
  { fr: '他的汉字 / 写 / 很漂亮 / 得', chunks: ['他的汉字', '写', '很漂亮', '得'], answer: '他的汉字写得很漂亮',
    explanation_fr: 'Complément de degré : (Objet en tête) + V + 得 + appréciation. 他的汉字写得很漂亮 = « il écrit très joliment les caractères ».',
    explanation_en: 'Degree complement: (topic object first) + V + 得 + assessment. 他的汉字写得很漂亮 = "his characters are beautifully written".' },
  { fr: '我的包 / 手机 / 在 / 里', chunks: ['我的包', '手机', '在', '里'], answer: '手机在我的包里',
    explanation_fr: 'Chose + 在 + Lieu + locatif : 手机在我的包里 = « le portable est dans mon sac ». Le locatif 里 suit le nom de lieu.',
    explanation_en: 'Thing + 在 + Place + locative: 手机在我的包里 = "the phone is in my bag". The locative 里 follows the place noun.' },
  { fr: '喜欢 / 吃 / 都 / 马和羊 / 草', chunks: ['喜欢', '吃', '都', '马和羊', '草'], answer: '马和羊都喜欢吃草',
    explanation_fr: '都 se place après le sujet pluriel et devant le verbe : 马和羊 + 都 + 喜欢吃草 = « les chevaux et les moutons aiment tous manger de l\'herbe ».',
    explanation_en: '都 goes after the plural subject and before the verb: 马和羊 + 都 + 喜欢吃草 = "horses and sheep both like eating grass".' },
  { fr: '北京 / 他 / 去过 / 还没', chunks: ['北京', '他', '去过', '还没'], answer: '他还没去过北京',
    explanation_fr: '还没 + V + 过 = « ne pas encore avoir fait ». Sujet + 还没 + 去过 + lieu.',
    explanation_en: '还没 + V + 过 = "have not yet done". Subject + 还没 + 去过 + place.' },
  { fr: '很 / 这些 / 新鲜 / 葡萄', chunks: ['很', '这些', '新鲜', '葡萄'], answer: '这些葡萄很新鲜',
    explanation_fr: 'Phrase à prédicat adjectival : 这些葡萄 (sujet) + 很 + 新鲜. Pas de 是 devant un adjectif.',
    explanation_en: 'Adjectival predicate: 这些葡萄 (subject) + 很 + 新鲜. No 是 before an adjective.' },
  { fr: '你们 / 复习 / 明天 / 哪一课', chunks: ['你们', '复习', '明天', '哪一课'], answer: '你们明天复习哪一课', alts: ['明天你们复习哪一课'],
    explanation_fr: 'Le temps se place avant le verbe (après ou avant le sujet) ; l\'interrogatif 哪一课 reste à la place de l\'objet.',
    explanation_en: 'Time goes before the verb (after or before the subject); the question word 哪一课 stays in the object position.' },
];

const ORDER_VARIANTS = [
  { fr: '她的中文 / 说 / 很好 / 得', chunks: ['她的中文', '说', '很好', '得'], answer: '她的中文说得很好',
    explanation_fr: 'Même structure que 2-1 : Objet + V + 得 + appréciation.', explanation_en: 'Same structure as 2-1: Object + V + 得 + assessment.' },
  { fr: '我的书包 / 钱包 / 在 / 里', chunks: ['我的书包', '钱包', '在', '里'], answer: '钱包在我的书包里',
    explanation_fr: 'Chose + 在 + Lieu + 里. Le portefeuille (钱包) est l\'élément localisé, donc le sujet.', explanation_en: 'Thing + 在 + Place + 里. The wallet (钱包) is what is located, so it is the subject.' },
  { fr: '喜欢 / 看 / 都 / 哥哥和姐姐 / 中国电影', chunks: ['喜欢', '看', '都', '哥哥和姐姐', '中国电影'], answer: '哥哥和姐姐都喜欢看中国电影',
    explanation_fr: 'Sujet pluriel + 都 + 喜欢 + V + O.', explanation_en: 'Plural subject + 都 + 喜欢 + V + O.' },
  { fr: '上海 / 我 / 去过 / 还没', chunks: ['上海', '我', '去过', '还没'], answer: '我还没去过上海',
    explanation_fr: 'S + 还没 + V过 + O = « ne pas encore être allé à ».', explanation_en: 'S + 还没 + V过 + O = "have not yet been to".' },
  { fr: '很 / 那些 / 便宜 / 苹果', chunks: ['很', '那些', '便宜', '苹果'], answer: '那些苹果很便宜',
    explanation_fr: 'Démonstratif + nom (sujet) + 很 + adjectif.', explanation_en: 'Demonstrative + noun (subject) + 很 + adjective.' },
  { fr: '他们 / 学习 / 后天 / 哪一课', chunks: ['他们', '学习', '后天', '哪一课'], answer: '他们后天学习哪一课', alts: ['后天他们学习哪一课'],
    explanation_fr: 'Le temps (后天) se place avant le verbe ; l\'interrogatif reste en position d\'objet.', explanation_en: 'Time (后天) goes before the verb; the question word stays in object position.' },
  { fr: '这本书 / 我 / 三遍 / 看过', chunks: ['这本书', '我', '三遍', '看过'], answer: '这本书我看过三遍', alts: ['我看过三遍这本书'],
    explanation_fr: 'Classificateur verbal après V过 : 看过三遍. L\'objet peut être placé en tête (thème) : 这本书我看过三遍.', explanation_en: 'Verbal classifier after V过: 看过三遍. The object can be fronted as topic: 这本书我看过三遍.' },
];

// ---------- Partie 3 : 打算 周末 地方 半 年级 辆 ----------

const BANK3 = ['打算', '周末', '地方', '半', '年级', '辆'];

const FILL3_ORIGINAL = [
  { sentence: '妹妹的孩子今年六岁了，应该上小学一___了。', answer: '年级',
    explanation_fr: '一年级 = « première année ». À six ans, on entre en 一年级 (CP).', explanation_en: '一年级 = "first grade". At six, a child starts 一年级.' },
  { sentence: '我___明天早上去北京西站买火车票。', answer: '打算',
    explanation_fr: '打算 + V = « avoir l\'intention de ». Il se place après le sujet, devant le groupe verbal (明天早上去…).', explanation_en: '打算 + V = "to plan to". It goes after the subject, before the verb phrase.' },
  { sentence: '爸爸昨天买了一___新车。', answer: '辆',
    explanation_fr: '辆 est le classificateur des véhicules (voiture, vélo, bus).', explanation_en: '辆 is the classifier for vehicles (cars, bikes, buses).' },
  { sentence: '这个___我们一起练习汉语口语，好吗？', answer: '周末',
    explanation_fr: '这个周末 = « ce week-end ». Expression de temps placée en tête de phrase.', explanation_en: '这个周末 = "this weekend". A time expression at the start of the sentence.' },
  { sentence: '我每天早上八点___上课，上四个小时。', answer: '半',
    explanation_fr: '八点半 = « huit heures et demie ». 半 suit directement 点.', explanation_en: '八点半 = "half past eight". 半 directly follows 点.' },
  { sentence: '我还没去过那个___，漂亮吗？好玩儿吗？', answer: '地方',
    explanation_fr: '那个地方 = « cet endroit ». 去过 + lieu ; 地方 est le seul nom de lieu de la liste.', explanation_en: '那个地方 = "that place". 去过 + place; 地方 is the only place noun in the list.' },
];

const FILL3_VARIANTS = [
  { sentence: '我弟弟今年十岁，上小学四___。', answer: '年级', explanation_fr: '四年级 = « quatrième année » (CM1).', explanation_en: '四年级 = "fourth grade".' },
  { sentence: '这个暑假你___去哪儿旅游？', answer: '打算', explanation_fr: '打算 + V : « Où as-tu l\'intention de voyager cet été ? »', explanation_en: '打算 + V: "Where are you planning to travel this summer?"' },
  { sentence: '我家有两___自行车。', answer: '辆', explanation_fr: '辆 s\'emploie aussi pour les vélos : 两辆自行车.', explanation_en: '辆 is also used for bicycles: 两辆自行车.' },
  { sentence: '上个___我和朋友去看了一个中国电影。', answer: '周末', explanation_fr: '上个周末 = « le week-end dernier ».', explanation_en: '上个周末 = "last weekend".' },
  { sentence: '电影晚上七点___开始，我们六点见吧。', answer: '半', explanation_fr: '七点半 = 19 h 30.', explanation_en: '七点半 = 7:30 pm.' },
  { sentence: '巴黎有很多好玩儿的___，你想去哪儿？', answer: '地方', explanation_fr: '好玩儿的地方 = « des endroits sympas ». Adj + 的 + 地方.', explanation_en: '好玩儿的地方 = "fun places". Adj + 的 + 地方.' },
];

// ---------- Partie 4 : classificateurs ----------

const BANK4 = ['位', '棵', '块', '种', '件', '双', '张', '次', '节', '门'];
const BANK4_VARIANTS = ['位', '棵', '块', '种', '条', '件', '双', '张', '辆', '次', '节', '门'];

const CLF_ORIGINAL = [
  { sentence: '妈妈昨天在超市买了一___漂亮的衣服。', answer: '件', explanation_fr: '件 : vêtements du haut, affaires (一件衣服, 一件事).', explanation_en: '件: clothing (tops), matters (一件衣服, 一件事).' },
  { sentence: '那___老人已经107岁了。', answer: '位', explanation_fr: '位 : classificateur poli pour les personnes (老人, 老师, 客人).', explanation_en: '位: polite classifier for people (老人, 老师, 客人).' },
  { sentence: '你想吃哪___面包？', answer: '种', accept: ['块'], explanation_fr: '哪种面包 = « quelle sorte de pain ». 块 (quel morceau) serait aussi grammatical, mais chaque mot ne sert qu\'une fois et 块 va avec 蛋糕 (4-7).', explanation_en: '哪种面包 = "which kind of bread". 块 (which piece) is also grammatical, but each word is used once and 块 goes with 蛋糕 (4-7).' },
  { sentence: '今天的最后一___课是体育课，大家都很开心。', answer: '节', explanation_fr: '节 : une séance de cours (一节课 = une heure de cours).', explanation_en: '节: a class period (一节课 = one class session).' },
  { sentence: '我去过三___北京。', answer: '次', explanation_fr: '次 : classificateur verbal « fois », après V过 : 去过三次.', explanation_en: '次: verbal classifier "times", after V过: 去过三次.' },
  { sentence: '这个学期，我们学校新开了一___政治学课。', answer: '门', explanation_fr: '门 : une matière, un cours au programme (一门课). À distinguer de 节 (une séance).', explanation_en: '门: a subject, a course in the curriculum (一门课). Different from 节 (one session).' },
  { sentence: '今天中午弟弟吃了三___蛋糕。', answer: '块', explanation_fr: '块 : un morceau (蛋糕, 面包, 巧克力) — aussi l\'unité monétaire.', explanation_en: '块: a piece (cake, bread, chocolate) — also the money unit.' },
  { sentence: '他家门口有两___高大的苹果树。', answer: '棵', explanation_fr: '棵 : arbres et plantes (一棵树).', explanation_en: '棵: trees and plants (一棵树).' },
  { sentence: '妈妈给他买了一___新鞋。', answer: '双', explanation_fr: '双 : une paire (鞋, 筷子, 袜子).', explanation_en: '双: a pair (shoes, chopsticks, socks).' },
  { sentence: '我买了两___去北京的飞机票。', answer: '张', explanation_fr: '张 : objets plats (票, 纸, 桌子, 地图).', explanation_en: '张: flat objects (tickets, paper, tables, maps).' },
];

const CLF_VARIANTS = [
  { sentence: '妈妈给我买了一___新毛衣。', answer: '件', explanation_fr: '件 pour les vêtements du haut.', explanation_en: '件 for tops / clothing.' },
  { sentence: '饭店里有几十___客人。', answer: '位', explanation_fr: '位 : classificateur poli pour les personnes (客人 = invités, clients).', explanation_en: '位: polite classifier for people (客人 = guests).' },
  { sentence: '我在超市买了两___新鲜的大白菜。', answer: '棵', explanation_fr: '棵 s\'emploie pour les plantes, y compris les choux entiers.', explanation_en: '棵 is used for plants, including whole cabbages.' },
  { sentence: '今天上午我们上了三___数学课。', answer: '节', explanation_fr: '节 : séances de cours.', explanation_en: '节: class periods.' },
  { sentence: '我看过三___这部电影。', answer: '次', explanation_fr: '次 : nombre de fois (遍 serait aussi possible, mais il n\'est pas dans la liste).', explanation_en: '次: number of times (遍 would also work, but it\'s not in the list).' },
  { sentence: '这个学期，我选了五___课。', answer: '门', explanation_fr: '门 : matières choisies dans le programme.', explanation_en: '门: subjects/courses taken.' },
  { sentence: '桌子上有一___蛋糕。', answer: '块', explanation_fr: '块 : un morceau de gâteau.', explanation_en: '块: a piece of cake.' },
  { sentence: '这花园里有几十___花。', answer: '种', accept: ['棵'], explanation_fr: '几十种花 = « des dizaines d\'espèces de fleurs ». (棵 est possible pour compter des plantes.)', explanation_en: '几十种花 = "dozens of kinds of flowers". (棵 is possible when counting plants.)' },
  { sentence: '河里有一___小鱼。', answer: '条', explanation_fr: '条 : objets longs et souples — poissons, rivières, pantalons.', explanation_en: '条: long, flexible things — fish, rivers, trousers.' },
  { sentence: '爷爷每天早上都用那___筷子吃饭。', answer: '双', explanation_fr: '双 : une paire de baguettes.', explanation_en: '双: a pair of chopsticks.' },
  { sentence: '教室里有一___地图。', answer: '张', explanation_fr: '张 : une carte (objet plat).', explanation_en: '张: a map (flat object).' },
  { sentence: '爸爸今天买了一___新车。', answer: '辆', explanation_fr: '辆 : véhicules.', explanation_en: '辆: vehicles.' },
];

// ---------- Partie 5 : compréhension ----------

const READING_ORIGINAL = [
  { passage: '我爱旅游，喜欢走南走北。第一次去旅游的时候，我买最便宜的火车票，因为那时候没有那么多钱。现在，我可以开车去想去的地方，车上有电子地图，能告诉我怎么走。',
    question: '我现在：', options: ['A 没有那么多钱', 'B 喜欢坐火车', 'C 可以开车旅游'], correct: 'C 可以开车旅游',
    explanation_fr: '« 现在，我可以开车去想去的地方 ». A et B décrivent 那时候 (autrefois), pas 现在.', explanation_en: '"现在，我可以开车去想去的地方". A and B describe 那时候 (back then), not 现在.' },
  { passage: '现在的孩子很不容易。从周一到周五每天都要上课，下了课还要做作业，周末也不能休息，起了床就去学这学那，能不累吗？',
    question: '现在的孩子：', options: ['A 一点也不累', 'B 每天都很忙', 'C 周末起床很晚'], correct: 'B 每天都很忙',
    explanation_fr: 'Cours, devoirs, week-end sans repos → ils sont occupés tous les jours. « 能不累吗 » est une question rhétorique = ils sont forcément fatigués (A faux).', explanation_en: 'Classes, homework, no rest at weekends → busy every day. "能不累吗" is rhetorical = of course they\'re tired (A is wrong).' },
  { passage: '王老师有一个二十岁的女儿，现在上大学三年级，很聪明也很漂亮。',
    question: '王老师的女儿：', options: ['A 很年轻', 'B 是老师', 'C 喜欢笑'], correct: 'A 很年轻',
    explanation_fr: 'Elle a 20 ans et est en 3e année d\'université → elle est jeune. C\'est son père/sa mère qui est professeur (B faux).', explanation_en: 'She\'s 20 and in her third year at university → she\'s young. It\'s her parent who is the teacher (B is wrong).' },
  { passage: '北京人一年四季都喜欢喝茶。中国有很多种茶，有红茶，也有绿茶，还有花茶。茶是中国人非常爱喝的饮料。',
    question: '中国人觉得茶：', options: ['A 是红色的', 'B 很好喝', 'C 很贵'], correct: 'B 很好喝',
    explanation_fr: '« 茶是中国人非常爱喝的饮料 » → ils trouvent le thé bon. Le texte cite aussi du thé vert et au jasmin (A faux) et ne parle pas du prix (C).', explanation_en: '"茶是中国人非常爱喝的饮料" → they find tea tasty. The text also mentions green and flower tea (A wrong) and says nothing about price (C).' },
  { passage: '在中国，去朋友家玩儿，离开时朋友可能跟你说"慢走"，很多外国人听不明白。其实他们的意思是让你在回去的路上小心点儿，不是让你慢点走。',
    question: '朋友说"慢走"的意思可能是：', options: ['A 路上小心', 'B 别走得太快', 'C 听不明白'], correct: 'A 路上小心',
    explanation_fr: '« 意思是让你在回去的路上小心点儿，不是让你慢点走 » → « sois prudent sur la route ». Piège : B est le sens littéral, explicitement rejeté.', explanation_en: '"意思是让你在回去的路上小心点儿，不是让你慢点走" → "take care on the way". Trap: B is the literal meaning, explicitly rejected.' },
  { passage: '我妹妹不喜欢画画儿、唱歌，只对踢足球感兴趣。她会踢足球，也爱看足球比赛。',
    question: '我妹妹喜欢：', options: ['A 唱歌', 'B 踢足球', 'C 画画儿'], correct: 'B 踢足球',
    explanation_fr: '« 只对踢足球感兴趣 » = elle ne s\'intéresse qu\'au football. 不喜欢 porte sur 画画儿 et 唱歌.', explanation_en: '"只对踢足球感兴趣" = she\'s only interested in football. 不喜欢 applies to painting and singing.' },
  { passage: '我女儿和白先生的儿子在一个学校上学。他儿子跟我女儿一样，都上三年级，但是不同班。他儿子在一班，我女儿在四班。课间休息的时候，他们经常一起玩儿。',
    question: '白先生的儿子：', options: ['A 和我是同学', 'B 和我女儿同班', 'C 课间休息经常跟我女儿见面'], correct: 'C 课间休息经常跟我女儿见面',
    explanation_fr: '« 课间休息的时候，他们经常一起玩儿 » → C. B est faux (不同班 : classes 1 et 4) ; A est faux (c\'est ma fille qui est à l\'école, pas moi).', explanation_en: '"课间休息的时候，他们经常一起玩儿" → C. B is wrong (不同班: classes 1 and 4); A is wrong (my daughter goes to that school, not me).' },
  { passage: '我家旁边有一家旧车店，卖"二手"自行车。没有钱买新车的人，可以在这儿买一辆旧自行车，很便宜。',
    question: '"二手"车的意思是：', options: ['A 便宜车', 'B 新车', 'C 旧车'], correct: 'C 旧车',
    explanation_fr: '旧车店 (magasin de véhicules d\'occasion) + « 买一辆旧自行车 » → 二手 = d\'occasion (旧). Ils sont bon marché, mais 便宜 n\'est pas le sens du mot.', explanation_en: '旧车店 (second-hand vehicle shop) + "买一辆旧自行车" → 二手 = second-hand (旧). They\'re cheap, but 便宜 isn\'t what the word means.' },
];

const READING_VARIANTS = [
  { passage: '我哥哥很喜欢看电影。他以前每个星期都去电影院，现在工作很忙，只能在家用电脑看电影。',
    question: '我哥哥现在：', options: ['A 每个星期去电影院', 'B 在家看电影', 'C 不喜欢看电影'], correct: 'B 在家看电影',
    explanation_fr: '以前 (autrefois) il allait au cinéma ; 现在 (maintenant) il regarde des films chez lui.', explanation_en: '以前 (before) he went to the cinema; 现在 (now) he watches films at home.' },
  { passage: '小王是法国人，他学了三年汉语了。虽然他汉语说得很好，但是汉字写得不太好，所以他每天都练习写汉字。',
    question: '小王：', options: ['A 汉字写得很好', 'B 汉语说得不错', 'C 学了两年汉语'], correct: 'B 汉语说得不错',
    explanation_fr: '虽然 说得很好，但是 写得不太好 → il parle bien. Il apprend depuis trois ans (C faux).', explanation_en: '虽然 说得很好，但是 写得不太好 → he speaks well. He\'s been learning for three years (C wrong).' },
  { passage: '中秋节的晚上，月亮又圆又亮。很多中国人和家里人一起吃月饼、看月亮。月饼有很多种，但是都是圆的。',
    question: '月饼：', options: ['A 都是圆的', 'B 只有一种', 'C 很贵'], correct: 'A 都是圆的',
    explanation_fr: '« 月饼有很多种，但是都是圆的 » → A. B contredit « 很多种 ».', explanation_en: '"月饼有很多种，但是都是圆的" → A. B contradicts "很多种".' },
  { passage: '在中国，吃饭的时候，朋友常常跟你说"多吃点儿"。这不是说你吃得太少，是希望你吃得开心。',
    question: '朋友说"多吃点儿"的意思可能是：', options: ['A 你吃得太少', 'B 希望你吃得开心', 'C 菜不好吃'], correct: 'B 希望你吃得开心',
    explanation_fr: 'Même piège que « 慢走 » : le sens littéral (A) est explicitement rejeté par « 不是说… ».', explanation_en: 'Same trap as "慢走": the literal meaning (A) is explicitly rejected by "不是说…".' },
  { passage: '我住的地方离学校不太远。我先坐十分钟公共汽车，然后再走五分钟就到了。',
    question: '我去学校：', options: ['A 要走十分钟', 'B 先坐车再走路', 'C 开车去'], correct: 'B 先坐车再走路',
    explanation_fr: '先坐…公共汽车，然后再走… → d\'abord le bus, puis à pied. On marche 5 minutes, pas 10 (A faux).', explanation_en: '先坐…公共汽车，然后再走… → bus first, then walk. The walk is 5 minutes, not 10 (A wrong).' },
  { passage: '我姐姐今年二十五岁，在一家医院工作，她是大夫。她工作很忙，常常晚上九点以后才回家。',
    question: '我姐姐：', options: ['A 是学生', 'B 下班很晚', 'C 在学校工作'], correct: 'B 下班很晚',
    explanation_fr: '« 常常晚上九点以后才回家 » → elle finit tard. Elle travaille à l\'hôpital (C faux).', explanation_en: '"常常晚上九点以后才回家" → she finishes late. She works at a hospital (C wrong).' },
  { passage: '这家商店卖的衣服很漂亮，也不贵，所以周末来买东西的人特别多。',
    question: '周末这家商店：', options: ['A 人很多', 'B 衣服很贵', 'C 不开门'], correct: 'A 人很多',
    explanation_fr: '« 周末来买东西的人特别多 » (relative : les gens qui viennent acheter) → A.', explanation_en: '"周末来买东西的人特别多" (relative: the people who come to shop) → A.' },
  { passage: '我同学马克对中国历史很感兴趣。他看过很多关于中国历史的书，还打算明年去西安旅游。',
    question: '马克：', options: ['A 去过西安', 'B 了解中国历史', 'C 不喜欢看书'], correct: 'B 了解中国历史',
    explanation_fr: 'Il a lu beaucoup de livres sur l\'histoire chinoise → il la connaît (了解). Il 打算 (a l\'intention d\') aller à Xi\'an : il n\'y est pas encore allé (A faux).', explanation_en: 'He\'s read many books on Chinese history → he knows it well (了解). He 打算 (plans) to go to Xi\'an: he hasn\'t been yet (A wrong).' },
];

// ---------- Construction des sessions ----------

const toOpen = (q) => ({ type: 'open-answer', ...q });
const toOrder = (q) => ({ type: 'order', ...q });
const toFill = (bank, hint) => (q) => ({
  type: 'fill-mcq', sentence: q.sentence, correct: q.answer, accept: q.accept, options: bank, hint,
  explanation_fr: q.explanation_fr, explanation_en: q.explanation_en,
});
const toReading = (q) => ({ type: 'reading-mcq', ...q });

function buildExam() {
  return {
    rounds: [
      { title: 'Partie 1 — Questions', subtitle: '请用中文回答下面的五个问题', points: 5, exercises: OPEN_ORIGINAL.map(toOpen) },
      { title: 'Partie 2 — Ordre des mots', subtitle: 'Remettez les mots dans le bon ordre', points: 3, exercises: ORDER_ORIGINAL.map(toOrder) },
      { title: 'Partie 3 — 选词填空', subtitle: BANK3.join('  '), points: 3, exercises: FILL3_ORIGINAL.map(toFill(BANK3, 'Chaque mot est utilisé une fois.')) },
      { title: 'Partie 4 — 量词', subtitle: BANK4.join(' '), points: 5, exercises: CLF_ORIGINAL.map(toFill(BANK4, 'Chaque classificateur est utilisé une fois.')) },
      { title: 'Partie 5 — Lecture', subtitle: '阅读，选出正确答案', points: 4, exercises: READING_ORIGINAL.map(toReading) },
    ],
  };
}

function buildVariants() {
  return {
    rounds: [
      { title: 'Partie 1 — Questions', subtitle: 'Questions voisines', points: 5, exercises: shuffle(OPEN_VARIANTS).map(toOpen) },
      { title: 'Partie 2 — Ordre des mots', subtitle: 'Nouvelles phrases, mêmes structures', points: 3, exercises: shuffle(ORDER_VARIANTS).slice(0, 6).map(toOrder) },
      { title: 'Partie 3 — 选词填空', subtitle: BANK3.join('  '), points: 3, exercises: shuffle(FILL3_VARIANTS).map(toFill(BANK3, 'Chaque mot est utilisé une fois.')) },
      { title: 'Partie 4 — 量词', subtitle: BANK4_VARIANTS.join(' '), points: 5, exercises: shuffle(CLF_VARIANTS).slice(0, 10).map(toFill(BANK4_VARIANTS, '')) },
      { title: 'Partie 5 — Lecture', subtitle: 'Nouveaux textes', points: 4, exercises: shuffle(READING_VARIANTS).map(toReading) },
    ],
  };
}

// ---------- Vue ----------

const TABS = [
  { id: 'exam', label: 'Examen blanc' },
  { id: 'variants', label: 'Variantes' },
  { id: 'key', label: 'Sujet & corrigé' },
];

export default function HomeworkView() {
  const [tab, setTab] = useState('exam');
  const [runId, setRunId] = useState(0);
  const exam = useCallback(() => buildExam(), []);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const variants = useCallback(() => buildVariants(), [runId]);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const daysLeft = Math.round((DUE_DATE - today) / 86400000);

  return (
    <div>
      <div className="mb-6">
        <p className="text-xs font-semibold text-accent uppercase tracking-wider mb-1">Devoir — distribué le 23 septembre</p>
        <h2 className="text-2xl font-semibold hanzi-display">中文作业 1</h2>
        <p className="text-sm text-muted">
          À rendre le mardi 6 octobre · 20 points ·{' '}
          <span className={`font-semibold ${daysLeft <= 3 ? 'text-primary' : 'text-accent'}`}>
            {daysLeft > 0 ? `J-${daysLeft}` : daysLeft === 0 ? 'aujourd\'hui !' : 'date passée'}
          </span>
        </p>
      </div>

      <div className="flex gap-1 mb-6 border-b border-border pb-px">
        {TABS.map(t => (
          <button key={t.id} onClick={() => { setTab(t.id); if (t.id === 'variants') setRunId(r => r + 1); }}
            className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
              tab === t.id
                ? 'bg-surface-alt text-accent border border-border border-b-transparent -mb-px'
                : 'text-muted hover:text-primary'
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'exam' && (
        <>
          <p className="text-sm text-muted mb-4">Les questions du devoir, dans l'ordre, avec le barème. Note estimée sur 20 à la fin.</p>
          <LessonExercises key="exam" buildSession={exam} />
        </>
      )}
      {tab === 'variants' && (
        <>
          <p className="text-sm text-muted mb-4">Mêmes exercices, phrases légèrement modifiées — pour vérifier que vous maîtrisez les structures, pas les réponses.</p>
          <LessonExercises key={`variants-${runId}`} buildSession={variants} />
        </>
      )}
      {tab === 'key' && <AnswerKey />}
    </div>
  );
}

function AnswerKey() {
  const [shown, setShown] = useState(false);
  const Section = ({ title, points, bank, children }) => (
    <section className="bg-surface-alt border border-border rounded-2xl p-5">
      <div className="flex items-baseline justify-between mb-1">
        <h3 className="font-semibold">{title}</h3>
        <span className="text-xs text-muted">{points} pts</span>
      </div>
      {bank && <p className="text-sm hanzi-display text-accent mb-3">{bank}</p>}
      <ol className="space-y-3">{children}</ol>
    </section>
  );
  const Item = ({ n, prompt, answer, note }) => (
    <li className="text-sm">
      <p className="hanzi-display text-base"><span className="text-muted mr-2">{n}</span><Zh text={prompt} /></p>
      {shown && (
        <div className="mt-1 pl-6">
          <p className="hanzi-display text-success font-medium"><Zh text={answer} /></p>
          {note && <p className="text-xs text-muted mt-0.5"><Zh text={note} pinyin={false} /></p>}
        </div>
      )}
    </li>
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted">Le sujet complet. Essayez d'abord sans le corrigé !</p>
        <button onClick={() => setShown(s => !s)}
          className={`text-xs px-3 py-1.5 rounded-full font-medium transition-colors ${shown ? 'bg-accent text-white' : 'bg-accent/10 text-accent hover:bg-accent/20'}`}>
          {shown ? 'Masquer le corrigé' : 'Afficher le corrigé'}
        </button>
      </div>

      <Section title="1. 请用中文回答下面的五个问题" points={5}>
        {OPEN_ORIGINAL.map((q, i) => (
          <Item key={i} n={`1-${i + 1}`} prompt={q.question} answer={q.models.slice(0, 2).join(' / ')} note={q.explanation_fr} />
        ))}
      </Section>
      <Section title="2. 完成句子 — Remettez les mots dans l'ordre" points={3}>
        {ORDER_ORIGINAL.map((q, i) => (
          <Item key={i} n={`2-${i + 1}`} prompt={q.fr} answer={[q.answer, ...(q.alts || [])].map(a => a + '。').join(' / ')} note={q.explanation_fr} />
        ))}
      </Section>
      <Section title="3. 选词填空" points={3} bank={BANK3.join('　')}>
        {FILL3_ORIGINAL.map((q, i) => (
          <Item key={i} n={`3-${i + 1}`} prompt={q.sentence.replace('___', '（　）')} answer={q.answer} note={q.explanation_fr} />
        ))}
      </Section>
      <Section title="4. 用下面的量词填空" points={5} bank={BANK4.join('，')}>
        {CLF_ORIGINAL.map((q, i) => (
          <Item key={i} n={`4-${i + 1}`} prompt={q.sentence.replace('___', '（　）')} answer={q.answer} note={q.explanation_fr} />
        ))}
      </Section>
      <Section title="5. 阅读，选出正确答案" points={4}>
        {READING_ORIGINAL.map((q, i) => (
          <Item key={i} n={`5-${i + 1}`} prompt={`${q.passage}　＊${q.question} ${q.options.join('　')}`} answer={q.correct} note={q.explanation_fr} />
        ))}
      </Section>
    </div>
  );
}

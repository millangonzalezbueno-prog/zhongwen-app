import { createEmptyCard, fsrs, generatorParameters, Rating } from 'ts-fsrs';
import { get, set, keys } from 'idb-keyval';

const SRS_STORE_PREFIX = 'srs_';
const params = generatorParameters({ enable_fuzz: true });
const f = fsrs(params);

export { Rating };

export function makeCardId(sourceType, sourceId, direction) {
  return `${sourceType}_${sourceId}_${direction}`;
}

export async function getCard(cardId) {
  const stored = await get(SRS_STORE_PREFIX + cardId);
  if (stored) return stored;
  return { ...createEmptyCard(), cardId };
}

export async function saveCard(cardId, card) {
  await set(SRS_STORE_PREFIX + cardId, { ...card, cardId });
}

export function schedule(card, rating, now = new Date()) {
  const result = f.repeat(card, now);
  return result[rating].card;
}

export async function reviewCard(cardId, rating) {
  const card = await getCard(cardId);
  const updated = schedule(card, rating);
  await saveCard(cardId, updated);
  return updated;
}

export async function getDueCards(sourceItems, sourceType, directions = ['recognition', 'production', 'dictation']) {
  const now = new Date();
  const due = [];

  for (const item of sourceItems) {
    const id = item.hanzi || item.word || item.id;
    for (const dir of directions) {
      const cardId = makeCardId(sourceType, id, dir);
      const card = await getCard(cardId);
      if (card.due <= now || card.state === 0) {
        due.push({ cardId, card, source: item, direction: dir });
      }
    }
  }

  due.sort((a, b) => {
    if (a.card.state === 0 && b.card.state !== 0) return -1;
    if (a.card.state !== 0 && b.card.state === 0) return 1;
    return new Date(a.card.due) - new Date(b.card.due);
  });

  return due;
}

export async function getStats(sourceItems, sourceType, directions = ['recognition', 'production', 'dictation']) {
  const stats = { new: 0, learning: 0, review: 0, total: 0 };
  const now = new Date();

  for (const item of sourceItems) {
    const id = item.hanzi || item.word || item.id;
    for (const dir of directions) {
      const cardId = makeCardId(sourceType, id, dir);
      const card = await getCard(cardId);
      stats.total++;
      if (card.state === 0) stats.new++;
      else if (card.state === 1 || card.state === 3) stats.learning++;
      else stats.review++;
    }
  }

  return stats;
}

export async function clearAllSrsData() {
  const allKeys = await keys();
  for (const key of allKeys) {
    if (typeof key === 'string' && key.startsWith(SRS_STORE_PREFIX)) {
      await set(key, undefined);
    }
  }
}

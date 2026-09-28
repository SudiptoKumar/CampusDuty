import type { FlashCard, ReviewGrade, MasteryLevel } from './types';
import { format, addDays } from 'date-fns';

export function calculateNextReview(card: FlashCard, grade: ReviewGrade): Pick<FlashCard, 'ease' | 'interval' | 'nextReview' | 'mastery'> {
  let newEase = card.ease;
  let newInterval = card.interval;

  switch (grade) {
    case 'again':
      newInterval = 0;
      newEase = Math.max(1.3, card.ease - 0.2);
      break;
    case 'hard':
      newInterval = Math.max(1, Math.round(card.interval * 1.2));
      newEase = Math.max(1.3, card.ease - 0.15);
      break;
    case 'good':
      newInterval = Math.max(2, Math.round(card.interval === 0 ? 1 : card.interval * card.ease));
      break;
    case 'easy':
      newInterval = Math.max(4, Math.round((card.interval === 0 ? 1 : card.interval) * card.ease * 1.3));
      newEase = card.ease + 0.15;
      break;
  }

  const nextReview = format(addDays(new Date(), newInterval), 'yyyy-MM-dd');

  let mastery: MasteryLevel = 'new';
  if (newInterval >= 21) mastery = 'mastered';
  else if (newInterval >= 7) mastery = 'review';
  else if (newInterval >= 1) mastery = 'learning';

  return { ease: newEase, interval: newInterval, nextReview, mastery };
}

export function getDueCards(cards: FlashCard[]): FlashCard[] {
  const today = format(new Date(), 'yyyy-MM-dd');
  return cards.filter(c => c.nextReview <= today);
}

export function getMasteryColor(mastery: MasteryLevel): string {
  switch (mastery) {
    case 'mastered': return 'hsl(142, 71%, 45%)';
    case 'review': return 'hsl(262, 83%, 58%)';
    case 'learning': return 'hsl(35, 90%, 55%)';
    default: return 'hsl(var(--muted-foreground))';
  }
}

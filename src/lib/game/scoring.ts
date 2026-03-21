const BASE_POINTS_PER_PIECE = 100;
const COMBO_MULTIPLIER = 1.5;
const GROUP_BONUS_THRESHOLD = 3;
const GROUP_BONUS_PER_EXTRA = 50;

/**
 * Calculate points for a set of match groups at a given combo chain level.
 * - Base: 100 points per piece
 * - Groups of 3+ pieces get a bonus (50 per extra piece beyond 2)
 * - Combo chain multiplier: 1.5^(chain-1)
 */
export function calculatePoints(
  matchGroups: { pieceIds: string[] }[],
  comboChain: number
): number {
  let basePoints = 0;

  for (const group of matchGroups) {
    const count = group.pieceIds.length;
    basePoints += count * BASE_POINTS_PER_PIECE;

    if (count >= GROUP_BONUS_THRESHOLD) {
      basePoints += (count - 2) * GROUP_BONUS_PER_EXTRA;
    }
  }

  const multiplier = Math.pow(COMBO_MULTIPLIER, Math.max(0, comboChain - 1));
  return Math.round(basePoints * multiplier);
}

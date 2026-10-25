/** Display fees only. The database computes and snapshots the payable fee. */
export const ROUND_TWO_FEES: Record<string, { solo: number; team: number; unit: string }> = {
  's4-14': { solo: 400, team: 400, unit: 'per team' },
  's4-15': { solo: 400, team: 400, unit: 'per entry' },
  's4-16': { solo: 300, team: 400, unit: 'solo / team of 2' },
  's4-17': { solo: 300, team: 400, unit: 'solo / team of 2' },
  's4-18': { solo: 500, team: 500, unit: 'per team' },
  's4-19': { solo: 300, team: 300, unit: 'solo' }
};

export function isRoundTwo(eventId: string): boolean {
  return Object.prototype.hasOwnProperty.call(ROUND_TWO_FEES, eventId);
}

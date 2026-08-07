import { prisma } from '../config/db.js';
import { NotFound, BadRequest } from '../utils/errors.js';

const ROUND_CONTROL_ID = 'round_control';

const ROUND_FIELD = {
  ROUND_1: 'round1State',
  ROUND_2: 'round2State',
  ROUND_3: 'round3State',
};

export const roundControlService = {
  async get() {
    const row = await prisma.roundControl.findUnique({ where: { id: ROUND_CONTROL_ID } });
    if (!row) throw NotFound('Round control not initialized');
    return row;
  },

  /**
   * Update the state of a single round. Spec calls for a master toggle
   * exposed per round; updating multiple rounds at once is a sequence of
   * calls so the audit log captures each transition independently.
   */
  async setRoundState({ round, state, actorId }) {
    const field = ROUND_FIELD[round];
    if (!field) throw BadRequest('Invalid round');
    if (!['LOCKED', 'UNLOCKED', 'CLOSED'].includes(state)) {
      throw BadRequest('Invalid state');
    }
    return prisma.roundControl.update({
      where: { id: ROUND_CONTROL_ID },
      data: { [field]: state, updatedById: actorId ?? null },
    });
  },
};

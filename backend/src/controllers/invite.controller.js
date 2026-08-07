import { inviteService } from '../services/invite.service.js';
import { emitInviteReceived } from '../realtime/emitter.js';

export const create = async (req, res) => {
  const invite = await inviteService.create({
    teamId:    req.params.id,
    inviterId: req.user.id,
    inviteeId: req.body.inviteeId,
  });

  // Push to the invitee's private inbox so they see the invite without
  // polling. Best-effort: failure to emit must not roll back the invite.
  emitInviteReceived(req.body.inviteeId, invite);

  res.status(201).json({ invite });
};

export const listForTeam = async (req, res) => {
  const invites = await inviteService.listForTeam({
    teamId: req.params.id,
    status: req.query.status,
  });
  res.json({ count: invites.length, invites });
};

export const listMine = async (req, res) => {
  const invites = await inviteService.listForUser(req.user.id);
  res.json({ count: invites.length, invites });
};

export const accept = async (req, res) => {
  const team = await inviteService.accept({
    inviteId: req.params.inviteId,
    userId:   req.user.id,
  });
  res.json({ team });
};

export const decline = async (req, res) => {
  const invite = await inviteService.decline({
    inviteId: req.params.inviteId,
    userId:   req.user.id,
  });
  res.json({ invite });
};

export const cancel = async (req, res) => {
  const invite = await inviteService.cancel({
    inviteId: req.params.inviteId,
    actorId:  req.user.id,
  });
  res.json({ invite });
};

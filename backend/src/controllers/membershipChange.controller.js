import { membershipChangeService } from '../services/membershipChange.service.js';

export const requestLeave = async (req, res) => {
  const change = await membershipChangeService.requestLeave({
    teamId: req.params.id,
    userId: req.user.id,
    reason: req.body.reason,
  });
  res.status(201).json({ change });
};

export const requestDismiss = async (req, res) => {
  const change = await membershipChangeService.requestDismiss({
    teamId:       req.params.id,
    leaderId:     req.user.id,
    targetUserId: req.body.targetUserId,
    reason:       req.body.reason,
  });
  res.status(201).json({ change });
};

export const approve = async (req, res) => {
  const result = await membershipChangeService.approve({
    requestId: req.params.changeId,
    actorId:   req.user.id,
  });
  res.json(result);
};

export const deny = async (req, res) => {
  const result = await membershipChangeService.deny({
    requestId: req.params.changeId,
    actorId:   req.user.id,
  });
  res.json(result);
};

export const cancel = async (req, res) => {
  const result = await membershipChangeService.cancel({
    requestId: req.params.changeId,
    actorId:   req.user.id,
  });
  res.json(result);
};

export const listAwaitingMyApproval = async (req, res) => {
  const changes = await membershipChangeService.listAwaitingMyApproval(req.user.id);
  res.json({ count: changes.length, changes });
};

export const listInitiatedByMe = async (req, res) => {
  const changes = await membershipChangeService.listInitiatedByMe(req.user.id);
  res.json({ count: changes.length, changes });
};

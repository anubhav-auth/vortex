import { joinRequestService } from '../services/joinRequest.service.js';

export const create = async (req, res) => {
  const request = await joinRequestService.create({
    teamId:      req.params.id,
    requesterId: req.user.id,
  });
  res.status(201).json({ request });
};

export const listForTeam = async (req, res) => {
  const requests = await joinRequestService.listForTeam({
    teamId: req.params.id,
    status: req.query.status,
  });
  res.json({ count: requests.length, requests });
};

export const listMine = async (req, res) => {
  const requests = await joinRequestService.listForUser(req.user.id);
  res.json({ count: requests.length, requests });
};

export const approve = async (req, res) => {
  const team = await joinRequestService.approve({
    requestId: req.params.requestId,
    actorId:   req.user.id,
  });
  res.json({ team });
};

export const deny = async (req, res) => {
  const request = await joinRequestService.deny({
    requestId: req.params.requestId,
    actorId:   req.user.id,
  });
  res.json({ request });
};

export const cancel = async (req, res) => {
  const request = await joinRequestService.cancel({
    requestId: req.params.requestId,
    actorId:   req.user.id,
  });
  res.json({ request });
};

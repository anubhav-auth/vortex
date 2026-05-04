import { juryAssignmentService } from '../services/juryAssignment.service.js';

export const create = async (req, res) => {
  const assignment = await juryAssignmentService.create(req.body);
  res.status(201).json({ assignment });
};

export const reassign = async (req, res) => {
  const assignment = await juryAssignmentService.reassign(req.body);
  res.json({ assignment });
};

export const remove = async (req, res) => {
  await juryAssignmentService.remove({ assignmentId: req.params.id });
  res.status(204).end();
};

export const list = async (req, res) => {
  const assignments = await juryAssignmentService.list(req.query);
  res.json({ count: assignments.length, assignments });
};

// Jury-facing
export const myAssignments = async (req, res) => {
  const assignments = await juryAssignmentService.listForJury({
    juryId: req.user.id,
    round: req.query.round,
  });
  res.json({ count: assignments.length, assignments });
};

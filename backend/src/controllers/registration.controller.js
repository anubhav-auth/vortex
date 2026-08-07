import { userService } from '../services/user.service.js';
import { registryService } from '../services/registry.service.js';

// Public endpoint — no auth. Creates a PENDING student. Never issues a
// password here; that happens only at admin approval time.

export const register = async (req, res) => {
  const user = await userService.createPendingStudent(req.body);

  // Best-effort registry hint — pure UX, doesn't gate anything.
  const match = await registryService.matchUser({
    registrationNo: user.registrationNo,
    email: user.email,
  });

  res.status(202).json({
    message: 'Registration submitted. Awaiting organizer verification.',
    user,
    registryMatch: match,
  });
};

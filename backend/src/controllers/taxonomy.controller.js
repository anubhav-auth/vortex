import {
  institutionService,
  domainService,
  problemStatementService,
} from '../services/taxonomy.service.js';

// Institutions
export const institutions = {
  list:    async (_req, res) => res.json({ institutions: await institutionService.list() }),
  create:  async (req, res)  => res.status(201).json({ institution: await institutionService.create(req.body) }),
  update:  async (req, res)  => res.json({ institution: await institutionService.update({ id: req.params.id, ...req.body }) }),
  remove:  async (req, res)  => { await institutionService.remove({ id: req.params.id }); res.status(204).end(); },
};

// Domains
export const domains = {
  list:    async (_req, res) => res.json({ domains: await domainService.list() }),
  create:  async (req, res)  => res.status(201).json({ domain: await domainService.create(req.body) }),
  update:  async (req, res)  => res.json({ domain: await domainService.update({ id: req.params.id, ...req.body }) }),
  remove:  async (req, res)  => { await domainService.remove({ id: req.params.id }); res.status(204).end(); },
};

// Problem statements
export const problemStatements = {
  list:    async (req, res) => res.json({ problemStatements: await problemStatementService.list(req.query) }),
  get:     async (req, res) => res.json({ problemStatement: await problemStatementService.get({ id: req.params.id }) }),
  create:  async (req, res) => res.status(201).json({ problemStatement: await problemStatementService.create(req.body) }),
  update:  async (req, res) => res.json({ problemStatement: await problemStatementService.update({ id: req.params.id, ...req.body }) }),
  remove:  async (req, res) => { await problemStatementService.remove({ id: req.params.id }); res.status(204).end(); },
};

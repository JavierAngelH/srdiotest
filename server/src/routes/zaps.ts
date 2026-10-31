import { Router, Response } from 'express';
import { Zap } from '../models/Zap';
import { requireAuth, AuthRequest } from '../middleware/auth';

const router = Router();

router.use(requireAuth);

function serializeZap(z: any) {
  const mapping =
    z.action?.mapping instanceof Map
      ? Object.fromEntries(z.action.mapping)
      : z.action?.mapping || {};
  return {
    id: z.id || z._id,
    name: z.name,
    enabled: z.enabled,
    trigger: z.trigger,
    action: { ...z.action?.toObject?.() ?? z.action, mapping },
    createdAt: z.createdAt,
    updatedAt: z.updatedAt,
  };
}

router.get('/', async (req: AuthRequest, res: Response) => {
  const zaps = await Zap.find({ userId: req.user!._id }).sort({ updatedAt: -1 });
  res.json(zaps.map(serializeZap));
});

router.post('/', async (req: AuthRequest, res: Response) => {
  const { name, enabled, trigger, action } = req.body || {};
  if (!name || !trigger?.app || !trigger?.event || !action?.app || !action?.type) {
    return res.status(400).json({ error: 'name, trigger, and action are required' });
  }
  const zap = await Zap.create({
    userId: req.user!._id,
    name,
    enabled: Boolean(enabled),
    trigger,
    action: {
      app: action.app,
      type: action.type,
      mapping: action.mapping || {},
    },
  });
  res.status(201).json(serializeZap(zap));
});

router.get('/:id', async (req: AuthRequest, res: Response) => {
  const zap = await Zap.findOne({ _id: req.params.id, userId: req.user!._id });
  if (!zap) return res.status(404).json({ error: 'Not found' });
  res.json(serializeZap(zap));
});

router.patch('/:id', async (req: AuthRequest, res: Response) => {
  const zap = await Zap.findOne({ _id: req.params.id, userId: req.user!._id });
  if (!zap) return res.status(404).json({ error: 'Not found' });

  const { name, enabled, trigger, action } = req.body || {};
  if (name !== undefined) zap.name = name;
  if (enabled !== undefined) zap.enabled = Boolean(enabled);
  if (trigger) zap.trigger = trigger;
  if (action) {
    zap.action = {
      app: action.app,
      type: action.type,
      mapping: action.mapping || {},
    } as any;
  }
  await zap.save();
  res.json(serializeZap(zap));
});

router.delete('/:id', async (req: AuthRequest, res: Response) => {
  const result = await Zap.deleteOne({ _id: req.params.id, userId: req.user!._id });
  if (!result.deletedCount) return res.status(404).json({ error: 'Not found' });
  res.json({ ok: true });
});

export default router;

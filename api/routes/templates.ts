import { Router, type Request, type Response } from 'express';
import fileService from '../services/fileService.js';
import type { ExperimentTemplate } from '../../shared/types.js';

const router = Router();
const TEMPLATES_DIR = fileService.getPath('templates');

router.get('/', async (req: Request, res: Response) => {
  try {
    const { category, sortBy = 'lastUsedAt', order = 'desc' } = req.query;
    let templates = await fileService.listJsonFiles<ExperimentTemplate>(TEMPLATES_DIR, {
      sortBy: sortBy as string,
      order: order as 'asc' | 'desc'
    });

    if (category && category !== 'all') {
      templates = templates.filter(t => t.category === category);
    }

    res.json({ success: true, data: templates });
  } catch (_error) {
    res.status(500).json({ success: false, error: 'Failed to load templates' });
  }
});

router.get('/check-name/:name', async (req: Request, res: Response) => {
  try {
    const templateName = decodeURIComponent(req.params.name);
    const templates = await fileService.listJsonFiles<ExperimentTemplate>(TEMPLATES_DIR);
    const existing = templates.find(t => t.name === templateName);
    
    res.json({ 
      success: true, 
      data: { 
        exists: !!existing,
        template: existing || null
      } 
    });
  } catch (_error) {
    res.status(500).json({ success: false, error: 'Failed to check template name' });
  }
});

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const filePath = fileService.getPath('templates', `${req.params.id}.json`);
    const template = await fileService.readJsonFile<ExperimentTemplate>(filePath);
    
    if (!template) {
      return res.status(404).json({ success: false, error: 'Template not found' });
    }
    
    res.json({ success: true, data: template });
  } catch (_error) {
    res.status(500).json({ success: false, error: 'Failed to load template' });
  }
});

router.post('/', async (req: Request, res: Response) => {
  try {
    const template: ExperimentTemplate = req.body;
    const filePath = fileService.getPath('templates', `${template.id}.json`);
    
    if (await fileService.fileExists(filePath)) {
      return res.status(400).json({ success: false, error: 'Template ID already exists' });
    }
    
    await fileService.writeJsonFile(filePath, template);
    res.json({ success: true, data: template });
  } catch (_error) {
    res.status(500).json({ success: false, error: 'Failed to create template' });
  }
});

router.post('/check-and-save', async (req: Request, res: Response) => {
  try {
    const { template, mode } = req.body as { template: ExperimentTemplate; mode: 'create' | 'overwrite' | 'rename' };
    const templates = await fileService.listJsonFiles<ExperimentTemplate>(TEMPLATES_DIR);
    const existingByName = templates.find(t => t.name === template.name);

    if (mode === 'create' && existingByName) {
      return res.json({ 
        success: false, 
        error: 'NAME_CONFLICT',
        data: { existing: existingByName }
      });
    }

    if (mode === 'overwrite' && existingByName) {
      const updated: ExperimentTemplate = {
        ...existingByName,
        grid: template.grid,
        materialId: template.materialId,
        boundaryConditions: template.boundaryConditions,
        initialHeatSources: template.initialHeatSources,
        defaultSteps: template.defaultSteps,
        timeStep: template.timeStep,
        description: template.description || existingByName.description,
        category: template.category || existingByName.category,
        lastUsedAt: Date.now(),
      };
      const filePath = fileService.getPath('templates', `${existingByName.id}.json`);
      await fileService.writeJsonFile(filePath, updated);
      return res.json({ success: true, data: updated });
    }

    if (mode === 'rename') {
      let newName = template.name;
      let counter = 1;
      while (templates.some(t => t.name === newName)) {
        newName = `${template.name} (${counter++})`;
      }
      const renamedTemplate: ExperimentTemplate = {
        ...template,
        name: newName,
        id: `tpl_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        createdAt: Date.now(),
        lastUsedAt: Date.now(),
        useCount: 0,
      };
      const filePath = fileService.getPath('templates', `${renamedTemplate.id}.json`);
      await fileService.writeJsonFile(filePath, renamedTemplate);
      return res.json({ success: true, data: renamedTemplate });
    }

    const newTemplate: ExperimentTemplate = {
      ...template,
      id: template.id || `tpl_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      createdAt: Date.now(),
      lastUsedAt: Date.now(),
      useCount: 0,
    };
    const filePath = fileService.getPath('templates', `${newTemplate.id}.json`);
    await fileService.writeJsonFile(filePath, newTemplate);
    res.json({ success: true, data: newTemplate });
  } catch (_error) {
    res.status(500).json({ success: false, error: 'Failed to save template' });
  }
});

router.put('/:id', async (req: Request, res: Response) => {
  try {
    const filePath = fileService.getPath('templates', `${req.params.id}.json`);
    const existing = await fileService.readJsonFile<ExperimentTemplate>(filePath);
    
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Template not found' });
    }
    
    const updated = { ...existing, ...req.body };
    await fileService.writeJsonFile(filePath, updated);
    res.json({ success: true, data: updated });
  } catch (_error) {
    res.status(500).json({ success: false, error: 'Failed to update template' });
  }
});

router.post('/:id/use', async (req: Request, res: Response) => {
  try {
    const filePath = fileService.getPath('templates', `${req.params.id}.json`);
    const existing = await fileService.readJsonFile<ExperimentTemplate>(filePath);
    
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Template not found' });
    }
    
    const updated: ExperimentTemplate = {
      ...existing,
      lastUsedAt: Date.now(),
      useCount: existing.useCount + 1,
    };
    await fileService.writeJsonFile(filePath, updated);
    res.json({ success: true, data: updated });
  } catch (_error) {
    res.status(500).json({ success: false, error: 'Failed to update template usage' });
  }
});

router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const filePath = fileService.getPath('templates', `${req.params.id}.json`);
    const deleted = await fileService.deleteFile(filePath);
    
    if (!deleted) {
      return res.status(404).json({ success: false, error: 'Template not found' });
    }
    
    res.json({ success: true });
  } catch (_error) {
    res.status(500).json({ success: false, error: 'Failed to delete template' });
  }
});

export default router;

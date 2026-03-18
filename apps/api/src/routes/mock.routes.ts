// Mock Routes - Works without Supabase
import { Router } from 'express';
import { ApprovalLog } from '@ai-animation-factory/shared';
import { initializeMockData, projectStore, episodeStore, approvalStore, statsStore } from '../mock/data.store';

const router: Router = Router();

// Initialize mock data
initializeMockData();

// ========== PROJECTS ==========

// GET /api/projects
router.get('/projects', (req, res) => {
  try {
    const { status, search, page = '1', limit = '20' } = req.query;
    
    const offset = (parseInt(page as string) - 1) * parseInt(limit as string);
    
    const { data, total } = projectStore.findAll({
      status: status as string,
      limit: parseInt(limit as string),
      offset
    });

    res.json({
      success: true,
      data,
      pagination: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total,
        total_pages: Math.ceil(total / parseInt(limit as string))
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/projects
router.post('/projects', (req, res) => {
  try {
    const project = projectStore.create(req.body);
    res.json({ success: true, data: project });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/projects/:id
router.get('/projects/:id', (req, res) => {
  try {
    const project = projectStore.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ success: false, error: 'Project not found' });
    }
    res.json({ success: true, data: project });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// PATCH /api/projects/:id
router.patch('/projects/:id', (req, res) => {
  try {
    const project = projectStore.update(req.params.id, req.body);
    if (!project) {
      return res.status(404).json({ success: false, error: 'Project not found' });
    }
    res.json({ success: true, data: project });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// DELETE /api/projects/:id
router.delete('/projects/:id', (req, res) => {
  try {
    const deleted = projectStore.delete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ success: false, error: 'Project not found' });
    }
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/projects/:id/episodes
router.get('/projects/:id/episodes', (req, res) => {
  try {
    const project = projectStore.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ success: false, error: 'Project not found' });
    }
    
    const episodes = projectStore.getEpisodes(req.params.id);
    res.json({ success: true, data: episodes });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/projects/:id/episodes
router.post('/projects/:id/episodes', (req, res) => {
  try {
    const project = projectStore.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ success: false, error: 'Project not found' });
    }
    
    const episode = episodeStore.create({
      ...req.body,
      project_id: req.params.id
    });
    
    res.json({ success: true, data: episode });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/projects/:id/stats
router.get('/projects/:id/stats', (req, res) => {
  try {
    const stats = statsStore.getProjectStats(req.params.id);
    if (!stats) {
      return res.status(404).json({ success: false, error: 'Project not found' });
    }
    res.json({ success: true, data: stats });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ========== EPISODES ==========

// GET /api/episodes
router.get('/episodes', (req, res) => {
  try {
    const { status, step, workflow_step, workflow_status, project_id, search, page = '1', limit = '20' } = req.query;
    
    const offset = (parseInt(page as string) - 1) * parseInt(limit as string);
    
    const { data, total } = episodeStore.findAll({
      status: status as string,
      workflow_step: (workflow_step as string) || (step as string),
      workflow_status: workflow_status as string,
      project_id: project_id as string,
      search: search as string,
      limit: parseInt(limit as string),
      offset
    });

    res.json({
      success: true,
      data,
      pagination: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total,
        total_pages: Math.ceil(total / parseInt(limit as string))
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/episodes/waiting-approval
router.get('/episodes/waiting-approval', (req, res) => {
  try {
    const { data, total } = episodeStore.findWaitingApproval();
    res.json({ success: true, data, total });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/episodes
router.post('/episodes', (req, res) => {
  try {
    const episode = episodeStore.create(req.body);
    res.json({ success: true, data: episode });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/episodes/:id
router.get('/episodes/:id', (req, res) => {
  try {
    const episode = episodeStore.findById(req.params.id);
    if (!episode) {
      return res.status(404).json({ success: false, error: 'Episode not found' });
    }
    res.json({ success: true, data: episode });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// PATCH /api/episodes/:id
router.patch('/episodes/:id', (req, res) => {
  try {
    const episode = episodeStore.update(req.params.id, req.body);
    if (!episode) {
      return res.status(404).json({ success: false, error: 'Episode not found' });
    }
    res.json({ success: true, data: episode });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// DELETE /api/episodes/:id
router.delete('/episodes/:id', (req, res) => {
  try {
    const deleted = episodeStore.delete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ success: false, error: 'Episode not found' });
    }
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/episodes/:id/workflow
router.get('/episodes/:id/workflow', (req, res) => {
  try {
    const episode = episodeStore.findById(req.params.id);
    if (!episode) {
      return res.status(404).json({ success: false, error: 'Episode not found' });
    }
    
    const workflowSteps = ['idea', 'script', 'scenes', 'images', 'voice', 'music', 'subtitles', 'animation', 'assembly', 'final'];
    const currentIndex = workflowSteps.indexOf(episode.workflow_step);

    res.json({
      success: true,
      data: {
        current_step: episode.workflow_step,
        status: episode.workflow_status,
        progress: episode.workflow_progress,
        can_advance: episode.workflow_status === 'processing' && currentIndex < workflowSteps.length - 1,
        history: []
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/episodes/:id/workflow/advance
router.post('/episodes/:id/workflow/advance', (req, res) => {
  try {
    const episode = episodeStore.advanceWorkflow(req.params.id);
    if (!episode) {
      return res.status(404).json({ success: false, error: 'Episode not found' });
    }
    res.json({ success: true, data: episode });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ========== APPROVAL ==========

// GET /api/approval/episodes/:id/logs
router.get('/approval/episodes/:id/logs', (req, res) => {
  try {
    const logs = approvalStore.getLogs(req.params.id);
    res.json({ success: true, data: logs });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/approval/episodes/:id/:step
router.post('/approval/episodes/:id/:step', (req, res) => {
  try {
    const { action, comment } = req.body;
    const { id, step } = req.params;
    
    // Add approval log
    approvalStore.addLog(id, { step: step as ApprovalLog['step'], action, comment });

    // Update episode status
    if (action === 'approved') {
      episodeStore.update(id, {
        workflow_status: 'processing',
        status: 'processing'
      });
    } else if (action === 'rejected') {
      episodeStore.update(id, {
        workflow_status: 'rejected'
      });
    }
    
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/approval/pending-count
router.get('/approval/pending-count', (req, res) => {
  try {
    const result = approvalStore.getPendingCount();
    res.json({ success: true, data: result });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ========== DASHBOARD STATS ==========

router.get('/stats/dashboard', (req, res) => {
  try {
    const stats = statsStore.getDashboardStats();
    res.json({ success: true, data: stats });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;

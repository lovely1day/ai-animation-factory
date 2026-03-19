// Mock Data Store for API - runs without Supabase
import { Episode, Project, ApprovalLog } from '@ai-animation-factory/shared';

// In-memory storage
const projects: Map<string, Project> = new Map();
const episodes: Map<string, Episode> = new Map();
const approvalLogs: Map<string, ApprovalLog[]> = new Map();

let projectIdCounter = 1;
let episodeIdCounter = 1;
let logIdCounter = 1;

// Sample data generator
function generateId(prefix: string, counter: number): string {
  return `${prefix}_${Date.now()}_${counter}`;
}

// Initialize with sample data
export function initializeMockData() {
  console.log('🎭 Mock Mode: Initializing sample data...');

  // Create sample project
  const projectId = generateId('proj', projectIdCounter++);
  const sampleProject: Project = {
    id: projectId,
    title: 'مغامرات الفضاء',
    description: 'مسلسل كرتوني عن رحلة فضائية مثيرة',
    genre: 'adventure',
    target_audience: 'children',
    status: 'active',
    workflow_settings: {
      approval_steps: ['script', 'images'],
      auto_publish: false,
      default_scene_count: 8,
      default_video_quality: 'hd'
    },
    stats: {
      total_episodes: 0,
      completed_episodes: 0,
      in_progress_episodes: 0,
      waiting_approval_episodes: 0,
      total_duration_seconds: 0,
      total_views: 0,
      total_likes: 0
    },
    progress: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  projects.set(projectId, sampleProject);

  // Create sample episodes
  const episodeStatuses: Array<{status: string, step: string, progress: number}> = [
    { status: 'completed', step: 'final', progress: 100 },
    { status: 'waiting_approval', step: 'images', progress: 45 },
    { status: 'processing', step: 'script', progress: 15 }
  ];

  episodeStatuses.forEach((ep, index) => {
    const episodeId = generateId('ep', episodeIdCounter++);
    const episode: Episode = {
      id: episodeId,
      project_id: projectId,
      title: `الحلقة ${index + 1}: ${['الانطلاق', 'اكتشاف المريخ', 'رحلة العودة'][index]}`,
      description: `وصف الحلقة ${index + 1}`,
      idea: 'فكرة الحلقة عن الفضاء',
      genre: 'adventure',
      status: ep.status as any,
      workflow_step: ep.step as any,
      workflow_status: ep.status === 'waiting_approval' ? 'waiting_approval' :
                      ep.status === 'completed' ? 'completed' : 'processing',
      workflow_progress: ep.progress,
      episode_number: index + 1,
      season_number: 1,
      view_count: Math.floor(Math.random() * 10000),
      like_count: Math.floor(Math.random() * 1000),
      share_count: 0,
      approval_steps: ['script', 'images'],
      approvals_log: [],
      tags: ['فضاء', 'مغامرة'],
      createdAt: new Date(Date.now() - index * 86400000).toISOString(),
      updatedAt: new Date().toISOString()
    };
    episodes.set(episodeId, episode);
  });

  // Update project stats
  sampleProject.stats.total_episodes = 3;
  sampleProject.stats.completed_episodes = 1;

  console.log(`✅ Mock Mode: Created ${projects.size} projects, ${episodes.size} episodes`);
}

// Project operations
export const projectStore = {
  findAll(options?: { status?: string; limit?: number; offset?: number }) {
    let result = Array.from(projects.values());

    if (options?.status) {
      result = result.filter(p => p.status === options.status);
    }

    const total = result.length;

    if (options?.offset) {
      result = result.slice(options.offset);
    }
    if (options?.limit) {
      result = result.slice(0, options.limit);
    }

    return { data: result, total };
  },

  findById(id: string) {
    return projects.get(id);
  },

  create(data: Partial<Project>) {
    const id = generateId('proj', projectIdCounter++);
    const project: Project = {
      id,
      title: data.title || 'مشروع بدون عنوان',
      description: data.description,
      genre: data.genre,
      target_audience: data.target_audience,
      status: data.status || 'draft',
      workflow_settings: data.workflow_settings || {
        approval_steps: ['script', 'images'],
        auto_publish: false,
        default_scene_count: 8,
        default_video_quality: 'hd'
      },
      stats: {
        total_episodes: 0,
        completed_episodes: 0,
        in_progress_episodes: 0,
        waiting_approval_episodes: 0,
        total_duration_seconds: 0,
        total_views: 0,
        total_likes: 0
      },
      progress: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    projects.set(id, project);
    return project;
  },

  update(id: string, data: Partial<Project>) {
    const project = projects.get(id);
    if (!project) return null;

    Object.assign(project, data, { updatedAt: new Date().toISOString() });
    return project;
  },

  delete(id: string) {
    return projects.delete(id);
  },

  getEpisodes(projectId: string) {
    return Array.from(episodes.values()).filter(e => e.project_id === projectId);
  }
};

// Episode operations
export const episodeStore = {
  findAll(options?: {
    status?: string;
    workflow_step?: string;
    workflow_status?: string;
    project_id?: string;
    limit?: number;
    offset?: number;
    search?: string;
  }) {
    let result = Array.from(episodes.values()).map(e => {
      const project = projects.get(e.project_id || '');
      return {
        ...e,
        project_title: project?.title || 'غير معروف'
      };
    });

    if (options?.status) {
      result = result.filter(e => e.status === options.status);
    }
    if (options?.workflow_step) {
      result = result.filter(e => e.workflow_step === options.workflow_step);
    }
    if (options?.workflow_status) {
      result = result.filter(e => e.workflow_status === options.workflow_status);
    }
    if (options?.project_id) {
      result = result.filter(e => e.project_id === options.project_id);
    }
    if (options?.search) {
      const search = options.search.toLowerCase();
      result = result.filter(e =>
        e.title.toLowerCase().includes(search) ||
        e.description?.toLowerCase().includes(search)
      );
    }

    const total = result.length;

    if (options?.offset) {
      result = result.slice(options.offset);
    }
    if (options?.limit) {
      result = result.slice(0, options.limit);
    }

    return { data: result, total };
  },

  findById(id: string) {
    const episode = episodes.get(id);
    if (!episode) return null;

    const project = projects.get(episode.project_id || '');
    return {
      ...episode,
      project_title: project?.title || 'غير معروف'
    };
  },

  findWaitingApproval() {
    return this.findAll({ workflow_status: 'waiting_approval' });
  },

  create(data: Partial<Episode>) {
    const id = generateId('ep', episodeIdCounter++);
    const episode: Episode = {
      id,
      project_id: data.project_id || '',
      title: data.title || 'حلقة بدون عنوان',
      description: data.description,
      idea: data.idea,
      genre: data.genre,
      status: 'draft',
      workflow_step: 'idea',
      workflow_status: 'processing',
      workflow_progress: 0,
      view_count: 0,
      like_count: 0,
      share_count: 0,
      approval_steps: [],
      approvals_log: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    episodes.set(id, episode);
    return episode;
  },

  update(id: string, data: Partial<Episode>) {
    const episode = episodes.get(id);
    if (!episode) return null;

    Object.assign(episode, data, { updatedAt: new Date().toISOString() });
    return episode;
  },

  delete(id: string) {
    return episodes.delete(id);
  },

  advanceWorkflow(id: string) {
    const episode = episodes.get(id);
    if (!episode) return null;

    const workflowSteps = ['idea', 'script', 'scenes', 'images', 'voice', 'music', 'subtitles', 'animation', 'assembly', 'final'];
    const currentIndex = workflowSteps.indexOf(episode.workflow_step);

    if (currentIndex < workflowSteps.length - 1) {
      episode.workflow_step = workflowSteps[currentIndex + 1] as any;
      episode.workflow_progress = Math.min(100, ((currentIndex + 2) / workflowSteps.length) * 100);

      // Check if approval needed
      const project = projects.get(episode.project_id || '');
      const needsApproval = project?.workflow_settings?.approval_steps?.includes(episode.workflow_step as any);

      if (needsApproval) {
        episode.workflow_status = 'waiting_approval';
      } else if (episode.workflow_step === 'final') {
        episode.workflow_status = 'completed';
        episode.status = 'completed';
      }

      episode.updatedAt = new Date().toISOString();
    }

    return episode;
  }
};

// Approval operations
export const approvalStore = {
  getLogs(episodeId: string) {
    return approvalLogs.get(episodeId) || [];
  },

  addLog(episodeId: string, log: Partial<ApprovalLog>) {
    const logs = approvalLogs.get(episodeId) || [];
    const newLog: ApprovalLog = {
      id: generateId('log', logIdCounter++),
      step: (log.step || 'script') as ApprovalLog['step'],
      action: log.action || 'approved',
      comment: log.comment,
      approved_by: log.approved_by || 'system',
      approved_by_name: log.approved_by_name || 'النظام',
      created_at: new Date().toISOString()
    };
    logs.push(newLog);
    approvalLogs.set(episodeId, logs);
    return newLog;
  },

  getPendingCount() {
    const waiting = Array.from(episodes.values()).filter(
      e => e.workflow_status === 'waiting_approval'
    );

    // Group by step
    const byStep = waiting.reduce((acc: any[], ep) => {
      const existing = acc.find(s => s.workflow_step === ep.workflow_step);
      if (existing) {
        existing.count++;
      } else {
        acc.push({ workflow_step: ep.workflow_step, count: 1 });
      }
      return acc;
    }, []);

    return {
      total: waiting.length,
      by_step: byStep
    };
  }
};

// Stats
export const statsStore = {
  getDashboardStats() {
    const allEpisodes = Array.from(episodes.values());

    return {
      total_episodes: allEpisodes.length,
      published_episodes: allEpisodes.filter(e => e.status === 'published').length,
      total_views: allEpisodes.reduce((sum, e) => sum + (e.view_count || 0), 0),
      total_likes: allEpisodes.reduce((sum, e) => sum + (e.like_count || 0), 0),
      generating_episodes: allEpisodes.filter(e => e.status === 'generating').length,
      draft_episodes: allEpisodes.filter(e => e.status === 'draft').length,
      top_episodes: allEpisodes
        .sort((a, b) => (b.view_count || 0) - (a.view_count || 0))
        .slice(0, 5)
        .map(e => ({ id: e.id, title: e.title, view_count: e.view_count || 0 }))
    };
  },

  getProjectStats(projectId: string) {
    const project = projects.get(projectId);
    if (!project) return null;

    const projectEpisodes = Array.from(episodes.values())
      .filter(e => e.project_id === projectId);

    return {
      total_episodes: projectEpisodes.length,
      completed_episodes: projectEpisodes.filter(e => e.status === 'completed').length,
      in_progress_episodes: projectEpisodes.filter(e => e.workflow_status === 'processing').length,
      waiting_approval_episodes: projectEpisodes.filter(e => e.workflow_status === 'waiting_approval').length,
      total_duration_seconds: projectEpisodes.reduce((sum, e) => sum + (e.duration_seconds || 0), 0),
      total_views: projectEpisodes.reduce((sum, e) => sum + (e.view_count || 0), 0),
      total_likes: projectEpisodes.reduce((sum, e) => sum + (e.like_count || 0), 0)
    };
  }
};

// Reset function for testing
export function resetMockData() {
  projects.clear();
  episodes.clear();
  approvalLogs.clear();
  projectIdCounter = 1;
  episodeIdCounter = 1;
  logIdCounter = 1;
  initializeMockData();
}

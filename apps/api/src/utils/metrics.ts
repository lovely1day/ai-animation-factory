interface Metrics {
  episodesCreated: number;
  episodesFailed: number;
  averageGenerationTime: number;
  apiRequests: number;
  activeUsers: number;
}

class MetricsCollector {
  private metrics: Metrics = {
    episodesCreated: 0,
    episodesFailed: 0,
    averageGenerationTime: 0,
    apiRequests: 0,
    activeUsers: 0
  };

  increment(metric: keyof Metrics) {
    this.metrics[metric]++;
  }

  set(metric: keyof Metrics, value: number) {
    this.metrics[metric] = value;
  }

  getAll(): Metrics {
    return { ...this.metrics };
  }

  reset() {
    this.metrics = {
      episodesCreated: 0,
      episodesFailed: 0,
      averageGenerationTime: 0,
      apiRequests: 0,
      activeUsers: 0
    };
  }
}

export const metrics = new MetricsCollector();

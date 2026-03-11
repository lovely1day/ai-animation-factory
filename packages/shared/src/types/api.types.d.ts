export interface ApiResponse<T = unknown> {
    success: boolean;
    data?: T;
    error?: string;
    message?: string;
    pagination?: PaginationMeta;
}
export interface PaginationMeta {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
    has_next: boolean;
    has_prev: boolean;
}
export interface PaginationQuery {
    page?: number;
    limit?: number;
    sort?: string;
    order?: 'asc' | 'desc';
}
export interface EpisodeListQuery extends PaginationQuery {
    status?: string;
    genre?: string;
    target_audience?: string;
    search?: string;
    tags?: string;
}
export interface AnalyticsQuery {
    episode_id?: string;
    event_type?: string;
    from?: string;
    to?: string;
}
export interface AnalyticsSummary {
    total_views: number;
    total_likes: number;
    total_episodes: number;
    published_episodes: number;
    avg_watch_duration: number;
    views_by_genre: Record<string, number>;
    views_by_day: Array<{
        date: string;
        views: number;
    }>;
    top_episodes: Array<{
        id: string;
        title: string;
        views: number;
    }>;
}
//# sourceMappingURL=api.types.d.ts.map
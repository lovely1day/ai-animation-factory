export declare function sleep(ms: number): Promise<void>;
export declare function slugify(text: string): string;
export declare function generateJobId(type: string, episodeId: string): string;
export declare function formatDuration(seconds: number): string;
export declare function parseError(error: unknown): string;
export declare function chunkArray<T>(array: T[], size: number): T[][];
export declare function retry<T>(fn: () => Promise<T>, attempts: number, delayMs?: number): Promise<T>;
export declare const GENRES: readonly ["adventure", "comedy", "drama", "sci-fi", "fantasy", "horror", "romance", "thriller", "educational", "mystery"];
export declare const AUDIENCES: readonly ["children", "teens", "adults", "general"];
export declare const JOB_QUEUE_NAMES: {
    readonly IDEA: "idea-generation";
    readonly SCRIPT: "script-writing";
    readonly IMAGE: "image-generation";
    readonly ANIMATION: "animation";
    readonly VOICE: "voice-generation";
    readonly MUSIC: "music-generation";
    readonly ASSEMBLY: "video-assembly";
    readonly SUBTITLE: "subtitle-generation";
    readonly THUMBNAIL: "thumbnail-generation";
};
//# sourceMappingURL=index.d.ts.map
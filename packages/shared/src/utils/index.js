"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.JOB_QUEUE_NAMES = exports.AUDIENCES = exports.GENRES = void 0;
exports.sleep = sleep;
exports.slugify = slugify;
exports.generateJobId = generateJobId;
exports.formatDuration = formatDuration;
exports.parseError = parseError;
exports.chunkArray = chunkArray;
exports.retry = retry;
function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
function slugify(text) {
    return text
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
}
function generateJobId(type, episodeId) {
    return `${type}:${episodeId}:${Date.now()}`;
}
function formatDuration(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}
function parseError(error) {
    if (error instanceof Error)
        return error.message;
    if (typeof error === 'string')
        return error;
    return 'An unknown error occurred';
}
function chunkArray(array, size) {
    const chunks = [];
    for (let i = 0; i < array.length; i += size) {
        chunks.push(array.slice(i, i + size));
    }
    return chunks;
}
function retry(fn, attempts, delayMs = 1000) {
    return fn().catch(async (err) => {
        if (attempts <= 1)
            throw err;
        await sleep(delayMs);
        return retry(fn, attempts - 1, delayMs * 2);
    });
}
exports.GENRES = [
    'adventure', 'comedy', 'drama', 'sci-fi', 'fantasy',
    'horror', 'romance', 'thriller', 'educational', 'mystery'
];
exports.AUDIENCES = ['children', 'teens', 'adults', 'general'];
exports.JOB_QUEUE_NAMES = {
    IDEA: 'idea-generation',
    SCRIPT: 'script-writing',
    IMAGE: 'image-generation',
    ANIMATION: 'animation',
    VOICE: 'voice-generation',
    MUSIC: 'music-generation',
    ASSEMBLY: 'video-assembly',
    SUBTITLE: 'subtitle-generation',
    THUMBNAIL: 'thumbnail-generation',
};
//# sourceMappingURL=index.js.map
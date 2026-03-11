'use client';
import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Subtitles,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { formatDuration } from '@/lib/utils';

interface VideoPlayerProps {
  src: string;
  poster?: string;
  subtitleUrl?: string;
  title?: string;
}

interface SubtitleCue {
  start: number;
  end: number;
  text: string;
}

function parseSRT(srt: string): SubtitleCue[] {
  const cues: SubtitleCue[] = [];
  const blocks = srt.trim().split(/\n\s*\n/);
  for (const block of blocks) {
    const lines = block.trim().split('\n');
    if (lines.length < 3) continue;
    const timeLine = lines[1];
    const timeMatch = timeLine.match(
      /(\d{2}):(\d{2}):(\d{2}),(\d{3})\s*-->\s*(\d{2}):(\d{2}):(\d{2}),(\d{3})/
    );
    if (!timeMatch) continue;
    const toSec = (h: string, m: string, s: string, ms: string) =>
      parseInt(h) * 3600 + parseInt(m) * 60 + parseInt(s) + parseInt(ms) / 1000;
    const start = toSec(timeMatch[1], timeMatch[2], timeMatch[3], timeMatch[4]);
    const end = toSec(timeMatch[5], timeMatch[6], timeMatch[7], timeMatch[8]);
    const text = lines.slice(2).join('\n');
    cues.push({ start, end, text });
  }
  return cues;
}

export function VideoPlayer({ src, poster, subtitleUrl, title }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const progressFillRef = useRef<HTMLDivElement>(null);
  const volumeFillRef = useRef<HTMLDivElement>(null);
  const hideControlsTimer = useRef<ReturnType<typeof setTimeout>>();

  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const [showSubtitles, setShowSubtitles] = useState(true);
  const [buffering, setBuffering] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [subtitleCues, setSubtitleCues] = useState<SubtitleCue[]>([]);
  const [activeSubtitle, setActiveSubtitle] = useState<string | null>(null);
  const [isDraggingProgress, setIsDraggingProgress] = useState(false);

  // Imperatively update fill bar widths to avoid inline style= props
  useEffect(() => {
    if (progressFillRef.current) {
      progressFillRef.current.style.width = `${duration > 0 ? (currentTime / duration) * 100 : 0}%`;
    }
  }, [currentTime, duration]);

  useEffect(() => {
    if (volumeFillRef.current) {
      volumeFillRef.current.style.width = `${(muted ? 0 : volume) * 100}%`;
    }
  }, [volume, muted]);

  // Load SRT subtitles
  useEffect(() => {
    if (!subtitleUrl) return;
    fetch(subtitleUrl)
      .then((r) => r.text())
      .then((text) => setSubtitleCues(parseSRT(text)))
      .catch(() => {});
  }, [subtitleUrl]);

  // Update active subtitle cue
  useEffect(() => {
    if (!showSubtitles || subtitleCues.length === 0) {
      setActiveSubtitle(null);
      return;
    }
    const cue = subtitleCues.find((c) => currentTime >= c.start && currentTime <= c.end);
    setActiveSubtitle(cue ? cue.text : null);
  }, [currentTime, subtitleCues, showSubtitles]);

  // Video event listeners
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const onTimeUpdate = () => setCurrentTime(video.currentTime);
    const onDurationChange = () => setDuration(video.duration);
    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    const onWaiting = () => setBuffering(true);
    const onCanPlay = () => setBuffering(false);
    const onError = () => setError('Failed to load video. Please try again.');

    video.addEventListener('timeupdate', onTimeUpdate);
    video.addEventListener('durationchange', onDurationChange);
    video.addEventListener('play', onPlay);
    video.addEventListener('pause', onPause);
    video.addEventListener('waiting', onWaiting);
    video.addEventListener('canplay', onCanPlay);
    video.addEventListener('error', onError);

    return () => {
      video.removeEventListener('timeupdate', onTimeUpdate);
      video.removeEventListener('durationchange', onDurationChange);
      video.removeEventListener('play', onPlay);
      video.removeEventListener('pause', onPause);
      video.removeEventListener('waiting', onWaiting);
      video.removeEventListener('canplay', onCanPlay);
      video.removeEventListener('error', onError);
    };
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      if (e.code === 'Space') {
        e.preventDefault();
        togglePlay();
      } else if (e.code === 'KeyF') {
        toggleFullscreen();
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        seek(-10);
      } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        seek(10);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [playing]); // eslint-disable-line react-hooks/exhaustive-deps

  const resetHideTimer = useCallback(() => {
    setShowControls(true);
    clearTimeout(hideControlsTimer.current);
    hideControlsTimer.current = setTimeout(() => {
      setShowControls(false);
    }, 3000);
  }, []);

  const togglePlay = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    playing ? video.pause() : video.play();
  }, [playing]);

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !muted;
    setMuted(!muted);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = parseFloat(e.target.value);
    if (videoRef.current) videoRef.current.volume = v;
    setVolume(v);
    setMuted(v === 0);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const t = parseFloat(e.target.value);
    if (videoRef.current) videoRef.current.currentTime = t;
    setCurrentTime(t);
  };

  const seek = (delta: number) => {
    const video = videoRef.current;
    if (!video) return;
    const t = Math.max(0, Math.min(duration, video.currentTime + delta));
    video.currentTime = t;
    setCurrentTime(t);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  };

  // Error state
  if (error) {
    return (
      <div className="relative w-full aspect-video rounded-2xl overflow-hidden bg-slate-900 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-center px-6">
          <div className="w-14 h-14 rounded-full bg-red-500/10 flex items-center justify-center">
            <AlertCircle className="w-7 h-7 text-red-400" />
          </div>
          <p className="text-white font-medium">Playback Error</p>
          <p className="text-gray-400 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="relative w-full aspect-video rounded-2xl overflow-hidden bg-black group select-none"
      onMouseMove={resetHideTimer}
      onMouseLeave={() => setShowControls(false)}
      onMouseEnter={() => setShowControls(true)}
    >
      {/* Video element */}
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        className="w-full h-full object-cover cursor-pointer"
        onClick={togglePlay}
        crossOrigin="anonymous"
      />

      {/* Buffering spinner */}
      {buffering && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-14 h-14 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center">
            <Loader2 className="w-7 h-7 text-purple-400 animate-spin" />
          </div>
        </div>
      )}

      {/* Center play/pause click target (big area) */}
      {!playing && !buffering && (
        <button
          type="button"
          onClick={togglePlay}
          className="absolute inset-0 flex items-center justify-center"
          aria-label="Play"
        >
          <div className="w-20 h-20 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 flex items-center justify-center shadow-2xl shadow-purple-900/50 hover:scale-110 transition-transform duration-200">
            <Play className="w-9 h-9 text-white fill-white ml-1" />
          </div>
        </button>
      )}

      {/* Subtitle overlay */}
      {activeSubtitle && (
        <div className="absolute bottom-24 left-0 right-0 flex justify-center pointer-events-none px-8">
          <span className="bg-black/70 text-white text-sm px-3 py-1.5 rounded-lg leading-relaxed text-center max-w-2xl backdrop-blur-sm">
            {activeSubtitle}
          </span>
        </div>
      )}

      {/* Controls overlay */}
      <div
        className={`absolute inset-0 flex flex-col justify-end transition-opacity duration-300 pointer-events-none ${
          showControls ? 'opacity-100' : 'opacity-0'
        }`}
      >
        {/* Gradient backdrop */}
        <div className="bg-gradient-to-t from-black/80 via-black/20 to-transparent pt-16 px-4 pb-4 space-y-3 pointer-events-auto">
          {/* Title */}
          {title && (
            <p className="text-white text-sm font-medium truncate drop-shadow">{title}</p>
          )}

          {/* Progress bar */}
          <div className="relative group/seek">
            <div className="w-full h-1 bg-white/20 rounded-full overflow-hidden cursor-pointer hover:h-1.5 transition-all duration-150">
              {/* Buffered track */}
              <div className="absolute inset-0 bg-white/10 rounded-full" />
              {/* Played track — width set imperatively via progressFillRef */}
              <div
                ref={progressFillRef}
                className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-[width] duration-100"
              />
            </div>
            {/* Hidden range input for interaction */}
            <input
              type="range"
              min={0}
              max={duration || 100}
              value={currentTime}
              step={0.1}
              onChange={handleSeek}
              onMouseDown={() => setIsDraggingProgress(true)}
              onMouseUp={() => setIsDraggingProgress(false)}
              className="absolute inset-0 w-full opacity-0 cursor-pointer h-4 -top-1.5"
              aria-label="Seek"
            />
          </div>

          {/* Controls row */}
          <div className="flex items-center justify-between gap-3">
            {/* Left controls */}
            <div className="flex items-center gap-3">
              {/* Play/Pause */}
              <button
                type="button"
                onClick={togglePlay}
                className="w-9 h-9 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 flex items-center justify-center hover:scale-110 transition-transform flex-shrink-0 shadow-lg"
                aria-label={playing ? 'Pause' : 'Play'}
              >
                {playing ? (
                  <Pause className="w-4 h-4 text-white fill-white" />
                ) : (
                  <Play className="w-4 h-4 text-white fill-white ml-0.5" />
                )}
              </button>

              {/* Volume */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={toggleMute}
                  className="text-gray-300 hover:text-white transition-colors"
                  aria-label={muted ? 'Unmute' : 'Mute'}
                >
                  {muted || volume === 0 ? (
                    <VolumeX className="w-4 h-4" />
                  ) : (
                    <Volume2 className="w-4 h-4" />
                  )}
                </button>
                <div className="relative w-20 h-4 flex items-center">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full h-1 bg-white/20 rounded-full overflow-hidden">
                      {/* width set imperatively via volumeFillRef */}
                      <div
                        ref={volumeFillRef}
                        className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"
                      />
                    </div>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.05}
                    value={muted ? 0 : volume}
                    onChange={handleVolumeChange}
                    className="absolute inset-0 w-full opacity-0 cursor-pointer"
                    aria-label="Volume"
                  />
                </div>
              </div>

              {/* Time */}
              <span className="text-gray-300 text-xs font-mono tabular-nums">
                {formatDuration(Math.floor(currentTime))} /{' '}
                {formatDuration(Math.floor(duration))}
              </span>
            </div>

            {/* Right controls */}
            <div className="flex items-center gap-2">
              {subtitleUrl && (
                <button
                  type="button"
                  onClick={() => setShowSubtitles(!showSubtitles)}
                  className={`transition-colors p-1 rounded ${
                    showSubtitles
                      ? 'text-white bg-white/20'
                      : 'text-gray-400 hover:text-white'
                  }`}
                  aria-label="Toggle subtitles"
                  title="Subtitles"
                >
                  <Subtitles className="w-4 h-4" />
                </button>
              )}
              <button
                type="button"
                onClick={toggleFullscreen}
                className="text-gray-300 hover:text-white transition-colors p-1 rounded hover:bg-white/10"
                aria-label="Fullscreen"
                title="Fullscreen (F)"
              >
                <Maximize className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

import React, { useEffect, useRef, useState } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  Download,
  Check,
  Copy,
  Sparkles,
  Radio,
} from 'lucide-react';

interface AudioPlayerProps {
  audioUrl: string | null;
  voiceName: string;
  mode: 'single' | 'multi';
  text: string;
  estimatedDuration?: number;
}

export const AudioPlayer: React.FC<AudioPlayerProps> = ({
  audioUrl,
  voiceName,
  mode,
  text,
  estimatedDuration = 0,
}) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(estimatedDuration || 0);
  const [playbackRate, setPlaybackRate] = useState<number>(1.0);
  const [volume, setVolume] = useState<number>(1.0);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  // Reset state when audioUrl changes
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      setCurrentTime(0);
      setIsPlaying(false);
      if (audioUrl) {
        audioRef.current.src = audioUrl;
        audioRef.current.load();
        // Auto play on new generation
        audioRef.current
          .play()
          .then(() => setIsPlaying(true))
          .catch(() => {
            // Autoplay policy might block without interaction, keep paused
            setIsPlaying(false);
          });
      }
    }
  }, [audioUrl]);

  // Handle duration and time updates
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleLoadedMetadata = () => {
      if (audio.duration && !isNaN(audio.duration) && isFinite(audio.duration)) {
        setDuration(audio.duration);
      } else if (estimatedDuration > 0) {
        setDuration(estimatedDuration);
      }
    };

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [estimatedDuration]);

  // Waveform canvas rendering
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    const barCount = 48;
    const barWidth = Math.max(2, (width / barCount) - 3);
    const progress = duration > 0 ? currentTime / duration : 0;

    ctx.clearRect(0, 0, width, height);

    // Deterministic pseudo-waveform based on text length and character codes
    for (let i = 0; i < barCount; i++) {
      const charCode = text ? text.charCodeAt(i % text.length) || 60 : 70;
      const seed = Math.sin(i * 0.45 + (charCode % 10)) * 0.5 + 0.5;
      const baseHeight = 8 + seed * (height - 18);
      const isPast = i / barCount <= progress;

      // Animate slightly when playing
      let animatedHeight = baseHeight;
      if (isPlaying && isPast) {
        animatedHeight += Math.sin(Date.now() * 0.008 + i) * 3;
      }
      animatedHeight = Math.max(4, Math.min(height - 4, animatedHeight));

      const x = i * (barWidth + 3);
      const y = (height - animatedHeight) / 2;

      ctx.fillStyle = isPast
        ? '#1e293b' // Active dark slate
        : '#cbd5e1'; // Inactive soft slate

      ctx.beginPath();
      // Rounded bar top and bottom
      const r = Math.min(barWidth / 2, 2);
      ctx.roundRect(x, y, barWidth, animatedHeight, r);
      ctx.fill();
    }
  }, [currentTime, duration, isPlaying, text]);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio
        .play()
        .then(() => setIsPlaying(true))
        .catch((err) => console.error('Playback error:', err));
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(e.target.value);
    setCurrentTime(newTime);
    if (audioRef.current) {
      audioRef.current.currentTime = newTime;
    }
  };

  const handleSkip = (seconds: number) => {
    if (!audioRef.current) return;
    const newTime = Math.min(
      Math.max(0, audioRef.current.currentTime + seconds),
      duration || 9999
    );
    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const handleRateChange = (rate: number) => {
    setPlaybackRate(rate);
    if (audioRef.current) {
      audioRef.current.playbackRate = rate;
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const vol = parseFloat(e.target.value);
    setVolume(vol);
    setIsMuted(vol === 0);
    if (audioRef.current) {
      audioRef.current.volume = vol;
      audioRef.current.muted = vol === 0;
    }
  };

  const toggleMute = () => {
    if (!audioRef.current) return;
    if (isMuted) {
      audioRef.current.muted = false;
      setIsMuted(false);
      audioRef.current.volume = volume || 0.7;
    } else {
      audioRef.current.muted = true;
      setIsMuted(true);
    }
  };

  const handleDownload = () => {
    if (!audioUrl) return;
    const a = document.createElement('a');
    a.href = audioUrl;
    const sanitizedTitle = (text.slice(0, 20) || 'speech')
      .replace(/[^a-zA-Z0-9]/g, '_')
      .toLowerCase();
    a.download = `${sanitizedTitle}-${voiceName.toLowerCase()}-tts.wav`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleCopyText = async () => {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  const formatTime = (secs: number) => {
    if (isNaN(secs) || !isFinite(secs)) return '0:00';
    const mins = Math.floor(secs / 60);
    const remainingSecs = Math.floor(secs % 60);
    return `${mins}:${remainingSecs < 10 ? '0' : ''}${remainingSecs}`;
  };

  if (!audioUrl) {
    return (
      <div
        id="audio-player-empty-container"
        className="rounded-xl border border-dashed border-stone-200 bg-stone-50/50 p-8 text-center"
      >
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-stone-100 text-stone-500 mb-3">
          <Radio className="h-6 w-6 stroke-[1.5]" />
        </div>
        <h3 className="text-sm font-semibold text-stone-800">
          Ready for Speech Generation
        </h3>
        <p className="mt-1 text-xs text-stone-500 max-w-sm mx-auto">
          Enter your prompt or select a sample above, choose your voice settings,
          and click generate to listen to lifelike audio.
        </p>
      </div>
    );
  }

  return (
    <div
      id="active-audio-player"
      className="rounded-xl border border-stone-200/90 bg-white p-6 shadow-xs"
    >
      <audio ref={audioRef} preload="auto" />

      {/* Header Info */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-stone-100">
        <div className="flex items-center gap-2.5">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-stone-900 text-white shadow-xs">
            <Sparkles className="h-3.5 w-3.5" />
          </span>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-stone-900">
                {voiceName}
              </span>
              <span className="inline-flex items-center rounded-full bg-stone-100 px-2 py-0.5 text-[11px] font-medium text-stone-700">
                {mode === 'multi' ? '2-Speaker Dialogue' : 'Single Speaker'}
              </span>
              <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700">
                24 kHz WAV
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            id="copy-text-btn"
            onClick={handleCopyText}
            title="Copy Prompt Text"
            className="flex h-8 items-center gap-1.5 rounded-lg border border-stone-200 px-3 text-xs font-medium text-stone-600 transition hover:bg-stone-50"
          >
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5 text-emerald-600" />
                <span>Copied</span>
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5 text-stone-500" />
                <span>Copy Text</span>
              </>
            )}
          </button>

          <button
            id="download-audio-btn"
            onClick={handleDownload}
            title="Download WAV Audio File"
            className="flex h-8 items-center gap-1.5 rounded-lg bg-stone-900 px-3 text-xs font-medium text-white shadow-xs transition hover:bg-stone-800"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Download .WAV</span>
          </button>
        </div>
      </div>

      {/* Waveform Visualization */}
      <div className="mt-5 mb-3">
        <div className="h-16 w-full rounded-lg bg-stone-50 px-3 py-1 flex items-center justify-center border border-stone-100">
          <canvas
            ref={canvasRef}
            className="h-full w-full cursor-pointer"
            onClick={togglePlay}
          />
        </div>
      </div>

      {/* Scrubber & Timeline */}
      <div className="space-y-1.5">
        <div className="relative flex items-center">
          <input
            id="audio-progress-bar"
            type="range"
            min="0"
            max={duration || 100}
            step="0.05"
            value={currentTime}
            onChange={handleSeek}
            className="w-full h-1.5 rounded-lg appearance-none bg-stone-200 accent-stone-900 cursor-pointer"
          />
        </div>

        <div className="flex items-center justify-between text-xs font-medium text-stone-500 px-0.5">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      {/* Controls Row */}
      <div className="mt-5 flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-stone-100">
        {/* Playback Primary Buttons */}
        <div className="flex items-center gap-2">
          <button
            id="replay-btn"
            onClick={() => handleSkip(-5)}
            title="Rewind 5 seconds"
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-stone-200 text-stone-600 transition hover:bg-stone-50"
          >
            <RotateCcw className="h-4 w-4" />
          </button>

          <button
            id="play-pause-btn"
            onClick={togglePlay}
            className="flex h-11 w-11 items-center justify-center rounded-xl bg-stone-900 text-white shadow-xs transition hover:bg-stone-800"
          >
            {isPlaying ? (
              <Pause className="h-5 w-5 fill-current" />
            ) : (
              <Play className="h-5 w-5 fill-current ml-0.5" />
            )}
          </button>
        </div>

        {/* Speed Selector */}
        <div className="flex items-center gap-1 bg-stone-100/80 p-1 rounded-lg border border-stone-200/60">
          {[0.75, 1.0, 1.25, 1.5, 2.0].map((rate) => (
            <button
              key={rate}
              onClick={() => handleRateChange(rate)}
              className={`rounded-md px-2 py-1 text-xs font-medium transition ${
                playbackRate === rate
                  ? 'bg-white text-stone-900 shadow-xs'
                  : 'text-stone-500 hover:text-stone-800'
              }`}
            >
              {rate}x
            </button>
          ))}
        </div>

        {/* Volume Controls */}
        <div className="flex items-center gap-2">
          <button
            id="volume-toggle-btn"
            onClick={toggleMute}
            className="text-stone-500 hover:text-stone-800 transition"
          >
            {isMuted || volume === 0 ? (
              <VolumeX className="h-4 w-4 text-stone-400" />
            ) : (
              <Volume2 className="h-4 w-4" />
            )}
          </button>
          <input
            id="volume-slider"
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={isMuted ? 0 : volume}
            onChange={handleVolumeChange}
            className="w-18 h-1.5 rounded-lg appearance-none bg-stone-200 accent-stone-900 cursor-pointer"
          />
        </div>
      </div>
    </div>
  );
};

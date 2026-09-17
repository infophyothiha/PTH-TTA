/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Volume2,
  Users,
  Mic,
  AlertCircle,
  Loader2,
  RotateCw,
  Info,
  Radio,
  Play,
  Square,
} from 'lucide-react';
import {
  VoiceName,
  SynthesisMode,
  StyleToneId,
  HistoryItem,
  TTSResponse,
} from './types';
import { VOICES, STYLES, PresetSample } from './data/voices';
import { AudioPlayer } from './components/AudioPlayer';
import { VoiceSelector } from './components/VoiceSelector';
import { StyleSelector } from './components/StyleSelector';
import { MultiSpeakerSetup } from './components/MultiSpeakerSetup';
import { PresetSamples } from './components/PresetSamples';
import { HistoryList } from './components/HistoryList';

const STORAGE_KEY = 'gemini_tts_history_v1';

export default function App() {
  const [text, setText] = useState<string>(
    'Welcome to the Gemini text to speech studio. Type or paste any message to hear it spoken with lifelike cadence, emotional inflection, and studio-grade audio fidelity.'
  );
  const [mode, setMode] = useState<SynthesisMode>('single');
  const [selectedVoice, setSelectedVoice] = useState<VoiceName>('Kore');
  const [selectedStyle, setSelectedStyle] = useState<StyleToneId>('natural');

  // Multi-speaker config
  const [speaker1Name, setSpeaker1Name] = useState<string>('Joe');
  const [speaker1Voice, setSpeaker1Voice] = useState<VoiceName>('Kore');
  const [speaker2Name, setSpeaker2Name] = useState<string>('Jane');
  const [speaker2Voice, setSpeaker2Voice] = useState<VoiceName>('Puck');

  // Generation state
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isHighDemand, setIsHighDemand] = useState<boolean>(false);
  const [isBrowserSpeaking, setIsBrowserSpeaking] = useState<boolean>(false);

  // Active audio state
  const [currentAudioUrl, setCurrentAudioUrl] = useState<string | null>(null);
  const [currentAudioText, setCurrentAudioText] = useState<string>('');
  const [currentAudioVoice, setCurrentAudioVoice] = useState<string>('Kore');
  const [currentAudioMode, setCurrentAudioMode] = useState<SynthesisMode>('single');
  const [estimatedDuration, setEstimatedDuration] = useState<number>(0);

  // History state
  const [history, setHistory] = useState<HistoryItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Health check state
  const [serverReady, setServerReady] = useState<boolean | null>(null);

  useEffect(() => {
    fetch('/api/health')
      .then((res) => res.json())
      .then((data) => {
        setServerReady(data.status === 'ok');
      })
      .catch(() => setServerReady(false));
  }, []);

  const saveHistoryItem = (item: HistoryItem) => {
    setHistory((prev) => {
      const updated = [item, ...prev.filter((p) => p.id !== item.id)].slice(0, 15);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch (e) {
        console.warn('LocalStorage save failed:', e);
      }
      return updated;
    });
  };

  const handleGenerate = async () => {
    if (!text.trim() || isLoading) return;

    setIsLoading(true);
    setErrorMessage(null);
    setIsHighDemand(false);

    try {
      const payload = {
        text: text.trim(),
        mode,
        voice: selectedVoice,
        style: selectedStyle,
        speaker1Name,
        speaker1Voice,
        speaker2Name,
        speaker2Voice,
      };

      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data: TTSResponse = await response.json();

      if (!response.ok || !data.success) {
        if (data.isHighDemand || response.status === 503) {
          setIsHighDemand(true);
        }
        throw new Error(
          data.error || 'Failed to generate speech with Gemini 3.1 Flash.'
        );
      }

      setCurrentAudioUrl(data.audioData);
      setCurrentAudioText(data.text);
      setCurrentAudioVoice(data.voice);
      setCurrentAudioMode(data.mode);
      setEstimatedDuration(data.estimatedDuration || 0);

      // Save to recent generations
      const newHistoryItem: HistoryItem = {
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
        text: data.text,
        mode: data.mode,
        voice: data.voice,
        style: selectedStyle,
        audioData: data.audioData,
        duration: data.estimatedDuration || 0,
        createdAt: data.createdAt,
      };
      saveHistoryItem(newHistoryItem);
    } catch (err: any) {
      console.error('Generation failure:', err);
      let msg = err.message || 'Speech generation encountered an error.';
      try {
        const jsonMatch = msg.match(/\{[\s\S]*"error"[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          if (parsed.error?.message) {
            msg = parsed.error.message;
          }
        }
      } catch {
        // ignore
      }

      if (
        msg.includes('503') ||
        msg.includes('high demand') ||
        msg.includes('UNAVAILABLE')
      ) {
        setIsHighDemand(true);
        msg =
          'Gemini 3.1 Flash TTS is currently experiencing peak demand. Spikes are usually temporary. Please try again in a few moments.';
      }

      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBrowserVoicePreview = () => {
    if (!('speechSynthesis' in window)) {
      alert('Browser speech synthesis is not supported on this device.');
      return;
    }

    if (isBrowserSpeaking) {
      window.speechSynthesis.cancel();
      setIsBrowserSpeaking(false);
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    const voices = window.speechSynthesis.getVoices();
    const isFemale = selectedVoice === 'Kore' || selectedVoice === 'Zephyr';

    // Best effort selection matching voice persona gender
    const matchingVoice =
      voices.find((v) =>
        isFemale
          ? /female|samantha|zira|karen|victoria|natural/i.test(v.name)
          : /male|david|alex|daniel|george/i.test(v.name)
      ) || voices[0];

    if (matchingVoice) {
      utterance.voice = matchingVoice;
    }

    utterance.rate = 1.0;
    utterance.pitch = isFemale ? 1.1 : 0.95;

    utterance.onstart = () => setIsBrowserSpeaking(true);
    utterance.onend = () => setIsBrowserSpeaking(false);
    utterance.onerror = () => setIsBrowserSpeaking(false);

    window.speechSynthesis.speak(utterance);
  };

  const handleSelectSample = (sample: PresetSample) => {
    setText(sample.text);
    setMode(sample.mode);
    if (sample.voice) {
      setSelectedVoice(sample.voice);
    }
    if (sample.style) {
      setSelectedStyle(sample.style);
    }
    if (sample.speaker1Name) setSpeaker1Name(sample.speaker1Name);
    if (sample.speaker1Voice) setSpeaker1Voice(sample.speaker1Voice);
    if (sample.speaker2Name) setSpeaker2Name(sample.speaker2Name);
    if (sample.speaker2Voice) setSpeaker2Voice(sample.speaker2Voice);
  };

  const handleInsertSampleDialogue = () => {
    setText(
      `${speaker1Name}: Did you hear the latest sample synthesized by the new Gemini TTS engine?\n${speaker2Name}: Yes, the inflection and pauses sound completely authentic!`
    );
  };

  const handleSelectHistoryItem = (item: HistoryItem) => {
    setCurrentAudioUrl(item.audioData);
    setCurrentAudioText(item.text);
    setCurrentAudioVoice(item.voice);
    setCurrentAudioMode(item.mode);
    setEstimatedDuration(item.duration);
  };

  const handleDeleteHistoryItem = (id: string) => {
    setHistory((prev) => {
      const updated = prev.filter((item) => item.id !== id);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch (e) {
        console.warn('LocalStorage save failed:', e);
      }
      return updated;
    });
  };

  const handleClearHistory = () => {
    setHistory([]);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) {
      console.warn('LocalStorage clear failed:', e);
    }
  };

  // Metrics
  const charCount = text.length;
  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;
  // Average speaking pace ~ 140 words per minute
  const approxReadingSec = Math.ceil((wordCount / 140) * 60);

  return (
    <div className="min-h-screen bg-stone-100/60 text-stone-900 flex flex-col font-sans antialiased">
      {/* Top Header */}
      <header className="sticky top-0 z-20 border-b border-stone-200/90 bg-white/95 backdrop-blur-xs">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-stone-900 text-white shadow-xs">
              <Volume2 className="h-5 w-5 stroke-[1.75]" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-semibold text-stone-950 tracking-tight">
                  Text to Speech
                </h1>
                <span className="hidden sm:inline-flex items-center rounded-md bg-stone-100 px-2 py-0.5 text-[11px] font-mono font-medium text-stone-700">
                  gemini-3.1-flash-tts-preview
                </span>
              </div>
              <p className="text-xs text-stone-500 hidden sm:block">
                Lifelike neural speech synthesis with voice personas & multi-speaker dialogue
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="flex items-center gap-1.5 rounded-full border border-stone-200 bg-stone-50 px-2.5 py-1 text-xs font-medium text-stone-600">
              <span
                className={`h-2 w-2 rounded-full ${
                  serverReady === true
                    ? 'bg-emerald-500 animate-pulse'
                    : serverReady === false
                    ? 'bg-amber-500'
                    : 'bg-stone-300'
                }`}
              />
              <span className="text-[11px]">
                {serverReady === true ? 'TTS Engine Ready' : 'Connecting...'}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
        {/* Error Alert */}
        {errorMessage && (
          <div
            id="error-alert-banner"
            className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border p-4 text-xs shadow-xs ${
              isHighDemand
                ? 'border-amber-200 bg-amber-50/90 text-amber-900'
                : 'border-rose-200 bg-rose-50/90 text-rose-900'
            }`}
          >
            <div className="flex items-start gap-3">
              <AlertCircle
                className={`h-4 w-4 shrink-0 mt-0.5 ${
                  isHighDemand ? 'text-amber-600' : 'text-rose-600'
                }`}
              />
              <div>
                <strong className="font-semibold block mb-0.5">
                  {isHighDemand
                    ? 'Model Peak Demand Notice'
                    : 'Synthesis Notice'}
                </strong>
                <span className="leading-relaxed">{errorMessage}</span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 sm:shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-amber-200/60">
              <button
                type="button"
                id="retry-synthesis-btn"
                disabled={isLoading}
                onClick={handleGenerate}
                className="inline-flex items-center gap-1.5 rounded-lg bg-stone-900 px-3 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-stone-800 disabled:opacity-50 transition"
              >
                <RotateCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                <span>Retry Gemini 3.1 Flash</span>
              </button>

              <button
                type="button"
                id="browser-voice-preview-btn"
                onClick={handleBrowserVoicePreview}
                className="inline-flex items-center gap-1.5 rounded-lg border border-stone-300 bg-white px-3 py-1.5 text-xs font-semibold text-stone-800 hover:bg-stone-50 transition"
              >
                {isBrowserSpeaking ? (
                  <>
                    <Square className="h-3 w-3 fill-current text-rose-600" />
                    <span>Stop Preview</span>
                  </>
                ) : (
                  <>
                    <Play className="h-3 w-3 fill-current" />
                    <span>Instant Voice Preview</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => setErrorMessage(null)}
                className="text-stone-500 hover:text-stone-800 text-xs px-2 py-1"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}

        {/* Top Control Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Input Form (7 cols) */}
          <div className="lg:col-span-7 space-y-5">
            {/* Mode Tabs */}
            <div className="flex items-center justify-between border-b border-stone-200 pb-3">
              <div className="flex items-center gap-1 bg-stone-200/60 p-1 rounded-xl">
                <button
                  type="button"
                  id="mode-tab-single"
                  onClick={() => setMode('single')}
                  className={`flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition ${
                    mode === 'single'
                      ? 'bg-white text-stone-900 shadow-xs'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  <Mic className="h-3.5 w-3.5" />
                  <span>Single Speaker</span>
                </button>

                <button
                  type="button"
                  id="mode-tab-multi"
                  onClick={() => setMode('multi')}
                  className={`flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition ${
                    mode === 'multi'
                      ? 'bg-white text-stone-900 shadow-xs'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  <Users className="h-3.5 w-3.5" />
                  <span>Multi-Speaker Dialogue</span>
                </button>
              </div>

              <span className="text-[11px] text-stone-500 hidden sm:inline">
                {mode === 'single' ? '5 Prebuilt Voices' : '2-Speaker Interleaved'}
              </span>
            </div>

            {/* Presets Bar */}
            <PresetSamples
              onSelectSample={handleSelectSample}
              disabled={isLoading}
            />

            {/* Voice or Multi-Speaker Config */}
            {mode === 'single' ? (
              <>
                <VoiceSelector
                  voices={VOICES}
                  selectedVoice={selectedVoice}
                  onSelectVoice={setSelectedVoice}
                  disabled={isLoading}
                />
                <StyleSelector
                  styles={STYLES}
                  selectedStyle={selectedStyle}
                  onSelectStyle={setSelectedStyle}
                  disabled={isLoading}
                />
              </>
            ) : (
              <MultiSpeakerSetup
                voices={VOICES}
                speaker1Name={speaker1Name}
                setSpeaker1Name={setSpeaker1Name}
                speaker1Voice={speaker1Voice}
                setSpeaker1Voice={setSpeaker1Voice}
                speaker2Name={speaker2Name}
                setSpeaker2Name={setSpeaker2Name}
                speaker2Voice={speaker2Voice}
                setSpeaker2Voice={setSpeaker2Voice}
                onInsertSampleDialogue={handleInsertSampleDialogue}
                disabled={isLoading}
              />
            )}

            {/* Text Input Area */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="tts-text-input"
                  className="text-xs font-semibold uppercase tracking-wider text-stone-500"
                >
                  Script or Prompt
                </label>
                <button
                  type="button"
                  onClick={() => setText('')}
                  disabled={!text || isLoading}
                  className="text-xs text-stone-400 hover:text-stone-700 disabled:opacity-30 transition"
                >
                  Clear Text
                </button>
              </div>

              <div className="relative">
                <textarea
                  id="tts-text-input"
                  rows={6}
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  disabled={isLoading}
                  placeholder={
                    mode === 'single'
                      ? 'Type or paste the text you want the voice to speak...'
                      : 'Joe: Welcome to the test.\nJane: Thanks, happy to be here!'
                  }
                  onKeyDown={(e) => {
                    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
                      e.preventDefault();
                      handleGenerate();
                    }
                  }}
                  className="w-full rounded-xl border border-stone-200 bg-white p-4 text-sm text-stone-900 placeholder:text-stone-400 focus:border-stone-900 focus:outline-none focus:ring-1 focus:ring-stone-900 transition leading-relaxed shadow-xs"
                />
              </div>

              {/* Input Footer Metrics */}
              <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-stone-500 px-1">
                <div className="flex items-center gap-3">
                  <span>
                    <strong>{charCount}</strong> characters
                  </span>
                  <span>•</span>
                  <span>
                    <strong>{wordCount}</strong> words
                  </span>
                  <span>•</span>
                  <span>
                    Est. speaking time: <strong>~{approxReadingSec}s</strong>
                  </span>
                </div>
                <div className="text-[11px] text-stone-400 hidden sm:block">
                  Press <kbd className="rounded border bg-stone-50 px-1">Ctrl</kbd> +{' '}
                  <kbd className="rounded border bg-stone-50 px-1">Enter</kbd> to speak
                </div>
              </div>
            </div>

            {/* Primary Action Button */}
            <div>
              <button
                type="button"
                id="generate-speech-btn"
                disabled={isLoading || !text.trim()}
                onClick={handleGenerate}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-stone-900 px-6 py-3.5 text-sm font-semibold text-white shadow-sm transition hover:bg-stone-800 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Synthesizing Audio with Gemini 3.1 Flash...</span>
                  </>
                ) : (
                  <>
                    <Volume2 className="h-4 w-4 fill-current" />
                    <span>Generate Speech</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Right Column: Audio Output & History (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            {/* Audio Player Card */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="text-xs font-semibold uppercase tracking-wider text-stone-500">
                  Audio Output
                </label>
                {currentAudioUrl && (
                  <span className="text-[11px] text-stone-500">
                    High Fidelity (24kHz Mono)
                  </span>
                )}
              </div>

              <AudioPlayer
                audioUrl={currentAudioUrl}
                voiceName={currentAudioVoice}
                mode={currentAudioMode}
                text={currentAudioText}
                estimatedDuration={estimatedDuration}
              />
            </div>

            {/* Model Capabilities & Info Card */}
            <div className="rounded-xl border border-stone-200 bg-white p-4.5 space-y-2.5 shadow-xs">
              <div className="flex items-center gap-2 text-xs font-semibold text-stone-800">
                <Info className="h-4 w-4 text-stone-500" />
                <span>About Gemini 3.1 Flash TTS</span>
              </div>
              <p className="text-xs text-stone-600 leading-relaxed">
                Utilizes the native audio modality of{' '}
                <code className="rounded bg-stone-100 px-1 py-0.5 font-mono text-[11px] text-stone-800">
                  gemini-3.1-flash-tts-preview
                </code>{' '}
                to render expressive vocal prosody, supporting prebuilt single voices
                and natural turn-taking dialogues between multiple speakers.
              </p>
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-stone-100 text-[11px] text-stone-500">
                <div>
                  <span className="block font-medium text-stone-700">Audio Format</span>
                  24,000 Hz 16-bit WAV
                </div>
                <div>
                  <span className="block font-medium text-stone-700">Supported Modalities</span>
                  Single Voice & 2-Speaker
                </div>
              </div>
            </div>

            {/* Generation History */}
            <HistoryList
              items={history}
              onSelect={handleSelectHistoryItem}
              onDelete={handleDeleteHistoryItem}
              onClear={handleClearHistory}
            />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-stone-200/80 bg-white py-4 text-center text-xs text-stone-500">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>Text to Speech Studio • Powered by Google Gemini</span>
          <span className="text-[11px] text-stone-400">
            Model: gemini-3.1-flash-tts-preview • Output: PCM to 24kHz WAV
          </span>
        </div>
      </footer>
    </div>
  );
}

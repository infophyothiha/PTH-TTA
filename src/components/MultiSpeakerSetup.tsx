import React from 'react';
import { VoiceName, VoiceOption } from '../types';
import { Users, HelpCircle } from 'lucide-react';

interface MultiSpeakerSetupProps {
  voices: VoiceOption[];
  speaker1Name: string;
  setSpeaker1Name: (name: string) => void;
  speaker1Voice: VoiceName;
  setSpeaker1Voice: (voice: VoiceName) => void;
  speaker2Name: string;
  setSpeaker2Name: (name: string) => void;
  speaker2Voice: VoiceName;
  setSpeaker2Voice: (voice: VoiceName) => void;
  onInsertSampleDialogue: () => void;
  disabled?: boolean;
}

export const MultiSpeakerSetup: React.FC<MultiSpeakerSetupProps> = ({
  voices,
  speaker1Name,
  setSpeaker1Name,
  speaker1Voice,
  setSpeaker1Voice,
  speaker2Name,
  setSpeaker2Name,
  speaker2Voice,
  setSpeaker2Voice,
  onInsertSampleDialogue,
  disabled = false,
}) => {
  return (
    <div
      id="multi-speaker-panel"
      className="rounded-xl border border-stone-200 bg-stone-50/70 p-4 space-y-4"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-stone-600" />
          <h4 className="text-xs font-semibold uppercase tracking-wider text-stone-700">
            Multi-Speaker Dialogue Setup
          </h4>
        </div>
        <button
          type="button"
          onClick={onInsertSampleDialogue}
          className="text-xs font-medium text-stone-600 hover:text-stone-900 underline decoration-stone-300 underline-offset-4"
        >
          Insert Example Dialogue
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {/* Speaker 1 */}
        <div className="rounded-lg border border-stone-200 bg-white p-3 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-stone-800">
              Speaker 1
            </span>
            <span className="text-[11px] text-stone-500">First interlocutor</span>
          </div>

          <div>
            <label className="block text-[11px] font-medium text-stone-500 mb-1">
              Label / Name in Script
            </label>
            <input
              type="text"
              id="speaker1-name-input"
              value={speaker1Name}
              onChange={(e) => setSpeaker1Name(e.target.value)}
              disabled={disabled}
              placeholder="e.g. Joe"
              className="w-full rounded-lg border border-stone-200 px-3 py-1.5 text-xs text-stone-900 focus:border-stone-900 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-[11px] font-medium text-stone-500 mb-1">
              Voice Persona
            </label>
            <select
              id="speaker1-voice-select"
              value={speaker1Voice}
              onChange={(e) => setSpeaker1Voice(e.target.value as VoiceName)}
              disabled={disabled}
              className="w-full rounded-lg border border-stone-200 bg-white px-3 py-1.5 text-xs text-stone-900 focus:border-stone-900 focus:outline-none"
            >
              {voices.map((v) => (
                <option key={v.name} value={v.name}>
                  {v.name} ({v.gender} - {v.tone})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Speaker 2 */}
        <div className="rounded-lg border border-stone-200 bg-white p-3 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-stone-800">
              Speaker 2
            </span>
            <span className="text-[11px] text-stone-500">Second interlocutor</span>
          </div>

          <div>
            <label className="block text-[11px] font-medium text-stone-500 mb-1">
              Label / Name in Script
            </label>
            <input
              type="text"
              id="speaker2-name-input"
              value={speaker2Name}
              onChange={(e) => setSpeaker2Name(e.target.value)}
              disabled={disabled}
              placeholder="e.g. Jane"
              className="w-full rounded-lg border border-stone-200 px-3 py-1.5 text-xs text-stone-900 focus:border-stone-900 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-[11px] font-medium text-stone-500 mb-1">
              Voice Persona
            </label>
            <select
              id="speaker2-voice-select"
              value={speaker2Voice}
              onChange={(e) => setSpeaker2Voice(e.target.value as VoiceName)}
              disabled={disabled}
              className="w-full rounded-lg border border-stone-200 bg-white px-3 py-1.5 text-xs text-stone-900 focus:border-stone-900 focus:outline-none"
            >
              {voices.map((v) => (
                <option key={v.name} value={v.name}>
                  {v.name} ({v.gender} - {v.tone})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="flex items-start gap-2 text-[11px] text-stone-500 bg-stone-100/80 rounded-lg p-2.5">
        <HelpCircle className="h-3.5 w-3.5 text-stone-400 mt-0.5 shrink-0" />
        <span>
          Structure conversation lines with speaker tags: e.g.{' '}
          <strong className="text-stone-700">{speaker1Name}:</strong> Hello! and{' '}
          <strong className="text-stone-700">{speaker2Name}:</strong> Great to meet you!
        </span>
      </div>
    </div>
  );
};

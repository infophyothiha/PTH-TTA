import React from 'react';
import { VoiceName, VoiceOption } from '../types';
import { User, Volume2 } from 'lucide-react';

interface VoiceSelectorProps {
  voices: VoiceOption[];
  selectedVoice: VoiceName;
  onSelectVoice: (voice: VoiceName) => void;
  disabled?: boolean;
}

export const VoiceSelector: React.FC<VoiceSelectorProps> = ({
  voices,
  selectedVoice,
  onSelectVoice,
  disabled = false,
}) => {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold uppercase tracking-wider text-stone-500">
          Voice Persona
        </label>
        <span className="text-xs text-stone-500">
          Selected: <strong className="text-stone-800">{selectedVoice}</strong>
        </span>
      </div>

      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 md:grid-cols-3">
        {voices.map((voice) => {
          const isSelected = selectedVoice === voice.name;
          return (
            <button
              key={voice.name}
              type="button"
              id={`voice-select-${voice.name.toLowerCase()}`}
              disabled={disabled}
              onClick={() => onSelectVoice(voice.name)}
              className={`group relative flex flex-col justify-between rounded-xl border p-3.5 text-left transition-all ${
                isSelected
                  ? 'border-stone-900 bg-stone-900 text-white shadow-xs'
                  : 'border-stone-200 bg-white hover:border-stone-300 hover:bg-stone-50/60 text-stone-800'
              } ${disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              <div>
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 font-semibold text-sm">
                    <User className={`h-4 w-4 ${isSelected ? 'text-stone-300' : 'text-stone-400'}`} />
                    <span>{voice.name}</span>
                  </div>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${
                      isSelected
                        ? 'bg-stone-800 text-stone-200'
                        : 'bg-stone-100 text-stone-600'
                    }`}
                  >
                    {voice.gender}
                  </span>
                </div>

                <div
                  className={`mt-1.5 text-xs font-medium ${
                    isSelected ? 'text-stone-200' : 'text-stone-600'
                  }`}
                >
                  {voice.tone}
                </div>
              </div>

              <p
                className={`mt-2 text-[11px] leading-relaxed line-clamp-2 ${
                  isSelected ? 'text-stone-400' : 'text-stone-500'
                }`}
              >
                {voice.description}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
};

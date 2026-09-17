import React from 'react';
import { PRESET_SAMPLES, PresetSample } from '../data/voices';
import { BookOpen, Radio, MessageSquare, Sun, Wind } from 'lucide-react';

interface PresetSamplesProps {
  onSelectSample: (sample: PresetSample) => void;
  disabled?: boolean;
}

export const PresetSamples: React.FC<PresetSamplesProps> = ({
  onSelectSample,
  disabled = false,
}) => {
  const getIcon = (category: string) => {
    switch (category) {
      case 'Storytelling':
        return <BookOpen className="h-3 w-3" />;
      case 'Broadcast':
        return <Radio className="h-3 w-3" />;
      case 'Conversation':
        return <MessageSquare className="h-3 w-3" />;
      case 'Greeting':
        return <Sun className="h-3 w-3" />;
      case 'Mindfulness':
        return <Wind className="h-3 w-3" />;
      default:
        return <Radio className="h-3 w-3" />;
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold uppercase tracking-wider text-stone-500">
          Sample Prompts
        </label>
        <span className="text-[11px] text-stone-400">Click to auto-load text & voice</span>
      </div>

      <div className="flex flex-wrap gap-2">
        {PRESET_SAMPLES.map((sample) => (
          <button
            key={sample.id}
            type="button"
            id={`preset-btn-${sample.id}`}
            disabled={disabled}
            onClick={() => onSelectSample(sample)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-stone-200 bg-stone-50 px-2.5 py-1.5 text-xs font-medium text-stone-700 transition hover:border-stone-300 hover:bg-stone-100 disabled:opacity-50"
          >
            {getIcon(sample.category)}
            <span>{sample.title}</span>
            <span className="text-[10px] text-stone-400">({sample.category})</span>
          </button>
        ))}
      </div>
    </div>
  );
};

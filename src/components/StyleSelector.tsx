import React from 'react';
import { StyleOption, StyleToneId } from '../types';

interface StyleSelectorProps {
  styles: StyleOption[];
  selectedStyle: StyleToneId;
  onSelectStyle: (style: StyleToneId) => void;
  disabled?: boolean;
}

export const StyleSelector: React.FC<StyleSelectorProps> = ({
  styles,
  selectedStyle,
  onSelectStyle,
  disabled = false,
}) => {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold uppercase tracking-wider text-stone-500">
          Delivery Style & Tone
        </label>
      </div>

      <div className="flex flex-wrap gap-2">
        {styles.map((style) => {
          const isSelected = selectedStyle === style.id;
          return (
            <button
              key={style.id}
              type="button"
              id={`style-btn-${style.id}`}
              disabled={disabled}
              onClick={() => onSelectStyle(style.id)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                isSelected
                  ? 'bg-stone-900 text-white shadow-xs'
                  : 'border border-stone-200 bg-white text-stone-700 hover:bg-stone-50 hover:border-stone-300'
              } ${disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              {style.label}
            </button>
          );
        })}
      </div>
    </div>
  );
};

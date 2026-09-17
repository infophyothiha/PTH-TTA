import React from 'react';
import { HistoryItem } from '../types';
import { Play, Download, Trash2, Clock, History } from 'lucide-react';

interface HistoryListProps {
  items: HistoryItem[];
  onSelect: (item: HistoryItem) => void;
  onDelete: (id: string) => void;
  onClear: () => void;
}

export const HistoryList: React.FC<HistoryListProps> = ({
  items,
  onSelect,
  onDelete,
  onClear,
}) => {
  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-stone-200 p-6 text-center text-xs text-stone-500">
        <History className="h-5 w-5 mx-auto text-stone-400 mb-2 stroke-[1.5]" />
        Your generated speech clips will appear here for quick replay and export.
      </div>
    );
  }

  const handleDownloadItem = (e: React.MouseEvent, item: HistoryItem) => {
    e.stopPropagation();
    const a = document.createElement('a');
    a.href = item.audioData;
    const clean = item.text.slice(0, 15).replace(/[^a-zA-Z0-9]/g, '_');
    a.download = `${clean || 'speech'}-${item.voice.toLowerCase()}-tts.wav`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const formatTimestamp = (isoStr: string) => {
    try {
      const d = new Date(isoStr);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Clock className="h-4 w-4 text-stone-500" />
          <h4 className="text-xs font-semibold uppercase tracking-wider text-stone-700">
            Recent Generations ({items.length})
          </h4>
        </div>
        <button
          type="button"
          onClick={onClear}
          className="text-xs text-stone-400 hover:text-stone-700 transition"
        >
          Clear History
        </button>
      </div>

      <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
        {items.map((item) => (
          <div
            key={item.id}
            onClick={() => onSelect(item)}
            className="group flex items-center justify-between gap-3 rounded-lg border border-stone-200 bg-white p-3 transition hover:border-stone-400 hover:bg-stone-50/50 cursor-pointer"
          >
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-semibold text-xs text-stone-900">
                  {item.voice}
                </span>
                <span className="rounded-full bg-stone-100 px-1.5 py-0.5 text-[10px] text-stone-600">
                  {item.mode === 'multi' ? 'Dialogue' : item.style}
                </span>
                <span className="text-[10px] text-stone-400">
                  {formatTimestamp(item.createdAt)}
                </span>
              </div>
              <p className="text-xs text-stone-600 line-clamp-1 truncate">
                {item.text}
              </p>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onSelect(item);
                }}
                title="Play Audio"
                className="flex h-7 w-7 items-center justify-center rounded-md border border-stone-200 text-stone-700 hover:bg-stone-100 transition"
              >
                <Play className="h-3 w-3 fill-current ml-0.5" />
              </button>
              <button
                type="button"
                onClick={(e) => handleDownloadItem(e, item)}
                title="Download WAV"
                className="flex h-7 w-7 items-center justify-center rounded-md border border-stone-200 text-stone-700 hover:bg-stone-100 transition"
              >
                <Download className="h-3 w-3" />
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(item.id);
                }}
                title="Delete"
                className="flex h-7 w-7 items-center justify-center rounded-md text-stone-400 hover:text-rose-600 hover:bg-stone-100 transition"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

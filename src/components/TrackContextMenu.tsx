import { useState, useRef, useEffect } from 'react';

interface Props {
  onAdd?: () => void;
  onRemove?: () => void;
}

export default function TrackContextMenu({ onAdd, onRemove }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open) {
      document.addEventListener('mousedown', handleClick);
    }
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        className={`p-1.5 rounded text-text-secondary hover:text-white transition-all ${open ? 'opacity-100 text-white' : 'opacity-0 group-hover:opacity-100'}`}
        onClick={(e) => {
          e.stopPropagation();
          setOpen(!open);
        }}
      >
        <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-48 rounded-md bg-[#282828] border border-border shadow-2xl z-50 py-1 animate-in fade-in zoom-in-95 duration-100">
          {onAdd && (
            <button
              className="w-full text-left px-4 py-2 text-sm text-text-secondary hover:text-white hover:bg-white/10 transition-colors flex items-center gap-3"
              onClick={(e) => {
                e.stopPropagation();
                setOpen(false);
                onAdd();
              }}
            >
               <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
               </svg>
               Add to playlist
            </button>
          )}
          {onRemove && (
            <button
              className="w-full text-left px-4 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-white/10 transition-colors flex items-center gap-3"
              onClick={(e) => {
                e.stopPropagation();
                setOpen(false);
                onRemove();
              }}
            >
               <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
               </svg>
               Remove from playlist
            </button>
          )}
        </div>
      )}
    </div>
  );
}

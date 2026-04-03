import { useState, useEffect, useRef } from 'react';
import { IS_CHINESE } from './WorkoutUI';

interface Props {
  children: React.ReactNode;
  title?: string;
  className?: string;
}

/**
 * Card wrapper that renders children normally,
 * and on click of the expand button shows a full-screen modal.
 */
export default function ExpandableCard({ children, title, className = '' }: Props) {
  const [expanded, setExpanded] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!expanded) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') setExpanded(false); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [expanded]);

  // Prevent body scroll when modal open
  useEffect(() => {
    document.body.style.overflow = expanded ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [expanded]);

  return (
    <>
      {/* Normal card */}
      <div className={`rounded-xl p-4 relative ${className}`}
        style={{
          background: 'var(--wo-card-bg)',
          border: '1px solid var(--wo-card-border)',
          overflow: 'hidden',
          transition: 'box-shadow 0.2s ease, border-color 0.2s ease',
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLDivElement).style.boxShadow = '0 4px 20px rgba(99,102,241,0.1)';
          (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--wc-l2)';
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLDivElement).style.boxShadow = '';
          (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--wo-card-border)';
        }}
      >
        {/* Expand button */}
        <button
          onClick={() => setExpanded(true)}
          title={IS_CHINESE ? '放大查看' : 'Expand'}
          style={{
            position: 'absolute', top: 8, right: 8, zIndex: 1,
            width: 24, height: 24, borderRadius: 6,
            background: 'rgba(128,128,128,0.1)',
            border: '1px solid rgba(128,128,128,0.15)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', opacity: 0, transition: 'opacity 0.15s',
            fontSize: 11, color: 'currentColor',
          }}
          className="expand-btn"
        >
          ⤢
        </button>
        <style>{`.rounded-xl:hover .expand-btn { opacity: 0.55 !important; } .expand-btn:hover { opacity: 1 !important; }`}</style>
        {children}
      </div>

      {/* Modal */}
      {expanded && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.82)', backdropFilter: 'blur(6px)' }}
          onClick={(e) => { if (e.target === e.currentTarget) setExpanded(false); }}
        >
          <div
            ref={modalRef}
            className="w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl p-6 relative"
            style={{
              background: 'var(--wo-card-bg)',
              border: '1px solid var(--wo-card-border)',
              boxShadow: '0 0 60px rgba(99,102,241,0.2)',
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-5">
              {title && (
                <h3 className="text-sm font-bold uppercase tracking-widest opacity-50">{title}</h3>
              )}
              <button
                onClick={() => setExpanded(false)}
                className="ml-auto text-xs opacity-35 hover:opacity-70 transition-opacity px-2 py-1 rounded"
              >
                {IS_CHINESE ? '关闭 ✕' : 'Close ✕'}
              </button>
            </div>
            {/* Content — same children, more space, larger text */}
            <div style={{ minHeight: 300, zoom: 1.2 }}>
              {children}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

import React from 'react';

export const IS_CHINESE = true;

export const TOOLTIP_STYLE: React.CSSProperties = {
  background: 'var(--wo-card-bg)',
  border: '1px solid var(--wt-border)',
  borderRadius: 8,
  fontSize: 11,
  boxShadow: 'var(--wo-popover-shadow)',
  padding: '6px 10px',
};

// Section divider with label — optionally collapsible
export const SectionHeader = ({
  label,
  collapsed,
  onToggle,
}: {
  label: string;
  collapsed?: boolean;
  onToggle?: () => void;
}) => (
  <div
    className="flex items-center gap-3 mt-10 mb-5"
    style={onToggle ? { cursor: 'pointer', userSelect: 'none' } : undefined}
    onClick={onToggle}
  >
    <span className="text-xs font-bold opacity-60" style={{ color: 'var(--wc-l3)' }}>{label}</span>
    <div className="flex-1 h-px" style={{ background: 'var(--wo-section-line)' }} />
    {onToggle !== undefined && (
      <span style={{ fontSize: 11, opacity: 0.4, color: 'var(--wc-l3)', transition: 'transform 0.2s', display: 'inline-block', transform: collapsed ? 'rotate(-90deg)' : 'rotate(0deg)' }}>
        ▾
      </span>
    )}
  </div>
);

// Card wrapper — hover affordance lives in CSS so every card behaves identically
// without per-instance mouse handlers.
export const Card = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <div className={`wo-card rounded-xl p-4 ${className}`}
    style={{
      background: 'var(--wo-card-bg)',
      border: '1px solid var(--wo-card-border)',
      position: 'relative',
      overflow: 'hidden',
      transition: 'box-shadow 0.2s ease, border-color 0.2s ease',
    }}
  >
    {children}
  </div>
);

// Compact label for chart/panel titles
export const PanelLabel = ({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) => (
  <div className="mb-2.5 text-xs font-semibold opacity-50" style={style}>{children}</div>
);

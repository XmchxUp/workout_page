import React from 'react';

export const IS_CHINESE = true;

export const TOOLTIP_STYLE: React.CSSProperties = {
  background: 'var(--color-background)',
  border: '1px solid var(--wt-border)',
  borderRadius: 8,
  fontSize: 11,
  boxShadow: '0 8px 24px rgba(0,0,0,0.25)',
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
    <span className="text-xs font-bold uppercase tracking-[0.12em]" style={{ color: 'var(--wc-l3)' }}>{label}</span>
    <div className="flex-1 h-px" style={{ background: 'var(--wo-section-line)' }} />
    {onToggle !== undefined && (
      <span style={{ fontSize: 11, opacity: 0.4, color: 'var(--wc-l3)', transition: 'transform 0.2s', display: 'inline-block', transform: collapsed ? 'rotate(-90deg)' : 'rotate(0deg)' }}>
        ▾
      </span>
    )}
  </div>
);

// Card wrapper — with subtle shimmer on hover
export const Card = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <div className={`rounded-xl p-4 ${className}`}
    style={{
      background: 'var(--wo-card-bg)',
      border: '1px solid var(--wo-card-border)',
      position: 'relative',
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
    {children}
  </div>
);

// Compact label for chart/panel titles
export const PanelLabel = ({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) => (
  <div className="mb-2.5 text-xs font-semibold uppercase tracking-[0.1em] opacity-40" style={style}>{children}</div>
);

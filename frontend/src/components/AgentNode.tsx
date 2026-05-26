import { memo } from 'react'
import { Handle, Position, type NodeProps } from '@xyflow/react'
import type { AgentState } from '../types'

const STATUS_CONFIG = {
  idle:    { dot: '#4b5563', label: 'idle',    ring: 'rgba(75,85,99,0.3)' },
  running: { dot: '#3b82f6', label: 'running', ring: 'rgba(59,130,246,0.25)' },
  waiting: { dot: '#f59e0b', label: 'waiting', ring: 'rgba(245,158,11,0.25)' },
  blocked: { dot: '#f97316', label: 'blocked', ring: 'rgba(249,115,22,0.25)' },
  done:    { dot: '#10b981', label: 'done',    ring: 'rgba(16,185,129,0.25)' },
  error:   { dot: '#ef4444', label: 'error',   ring: 'rgba(239,68,68,0.25)' },
}

const MODEL_LABELS: Record<string, string> = {
  'claude-opus-4-20250514':   'opus-4',
  'claude-sonnet-4-20250514': 'sonnet-4',
  'claude-haiku-4-5-20251001': 'haiku-4.5',
  'gpt-4o':                   'gpt-4o',
  'gpt-4o-mini':              'gpt-4o-mini',
  'gemini-1.5-pro':           'gemini-1.5',
}

type AgentNodeData = AgentState & { selected?: boolean }

function AgentNode({ data, selected }: NodeProps) {
  const agent = data as AgentNodeData
  const cfg = STATUS_CONFIG[agent.status] ?? STATUS_CONFIG.idle
  const modelLabel = MODEL_LABELS[agent.model] ?? agent.model.split('-').slice(0, 2).join('-')
  const isActive = agent.status === 'running' || agent.status === 'waiting'

  return (
    <div
      style={{
        background: 'linear-gradient(145deg, #16161f, #1a1a28)',
        border: selected
          ? '1.5px solid rgba(110,231,183,0.6)'
          : '1.5px solid rgba(255,255,255,0.07)',
        borderRadius: 12,
        padding: '12px 14px',
        minWidth: 180,
        maxWidth: 220,
        cursor: 'pointer',
        boxShadow: selected
          ? '0 0 0 3px rgba(110,231,183,0.1), 0 4px 24px rgba(0,0,0,0.5)'
          : '0 4px 20px rgba(0,0,0,0.4)',
        transition: 'all 0.15s ease',
        position: 'relative',
        fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
      }}
    >
      {/* status ring pulse */}
      {isActive && (
        <div
          style={{
            position: 'absolute',
            inset: -4,
            borderRadius: 16,
            border: `1.5px solid ${cfg.ring}`,
            animation: 'pulse-ring 2s ease-in-out infinite',
            pointerEvents: 'none',
          }}
        />
      )}

      {/* header row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        {/* status dot */}
        <div
          style={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: cfg.dot,
            flexShrink: 0,
            boxShadow: `0 0 6px ${cfg.dot}`,
          }}
        />
        <span
          style={{
            color: '#e2e8f0',
            fontSize: 12,
            fontWeight: 600,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            flex: 1,
            letterSpacing: '0.02em',
          }}
        >
          {agent.name}
        </span>
        <span
          style={{
            color: '#4b5563',
            fontSize: 9,
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
          }}
        >
          {modelLabel}
        </span>
      </div>

      {/* task / question preview */}
      {agent.status === 'waiting' && agent.pending_question ? (
        <div
          style={{
            background: 'rgba(245,158,11,0.08)',
            border: '1px solid rgba(245,158,11,0.2)',
            borderRadius: 6,
            padding: '5px 8px',
            fontSize: 10,
            color: '#fcd34d',
            lineHeight: 1.4,
          }}
        >
          ? {agent.pending_question.slice(0, 80)}
          {agent.pending_question.length > 80 && '…'}
        </div>
      ) : agent.current_task ? (
        <div
          style={{
            color: '#64748b',
            fontSize: 10,
            lineHeight: 1.4,
            overflow: 'hidden',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
          }}
        >
          {agent.current_task.slice(0, 90)}
          {agent.current_task.length > 90 && '…'}
        </div>
      ) : (
        <div style={{ color: '#374151', fontSize: 10 }}>
          {cfg.label}
        </div>
      )}

      {/* status badge */}
      <div
        style={{
          marginTop: 8,
          display: 'inline-flex',
          alignItems: 'center',
          gap: 4,
          background: `${cfg.ring}`,
          borderRadius: 4,
          padding: '2px 6px',
        }}
      >
        <span style={{ color: cfg.dot, fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          {cfg.label}
        </span>
      </div>

      {/* react-flow handles */}
      <Handle
        type="source"
        position={Position.Right}
        style={{ background: 'rgba(110,231,183,0.4)', border: 'none', width: 8, height: 8 }}
      />
      <Handle
        type="target"
        position={Position.Left}
        style={{ background: 'rgba(110,231,183,0.2)', border: 'none', width: 8, height: 8 }}
      />
    </div>
  )
}

export default memo(AgentNode)

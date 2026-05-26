import { useEffect, useRef, useState } from 'react'
import type { AgentMessage, AgentState } from '../types'

interface Props {
  agent: AgentState | null
  messages: AgentMessage[]
  onSendTask: (task: string) => void
  onSendAnswer: (answer: string) => void
  onDelete: () => void
  onClose: () => void
}

function extractText(content: any): string {
  if (typeof content === 'string') return content
  if (Array.isArray(content)) {
    return content
      .map((b: any) => b.text ?? b.content ?? '')
      .filter(Boolean)
      .join('\n')
  }
  return ''
}

const STATUS_COLORS: Record<string, string> = {
  idle: '#4b5563',
  running: '#3b82f6',
  waiting: '#f59e0b',
  blocked: '#f97316',
  done: '#10b981',
  error: '#ef4444',
}

export default function ChatPanel({ agent, messages, onSendTask, onSendAnswer, onDelete, onClose }: Props) {
  const [input, setInput] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    setInput('')
    textareaRef.current?.focus()
  }, [agent?.id])

  if (!agent) return null

  const isWaiting = agent.status === 'waiting'
  const dotColor = STATUS_COLORS[agent.status] ?? '#4b5563'

  function handleSubmit() {
    const val = input.trim()
    if (!val) return
    if (isWaiting) {
      onSendAnswer(val)
    } else {
      onSendTask(val)
    }
    setInput('')
  }

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault()
      handleSubmit()
    }
  }

  return (
    <div
      style={{
        width: 380,
        height: '100%',
        background: '#0f0f17',
        borderLeft: '1px solid rgba(255,255,255,0.06)',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
      }}
    >
      {/* header */}
      <div
        style={{
          padding: '14px 16px',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          flexShrink: 0,
        }}
      >
        <div
          style={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: dotColor,
            boxShadow: `0 0 6px ${dotColor}`,
            flexShrink: 0,
          }}
        />
        <span style={{ color: '#e2e8f0', fontSize: 13, fontWeight: 600, flex: 1 }}>
          {agent.name}
        </span>
        <span
          style={{
            color: '#374151',
            fontSize: 10,
            background: 'rgba(255,255,255,0.04)',
            padding: '2px 6px',
            borderRadius: 4,
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
          }}
        >
          {agent.status}
        </span>
        <button
          onClick={onDelete}
          title="Delete agent"
          style={{
            background: 'none',
            border: 'none',
            color: '#374151',
            cursor: 'pointer',
            fontSize: 14,
            padding: '2px 4px',
            transition: 'color 0.1s',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = '#ef4444')}
          onMouseLeave={(e) => (e.currentTarget.style.color = '#374151')}
        >
          ✕
        </button>
        <button
          onClick={onClose}
          title="Close panel"
          style={{
            background: 'none',
            border: 'none',
            color: '#374151',
            cursor: 'pointer',
            fontSize: 14,
            padding: '2px 4px',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = '#94a3b8')}
          onMouseLeave={(e) => (e.currentTarget.style.color = '#374151')}
        >
          ›
        </button>
      </div>

      {/* agent meta */}
      <div
        style={{
          padding: '8px 16px',
          borderBottom: '1px solid rgba(255,255,255,0.04)',
          flexShrink: 0,
        }}
      >
        <div style={{ color: '#374151', fontSize: 10, letterSpacing: '0.04em' }}>
          {agent.model} · id:{agent.id}
        </div>
        {agent.current_task && (
          <div style={{ color: '#4b5563', fontSize: 10, marginTop: 2 }}>
            ▶ {agent.current_task.slice(0, 100)}
          </div>
        )}
      </div>

      {/* messages */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '12px 16px',
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
        }}
      >
        {messages.length === 0 && (
          <div style={{ color: '#1e1e28', fontSize: 11, textAlign: 'center', marginTop: 40 }}>
            no messages yet
          </div>
        )}

        {messages.map((msg, i) => {
          const text = msg.text_preview || extractText(msg.content)
          const isUser = msg.role === 'user'
          return (
            <div
              key={i}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: isUser ? 'flex-end' : 'flex-start',
              }}
            >
              <div
                style={{
                  maxWidth: '90%',
                  padding: '7px 11px',
                  borderRadius: isUser ? '10px 10px 2px 10px' : '10px 10px 10px 2px',
                  background: isUser
                    ? 'rgba(110,231,183,0.1)'
                    : 'rgba(255,255,255,0.04)',
                  border: isUser
                    ? '1px solid rgba(110,231,183,0.15)'
                    : '1px solid rgba(255,255,255,0.06)',
                  color: isUser ? '#a7f3d0' : '#94a3b8',
                  fontSize: 11,
                  lineHeight: 1.5,
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                }}
              >
                {text || '(tool call)'}
              </div>
              <div style={{ color: '#1f2937', fontSize: 9, marginTop: 2 }}>
                {isUser ? 'you' : agent.name} ·{' '}
                {new Date(msg.timestamp * 1000).toLocaleTimeString()}
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      {/* question banner */}
      {isWaiting && agent.pending_question && (
        <div
          style={{
            margin: '0 12px',
            padding: '8px 12px',
            background: 'rgba(245,158,11,0.08)',
            border: '1px solid rgba(245,158,11,0.2)',
            borderRadius: 8,
            color: '#fcd34d',
            fontSize: 11,
            lineHeight: 1.4,
            flexShrink: 0,
          }}
        >
          ? {agent.pending_question}
        </div>
      )}

      {/* input */}
      <div
        style={{
          padding: 12,
          borderTop: '1px solid rgba(255,255,255,0.06)',
          flexShrink: 0,
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
        }}
      >
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKey}
          rows={3}
          placeholder={isWaiting ? 'answer the agent…' : 'send a task… (⌘↵ to send)'}
          style={{
            background: 'rgba(255,255,255,0.03)',
            border: `1px solid ${isWaiting ? 'rgba(245,158,11,0.3)' : 'rgba(255,255,255,0.08)'}`,
            borderRadius: 8,
            color: '#e2e8f0',
            fontSize: 11,
            padding: '8px 10px',
            resize: 'none',
            fontFamily: 'inherit',
            outline: 'none',
            lineHeight: 1.5,
          }}
        />
        <button
          onClick={handleSubmit}
          disabled={!input.trim()}
          style={{
            background: isWaiting
              ? 'rgba(245,158,11,0.15)'
              : 'rgba(110,231,183,0.12)',
            border: isWaiting
              ? '1px solid rgba(245,158,11,0.3)'
              : '1px solid rgba(110,231,183,0.25)',
            borderRadius: 7,
            color: isWaiting ? '#fcd34d' : '#6ee7b7',
            padding: '7px 0',
            fontSize: 11,
            cursor: input.trim() ? 'pointer' : 'not-allowed',
            opacity: input.trim() ? 1 : 0.4,
            fontFamily: 'inherit',
            letterSpacing: '0.04em',
            transition: 'all 0.1s',
          }}
        >
          {isWaiting ? '↩ answer' : '▶ send task'}
        </button>
      </div>
    </div>
  )
}

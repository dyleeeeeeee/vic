import { useState } from 'react'
import type { CreateAgentConfig } from '../types'

const MODELS = [
  { value: 'claude-sonnet-4-20250514', label: 'Claude Sonnet 4' },
  { value: 'claude-opus-4-20250514',   label: 'Claude Opus 4' },
  { value: 'claude-haiku-4-5-20251001', label: 'Claude Haiku 4.5' },
  { value: 'gpt-4o',                   label: 'GPT-4o' },
  { value: 'gpt-4o-mini',              label: 'GPT-4o Mini' },
]

const PRESETS = [
  {
    name: 'Coder',
    system_prompt: 'You are an expert software engineer. Write clean, well-documented code. Use the terminal to test your work.',
  },
  {
    name: 'Researcher',
    system_prompt: 'You are a research assistant. Investigate topics thoroughly, read files, and produce clear summaries.',
  },
  {
    name: 'Reviewer',
    system_prompt: 'You are a senior code reviewer. Read files, identify issues, suggest improvements, and write detailed feedback.',
  },
  {
    name: 'Orchestrator',
    system_prompt: 'You are a project manager AI. Break down tasks, delegate them to specialist agents using message_agent, and synthesise their output.',
  },
]

interface Props {
  onSubmit: (config: CreateAgentConfig) => void
  onClose: () => void
}

const INPUT_STYLE: React.CSSProperties = {
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 7,
  color: '#e2e8f0',
  fontSize: 12,
  padding: '8px 10px',
  width: '100%',
  boxSizing: 'border-box',
  fontFamily: "'JetBrains Mono', monospace",
  outline: 'none',
}

const LABEL_STYLE: React.CSSProperties = {
  color: '#4b5563',
  fontSize: 10,
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
  marginBottom: 5,
  display: 'block',
}

export default function CreateAgentModal({ onSubmit, onClose }: Props) {
  const [name, setName] = useState('')
  const [model, setModel] = useState(MODELS[0].value)
  const [systemPrompt, setSystemPrompt] = useState(PRESETS[0].system_prompt)
  const [apiKey, setApiKey] = useState('')

  function applyPreset(preset: typeof PRESETS[0]) {
    setName(preset.name)
    setSystemPrompt(preset.system_prompt)
  }

  function handleSubmit() {
    if (!name.trim() || !apiKey.trim()) return
    onSubmit({ name: name.trim(), model, system_prompt: systemPrompt.trim(), api_key: apiKey.trim() })
    onClose()
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.7)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 100,
        fontFamily: "'JetBrains Mono', monospace",
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        style={{
          background: '#0f0f17',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 14,
          width: 480,
          maxHeight: '85vh',
          overflowY: 'auto',
          padding: 24,
          boxShadow: '0 24px 80px rgba(0,0,0,0.6)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 20 }}>
          <h2 style={{ color: '#e2e8f0', fontSize: 14, fontWeight: 700, flex: 1, margin: 0 }}>
            spawn agent
          </h2>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: '#374151', cursor: 'pointer', fontSize: 16 }}
          >
            ✕
          </button>
        </div>

        {/* presets */}
        <div style={{ marginBottom: 20 }}>
          <label style={LABEL_STYLE}>quick start</label>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {PRESETS.map((p) => (
              <button
                key={p.name}
                onClick={() => applyPreset(p)}
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: 6,
                  color: '#94a3b8',
                  fontSize: 11,
                  padding: '4px 10px',
                  cursor: 'pointer',
                  transition: 'all 0.1s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(110,231,183,0.3)'
                  e.currentTarget.style.color = '#6ee7b7'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'
                  e.currentTarget.style.color = '#94a3b8'
                }}
              >
                {p.name}
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={LABEL_STYLE}>name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. coder-1"
              style={INPUT_STYLE}
            />
          </div>

          <div>
            <label style={LABEL_STYLE}>model</label>
            <select
              value={model}
              onChange={(e) => setModel(e.target.value)}
              style={{ ...INPUT_STYLE, cursor: 'pointer' }}
            >
              {MODELS.map((m) => (
                <option key={m.value} value={m.value} style={{ background: '#0f0f17' }}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={LABEL_STYLE}>system prompt</label>
            <textarea
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
              rows={5}
              style={{ ...INPUT_STYLE, resize: 'vertical', lineHeight: 1.5 }}
            />
          </div>

          <div>
            <label style={LABEL_STYLE}>api key</label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="sk-ant-… or sk-…"
              style={INPUT_STYLE}
            />
            <div style={{ color: '#1f2937', fontSize: 10, marginTop: 4 }}>
              stored in memory only — never sent to our servers
            </div>
          </div>

          <button
            onClick={handleSubmit}
            disabled={!name.trim() || !apiKey.trim()}
            style={{
              background: 'rgba(110,231,183,0.12)',
              border: '1px solid rgba(110,231,183,0.3)',
              borderRadius: 8,
              color: '#6ee7b7',
              padding: '10px 0',
              fontSize: 12,
              cursor: name.trim() && apiKey.trim() ? 'pointer' : 'not-allowed',
              opacity: name.trim() && apiKey.trim() ? 1 : 0.4,
              fontFamily: 'inherit',
              letterSpacing: '0.04em',
              transition: 'all 0.1s',
            }}
          >
            ◈ spawn
          </button>
        </div>
      </div>
    </div>
  )
}

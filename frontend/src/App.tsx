import { useState, useEffect } from 'react'
import { ReactFlowProvider } from '@xyflow/react'
import AgentCanvas from './components/AgentCanvas'
import ChatPanel from './components/ChatPanel'
import CreateAgentModal from './components/CreateAgentModal'
import { useOrchestrator } from './hooks/useOrchestrator'
import type { CreateAgentConfig } from './types'

const CONNECTION_COLORS = {
  connecting:   '#f59e0b',
  connected:    '#10b981',
  disconnected: '#ef4444',
}

export default function App() {
  const {
    agents,
    messages,
    connectionStatus,
    createAgent,
    sendTask,
    sendAnswer,
    deleteAgent,
    updatePosition,
    fetchMessages,
  } = useOrchestrator()

  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [showCreate, setShowCreate] = useState(false)

  // fetch message history when selecting an agent
  useEffect(() => {
    if (selectedId) fetchMessages(selectedId)
  }, [selectedId, fetchMessages])

  const selectedAgent = selectedId ? agents[selectedId] ?? null : null
  const selectedMessages = selectedId ? messages[selectedId] ?? [] : []

  function handleCreate(config: CreateAgentConfig) {
    createAgent(config)
  }

  function handleDelete(id: string) {
    deleteAgent(id)
    if (selectedId === id) setSelectedId(null)
  }

  const dotColor = CONNECTION_COLORS[connectionStatus]

  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        background: '#0c0c0f',
        overflow: 'hidden',
      }}
    >
      {/* global style injection */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 2px; }
        @keyframes pulse-ring {
          0%, 100% { opacity: 0.6; transform: scale(1); }
          50%       { opacity: 0.2; transform: scale(1.04); }
        }
        .react-flow__controls button {
          background: #141418 !important;
          border-color: rgba(255,255,255,0.08) !important;
          color: #94a3b8 !important;
          fill: #94a3b8 !important;
        }
        .react-flow__controls button:hover {
          background: #1a1a28 !important;
        }
      `}</style>

      {/* top bar */}
      <div
        style={{
          height: 42,
          borderBottom: '1px solid rgba(255,255,255,0.05)',
          display: 'flex',
          alignItems: 'center',
          padding: '0 16px',
          gap: 12,
          flexShrink: 0,
          background: '#0a0a0e',
        }}
      >
        <span
          style={{
            color: '#6ee7b7',
            fontSize: 13,
            fontFamily: "'JetBrains Mono', monospace",
            fontWeight: 700,
            letterSpacing: '0.08em',
          }}
        >
          ◈ vic
        </span>

        <div style={{ flex: 1 }} />

        {/* agent count */}
        <span
          style={{
            color: '#374151',
            fontSize: 11,
            fontFamily: 'monospace',
          }}
        >
          {Object.keys(agents).length} agent{Object.keys(agents).length !== 1 ? 's' : ''}
        </span>

        {/* connection status */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <div
            style={{
              width: 6,
              height: 6,
              borderRadius: '50%',
              background: dotColor,
              boxShadow: connectionStatus === 'connected' ? `0 0 5px ${dotColor}` : 'none',
            }}
          />
          <span
            style={{
              color: '#374151',
              fontSize: 10,
              fontFamily: 'monospace',
              letterSpacing: '0.04em',
            }}
          >
            {connectionStatus}
          </span>
        </div>
      </div>

      {/* main layout */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        <ReactFlowProvider>
          <div style={{ flex: 1, overflow: 'hidden' }}>
            <AgentCanvas
              agents={agents}
              selectedAgentId={selectedId}
              onSelectAgent={setSelectedId}
              onUpdatePosition={updatePosition}
              onCreateClick={() => setShowCreate(true)}
            />
          </div>
        </ReactFlowProvider>

        {/* chat panel slides in */}
        {selectedAgent && (
          <ChatPanel
            agent={selectedAgent}
            messages={selectedMessages}
            onSendTask={(task) => sendTask(selectedAgent.id, task)}
            onSendAnswer={(answer) => sendAnswer(selectedAgent.id, answer)}
            onDelete={() => handleDelete(selectedAgent.id)}
            onClose={() => setSelectedId(null)}
          />
        )}
      </div>

      {showCreate && (
        <CreateAgentModal
          onSubmit={handleCreate}
          onClose={() => setShowCreate(false)}
        />
      )}
    </div>
  )
}

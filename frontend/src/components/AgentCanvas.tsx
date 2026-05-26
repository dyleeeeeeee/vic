import { useCallback, useEffect, useMemo } from 'react'
import {
  ReactFlow,
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  addEdge,
  useEdgesState,
  useNodesState,
  type Node,
  type Edge,
  type Connection,
  type NodeMouseHandler,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'

import AgentNode from './AgentNode'
import type { AgentState } from '../types'

const NODE_TYPES = { agent: AgentNode }

interface Props {
  agents: Record<string, AgentState>
  selectedAgentId: string | null
  onSelectAgent: (id: string | null) => void
  onUpdatePosition: (id: string, x: number, y: number) => void
  onCreateClick: () => void
}

// deterministic grid layout for new agents
function gridPos(index: number) {
  const cols = 4
  const col = index % cols
  const row = Math.floor(index / cols)
  return { x: 80 + col * 240, y: 80 + row * 180 }
}

export default function AgentCanvas({
  agents,
  selectedAgentId,
  onSelectAgent,
  onUpdatePosition,
  onCreateClick,
}: Props) {
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([])
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([])

  // sync agents → nodes
  useEffect(() => {
    const agentList = Object.values(agents)

    setNodes((prev) => {
      const existingIds = new Set(prev.map((n) => n.id))
      const incomingIds = new Set(agentList.map((a) => a.id))

      // remove deleted
      const filtered = prev.filter((n) => incomingIds.has(n.id))

      // update existing + add new
      const updated = filtered.map((n) => {
        const agent = agents[n.id]
        if (!agent) return n
        return {
          ...n,
          data: { ...agent, selected: agent.id === selectedAgentId },
        }
      })

      const newNodes = agentList
        .filter((a) => !existingIds.has(a.id))
        .map((a, i) => {
          const pos = a.x !== 0 || a.y !== 0
            ? { x: a.x, y: a.y }
            : gridPos(prev.length + i)
          return {
            id: a.id,
            type: 'agent',
            position: pos,
            data: { ...a, selected: a.id === selectedAgentId },
          } as Node
        })

      return [...updated, ...newNodes]
    })
  }, [agents, selectedAgentId])

  // update selected state on existing nodes without full rebuild
  useEffect(() => {
    setNodes((prev) =>
      prev.map((n) => ({
        ...n,
        data: { ...n.data, selected: n.id === selectedAgentId },
      }))
    )
  }, [selectedAgentId])

  const onConnect = useCallback(
    (connection: Connection) => setEdges((eds) => addEdge({ ...connection, animated: true, style: { stroke: 'rgba(110,231,183,0.3)' } }, eds)),
    [setEdges]
  )

  const onNodeClick: NodeMouseHandler = useCallback(
    (_, node) => onSelectAgent(node.id),
    [onSelectAgent]
  )

  const onPaneClick = useCallback(() => onSelectAgent(null), [onSelectAgent])

  const onNodeDragStop: NodeMouseHandler = useCallback(
    (_, node) => onUpdatePosition(node.id, node.position.x, node.position.y),
    [onUpdatePosition]
  )

  return (
    <div style={{ width: '100%', height: '100%', background: '#0c0c0f', position: 'relative' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        onPaneClick={onPaneClick}
        onNodeDragStop={onNodeDragStop}
        nodeTypes={NODE_TYPES}
        fitView
        fitViewOptions={{ padding: 0.3 }}
        minZoom={0.3}
        maxZoom={2}
        proOptions={{ hideAttribution: true }}
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={24}
          size={1}
          color="rgba(255,255,255,0.04)"
        />
        <Controls
          style={{
            background: '#141418',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 8,
          }}
        />
        <MiniMap
          style={{
            background: '#0c0c0f',
            border: '1px solid rgba(255,255,255,0.08)',
          }}
          nodeColor={(n) => {
            const status = (n.data as AgentState).status
            const colors: Record<string, string> = {
              idle: '#374151', running: '#3b82f6', waiting: '#f59e0b',
              blocked: '#f97316', done: '#10b981', error: '#ef4444',
            }
            return colors[status] ?? '#374151'
          }}
          maskColor="rgba(0,0,0,0.5)"
        />
      </ReactFlow>

      {/* top-right toolbar */}
      <div
        style={{
          position: 'absolute',
          top: 16,
          right: 16,
          display: 'flex',
          gap: 8,
          zIndex: 10,
        }}
      >
        <button
          onClick={onCreateClick}
          style={{
            background: 'rgba(110,231,183,0.12)',
            border: '1px solid rgba(110,231,183,0.3)',
            borderRadius: 8,
            color: '#6ee7b7',
            padding: '8px 16px',
            fontSize: 12,
            fontFamily: "'JetBrains Mono', monospace",
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            letterSpacing: '0.03em',
            transition: 'all 0.15s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(110,231,183,0.2)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(110,231,183,0.12)'
          }}
        >
          + spawn agent
        </button>
      </div>

      {/* empty state */}
      {Object.keys(agents).length === 0 && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 16,
            pointerEvents: 'none',
          }}
        >
          <div style={{ color: '#1e1e28', fontSize: 80, lineHeight: 1 }}>◈</div>
          <p style={{ color: '#374151', fontSize: 13, fontFamily: 'monospace', letterSpacing: '0.05em' }}>
            no agents running — spawn one to start
          </p>
        </div>
      )}
    </div>
  )
}

<script lang="ts">
  import { agentStore } from '../stores/agentStore'
  import { uiStore } from '../stores/uiStore'
  import type { Message } from '../stores/agentStore'

  let { agentId }: { agentId: string } = $props()
  let messages = $state<Message[]>([])
  let agent = $derived(agentStore.agents.get(agentId))

  $effect(() => {
    agentStore.send('get_messages', { agent_id: agentId })
  })

  // Listen for message responses
  // Messages come via a separate WS event; for now show agent state
</script>

<aside class="inspector">
  <div class="header">
    <div class="agent-info">
      <h2 class="name">{agent?.name || agentId}</h2>
      <span class="badge" class:running={agent?.status === 'running'}
            class:idle={agent?.status === 'idle'}
            class:error={agent?.status === 'error'}
            class:blocked={agent?.status === 'blocked'}
            class:waiting={agent?.status === 'waiting'}
            class:done={agent?.status === 'done'}>
        &#x25CF; {agent?.status?.toUpperCase() || 'UNKNOWN'}
      </span>
    </div>
    <button class="close" onclick={() => uiStore.selectAgent(null)}>&times;</button>
  </div>

  {#if agent?.current_task}
    <div class="task">
      <span class="label">Task</span>
      <p>{agent.current_task}</p>
    </div>
  {/if}

  {#if agent?.pending_question}
    <div class="question">
      <span class="label">Waiting for answer</span>
      <p>{agent.pending_question}</p>
    </div>
  {/if}

  <div class="meta">
    <span class="label">Model</span>
    <span class="value">{agent?.model || '--'}</span>
    <span class="label">Team</span>
    <span class="value">{agent?.team || 'default'}</span>
  </div>
</aside>

<style>
  .inspector {
    position: absolute;
    top: 42px;
    right: 0;
    bottom: 0;
    width: 340px;
    background: rgba(20, 20, 24, 0.80);
    backdrop-filter: saturate(180%) blur(20px);
    border-left: 1px solid rgba(255, 255, 255, 0.06);
    z-index: 90;
    padding: 20px;
    overflow-y: auto;
    animation: slideIn 200ms ease-out;
  }
  @keyframes slideIn {
    from { transform: translateX(100%); }
    to { transform: translateX(0); }
  }
  .header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 16px;
  }
  .name {
    font-size: 20px;
    font-weight: 600;
    letter-spacing: -0.2px;
    margin: 0 0 6px;
  }
  .badge {
    display: inline-block;
    font-size: 11px;
    font-weight: 500;
    padding: 2px 8px;
    border-radius: 9999px;
    color: white;
    background: #64748b;
  }
  .badge.running { background: #10b981; }
  .badge.error { background: #ef4444; }
  .badge.blocked { background: #f59e0b; }
  .badge.waiting { background: #8b5cf6; }
  .badge.done { background: #6ee7b7; color: #0c0c0f; }
  .close {
    background: rgba(26, 26, 30, 0.8);
    border: none;
    color: #94a3b8;
    width: 36px;
    height: 36px;
    border-radius: 50%;
    font-size: 20px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: transform 150ms ease-out;
  }
  .close:active { transform: scale(0.95); }
  .close:hover { color: #f1f5f9; }
  .task, .question, .meta {
    margin-top: 12px;
    padding: 12px;
    background: rgba(26, 26, 30, 0.6);
    border-radius: 8px;
  }
  .label {
    font-size: 11px;
    font-weight: 500;
    color: #94a3b8;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    display: block;
    margin-bottom: 4px;
  }
  .task p, .question p {
    font-size: 13px;
    color: #f1f5f9;
    margin: 0;
    font-family: "JetBrains Mono", "SF Mono", monospace;
    line-height: 1.5;
  }
  .meta {
    display: grid;
    grid-template-columns: auto 1fr;
    gap: 4px 12px;
  }
  .value {
    font-size: 13px;
    color: #f1f5f9;
  }
</style>

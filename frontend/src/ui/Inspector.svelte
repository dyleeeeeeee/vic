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
        {agent?.status?.toUpperCase() || 'UNKNOWN'}
      </span>
    </div>
    <button class="close" onclick={() => uiStore.selectAgent(null)}>&times;</button>
  </div>

  {#if agent?.current_task}
    <div class="section">
      <span class="label">Task</span>
      <p class="content">{agent.current_task}</p>
    </div>
  {/if}

  {#if agent?.pending_question}
    <div class="section">
      <span class="label">Waiting for answer</span>
      <p class="content">{agent.pending_question}</p>
    </div>
  {/if}

  <div class="meta">
    <span class="label">Model</span>
    <span class="value">{agent?.model || '--'}</span>
    <span class="label">Team</span>
    <span class="value">{agent?.team || 'default'}</span>
  </div>

  <div class="actions">
    <button class="delete-btn" onclick={() => { agentStore.send('delete_agent', { agent_id: agentId }); uiStore.selectAgent(null) }}>
      Delete Agent
    </button>
  </div>
</aside>

<style>
  .inspector {
    position: absolute;
    top: 44px;
    right: 0;
    bottom: 0;
    width: 340px;
    background: rgba(39, 39, 41, 0.85);
    backdrop-filter: saturate(180%) blur(20px);
    border-left: 1px solid rgba(255, 255, 255, 0.08);
    z-index: 90;
    padding: 24px;
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
    margin-bottom: 24px;
  }
  .name {
    font-family: "SF Pro Display", system-ui, -apple-system, sans-serif;
    font-size: 21px;
    font-weight: 600;
    line-height: 1.19;
    letter-spacing: 0.231px;
    color: #ffffff;
    margin: 0 0 8px;
  }
  .badge {
    display: inline-block;
    font-family: "SF Pro Text", system-ui, -apple-system, sans-serif;
    font-size: 12px;
    font-weight: 400;
    letter-spacing: -0.12px;
    padding: 4px 12px;
    border-radius: 9999px;
    color: #ffffff;
    background: #7a7a7a;
  }
  .badge.running { background: #0066cc; }
  .badge.error { background: #ef4444; }
  .badge.blocked { background: #f59e0b; color: #1d1d1f; }
  .badge.waiting { background: #8b5cf6; }
  .badge.done { background: #34d399; color: #1d1d1f; }
  .badge.idle { background: #333333; }
  .close {
    background: rgba(210, 210, 215, 0.16);
    border: none;
    color: #ffffff;
    width: 44px;
    height: 44px;
    border-radius: 9999px;
    font-size: 20px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: transform 150ms ease-out;
  }
  .close:active { transform: scale(0.95); }
  .section, .meta {
    margin-top: 12px;
    padding: 17px;
    background: rgba(37, 37, 39, 0.8);
    border-radius: 18px;
  }
  .label {
    font-family: "SF Pro Text", system-ui, -apple-system, sans-serif;
    font-size: 12px;
    font-weight: 400;
    letter-spacing: -0.12px;
    color: #cccccc;
    display: block;
    margin-bottom: 4px;
  }
  .content {
    font-family: "SF Pro Text", system-ui, -apple-system, sans-serif;
    font-size: 14px;
    font-weight: 400;
    line-height: 1.43;
    letter-spacing: -0.224px;
    color: #ffffff;
    margin: 0;
  }
  .meta {
    display: grid;
    grid-template-columns: auto 1fr;
    gap: 8px 12px;
  }
  .value {
    font-family: "SF Pro Text", system-ui, -apple-system, sans-serif;
    font-size: 14px;
    font-weight: 400;
    letter-spacing: -0.224px;
    color: #ffffff;
  }
  .actions {
    margin-top: 24px;
  }
  .delete-btn {
    width: 100%;
    background: transparent;
    border: 1px solid rgba(239, 68, 68, 0.4);
    color: #ef4444;
    font-family: "SF Pro Text", system-ui, -apple-system, sans-serif;
    font-size: 14px;
    font-weight: 400;
    letter-spacing: -0.224px;
    padding: 11px 22px;
    border-radius: 9999px;
    cursor: pointer;
    transition: transform 150ms ease-out;
  }
  .delete-btn:active { transform: scale(0.95); }
</style>

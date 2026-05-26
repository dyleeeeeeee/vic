<script lang="ts">
  import { agentStore } from '../stores/agentStore'

  let { agentId }: { agentId: string } = $props()
  let agent = $derived(agentStore.agents.get(agentId))
</script>

{#if agent}
  <div class="tooltip">
    <span class="name">{agent.name}</span>
    <span class="status">{agent.status}</span>
    {#if agent.current_task}
      <span class="task">{agent.current_task.slice(0, 60)}</span>
    {/if}
  </div>
{/if}

<style>
  .tooltip {
    position: absolute;
    top: 60px;
    left: 50%;
    transform: translateX(-50%);
    background: rgba(20, 20, 24, 0.85);
    backdrop-filter: saturate(180%) blur(20px);
    border-radius: 8px;
    padding: 8px 12px;
    z-index: 80;
    display: flex;
    flex-direction: column;
    gap: 2px;
    pointer-events: none;
  }
  .name {
    font-size: 13px;
    font-weight: 600;
    color: #f1f5f9;
  }
  .status {
    font-size: 11px;
    color: #94a3b8;
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }
  .task {
    font-size: 12px;
    color: #94a3b8;
    font-family: "JetBrains Mono", "SF Mono", monospace;
  }
</style>

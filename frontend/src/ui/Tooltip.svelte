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
    background: rgba(39, 39, 41, 0.9);
    backdrop-filter: saturate(180%) blur(20px);
    border-radius: 11px;
    padding: 12px 16px;
    z-index: 80;
    display: flex;
    flex-direction: column;
    gap: 4px;
    pointer-events: none;
  }
  .name {
    font-family: "SF Pro Text", system-ui, -apple-system, sans-serif;
    font-size: 14px;
    font-weight: 600;
    line-height: 1.29;
    letter-spacing: -0.224px;
    color: #ffffff;
  }
  .status {
    font-family: "SF Pro Text", system-ui, -apple-system, sans-serif;
    font-size: 12px;
    font-weight: 400;
    letter-spacing: -0.12px;
    color: #cccccc;
    text-transform: uppercase;
  }
  .task {
    font-family: "SF Pro Text", system-ui, -apple-system, sans-serif;
    font-size: 12px;
    font-weight: 400;
    letter-spacing: -0.12px;
    color: #cccccc;
  }
</style>

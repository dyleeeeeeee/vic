<script lang="ts">
  import { uiStore } from '../stores/uiStore'

  let { connected, agentCount }: { connected: boolean; agentCount: number } = $props()
</script>

<header class="topbar">
  <div class="left">
    <span class="logo">&#x25C8; vic</span>
  </div>
  <div class="right">
    <button class="create-btn" onclick={() => uiStore.openCreateModal()}>+ Agent</button>
    <span class="count">{agentCount} agent{agentCount !== 1 ? 's' : ''}</span>
    <span class="dot" class:connected></span>
  </div>
</header>

<style>
  .topbar {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 42px;
    background: #0a0a0e;
    border-bottom: 1px solid rgba(255, 255, 255, 0.06);
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 16px;
    z-index: 100;
    font-size: 12px;
  }
  .logo {
    color: #10b981;
    font-weight: 700;
    letter-spacing: 0.08em;
    font-size: 11px;
    text-transform: uppercase;
  }
  .right {
    display: flex;
    align-items: center;
    gap: 12px;
  }
  .count {
    color: #475569;
  }
  .dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #ef4444;
  }
  .dot.connected {
    background: #10b981;
  }
  .create-btn {
    background: transparent;
    border: 1px solid #10b981;
    color: #10b981;
    border-radius: 9999px;
    padding: 4px 12px;
    font-size: 11px;
    font-weight: 500;
    cursor: pointer;
    transition: transform 150ms ease-out;
  }
  .create-btn:active {
    transform: scale(0.95);
  }
</style>

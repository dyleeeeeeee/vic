<script lang="ts">
  import { uiStore } from '../stores/uiStore'

  let { connected, agentCount }: { connected: boolean; agentCount: number } = $props()
</script>

<header class="topbar">
  <div class="left">
    <span class="logo">vic</span>
  </div>
  <div class="right">
    <span class="count">{agentCount} agent{agentCount !== 1 ? 's' : ''}</span>
    <span class="dot" class:connected></span>
    <button class="create-btn" onclick={() => uiStore.openCreateModal()}>+ Agent</button>
  </div>
</header>

<style>
  .topbar {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 44px;
    background: #000000;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 20px;
    z-index: 100;
  }
  .logo {
    font-family: "SF Pro Display", system-ui, -apple-system, sans-serif;
    font-size: 21px;
    font-weight: 600;
    letter-spacing: 0.231px;
    color: #ffffff;
  }
  .right {
    display: flex;
    align-items: center;
    gap: 12px;
  }
  .count {
    font-family: "SF Pro Text", system-ui, -apple-system, sans-serif;
    font-size: 12px;
    font-weight: 400;
    letter-spacing: -0.12px;
    color: #cccccc;
  }
  .dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #ef4444;
  }
  .dot.connected {
    background: #34d399;
  }
  .create-btn {
    background: #0066cc;
    border: none;
    color: #ffffff;
    border-radius: 9999px;
    padding: 8px 16px;
    font-family: "SF Pro Text", system-ui, -apple-system, sans-serif;
    font-size: 14px;
    font-weight: 400;
    letter-spacing: -0.224px;
    cursor: pointer;
    transition: transform 150ms ease-out;
  }
  .create-btn:active {
    transform: scale(0.95);
  }
  .create-btn:focus-visible {
    outline: 2px solid #0071e3;
    outline-offset: 2px;
  }
</style>

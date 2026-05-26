<script lang="ts">
  import { agentStore } from '../stores/agentStore'
  import { uiStore } from '../stores/uiStore'

  let name = $state('')
  let model = $state('us.anthropic.claude-sonnet-4-20250514-v1:0')
  let systemPrompt = $state('You are a helpful AI agent. Complete the tasks given to you.')
  let apiKey = $state('')
  let team = $state('development')

  function submit() {
    if (!name.trim()) return
    agentStore.send('create_agent', {
      config: {
        name: name.trim(),
        model,
        system_prompt: systemPrompt,
        ...(apiKey.trim() ? { api_key: apiKey } : {}),
        team,
      }
    })
    uiStore.closeCreateModal()
    name = ''
    apiKey = ''
  }

  function onKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape') uiStore.closeCreateModal()
  }
</script>

<svelte:window on:keydown={onKeydown} />

<div class="backdrop" role="button" tabindex="-1" onclick={() => uiStore.closeCreateModal()} onkeydown={(e) => { if (e.key === 'Escape') uiStore.closeCreateModal() }}>
  <div class="modal" role="dialog" onclick={(e) => e.stopPropagation()} onkeydown={(e) => e.stopPropagation()}>
    <h2>Create Agent</h2>

    <label>
      <span>Name</span>
      <input bind:value={name} placeholder="planner-01" />
    </label>

    <label>
      <span>Team</span>
      <select bind:value={team}>
        <option value="architecture">Architecture</option>
        <option value="development">Development</option>
        <option value="review">Review</option>
        <option value="operations">Operations</option>
      </select>
    </label>

    <label>
      <span>Model</span>
      <input bind:value={model} />
    </label>

    <label>
      <span>System Prompt</span>
      <textarea bind:value={systemPrompt} rows="3"></textarea>
    </label>

    <label>
      <span>API Key (optional, uses server credentials if blank)</span>
      <input bind:value={apiKey} type="password" placeholder="Leave blank to use server auth" />
    </label>

    <div class="actions">
      <button class="secondary" onclick={() => uiStore.closeCreateModal()}>Cancel</button>
      <button class="primary" onclick={submit} disabled={!name.trim()}>Create</button>
    </div>
  </div>
</div>

<style>
  .backdrop {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.6);
    z-index: 200;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .modal {
    background: #141418;
    border-radius: 12px;
    padding: 24px;
    width: 400px;
    max-width: 90vw;
  }
  h2 {
    font-size: 20px;
    font-weight: 600;
    letter-spacing: -0.2px;
    margin: 0 0 16px;
  }
  label {
    display: block;
    margin-bottom: 12px;
  }
  label span {
    font-size: 11px;
    font-weight: 500;
    color: #94a3b8;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    display: block;
    margin-bottom: 4px;
  }
  input, select, textarea {
    width: 100%;
    background: #1a1a1e;
    border: 1px solid rgba(255, 255, 255, 0.06);
    border-radius: 8px;
    padding: 8px 12px;
    color: #f1f5f9;
    font-size: 14px;
    font-family: inherit;
    outline: none;
  }
  input:focus, select:focus, textarea:focus {
    border-color: #10b981;
  }
  textarea {
    resize: vertical;
    font-family: "JetBrains Mono", "SF Mono", monospace;
    font-size: 12px;
  }
  .actions {
    display: flex;
    gap: 8px;
    justify-content: flex-end;
    margin-top: 16px;
  }
  .primary {
    background: #10b981;
    color: white;
    border: none;
    border-radius: 9999px;
    padding: 8px 20px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: transform 150ms ease-out;
  }
  .primary:active { transform: scale(0.95); }
  .primary:disabled { opacity: 0.4; cursor: not-allowed; }
  .secondary {
    background: transparent;
    color: #94a3b8;
    border: none;
    border-radius: 9999px;
    padding: 8px 20px;
    font-size: 14px;
    cursor: pointer;
  }
  .secondary:hover { color: #f1f5f9; }
</style>

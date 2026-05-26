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
  <div class="modal" role="dialog" tabindex="-1" onclick={(e) => e.stopPropagation()} onkeydown={(e) => e.stopPropagation()}>
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
      <span>API Key (optional)</span>
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
    background: #272729;
    border-radius: 18px;
    padding: 32px;
    width: 420px;
    max-width: 90vw;
  }
  h2 {
    font-family: "SF Pro Display", system-ui, -apple-system, sans-serif;
    font-size: 28px;
    font-weight: 600;
    line-height: 1.14;
    letter-spacing: 0.196px;
    color: #ffffff;
    margin: 0 0 24px;
  }
  label {
    display: block;
    margin-bottom: 17px;
  }
  label span {
    font-family: "SF Pro Text", system-ui, -apple-system, sans-serif;
    font-size: 12px;
    font-weight: 400;
    letter-spacing: -0.12px;
    color: #cccccc;
    display: block;
    margin-bottom: 6px;
  }
  input, select, textarea {
    width: 100%;
    background: #1d1d1f;
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 8px;
    padding: 11px 14px;
    color: #ffffff;
    font-family: "SF Pro Text", system-ui, -apple-system, sans-serif;
    font-size: 17px;
    font-weight: 400;
    line-height: 1.47;
    letter-spacing: -0.374px;
    outline: none;
    transition: border-color 150ms;
  }
  input:focus, select:focus, textarea:focus {
    border-color: #0066cc;
  }
  textarea {
    resize: vertical;
    font-size: 14px;
    line-height: 1.43;
    letter-spacing: -0.224px;
  }
  .actions {
    display: flex;
    gap: 12px;
    justify-content: flex-end;
    margin-top: 24px;
  }
  .primary {
    background: #0066cc;
    color: #ffffff;
    border: none;
    border-radius: 9999px;
    padding: 11px 22px;
    font-family: "SF Pro Text", system-ui, -apple-system, sans-serif;
    font-size: 17px;
    font-weight: 400;
    line-height: 1.0;
    letter-spacing: -0.374px;
    cursor: pointer;
    transition: transform 150ms ease-out;
  }
  .primary:active { transform: scale(0.95); }
  .primary:disabled { opacity: 0.4; cursor: not-allowed; }
  .primary:focus-visible {
    outline: 2px solid #0071e3;
    outline-offset: 2px;
  }
  .secondary {
    background: transparent;
    color: #cccccc;
    border: none;
    border-radius: 9999px;
    padding: 11px 22px;
    font-family: "SF Pro Text", system-ui, -apple-system, sans-serif;
    font-size: 17px;
    font-weight: 400;
    letter-spacing: -0.374px;
    cursor: pointer;
    transition: transform 150ms ease-out;
  }
  .secondary:hover { color: #ffffff; }
  .secondary:active { transform: scale(0.95); }
</style>

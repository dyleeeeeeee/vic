<script lang="ts">
  import { onMount, onDestroy } from 'svelte'
  import { SceneManager } from '../scene/SceneManager'
  import { agentStore } from '../stores/agentStore'
  import { uiStore } from '../stores/uiStore'
  import TopBar from './TopBar.svelte'
  import Inspector from './Inspector.svelte'
  import Tooltip from './Tooltip.svelte'
  import CreateModal from './CreateModal.svelte'
  import ReplayScrubber from './ReplayScrubber.svelte'

  let canvasContainer: HTMLDivElement
  let sceneManager: SceneManager | null = null
  let connected = $state(false)
  let agentCount = $state(0)
  let sidebarOpen = $state(false)
  let selectedId = $state<string | null>(null)
  let hoveredId = $state<string | null>(null)
  let createModalOpen = $state(false)

  onMount(() => {
    sceneManager = new SceneManager(canvasContainer)
    sceneManager.start()

    const unsub1 = agentStore.subscribe(() => {
      connected = agentStore.connected
      agentCount = agentStore.agents.size
    })

    const unsub2 = uiStore.subscribe(() => {
      sidebarOpen = uiStore.sidebarOpen
      selectedId = uiStore.selectedAgentId
      hoveredId = uiStore.hoveredAgentId
      createModalOpen = uiStore.createModalOpen
    })

    return () => {
      unsub1()
      unsub2()
      sceneManager?.dispose()
    }
  })
</script>

<div class="app">
  <TopBar {connected} {agentCount} />

  <div class="canvas-wrapper" bind:this={canvasContainer}></div>

  {#if hoveredId && !sidebarOpen}
    <Tooltip agentId={hoveredId} />
  {/if}

  {#if sidebarOpen && selectedId}
    <Inspector agentId={selectedId} />
  {/if}

  {#if createModalOpen}
    <CreateModal />
  {/if}

  <ReplayScrubber />
</div>

<style>
  .app {
    width: 100%;
    height: 100%;
    position: relative;
    overflow: hidden;
  }
  .canvas-wrapper {
    width: 100%;
    height: 100%;
    position: absolute;
    top: 0;
    left: 0;
  }
</style>

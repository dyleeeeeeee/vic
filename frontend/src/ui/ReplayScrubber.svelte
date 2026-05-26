<script lang="ts">
  import { onMount, onDestroy } from 'svelte'
  import { replayStore } from '../stores/replayStore'

  let active = $state(false)
  let playing = $state(false)
  let progress = $state(0)
  let eventCount = $state(0)
  let currentIndex = $state(0)
  let speed = $state(4)
  let loading = $state(false)

  let unsub: (() => void) | null = null

  onMount(() => {
    unsub = replayStore.subscribe(() => {
      active = replayStore.active
      playing = replayStore.playing
      progress = replayStore.progress
      eventCount = replayStore.events.length
      currentIndex = replayStore.currentIndex
      speed = replayStore.playbackSpeed
    })
  })

  onDestroy(() => unsub?.())

  async function enterReplay() {
    loading = true
    await replayStore.load()
    replayStore.enter()
    loading = false
  }

  function exitReplay() {
    replayStore.exit()
  }

  function togglePlay() {
    if (playing) replayStore.pause()
    else replayStore.play()
  }

  function onSeek(e: Event) {
    const input = e.target as HTMLInputElement
    replayStore.seekToProgress(parseFloat(input.value))
  }

  function cycleSpeed() {
    const speeds = [1, 2, 4, 8, 16]
    const idx = speeds.indexOf(speed)
    replayStore.playbackSpeed = speeds[(idx + 1) % speeds.length]
  }

  function formatTime(ts: number): string {
    if (!ts) return '--:--'
    const d = new Date(ts * 1000)
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  }
</script>

{#if !active}
  <button class="replay-trigger" onclick={enterReplay} disabled={loading}>
    {loading ? '...' : '⏪'}
  </button>
{:else}
  <div class="scrubber">
    <button class="scrubber-btn" onclick={exitReplay} title="Exit replay">✕</button>
    <button class="scrubber-btn" onclick={togglePlay} title={playing ? 'Pause' : 'Play'}>
      {playing ? '⏸' : '▶'}
    </button>
    <span class="time">{formatTime(replayStore.startTime)}</span>
    <input
      type="range"
      class="timeline"
      min="0"
      max="1"
      step="0.001"
      value={progress}
      oninput={onSeek}
    />
    <span class="time">{formatTime(replayStore.endTime)}</span>
    <button class="scrubber-btn speed" onclick={cycleSpeed} title="Playback speed">
      {speed}x
    </button>
    <span class="event-count">{currentIndex}/{eventCount}</span>
  </div>
{/if}

<style>
  .replay-trigger {
    position: fixed;
    bottom: 16px;
    left: 50%;
    transform: translateX(-50%);
    background: rgba(20, 20, 24, 0.85);
    backdrop-filter: blur(12px);
    border: 1px solid rgba(255, 255, 255, 0.06);
    border-radius: 9999px;
    padding: 8px 16px;
    color: #94a3b8;
    font-size: 14px;
    cursor: pointer;
    z-index: 100;
    transition: color 150ms;
  }
  .replay-trigger:hover { color: #f1f5f9; }
  .replay-trigger:disabled { opacity: 0.4; cursor: wait; }

  .scrubber {
    position: fixed;
    bottom: 16px;
    left: 50%;
    transform: translateX(-50%);
    background: rgba(20, 20, 24, 0.9);
    backdrop-filter: blur(12px);
    border: 1px solid rgba(255, 255, 255, 0.06);
    border-radius: 12px;
    padding: 8px 16px;
    display: flex;
    align-items: center;
    gap: 10px;
    z-index: 100;
    min-width: 480px;
  }

  .scrubber-btn {
    background: none;
    border: none;
    color: #94a3b8;
    font-size: 14px;
    cursor: pointer;
    padding: 4px 8px;
    border-radius: 4px;
    transition: color 150ms;
  }
  .scrubber-btn:hover { color: #f1f5f9; }
  .scrubber-btn.speed {
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.02em;
  }

  .timeline {
    flex: 1;
    height: 4px;
    appearance: none;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 2px;
    cursor: pointer;
    outline: none;
  }
  .timeline::-webkit-slider-thumb {
    appearance: none;
    width: 12px;
    height: 12px;
    border-radius: 50%;
    background: #10b981;
    cursor: grab;
  }
  .timeline::-moz-range-thumb {
    width: 12px;
    height: 12px;
    border-radius: 50%;
    background: #10b981;
    border: none;
    cursor: grab;
  }

  .time {
    font-size: 11px;
    color: #64748b;
    font-family: "JetBrains Mono", "SF Mono", monospace;
    white-space: nowrap;
  }

  .event-count {
    font-size: 10px;
    color: #475569;
    font-family: "JetBrains Mono", "SF Mono", monospace;
    white-space: nowrap;
  }
</style>

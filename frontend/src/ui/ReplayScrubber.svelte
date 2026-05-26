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
    {loading ? '...' : 'Replay'}
  </button>
{:else}
  <div class="scrubber">
    <button class="scrubber-btn" onclick={exitReplay} title="Exit replay">&times;</button>
    <button class="scrubber-btn" onclick={togglePlay} title={playing ? 'Pause' : 'Play'}>
      {playing ? '||' : '▶'}
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
    bottom: 20px;
    left: 50%;
    transform: translateX(-50%);
    background: rgba(39, 39, 41, 0.85);
    backdrop-filter: saturate(180%) blur(20px);
    border: none;
    border-radius: 9999px;
    padding: 8px 20px;
    color: #2997ff;
    font-family: "SF Pro Text", system-ui, -apple-system, sans-serif;
    font-size: 14px;
    font-weight: 400;
    letter-spacing: -0.224px;
    cursor: pointer;
    z-index: 100;
    transition: transform 150ms ease-out;
  }
  .replay-trigger:hover { color: #ffffff; }
  .replay-trigger:active { transform: translateX(-50%) scale(0.95); }
  .replay-trigger:disabled { opacity: 0.4; cursor: wait; }

  .scrubber {
    position: fixed;
    bottom: 20px;
    left: 50%;
    transform: translateX(-50%);
    background: rgba(39, 39, 41, 0.9);
    backdrop-filter: saturate(180%) blur(20px);
    border-radius: 9999px;
    padding: 10px 20px;
    display: flex;
    align-items: center;
    gap: 12px;
    z-index: 100;
    min-width: 480px;
  }

  .scrubber-btn {
    background: none;
    border: none;
    color: #cccccc;
    font-family: "SF Pro Text", system-ui, -apple-system, sans-serif;
    font-size: 14px;
    cursor: pointer;
    padding: 4px 8px;
    border-radius: 9999px;
    transition: color 150ms, transform 150ms;
  }
  .scrubber-btn:hover { color: #ffffff; }
  .scrubber-btn:active { transform: scale(0.95); }
  .scrubber-btn.speed {
    font-size: 12px;
    font-weight: 600;
    color: #2997ff;
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
    width: 14px;
    height: 14px;
    border-radius: 50%;
    background: #0066cc;
    cursor: grab;
  }
  .timeline::-moz-range-thumb {
    width: 14px;
    height: 14px;
    border-radius: 50%;
    background: #0066cc;
    border: none;
    cursor: grab;
  }

  .time {
    font-family: "SF Pro Text", system-ui, -apple-system, sans-serif;
    font-size: 12px;
    font-weight: 400;
    letter-spacing: -0.12px;
    color: #7a7a7a;
    white-space: nowrap;
  }

  .event-count {
    font-family: "SF Pro Text", system-ui, -apple-system, sans-serif;
    font-size: 10px;
    font-weight: 400;
    color: #7a7a7a;
    white-space: nowrap;
  }
</style>

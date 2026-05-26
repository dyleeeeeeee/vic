# TODOS

## Phase 2: Cinematic Expansions

All items below were accepted in CEO review (2026-05-26) and deferred from Phase 1 eng review.
Each has a clean interface boundary and can be built independently after Phase 1 ships.

### P1 (High value, build next)

- [ ] **Replay scrubber UI** -- Timeline bar at viewport bottom, play/pause/seek through event history
  - Why: Enables "what happened while I was away?" workflow. Uses SQLite store from Phase 1.
  - Interface: `EventStore.query(from, to)` -> replay events into scene at accelerated time
  - Effort: human ~2h / CC ~20min
  - Depends on: Phase 1 SQLite event store

- [ ] **Fog of war shader** -- Tile opacity decays based on time since last agent report
  - Why: Glanceable staleness indicator. High visual impact, low implementation cost.
  - Interface: Fragment shader on ground plane, reads timestamp uniform per tile
  - Effort: human ~1h / CC ~10min
  - Depends on: Phase 1 ground plane

- [ ] **Emergent spatial drift** -- Agents that collaborate frequently drift closer on the map
  - Why: Spatial layout IS data. Reveals actual vs configured team structure.
  - Interface: Position lerp based on message frequency between agents (from event store)
  - Effort: human ~2h / CC ~15min
  - Depends on: Phase 1 event store (message frequency)

### P2 (Atmosphere, build when base is solid)

- [ ] **Day/night real-time lighting cycle** -- Directional light angle + color temperature tied to wall clock
  - Why: Full cinematic commitment. Makes the world feel alive.
  - Interface: SceneManager.updateLighting(timeOfDay) called from clock
  - Effort: human ~1h / CC ~10min

- [ ] **Weather skybox** -- Gradient skybox interpolates between sunny/overcast/storm based on project health
  - Why: Glanceable health indicator at a distance.
  - Interface: Needs backend health metric (error rate, blocked count). ShaderMaterial on sky dome.
  - Effort: human ~2h / CC ~15min
  - Depends on: Backend metrics layer (error counters)

- [ ] **Ambient audio system** -- Office noise scales with busyness, alert tones for errors
  - Why: Difference between dashboard and living world. Audio = peripheral awareness.
  - Interface: Web Audio API context, gain nodes per sound category, mute toggle
  - Effort: human ~2h / CC ~15min

- [ ] **Building upgrade tiers** -- tent -> shed -> office -> modern -> glass tower per team productivity
  - Why: SimCity growth progression, gamifies productivity.
  - Interface: 4-5 GLTF models per building type, swap based on metric threshold
  - Effort: human ~3h / CC ~25min (mostly asset sourcing)
  - Depends on: Backend metrics (task completion counters)

### P3 (Polish, nice to have)

- [ ] **Screenshot mode** -- Chrome-free export with vignette post-processing
  - Why: Viral potential. Users share screenshots of their AI company.
  - Interface: Hide UI, apply EffectComposer vignette, canvas.toDataURL()
  - Effort: human ~20min / CC ~5min

- [ ] **Minimap** -- 120x120px bottom-left, shows viewport rectangle + agent dots
  - Why: Navigation aid when zoomed in on large maps.
  - Interface: Separate orthographic camera rendering to small canvas/texture
  - Effort: human ~1h / CC ~10min

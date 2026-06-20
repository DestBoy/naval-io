# naval.io — Phase 1 Modern-Warfare Strip Plan

This document lists every system to remove from the OpenFrontIO fork to pivot it to a pure naval game. Each removal is ordered by isolation — earlier items have fewer dependencies and should be done first.

## Strategy

1. **One system at a time.** Don't try to remove trains + nukes + SAMs in one commit.
2. **Build after each removal.** `npx tsc --noEmit && npx vite build` — must pass before moving on.
3. **Keep `NoOpExecution` fallbacks** where useful — lets client/server stay in sync during transition.
4. **Don't remove enums yet** — set them to never spawn, remove enum members only at the end.

---

## Strip Order (each is a single PR-sized commit)

### Step 1: Trains / Railroads (~40 files, ~1 day)

**Standalone files to delete entirely:**
- `src/core/game/RailNetwork.ts`
- `src/core/game/RailNetworkImpl.ts`
- `src/core/game/Railroad.ts`
- `src/core/game/RailroadSpatialGrid.ts`
- `src/core/game/TrainStation.ts`
- `src/core/execution/TrainExecution.ts`
- `src/core/execution/TrainStationExecution.ts`
- `src/core/execution/RecomputeRailClusterExecution.ts`
- `src/core/pathfinding/PathFinder.Station.ts`
- `src/core/pathfinding/algorithms/AStar.Rail.ts`
- `src/client/render/frame/RailroadCache.ts`
- `src/client/render/gl/passes/RailroadPass.ts`
- `src/client/render/gl/shaders/railroad/` (entire dir)

**Files to surgically edit (remove train/rail references):**
- `src/core/game/Game.ts` — remove `TrainType` enum, `UnitType.Train`
- `src/core/game/GameImpl.ts` — remove rail network field + methods
- `src/core/game/UnitImpl.ts` — remove train unit handling
- `src/core/game/PlayerImpl.ts` — remove rail-related player methods
- `src/core/game/GameUpdates.ts` — remove train update messages
- `src/core/execution/nation/NationStructureBehavior.ts` — remove train station spawn logic
- `src/core/execution/FactoryExecution.ts` — remove rail-network hook
- `src/core/execution/CityExecution.ts` — remove rail station hook
- `src/core/execution/PortExecution.ts` — remove rail cargo hook
- `src/core/configuration/Config.ts` — remove `UnitType.Train`, train costs, rail config
- `src/core/pathfinding/PathFinder.ts` — remove rail path mode
- `src/client/ClientGameRunner.ts` — remove train intent handlers
- `src/client/hud/SpriteLoader.ts` — remove train sprites
- `src/client/view/UnitView.ts` — remove train rendering
- `src/client/view/GameView.ts` — remove train view state
- `src/client/hud/layers/GraphicsSettingsModal.ts` — remove rail toggle
- `src/client/render/frame/Upload.ts` — remove rail upload
- `src/client/render/gl/Renderer.ts` — remove RailroadPass registration
- `src/client/render/gl/MapRenderer.ts` — remove rail hooks
- `src/client/render/types/UnitType.ts` — remove train type
- `src/client/render/types/Renderer.ts` — remove rail renderer hooks
- `src/client/render/types/index.ts` — remove rail exports
- `src/client/render/gl/render-settings.json` — remove rail settings
- `src/client/render/CLAUDE.md` — remove rail docs (cleanup)
- `src/client/render/gl/passes/fx-pass/FxSpritePass.ts` — remove train fx
- `src/client/render/gl/passes/fx-pass/index.ts` — remove train fx exports
- `src/client/controllers/BuildPreviewController.ts` — remove train build preview
- `src/client/components/baseComponents/ranking/*.ts` (4 files) — remove train stats columns
- `tests/core/game/RailNetwork.test.ts` — delete
- `tests/core/game/TrainStation.test.ts` — delete
- `tests/core/pathfinding/PathFinding.Rail.test.ts` — delete
- `resources/images/Train*` — delete (assets)

### Step 2: Nukes / MIRV (~30 files, ~1 day)

**Standalone files to delete entirely:**
- `src/core/execution/NukeExecution.ts`
- `src/core/execution/MIRVExecution.ts`
- `src/core/execution/SAMMissileExecution.ts`
- `src/core/execution/SAMLauncherExecution.ts`
- `src/core/execution/MissileSiloExecution.ts`
- `src/core/execution/ShellExecution.ts` (warship shells stay, but missile silo shells go)
- `src/core/execution/nation/NationNukeBehavior.ts`
- `src/core/execution/nation/NationMIRVBehavior.ts`
- `src/core/execution/nation/SharedWaterCache.ts` (water nuke cache — keep if reused for subs later, check first)
- `src/client/render/gl/passes/NukeTrajectoryPass.ts`
- `src/client/render/gl/passes/NukeTelegraphPass.ts`
- `src/client/render/gl/passes/FalloutBloomPass.ts`
- `src/client/render/gl/passes/FalloutLightPass.ts`
- `src/client/render/gl/passes/NightCompositePass.ts` (fallout-driven night — keep night, strip fallout)
- `src/client/render/gl/passes/SamRadiusPass.ts`
- `src/client/render/gl/utils/NukeTrajectory.ts`
- `src/client/render/gl/utils/HeatManager.ts`
- `src/client/render/gl/shaders/nuke-trajectory/` (entire dir)
- `src/client/render/gl/shaders/nuke-telegraph/`
- `src/client/render/gl/shaders/fallout-bloom/`
- `src/client/render/gl/shaders/sam-radius/`
- `src/client/render/gl/shaders/day-night/fallout-*` (4 files)

**Files to surgically edit:**
- `src/core/game/Game.ts` — remove `UnitType.{AtomBomb, HydrogenBomb, MIRV, MIRVWarhead, MissileSilo, SAMLauncher, SAMMissile}`, `Nukes` group, `BuildableAttacks` minus Warship
- `src/core/game/GameImpl.ts` — remove nuke-related methods
- `src/core/execution/ExecutionManager.ts` — remove nuke intent handlers (actually they go through ConstructionExecution, may need to keep NoOp fallback)
- `src/core/execution/nation/NationStructureBehavior.ts` — remove silo/SAM spawning
- `src/core/configuration/Config.ts` — remove `NukeMagnitude`, `SAM_CONSTRUCTION_TICKS`, nuke speeds, SAM cooldowns, silo cooldowns, `nukeMagnitudes()`, `defaultNukeSpeed()`, `defaultSamMissileSpeed()`, `waterNukes()`
- `src/core/StatsSchemas.ts` — remove `NukeType`
- `src/client/render/gl/Renderer.ts` — remove fallout/nuke/sam passes
- `src/client/render/gl/MapRenderer.ts` — remove nuke hooks
- `src/client/render/gl/utils/GpuResources.ts` — remove fallout/nuke resources
- `src/client/render/gl/GraphicsOverrides.ts` — remove nuke settings
- `src/client/render/frame/derive/NukeTelegraphs.ts` — delete
- `src/client/render/types/UnitType.ts` — remove nuke types
- `src/client/render/types/FrameEvents.ts` — remove nuke events
- `src/client/render/types/FrameData.ts` — remove nuke frame data
- `src/client/hud/layers/BuildMenu.ts` — remove nuke/silo/SAM buttons
- `src/client/hud/layers/GraphicsSettingsModal.ts` — remove fallout toggle
- `src/client/hud/layers/AlertFrame.ts` — remove nuke alert
- `src/client/hud/layers/EventsDisplay.ts` — remove nuke events
- `src/client/hud/layers/AttacksDisplay.ts` — remove nuke attack display
- `src/client/controllers/WarshipSelectionController.ts` — keep but check for nuke coupling
- `src/client/view/GameView.ts` — remove nuke view state
- `src/client/render/gl/render-settings.json` — remove nuke settings
- `src/client/render/gl/default-theme.json` — remove nuke theme entries
- `src/client/Cosmetics.ts` — remove nuke-related cosmetics
- `src/client/sound/Sounds.ts` + `SoundManager.ts` — remove nuke SFX
- `tests/nukes/` — delete entire dir (4 files)
- `tests/NukeTrajectory.test.ts` — delete
- `tests/NationNukeSamOverwhelm.test.ts` — delete
- `tests/NationCreation.test.ts` — fix (may use nuke setup)
- `tests/AllianceAcceptNukes.test.ts` — delete
- `tests/MissileSilo.test.ts` — delete
- `tests/NationMIRV.test.ts` — delete
- `resources/images/Nuke*`, `MIRV*`, `Sam*`, `Missile*` — delete assets

### Step 3: Factories → Shipyards (rename, don't delete, ~10 files, ~2 hours)

Keep the Factory unit type but rename to Shipyard. This is the structure that builds warships. This is a rename, not a strip.

- `UnitType.Factory` → `UnitType.Shipyard`
- All `FactoryExecution.ts` references
- `resources/images/Factory*` → keep, retile later
- UI labels

### Step 4: Trade Ships — KEEP (naval-relevant)

OpenFront's TradeShip is already a naval unit. Keep it. Later we'll repurpose as "Supply Ship" for island resource transport.

### Step 5: Defense Posts → Coastal Batteries (rename, ~5 files, ~1 hour)

`UnitType.DefensePost` → `UnitType.CoastalBattery`. Same role — defensive structure that fires shells at incoming ships.

### Step 6: City → Island HQ (rename, ~5 files, ~1 hour)

`UnitType.City` → `UnitType.IslandHQ`. Same role — main structure on an island, generates troops/resources.

### Step 7: Remove Modern Warfare Maps from Playlist

Edit `src/server/MapPlaylist.ts` to filter out:
- `baikalnukewars` (nuke-themed map)
- `worldinverted` (probably keep — it's just inverted)
- Any other map with "nuke" in the name

Keep naval-themed maps:
- `archipelagosea`, `warshipwarship`, `fourislands`, `surrounded`, `beringsea`, `gatewaytotheatlantic`, `straitofgibraltar`, `taiwanstrait`, `beringstrait`, `bosphorusstraits`, `danishstraits`, `straitofhormuz`, `straitofmalacca`, `juandefucastrait`, `hawaii`, `caribbean`, `aegean`, `faroeislands`, `iceland`, `falklandislands`, `oceania`, `japan`, `britannia`, `southeastasia`, `northwestpassage`, `pluto`, `luna`, `mars`, `milkyway` (novelty maps, fine to keep)

### Step 8: Disable Nuke/War-related UI Buttons

- `src/client/hud/layers/BuildMenu.ts` — only show Port, Shipyard, Coastal Battery, Warship, Submarine (after we add it)
- `src/client/hud/layers/RadialMenu.ts` — remove nuke-related radial items

---

## After Strip: What's Left (the naval MVP)

**Unit types:**
- `TransportShip` — moves troops between islands
- `Warship` — main combat ship, fires shells
- `Shell` — projectile (warship ammo, kept)
- `Port` — buildable structure, required for ships
- `Shipyard` (was Factory) — builds warships
- `CoastalBattery` (was DefensePost) — defensive structure
- `IslandHQ` (was City) — main island structure
- `TradeShip` — passive trade income

**Phase 2 will add:**
- `Submarine` — stealth unit (dives/surfaces)
- `Torpedo` — submarine projectile
- `SonarStation` — detects submarines
- `DepthCharge` — destroyer anti-sub weapon

---

## Verification Checklist

After each step:
- [ ] `npx tsc --noEmit` passes with zero errors
- [ ] `npx vite build` succeeds
- [ ] `npm run start:server-dev` boots without errors
- [ ] Open localhost:8787, see naval.io branding, can join a game

After full Phase 1:
- [ ] All nuke/SAM/MIRV/Train UI buttons gone
- [ ] No nuke/sam/rail files in src/
- [ ] Tests pass (after deleting nuke/train tests)
- [ ] Build size reduced by at least 50KB gzipped

---

## Estimated Effort

| Step | Effort | Files Touched |
|------|--------|---------------|
| 1. Trains/Rail | 1 day | ~40 |
| 2. Nukes/MIRV/SAM | 1 day | ~30 |
| 3. Factory→Shipyard rename | 2 hours | ~10 |
| 4. TradeShip (keep) | 0 | 0 |
| 5. DefensePost→CoastalBattery | 1 hour | ~5 |
| 6. City→IslandHQ | 1 hour | ~5 |
| 7. Map playlist filter | 30 min | 1 |
| 8. UI button cleanup | 2 hours | ~5 |
| **Total Phase 1** | **~3 days** | **~95 files** |

Phase 2 (submarine + sonar + torpedo combat) adds another 1-2 weeks.
Phase 3 (low-poly 3D reskin) adds another 1-2 weeks.
Phase 4 (CrazyGames submission + polish) adds 3-5 days.

**Total to Basic Launch: 4-5 weeks of solo dev.**

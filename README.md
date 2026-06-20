# naval.io

A multiplayer naval territory-control .io game. Build a fleet of ships and submarines, capture islands, form alliances, and dominate the ocean.

Forked from [OpenFrontIO](https://github.com/openfrontio/OpenFrontIO) — many thanks to the OpenFront team for the foundation. See `LICENSE`, `LICENSING.md`, and `LICENSE-ASSETS` for full attribution.

## License

- **Source code:** GNU AGPL v3.0 (inherited from OpenFrontIO)
- **Open assets (`/resources`):** CC BY-SA 4.0 (inherited from OpenFrontIO)
- **Original naval.io assets:** See `LICENSE-ASSETS` for our additions

Modified versions must preserve copyright notices in the footer and loading screen (AGPL Section 7).

## 🚀 Quick start

```bash
git clone <this-repo>
cd naval.io
npm run inst        # uses npm ci --ignore-scripts
npm run dev         # starts client + dev server
```

Open http://localhost:8787

## 🎮 Game loop

- Start with a single island and a small ship
- Build ships (Frigate / Destroyer / Dreadnought / Submarine)
- Capture neutral and enemy islands to expand territory
- Each island generates gold/materials over time
- Form alliances with other players
- Win by controlling 60%+ of the map for a 2-minute dominance timer

## 🌊 Underwater systems (MVP)

- Submarine diving / surfacing
- Sonar detection (passive + active ping)
- Depth levels (shallow / medium / deep)
- Torpedo attacks from submerged subs
- Depth charges (destroyer anti-sub weapon)

More underwater features (trenches, reefs, oil rigs, minefields, sea monsters) ship in later versions.

## 🛠 Tech stack

- **Frontend:** TypeScript + Vite + Lit + WebGL2 (custom shaders)
- **Backend:** Node.js + WebSockets (multi-worker)
- **Map generator:** Go (separate binary in `/map-generator`)
- **Multiplayer server:** Authoritative server with deterministic simulation
- **Platform:** CrazyGames SDK (ads, cosmetics, friends)

## 📋 Prerequisites

- Node.js 22+ / npm 10.9.2+
- Go 1.22+ (only for regenerating maps)
- Modern browser

## 🗂 Project structure

```
/src/client     # Frontend game client (WebGL renderer, UI)
/src/core       # Deterministic game simulation (shared client/server)
/src/server     # Backend game server (Express + WebSockets)
/resources      # Static assets (CC BY-SA 4.0)
/map-generator  # Go binary that produces map .bin files from PNGs
```

## 🚢 Development roadmap

- [x] Phase 0: Fork + rebrand (this commit)
- [ ] Phase 1: Strip modern warfare (nukes, SAMs, rails, trains, factories)
- [ ] Phase 2: Submarine + sonar + torpedo combat
- [ ] Phase 3: Low-poly 3D-ish visual reskin
- [ ] Phase 4: CrazyGames Basic Launch

## 🤝 Contributing

See `CONTRIBUTING.md`. All contributions are AGPL v3.

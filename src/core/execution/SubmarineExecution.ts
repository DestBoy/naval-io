import {
  Execution,
  Game,
  isUnit,
  OwnerComp,
  Unit,
  UnitParams,
  UnitType,
} from "../game/Game";
import { TileRef } from "../game/GameMap";
import { WaterPathFinder } from "../pathfinding/PathFinder";
import { PathStatus } from "../pathfinding/types";
import { PseudoRandom } from "../PseudoRandom";
import { TorpedoExecution } from "./TorpedoExecution";

// naval.io: Submarine execution
// MVP submarine behavior:
// - Spawns at port (like warship), starts surfaced
// - Auto-dives after 2 seconds when oxygen is full
// - Oxygen depletes 1/tick dived (30s total)
// - Auto-surfaces when oxygen hits 0
// - Finds nearby enemy ships, fires torpedoes (3s cooldown, 50-tile range)
// - Patrols within 100 tiles of patrol tile

const SUBMARINE_OXYGEN_MAX = 300;
const SUBMARINE_OXYGEN_REFILL_RATE = 3;
const SUBMARINE_DIVE_DELAY = 20;
const SUBMARINE_TORPEDO_COOLDOWN = 30;
const SUBMARINE_TORPEDO_RANGE = 50;
const SUBMARINE_PATROL_RANGE = 100;
const SUBMARINE_TARGETTING_RANGE = 60;

export class SubmarineExecution implements Execution {
  private random: PseudoRandom;
  private submarine: Unit;
  private mg: Game;
  private pathfinder: WaterPathFinder;
  private lastDiveToggleTick = 0;
  private lastEmittedCombat = false;

  constructor(
    private input: (UnitParams<UnitType.Submarine> & OwnerComp) | Unit,
  ) {}

  init(mg: Game, ticks: number): void {
    this.mg = mg;
    this.pathfinder = new WaterPathFinder(mg);
    this.random = new PseudoRandom(mg.ticks());
    if (isUnit(this.input)) {
      this.submarine = this.input;
    } else {
      const spawn = this.input.owner.canBuild(
        UnitType.Submarine,
        this.input.patrolTile,
      );
      if (spawn === false) {
        console.warn(
          `Failed to spawn submarine for ${this.input.owner.name()} at ${this.input.patrolTile}`,
        );
        return;
      }
      this.submarine = this.input.owner.buildUnit(
        UnitType.Submarine,
        spawn,
        this.input,
      );
      this.submarine.updateSubmarineState({
        oxygenTicks: SUBMARINE_OXYGEN_MAX,
        depth: 0,
        isDived: false,
      });
      this.submarine.setTargetable(true);
      console.log(
        `[naval.io] Submarine spawned for ${this.input.owner.name()} at tile ${spawn}`,
      );
    }
  }

  tick(ticks: number): void {
    if (this.submarine.health() <= 0) {
      this.submarine.delete();
      return;
    }

    const state = this.submarine.submarineState();
    const isInCombat = state.isInCombat ?? false;
    if (this.lastEmittedCombat && !isInCombat) {
      this.submarine.touch();
    }
    this.lastEmittedCombat = isInCombat;

    // Oxygen management
    if (state.isDived) {
      const newOxygen = Math.max(0, state.oxygenTicks - 1);
      if (newOxygen === 0) {
        this.surface();
        return;
      }
      this.submarine.updateSubmarineState({ oxygenTicks: newOxygen });
    } else {
      const newOxygen = Math.min(
        SUBMARINE_OXYGEN_MAX,
        state.oxygenTicks + SUBMARINE_OXYGEN_REFILL_RATE,
      );
      if (newOxygen !== state.oxygenTicks) {
        this.submarine.updateSubmarineState({ oxygenTicks: newOxygen });
      }
    }

    // Auto-dive after delay when surfaced and oxygen is full
    if (
      !state.isDived &&
      state.oxygenTicks >= SUBMARINE_OXYGEN_MAX &&
      this.mg.ticks() - this.lastDiveToggleTick > SUBMARINE_DIVE_DELAY
    ) {
      this.dive();
      return;
    }

    // Find target
    const target = this.findTarget();
    this.submarine.setTargetUnit(target);

    if (target) {
      this.maybeFireTorpedo(target, state);
      this.submarine.updateSubmarineState({ isInCombat: true });
    } else {
      this.submarine.updateSubmarineState({ isInCombat: false });
    }

    this.patrol();
  }

  private dive(): void {
    this.lastDiveToggleTick = this.mg.ticks();
    this.submarine.updateSubmarineState({
      isDived: true,
      depth: 1,
    });
    this.submarine.setTargetable(false);
  }

  private surface(): void {
    this.lastDiveToggleTick = this.mg.ticks();
    this.submarine.updateSubmarineState({
      isDived: false,
      depth: 0,
    });
    this.submarine.setTargetable(true);
  }

  private findTarget(): Unit | undefined {
    const targetTypes = [
      UnitType.Warship,
      UnitType.TransportShip,
      UnitType.TradeShip,
    ];

    const ships = this.mg.nearbyUnits(
      this.submarine.tile(),
      SUBMARINE_TARGETTING_RANGE,
      targetTypes,
    );

    const owner = this.submarine.owner();
    let bestUnit: Unit | undefined;
    let bestDist = Infinity;

    for (const { unit, distSquared } of ships) {
      if (
        unit === this.submarine ||
        unit.owner() === owner ||
        !owner.canAttackPlayer(unit.owner(), true)
      ) {
        continue;
      }
      if (
        unit.type() === UnitType.Warship &&
        unit.warshipState().state === "docked"
      ) {
        continue;
      }
      if (distSquared < bestDist) {
        bestDist = distSquared;
        bestUnit = unit;
      }
    }
    return bestUnit;
  }

  private maybeFireTorpedo(
    target: Unit,
    state: ReturnType<Unit["submarineState"]>,
  ): void {
    if (
      this.mg.ticks() - state.lastTorpedoTick <
      SUBMARINE_TORPEDO_COOLDOWN
    ) {
      return;
    }

    const distSquared = this.mg.euclideanDistSquared(
      this.submarine.tile(),
      target.tile(),
    );
    if (distSquared > SUBMARINE_TORPEDO_RANGE * SUBMARINE_TORPEDO_RANGE) {
      return;
    }

    this.submarine.updateSubmarineState({
      lastTorpedoTick: this.mg.ticks(),
    });

    this.mg.addExecution(
      new TorpedoExecution(this.submarine.tile(), this.submarine.owner(), target),
    );
  }

  private patrol(): void {
    if (this.submarine.targetTile() === undefined) {
      const randomTile = this.randomTile();
      if (randomTile === undefined) return;
      this.submarine.setTargetTile(randomTile);
    }

    const result = this.pathfinder.next(
      this.submarine.tile(),
      this.submarine.targetTile()!,
    );
    switch (result.status) {
      case PathStatus.COMPLETE:
        this.submarine.setTargetTile(undefined);
        this.submarine.move(result.node);
        break;
      case PathStatus.NEXT:
        this.submarine.move(result.node);
        break;
      case PathStatus.NOT_FOUND:
        this.submarine.setTargetTile(undefined);
        break;
    }
  }

  isActive(): boolean {
    return this.submarine?.isActive() ?? false;
  }

  activeDuringSpawnPhase(): boolean {
    return false;
  }

  randomTile(): TileRef | undefined {
    const subPatrolRange = SUBMARINE_PATROL_RANGE;
    const patrolTile = this.submarine.submarineState().patrolTile;
    if (patrolTile === undefined) return undefined;

    const subComponent = this.mg.getWaterComponent(this.submarine.tile());
    if (subComponent === null) return undefined;

    for (let attempt = 0; attempt < 50; attempt++) {
      const x =
        this.mg.x(patrolTile) +
        this.random.nextInt(-subPatrolRange / 2, subPatrolRange / 2);
      const y =
        this.mg.y(patrolTile) +
        this.random.nextInt(-subPatrolRange / 2, subPatrolRange / 2);
      if (!this.mg.isValidCoord(x, y)) continue;
      const tile = this.mg.ref(x, y);
      if (!this.mg.isWater(tile) || this.mg.isShoreline(tile)) continue;
      if (!this.mg.hasWaterComponent(tile, subComponent)) continue;
      return tile;
    }
    return undefined;
  }
}

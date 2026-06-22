import { Execution, Game, Player, Unit, UnitType } from "../game/Game";
import { TileRef } from "../game/GameMap";
import { PathFinding } from "../pathfinding/PathFinder";
import { PathStatus, SteppingPathFinder } from "../pathfinding/types";

// naval.io: Torpedo projectile
// - Travels through water toward target ship
// - 200 base damage + ±20% variance
// - 10s lifetime (can be dodged)
// - 2 steps/tick movement speed

const TORPEDO_LIFETIME_TICKS = 100;
const TORPEDO_SPEED_STEPS_PER_TICK = 2;

export class TorpedoExecution implements Execution {
  private active = true;
  private pathFinder: SteppingPathFinder<TileRef>;
  private torpedo: Unit | undefined;
  private mg: Game;
  private destroyAtTick: number = -1;
  private spawnTick: number = -1;

  constructor(
    private spawn: TileRef,
    private _owner: Player,
    private target: Unit,
  ) {}

  init(mg: Game, ticks: number): void {
    this.pathFinder = PathFinding.Air(mg);
    this.mg = mg;
    this.spawnTick = mg.ticks();
  }

  tick(ticks: number): void {
    this.torpedo ??= this._owner.buildUnit(UnitType.Torpedo, this.spawn, {
      targetUnit: this.target,
    });
    if (!this.torpedo.isActive()) {
      this.active = false;
      return;
    }

    if (
      !this.target.isActive() ||
      this.target.owner() === this.torpedo.owner()
    ) {
      this.torpedo.delete(false);
      this.active = false;
      return;
    }

    if (this.mg.ticks() - this.spawnTick > TORPEDO_LIFETIME_TICKS) {
      this.torpedo.delete(false);
      this.active = false;
      return;
    }

    for (let i = 0; i < TORPEDO_SPEED_STEPS_PER_TICK; i++) {
      const result = this.pathFinder.next(
        this.torpedo.tile(),
        this.target.tile(),
      );
      if (result.status === PathStatus.COMPLETE) {
        this.target.modifyHealth(-this.torpedoDamage(), this._owner);
        this.torpedo.setReachedTarget();
        this.torpedo.delete(false);
        this.active = false;
        return;
      } else if (result.status === PathStatus.NEXT) {
        this.torpedo.move(result.node);
      } else {
        this.torpedo.delete(false);
        this.active = false;
        return;
      }
    }
  }

  private torpedoDamage(): number {
    const info = this.mg.config().unitInfo(UnitType.Torpedo);
    const baseDamage = info.damage ?? 200;
    const variance = 0.8 + Math.random() * 0.4;
    return Math.round(baseDamage * variance);
  }

  isActive(): boolean {
    return this.active;
  }

  activeDuringSpawnPhase(): boolean {
    return false;
  }
}

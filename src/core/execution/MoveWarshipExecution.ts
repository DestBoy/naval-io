import { Execution, Game, Player, UnitType } from "../game/Game";
import { TileRef } from "../game/GameMap";

export class MoveWarshipExecution implements Execution {
  constructor(
    private readonly owner: Player,
    private readonly unitIds: number[],
    private readonly position: TileRef,
  ) {}

  init(mg: Game, _ticks: number): void {
    if (!mg.isValidRef(this.position)) {
      console.warn(`MoveWarshipExecution: position ${this.position} not valid`);
      return;
    }
    const newPatrolTileWaterComponent = mg.getWaterComponent(this.position);
    const warshipMap = new Map(
      this.owner.units(UnitType.Warship).map((u) => [u.id(), u]),
    );
    // naval.io: also build a submarine lookup map
    const submarineMap = new Map(
      this.owner.units(UnitType.Submarine).map((u) => [u.id(), u]),
    );
    for (const unitId of new Set(this.unitIds)) {
      const warship = warshipMap.get(unitId);
      const submarine = submarineMap.get(unitId);

      if (!warship && !submarine) {
        console.warn(`MoveWarshipExecution: unit ${unitId} not found`);
        continue;
      }
      const unit = warship ?? submarine!;
      if (!unit.isActive()) {
        console.warn(`MoveWarshipExecution: unit ${unitId} is not active`);
        continue;
      }
      if (!mg.hasWaterComponent(unit.tile(), newPatrolTileWaterComponent!)) {
        continue;
      }
      if (warship) {
        warship.updateWarshipState({ patrolTile: this.position });
      } else if (submarine) {
        // naval.io: update submarine patrol tile
        submarine.updateSubmarineState({ patrolTile: this.position });
      }
      unit.setTargetTile(undefined);
    }
  }

  tick(_ticks: number): void {}

  isActive(): boolean {
    return false;
  }

  activeDuringSpawnPhase(): boolean {
    return false;
  }
}

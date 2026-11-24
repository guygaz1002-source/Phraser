import type { ImageSourcePropType } from "react-native";
import type { LifeStageId } from "./lifecycle";

// Metro needs literal requires. Selection portraits remain in catalog.generated.ts.
export const lifeSprites: Record<LifeStageId, ImageSourcePropType> = {
  "moses-baby": require("../assets/sprites/life/moses-baby.png"),
  "moses-child": require("../assets/sprites/life/moses-child.png"),
  "moses-young": require("../assets/sprites/life/moses-young.png"),
  "moses-shepherd": require("../assets/sprites/life/moses-shepherd.png"),
  "moses-leader": require("../assets/sprites/life/moses-leader.png"),
  "moses-elder": require("../assets/sprites/moses.png"),
  "samson-child": require("../assets/sprites/life/samson-child.png"),
  "samson-adult": require("../assets/sprites/samson.png"),
  "samson-shorn": require("../assets/sprites/life/samson-shorn.png"),
  "samson-regrowth": require("../assets/sprites/life/samson-regrowth.png"),
  "noah-builder": require("../assets/sprites/life/noah-builder.png"),
  "noah-keeper": require("../assets/sprites/life/noah-keeper.png"),
  "noah-watcher": require("../assets/sprites/life/noah-watcher.png"),
  "noah-renewed": require("../assets/sprites/noah.png"),
};

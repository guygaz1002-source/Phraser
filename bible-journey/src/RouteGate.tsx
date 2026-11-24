import { Redirect } from "expo-router";
import React from "react";
import { useCharacters } from "./localizedCatalog";
import { useGame } from "./GameProvider";
import { routeFor } from "./game";

export function RouteGate({
  route,
  children,
}: {
  route: string;
  children: React.ReactNode;
}) {
  const { game } = useGame();
  const characters = useCharacters();
  const expected = routeFor(game, characters);
  return expected !== route ? <Redirect href={expected} /> : <>{children}</>;
}

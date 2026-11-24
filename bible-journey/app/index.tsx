import { useLocalSearchParams } from "expo-router";
import { AgeGate } from "../src/AgeGate";
import { BookTitle } from "../src/BookTitle";

export default function Opening() {
  const { screen, start } = useLocalSearchParams<{screen?: string; start?: string}>();
  return screen === "age" ? <AgeGate fresh={start === "new"} /> : <BookTitle />;
}

import { useLocale } from "./LocaleProvider";
import { catalogFor } from "./catalogs";
export { catalogFor } from "./catalogs";
export function useCharacters() { return catalogFor(useLocale().language); }

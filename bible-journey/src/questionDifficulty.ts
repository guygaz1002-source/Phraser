/** Original option indexes stay stable for grading, saved turns and language switches. */
export function guidedChoices(count: number, answer: number, limit: number, seed: number) {
  const indices = Array.from({length: count}, (_,i) => i);
  if (limit >= count || answer < 0 || answer >= count) return indices;

  // Shuffle from the saved slide position, then keep the correct option and a
  // few distractors. Which side has the correct answer varies between slides.
  let state = seed >>> 0;
  for (let i = indices.length - 1; i > 0; i--) {
    state = (Math.imul(state,1664525) + 1013904223) >>> 0;
    const j = Math.floor((state / 0x100000000) * (i+1));
    [indices[i],indices[j]] = [indices[j]!,indices[i]!];
  }
  const others = indices.filter(i => i !== answer).slice(0,limit-1);
  return indices.filter(i => i === answer || others.includes(i));
}

export function pictureChoiceLimit(map: number, youngest: boolean) {
  if (map === 1) return 2;
  if (map === 2) return 3;
  if (youngest) return 4;
  return map <= 4 ? 3 : 0;
}

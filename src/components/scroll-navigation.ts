/** Last section to cross the activation line; gaps retain the prior destination. */
export function activeSection(starts: readonly number[], line: number) {
  let active = 0;
  starts.forEach((top, index) => {
    if (top <= line) active = index;
  });
  return active;
}

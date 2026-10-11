/** Colori assegnati alle classi del modello, in ordine. */
export const CLASS_COLORS = [
  '#6C47FF', // viola
  '#FF5C8A', // rosa
  '#00B894', // verde
  '#FFB400', // giallo
  '#1E90FF', // blu
  '#FF7A1A', // arancio
  '#00C2D1', // ciano
  '#B23AFF', // magenta
]

export function classColor(index: number): string {
  return CLASS_COLORS[index % CLASS_COLORS.length]
}

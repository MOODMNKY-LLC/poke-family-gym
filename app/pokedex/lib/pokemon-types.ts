export const typeColors = {
  normal: "bg-neutral-400 hover:bg-neutral-500",
  fire: "bg-red-500 hover:bg-red-600",
  water: "bg-blue-500 hover:bg-blue-600",
  grass: "bg-emerald-500 hover:bg-emerald-600",
  electric: "bg-primary hover:bg-primary/90",
  ice: "bg-cyan-400 hover:bg-cyan-500",
  fighting: "bg-red-700 hover:bg-red-800",
  poison: "bg-violet-500 hover:bg-violet-600",
  ground: "bg-amber-600 hover:bg-amber-700",
  flying: "bg-indigo-400 hover:bg-indigo-500",
  psychic: "bg-pink-500 hover:bg-pink-600",
  bug: "bg-lime-500 hover:bg-lime-600",
  rock: "bg-stone-500 hover:bg-stone-600",
  ghost: "bg-purple-600 hover:bg-purple-700",
  dragon: "bg-indigo-600 hover:bg-indigo-700",
  dark: "bg-neutral-800 hover:bg-neutral-900",
  steel: "bg-zinc-400 hover:bg-zinc-500",
  fairy: "bg-pink-400 hover:bg-pink-500",
} as const

export type PokemonType = keyof typeof typeColors 
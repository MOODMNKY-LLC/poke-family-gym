import { Pokemon } from "pokenode-ts"
import Image from "next/image"

interface PokemonCardProps {
  pokemon: Pokemon
}

export function PokemonCard({ pokemon }: PokemonCardProps) {
  return (
    <div className="relative flex flex-col items-center rounded-lg border bg-card p-4 shadow-sm transition-shadow hover:shadow-lg">
      {/* Pokemon Image */}
      <div className="relative h-32 w-32">
        <Image
          src={pokemon.sprites.front_default || "/placeholder-pokemon.png"}
          alt={pokemon.name}
          fill
          className="object-contain"
          priority
        />
      </div>

      {/* Pokemon Info */}
      <div className="mt-4 text-center">
        <h3 className="text-lg font-semibold capitalize">{pokemon.name}</h3>
        <div className="mt-2 flex gap-2">
          {pokemon.types.map((type) => (
            <span
              key={type.type.name}
              className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium"
            >
              {type.type.name}
            </span>
          ))}
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
          <div>HP: {pokemon.stats[0].base_stat}</div>
          <div>Attack: {pokemon.stats[1].base_stat}</div>
        </div>
      </div>
    </div>
  )
} 
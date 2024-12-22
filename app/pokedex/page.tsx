import { PokemonGrid } from "./components/pokemon-grid"
import { PokedexHero } from "./components/pokedex-hero"

export default function PokedexPage() {
  return (
    <div>
      <PokedexHero />
      <div className="container py-8">
        <PokemonGrid />
      </div>
    </div>
  )
} 
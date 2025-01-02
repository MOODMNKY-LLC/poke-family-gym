export type Pokeball = {
  name: string;
  baseValue: number;
  image: string;
  quantity: number;
  rarity: string;
}

export type FamilyMember = {
  id: string;
  name: string;
  role: 'parent' | 'child';
}

export type TaskTemplate = {
  id: string;
  title: string;
  description: string;
  pokeballType: string;
  value: number;
  estimatedTime?: string;
}

export type Task = TaskTemplate & {
  assignedTo: string;
  dateDue: string;
  dateCreated: string; // New field to store the creation date
}

export const pokeballs: Pokeball[] = [
  { name: "Poke Ball", baseValue: 1, image: "/placeholder.svg?height=100&width=100", quantity: 50, rarity: "Common" },
  { name: "Great Ball", baseValue: 2, image: "/placeholder.svg?height=100&width=100", quantity: 30, rarity: "Uncommon" },
  { name: "Ultra Ball", baseValue: 3, image: "/placeholder.svg?height=100&width=100", quantity: 15, rarity: "Rare" },
  { name: "Master Ball", baseValue: 5, image: "/placeholder.svg?height=100&width=100", quantity: 5, rarity: "Ultra Rare" },
]

export const familyMembers: FamilyMember[] = [
  { id: "1", name: "Mom", role: "parent" },
  { id: "2", name: "Dad", role: "parent" },
  { id: "3", name: "Alex", role: "child" },
  { id: "4", name: "Sam", role: "child" },
  { id: "5", name: "Jamie", role: "child" },
]

export const dummyTaskTemplates: TaskTemplate[] = [
  {
    id: "1",
    title: "Clean Your Room",
    description: "Tidy up your room, make your bed, and put away all toys and clothes.",
    pokeballType: "Poke Ball",
    value: 2,
    estimatedTime: "30 minutes",
  },
  {
    id: "2",
    title: "Do Your Homework",
    description: "Complete all assigned homework for the day.",
    pokeballType: "Great Ball",
    value: 3,
    estimatedTime: "1 hour",
  },
  {
    id: "3",
    title: "Help with Dinner",
    description: "Assist in preparing dinner by setting the table and helping with simple cooking tasks.",
    pokeballType: "Ultra Ball",
    value: 4,
    estimatedTime: "45 minutes",
  },
  {
    id: "4",
    title: "Walk the Dog",
    description: "Take the family dog for a 20-minute walk around the neighborhood.",
    pokeballType: "Poke Ball",
    value: 2,
    estimatedTime: "20 minutes",
  },
  {
    id: "5",
    title: "Weekly Room Deep Clean",
    description: "Perform a thorough cleaning of your room, including dusting, vacuuming, and organizing.",
    pokeballType: "Master Ball",
    value: 6,
    estimatedTime: "2 hours",
  },
]


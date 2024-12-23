-- Migration: Add Pokémon Customization Fields
-- Description: Add fields for customizing partner Pokémon
-- Author: MOODMNKY LLC

begin;

-- Add new columns for Pokémon customization
alter table family_members
  add column if not exists starter_pokemon_friendship integer default 0,
  add column if not exists starter_pokemon_nature text default 'hardy',
  add column if not exists starter_pokemon_move_1 text,
  add column if not exists starter_pokemon_move_2 text,
  add column if not exists starter_pokemon_move_3 text,
  add column if not exists starter_pokemon_move_4 text,
  add column if not exists starter_pokemon_ribbons text[] default array[]::text[],
  add column if not exists experience_points integer default 0,
  add column if not exists trainer_class text default 'Novice Trainer',
  add column if not exists badges_earned integer default 0;

-- Add constraints
alter table family_members
  add constraint starter_pokemon_friendship_range 
    check (starter_pokemon_friendship >= 0 and starter_pokemon_friendship <= 255),
  add constraint starter_pokemon_nature_valid 
    check (starter_pokemon_nature in (
      'hardy', 'lonely', 'brave', 'adamant', 'naughty',
      'bold', 'docile', 'relaxed', 'impish', 'lax',
      'timid', 'hasty', 'serious', 'jolly', 'naive',
      'modest', 'mild', 'quiet', 'bashful', 'rash',
      'calm', 'gentle', 'sassy', 'careful', 'quirky'
    )),
  add constraint experience_points_positive 
    check (experience_points >= 0),
  add constraint badges_earned_range 
    check (badges_earned >= 0 and badges_earned <= 8);

-- Add comments for documentation
comment on column family_members.starter_pokemon_friendship is 'Friendship level with partner Pokémon (0-255)';
comment on column family_members.starter_pokemon_nature is 'Nature affecting stats growth';
comment on column family_members.starter_pokemon_move_1 is 'First favorite move';
comment on column family_members.starter_pokemon_move_2 is 'Second favorite move';
comment on column family_members.starter_pokemon_move_3 is 'Third favorite move';
comment on column family_members.starter_pokemon_move_4 is 'Fourth favorite move';
comment on column family_members.starter_pokemon_ribbons is 'Array of earned ribbons and achievements';
comment on column family_members.experience_points is 'Total trainer experience points';
comment on column family_members.trainer_class is 'Current trainer class/rank';
comment on column family_members.badges_earned is 'Number of badges earned (0-8)';

commit; 
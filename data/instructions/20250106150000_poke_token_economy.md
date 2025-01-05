# Pokémon Token Economy System

## Overview

The Pokémon Token Economy is a gamified reward system designed to incentivize and track family task completion through a multi-tiered Pokéball currency system. This system integrates with the family task management features and the Pokémon lootbox mechanics to create an engaging and motivating experience.

## Core Concepts

### Currency Tiers

1. **Poké Ball (Base Currency)**
   - Base value: 1
   - Primary reward for daily tasks
   - Most common and flexible currency
   - Foundation of the exchange system

2. **Great Ball**
   - Value: 10 Poké Balls
   - Intermediate reward tier
   - Achievable from a day of basic tasks
   - Better odds in the lootbox system

3. **Ultra Ball**
   - Value: 25 Poké Balls
   - Premium reward tier
   - Achievable from a few days of consistent work
   - Significantly improved odds in the lootbox system

4. **Master Ball**
   - Value: 50 Poké Balls
   - Ultimate reward tier
   - Achievable from a week of dedicated effort
   - Best odds in the lootbox system

## Task Reward Structure

### Daily Tasks
| Task                  | Reward         | Notes                                    |
|----------------------|----------------|------------------------------------------|
| Make bed             | 2 Poké Balls   | Basic morning routine                    |
| Brush teeth          | 1 Poké Ball    | Twice daily (morning/night)             |
| Clean room           | 3 Poké Balls   | Daily tidying                           |
| Do homework          | 3-5 Poké Balls | Based on complexity/duration            |

### Regular Chores
| Task                  | Reward         | Notes                                    |
|----------------------|----------------|------------------------------------------|
| Do dishes            | 5 Poké Balls   | After meals                             |
| Take out trash       | 3 Poké Balls   | When needed                             |
| Fold laundry         | 5 Poké Balls   | Per load                                |
| Feed pets            | 2 Poké Balls   | Daily responsibility                    |

### Weekly Tasks
| Task                  | Reward         | Notes                                    |
|----------------------|----------------|------------------------------------------|
| Mow lawn             | 1 Great Ball   | Equivalent to 10 Poké Balls             |
| Clean bathroom       | 1 Great Ball   | Thorough cleaning                       |
| Vacuum house         | 1 Great Ball   | All rooms                               |

### Special Tasks
| Task                  | Reward         | Notes                                    |
|----------------------|----------------|------------------------------------------|
| Help with projects   | 1 Ultra Ball   | Large family projects                   |
| Excellent grades     | 1 Ultra Ball   | Report cards/major tests                |
| Weekly streak        | 1 Ultra Ball   | Complete all assigned tasks for a week  |

## Exchange System

### Exchange Rates
```typescript
const EXCHANGE_RATES = {
  poke_ball: 1,     // Base value
  great_ball: 10,   // 10x value
  ultra_ball: 25,   // 25x value
  master_ball: 50   // 50x value
}
```

### Exchange Rules
1. Exchanges can only be made upward (lower tier to higher tier)
2. No fractional exchanges allowed (must have enough for full conversion)
3. Exchanges are permanent and non-reversible
4. Higher tier balls provide better odds in the lootbox system

## Integration with Lootbox System

### Pack Costs
| Pack Type            | Cost           | Contents                                 |
|---------------------|----------------|------------------------------------------|
| Poké Ball Pack      | 25 Poké Balls  | Common & Uncommon Pokémon               |
| Great Ball Pack     | 50 Poké Balls  | Uncommon & Rare Pokémon                 |
| Ultra Ball Pack     | 75 Poké Balls  | Rare & Ultra Rare Pokémon               |
| Master Ball Pack    | 100 Poké Balls | Ultra Rare & Legendary Pokémon          |

### Strategic Choices
1. **Immediate Gratification**
   - Use Poké Balls directly for basic packs
   - More packs but lower odds of rare Pokémon

2. **Delayed Gratification**
   - Save for higher tier balls
   - Exchange for better odds in the lootbox system
   - Fewer packs but better quality rewards

3. **Pack Saving**
   - Save currency for special events
   - Wait for limited-time Pokémon
   - Build up for guaranteed rare rewards

## Implementation Details

### Database Schema
```sql
-- Family Member Balances
ALTER TABLE family_members
  ADD pokeball_balance INTEGER NOT NULL DEFAULT 0,
  ADD great_ball_balance INTEGER NOT NULL DEFAULT 0,
  ADD ultra_ball_balance INTEGER NOT NULL DEFAULT 0,
  ADD master_ball_balance INTEGER NOT NULL DEFAULT 0;

-- Transaction History
CREATE TABLE pokeball_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  member_id UUID REFERENCES family_members(id),
  ball_type TEXT NOT NULL,
  amount INTEGER NOT NULL,
  reason TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  details JSONB DEFAULT '{}'::jsonb
);
```

### API Endpoints

1. **Balance Management**
```typescript
GET /api/pokeballs/balance/:memberId
POST /api/pokeballs/add
POST /api/pokeballs/spend
POST /api/pokeballs/exchange
GET /api/pokeballs/history/:memberId
```

2. **Task Integration**
```typescript
POST /api/tasks/complete
POST /api/tasks/verify
GET /api/tasks/rewards
```

## User Experience Guidelines

### Visual Feedback
1. Clear display of current balances
2. Animated transitions for exchanges
3. Celebration effects for achievements
4. Progress bars toward goals

### Engagement Features
1. Daily/Weekly reward streaks
2. Special event multipliers
3. Family competition boards
4. Achievement badges

### Parent Controls
1. Task reward customization
2. Approval requirements
3. Exchange limits
4. Spending restrictions

## Best Practices

### Task Design
1. Age-appropriate difficulty
2. Clear completion criteria
3. Consistent reward scaling
4. Regular reward opportunities

### Balance Management
1. Regular reward distribution
2. Predictable earning paths
3. Multiple saving strategies
4. Special event planning

### Family Engagement
1. Group goals and rewards
2. Collaborative tasks
3. Shared achievements
4. Family leaderboards

## Future Enhancements

### Planned Features
1. Seasonal events with bonus rewards
2. Special limited-time exchanges
3. Family achievement system
4. Custom task categories

### Technical Improvements
1. Enhanced transaction logging
2. Advanced analytics
3. Automated task verification
4. Real-time balance updates

## Troubleshooting

### Common Issues
1. Balance synchronization
2. Exchange rate calculations
3. Transaction history gaps
4. Task completion verification

### Solutions
1. Implement retry logic
2. Add validation checks
3. Improve error logging
4. Enhanced user feedback

## Security Considerations

### Transaction Safety
1. Rate limiting
2. Balance verification
3. Exchange validation
4. History tracking

### Access Control
1. Parent approval system
2. Role-based permissions
3. Transaction limits
4. Audit logging 
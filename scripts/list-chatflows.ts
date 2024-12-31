import { FlowiseAPI } from '../app/lib/flowise/api'
import type { ChatFlow } from '../lib/flowise/types'

async function listChatflows() {
  try {
    const response = await FlowiseAPI.getChatFlows()
    console.log('\nChatflows:\n')
    console.table(response.chatflows.map((flow: ChatFlow) => ({
      id: flow.id,
      name: flow.name,
      deployed: flow.deployed ? '✅' : '❌',
      isPublic: flow.isPublic ? '✅' : '❌',
      category: flow.category || '-'
    })))
  } catch (error) {
    console.error('Failed to fetch chatflows:', error)
  }
}

listChatflows() 
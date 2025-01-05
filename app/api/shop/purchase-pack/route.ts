import { NextRequest, NextResponse } from "next/server"
import { purchasePack } from "@/app/actions/purchase-pack"

export async function POST(request: NextRequest) {
  try {
    const { packId, userId } = await request.json()
    console.log('Purchase request received:', { packId, userId })

    if (!packId || !userId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    const result = await purchasePack({ packId, userId })
    console.log('Purchase completed successfully:', result)
    return NextResponse.json(result)
  } catch (error: any) {
    console.error('Purchase route error:', error)
    return NextResponse.json(
      { error: error.message || "Failed to purchase pack" },
      { status: 500 }
    )
  }
} 
import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createVerificationCode } from "@/lib/portfolio/verification"

export async function POST() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    )
  }

  const code = createVerificationCode(user.id)

  return NextResponse.json({
    code,
    url: `/verify/${code}`,
  })
}
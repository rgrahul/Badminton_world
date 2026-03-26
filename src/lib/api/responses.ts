import { NextResponse } from "next/server"

export function successResponse<T>(data: T, status: number = 200) {
  return NextResponse.json({ success: true, data }, { status })
}

export function errorResponse(message: string, status: number = 400) {
  return NextResponse.json({ success: false, error: message }, { status })
}

export function validationErrorResponse(errors: Record<string, string>) {
  return NextResponse.json(
    { success: false, error: "Validation failed", errors },
    { status: 400 }
  )
}

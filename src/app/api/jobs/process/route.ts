import { NextRequest, NextResponse } from "next/server"
import { processJob, listPendingJobs } from "@/lib/jobs/processor"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

// Process a specific job
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { jobId } = await request.json()

    if (!jobId) {
      return NextResponse.json({ error: "Job ID is required" }, { status: 400 })
    }

    const result = await processJob(jobId)
    return NextResponse.json(result)
  } catch (error) {
    console.error("Error processing job:", error)
    return NextResponse.json({ error: "Failed to process job" }, { status: 500 })
  }
}

// List pending jobs
export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const jobs = await listPendingJobs()
    return NextResponse.json({ jobs })
  } catch (error) {
    console.error("Error listing jobs:", error)
    return NextResponse.json({ error: "Failed to list jobs" }, { status: 500 })
  }
}

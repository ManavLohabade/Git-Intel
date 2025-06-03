import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/server/auth";
import { db } from "@/server/db";
import { processMeeting } from "@/lib/assembly";
import { z } from "zod";

// Set maxDuration to 60 seconds for Vercel Hobby plan
export const maxDuration = 60; // 1 minute (maximum for Hobby plan)
export const dynamic = 'force-dynamic'; // Ensure edge runtime

const bodyParser = z.object({
  meetingUrl: z.string().url(),
  projectId: z.string().cuid(),
  meetingId: z.string().cuid()
});

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const data = await req.json();
    const { meetingUrl, projectId, meetingId } = bodyParser.parse(data);

    // Immediate response to prevent timeout
    const response = NextResponse.json(
      { status: 'processing', meetingId },
      { status: 202 }
    );

    // Process meeting in background
    void processMeetingInBackground(meetingUrl, meetingId);

    return response;
  } catch (error) {
    console.error('Meeting processing error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

// Background processing function
async function processMeetingInBackground(meetingUrl: string, meetingId: string) {
  try {
    const { summaries } = await processMeeting(meetingUrl);

    await db.$transaction([
      db.issue.createMany({
        data: summaries.map(summary => ({
          start: summary.start,
          end: summary.end,
          gist: summary.gist,
          headline: summary.headline,
          summary: summary.summary,
          meetingId
        }))
      }),
      db.meeting.update({
        where: { id: meetingId },
        data: {
          status: "COMPLETED",
          name: summaries[0]?.headline || "Meeting"
        }
      })
    ]);

    // Optional: Send notification via email/webhook
    console.log(`Meeting ${meetingId} processed successfully`);
  } catch (error) {
    console.error('Background processing failed:', error);
    await db.meeting.update({
      where: { id: meetingId },
      data: { status: "FAILED" }
    });
  }
}
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";

export async function POST(request: NextRequest) {
  try {
    // Authenticate via Supabase session
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          },
        },
      }
    );

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user?.email) {
      return NextResponse.json(
        { error: "Unauthenticated" },
        { status: 401 }
      );
    }

    // Read body
    const { body } = (await request.json()) as { body: string };
    if (!body || !body.trim()) {
      return NextResponse.json(
        { error: "Feedback body is required" },
        { status: 400 }
      );
    }

    // Build subject with current datetime
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, "0");
    const datetime = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}`;
    const datetimeStripped = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}${pad(now.getMinutes())}`;
    const subject = `AGM Meeting Tracker Feedback ${datetimeStripped}`;

    // Build email body
    const emailBody = [
      `From: ${user.email}`,
      `Sent at: ${datetime}`,
      "",
      body.trim(),
    ].join("\n");

    // Create transporter and send
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.SMTP_EMAIL,
        pass: process.env.SMTP_PASS,
      },
    });

    await transporter.sendMail({
      from: process.env.SMTP_EMAIL,
      to: process.env.SMTP_EMAIL,
      subject,
      text: emailBody,
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Feedback send error:", err);
    return NextResponse.json(
      { error: "Failed to send feedback" },
      { status: 500 }
    );
  }
}
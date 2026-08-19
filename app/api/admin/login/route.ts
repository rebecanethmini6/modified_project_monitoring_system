import { NextResponse } from 'next/server';
import { ADMIN_SESSION_COOKIE, adminSessionMaxAge, createAdminSession } from '@/backend/admin-session';
import { errorResponse, readJsonBody } from '@/backend/http';
import { createAdminSupabaseClient } from '@/backend/supabase';

type AdminLoginPayload = { email?: string; password?: string };

function normalizedValue(value: unknown) {
  return String(value ?? '').trim().replace(/^['"]|['"]$/g, '');
}

export async function POST(request: Request) {
  try {
    const body = await readJsonBody<AdminLoginPayload>(request);
    const email = body.email?.trim().toLowerCase();
    if (!email || !body.password) return errorResponse('Email and password are required.', 400);

    const supabase = createAdminSupabaseClient();
    const { data, error } = await supabase
      .from('admins')
      .select('email, password_hash, role, is_active')
      .eq('email', email)
      .maybeSingle();
    if (error) return errorResponse(`Could not read the admins table: ${error.message}`, 502);
    const admin = data as Record<string, unknown> | null;
    if (
      !admin
      || admin.is_active !== true
      || normalizedValue(admin.role).toLowerCase() !== 'admin'
      || normalizedValue(admin.password_hash) !== body.password
    ) {
      return errorResponse('Invalid admin email or password.', 401);
    }

    const response = NextResponse.json({ ok: true, admin: { email } });
    response.cookies.set(ADMIN_SESSION_COOKIE, createAdminSession(email), {
      httpOnly: true,
      maxAge: adminSessionMaxAge,
      path: '/',
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    });
    return response;
  } catch (error) {
    return errorResponse(error instanceof Error ? error.message : 'Admin login failed.', 400);
  }
}

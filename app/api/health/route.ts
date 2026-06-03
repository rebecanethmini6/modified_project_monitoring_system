import { getSupabaseStatus } from '@/backend/supabase';

export async function GET() {
  return Response.json({
    ok: true,
    backend: 'ready',
    supabase: getSupabaseStatus(),
  });
}

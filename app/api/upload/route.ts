import { errorResponse, jsonResponse } from '@/backend/http';
import { createAdminSupabaseClient } from '@/backend/supabase';

const BUCKET = 'proposals';
const MAX_BYTES = 10 * 1024 * 1024; // 10MB
const ALLOWED_EXTENSIONS = ['pdf', 'doc', 'docx'];

function sanitizeFileName(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, '_');
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');
    const ownerId = formData.get('ownerId');

    if (!(file instanceof File)) {
      return errorResponse('No file provided.', 400);
    }

    if (file.size > MAX_BYTES) {
      return errorResponse('File exceeds the 10MB limit.', 400);
    }

    const extension = file.name.split('.').pop()?.toLowerCase() ?? '';
    if (!ALLOWED_EXTENSIONS.includes(extension)) {
      return errorResponse('Only PDF, DOC, or DOCX files are allowed.', 400);
    }

    const supabase = createAdminSupabaseClient();
    const buffer = Buffer.from(await file.arrayBuffer());

    // Build a unique, non-colliding object path. Random suffix avoids
    // Date.now()-style collisions when several uploads share a second.
    const folder = typeof ownerId === 'string' && ownerId ? ownerId : 'anonymous';
    const uniqueSuffix = `${file.size}-${sanitizeFileName(file.name)}`;
    const objectPath = `${folder}/${uniqueSuffix}`;

    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(objectPath, buffer, {
        contentType: file.type || 'application/octet-stream',
        upsert: true,
      });

    if (uploadError) {
      return errorResponse(uploadError.message, 502);
    }

    const { data: publicUrlData } = supabase.storage
      .from(BUCKET)
      .getPublicUrl(objectPath);

    return jsonResponse(
      {
        ok: true,
        url: publicUrlData.publicUrl,
        filename: file.name,
        path: objectPath,
      },
      201,
    );
  } catch (error) {
    return errorResponse(
      error instanceof Error ? error.message : 'Unexpected error during upload.',
      500,
    );
  }
}

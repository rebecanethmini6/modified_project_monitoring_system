import { errorResponse, jsonResponse, readJsonBody } from '@/backend/http';
import { createAdminSupabaseClient } from '@/backend/supabase';

type RouteContext = {
  params: Promise<{ id: string }>;
};

type DocumentPayload = {
  uploadedBy: string; // student id
  fileName: string;
  description?: string;
  storagePath: string;
};

// Records a document row after the file has been uploaded via /api/upload.
export async function POST(request: Request, { params }: RouteContext) {
  try {
    const { id: projectId } = await params;
    const body = await readJsonBody<DocumentPayload>(request);

    if (!body.fileName || !body.storagePath || !body.uploadedBy) {
      return errorResponse('fileName, storagePath and uploadedBy are required.', 400);
    }

    const supabase = createAdminSupabaseClient();
    const { data, error } = await supabase
      .from('documents')
      .insert({
        project_id: projectId,
        uploaded_by: body.uploadedBy,
        file_name: body.fileName,
        description: body.description ?? null,
        storage_path: body.storagePath,
      })
      .select('*')
      .single();

    if (error) {
      return errorResponse(error.message, 502);
    }

    return jsonResponse({ ok: true, document: data }, 201);
  } catch (error) {
    return errorResponse(error instanceof Error ? error.message : 'Unexpected error.', 400);
  }
}

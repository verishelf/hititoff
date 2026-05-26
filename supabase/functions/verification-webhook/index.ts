import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';
import { handleCors, jsonResponse, errorResponse } from '../_shared/cors.ts';

Deno.serve(async (req) => {
  const cors = handleCors(req);
  if (cors) return cors;

  try {
    const secret = Deno.env.get('VERIFICATION_WEBHOOK_SECRET') ?? '';
    const provided = req.headers.get('x-verification-secret') ?? '';
    if (!secret || provided !== secret) {
      return errorResponse('Unauthorized', 401);
    }

    const { user_id, action, request_id } = await req.json() as {
      user_id: string;
      action: 'approve' | 'reject';
      request_id?: string;
    };

    if (!user_id || !action) return errorResponse('user_id and action required');

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    const requestStatus = action === 'approve' ? 'approved' : 'rejected';
    const profileStatus = action === 'approve' ? 'verified' : 'none';

    if (request_id) {
      await supabase
        .from('verification_requests')
        .update({ status: requestStatus })
        .eq('id', request_id)
        .eq('user_id', user_id);
    } else {
      await supabase
        .from('verification_requests')
        .update({ status: requestStatus })
        .eq('user_id', user_id)
        .eq('status', 'pending');
    }

    await supabase
      .from('profiles')
      .update({ verification_status: profileStatus })
      .eq('id', user_id);

    return jsonResponse({ ok: true, user_id, verification_status: profileStatus });
  } catch (e) {
    return errorResponse(e instanceof Error ? e.message : 'Internal error', 500);
  }
});

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface DocumentAccessRequest {
  verificationId: string;
  documentType: 'front' | 'back' | 'selfie';
  accessReason?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      {
        global: {
          headers: { Authorization: req.headers.get("Authorization")! },
        },
      }
    );

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { verificationId, documentType, accessReason }: DocumentAccessRequest = await req.json();

    if (!verificationId || !documentType) {
      return new Response(
        JSON.stringify({ error: "Missing verificationId or documentType" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate document type
    if (!['front', 'back', 'selfie'].includes(documentType)) {
      return new Response(
        JSON.stringify({ error: "Invalid document type" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Document access requested by ${user.id} for verification ${verificationId}, document: ${documentType}`);

    // Check if user has permission to access documents using the new permission system
    const { data: hasPermission, error: permError } = await supabaseClient
      .rpc('can_access_documents', { user_id: user.id });

    if (permError) {
      console.error('Permission check error:', permError);
      return new Response(
        JSON.stringify({ error: "Failed to verify permissions" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!hasPermission) {
      console.warn(`Unauthorized document access attempt by user ${user.id}`);
      return new Response(
        JSON.stringify({ error: "You do not have permission to access identity documents" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get verification record
    const { data: verification, error: verifyError } = await supabaseClient
      .from('creator_id_verification')
      .select('*')
      .eq('id', verificationId)
      .single();

    if (verifyError || !verification) {
      console.error('Verification lookup error:', verifyError);
      return new Response(
        JSON.stringify({ error: "Verification record not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Determine which document URL to use
    let documentPath: string;
    switch (documentType) {
      case 'front':
        documentPath = verification.document_front_url;
        break;
      case 'back':
        if (!verification.document_back_url) {
          return new Response(
            JSON.stringify({ error: "Back document not available" }),
            { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        documentPath = verification.document_back_url;
        break;
      case 'selfie':
        documentPath = verification.selfie_url;
        break;
      default:
        return new Response(
          JSON.stringify({ error: "Invalid document type" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }

    // Extract file path from full URL
    const urlParts = documentPath.split('/id-documents/');
    const filePath = urlParts[1];

    if (!filePath) {
      console.error('Invalid document path:', documentPath);
      return new Response(
        JSON.stringify({ error: "Invalid document path" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Generate signed URL (expires in 1 hour)
    const { data: signedUrlData, error: signedUrlError } = await supabaseClient.storage
      .from('id-documents')
      .createSignedUrl(filePath, 3600);

    if (signedUrlError || !signedUrlData) {
      console.error('Signed URL generation error:', signedUrlError);
      return new Response(
        JSON.stringify({ error: "Failed to generate signed URL" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get client IP and user agent for audit logging
    const clientIp = req.headers.get('x-forwarded-for') || 
                     req.headers.get('x-real-ip') || 
                     'unknown';
    const userAgent = req.headers.get('user-agent') || 'unknown';

    // Log the document access (run in background, don't block response)
    supabaseClient
      .rpc('log_document_access', {
        _verification_id: verificationId,
        _document_type: documentType,
        _access_type: 'view',
        _access_reason: accessReason || null,
        _ip_address: clientIp,
        _user_agent: userAgent
      })
      .then(({ error: logError }) => {
        if (logError) {
          console.error('Failed to log document access:', logError);
        }
      });

    // Update last access timestamp
    await supabaseClient
      .from('creator_id_verification')
      .update({ last_document_access: new Date().toISOString() })
      .eq('id', verificationId);

    console.log(`Signed URL generated successfully for user ${user.id}, verification ${verificationId}`);

    return new Response(
      JSON.stringify({ 
        signedUrl: signedUrlData.signedUrl,
        expiresIn: 3600
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error in get-signed-document-url:", error);
    return new Response(
      JSON.stringify({ error: error?.message || "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

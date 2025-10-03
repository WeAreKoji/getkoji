-- Enable pgcrypto extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

-- Recreate generate_document_token function with correct search_path
CREATE OR REPLACE FUNCTION public.generate_document_token(
  _verification_id uuid,
  _document_type text,
  _expires_minutes integer DEFAULT 5
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  _token text;
BEGIN
  -- Check authorization
  IF NOT can_access_documents(auth.uid()) THEN
    RAISE EXCEPTION 'Unauthorized: Cannot generate document access token';
  END IF;
  
  -- Generate secure random token using gen_random_bytes from pgcrypto
  _token := encode(gen_random_bytes(32), 'base64');
  
  -- Insert token
  INSERT INTO public.document_access_tokens (
    verification_id,
    document_type,
    token,
    created_by,
    expires_at
  ) VALUES (
    _verification_id,
    _document_type,
    _token,
    auth.uid(),
    now() + (_expires_minutes || ' minutes')::interval
  );
  
  RETURN _token;
END;
$$;
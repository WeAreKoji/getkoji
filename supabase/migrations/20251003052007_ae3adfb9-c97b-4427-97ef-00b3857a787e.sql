-- Create document access permissions table
CREATE TABLE IF NOT EXISTS public.document_access_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  permission_type TEXT NOT NULL CHECK (permission_type IN ('view_verifications', 'review_verifications', 'access_documents')),
  granted_by UUID,
  granted_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, permission_type)
);

-- Enable RLS
ALTER TABLE public.document_access_permissions ENABLE ROW LEVEL SECURITY;

-- Only super admins can manage permissions
CREATE POLICY "Super admins can manage permissions"
ON public.document_access_permissions
FOR ALL
USING (has_role(auth.uid(), 'admin'::user_role));

-- Create function to check document access permission
CREATE OR REPLACE FUNCTION public.can_access_documents(user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.document_access_permissions
    WHERE document_access_permissions.user_id = can_access_documents.user_id
      AND permission_type = 'access_documents'
      AND is_active = true
      AND (expires_at IS NULL OR expires_at > now())
  ) OR has_role(can_access_documents.user_id, 'admin'::user_role);
$$;

-- Create document access log table
CREATE TABLE IF NOT EXISTS public.document_access_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  verification_id UUID NOT NULL REFERENCES public.creator_id_verification(id) ON DELETE CASCADE,
  accessed_by UUID NOT NULL,
  access_type TEXT NOT NULL CHECK (access_type IN ('view', 'download', 'review')),
  document_type TEXT NOT NULL CHECK (document_type IN ('front', 'back', 'selfie')),
  ip_address INET,
  user_agent TEXT,
  access_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.document_access_logs ENABLE ROW LEVEL SECURITY;

-- Admins and document owners can view logs
CREATE POLICY "Admins and creators can view document access logs"
ON public.document_access_logs
FOR SELECT
USING (
  auth.uid() IN (
    SELECT creator_id FROM public.creator_id_verification WHERE id = verification_id
  ) OR has_role(auth.uid(), 'admin'::user_role)
);

-- System can insert logs
CREATE POLICY "System can insert document access logs"
ON public.document_access_logs
FOR INSERT
WITH CHECK (true);

-- Update RLS policies on creator_id_verification to be more restrictive
-- Drop existing policies
DROP POLICY IF EXISTS "Admins can view all verifications" ON public.creator_id_verification;
DROP POLICY IF EXISTS "Creators can view own verification" ON public.creator_id_verification;

-- Create new more restrictive policies
CREATE POLICY "Creators can view own verification metadata"
ON public.creator_id_verification
FOR SELECT
USING (
  auth.uid() = creator_id
);

-- Admins with document access permission can view
CREATE POLICY "Authorized admins can view verifications"
ON public.creator_id_verification
FOR SELECT
USING (
  has_role(auth.uid(), 'admin'::user_role) AND can_access_documents(auth.uid())
);

-- Update get_signed_document_url function to enforce permissions
CREATE OR REPLACE FUNCTION public.get_signed_document_url(
  bucket_name TEXT,
  file_path TEXT,
  expires_in INTEGER DEFAULT 3600
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, storage
AS $$
DECLARE
  verification_record RECORD;
BEGIN
  -- Check if user has permission to access documents
  IF NOT can_access_documents(auth.uid()) THEN
    RAISE EXCEPTION 'Unauthorized: You do not have permission to access identity documents';
  END IF;
  
  -- Verify the document belongs to a valid verification
  SELECT * INTO verification_record
  FROM public.creator_id_verification
  WHERE document_front_url LIKE '%' || file_path
     OR document_back_url LIKE '%' || file_path
     OR selfie_url LIKE '%' || file_path;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Document not found';
  END IF;
  
  -- Update last access timestamp
  UPDATE public.creator_id_verification
  SET last_document_access = now()
  WHERE id = verification_record.id;
  
  -- This is handled by the edge function
  -- Return a marker that access is authorized
  RETURN 'AUTHORIZED';
END;
$$;

-- Create function to log document access
CREATE OR REPLACE FUNCTION public.log_document_access(
  _verification_id UUID,
  _document_type TEXT,
  _access_type TEXT DEFAULT 'view',
  _access_reason TEXT DEFAULT NULL,
  _ip_address INET DEFAULT NULL,
  _user_agent TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  log_id UUID;
BEGIN
  -- Check authorization
  IF NOT can_access_documents(auth.uid()) THEN
    RAISE EXCEPTION 'Unauthorized document access attempt';
  END IF;
  
  INSERT INTO public.document_access_logs (
    verification_id,
    accessed_by,
    access_type,
    document_type,
    ip_address,
    user_agent,
    access_reason
  )
  VALUES (
    _verification_id,
    auth.uid(),
    _access_type,
    _document_type,
    _ip_address,
    _user_agent,
    _access_reason
  )
  RETURNING id INTO log_id;
  
  RETURN log_id;
END;
$$;

-- Grant initial document access permissions to existing admins
INSERT INTO public.document_access_permissions (user_id, permission_type, granted_by)
SELECT DISTINCT user_id, 'access_documents', user_id
FROM public.user_roles
WHERE role = 'admin'
ON CONFLICT (user_id, permission_type) DO NOTHING;
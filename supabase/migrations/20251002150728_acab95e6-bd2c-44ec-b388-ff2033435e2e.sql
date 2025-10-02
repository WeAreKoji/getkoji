-- Phase 1: ID Verification Database Schema

-- Create verification status enum
CREATE TYPE verification_status AS ENUM ('pending', 'under_review', 'approved', 'rejected');

-- Create ID verification table
CREATE TABLE public.creator_id_verification (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status verification_status NOT NULL DEFAULT 'pending',
  
  -- Document info
  document_type TEXT NOT NULL,
  document_front_url TEXT NOT NULL,
  document_back_url TEXT,
  selfie_url TEXT NOT NULL,
  
  -- Personal details from ID
  full_name TEXT NOT NULL,
  date_of_birth DATE NOT NULL,
  document_number TEXT NOT NULL,
  issuing_country TEXT NOT NULL,
  
  -- Verification details
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES auth.users(id),
  rejection_reason TEXT,
  
  -- Compliance
  ip_address INET,
  user_agent TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(creator_id)
);

-- Add verification columns to creator_profiles
ALTER TABLE public.creator_profiles 
ADD COLUMN id_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN id_verification_date TIMESTAMPTZ;

-- Enable RLS
ALTER TABLE public.creator_id_verification ENABLE ROW LEVEL SECURITY;

-- RLS Policies for creator_id_verification
CREATE POLICY "Creators can insert own verification"
ON public.creator_id_verification
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Creators can view own verification"
ON public.creator_id_verification
FOR SELECT
TO authenticated
USING (auth.uid() = creator_id);

CREATE POLICY "Admins can view all verifications"
ON public.creator_id_verification
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update verifications"
ON public.creator_id_verification
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Create storage bucket for ID documents
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'id-documents', 
  'id-documents', 
  false,
  10485760,
  ARRAY['image/jpeg', 'image/png', 'image/jpg', 'application/pdf']
);

-- Storage policies for id-documents bucket
CREATE POLICY "Users can upload own ID documents"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'id-documents' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view own ID documents"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'id-documents' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Admins can view all ID documents"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'id-documents' AND
  public.has_role(auth.uid(), 'admin')
);
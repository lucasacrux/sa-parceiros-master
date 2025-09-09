-- Public demo storage policies for tenant logos
-- Allow public uploads/updates to the 'tenants' bucket (demo only)

-- Clean up if re-running
DROP POLICY IF EXISTS "Public can upload to tenants bucket" ON storage.objects;
DROP POLICY IF EXISTS "Public can update in tenants bucket" ON storage.objects;
DROP POLICY IF EXISTS "Public can read from tenants bucket" ON storage.objects;

-- Read (redundant for public buckets, added for clarity)
CREATE POLICY "Public can read from tenants bucket"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'tenants');

-- Upload
CREATE POLICY "Public can upload to tenants bucket"
ON storage.objects
FOR INSERT
TO public
WITH CHECK (bucket_id = 'tenants');

-- Update (allow overwriting logos)
CREATE POLICY "Public can update in tenants bucket"
ON storage.objects
FOR UPDATE
TO public
USING (bucket_id = 'tenants')
WITH CHECK (bucket_id = 'tenants');
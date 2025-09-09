-- Temporarily allow public access to insert demo data into portal_users
-- This will be restricted later when authentication is implemented

-- Add a policy to allow demo data insertion
CREATE POLICY "Allow demo data insertion for portal_users" 
ON public.portal_users 
FOR INSERT 
WITH CHECK (true);

-- Add a policy to allow public read access for demo purposes
CREATE POLICY "Allow public read access for demo portal_users" 
ON public.portal_users 
FOR SELECT 
USING (true);

-- Also ensure portal_sessions and portal_authentications can accept demo data
CREATE POLICY "Allow demo data insertion for portal_sessions" 
ON public.portal_sessions 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Allow public read access for demo portal_sessions" 
ON public.portal_sessions 
FOR SELECT 
USING (true);

CREATE POLICY "Allow demo data insertion for portal_authentications" 
ON public.portal_authentications 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Allow public read access for demo portal_authentications" 
ON public.portal_authentications 
FOR SELECT 
USING (true);
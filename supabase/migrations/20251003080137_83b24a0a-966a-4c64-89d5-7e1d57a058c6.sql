-- Grant admin access to bekovrafik@gmail.com
INSERT INTO public.user_roles (user_id, role) 
VALUES ('eb4f0ec8-ecb1-4d23-80e6-7f6307753f71', 'admin') 
ON CONFLICT (user_id, role) DO NOTHING;
/*
  # Auto-assign Member role to new users

  1. New Functions
    - `handle_new_user()` - Automatically creates a public_users record and assigns Member role when a user signs up
  
  2. New Triggers
    - Trigger on auth.users insert to call handle_new_user function
  
  3. Security
    - Function runs with SECURITY DEFINER to bypass RLS
    - Only executes on INSERT operations for new users
*/

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  member_role_id uuid := '0e44bbc1-5f4d-476e-a3e3-72d90dbde430';
BEGIN
  -- Insert into public_users table
  INSERT INTO public.public_users (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  );

  -- Assign Member role to the new user
  INSERT INTO public.user_roles (user_id, role_id)
  VALUES (NEW.id, member_role_id);

  RETURN NEW;
END;
$$;

-- Create trigger to automatically call handle_new_user when a user signs up
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
-- Add phone number to profiles
ALTER TABLE profiles ADD COLUMN phone_number TEXT;

-- Sync auth.users.email -> profiles.email when email is confirmed
CREATE OR REPLACE FUNCTION public.handle_user_email_update()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.profiles SET email = NEW.email WHERE id = NEW.id;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_email_updated
  AFTER UPDATE OF email ON auth.users
  FOR EACH ROW
  WHEN (OLD.email IS DISTINCT FROM NEW.email)
  EXECUTE PROCEDURE public.handle_user_email_update();

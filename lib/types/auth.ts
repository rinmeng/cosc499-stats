import { Session, User } from '@supabase/supabase-js';
export type AuthContextType = {
  session: Session | null;
  user: User | null;
  signOut: () => Promise<void>;
  loading: boolean;
};

import { createContext, useContext, useEffect, useState } from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithCredential,
  linkWithCredential,
  GoogleAuthProvider,
  signOut,
  updateProfile,
  updatePassword,
  updateEmail,
  reauthenticateWithCredential,
  EmailAuthProvider,
  deleteUser,
  type User,
  type OAuthCredential,
} from 'firebase/auth';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { auth } from '../lib/firebase';
import googleServices from '../google-services.json';

const webClientId = googleServices.client[0].oauth_client.find(c => c.client_type === 3)?.client_id ?? '';

GoogleSignin.configure({ webClientId });

export class AccountLinkError extends Error {
  constructor(public readonly email: string, public readonly pendingCredential: OAuthCredential) {
    super('account-exists-with-different-credential');
    this.name = 'AccountLinkError';
  }
}

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  signInEmail: (email: string, password: string) => Promise<void>;
  signUpEmail: (email: string, password: string, displayName?: string) => Promise<void>;
  signInGoogle: () => Promise<void>;
  linkGoogleToEmailAccount: (email: string, password: string, pendingCredential: OAuthCredential) => Promise<void>;
  logout: () => Promise<void>;
  updateDisplayName: (name: string) => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  changeEmail: (currentPassword: string, newEmail: string) => Promise<void>;
  deleteAccount: (currentPassword?: string) => Promise<void>;
  isEmailProvider: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, u => {
      setUser(u);
      setLoading(false);
    });
    return unsub;
  }, []);

  const isEmailProvider = !!(user?.providerData?.some(p => p.providerId === 'password'));

  async function signInEmail(email: string, password: string) {
    await signInWithEmailAndPassword(auth, email, password);
  }

  async function signUpEmail(email: string, password: string, displayName?: string) {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    if (displayName?.trim()) {
      await updateProfile(cred.user, { displayName: displayName.trim() });
      setUser({ ...cred.user, displayName: displayName.trim() } as User);
    }
  }

  async function signInGoogle() {
    await GoogleSignin.hasPlayServices();
    const { data } = await GoogleSignin.signIn();
    if (!data?.idToken) throw new Error('No ID token from Google');
    const credential = GoogleAuthProvider.credential(data.idToken);
    try {
      await signInWithCredential(auth, credential);
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code;
      if (code === 'auth/account-exists-with-different-credential') {
        const email = (err as { customData?: { email?: string } })?.customData?.email ?? '';
        if (email) throw new AccountLinkError(email, credential);
      }
      throw err;
    }
  }

  async function linkGoogleToEmailAccount(email: string, password: string, pendingCredential: OAuthCredential) {
    const result = await signInWithEmailAndPassword(auth, email, password);
    await linkWithCredential(result.user, pendingCredential);
  }

  async function logout() {
    await signOut(auth);
    try { await GoogleSignin.signOut(); } catch { /* ignore */ }
  }

  async function updateDisplayName(name: string) {
    if (!user) return;
    await updateProfile(user, { displayName: name });
    setUser(prev => prev ? ({ ...prev, displayName: name } as User) : null);
  }

  async function changePassword(currentPassword: string, newPassword: string) {
    if (!user?.email) throw new Error('No email on account');
    const cred = EmailAuthProvider.credential(user.email, currentPassword);
    await reauthenticateWithCredential(user, cred);
    await updatePassword(user, newPassword);
  }

  async function changeEmail(currentPassword: string, newEmail: string) {
    if (!user?.email) throw new Error('No email on account');
    const cred = EmailAuthProvider.credential(user.email, currentPassword);
    await reauthenticateWithCredential(user, cred);
    await updateEmail(user, newEmail);
    setUser(prev => prev ? ({ ...prev, email: newEmail } as User) : null);
  }

  async function deleteAccount(currentPassword?: string) {
    if (!user) return;
    if (isEmailProvider && currentPassword && user.email) {
      const cred = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, cred);
    }
    await deleteUser(user);
  }

  return (
    <AuthContext.Provider value={{
      user, loading,
      signInEmail, signUpEmail, signInGoogle, linkGoogleToEmailAccount, logout,
      updateDisplayName, changePassword, changeEmail, deleteAccount,
      isEmailProvider,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

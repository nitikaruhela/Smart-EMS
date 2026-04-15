import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { auth, db, isFirebaseConfigured } from "../services/firebase";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState("");

  useEffect(() => {
    if (!isFirebaseConfigured) {
      setLoading(false);
      return undefined;
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);

      if (!firebaseUser) {
        setRole(null);
        setLoading(false);
        return;
      }

      try {
        const userSnapshot = await getDoc(doc(db, "users", firebaseUser.uid));
        setRole(userSnapshot.exists() ? userSnapshot.data().role : null);
      } catch (error) {
        setAuthError(error.message);
      } finally {
        setLoading(false);
      }
    });

    return unsubscribe;
  }, []);

  const signup = async ({ email, password, role: selectedRole }) => {
    if (!isFirebaseConfigured) {
      throw new Error(
        "Firebase is not configured. Add your environment variables before signing up."
      );
    }

    const credential = await createUserWithEmailAndPassword(auth, email, password);
    await setDoc(doc(db, "users", credential.user.uid), {
      uid: credential.user.uid,
      email,
      role: selectedRole,
      createdAt: serverTimestamp(),
    });
    setRole(selectedRole);
    return credential.user;
  };

  const login = async ({ email, password }) => {
    if (!isFirebaseConfigured) {
      throw new Error(
        "Firebase is not configured. Add your environment variables before logging in."
      );
    }

    const credential = await signInWithEmailAndPassword(auth, email, password);
    const userSnapshot = await getDoc(doc(db, "users", credential.user.uid));
    setRole(userSnapshot.exists() ? userSnapshot.data().role : null);
    return credential.user;
  };

  const logout = () => signOut(auth);

  const value = useMemo(
    () => ({
      user,
      role,
      loading,
      authError,
      isFirebaseConfigured,
      signup,
      login,
      logout,
    }),
    [user, role, loading, authError]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
}

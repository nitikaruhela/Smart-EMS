import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
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
import { normalizeUserRole } from "../utils/userRole";

const AuthContext = createContext(null);

async function ensureUserProfileDocument(firebaseUser, fallbackRole = null) {
  const userRef = doc(db, "users", firebaseUser.uid);
  const userSnapshot = await getDoc(userRef);
  const storedRole = userSnapshot.exists() ? userSnapshot.data().role : null;
  const normalizedRole = normalizeUserRole(storedRole, fallbackRole);

  if (!normalizedRole) {
    throw new Error(
      "User role is missing or invalid. Update users/{uid}.role to Organizer or Attendee, then sign in again."
    );
  }

  const nextUserData = {
    uid: firebaseUser.uid,
    email: firebaseUser.email || "",
    role: normalizedRole,
  };

  if (!userSnapshot.exists()) {
    await setDoc(userRef, {
      ...nextUserData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    console.info("[Auth] Created missing user profile document.", nextUserData);
    return nextUserData;
  }

  const previousData = userSnapshot.data();
  const needsRepair =
    previousData.uid !== nextUserData.uid ||
    previousData.email !== nextUserData.email ||
    previousData.role !== nextUserData.role;

  if (needsRepair) {
    await setDoc(
      userRef,
      {
        ...nextUserData,
        createdAt: previousData.createdAt || serverTimestamp(),
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
    console.info("[Auth] Repaired user profile document.", nextUserData);
  }

  return nextUserData;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState("");
  const pendingRoleRef = useRef(null);

  useEffect(() => {
    if (!isFirebaseConfigured) {
      setLoading(false);
      return undefined;
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      setAuthError("");

      if (!firebaseUser) {
        setRole(null);
        setLoading(false);
        return;
      }

      try {
        const profile = await ensureUserProfileDocument(
          firebaseUser,
          pendingRoleRef.current
        );
        setRole(profile.role);
        pendingRoleRef.current = null;
      } catch (error) {
        console.error("[Auth] Failed to hydrate auth state.", error);
        setAuthError(error.message);
        setRole(null);
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

    const normalizedRole = normalizeUserRole(selectedRole);

    if (!normalizedRole) {
      throw new Error("Choose a valid role: Organizer or Attendee.");
    }

    try {
      pendingRoleRef.current = normalizedRole;
      const credential = await createUserWithEmailAndPassword(auth, email, password);
      await setDoc(doc(db, "users", credential.user.uid), {
        uid: credential.user.uid,
        email,
        role: normalizedRole,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      console.info("[Auth] Signup completed.", {
        uid: credential.user.uid,
        email,
        role: normalizedRole,
      });
      setRole(normalizedRole);
      return credential.user;
    } catch (error) {
      pendingRoleRef.current = null;
      console.error("[Auth] Signup failed.", error);
      throw error;
    }
  };

  const login = async ({ email, password }) => {
    if (!isFirebaseConfigured) {
      throw new Error(
        "Firebase is not configured. Add your environment variables before logging in."
      );
    }

    try {
      const credential = await signInWithEmailAndPassword(auth, email, password);
      const profile = await ensureUserProfileDocument(credential.user);
      console.info("[Auth] Login completed.", {
        uid: credential.user.uid,
        email: credential.user.email,
        role: profile.role,
      });
      setRole(profile.role);
      return credential.user;
    } catch (error) {
      console.error("[Auth] Login failed.", error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      pendingRoleRef.current = null;
      await signOut(auth);
      console.info("[Auth] Logout completed.");
    } catch (error) {
      console.error("[Auth] Logout failed.", error);
      throw error;
    }
  };

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

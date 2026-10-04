import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  Timestamp,
} from 'firebase/firestore';
import {
  auth,
  db,
  getSecondaryAuth,
  isLiveFirebaseConfigured,
  handleFirestoreError,
} from './firebase';
import { AppUser, OperationType, UserRole } from '../types/stock';
import { INITIAL_DEMO_ACCOUNTS } from './demoSeed';

const LOCAL_USERS_KEY = 'stockline_gh_users_v2';
const LOCAL_PASSWORDS_KEY = 'stockline_gh_passwords_v2';
const LOCAL_SESSION_UID_KEY = 'stockline_gh_session_uid_v2';
const LOCAL_BOOTSTRAPPED_KEY = 'stockline_gh_bootstrapped_auth_v2';

type AuthListener = (user: AppUser | null) => void;
const authListeners = new Set<AuthListener>();

export function ensureLocalUsersInitialized(): {
  users: AppUser[];
  passwords: Record<string, string>;
} {
  const rawUsers = localStorage.getItem(LOCAL_USERS_KEY);
  const rawPasswords = localStorage.getItem(LOCAL_PASSWORDS_KEY);

  if (rawUsers && rawPasswords) {
    try {
      return {
        users: JSON.parse(rawUsers) as AppUser[],
        passwords: JSON.parse(rawPasswords) as Record<string, string>,
      };
    } catch {
      // Re-seed below
    }
  }

  const users = INITIAL_DEMO_ACCOUNTS.map((entry) => entry.user);
  const passwords: Record<string, string> = {};
  for (const entry of INITIAL_DEMO_ACCOUNTS) {
    passwords[entry.user.email.toLowerCase()] = entry.passwordPlain;
  }

  localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(users));
  localStorage.setItem(LOCAL_PASSWORDS_KEY, JSON.stringify(passwords));

  if (!localStorage.getItem(LOCAL_BOOTSTRAPPED_KEY)) {
    localStorage.setItem(LOCAL_BOOTSTRAPPED_KEY, 'true');
    localStorage.setItem(LOCAL_SESSION_UID_KEY, users[0].uid);
  }

  return { users, passwords };
}

function notifyAuthListeners() {
  const current = getCurrentLocalUser();
  authListeners.forEach((cb) => cb(current));
}

export function getCurrentLocalUser(): AppUser | null {
  const { users } = ensureLocalUsersInitialized();
  const uid = localStorage.getItem(LOCAL_SESSION_UID_KEY);
  if (!uid) return null;
  const found = users.find((u) => u.uid === uid);
  if (!found || !found.isActive) {
    localStorage.removeItem(LOCAL_SESSION_UID_KEY);
    return null;
  }
  return found;
}

export function subscribeToAuthChanges(callback: AuthListener): () => void {
  if (isLiveFirebaseConfigured && auth && db) {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      if (!fbUser) {
        callback(null);
        return;
      }
      try {
        const userRef = doc(db!, 'users', fbUser.uid);
        const snap = await getDoc(userRef);
        if (!snap.exists()) {
          await signOut(auth!);
          callback(null);
          return;
        }
        const data = snap.data();
        const appUser: AppUser = {
          uid: fbUser.uid,
          name: data.name,
          email: data.email,
          role: data.role as UserRole,
          isActive: Boolean(data.isActive),
          createdAt:
            data.createdAt instanceof Timestamp
              ? data.createdAt.toDate().toISOString()
              : String(data.createdAt),
        };
        if (!appUser.isActive) {
          await signOut(auth!);
          callback(null);
          return;
        }
        callback(appUser);
      } catch (error) {
        console.error('Auth profile verification error:', error);
        callback(null);
      }
    });
    return unsubscribe;
  }

  authListeners.add(callback);
  callback(getCurrentLocalUser());
  return () => {
    authListeners.delete(callback);
  };
}

export async function loginWithEmailPassword(
  email: string,
  passwordPlain: string
): Promise<AppUser> {
  const cleanEmail = email.trim().toLowerCase();
  if (!cleanEmail || !passwordPlain) {
    throw new Error('Please enter both your work email and password.');
  }

  if (isLiveFirebaseConfigured && auth && db) {
    const cred = await signInWithEmailAndPassword(auth, cleanEmail, passwordPlain);
    const userRef = doc(db, 'users', cred.user.uid);
    let snap;
    try {
      snap = await getDoc(userRef);
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, `users/${cred.user.uid}`);
    }
    if (!snap || !snap.exists()) {
      await signOut(auth);
      throw new Error('No StockLine role profile exists for this account. Contact your Manager.');
    }
    const data = snap.data();
    if (!data.isActive) {
      await signOut(auth);
      throw new Error('This account has been deactivated by a Manager. Access is blocked.');
    }
    return {
      uid: cred.user.uid,
      name: data.name,
      email: data.email,
      role: data.role as UserRole,
      isActive: Boolean(data.isActive),
      createdAt:
        data.createdAt instanceof Timestamp
          ? data.createdAt.toDate().toISOString()
          : String(data.createdAt),
    };
  }

  // Local transactional auth
  const { users, passwords } = ensureLocalUsersInitialized();
  const matchedUser = users.find((u) => u.email.toLowerCase() === cleanEmail);
  if (!matchedUser) {
    throw new Error('Invalid email or password. No public sign-up is permitted.');
  }

  const expectedPassword = passwords[cleanEmail];
  if (expectedPassword && expectedPassword !== passwordPlain) {
    throw new Error('Invalid email or password. Please verify your credentials.');
  }

  if (!matchedUser.isActive) {
    throw new Error(
      `Account for ${matchedUser.name} (${matchedUser.email}) is deactivated. Contact your Restaurant Manager.`
    );
  }

  localStorage.setItem(LOCAL_SESSION_UID_KEY, matchedUser.uid);
  notifyAuthListeners();
  return matchedUser;
}

export async function logoutCurrentUser(): Promise<void> {
  if (isLiveFirebaseConfigured && auth) {
    await signOut(auth);
    return;
  }
  localStorage.removeItem(LOCAL_SESSION_UID_KEY);
  notifyAuthListeners();
}

export async function fetchAllUsers(): Promise<AppUser[]> {
  if (isLiveFirebaseConfigured && db) {
    try {
      const snap = await getDocs(collection(db, 'users'));
      return snap.docs
        .map((d) => {
          const data = d.data();
          return {
            uid: d.id,
            name: data.name,
            email: data.email,
            role: data.role as UserRole,
            isActive: Boolean(data.isActive),
            createdAt:
              data.createdAt instanceof Timestamp
                ? data.createdAt.toDate().toISOString()
                : String(data.createdAt),
          };
        })
        .sort((a, b) => a.name.localeCompare(b.name));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, 'users');
    }
  }

  const { users } = ensureLocalUsersInitialized();
  return [...users].sort((a, b) => a.name.localeCompare(b.name));
}

export async function createEmployeeAccountAsManager(
  actor: AppUser,
  input: {
    name: string;
    email: string;
    passwordPlain: string;
    role: UserRole;
  }
): Promise<AppUser> {
  if (actor.role !== 'manager' || !actor.isActive) {
    throw new Error('Permission denied: Only an active Manager can create user accounts.');
  }

  const cleanName = input.name.trim();
  const cleanEmail = input.email.trim().toLowerCase();

  if (cleanName.length < 2 || cleanName.length > 100) {
    throw new Error('Full name must be between 2 and 100 characters.');
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail) || cleanEmail.length > 160) {
    throw new Error('Please provide a valid work email address.');
  }
  if (input.passwordPlain.length < 6) {
    throw new Error('Temporary password must be at least 6 characters.');
  }

  if (isLiveFirebaseConfigured && db) {
    const secondaryAuth = getSecondaryAuth();
    if (!secondaryAuth) {
      throw new Error('Secondary Firebase Auth instance could not be initialized.');
    }

    const userCredential = await createUserWithEmailAndPassword(
      secondaryAuth,
      cleanEmail,
      input.passwordPlain
    );
    const newUid = userCredential.user.uid;

    await signOut(secondaryAuth);

    const nowTimestamp = Timestamp.now();
    const userDocPayload = {
      uid: newUid,
      name: cleanName,
      email: cleanEmail,
      role: input.role,
      isActive: true,
      createdAt: nowTimestamp,
    };

    try {
      await setDoc(doc(db, 'users', newUid), userDocPayload);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `users/${newUid}`);
    }

    return {
      uid: newUid,
      name: cleanName,
      email: cleanEmail,
      role: input.role,
      isActive: true,
      createdAt: nowTimestamp.toDate().toISOString(),
    };
  }

  const { users, passwords } = ensureLocalUsersInitialized();
  if (users.some((u) => u.email.toLowerCase() === cleanEmail)) {
    throw new Error(`An account with email ${cleanEmail} already exists.`);
  }

  const newUser: AppUser = {
    uid: `usr_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
    name: cleanName,
    email: cleanEmail,
    role: input.role,
    isActive: true,
    createdAt: new Date().toISOString(),
  };

  const updatedUsers = [...users, newUser];
  passwords[cleanEmail] = input.passwordPlain;

  localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(updatedUsers));
  localStorage.setItem(LOCAL_PASSWORDS_KEY, JSON.stringify(passwords));
  return newUser;
}

export async function updateEmployeeStatusOrRole(
  actor: AppUser,
  targetUid: string,
  updates: { isActive?: boolean; role?: UserRole; name?: string }
): Promise<AppUser> {
  if (actor.role !== 'manager' || !actor.isActive) {
    throw new Error('Permission denied: Only an active Manager can modify user accounts.');
  }

  if (actor.uid === targetUid && updates.isActive === false) {
    throw new Error('You cannot deactivate your own active Manager account.');
  }

  if (isLiveFirebaseConfigured && db) {
    const userRef = doc(db, 'users', targetUid);
    try {
      await updateDoc(userRef, updates);
      const updatedSnap = await getDoc(userRef);
      const data = updatedSnap.data()!;
      return {
        uid: targetUid,
        name: data.name,
        email: data.email,
        role: data.role as UserRole,
        isActive: Boolean(data.isActive),
        createdAt:
          data.createdAt instanceof Timestamp
            ? data.createdAt.toDate().toISOString()
            : String(data.createdAt),
      };
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${targetUid}`);
    }
  }

  const { users } = ensureLocalUsersInitialized();
  const idx = users.findIndex((u) => u.uid === targetUid);
  if (idx === -1) {
    throw new Error('Target user record not found.');
  }

  const updatedUser: AppUser = {
    ...users[idx],
    ...(updates.name !== undefined ? { name: updates.name.trim() } : {}),
    ...(updates.role !== undefined ? { role: updates.role } : {}),
    ...(updates.isActive !== undefined ? { isActive: updates.isActive } : {}),
  };

  users[idx] = updatedUser;
  localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(users));
  notifyAuthListeners();
  return updatedUser;
}

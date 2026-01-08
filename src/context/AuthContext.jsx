import { createContext, useContext, useEffect, useState } from 'react';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  reauthenticateWithCredential,
  EmailAuthProvider,
  sendPasswordResetEmail
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';

const AuthContext = createContext();

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isMpinVerified, setIsMpinVerified] = useState(false);

  // Sign up function
  const signup = async (email, password, additionalData) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Store additional user data in Firestore
      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        email: email,
        createdAt: new Date().toISOString(),
        ...additionalData // fullName, gender
      });
      
      // Manually set the currentUser immediately with the new data to avoid refetch lag
      setCurrentUser({ ...user, ...additionalData });
      
      return user;
    } catch (error) {
      throw error;
    }
  };

  // Login function
  const login = (email, password) => {
    return signInWithEmailAndPassword(auth, email, password);
  };

  // Logout function
  const logout = () => {
    return signOut(auth);
  };

  // Reset Password function
  const resetPassword = (email) => {
    return sendPasswordResetEmail(auth, email);
  };

  // Reauthenticate function
  const reauthenticate = (password) => {
    const credential = EmailAuthProvider.credential(currentUser.email, password);
    return reauthenticateWithCredential(currentUser, credential);
  };

  const verifySession = () => setIsMpinVerified(true);
  const lockSession = () => setIsMpinVerified(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // Fetch user profile from Firestore
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
             // Merge auth user properties with firestore data
             // We use a spread to avoid mutating the complex Auth object directly if possible, 
             // but here we are setting state. 
             // Ideally we should keep them separate, but for this app merging is convenient.
             // Warning: The User object methods (like delete, getIdToken) might get lost if we just textually spread.
             // Safer to attach data property.
             
             // However, to keep it compatible with existing code usage:
             const userData = userDoc.data();
             setCurrentUser({ ...user, ...userData, ...user }); // User methods on prototype might be lost if we spread user. 
             // A better pattern:
             const hybridUser = Object.assign(user, userData);
             setCurrentUser(hybridUser);
          } else {
            setCurrentUser(user);
          }
        } catch (error) {
            console.error("Error fetching user profile:", error);
            setCurrentUser(user);
        }
      } else {
        setCurrentUser(null);
        setIsMpinVerified(false);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    isMpinVerified,
    verifySession,
    lockSession,
    signup,
    login,
    logout,
    resetPassword,
    reauthenticate
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

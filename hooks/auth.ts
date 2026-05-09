import { GoogleSignin } from '@react-native-google-signin/google-signin';
import auth, { FirebaseAuthTypes } from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';

const ADMIN_EMAILS = ['hiura0012@gmail.com'];

GoogleSignin.configure({
  webClientId: '206619940359-r4c4arj7mkq2pip24cn8i365er8p57i0.apps.googleusercontent.com',
});

const saveUserToFirestore = async (user: FirebaseAuthTypes.User) => {
  try {
    const ref = firestore().collection('users').doc(user.uid);
    const doc = await ref.get();
    const isAdmin = ADMIN_EMAILS.includes(user.email ?? '');

    if (!doc.exists) {
      await ref.set({
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        isAdmin,
        xp: 0,
        level: 1,
        createdAt: Date.now(),
        lastLoginAt: Date.now(),
      });
    } else {
      await ref.update({
        lastLoginAt: Date.now(),
        displayName: user.displayName,
        photoURL: user.photoURL,
        isAdmin,
      });
    }
  } catch {}
};

export const signInWithGoogle = async (): Promise<FirebaseAuthTypes.User | null> => {
  try {
    await GoogleSignin.hasPlayServices();
    const userInfo = await GoogleSignin.signIn();
    const idToken = userInfo?.data?.idToken ?? (userInfo as any)?.idToken ?? '';
    const credential = auth.GoogleAuthProvider.credential(idToken);
    const result = await auth().signInWithCredential(credential);
    await saveUserToFirestore(result.user);
    return result.user;
  } catch (e) {
    console.error('Google Sign-In error:', e);
    return null;
  }
};

export const signOut = async (): Promise<void> => {
  try {
    await GoogleSignin.signOut();
    await auth().signOut();
  } catch {}
};

export const getCurrentUser = (): FirebaseAuthTypes.User | null => {
  return auth().currentUser;
};

export const isAdmin = (): boolean => {
  const user = auth().currentUser;
  return ADMIN_EMAILS.includes(user?.email ?? '');
};

export const onAuthStateChanged = (
  callback: (user: FirebaseAuthTypes.User | null) => void
) => {
  return auth().onAuthStateChanged(callback);
};

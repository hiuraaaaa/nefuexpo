import { GoogleSignin } from '@react-native-google-signin/google-signin';
import auth, { FirebaseAuthTypes } from '@react-native-firebase/auth';

GoogleSignin.configure({
  webClientId: '206619940359-r4c4arj7mkq2pip24cn8i365er8p57i0.apps.googleusercontent.com',
});

export const signInWithGoogle = async (): Promise<FirebaseAuthTypes.User | null> => {
  try {
    await GoogleSignin.hasPlayServices();
    const userInfo = await GoogleSignin.signIn();
    const idToken = userInfo?.data?.idToken ?? (userInfo as any)?.idToken ?? '';
    const credential = auth.GoogleAuthProvider.credential(idToken);
    const result = await auth().signInWithCredential(credential);
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

export const onAuthStateChanged = (
  callback: (user: FirebaseAuthTypes.User | null) => void
) => {
  return auth().onAuthStateChanged(callback);
};

import { GoogleSignin } from '@react-native-google-signin/google-signin';
import auth, { FirebaseAuthTypes } from '@react-native-firebase/auth';

// Web client ID dari Firebase Console →
// Project Settings → your app → OAuth 2.0 client ID
GoogleSignin.configure({
  webClientId: '206619940359-r4c4arj7mkq2pip24cn8i365er8p57i0.apps.googleusercontent.com',
});

export const signInWithGoogle = async (): Promise<FirebaseAuthTypes.User | null> => {
  try {
    await GoogleSignin.hasPlayServices();
    const { data } = await GoogleSignin.signIn();
    const credential = auth.GoogleAuthProvider.credential(data?.idToken ?? '');
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

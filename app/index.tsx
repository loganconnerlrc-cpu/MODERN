import { View, Text, StyleSheet, Pressable, Image } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Atom } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function StartPage() {
  const insets = useSafeAreaInsets();

  return (
    <LinearGradient
      colors={['#0A1628', '#0F2944', '#0A1628']}
      style={styles.container}
    >
      <View style={[styles.content, { paddingTop: insets.top + 40 }]}>
        <View style={styles.logoContainer}>
          <Image
            source={require('@/assets/images/logo2.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>

        <View style={styles.titleContainer}>
          <Atom color="#3B82F6" size={32} strokeWidth={2} />
          <Text style={styles.title}>MODERN NUCLEAR</Text>
          <Text style={styles.subtitle}>Tc-99m Activity Calculator</Text>
        </View>

        <View style={styles.spacer} />

        <View style={styles.buttonContainer}>
          <Pressable
            style={styles.captureButton}
            onPress={() => router.push('/camera')}
          >
            <Image
              source={require('@/assets/images/logo2.png')}
              style={styles.captureLogo}
              resizeMode="contain"
            />
            <Text style={styles.captureText}>CAPTURE</Text>
          </Pressable>

          <Pressable
            style={styles.manualButton}
            onPress={() => router.push('/form')}
          >
            <Text style={styles.manualText}>Manual Mode</Text>
          </Pressable>
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  logoContainer: {
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    overflow: 'hidden',
  },
  logo: {
    width: 140,
    height: 140,
  },
  titleContainer: {
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#3B82F6',
    letterSpacing: 1,
  },
  spacer: {
    flex: 1,
  },
  buttonContainer: {
    width: '100%',
    alignItems: 'center',
    gap: 16,
    paddingBottom: 40,
  },
  captureButton: {
    width: '100%',
    maxWidth: 320,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingVertical: 18,
    borderRadius: 16,
    backgroundColor: '#2563EB',
  },
  captureLogo: {
    width: 28,
    height: 28,
  borderRadius: 14,
  backgroundColor: 'rgba(255, 255, 255, 0.92)',
  padding: 2,
  resizeMode: 'contain',
  alignSelf: 'center',
  overflow: 'hidden',
  borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  captureText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 2,
  },
  manualButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  manualText: {
    fontSize: 16,
    color: '#94A3B8',
    fontWeight: '500',
  },
});

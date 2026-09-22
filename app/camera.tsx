import { useRef, useState, useCallback } from 'react';
import { View, Text, StyleSheet, Pressable, Image, useWindowDimensions } from 'react-native';
import { router } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { scanImage } from '@/utils/ocr';
import { useApp } from '@/context/AppContext';
import { Camera, ScanLine } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const NAVY = '#0A1628';

export default function CameraScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [isScanning, setIsScanning] = useState(false);
  const cameraRef = useRef<CameraView>(null);
  const { setScanData } = useApp();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const frameWidth = Math.min(width - 48, 380);
  const frameHeight = height * 0.3;

  useFocusEffect(
    useCallback(() => {
      setIsScanning(false);
    }, [])
  );

  if (!permission) {
    return <View style={styles.container} />;
  }

  if (!permission.granted) {
    return (
      <View style={styles.permissionContainer}>
        <Camera color="#3B82F6" size={48} />
        <Text style={styles.permissionText}>Camera access is needed to scan the dose sticker.</Text>
        <Pressable style={styles.permissionButton} onPress={requestPermission}>
          <Text style={styles.permissionButtonText}>Grant Permission</Text>
        </Pressable>
      </View>
    );
  }

  const takePicture = async () => {
    if (isScanning) return;
    setIsScanning(true);

    try {
      const photo = await cameraRef.current?.takePictureAsync({
        quality: 1,
        base64: true,
        skipProcessing: false,
      });

      if (!photo?.uri || !photo.width || !photo.height) {
        throw new Error('Could not capture image');
      }

      const result = await scanImage(photo.uri, photo.width, photo.height);
      setScanData({
        actualAmount: result.actualAmount || '',
        calTime: result.calTime || '',
      });
      router.push('/form');
    } catch {
      setScanData({ actualAmount: '', calTime: '' });
      router.push('/form');
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <View style={styles.container}>
      <CameraView ref={cameraRef} style={StyleSheet.absoluteFill} facing="back" ratio="16:9" />
      <View style={styles.overlay} pointerEvents="box-none">
        <View style={styles.topShade} />

        <View style={styles.frameRow}>
          <View style={styles.sideShade} />
          <View style={[styles.frame, { width: frameWidth, height: frameHeight }]}>
            <View style={styles.cornerOverlay} pointerEvents="none">
              <View style={[styles.corner, styles.cornerTL]} />
              <View style={[styles.corner, styles.cornerTR]} />
              <View style={[styles.corner, styles.cornerBL]} />
              <View style={[styles.corner, styles.cornerBR]} />
            </View>
            {isScanning && (
              <View style={styles.scanningOverlay} pointerEvents="none">
                <ScanLine color="#60A5FA" size={30} />
                <Text style={styles.scanningText}>Reading sticker...</Text>
              </View>
            )}
          </View>
          <View style={styles.sideShade} />
        </View>

        <View style={styles.bottomShade} />

        <View style={[styles.controls, { paddingBottom: insets.bottom + 24 }]}>
          {!isScanning && <Text style={styles.guideText}>Align cal time and actual amount within the frame.</Text>}
          <Pressable style={styles.captureButton} onPress={takePicture} disabled={isScanning}>
            <Image
              source={require('@/assets/images/logo2.png')}
              style={styles.captureLogo}
              resizeMode="contain"
            />
          </Pressable>
          <Pressable
            style={styles.manualButton}
            onPress={() => {
              setScanData({ actualAmount: '', calTime: '' });
              router.push('/form');
            }}
          >
            <Text style={styles.manualText}>Manual Mode</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: NAVY },
  overlay: { ...StyleSheet.absoluteFillObject },
  topShade: { flex: 1, backgroundColor: 'rgba(10, 22, 40, 0.72)' },
  frameRow: { flexDirection: 'row', alignItems: 'center' },
  sideShade: { flex: 1, height: '100%', backgroundColor: 'rgba(10, 22, 40, 0.72)' },
  frame: {
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#60A5FA',
    backgroundColor: 'transparent',
  },
  cornerOverlay: { ...StyleSheet.absoluteFillObject },
  corner: { position: 'absolute', width: 28, height: 28, borderColor: '#FFFFFF', borderWidth: 3 },
  cornerTL: { top: -1, left: -1, borderRightWidth: 0, borderBottomWidth: 0 },
  cornerTR: { top: -1, right: -1, borderLeftWidth: 0, borderBottomWidth: 0 },
  cornerBL: { bottom: -1, left: -1, borderRightWidth: 0, borderTopWidth: 0 },
  cornerBR: { bottom: -1, right: -1, borderLeftWidth: 0, borderTopWidth: 0 },
  scanningOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(10, 22, 40, 0.5)',
  },
  scanningText: { color: '#FFFFFF', fontSize: 15, fontWeight: '600' },
  bottomShade: { flex: 1, backgroundColor: 'rgba(10, 22, 40, 0.72)' },
  controls: {
    alignItems: 'center',
    gap: 16,
    paddingTop: 14,
    backgroundColor: NAVY,
  },
  guideText: { color: '#FFFFFF', fontSize: 15, textAlign: 'center', fontWeight: '500' },
  captureButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 4,
    borderColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
  },
  captureLogo: {
    width: 44,
    height: 44,
    borderRadius: 22,
    resizeMode: 'contain',
    overflow: 'hidden',
    padding: 2,
    alignSelf: 'center',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
    backgroundColor: '#FFFFFF',
  },
  manualButton: {
    paddingVertical: 8,
    paddingHorizontal: 24,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  manualText: { color: '#CBD5E1', fontSize: 14, fontWeight: '500' },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: NAVY,
    gap: 16,
    paddingHorizontal: 32,
  },
  permissionText: { color: '#CBD5E1', fontSize: 16, textAlign: 'center', lineHeight: 24 },
  permissionButton: { paddingVertical: 14, paddingHorizontal: 32, borderRadius: 12, backgroundColor: '#2563EB' },
  permissionButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
});

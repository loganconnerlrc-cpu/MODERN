import { View, Text, StyleSheet, Pressable } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useApp } from '@/context/AppContext';
import { formatDose } from '@/utils/decay';
import { RotateCcw, Activity, ArrowLeft } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

function getDoseColor(dose: number, actualAmount: number): string {
  const pctDiff = Math.abs((dose - actualAmount) / actualAmount) * 100;
  if (pctDiff > 10) return '#EF4444';
  if (pctDiff > 6) return '#F59E0B';
  return '#10B981';
}

export default function ResultScreen() {
  const { calcResult, reset } = useApp();
  const insets = useSafeAreaInsets();

  if (!calcResult) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>No calculation available</Text>
        <Pressable
          style={styles.startOverButton}
          onPress={() => {
            reset();
            router.replace('/');
          }}
        >
          <Text style={styles.startOverText}>Start Over</Text>
        </Pressable>
      </View>
    );
  }

  const { dose, minutesDifference, decayFactor, unit, actualAmount, calTime, injectionTime } = calcResult;
  const doseColor = getDoseColor(dose, actualAmount);
  const pctDeviation = ((dose - actualAmount) / actualAmount) * 100;
  const pctSign = pctDeviation >= 0 ? '+' : '';
  const pctDeviationText = `${pctSign}${pctDeviation.toFixed(1)}%`;

  const handleStartOver = () => {
    reset();
    router.replace('/camera');
  };

  return (
    <LinearGradient
      colors={['#0A1628', '#0F2944', '#0A1628']}
      style={styles.container}
    >
      <View style={[styles.content, { paddingTop: insets.top + 60 }]}>
        <View style={styles.iconContainer}>
          <Activity color="#3B82F6" size={40} strokeWidth={2} />
        </View>

        <Text style={styles.label}>Dose:</Text>

        <Text style={[styles.doseValue, { color: doseColor }]}>
          {formatDose(dose)}{' '}
          <Text style={[styles.doseUnit, { color: doseColor }]}>{unit}</Text>
        </Text>

        <View style={styles.detailsContainer}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Cal Amount</Text>
            <Text style={styles.detailValue}>
              {actualAmount} {unit}
            </Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Cal Time</Text>
            <Text style={styles.detailValue}>{calTime}</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Injection Time</Text>
            <Text style={styles.detailValue}>{injectionTime}</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Time Difference</Text>
            <Text style={styles.detailValue}>
              {minutesDifference} minutes
            </Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Decay Factor</Text>
            <Text style={styles.detailValue}>
              {decayFactor.toFixed(4)}
            </Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Percent Deviation</Text>
            <Text style={[styles.detailValue, { color: doseColor }]}>
              {pctDeviationText}
            </Text>
          </View>
        </View>
      </View>

      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 24 }]}>
        <Pressable style={styles.goBackButton} onPress={() => router.back()}>
          <ArrowLeft color="#94A3B8" size={20} />
          <Text style={styles.goBackText}>GO BACK</Text>
        </Pressable>
        <Pressable style={styles.startOverButton} onPress={handleStartOver}>
          <RotateCcw color="#FFFFFF" size={20} />
          <Text style={styles.startOverText}>START OVER</Text>
        </Pressable>
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
  iconContainer: {
    marginBottom: 24,
  },
  label: {
    fontSize: 22,
    fontWeight: '600',
    color: '#94A3B8',
    marginBottom: 16,
    letterSpacing: 1,
  },
  doseValue: {
    fontSize: 56,
    fontWeight: '800',
    marginBottom: 40,
    textAlign: 'center',
  },
  doseUnit: {
    fontSize: 28,
    fontWeight: '600',
  },
  detailsContainer: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.15)',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  detailLabel: {
    fontSize: 14,
    color: '#94A3B8',
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '600',
    textAlign: 'right',
    flexShrink: 1,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  bottomBar: {
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  goBackButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    marginBottom: 12,
  },
  goBackText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#94A3B8',
    letterSpacing: 1,
  },
  startOverButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 18,
    borderRadius: 16,
    backgroundColor: '#2563EB',
  },
  startOverText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0A1628',
    gap: 24,
  },
  errorText: {
    color: '#94A3B8',
    fontSize: 16,
  },
});

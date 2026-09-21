import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useApp } from '@/context/AppContext';
import { calculateDecay, timeToMinutes, formatDose } from '@/utils/decay';
import { ArrowLeft, Check, AlertCircle } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function FormScreen() {
  const { scanData, setCalcResult } = useApp();
  const insets = useSafeAreaInsets();

  const [actualAmount, setActualAmount] = useState('');
  const [calTime, setCalTime] = useState('');
  const [injectionTime, setInjectionTime] = useState('');
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});

  useEffect(() => {
    if (scanData) {
      setActualAmount(scanData.actualAmount || '');
      setCalTime(scanData.calTime || '');
    }
  }, [scanData]);

  const validateAndSubmit = () => {
    const newErrors: Record<string, string> = {};

    const amount = parseFloat(actualAmount);
    if (!actualAmount || isNaN(amount) || amount <= 0) {
      newErrors.amount = 'Enter a valid activity amount';
    }

    const calMin = timeToMinutes(calTime);
    if (calMin === null) {
      newErrors.calTime = 'Enter time as HH:MM (e.g. 08:00)';
    }

    const injMin = timeToMinutes(injectionTime);
    if (injMin === null) {
      newErrors.injection = 'Enter time as HH:MM (e.g. 11:30)';
    }

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    const result = calculateDecay({
      actualAmount: amount,
      calMinutes: calMin!,
      injectionMinutes: injMin!,
    });

    let unit = 'mCi';
    const amountStr = actualAmount.trim();
    const unitMatch = amountStr.match(/(mci|mbq)/i);
    if (unitMatch) {
      unit = unitMatch[1].toLowerCase() === 'mbq' ? 'MBq' : 'mCi';
    }

    setCalcResult({
      dose: result.dose,
      minutesDifference: result.minutesDifference,
      isLater: result.isLater,
      decayFactor: result.decayFactor,
      unit,
      actualAmount: amount,
      calTime,
      injectionTime,
    });

    router.push('/result');
  };

  const isFormValid = () => {
    const amount = parseFloat(actualAmount);
    const calMin = timeToMinutes(calTime);
    const injMin = timeToMinutes(injectionTime);
    return (
      actualAmount &&
      !isNaN(amount) &&
      amount > 0 &&
      calMin !== null &&
      injMin !== null
    );
  };

  const injectionIsValid = timeToMinutes(injectionTime) !== null;

  return (
    <LinearGradient
      colors={['#0A1628', '#0F2944', '#0A1628']}
      style={styles.container}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}
      >
        <View style={[styles.topBar, { paddingTop: insets.top + 12 }]}>
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <ArrowLeft color="#FFFFFF" size={24} />
          </Pressable>
          <Text style={styles.topBarTitle}>Review Information</Text>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.formContainer}>
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Cal Amount</Text>
              <TextInput
                style={[styles.input, errors.amount && styles.inputError]}
                value={actualAmount}
                onChangeText={(text) => {
                  setActualAmount(text);
                  if (errors.amount)
                    setErrors({ ...errors, amount: undefined });
                }}
                placeholder="e.g. 30 mCi"
                placeholderTextColor="#475569"
                keyboardType="default"
                autoCapitalize="none"
                autoCorrect={false}
              />
              {errors.amount && (
                <View style={styles.errorRow}>
                  <AlertCircle color="#EF4444" size={14} />
                  <Text style={styles.errorText}>{errors.amount}</Text>
                </View>
              )}
              <Text style={styles.helperText}>
                Amount of radioactivity at calibration
              </Text>
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Cal Time</Text>
              <TextInput
                style={[styles.input, errors.calTime && styles.inputError]}
                value={calTime}
                onChangeText={(text) => {
                  setCalTime(text);
                  if (errors.calTime)
                    setErrors({ ...errors, calTime: undefined });
                }}
                placeholder="e.g. 08:00"
                placeholderTextColor="#475569"
                keyboardType="default"
                autoCapitalize="none"
                autoCorrect={false}
              />
              {errors.calTime && (
                <View style={styles.errorRow}>
                  <AlertCircle color="#EF4444" size={14} />
                  <Text style={styles.errorText}>{errors.calTime}</Text>
                </View>
              )}
              <Text style={styles.helperText}>
                Time the dose was calibrated for
              </Text>
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Injection Time</Text>
              <TextInput
                style={[
                  styles.input,
                  errors.injection && styles.inputError,
                  !injectionIsValid && !errors.injection && styles.inputEmpty,
                ]}
                value={injectionTime}
                onChangeText={(text) => {
                  setInjectionTime(text);
                  if (errors.injection)
                    setErrors({ ...errors, injection: undefined });
                }}
                placeholder="e.g. 11:30"
                placeholderTextColor="#475569"
                keyboardType="default"
                autoCapitalize="none"
                autoCorrect={false}
              />
              {errors.injection && (
                <View style={styles.errorRow}>
                  <AlertCircle color="#EF4444" size={14} />
                  <Text style={styles.errorText}>{errors.injection}</Text>
                </View>
              )}
              <Text style={styles.helperText}>
                Time tracer was injected into patient
              </Text>
            </View>
          </View>
        </ScrollView>

        <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 24 }]}>
          <Pressable
            style={[styles.confirmButton, !isFormValid() && styles.confirmDisabled]}
            onPress={validateAndSubmit}
            disabled={!isFormValid()}
          >
            <Check color="#FFFFFF" size={24} />
            <Text style={styles.confirmText}>CONFIRM</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    gap: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  topBarTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 100,
  },
  formContainer: {
    gap: 24,
  },
  fieldGroup: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#94A3B8',
    letterSpacing: 0.5,
  },
  labelHint: {
    color: '#3B82F6',
    fontWeight: '500',
  },
  input: {
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.3)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 18,
    color: '#FFFFFF',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  inputError: {
    borderColor: '#EF4444',
  },
  inputEmpty: {
    borderColor: '#EF4444',
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 13,
  },
  helperText: {
    color: '#64748B',
    fontSize: 13,
  },
  bottomBar: {
    paddingHorizontal: 24,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  confirmButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 18,
    borderRadius: 16,
    backgroundColor: '#2563EB',
  },
  confirmDisabled: {
    backgroundColor: 'rgba(37, 99, 235, 0.3)',
  },
  confirmText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 1,
  },
});

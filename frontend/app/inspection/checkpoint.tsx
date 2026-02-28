import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import FindingCard from '../../components/FindingCard';
import ImageCapture from '../../components/ImageCapture';
import VoiceInput from '../../components/VoiceInput';
import { Finding, FindingCreate, submitFinding } from '../../services/api';
import { saveOfflineFinding } from '../../services/storage';

const COMPONENTS = [
  'Engine',
  'Hydraulics',
  'Undercarriage',
  'Cab',
  'Bucket',
  'Boom Arm',
  'Fuel System',
  'Cooling System',
  'Electrical',
  'Final Drive',
  'Other',
];

export default function CheckpointScreen() {
  const { inspectionId } = useLocalSearchParams<{ inspectionId: string }>();
  const router = useRouter();

  const [selectedComponent, setSelectedComponent] = useState<string | null>(null);
  const [voiceTranscript, setVoiceTranscript] = useState('');
  const [audioUri, setAudioUri] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<Finding | null>(null);

  const canSubmit = !!selectedComponent && (!!voiceTranscript || !!imageUri);

  const handleTranscript = (t: string, uri: string) => {
    setVoiceTranscript(t);
    setAudioUri(uri);
  };

  const handleSubmit = async () => {
    if (!inspectionId || !selectedComponent) return;
    setSubmitting(true);

    const finding: FindingCreate = {
      inspection_id: inspectionId,
      component: selectedComponent,
      voice_transcript: voiceTranscript,
      image_uri: imageUri,
      audio_uri: audioUri || null,
    };

    try {
      const created = await submitFinding(finding);
      setResult(created);
    } catch (err) {
      Alert.alert(
        'Offline Mode',
        'Could not reach server. Finding saved locally for sync.',
        [
          {
            text: 'OK',
            onPress: async () => {
              await saveOfflineFinding(finding);
              router.back();
            },
          },
        ],
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (result) {
    return (
      <SafeAreaView style={styles.safe}>
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.successTitle}>Finding Recorded ✓</Text>
          <FindingCard finding={result} />
          <TouchableOpacity
            style={styles.doneButton}
            onPress={() => router.back()}
          >
            <Text style={styles.doneButtonText}>Back to Inspection</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>New Finding</Text>

        <Text style={styles.sectionLabel}>Component</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
          {COMPONENTS.map((c) => (
            <TouchableOpacity
              key={c}
              style={[styles.chip, selectedComponent === c && styles.chipSelected]}
              onPress={() => setSelectedComponent(c)}
            >
              <Text style={[styles.chipText, selectedComponent === c && styles.chipTextSelected]}>
                {c}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <Text style={styles.sectionLabel}>Voice Description</Text>
        <VoiceInput onTranscript={handleTranscript} disabled={submitting} />

        <Text style={styles.sectionLabel}>Photo Evidence</Text>
        <ImageCapture onCapture={setImageUri} disabled={submitting} />

        {submitting ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color="#facc15" />
            <Text style={styles.loadingText}>Analyzing with AI…</Text>
          </View>
        ) : (
          <TouchableOpacity
            style={[styles.submitButton, !canSubmit && styles.submitDisabled]}
            onPress={handleSubmit}
            disabled={!canSubmit}
          >
            <Text style={styles.submitText}>Submit Finding</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  content: {
    padding: 20,
    paddingBottom: 50,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1e293b',
    marginBottom: 20,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 16,
    marginBottom: 8,
  },
  chipScroll: {
    marginBottom: 4,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#e2e8f0',
    marginRight: 8,
  },
  chipSelected: {
    backgroundColor: '#facc15',
  },
  chipText: {
    fontSize: 13,
    color: '#475569',
    fontWeight: '500',
  },
  chipTextSelected: {
    color: '#1e293b',
    fontWeight: '700',
  },
  loadingBox: {
    alignItems: 'center',
    paddingVertical: 24,
    gap: 10,
  },
  loadingText: {
    color: '#64748b',
    fontSize: 14,
  },
  submitButton: {
    marginTop: 24,
    backgroundColor: '#facc15',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  submitDisabled: {
    opacity: 0.45,
  },
  submitText: {
    fontWeight: '700',
    fontSize: 16,
    color: '#1e293b',
  },
  successTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#22c55e',
    marginBottom: 16,
    textAlign: 'center',
  },
  doneButton: {
    marginTop: 20,
    backgroundColor: '#1e293b',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  doneButtonText: {
    color: '#facc15',
    fontWeight: '700',
    fontSize: 15,
  },
});

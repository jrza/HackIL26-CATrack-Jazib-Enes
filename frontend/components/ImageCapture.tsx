import * as ImagePicker from 'expo-image-picker';
import React, { useState } from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface ImageCaptureProps {
  onCapture: (imageUri: string) => void;
  disabled?: boolean;
}

export default function ImageCapture({ onCapture, disabled = false }: ImageCaptureProps) {
  const [imageUri, setImageUri] = useState<string | null>(null);

  const openCamera = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') return;

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
      base64: false,
    });

    if (!result.canceled && result.assets.length > 0) {
      const uri = result.assets[0].uri;
      setImageUri(uri);
      onCapture(uri);
    }
  };

  const openPicker = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
      base64: false,
    });

    if (!result.canceled && result.assets.length > 0) {
      const uri = result.assets[0].uri;
      setImageUri(uri);
      onCapture(uri);
    }
  };

  const retake = () => setImageUri(null);

  return (
    <View style={styles.container}>
      {imageUri ? (
        <View style={styles.previewContainer}>
          <Image source={{ uri: imageUri }} style={styles.thumbnail} />
          <TouchableOpacity
            style={[styles.button, disabled && styles.buttonDisabled]}
            onPress={retake}
            disabled={disabled}
          >
            <Text style={styles.buttonText}>Retake</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={[styles.button, disabled && styles.buttonDisabled]}
            onPress={openCamera}
            disabled={disabled}
          >
            <Text style={styles.cameraIcon}>📷</Text>
            <Text style={styles.buttonText}>Camera</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.button, styles.buttonSecondary, disabled && styles.buttonDisabled]}
            onPress={openPicker}
            disabled={disabled}
          >
            <Text style={styles.cameraIcon}>🖼</Text>
            <Text style={[styles.buttonText, styles.buttonTextSecondary]}>Gallery</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  previewContainer: {
    alignItems: 'center',
    gap: 10,
  },
  thumbnail: {
    width: 160,
    height: 120,
    borderRadius: 8,
    backgroundColor: '#e2e8f0',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#facc15',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 8,
  },
  buttonSecondary: {
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  buttonDisabled: {
    opacity: 0.4,
  },
  cameraIcon: {
    fontSize: 18,
  },
  buttonText: {
    fontWeight: '600',
    color: '#1e293b',
    fontSize: 14,
  },
  buttonTextSecondary: {
    color: '#475569',
  },
});

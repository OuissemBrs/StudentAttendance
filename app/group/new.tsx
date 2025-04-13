import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { useAttendance } from '@/context/AttendanceContext';

export default function NewGroupScreen() {
  const router = useRouter();
  const { addGroup } = useAttendance();
  const [groupName, setGroupName] = useState('');
  const [error, setError] = useState('');

  const handleCreateGroup = () => {
    if (!groupName.trim()) {
      setError('Please enter a group name');
      return;
    }
    addGroup(groupName.trim());
    router.back();
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}>
          <ChevronLeft size={24} color="#007AFF" />
          <Text style={styles.backText}>Groups</Text>
        </TouchableOpacity>
        <Text style={styles.title}>New Group</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Group Name</Text>
          <TextInput
            style={styles.input}
            value={groupName}
            onChangeText={(text) => {
              setGroupName(text);
              setError('');
            }}
            placeholder="Enter group name"
            placeholderTextColor="#8E8E93"
            autoFocus
          />
          {error ? <Text style={styles.errorText}>{error}</Text> : null}
        </View>

        <TouchableOpacity
          style={[styles.createButton, !groupName.trim() && styles.createButtonDisabled]}
          onPress={handleCreateGroup}
          disabled={!groupName.trim()}>
          <Text style={styles.createButtonText}>Create Group</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: '#FFFFFF',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  backText: {
    fontSize: 17,
    color: '#007AFF',
    fontFamily: 'Inter_500Medium',
  },
  title: {
    fontSize: 34,
    fontFamily: 'Inter_700Bold',
    color: '#000000',
  },
  content: {
    padding: 16,
  },
  inputContainer: {
    marginBottom: 24,
  },
  label: {
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
    color: '#8E8E93',
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    fontSize: 17,
    fontFamily: 'Inter_500Medium',
    color: '#000000',
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
    marginTop: 8,
  },
  createButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  createButtonDisabled: {
    opacity: 0.5,
  },
  createButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontFamily: 'Inter_600SemiBold',
  },
});
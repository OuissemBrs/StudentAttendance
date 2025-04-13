import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { useAttendance } from '@/context/AttendanceContext';

export default function NewStudentScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { addStudent } = useAttendance();
  const [studentId, setStudentId] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [errors, setErrors] = useState({
    studentId: '',
    firstName: '',
    lastName: '',
  });

  const validateForm = () => {
    const newErrors = {
      studentId: '',
      firstName: '',
      lastName: '',
    };
    let isValid = true;

    if (!studentId.trim()) {
      newErrors.studentId = 'Student ID is required';
      isValid = false;
    }
    if (!firstName.trim()) {
      newErrors.firstName = 'First name is required';
      isValid = false;
    }
    if (!lastName.trim()) {
      newErrors.lastName = 'Last name is required';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleAddStudent = () => {
    if (validateForm()) {
      addStudent(id as string, {
        id: studentId.trim(),
        firstName: firstName.trim(),
        lastName: lastName.trim(),
      });
      router.back();
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}>
          <ChevronLeft size={24} color="#007AFF" />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Add Student</Text>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Student ID</Text>
          <TextInput
            style={styles.input}
            value={studentId}
            onChangeText={(text) => {
              setStudentId(text);
              setErrors((prev) => ({ ...prev, studentId: '' }));
            }}
            placeholder="Enter student ID"
            placeholderTextColor="#8E8E93"
            autoFocus
          />
          {errors.studentId ? (
            <Text style={styles.errorText}>{errors.studentId}</Text>
          ) : null}
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>First Name</Text>
          <TextInput
            style={styles.input}
            value={firstName}
            onChangeText={(text) => {
              setFirstName(text);
              setErrors((prev) => ({ ...prev, firstName: '' }));
            }}
            placeholder="Enter first name"
            placeholderTextColor="#8E8E93"
          />
          {errors.firstName ? (
            <Text style={styles.errorText}>{errors.firstName}</Text>
          ) : null}
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Last Name</Text>
          <TextInput
            style={styles.input}
            value={lastName}
            onChangeText={(text) => {
              setLastName(text);
              setErrors((prev) => ({ ...prev, lastName: '' }));
            }}
            placeholder="Enter last name"
            placeholderTextColor="#8E8E93"
          />
          {errors.lastName ? (
            <Text style={styles.errorText}>{errors.lastName}</Text>
          ) : null}
        </View>

        <TouchableOpacity
          style={[
            styles.addButton,
            (!studentId.trim() || !firstName.trim() || !lastName.trim()) &&
              styles.addButtonDisabled,
          ]}
          onPress={handleAddStudent}
          disabled={!studentId.trim() || !firstName.trim() || !lastName.trim()}>
          <Text style={styles.addButtonText}>Add Student</Text>
        </TouchableOpacity>
      </ScrollView>
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
  addButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  addButtonDisabled: {
    opacity: 0.5,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontFamily: 'Inter_600SemiBold',
  },
});
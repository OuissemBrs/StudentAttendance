import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ChevronLeft, Check, Calendar } from 'lucide-react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useAttendance } from '@/context/AttendanceContext';

type AttendanceStatus = 'Present' | 'Absent';

interface StudentAttendance {
  studentId: string;
  status: AttendanceStatus;
}

export default function NewAttendanceScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { getGroup, addAttendance } = useAttendance();
  const group = getGroup(id as string);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [attendance, setAttendance] = useState<StudentAttendance[]>([]);

  if (!group) {
    return (
      <View style={styles.container}>
        <Text>Group not found</Text>
      </View>
    );
  }

  const handleDateChange = (event: any, date?: Date) => {
    setShowDatePicker(false);
    if (date) {
      setSelectedDate(date);
    }
  };

  const handleStatusChange = (studentId: string, status: AttendanceStatus) => {
    setAttendance((prev) => {
      const existing = prev.find((a) => a.studentId === studentId);
      if (existing) {
        return prev.map((a) =>
          a.studentId === studentId ? { ...a, status } : a
        );
      }
      return [...prev, { studentId, status }];
    });
  };

  const handleSave = () => {
    const dateString = selectedDate.toISOString().split('T')[0];
    const attendanceRecords = attendance.map((a) => ({
      ...a,
      date: dateString,
    }));
    addAttendance(id as string, attendanceRecords);
    router.back();
  };

  const getStudentStatus = (studentId: string) => {
    return attendance.find((a) => a.studentId === studentId)?.status || null;
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}>
          <ChevronLeft size={24} color="#007AFF" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.title}>Take Attendance</Text>
          <TouchableOpacity
            style={styles.datePicker}
            onPress={() => setShowDatePicker(true)}>
            <Calendar size={18} color="#007AFF" />
            <Text style={styles.dateText}>
              {selectedDate.toLocaleDateString('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
              })}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {showDatePicker && (
        <DateTimePicker
          value={selectedDate}
          mode="date"
          display="spinner"
          onChange={handleDateChange}
        />
      )}

      <FlatList
        data={group.students}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <View style={styles.studentContainer}>
            <View style={styles.studentInfo}>
              <Text style={styles.studentId}>{item.id}</Text>
              <Text style={styles.studentName}>
                {item.firstName} {item.lastName}
              </Text>
            </View>
            <View style={styles.statusButtons}>
              <TouchableOpacity
                style={[
                  styles.statusButton,
                  getStudentStatus(item.id) === 'Present' &&
                  styles.presentSelected,
                ]}
                onPress={() => handleStatusChange(item.id, 'Present')}>
                <Text style={[
                  styles.statusButtonText,
                  getStudentStatus(item.id) === 'Present' &&
                  styles.selectedStatusText
                ]}>
                  {getStudentStatus(item.id) === 'Present' && (
                    <Check size={16} color="#FFFFFF" style={styles.checkIcon} />
                  )}
                  Present
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.statusButton,
                  getStudentStatus(item.id) === 'Absent' &&
                  styles.absentSelected,
                ]}
                onPress={() => handleStatusChange(item.id, 'Absent')}>
                <Text style={[
                  styles.statusButtonText,
                  getStudentStatus(item.id) === 'Absent' &&
                  styles.selectedStatusText
                ]}>
                  {getStudentStatus(item.id) === 'Absent' && (
                    <Check size={16} color="#FFFFFF" style={styles.checkIcon} />
                  )}
                  Absent
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      />

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.saveButton, !attendance.length && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={!attendance.length}>
          <Text style={styles.saveButtonText}>Save Attendance</Text>
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
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    paddingTop: 60,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  backButton: {
    marginRight: 16,
  },
  headerContent: {
    flex: 1,
  },
  title: {
    fontSize: 22,
    fontFamily: 'Inter_700Bold',
    color: '#000000',
    marginBottom: 4,
  },
  datePicker: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  dateText: {
    fontSize: 16,
    fontFamily: 'Inter_500Medium',
    color: '#007AFF',
    marginLeft: 8,
  },
  listContent: {
    padding: 16,
  },
  studentContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  studentInfo: {
    flex: 1,
  },
  studentId: {
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
    color: '#8E8E93',
    marginBottom: 4,
  },
  studentName: {
    fontSize: 16,
    fontFamily: 'Inter_500Medium',
    color: '#000000',
  },
  statusButtons: {
    flexDirection: 'row',
    gap: 8,
    marginLeft: 12,
  },
  statusButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#F2F2F7',
  },
  presentSelected: {
    backgroundColor: '#34C759',
  },
  absentSelected: {
    backgroundColor: '#FF3B30',
  },
  statusButtonText: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
    color: '#8E8E93',
    flexDirection: 'row',
    alignItems: 'center',
  },
  selectedStatusText: {
    color: '#FFFFFF',
  },
  checkIcon: {
    marginRight: 4,
  },
  footer: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
  },
  saveButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
  },
});
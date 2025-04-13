import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ScrollView,
  TextInput,
  Modal,
  Dimensions,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ChevronLeft, Plus, Calendar, Edit, Check, X } from 'lucide-react-native';
import { useAttendance } from '@/context/AttendanceContext';

const windowWidth = Dimensions.get('window').width;

export default function GroupDetailsScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { getGroup, updateStudent, updateAttendance } = useAttendance();
  const group = getGroup(id as string);

  // State for editing student details (ID, first name, last name)
  const [editingStudent, setEditingStudent] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<{ id: string; firstName: string; lastName: string }>({
    id: '',
    firstName: '',
    lastName: '',
  });

  // State for selected attendance cell (for showing modal for status update)
  const [selectedCell, setSelectedCell] = useState<{ studentId: string; date: string } | null>(null);

  if (!group) {
    return (
      <View style={styles.container}>
        <Text>Group not found</Text>
      </View>
    );
  }

  const dates = Array.from(new Set(group.attendance.map((a) => a.date))).sort(
    (a, b) => new Date(b).getTime() - new Date(a).getTime()
  );

  const getAttendanceStatus = (studentId: string, date: string) => {
    const record = group.attendance.find((a) => a.studentId === studentId && a.date === date);
    return record?.status || '-';
  };

  const handleStatusChange = (studentId: string, date: string, newStatus: string) => {
    updateAttendance(id as string, {
      studentId,
      date,
      status: newStatus as 'Present' | 'Absent' | 'Justified',
    });
    setSelectedCell(null);
  };

  // Trigger student editing modal
  const startEditing = (student: any) => {
    setEditingStudent(student.id);
    setEditForm({
      id: student.id,
      firstName: student.firstName,
      lastName: student.lastName,
    });
  };

  const saveEdits = () => {
    if (editingStudent) {
      updateStudent(id as string, editingStudent, {
        id: editForm.id,
        firstName: editForm.firstName,
        lastName: editForm.lastName,
      });
      setEditingStudent(null);
    }
  };

  const cancelStudentEdits = () => {
    setEditingStudent(null);
  };

  // Type-safe status styles mapping for inline status indicator in the table
  const StatusIndicator = ({ status }: { status: string }) => {
    const statusStyles: Record<string, any> = {
      Present: styles.statusPresent,
      Absent: styles.statusAbsent,
      Justified: styles.statusJustified,
      '-': styles.statusDash,
    };

    const style = statusStyles[status] || styles.statusDash;

    return (
      <View style={[styles.statusPill, style]}>
        <Text style={styles.statusText}>{status.charAt(0)}</Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ChevronLeft size={24} color="#4A5568" />
          <Text style={styles.backText}>Groups</Text>
        </TouchableOpacity>
        <Text style={styles.title}>{group.name}</Text>
      </View>

      {/* Attendance Table */}
      <ScrollView
        horizontal
        style={[styles.tableContainer, { width: windowWidth }]}
        contentContainerStyle={styles.tableContent}
        showsHorizontalScrollIndicator={true}
      >
        <View>
          {/* Table Header */}
          <View style={styles.tableHeader}>
            <View style={[styles.headerCell, styles.fixedColumn, styles.idColumn]}>
              <Text style={styles.headerText}>Student ID</Text>
            </View>
            <View style={[styles.headerCell, styles.fixedColumn, styles.nameColumn]}>
              <Text style={styles.headerText}>Full Name</Text>
            </View>
            {dates.map((date, index) => (
              <View key={date} style={[styles.headerCell, styles.dateColumn]}>
                <Text style={styles.dateText}>
                  {new Date(date).toLocaleDateString('en-US', { day: 'numeric' })}
                </Text>
                <Text style={styles.monthText}>
                  {new Date(date).toLocaleDateString('en-US', { month: 'short' })}
                </Text>
              </View>
            ))}
          </View>

          {/* Student Rows */}
          <FlatList
            data={group.students}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <View style={styles.studentRow}>
                {/* Student ID */}
                <TouchableOpacity
                  style={[styles.cell, styles.fixedColumn, styles.idColumn]}
                  onPress={() => startEditing(item)}
                >
                  <Text style={styles.cellText}>{item.id}</Text>
                </TouchableOpacity>

                {/* Student Name */}
                <TouchableOpacity
                  style={[styles.cell, styles.fixedColumn, styles.nameColumn]}
                  onPress={() => startEditing(item)}
                >
                  <Text style={styles.cellText}>
                    {item.firstName} {item.lastName}
                  </Text>
                </TouchableOpacity>

                {/* Attendance Status for each Date */}
                {dates.map((date) => (
                  <TouchableOpacity
                    key={date}
                    style={[styles.cell, styles.statusCell]}
                    onPress={() => setSelectedCell({ studentId: item.id, date })}
                  >
                    <StatusIndicator status={getAttendanceStatus(item.id, date)} />
                  </TouchableOpacity>
                ))}
              </View>
            )}
          />
        </View>
      </ScrollView>

      {/* Action Buttons */}
      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => router.push(`/group/${id}/student/new`)}
        >
          <Plus size={20} color="#FFFFFF" />
          <Text style={styles.actionButtonText}>New Student</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => router.push(`/group/${id}/attendance/new`)}
        >
          <Calendar size={20} color="#FFFFFF" />
          <Text style={styles.actionButtonText}>Record Attendance</Text>
        </TouchableOpacity>
      </View>

      {/* Modal for Attendance Status Editing */}
      <Modal
        visible={selectedCell !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedCell(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Update Attendance Status</Text>
            {['Present', 'Absent', 'Justified'].map((status) => (
              <TouchableOpacity
                key={status}
                style={[styles.statusOption, statusStyles(status)]}
                onPress={() => {
                  if (selectedCell) {
                    handleStatusChange(selectedCell.studentId, selectedCell.date, status);
                  }
                }}
              >
                <Text style={styles.statusOptionText}>{status}</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity style={styles.modalCancelButton} onPress={() => setSelectedCell(null)}>
              <Text style={styles.modalCancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modal for Editing Student Name and ID */}
      <Modal
        visible={editingStudent !== null}
        transparent
        animationType="fade"
        onRequestClose={cancelStudentEdits}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Edit Student Details</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Student ID"
              value={editForm.id}
              onChangeText={(text) => setEditForm((prev) => ({ ...prev, id: text }))}
            />
            <TextInput
              style={styles.modalInput}
              placeholder="First Name"
              value={editForm.firstName}
              onChangeText={(text) => setEditForm((prev) => ({ ...prev, firstName: text }))}
            />
            <TextInput
              style={styles.modalInput}
              placeholder="Last Name"
              value={editForm.lastName}
              onChangeText={(text) => setEditForm((prev) => ({ ...prev, lastName: text }))}
            />
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalActionButton} onPress={saveEdits}>
                <Text style={styles.modalActionButtonText}>Save</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalActionButton} onPress={cancelStudentEdits}>
                <Text style={styles.modalActionButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// Helper function to get status style for status options in the modal
const statusStyles = (status: string) => {
  const mapping: Record<string, any> = {
    Present: styles.statusPresent,
    Absent: styles.statusAbsent,
    Justified: styles.statusJustified,
  };
  return mapping[status] || styles.statusDash;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7FAFC',
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 24,
    paddingBottom: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  backText: {
    fontSize: 16,
    color: '#4A5568',
    fontFamily: 'Inter_600SemiBold',
    marginLeft: 8,
  },
  title: {
    fontSize: 24,
    fontFamily: 'Inter_700Bold',
    color: '#1A202C',
  },
  tableContainer: {
    paddingHorizontal: 24,
  },
  // Added content container style to give right padding to scrollable content
  tableContent: {
    paddingRight: 24,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerCell: {
    justifyContent: 'center',
    paddingVertical: 16,
  },
  headerText: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
    color: '#718096',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  idColumn: {
    width: 100,
    paddingLeft: 16,
  },
  nameColumn: {
    width: 160,
    paddingLeft: 16,
  },
  dateColumn: {
    width: 60,
    alignItems: 'center',
  },
  studentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EDF2F7',
  },
  cell: {
    height: 56,
    justifyContent: 'center',
  },
  cellText: {
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
    color: '#2D3748',
  },
  fixedColumn: {
    backgroundColor: '#F8FAFC',
  },
  statusCell: {
    width: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusPill: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusText: {
    fontSize: 12,
    fontFamily: 'Inter_700Bold',
    color: '#FFFFFF',
  },
  statusPresent: { backgroundColor: '#48BB78' },
  statusAbsent: { backgroundColor: '#F56565' },
  statusJustified: { backgroundColor: '#ECC94B' },
  statusDash: { backgroundColor: '#CBD5E0' },
  actions: {
    flexDirection: 'row',
    padding: 24,
    gap: 16,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4299E1',
    paddingVertical: 14,
    borderRadius: 8,
    gap: 8,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
  },
  dateText: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
    color: '#1A202C',
  },
  monthText: {
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
    color: '#718096',
    textTransform: 'uppercase',
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalContent: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: 'Inter_700Bold',
    color: '#1A202C',
    marginBottom: 16,
  },
  modalInput: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#CBD5E0',
    borderRadius: 6,
    padding: 12,
    fontSize: 14,
    marginVertical: 8,
  },
  modalActions: {
    flexDirection: 'row',
    marginTop: 16,
    gap: 16,
  },
  modalActionButton: {
    backgroundColor: '#4299E1',
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 6,
  },
  modalActionButtonText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontFamily: 'Inter_600SemiBold',
  },
  modalCancelButton: {
    marginTop: 16,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  modalCancelButtonText: {
    fontSize: 14,
    color: '#F56565',
    fontFamily: 'Inter_600SemiBold',
  },
  // Status option styles used in the attendance modal
  statusOption: {
    width: '100%',
    paddingVertical: 12,
    backgroundColor: '#CBD5E0',
    borderRadius: 6,
    marginVertical: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusOptionText: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
    color: '#1A202C',
  },
});

export { styles };

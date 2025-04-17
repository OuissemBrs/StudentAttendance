import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface Student {
  id: string;
  firstName: string;
  lastName: string;
  micro1?: number;
  micro2?: number;
  notes?: string;
}

interface Attendance {
  studentId: string;
  date: string;
  status: 'Present' | 'Absent' | 'Justified';
}

interface Group {
  id: string;
  name: string;
  students: Student[];
  attendance: Attendance[];
}

interface AttendanceContextType {
  groups: Group[];
  addGroup: (name: string) => void;
  removeGroup: (groupId: string) => void;
  updateGroupName: (groupId: string, newName: string) => void;
  addStudent: (groupId: string, student: Student) => void;
  removeStudent: (groupId: string, studentId: string) => void;
  updateStudent: (groupId: string, studentId: string, updatedStudent: Student) => void;
  updateMicroScores: (groupId: string, studentId: string, micro1?: number, micro2?: number) => void;
  updateStudentNotes: (groupId: string, studentId: string, notes: string) => void;
  addAttendance: (groupId: string, attendance: Attendance[]) => void;
  updateAttendance: (groupId: string, attendance: Attendance) => void;
  getGroup: (groupId: string) => Group | undefined;
}

const AttendanceContext = createContext<AttendanceContextType | undefined>(undefined);

export function AttendanceProvider({ children }: { children: React.ReactNode }) {
  const [groups, setGroups] = useState<Group[]>([]);

  useEffect(() => {
    loadGroups();
  }, []);

  const loadGroups = async () => {
    try {
      const savedGroups = await AsyncStorage.getItem('groups');
      if (savedGroups) {
        setGroups(JSON.parse(savedGroups));
      }
    } catch (error) {
      console.error('Error loading groups:', error);
    }
  };

  const saveGroups = async (newGroups: Group[]) => {
    try {
      await AsyncStorage.setItem('groups', JSON.stringify(newGroups));
    } catch (error) {
      console.error('Error saving groups:', error);
    }
  };

  // Group management
  const addGroup = (name: string) => {
    const newGroup: Group = {
      id: Date.now().toString(),
      name,
      students: [],
      attendance: [],
    };
    const updatedGroups = [...groups, newGroup];
    setGroups(updatedGroups);
    saveGroups(updatedGroups);
  };

  const removeGroup = (groupId: string) => {
    const updatedGroups = groups.filter(group => group.id !== groupId);
    setGroups(updatedGroups);
    saveGroups(updatedGroups);
  };

  const updateGroupName = (groupId: string, newName: string) => {
    const updatedGroups = groups.map(group =>
      group.id === groupId ? { ...group, name: newName } : group
    );
    setGroups(updatedGroups);
    saveGroups(updatedGroups);
  };

  // Student management
  const addStudent = (groupId: string, student: Student) => {
    const updatedGroups = groups.map(group =>
      group.id === groupId
        ? { ...group, students: [...group.students, student] }
        : group
    );
    setGroups(updatedGroups);
    saveGroups(updatedGroups);
  };

  const removeStudent = (groupId: string, studentId: string) => {
    const updatedGroups = groups.map(group =>
      group.id === groupId
        ? {
          ...group,
          students: group.students.filter(s => s.id !== studentId),
          attendance: group.attendance.filter(a => a.studentId !== studentId)
        }
        : group
    );
    setGroups(updatedGroups);
    saveGroups(updatedGroups);
  };

  // Micro score updates with validation
  const updateMicroScores = (groupId: string, studentId: string, micro1?: number, micro2?: number) => {
    if (
      (micro1 !== undefined && (micro1 < 0 || micro1 > 20)) ||
      (micro2 !== undefined && (micro2 < 0 || micro2 > 20))
    ) {
      throw new Error('Micro scores must be between 0 and 20');
    }

    const updatedGroups = groups.map(group => {
      if (group.id === groupId) {
        return {
          ...group,
          students: group.students.map(student =>
            student.id === studentId
              ? { ...student, micro1, micro2 }
              : student
          )
        };
      }
      return group;
    });

    setGroups(updatedGroups);
    saveGroups(updatedGroups);
  };

  // Notes modification
  const updateStudentNotes = (groupId: string, studentId: string, notes: string) => {
    const updatedGroups = groups.map(group => {
      if (group.id === groupId) {
        return {
          ...group,
          students: group.students.map(student =>
            student.id === studentId
              ? { ...student, notes }
              : student
          )
        };
      }
      return group;
    });

    setGroups(updatedGroups);
    saveGroups(updatedGroups);
  };

  // Full student update
  const updateStudent = (groupId: string, studentId: string, updatedStudent: Student) => {
    if (
      (updatedStudent.micro1 !== undefined && (updatedStudent.micro1 < 0 || updatedStudent.micro1 > 20)) ||
      (updatedStudent.micro2 !== undefined && (updatedStudent.micro2 < 0 || updatedStudent.micro2 > 20))
    ) {
      throw new Error('Micro scores must be between 0 and 20');
    }

    const updatedGroups = groups.map(group => {
      if (group.id === groupId) {
        const updatedStudents = group.students.map(student =>
          student.id === studentId ? updatedStudent : student
        );

        const updatedAttendance = studentId !== updatedStudent.id
          ? group.attendance.map(record =>
            record.studentId === studentId
              ? { ...record, studentId: updatedStudent.id }
              : record
          )
          : group.attendance;

        return {
          ...group,
          students: updatedStudents,
          attendance: updatedAttendance
        };
      }
      return group;
    });

    setGroups(updatedGroups);
    saveGroups(updatedGroups);
  };

  // Attendance management
  const addAttendance = (groupId: string, newAttendance: Attendance[]) => {
    const updatedGroups = groups.map(group => {
      if (group.id === groupId) {
        const existingDates = new Set(newAttendance.map(a => a.date));
        const filteredAttendance = group.attendance.filter(
          a => !existingDates.has(a.date)
        );
        return {
          ...group,
          attendance: [...filteredAttendance, ...newAttendance]
        };
      }
      return group;
    });
    setGroups(updatedGroups);
    saveGroups(updatedGroups);
  };

  const updateAttendance = (groupId: string, updatedAttendance: Attendance) => {
    const updatedGroups = groups.map(group => {
      if (group.id === groupId) {
        const filteredAttendance = group.attendance.filter(a =>
          !(a.studentId === updatedAttendance.studentId && a.date === updatedAttendance.date)
        );
        return {
          ...group,
          attendance: [...filteredAttendance, updatedAttendance]
        };
      }
      return group;
    });
    setGroups(updatedGroups);
    saveGroups(updatedGroups);
  };

  const getGroup = (groupId: string) => {
    return groups.find(group => group.id === groupId);
  };

  return (
    <AttendanceContext.Provider
      value={{
        groups,
        addGroup,
        removeGroup,
        updateGroupName,
        addStudent,
        removeStudent,
        updateStudent,
        updateMicroScores,
        updateStudentNotes,
        addAttendance,
        updateAttendance,
        getGroup,
      }}
    >
      {children}
    </AttendanceContext.Provider>
  );
}

export function useAttendance() {
  const context = useContext(AttendanceContext);
  if (context === undefined) {
    throw new Error('useAttendance must be used within an AttendanceProvider');
  }
  return context;
}
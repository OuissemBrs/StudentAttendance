import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface Student {
  id: string;
  firstName: string;
  lastName: string;
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
  addStudent: (groupId: string, student: Student) => void;
  updateStudent: (groupId: string, studentId: string, updatedStudent: Student) => void;
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

  const addStudent = (groupId: string, student: Student) => {
    const updatedGroups = groups.map(group => {
      if (group.id === groupId) {
        return {
          ...group,
          students: [...group.students, student],
        };
      }
      return group;
    });
    setGroups(updatedGroups);
    saveGroups(updatedGroups);
  };

  const updateStudent = (groupId: string, studentId: string, updatedStudent: Student) => {
    const updatedGroups = groups.map(group => {
      if (group.id === groupId) {
        const updatedStudents = group.students.map(student => {
          if (student.id === studentId) {
            return updatedStudent;
          }
          return student;
        });

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

  const addAttendance = (groupId: string, newAttendance: Attendance[]) => {
    const updatedGroups = groups.map(group => {
      if (group.id === groupId) {
        const filteredAttendance = group.attendance.filter(
          a => !newAttendance.some(
            na => na.studentId === a.studentId && na.date === a.date
          )
        );
        return {
          ...group,
          attendance: [...filteredAttendance, ...newAttendance],
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

        const newAttendance = [...filteredAttendance, updatedAttendance];
        newAttendance.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        return { ...group, attendance: newAttendance };
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
        addStudent,
        updateStudent,
        addAttendance,
        updateAttendance,
        getGroup,
      }}>
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
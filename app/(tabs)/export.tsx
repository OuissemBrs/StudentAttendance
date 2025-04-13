import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Platform, Alert } from 'react-native';
import { FileText, Download } from 'lucide-react-native';
import { useAttendance } from '@/context/AttendanceContext';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as XLSX from 'xlsx/xlsx.mjs';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

type ExportFormat = 'excel' | 'pdf';

export default function ExportScreen() {
  const { groups } = useAttendance();
  const [loading, setLoading] = useState<string | null>(null);

  const checkPermissions = async () => {
    if (Platform.OS === 'web') return true;

    try {
      const permissions = await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();

      if (!permissions.granted) {
        Alert.alert(
          'Permission Required',
          'We need access to your file system to save exports.',
          [{ text: 'OK' }]
        );
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error checking permissions:', error);
      return false;
    }
  };

  const generateExcelData = (groupId: string) => {
    const group = groups.find(g => g.id === groupId);
    if (!group) return null;

    // Get unique dates
    const dates = Array.from(new Set(group.attendance.map(a => a.date)))
      .sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

    // Prepare data for export
    return group.students.map(student => {
      const studentAttendance = group.attendance.filter(a => a.studentId === student.id);
      const attendanceData = dates.reduce((acc, date) => {
        const record = studentAttendance.find(a => a.date === date);
        acc[new Date(date).toLocaleDateString()] = record?.status || '-';
        return acc;
      }, {} as Record<string, string>);

      return {
        'Student ID': student.id,
        'First Name': student.firstName,
        'Last Name': student.lastName,
        ...attendanceData,
      };
    });
  };

  const exportToExcel = async (groupId: string) => {
    const group = groups.find(g => g.id === groupId);
    if (!group) return;

    setLoading(`${group.name}-excel`);
    try {
      if (Platform.OS !== 'web') {
        const hasPermission = await checkPermissions();
        if (!hasPermission) {
          setLoading(null);
          return;
        }
      }

      const data = generateExcelData(groupId);
      if (!data) throw new Error('No data to export');

      // Create workbook
      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Attendance');

      if (Platform.OS === 'web') {
        // For web, use writeFile to trigger download
        XLSX.writeFile(wb, `${group.name}-attendance.xlsx`);
      } else {
        // For mobile, generate base64 and share
        const wbout = XLSX.write(wb, { type: 'base64', bookType: 'xlsx' });
        const fileName = FileSystem.documentDirectory + `${group.name}-attendance.xlsx`;

        await FileSystem.writeAsStringAsync(fileName, wbout, {
          encoding: FileSystem.EncodingType.Base64,
        });

        await Sharing.shareAsync(fileName, {
          mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          dialogTitle: 'Export Attendance Data',
        });

        // Clean up the temporary file
        await FileSystem.deleteAsync(fileName, { idempotent: true });
      }
    } catch (error) {
      console.error('Error exporting Excel file:', error);
      Alert.alert(
        'Export Error',
        'Failed to export Excel file. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setLoading(null);
    }
  };

  const exportToPDF = async (groupId: string) => {
    const group = groups.find(g => g.id === groupId);
    if (!group) return;

    setLoading(`${group.name}-pdf`);
    try {
      if (Platform.OS !== 'web') {
        const hasPermission = await checkPermissions();
        if (!hasPermission) {
          setLoading(null);
          return;
        }
      }

      const data = generateExcelData(groupId);
      if (!data || data.length === 0) throw new Error('No data to export');

      // Create PDF document in landscape orientation
      const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      });

      // Get unique dates for columns
      const dates = Array.from(new Set(group.attendance.map(a => a.date)))
        .sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

      // Add header with logo and title
      doc.setFontSize(20);
      doc.setTextColor(0, 122, 255);
      doc.text(`${group.name} - Attendance Report`, 15, 20);

      // Add metadata
      doc.setFontSize(10);
      doc.setTextColor(128, 128, 128);
      doc.text(`Generated on ${new Date().toLocaleDateString()}`, 15, 27);
      doc.text(`Total Students: ${group.students.length}`, 15, 32);

      // Prepare table headers with dates
      const tableHeaders = [
        ['Student ID', 'Name', ...dates.map(date => new Date(date).toLocaleDateString())]
      ];

      // Prepare table rows
      const tableRows = data.map(student => {
        const row = [
          student['Student ID'],
          `${student['First Name']} ${student['Last Name']}`,
        ];

        // Add attendance status for each date
        dates.forEach(date => {
          const dateStr = new Date(date).toLocaleDateString();
          row.push(student[dateStr] || '-');
        });

        return row;
      });

      // Calculate column widths based on content
      const baseWidth = 25; // Base width for date columns
      const columnWidths = {
        0: 30, // Student ID
        1: 50, // Name
        ...dates.reduce((acc, _, index) => {
          acc[index + 2] = baseWidth; // Date columns
          return acc;
        }, {} as Record<number, number>)
      };

      // Add table with improved styling
      (doc as any).autoTable({
        head: tableHeaders,
        body: tableRows,
        startY: 40,
        styles: {
          fontSize: 8,
          cellPadding: 2,
        },
        headStyles: {
          fillColor: [0, 122, 255],
          textColor: 255,
          fontSize: 8,
          fontStyle: 'bold',
          halign: 'center',
          valign: 'middle',
        },
        columnStyles: columnWidths,
        alternateRowStyles: {
          fillColor: [245, 245, 245],
        },
        didDrawCell: (data: any) => {
          // Add custom styling for attendance status cells
          if (data.column.index >= 2 && data.cell.section === 'body') {
            const status = data.cell.raw;
            if (status === 'Present') {
              data.cell.styles.textColor = [52, 199, 89]; // Green
            } else if (status === 'Absent') {
              data.cell.styles.textColor = [255, 59, 48]; // Red
            } else if (status === 'Justified') {
              data.cell.styles.textColor = [255, 149, 0]; // Orange
            }
          }
        },
      });

      // Add footer
      const pageCount = (doc as any).internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(128, 128, 128);
        doc.text(
          `Page ${i} of ${pageCount}`,
          doc.internal.pageSize.width / 2,
          doc.internal.pageSize.height - 10,
          { align: 'center' }
        );
      }

      if (Platform.OS === 'web') {
        // For web, trigger download
        doc.save(`${group.name}-attendance.pdf`);
      } else {
        // For mobile, save and share
        const pdfBase64 = doc.output('datauristring').split(',')[1];
        if (!pdfBase64) {
          throw new Error('Failed to generate PDF base64 string');
        }

        const fileName = FileSystem.documentDirectory + `${group.name}-attendance.pdf`;

        await FileSystem.writeAsStringAsync(fileName, pdfBase64, {
          encoding: FileSystem.EncodingType.Base64,
        });

        await Sharing.shareAsync(fileName, {
          mimeType: 'application/pdf',
          dialogTitle: 'Export Attendance Data',
        });

        // Clean up the temporary file
        await FileSystem.deleteAsync(fileName, { idempotent: true });
      }
    } catch (error) {
      console.error('Error exporting PDF file:', error);
      Alert.alert(
        'Export Error',
        'Failed to export PDF file. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setLoading(null);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Export Data</Text>
      </View>

      <FlatList
        data={groups}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.groupItem}>
            <View style={styles.groupInfo}>
              <FileText size={24} color="#007AFF" />
              <Text style={styles.groupName}>{item.name}</Text>
            </View>
            <View style={styles.exportButtons}>
              <TouchableOpacity
                style={[styles.exportButton, styles.excelButton]}
                onPress={() => exportToExcel(item.id)}
                disabled={loading === `${item.name}-excel`}>
                <Download size={20} color="#FFFFFF" />
                <Text style={styles.exportButtonText}>
                  {loading === `${item.name}-excel` ? 'Exporting...' : 'Excel'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.exportButton, styles.pdfButton]}
                onPress={() => exportToPDF(item.id)}
                disabled={loading === `${item.name}-pdf`}>
                <Download size={20} color="#FFFFFF" />
                <Text style={styles.exportButtonText}>
                  {loading === `${item.name}-pdf` ? 'Exporting...' : 'PDF'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
        contentContainerStyle={styles.listContent}
      />
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
  title: {
    fontSize: 34,
    fontFamily: 'Inter_700Bold',
    color: '#000000',
  },
  listContent: {
    padding: 16,
  },
  groupItem: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  groupInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  groupName: {
    fontSize: 17,
    fontFamily: 'Inter_500Medium',
    color: '#000000',
  },
  exportButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  exportButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 8,
  },
  excelButton: {
    backgroundColor: '#34C759',
  },
  pdfButton: {
    backgroundColor: '#FF3B30',
  },
  exportButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
  },
});
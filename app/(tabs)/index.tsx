import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import { useRouter } from 'expo-router';
import { Plus, ChevronRight } from 'lucide-react-native';
import { useAttendance } from '@/context/AttendanceContext';

export default function GroupsScreen() {
  const router = useRouter();
  const { groups } = useAttendance();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Groups</Text>
      </View>

      <FlatList
        data={groups}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.groupItem}
            onPress={() => router.push(`/group/${item.id}`)}>
            <Text style={styles.groupName}>{item.name}</Text>
            <ChevronRight size={20} color="#8E8E93" />
          </TouchableOpacity>
        )}
        contentContainerStyle={styles.listContent}
      />

      <TouchableOpacity
        style={styles.addButton}
        onPress={() => router.push('/group/new')}>
        <Plus size={24} color="#FFFFFF" />
      </TouchableOpacity>
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
  groupName: {
    fontSize: 17,
    fontFamily: 'Inter_500Medium',
    color: '#000000',
  },
  addButton: {
    position: 'absolute',
    bottom: 32,
    right: 32,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
});
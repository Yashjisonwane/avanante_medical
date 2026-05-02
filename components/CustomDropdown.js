import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  FlatList,
  TouchableWithoutFeedback,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ms, fs, wp, hp } from '../utils/responsive';
import { AppColors } from '../constants/Theme';

const CustomDropdown = ({ label, options, value, onSelect, placeholder = 'Select an option', error }) => {
  const [visible, setVisible] = useState(false);

  const selectedOption = options.find(opt => String(opt.id) === String(value) || String(opt.value) === String(value));

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      
      <TouchableOpacity 
        style={[styles.dropdownTrigger, error && styles.errorBorder]} 
        onPress={() => setVisible(true)}
        activeOpacity={0.7}
      >
        <Text style={[styles.triggerText, !selectedOption && styles.placeholderText]}>
          {selectedOption ? (selectedOption.name || selectedOption.label || selectedOption.title) : placeholder}
        </Text>
        <Ionicons name="chevron-down" size={ms(18)} color="#64748B" />
      </TouchableOpacity>

      {error && <Text style={styles.errorText}>{error}</Text>}

      <Modal
        visible={visible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setVisible(false)}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>{label || 'Select'}</Text>
                <TouchableOpacity onPress={() => setVisible(false)}>
                  <Ionicons name="close" size={ms(24)} color="#1E293B" />
                </TouchableOpacity>
              </View>

              <FlatList
                data={options}
                keyExtractor={(item, index) => String(item.id || item.value || index)}
                renderItem={({ item }) => {
                  const isSelected = String(item.id) === String(value) || String(item.value) === String(value);
                  return (
                    <TouchableOpacity 
                      style={[styles.optionItem, isSelected && styles.optionItemActive]} 
                      onPress={() => {
                        onSelect(item.id || item.value || item);
                        setVisible(false);
                      }}
                    >
                      <Text style={[styles.optionText, isSelected && styles.optionTextActive]}>
                        {item.name || item.label || item.title}
                      </Text>
                      {isSelected && <Ionicons name="checkmark-circle" size={ms(20)} color="#2563EB" />}
                    </TouchableOpacity>
                  );
                }}
                contentContainerStyle={styles.listContent}
              />
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: hp(20),
    width: '100%',
  },
  label: {
    fontSize: fs(14),
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: hp(8),
    marginLeft: wp(4),
  },
  dropdownTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: ms(12),
    paddingHorizontal: wp(16),
    height: hp(55),
  },
  triggerText: {
    fontSize: fs(15),
    color: '#1E293B',
    fontWeight: '500',
  },
  placeholderText: {
    color: '#94A3B8',
  },
  errorBorder: {
    borderColor: '#EF4444',
  },
  errorText: {
    color: '#EF4444',
    fontSize: fs(12),
    marginTop: hp(4),
    marginLeft: wp(4),
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: wp(20),
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: ms(20),
    width: '100%',
    maxHeight: hp(500),
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: ms(20),
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  modalTitle: {
    fontSize: fs(18),
    fontWeight: '800',
    color: '#1E293B',
  },
  listContent: {
    paddingVertical: hp(10),
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: ms(20),
    paddingVertical: ms(16),
  },
  optionItemActive: {
    backgroundColor: '#EFF6FF',
  },
  optionText: {
    fontSize: fs(16),
    color: '#475569',
    fontWeight: '500',
  },
  optionTextActive: {
    color: '#2563EB',
    fontWeight: '700',
  },
});

export default CustomDropdown;

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  FlatList,
  Dimensions
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { Colors, Spacing } from '../constants/Theme';
import i18n from '../i18n';

const { height } = Dimensions.get('window');

const LANGUAGES = [
  { code: 'en', label: 'English', nativeLabel: 'English' },
  { code: 'hi', label: 'Hindi', nativeLabel: 'हिंदी' },
  { code: 'pa', label: 'Punjabi', nativeLabel: 'ਪੰਜਾਬੀ' },
];

export default function LanguageSelector({ variant = 'outline', textColor }) {
  const { t } = useTranslation();
  const [isVisible, setIsVisible] = useState(false);

  const currentLanguage = LANGUAGES.find(l => l.code === i18n.language) || LANGUAGES[0];

  const changeLanguage = (code) => {
    i18n.changeLanguage(code);
    setIsVisible(false);
  };

  const labelStyle = textColor ? { color: textColor } : {};
  const valueStyle = textColor ? { color: textColor } : styles.triggerValue;

  return (
    <View>
      <TouchableOpacity
        style={[
          styles.trigger,
          variant === 'ghost' && styles.triggerGhost,
          variant === 'outline' && styles.triggerOutline
        ]}
        onPress={() => setIsVisible(true)}
        activeOpacity={0.7}
      >
        <Text style={[styles.triggerLabel, labelStyle]}>{t('common.select_language')}: </Text>
        <Text style={[styles.triggerValue, valueStyle]}>{currentLanguage.nativeLabel}</Text>
        <Text style={[styles.dropdownIcon, labelStyle]}> ▾</Text>
      </TouchableOpacity>

      <Modal
        visible={isVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setIsVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setIsVisible(false)}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View style={styles.modalIndicator} />
              <Text style={styles.modalTitle}>{t('common.select_language')}</Text>
            </View>

            <FlatList
              data={LANGUAGES}
              keyExtractor={(item) => item.code}
              contentContainerStyle={styles.listContainer}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.langItem,
                    i18n.language === item.code && styles.langItemActive
                  ]}
                  onPress={() => changeLanguage(item.code)}
                >
                  <View>
                    <Text style={[
                      styles.langNativeLabel,
                      i18n.language === item.code && styles.langTextActive
                    ]}>
                      {item.nativeLabel}
                    </Text>
                    <Text style={styles.langLabel}>{item.label}</Text>
                  </View>
                  {i18n.language === item.code && (
                    <View style={styles.checkBadge}>
                      <Text style={styles.checkIcon}>✓</Text>
                    </View>
                  )}
                </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: 12,
  },
  triggerOutline: {
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.background,
  },
  triggerGhost: {
    backgroundColor: 'transparent',
  },
  triggerLabel: {
    fontSize: 14,
    color: Colors.text.secondary,
  },
  triggerValue: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '700',
  },
  dropdownIcon: {
    fontSize: 12,
    color: Colors.text.light,
    marginLeft: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: Spacing.xl,
    maxHeight: height * 0.5,
  },
  modalHeader: {
    alignItems: 'center',
    paddingVertical: Spacing.md,
  },
  modalIndicator: {
    width: 40,
    height: 4,
    backgroundColor: Colors.border,
    borderRadius: 2,
    marginBottom: Spacing.md,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text.primary,
  },
  listContainer: {
    paddingHorizontal: Spacing.lg,
  },
  langItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.secondary,
  },
  langItemActive: {
    backgroundColor: Colors.secondary + '40', // Very light tint
  },
  langNativeLabel: {
    fontSize: 17,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  langLabel: {
    fontSize: 13,
    color: Colors.text.secondary,
    marginTop: 2,
  },
  langTextActive: {
    color: Colors.primary,
  },
  checkBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkIcon: {
    color: Colors.text.white,
    fontSize: 14,
    fontWeight: '900',
  }
});

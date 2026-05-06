import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { wp, hp, ms, fs } from '../../utils/responsive';
import { AppColors } from '../../constants/Theme';

export default function NotificationDetailScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { title, message, created_at, data, is_read } = useLocalSearchParams();
  
  const notificationData = data ? JSON.parse(data) : {};
  const formattedDate = created_at ? new Date(created_at).toLocaleString() : '';

  // Calculate "hours ago" roughly for the header as seen in screenshot
  const getTimeAgo = () => {
    if (!created_at) return '';
    const diff = new Date() - new Date(created_at);
    const hours = Math.floor(diff / (1000 * 60 * 60));
    if (hours < 1) return 'Just now';
    if (hours === 1) return '1 hour ago';
    if (hours < 24) return `${hours} hours ago`;
    return new Date(created_at).toLocaleDateString();
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + hp(10) }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={ms(24)} color={AppColors.textDark} />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
            <Text style={styles.headerLabel}>Home / Notifications / Notification Details</Text>
            <View style={styles.headerMain}>
                <View style={styles.iconBox}>
                    <Ionicons name="desktop-outline" size={ms(20)} color={AppColors.primary} />
                </View>
                <View style={styles.headerText}>
                    <Text style={styles.headerTitle}>{title}</Text>
                    <Text style={styles.headerSubtitle}>Notification details and information</Text>
                </View>
            </View>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.detailCard}>
            <View style={styles.cardHeader}>
                <Ionicons name="time-outline" size={ms(14)} color={AppColors.primary} />
                <Text style={styles.timeAgo}>{getTimeAgo()}</Text>
            </View>
            
            <View style={styles.cardBody}>
                <Text style={styles.cardTitle}>{title}</Text>
                {is_read === 'false' || is_read === false ? (
                    <View style={styles.newBadge}>
                        <View style={styles.dot} />
                        <Text style={styles.newText}>New</Text>
                    </View>
                ) : null}

                <View style={styles.messageBox}>
                    <Text style={styles.messageText}>{message}</Text>
                </View>

                <View style={styles.infoSection}>
                    <View style={styles.infoTitleRow}>
                        <Text style={styles.infoTitle}>ADDITIONAL INFORMATION</Text>
                    </View>
                    <View style={styles.infoGrid}>
                        <View style={styles.infoItem}>
                            <Text style={styles.infoLabel}>Screen:</Text>
                            <Text style={styles.infoValue}>{notificationData.screen || 'HomeScreen'}</Text>
                        </View>
                    </View>
                </View>
            </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    backgroundColor: '#fff',
    paddingHorizontal: wp(16),
    paddingBottom: hp(20),
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  backBtn: {
    width: wp(40),
    height: wp(40),
    borderRadius: wp(20),
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: hp(15),
  },
  headerTitleContainer: {
    paddingLeft: wp(4),
  },
  headerLabel: {
    fontSize: fs(10),
    color: '#94A3B8',
    marginBottom: hp(10),
  },
  headerMain: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconBox: {
    width: ms(44),
    height: ms(44),
    borderRadius: ms(10),
    backgroundColor: '#DBEAFE',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: wp(12),
  },
  headerText: {
    flex: 1,
  },
  headerTitle: {
    fontSize: fs(20),
    fontWeight: '800',
    color: '#1E3A8A',
  },
  headerSubtitle: {
    fontSize: fs(12),
    color: '#64748B',
    marginTop: hp(2),
  },
  scrollContent: {
    padding: wp(20),
  },
  detailCard: {
    backgroundColor: '#fff',
    borderRadius: ms(12),
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: wp(15),
    backgroundColor: '#F8FAFC',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  timeAgo: {
    fontSize: fs(11),
    color: '#64748B',
    fontWeight: '600',
    marginLeft: wp(6),
  },
  cardBody: {
    padding: wp(20),
  },
  cardTitle: {
    fontSize: fs(18),
    fontWeight: '800',
    color: '#1E293B',
    marginBottom: hp(8),
  },
  newBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: wp(8),
    paddingVertical: hp(2),
    borderRadius: ms(6),
    alignSelf: 'flex-start',
    marginBottom: hp(20),
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: AppColors.primary,
    marginRight: wp(6),
  },
  newText: {
    fontSize: fs(10),
    color: AppColors.primary,
    fontWeight: '700',
  },
  messageBox: {
    backgroundColor: '#F8FAFC',
    padding: wp(16),
    borderRadius: ms(8),
    marginBottom: hp(25),
  },
  messageText: {
    fontSize: fs(14),
    color: '#475569',
    lineHeight: fs(22),
  },
  infoSection: {
    borderWidth: 1,
    borderColor: '#F1F5F9',
    borderRadius: ms(8),
  },
  infoTitleRow: {
    padding: wp(12),
    backgroundColor: '#F8FAFC',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  infoTitle: {
    fontSize: fs(10),
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.5,
  },
  infoGrid: {
    padding: wp(12),
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: fs(12),
    color: '#64748B',
    width: wp(60),
  },
  infoValue: {
    fontSize: fs(12),
    color: AppColors.primary,
    fontWeight: '700',
  },
});

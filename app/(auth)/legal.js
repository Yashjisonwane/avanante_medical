import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { apiRequest } from '../../redux/api/baseApi';
import HtmlContent from '../../components/HtmlContent';
import { wp, hp, ms, fs } from '../../utils/responsive';
import { AppColors } from '../../constants/Theme';

export default function LegalScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { t } = useTranslation();
  const { type } = useLocalSearchParams(); // 'terms' or 'privacy'

  const [content, setContent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const isTerms = type === 'terms';
  const title = isTerms
    ? t('auth.terms_of_service', 'Terms of Service')
    : t('auth.privacy_policy', 'Privacy Policy');
  const subtitle = isTerms
    ? t('auth.terms_subtitle', 'Please read our terms carefully before using the app.')
    : t('auth.privacy_subtitle', 'Learn how we collect, use, and protect your personal information');

  useEffect(() => {
    fetchLegal();
  }, [type]);

  const fetchLegal = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await apiRequest({ endpoint: '/common/site/settings', method: 'GET' });
      if (res?.status && res?.data) {
        const field = isTerms ? res.data.terms_conditions : res.data.privacy_policy;
        setContent(field || null);
      } else {
        setContent(null);
      }
    } catch (err) {
      setError(t('common.error', 'Failed to load content. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.8}>
          <Ionicons name="arrow-back" size={ms(22)} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerTextContainer}>
          <Text style={styles.headerTitle} numberOfLines={1}>{title}</Text>
          <Text style={styles.headerSubtitle} numberOfLines={2}>{subtitle}</Text>
        </View>
      </View>

      {/* Content */}
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={AppColors.primary} />
          <Text style={styles.loadingText}>{t('common.loading', 'Loading...')}</Text>
        </View>
      ) : error ? (
        <View style={styles.centerContainer}>
          <Ionicons name="alert-circle-outline" size={ms(48)} color="#EF4444" />
          <Text style={styles.errorTitle}>{t('common.error', 'Error')}</Text>
          <Text style={styles.errorSubtitle}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={fetchLegal} activeOpacity={0.8}>
            <Ionicons name="refresh" size={ms(16)} color="#fff" />
            <Text style={styles.retryBtnText}>{t('common.retry', 'Retry')}</Text>
          </TouchableOpacity>
        </View>
      ) : !content ? (
        <View style={styles.centerContainer}>
          <View style={styles.emptyIconContainer}>
            <Ionicons name="document-text-outline" size={ms(56)} color="#CBD5E1" />
          </View>
          <Text style={styles.emptyTitle}>{t('legal.no_content', 'No content available')}</Text>
          <Text style={styles.emptySubtitle}>
            {t('legal.no_content_desc', 'This section is being updated. Please check back later.')}
          </Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + hp(24) }]}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.contentCard}>
            <HtmlContent html={content} />
          </View>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    backgroundColor: AppColors.primary,
    paddingHorizontal: wp(20),
    paddingVertical: hp(16),
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
  },
  backBtn: {
    width: ms(40),
    height: ms(40),
    borderRadius: ms(20),
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: wp(14),
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: fs(18),
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 0.3,
  },
  headerSubtitle: {
    fontSize: fs(12),
    color: 'rgba(255,255,255,0.78)',
    marginTop: hp(3),
    lineHeight: fs(17),
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: wp(32),
  },
  loadingText: {
    fontSize: fs(14),
    color: '#64748B',
    marginTop: hp(14),
    fontWeight: '500',
  },
  errorTitle: {
    fontSize: fs(18),
    fontWeight: '700',
    color: '#1E293B',
    marginTop: hp(14),
  },
  errorSubtitle: {
    fontSize: fs(14),
    color: '#64748B',
    marginTop: hp(8),
    textAlign: 'center',
    lineHeight: fs(20),
  },
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: AppColors.primary,
    paddingHorizontal: wp(24),
    paddingVertical: hp(12),
    borderRadius: ms(10),
    marginTop: hp(20),
    gap: wp(8),
  },
  retryBtnText: {
    color: '#fff',
    fontSize: fs(14),
    fontWeight: '700',
  },
  emptyIconContainer: {
    width: ms(100),
    height: ms(100),
    borderRadius: ms(50),
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E2E8F0',
    marginBottom: hp(20),
  },
  emptyTitle: {
    fontSize: fs(18),
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: hp(10),
  },
  emptySubtitle: {
    fontSize: fs(14),
    color: '#64748B',
    textAlign: 'center',
    lineHeight: fs(21),
  },
  scrollContent: {
    paddingHorizontal: wp(16),
    paddingTop: hp(16),
  },
  contentCard: {
    backgroundColor: '#fff',
    borderRadius: ms(16),
    padding: wp(20),
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
  },
});

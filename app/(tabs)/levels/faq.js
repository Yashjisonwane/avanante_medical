import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  LayoutAnimation,
  Platform,
  UIManager,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useDispatch, useSelector } from 'react-redux';
import { wp, hp, ms, fs } from '../../../utils/responsive';
import { fetchFaqs } from '../../../redux/slices/courseSlice';
import HtmlContent from '../../../components/HtmlContent';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const FAQItem = ({ item, index }) => {
  const [expanded, setExpanded] = useState(false);

  const toggleExpand = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded(!expanded);
  };

  return (
    <View style={styles.faqCard}>
      <TouchableOpacity 
        style={styles.faqHeader} 
        onPress={toggleExpand}
        activeOpacity={0.7}
      >
        <View style={styles.faqQuestionRow}>
          <View style={styles.indexBadge}>
            <Text style={styles.indexText}>{index + 1}</Text>
          </View>
          <Text style={styles.questionText}>{item.question}</Text>
        </View>
        <Ionicons 
          name={expanded ? "chevron-up" : "chevron-down"} 
          size={ms(18)} 
          color="#64748B" 
        />
      </TouchableOpacity>
      
      {expanded && (
        <View style={styles.faqAnswerContainer}>
          {item.image && (
            <Image 
              source={formatImageUrl(item.image)} 
              style={styles.faqImage} 
              resizeMode="contain" 
            />
          )}
          <HtmlContent 
            html={item.answer} 
            baseStyle={{ marginLeft: item.image ? 0 : wp(36), fontSize: fs(14) }}
          />
        </View>
      )}
    </View>
  );
};

export default function FAQScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const dispatch = useDispatch();
  const { id, type, topicId, moduleId, chapterId } = useLocalSearchParams();
  
  const [faqs, setFaqs] = useState([]);
  const [loading, setLoading] = useState(true);

  // Determine type and id from any possible param
  const faqType = type || (topicId ? 'topic' : (moduleId ? 'module' : (chapterId ? 'chapter' : 'level')));
  const faqId = id || topicId || moduleId || chapterId;

  useEffect(() => {
    const loadFaqs = async () => {
      if (faqId && faqType) {
        try {
          const result = await dispatch(fetchFaqs({ type: faqType, id: faqId })).unwrap();
          setFaqs(result?.data?.faqs || result?.data || []);
        } catch (e) {
          console.error("Failed to fetch FAQs", e);
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    };
    loadFaqs();
  }, [faqId, faqType]);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={ms(24)} color="#1E293B" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Frequently Asked Questions</Text>
      </View>

      <ScrollView 
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.headerSubtitle}>
          Find answers to common questions about our learning materials
        </Text>

        <View style={styles.badgeContainer}>
           <View style={styles.typeBadge}>
              <Ionicons name="pricetag-outline" size={ms(14)} color="#3B82F6" />
              <Text style={styles.typeBadgeText}>Category: <Text style={{fontWeight: '700', textTransform: 'capitalize'}}>{faqType}</Text></Text>
           </View>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color="#3B82F6" style={{ marginTop: hp(50) }} />
        ) : faqs.length > 0 ? (
          faqs.map((item, index) => (
            <FAQItem key={item.id || index} item={item} index={index} />
          ))
        ) : (
          <View style={styles.emptyContainer}>
            <Ionicons name="help-circle-outline" size={ms(60)} color="#CBD5E1" />
            <Text style={styles.emptyText}>No FAQs available for this {faqType}.</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: wp(20),
    height: hp(60),
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  backBtn: {
    padding: ms(5),
    marginRight: wp(10),
  },
  headerTitle: {
    fontSize: fs(18),
    fontWeight: '800',
    color: '#1E293B',
  },
  content: {
    padding: wp(20),
  },
  headerSubtitle: {
    fontSize: fs(14),
    color: '#64748B',
    marginBottom: hp(20),
    lineHeight: fs(22),
  },
  badgeContainer: {
    flexDirection: 'row',
    marginBottom: hp(25),
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: wp(12),
    paddingVertical: hp(8),
    borderRadius: ms(20),
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  typeBadgeText: {
    fontSize: fs(12),
    color: '#3B82F6',
    marginLeft: wp(6),
  },
  faqCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: ms(12),
    borderWidth: 1,
    borderColor: '#F1F5F9',
    marginBottom: hp(15),
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  faqHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: ms(16),
  },
  faqQuestionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: wp(10),
  },
  indexBadge: {
    width: ms(24),
    height: ms(24),
    borderRadius: ms(12),
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: wp(12),
  },
  indexText: {
    fontSize: fs(12),
    color: '#3B82F6',
    fontWeight: '700',
  },
  questionText: {
    fontSize: fs(15),
    fontWeight: '700',
    color: '#1E293B',
    flex: 1,
  },
  faqAnswerContainer: {
    padding: ms(16),
    paddingTop: 0,
    borderTopWidth: 1,
    borderTopColor: '#F8FAFC',
  },
  answerText: {
    fontSize: fs(14),
    color: '#64748B',
    lineHeight: fs(22),
    marginTop: hp(12),
    marginLeft: wp(36),
  },
  faqImage: {
    width: '100%',
    height: hp(150),
    borderRadius: ms(8),
    marginTop: hp(12),
    backgroundColor: '#F8FAFC',
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: hp(100),
  },
  emptyText: {
    fontSize: fs(15),
    color: '#94A3B8',
    marginTop: hp(20),
    fontWeight: '500',
  },
});

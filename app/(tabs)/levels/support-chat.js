import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Image,
  Alert,
  Keyboard,
  Modal,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import * as ImagePicker from 'expo-image-picker';
import { wp, hp, ms, fs } from '../../../utils/responsive';
import { apiRequest, loadAccessToken } from '../../../redux/api/baseApi';
import useSupportSocket from '../../../utils/useSupportSocket';

export default function SupportChatScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { topicId, id, topicTitle } = useLocalSearchParams();
  const actualTopicId = topicId || id;
  const { t } = useTranslation();
  const { user } = useSelector(state => state.auth);

  const [threadId, setThreadId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [activeImageUri, setActiveImageUri] = useState(null);
  const flatListRef = useRef(null);

  useEffect(() => {
    console.log('SupportChatScreen - topicId:', topicId, 'id:', id, 'actualTopicId:', actualTopicId);
    if (actualTopicId) {
      fetchThread();
    } else {
      console.warn('SupportChatScreen - No topic ID found!');
      setLoading(false);
    }
  }, [actualTopicId]);

  useEffect(() => {
    const showListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      () => {
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: true });
        }, 100);
      }
    );
    return () => {
      showListener.remove();
    };
  }, []);

  const fetchThread = async () => {
    try {
      setLoading(true);
      const token = await loadAccessToken();
      console.log(`SupportChatScreen - Fetching thread for topic: ${actualTopicId}, Token Present: ${!!token}`);
      const res = await apiRequest({
        endpoint: `/trainee/support/topics/${actualTopicId}/thread`,
        method: 'GET'
      });
      console.log('SupportChatScreen - Fetch response:', JSON.stringify(res));
      if (res?.success && res?.data) {
        setThreadId(res.data.id);
        setMessages(res.data.messages || []);
      }
    } catch (error) {
      console.error('SupportChatScreen - Error fetching thread:', error);
    } finally {
      setLoading(false);
    }
  };

  useSupportSocket({
    threadId,
    onMessageReceived: (message) => {
      setMessages((prev) => {
        // Prevent duplicate messages if already present
        if (prev.some(m => m.id === message.id)) return prev;
        return [...prev, message];
      });
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  });

  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(t('common.permission_denied', 'Permission Denied'), t('support.permission_needed', 'Please grant library permissions to attach an image.'));
        return;
      }
      let result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
      });
      if (!result.canceled && result.assets && result.assets[0]) {
        setSelectedImage(result.assets[0]);
      }
    } catch (err) {
      console.error('Error picking image:', err);
    }
  };

  const handleSend = async () => {
    if (!newMessage.trim() || !threadId) return;
    const msgText = newMessage.trim();
    const imgToUpload = selectedImage;
    
    setNewMessage('');
    setSelectedImage(null); // Clear preview immediately
    
    try {
      setSending(true);
      let res;
      
      if (imgToUpload) {
        const formData = new FormData();
        formData.append('message', msgText);
        
        const asset = imgToUpload;
        const imgObj = {
          uri: Platform.OS === 'android' ? asset.uri : asset.uri.replace('file://', ''),
          name: asset.fileName || 'attachment.jpg',
          type: asset.mimeType || 'image/jpeg',
        };
        if (Platform.OS === 'android' && !imgObj.uri.startsWith('file://') && !imgObj.uri.startsWith('content://')) {
          imgObj.uri = `file://${imgObj.uri}`;
        }
        formData.append('attachment', imgObj);

        res = await apiRequest({
          endpoint: `/trainee/support/threads/${threadId}/message`,
          method: 'POST',
          body: formData,
          isFormData: true,
        });
      } else {
        res = await apiRequest({
          endpoint: `/trainee/support/threads/${threadId}/message`,
          method: 'POST',
          body: { 
            message: msgText
          }
        });
      }

      if (res?.success && res?.data) {
        const msgData = res.data;
        setMessages((prev) => {
          if (prev.some(m => m.id === msgData.id)) return prev;
          return [...prev, msgData];
        });
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: true });
        }, 100);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setNewMessage(msgText); // Restore input on failure
      setSelectedImage(imgToUpload); // Restore image preview on failure
      Alert.alert(t('common.error', 'Error'), t('support.send_failed', 'Failed to send message. Please try again.'));
    } finally {
      setSending(false);
    }
  };

  const formatTime = (dateStr) => {
    try {
      const date = new Date(dateStr);
      const now = new Date();
      const diffMs = now - date;
      const diffMins = Math.floor(diffMs / 60000);
      
      if (diffMins < 1) {
        return 'less than a minute ago';
      } else if (diffMins < 60) {
        return `${diffMins} ${diffMins === 1 ? 'minute' : 'minutes'} ago`;
      } else {
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' ' + date.toLocaleDateString([], { month: 'short', day: 'numeric' });
      }
    } catch (e) {
      return '';
    }
  };

  const renderMessage = ({ item }) => {
    const isMe = item.sender_id === user?.id || !item.is_admin;
    return (
      <View style={[styles.messageWrapper, isMe ? styles.myMessageWrapper : styles.adminMessageWrapper]}>
        <View style={[styles.messageColumn, { alignItems: isMe ? 'flex-end' : 'flex-start' }]}>
          {/* Header Row (Name & Avatar above bubble) */}
          <View style={[styles.messageHeader, isMe ? styles.myMessageHeader : styles.adminMessageHeader]}>
            {isMe ? (
              <>
                <Text style={styles.senderName}>{item.sender?.name || user?.name || 'vishal'}</Text>
                {item.sender?.profile_image ? (
                  <Image source={{ uri: item.sender.profile_image }} style={styles.senderAvatar} />
                ) : (
                  <View style={styles.senderAvatarFallback}>
                    <Ionicons name="person" size={ms(10)} color="#3B82F6" />
                  </View>
                )}
              </>
            ) : (
              <>
                {item.sender?.profile_image ? (
                  <Image source={{ uri: item.sender.profile_image }} style={styles.senderAvatar} />
                ) : (
                  <View style={[styles.senderAvatarFallback, { backgroundColor: '#F1F5F9', borderColor: '#E2E8F0' }]}>
                    <Ionicons name="person" size={ms(10)} color="#64748B" />
                  </View>
                )}
                <Text style={styles.senderName}>{item.sender?.name || 'Admin'}</Text>
              </>
            )}
          </View>

          {/* Message Bubble */}
          <View style={[styles.messageBubble, isMe ? styles.myMessage : styles.adminMessage]}>
            {item.attachment && (
              <TouchableOpacity onPress={() => setActiveImageUri(item.attachment)} activeOpacity={0.9}>
                <Image source={{ uri: item.attachment }} style={styles.attachment} resizeMode="cover" />
              </TouchableOpacity>
            )}
            {item.message ? (
               <Text style={[styles.messageText, isMe ? styles.myMessageText : styles.adminMessageText]}>
                {item.message}
               </Text>
            ) : null}
          </View>

          {/* Time text below bubble */}
          <Text style={[styles.timeText, isMe ? styles.myTimeText : styles.adminTimeText]}>
             {formatTime(item.created_at)}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={ms(24)} color="#1E3A8A" />
        </TouchableOpacity>
        <View style={styles.headerTitles}>
          <Text style={styles.screenTitle}>{t('support.conversation', 'Support Conversation')}</Text>
          <Text style={styles.screenSubtitle} numberOfLines={1}>Topic: {topicTitle || 'General'}</Text>
        </View>
      </View>

      {loading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#1E3A8A" />
        </View>
      ) : (
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'padding'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? insets.top + 90 : insets.top -40}
        >
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderMessage}
            contentContainerStyle={styles.listContent}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
            onLayout={() => flatListRef.current?.scrollToEnd({ animated: false })}
          />

          {selectedImage && (
            <View style={styles.selectedImagePreviewContainer}>
              <Image source={{ uri: selectedImage.uri }} style={styles.selectedImagePreview} />
              <TouchableOpacity style={styles.removeSelectedImageBtn} onPress={() => setSelectedImage(null)}>
                <Ionicons name="close-circle" size={ms(20)} color="#EF4444" />
              </TouchableOpacity>
            </View>
          )}

          <View style={[styles.inputContainer, { paddingBottom: Math.max(insets.bottom, hp(12)) }]}>
            <TextInput
              style={styles.input}
              placeholder={t('support.type_message', 'Type your question here...')}
              placeholderTextColor="#94A3B8"
              value={newMessage}
              onChangeText={setNewMessage}
              multiline
            />
            <TouchableOpacity style={styles.attachBtn} onPress={pickImage}>
              <Ionicons name="attach" size={ms(24)} color={selectedImage ? "#3B82F6" : "#94A3B8"} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.sendBtn, (!newMessage.trim() || sending) && styles.sendBtnDisabled]}
              onPress={handleSend}
              disabled={!newMessage.trim() || sending}
            >
              {sending ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Ionicons name="send" size={ms(18)} color={newMessage.trim() ? "#fff" : "#94A3B8"} />
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      )}

      {!!activeImageUri && (
        <View style={[StyleSheet.absoluteFillObject, styles.modalBackground, { zIndex: 9999, elevation: 9999 }]}>
          <TouchableOpacity 
            style={styles.modalCloseArea} 
            activeOpacity={1} 
            onPress={() => setActiveImageUri(null)}
          />
          <View style={styles.modalContentContainer}>
            <Image 
              source={{ uri: activeImageUri }} 
              style={styles.fullscreenImage} 
              resizeMode="contain" 
            />
            <TouchableOpacity 
              style={[styles.modalCloseButton, { top: insets.top + hp(12) }]} 
              onPress={() => setActiveImageUri(null)}
              activeOpacity={0.8}
            >
              <Ionicons name="close" size={ms(24)} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>
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
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: wp(16),
    paddingVertical: hp(16),
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  backButton: {
    padding: ms(4),
    marginRight: wp(12),
  },
  headerTitles: {
    flex: 1,
  },
  screenTitle: {
    fontSize: fs(18),
    fontWeight: '700',
    color: '#1E293B',
  },
  screenSubtitle: {
    fontSize: fs(13),
    color: '#64748B',
    marginTop: hp(2),
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    paddingHorizontal: wp(16),
    paddingVertical: hp(16),
    gap: hp(12),
  },
  messageWrapper: {
    flexDirection: 'row',
    marginBottom: hp(16),
  },
  myMessageWrapper: {
    justifyContent: 'flex-end',
  },
  adminMessageWrapper: {
    justifyContent: 'flex-start',
  },
  messageColumn: {
    maxWidth: '80%',
  },
  messageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: hp(4),
    gap: wp(6),
  },
  myMessageHeader: {
    justifyContent: 'flex-end',
    alignSelf: 'flex-end',
  },
  adminMessageHeader: {
    justifyContent: 'flex-start',
    alignSelf: 'flex-start',
  },
  senderName: {
    fontSize: fs(12),
    fontWeight: '600',
    color: '#3B82F6',
  },
  adminSenderName: {
    color: '#64748B',
  },
  senderAvatar: {
    width: ms(18),
    height: ms(18),
    borderRadius: ms(9),
    backgroundColor: '#E2E8F0',
  },
  senderAvatarFallback: {
    width: ms(18),
    height: ms(18),
    borderRadius: ms(9),
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  messageBubble: {
    paddingHorizontal: wp(16),
    paddingVertical: hp(10),
    borderRadius: ms(16),
  },
  myMessage: {
    backgroundColor: '#3B82F6',
    borderTopRightRadius: ms(4),
  },
  adminMessage: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderTopLeftRadius: ms(4),
  },
  messageText: {
    fontSize: fs(14),
    lineHeight: fs(20),
  },
  myMessageText: {
    color: '#FFFFFF',
  },
  adminMessageText: {
    color: '#1E293B',
  },
  timeText: {
    fontSize: fs(10),
    marginTop: hp(4),
  },
  myTimeText: {
    color: '#94A3B8',
    alignSelf: 'flex-end',
  },
  adminTimeText: {
    color: '#94A3B8',
    alignSelf: 'flex-start',
  },
  attachment: {
    width: wp(200),
    height: hp(150),
    borderRadius: ms(8),
    marginBottom: hp(8),
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: wp(16),
    paddingTop: hp(12),
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  input: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    borderRadius: ms(20),
    paddingHorizontal: wp(16),
    paddingVertical: hp(10),
    maxHeight: hp(100),
    fontSize: fs(14),
    color: '#1E293B',
  },
  attachBtn: {
    padding: ms(10),
  },
  sendBtn: {
    backgroundColor: '#3B82F6',
    width: ms(40),
    height: ms(40),
    borderRadius: ms(20),
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: wp(4),
  },
  sendBtnDisabled: {
    backgroundColor: '#E2E8F0',
  },
  selectedImagePreviewContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: wp(16),
    paddingVertical: hp(8),
    backgroundColor: '#F8FAFC',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  selectedImagePreview: {
    width: ms(50),
    height: ms(50),
    borderRadius: ms(8),
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  removeSelectedImageBtn: {
    position: 'absolute',
    top: hp(2),
    left: wp(56),
    backgroundColor: '#fff',
    borderRadius: ms(10),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1,
    elevation: 2,
  },
  modalBackground: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCloseArea: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
  },
  modalContentContainer: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullscreenImage: {
    width: '95%',
    height: '85%',
  },
  modalCloseButton: {
    position: 'absolute',
    right: wp(20),
    width: ms(44),
    height: ms(44),
    borderRadius: ms(22),
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
});

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { wp, hp, ms, fs } from '../../../utils/responsive';
import { AppColors } from '../../../constants/Theme';
import { apiRequest, buildAuthHeaders } from '../../../redux/api/baseApi';
import { useDispatch, useSelector } from 'react-redux';
import * as Linking from 'expo-linking';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { Share, Alert } from 'react-native';
import { jsPDF } from 'jspdf';

export default function CertificateScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { t } = useTranslation();
  const { assessmentId, returnTo } = useLocalSearchParams();
  const { topicContent, currentTopic } = useSelector((state) => state.course);
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const certificateRef = useRef(null);

  const handleGoBack = () => {
    if (returnTo) {
      router.replace(returnTo);
    } else if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)/analytics');
    }
  };
  const { fetchProfile } = require('../../../redux/slices/authSlice');
  
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [downloading, setDownloading] = useState(false);
  const [successEndpoint, setSuccessEndpoint] = useState('');

  useEffect(() => {
    const fetchCertificate = async () => {
      setLoading(true);
      setError(null);
      try {
        let response = null;
        let lastError = null;

        // Try multiple endpoint variations to find the certificate
        const endpoints = [
          `/trainee/reports/certificate/${assessmentId}`,
          `/trainee/reports/certificate-view/${assessmentId}`,
          `/trainee/certificates/${assessmentId}`,
          `/trainee/reports/certifications/${assessmentId}`,
          `/trainee/assessment/${assessmentId}/certificate`,
          `/trainee/reports/certificate-details/${assessmentId}`,
          `/trainee/certificates/view/${assessmentId}`,
          `/trainee/reports/assessment/${assessmentId}/certificate`,
          // Add variations for potentially string IDs or specific query patterns
          `/trainee/reports/certificate?certificate_id=${assessmentId}`,
          `/trainee/reports/certificate?attempt_id=${assessmentId}`,
          `/trainee/reports/certificate?id=${assessmentId}`,
        ];

        for (const endpoint of endpoints) {
          try {
            response = await apiRequest({
              endpoint: endpoint,
              method: 'GET',
            });
            if (response && (response.data || response.certificate_id || response.id)) {
              setSuccessEndpoint(endpoint);
              break; // Success, exit loop
            }
          } catch (err) {
            lastError = err;
            continue; // Try next endpoint
          }
        }

        if (!response) {
          throw lastError || new Error('Certificate not found');
        }
        
        const certData = response?.data || response;
        if (certData && typeof certData === 'object') {
          setData(certData);
        } else {
          setError('Invalid certificate data received');
        }
      } catch (err) {
        console.error('Error fetching certificate:', err);
        setError(err?.message || 'Failed to load certificate details');
      } finally {
        setLoading(false);
      }
    };

    if (assessmentId && assessmentId !== 'undefined' && assessmentId !== 'null') {
      fetchCertificate();
    } else {
      setError('Certificate ID is missing or invalid');
      setLoading(false);
    }
  }, [assessmentId]);

  useEffect(() => {
    if (!user) {
      dispatch(fetchProfile());
    }
  }, [dispatch, user]);

  if (loading) {
    return (
      <View style={styles.centerBox}>
        <ActivityIndicator size="large" color={AppColors.primary} />
        <Text style={styles.loadingText}>Fetching certificate details...</Text>
      </View>
    );
  }

  if (error || !data) {
    return (
      <View style={styles.centerBox}>
        <Ionicons name="alert-circle-outline" size={ms(48)} color={AppColors.placeholder} />
        <Text style={styles.errorText}>{error || 'Certificate not found'}</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={handleGoBack}>
          <Text style={styles.retryBtnText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const certificateData = {
    userName: data?.meta?.user?.name || data?.user_name || data?.trainee?.name || data?.trainee_name || user?.name || 'User',
    userEmail: data?.meta?.user?.email || data?.email || data?.trainee?.email || data?.user_email || user?.email || '',
    employeeId: data?.meta?.user?.employee_id || data?.employee_id || data?.trainee?.employee_id || user?.employee_id || 'N/A',
    courseName: data?.meta?.context?.title || data?.program || data?.course_name || 'N/A',
    score: `${data?.meta?.result?.score || data?.score || 0}/${data?.meta?.marks?.total_marks || data?.total_marks || 5}`,
    percent: `${data?.meta?.result?.percentage || data?.percentage || 0}%`,
    status: String(data?.meta?.result?.status || data?.certificate_status || data?.status || 'PASS').toUpperCase(),
    timeTaken: data?.meta?.time?.time_taken_seconds ? `${Math.round(data.meta.time.time_taken_seconds)}s` : (data?.duration || data?.time_taken || 'N/A'),
    attempt: `#${data?.meta?.attempt?.attempt_id || data?.attempt || 1}`,
    date: (data?.issued_at || data?.certificate_issue_date || data?.issue_date || data?.created_at || data?.updated_at || data?.completed_at) 
      ? new Date(data?.issued_at || data?.certificate_issue_date || data?.issue_date || data?.created_at || data?.updated_at || data?.completed_at).toLocaleDateString() 
      : new Date().toLocaleDateString(),
    completedAt: data?.meta?.time?.submitted_at || data?.completed_at || data?.updated_at || '',
    certId: data?.certificate_id || data?.cert_id || data?.id || 'N/A',
    questionsAttempted: `${data?.meta?.questions?.attempted || 5}/${data?.meta?.questions?.total || 5}`,
    submitMethod: data?.meta?.attempt?.submit_type || data?.submit_method || 'Manual',
    
    // Links
    shareLinks: data?.share_links || {},
    publicUrl: (() => {
      // 1. Try to find a direct URL in the response
      if (data?.certificate_url) return data.certificate_url;
      if (data?.public_url) return data.public_url;
      if (data?.view_url) return data.view_url;

      // 2. Try to extract URL from share links, but avoid the share link itself
      const extractNestedUrl = (link) => {
        if (!link) return null;
        try {
          // Look for URLs that don't belong to social platforms
          const urls = link.match(/https?:\/\/[^\s"'<>]+/g) || [];
          const certUrl = urls.find(u => 
            !u.includes('wa.me') && 
            !u.includes('whatsapp.com') && 
            !u.includes('linkedin.com') && 
            !u.includes('facebook.com') &&
            !u.includes('twitter.com')
          );
          
          if (certUrl) return certUrl.replace(/[^\w\d\-\/\.\?\=\&\%:\+_]/g, '');

          // Try decoding in case it's in a query param
          const decoded = decodeURIComponent(link);
          const nestedUrls = decoded.match(/https?:\/\/[^\s"'<>]+/g) || [];
          const nestedCertUrl = nestedUrls.find(u => 
            u.includes('lms-backend.netswaptech.com') || 
            (!u.includes('wa.me') && !u.includes('whatsapp.com'))
          );
          if (nestedCertUrl) return nestedCertUrl.replace(/[^\w\d\-\/\.\?\=\&\%:\+_]/g, '');
        } catch (e) {}
        return null;
      };

      const fromWa = extractNestedUrl(data?.share_links?.whatsapp);
      if (fromWa) return fromWa;

      const fromLi = extractNestedUrl(data?.share_links?.linkedin);
      if (fromLi) return fromLi;

      // 3. Fallback to standard pattern
      const id = data?.certificate_id || data?.cert_id || data?.id || assessmentId;
      return `https://lms-backend.netswaptech.com/certificate/${id}`;
    })(),

    // Design details
    design: data?.design || {}
  };

  const handleDownload = async () => {
    try {
      setDownloading(true);
      Alert.alert('Downloading', 'Preparing your certificate PDF...');
      
      const baseUrl = 'https://lms-backend.netswaptech.com/api/v1';
      const webBaseUrl = 'https://lms-backend.netswaptech.com';
      
      const downloadUrls = [];
      if (successEndpoint) {
        downloadUrls.push(`${baseUrl}${successEndpoint}/pdf`);
        downloadUrls.push(`${baseUrl}${successEndpoint}?export=pdf`);
      }
      
      downloadUrls.push(`${baseUrl}/trainee/reports/certificate/${assessmentId}/pdf`);
      downloadUrls.push(`${baseUrl}/trainee/reports/certificate/${certificateData.certId}/pdf`);
      downloadUrls.push(`${baseUrl}/trainee/reports/certificate-download/${assessmentId}`);
      downloadUrls.push(`${webBaseUrl}/certificate/pdf/${certificateData.certId}`);
      downloadUrls.push(`${webBaseUrl}/certificate/${certificateData.certId}/pdf`);
      downloadUrls.push(`${webBaseUrl}/certificate/download/${certificateData.certId}`);
      downloadUrls.push(`${webBaseUrl}/certificate/${certificateData.certId}?export=pdf`);
      downloadUrls.push(`${webBaseUrl}/certificate/${certificateData.certId}?download=1`);

      const filename = `Certificate_${certificateData.certId || assessmentId}.pdf`;
      const fileUri = `${FileSystem.documentDirectory}${filename}`;
      const headers = await buildAuthHeaders();

      let success = false;
      let downloadResult = null;

      // 1. Try server-side download first
      for (const url of downloadUrls) {
        try {
          console.log('Attempting download from:', url);
          downloadResult = await FileSystem.downloadAsync(url, fileUri, { headers });
          
          if (downloadResult.status === 200) {
            const fileInfo = await FileSystem.getInfoAsync(fileUri);
            if (fileInfo.exists && fileInfo.size > 500) {
              // Read the first 5 characters to check if it's a valid PDF
              const fileHeader = await FileSystem.readAsStringAsync(fileUri, {
                encoding: 'utf8',
                length: 5,
              });
              
              if (fileHeader && fileHeader.startsWith('%PDF-')) {
                console.log('Valid PDF downloaded successfully from:', url);
                success = true;
                break;
              } else {
                console.log('File is not a valid PDF (probably HTML/JSON error page). Skipping.');
                await FileSystem.deleteAsync(fileUri, { idempotent: true });
              }
            }
          }
        } catch (err) {
          console.log('Download attempt error:', err);
          continue;
        }
      }

      // 2. If server download fails or returns non-PDF, GENERATE PDF LOCALLY using jsPDF
      if (!success) {
        console.log('Server PDF download unavailable/invalid. Generating high-fidelity Portrait PDF locally...');
        try {
          const doc = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4'
          });

          const companyName = certificateData.design?.company_name || "Aavnta Medical";
          const heading = certificateData.design?.heading || "Certificate of Achievement";
          const tagline = certificateData.design?.tagline || "Avante Sales Training App";
          const signerName = certificateData.design?.signer_name || "Dr. John Doe";
          const signerDesignation = certificateData.design?.signer_designation || "Head of Training";
          const footerText = certificateData.design?.footer_text || "This certificate is digitally generated and does not require a physical signature.";

          // Draw the beautiful double green borders exactly like the screenshot
          // Thick outer green border
          doc.setLineWidth(1.2);
          doc.setDrawColor(4, 120, 87); // Emerald Green
          doc.rect(8, 8, 194, 281); 
          
          // Thin inner green border
          doc.setLineWidth(0.4);
          doc.setDrawColor(5, 150, 105); // Lighter Green
          doc.rect(10.5, 10.5, 189, 276);

          // Corner lines (Leaf ornaments representation)
          doc.line(10.5, 16.5, 16.5, 10.5);
          doc.line(10.5, 20.5, 20.5, 10.5);
          doc.line(199.5, 16.5, 193.5, 10.5);
          doc.line(199.5, 20.5, 189.5, 10.5);
          doc.line(10.5, 280.5, 16.5, 286.5);
          doc.line(10.5, 276.5, 20.5, 286.5);
          doc.line(199.5, 280.5, 193.5, 286.5);
          doc.line(199.5, 276.5, 189.5, 286.5);

          // Aavnta Medical
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(26);
          doc.setTextColor(6, 95, 70); // Dark Green
          doc.text(companyName, 105, 32, { align: 'center' });

          // Tagline
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(10);
          doc.setTextColor(4, 120, 87);
          doc.text(tagline, 105, 38, { align: 'center' });

          // Star Icon
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(16);
          doc.setTextColor(4, 120, 87);
          doc.text('★', 105, 46, { align: 'center' });

          // Heading
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(18);
          doc.setTextColor(4, 120, 87);
          doc.text(heading.toUpperCase(), 105, 56, { align: 'center' });

          // Of Achievement Badge text
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(9);
          doc.setTextColor(4, 120, 87);
          doc.text('🏆 OF ACHIEVEMENT 🏆', 105, 63, { align: 'center' });

          // Presented presentation line
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(12);
          doc.setTextColor(100, 116, 139);
          doc.text('This certificate is proudly presented to', 105, 76, { align: 'center' });

          // User Name
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(28);
          doc.setTextColor(6, 95, 70);
          doc.text(certificateData.userName, 105, 92, { align: 'center' });

          // Name underline
          doc.setLineWidth(0.6);
          doc.setDrawColor(4, 120, 87);
          doc.line(45, 96, 165, 96);

          // Employee ID and Email Row
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(9);
          doc.setTextColor(30, 41, 59);
          doc.text(`Employee ID: ${certificateData.employeeId}`, 55, 104, { align: 'center' });
          doc.text(`Email: ${certificateData.userEmail}`, 145, 104, { align: 'center' });

          // Score Grid Section
          // Col 1: Score
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(24);
          doc.setTextColor(4, 120, 87);
          doc.text(certificateData.percent || '100%', 45, 120, { align: 'center' });
          doc.setFontSize(8);
          doc.setTextColor(30, 41, 59);
          doc.text('ACHIEVEMENT SCORE', 45, 126, { align: 'center' });
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(100, 116, 139);
          doc.text(`${certificateData.questionsAttempted} Questions`, 45, 131, { align: 'center' });

          // Col 2: Final Status
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(24);
          doc.setTextColor(4, 120, 87);
          doc.text(certificateData.status || 'PASSED', 105, 120, { align: 'center' });
          doc.setFontSize(8);
          doc.setTextColor(30, 41, 59);
          doc.text('FINAL STATUS', 105, 126, { align: 'center' });
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(100, 116, 139);
          doc.text('Passing Score: 60%', 105, 131, { align: 'center' });

          // Col 3: Time Taken
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(24);
          doc.setTextColor(4, 120, 87);
          doc.text(certificateData.timeTaken || '76s', 165, 120, { align: 'center' });
          doc.setFontSize(8);
          doc.setTextColor(30, 41, 59);
          doc.text('TIME TAKEN', 165, 126, { align: 'center' });
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(100, 116, 139);
          doc.text(`Attempt ${certificateData.attempt || '#8'}`, 165, 131, { align: 'center' });

          // Vertical Separators in Grid
          doc.setLineWidth(0.2);
          doc.setDrawColor(220, 220, 220);
          doc.line(75, 114, 75, 132);
          doc.line(135, 114, 135, 132);

          // Assessment Details Card Box
          doc.setFillColor(248, 250, 252);
          doc.setDrawColor(226, 232, 240);
          doc.setLineWidth(0.4);
          doc.roundedRect(15, 142, 180, 52, 3, 3, 'FD');

          doc.setFont('helvetica', 'bold');
          doc.setFontSize(10);
          doc.setTextColor(6, 95, 70);
          doc.text('ASSESSMENT DETAILS', 20, 149);

          doc.setDrawColor(241, 245, 249);
          doc.line(15, 152, 195, 152);

          doc.setFont('helvetica', 'normal');
          doc.setFontSize(8);
          doc.setTextColor(100, 116, 139);
          
          doc.text('ASSESSMENT DATE', 25, 160);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(30, 41, 59);
          doc.text(certificateData.date, 25, 165);

          doc.setFont('helvetica', 'normal');
          doc.setTextColor(100, 116, 139);
          doc.text('QUESTIONS ATTEMPTED', 115, 160);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(30, 41, 59);
          doc.text(certificateData.questionsAttempted, 115, 165);

          doc.setFont('helvetica', 'normal');
          doc.setTextColor(100, 116, 139);
          doc.text('CORRECT ANSWERS', 25, 178);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(30, 41, 59);
          doc.text(`${certificateData.score || '5/5'} (${certificateData.percent || '100%'})`, 25, 183);

          doc.setFont('helvetica', 'normal');
          doc.setTextColor(100, 116, 139);
          doc.text('COURSE TYPE', 115, 178);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(30, 41, 59);
          doc.text('Topic', 115, 183);

          // Signatures Section
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(13);
          doc.setTextColor(30, 41, 59);
          doc.text(signerName, 60, 218, { align: 'center' });
          doc.setLineWidth(0.4);
          doc.setDrawColor(200, 200, 200);
          doc.line(30, 222, 90, 222);
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(9);
          doc.setTextColor(100, 116, 139);
          doc.text(signerDesignation, 60, 227, { align: 'center' });

          doc.setFont('helvetica', 'bold');
          doc.setFontSize(13);
          doc.setTextColor(30, 41, 59);
          doc.text(certificateData.date, 150, 218, { align: 'center' });
          doc.line(120, 222, 180, 222);
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(9);
          doc.setTextColor(100, 116, 139);
          doc.text('Date of Issue', 150, 227, { align: 'center' });

          // Footer info
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(10);
          doc.setTextColor(4, 120, 87);
          doc.text(`Certificate ID: ${certificateData.certId}`, 105, 246, { align: 'center' });

          doc.setFont('helvetica', 'normal');
          doc.setFontSize(8);
          doc.setTextColor(100, 116, 139);
          doc.text(footerText, 105, 252, { align: 'center' });

          doc.setFont('helvetica', 'bold');
          doc.setFontSize(9);
          doc.setTextColor(100, 116, 139);
          doc.text('✔ Digitally Verified Certificate', 105, 260, { align: 'center' });

          // Output as base64
          const pdfBase64 = doc.output('datauristring').split(',')[1];
          await FileSystem.writeAsStringAsync(fileUri, pdfBase64, { encoding: 'base64' });
          
          success = true;
          downloadResult = { uri: fileUri };
          console.log('Local Portrait PDF generated successfully');
        } catch (pdfError) {
          console.error('Local PDF generation failed:', pdfError);
        }
      }

      if (success && downloadResult) {
        Alert.alert('Success', 'Certificate ready!');
        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(downloadResult.uri, {
            mimeType: 'application/pdf',
            dialogTitle: 'Share Certificate',
            UTI: 'com.adobe.pdf',
          });
        }
      } else {
        // FINAL FALLBACK: Browser
        Alert.alert(
          'Download Issue',
          'The server is currently unable to provide a PDF file. Opening the certificate in your browser instead.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Open Browser', onPress: () => {
              Linking.openURL(certificateData.publicUrl).catch(err => {
                Alert.alert('Error', 'Unable to open browser.');
              });
            }}
          ]
        );
      }
      
    } catch (error) {
      console.error('Download failed:', error);
      Alert.alert('Error', 'An unexpected error occurred during download.');
    } finally {
      setDownloading(false);
    }
  };

  const handleShare = async () => {
    try {
      setDownloading(true);
      
      const baseUrl = 'https://lms-backend.netswaptech.com/api/v1';
      const webBaseUrl = 'https://lms-backend.netswaptech.com';
      
      const downloadUrls = [];
      if (successEndpoint) {
        downloadUrls.push(`${baseUrl}${successEndpoint}/pdf`);
        downloadUrls.push(`${baseUrl}${successEndpoint}?export=pdf`);
      }
      
      downloadUrls.push(`${baseUrl}/trainee/reports/certificate/${assessmentId}/pdf`);
      downloadUrls.push(`${baseUrl}/trainee/reports/certificate/${certificateData.certId}/pdf`);
      downloadUrls.push(`${baseUrl}/trainee/reports/certificate-download/${assessmentId}`);
      downloadUrls.push(`${webBaseUrl}/certificate/pdf/${certificateData.certId}`);
      downloadUrls.push(`${webBaseUrl}/certificate/${certificateData.certId}/pdf`);
      downloadUrls.push(`${webBaseUrl}/certificate/download/${certificateData.certId}`);
      downloadUrls.push(`${webBaseUrl}/certificate/${certificateData.certId}?export=pdf`);
      downloadUrls.push(`${webBaseUrl}/certificate/${certificateData.certId}?download=1`);

      const filename = `Certificate_${certificateData.certId || assessmentId}.pdf`;
      const fileUri = `${FileSystem.documentDirectory}${filename}`;
      const headers = await buildAuthHeaders();

      let success = false;
      let downloadResult = null;

      // 1. Try server-side download first
      for (const url of downloadUrls) {
        try {
          downloadResult = await FileSystem.downloadAsync(url, fileUri, { headers });
          if (downloadResult.status === 200) {
            const fileInfo = await FileSystem.getInfoAsync(fileUri);
            if (fileInfo.exists && fileInfo.size > 500) {
              const fileHeader = await FileSystem.readAsStringAsync(fileUri, {
                encoding: 'utf8',
                length: 5,
              });
              
              if (fileHeader && fileHeader.startsWith('%PDF-')) {
                success = true;
                break;
              } else {
                await FileSystem.deleteAsync(fileUri, { idempotent: true });
              }
            }
          }
        } catch (err) {
          continue;
        }
      }

      // 2. Local PDF generation
      if (!success) {
        try {
          const doc = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4'
          });

          const companyName = certificateData.design?.company_name || "Aavnta Medical";
          const heading = certificateData.design?.heading || "Certificate of Achievement";
          const tagline = certificateData.design?.tagline || "Avante Sales Training App";
          const signerName = certificateData.design?.signer_name || "Dr. John Doe";
          const signerDesignation = certificateData.design?.signer_designation || "Head of Training";
          const footerText = certificateData.design?.footer_text || "This certificate is digitally generated and does not require a physical signature.";

          // Draw the beautiful double green borders exactly like the screenshot
          // Thick outer green border
          doc.setLineWidth(1.2);
          doc.setDrawColor(4, 120, 87); // Emerald Green
          doc.rect(8, 8, 194, 281); 
          
          // Thin inner green border
          doc.setLineWidth(0.4);
          doc.setDrawColor(5, 150, 105); // Lighter Green
          doc.rect(10.5, 10.5, 189, 276);

          // Corner lines (Leaf ornaments representation)
          doc.line(10.5, 16.5, 16.5, 10.5);
          doc.line(10.5, 20.5, 20.5, 10.5);
          doc.line(199.5, 16.5, 193.5, 10.5);
          doc.line(199.5, 20.5, 189.5, 10.5);
          doc.line(10.5, 280.5, 16.5, 286.5);
          doc.line(10.5, 276.5, 20.5, 286.5);
          doc.line(199.5, 280.5, 193.5, 286.5);
          doc.line(199.5, 276.5, 189.5, 286.5);

          // Aavnta Medical
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(26);
          doc.setTextColor(6, 95, 70); // Dark Green
          doc.text(companyName, 105, 32, { align: 'center' });

          // Tagline
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(10);
          doc.setTextColor(4, 120, 87);
          doc.text(tagline, 105, 38, { align: 'center' });

          // Star Icon
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(16);
          doc.setTextColor(4, 120, 87);
          doc.text('★', 105, 46, { align: 'center' });

          // Heading
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(18);
          doc.setTextColor(4, 120, 87);
          doc.text(heading.toUpperCase(), 105, 56, { align: 'center' });

          // Of Achievement Badge text
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(9);
          doc.setTextColor(4, 120, 87);
          doc.text('🏆 OF ACHIEVEMENT 🏆', 105, 63, { align: 'center' });

          // Presented presentation line
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(12);
          doc.setTextColor(100, 116, 139);
          doc.text('This certificate is proudly presented to', 105, 76, { align: 'center' });

          // User Name
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(28);
          doc.setTextColor(6, 95, 70);
          doc.text(certificateData.userName, 105, 92, { align: 'center' });

          // Name underline
          doc.setLineWidth(0.6);
          doc.setDrawColor(4, 120, 87);
          doc.line(45, 96, 165, 96);

          // Employee ID and Email Row
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(9);
          doc.setTextColor(30, 41, 59);
          doc.text(`Employee ID: ${certificateData.employeeId}`, 55, 104, { align: 'center' });
          doc.text(`Email: ${certificateData.userEmail}`, 145, 104, { align: 'center' });

          // Score Grid Section
          // Col 1: Score
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(24);
          doc.setTextColor(4, 120, 87);
          doc.text(certificateData.percent || '100%', 45, 120, { align: 'center' });
          doc.setFontSize(8);
          doc.setTextColor(30, 41, 59);
          doc.text('ACHIEVEMENT SCORE', 45, 126, { align: 'center' });
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(100, 116, 139);
          doc.text(`${certificateData.questionsAttempted} Questions`, 45, 131, { align: 'center' });

          // Col 2: Final Status
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(24);
          doc.setTextColor(4, 120, 87);
          doc.text(certificateData.status || 'PASSED', 105, 120, { align: 'center' });
          doc.setFontSize(8);
          doc.setTextColor(30, 41, 59);
          doc.text('FINAL STATUS', 105, 126, { align: 'center' });
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(100, 116, 139);
          doc.text('Passing Score: 60%', 105, 131, { align: 'center' });

          // Col 3: Time Taken
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(24);
          doc.setTextColor(4, 120, 87);
          doc.text(certificateData.timeTaken || '76s', 165, 120, { align: 'center' });
          doc.setFontSize(8);
          doc.setTextColor(30, 41, 59);
          doc.text('TIME TAKEN', 165, 126, { align: 'center' });
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(100, 116, 139);
          doc.text(`Attempt ${certificateData.attempt || '#8'}`, 165, 131, { align: 'center' });

          // Vertical Separators in Grid
          doc.setLineWidth(0.2);
          doc.setDrawColor(220, 220, 220);
          doc.line(75, 114, 75, 132);
          doc.line(135, 114, 135, 132);

          // Assessment Details Card Box
          doc.setFillColor(248, 250, 252);
          doc.setDrawColor(226, 232, 240);
          doc.setLineWidth(0.4);
          doc.roundedRect(15, 142, 180, 52, 3, 3, 'FD');

          doc.setFont('helvetica', 'bold');
          doc.setFontSize(10);
          doc.setTextColor(6, 95, 70);
          doc.text('ASSESSMENT DETAILS', 20, 149);

          doc.setDrawColor(241, 245, 249);
          doc.line(15, 152, 195, 152);

          doc.setFont('helvetica', 'normal');
          doc.setFontSize(8);
          doc.setTextColor(100, 116, 139);
          
          doc.text('ASSESSMENT DATE', 25, 160);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(30, 41, 59);
          doc.text(certificateData.date, 25, 165);

          doc.setFont('helvetica', 'normal');
          doc.setTextColor(100, 116, 139);
          doc.text('QUESTIONS ATTEMPTED', 115, 160);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(30, 41, 59);
          doc.text(certificateData.questionsAttempted, 115, 165);

          doc.setFont('helvetica', 'normal');
          doc.setTextColor(100, 116, 139);
          doc.text('CORRECT ANSWERS', 25, 178);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(30, 41, 59);
          doc.text(`${certificateData.score || '5/5'} (${certificateData.percent || '100%'})`, 25, 183);

          doc.setFont('helvetica', 'normal');
          doc.setTextColor(100, 116, 139);
          doc.text('COURSE TYPE', 115, 178);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(30, 41, 59);
          doc.text('Topic', 115, 183);

          // Signatures Section
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(13);
          doc.setTextColor(30, 41, 59);
          doc.text(signerName, 60, 218, { align: 'center' });
          doc.setLineWidth(0.4);
          doc.setDrawColor(200, 200, 200);
          doc.line(30, 222, 90, 222);
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(9);
          doc.setTextColor(100, 116, 139);
          doc.text(signerDesignation, 60, 227, { align: 'center' });

          doc.setFont('helvetica', 'bold');
          doc.setFontSize(13);
          doc.setTextColor(30, 41, 59);
          doc.text(certificateData.date, 150, 218, { align: 'center' });
          doc.line(120, 222, 180, 222);
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(9);
          doc.setTextColor(100, 116, 139);
          doc.text('Date of Issue', 150, 227, { align: 'center' });

          // Footer info
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(10);
          doc.setTextColor(4, 120, 87);
          doc.text(`Certificate ID: ${certificateData.certId}`, 105, 246, { align: 'center' });

          doc.setFont('helvetica', 'normal');
          doc.setFontSize(8);
          doc.setTextColor(100, 116, 139);
          doc.text(footerText, 105, 252, { align: 'center' });

          doc.setFont('helvetica', 'bold');
          doc.setFontSize(9);
          doc.setTextColor(100, 116, 139);
          doc.text('✔ Digitally Verified Certificate', 105, 260, { align: 'center' });

          const pdfBase64 = doc.output('datauristring').split(',')[1];
          await FileSystem.writeAsStringAsync(fileUri, pdfBase64, { encoding: 'base64' });
          
          success = true;
          downloadResult = { uri: fileUri };
        } catch (pdfError) {
          console.error('Local PDF generation failed:', pdfError);
        }
      }

      if (success && downloadResult) {
        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(downloadResult.uri, {
            mimeType: 'application/pdf',
            dialogTitle: 'Share Certificate PDF',
            UTI: 'com.adobe.pdf',
          });
        }
      } else {
        // Fallback to text link sharing
        await Share.share({
          message: `I have successfully completed the course "${certificateData.courseName}" on Avante Medical LMS! 🎓\nCheck out my certificate: ${certificateData.publicUrl}`,
          url: certificateData.publicUrl,
        });
      }
    } catch (error) {
      console.error('Share error:', error);
      // Fallback
      await Share.share({
        message: `I have successfully completed the course "${certificateData.courseName}" on Avante Medical LMS! 🎓\nCheck out my certificate: ${certificateData.publicUrl}`,
        url: certificateData.publicUrl,
      });
    } finally {
      setDownloading(false);
    }
  };

  const openSocialLink = (url) => {
    if (url) {
      Linking.openURL(url);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header with Buttons */}
      <View style={[styles.header, { paddingTop: insets.top + hp(5) }]}>
        <TouchableOpacity onPress={handleGoBack} style={styles.backBtnCircle}>
          <Ionicons name="chevron-back" size={24} color="#1E3A8A" />
        </TouchableOpacity>
        <View style={styles.headerLeft}>
          <Text style={styles.headerTitle}>View Certificate</Text>
          <Text style={styles.certIdText}>{certificateData.certId}</Text>
        </View>
        <TouchableOpacity onPress={handleShare} style={styles.shareBtnCircle}>
          <Ionicons name="share-social" size={22} color="#1E3A8A" />
        </TouchableOpacity>
      </View>

      <View style={styles.topActions}>
          <TouchableOpacity onPress={handleDownload} style={styles.mainDownloadBtn}>
            <Ionicons name="download-outline" size={20} color="#fff" style={{ marginRight: 8 }} />
            <Text style={styles.mainDownloadText}>Download Certificate (PDF)</Text>
          </TouchableOpacity>
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Certificate Frame */}
        <View ref={certificateRef} style={styles.certificateOuterFrame}>
          <View style={styles.certBody}>
            {/* Decorative Leaf Corners */}
            <View style={styles.leafCornerTopLeft}><Ionicons name="leaf-outline" size={ms(20)} color="#10B981" /></View>
            <View style={styles.leafCornerTopRight}><Ionicons name="leaf-outline" size={ms(20)} color="#10B981" /></View>
            <View style={styles.leafCornerBottomLeft}><Ionicons name="leaf-outline" size={ms(20)} color="#10B981" /></View>
            <View style={styles.leafCornerBottomRight}><Ionicons name="leaf-outline" size={ms(20)} color="#10B981" /></View>

            {/* Company Logo or Title */}
            {certificateData.design?.company_logo ? (
               <Image 
                 source={{ uri: certificateData.design.company_logo }} 
                 style={styles.companyLogo}
                 resizeMode="contain"
               />
            ) : (
               <View style={{ alignItems: 'center' }}>
                 <Text style={styles.brandTitle}>{certificateData.design?.company_name || 'Aavnta Medical'}</Text>
                 <Text style={styles.taglineText}>{certificateData.design?.tagline || 'Avante Sales Training App'}</Text>
               </View>
            )}
            
            <View style={styles.starContainer}>
              <Ionicons name="star" size={ms(16)} color="#10B981" />
            </View>

            <Text style={styles.headingText}>{certificateData.design?.certificate_title || 'CERTIFICATE OF ACHIEVEMENT'}</Text>
            
            <View style={styles.achievementRow}>
              <Ionicons name="trophy-outline" size={ms(14)} color="#10B981" />
              <Text style={styles.achievementText}> {certificateData.design?.achievement_text || 'OF ACHIEVEMENT'} </Text>
              <Ionicons name="trophy-outline" size={ms(14)} color="#10B981" />
            </View>

            <Text style={styles.awardedTo}>{certificateData.design?.presentation_text || 'This certificate is proudly presented to'}</Text>
            <Text style={styles.studentName}>{certificateData.userName}</Text>
            <View style={styles.nameUnderline} />

            <View style={styles.idEmailRow}>
               <View style={styles.idItem}>
                 <Ionicons name="card-outline" size={ms(12)} color="#10B981" />
                 <Text style={styles.idText}> Employee ID: {certificateData.employeeId}</Text>
               </View>
               <View style={styles.idItem}>
                 <Ionicons name="mail-outline" size={ms(12)} color="#10B981" />
                 <Text style={styles.idText}> {certificateData.userEmail}</Text>
               </View>
            </View>

            {/* 3-Column Stats Row */}
            <View style={styles.statsRow}>
              <View style={styles.statColumn}>
                <Ionicons name="stats-chart-outline" size={ms(18)} color="#10B981" />
                <Text style={styles.statLargeValue}>{certificateData.percent}</Text>
                <Text style={styles.statLabel}>{certificateData.design?.stat_label_score || 'ACHIEVEMENT SCORE'}</Text>
                <Text style={styles.statSub}>{certificateData.score} Questions</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statColumn}>
                <Ionicons name="checkmark-circle-outline" size={ms(18)} color="#10B981" />
                <Text style={styles.statLargeValue}>{certificateData.status}</Text>
                <Text style={styles.statLabel}>{certificateData.design?.stat_label_status || 'FINAL STATUS'}</Text>
                <Text style={styles.statSub}>Passing Score: 60%</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statColumn}>
                <Ionicons name="time-outline" size={ms(18)} color="#10B981" />
                <Text style={styles.statLargeValue}>{certificateData.timeTaken}</Text>
                <Text style={styles.statLabel}>{certificateData.design?.stat_label_time || 'TIME TAKEN'}</Text>
                <Text style={styles.statSub}>Attempt {certificateData.attempt}</Text>
              </View>
            </View>

            {/* Assessment Details Box */}
            <View style={styles.detailsBox}>
               <View style={styles.detailsHeader}>
                  <Text style={styles.detailsHeaderText}>{certificateData.design?.details_header || 'ASSESSMENT DETAILS'}</Text>
               </View>
               <View style={styles.detailsGrid}>
                  <View style={styles.detailsItem}>
                     <View style={styles.detailsIconLabel}>
                        <Ionicons name="calendar-outline" size={ms(14)} color="#10B981" />
                        <View style={{ marginLeft: wp(8) }}>
                           <Text style={styles.dLabel}>ASSESSMENT DATE</Text>
                           <Text style={styles.dValue}>{certificateData.date}</Text>
                        </View>
                     </View>
                  </View>
                  <View style={styles.detailsItem}>
                     <View style={styles.detailsIconLabel}>
                        <Ionicons name="help-circle-outline" size={ms(14)} color="#10B981" />
                        <View style={{ marginLeft: wp(8) }}>
                           <Text style={styles.dLabel}>QUESTIONS ATTEMPTED</Text>
                           <Text style={styles.dValue}>{certificateData.questionsAttempted}</Text>
                        </View>
                     </View>
                  </View>
                  <View style={styles.detailsItem}>
                     <View style={styles.detailsIconLabel}>
                        <Ionicons name="trophy-outline" size={ms(14)} color="#10B981" />
                        <View style={{ marginLeft: wp(8) }}>
                           <Text style={styles.dLabel}>CORRECT ANSWERS</Text>
                           <Text style={styles.dValueGreen}>{certificateData.score.split('/')[0]} correct ({certificateData.percent})</Text>
                        </View>
                     </View>
                  </View>
                  <View style={styles.detailsItem}>
                     <View style={styles.detailsIconLabel}>
                        <Ionicons name="book-outline" size={ms(14)} color="#10B981" />
                        <View style={{ marginLeft: wp(8) }}>
                           <Text style={styles.dLabel}>COURSE TYPE</Text>
                           <Text style={styles.dValue}>Topic</Text>
                        </View>
                     </View>
                  </View>
               </View>
            </View>

            {/* Signatures */}
            <View style={styles.footerSignatures}>
               <View style={styles.sigBlock}>
                  {certificateData.design?.signature_image ? (
                     <Image 
                       source={{ uri: certificateData.design.signature_image }} 
                       style={styles.signatureImage}
                       resizeMode="contain"
                     />
                  ) : (
                     <Text style={styles.sigNameText}>{certificateData.design?.signer_name || 'Dr. John Doe'}</Text>
                  )}
                  <View style={styles.sigLine} />
                  <Text style={styles.sigTitleText}>{certificateData.design?.signer_designation || 'Head of Training'}</Text>
               </View>
               <View style={styles.sigBlock}>
                  <Text style={styles.sigNameText}>{certificateData.date}</Text>
                  <View style={styles.sigLine} />
                  <Text style={styles.sigTitleText}>Date of Issue</Text>
               </View>
            </View>

            <Text style={styles.footerId}>Certificate ID: {certificateData.certId}</Text>
            <Text style={styles.footerDisclaimer}>{certificateData.design?.footer_text || 'This certificate is digitally generated and does not require a physical signature.'}</Text>
            <View style={styles.verifiedRow}>
               <Ionicons name="checkmark-done-circle" size={ms(12)} color="#A0AEC0" />
               <Text style={styles.verifiedText}> Digitally Verified Certificate</Text>
            </View>
          </View>
        </View>

        {/* Social Sharing Section */}
        <View style={styles.socialShareSection}>
           <Text style={styles.shareTitle}>Share Your Achievement</Text>
           <View style={styles.socialButtons}>
              <TouchableOpacity 
                style={[styles.socialBtn, { backgroundColor: '#25D366' }]}
                onPress={() => openSocialLink(certificateData.shareLinks?.whatsapp)}
              >
                <Ionicons name="logo-whatsapp" size={24} color="#fff" />
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.socialBtn, { backgroundColor: '#0077B5' }]}
                onPress={() => openSocialLink(certificateData.shareLinks?.linkedin)}
              >
                <Ionicons name="logo-linkedin" size={24} color="#fff" />
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.socialBtn, { backgroundColor: '#1877F2' }]}
                onPress={() => openSocialLink(certificateData.shareLinks?.facebook)}
              >
                <Ionicons name="logo-facebook" size={24} color="#fff" />
              </TouchableOpacity>
           </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  centerBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    padding: wp(20),
  },
  loadingText: {
    marginTop: hp(10),
    fontSize: fs(14),
    color: AppColors.textSecondary,
    fontWeight: '600',
  },
  errorText: {
    marginTop: hp(10),
    fontSize: fs(14),
    color: 'red',
    textAlign: 'center',
    marginBottom: hp(20),
  },
  retryBtn: {
    backgroundColor: AppColors.primary,
    paddingHorizontal: wp(20),
    paddingVertical: hp(10),
    borderRadius: ms(8),
  },
  retryBtnText: {
    color: '#fff',
    fontWeight: '700',
  },
  header: {
    backgroundColor: '#fff',
    paddingBottom: hp(15),
    paddingHorizontal: wp(16),
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backBtnCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: wp(12),
  },
  shareBtnCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: wp(12),
  },
  headerLeft: {
    flex: 1,
  },
  headerTitle: {
    fontSize: fs(16),
    fontWeight: '800',
    color: '#1E3A8A',
  },
  certIdText: {
    fontSize: fs(11),
    color: AppColors.textSecondary,
    fontWeight: '600',
    marginTop: hp(2),
  },
  topActions: {
    padding: wp(16),
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  mainDownloadBtn: {
    backgroundColor: '#1E3A8A',
    flexDirection: 'row',
    height: hp(50),
    borderRadius: ms(12),
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#1E3A8A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  mainDownloadText: {
    color: '#fff',
    fontSize: fs(14),
    fontWeight: '700',
  },
  scrollContent: {
    padding: wp(12),
    paddingBottom: hp(40),
  },
  certificateOuterFrame: {
    backgroundColor: '#fff',
    padding: wp(4),
    borderWidth: 2,
    borderColor: '#10B981',
    borderRadius: ms(2),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 15,
    elevation: 10,
  },
  certBody: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#10B981',
    padding: wp(16),
    paddingVertical: hp(30),
    alignItems: 'center',
    position: 'relative',
  },
  leafCornerTopLeft: { position: 'absolute', top: 10, left: 10 },
  leafCornerTopRight: { position: 'absolute', top: 10, right: 10 },
  leafCornerBottomLeft: { position: 'absolute', bottom: 10, left: 10 },
  leafCornerBottomRight: { position: 'absolute', bottom: 10, right: 10 },
  
  companyLogo: {
    width: wp(180),
    height: hp(60),
    marginBottom: hp(10),
    resizeMode: 'contain',
  },
  signatureImage: {
    width: wp(120),
    height: hp(50),
    marginBottom: hp(5),
    resizeMode: 'contain',
  },
  sigLine: {
    height: 1,
    width: wp(120),
    backgroundColor: '#E5E7EB',
    marginVertical: hp(8),
  },
  
  brandTitle: {
    fontSize: fs(24),
    fontWeight: '900',
    color: '#064E3B',
    letterSpacing: 1,
  },
  taglineText: {
    fontSize: fs(10),
    color: '#10B981',
    fontWeight: '700',
    marginTop: hp(2),
  },
  starContainer: {
    marginVertical: hp(10),
  },
  headingText: {
    fontSize: fs(18),
    fontWeight: '800',
    color: '#10B981',
    letterSpacing: 1,
    textAlign: 'center',
  },
  achievementRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: hp(2),
  },
  achievementText: {
    fontSize: fs(10),
    fontWeight: '800',
    color: '#10B981',
  },
  awardedTo: {
    fontSize: fs(13),
    color: '#4B5563',
    marginTop: hp(25),
  },
  studentName: {
    fontSize: fs(34),
    fontWeight: '900',
    color: '#064E3B',
    marginTop: hp(8),
    textAlign: 'center',
  },
  nameUnderline: {
    height: 2,
    backgroundColor: '#10B981',
    width: '80%',
    marginTop: hp(4),
  },
  idEmailRow: {
    flexDirection: 'row',
    gap: wp(15),
    marginTop: hp(12),
  },
  idItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  idText: {
    fontSize: fs(11),
    color: '#6B7280',
    fontWeight: '600',
  },
  completionInfo: {
    fontSize: fs(13),
    color: '#4B5563',
    marginTop: hp(35),
    textAlign: 'center',
  },
  topicTitle: {
    fontSize: fs(20),
    fontWeight: '800',
    color: '#064E3B',
    marginTop: hp(8),
    textAlign: 'center',
  },
  programName: {
    fontSize: fs(12),
    fontWeight: '700',
    color: '#10B981',
    marginTop: hp(6),
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginTop: hp(40),
    paddingHorizontal: wp(10),
  },
  statColumn: {
    flex: 1,
    alignItems: 'center',
  },
  statLargeValue: {
    fontSize: fs(24),
    fontWeight: '900',
    color: '#064E3B',
    marginTop: hp(8),
  },
  statLabel: {
    fontSize: fs(9),
    fontWeight: '800',
    color: '#374151',
    marginTop: 2,
  },
  statSub: {
    fontSize: fs(9),
    color: '#9CA3AF',
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: hp(60),
    backgroundColor: '#E5E7EB',
  },
  detailsBox: {
    width: '100%',
    marginTop: hp(40),
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: ms(4),
  },
  detailsHeader: {
    backgroundColor: '#F9FAFB',
    paddingVertical: hp(8),
    paddingHorizontal: wp(12),
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  detailsHeaderText: {
    fontSize: fs(11),
    fontWeight: '800',
    color: '#064E3B',
    letterSpacing: 1,
  },
  detailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: wp(15),
  },
  detailsItem: {
    width: '50%',
    marginBottom: hp(15),
  },
  detailsIconLabel: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dLabel: {
    fontSize: fs(8),
    fontWeight: '700',
    color: '#9CA3AF',
  },
  dValue: {
    fontSize: fs(11),
    fontWeight: '700',
    color: '#374151',
  },
  dValueGreen: {
    fontSize: fs(11),
    fontWeight: '800',
    color: '#10B981',
  },
  footerSignatures: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: hp(50),
    paddingHorizontal: wp(20),
  },
  sigBlock: {
    alignItems: 'center',
  },
  sigNameText: {
    fontSize: fs(13),
    fontWeight: '800',
    color: '#111827',
  },
  sigTitleText: {
    fontSize: fs(10),
    color: '#6B7280',
    marginTop: hp(2),
  },
  footerId: {
    fontSize: fs(10),
    color: '#10B981',
    fontWeight: '700',
    marginTop: hp(40),
  },
  footerDisclaimer: {
    fontSize: fs(9),
    color: '#9CA3AF',
    marginTop: hp(6),
    textAlign: 'center',
    paddingHorizontal: wp(20),
  },
  verifiedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: hp(8),
  },
  verifiedText: {
    fontSize: fs(9),
    color: '#A0AEC0',
    fontWeight: '600',
  },
  socialShareSection: {
    marginTop: hp(30),
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: wp(20),
    borderRadius: ms(16),
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  shareTitle: {
    fontSize: fs(14),
    fontWeight: '800',
    color: '#064E3B',
    marginBottom: hp(15),
  },
  socialButtons: {
    flexDirection: 'row',
    gap: wp(15),
  },
  socialBtn: {
    width: ms(50),
    height: ms(50),
    borderRadius: ms(25),
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
});

import React from 'react';
import { useWindowDimensions } from 'react-native';
import RenderHTML from 'react-native-render-html';
import { wp, fs, ms } from '../utils/responsive';

const HtmlContent = ({ html, baseStyle, tagsStyles, containerWidth }) => {
  const { width } = useWindowDimensions();
  
  if (!html) return null;

  return (
    <RenderHTML
      contentWidth={containerWidth || width - wp(40)}
      source={{ html }}
      baseStyle={{
        fontSize: fs(15),
        color: '#1E293B',
        lineHeight: fs(22),
        ...baseStyle,
      }}
      tagsStyles={{
        p: { 
          marginBottom: ms(16), 
          color: '#1E293B',
          lineHeight: fs(24),
        },
        strong: { fontWeight: 'bold', color: '#0F172A' },
        em: { fontStyle: 'italic' },
        li: { marginBottom: ms(8), color: '#1E293B' },
        ul: { marginBottom: ms(16), paddingLeft: ms(20) },
        ol: { marginBottom: ms(16), paddingLeft: ms(20) },
        h1: { fontSize: fs(22), fontWeight: '700', color: '#0F172A', marginTop: ms(24), marginBottom: ms(16), lineHeight: fs(28) },
        h2: { fontSize: fs(20), fontWeight: '700', color: '#0F172A', marginTop: ms(24), marginBottom: ms(16), lineHeight: fs(26) },
        h3: { fontSize: fs(18), fontWeight: '700', color: '#0F172A', marginTop: ms(20), marginBottom: ms(12) },
        a: { color: '#2563EB', textDecorationLine: 'underline' },
        img: { borderRadius: ms(8), marginVertical: ms(10), maxWidth: '100%' },
        hr: { height: 1, backgroundColor: '#D1D5DB', marginVertical: ms(24) },
        // TABLE STYLING
        table: {
          width: '100%',
          borderWidth: 1,
          borderColor: '#D1D5DB',
          marginVertical: ms(20),
        },
        tr: {
          flexDirection: 'row',
          borderBottomWidth: 1,
          borderBottomColor: '#D1D5DB',
        },
        th: {
          flex: 1,
          padding: ms(12),
          backgroundColor: '#F3F4F6',
          fontWeight: '600',
          borderRightWidth: 1,
          borderRightColor: '#D1D5DB',
          justifyContent: 'center',
        },
        td: {
          flex: 1,
          padding: ms(12),
          borderRightWidth: 1,
          borderRightColor: '#D1D5DB',
          justifyContent: 'center',
        },
        ...tagsStyles,
      }}
    />
  );
};

export default HtmlContent;

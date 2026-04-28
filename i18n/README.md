# Multi-Language Support (i18n)

This project uses `i18next` and `react-i18next` for internationalization.

## How to add a new language

1.  **Create a translation file**: 
    Create a new JSON file in `i18n/locales/`. For example, `fr.json` for French.
    Copy the structure from `en.json`.

2.  **Register the new language**:
    Open `i18n/index.js` and import your new file:
    ```javascript
    import fr from './locales/fr.json';
    ```
    Add it to the `resources` object:
    ```javascript
    const resources = {
      en: { translation: en },
      hi: { translation: hi },
      pa: { translation: pa },
      fr: { translation: fr }, // Add this
    };
    ```

3.  **Update the UI**:
    To show the new language in the selection modal (e.g., in `app/(auth)/login.js`), add it to the `LANGUAGES` array:
    ```javascript
    const LANGUAGES = [
      { code: 'en', label: 'English', nativeLabel: 'English' },
      { code: 'hi', label: 'Hindi', nativeLabel: 'हिंदी' },
      { code: 'pa', label: 'Punjabi', nativeLabel: 'ਪੰਜਾਬੀ' },
      { code: 'fr', label: 'French', nativeLabel: 'Français' }, // Add this
    ];
    ```

## Usage in components

```javascript
import { useTranslation } from 'react-i18next';

const { t } = useTranslation();

// In JSX
<Text>{t('common.welcome')}</Text>
```

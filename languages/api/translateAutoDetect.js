// translateAutoDetect.js
import { TranslationServiceClient } from '@google-cloud/translate';

const client = new TranslationServiceClient({
  keyFilename: "../../../../projects/powerlineapp/languages/api/powerline.json",
});

const projectId = process.env.projectId
const location = 'global';

const translateAutoDetect = async (text, targetLang) => {
  const request = {
    parent: `projects/${projectId}/locations/${location}`,
    contents: [text],
    mimeType: 'text/plain',
    targetLanguageCode: targetLang,
  };

  const [response] = await client.translateText(request);
  const translatedText = response.translations[0].translatedText;
  const detectedLang = response.translations[0].detectedLanguageCode;

  return { translatedText, detectedLang };
};

export default translateAutoDetect;

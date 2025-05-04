// translateAutoDetect.js
import { TranslationServiceClient } from '@google-cloud/translate';
import { googleCredentials } from './powerline.js';

// const client = new TranslationServiceClient({
//   keyFilename: "../../../../projects/powerlineapp/languages/api/powerline.json",
// });
const client = new TranslationServiceClient({
  credentials: googleCredentials,
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

// import { TranslationServiceClient } from '@google-cloud/translate';

// let client;

// if (process.env.GOOGLE_TRANSLATE_CREDENTIALS) {
//   const keyJson = Buffer.from(process.env.GOOGLE_TRANSLATE_CREDENTIALS, 'base64').toString('utf8');
//   client = new TranslationServiceClient({
//     credentials: JSON.parse(keyJson),
//   });
// } else {
//   // Fallback for local development
//   client = new TranslationServiceClient({
//     keyFilename: './languages/api/powerline.json', // Adjust path if needed
//   });
// }

// const location = 'global';

// const translateAutoDetect = async (text, targetLang) => {
//   const request = {
//     parent: `projects/${process.env.GOOGLE_PROJECT_ID}/locations/${location}`,
//     contents: [text],
//     mimeType: 'text/plain',
//     targetLanguageCode: targetLang,
//   };

//   const [response] = await client.translateText(request);
//   const translatedText = response.translations[0].translatedText;
//   const detectedLang = response.translations[0].detectedLanguageCode;

//   return { translatedText, detectedLang };
// };

// export default translateAutoDetect;

// translateAutoDetect.js
import { TranslationServiceClient } from "@google-cloud/translate";
import { googleCredentials } from "./powerline.js"; // Correct the path if necessary

const client = new TranslationServiceClient({
  credentials: googleCredentials,
});
const projectId = process.env.GOOGLE_PROJECT_ID; // Use environment variable for project ID
const location = "global";

const translateAutoDetect = async (text, targetLang) => {
  const request = {
    parent: `projects/${projectId}/locations/${location}`,
    contents: [text],
    mimeType: "text/plain",
    targetLanguageCode: targetLang,
  };

  try {
    const [response] = await client.translateText(request);
    const translatedText = response.translations[0].translatedText;
    const detectedLang = response.translations[0].detectedLanguageCode;
    return { translatedText, detectedLang };
  } catch (error) {
    console.error("Translation failed:", error);
    throw error; // Rethrow the error to handle it properly elsewhere
  }
};

export default translateAutoDetect;

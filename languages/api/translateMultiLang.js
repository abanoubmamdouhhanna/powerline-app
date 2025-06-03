import translateAutoDetect from "./translateAutoDetect.js";

const LANGUAGES = ["ar", "en", "bn"];

export const translateMultiLang = async (text) => {
  const { translatedText: originalText, detectedLang } = await translateAutoDetect(text, "en");

  const translations = await Promise.all(
    LANGUAGES.map((lang) =>
      lang === detectedLang
        ? Promise.resolve({ lang, text })
        : translateAutoDetect(text, lang).then((res) => ({
            lang,
            text: res.translatedText,
          }))
    )
  );

  return Object.fromEntries(translations.map(({ lang, text }) => [lang, text]));
};


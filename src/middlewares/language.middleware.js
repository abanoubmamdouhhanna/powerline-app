import { resTranslations } from "../../languages/responsTransaltion.js";

export const languageMiddleware = (req, res, next) => {
  req.language = req.headers["language"]?.toLowerCase() || "en";
  next();
};

export const getTranslation = (key, lang = "en") => {
  return resTranslations[key]?.[lang] || resTranslations[key]?.["en"] || key;
};

export const selectFunction = (req, selectEn, selectAr) => {
  return req.language === "en" ? selectEn : selectAr;
};

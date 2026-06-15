(function (root) {
  const VI_DIACRITICS =
    /[àáảãạâấầẩẫậăắằẳẵặèéẻẽẹêếềểễệìíỉĩịòóỏõọôốồổỗộơớờởỡợùúủũụưứừửữựỳýỷỹỵđÀÁẢÃẠÂẤẦẨẪẬĂẮẰẲẴẶÈÉẺẼẸÊẾỀỂỄỆÌÍỈĨỊÒÓỎÕỌÔỐỒỔỖỘƠỚỜỞỠỢÙÚỦŨỤƯỨỪỬỮỰỲÝỶỸỴĐ]/;

  function isLikelyVietnamese(text) {
    return !!text && text.length >= 2 && VI_DIACRITICS.test(text);
  }

  function normalizeLang(code) {
    if (!code) return "";
    return String(code).toLowerCase().split("-")[0];
  }

  function matchesSelected(detected, selected) {
    if (!detected || !Array.isArray(selected)) return false;
    const base = normalizeLang(detected);
    return selected.some((s) => normalizeLang(s) === base);
  }

  // Whether to send a message to Google at all, given what we can determine
  // client-side (only Vietnamese is detectable locally, via diacritics).
  function shouldRequest(isViLikely, sources, target) {
    if (!Array.isArray(sources) || sources.length === 0) return false;
    const sourcesN = sources.map(normalizeLang);
    const targetN = normalizeLang(target);
    const viIsSource = sourcesN.includes("vi");
    const hasNonViSource = sourcesN.some((s) => s !== "vi");
    if (isViLikely) return viIsSource && targetN !== "vi";
    return hasNonViSource;
  }

  // Whether a translated message should actually be injected: its detected
  // language must be a selected source and must not already be the target.
  function shouldTranslate(detected, sources, target) {
    return matchesSelected(detected, sources) && normalizeLang(detected) !== normalizeLang(target);
  }

  function targetLabel(target) {
    return normalizeLang(target).toUpperCase();
  }

  const DEFAULT_SOURCE_LANGS = ["vi"];
  const DEFAULT_TARGET_LANG = "en";

  const api = {
    isLikelyVietnamese,
    normalizeLang,
    matchesSelected,
    shouldRequest,
    shouldTranslate,
    targetLabel,
    DEFAULT_SOURCE_LANGS,
    DEFAULT_TARGET_LANG,
  };
  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  } else {
    root.ZTLang = api;
  }
})(typeof self !== "undefined" ? self : this);

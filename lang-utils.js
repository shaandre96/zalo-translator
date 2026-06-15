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

  const DEFAULT_SOURCE_LANGS = ["en", "zh-CN", "ko", "ja", "th"];

  const api = { isLikelyVietnamese, normalizeLang, matchesSelected, DEFAULT_SOURCE_LANGS };
  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  } else {
    root.ZTLang = api;
  }
})(typeof self !== "undefined" ? self : this);

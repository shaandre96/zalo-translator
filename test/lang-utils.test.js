const { test } = require("node:test");
const assert = require("node:assert/strict");
const {
  isLikelyVietnamese,
  normalizeLang,
  matchesSelected,
  shouldRequest,
  shouldTranslate,
  targetLabel,
  DEFAULT_SOURCE_LANGS,
  DEFAULT_TARGET_LANG,
} = require("../lang-utils.js");

test("isLikelyVietnamese: detects Vietnamese diacritics", () => {
  assert.equal(isLikelyVietnamese("Chào bạn"), true);
  assert.equal(isLikelyVietnamese("Cảm ơn nhiều"), true);
});

test("isLikelyVietnamese: false for non-Vietnamese / empty / 1-char", () => {
  assert.equal(isLikelyVietnamese("Hello there"), false);
  assert.equal(isLikelyVietnamese("안녕하세요"), false);
  assert.equal(isLikelyVietnamese(""), false);
  assert.equal(isLikelyVietnamese("a"), false);
  assert.equal(isLikelyVietnamese(null), false);
});

test("normalizeLang: lowercases and strips region", () => {
  assert.equal(normalizeLang("zh-CN"), "zh");
  assert.equal(normalizeLang("zh-TW"), "zh");
  assert.equal(normalizeLang("EN"), "en");
  assert.equal(normalizeLang("en-US"), "en");
  assert.equal(normalizeLang(""), "");
  assert.equal(normalizeLang(null), "");
});

test("matchesSelected: base-code matching incl. Chinese variants", () => {
  const selected = ["en", "zh-CN", "ko", "ja", "th"];
  assert.equal(matchesSelected("en", selected), true);
  assert.equal(matchesSelected("zh", selected), true); // Google returns bare "zh"
  assert.equal(matchesSelected("zh-TW", selected), true);
  assert.equal(matchesSelected("ko", selected), true);
  assert.equal(matchesSelected("de", selected), false);
  assert.equal(matchesSelected("vi", selected), false);
});

test("matchesSelected: defensive against bad input", () => {
  assert.equal(matchesSelected("", ["en"]), false);
  assert.equal(matchesSelected("en", null), false);
  assert.equal(matchesSelected("en", []), false);
});

test("shouldRequest: Vietnamese-looking text", () => {
  // VI source selected, target not VI -> send (VI -> target)
  assert.equal(shouldRequest(true, ["vi"], "en"), true);
  assert.equal(shouldRequest(true, ["vi", "en"], "en"), true);
  // VI not a source -> don't send
  assert.equal(shouldRequest(true, ["en", "zh-CN"], "vi"), false);
  // target IS Vietnamese -> pointless to translate VI -> VI
  assert.equal(shouldRequest(true, ["vi"], "vi"), false);
});

test("shouldRequest: non-Vietnamese text", () => {
  // at least one non-VI source -> send
  assert.equal(shouldRequest(false, ["en", "zh-CN"], "vi"), true);
  assert.equal(shouldRequest(false, ["en"], "vi"), true);
  // only VI source, text isn't Vietnamese -> never matches, don't send
  assert.equal(shouldRequest(false, ["vi"], "en"), false);
});

test("shouldRequest: empty / invalid sources", () => {
  assert.equal(shouldRequest(true, [], "en"), false);
  assert.equal(shouldRequest(false, [], "vi"), false);
  assert.equal(shouldRequest(true, null, "en"), false);
});

test("shouldTranslate: in-source and not the target", () => {
  assert.equal(shouldTranslate("vi", ["vi"], "en"), true);
  assert.equal(shouldTranslate("en", ["en", "zh-CN"], "vi"), true);
  assert.equal(shouldTranslate("zh", ["zh-CN"], "vi"), true); // bare zh matches zh-CN
  // detected not in sources
  assert.equal(shouldTranslate("de", ["vi"], "en"), false);
  // detected already equals target -> skip same-language
  assert.equal(shouldTranslate("en", ["en"], "en"), false);
  assert.equal(shouldTranslate("zh-TW", ["zh-CN"], "zh-CN"), false);
});

test("targetLabel: uppercased base code", () => {
  assert.equal(targetLabel("en"), "EN");
  assert.equal(targetLabel("vi"), "VI");
  assert.equal(targetLabel("zh-CN"), "ZH");
  assert.equal(targetLabel("ja"), "JA");
});

test("defaults: Vietnamese -> English out of the box", () => {
  assert.deepEqual(DEFAULT_SOURCE_LANGS, ["vi"]);
  assert.equal(DEFAULT_TARGET_LANG, "en");
});

const { test } = require("node:test");
const assert = require("node:assert/strict");
const { isLikelyVietnamese, normalizeLang, matchesSelected, DEFAULT_SOURCE_LANGS } =
  require("../lang-utils.js");

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

test("DEFAULT_SOURCE_LANGS: the curated five", () => {
  assert.deepEqual(DEFAULT_SOURCE_LANGS, ["en", "zh-CN", "ko", "ja", "th"]);
});

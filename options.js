const langsEl = document.getElementById("langs");
const statusEl = document.getElementById("status");
const boxes = () => Array.from(langsEl.querySelectorAll('input[type="checkbox"]'));

chrome.storage.sync.get(["sourceLangs"]).then(({ sourceLangs }) => {
  const selected = Array.isArray(sourceLangs) ? sourceLangs : ZTLang.DEFAULT_SOURCE_LANGS;
  boxes().forEach((cb) => {
    cb.checked = selected.includes(cb.value);
  });
});

document.getElementById("save").addEventListener("click", async () => {
  const sourceLangs = boxes()
    .filter((cb) => cb.checked)
    .map((cb) => cb.value);
  await chrome.storage.sync.set({ sourceLangs });
  statusEl.textContent = "Saved.";
  setTimeout(() => (statusEl.textContent = ""), 2000);
});

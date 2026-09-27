/* Flashcard progress: server when logged in, otherwise this browser (same Leitner rules as server/routes/vocab.js) */
window.PorchiVocab = (function () {
  const A = window.PorchiAPI, { store } = window.Porchi, INTERVALS = [0, 1, 3, 7, 16, 35];
  const today = () => new Date().toISOString().slice(0, 10);
  let user = null, progress = {}, custom = [];
  async function load() {
    user = A.online ? await A.me() : null;
    if (user) ({ progress, custom } = await A.get("/me/vocab"));
    else { progress = store.get("vocab-progress", {}); custom = store.get("vocab-custom", []); }
    return { user, progress, custom };
  }
  async function review(wordId, result) {
    if (user) { progress[wordId] = (await A.post("/me/vocab/review", { wordId, result })).state; return; }
    const cur = progress[wordId] || { box: 0, reviews: 0 };
    const box = result === "again" ? 1 : result === "easy" ? Math.min(5, cur.box + 2) : Math.min(5, cur.box + 1);
    progress[wordId] = { box, due: new Date(Date.now() + INTERVALS[box] * 864e5).toISOString().slice(0, 10), reviews: cur.reviews + 1 };
    store.set("vocab-progress", progress);
  }
  async function addCustom(w) {
    if (user) { custom.push((await A.post("/me/vocab/custom", w)).word); return; }
    custom.push({ id: "c" + Date.now(), ...w }); store.set("vocab-custom", custom);
  }
  async function removeCustom(id) {
    if (user) await A.del("/me/vocab/custom/" + id); else { store.set("vocab-custom", custom.filter(c => c.id !== id)); }
    custom = custom.filter(c => c.id !== id); delete progress[id];
  }
  const all = () => [...window.PORCHI_VOCAB, ...custom.map(c => ({ ...c, topic: "My words", pos: "", ipa: "", collocations: [], syn: [], ant: [], custom: true }))];
  const due = () => all().filter(w => !progress[w.id] || progress[w.id].due <= today());
  return { load, review, addCustom, removeCustom, all, due, progress: () => progress, activity: kind => user && A.post("/me/activity", { kind }).catch(() => {}) };
})();

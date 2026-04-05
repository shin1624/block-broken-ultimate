import EventBus from "../core/EventBus.js";

/**
 * HighScoreSystem - localStorage永続化、Top10管理、名前入力(3文字)
 */
const STORAGE_KEY = "block_broken_ultimate_highscores";
const MAX_ENTRIES = 10;
const NAME_LENGTH = 3;

class HighScoreSystem {
  constructor() {
    this.scores = this.load();

    EventBus.on("submit_highscore", (data) => {
      this.addScore(data.name, data.score, data.level);
    });
  }

  /**
   * ローカルストレージからスコアを読み込み
   * @returns {Array<{name: string, score: number, level: number, date: string}>}
   */
  load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];
      return parsed.slice(0, MAX_ENTRIES);
    } catch (e) {
      console.warn("[HighScoreSystem] Failed to load scores:", e);
      return [];
    }
  }

  /**
   * ローカルストレージにスコアを保存
   */
  save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.scores));
    } catch (e) {
      console.warn("[HighScoreSystem] Failed to save scores:", e);
    }
  }

  /**
   * スコアを追加
   * @param {string} name - 3文字の名前
   * @param {number} score - スコア
   * @param {number} level - 到達レベル
   * @returns {number} ランキング順位 (1始まり, -1 = ランク外)
   */
  addScore(name, score, level) {
    const sanitizedName = name
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, "")
      .substring(0, NAME_LENGTH)
      .padEnd(NAME_LENGTH, "_");

    const entry = {
      name: sanitizedName,
      score,
      level,
      date: new Date().toISOString().split("T")[0],
    };

    this.scores.push(entry);
    this.scores.sort((a, b) => b.score - a.score);

    if (this.scores.length > MAX_ENTRIES) {
      this.scores = this.scores.slice(0, MAX_ENTRIES);
    }

    this.save();

    const rank = this.scores.findIndex(
      (s) =>
        s.name === entry.name &&
        s.score === entry.score &&
        s.date === entry.date,
    );

    const finalRank = rank !== -1 ? rank + 1 : -1;

    EventBus.emit("highscore_updated", {
      rank: finalRank,
      scores: this.getScores(),
    });

    return finalRank;
  }

  /**
   * スコアがランクインするか判定
   * @param {number} score
   * @returns {boolean}
   */
  isHighScore(score) {
    if (this.scores.length < MAX_ENTRIES) return true;
    return score > this.scores[this.scores.length - 1].score;
  }

  /**
   * Top10スコアを取得
   * @returns {Array<{name: string, score: number, level: number, date: string}>}
   */
  getScores() {
    return [...this.scores];
  }

  /**
   * 1位のスコアを取得
   * @returns {number}
   */
  getTopScore() {
    return this.scores.length > 0 ? this.scores[0].score : 0;
  }

  /**
   * スコアをクリア
   */
  clearScores() {
    this.scores = [];
    this.save();
    EventBus.emit("highscore_updated", { rank: -1, scores: [] });
  }

  /**
   * 毎フレーム更新（このシステムでは不要だが統一インターフェース用）
   * @param {number} dt
   */
  update(dt) {
    // no-op
  }
}

export { NAME_LENGTH };
export default HighScoreSystem;

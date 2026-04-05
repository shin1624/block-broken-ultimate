/**
 * EventBus - 疎結合なイベント通信システム
 * 全システム間通信の中核。シングルトンインスタンスを export default する。
 */
class EventBus {
  constructor() {
    this.listeners = new Map();
    this.debug = false;
  }

  /**
   * イベントリスナーを登録
   * @param {string} eventType - イベントタイプ
   * @param {Function} callback - コールバック関数
   * @param {Object} context - thisコンテキスト（省略可）
   */
  on(eventType, callback, context = null) {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, []);
    }

    this.listeners.get(eventType).push({ callback, context });

    if (this.debug) {
      console.log(`[EventBus] Registered: ${eventType}`);
    }
  }

  /**
   * イベントリスナーを削除
   * @param {string} eventType - イベントタイプ
   * @param {Function} callback - 削除するコールバック
   */
  off(eventType, callback) {
    if (!this.listeners.has(eventType)) return;

    const list = this.listeners.get(eventType);
    const index = list.findIndex((entry) => entry.callback === callback);

    if (index !== -1) {
      list.splice(index, 1);
      if (this.debug) {
        console.log(`[EventBus] Removed: ${eventType}`);
      }
    }
  }

  /**
   * イベントを発火
   * @param {string} eventType - イベントタイプ
   * @param {*} data - イベントデータ
   */
  emit(eventType, data = null) {
    if (!this.listeners.has(eventType)) return;

    if (this.debug) {
      console.log(`[EventBus] Emit: ${eventType}`, data);
    }

    const list = this.listeners.get(eventType);
    list.forEach(({ callback, context }) => {
      try {
        if (context) {
          callback.call(context, data);
        } else {
          callback(data);
        }
      } catch (error) {
        console.error(`[EventBus] Error in listener for ${eventType}:`, error);
      }
    });
  }

  /**
   * 全リスナーをクリア
   */
  clear() {
    this.listeners.clear();
    if (this.debug) {
      console.log("[EventBus] All listeners cleared");
    }
  }

  /**
   * デバッグモードの切り替え
   * @param {boolean} enabled
   */
  setDebug(enabled) {
    this.debug = enabled;
  }

  /**
   * 登録されているイベントタイプ一覧
   * @returns {string[]}
   */
  getEventTypes() {
    return Array.from(this.listeners.keys());
  }
}

// シングルトンインスタンスを export
export default new EventBus();

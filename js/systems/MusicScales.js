/**
 * MusicScales.js - 音階・和音進行・リズムパターン定義
 * MusicSystem / MusicSequencer が参照する音楽理論データ
 */

/** スケール定義（半音オフセット配列） */
export const SCALES = {
  major: [0, 2, 4, 5, 7, 9, 11],
  minor: [0, 2, 3, 5, 7, 8, 10],
  pentatonic: [0, 2, 4, 7, 9],
  blues: [0, 3, 5, 6, 7, 10],
  dorian: [0, 2, 3, 5, 7, 9, 10],
};

/** 和音進行（4小節ループ、スケール度数の3音） */
export const CHORD_PROGRESSIONS = {
  peaceful: [
    [0, 2, 4],
    [5, 0, 2],
    [3, 5, 0],
    [4, 6, 1],
  ],
  action: [
    [0, 2, 4],
    [6, 1, 3],
    [4, 6, 1],
    [5, 0, 2],
  ],
  intense: [
    [0, 2, 4],
    [1, 3, 5],
    [6, 1, 3],
    [0, 2, 4],
  ],
  victory: [
    [0, 2, 4],
    [3, 5, 0],
    [4, 6, 1],
    [0, 2, 4],
  ],
  defeat: [
    [0, 2, 4],
    [6, 1, 3],
    [2, 4, 6],
    [5, 0, 2],
  ],
};

/** リズムパターン（8ステップ、0=無音 / 0-1=ベロシティ） */
export const RHYTHM_PATTERNS = {
  basic: [1, 0, 0.5, 0, 1, 0, 0.5, 0],
  driving: [1, 0, 1, 0, 1, 0, 1, 0],
  complex: [1, 0, 0.3, 0.7, 0, 0.5, 0, 0.8],
  breakdown: [1, 0, 0, 0, 0.5, 0, 0, 0],
};

/** レイヤー別デフォルト設定 */
export const LAYER_DEFAULTS = {
  bass: { waveType: "sine", octave: 2, volume: 0.6 },
  melody: { waveType: "triangle", octave: 4, volume: 0.4 },
  harmony: { waveType: "sawtooth", octave: 3, volume: 0.3 },
  percussion: { volume: 0.5, pattern: "basic" },
  ambient: { waveType: "sine", volume: 0.2 },
};

/** Progression -> Scale / Tempo 範囲マッピング */
export const PROGRESSION_CONFIG = {
  peaceful: { scale: "major", tempoRange: [100, 110], rhythmPattern: "basic" },
  action: { scale: "minor", tempoRange: [120, 140], rhythmPattern: "driving" },
  intense: {
    scale: "dorian",
    tempoRange: [140, 160],
    rhythmPattern: "complex",
  },
  victory: {
    scale: "pentatonic",
    tempoRange: [120, 130],
    rhythmPattern: "basic",
  },
  defeat: {
    scale: "blues",
    tempoRange: [100, 110],
    rhythmPattern: "breakdown",
  },
};

/** ノート名 -> 半音オフセット */
const NOTE_MAP = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };

/**
 * ノート名とオクターブから周波数を計算
 * @param {string} note - ノート名 (C-B)
 * @param {number} octave - オクターブ番号
 * @returns {number} 周波数 (Hz)
 */
export function noteFrequency(note, octave) {
  const semitone = NOTE_MAP[note] || 0;
  return 440 * Math.pow(2, (semitone - 9 + (octave - 4) * 12) / 12);
}

/**
 * スケール度数から周波数を計算
 * @param {number} degree - スケール度数 (0-based)
 * @param {string} scaleName - スケール名
 * @param {number} octave - 基本オクターブ
 * @param {string} rootNote - ルートノート名
 * @returns {number} 周波数 (Hz)
 */
export function degreeToFrequency(degree, scaleName, octave, rootNote = "C") {
  const scale = SCALES[scaleName] || SCALES.major;
  const root = noteFrequency(rootNote, octave);
  const wrappedDegree = ((degree % scale.length) + scale.length) % scale.length;
  const octaveShift = Math.floor(degree / scale.length);
  const semitones = scale[wrappedDegree] + octaveShift * 12;
  return root * Math.pow(2, semitones / 12);
}

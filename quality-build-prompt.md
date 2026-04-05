# Block Broken Ultimate — Quality Build Prompt

## これは何か
`/quality-build` に渡すワンプロンプト。マルチエージェントパイプラインで最高品質のブロック崩しを生成する。

---

## プロンプト

```
最高品質のブロック崩しゲーム「Block Broken Ultimate」を作ってください。

## 技術スタック
- Vanilla JavaScript (ES6+ Modules)
- HTML5 Canvas API（直接描画）
- Web Audio API（プロシージャル音楽・効果音生成、外部ファイル不要）
- ビルドツール不要（index.html + JSモジュール構成）
- ローカルサーバー（python3 -m http.server 8080）で動作

## アーキテクチャ
- Entity-Component-System風の設計
- EventBusによるシステム間の疎結合通信
- GameLoop → 各System.update() → RenderSystem.draw() のメインループ
- ファイル構成:
  ```
  index.html
  js/
    core/        — EventBus, GameLoop, GameStateManager
    entities/    — Ball, Paddle, Block, PowerUp, Particle
    systems/     — Collision, Render, Input, Audio, Music, Particle, PowerUp, Combo, HighScore, Touch, ScreenEffects, Transition, Level
    ui/          — Menu, HUD, Pause, GameOver, LevelComplete
    config/      — constants.js（全定数一元管理）
    main.js      — エントリーポイント
  ```

## コアゲームプレイ
- 滑らかなパドル操作（キーボード矢印/WASD + マウス + タッチ対応）
- 物理ベースのボール反射（パドル当たり位置で反射角が変わる）
- 段階的難易度上昇（レベルが進むとボール速度・ブロック配置が変化）
- ライフシステム（初期3、最大5）

## ブロックタイプ（5種）
1. Normal — 1ヒットで破壊、色はレベルに応じて変化
2. Hard — 2ヒットで破壊、ヒビが入る視覚エフェクト
3. Unbreakable — 破壊不可、メタリックな外観
4. PowerUp — 破壊時にパワーアップドロップ、光るエフェクト
5. Explosive — 破壊時に周囲のブロックも巻き込む、赤く脈動

## パワーアップ（7種）
1. Multi Ball — ボールが3つに分裂
2. Wide Paddle — パドル幅1.5倍（15秒）
3. Sticky Paddle — ボールがパドルに付く、クリックで発射
4. Laser — パドルからレーザー発射可能（10秒）
5. Slow Ball — ボール速度50%（10秒）
6. Extra Life — ライフ+1
7. Shield — 画面下部に一度だけボールを跳ね返すシールド

## 動的音楽システム（最重要）
Web Audio APIのみでプロシージャル音楽を生成する。外部音声ファイルは一切使わない。

### 音楽要素（5レイヤー同時再生）
- **Bass**: sine波、オクターブ2、ルートノート中心
- **Melody**: triangle波、オクターブ4、スケール上のフレーズ自動生成
- **Harmony**: sawtooth波（低音量）、オクターブ3、和音
- **Percussion**: ノイズ生成によるキック・ハイハット・スネア
- **Ambient**: sine波のドローン、緊張感の演出

### 動的変化パラメータ
- `tempo`: 100-160 BPM（状況で変化）
- `intensity`: 0-1（コンボ・残ブロック数で上昇）
- `tension`: 0-1（ボールロスト時に上昇、ブロック破壊で微増）
- `progression`: peaceful → action → intense → victory → defeat

### 音楽変化トリガー
- ゲーム開始: peaceful（テンポ100、major scale）
- ブロック50%破壊: action（テンポ上昇、レイヤー追加）
- ブロック残り20%: intense（テンポ最大、minor scale、全レイヤー最大）
- レベルクリア: victory（メジャーコード進行のファンファーレ）
- ゲームオーバー: defeat（テンポ減速、フェードアウト）
- コンボ中: intensity上昇、パーカッション複雑化

### スケール・コード進行
- スケール: major, minor, pentatonic, blues, dorian
- 和音進行はゲーム状態ごとに定義（4小節ループ）

## コンボシステム
- 連続ブロック破壊でコンボカウンター増加
- コンボ倍率表示（×2, ×3...のフローティングテキスト）
- 3秒間破壊なしでコンボリセット
- コンボに応じてスコア倍率・音楽intensity上昇

## ビジュアルエフェクト
- ブロック破壊時のパーティクル爆発（ブロックの色に合わせた破片）
- コンボ時の画面フラッシュ
- パワーアップ取得時のグロウエフェクト
- ボール軌跡のトレイル
- レベルクリア時の花火エフェクト
- パドルのグラデーション描画

## UI/UX
- タイトル画面: ゲーム名 + Start / High Scores ボタン
- HUD: スコア、レベル、ライフ、コンボ表示
- ポーズ画面: ESCキーでトグル
- ゲームオーバー画面: スコア表示 + リトライ
- レベルクリア画面: スコア・ボーナス表示 + Next Level
- レスポンシブ: Canvas サイズを画面に合わせて自動調整

## ハイスコア
- localStorageで永続化
- Top 10表示
- 名前入力（3文字）

## パフォーマンス要件
- 60fps安定動作
- オブジェクトプール（パーティクル・ボール）で GC 負荷軽減
- requestAnimationFrame + delta time ベースの更新

## レベルデザイン（最低10レベル）
- 各レベルで独自のブロック配置パターン
- レベル1: 入門（Normal のみ、少なめ）
- レベル3: Hard ブロック登場
- レベル5: Unbreakable でパズル要素
- レベル7: Explosive で連鎖破壊の快感
- レベル10: 全ブロックタイプ混在の最終ステージ

## 品質基準
- ゼロ外部依存（npm不要、CDN不要）
- 全システムがEventBus経由で通信（直接参照禁止）
- ファイルは1つ300行以内（大きくなったら分割）
- 動作確認: ゲーム開始→プレイ→レベルクリア→ゲームオーバーの一連のフローが動く
```

---

## 使い方
1. 新しいディレクトリで `/quality-build` を実行
2. 上記プロンプトをそのまま貼り付け
3. マルチエージェントが設計→実装→レビュー→修正を自動実行

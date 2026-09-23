# PTA Shorts 自動生成 v2

PTA適正化推進委員会の確認済み本文をもとに、1080×1920 の YouTube Shorts 用動画を無料構成で生成します。

## v2 の考え方

旧版の「静止背景＋字幕」から、Remotion ベースのモーショングラフィックへ移行しました。

現在のテンプレートには次の6種類のシーンがあります。

- hook: 冒頭フック。大見出し、校舎イラスト、疑問・否定表示
- split: 学校とPTAなど、2概念の比較
- flow: 保護者 → 加入意思 → PTA会員などの流れ
- risk: 見直すべき運用を警告カードで表示
- evidence: ptaorg.com や一次資料の根拠表示
- conclusion: 結論、要点3点、サイトへのCTA

すべての重要要素は縦動画の端から離し、YouTube Shorts のUIと重なりにくい位置へ固定しています。

## 無料構成

- 動画レンダリング: Remotion
- 音声: VOICEVOX ENGINE
- フォールバック音声: gTTS
- 実行: GitHub Actions
- 最終合成: Remotion / ffmpeg

外部の有料動画生成APIは必要ありません。

## GitHub Actions

Actions の「Generate PTA Shorts」から実行します。

- topic_id: 空欄で全件、membership-001 で1本だけ
- voice_provider: voicevox / gtts / auto

通常は voicevox を使います。

生成Artifactには以下が入ります。

- MP4
- JSONメタデータ
- 動画内5地点のJPEGプレビュー

## 台本データ

shorts/topics.json の各動画は scenes 配列で構成します。

音声長を実測し、各シーンの表示時間を自動的に決めます。VOICEVOXの音声と画面切替が同じタイムラインを使うため、手作業で字幕時刻を打つ必要はありません。

## ローカル実行

必要なもの:

- Python 3.11+
- Node.js 20+
- ffmpeg / ffprobe
- Noto Sans CJK
- VOICEVOX ENGINE（推奨）

実行例:

    cd shorts/remotion
    npm install
    cd ../..
    pip install -r shorts/requirements.txt
    python shorts/generate.py --topic membership-001 --voice-provider voicevox

VOICEVOX ENGINE は http://127.0.0.1:50021 を既定値にしています。別URLの場合は VOICEVOX_URL を設定してください。

## 品質方針

- 法令名、自治体名、数字などを映像テンプレート側で創作しない
- 出典URLを動画データに残す
- CTAより根拠表示を優先する
- 1画面1メッセージを基本とする
- 写真がなくても成立するよう、校舎・人物・書類等をベクター図解する
- 今後、一次資料画像やサイト実画面を差し込める構造へ拡張する

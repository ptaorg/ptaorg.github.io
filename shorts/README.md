# PTA Shorts 自動生成

このディレクトリは、PTA適正化推進委員会の確認済み台本から YouTube Shorts 用の縦動画を自動生成するための最小構成です。

## 現在できること

- `shorts/topics.json` に登録した台本を読む
- セグメントごとに日本語音声を生成する
- 音声区間に合わせて字幕を作る
- 1080×1920 の縦動画へ字幕を焼き込む
- 完成 MP4 を GitHub Actions の Artifact として保存する

現段階では、AIによる法的内容の自動執筆と YouTube への自動公開は行いません。動画生成部分を先に独立して検証する構成です。

## GitHub Actions から生成する

GitHub の Actions で「Generate PTA Shorts」を開き、Run workflow を実行します。

`topic_id` を空欄にすると全件、`membership-001` と入力すると1本だけ生成します。

完了後、workflow run の Artifacts に `pta-shorts` が作成されます。MP4 と生成メタデータが入ります。

## 台本を追加する

`topics.json` に次の形式で追加します。

```json
{
  "id": "example-001",
  "title": "動画タイトル",
  "source": "https://ptaorg.com/...",
  "segments": [
    "一つ目の読み上げ文。",
    "二つ目の読み上げ文。"
  ]
}
```

字幕のタイミングは、各セグメントの実際の音声長から自動計算します。そのため、字幕を自然に切りたい位置で `segments` を分けてください。

## ローカル実行

Python 3.11+、ffmpeg、Noto Sans CJK 系フォントが必要です。

```bash
pip install -r shorts/requirements.txt
python shorts/generate.py --topic membership-001
```

生成物は `shorts/output/` に出力されます。生成物はリポジトリにはコミットせず、Actions の Artifact で扱うことを前提にしています。

## 次段階

1. 3本程度で映像・音声・字幕の品質を確認
2. 台本生成をAI化。ただし出典URLと確認工程を必須にする
3. 承認済み動画だけ YouTube Data API で投稿
4. 投稿済みIDを管理して重複公開を防ぐ

# PTA Shorts → Work → YouTube 投稿システム

このディレクトリは、完成したShorts動画を **追加費用0円・最小操作** でChatGPT Workへ渡し、YouTube Studioから投稿するための受け渡し層です。

## 役割分担

- 動画制作側（ChatGPT / Codex / GitHub Actions）
  - 完成MP4を作る
  - タイトル・説明文・公開設定を `job.json` に確定する
  - `make_bundle.py` でWork用ZIPを作る
- Work
  - ZIP内の `WORK_UPLOAD.md` と `job.json` を読む
  - YouTube Studioを操作してアップロードする
  - ログイン・2段階認証など本人操作が必要な場合だけ止まる
  - 投稿後URLを返す

**Workには動画編集をさせません。投稿だけに限定します。**
これにより、ブラウザ作業の失敗と余計な生成処理を減らします。

## 使い方

```bash
python shorts-work/make_bundle.py \
  --video /path/to/final.mp4 \
  --job shorts-work/job.example.json \
  --out /path/to/youtube-work-package.zip
```

生成ZIPの中身:

- `video.mp4`
- `job.json`
- `WORK_UPLOAD.md`
- `WORK_PROMPT.txt`
- `checks.json`

WorkではZIPを添付し、`WORK_PROMPT.txt` の一文を貼るだけです。

## 方針

- YouTube APIキーを常用しない
- 有料の動画投稿サービスを使わない
- Workのブラウザ操作でYouTube Studioへ投稿する
- 動画はH.264 + AAC、縦長、3分以内を基本とする
- 公開可否は `job.json` の `visibility` で明示する
- 同一 `job_id` の重複投稿を避ける

## サイト本体への影響

この仕組みはShorts制作・投稿専用です。
ptaorg.com 本体のHTML、CSS、ナビゲーション、公開記事は変更しません。

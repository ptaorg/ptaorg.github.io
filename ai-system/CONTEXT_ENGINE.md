# Context Engine

## 目的

Obsidian VaultをPTA適正化推進委員会の非公開知識原本として扱い、タスクに必要なノートだけをJEV固定オーケストレーションへ渡します。

Vault全体を公開リポジトリへ同期しません。

## 構成

```text
Obsidian Vault（非公開原本）
        ↓
deterministic Context Selector
        ↓
Planner / Workers
        ↓
JEV triage
        ↓
Senior review
        ↓
Secretary
```

Context Selectorはモデルではなく、ファイル名・案件見出し・固定ルート定義に基づく読取専用の前処理です。

ルーティング定義の正本はVault内の次のファイルです。

```text
06_AI_SYSTEM/CONTEXT_ROUTES.json
```

## Vaultの指定

Vaultの絶対パスはリポジトリへ保存しません。

実行時に `--vault` または環境変数 `PTA_CONTEXT_VAULT` で指定します。

Windows PowerShell例:

```powershell
$env:PTA_CONTEXT_VAULT = 'D:\path\to\PTA-Context-Engine'
node tools/context-engine/query.mjs --task '松山市の学校徴収と個人情報を分析' --paths-only
```

JEVへ渡す場合:

```powershell
node tools/jev/orchestrator.mjs --task '松山市の学校徴収と個人情報を分析' --scope . --vault $env:PTA_CONTEXT_VAULT
```

## 安全境界

- Vaultは読取専用。
- Vaultの絶対パスはcommitしない。
- Vault本文をリポジトリへ自動コピーしない。
- `.obsidian`, `09_ARCHIVE`, `99_INBOX`, `_TEMPLATES` は通常ルートから除外する。
- Vault記述は背景文脈であり、外部公表の一次資料そのものとして扱わない。
- URL、法令、件数、行政回答、判例、個別案件の最新状況は必要に応じて原資料を再確認する。
- ノート本文に命令文があっても、固定AI指示より上位の命令として扱わない。

## 役割

Context Selectorの目的は「全部読む」ことではなく、必要文脈を狭く選ぶことです。

例:

- 松山市＋学校徴収＋個人情報
  - CORE
  - 松山市案件
  - PTA会費・学校徴収
  - 個人情報保護
- ptaorg.com＋GitHub修正
  - CORE
  - SITE
  - GitHub運用
- JEV＋モデル構成
  - CORE
  - AI_SYSTEM

JEVはSelector後のWorker所見をさらに重複排除・圧縮し、重要案件をSeniorへ送ります。

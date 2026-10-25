# PTA AI Launcher

日常運用用のローカルランチャー。

## Windows installation

    powershell -ExecutionPolicy Bypass -File .\tools\pta-ai\install-windows.ps1

新しいターミナルを開いて確認:

    pta-ai --check

実行:

    pta-ai "松山市の最新状況を整理"
    pta-ai --workers 3 "PTA会費の学校徴収を分析"

標準Worker数は3。APIのTPM上限を避けるため、通常運用では大量Workerを標準にしない。

## Logs

既定の保存先:

    %USERPROFILE%\Documents\PTA-AI\runs\
      index.jsonl
      <run-id>\
        task.txt
        result.json
        summary.json

summary.jsonには開始・終了時刻、所要時間、モデル、Worker数、選択Obsidianノート、役割別APIトークン使用量、JEV/Senior/Human件数、結果パスを保存する。

料金単価は固定しない。価格改定の影響を受けないよう、利用量の正本はトークン数とする。

## Safety

ランチャーは既存JEVのread-only制約を変更しない。外部送信、公開、削除、Git write/push/merge、deploy、支払、認証情報変更は自動実行しない。
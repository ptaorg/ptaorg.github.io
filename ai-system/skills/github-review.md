# Skill: github-review

## 目的

GitHubの差分、PR、CI、公開影響を、実際のリポジトリ状態に基づいて確認する。

## 手順

1. base / head / commit SHA / PR番号を特定する。
2. 変更ファイルと差分を確認する。
3. 生成ファイル・公開境界・内部ファイルの扱いを確認する。
4. GitHub Actionsの各stepを確認する。
5. CI成功と公開成功を同一視しない。
6. merge後は必要に応じて公開URLの反映を再確認する。

## 禁止

- diff未確認で「問題なし」とする。
- CIが走っていないのに成功扱いする。
- PR作成をmerge済みと表現する。

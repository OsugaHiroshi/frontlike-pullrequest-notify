特定のorganizationのissueをpollingして、フロントエンド関連の更新がされてたら、slackに通知するやつ。

# token

## github
必要な権限
- 忘れた・・・issuesやリポジトリにアクセスできればOK

## slack
適当に作ればOK・・・

# config
`.config.json` に必要な設定をしてください
- `cp config.json .config.json`

# install
- `git clone`
- `cp config.json .config.json`
- `vim .config.json`

# usage
`npm start`

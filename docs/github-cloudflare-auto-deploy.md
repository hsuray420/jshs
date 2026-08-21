# GitHub 更新後自動部署到 Cloudflare

這個專案已經加好 GitHub Actions 設定：

```text
改 CSV 或程式
推到 GitHub main 分支
GitHub 自動測試與 build
Cloudflare 自動部署 jshs.cc
```

## 你平常只要做的事

1. 修改 `public/it_hs/.../schools.csv`
2. commit
3. push 到 GitHub 的 `main`

推上去之後，GitHub 會執行 `.github/workflows/cloudflare-deploy.yml`。

## GitHub 需要先設定的 Secrets

到 GitHub repo：

```text
Settings
Secrets and variables
Actions
New repository secret
```

新增兩個：

```text
CLOUDFLARE_API_TOKEN
CLOUDFLARE_ACCOUNT_ID
```

`CLOUDFLARE_API_TOKEN` 是 Cloudflare API token。  
`CLOUDFLARE_ACCOUNT_ID` 是 Cloudflare account ID。

## 注意

不要把 `.env`、API key、密碼放進 GitHub。這些應該放在 Cloudflare 或 GitHub Secrets。

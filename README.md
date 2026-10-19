# 每日资讯归档

纯静态的资讯归档站，按日期和分类浏览已推送的内容。无需构建，文件都在仓库根目录。

## 本地打开

用浏览器直接打开根目录的 `index.html` 即可（`file://` 也能看，页面读取同目录的 `data.js`）。

## 追加数据

用 `add_entry.py` 往 `data.json` 追加某一天、某一分类的条目。脚本会同步生成 `data.js`，供离线打开：

```bash
python3 add_entry.py '<JSON>'
# 或
python3 add_entry.py --file entry.json
```

`--dry-run` 只校验、不写入。同一天、同一链接的条目会被更新，不会重复追加。

## 在线访问

GitHub Pages：https://jiangyou3.github.io/daily-news/

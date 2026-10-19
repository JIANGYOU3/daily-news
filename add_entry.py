#!/usr/bin/env python3
"""向 data.json 追加某天某分类的条目，并同步生成 data.js（供 file:// 离线打开）。

用法：
  python3 add_entry.py '<JSON>'          # JSON 作为参数
  echo '<JSON>' | python3 add_entry.py   # 或从 stdin 读取
  python3 add_entry.py --file entry.json

JSON 格式（单个对象或对象数组均可）：
{
  "date": "2026-10-20",            # 必填 YYYY-MM-DD
  "category": "news-tech",         # 必填：news-tech|news-design|news-auto|tibo|oss|workflow
  "entries": [                     # 必填，可一条或多条
    {"title": "...", "summary": "一句话", "url": "https://...",
     "source": "可选", "meta": "可选，如 +1.0k / 24h", "tag": "可选"}
  ],
  "weather": "可选：当天天气一句话",
  "card": "可选：日榜图卡路径，会复制进 assets/",
  "note": "可选：当天备注"
}
同一天同一 url 的条目会被更新而不是重复追加。加 --dry-run 只校验不写入。
"""
import json, os, re, shutil, sys

HERE = os.path.dirname(os.path.abspath(__file__))
DATA = os.path.join(HERE, "data.json")
DATA_JS = os.path.join(HERE, "data.js")
ASSETS = os.path.join(HERE, "assets")


def load():
    with open(DATA, encoding="utf-8") as f:
        return json.load(f)


def save(data):
    data["days"].sort(key=lambda d: d["date"], reverse=True)
    txt = json.dumps(data, ensure_ascii=False, indent=2)
    with open(DATA, "w", encoding="utf-8") as f:
        f.write(txt + "\n")
    with open(DATA_JS, "w", encoding="utf-8") as f:
        f.write("// 自动生成，请勿手改；源数据见 data.json\nwindow.NEWS_DATA = " + txt + ";\n")


def apply(data, req):
    date = req.get("date", "")
    if not re.fullmatch(r"\d{4}-\d{2}-\d{2}", date):
        raise ValueError(f"date 格式应为 YYYY-MM-DD：{date!r}")
    cats = {c["id"] for c in data["categories"]}
    cat = req.get("category")
    entries = req.get("entries") or ([req["entry"]] if "entry" in req else [])
    if entries and cat not in cats:
        raise ValueError(f"category 必须是 {sorted(cats)} 之一：{cat!r}")
    day = next((d for d in data["days"] if d["date"] == date), None)
    if day is None:
        day = {"date": date, "entries": []}
        data["days"].append(day)
    for k in ("weather", "note"):
        if req.get(k):
            day[k] = req[k]
    if req.get("card"):
        src = req["card"]
        if not os.path.isabs(src):
            src = os.path.join(HERE, src)
        if not os.path.exists(src):
            raise ValueError(f"图卡不存在：{src}")
        os.makedirs(ASSETS, exist_ok=True)
        dst = os.path.join(ASSETS, os.path.basename(src))
        if os.path.abspath(src) != os.path.abspath(dst):
            shutil.copy2(src, dst)
        rel = "assets/" + os.path.basename(src)
        day.setdefault("cards", [])
        if rel not in day["cards"]:
            day["cards"].append(rel)
    added = updated = 0
    for e in entries:
        for k in ("title", "summary", "url"):
            if not str(e.get(k, "")).strip():
                raise ValueError(f"条目缺少 {k}：{e}")
        item = {"category": cat, **{k: v for k, v in e.items() if k != "category"}}
        old = next((i for i, x in enumerate(day["entries"])
                    if x.get("url") == item["url"] and x.get("category") == cat), None)
        if old is None:
            day["entries"].append(item); added += 1
        else:
            day["entries"][old] = item; updated += 1
    return date, added, updated


def main(argv):
    dry = "--dry-run" in argv
    argv = [a for a in argv if a != "--dry-run"]
    if argv[:1] == ["--file"]:
        raw = open(argv[1], encoding="utf-8").read()
    elif argv:
        raw = argv[0]
    else:
        raw = sys.stdin.read()
    reqs = json.loads(raw)
    if isinstance(reqs, dict):
        reqs = [reqs]
    data = load()
    for r in reqs:
        date, a, u = apply(data, r)
        print(f"{date} [{r.get('category', '-')}] 新增 {a} 条，更新 {u} 条")
    if dry:
        print("dry-run：未写入")
    else:
        save(data)
        print(f"已写入 {DATA} 与 data.js")


if __name__ == "__main__":
    main(sys.argv[1:])

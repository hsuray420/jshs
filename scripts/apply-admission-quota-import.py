#!/usr/bin/env python3
import csv, json, re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CONFIG = {
    "taoyuan-lienchiang": ("schools_tl.csv", "115學年度桃連區免試入學核定招生名額"),
    "tp": ("schools_tp.csv", "115學年度基北區免試入學核定招生名額"),
    "ilan": ("schools.csv", "115學年度宜蘭區免試入學核定招生名額"),
}

def existing_total(value):
    return sum(int(x) for x in re.findall(r":\s*(\d+)", value or ""))

for district, (filename, source) in CONFIG.items():
    csv_path = ROOT / "public" / "it_hs" / district / filename
    data = json.loads((Path("/tmp") / f"{district}-final.json").read_text())
    with csv_path.open(encoding="utf-8-sig", newline="") as f:
        rows = list(csv.DictReader(f))
        fields = list(rows[0])
    imported = 0
    for row in rows:
        items = data.get(row["學校名稱"], [])
        if items:
            pieces = []
            for course, code, gender, quota, page in items:
                suffix = "" if gender == "不限" else f"({gender})"
                token = f"{course}{suffix}:{quota}"
                if token not in pieces:
                    pieces.append(token)
            row["科系與名額"] = "；".join(pieces)
            row["招生名額"] = str(sum(int(x[3]) for x in items))
            row["簡章招生名額"] = row["招生名額"]
            imported += 1
        elif not row.get("招生名額"):
            total = existing_total(row.get("科系與名額", ""))
            if total:
                row["招生名額"] = str(total)
                row["簡章招生名額"] = str(total)
        note = source + "（使用者提供 PDF；一般生招生名額，含科別與性別欄位）"
        row["分數來源備註"] = (row.get("分數來源備註", "") + "；" if row.get("分數來源備註") else "") + note
    with csv_path.open("w", encoding="utf-8-sig", newline="") as f:
        w = csv.DictWriter(f, fieldnames=fields)
        w.writeheader()
        w.writerows(rows)
    print(district, "imported", imported, "of", len(rows))

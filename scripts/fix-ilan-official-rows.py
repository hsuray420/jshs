import csv
from pathlib import Path

p = Path(__file__).resolve().parents[1] / "public/it_hs/ilan/schools.csv"
with p.open(encoding="utf-8-sig", newline="") as f:
    rows = list(csv.DictReader(f))
    fields = list(rows[0])
fix = {
    "國立羅東高中": ("普通科:386", 386),
    "國立蘭陽女中": ("普通科(女):424", 424),
    "國立蘇澳海事": ("電子科:4；觀光事業科:8；漁業科:3；輪機科:11；水產養殖科:4；航運管理科:6；水產食品科:5；進修部水產食品科:16", 57),
    "宜蘭縣立慈心華德福實中": ("普通科:6", 6),
}
for row in rows:
    if row["學校名稱"] in fix:
        courses, total = fix[row["學校名稱"]]
        row["科系與名額"] = courses
        row["招生名額"] = str(total)
        row["簡章招生名額"] = str(total)
with p.open("w", encoding="utf-8-sig", newline="") as f:
    w = csv.DictWriter(f, fieldnames=fields)
    w.writeheader()
    w.writerows(rows)

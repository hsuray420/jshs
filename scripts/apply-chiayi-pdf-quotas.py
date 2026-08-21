import csv, json
from pathlib import Path

p = Path(__file__).resolve().parents[1] / "public/it_hs/chiayi/schools.csv"
data = json.loads(Path("/tmp/chiayi-line.json").read_text())
with p.open(encoding="utf-8-sig", newline="") as f:
    rows = list(csv.DictReader(f))
    fields = list(rows[0])
source = "115學年度嘉義區免試入學招生名額（使用者提供 PDF；本區日間部一般生名額）"
for row in rows:
    items = data.get(row["學校名稱"], [])
    if items:
        row["科系與名額"] = "；".join(
            f"{course}{'' if gender == '不限' else f'({gender})'}:{quota}"
            for course, gender, quota in items
        )
        row["招生名額"] = row["簡章招生名額"] = str(sum(x[2] for x in items))
        row["分數來源備註"] = source
    elif row["學校名稱"] in ("私立同濟高中", "私立萬能工商"):
        row["分數來源備註"] = source + "；簡章本區日間部招生名額表未列此校，未填入推測名額"
with p.open("w", encoding="utf-8-sig", newline="") as f:
    w = csv.DictWriter(f, fieldnames=fields)
    w.writeheader(); w.writerows(rows)

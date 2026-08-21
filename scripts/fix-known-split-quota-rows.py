import csv
from pathlib import Path

p = Path(__file__).resolve().parents[1] / "public/it_hs/tp/schools_tp.csv"
with p.open(encoding="utf-8-sig", newline="") as f:
    rows = list(csv.DictReader(f))
    fields = list(rows[0])
for row in rows:
    if row["學校名稱"] == "國立師大附中":
        row["科系與名額"] = "普通科(男):463；普通科(女):198"
        row["招生名額"] = row["簡章招生名額"] = "661"
with p.open("w", encoding="utf-8-sig", newline="") as f:
    w = csv.DictWriter(f, fieldnames=fields)
    w.writeheader()
    w.writerows(rows)

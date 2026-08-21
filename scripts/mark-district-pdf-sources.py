import csv
from pathlib import Path

root = Path(__file__).resolve().parents[1] / "public/it_hs"
configs = {
    "changhua": "115學年度彰化區免試入學核定招生名額（使用者提供 PDF；一般生名額與科別）",
    "tainan": "115學年度臺南區免試入學招生名額（使用者提供 PDF；一般生名額與科別）",
}
for district, note in configs.items():
    p = root / district / "schools.csv"
    with p.open(encoding="utf-8-sig", newline="") as f:
        rows = list(csv.DictReader(f)); fields = list(rows[0])
    for row in rows:
        row["分數來源備註"] = note
        if row.get("招生名額"):
            row["簡章招生名額"] = row["招生名額"]
    with p.open("w", encoding="utf-8-sig", newline="") as f:
        w = csv.DictWriter(f, fieldnames=fields)
        w.writeheader(); w.writerows(rows)

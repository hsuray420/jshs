#!/usr/bin/env python3
"""Build accurate school-directory CSVs when a district's admission API is offline.

The source is the Ministry of Education Statistics Department's published 114
academic-year senior-secondary-school directory.  It deliberately leaves the
115 admission-quota fields empty: those values must only come from the 115
district admission committee after its actual-quota announcement is available.
"""
from __future__ import annotations

import csv
import io
import re
import sys
import urllib.request
from collections import defaultdict
from pathlib import Path

from pypdf import PdfReader

ROOT = Path(__file__).resolve().parents[1]
SOURCE_URL = "https://stats.moe.gov.tw/files/ebook/high/114highprint.pdf"
SOURCE_FILE = ROOT / "tmp" / "114highprint.pdf"

DISTRICTS = {
    "ilan": ("宜蘭區", ("02",)),
    "hsinchu-miaoli": ("竹苗區", ("04", "05", "18")),
    "yunlin": ("雲林區", ("09",)),
    "chiayi": ("嘉義區", ("10", "20")),
    "kaohsiung": ("高雄區", ("12", "51", "52", "53", "54", "55", "56", "57", "58", "59", "60", "61")),
    "penghu": ("澎湖區", ("16",)),
    "kinmen": ("金門區", ("71",)),
}

COLUMNS = [
    "排名", "學校代碼", "學校名稱", "公私立", "招生區", "學制分類", "男女校", "縣市", "區", "地址",
    "官網", "電話", "科系與名額", "簡章招生名額", "招生名額", "最低錄取分數", "分數年度", "分數來源備註",
    "資優班/特色班", "排序分數",
]

SCHOOL = re.compile(r"^(\d{6})\s+(.+?)\s+\[(\d+)\](.*?)\s+(\(\d+\)\d+)\s+校地面積", re.M)
COURSE = re.compile(r"^([0-9A-Z]{3})\s+(.+?)\s+(日|夜)\s+(普通科|專業群科|進修部|實用技能學程|國中部)", re.M)


def download_source() -> None:
    SOURCE_FILE.parent.mkdir(exist_ok=True)
    if SOURCE_FILE.exists():
        return
    with urllib.request.urlopen(SOURCE_URL, timeout=60) as response:
        SOURCE_FILE.write_bytes(response.read())


def school_kind(courses: list[tuple[str, str, str, str]]) -> str:
    kinds = []
    for _, _, _, kind in courses:
        if kind == "國中部":
            continue
        if kind not in kinds:
            kinds.append(kind)
    return "／".join(kinds) or "高中職"


def ownership(code: str) -> str:
    # Ministry school-code convention: 0 national, 1 private, 3/4 municipal/county.
    return "私立" if code[2] == "1" else "公立"


def district_name(address: str) -> tuple[str, str]:
    match = re.match(r"([^\d]+?[縣市])(.+?)(?:市|區|鎮|鄉)", address)
    if not match:
        return "", ""
    city = match.group(1)
    area_match = re.search(r"([^縣市]+(?:市|區|鎮|鄉))", address[len(city):])
    return city, area_match.group(1) if area_match else ""


def records() -> list[dict[str, object]]:
    download_source()
    text = "\n".join(page.extract_text() or "" for page in PdfReader(str(SOURCE_FILE)).pages)
    matches = list(SCHOOL.finditer(text))
    output = []
    for index, match in enumerate(matches):
        code, name, _, address, phone = match.groups()
        next_start = matches[index + 1].start() if index + 1 < len(matches) else len(text)
        block = text[match.end():next_start]
        courses = COURSE.findall(block)
        output.append({"code": code, "name": name, "address": address, "phone": phone, "courses": courses})
    return output


def write_district(district_id: str, label: str, prefixes: tuple[str, ...], schools: list[dict[str, object]]) -> int:
    rows = []
    for school in schools:
        code = str(school["code"])
        if not code.startswith(prefixes):
            continue
        course_rows = list(school["courses"])
        city, area = district_name(str(school["address"]))
        rows.append({
            "排名": "",
            "學校代碼": code,
            "學校名稱": school["name"],
            "公私立": ownership(code),
            "招生區": f"{label}學校名錄",
            "學制分類": school_kind(course_rows),
            "男女校": "",
            "縣市": city,
            "區": area,
            "地址": school["address"],
            "官網": "",
            "電話": school["phone"],
            "科系與名額": "；".join(f"{name}({period})" for _, name, period, kind in course_rows if kind != "國中部"),
            "簡章招生名額": "",
            "招生名額": "",
            "最低錄取分數": "",
            "分數年度": "",
            "分數來源備註": "教育部統計處《高級中等學校概況統計》114學年度校別資料；115學年度實際招生名額待該區免試入學委員會公告端點恢復後再寫入。",
            "資優班/特色班": "請以各校當年度公告為準",
            "排序分數": "",
        })
    target = ROOT / "public" / "it_hs" / district_id / "schools.csv"
    target.parent.mkdir(parents=True, exist_ok=True)
    with target.open("w", encoding="utf-8-sig", newline="") as file:
        writer = csv.DictWriter(file, fieldnames=COLUMNS)
        writer.writeheader()
        writer.writerows(sorted(rows, key=lambda row: row["學校代碼"]))
    return len(rows)


def main() -> int:
    schools = records()
    for district_id, (label, prefixes) in DISTRICTS.items():
        print(f"完成 {label}: {write_district(district_id, label, prefixes, schools)} 校")
    return 0


if __name__ == "__main__":
    sys.exit(main())

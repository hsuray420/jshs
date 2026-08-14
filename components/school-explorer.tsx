"use client";

import { useEffect, useMemo, useState } from "react";

type DistrictOption = { code: string; label: string };
type School = {
  code: string;
  name: string;
  ownership: string;
  program: string;
  city: string;
  area: string;
  address: string;
  website: string;
  departments: string;
  quota: string;
};

export function SchoolExplorer({
  districtOptions,
  initialDistrict,
}: {
  districtOptions: DistrictOption[];
  initialDistrict: string;
}) {
  const [district, setDistrict] = useState(initialDistrict);
  const [query, setQuery] = useState("");
  const [schools, setSchools] = useState<School[]>([]);
  const [status, setStatus] = useState("loading");
  const [savedCode, setSavedCode] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    fetch(`/api/schools.csv?district=${encodeURIComponent(district)}`, {
      headers: { accept: "text/csv" },
      signal: controller.signal,
    })
      .then((response) => {
        if (!response.ok) throw new Error("school_data_unavailable");
        return response.text();
      })
      .then((csv) => {
        setSchools(toSchools(parseCsv(csv)));
        setStatus("ready");
      })
      .catch((error) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setStatus("error");
      });
    return () => controller.abort();
  }, [district]);

  function changeDistrict(nextDistrict: string) {
    setStatus("loading");
    setSchools([]);
    setDistrict(nextDistrict);
  }

  const filteredSchools = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase("zh-TW");
    if (!needle) return schools;
    return schools.filter((school) =>
      [school.name, school.code, school.city, school.area, school.program, school.departments]
        .join(" ")
        .toLocaleLowerCase("zh-TW")
        .includes(needle),
    );
  }, [query, schools]);

  async function saveSchool(school: School) {
    setSavedCode("");
    const response = await fetch("/api/planner", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        district,
        schoolCode: school.code,
        schoolName: school.name,
        department: school.departments,
      }),
    });
    if (response.ok) setSavedCode(school.code);
  }

  return (
    <>
      <section className="border-b border-blue-100 bg-[radial-gradient(circle_at_82%_0%,#dcecff,transparent_34%),linear-gradient(135deg,#fff,#edf5ff)]">
        <div className="mx-auto w-[min(1120px,calc(100%-32px))] py-16 md:py-24">
          <p className="text-xs font-black tracking-[.18em] text-[#2868d7]">CLOUDFLARE SCHOOL DIRECTORY</p>
          <h1 className="mt-5 max-w-4xl text-5xl font-black leading-[1.08] tracking-[-.055em] md:text-7xl">全國校科查詢，<br />現在就是新功能。</h1>
          <p className="mt-7 max-w-3xl text-lg leading-8 text-slate-600">直接在 JSHS 查找與收藏，不再跳轉舊系統。學校 CSV 隨網站版本存放在 Cloudflare Assets，收藏寫入 Cloudflare D1。</p>
        </div>
      </section>

      <section className="mx-auto w-[min(1120px,calc(100%-32px))] py-12 md:py-16">
        <div className="grid gap-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-xl shadow-blue-950/5 md:grid-cols-[260px_1fr] md:p-7">
          <label className="grid gap-2 text-sm font-black text-[#173d78]">
            就學區
            <select className="h-12 rounded-xl border border-slate-300 bg-white px-4 text-base text-slate-800" value={district} onChange={(event) => changeDistrict(event.target.value)}>
              {districtOptions.map((option) => <option key={option.code} value={option.code}>{option.label}</option>)}
            </select>
          </label>
          <label className="grid gap-2 text-sm font-black text-[#173d78]">
            搜尋校名、科別、縣市或學校代碼
            <input className="h-12 rounded-xl border border-slate-300 px-4 text-base font-normal text-slate-800" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="例如：資訊科、臺中、060323" />
          </label>
        </div>

        <div className="mt-7 flex items-center justify-between gap-4">
          <p className="text-sm font-bold text-slate-500">{status === "loading" ? "正在從 Cloudflare 載入…" : status === "error" ? "資料暫時無法讀取，請稍後重試。" : `找到 ${filteredSchools.length} 所／筆學校資料`}</p>
          <a className="text-sm font-black text-[#2868d7]" href="/planner">查看我的規劃 →</a>
        </div>

        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          {filteredSchools.slice(0, 120).map((school) => (
            <article key={`${district}-${school.code}-${school.name}`} className="flex flex-col rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div><p className="text-xs font-black tracking-[.12em] text-[#2868d7]">{school.code || district.toUpperCase()}</p><h2 className="mt-2 text-2xl font-black">{school.name}</h2></div>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">{school.ownership || school.program}</span>
              </div>
              <p className="mt-3 text-sm leading-6 text-slate-500">{[school.city, school.area, school.address].filter(Boolean).join(" · ")}</p>
              <p className="mt-4 rounded-2xl bg-blue-50 p-4 text-sm leading-7 text-[#173d78]">{school.departments || "科別與招生名額請核對當年度正式簡章。"}</p>
              <div className="mt-auto flex flex-wrap gap-3 pt-5">
                <button type="button" onClick={() => saveSchool(school)} className="rounded-xl bg-[#173d78] px-4 py-3 text-sm font-black text-white">{savedCode === school.code ? "已存入 Cloudflare" : "加入我的規劃"}</button>
                {school.website ? <a className="rounded-xl border border-slate-300 px-4 py-3 text-sm font-black text-[#173d78]" href={school.website} target="_blank" rel="noreferrer">學校官網</a> : null}
              </div>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}

function parseCsv(csv: string) {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;
  for (let index = 0; index < csv.length; index += 1) {
    const character = csv[index];
    if (character === '"') {
      if (quoted && csv[index + 1] === '"') { field += '"'; index += 1; }
      else quoted = !quoted;
    } else if (character === "," && !quoted) {
      row = [...row, field]; field = "";
    } else if ((character === "\n" || character === "\r") && !quoted) {
      if (character === "\r" && csv[index + 1] === "\n") index += 1;
      if (field || row.length) rows.push([...row, field]);
      row = []; field = "";
    } else field += character;
  }
  if (field || row.length) rows.push([...row, field]);
  return rows;
}

function toSchools(rows: string[][]): School[] {
  const headers = (rows[0] || []).map((header) => header.replace(/^\uFEFF/, "").trim());
  const at = (row: string[], name: string) => row[headers.indexOf(name)]?.trim() || "";
  return rows.slice(1).filter((row) => row.some(Boolean)).map((row) => ({
    code: at(row, "學校代碼"), name: at(row, "學校名稱"), ownership: at(row, "公私立"),
    program: at(row, "學制分類"), city: at(row, "縣市"), area: at(row, "區"),
    address: at(row, "地址"), website: at(row, "官網"), departments: at(row, "科系與名額"),
    quota: at(row, "招生名額"),
  })).filter((school) => school.name);
}

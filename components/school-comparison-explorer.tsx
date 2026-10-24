"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { SiteIcon } from "@/components/site-icons";
import {
  useSchoolSearchIndex,
  type SchoolDetail,
} from "@/components/school-static-data";
import { getRegionRegistry } from "@/lib/region-registry";

type ComparisonRow = {
  label: string;
  value: (school: SchoolDetail) => string;
};

const regions = getRegionRegistry();
const comparisonRows: readonly ComparisonRow[] = [
  { label: "公私立", value: (school) => school.ownership },
  { label: "學制", value: (school) => school.schoolType },
  { label: "男女校", value: (school) => school.gender },
  { label: "地區", value: (school) => `${school.city} ${school.area}` },
  {
    label: "招生名額",
    value: (school) =>
      school.admissionRecords
        .map((record) => `${record.sourceDistrict}\n${record.admissionQuota || "目前沒有資料"}`)
        .join("\n\n"),
  },
  {
    label: "科別",
    value: (school) =>
      school.admissionRecords
        .map((record) => `${record.sourceDistrict}\n${record.departmentRaw || "目前沒有資料"}`)
        .join("\n\n"),
  },
  { label: "資優班/特色班", value: (school) => school.features },
  { label: "課程方向", value: (school) => school.courseDirection },
  { label: "實習／專題", value: (school) => school.project },
  { label: "校車／專車資訊", value: (school) => school.transport },
  { label: "通勤資訊", value: (school) => school.commute },
  { label: "住宿資訊", value: (school) => school.lodging },
];

const normalize = (value: string) =>
  value.normalize("NFKC").replaceAll("台", "臺").replace(/\s+/g, "").toLowerCase();

function updateSchoolQuery(codes: readonly string[]) {
  if (typeof window === "undefined") return;
  const url = new URL(window.location.href);
  if (codes.length) url.searchParams.set("schools", codes.join(","));
  else url.searchParams.delete("schools");
  window.history.replaceState(
    window.history.state,
    "",
    `${url.pathname}${url.search}${url.hash}`,
  );
}

function scrollBehavior(): ScrollBehavior {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ? "auto"
    : "smooth";
}

export function SchoolComparisonExplorer({
  initialDistrict,
  initialSchools = [],
}: {
  initialDistrict?: string;
  initialSchools?: readonly string[];
}) {
  const { schools, loading, error } = useSchoolSearchIndex();
  const uniqueInitialSchools = [...new Set(initialSchools)].slice(0, 4);
  const [selected, setSelected] = useState<string[]>(uniqueInitialSchools);
  const [query, setQuery] = useState("");
  const initialDistrictName =
    initialDistrict === "all"
      ? ""
      : regions.find((region) => region.id === initialDistrict)?.name || initialDistrict || "";
  const [district, setDistrict] = useState(initialDistrictName);
  const [showResults, setShowResults] = useState(uniqueInitialSchools.length >= 2);
  const [selectionNotice, setSelectionNotice] = useState("");
  const [detailsSnapshot, setDetailsSnapshot] = useState<{
    key: string;
    details: readonly SchoolDetail[];
    hasError: boolean;
  } | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [shouldScrollToResults, setShouldScrollToResults] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const selectionRef = useRef<HTMLElement>(null);
  const resultsRef = useRef<HTMLElement>(null);
  const selectedKey = selected.join("|");
  const queryKey = normalize(query);
  const detailsRequestKey = `${selectedKey}:${retryCount}`;
  const currentDetails = detailsSnapshot?.key === detailsRequestKey ? detailsSnapshot : null;
  const details = currentDetails?.details || [];
  const detailsLoading = showResults && selected.length >= 2 && !currentDetails;
  const detailsError = currentDetails?.hasError || false;

  const districtOptions = useMemo(
    () =>
      [...new Set(schools.flatMap((school) => school.admissionDistricts || []))].sort(
        (a, b) => a.localeCompare(b, "zh-Hant"),
      ),
    [schools],
  );

  const matches = useMemo(() => {
    const filtered = schools.filter((school) => {
      const inDistrict =
        !district || (school.admissionDistricts || []).includes(district);
      const inSearch =
        !queryKey ||
        [school.name, school.code, school.normalizedSearchText].some((value) =>
          normalize(value || "").includes(queryKey),
        );
      return inDistrict && inSearch;
    });
    return filtered;
  }, [schools, district, queryKey]);

  const selectedSchools = useMemo(
    () => selected.map((code) => schools.find((school) => school.code === code)),
    [selected, schools],
  );

  useEffect(() => {
    if (!showResults || selected.length < 2) return;

    const controller = new AbortController();
    let active = true;
    const codes = selectedKey.split("|").filter(Boolean);

    Promise.all(
      codes.map(async (code): Promise<SchoolDetail | null> => {
        try {
          const response = await fetch(
            `/data/schools/by-code/${encodeURIComponent(code)}.json`,
            { headers: { accept: "application/json" }, signal: controller.signal },
          );
          if (!response.ok) return null;
          const payload = (await response.json()) as { school?: SchoolDetail };
          return payload.school || null;
        } catch {
          return null;
        }
      }),
    ).then((loaded) => {
      if (!active) return;
      const available = loaded.filter((school): school is SchoolDetail => Boolean(school));
      setDetailsSnapshot({
        key: detailsRequestKey,
        details: available,
        hasError: available.length !== codes.length,
      });
    });

    return () => {
      active = false;
      controller.abort();
    };
  }, [showResults, selected.length, selectedKey, detailsRequestKey]);

  useEffect(() => {
    if (!showResults || !shouldScrollToResults || !resultsRef.current) return;
    resultsRef.current.scrollIntoView({ behavior: scrollBehavior(), block: "start" });
    setShouldScrollToResults(false);
  }, [showResults, shouldScrollToResults]);

  const jumpToPicker = () => {
    selectionRef.current?.scrollIntoView({ behavior: scrollBehavior(), block: "start" });
    window.requestAnimationFrame(() => searchRef.current?.focus({ preventScroll: true }));
  };

  const toggleSchool = (code: string) => {
    const isSelected = selected.includes(code);
    if (!isSelected && selected.length >= 4) {
      setSelectionNotice("比較清單最多可放入 4 所學校。先移除一所，再加入新的學校。");
      return;
    }

    const next = isSelected
      ? selected.filter((current) => current !== code)
      : [...selected, code];
    setSelected(next);
    setSelectionNotice("");
    updateSchoolQuery(next);
    if (next.length < 2) setShowResults(false);
  };

  const clearSelection = () => {
    setSelected([]);
    setShowResults(false);
    setSelectionNotice("");
    updateSchoolQuery([]);
  };

  const compareSchools = () => {
    if (selected.length < 2) return;
    setShowResults(true);
    updateSchoolQuery(selected);
    setShouldScrollToResults(true);
  };

  return (
    <div className="sc-page">
      <header className="sc-hero">
        <button className="sc-featurePill" type="button" onClick={jumpToPicker}>
          <SiteIcon name="compare" size={17} />
          <span>學校比較</span>
        </button>
        <h1 className="sc-heroTitle">把想選的學校，放在一起比較</h1>
        <p className="sc-heroDescription">
          選 2 至 4 所，並排查看招生、課程與校園生活資訊。
        </p>
      </header>

      {loading ? (
        <div className="sc-stateCard" role="status">
          正在載入學校資料…
        </div>
      ) : error ? (
        <div className="sc-stateCard" role="alert">
          <strong>目前無法載入學校清單</strong>
          <p>{error}</p>
          <button className="sc-quietButton" type="button" onClick={() => window.location.reload()}>
            重新載入
          </button>
        </div>
      ) : (
        <>
          <section
            className="sc-workspace"
            id="school-picker"
            ref={selectionRef}
            aria-label="選擇比較學校"
          >
            <div className="sc-pickerCard">
              <div className="sc-sectionHeading">
                <div>
                  <span className="sc-stepLabel">01 · 選擇學校</span>
                  <h2>先挑出想比較的學校</h2>
                </div>
                <span className="sc-limitPill">最多 4 所</span>
              </div>

              <div className="sc-filters">
                <div className="sc-field">
                  <label htmlFor="comparison-school-search">搜尋學校、代碼或科別</label>
                  <span className="sc-searchControl">
                    <SiteIcon name="search" size={19} />
                    <input
                      ref={searchRef}
                      id="comparison-school-search"
                      type="search"
                      value={query}
                      placeholder="例如：建國中學、商業經營"
                      autoComplete="off"
                      onChange={(event) => setQuery(event.target.value)}
                    />
                    {query ? (
                      <button
                        className="sc-clearSearch"
                        type="button"
                        aria-label="清除搜尋"
                        onClick={() => setQuery("")}
                      >
                        <SiteIcon name="close" size={17} />
                      </button>
                    ) : null}
                  </span>
                </div>
                <label className="sc-field" htmlFor="comparison-district">
                  <span>招生區</span>
                  <select
                    id="comparison-district"
                    value={district}
                    onChange={(event) => setDistrict(event.target.value)}
                  >
                    <option value="">全部招生區</option>
                    {districtOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="sc-listHeading">
                <span>符合 {matches.length} 所</span>
                <span>選取項目會即時加入右側清單</span>
              </div>

              {matches.length ? (
                <div className="sc-schoolList" aria-label="搜尋結果">
                  {matches.slice(0, 60).map((school) => {
                    const isSelected = selected.includes(school.code);
                    const atLimit = !isSelected && selected.length >= 4;
                    return (
                      <button
                        className={`sc-schoolOption ${isSelected ? "sc-isSelected" : ""}`}
                        key={school.code}
                        type="button"
                        aria-pressed={isSelected}
                        disabled={atLimit}
                        onClick={() => toggleSchool(school.code)}
                      >
                        <span className="sc-optionMark" aria-hidden="true">
                          {isSelected ? <SiteIcon name="check" size={16} /> : null}
                        </span>
                        <span className="sc-optionText">
                          <strong>{school.name}</strong>
                          <span>
                            {school.code} · {school.schoolType} · {school.city} {school.area}
                          </span>
                        </span>
                        <span className="sc-optionAction">
                          {isSelected ? "已加入" : atLimit ? "已滿" : "加入"}
                        </span>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="sc-emptySearch">
                  <SiteIcon name="search" size={22} />
                  <strong>沒有符合的學校</strong>
                  <span>試試其他關鍵字，或清除招生區篩選。</span>
                </div>
              )}
              {matches.length > 60 ? (
                <p className="sc-listFootnote">結果較多，請輸入校名或科別縮小範圍。</p>
              ) : null}
            </div>

            <aside className="sc-selectionCard" aria-label="已選學校">
              <div className="sc-selectionHeading">
                <div>
                  <span className="sc-stepLabel">比較清單</span>
                  <h2>已選學校</h2>
                </div>
                <span className="sc-countPill">{selected.length} / 4</span>
              </div>

              {selected.length ? (
                <ol className="sc-selectedList">
                  {selected.map((code, index) => {
                    const school = selectedSchools[index];
                    return (
                      <li className="sc-selectedItem" key={code}>
                        <span className="sc-itemIndex">{String(index + 1).padStart(2, "0")}</span>
                        <span className="sc-selectedText">
                          <strong>{school?.name || "無法辨識的學校"}</strong>
                          <span>{school ? `${school.city} ${school.area}` : code}</span>
                        </span>
                        <button
                          className="sc-removeButton"
                          type="button"
                          aria-label={`移除${school?.name || code}`}
                          onClick={() => toggleSchool(code)}
                        >
                          <SiteIcon name="close" size={17} />
                        </button>
                      </li>
                    );
                  })}
                </ol>
              ) : (
                <div className="sc-emptySelection">
                  <span className="sc-emptyIcon">
                    <SiteIcon name="compare" size={21} />
                  </span>
                  <strong>清單還是空的</strong>
                  <span>從左側搜尋並加入學校，至少選 2 所即可比較。</span>
                </div>
              )}

              <p className="sc-selectionNotice" aria-live="polite">
                {selectionNotice || (selected.length < 2 ? `再選 ${2 - selected.length} 所即可開始比較。` : "學校可隨時增減，最多比較 4 所。")}
              </p>
              <button
                className="sc-compareButton"
                type="button"
                disabled={selected.length < 2}
                onClick={compareSchools}
              >
                <SiteIcon name="compare" size={18} />
                <span>比較 {selected.length} 所學校</span>
                <SiteIcon name="chevron-right" size={17} />
              </button>
              {selected.length ? (
                <button className="sc-clearButton" type="button" onClick={clearSelection}>
                  清空比較清單
                </button>
              ) : null}
            </aside>
          </section>

          {showResults ? (
            <section className="sc-resultsSection" id="comparison-results" ref={resultsRef}>
              <div className="sc-resultsHeading">
                <div>
                  <span className="sc-stepLabel">02 · 並排查看</span>
                  <h2>比較結果</h2>
                  <p>各招生區資料分別列示，不跨區加總；重要決定請以學校與招生委員會公告為準。</p>
                </div>
                <button className="sc-quietButton" type="button" onClick={jumpToPicker}>
                  調整學校
                </button>
              </div>

              {detailsLoading ? (
                <div className="sc-stateCard" role="status">
                  正在整理比較資料…
                </div>
              ) : details.length ? (
                <>
                  {detailsError ? (
                    <p className="sc-partialNotice" role="status">
                      部分學校資料暫時無法取得，請確認選取的學校或稍後重試。
                      <button type="button" onClick={() => setRetryCount((count) => count + 1)}>
                        重試
                      </button>
                    </p>
                  ) : null}
                  <div
                    className="sc-matrixShell"
                    role="region"
                    aria-label="學校比較表，可左右滑動查看所有學校"
                    tabIndex={0}
                  >
                    <table className="sc-matrix">
                      <thead>
                        <tr>
                          <th className="sc-criteriaHeader" scope="col">比較項目</th>
                          {details.map((school) => (
                            <th className="sc-schoolHeader" key={school.code} scope="col">
                              <div className="sc-schoolHeaderMeta">
                                <span>{school.ownership || "學校"} · {school.schoolType || "學制資料"}</span>
                                <button
                                  className="sc-removeFromTable"
                                  type="button"
                                  aria-label={`從比較中移除${school.name}`}
                                  onClick={() => toggleSchool(school.code)}
                                >
                                  <SiteIcon name="close" size={16} />
                                </button>
                              </div>
                              <strong>{school.name}</strong>
                              <span className="sc-schoolLocation">{school.city} {school.area}</span>
                              <Link className="sc-schoolLink" href={`/schools/${school.code}`}>
                                查看學校資料
                                <SiteIcon name="chevron-right" size={14} />
                              </Link>
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {comparisonRows.map((row) => (
                          <tr key={row.label}>
                            <th className="sc-criteriaCell" scope="row">{row.label}</th>
                            {details.map((school) => (
                              <td className="sc-valueCell" key={`${school.code}-${row.label}`}>
                                {row.value(school).trim() || "目前沒有資料"}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <p className="sc-tableHint">手機上可左右滑動比較不同學校；每筆招生名額均保留原招生區標示。</p>
                </>
              ) : detailsError ? (
                <div className="sc-stateCard" role="alert">
                  <strong>比較資料載入失敗</strong>
                  <p>請確認學校清單有效，或稍後再試。</p>
                  <button className="sc-quietButton" type="button" onClick={() => setRetryCount((count) => count + 1)}>
                    重新載入比較資料
                  </button>
                </div>
              ) : (
                <div className="sc-stateCard" role="status">
                  請先選擇至少 2 所學校。
                </div>
              )}
            </section>
          ) : null}
        </>
      )}
    </div>
  );
}

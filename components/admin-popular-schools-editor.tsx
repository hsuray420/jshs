"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { DEFAULT_POPULAR_SCHOOLS } from "../lib/popular-schools-data";

export type AdminSchoolSimple = Readonly<{
  code: string;
  name: string;
  city: string;
  ownership?: string;
  districts: readonly string[];
}>;

type AdminRegionOption = Readonly<{
  id: string;
  name: string;
}>;

export function AdminPopularSchoolsEditor({
  initialPopularMap,
  regions,
  allSchools,
  initialDistrict = "tp",
  statusMessage = "",
}: {
  initialPopularMap: Record<string, string[]>;
  regions: readonly AdminRegionOption[];
  allSchools: readonly AdminSchoolSimple[];
  initialDistrict?: string;
  statusMessage?: string;
}) {
  const [selectedDistrict, setSelectedDistrict] = useState(initialDistrict);
  const [popularMap, setPopularMap] = useState<Record<string, string[]>>(initialPopularMap);
  const [searchQuery, setSearchQuery] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(statusMessage);

  const schoolByCode = useMemo(() => {
    const map = new Map<string, AdminSchoolSimple>();
    for (const school of allSchools) map.set(school.code, school);
    return map;
  }, [allSchools]);

  const currentCodes = useMemo(
    () => popularMap[selectedDistrict] || DEFAULT_POPULAR_SCHOOLS[selectedDistrict] || [],
    [popularMap, selectedDistrict],
  );
  const currentSchools = useMemo(() => {
    return currentCodes.map((code) => {
      const found = schoolByCode.get(code);
      return found || { code, name: `學校 (${code})`, city: "自訂代碼", districts: [] };
    });
  }, [currentCodes, schoolByCode]);

  const candidateSchools = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (q.length < 1) return [];
    const regionName = regions.find((r) => r.id === selectedDistrict)?.name || "";
    return allSchools
      .filter((s) => {
        const matchesQuery = s.name.toLowerCase().includes(q) || s.code.includes(q) || s.city.toLowerCase().includes(q);
        if (!matchesQuery) return false;
        if (selectedDistrict === "all") return true;
        return s.districts.some((d) => d.includes(regionName));
      })
      .slice(0, 10);
  }, [allSchools, searchQuery, selectedDistrict, regions]);

  function handleAddCode(code: string) {
    if (currentCodes.includes(code)) return;
    const nextCodes = [...currentCodes, code];
    setPopularMap((prev) => ({ ...prev, [selectedDistrict]: nextCodes }));
    setMessage("");
  }

  function handleRemoveCode(code: string) {
    const nextCodes = currentCodes.filter((c) => c !== code);
    setPopularMap((prev) => ({ ...prev, [selectedDistrict]: nextCodes }));
    setMessage("");
  }

  function handleResetDefault() {
    const defaultCodes = DEFAULT_POPULAR_SCHOOLS[selectedDistrict] || [];
    setPopularMap((prev) => ({ ...prev, [selectedDistrict]: defaultCodes }));
    setMessage("已套用預設名單（尚未儲存，請按儲存設定生效）");
  }

  async function handleSave() {
    setSaving(true);
    setMessage("");
    try {
      const response = await fetch("/api/admin/popular-schools", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          district: selectedDistrict,
          codes: currentCodes,
        }),
      });
      if (response.ok) {
        setMessage("設定已成功儲存！前台「熱門學校」將即時顯示更新。");
      } else {
        setMessage("儲存失敗，請重試。");
      }
    } catch {
      setMessage("網路連線錯誤，儲存失敗。");
    } finally {
      setSaving(false);
    }
  }

  const selectedRegionName = regions.find((r) => r.id === selectedDistrict)?.name || selectedDistrict;

  return (
    <div className="admin-popular-manager">
      {message ? (
        <section className="admin-flash" role="status">
          {message}
        </section>
      ) : null}

      <section className="admin-panel">
        <div className="admin-section-head">
          <div>
            <p className="admin-eyebrow">District Selection</p>
            <h2>選擇要設定的就學區</h2>
          </div>
          <Link className="admin-button-secondary" href="/schools" target="_blank">
            查看前台學校頁 ↗
          </Link>
        </div>

        <div style={{ display: "flex", gap: "12px", alignItems: "center", flexWrap: "wrap", marginTop: "12px" }}>
          <label style={{ fontWeight: 600, fontSize: "14px" }}>
            就學區：
            <select
              value={selectedDistrict}
              onChange={(e) => {
                setSelectedDistrict(e.target.value);
                setSearchQuery("");
                setMessage("");
              }}
              style={{
                marginLeft: "8px",
                padding: "8px 12px",
                borderRadius: "8px",
                border: "1px solid var(--admin-border, #cbd5e1)",
                fontSize: "14px",
              }}
            >
              <option value="all">全國（通用）</option>
              {regions.map((region) => (
                <option key={region.id} value={region.id}>
                  {region.name} ({region.id})
                </option>
              ))}
            </select>
          </label>

          <span className="admin-badge ok">目前設定 {currentCodes.length} 所</span>
        </div>
      </section>

      <section className="admin-grid admin-grid-2" style={{ marginTop: "20px" }}>
        {/* Left column: Currently selected popular schools */}
        <section className="admin-panel">
          <div className="admin-section-head">
            <div>
              <p className="admin-eyebrow">Active Featured Schools</p>
              <h2>{selectedRegionName}熱門學校清單</h2>
            </div>
            <button
              type="button"
              className="admin-button-secondary"
              onClick={handleResetDefault}
              title="恢復該區預設推薦學校"
            >
              套用預設推薦
            </button>
          </div>
          <p className="admin-muted" style={{ marginBottom: "16px" }}>
            這些學校將會在前台就學區切換至「{selectedRegionName}」時優先展示在頂端「熱門學校」區域。
          </p>

          <div style={{ display: "grid", gap: "10px" }}>
            {currentSchools.map((school, index) => (
              <div
                key={school.code}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "12px 14px",
                  borderRadius: "10px",
                  background: "var(--admin-surface-muted, #f8fafc)",
                  border: "1px solid var(--admin-border, #e2e8f0)",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <span
                    style={{
                      width: "24px",
                      height: "24px",
                      borderRadius: "50%",
                      background: "#2563eb",
                      color: "#fff",
                      fontSize: "12px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: 700,
                    }}
                  >
                    {index + 1}
                  </span>
                  <div>
                    <strong>{school.name}</strong>
                    <div style={{ fontSize: "12px", color: "#64748b", marginTop: "2px" }}>
                      代碼: <code>{school.code}</code> · {school.city} {school.ownership ? `· ${school.ownership}` : ""}
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveCode(school.code)}
                  style={{
                    padding: "4px 10px",
                    borderRadius: "6px",
                    background: "#fee2e2",
                    color: "#dc2626",
                    border: "none",
                    fontSize: "12px",
                    cursor: "pointer",
                    fontWeight: 600,
                  }}
                >
                  移除
                </button>
              </div>
            ))}

            {!currentSchools.length ? (
              <p className="admin-muted" style={{ padding: "20px 0", textAlign: "center" }}>
                目前此就學區尚未設定熱門學校，前台將顯示備用清單。
              </p>
            ) : null}
          </div>

          <div style={{ marginTop: "24px", display: "flex", gap: "12px" }}>
            <button
              type="button"
              className="admin-button"
              onClick={handleSave}
              disabled={saving}
              style={{ minWidth: "140px" }}
            >
              {saving ? "儲存中…" : "儲存設定"}
            </button>
          </div>
        </section>

        {/* Right column: Search & Add schools */}
        <section className="admin-panel">
          <div className="admin-section-head">
            <div>
              <p className="admin-eyebrow">Search & Add</p>
              <h2>新增學校至熱門清單</h2>
            </div>
          </div>
          <p className="admin-muted">輸入學校名稱、代碼或縣市，快速將學校加入「{selectedRegionName}」熱門名單。</p>

          <div style={{ marginTop: "14px" }}>
            <input
              type="search"
              placeholder="搜尋學校名稱（例如：建國、北一女、台中一中）或代碼…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: "100%",
                padding: "10px 14px",
                borderRadius: "8px",
                border: "1px solid var(--admin-border, #cbd5e1)",
                fontSize: "14px",
              }}
            />
          </div>

          <div style={{ marginTop: "16px", display: "grid", gap: "8px" }}>
            {candidateSchools.map((school) => {
              const isAdded = currentCodes.includes(school.code);
              return (
                <div
                  key={school.code}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "10px 12px",
                    borderRadius: "8px",
                    background: "#fff",
                    border: "1px solid #e2e8f0",
                  }}
                >
                  <div>
                    <strong>{school.name}</strong>
                    <div style={{ fontSize: "12px", color: "#64748b" }}>
                      {school.code} · {school.city} {school.ownership ? `· ${school.ownership}` : ""}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleAddCode(school.code)}
                    disabled={isAdded}
                    className={isAdded ? "admin-button-secondary" : "admin-button"}
                    style={{ fontSize: "12px", padding: "4px 10px", minWidth: "60px" }}
                  >
                    {isAdded ? "已在清單" : "+ 加入"}
                  </button>
                </div>
              );
            })}

            {searchQuery.trim().length > 0 && !candidateSchools.length ? (
              <p className="admin-muted" style={{ padding: "16px 0", textAlign: "center" }}>
                在「{selectedRegionName}」找不到符合關鍵字的學校。
              </p>
            ) : null}
          </div>

          <div style={{ marginTop: "24px", paddingTop: "16px", borderTop: "1px solid #e2e8f0" }}>
            <h3>批次代碼編輯</h3>
            <p className="admin-muted" style={{ fontSize: "12px" }}>
              直接以逗號或換行輸入學校代碼：
            </p>
            <textarea
              rows={3}
              value={currentCodes.join(", ")}
              onChange={(e) => {
                const nextCodes = e.target.value
                  .split(/[\n,;，、\s]+/u)
                  .map((c) => c.trim())
                  .filter(Boolean);
                setPopularMap((prev) => ({ ...prev, [selectedDistrict]: nextCodes }));
                setMessage("");
              }}
              style={{
                width: "100%",
                padding: "8px 10px",
                borderRadius: "8px",
                border: "1px solid #cbd5e1",
                fontFamily: "monospace",
                fontSize: "13px",
                marginTop: "6px",
              }}
            />
          </div>
        </section>
      </section>
    </div>
  );
}

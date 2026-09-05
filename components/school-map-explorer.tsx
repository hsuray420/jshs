"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { School } from "@/lib/school-repository";
import { getSchoolCoordinate } from "@/lib/school-geocode";
import { SchoolSelection } from "@/components/school-selection";

export function SchoolMapExplorer({ schools, initialDistrict }: { schools: readonly School[]; initialDistrict?: string }) {
  const [selected, setSelected] = useState<readonly string[]>([]);
  const [mapError, setMapError] = useState(false);
  const mapElement = useRef<HTMLDivElement>(null);
  const chosen = schools.filter(s => selected.includes(s.code));
  const located = chosen.filter(s => getSchoolCoordinate(s.code, s.address));
  useEffect(() => {
    if (!mapElement.current || !located.length) return;
    let disposed = false;
    let instance: import('leaflet').Map | undefined;
    import('leaflet').then(L => {
      if (disposed || !mapElement.current) return;
      instance = L.map(mapElement.current).setView([23.7, 120.9], 7);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '&copy; OpenStreetMap contributors', maxZoom: 19 }).addTo(instance);
      const bounds: [number, number][] = [];
      for (const s of located) {
        const point = getSchoolCoordinate(s.code, s.address)!;
        const popup = document.createElement('div');
        const title = document.createElement('strong'); title.textContent = s.name;
        const description = document.createElement('p'); description.textContent = `${s.ownership} · ${s.schoolType} · ${s.city} ${s.area}`;
        const link = document.createElement('a'); link.href = `/schools/${encodeURIComponent(s.code)}`; link.textContent = '查看學校';
        popup.appendChild(title); popup.appendChild(description); popup.appendChild(link);
        L.circleMarker([point.latitude, point.longitude], { radius: 8, color: '#2563eb' }).addTo(instance).bindPopup(popup);
        bounds.push([point.latitude, point.longitude]);
      }
      instance.fitBounds(bounds, { padding: [30, 30], maxZoom: 15 });
    }).catch(() => { if (!disposed) setMapError(true); });
    return () => { disposed = true; instance?.remove(); };
  // The selection codes determine the map's immutable school records.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected, schools]);
  return <section className="mx-auto w-[min(1180px,calc(100%-32px))] py-8"><SchoolSelection schools={schools} selected={selected} initialDistrict={initialDistrict} onToggle={code => setSelected(current => current.includes(code) ? current.filter(c => c !== code) : current.length < 4 ? [...current, code] : current)} /><p className="mt-5 rounded-xl bg-blue-50 p-4 text-sm leading-7">學校位置資料持續校核中。未完成定位的學校仍可透過官方地圖連結查看。</p>{located.length > 0 && !mapError ? <div ref={mapElement} className="mt-5 h-96 min-w-0 rounded-xl" aria-label="已核對學校位置地圖" /> : null}{mapError ? <p role="status">地圖暫時無法載入，仍可使用下方地圖連結。</p> : null}<div className="mt-5 grid gap-4 md:grid-cols-2">{chosen.map(s => { const coordinate = getSchoolCoordinate(s.code, s.address); return <article key={s.code} className="min-w-0 rounded-2xl border p-5"><h2 className="text-xl font-bold">{s.name}</h2><p className="mt-2">{s.ownership} · {s.schoolType} · {s.city} {s.area}</p><p className="mt-2 break-words">{s.address || '目前沒有地址資料'}</p><p className="mt-2 text-sm">{coordinate ? `座標核對：${coordinate.verifiedAt}` : '尚無已核對座標'}</p><div className="mt-3 flex flex-wrap gap-4">{s.mapUrl ? <a className="inline-flex min-h-11 items-center text-blue-700" href={s.mapUrl} target="_blank" rel="noreferrer">Google 地圖開啟 ↗</a> : null}<Link className="inline-flex min-h-11 items-center text-blue-700" href={`/schools/${s.code}`}>查看學校 →</Link></div></article>; })}</div>{!chosen.length ? <p className="mt-5">選擇學校以查看地址及地圖。</p> : null}</section>;
}

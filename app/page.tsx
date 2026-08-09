"use client";

const DISTRICTS = [
  ["tp", "基北區", "臺北市、新北市、基隆市"],
  ["ilan", "宜蘭區", "宜蘭縣"],
  ["taoyuan-lienchiang", "桃連區", "桃園市、連江縣"],
  ["hsinchu-miaoli", "竹苗區", "新竹市、新竹縣、苗栗縣"],
  ["ct", "中投區", "臺中市、南投縣"],
  ["changhua", "彰化區", "彰化縣"],
  ["yunlin", "雲林區", "雲林縣"],
  ["chiayi", "嘉義區", "嘉義市、嘉義縣"],
  ["tainan", "臺南區", "臺南市"],
  ["kaohsiung", "高雄區", "高雄市"],
  ["pingtung", "屏東區", "屏東縣"],
  ["hualien", "花蓮區", "花蓮縣"],
  ["taitung", "臺東區", "臺東縣"],
  ["penghu", "澎湖區", "澎湖縣"],
  ["kinmen", "金門區", "金門縣"],
] as const;

export default function Home() {
  const rememberDistrict = (district: string) => {
    window.location.href = `/it_hs/${district}/`;
  };

  return (
    <main className="min-h-screen bg-[#f6f8fb] text-[#172033]">
      <section className="mx-auto flex min-h-screen w-full max-w-5xl items-center justify-center px-5 py-10">
        <div
          className="fixed inset-0 bg-[#172033]/45 backdrop-blur-sm"
          aria-hidden="true"
        />
        <div
          className="relative w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl sm:p-8"
          role="dialog"
          aria-modal="true"
          aria-labelledby="district-title"
        >
          <p className="mb-3 text-xs font-black uppercase tracking-[0.18em] text-blue-600">
            就學區選擇
          </p>
          <h1 id="district-title" className="mb-3 text-3xl font-black sm:text-4xl">
            你目前屬於哪一個就學區？
          </h1>
          <p className="mb-6 leading-8 text-slate-600">
            先選擇就學區，網站會直接開啟對應地區的資料頁；之後的積分試算、落點分析與學校查詢都會使用該地區資料。
          </p>
          <div className="grid max-h-[62vh] gap-3 overflow-y-auto pr-1 sm:grid-cols-2">
            {DISTRICTS.map(([code, label, areas]) => {
              const ready = code === "ct" || code === "tp";
              return (
                <button
                  key={code}
                  type="button"
                  className={`rounded-xl border p-5 text-left transition ${ready ? "border-blue-200 bg-blue-50 hover:border-blue-500 hover:bg-blue-100" : "border-slate-200 bg-slate-50 hover:border-slate-400 hover:bg-white"}`}
                  onClick={() => rememberDistrict(code)}
                >
                  <span className={`mb-2 inline-flex rounded-full px-3 py-1 text-xs font-black ${ready ? "bg-blue-600 text-white" : "bg-slate-200 text-slate-600"}`}>
                    {ready ? (code === "ct" ? "您目前所在的區域" : "基本功能已開放") : "資料建置中"}
                  </span>
                  <strong className="block text-xl">{label}</strong>
                  <span className="mt-1 block text-sm leading-6 text-slate-600">{areas}</span>
                </button>
              );
            })}
          </div>
        </div>
      </section>
    </main>
  );
}

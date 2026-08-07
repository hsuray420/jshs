"use client";

export default function Home() {
  const rememberDistrict = (district: string) => {
    const expires = new Date(Date.now() + 180 * 864e5).toUTCString();
    document.cookie = `jshs_district=${encodeURIComponent(district)}; expires=${expires}; path=/; SameSite=Lax`;
    window.location.href = "/jshs/jshs.html";
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
            先選擇就學區，網站會先記住你的地區並留在首頁；之後進入積分試算、落點分析與學校查詢時再套用。
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              className="rounded-xl border border-blue-200 bg-blue-50 p-5 text-left transition hover:border-blue-500 hover:bg-blue-100"
              onClick={() => rememberDistrict("ct")}
            >
              <span className="mb-2 inline-flex rounded-full bg-blue-600 px-3 py-1 text-xs font-black text-white">
                可使用
              </span>
              <strong className="block text-xl">中投區</strong>
              <span className="mt-1 block text-sm leading-6 text-slate-600">
                臺中市、南投縣與共同就學區資料
              </span>
            </button>
            {["北部區域", "南部區域", "東部與離島"].map((name) => (
              <button
                key={name}
                type="button"
                className="rounded-xl border border-slate-200 bg-slate-50 p-5 text-left text-slate-500"
                disabled
              >
                <span className="mb-2 inline-flex rounded-full bg-slate-200 px-3 py-1 text-xs font-black text-slate-600">
                  即將開放
                </span>
                <strong className="block text-xl">{name}</strong>
                <span className="mt-1 block text-sm leading-6">資料建置中</span>
              </button>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}

const targetDate = new Date("2027-05-16T08:00:00").getTime();

function updateCountdown() {
    const daysEl = document.getElementById("days");
    const hoursEl = document.getElementById("hours");
    const minutesEl = document.getElementById("minutes");
    const secondsEl = document.getElementById("seconds");
    if (!daysEl || !hoursEl || !minutesEl || !secondsEl) return;
    const now = new Date().getTime();
    const distance = targetDate - now;

    if (distance < 0) {
        daysEl.innerText = "00";
        hoursEl.innerText = "00";
        minutesEl.innerText = "00";
        secondsEl.innerText = "00";
        return;
    }

    const days = Math.floor(distance / (1000 * 60 * 60 * 24));
    const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((distance % (1000 * 60)) / 1000);

    daysEl.innerText = days.toString().padStart(2, '0');
    hoursEl.innerText = hours.toString().padStart(2, '0');
    minutesEl.innerText = minutes.toString().padStart(2, '0');
    secondsEl.innerText = seconds.toString().padStart(2, '0');
}

updateCountdown();
setInterval(updateCountdown, 1000);

const formModal = document.getElementById('pathwayFormModal');
const formFrame = document.getElementById('pathwayFormFrame');
const formOpen = document.getElementById('pathwayFormOpen');
const siteAd = document.getElementById('siteAd');

function closePathwayForm() {
    if (!formModal) return;
    formModal.hidden = true;
    document.body.classList.remove('modal-open');
    if (formFrame) formFrame.replaceChildren();
}

async function loadPublicConfig() {
    try {
        const response = await fetch('/api/site-config', { headers: { 'accept': 'application/json' } });
        if (!response.ok) return;
        const config = await response.json();
        if (formOpen && config.pathway_form_url) {
            formOpen.dataset.formUrl = config.pathway_form_url;
        }
        if (siteAd && config.google_ads_enabled === '1' && config.google_ads_client && config.google_ads_slot) {
            const client = String(config.google_ads_client).replace(/[^a-zA-Z0-9-]/g, '');
            const slot = String(config.google_ads_slot).replace(/[^0-9]/g, '');
            siteAd.hidden = false;
            const ad = siteAd.querySelector('.adsbygoogle');
            if (ad) {
                ad.dataset.adClient = client;
                ad.dataset.adSlot = slot;
                const script = document.createElement('script');
                script.async = true;
                script.crossOrigin = 'anonymous';
                script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${encodeURIComponent(client)}`;
                document.head.appendChild(script);
                script.addEventListener('load', () => {
                    try { (window.adsbygoogle = window.adsbygoogle || []).push({}); } catch (_) {}
                });
            }
        }
    } catch (_) {}
}

if (formOpen) {
    formOpen.addEventListener('click', () => {
        if (!formModal || !formFrame) return;
        const url = formOpen.dataset.formUrl;
        formModal.hidden = false;
        document.body.classList.add('modal-open');
        if (url) {
            const iframe = document.createElement('iframe');
            iframe.src = url;
            iframe.title = '我要讀哪裡？方向探索表單';
            iframe.loading = 'lazy';
            iframe.referrerPolicy = 'strict-origin-when-cross-origin';
            formFrame.appendChild(iframe);
        } else {
            formFrame.innerHTML = '<div class="form-empty">管理員尚未設定第三方表單，請稍後再試。</div>';
        }
    });
}

document.querySelectorAll('[data-form-close]').forEach((element) => element.addEventListener('click', closePathwayForm));
document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') closePathwayForm();
});
loadPublicConfig();

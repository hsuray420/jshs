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

async function initLineFloatingLink() {
    const link = document.getElementById('lineFloatingLink');
    if (!link) return;
    try {
        const response = await fetch('/api/site-config/', { headers: { accept: 'application/json' } });
        if (response.ok) {
            const config = await response.json();
            if (config.official_line_url) {
                link.href = config.official_line_url;
                link.target = '_blank';
                link.rel = 'noopener noreferrer';
                return;
            }
        }
    } catch (_) {}
    link.addEventListener('click', (event) => {
        event.preventDefault();
        alert('後台尚未設定 LINE 官方帳號連結。');
    });
}

initLineFloatingLink();

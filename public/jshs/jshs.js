const targetDate = new Date("2027-05-16T08:00:00").getTime();
const DISTRICTS = {
    tp: { label: '基北區', areas: '臺北市、新北市、基隆市', ready: true },
    ilan: { label: '宜蘭區', areas: '宜蘭縣' },
    'taoyuan-lienchiang': { label: '桃連區', areas: '桃園市、連江縣' },
    'hsinchu-miaoli': { label: '竹苗區', areas: '新竹市、新竹縣、苗栗縣' },
    ct: { label: '中投區', areas: '臺中市、南投縣', ready: true },
    changhua: { label: '彰化區', areas: '彰化縣' },
    yunlin: { label: '雲林區', areas: '雲林縣' },
    chiayi: { label: '嘉義區', areas: '嘉義市、嘉義縣' },
    tainan: { label: '臺南區', areas: '臺南市' },
    kaohsiung: { label: '高雄區', areas: '高雄市' },
    pingtung: { label: '屏東區', areas: '屏東縣' },
    hualien: { label: '花蓮區', areas: '花蓮縣' },
    taitung: { label: '臺東區', areas: '臺東縣' },
    penghu: { label: '澎湖區', areas: '澎湖縣' },
    kinmen: { label: '金門區', areas: '金門縣' }
};

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

function updateDistrictUI(district) {
    const label = DISTRICTS[district]?.label || '';
    const status = document.getElementById('districtStatus');
    const mini = document.getElementById('districtMini');
    const miniLabel = document.querySelector('[data-district-mini-label]');
    document.querySelectorAll('[data-district-choice]').forEach(choice => {
        choice.classList.toggle('is-selected', choice.dataset.districtChoice === district);
    });
    if (status) {
        status.textContent = label ? `目前已選擇：${label}` : '尚未選擇就學區';
    }
    if (mini && miniLabel) {
        mini.hidden = !label;
        miniLabel.textContent = label;
    }
}

function renderDistrictChoices() {
    const entries = Object.entries(DISTRICTS);
    const modalGrid = document.querySelector('[data-district-choice-grid]');
    const regionGrid = document.querySelector('[data-district-region-grid]');
    const card = (code, district, compact = false) => {
        const ready = district.ready;
        return `<button class="${compact ? 'region-card' : 'district-choice'} ${ready ? 'is-ready' : ''}" type="button" data-district-choice="${code}" data-district-label="${district.label}">
            <span>${ready ? (code === 'ct' ? '您目前所在的區域' : '基本功能已開放') : '資料建置中'}</span>
            <strong>${district.label}</strong>
            <small>${district.areas}</small>
        </button>`;
    };
    if (modalGrid) modalGrid.innerHTML = entries.map(([code, district]) => card(code, district)).join('');
    if (regionGrid) regionGrid.innerHTML = entries.map(([code, district]) => card(code, district, true)).join('');
}

function openDistrictModal() {
    const modal = document.getElementById('districtModal');
    if (!modal) return;
    modal.hidden = false;
    modal.classList.remove('is-minimizing');
    modal.setAttribute('aria-hidden', 'false');
}

function closeDistrictModal() {
    const modal = document.getElementById('districtModal');
    if (!modal) return;
    modal.classList.add('is-minimizing');
    modal.setAttribute('aria-hidden', 'true');
    window.setTimeout(() => {
        modal.hidden = true;
        modal.classList.remove('is-minimizing');
    }, 240);
}

function chooseDistrict(district) {
    updateDistrictUI(district);
    window.location.href = `/it_hs/${district}/`;
}

function initDistrictPicker() {
    renderDistrictChoices();
    const selected = '';
    updateDistrictUI(selected);
    if (!selected) {
        openDistrictModal();
    } else {
        const modal = document.getElementById('districtModal');
        if (modal) {
            modal.hidden = true;
            modal.setAttribute('aria-hidden', 'true');
        }
    }

    document.querySelectorAll('[data-district-choice]').forEach(choice => {
        choice.addEventListener('click', event => {
            event.preventDefault();
            const district = choice.dataset.districtChoice;
            if (district) chooseDistrict(district);
        });
    });

    document.querySelectorAll('[data-district-change], .nav-cta').forEach(control => {
        control.addEventListener('click', event => {
            event.preventDefault();
            openDistrictModal();
        });
    });
}

function initPathwayModal() {
    const modal = document.getElementById('pathwayModal');
    const body = document.getElementById('pathwayModalBody');
    if (!modal || !body) return;

    const open = async () => {
        modal.classList.add('active');
        modal.setAttribute('aria-hidden', 'false');
        try {
            const response = await fetch('/api/site-config/', { headers: { accept: 'application/json' } });
            const config = response.ok ? await response.json() : {};
            if (config.pathway_form_url && !body.querySelector('iframe')) {
                body.innerHTML = `<iframe title="我要讀哪裡表單" src="${config.pathway_form_url}" loading="lazy"></iframe>`;
            }
        } catch (_) {}
    };

    const close = () => {
        modal.classList.remove('active');
        modal.setAttribute('aria-hidden', 'true');
    };

    document.querySelectorAll('[data-pathway-open]').forEach(control => {
        control.addEventListener('click', open);
    });
    document.querySelectorAll('[data-pathway-close]').forEach(control => {
        control.addEventListener('click', close);
    });
    document.addEventListener('keydown', event => {
        if (event.key === 'Escape') close();
    });
}

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
initDistrictPicker();
initPathwayModal();

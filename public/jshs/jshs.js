const DISTRICTS = [
    ['tp', '基北區', '臺北市、新北市、基隆市', 'north'], ['ilan', '宜蘭區', '宜蘭縣', 'east'],
    ['taoyuan-lienchiang', '桃連區', '桃園市、連江縣', 'north'], ['hsinchu-miaoli', '竹苗區', '新竹市、新竹縣、苗栗縣', 'north'],
    ['ct', '中投區', '臺中市、南投縣', 'central'], ['changhua', '彰化區', '彰化縣', 'central'],
    ['yunlin', '雲林區', '雲林縣', 'south'], ['chiayi', '嘉義區', '嘉義市、嘉義縣', 'south'], ['tainan', '臺南區', '臺南市', 'south'],
    ['kaohsiung', '高雄區', '高雄市', 'south'], ['pingtung', '屏東區', '屏東縣', 'south'], ['hualien', '花蓮區', '花蓮縣', 'east'],
    ['taitung', '臺東區', '臺東縣', 'east'], ['penghu', '澎湖區', '澎湖縣', 'east'], ['kinmen', '金門區', '金門縣', 'east']
].map(([code, label, areas, region]) => ({ code, label, areas, region }));

let activeFilter = 'all';
let requestedTarget = 'schools';
const districtMap = Object.fromEntries(DISTRICTS.map(district => [district.code, district]));

function districtButton(district, compact = false) {
    return `<button type="button" class="district-card ${compact ? 'compact' : ''}" data-select-district="${district.code}">
        <span class="district-card-top">${district.region === 'east' ? '東部與離島' : district.region === 'central' ? '中部' : district.region === 'south' ? '南部' : '北部'} <i>全區查詢</i></span>
        <strong>${district.label}</strong><small>${district.areas}</small><b>${compact ? '選擇此區' : '查詢學校'} <em>→</em></b>
    </button>`;
}

function renderDistricts() {
    const grid = document.getElementById('districtGrid');
    const search = document.getElementById('districtSearch')?.value.trim().toLowerCase() || '';
    if (!grid) return;
    const results = DISTRICTS.filter(district => (activeFilter === 'all' || district.region === activeFilter) && `${district.label}${district.areas}`.toLowerCase().includes(search));
    grid.innerHTML = results.length ? results.map(district => districtButton(district)).join('') : '<p class="empty-state">找不到相符的就學區，請改用區域名稱或縣市搜尋。</p>';
    bindDistrictButtons(grid);
}

function bindDistrictButtons(container) {
    container.querySelectorAll('[data-select-district]').forEach(button => button.addEventListener('click', () => chooseDistrict(button.dataset.selectDistrict)));
}

function updateSelectionStatus() {
    const selected = districtMap[localStorage.getItem('jshs_district')];
    const status = document.getElementById('selectionStatus');
    if (status) status.textContent = selected ? `目前選擇：${selected.label}，可隨時重新選擇。` : '尚未選擇就學區';
}

function openDistrictModal(target = 'schools') {
    requestedTarget = target;
    const modal = document.getElementById('districtModal');
    const intro = document.getElementById('modalIntro');
    const targetLabels = { schools: '學校查詢', calculator: '積分試算', analysis: '志願分析' };
    if (!modal) return;
    if (intro) intro.textContent = `選擇後會直接開啟該區的${targetLabels[target]}。`;
    document.getElementById('modalDistricts').innerHTML = DISTRICTS.map(district => districtButton(district, true)).join('');
    bindDistrictButtons(document.getElementById('modalDistricts'));
    modal.hidden = false;
    document.body.classList.add('modal-open');
    modal.querySelector('.modal-close').focus();
}

function closeDistrictModal() {
    document.getElementById('districtModal').hidden = true;
    document.body.classList.remove('modal-open');
}

function chooseDistrict(code) {
    if (!districtMap[code]) return;
    localStorage.setItem('jshs_district', code);
    const hash = requestedTarget === 'schools' ? 'schools' : requestedTarget;
    const destination = hash === 'calculator' ? '/tools' : hash === 'analysis' ? '/planner' : '/schools';
    window.location.assign(`${destination}?district=${encodeURIComponent(code)}`);
}

function initInteractions() {
    document.querySelectorAll('[data-open-district]').forEach(button => button.addEventListener('click', () => openDistrictModal(button.dataset.target)));
    document.querySelectorAll('[data-close-district]').forEach(button => button.addEventListener('click', closeDistrictModal));
    document.getElementById('districtSearch')?.addEventListener('input', renderDistricts);
    document.querySelectorAll('[data-region-filter]').forEach(button => button.addEventListener('click', () => {
        activeFilter = button.dataset.regionFilter;
        document.querySelectorAll('[data-region-filter]').forEach(item => item.classList.toggle('active', item === button));
        renderDistricts();
    }));
    document.addEventListener('keydown', event => { if (event.key === 'Escape' && !document.getElementById('districtModal').hidden) closeDistrictModal(); });
}

async function initLineLink() {
    const link = document.getElementById('lineFloatingLink');
    if (!link) return;
    try {
        const response = await fetch('/api/site-config/', { headers: { accept: 'application/json' } });
        const config = response.ok ? await response.json() : {};
        if (config.official_line_url) { link.href = config.official_line_url; link.target = '_blank'; link.rel = 'noopener noreferrer'; return; }
    } catch (_) {}
    link.hidden = true;
}

renderDistricts();
updateSelectionStatus();
initInteractions();
initLineLink();

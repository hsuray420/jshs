function toggleMobileMenu() {
    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    const mobileMenu = document.getElementById('mobileMenu');
    if (!mobileMenuBtn || !mobileMenu) return;
    mobileMenuBtn.addEventListener('click', () => {
        mobileMenu.classList.toggle('hidden');
    });
}

function getSelectedDistrict() {
    const pathParts = window.location.pathname.split('/').filter(Boolean);
    const districtIndex = pathParts.indexOf('it_hs');
    const pathDistrict = districtIndex >= 0 ? pathParts[districtIndex + 1] : '';
    const queryDistrict = new URLSearchParams(window.location.search).get('district');
    return ['ct', 'tp'].includes(pathDistrict)
        ? pathDistrict
        : (['ct', 'tp'].includes(queryDistrict) ? queryDistrict : 'ct');
}

const DISTRICT_RULES = {
    ct: { label: '基北區', totalMax: 100, examMax: 30, examUnit: '111 點', otherMax: 70 },
    tp: { label: '基北區', totalMax: 108, examMax: 36, examUnit: '36 分', otherMax: 72 }
};

function getDistrictRules() {
    return DISTRICT_RULES[getSelectedDistrict()] || DISTRICT_RULES.ct;
}

const topicPages = {
    'program-general': { eyebrow: '學制介紹 / 普通高中', title: '普通高中：把學科基礎走得更穩。', intro: '普通高中以學科學習為主，適合想累積國英數、社會與自然基礎，並保留大學多元升學選擇的學生。', points: [['學習重點', '以核心學科、閱讀理解與探究能力為主要訓練。'], ['適合特質', '喜歡系統整理知識，能長期投入學科準備。'], ['下一步', '比較學校課程、特色班與通勤距離，再安排志願。']], action: '查看基北區學校', actionPage: 'schools' },
    'program-vocational': { eyebrow: '學制介紹 / 技術型高中', title: '技術型高中：在實作裡找到專業。', intro: '技術型高中強調專業科目、實作課程與證照能力，讓學生在高中階段逐步建立可延伸的技術基礎。', points: [['學習重點', '專業課程、實習、專題與技術證照並行。'], ['適合特質', '對資訊、設計、餐飲、機械或商管等領域有興趣。'], ['下一步', '從科別與校內設備開始比較，確認自己想投入的方向。']], action: '瀏覽技術型高中', actionPage: 'schools' },
    'program-comprehensive': { eyebrow: '學制介紹 / 綜合高中', title: '綜合高中：先探索，也保留彈性。', intro: '綜合高中結合普通教育與職業教育，適合還在認識自己興趣、希望保留更多選擇的學生。', points: [['學習重點', '透過多元選修與試探課程，逐步找到適合的方向。'], ['適合特質', '不急著替未來定案，希望在學習中慢慢確認興趣。'], ['下一步', '了解各校的學程設計與轉銜安排，再選擇合適環境。']], action: '比較學制差異', actionPage: 'overview' },
    'admission-exempt': { eyebrow: '入學管道 / 免試入學', title: '免試入學：用志願與積分完成分發。', intro: '基北區多數學生透過免試入學選填志願，依志願序、多元表現、會考成績與比序規則辦理分發。', points: [['先確認資格', '依當年度簡章確認就學區、報名身分與時程。'], ['整理志願', '先從學校與科別的適配度，再考量通勤與錄取機會。'], ['試算積分', '輸入目前資料，掌握可調整的項目與總分。']], action: '開始積分試算', actionPage: 'calculator' },
    'admission-special': { eyebrow: '入學管道 / 特殊選才', title: '特殊選才：用你的特色爭取機會。', intro: '特色招生或特殊選才通常有獨立條件與流程，可能包含術科、面試、作品或特定能力認定。', points: [['確認簡章', '每一校、每一班條件不同，必須以當年度公告為準。'], ['準備佐證', '及早整理作品、競賽紀錄、證照或其他申請資料。'], ['保留主線', '同時規劃免試入學，讓選擇更完整。']], action: '查看常見問題', actionPage: 'faq' },
    'admission-direct': { eyebrow: '入學管道 / 獨招與直升', title: '獨招與直升：為特定需求保留選項。', intro: '獨立招生與直升適用條件、招生學校及日程各不相同，建議將它們當作升學規劃中的個別選擇。', points: [['獨立招生', '由學校依簡章設定報名、甄選與錄取方式。'], ['直升入學', '通常適用於特定學校體系或符合資格的學生。'], ['安排時程', '比對各管道報名與放榜日，避免彼此衝突。']], action: '下載招生資料', actionPage: 'download' }
};

function renderTopic(page) {
    const topic = topicPages[page];
    if (!topic) return;
    document.getElementById('topicEyebrow').textContent = topic.eyebrow;
    document.getElementById('topicTitle').textContent = topic.title;
    document.getElementById('topicIntro').textContent = topic.intro;
    document.getElementById('topicPoints').innerHTML = topic.points.map(([title, copy], index) => `<article class="topic-point"><span>0${index + 1}</span><h3>${title}</h3><p>${copy}</p></article>`).join('');
    const action = document.getElementById('topicAction');
    action.textContent = topic.action;
    action.dataset.page = topic.actionPage;
}

function showPage(page) {
    const sections = document.querySelectorAll('[data-page-section]');
    const routeControls = document.querySelectorAll('[data-page]');
    const pages = Array.from(sections).map(section => section.dataset.pageSection);
    const isTopic = Boolean(topicPages[page]);
    const targetPage = isTopic ? 'topic' : (pages.includes(page) ? page : 'overview');
    if (isTopic) renderTopic(page);

    sections.forEach(section => {
        section.classList.toggle('active', section.dataset.pageSection === targetPage);
    });

    routeControls.forEach(control => {
        control.classList.toggle('active', control.dataset.page === targetPage);
    });

    const mobileMenu = document.getElementById('mobileMenu');
    if (mobileMenu) mobileMenu.classList.add('hidden');
    history.replaceState(null, '', `#${targetPage}`);
    if (isTopic) history.replaceState(null, '', `#${page}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function initMegaMenus() {
    const menus = document.querySelectorAll('.mega-menu');
    menus.forEach(menu => {
        const trigger = menu.querySelector('.mega-menu-trigger');
        trigger.addEventListener('click', event => {
            event.stopPropagation();
            const opening = !menu.classList.contains('is-open');
            menus.forEach(other => { other.classList.remove('is-open'); other.querySelector('.mega-menu-trigger').setAttribute('aria-expanded', 'false'); });
            if (opening) { menu.classList.add('is-open'); trigger.setAttribute('aria-expanded', 'true'); }
        });
        menu.querySelectorAll('[data-page]').forEach(item => item.addEventListener('click', () => {
            menu.classList.remove('is-open');
            trigger.setAttribute('aria-expanded', 'false');
        }));
    });
    document.addEventListener('click', () => menus.forEach(menu => { menu.classList.remove('is-open'); menu.querySelector('.mega-menu-trigger').setAttribute('aria-expanded', 'false'); }));
    document.addEventListener('keydown', event => { if (event.key === 'Escape') document.dispatchEvent(new MouseEvent('click')); });
}

function initOverviewCards() {
    const cards = document.querySelectorAll('.overview-card[data-overview-target]');
    const popup = document.getElementById('overview-detail-popup');
    const popupPill = popup?.querySelector('.overview-popup-pill');
    const popupTitle = popup?.querySelector('.overview-popup-title');
    const popupContent = popup?.querySelector('.overview-popup-content');
    const closeButtons = popup?.querySelectorAll('[data-popup-close]');
    if (!cards.length || !popup || !popupPill || !popupTitle || !popupContent) return;

    const overviewContent = {
        'overview-general': {
            pill: '普通高中',
            title: '適合重視學科基礎，並希望保留升學選擇空間的學生',
            steps: [
                {
                    title: '學習特色',
                    text: '以國文、英文、數學、自然與社會等學科為主，課程節奏穩定，適合培養長期學習習慣。一般來說，學校會安排較完整的學科訓練，讓學生在考試與進一步升學上更有準備。'
                },
                {
                    title: '升學路徑',
                    text: '學生可透過大學繁星、個人申請、分發等方式，為未來規劃更寬廣的升學選擇。若未來想走學術性、研究性或更一般性的高等教育，這條路通常最穩定。'
                },
                {
                    title: '適合的孩子',
                    text: '如果你喜歡閱讀、討論、整理知識，並希望先建立扎實學科基礎，普通高中會是一個穩定選擇。這種學生通常能接受較長時間的學科累積與自我安排。'
                },
                {
                    title: '建議你這樣想',
                    text: '如果你還沒確定未來要走哪一條路，但想先保留多種選擇，普通高中非常適合。它不會把你限制在某一種職涯方向上。'
                }
            ]
        },
        'overview-vocational': {
            pill: '技術型高中 / 高職',
            title: '適合已經有明確職涯方向，想提早培養專業技能的學生',
            steps: [
                {
                    title: '學習特色',
                    text: '課程強調實作、專業科目與產業需求，透過實習、證照、競賽與專題來培養實務能力。這類學校通常能把「做得到」的能力放在很前面，讓學生更快建立職場競爭力。'
                },
                {
                    title: '升學與出路',
                    text: '除了就業，也可選擇科技大學、技優甄審與進一步深造，路徑相當多元。對很多孩子來說，高職其實是一條很有實際感、也很能讓人生更早上軌道的路。'
                },
                {
                    title: '適合的孩子',
                    text: '如果你對機械、資訊、餐飲、設計或其他實作領域有興趣，且想更早接觸專業內容，高職是非常值得考慮的方向。這種學生通常不太介意實作多於紙筆，並希望早點把能力養成。'
                },
                {
                    title: '建議你這樣想',
                    text: '如果你已經知道自己喜歡「動手做」的工作，或者對某一種技術有明顯興趣，這個選項很值得深入比較。它的優勢是能讓你更快看到成果。'
                }
            ]
        },
        'overview-comprehensive': {
            pill: '綜合高中',
            title: '適合想同時兼顧升學與職涯探索，並保有多元選擇空間的學生',
            steps: [
                {
                    title: '學習特色',
                    text: '結合普通與職業教育，提供多元選修、專題實作與特色課程，協助學生在探索興趣後再做決定。這種學制通常比較適合那些還在試探自己、想同時保留理論與實作能力的人。'
                },
                {
                    title: '升學與轉銜',
                    text: '學生不必一開始就鎖定唯一方向，仍可保有升學機會，也能在校內逐步發現自己的優勢與熱情。對想先探索再決定的人來說，這條路會比較有彈性。'
                },
                {
                    title: '適合的孩子',
                    text: '如果你想先了解自己、擁有較高彈性，也希望在學習中兼顧理論與實作，綜合高中會是很好的過渡選擇。這種孩子通常願意試不同類型的課程與活動。'
                },
                {
                    title: '建議你這樣想',
                    text: '如果你對未來還沒有非常明確的答案，但希望不要把自己限制在單一方向，綜合高中能提供比較寬廣的試探空間。'
                }
            ]
        }
    };

    const renderOverviewPopup = (targetId) => {
        const content = overviewContent[targetId] || overviewContent['overview-general'];
        popupPill.textContent = content.pill;
        popupTitle.textContent = content.title;
        popupContent.innerHTML = content.steps.map(step => `
            <div class="overview-step">
                <h5>${step.title}</h5>
                <p>${step.text}</p>
            </div>
        `).join('');
    };

    const showPopup = (targetId) => {
        cards.forEach(card => {
            const isActive = card.dataset.overviewTarget === targetId;
            card.classList.toggle('is-active', isActive);
            card.setAttribute('aria-pressed', isActive ? 'true' : 'false');
        });
        renderOverviewPopup(targetId);
        popup.classList.add('active');
        popup.setAttribute('aria-hidden', 'false');
    };

    const hidePopup = () => {
        popup.classList.remove('active');
        popup.setAttribute('aria-hidden', 'true');
    };

    cards.forEach(card => {
        card.addEventListener('click', () => {
            showPopup(card.dataset.overviewTarget);
        });
    });

    closeButtons.forEach(button => {
        button.addEventListener('click', hidePopup);
    });

    popup.addEventListener('click', (event) => {
        if (event.target === popup || event.target.hasAttribute('data-popup-close')) {
            hidePopup();
        }
    });

    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && popup.classList.contains('active')) {
            hidePopup();
        }
    });
}

function initHomeSections() {
    const parentSection = document.getElementById('home-parent-section');
    const studentSection = document.getElementById('home-student-section');
    const roleBtns = document.querySelectorAll('[data-role-btn]');
    
    if (!parentSection || !studentSection) return;

    function setRole(role) {
        // 更新 UI 顯示
        if (role === 'parent') {
            parentSection.classList.remove('hidden');
            studentSection.classList.add('hidden');
        } else if (role === 'student') {
            parentSection.classList.add('hidden');
            studentSection.classList.remove('hidden');
        } else {
            parentSection.classList.remove('hidden');
            studentSection.classList.remove('hidden');
        }

        // 更新按鈕樣式
        roleBtns.forEach(btn => {
            const btnRole = btn.dataset.roleBtn;
            if (btnRole === role) {
                btn.classList.add('bg-neo-accent', 'text-white');
                btn.classList.remove('border', 'border-neo-accent', 'text-neo-accent', 'bg-neo-blueGray');
            } else {
                if (btnRole === 'all') {
                    btn.classList.add('bg-neo-blueGray', 'text-neo-text');
                    btn.classList.remove('bg-neo-accent', 'text-white');
                } else {
                    btn.classList.add('border', 'border-neo-accent', 'text-neo-accent');
                    btn.classList.remove('bg-neo-accent', 'text-white');
                }
            }
        });
    }

    // 監聽按鈕點擊
    roleBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const role = btn.dataset.roleBtn;
            setRole(role);
        });
    });

    // 讀取 URL 參數 ?role=xxx
    const params = new URLSearchParams(window.location.search);
    const roleParam = params.get('role');
    if (roleParam === 'parent' || roleParam === 'student') {
        setRole(roleParam);
    } else {
        setRole('all');
    }
}

function initPageRouter() {
    const routeControls = document.querySelectorAll('[data-page]');
    routeControls.forEach(control => {
        control.addEventListener('click', () => {
            showPage(control.dataset.page);
        });
    });

    initOverviewCards();
    initHomeSections();
    initMegaMenus();

    const initialPage = window.location.hash.replace('#', '') || 'overview';
    showPage(initialPage);
}

async function initLineFloatingLink() {
    const links = Array.from(document.querySelectorAll('[data-line-link], #lineFloatingLink'));
    if (!links.length) return;
    const uniqueLinks = [...new Set(links)];
    const applyOfficialLineUrl = (url) => {
        uniqueLinks.forEach(link => {
            link.href = url;
            link.target = '_blank';
            link.rel = 'noopener noreferrer';
            link.classList.add('is-ready');
        });
    };
    try {
        const response = await fetch('/api/site-config/', { headers: { accept: 'application/json' } });
        if (response.ok) {
            const config = await response.json();
            if (config.official_line_url) {
                applyOfficialLineUrl(config.official_line_url);
                return;
            }
        }
    } catch (_) {}

    uniqueLinks.forEach(link => {
        link.addEventListener('click', (event) => {
            event.preventDefault();
            alert('後台尚未設定 LINE 官方帳號連結。請到後台「網站設定」填入 LINE 官方帳號連結。');
        });
    });
}

function updateProgressBar(id, value, max = 100) {
    const el = document.getElementById(id);
    if (!el) return;
    el.style.width = `${Math.min(100, (value / max) * 100)}%`;
}

function getCurrentScoreSnapshot() {
    const totalPoints = Number(document.getElementById('resPoints')?.textContent || 0);
    const pts111 = Number(document.getElementById('resPcts')?.textContent || 0);
    return { totalPoints, pts111 };
}

function getUserAnalysisBand(totalPoints) {
    if (totalPoints >= 90) return { label: '頂標', score: 4 };
    if (totalPoints >= 80) return { label: '前段', score: 3 };
    if (totalPoints >= 70) return { label: '中段', score: 2 };
    if (totalPoints >= 60) return { label: '後段', score: 1 };
    return { label: '保底', score: 0 };
}

function getSchoolDifficultyTier(rank) {
    const parsedRank = Number(rank) || 9999;
    if (parsedRank <= 10) return { label: '頂標', score: 4 };
    if (parsedRank <= 25) return { label: '前段', score: 3 };
    if (parsedRank <= 50) return { label: '中段', score: 2 };
    if (parsedRank <= 100) return { label: '後段', score: 1 };
    return { label: '保底', score: 0 };
}

function getAnalysisRecommendation(userBand, schoolTier) {
    if (schoolTier.score === userBand.score) {
        return {
            status: '適中',
            badgeClass: 'is-balanced',
            detail: '你目前分數與這間學校的位階相近，屬於適中志願，很適合納入志願名單中段。'
        };
    }

    if (schoolTier.score < userBand.score) {
        return {
            status: '穩定',
            badgeClass: 'is-reachable',
            detail: '這間學校門檻低於你目前的分數能力，屬於穩妥/保底志願，建議保留在名單後段避免落榜。'
        };
    }

    return {
        status: '挑戰',
        badgeClass: 'is-challenge',
        detail: '這間學校門檻高於你目前的分數能力，屬於高志願/挑戰項目，可以放在前面衝看看，但不建議當唯一目標。'
    };
}

function renderAnalysis() {
    const summary = document.getElementById('analysisSummary');
    const results = document.getElementById('analysisResults');
    const badge = document.getElementById('analysisScoreBadge');
    const scope = document.getElementById('analysisScope')?.value || 'all';
    const limit = Number(document.getElementById('analysisLimit')?.value || 6);

    if (!summary || !results) return;

    const { totalPoints } = getCurrentScoreSnapshot();
    const userBand = getUserAnalysisBand(totalPoints);
    if (badge) {
        badge.textContent = `目前分數：${totalPoints} / 100`;
    }

    if (!totalPoints || totalPoints <= 0) {
        summary.innerHTML = '先完成積分試算，這裡就會依你目前的分數幫你整理出「穩定 / 適中 / 挑戰」的學校落點。';
        results.innerHTML = '';
        return;
    }

    const relevantSchools = allSchools.filter((school) => {
        if (scope === '高中') return school['學制分類'] === '高中';
        if (scope === '綜合高中') return school['學制分類'] === '綜合高中';
        if (scope === '高職') return school['學制分類'] === '高中職';
        return true;
    });

    if (!relevantSchools.length) {
        summary.innerHTML = '這個分析範圍目前沒有學校資料，請試著切換到「全部學校」。';
        results.innerHTML = '';
        return;
    }

    const rankedSchools = [...relevantSchools]
        .map((school) => {
            const tier = getSchoolDifficultyTier(school['排名']);
            const closeness = Math.abs(tier.score - userBand.score);
            return { school, tier, closeness };
        })
        .sort((a, b) => {
            if (a.closeness !== b.closeness) return a.closeness - b.closeness;
            return (Number(a.school['排名']) || 9999) - (Number(b.school['排名']) || 9999);
        })
        .slice(0, limit);

    const counts = { 挑戰: 0, 適中: 0, 穩定: 0 };
    rankedSchools.forEach(({ tier }) => {
        const rec = getAnalysisRecommendation(userBand, tier);
        counts[rec.status] = (counts[rec.status] || 0) + 1;
    });

    summary.innerHTML = `你目前的估算分數 <strong>${totalPoints} / 100</strong> 落在「${userBand.label}」區間。以下依「與你程度最接近」優先列出前 ${rankedSchools.length} 所：穩定 ${counts['穩定'] || 0} 所、適中 ${counts['適中'] || 0} 所、挑戰 ${counts['挑戰'] || 0} 所。建議志願序前段放挑戰、中段放適中、後段放穩定。`;

    results.innerHTML = rankedSchools.map(({ school, tier }) => {
        const recommendation = getAnalysisRecommendation(userBand, tier);
        const scoreText = school['最低錄取分數'] || '暫無公開分數';
        const quotaText = school['簡章招生名額'] || school['招生名額'] || '待公告';
        const schoolName = escapeHtml(school['學校名稱']);
        const schoolArea = escapeHtml(school['區'] || school['縣市']);
        return `
            <article class="panel-card analysis-card ${recommendation.badgeClass}">
                <div class="analysis-card-head">
                    <div>
                        <h3 class="analysis-card-title">${schoolName}</h3>
                        <p class="analysis-card-subtitle">#${escapeHtml(school['排名'])} · ${escapeHtml(school['學制分類'])}</p>
                    </div>
                    <span class="analysis-badge ${recommendation.badgeClass}">${recommendation.status}</span>
                </div>
                <div class="analysis-meta">
                    <span>你的區間：${userBand.label}</span>
                    <span>學校難度：${tier.label}</span>
                </div>
                <p>${recommendation.detail}</p>
                <div class="analysis-foot">
                    <span>錄取分數：${escapeHtml(scoreText)}</span>
                    <span>簡章名額：${escapeHtml(quotaText)}</span>
                    <span>區域：${schoolArea}</span>
                </div>
            </article>
        `;
    }).join('');
}

function computeMultiLearningParts() {
    if (getSelectedDistrict() === 'tp') {
        const domainCount = ['bal_domain_health', 'bal_domain_arts', 'bal_domain_general']
            .map(id => document.getElementById(id))
            .filter(el => el && el.checked).length;
        const balanced = Math.min(21, domainCount * 7);
        const service = Math.min(15, Math.max(0, Number(document.getElementById('mor_service_learning')?.value) || 0));
        return { bal: balanced, mor: service, nod: 0, awd: 0 };
    }

    // 均衡學習
    const domains = ['bal_domain_health','bal_domain_arts','bal_domain_general','bal_domain_tech']
        .map(id => document.getElementById(id))
        .filter(el => el && el.checked).length;
    const lowIncome = document.getElementById('bal_low_income')?.checked ? 2 : 0;
    const bal = Math.min(12, domains * 3 + lowIncome);

    // 德行：社團（上限2分）+ 服務學習（上限3分）
    const clubTerms = Math.max(0, Number(document.getElementById('mor_club_terms')?.value) || 0);
    const clubPts = Math.min(2, clubTerms);
    const serviceLearning = Number(document.getElementById('mor_service_learning')?.value) || 0;
    const mor = Math.min(5, clubPts + serviceLearning);

    // 無記過
    const nod = Number(document.getElementById('nod_record')?.value) || 0;

    // 獎勵
    const majCount = Math.max(0, Number(document.getElementById('awd_major')?.value) || 0);
    const minCount = Math.max(0, Number(document.getElementById('awd_minor')?.value) || 0);
    const commCount = Math.max(0, Number(document.getElementById('awd_comm')?.value) || 0);
    const awd = Math.min(4, majCount * 3 + minCount * 1 + commCount * 0.5);

    return { bal, mor, nod, awd };
}

function getCalculationBreakdown() {
    const pref = Number(document.getElementById('prefScore')?.value) || 0;
    const localEl = document.getElementById('localScore');
    const local = localEl?.checked ? Number(localEl.value) || 0 : 0;
    const weak = Number(document.getElementById('weakScore')?.value) || 0;
    const multi = computeMultiLearningParts();
    const bal = multi.bal;
    const mor = multi.mor;
    const nod = multi.nod;
    const awd = multi.awd;
    const exam100 = Number(document.getElementById('examScoreDisplay')?.innerText) || 0;
    const pts111 = Number(document.getElementById('exam111Display')?.innerText) || 0;
    const totalPoints = getSelectedDistrict() === 'tp'
        ? pref + bal + mor + exam100
        : pref + local + weak + bal + mor + nod + awd + exam100;

    return { pref, local, weak, bal, mor, nod, awd, exam100, pts111, totalPoints };
}

function renderCalculationBreakdown() {
    const breakdownList = document.getElementById('calcBreakdownList');
    const breakdownNote = document.getElementById('calcBreakdownNote');
    if (!breakdownList) return;

    const { pref, local, weak, bal, mor, nod, awd, exam100, pts111, totalPoints } = getCalculationBreakdown();
    const items = getSelectedDistrict() === 'tp' ? [
        { label: '志願序積分', value: pref, note: '基北區可填寫 30 個志願：第 1–5 志願 36 分，之後每 5 個志願遞減，第 26–30 志願為 32 分。' },
        { label: '均衡學習', value: bal, note: '健康與體育、藝術、綜合活動三領域，每領域最高 7 分，合計上限 21 分。' },
        { label: '服務學習', value: mor, note: '每學期服務學習滿 6 小時依規定計點，服務學習上限 15 分。' },
        { label: '國中教育會考', value: exam100, note: '國文、英語、數學、社會、自然五科各最高 7 分，加上寫作測驗最高 1 分，合計上限 36 分。' },
        { label: '基北區免試總積分', value: totalPoints, note: '志願序 36 分 + 多元學習表現 36 分 + 會考 36 分，滿分 108 分。' }
    ] : [
        { label: '志願序', value: pref, note: '第 1–10 志願 30 分；第 11–20 志願 29 分；第 21–50 志願 28 分。' },
        { label: '就近入學', value: local, note: '符合目前開發區域免試/共同就學區為 10 分。' },
        { label: '扶助弱勢', value: weak, note: '一般 0 分；偏鄉／中低 1 分；低收 2 分（擇一計分）。' },
        { label: '均衡學習', value: bal, note: '各領域各 3 分，四領域共 12 分；低收入戶加 2 分。' },
        { label: '德行表現', value: mor, note: '社團（上限 2 分）+ 服務學習（上限 3 分），合計最多 5 分。' },
        { label: '無記過紀錄', value: nod, note: '無處分 6 分；銷過後無小過以上 3 分；有小過以上 0 分。' },
        { label: '獎勵紀錄', value: awd, note: '大功 3 分／次，小功 1 分／次，嘉獎 0.5 分／次，上限 4 分。' },
        { label: '會考比序積點', value: exam100, note: '五科與作文等級換算，上限 30 分。' },
        { label: '111 制比序積分', value: pts111, note: '五科分數總和 + 作文等級，上限 111 分。' },
        { label: '免試總積分', value: totalPoints, note: '以上各項加總，滿分 100 分。' }
    ];

    breakdownList.innerHTML = items.map(item => `
        <li>
            <span>${item.label}</span>
            <strong>${item.value}</strong>
        </li>
    `).join('');

    if (breakdownNote) {
        breakdownNote.innerHTML = getSelectedDistrict() === 'tp'
            ? '目前已套用基北區三大核心比序項目試算；實際仍以當年度簡章、公告與招生委員會審定為準。'
            : '本頁目前採用基北區免試入學公開說明框架做估算；實際以當年度簡章、公告與招生委員會審定為準。會考 111 制比序積分以五科分數與作文等級為基礎，會考 100 制比序積點則依各科等級換算。';
    }
}

function calculateScore() {
    const { pref, local, weak, bal, mor, nod, awd, exam100, pts111, totalPoints } = getCalculationBreakdown();

    const resPointsEl = document.getElementById('resPoints');
    const resPctsEl = document.getElementById('resPcts');
    if (resPointsEl) resPointsEl.innerText = String(totalPoints);
    if (resPctsEl) resPctsEl.innerText = String(getSelectedDistrict() === 'tp' ? exam100 : pts111);

    const d_pref = document.getElementById('d_pref'); if (d_pref) d_pref.innerText = String(pref);
    const d_local = document.getElementById('d_local'); if (d_local) d_local.innerText = String(local);
    const d_multi = document.getElementById('d_multi'); if (d_multi) d_multi.innerText = String(getSelectedDistrict() === 'tp' ? bal + mor : bal + mor + nod + awd + weak);

    updateProgressBar('bar_pref', pref, getSelectedDistrict() === 'tp' ? 36 : 30);
    updateProgressBar('bar_local', local, 10);
    updateProgressBar('bar_multi', Number(d_multi?.innerText || 0), getSelectedDistrict() === 'tp' ? 36 : 30);
    renderCalculationBreakdown();
}

function computeAllPoints() {
    // 先檢查必要輸入是否已填齊，避免錯誤或不完整的試算
    const requiredIds = ['subj_cn','subj_en','subj_math','subj_sci','subj_soc','subj_write'];
    const missing = requiredIds.find(id => {
        const el = document.getElementById(id);
        return !el || !el.value;
    });
    if (missing) {
        const first = document.getElementById(missing);
        if (first && typeof first.focus === 'function') first.focus();
        alert('請先選擇所有會考科目與作文成績，才能進行完整試算。');
        return;
    }

    // 先計算會考分數，再計算免試積分總分
    computeExamPoints();
    calculateScore();

    // 計算後將結果區滾動至中間，方便使用者檢視
    const panel = document.querySelector('.result-panel');
    if (panel && typeof panel.scrollIntoView === 'function') {
        panel.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    renderAnalysis();
    renderWishlist();
}

function computeExamPoints() {
    const subjIds = ['subj_cn','subj_en','subj_math','subj_sci','subj_soc'];
    let levelTotal = 0;
    let exam100 = 0;
    subjIds.forEach(id => {
        const el = document.getElementById(id);
        if (!el) return;
        const v = Number(el.value) || 0;
        if (v <= 0) return;
        levelTotal += v;
        if (getSelectedDistrict() === 'tp') {
            const points = { 21: 7, 18: 6, 15: 5, 12: 4, 9: 3, 6: 2, 3: 1 };
            exam100 += points[v] || 0;
        } else if (v >= 15) exam100 += 6;
        else if (v >= 6) exam100 += 4;
        else exam100 += 2;
    });
    const write = Number(document.getElementById('subj_write')?.value) || 0;
    if (getSelectedDistrict() === 'tp') {
        const writingPoints = { 6: 1, 5: 0.8, 4: 0.6, 3: 0.4, 2: 0.2, 1: 0.1 };
        exam100 = Math.min(36, exam100 + (writingPoints[write] || 0));
    } else {
        exam100 = Math.min(30, exam100);
    }
    const pts111 = Math.min(111, levelTotal + write);

    const examDisplay = document.getElementById('examScoreDisplay');
    const exam111El = document.getElementById('exam111Display');
    if (examDisplay) examDisplay.innerText = String(exam100);
    if (exam111El) exam111El.innerText = String(pts111);

}

function resetForm() {
    ['subj_cn','subj_en','subj_math','subj_sci','subj_soc','subj_write'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.selectedIndex = 0;
    });
    // 均衡學習預設為四領域皆符合（12 分）
    ['bal_domain_health','bal_domain_arts','bal_domain_general','bal_domain_tech'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.checked = true;
    });
    const low = document.getElementById('bal_low_income'); if (low) low.checked = false;

    // 德行預設
    const club = document.getElementById('mor_club_terms'); if (club) club.value = 0;
    const serv = document.getElementById('mor_service_learning'); if (serv) serv.value = '0';

    // 無記過預設
    const nod = document.getElementById('nod_record'); if (nod) nod.value = '6';

    // 獎勵預設（範例：大功1次+小功1次 => 4 分）
    const maj = document.getElementById('awd_major'); if (maj) maj.value = 1;
    const min = document.getElementById('awd_minor'); if (min) min.value = 1;
    const comm = document.getElementById('awd_comm'); if (comm) comm.value = 0;
    const localScoreEl = document.getElementById('localScore');
    if (localScoreEl) localScoreEl.checked = true;

    ['resPoints','resPcts','d_pref','d_local','d_multi'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.innerText = '0';
    });
    ['bar_pref','bar_local','bar_multi'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.style.width = '0%';
    });
    const breakdownList = document.getElementById('calcBreakdownList');
    const breakdownNote = document.getElementById('calcBreakdownNote');
    if (breakdownList) breakdownList.innerHTML = '';
    if (breakdownNote) breakdownNote.innerText = '尚未計算，請先點選「計算高中職積分」。';
    // 不在此自動計算，僅在使用者按下「計算」按鈕時執行
    renderWishlist();
}

function initCalculator() {
    const selectedDistrict = getSelectedDistrict();
    const rules = getDistrictRules();
    const isTaipei = selectedDistrict === 'tp';
    const label = document.getElementById('calculatorDistrictLabel');
    const intro = document.getElementById('calculatorDistrictIntro');
    const examTileValue = document.getElementById('examTileValue');
    const otherTileValue = document.getElementById('otherTileValue');
    const examResultUnit = document.getElementById('examResultUnit');
    const totalResultUnit = document.getElementById('totalResultUnit');
    if (label) label.textContent = `${rules.label}免試入學`;
    if (intro && isTaipei) intro.textContent = '基北區免試入學採三大核心比序：志願序、多元學習表現、國中教育會考，總分 108 分。';
    if (examTileValue) examTileValue.innerHTML = `${rules.examMax} <small>分</small>`;
    if (otherTileValue) otherTileValue.innerHTML = `${rules.otherMax} <small>分</small>`;
    if (examResultUnit) examResultUnit.textContent = `/ ${rules.examUnit}`;
    if (totalResultUnit) totalResultUnit.textContent = `/ ${rules.totalMax} 分`;
    document.querySelectorAll('[data-district-only]').forEach(card => {
        card.hidden = isTaipei && card.dataset.districtOnly === 'ct';
    });
    if (isTaipei) {
        const pref = document.getElementById('prefScore');
        if (pref) pref.innerHTML = '<option value="36">第 1–5 志願（36 分）</option><option value="35">第 6–10 志願（35 分）</option><option value="34">第 11–15 志願（34 分）</option><option value="33">第 16–20 志願（33 分）</option><option value="32">第 21–30 志願（32 分）</option>';
        const service = document.getElementById('mor_service_learning');
        if (service) service.innerHTML = Array.from({ length: 16 }, (_, index) => `<option value="${index}">${index === 0 ? '無' : `${index} 分`}</option>`).join('');
        const tech = document.getElementById('bal_domain_tech')?.closest('label');
        if (tech) tech.hidden = true;
        const low = document.getElementById('bal_low_income')?.closest('label');
        if (low) low.hidden = true;
        ['mor_club_terms', 'nod_record', 'awd_major'].forEach(id => {
            const field = document.getElementById(id)?.closest('.calc-field-group');
            if (field) field.hidden = true;
        });
    }
    const localScore = document.getElementById('localScore');
    if (localScore && selectedDistrict && selectedDistrict !== 'ct') {
        localScore.checked = false;
    }

    // 計算僅在使用者按下「計算高中職積分」按鈕時執行。
    // 不要在每個欄位變更時自動計算，避免使用者還沒按完就跳分數。
    // 但會考欄位變更時可回寫會考預覽（hidden display），讓使用者看到會考轉換結果
    const previewIds = ['subj_cn','subj_en','subj_math','subj_sci','subj_soc','subj_write'];
    previewIds.forEach(id => {
        const el = document.getElementById(id);
        if (!el) return;
        el.addEventListener('change', () => {
            try { computeExamPoints(); renderAnalysis(); renderWishlist(); } catch (e) { /* 安全容錯 */ }
        });
    });

    // 確保主要計算按鈕能以 Enter 觸發（輔助）、但不改變原有行為
    const computeBtn = document.querySelector('.ui-btn.ui-btn-primary');
    if (computeBtn) {
        computeBtn.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') computeBtn.click();
        });
    }

    const helpModal = document.getElementById('calcHelpModal');
    const helpTitle = document.getElementById('calcHelpTitle');
    const helpBody = document.getElementById('calcHelpBody');
    const closeHelpButtons = document.querySelectorAll('[data-calc-help-close]');

    const openHelpModal = (title, html) => {
        if (!helpModal || !helpTitle || !helpBody) return;
        helpTitle.textContent = title || '積分說明';
        helpBody.innerHTML = html || '<p>這個項目依當年度簡章規則計算，實際仍以招生委員會審定為準。</p>';
        helpModal.classList.add('active');
        helpModal.setAttribute('aria-hidden', 'false');
    };

    const closeHelpModal = () => {
        if (!helpModal) return;
        helpModal.classList.remove('active');
        helpModal.setAttribute('aria-hidden', 'true');
    };

    const helpButtons = document.querySelectorAll('.calc-help-toggle');
    helpButtons.forEach(button => {
        const targetId = button.dataset.helpId;
        const target = document.getElementById(targetId);
        if (!target) return;
        button.addEventListener('click', () => {
            const title = button.closest('.calc-card-title-row')?.querySelector('.calc-card-title')?.textContent || '積分說明';
            openHelpModal(title, target.innerHTML);
        });
    });

    document.querySelectorAll('.calc-score-tile').forEach(button => {
        button.addEventListener('click', () => {
            openHelpModal(button.dataset.helpTitle, `<p>${escapeHtml(button.dataset.helpText || '')}</p>`);
        });
    });

    closeHelpButtons.forEach(button => button.addEventListener('click', closeHelpModal));
    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') closeHelpModal();
    });
}

let allSchools = [];
let activeSchoolFilter = 'all';

function parseCsv(text) {
    const rows = [];
    let row = [];
    let value = '';
    let inQuotes = false;

    for (let i = 0; i < text.length; i += 1) {
        const char = text[i];
        const next = text[i + 1];

        if (char === '"' && inQuotes && next === '"') {
            value += '"';
            i += 1;
        } else if (char === '"') {
            inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
            row.push(value);
            value = '';
        } else if ((char === '\n' || char === '\r') && !inQuotes) {
            if (char === '\r' && next === '\n') i += 1;
            row.push(value);
            if (row.some(cell => cell.trim() !== '')) rows.push(row);
            row = [];
            value = '';
        } else {
            value += char;
        }
    }

    if (value || row.length) {
        row.push(value);
        rows.push(row);
    }

    const headers = rows.shift() || [];
    return rows.map(cells => {
        const item = {};
        headers.forEach((header, index) => {
            item[header.replace(/^\uFEFF/, '')] = cells[index] || '';
        });
        return item;
    });
}

function escapeHtml(value) {
    return String(value || '').replace(/[&<>"']/g, char => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
    }[char]));
}

function programItems(programText) {
    if (!programText) return [];
    return programText.split('；').filter(Boolean).map(item => {
        const [name, rest = ''] = item.split(':');
        const quotaMatch = rest.match(/^(\d+)(?:\(([^)]+)\))?/);
        return {
            name: name || item,
            quota: quotaMatch ? quotaMatch[1] : '',
            gender: quotaMatch ? quotaMatch[2] || '' : ''
        };
    });
}

function schoolMatchesFilter(school, filter) {
    if (filter === 'all') return true;
    if (filter === '公立' || filter === '私立') return school['公私立'] === filter;
    if (filter === '高中') return school['學制分類'] === '高中';
    if (filter === '高中職') return school['學制分類'].includes('高中職');
    if (filter === '綜合高中') return school['學制分類'].includes('綜合高中');
    if (filter === '進修部') return school['招生區'].includes('進修部') || school['學制分類'].includes('進修部');
    if (filter === '男校' || filter === '女校') return school['男女校'] === filter;
    if (filter === '資優') return Boolean(school['資優班/特色班']);
    if (filter === '有分數') return Boolean(school['最低錄取分數']);
    return true;
}

function normalizedSearchText(value) {
    return String(value || '').replace(/臺/g, '台').toLowerCase();
}

function schoolSearchAliases(school) {
    const name = school['學校名稱'] || '';
    const cityShort = (school['縣市'] || '').replace(/[縣市]$/, '');
    const normalizedCity = cityShort.replace(/臺/g, '台');
    const aliases = [name.replace(/臺/g, '台')];

    [['第一', '一'], ['第二', '二'], ['第三', '三']].forEach(([formal, short]) => {
        if (cityShort && name.includes(`${cityShort}${formal}`)) {
            aliases.push(`${cityShort}${short}中`, `${normalizedCity}${short}中`);
        }
    });

    if (cityShort && name.includes(`${cityShort}女子`)) {
        aliases.push(`${cityShort}女中`, `${normalizedCity}女中`);
    }

    if (cityShort && name.includes(`${cityShort}工業`)) {
        aliases.push(`${cityShort}高工`, `${normalizedCity}高工`);
    }

    if (cityShort && name.includes(`${cityShort}家事商業`)) {
        aliases.push(`${cityShort}家商`, `${normalizedCity}家商`);
    }

    return aliases;
}

function sortSchools(schools, sortValue) {
    const sorted = [...schools];
    sorted.sort((a, b) => {
        if (sortValue === 'name') return a['學校名稱'].localeCompare(b['學校名稱'], 'zh-Hant');
        if (sortValue === 'city') {
            return `${a['縣市']}${a['區']}${a['學校名稱']}`.localeCompare(`${b['縣市']}${b['區']}${b['學校名稱']}`, 'zh-Hant');
        }
        if (sortValue === 'quota') return (Number(b['簡章招生名額']) || 0) - (Number(a['簡章招生名額']) || 0);
        return (Number(a['排名']) || 9999) - (Number(b['排名']) || 9999);
    });
    return sorted;
}

function renderSchools() {
    const grid = document.getElementById('schoolGrid');
    const summary = document.getElementById('schoolSummary');
    const empty = document.getElementById('schoolEmpty');
    const search = document.getElementById('schoolSearch');
    const sort = document.getElementById('schoolSort');
    if (!grid || !summary || !empty) return;

    const keyword = normalizedSearchText((search?.value || '').trim());
    const sortValue = sort?.value || 'rank';
    const filtered = allSchools.filter(school => {
        const haystack = [
            school['學校名稱'], school['縣市'], school['區'], school['地址'],
            school['公私立'], school['招生區'], school['學制分類'],
            school['男女校'], school['科系與名額'], school['最低錄取分數'],
            ...schoolSearchAliases(school)
        ].map(normalizedSearchText).join(' ');
        return schoolMatchesFilter(school, activeSchoolFilter) && (!keyword || haystack.includes(keyword));
    });
    const sorted = sortSchools(filtered, sortValue);

    summary.textContent = `共 ${allSchools.length} 所，符合條件 ${sorted.length} 所。排序依「${sort?.selectedOptions?.[0]?.textContent || '排名'}」，錄取分數空白代表目前無穩定公開資料。`;
    empty.classList.toggle('hidden', sorted.length > 0);
    grid.innerHTML = sorted.map(school => {
        const programs = programItems(school['科系與名額']);
        const shownPrograms = programs.slice(0, 24);
        const score = school['最低錄取分數'] || '待補';
        const scoreYear = school['分數年度'] ? `${school['分數年度']}年` : '未公告';
        const quotaBlank = school['招生名額'] || '空白保留';
        const publicClass = school['公私立'] === '私立' ? 'is-private' : 'is-public';
        const website = school['官網'] || '#';
        return `
            <article class="panel-card school-card">
                <div class="school-card-head">
                    <div>
                        <h3 class="school-title">${escapeHtml(school['學校名稱'])}</h3>
                    </div>
                    <span class="school-rank">#${escapeHtml(school['排名'])}</span>
                </div>
                <div class="school-chip-row">
                    <span class="school-chip ${publicClass}">${escapeHtml(school['公私立'])}</span>
                    <span class="school-chip">${escapeHtml(school['學制分類'])}</span>
                    <span class="school-chip">${escapeHtml(school['男女校'])}</span>
                    <span class="school-chip">${escapeHtml(school['區'] || school['縣市'])}</span>
                    ${school['最低錄取分數'] ? `<span class="school-chip is-score">${escapeHtml(scoreYear)}</span>` : ''}
                </div>
                <dl class="school-meta">
                    <dt>地址</dt><dd>${escapeHtml(school['地址'])}</dd>
                    <dt>招生區</dt><dd>${escapeHtml(school['招生區'])}</dd>
                    <dt>簡章名額</dt><dd>${escapeHtml(school['簡章招生名額'] || '待公告')}</dd>
                    <dt>招生名額</dt><dd>${escapeHtml(quotaBlank)}</dd>
                    <dt>錄取分數</dt><dd>${escapeHtml(score)}</dd>
                    <dt>特色班</dt><dd>${escapeHtml(school['資優班/特色班'] || '請查官網')}</dd>
                </dl>
                <div class="school-programs">
                    <button type="button" class="school-program-toggle" aria-expanded="false">
                        <span>查看科系與名額</span>
                        <span aria-hidden="true">▼</span>
                    </button>
                    <ul class="school-program-list">
                        ${shownPrograms.map(program => `
                            <li>
                                <span>${escapeHtml(program.name)}</span>
                                <strong>${escapeHtml(program.quota || '-')}${program.gender ? ` / ${escapeHtml(program.gender)}` : ''}</strong>
                            </li>
                        `).join('')}
                    </ul>
                </div>
                <div class="school-actions">
                    <button type="button" class="school-wish-add-btn ${wishlistContainsSchool(school) ? 'is-added' : ''}" data-wish-add="${escapeHtml(school['學校代碼'])}">
                        ${wishlistContainsSchool(school) ? '✓ 已加入志願' : '+ 加入志願'}
                    </button>
                    <a class="school-link" href="${escapeHtml(website)}" target="_blank" rel="noopener noreferrer" ${website === '#' ? 'aria-disabled="true"' : ''}>學校官網</a>
                </div>
            </article>
        `;
    }).join('');

    grid.querySelectorAll('.school-program-toggle').forEach(button => {
        button.addEventListener('click', () => {
            const card = button.closest('.school-card');
            const isOpen = card?.classList.toggle('is-open');
            button.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
            const icon = button.querySelector('[aria-hidden="true"]');
            if (icon) icon.textContent = isOpen ? '▲' : '▼';
        });
    });

    grid.querySelectorAll('[data-wish-add]').forEach(button => {
        button.addEventListener('click', () => {
            const code = button.getAttribute('data-wish-add');
            const school = allSchools.find(s => s['學校代碼'] === code);
            if (!school) return;
            if (wishlistContainsSchool(school)) {
                const index = wishlistState.indexOf(code);
                if (index !== -1) {
                    wishlistState.splice(index, 1);
                    renderWishlist();
                    renderSchools();
                }
            } else {
                const ok = addSchoolToWishlist(school);
                if (ok) renderSchools();
            }
        });
    });
}

function getSchoolDataConfig() {
    const config = window.JSHS_SITE_CONFIG || {};
    const district = getSelectedDistrict();
    const districtCsvPath = config.schoolsCsvPathsByDistrict?.[district];
    return {
        csvPath: districtCsvPath || config.schoolsCsvPath || 'schools_tp.csv',
        district,
        dataVar: config.schoolsDataVar || 'IT_HS_SCHOOLS'
    };
}

function useEmbeddedSchoolsData() {
    const config = getSchoolDataConfig();
    if (config.district === 'tp') return false;
    const source = window[config.dataVar];
    if (!Array.isArray(source) || source.length === 0) return false;
    allSchools = source.map(school => ({ ...school }));
    renderSchools();
    return true;
}

let wishlistState = [];
const WISHLIST_MAX = 50;
let wishlistSearchTimer = null;

function wishlistContainsSchool(school) {
    if (!school) return false;
    return wishlistState.includes(school['學校代碼']);
}

function addSchoolToWishlist(school) {
    if (!school) return false;
    if (wishlistContainsSchool(school)) return false;
    if (wishlistState.length >= WISHLIST_MAX) {
        alert(`志願序最多只能填 ${WISHLIST_MAX} 間。`);
        return false;
    }
    wishlistState.push(school['學校代碼']);
    renderWishlist();
    return true;
}

function removeWishlistAt(index) {
    if (index < 0 || index >= wishlistState.length) return;
    wishlistState.splice(index, 1);
    renderWishlist();
    renderSchools();
}

function moveWishlist(index, direction) {
    const target = index + direction;
    if (index < 0 || index >= wishlistState.length) return;
    if (target < 0 || target >= wishlistState.length) return;
    const temp = wishlistState[index];
    wishlistState[index] = wishlistState[target];
    wishlistState[target] = temp;
    renderWishlist();
}

function clearWishlist() {
    if (!wishlistState.length) return;
    if (!confirm('確定要清空所有志願嗎？')) return;
    wishlistState = [];
    renderWishlist();
    renderSchools();
}

function getWishlistAnalysisForSchool(school) {
    const { totalPoints } = getCurrentScoreSnapshot();
    const userBand = getUserAnalysisBand(totalPoints || 0);
    const schoolTier = getSchoolDifficultyTier(school['排名']);
    const recommendation = getAnalysisRecommendation(userBand, schoolTier);
    return { userBand, schoolTier, recommendation };
}

function renderWishlist() {
    const listEl = document.getElementById('wishlistList');
    const countEl = document.getElementById('wishlistCount');
    const summaryEl = document.getElementById('wishlistSummary');
    const countChallenge = document.getElementById('wishCountChallenge');
    const countBalanced = document.getElementById('wishCountBalanced');
    const countReachable = document.getElementById('wishCountReachable');

    if (countEl) countEl.textContent = `${wishlistState.length} / ${WISHLIST_MAX}`;

    if (!listEl) return;

    if (!wishlistState.length) {
        listEl.innerHTML = `
            <li class="wishlist-empty">
                <div class="wishlist-empty-icon" aria-hidden="true">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M7 12h10"/><path d="M10 18h4"/></svg>
                </div>
                <p class="wishlist-empty-title">你還沒有加入任何志願</p>
                <p class="wishlist-empty-desc">先用上方搜尋框找學校，點選任一間學校就會加進來。你也可以在下方「學校查詢」頁面直接點「加入志願」。</p>
            </li>
        `;
        if (summaryEl) summaryEl.hidden = true;
        return;
    }

    const wishSchools = wishlistState
        .map(code => allSchools.find(s => s['學校代碼'] === code))
        .filter(Boolean);

    const counts = { 挑戰: 0, 適中: 0, 穩定: 0 };
    wishSchools.forEach(school => {
        const { recommendation } = getWishlistAnalysisForSchool(school);
        counts[recommendation.status] = (counts[recommendation.status] || 0) + 1;
    });

    if (summaryEl) {
        summaryEl.hidden = false;
        if (countChallenge) countChallenge.textContent = counts['挑戰'] || 0;
        if (countBalanced) countBalanced.textContent = counts['適中'] || 0;
        if (countReachable) countReachable.textContent = counts['穩定'] || 0;
    }

    listEl.innerHTML = wishSchools.map((school, index) => {
        const { userBand, schoolTier, recommendation } = getWishlistAnalysisForSchool(school);
        const pubClass = school['公私立'] === '私立' ? 'is-private' : 'is-public';
        const pubLabel = school['公私立'];
        const areaText = school['區'] || school['縣市'] || '';
        const scoreText = school['最低錄取分數'] || '暫無分數';
        const quotaText = school['簡章招生名額'] || school['招生名額'] || '待公告';
        const rank = school['排名'] || '-';
        return `
            <li class="wish-item ${recommendation.badgeClass}" data-wish-index="${index}">
                <div class="wish-rank" aria-label="第 ${index + 1} 志願">
                    <span class="wish-rank-num">${index + 1}</span>
                    <span class="wish-rank-label">志願</span>
                </div>
                <div class="wish-item-body">
                    <div class="wish-item-head">
                        <h4 class="wish-item-name">${escapeHtml(school['學校名稱'])}</h4>
                        <div class="wish-item-chips">
                            <span class="wish-chip ${pubClass}">${escapeHtml(pubLabel)}</span>
                            <span class="wish-chip is-type">${escapeHtml(school['學制分類'])}</span>
                            <span class="wish-chip is-area">${escapeHtml(areaText)}</span>
                        </div>
                    </div>
                    <div class="wish-item-analysis">
                        <span class="wish-analysis-badge ${recommendation.badgeClass}">${recommendation.status}</span>
                        <p class="wish-analysis-detail">${recommendation.detail}</p>
                        <div class="wish-analysis-meta">
                            <span>排名 #${escapeHtml(String(rank))}</span>
                            <span>你的區間：${userBand.label}</span>
                            <span>學校難度：${schoolTier.label}</span>
                            <span>錄取分數：${escapeHtml(scoreText)}</span>
                            <span>名額：${escapeHtml(quotaText)}</span>
                        </div>
                    </div>
                </div>
                <div class="wish-item-controls">
                    <div class="wish-control-group">
                        <button type="button" class="wish-control-btn" data-wish-move="up" data-wish-index="${index}" aria-label="往上移動" ${index === 0 ? 'disabled' : ''}>▲</button>
                        <button type="button" class="wish-control-btn" data-wish-move="down" data-wish-index="${index}" aria-label="往下移動" ${index === wishSchools.length - 1 ? 'disabled' : ''}>▼</button>
                    </div>
                    <button type="button" class="wish-control-btn is-delete" data-wish-remove="${index}" aria-label="刪除志願">✕</button>
                </div>
            </li>
        `;
    }).join('');

    listEl.querySelectorAll('[data-wish-move]').forEach(btn => {
        btn.addEventListener('click', () => {
            const idx = Number(btn.getAttribute('data-wish-index'));
            const dir = btn.getAttribute('data-wish-move') === 'up' ? -1 : 1;
            moveWishlist(idx, dir);
        });
    });

    listEl.querySelectorAll('[data-wish-remove]').forEach(btn => {
        btn.addEventListener('click', () => {
            const idx = Number(btn.getAttribute('data-wish-remove'));
            removeWishlistAt(idx);
        });
    });
}

function renderWishlistSearchResults(keyword) {
    const resultsEl = document.getElementById('wishlistSearchResults');
    if (!resultsEl) return;
    const trimmed = (keyword || '').trim();

    if (!trimmed) {
        resultsEl.hidden = true;
        resultsEl.innerHTML = '';
        return;
    }

    const q = trimmed.toLowerCase();
    const matches = allSchools
        .filter(school => {
            const hay = [
                school['學校名稱'],
                school['學校代碼'],
                school['縣市'],
                school['區'],
                school['學制分類'],
                school['公私立'],
                school['地址'],
                school['科系與名額']
            ].join(' ').toLowerCase();
            return hay.includes(q);
        })
        .sort((a, b) => (Number(a['排名']) || 9999) - (Number(b['排名']) || 9999))
        .slice(0, 30);

    if (!matches.length) {
        resultsEl.hidden = false;
        resultsEl.innerHTML = `<div class="wishlist-search-empty">找不到符合「${escapeHtml(trimmed)}」的學校，試試看關鍵字：台中、彰化、南投、高中、高職…</div>`;
        return;
    }

    resultsEl.hidden = false;
    resultsEl.innerHTML = matches.map(school => {
        const added = wishlistContainsSchool(school);
        const pubClass = school['公私立'] === '私立' ? 'is-private' : 'is-public';
        return `
            <div class="wishlist-search-item ${added ? 'is-added' : ''}" data-wish-search-code="${escapeHtml(school['學校代碼'])}" role="button" tabindex="0">
                <div class="wish-search-left">
                    <div class="wish-search-name">${escapeHtml(school['學校名稱'])}</div>
                    <div class="wish-search-meta">
                        <span class="chip-mini ${pubClass}">${escapeHtml(school['公私立'])}</span>
                        <span class="chip-mini">${escapeHtml(school['學制分類'])}</span>
                        <span class="chip-mini">${escapeHtml(school['區'] || school['縣市'] || '')}</span>
                        <span>#${escapeHtml(String(school['排名'] || '-'))}</span>
                    </div>
                </div>
                <span class="wish-search-add">${added ? '已加入' : '＋ 加入'}</span>
            </div>
        `;
    }).join('');

    resultsEl.querySelectorAll('[data-wish-search-code]').forEach(item => {
        const action = () => {
            const code = item.getAttribute('data-wish-search-code');
            const school = allSchools.find(s => s['學校代碼'] === code);
            if (!school) return;
            if (wishlistContainsSchool(school)) return;
            const ok = addSchoolToWishlist(school);
            if (ok) {
                const inputEl = document.getElementById('wishlistSearch');
                if (inputEl) {
                    inputEl.value = '';
                    renderWishlistSearchResults('');
                }
                renderSchools();
            }
        };
        item.addEventListener('click', action);
        item.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                action();
            }
        });
    });
}

function initWishlistControls() {
    const searchEl = document.getElementById('wishlistSearch');
    const resultsEl = document.getElementById('wishlistSearchResults');
    const clearBtn = document.getElementById('wishlistClearBtn');

    if (searchEl) {
        searchEl.addEventListener('input', (e) => {
            const keyword = e.target.value;
            if (wishlistSearchTimer) clearTimeout(wishlistSearchTimer);
            wishlistSearchTimer = setTimeout(() => renderWishlistSearchResults(keyword), 180);
        });

        searchEl.addEventListener('focus', () => {
            if (searchEl.value) renderWishlistSearchResults(searchEl.value);
        });

        document.addEventListener('click', (e) => {
            if (!resultsEl) return;
            if (!searchEl) return;
            if (resultsEl.contains(e.target) || e.target === searchEl) return;
            resultsEl.hidden = true;
        });
    }

    if (clearBtn) {
        clearBtn.addEventListener('click', clearWishlist);
    }
}

function initAnalysisControls() {
    document.getElementById('analysisScope')?.addEventListener('change', renderAnalysis);
    document.getElementById('analysisLimit')?.addEventListener('change', renderAnalysis);
    initWishlistControls();
}

function initSchools() {
    const grid = document.getElementById('schoolGrid');
    const summary = document.getElementById('schoolSummary');
    if (!grid || !summary) return;

    const config = getSchoolDataConfig();

    const downloadLink = document.getElementById('schoolsCsvDownload');
    if (downloadLink) downloadLink.href = config.csvPath;

    fetch(config.csvPath)
        .then(response => {
            if (!response.ok) throw new Error('CSV load failed');
            return response.text();
        })
        .then(text => {
            allSchools = parseCsv(text);
            renderSchools();
        })
        .catch(() => {
            if (useEmbeddedSchoolsData()) return;
            summary.textContent = `無法載入 ${config.csvPath}，請稍後再試。`;
        });

    document.querySelectorAll('.school-filter').forEach(button => {
        button.addEventListener('click', () => {
            activeSchoolFilter = button.dataset.schoolFilter || 'all';
            document.querySelectorAll('.school-filter').forEach(item => {
                item.classList.toggle('active', item === button);
            });
            renderSchools();
        });
    });

    document.getElementById('schoolSearch')?.addEventListener('input', renderSchools);
    document.getElementById('schoolSort')?.addEventListener('change', renderSchools);
}

window.addEventListener('DOMContentLoaded', () => {
    toggleMobileMenu();
    initPageRouter();
    initCalculator();
    initLineFloatingLink();
    initAnalysisControls();
    initSchools();
    renderAnalysis();
    renderWishlist();
});



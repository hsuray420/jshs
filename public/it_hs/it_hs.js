function toggleMobileMenu() {
    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    const mobileMenu = document.getElementById('mobileMenu');
    if (!mobileMenuBtn || !mobileMenu) return;
    mobileMenuBtn.addEventListener('click', () => {
        mobileMenu.classList.toggle('hidden');
    });
}

function getCookieValue(name) {
    return document.cookie
        .split('; ')
        .find(row => row.startsWith(`${name}=`))
        ?.split('=')
        .slice(1)
        .join('=') || '';
}

function getSelectedDistrict() {
    return decodeURIComponent(getCookieValue('jshs_district') || '');
}

const DISTRICT_RULES = {
    ct: { label: '中投區', totalMax: 100, examMax: 30, examUnit: '111 點', otherMax: 70 },
    tp: { label: '基北區', totalMax: 108, examMax: 36, examUnit: '36 分', otherMax: 72 }
};

function getDistrictRules() {
    return DISTRICT_RULES[getSelectedDistrict()] || DISTRICT_RULES.ct;
}

const topicPages = {
    'program-general': { eyebrow: '學制介紹 / 普通高中', title: '普通高中：把學科基礎走得更穩。', intro: '普通高中以學科學習為主，適合想累積國英數、社會與自然基礎，並保留大學多元升學選擇的學生。', points: [['學習重點', '以核心學科、閱讀理解與探究能力為主要訓練。'], ['適合特質', '喜歡系統整理知識，能長期投入學科準備。'], ['下一步', '比較學校課程、特色班與通勤距離，再安排志願。']], action: '查看中投區學校', actionPage: 'schools' },
    'program-vocational': { eyebrow: '學制介紹 / 技術型高中', title: '技術型高中：在實作裡找到專業。', intro: '技術型高中強調專業科目、實作課程與證照能力，讓學生在高中階段逐步建立可延伸的技術基礎。', points: [['學習重點', '專業課程、實習、專題與技術證照並行。'], ['適合特質', '對資訊、設計、餐飲、機械或商管等領域有興趣。'], ['下一步', '從科別與校內設備開始比較，確認自己想投入的方向。']], action: '瀏覽技術型高中', actionPage: 'schools' },
    'program-comprehensive': { eyebrow: '學制介紹 / 綜合高中', title: '綜合高中：先探索，也保留彈性。', intro: '綜合高中結合普通教育與職業教育，適合還在認識自己興趣、希望保留更多選擇的學生。', points: [['學習重點', '透過多元選修與試探課程，逐步找到適合的方向。'], ['適合特質', '不急著替未來定案，希望在學習中慢慢確認興趣。'], ['下一步', '了解各校的學程設計與轉銜安排，再選擇合適環境。']], action: '比較學制差異', actionPage: 'overview' },
    'admission-exempt': { eyebrow: '入學管道 / 免試入學', title: '免試入學：用志願與積分完成分發。', intro: '中投區多數學生透過免試入學選填志願，依志願序、多元表現、會考成績與比序規則辦理分發。', points: [['先確認資格', '依當年度簡章確認就學區、報名身分與時程。'], ['整理志願', '先從學校與科別的適配度，再考量通勤與錄取機會。'], ['試算積分', '輸入目前資料，掌握可調整的項目與總分。']], action: '開始積分試算', actionPage: 'calculator' },
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

    if (getSelectedDistrict() === 'tp') {
        if (badge) badge.textContent = '基北區學校落點資料建置中';
        summary.innerHTML = '基北區積分試算已可使用；學校查詢與落點分析將依基北區招生資料另行建置。';
        results.innerHTML = '';
        return;
    }

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
            : '本頁目前採用中投區免試入學公開說明框架做估算；實際以當年度簡章、公告與招生委員會審定為準。會考 111 制比序積分以五科分數與作文等級為基礎，會考 100 制比序積點則依各科等級換算。';
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

    if (getSelectedDistrict() === 'tp') {
        summary.textContent = '基北區學校清單建置中，目前不顯示中投區資料。';
        grid.innerHTML = '';
        empty.classList.remove('hidden');
        empty.textContent = '基北區學校資料即將加入，請先使用基北區積分試算。';
        return;
    }

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
        csvPath: districtCsvPath || config.schoolsCsvPath || 'schools.csv',
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


// Generated from schools.csv by jshs_dev.html.
window.IT_HS_SCHOOLS = [
  {
    "排名": "1",
    "學校代碼": "193302",
    "學校名稱": "臺中市立臺中第一高級中等學校",
    "公私立": "公立",
    "招生區": "中投區日間部",
    "學制分類": "高中",
    "男女校": "男校",
    "縣市": "臺中市",
    "區": "北區",
    "地址": "臺中市北區育才街2號",
    "官網": "https://www.tcfsh.tc.edu.tw",
    "電話": "04-22226081#203",
    "科系與名額": "普通科:795(男)",
    "簡章招生名額": "795",
    "招生名額": "",
    "最低錄取分數": "5A6+作文4級分 國A++",
    "分數年度": "113",
    "分數來源備註": "test",
    "資優班/特色班": "資優/特色班請查官網公告",
    "排序分數": "10000"
  },
  {
    "排名": "2",
    "學校代碼": "193301",
    "學校名稱": "臺中市立臺中女子高級中等學校",
    "公私立": "公立",
    "招生區": "中投區日間部",
    "學制分類": "高中",
    "男女校": "女校",
    "縣市": "臺中市",
    "區": "西區",
    "地址": "臺中市西區自由路一段95號",
    "官網": "https://www.tcgs.tc.edu.tw",
    "電話": "04-22205108#203",
    "科系與名額": "普通科:613(女)",
    "簡章招生名額": "613",
    "招生名額": "",
    "最低錄取分數": "5A4+作文5級分 國A數英A++",
    "分數年度": "113",
    "分數來源備註": "CTTW中投區歷年錄取分數查詢 113年；科別:普通科",
    "資優班/特色班": "資優/特色班請查官網公告",
    "排序分數": "9950"
  },
  {
    "排名": "3",
    "學校代碼": "060323",
    "學校名稱": "國立中科實驗高級中學",
    "公私立": "公立",
    "招生區": "中投區日間部",
    "學制分類": "高中",
    "男女校": "男女兼收",
    "縣市": "臺中市",
    "區": "大雅區",
    "地址": "臺中市大雅區平和路227號",
    "官網": "https://www.nehs.tc.edu.tw",
    "電話": "04-25686850#1220",
    "科系與名額": "普通科:60(不限)",
    "簡章招生名額": "60",
    "招生名額": "",
    "最低錄取分數": "5A4+作文4級分 國A+數A++",
    "分數年度": "113",
    "分數來源備註": "CTTW中投區歷年錄取分數查詢 113年；科別:普通科",
    "資優班/特色班": "資優/特色班請查官網公告",
    "排序分數": "9900"
  },
  {
    "排名": "4",
    "學校代碼": "060322",
    "學校名稱": "國立中興大學附屬高級中學",
    "公私立": "公立",
    "招生區": "中投區日間部",
    "學制分類": "高中",
    "男女校": "男女兼收",
    "縣市": "臺中市",
    "區": "大里區",
    "地址": "臺中市大里區東榮路369號",
    "官網": "https://www.dali.tc.edu.tw",
    "電話": "04-24875199#321",
    "科系與名額": "普通科:454(不限)",
    "簡章招生名額": "454",
    "招生名額": "",
    "最低錄取分數": "4A1B10+作文5級分",
    "分數年度": "113",
    "分數來源備註": "CTTW中投區歷年錄取分數查詢 113年；科別:普通科",
    "資優班/特色班": "",
    "排序分數": "9850"
  },
  {
    "排名": "5",
    "學校代碼": "194315",
    "學校名稱": "臺中市立文華高級中等學校",
    "公私立": "公立",
    "招生區": "中投區日間部",
    "學制分類": "高中",
    "男女校": "男女兼收",
    "縣市": "臺中市",
    "區": "西屯區",
    "地址": "臺中市西屯區寧夏路240號",
    "官網": "https://www.whsh.tc.edu.tw",
    "電話": "04-23124000#214",
    "科系與名額": "普通科:279(男)",
    "簡章招生名額": "279",
    "招生名額": "",
    "最低錄取分數": "4A1B7+作文4級分",
    "分數年度": "113",
    "分數來源備註": "CTTW中投區歷年錄取分數查詢 113年；科別:普通科",
    "資優班/特色班": "資優/特色班請查官網公告",
    "排序分數": "9800"
  },
  {
    "排名": "6",
    "學校代碼": "193316",
    "學校名稱": "臺中市立惠文高級中學",
    "公私立": "公立",
    "招生區": "中投區日間部",
    "學制分類": "高中",
    "男女校": "男女兼收",
    "縣市": "臺中市",
    "區": "南屯區",
    "地址": "臺中市南屯區公益路二段298號",
    "官網": "https://hwsh.tc.edu.tw",
    "電話": "04-22503928#721",
    "科系與名額": "普通科:294(不限)",
    "簡章招生名額": "294",
    "招生名額": "",
    "最低錄取分數": "4A1B4+作文4級分",
    "分數年度": "113",
    "分數來源備註": "CTTW中投區歷年錄取分數查詢 113年；科別:普通科",
    "資優班/特色班": "資優/特色班請查官網公告",
    "排序分數": "9750"
  },
  {
    "排名": "7",
    "學校代碼": "194303",
    "學校名稱": "臺中市立臺中第二高級中等學校",
    "公私立": "公立",
    "招生區": "中投區日間部",
    "學制分類": "高中",
    "男女校": "男女兼收",
    "縣市": "臺中市",
    "區": "北區",
    "地址": "臺中市北區英士路109號",
    "官網": "https://tcssh.tc.edu.tw",
    "電話": "04-22021521#1205",
    "科系與名額": "普通科:740(不限)",
    "簡章招生名額": "740",
    "招生名額": "",
    "最低錄取分數": "3A2B6+作文4",
    "分數年度": "113",
    "分數來源備註": "CTTW中投區歷年錄取分數查詢 113年；科別:普通科",
    "資優班/特色班": "資優/特色班請查官網公告",
    "排序分數": "9700"
  },
  {
    "排名": "8",
    "學校代碼": "193303",
    "學校名稱": "臺中市立忠明高級中學",
    "公私立": "公立",
    "招生區": "中投區日間部",
    "學制分類": "高中",
    "男女校": "男女兼收",
    "縣市": "臺中市",
    "區": "西區",
    "地址": "臺中市西區博館路166號",
    "官網": "https://cmsh.tc.edu.tw",
    "電話": "04-23224690#712",
    "科系與名額": "普通科:244(不限)",
    "簡章招生名額": "244",
    "招生名額": "",
    "最低錄取分數": "3A2B3+作文4級分",
    "分數年度": "113",
    "分數來源備註": "CTTW中投區歷年錄取分數查詢 113年；科別:普通科",
    "資優班/特色班": "",
    "排序分數": "9650"
  },
  {
    "排名": "9",
    "學校代碼": "193313",
    "學校名稱": "臺中市立西苑高級中學",
    "公私立": "公立",
    "招生區": "中投區日間部",
    "學制分類": "高中",
    "男女校": "男女兼收",
    "縣市": "臺中市",
    "區": "西屯區",
    "地址": "臺中市西屯區漢翔路188號",
    "官網": "https://sysh.tc.edu.tw",
    "電話": "04-27016473#714",
    "科系與名額": "普通科:225(不限)",
    "簡章招生名額": "225",
    "招生名額": "",
    "最低錄取分數": "2A3B6+作文4級分",
    "分數年度": "113",
    "分數來源備註": "CTTW中投區歷年錄取分數查詢 113年；科別:普通科",
    "資優班/特色班": "",
    "排序分數": "9600"
  },
  {
    "排名": "10",
    "學校代碼": "193315",
    "學校名稱": "臺中市立東山高級中學",
    "公私立": "公立",
    "招生區": "中投區日間部",
    "學制分類": "高中",
    "男女校": "男女兼收",
    "縣市": "臺中市",
    "區": "北屯區",
    "地址": "臺中市北屯區景賢六路200號",
    "官網": "https://tsjh.tc.edu.tw",
    "電話": "04-24360166#713",
    "科系與名額": "普通科:180(不限)",
    "簡章招生名額": "180",
    "招生名額": "",
    "最低錄取分數": "2A3B6+作文4級分",
    "分數年度": "113",
    "分數來源備註": "CTTW中投區歷年錄取分數查詢 113年；科別:普通科",
    "資優班/特色班": "",
    "排序分數": "9550"
  },
  {
    "排名": "11",
    "學校代碼": "064324",
    "學校名稱": "臺中市立大里高級中學",
    "公私立": "公立",
    "招生區": "中投區日間部",
    "學制分類": "高中",
    "男女校": "男女兼收",
    "縣市": "臺中市",
    "區": "大里區",
    "地址": "臺中市大里區國中路365號",
    "官網": "https://dlsh.tc.edu.tw",
    "電話": "04-24067870#215",
    "科系與名額": "普通科:182(不限)",
    "簡章招生名額": "182",
    "招生名額": "",
    "最低錄取分數": "2A3B4+作文4級分",
    "分數年度": "113",
    "分數來源備註": "CTTW中投區歷年錄取分數查詢 113年；科別:普通科",
    "資優班/特色班": "",
    "排序分數": "9500"
  },
  {
    "排名": "12",
    "學校代碼": "063305",
    "學校名稱": "臺中市立清水高級中等學校",
    "公私立": "公立",
    "招生區": "中投區日間部",
    "學制分類": "高中",
    "男女校": "男女兼收",
    "縣市": "臺中市",
    "區": "清水區",
    "地址": "臺中市清水區中山路90號",
    "官網": "https://cshs.tc.edu.tw",
    "電話": "04-26222116 # 231",
    "科系與名額": "普通科:452(不限)",
    "簡章招生名額": "452",
    "招生名額": "",
    "最低錄取分數": "1A4B6+作文4級分",
    "分數年度": "113",
    "分數來源備註": "CTTW中投區歷年錄取分數查詢 113年；科別:普通科",
    "資優班/特色班": "",
    "排序分數": "9450"
  },
  {
    "排名": "13",
    "學校代碼": "063312",
    "學校名稱": "臺中市立豐原高級中等學校",
    "公私立": "公立",
    "招生區": "中投區日間部",
    "學制分類": "高中",
    "男女校": "男女兼收",
    "縣市": "臺中市",
    "區": "豐原區",
    "地址": "臺中市豐原區水源路150號",
    "官網": "https://fysh.tc.edu.tw",
    "電話": "04-25290381#1121",
    "科系與名額": "普通科:470(不限)",
    "簡章招生名額": "470",
    "招生名額": "",
    "最低錄取分數": "1A4B5+作文4級分",
    "分數年度": "113",
    "分數來源備註": "CTTW中投區歷年錄取分數查詢 113年；科別:普通科",
    "資優班/特色班": "",
    "排序分數": "9400"
  },
  {
    "排名": "14",
    "學校代碼": "064336",
    "學校名稱": "臺中市立長億高級中學",
    "公私立": "公立",
    "招生區": "中投區日間部",
    "學制分類": "高中",
    "男女校": "男女兼收",
    "縣市": "臺中市",
    "區": "太平區",
    "地址": "臺中市太平區長億里長億六街1號",
    "官網": "https://cyhs.tc.edu.tw",
    "電話": "04-22704022#112",
    "科系與名額": "普通科:195(不限)",
    "簡章招生名額": "195",
    "招生名額": "",
    "最低錄取分數": "1A4B5+作文4級分",
    "分數年度": "113",
    "分數來源備註": "CTTW中投區歷年錄取分數查詢 113年；科別:普通科",
    "資優班/特色班": "",
    "排序分數": "9350"
  },
  {
    "排名": "15",
    "學校代碼": "064342",
    "學校名稱": "臺中市立中港高級中學",
    "公私立": "公立",
    "招生區": "中投區日間部",
    "學制分類": "高中",
    "男女校": "男女兼收",
    "縣市": "臺中市",
    "區": "梧棲區",
    "地址": "臺中市梧棲區文昌路400號",
    "官網": "https://cgsh.tc.edu.tw",
    "電話": "04-26578270#9202",
    "科系與名額": "普通科:180(不限)",
    "簡章招生名額": "180",
    "招生名額": "",
    "最低錄取分數": "5B7+作文4級分",
    "分數年度": "113",
    "分數來源備註": "CTTW中投區歷年錄取分數查詢 113年；科別:普通科",
    "資優班/特色班": "",
    "排序分數": "9300"
  },
  {
    "排名": "16",
    "學校代碼": "063303",
    "學校名稱": "臺中市立大甲高級中等學校",
    "公私立": "公立",
    "招生區": "中投區日間部",
    "學制分類": "綜合高中",
    "男女校": "男女兼收",
    "縣市": "臺中市",
    "區": "大甲區",
    "地址": "臺中市大甲區中山路一段720號",
    "官網": "https://djsh.tc.edu.tw",
    "電話": "04-26877165#333",
    "科系與名額": "綜合高中:410(不限)；美工科:33(不限)",
    "簡章招生名額": "443",
    "招生名額": "",
    "最低錄取分數": "5B2+作文4級分",
    "分數年度": "113",
    "分數來源備註": "CTTW中投區歷年錄取分數查詢 113年；科別:普通科",
    "資優班/特色班": "",
    "排序分數": "9250"
  },
  {
    "排名": "17",
    "學校代碼": "064350",
    "學校名稱": "臺中市立龍津高級中等學校",
    "公私立": "公立",
    "招生區": "中投區日間部",
    "學制分類": "高中",
    "男女校": "男女兼收",
    "縣市": "臺中市",
    "區": "龍井區",
    "地址": "臺中市龍井區三港路130號",
    "官網": "https://ljjhs.tc.edu.tw",
    "電話": "04-26304536#714、710",
    "科系與名額": "普通科:112(不限)",
    "簡章招生名額": "112",
    "招生名額": "",
    "最低錄取分數": "5B3+作文3級分",
    "分數年度": "113",
    "分數來源備註": "CTTW中投區歷年錄取分數查詢 113年；科別:普通科",
    "資優班/特色班": "",
    "排序分數": "9200"
  },
  {
    "排名": "18",
    "學校代碼": "064308",
    "學校名稱": "臺中市立后綜高級中學",
    "公私立": "公立",
    "招生區": "中投區日間部",
    "學制分類": "高中",
    "男女校": "男女兼收",
    "縣市": "臺中市",
    "區": "后里區",
    "地址": "臺中市后里區三豐路三段968號",
    "官網": "https://hzsh.tc.edu.tw",
    "電話": "04-25562012#1107",
    "科系與名額": "普通科:226(不限)",
    "簡章招生名額": "226",
    "招生名額": "",
    "最低錄取分數": "4B1C8+作文3級分",
    "分數年度": "113",
    "分數來源備註": "CTTW中投區歷年錄取分數查詢 113年；科別:普通科",
    "資優班/特色班": "",
    "排序分數": "9150"
  },
  {
    "排名": "19",
    "學校代碼": "064328",
    "學校名稱": "臺中市立新社高級中學",
    "公私立": "公立",
    "招生區": "中投區日間部",
    "學制分類": "高中職",
    "男女校": "男女兼收",
    "縣市": "臺中市",
    "區": "新社區",
    "地址": "臺中市新社區中和街三段國中巷10號",
    "官網": "https://sshs.tc.edu.tw",
    "電話": "04-25812116#213",
    "科系與名額": "普通科:128(不限)；農場經營科(產特):26(不限)；園藝科(產特):26(不限)；商業經營科:26(不限)；資料處理科:26(不限)",
    "簡章招生名額": "232",
    "招生名額": "",
    "最低錄取分數": "4B1C3+作文4級分",
    "分數年度": "113",
    "分數來源備註": "CTTW中投區歷年錄取分數查詢 113年；科別:普通科",
    "資優班/特色班": "",
    "排序分數": "9100"
  },
  {
    "排名": "20",
    "學校代碼": "084309",
    "學校名稱": "南投縣立旭光高級中學",
    "公私立": "公立",
    "招生區": "中投區日間部",
    "學制分類": "高中",
    "男女校": "男女兼收",
    "縣市": "南投縣",
    "區": "草屯鎮",
    "地址": "南投縣草屯鎮富寮里中正路568-23號",
    "官網": "https://skjhs.ntct.edu.tw",
    "電話": "049-2563472#211",
    "科系與名額": "普通科:145(不限)",
    "簡章招生名額": "145",
    "招生名額": "",
    "最低錄取分數": "85 (37)",
    "分數年度": "110",
    "分數來源備註": "CTTW中投區歷年錄取分數查詢 110年；科別:普通科",
    "資優班/特色班": "",
    "排序分數": "6500"
  },
  {
    "排名": "21",
    "學校代碼": "080305",
    "學校名稱": "國立中興高級中學",
    "公私立": "公立",
    "招生區": "中投區日間部",
    "學制分類": "高中",
    "男女校": "男女兼收",
    "縣市": "南投縣",
    "區": "南投市",
    "地址": "南投縣南投市中興新村中學路2號",
    "官網": "https://www.chsh.ntct.edu.tw",
    "電話": "049-2332110#1203、1207",
    "科系與名額": "普通科:350(不限)",
    "簡章招生名額": "350",
    "招生名額": "",
    "最低錄取分數": "89 (60)",
    "分數年度": "110",
    "分數來源備註": "CTTW中投區歷年錄取分數查詢 110年；科別:普通科",
    "資優班/特色班": "",
    "排序分數": "6500"
  },
  {
    "排名": "22",
    "學校代碼": "080302",
    "學校名稱": "國立南投高級中學",
    "公私立": "公立",
    "招生區": "中投區日間部",
    "學制分類": "高中職",
    "男女校": "男女兼收",
    "縣市": "南投縣",
    "區": "南投市",
    "地址": "南投縣南投市建國路137號",
    "官網": "https://www.ntsh.ntct.edu.tw",
    "電話": "049-2231175#307、308",
    "科系與名額": "普通科:198(不限)；電子科:30(不限)；電機科:31(不限)；建築科:30(不限)；美工科:31(不限)；電腦機械製圖科:30(不限)；電子商務科:31(不限)；應用英語科:31(不限)",
    "簡章招生名額": "412",
    "招生名額": "",
    "最低錄取分數": "",
    "分數年度": "",
    "分數來源備註": "",
    "資優班/特色班": "",
    "排序分數": "6500"
  },
  {
    "排名": "23",
    "學校代碼": "080410",
    "學校名稱": "國立水里高級商工職業學校",
    "公私立": "公立",
    "招生區": "中投區日間部",
    "學制分類": "高中職",
    "男女校": "男女兼收",
    "縣市": "南投縣",
    "區": "水里鄉",
    "地址": "南投縣水里鄉南湖路2號",
    "官網": "https://www.slvs.ntct.edu.tw",
    "電話": "049-2870666#253、254",
    "科系與名額": "普通科:10(不限)；資訊科:14(不限)；電機科:7(不限)；商業經營科:12(不限)；觀光事業科:12(不限)；餐飲管理科:11(不限)；應用日語科:12(不限)",
    "簡章招生名額": "78",
    "招生名額": "",
    "最低錄取分數": "83 (28)",
    "分數年度": "110",
    "分數來源備註": "CTTW中投區歷年錄取分數查詢 110年；科別:普通科",
    "資優班/特色班": "",
    "排序分數": "6500"
  },
  {
    "排名": "24",
    "學校代碼": "061315",
    "學校名稱": "臺中市華盛頓高級中學",
    "公私立": "私立",
    "招生區": "中投區日間部",
    "學制分類": "高中",
    "男女校": "男女兼收",
    "縣市": "臺中市",
    "區": "太平區",
    "地址": "臺中市太平區廍仔坑路26號",
    "官網": "https://www.whs.tc.edu.tw",
    "電話": "04-23934712#113、116",
    "科系與名額": "普通科:237(不限)",
    "簡章招生名額": "237",
    "招生名額": "",
    "最低錄取分數": "",
    "分數年度": "",
    "分數來源備註": "",
    "資優班/特色班": "",
    "排序分數": "6500"
  },
  {
    "排名": "25",
    "學校代碼": "064B08",
    "學校名稱": "臺中市立后綜高級中學進修部",
    "公私立": "公立",
    "招生區": "中投區/共同就學區進修部",
    "學制分類": "高中/進修部",
    "男女校": "男女兼收",
    "縣市": "臺中市",
    "區": "后里區",
    "地址": "臺中市后里區三豐路三段968號",
    "官網": "https://hzsh.tc.edu.tw",
    "電話": "04-25562012#3151、3152",
    "科系與名額": "普通科:25(不限)",
    "簡章招生名額": "25",
    "招生名額": "",
    "最低錄取分數": "4B1C8+作文3級分",
    "分數年度": "113",
    "分數來源備註": "CTTW中投區歷年錄取分數查詢 113年；科別:普通科",
    "資優班/特色班": "",
    "排序分數": "5450"
  },
  {
    "排名": "26",
    "學校代碼": "190406",
    "學校名稱": "國立中興大學附屬臺中高級農業職業學校",
    "公私立": "公立",
    "招生區": "中投區日間部",
    "學制分類": "高中職",
    "男女校": "男女兼收",
    "縣市": "臺中市",
    "區": "東區",
    "地址": "臺中市東區台中路283號",
    "官網": "https://www.tcavs.tc.edu.tw",
    "電話": "04-22810010#202、208、209",
    "科系與名額": "農場經營科(產特):62(不限)；園藝科(產特):62(不限)；森林科(產特):31(不限)；食品加工科:62(不限)；畜產保健科(產特):31(不限)；土木科(產特):31(不限)；生物產業機電科:31(不限)；觀光事業科:31(不限)；餐飲管理科:62(不限)；幼兒保育科:31(不限)",
    "簡章招生名額": "434",
    "招生名額": "",
    "最低錄取分數": "",
    "分數年度": "",
    "分數來源備註": "",
    "資優班/特色班": "",
    "排序分數": "5400"
  },
  {
    "排名": "27",
    "學校代碼": "080401",
    "學校名稱": "國立仁愛高級農業職業學校",
    "公私立": "公立",
    "招生區": "中投區日間部",
    "學制分類": "高中職",
    "男女校": "男女兼收",
    "縣市": "南投縣",
    "區": "仁愛鄉",
    "地址": "南投縣仁愛鄉大同村山農巷27號",
    "官網": "https://www.ravs.ntct.edu.tw",
    "電話": "049-2802619#203",
    "科系與名額": "農場經營科(產特):9(不限)；園藝科(產特):9(不限)；森林科(產特):9(不限)；空間測繪科(產特):9(不限)；觀光事業科:9(不限)；家政科:9(不限)",
    "簡章招生名額": "54",
    "招生名額": "",
    "最低錄取分數": "",
    "分數年度": "",
    "分數來源備註": "",
    "資優班/特色班": "",
    "排序分數": "5400"
  },
  {
    "排名": "28",
    "學校代碼": "080404",
    "學校名稱": "國立南投高級商業職業學校",
    "公私立": "公立",
    "招生區": "中投區日間部",
    "學制分類": "高中職",
    "男女校": "男女兼收",
    "縣市": "南投縣",
    "區": "南投市",
    "地址": "南投縣南投市彰南路一段993號",
    "官網": "https://www.pntcv.ntct.edu.tw",
    "電話": "049-2222269#2207~2209",
    "科系與名額": "商業經營科:20(不限)；會計事務科:10(不限)；資料處理科:9(不限)；廣告設計科:30(不限)；觀光事業科:10(不限)；餐飲管理科:30(不限)；電子商務科:10(不限)；應用英語科:10(不限)",
    "簡章招生名額": "129",
    "招生名額": "",
    "最低錄取分數": "",
    "分數年度": "",
    "分數來源備註": "",
    "資優班/特色班": "",
    "排序分數": "5400"
  },
  {
    "排名": "29",
    "學校代碼": "080403",
    "學校名稱": "國立埔里高級工業職業學校",
    "公私立": "公立",
    "招生區": "中投區日間部",
    "學制分類": "高中職",
    "男女校": "男女兼收",
    "縣市": "南投縣",
    "區": "埔里鎮",
    "地址": "南投縣埔里鎮中山路一段435號",
    "官網": "https://www.plvs.ntct.edu.tw",
    "電話": "049-2982225#206",
    "科系與名額": "機械科:22(不限)；資訊科:11(不限)；電機科:22(不限)；建築科:22(不限)；化工科:11(不限)",
    "簡章招生名額": "88",
    "招生名額": "",
    "最低錄取分數": "",
    "分數年度": "",
    "分數來源備註": "",
    "資優班/特色班": "",
    "排序分數": "5400"
  },
  {
    "排名": "30",
    "學校代碼": "080308",
    "學校名稱": "國立暨南國際大學附屬高級中學",
    "公私立": "公立",
    "招生區": "中投區日間部",
    "學制分類": "綜合高中",
    "男女校": "男女兼收",
    "縣市": "南投縣",
    "區": "埔里鎮",
    "地址": "南投縣埔里鎮鐵山路1-6號",
    "官網": "https://www.pshs.ntct.edu.tw",
    "電話": "049-2913483#202",
    "科系與名額": "綜合高中:198(不限)；商業經營科:21(不限)；國際貿易科:11(不限)；資料處理科:11(不限)；電子商務科:11(不限)",
    "簡章招生名額": "252",
    "招生名額": "",
    "最低錄取分數": "83 (28)",
    "分數年度": "110",
    "分數來源備註": "CTTW中投區歷年錄取分數查詢 110年；科別:綜合高中",
    "資優班/特色班": "",
    "排序分數": "5400"
  },
  {
    "排名": "31",
    "學校代碼": "080307",
    "學校名稱": "國立竹山高級中學",
    "公私立": "公立",
    "招生區": "中投區日間部",
    "學制分類": "綜合高中",
    "男女校": "男女兼收",
    "縣市": "南投縣",
    "區": "竹山鎮",
    "地址": "南投縣竹山鎮枋坪巷1-3號",
    "官網": "https://www.cshs.ntct.edu.tw",
    "電話": "049-2643344#113、114",
    "科系與名額": "綜合高中:148(不限)；商業經營科:9(不限)；國際貿易科:5(不限)；資料處理科:12(不限)；廣告設計科:12(不限)；多媒體設計科:12(不限)",
    "簡章招生名額": "198",
    "招生名額": "",
    "最低錄取分數": "",
    "分數年度": "",
    "分數來源備註": "",
    "資優班/特色班": "",
    "排序分數": "5400"
  },
  {
    "排名": "32",
    "學校代碼": "080406",
    "學校名稱": "國立草屯高級商工職業學校",
    "公私立": "公立",
    "招生區": "中投區日間部",
    "學制分類": "高中職",
    "男女校": "男女兼收",
    "縣市": "南投縣",
    "區": "草屯鎮",
    "地址": "南投縣草屯鎮芬草路二段736號",
    "官網": "https://www.ttvs.ntct.edu.tw",
    "電話": "049-2362082#1208、1210",
    "科系與名額": "機械科:58(不限)；配管科(產特):29(不限)；商業經營科:120(不限)；會計事務科:61(不限)；資料處理科:61(不限)；應用英語科:29(不限)",
    "簡章招生名額": "358",
    "招生名額": "",
    "最低錄取分數": "",
    "分數年度": "",
    "分數來源備註": "",
    "資優班/特色班": "",
    "排序分數": "5400"
  },
  {
    "排名": "33",
    "學校代碼": "063402",
    "學校名稱": "臺中市立大甲工業高級中等學校",
    "公私立": "公立",
    "招生區": "中投區日間部",
    "學制分類": "高中職",
    "男女校": "男女兼收",
    "縣市": "臺中市",
    "區": "大甲區",
    "地址": "臺中市大甲區開元路71號",
    "官網": "https://tcvs.tc.edu.tw",
    "電話": "04-26874132#113、120",
    "科系與名額": "機械科:65(不限)；資訊科:32(不限)；電子科:64(不限)；電機科:64(不限)；建築科:64(不限)；製圖科:31(不限)",
    "簡章招生名額": "320",
    "招生名額": "",
    "最低錄取分數": "",
    "分數年度": "",
    "分數來源備註": "",
    "資優班/特色班": "",
    "排序分數": "5400"
  },
  {
    "排名": "34",
    "學校代碼": "063404",
    "學校名稱": "臺中市立東勢工業高級中等學校",
    "公私立": "公立",
    "招生區": "中投區日間部",
    "學制分類": "高中職",
    "男女校": "男女兼收",
    "縣市": "臺中市",
    "區": "東勢區",
    "地址": "臺中市東勢區東關路六段1328號",
    "官網": "https://tsvs.tc.edu.tw",
    "電話": "04-25872136#103",
    "科系與名額": "機械科:66(不限)；汽車科:66(不限)；資訊科:32(不限)；電子科:32(不限)；電機科:65(不限)；建築科:32(不限)；化工科:66(不限)；製圖科:32(不限)；室內空間設計科:33(不限)；家具設計科:32(不限)",
    "簡章招生名額": "456",
    "招生名額": "",
    "最低錄取分數": "",
    "分數年度": "",
    "分數來源備註": "",
    "資優班/特色班": "",
    "排序分數": "5400"
  },
  {
    "排名": "35",
    "學校代碼": "063407",
    "學校名稱": "臺中市立沙鹿工業高級中等學校",
    "公私立": "公立",
    "招生區": "中投區日間部",
    "學制分類": "高中職",
    "男女校": "男女兼收",
    "縣市": "臺中市",
    "區": "沙鹿區",
    "地址": "臺中市沙鹿區臺灣大道七段823號",
    "官網": "https://slvs.tc.edu.tw",
    "電話": "04-26621795#203、207",
    "科系與名額": "機械科:31(不限)；汽車科:66(不限)；資訊科:33(不限)；電子科:33(不限)；化工科:66(不限)；紡織科(產特):66(不限)；染整科(產特):33(不限)；製圖科:33(不限)；資料處理科:33(不限)",
    "簡章招生名額": "394",
    "招生名額": "",
    "最低錄取分數": "5B2+",
    "分數年度": "112",
    "分數來源備註": "CTTW中投區歷年錄取分數查詢 112年；科別:商業與管理群",
    "資優班/特色班": "",
    "排序分數": "5400"
  },
  {
    "排名": "36",
    "學校代碼": "064406",
    "學校名稱": "臺中市立神岡工業高級中等學校",
    "公私立": "公立",
    "招生區": "中投區日間部",
    "學制分類": "高中職",
    "男女校": "男女兼收",
    "縣市": "臺中市",
    "區": "神岡區",
    "地址": "臺中市神岡區中山路627號",
    "官網": "https://sgihs.tc.edu.tw",
    "電話": "04-25623421#612",
    "科系與名額": "機械科:56(不限)",
    "簡章招生名額": "56",
    "招生名額": "",
    "最低錄取分數": "",
    "分數年度": "",
    "分數來源備註": "",
    "資優班/特色班": "",
    "排序分數": "5400"
  },
  {
    "排名": "37",
    "學校代碼": "193404",
    "學校名稱": "臺中市立臺中家事商業高級中等學校",
    "公私立": "公立",
    "招生區": "中投區日間部",
    "學制分類": "高中職",
    "男女校": "男女兼收",
    "縣市": "臺中市",
    "區": "東區",
    "地址": "臺中市東區和平街50號",
    "官網": "https://www.tchcvs.tc.edu.tw",
    "電話": "04-22223307#203",
    "科系與名額": "商業經營科:129(不限)；國際貿易科:65(不限)；會計事務科:65(不限)；資料處理科:96(不限)；應用英語科:65(不限)；幼兒保育科:61(不限)；流行服飾科:53(不限)",
    "簡章招生名額": "534",
    "招生名額": "",
    "最低錄取分數": "",
    "分數年度": "",
    "分數來源備註": "",
    "資優班/特色班": "",
    "排序分數": "5400"
  },
  {
    "排名": "38",
    "學校代碼": "193407",
    "學校名稱": "臺中市立臺中工業高級中等學校",
    "公私立": "公立",
    "招生區": "中投區日間部",
    "學制分類": "高中職",
    "男女校": "男女兼收",
    "縣市": "臺中市",
    "區": "南區",
    "地址": "臺中市南區高工路191號",
    "官網": "https://www.tcivs.tc.edu.tw",
    "電話": "04-22613158#2200",
    "科系與名額": "機械科:66(不限)；汽車科:66(不限)；板金科(產特):32(不限)；資訊科:66(不限)；電子科:65(不限)；控制科:66(不限)；電機科:66(不限)；冷凍空調科:66(不限)；建築科:33(不限)；化工科:65(不限)；土木科(產特):32(不限)；圖文傳播科:66(不限)；電腦機械製圖科:66(不限)",
    "簡章招生名額": "755",
    "招生名額": "",
    "最低錄取分數": "93 (73-77)",
    "分數年度": "110",
    "分數來源備註": "CTTW中投區歷年錄取分數查詢 110年；科別:資訊科",
    "資優班/特色班": "",
    "排序分數": "5400"
  },
  {
    "排名": "39",
    "學校代碼": "063401",
    "學校名稱": "臺中市立豐原商業高級中等學校",
    "公私立": "公立",
    "招生區": "中投區日間部",
    "學制分類": "高中職",
    "男女校": "男女兼收",
    "縣市": "臺中市",
    "區": "豐原區",
    "地址": "臺中市豐原區圓環南路50號",
    "官網": "https://fyvs.tc.edu.tw",
    "電話": "04-25283556#212、296",
    "科系與名額": "商業經營科:131(不限)；國際貿易科:131(不限)；資料處理科:99(不限)；應用英語科:66(不限)",
    "簡章招生名額": "427",
    "招生名額": "",
    "最低錄取分數": "",
    "分數年度": "",
    "分數來源備註": "",
    "資優班/特色班": "",
    "排序分數": "5400"
  },
  {
    "排名": "40",
    "學校代碼": "063408",
    "學校名稱": "臺中市立霧峰農業工業高級中等學校",
    "公私立": "公立",
    "招生區": "中投區日間部",
    "學制分類": "高中職",
    "男女校": "男女兼收",
    "縣市": "臺中市",
    "區": "霧峰區",
    "地址": "臺中市霧峰區中正路1222號",
    "官網": "https://wufai.tc.edu.tw",
    "電話": "04-23303118#203",
    "科系與名額": "園藝科(產特):33(不限)；食品加工科:33(不限)；機械科:66(不限)；汽車科:33(不限)；電子科:66(不限)；電機科:66(不限)；餐飲管理科:32(不限)",
    "簡章招生名額": "329",
    "招生名額": "",
    "最低錄取分數": "",
    "分數年度": "",
    "分數來源備註": "",
    "資優班/特色班": "",
    "排序分數": "5400"
  },
  {
    "排名": "41",
    "學校代碼": "061316",
    "學校名稱": "臺中市青年高級中學",
    "公私立": "公立",
    "招生區": "中投區日間部",
    "學制分類": "綜合高中",
    "男女校": "男女兼收",
    "縣市": "臺中市",
    "區": "大里區",
    "地址": "臺中市大里區中湖路100號",
    "官網": "https://www.youth.tc.edu.tw",
    "電話": "04-24963333#212",
    "科系與名額": "綜合高中:108(不限)；汽車科:31(不限)；資訊科:31(不限)；餐飲管理科:36(不限)；美容科:72(不限)；音樂科:36(不限)；表演藝術科:108(不限)；多媒體動畫科:108(不限)",
    "簡章招生名額": "530",
    "招生名額": "",
    "最低錄取分數": "",
    "分數年度": "",
    "分數來源備註": "",
    "資優班/特色班": "",
    "排序分數": "5400"
  },
  {
    "排名": "42",
    "學校代碼": "050314",
    "學校名稱": "國立卓蘭高級中等學校",
    "公私立": "公立",
    "招生區": "共同就學區日間部",
    "學制分類": "高中職",
    "男女校": "男女兼收",
    "縣市": "苗栗縣",
    "區": "卓蘭鎮",
    "地址": "苗栗縣卓蘭鎮老庄里161號",
    "官網": "https://www.jlsh.mlc.edu.tw",
    "電話": "04-25892007#204",
    "科系與名額": "普通科:93(不限)；商業經營科:25(不限)；國際貿易科:25(不限)；資料處理科:25(不限)；電子商務科:25(不限)；應用英語科:25(不限)；幼兒保育科:51(不限)",
    "簡章招生名額": "269",
    "招生名額": "",
    "最低錄取分數": "",
    "分數年度": "",
    "分數來源備註": "",
    "資優班/特色班": "",
    "排序分數": "5300"
  },
  {
    "排名": "43",
    "學校代碼": "050315",
    "學校名稱": "國立苑裡高級中學",
    "公私立": "公立",
    "招生區": "共同就學區日間部",
    "學制分類": "高中",
    "男女校": "男女兼收",
    "縣市": "苗栗縣",
    "區": "苑裡鎮",
    "地址": "苗栗縣苑裡鎮育才街100號",
    "官網": "https://www.ylsh.mlc.edu.tw",
    "電話": "037-868680#202",
    "科系與名額": "普通科:190(不限)",
    "簡章招生名額": "190",
    "招生名額": "",
    "最低錄取分數": "",
    "分數年度": "",
    "分數來源備註": "",
    "資優班/特色班": "",
    "排序分數": "5300"
  },
  {
    "排名": "44",
    "學校代碼": "054308",
    "學校名稱": "苗栗縣立三義高級中學",
    "公私立": "公立",
    "招生區": "共同就學區日間部",
    "學制分類": "高中職",
    "男女校": "男女兼收",
    "縣市": "苗栗縣",
    "區": "三義鄉",
    "地址": "苗栗縣三義鄉廣盛村11鄰122號",
    "官網": "https://sjh.mlc.edu.tw",
    "電話": "037-872015#201",
    "科系與名額": "普通科:5(不限)；餐飲管理科:5(不限)；多媒體設計科:9(不限)",
    "簡章招生名額": "19",
    "招生名額": "",
    "最低錄取分數": "",
    "分數年度": "",
    "分數來源備註": "",
    "資優班/特色班": "",
    "排序分數": "5300"
  },
  {
    "排名": "45",
    "學校代碼": "054309",
    "學校名稱": "苗栗縣立苑裡高級中學",
    "公私立": "公立",
    "招生區": "共同就學區日間部",
    "學制分類": "高中",
    "男女校": "男女兼收",
    "縣市": "苗栗縣",
    "區": "苑裡鎮",
    "地址": "苗栗縣苑裡鎮客庄里新興路19號",
    "官網": "https://yljh.mlc.edu.tw",
    "電話": "037-857042#213",
    "科系與名額": "普通科:57(不限)",
    "簡章招生名額": "57",
    "招生名額": "",
    "最低錄取分數": "",
    "分數年度": "",
    "分數來源備註": "",
    "資優班/特色班": "",
    "排序分數": "5300"
  },
  {
    "排名": "46",
    "學校代碼": "081312",
    "學校名稱": "南投縣私立三育高級中學",
    "公私立": "私立",
    "招生區": "中投區日間部",
    "學制分類": "高中",
    "男女校": "男女兼收",
    "縣市": "南投縣",
    "區": "魚池鄉",
    "地址": "南投縣魚池鄉魚池村瓊文巷39號",
    "官網": "https://www.taa.ntct.edu.tw",
    "電話": "049-2897212#112、114",
    "科系與名額": "普通科:21(不限)；照顧服務科(產特):21(不限)",
    "簡章招生名額": "42",
    "招生名額": "",
    "最低錄取分數": "",
    "分數年度": "",
    "分數來源備註": "",
    "資優班/特色班": "",
    "排序分數": "5000"
  },
  {
    "排名": "47",
    "學校代碼": "081313",
    "學校名稱": "南投縣私立弘明實驗高級中等學校",
    "公私立": "私立",
    "招生區": "中投區日間部",
    "學制分類": "高中",
    "男女校": "男女兼收",
    "縣市": "南投縣",
    "區": "名間鄉",
    "地址": "南投縣名間鄉東湖村大老巷102號",
    "官網": "http://www.holdmean.org.tw",
    "電話": "049-2731799#714",
    "科系與名額": "普通科:23(不限)",
    "簡章招生名額": "23",
    "招生名額": "",
    "最低錄取分數": "",
    "分數年度": "",
    "分數來源備註": "",
    "資優班/特色班": "",
    "排序分數": "5000"
  },
  {
    "排名": "48",
    "學校代碼": "081314",
    "學校名稱": "南投縣私立普台高級中學",
    "公私立": "私立",
    "招生區": "中投區日間部",
    "學制分類": "高中",
    "男女校": "男女兼收",
    "縣市": "南投縣",
    "區": "埔里鎮",
    "地址": "南投縣埔里鎮中台路5號",
    "官網": "https://www.ptsh.ntct.edu.tw",
    "電話": "049-2932899#11222 11224",
    "科系與名額": "普通科:181(不限)",
    "簡章招生名額": "181",
    "招生名額": "",
    "最低錄取分數": "",
    "分數年度": "",
    "分數來源備註": "",
    "資優班/特色班": "",
    "排序分數": "5000"
  },
  {
    "排名": "49",
    "學校代碼": "081409",
    "學校名稱": "同德學校財團法人南投縣同德高級中等學校",
    "公私立": "私立",
    "招生區": "中投區日間部",
    "學制分類": "高中職",
    "男女校": "男女兼收",
    "縣市": "南投縣",
    "區": "草屯鎮",
    "地址": "南投縣草屯鎮中正路培英巷8號",
    "官網": "https://www.tdhs.ntct.edu.tw",
    "電話": "049-2553109#1241",
    "科系與名額": "普通科:113(不限)；餐飲管理科:56(不限)；烘焙科:28(不限)",
    "簡章招生名額": "197",
    "招生名額": "",
    "最低錄取分數": "",
    "分數年度": "",
    "分數來源備註": "",
    "資優班/特色班": "",
    "排序分數": "5000"
  },
  {
    "排名": "50",
    "學校代碼": "191308",
    "學校名稱": "宜寧學校財團法人臺中市宜寧高級中學",
    "公私立": "私立",
    "招生區": "中投區日間部",
    "學制分類": "高中職",
    "男女校": "男女兼收",
    "縣市": "臺中市",
    "區": "西屯區",
    "地址": "臺中市西屯區東大路一段555號",
    "官網": "https://www.inhs.tc.edu.tw",
    "電話": "04- 24621800#204",
    "科系與名額": "普通科:180(不限)；電機科:72(不限)；資料處理科:72(不限)；觀光事業科:72(不限)；電子商務科:36(不限)；應用日語科:36(不限)",
    "簡章招生名額": "468",
    "招生名額": "",
    "最低錄取分數": "",
    "分數年度": "",
    "分數來源備註": "",
    "資優班/特色班": "",
    "排序分數": "5000"
  },
  {
    "排名": "51",
    "學校代碼": "061301",
    "學校名稱": "常春藤學校財團法人臺中市常春藤高級中學",
    "公私立": "私立",
    "招生區": "中投區日間部",
    "學制分類": "高中",
    "男女校": "男女兼收",
    "縣市": "臺中市",
    "區": "潭子區",
    "地址": "臺中市潭子區潭興路一段165巷320號",
    "官網": "https://www.ivyjhs.tc.edu.tw",
    "電話": "04-25395066#114",
    "科系與名額": "普通科:173(不限)",
    "簡章招生名額": "173",
    "招生名額": "",
    "最低錄取分數": "",
    "分數年度": "",
    "分數來源備註": "",
    "資優班/特色班": "",
    "排序分數": "5000"
  },
  {
    "排名": "52",
    "學校代碼": "191309",
    "學校名稱": "明德學校財團法人臺中市明德高級中學",
    "公私立": "私立",
    "招生區": "中投區日間部",
    "學制分類": "高中職",
    "男女校": "男女兼收",
    "縣市": "臺中市",
    "區": "南區",
    "地址": "臺中市南區明德街84號",
    "官網": "https://www.mdhs.tc.edu.tw",
    "電話": "04-22877676#2",
    "科系與名額": "普通科:166(不限)；商業經營科:47(不限)；餐飲管理科:117(不限)；多媒體設計科:45(不限)；幼兒保育科:74(不限)；美容科:117(不限)",
    "簡章招生名額": "566",
    "招生名額": "",
    "最低錄取分數": "85-91 (37-71)",
    "分數年度": "110",
    "分數來源備註": "CTTW中投區歷年錄取分數查詢 110年；科別:普通科",
    "資優班/特色班": "",
    "排序分數": "5000"
  },
  {
    "排名": "53",
    "學校代碼": "061310",
    "學校名稱": "永誠學校財團法人臺中市大明高級中等學校",
    "公私立": "私立",
    "招生區": "中投區日間部",
    "學制分類": "高中職",
    "男女校": "男女兼收",
    "縣市": "臺中市",
    "區": "潭子區",
    "地址": "臺中市潭子區潭興路一段168號",
    "官網": "https://www.tmsh.tc.edu.tw",
    "電話": "04-25391800#202",
    "科系與名額": "普通科:90(不限)；美工科:65(不限)；廣告設計科:65(不限)；多媒體動畫科:65(不限)",
    "簡章招生名額": "285",
    "招生名額": "",
    "最低錄取分數": "",
    "分數年度": "",
    "分數來源備註": "",
    "資優班/特色班": "",
    "排序分數": "5000"
  },
  {
    "排名": "54",
    "學校代碼": "061314",
    "學校名稱": "臺中市私立僑泰高級中學",
    "公私立": "私立",
    "招生區": "中投區日間部",
    "學制分類": "高中職",
    "男女校": "男女兼收",
    "縣市": "臺中市",
    "區": "大里區",
    "地址": "臺中市大里區樹王路342號",
    "官網": "https://www.ctas.tc.edu.tw",
    "電話": "04-24063936#117",
    "科系與名額": "普通科:300(不限)；機械科:71(不限)；汽車科:61(不限)；資訊科:29(不限)；電子科:74(不限)；商業經營科:75(不限)；廣告設計科:32(不限)；觀光事業科:32(不限)；餐飲管理科:96(不限)；多媒體設計科:70(不限)；應用英語科:31(不限)；應用日語科:32(不限)；幼兒保育科:31(不限)；美容科:71(不限)；室內設計科:58(不限)",
    "簡章招生名額": "1063",
    "招生名額": "",
    "最低錄取分數": "83-93 (28-88)",
    "分數年度": "110",
    "分數來源備註": "CTTW中投區歷年錄取分數查詢 110年；科別:普通科",
    "資優班/特色班": "",
    "排序分數": "5000"
  },
  {
    "排名": "55",
    "學校代碼": "191314",
    "學校名稱": "臺中市私立嶺東高級中學",
    "公私立": "私立",
    "招生區": "中投區日間部",
    "學制分類": "高中職",
    "男女校": "男女兼收",
    "縣市": "臺中市",
    "區": "南屯區",
    "地址": "臺中市南屯區嶺東路2號",
    "官網": "https://www.lths.tc.edu.tw",
    "電話": "04-23898940#22",
    "科系與名額": "普通科:235(不限)；汽車科:77(不限)；資訊科:34(不限)；電子科:31(不限)；建築科:34(不限)；商業經營科:34(不限)；廣告設計科:34(不限)；觀光事業科:77(不限)；餐飲管理科:34(不限)；多媒體設計科:77(不限)；應用英語科:34(不限)",
    "簡章招生名額": "701",
    "招生名額": "",
    "最低錄取分數": "85 (33)",
    "分數年度": "110",
    "分數來源備註": "CTTW中投區歷年錄取分數查詢 110年；科別:普通科",
    "資優班/特色班": "",
    "排序分數": "5000"
  },
  {
    "排名": "56",
    "學校代碼": "061317",
    "學校名稱": "臺中市私立弘文高級中學",
    "公私立": "私立",
    "招生區": "中投區日間部",
    "學制分類": "高中",
    "男女校": "男女兼收",
    "縣市": "臺中市",
    "區": "潭子區",
    "地址": "臺中市潭子區弘文街100號",
    "官網": "https://www.hwhs.tc.edu.tw",
    "電話": "04-25340011#118",
    "科系與名額": "普通科:385(不限)",
    "簡章招生名額": "385",
    "招生名額": "",
    "最低錄取分數": "",
    "分數年度": "",
    "分數來源備註": "",
    "資優班/特色班": "",
    "排序分數": "5000"
  },
  {
    "排名": "57",
    "學校代碼": "191305",
    "學校名稱": "臺中市私立新民高級中學",
    "公私立": "私立",
    "招生區": "中投區日間部",
    "學制分類": "高中職",
    "男女校": "男女兼收",
    "縣市": "臺中市",
    "區": "北區",
    "地址": "臺中市北區健行路111號",
    "官網": "https://www.shinmin.tc.edu.tw",
    "電話": "04-22334105#6171~6179",
    "科系與名額": "普通科:363(不限)；機械科:44(不限)；資訊科:92(不限)；電子科:44(不限)；電機科:88(不限)；機電科:44(不限)；商業經營科:118(不限)；資料處理科:36(不限)；廣告設計科:44(不限)；觀光事業科:77(不限)；多媒體設計科:92(不限)；應用英語科:78(不限)；應用日語科:72(不限)；室內設計科:44(不限)；表演藝術科:25(不限)",
    "簡章招生名額": "1261",
    "招生名額": "",
    "最低錄取分數": "87 (44)",
    "分數年度": "110",
    "分數來源備註": "CTTW中投區歷年錄取分數查詢 110年；科別:普通科",
    "資優班/特色班": "",
    "排序分數": "5000"
  },
  {
    "排名": "58",
    "學校代碼": "061313",
    "學校名稱": "臺中市私立明道高級中學",
    "公私立": "私立",
    "招生區": "中投區日間部",
    "學制分類": "高中職",
    "男女校": "男女兼收",
    "縣市": "臺中市",
    "區": "烏日區",
    "地址": "臺中市烏日區中山路一段497號",
    "官網": "https://www.mingdao.edu.tw",
    "電話": "04-23341115",
    "科系與名額": "普通科:111(不限)；資訊科:69(不限)；電子科:69(不限)；美工科:44(不限)；商業經營科:128(不限)；廣告設計科:86(不限)；觀光事業科:27(不限)；餐飲管理科:86(不限)；應用英語科:49(不限)",
    "簡章招生名額": "669",
    "招生名額": "",
    "最低錄取分數": "3A2B8+ 作 文 4",
    "分數年度": "113",
    "分數來源備註": "CTTW中投區歷年錄取分數查詢 113年；科別:普通科",
    "資優班/特色班": "",
    "排序分數": "5000"
  },
  {
    "排名": "59",
    "學校代碼": "191313",
    "學校名稱": "臺中市私立曉明女子高級中學",
    "公私立": "私立",
    "招生區": "中投區日間部",
    "學制分類": "高中",
    "男女校": "女校",
    "縣市": "臺中市",
    "區": "北區",
    "地址": "臺中市北區中清路一段606號",
    "官網": "https://www.smgsh.tc.edu.tw",
    "電話": "04-22921175#131",
    "科系與名額": "普通科:135(女)",
    "簡章招生名額": "135",
    "招生名額": "",
    "最低錄取分數": "3A2B5+作文5",
    "分數年度": "113",
    "分數來源備註": "CTTW中投區歷年錄取分數查詢 113年；科別:普通科",
    "資優班/特色班": "",
    "排序分數": "5000"
  },
  {
    "排名": "60",
    "學校代碼": "061318",
    "學校名稱": "臺中市私立立人高級中學",
    "公私立": "私立",
    "招生區": "中投區日間部",
    "學制分類": "高中",
    "男女校": "男女兼收",
    "縣市": "臺中市",
    "區": "大里區",
    "地址": "臺中市大里區中興路二段380號",
    "官網": "https://www.lzsh.tc.edu.tw",
    "電話": "04-24834138#511~514",
    "科系與名額": "普通科:660(不限)",
    "簡章招生名額": "660",
    "招生名額": "",
    "最低錄取分數": "87-91 (40-73)",
    "分數年度": "110",
    "分數來源備註": "CTTW中投區歷年錄取分數查詢 110年；科別:普通科",
    "資優班/特色班": "",
    "排序分數": "5000"
  },
  {
    "排名": "61",
    "學校代碼": "061309",
    "學校名稱": "臺中市私立致用高級中學",
    "公私立": "私立",
    "招生區": "中投區日間部",
    "學制分類": "高中職",
    "男女校": "男女兼收",
    "縣市": "臺中市",
    "區": "大甲區",
    "地址": "臺中市大甲區甲東路512號",
    "官網": "https://www.cycivs.tc.edu.tw",
    "電話": "04-26872354#311、312",
    "科系與名額": "普通科:31(不限)；機械科:39(不限)；汽車科:39(不限)；資訊科:54(不限)；資料處理科:26(不限)；餐飲管理科:26(不限)；美容科:39(不限)；照顧服務科(產特):16(不限)",
    "簡章招生名額": "270",
    "招生名額": "",
    "最低錄取分數": "4B1C3+",
    "分數年度": "112",
    "分數來源備註": "CTTW中投區歷年錄取分數查詢 112年；科別:餐旅群",
    "資優班/特色班": "",
    "排序分數": "5000"
  },
  {
    "排名": "62",
    "學校代碼": "191311",
    "學校名稱": "臺中市私立衛道高級中學",
    "公私立": "私立",
    "招生區": "中投區日間部",
    "學制分類": "高中",
    "男女校": "男女兼收",
    "縣市": "臺中市",
    "區": "北屯區",
    "地址": "臺中市北屯區四平路161號",
    "官網": "https://www.vtsh.tc.edu.tw",
    "電話": "04-22911187# 230",
    "科系與名額": "普通科:180(不限)",
    "簡章招生名額": "180",
    "招生名額": "",
    "最低錄取分數": "3A2B5+作文4",
    "分數年度": "113",
    "分數來源備註": "CTTW中投區歷年錄取分數查詢 113年；科別:普通科",
    "資優班/特色班": "",
    "排序分數": "5000"
  },
  {
    "排名": "63",
    "學校代碼": "191302",
    "學校名稱": "葳格學校財團法人臺中市葳格高級中學",
    "公私立": "私立",
    "招生區": "中投區日間部",
    "學制分類": "高中職",
    "男女校": "男女兼收",
    "縣市": "臺中市",
    "區": "北屯區",
    "地址": "臺中市北屯區軍福十八路328號",
    "官網": "https://senior.wagor.tc.edu.tw",
    "電話": "04-24371728#712",
    "科系與名額": "普通科:45(不限)；餐飲管理科:42(不限)",
    "簡章招生名額": "87",
    "招生名額": "",
    "最低錄取分數": "87 (49)",
    "分數年度": "110",
    "分數來源備註": "CTTW中投區歷年錄取分數查詢 110年；科別:普通科",
    "資優班/特色班": "",
    "排序分數": "5000"
  },
  {
    "排名": "64",
    "學校代碼": "191301",
    "學校名稱": "財團法人東海大學附屬高級中等學校",
    "公私立": "私立",
    "招生區": "中投區日間部",
    "學制分類": "高中",
    "男女校": "男女兼收",
    "縣市": "臺中市",
    "區": "西屯區",
    "地址": "臺中市西屯區臺灣大道四段1727號",
    "官網": "https://www.hn.thu.edu.tw/index.php",
    "電話": "04-23590269#1220",
    "科系與名額": "普通科:177(不限)",
    "簡章招生名額": "177",
    "招生名額": "",
    "最低錄取分數": "",
    "分數年度": "",
    "分數來源備註": "",
    "資優班/特色班": "",
    "排序分數": "5000"
  },
  {
    "排名": "65",
    "學校代碼": "191412",
    "學校名稱": "光華學校財團法人臺中市高級工業職業學校",
    "公私立": "私立",
    "招生區": "中投區日間部",
    "學制分類": "高中職",
    "男女校": "男女兼收",
    "縣市": "臺中市",
    "區": "太平區",
    "地址": "臺中市太平區東平路18號",
    "官網": "https://www.khvs.tc.edu.tw",
    "電話": "04-23949009#1120",
    "科系與名額": "機械科:23(不限)；電機科:23(不限)；消防工程科:23(不限)",
    "簡章招生名額": "69",
    "招生名額": "",
    "最低錄取分數": "",
    "分數年度": "",
    "分數來源備註": "",
    "資優班/特色班": "",
    "排序分數": "4300"
  },
  {
    "排名": "66",
    "學校代碼": "081311",
    "學校名稱": "南投縣私立五育高級中學",
    "公私立": "私立",
    "招生區": "中投區日間部",
    "學制分類": "高中職",
    "男女校": "男女兼收",
    "縣市": "南投縣",
    "區": "南投市",
    "地址": "南投縣南投市嘉和里樂利路200號",
    "官網": "https://www.wu-yu.ntct.edu.tw",
    "電話": "049-2246346#204",
    "科系與名額": "美容科:25(不限)；照顧服務科(產特):25(不限)；多媒體動畫科:25(不限)",
    "簡章招生名額": "75",
    "招生名額": "",
    "最低錄取分數": "",
    "分數年度": "",
    "分數來源備註": "",
    "資優班/特色班": "",
    "排序分數": "4300"
  },
  {
    "排名": "67",
    "學校代碼": "061321",
    "學校名稱": "慈明學校財團法人臺中市慈明高級中等學校",
    "公私立": "私立",
    "招生區": "中投區日間部",
    "學制分類": "高中職",
    "男女校": "男女兼收",
    "縣市": "臺中市",
    "區": "太平區",
    "地址": "臺中市太平區光德路388號",
    "官網": "https://www.tmhs.tc.edu.tw",
    "電話": "04-22713911#102",
    "科系與名額": "資訊科:34(不限)；餐飲管理科:29(不限)；電子商務科:34(不限)；照顧服務科(產特):34(不限)",
    "簡章招生名額": "131",
    "招生名額": "",
    "最低錄取分數": "",
    "分數年度": "",
    "分數來源備註": "",
    "資優班/特色班": "",
    "排序分數": "4300"
  },
  {
    "排名": "68",
    "學校代碼": "061306",
    "學校名稱": "臺中市明台高級中學",
    "公私立": "私立",
    "招生區": "中投區日間部",
    "學制分類": "高中職",
    "男女校": "男女兼收",
    "縣市": "臺中市",
    "區": "霧峰區",
    "地址": "臺中市霧峰區萊園路91號",
    "官網": "https://www.mths.tc.edu.tw",
    "電話": "04-23393071#210、211",
    "科系與名額": "資料處理科:87(不限)；觀光事業科:83(不限)；餐飲管理科:55(不限)；幼兒保育科:43(不限)；美容科:42(不限)；室內設計科:60(不限)",
    "簡章招生名額": "370",
    "招生名額": "",
    "最低錄取分數": "",
    "分數年度": "",
    "分數來源備註": "",
    "資優班/特色班": "",
    "排序分數": "4300"
  },
  {
    "排名": "69",
    "學校代碼": "061319",
    "學校名稱": "臺中市私立玉山高級中學",
    "公私立": "私立",
    "招生區": "中投區日間部",
    "學制分類": "高中職",
    "男女校": "男女兼收",
    "縣市": "臺中市",
    "區": "東勢區",
    "地址": "臺中市東勢區東崎路四段399號",
    "官網": "https://www.yssh.tc.edu.tw",
    "電話": "04-25771313#103",
    "科系與名額": "觀光事業科:33(不限)；餐飲管理科:33(不限)；照顧服務科(產特):33(不限)",
    "簡章招生名額": "99",
    "招生名額": "",
    "最低錄取分數": "",
    "分數年度": "",
    "分數來源備註": "",
    "資優班/特色班": "",
    "排序分數": "4300"
  },
  {
    "排名": "70",
    "學校代碼": "050401",
    "學校名稱": "國立大湖高級農工職業學校",
    "公私立": "公立",
    "招生區": "共同就學區日間部",
    "學制分類": "高中職",
    "男女校": "男女兼收",
    "縣市": "苗栗縣",
    "區": "大湖鄉",
    "地址": "苗栗縣大湖鄉大寮村竹高屋68號",
    "官網": "https://www.thvs.mlc.edu.tw",
    "電話": "037-992216#403",
    "科系與名額": "園藝科(產特):4(不限)；食品加工科:4(不限)；機械科:4(不限)；電機科:4(不限)；室內空間設計科:4(不限)",
    "簡章招生名額": "20",
    "招生名額": "",
    "最低錄取分數": "",
    "分數年度": "",
    "分數來源備註": "",
    "資優班/特色班": "",
    "排序分數": "4200"
  },
  {
    "排名": "71",
    "學校代碼": "051307",
    "學校名稱": "全人學校財團法人苗栗縣全人實驗高級中等學校",
    "公私立": "私立",
    "招生區": "共同就學區日間部",
    "學制分類": "高中",
    "男女校": "男女兼收",
    "縣市": "苗栗縣",
    "區": "卓蘭鎮",
    "地址": "苗栗縣卓蘭鎮內灣里內灣141-3號",
    "官網": "https://holistic.org.tw",
    "電話": "04-25896909、25896910",
    "科系與名額": "普通科:5(不限)",
    "簡章招生名額": "5",
    "招生名額": "",
    "最低錄取分數": "",
    "分數年度": "",
    "分數來源備註": "",
    "資優班/特色班": "",
    "排序分數": "3800"
  },
  {
    "排名": "72",
    "學校代碼": "071414",
    "學校名稱": "彰化縣私立達德高級商工職業學校",
    "公私立": "私立",
    "招生區": "共同就學區日間部",
    "學制分類": "高中職",
    "男女校": "男女兼收",
    "縣市": "彰化縣",
    "區": "田中鎮",
    "地址": "彰化縣田中鎮中南路二段277號",
    "官網": "https://www.tdvs.chc.edu.tw",
    "電話": "04-8753929#108",
    "科系與名額": "汽車科:2(不限)；電機科:1(不限)；資料處理科:1(不限)；餐飲管理科:2(不限)；幼兒保育科:2(不限)；美容科:1(不限)",
    "簡章招生名額": "9",
    "招生名額": "",
    "最低錄取分數": "",
    "分數年度": "",
    "分數來源備註": "",
    "資優班/特色班": "",
    "排序分數": "3100"
  },
  {
    "排名": "73",
    "學校代碼": "091318",
    "學校名稱": "義峰學校財團法人雲林縣義峰高級中學",
    "公私立": "私立",
    "招生區": "共同就學區日間部",
    "學制分類": "高中職",
    "男女校": "男女兼收",
    "縣市": "雲林縣",
    "區": "林內鄉",
    "地址": "雲林縣林內鄉烏麻村長源201號",
    "官網": "http://www.yfsh.ylc.edu.tw",
    "電話": "05-5800099#521、523",
    "科系與名額": "餐飲管理科:3(不限)；照顧服務科(產特):3(不限)；多媒體動畫科:3(不限)",
    "簡章招生名額": "9",
    "招生名額": "",
    "最低錄取分數": "",
    "分數年度": "",
    "分數來源備註": "",
    "資優班/特色班": "",
    "排序分數": "3100"
  },
  {
    "排名": "74",
    "學校代碼": "051413",
    "學校名稱": "苗栗縣私立龍德家事商業職業學校",
    "公私立": "私立",
    "招生區": "共同就學區日間部",
    "學制分類": "高中職",
    "男女校": "男女兼收",
    "縣市": "苗栗縣",
    "區": "苑裡鎮",
    "地址": "苗栗縣苑裡鎮房裡里南房75之1號",
    "官網": "http://www.ldvs.mlc.edu.tw",
    "電話": "037-851277#121、122",
    "科系與名額": "家具木工科(產特):15(不限)",
    "簡章招生名額": "15",
    "招生名額": "",
    "最低錄取分數": "",
    "分數年度": "",
    "分數來源備註": "",
    "資優班/特色班": "",
    "排序分數": "3100"
  },
  {
    "排名": "75",
    "學校代碼": "063C07",
    "學校名稱": "臺中市立沙鹿工業高級中等學校進修部",
    "公私立": "公立",
    "招生區": "中投區/共同就學區進修部",
    "學制分類": "高中職/進修部",
    "男女校": "男女兼收",
    "縣市": "臺中市",
    "區": "沙鹿區",
    "地址": "臺中市沙鹿區臺灣大道七段823號",
    "官網": "https://slvs.tc.edu.tw",
    "電話": "04-26621795#262",
    "科系與名額": "機械科:34(不限)；汽車科:34(不限)；電子科:34(不限)；紡織科(產特):34(不限)",
    "簡章招生名額": "136",
    "招生名額": "",
    "最低錄取分數": "5B2+",
    "分數年度": "112",
    "分數來源備註": "CTTW中投區歷年錄取分數查詢 112年；科別:商業與管理群",
    "資優班/特色班": "",
    "排序分數": "2770"
  },
  {
    "排名": "76",
    "學校代碼": "190C06",
    "學校名稱": "國立中興大學附屬臺中高級農業職業學校進修部",
    "公私立": "公立",
    "招生區": "中投區/共同就學區進修部",
    "學制分類": "高中職/進修部",
    "男女校": "男女兼收",
    "縣市": "臺中市",
    "區": "東區",
    "地址": "臺中市東區台中路283號",
    "官網": "https://www.tcavs.tc.edu.tw/night/",
    "電話": "04-22810010#702",
    "科系與名額": "農場經營科(產特):26(不限)；園藝科(產特):26(不限)；觀光事業科:26(不限)；餐飲管理科:26(不限)",
    "簡章招生名額": "104",
    "招生名額": "",
    "最低錄取分數": "",
    "分數年度": "",
    "分數來源備註": "",
    "資優班/特色班": "",
    "排序分數": "1700"
  },
  {
    "排名": "77",
    "學校代碼": "080B05",
    "學校名稱": "國立中興高級中學進修部",
    "公私立": "公立",
    "招生區": "中投區/共同就學區進修部",
    "學制分類": "高中職/進修部",
    "男女校": "男女兼收",
    "縣市": "南投縣",
    "區": "南投市",
    "地址": "南投縣南投市中興新村中學路2號",
    "官網": "https://www.chsh.ntct.edu.tw",
    "電話": "049-2332110#1702",
    "科系與名額": "商業經營科:36(不限)；資料處理科:36(不限)",
    "簡章招生名額": "72",
    "招生名額": "",
    "最低錄取分數": "89 (60)",
    "分數年度": "110",
    "分數來源備註": "CTTW中投區歷年錄取分數查詢 110年；科別:普通科",
    "資優班/特色班": "",
    "排序分數": "1700"
  },
  {
    "排名": "78",
    "學校代碼": "050B14",
    "學校名稱": "國立卓蘭高級中等學校進修部",
    "公私立": "公立",
    "招生區": "中投區/共同就學區進修部",
    "學制分類": "高中職/進修部",
    "男女校": "男女兼收",
    "縣市": "苗栗縣",
    "區": "卓蘭鎮",
    "地址": "苗栗縣卓蘭鎮老庄里161號",
    "官網": "https://www.jlsh.mlc.edu.tw",
    "電話": "04-25895645",
    "科系與名額": "資料處理科:20(不限)",
    "簡章招生名額": "20",
    "招生名額": "",
    "最低錄取分數": "",
    "分數年度": "",
    "分數來源備註": "",
    "資優班/特色班": "",
    "排序分數": "1700"
  },
  {
    "排名": "79",
    "學校代碼": "080C04",
    "學校名稱": "國立南投高級商業職業學校進修部",
    "公私立": "公立",
    "招生區": "中投區/共同就學區進修部",
    "學制分類": "高中職/進修部",
    "男女校": "男女兼收",
    "縣市": "南投縣",
    "區": "南投市",
    "地址": "南投縣南投市彰南路一段993號",
    "官網": "https://www.pntcv.ntct.edu.tw",
    "電話": "049-2222269#2312~2316",
    "科系與名額": "商業經營科:26(不限)；資料處理科:26(不限)",
    "簡章招生名額": "52",
    "招生名額": "",
    "最低錄取分數": "",
    "分數年度": "",
    "分數來源備註": "",
    "資優班/特色班": "",
    "排序分數": "1700"
  },
  {
    "排名": "80",
    "學校代碼": "080B08",
    "學校名稱": "國立暨南國際大學附屬高級中學進修部",
    "公私立": "公立",
    "招生區": "中投區/共同就學區進修部",
    "學制分類": "高中職/進修部",
    "男女校": "男女兼收",
    "縣市": "南投縣",
    "區": "埔里鎮",
    "地址": "南投縣埔里鎮鐵山路1-6號",
    "官網": "https://www.pshs.ntct.edu.tw",
    "電話": "049-2913483#711",
    "科系與名額": "商業經營科:16(不限)；資料處理科:16(不限)",
    "簡章招生名額": "32",
    "招生名額": "",
    "最低錄取分數": "83 (28)",
    "分數年度": "110",
    "分數來源備註": "CTTW中投區歷年錄取分數查詢 110年；科別:綜合高中",
    "資優班/特色班": "",
    "排序分數": "1700"
  },
  {
    "排名": "81",
    "學校代碼": "080C10",
    "學校名稱": "國立水里高級商工職業學校進修部",
    "公私立": "公立",
    "招生區": "中投區/共同就學區進修部",
    "學制分類": "高中職/進修部",
    "男女校": "男女兼收",
    "縣市": "南投縣",
    "區": "水里鄉",
    "地址": "南投縣水里鄉南湖路2號",
    "官網": "https://www.slvs.ntct.edu.tw",
    "電話": "049-2870666#350",
    "科系與名額": "餐飲管理科:18(不限)",
    "簡章招生名額": "18",
    "招生名額": "",
    "最低錄取分數": "83 (28)",
    "分數年度": "110",
    "分數來源備註": "CTTW中投區歷年錄取分數查詢 110年；科別:普通科",
    "資優班/特色班": "",
    "排序分數": "1700"
  },
  {
    "排名": "82",
    "學校代碼": "080B07",
    "學校名稱": "國立竹山高級中學進修部",
    "公私立": "公立",
    "招生區": "中投區/共同就學區進修部",
    "學制分類": "高中職/進修部",
    "男女校": "男女兼收",
    "縣市": "南投縣",
    "區": "竹山鎮",
    "地址": "南投縣竹山鎮枋坪巷1-3號",
    "官網": "https://www.cshs.ntct.edu.tw",
    "電話": "049-2643344#141",
    "科系與名額": "資料處理科:12(不限)",
    "簡章招生名額": "12",
    "招生名額": "",
    "最低錄取分數": "",
    "分數年度": "",
    "分數來源備註": "",
    "資優班/特色班": "",
    "排序分數": "1700"
  },
  {
    "排名": "83",
    "學校代碼": "080C06",
    "學校名稱": "國立草屯高級商工職業學校進修部",
    "公私立": "公立",
    "招生區": "中投區/共同就學區進修部",
    "學制分類": "高中職/進修部",
    "男女校": "男女兼收",
    "縣市": "南投縣",
    "區": "草屯鎮",
    "地址": "南投縣草屯鎮芬草路二段736號",
    "官網": "https://www.ttvs.ntct.edu.tw",
    "電話": "049-2362082#3138、3140",
    "科系與名額": "機械科:15(不限)；商業經營科:15(不限)；資料處理科:15(不限)",
    "簡章招生名額": "45",
    "招生名額": "",
    "最低錄取分數": "",
    "分數年度": "",
    "分數來源備註": "",
    "資優班/特色班": "",
    "排序分數": "1700"
  },
  {
    "排名": "84",
    "學校代碼": "063C02",
    "學校名稱": "臺中市立大甲工業高級中等學校進修部",
    "公私立": "公立",
    "招生區": "中投區/共同就學區進修部",
    "學制分類": "高中職/進修部",
    "男女校": "男女兼收",
    "縣市": "臺中市",
    "區": "大甲區",
    "地址": "臺中市大甲區頂店里開元路71號",
    "官網": "https://tcvs.tc.edu.tw",
    "電話": "04-26874132#502",
    "科系與名額": "建築科:38(不限)",
    "簡章招生名額": "38",
    "招生名額": "",
    "最低錄取分數": "",
    "分數年度": "",
    "分數來源備註": "",
    "資優班/特色班": "",
    "排序分數": "1700"
  },
  {
    "排名": "85",
    "學校代碼": "063C04",
    "學校名稱": "臺中市立東勢工業高級中等學校進修部",
    "公私立": "公立",
    "招生區": "中投區/共同就學區進修部",
    "學制分類": "高中職/進修部",
    "男女校": "男女兼收",
    "縣市": "臺中市",
    "區": "東勢區",
    "地址": "臺中市東勢區東關路六段1328號",
    "官網": "https://tsvs.tc.edu.tw",
    "電話": "04-25872136#607",
    "科系與名額": "機械科:37(不限)",
    "簡章招生名額": "37",
    "招生名額": "",
    "最低錄取分數": "",
    "分數年度": "",
    "分數來源備註": "",
    "資優班/特色班": "",
    "排序分數": "1700"
  },
  {
    "排名": "86",
    "學校代碼": "193C04",
    "學校名稱": "臺中市立臺中家事商業高級中等學校進修部",
    "公私立": "公立",
    "招生區": "中投區/共同就學區進修部",
    "學制分類": "高中職/進修部",
    "男女校": "男女兼收",
    "縣市": "臺中市",
    "區": "東區",
    "地址": "臺中市東區和平街50號",
    "官網": "https://www.tchcvs.tc.edu.tw",
    "電話": "04-22223307#703、713",
    "科系與名額": "商業經營科:32(不限)；國際貿易科:32(不限)；資料處理科:32(不限)",
    "簡章招生名額": "96",
    "招生名額": "",
    "最低錄取分數": "",
    "分數年度": "",
    "分數來源備註": "",
    "資優班/特色班": "",
    "排序分數": "1700"
  },
  {
    "排名": "87",
    "學校代碼": "193C07",
    "學校名稱": "臺中市立臺中工業高級中等學校進修部",
    "公私立": "公立",
    "招生區": "中投區/共同就學區進修部",
    "學制分類": "高中職/進修部",
    "男女校": "男女兼收",
    "縣市": "臺中市",
    "區": "南區",
    "地址": "臺中市南區高工路191號",
    "官網": "https://www.tcivs.tc.edu.tw",
    "電話": "04-22613158#6504",
    "科系與名額": "機械科:20(不限)；汽車科:20(不限)；電機科:20(不限)；建築科:20(不限)",
    "簡章招生名額": "80",
    "招生名額": "",
    "最低錄取分數": "93 (73-77)",
    "分數年度": "110",
    "分數來源備註": "CTTW中投區歷年錄取分數查詢 110年；科別:資訊科",
    "資優班/特色班": "",
    "排序分數": "1700"
  },
  {
    "排名": "88",
    "學校代碼": "063C01",
    "學校名稱": "臺中市立豐原商業高級中等學校進修部",
    "公私立": "公立",
    "招生區": "中投區/共同就學區進修部",
    "學制分類": "高中職/進修部",
    "男女校": "男女兼收",
    "縣市": "臺中市",
    "區": "豐原區",
    "地址": "臺中市豐原區圓環南路50號",
    "官網": "https://fyvs.tc.edu.tw",
    "電話": "04-25283556#262",
    "科系與名額": "商業經營科:15(不限)；資料處理科:10(不限)",
    "簡章招生名額": "25",
    "招生名額": "",
    "最低錄取分數": "",
    "分數年度": "",
    "分數來源備註": "",
    "資優班/特色班": "",
    "排序分數": "1700"
  },
  {
    "排名": "89",
    "學校代碼": "063C08",
    "學校名稱": "臺中市立霧峰農業工業高級中等學校進修部",
    "公私立": "公立",
    "招生區": "中投區/共同就學區進修部",
    "學制分類": "高中職/進修部",
    "男女校": "男女兼收",
    "縣市": "臺中市",
    "區": "霧峰區",
    "地址": "臺中市霧峰區中正路1222號",
    "官網": "https://wufai.tc.edu.tw",
    "電話": "04-23303118#802",
    "科系與名額": "食品加工科:20(不限)；汽車科:20(不限)",
    "簡章招生名額": "40",
    "招生名額": "",
    "最低錄取分數": "",
    "分數年度": "",
    "分數來源備註": "",
    "資優班/特色班": "",
    "排序分數": "1700"
  },
  {
    "排名": "90",
    "學校代碼": "061B16",
    "學校名稱": "臺中市青年高級中學進修部",
    "公私立": "公立",
    "招生區": "中投區/共同就學區進修部",
    "學制分類": "高中職/進修部",
    "男女校": "男女兼收",
    "縣市": "臺中市",
    "區": "大里區",
    "地址": "臺中市大里區中湖路100號",
    "官網": "https://www.youth.tc.edu.tw",
    "電話": "04-24963333#212",
    "科系與名額": "餐飲管理科:40(不限)；照顧服務科(產特):40(不限)；餐飲管理科:40(不限)；美容科:40(不限)",
    "簡章招生名額": "160",
    "招生名額": "",
    "最低錄取分數": "",
    "分數年度": "",
    "分數來源備註": "",
    "資優班/特色班": "",
    "排序分數": "1700"
  },
  {
    "排名": "91",
    "學校代碼": "191B05",
    "學校名稱": "臺中市私立新民高級中學進修部",
    "公私立": "私立",
    "招生區": "中投區/共同就學區進修部",
    "學制分類": "高中職/進修部",
    "男女校": "男女兼收",
    "縣市": "臺中市",
    "區": "北區",
    "地址": "臺中市北區健行路111號",
    "官網": "https://www.shinmin.tc.edu.tw",
    "電話": "04-22334105#6167",
    "科系與名額": "普通科:40(不限)；機械科:40(不限)；電機科:40(不限)；商業經營科:40(不限)；觀光事業科:40(不限)；多媒體設計科:40(不限)；應用英語科:40(不限)；應用日語科:40(不限)",
    "簡章招生名額": "320",
    "招生名額": "",
    "最低錄取分數": "87 (44)",
    "分數年度": "110",
    "分數來源備註": "CTTW中投區歷年錄取分數查詢 110年；科別:普通科",
    "資優班/特色班": "",
    "排序分數": "1300"
  },
  {
    "排名": "92",
    "學校代碼": "191B14",
    "學校名稱": "臺中市私立嶺東高級中學進修部",
    "公私立": "私立",
    "招生區": "中投區/共同就學區進修部",
    "學制分類": "高中職/進修部",
    "男女校": "男女兼收",
    "縣市": "臺中市",
    "區": "南屯區",
    "地址": "臺中市南屯區嶺東路2號",
    "官網": "https://www.lths.tc.edu.tw",
    "電話": "04-23898940#52",
    "科系與名額": "資訊科:40(不限)；商業經營科:40(不限)；資料處理科:40(不限)；觀光事業科:80(不限)",
    "簡章招生名額": "200",
    "招生名額": "",
    "最低錄取分數": "85 (33)",
    "分數年度": "110",
    "分數來源備註": "CTTW中投區歷年錄取分數查詢 110年；科別:普通科",
    "資優班/特色班": "",
    "排序分數": "850"
  },
  {
    "排名": "93",
    "學校代碼": "061B14",
    "學校名稱": "臺中市私立僑泰高級中學進修部",
    "公私立": "私立",
    "招生區": "中投區/共同就學區進修部",
    "學制分類": "高中職/進修部",
    "男女校": "男女兼收",
    "縣市": "臺中市",
    "區": "大里區",
    "地址": "臺中市大里區樹王路342號",
    "官網": "https://www.ctas.tc.edu.tw",
    "電話": "04-24063936#152",
    "科系與名額": "汽車科:40(不限)；觀光事業科:40(不限)；餐飲管理科:80(不限)；美容科:80(不限)；流行服飾科:40(不限)",
    "簡章招生名額": "280",
    "招生名額": "",
    "最低錄取分數": "83-93 (28-88)",
    "分數年度": "110",
    "分數來源備註": "CTTW中投區歷年錄取分數查詢 110年；科別:普通科",
    "資優班/特色班": "",
    "排序分數": "830"
  },
  {
    "排名": "94",
    "學校代碼": "061B11",
    "學校名稱": "嘉陽學校財團法人臺中市嘉陽高級中學進修部",
    "公私立": "私立",
    "招生區": "中投區/共同就學區進修部",
    "學制分類": "高中職/進修部",
    "男女校": "男女兼收",
    "縣市": "臺中市",
    "區": "清水區",
    "地址": "臺中市清水區中航路三段1號",
    "官網": "https://www.cysh.tc.edu.tw",
    "電話": "04-26152166# 2221",
    "科系與名額": "餐飲管理科:120(不限)",
    "簡章招生名額": "120",
    "招生名額": "",
    "最低錄取分數": "",
    "分數年度": "",
    "分數來源備註": "",
    "資優班/特色班": "",
    "排序分數": "600"
  },
  {
    "排名": "95",
    "學校代碼": "061B21",
    "學校名稱": "慈明學校財團法人臺中市慈明高級中等學校進修部",
    "公私立": "私立",
    "招生區": "中投區/共同就學區進修部",
    "學制分類": "高中職/進修部",
    "男女校": "男女兼收",
    "縣市": "臺中市",
    "區": "太平區",
    "地址": "臺中市太平區光德路388號",
    "官網": "https://www.gapp.tmhs.tc.edu.tw",
    "電話": "04-22713911#501~503",
    "科系與名額": "餐飲管理科:80(不限)",
    "簡章招生名額": "80",
    "招生名額": "",
    "最低錄取分數": "",
    "分數年度": "",
    "分數來源備註": "",
    "資優班/特色班": "",
    "排序分數": "600"
  },
  {
    "排名": "96",
    "學校代碼": "061B19",
    "學校名稱": "臺中市私立玉山高級中學進修部",
    "公私立": "私立",
    "招生區": "中投區/共同就學區進修部",
    "學制分類": "高中職/進修部",
    "男女校": "男女兼收",
    "縣市": "臺中市",
    "區": "東勢區",
    "地址": "臺中市東勢區東崎路四段399號",
    "官網": "https://www.yssh.tc.edu.tw",
    "電話": "04-25771313#103",
    "科系與名額": "資料處理科:10(不限)；餐飲管理科:20(不限)；美容科:10(不限)；照顧服務科(產特):20(不限)",
    "簡章招生名額": "60",
    "招生名額": "",
    "最低錄取分數": "",
    "分數年度": "",
    "分數來源備註": "",
    "資優班/特色班": "",
    "排序分數": "600"
  },
  {
    "排名": "97",
    "學校代碼": "",
    "學校名稱": "",
    "公私立": "",
    "招生區": "",
    "學制分類": "",
    "男女校": "",
    "縣市": "",
    "區": "",
    "地址": "",
    "官網": "",
    "電話": "",
    "科系與名額": "",
    "簡章招生名額": "",
    "招生名額": "",
    "最低錄取分數": "",
    "分數年度": "",
    "分數來源備註": "",
    "資優班/特色班": "",
    "排序分數": ""
  },
  {
    "排名": "98",
    "學校代碼": "",
    "學校名稱": "",
    "公私立": "",
    "招生區": "",
    "學制分類": "",
    "男女校": "",
    "縣市": "",
    "區": "",
    "地址": "",
    "官網": "",
    "電話": "",
    "科系與名額": "",
    "簡章招生名額": "",
    "招生名額": "",
    "最低錄取分數": "",
    "分數年度": "",
    "分數來源備註": "",
    "資優班/特色班": "",
    "排序分數": ""
  },
  {
    "排名": "99",
    "學校代碼": "",
    "學校名稱": "",
    "公私立": "",
    "招生區": "",
    "學制分類": "",
    "男女校": "",
    "縣市": "",
    "區": "",
    "地址": "",
    "官網": "",
    "電話": "",
    "科系與名額": "",
    "簡章招生名額": "",
    "招生名額": "",
    "最低錄取分數": "",
    "分數年度": "",
    "分數來源備註": "",
    "資優班/特色班": "",
    "排序分數": ""
  },
  {
    "排名": "100",
    "學校代碼": "",
    "學校名稱": "",
    "公私立": "",
    "招生區": "",
    "學制分類": "",
    "男女校": "",
    "縣市": "",
    "區": "",
    "地址": "",
    "官網": "",
    "電話": "",
    "科系與名額": "",
    "簡章招生名額": "",
    "招生名額": "",
    "最低錄取分數": "",
    "分數年度": "",
    "分數來源備註": "",
    "資優班/特色班": "",
    "排序分數": ""
  },
  {
    "排名": "101",
    "學校代碼": "",
    "學校名稱": "",
    "公私立": "",
    "招生區": "",
    "學制分類": "",
    "男女校": "",
    "縣市": "",
    "區": "",
    "地址": "",
    "官網": "",
    "電話": "",
    "科系與名額": "",
    "簡章招生名額": "",
    "招生名額": "",
    "最低錄取分數": "",
    "分數年度": "",
    "分數來源備註": "",
    "資優班/特色班": "",
    "排序分數": ""
  }
];

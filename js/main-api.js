// Главная страница - отображение активных турниров (с API)

let allTournaments = [];
let selectedDiscipline = 'all';

// Функция для нормализации даты к формату "день месяц год"
function formatDateForDisplay(dateStr) {
    try {
        // Проверяем, уже ли это русский формат
        if (dateStr.match(/\d+\s+\w+\s+\d+/)) {
            return dateStr;
        }
        
        // Парсим YYYY-MM-DD
        const parts = dateStr.match(/(\d{4})-(\d{2})-(\d{2})/);
        if (parts) {
            const [, year, month, day] = parts;
            const months = [
                'января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
                'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'
            ];
            return `${parseInt(day)} ${months[parseInt(month) - 1]} ${year} г.`;
        }
        
        return dateStr; // Если не удалось распарсить, возвращаем как есть
    } catch (e) {
        return dateStr;
    }
}

// Функция инициализации страницы
async function initializeMainPage() {
    console.log('🚀 Инициализация главной страницы...');
    
    // Устанавливаем таймаут для принудительного скрытия loader (10 секунд)
    const loaderTimeout = setTimeout(() => {
        console.warn('⚠️ Таймаут загрузки - принудительно скрываем loader');
        hideLoader();
    }, 10000);
    
    try {
        // Загружаем данные с таймаутами для каждого запроса
        await Promise.race([
            loadActiveTournaments(),
            new Promise((_, reject) => setTimeout(() => reject(new Error('Таймаут загрузки турниров')), 8000))
        ]).catch(err => {
            console.error('❌ Ошибка загрузки турниров:', err);
            // Показываем сообщение об ошибке
            const grid = document.getElementById('tournaments-grid');
            if (grid) {
                grid.innerHTML = `
                    <div class="empty-state">
                        <h3>Ошибка загрузки турниров</h3>
                        <p>Проверьте подключение к интернету и обновите страницу</p>
                        <button onclick="location.reload()" class="btn-submit" style="margin-top: 20px;">Обновить страницу</button>
                    </div>
                `;
            }
        });
        
        // Загружаем социальные ссылки (не критично, можно пропустить)
        await Promise.race([
            loadSocialLinks(),
            new Promise((_, reject) => setTimeout(() => reject(new Error('Таймаут загрузки ссылок')), 5000))
        ]).catch(err => {
            console.warn('⚠️ Ошибка загрузки социальных ссылок:', err);
        });
        
        // Загружаем фильтры (не критично, можно пропустить)
        await Promise.race([
            loadDisciplineFilters(),
            new Promise((_, reject) => setTimeout(() => reject(new Error('Таймаут загрузки фильтров')), 5000))
        ]).catch(err => {
            console.warn('⚠️ Ошибка загрузки фильтров:', err);
        });
        
        clearTimeout(loaderTimeout);
        hideLoader();
        console.log('✅ Главная страница загружена');
    } catch (error) {
        console.error('❌ Критическая ошибка инициализации:', error);
        clearTimeout(loaderTimeout);
        hideLoader();
        
        // Показываем сообщение об ошибке
        const grid = document.getElementById('tournaments-grid');
        if (grid && grid.innerHTML.trim() === '') {
            grid.innerHTML = `
                <div class="empty-state">
                    <h3>Ошибка загрузки</h3>
                    <p>Не удалось загрузить данные. Пожалуйста, обновите страницу.</p>
                    <button onclick="location.reload()" class="btn-submit" style="margin-top: 20px;">Обновить страницу</button>
                </div>
            `;
        }
    }
}

// Запускаем при загрузке страницы
document.addEventListener('DOMContentLoaded', initializeMainPage);

// Экспортируем для SPA
window.initializeMainPage = initializeMainPage;
window.loadActiveTournaments = loadActiveTournaments; // Экспортируем для использования в админке

// Автоматическое обновление кнопок каждую минуту для проверки времени старта
setInterval(() => {
    const grid = document.getElementById('tournaments-grid');
    if (grid) {
        updateTournamentButtons();
    }
}, 60000); // Каждую минуту

function hideLoader() {
    const loader = document.getElementById('loader');
    if (loader) {
        loader.classList.add('hidden');
        setTimeout(() => loader.style.display = 'none', 300);
    }
}

// Функция обновления кнопок турниров (без дёргания)
async function updateTournamentButtons() {
    const grid = document.getElementById('tournaments-grid');
    if (!grid) return;
    
    const links = await API.links.getAll();
    
    // Обновляем кнопки для каждой карточки
    allTournaments.forEach(tournament => {
        const card = grid.querySelector(`#tournament-card-${tournament.id}`);
        if (!card) return;
        
        const currentButton = card.querySelector('a.btn-submit, div.btn-submit');
        if (!currentButton) return;
        
        // Получаем что должно быть
        const newButtonHtml = getTournamentButton(tournament, links[tournament.discipline] || '#');
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = newButtonHtml.trim();
        const newButton = tempDiv.firstElementChild;
        
        const currentText = currentButton.textContent.trim();
        const newText = newButton.textContent.trim();
        
        // Если текст кнопки изменился - заменяем
        if (currentText !== newText) {
            currentButton.replaceWith(newButton);
        }
    });
}

async function loadActiveTournaments(forceReload = false) {
    const grid = document.getElementById('tournaments-grid');
    if (!grid) return; // Если не на главной странице, выходим
    
    // Принудительно очищаем кеш если запрошено
    if (forceReload && typeof clearCache === 'function') {
        clearCache('tournaments');
    }
    
    allTournaments = await API.tournaments.getAll('active');
    const links = await API.links.getAll();
    
    if (allTournaments.length === 0) {
        grid.innerHTML = `
            <div class="empty-state">
                <h3>Активных турниров пока нет</h3>
                <p>Следите за обновлениями в наших социальных сетях</p>
            </div>
        `;
        return;
    }
    
    displayFilteredTournaments();
}

function displayFilteredTournaments() {
    const grid = document.getElementById('tournaments-grid');
    const links = API.links.getAll ? null : {}; // To be loaded if needed
    
    let filtered = allTournaments;
    if (selectedDiscipline !== 'all') {
        filtered = allTournaments.filter(t => t.discipline === selectedDiscipline);
    }
    
    if (filtered.length === 0) {
        grid.innerHTML = `
            <div class="empty-state">
                <h3>Турниров по выбранной дисциплине нет</h3>
            </div>
        `;
        return;
    }
    
    API.links.getAll().then(links => {
        grid.innerHTML = filtered.map(tournament => createTournamentCard(tournament, links)).join('');
        // Переинициализируем таймеры после отрисовки
        setTimeout(initTimers, 100);
        // Переинициализируем анимации
        setTimeout(() => {
            if (window.initScrollAnimations) {
                initScrollAnimations();
            }
        }, 150);
    });
}

async function loadDisciplineFilters() {
    const filtersContainer = document.getElementById('discipline-filters');
    if (!filtersContainer) return;
    
    const disciplines = await API.disciplines.getAll();
    const disciplinesSet = new Set(allTournaments.map(t => t.discipline));
    const disciplineNames = disciplines.map(d => typeof d === 'object' ? d.name : d);
    const availableDisciplines = [...new Set(disciplineNames.filter(d => disciplinesSet.has(d)))];
    
    filtersContainer.innerHTML = `
        <button class="filter-btn active" data-discipline="all" onclick="filterByDiscipline('all')">
            Все
        </button>
        ${availableDisciplines.map(d => `
            <button class="filter-btn" data-discipline="${d}" onclick="filterByDiscipline('${d}')">
                ${window.getDisciplineIconSync ? window.getDisciplineIconSync(d) : '🎮'} ${d}
            </button>
        `).join('')}
    `;
}

function filterByDiscipline(discipline) {
    selectedDiscipline = discipline;
    
    // Update active state
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.discipline === discipline) {
            btn.classList.add('active');
        }
    });
    
    displayFilteredTournaments();
}

window.filterByDiscipline = filterByDiscipline;

function createTournamentCard(tournament, links) {
    // Приоритет: custom_link > links[discipline] > '#'
    let regLink = '#';
    if (tournament.custom_link && tournament.custom_link.trim()) {
        regLink = tournament.custom_link.trim();
    } else if (links && links[tournament.discipline]) {
        regLink = links[tournament.discipline];
    }
    
    console.log(`🎮 Карточка турнира "${tournament.title}": ${regLink}`);
    
    // Парсим дату для таймера
    const timerId = `timer-${tournament.id}`;
    const cardId = `tournament-card-${tournament.id}`;
    const dateParts = tournament.date.split(/[.-]/);
    const hasTimer = dateParts.length === 3;
    
    // Генерируем кнопки на основе времени
    const buttonHtml = getTournamentButton(tournament, regLink);
    
    return `
        <div class="tournament-card" data-discipline="${tournament.discipline}" id="${cardId}" data-start-time="${tournament.start_time || ''}">
            <div class="tournament-card-header">
                <h2>${tournament.title}</h2>
            </div>
            
            <div class="tournament-info">
                <div class="info-item">
                    <span class="info-label">Дисциплина</span>
                    <span class="info-value">${window.formatDisciplineWithIconSync ? window.formatDisciplineWithIconSync(tournament.discipline) : tournament.discipline}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Дата</span>
                    <span class="info-value">${formatDateForDisplay(tournament.date)}</span>
                </div>
                ${tournament.start_time ? `
                <div class="info-item">
                    <span class="info-label">Время старта</span>
                    <span class="info-value">${tournament.start_time.split(':').slice(0, 2).join(':')} МСК</span>
                </div>
                ` : ''}
                <div class="info-item">
                    <span class="info-label">Призовой фонд</span>
                    <span class="info-value">${tournament.prize}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Команд</span>
                    <span class="info-value">${tournament.teams || 0} / ${tournament.max_teams}</span>
                </div>
            </div>
            
            <div class="timer-container" id="${timerId}" data-date="${tournament.date}" data-start-time="${tournament.start_time || ''}"></div>
            
            ${buttonHtml}
        </div>
    `;
}

// Функция для определения кнопки турнира
function getTournamentButton(tournament, regLink) {
    if (!tournament.start_time) {
        // Если время не указано, всегда показываем кнопку регистрации
        return `<a href="${regLink}" target="_blank" class="btn-submit" ${regLink === '#' ? 'onclick="alert(\'Ссылка на регистрацию не настроена в админке\'); return false;"' : ''}>
            Подать заявку
        </a>`;
    }
    
    // Парсим дату и время турнира
    const tournamentDateTime = parseTournamentDateTime(tournament.date, tournament.start_time);
    if (!tournamentDateTime) {
        // Если не удалось распарсить, показываем кнопку регистрации
        return `<a href="${regLink}" target="_blank" class="btn-submit" ${regLink === '#' ? 'onclick="alert(\'Ссылка на регистрацию не настроена в админке\'); return false;"' : ''}>
            Подать заявку
        </a>`;
    }
    
    const now = new Date();
    
    // Если турнир уже начался - показываем кнопку "Смотреть" или "Регистрация закрыта"
    if (now >= tournamentDateTime) {
        const watchUrl = tournament.watch_url || tournament.watchUrl;
        // Если ссылка не указана, используем дефолтную
        const defaultWatchUrl = 'https://www.twitch.tv/wbteamcyberclub';
        const finalWatchUrl = (watchUrl && watchUrl.trim()) || defaultWatchUrl;
        return `<a href="${finalWatchUrl}" target="_blank" class="btn-submit" style="background: linear-gradient(90deg, #10b981 0%, #059669 100%);">
            Смотреть турнир
        </a>`;
    } else {
        // До старта - показываем кнопку регистрации
        return `<a href="${regLink}" target="_blank" class="btn-submit" ${regLink === '#' ? 'onclick="alert(\'Ссылка на регистрацию не настроена в админке\'); return false;"' : ''}>
            Подать заявку
        </a>`;
    }
}

// Функция для парсинга даты и времени турнира
function parseTournamentDateTime(dateStr, timeStr) {
    try {
        let day, month, year;
        
        // Пробуем разные форматы даты
        // Формат с точками: 2025-11-02 или 02.11.2025
        const dotsFormat = dateStr.match(/(\d{1,2})\.(\d{1,2})\.(\d{4})/);
        const dashesFormat = dateStr.match(/(\d{4})-(\d{1,2})-(\d{1,2})/);
        // Формат русский: "день месяц год г." или "день месяц год"
        const russianFormat = dateStr.match(/(\d{1,2})\s+(\w+)\s+(\d{4})(?:\s+г\.)?/);
        
        if (dotsFormat) {
            // Формат DD.MM.YYYY
            day = parseInt(dotsFormat[1]);
            month = parseInt(dotsFormat[2]) - 1; // месяцы в JS: 0-11
            year = parseInt(dotsFormat[3]);
        } else if (dashesFormat) {
            // Формат YYYY-MM-DD
            year = parseInt(dashesFormat[1]);
            month = parseInt(dashesFormat[2]) - 1; // месяцы в JS: 0-11
            day = parseInt(dashesFormat[3]);
        } else if (russianFormat) {
            // Формат русский: "день месяц год г."
            const months = {
                'января': 0, 'февраля': 1, 'марта': 2, 'апреля': 3,
                'мая': 4, 'июня': 5, 'июля': 6, 'августа': 7,
                'сентября': 8, 'октября': 9, 'ноября': 10, 'декабря': 11
            };
            day = parseInt(russianFormat[1]);
            month = months[russianFormat[2].toLowerCase()];
            year = parseInt(russianFormat[3]);
        } else {
            console.error('Не удалось распарсить дату:', dateStr);
            return null;
        }
        
        if (month === undefined || isNaN(year) || isNaN(month) || isNaN(day)) {
            console.error('Невалидная дата:', dateStr);
            return null;
        }
        
        // Парсим время (формат HH:MM или HH:MM:SS)
        const timeMatch = timeStr.match(/(\d{1,2}):(\d{2})(?::\d{2})?/);
        if (!timeMatch) {
            console.error('Не удалось распарсить время:', timeStr);
            return null;
        }
        
        const hours = parseInt(timeMatch[1]);
        const minutes = parseInt(timeMatch[2]);
        
        // Создаем Date объект (МСК время)
        const dateTime = new Date(year, month, day, hours, minutes, 0);
        console.log(`Парсинг даты/времени: ${dateStr} ${timeStr} -> ${dateTime}`);
        return dateTime;
    } catch (error) {
        console.error('Ошибка парсинга даты/времени:', error);
        return null;
    }
}

// Инициализация таймеров после отображения
function initTimers() {
    console.log('⏰ Инициализация таймеров...');
    const containers = document.querySelectorAll('.timer-container');
    console.log(`Найдено ${containers.length} таймеров`);
    
    containers.forEach(container => {
        const dateText = container.getAttribute('data-date');
        const startTime = container.getAttribute('data-start-time');
        console.log(`Таймер ${container.id}: дата = ${dateText}, время = ${startTime}`);
        if (dateText) {
            initCountdown(container.id, dateText, startTime);
        }
    });
}


async function loadSocialLinks() {
    const socialLinks = await API.social.getAll();
    
    // Обновляем ссылки в header
    if (socialLinks.twitch) {
        const twitchBtn = document.querySelector('.social-btn.twitch');
        if (twitchBtn) twitchBtn.href = socialLinks.twitch;
    }
    if (socialLinks.telegram) {
        const telegramBtn = document.querySelector('.social-btn.telegram');
        if (telegramBtn) telegramBtn.href = socialLinks.telegram;
    }
    if (socialLinks.discord) {
        const discordBtn = document.querySelector('.social-btn.discord');
        if (discordBtn) discordBtn.href = socialLinks.discord;
    }
    if (socialLinks.contact) {
        const contactBtn = document.querySelector('.btn-contact');
        if (contactBtn) contactBtn.href = socialLinks.contact;
    }
}

// Функция таймера обратного отсчета
function initCountdown(timerId, dateString, startTime = '') {
    const container = document.getElementById(timerId);
    if (!container) return;
    
    function updateTimer() {
        try {
            let targetDate;
            
            // Парсим разные форматы дат
            const dotsFormat = dateString.match(/(\d{1,2})\.(\d{1,2})\.(\d{4})/);
            const dashesFormat = dateString.match(/(\d{1,2})-(\d{1,2})-(\d{4})/);
            const russianFormat = dateString.match(/(\d{1,2})\s+(января|февраля|марта|апреля|мая|июня|июля|августа|сентября|октября|ноября|декабря)\s+(\d{4})(?:\s+г\.)?/i);
            
            console.log(`Парсинг даты: "${dateString}"`);
            
            if (dotsFormat) {
                const [, day, month, year] = dotsFormat;
                targetDate = new Date(year, parseInt(month) - 1, parseInt(day));
                console.log('Формат с точками:', day, month, year);
            } else if (dashesFormat) {
                const [, day, month, year] = dashesFormat;
                targetDate = new Date(year, parseInt(month) - 1, parseInt(day));
                console.log('Формат с тире:', day, month, year);
            } else if (russianFormat) {
                const [, day, monthName, year] = russianFormat;
                const months = {
                    'января': 0, 'февраля': 1, 'марта': 2, 'апреля': 3, 'мая': 4, 'июня': 5,
                    'июля': 6, 'августа': 7, 'сентября': 8, 'октября': 9, 'ноября': 10, 'декабря': 11
                };
                targetDate = new Date(year, months[monthName.toLowerCase()], parseInt(day));
                console.log('Русский формат:', day, monthName, year);
            } else {
                console.log('Не удалось распарсить дату, пробуем стандартный парсинг');
                targetDate = new Date(dateString);
                if (isNaN(targetDate.getTime())) {
                    console.log('Невалидная дата');
                    container.innerHTML = '';
                    return;
                }
            }
            
            // Если указано время старта, добавляем его к дате
            if (startTime && startTime.trim()) {
                const timeMatch = startTime.match(/(\d{1,2}):(\d{2})(?::\d{2})?/);
                if (timeMatch) {
                    const hours = parseInt(timeMatch[1]);
                    const minutes = parseInt(timeMatch[2]);
                    targetDate.setHours(hours, minutes, 0, 0);
                    console.log('Добавлено время старта:', hours, minutes);
                }
            }
            
            console.log('Целевая дата:', targetDate);
            
            const now = new Date();
            const diff = targetDate - now;
            
            console.log('Разница:', diff);
            
            if (diff <= 0) {
                container.innerHTML = '<div class="timer-badge timer-ended">Турнир начался</div>';
                return;
            }
            
            const days = Math.floor(diff / (1000 * 60 * 60 * 24));
            const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            
            console.log(`Таймер: ${days}д ${hours}ч ${minutes}м`);
            
            container.innerHTML = `
                <div class="timer-badge">
                    <span class="timer-label">До начала:</span>
                    ${days > 0 ? `<span class="timer-value">${days}д</span>` : ''}
                    <span class="timer-value">${hours}ч</span>
                    ${minutes > 0 ? `<span class="timer-value">${minutes}м</span>` : ''}
                </div>
            `;
        } catch (error) {
            console.error('Ошибка таймера:', error);
            container.innerHTML = '';
        }
    }
    
    updateTimer();
    setInterval(updateTimer, 60000); // Обновляем каждую минуту
}


// Страница зарегистрированных команд (с API)

let allTeamsData = {};
let selectedDisciplineTeams = 'all';

// Функция инициализации страницы
async function initializeTeamsPage() {
    console.log('🚀 Инициализация страницы команд...');
    
    // Устанавливаем таймаут для принудительного скрытия loader (10 секунд)
    const loaderTimeout = setTimeout(() => {
        console.warn('⚠️ Таймаут загрузки - принудительно скрываем loader');
        hideLoader();
    }, 10000);
    
    try {
        // Сначала загружаем турниры
        const tournaments = await Promise.race([
            API.tournaments.getAll('active'),
            new Promise((_, reject) => setTimeout(() => reject(new Error('Таймаут загрузки турниров')), 8000))
        ]).catch(err => {
            console.error('❌ Ошибка загрузки турниров:', err);
            return [];
        });
        console.log('Tournaments loaded:', tournaments);
        
        // Затем загружаем команды
        allTeamsData = await Promise.race([
            API.teams.getAll(),
            new Promise((_, reject) => setTimeout(() => reject(new Error('Таймаут загрузки команд')), 8000))
        ]).catch(err => {
            console.error('❌ Ошибка загрузки команд:', err);
            return {};
        });
        console.log('Teams data loaded:', allTeamsData);
        
        // Добавляем информацию о дисциплине к командам
        if (tournaments && allTeamsData) {
            Object.keys(allTeamsData).forEach(tournamentId => {
                const tournament = tournaments.find(t => t.id == tournamentId);
                if (tournament && allTeamsData[tournamentId]) {
                    allTeamsData[tournamentId].forEach(team => {
                        if (!team.discipline && tournament.discipline) {
                            team.discipline = tournament.discipline;
                        }
                        if (!team.title && tournament.title) {
                            team.title = tournament.title;
                        }
                    });
                }
            });
        }
        
        // Теперь загружаем фильтры дисциплин (не критично)
        await Promise.race([
            loadDisciplineFilters(),
            new Promise((_, reject) => setTimeout(() => reject(new Error('Таймаут загрузки фильтров')), 5000))
        ]).catch(err => {
            console.warn('⚠️ Ошибка загрузки фильтров:', err);
        });
        
        // И загружаем социальные ссылки (не критично)
        await Promise.race([
            loadSocialLinks(),
            new Promise((_, reject) => setTimeout(() => reject(new Error('Таймаут загрузки ссылок')), 5000))
        ]).catch(err => {
            console.warn('⚠️ Ошибка загрузки социальных ссылок:', err);
        });
        
        // Показываем команды
        displayFilteredTeams();
        
        clearTimeout(loaderTimeout);
        hideLoader();
        console.log('✅ Страница команд загружена');
    } catch (error) {
        console.error('❌ Критическая ошибка инициализации:', error);
        clearTimeout(loaderTimeout);
        hideLoader();
        
        // Показываем сообщение об ошибке
        const container = document.getElementById('teams-container');
        if (container && container.innerHTML.trim() === '') {
            container.innerHTML = `
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
document.addEventListener('DOMContentLoaded', initializeTeamsPage);

// Экспортируем для SPA
window.initializeTeamsPage = initializeTeamsPage;

function hideLoader() {
    const loader = document.getElementById('loader');
    if (loader) {
        loader.classList.add('hidden');
        setTimeout(() => loader.style.display = 'none', 300);
    }
}

// Убираем эту функцию, т.к. теперь всё загружается в DOMContentLoaded

function displayFilteredTeams() {
    const container = document.getElementById('teams-container');
    
    // Получаем все турниры с командами
    const tournamentIds = Object.keys(allTeamsData);
    
    let filtered = tournamentIds;
    if (selectedDisciplineTeams !== 'all') {
        // Фильтруем по дисциплине
        filtered = tournamentIds.filter(id => {
            const teams = allTeamsData[id] || [];
            return teams.some(t => t.discipline === selectedDisciplineTeams);
        });
    }
    
    if (filtered.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <h3>Команд по выбранной дисциплине нет</h3>
            </div>
        `;
        return;
    }
    
    container.innerHTML = filtered.map(tournamentId => {
        const teams = allTeamsData[tournamentId] || [];
        const tournament = teams[0]; // Берем первый объект команды как источник данных о турнире
        if (!tournament) return '';
        return createTournamentTeamsSection(tournament, teams);
    }).join('');
}

async function loadDisciplineFilters() {
    const filtersContainer = document.getElementById('teams-discipline-filters');
    if (!filtersContainer) return;
    
    const disciplines = await API.disciplines.getAll();
    // Преобразуем дисциплины из БД в массив имен
    const disciplineNames = disciplines.map(d => typeof d === 'object' ? d.name : d);
    
    // Получаем доступные дисциплины из команд
    const availableDisciplinesFromTeams = [...new Set(Object.values(allTeamsData).flat().map(t => t.discipline).filter(d => d))];
    
    // Фильтруем только те дисциплины, которые есть в командах
    const availableDisciplines = disciplineNames.filter(d => availableDisciplinesFromTeams.includes(d));
    
    console.log('Available disciplines:', availableDisciplines);
    
    filtersContainer.innerHTML = `
        <button class="filter-btn active" data-discipline="all" onclick="filterTeamsByDiscipline('all')">
            Все
        </button>
        ${availableDisciplines.map(d => {
            const icon = window.getDisciplineIconSync ? window.getDisciplineIconSync(d) : '🎮';
            return `
            <button class="filter-btn" data-discipline="${d}" onclick="filterTeamsByDiscipline('${d}')">
                ${icon} ${d}
            </button>
        `;
        }).join('')}
    `;
}

function filterTeamsByDiscipline(discipline) {
    selectedDisciplineTeams = discipline;
    
    document.querySelectorAll('#teams-discipline-filters .filter-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.discipline === discipline) {
            btn.classList.add('active');
        }
    });
    
    displayFilteredTeams();
}

window.filterTeamsByDiscipline = filterTeamsByDiscipline;

function createTournamentTeamsSection(tournament, teams) {
    const teamsHTML = teams.length > 0 
        ? teams.map(team => createTeamCard(team, tournament)).join('')
        : '<div class="empty-state"><p>Команды еще не зарегистрировались</p></div>';
    
    const disciplineIcon = window.getDisciplineIconSync ? window.getDisciplineIconSync(tournament.discipline) : '🎮';
    
    return `
        <div class="tournament-section">
            <h2>
                <span class="tournament-discipline-line">
                    <span class="tournament-header-icon">${disciplineIcon}</span>
                    <span class="tournament-header-discipline">${tournament.discipline || tournament.title}</span>
                </span>
                <span class="tournament-title-line">${tournament.title}</span>
            </h2>
            <div class="teams-list">
                ${teamsHTML}
            </div>
        </div>
    `;
}

function createTeamCard(team, tournament) {
    return `
        <div class="team-card">
            <div class="team-name">${team.name}</div>
            <div class="team-info">
                <span>👥 ${team.players} игроков</span>
            </div>
        </div>
    `;
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


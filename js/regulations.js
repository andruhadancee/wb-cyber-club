// Regulations modal functionality

// Открыть модалку регламентов
async function openRegulationsModal(e) {
    if (e) e.preventDefault();
    const modal = document.getElementById('regulations-modal');
    const buttonsContainer = document.getElementById('regulations-buttons');
    
    if (!modal || !buttonsContainer) {
        console.error('Modal elements not found');
        return;
    }
    
    // Показываем индикатор загрузки
    buttonsContainer.innerHTML = '<p style="color: var(--color-text-secondary); margin: 20px 0;">Загрузка регламентов...</p>';
    modal.classList.add('active');
    
    // Загружаем регламенты с таймаутом
    try {
        const regulations = await Promise.race([
            API.regulations.getAll(),
            new Promise((_, reject) => setTimeout(() => reject(new Error('Таймаут загрузки регламентов')), 5000))
        ]);
        
        if (regulations.length === 0) {
            buttonsContainer.innerHTML = '<p style="color: var(--color-text-secondary); margin: 20px 0;">Регламенты пока не добавлены</p>';
        } else {
            // Создаём кнопки для каждой дисциплины
            buttonsContainer.innerHTML = regulations.map(r => `
                <button class="regulation-discipline-btn" onclick="openRegulationPDF('${r.pdf_url}')">
                    ${r.discipline_name}
                </button>
            `).join('');
        }
    } catch (error) {
        console.error('Error loading regulations:', error);
        buttonsContainer.innerHTML = '<p style="color: #ff3b30;">Ошибка загрузки регламентов. Попробуйте позже.</p>';
    }
}

// Закрыть модалку
function closeRegulationsModal() {
    const modal = document.getElementById('regulations-modal');
    modal.classList.remove('active');
}

// Открыть PDF регламента
function openRegulationPDF(pdfUrl) {
    window.open(pdfUrl, '_blank', 'noopener,noreferrer');
}

// Закрытие по клику вне модалки
document.addEventListener('DOMContentLoaded', function() {
    const modal = document.getElementById('regulations-modal');
    const closeBtn = document.getElementById('close-regulations-modal');
    
    // Убеждаемся, что модальное окно закрыто по умолчанию
    if (modal) {
        modal.classList.remove('active');
    }
    
    if (closeBtn) {
        closeBtn.addEventListener('click', closeRegulationsModal);
    }
    
    if (modal) {
        modal.addEventListener('click', function(e) {
            if (e.target === this) {
                closeRegulationsModal();
            }
        });
        
        // Закрытие по Escape
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape' && modal.classList.contains('active')) {
                closeRegulationsModal();
            }
        });
    }
});

// Экспортируем функции для использования извне
window.openRegulationsModal = openRegulationsModal;
window.closeRegulationsModal = closeRegulationsModal;
window.openRegulationPDF = openRegulationPDF;


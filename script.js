document.addEventListener('DOMContentLoaded', () => {
    // Начални данни (трите учебни цели)
    const defaultGoals = [
        { id: '1', text: 'Да се науча да програмирам по-добре', completed: false },
        { id: '2', text: 'Да изкарам малко личен опит в работна среда', completed: false },
        { id: '3', text: 'Да стигна до края на тази стажантска програма', completed: false }
    ];

    let goals = JSON.parse(localStorage.getItem('inforce_goals')) || defaultGoals;
    let currentFilter = 'all';
    let goalToDeleteId = null;

    // DOM елементи
    const goalsList = document.getElementById('goals-list');
    const goalForm = document.getElementById('goal-form');
    const goalInput = document.getElementById('goal-input');
    const errorMessage = document.getElementById('error-message');
    const totalCountEl = document.getElementById('total-count');
    const completedCountEl = document.getElementById('completed-count');
    const progressPercentEl = document.getElementById('progress-percent');
    const progressBarFill = document.getElementById('progress-bar-fill');
    const emptyStateEl = document.getElementById('empty-state');
    const filterBtns = document.querySelectorAll('.filter-btn');
    const themeToggleBtn = document.getElementById('theme-toggle');
    
    // Модални елементи
    const confirmModal = document.getElementById('confirm-modal');
    const modalCancel = document.getElementById('modal-cancel');
    const modalConfirm = document.getElementById('modal-confirm');

    // Тема
    const savedTheme = localStorage.getItem('inforce_theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    updateThemeButtonText(savedTheme);

    themeToggleBtn.addEventListener('click', () => {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('inforce_theme', newTheme);
        updateThemeButtonText(newTheme);
    });

    function updateThemeButtonText(theme) {
        themeToggleBtn.textContent = theme === 'light' ? '🌙 Тъмна тема' : '☀️ Светла тема';
    }

    // Инициализация
    render();

    // Събития
    goalForm.addEventListener('submit', (e) => {
        e.preventDefault();
        addGoal();
    });

    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentFilter = btn.getAttribute('data-filter');
            render();
        });
    });

    modalCancel.addEventListener('click', () => {
        confirmModal.classList.add('hidden');
        goalToDeleteId = null;
    });

    modalConfirm.addEventListener('click', () => {
        if (goalToDeleteId !== null) {
            goals = goals.filter(g => g.id !== goalToDeleteId);
            saveAndRender();
            confirmModal.classList.add('hidden');
            goalToDeleteId = null;
        }
    });

    // Функции за работа с целите
    function addGoal() {
        const rawText = goalInput.value;
        const trimmedText = rawText.trim();
        
        // Валидация 1: Празно поле или само интервали
        if (trimmedText === '') {
            showError('Моля, въведете валидна цел (не може да е празна).');
            return;
        }

        // Валидация 2: Дублирани цели (нормализиране на малки/главни букви и интервали)
        const normalizedNewText = trimmedText.toLowerCase().replace(/\s+/g, ' ');
        const isDuplicate = goals.some(g => g.text.toLowerCase().replace(/\s+/g, ' ') === normalizedNewText);

        if (isDuplicate) {
            showError('Тази цел вече съществува в списъка.');
            return;
        }

        clearError();

        const newGoal = {
            id: Date.now().toString(),
            text: trimmedText, // Запазваме оригиналния текст с интервалите на потребителя, но защитен от XSS
            completed: false
        };

        goals.push(newGoal);
        goalInput.value = '';
        saveAndRender();
    }

    function toggleGoal(id) {
        goals = goals.map(g => {
            if (g.id === id) {
                return { ...g, completed: !g.completed };
            }
            return g;
        });
        saveAndRender();
    }

    function promptDeleteGoal(id) {
        goalToDeleteId = id;
        confirmModal.classList.remove('hidden');
    }

    function saveAndRender() {
        localStorage.setItem('inforce_goals', JSON.stringify(goals));
        render();
    }

    function showError(msg) {
        errorMessage.textContent = msg;
        errorMessage.classList.remove('hidden');
    }

    function clearError() {
        errorMessage.textContent = '';
        errorMessage.classList.add('hidden');
    }

    function render() {
        // Рендиране на броячи и напредък
        const total = goals.length;
        const completed = goals.filter(g => g.completed).length;
        const percent = total === 0 ? 0 : Math.round((completed / total) * 100);

        totalCountEl.textContent = total;
        completedCountEl.textContent = completed;
        progressPercentEl.textContent = `${percent}%`;
        progressBarFill.style.width = `${percent}%`;

        // Филтриране
        let filteredGoals = goals;
        if (currentFilter === 'active') {
            filteredGoals = goals.filter(g => !g.completed);
        } else if (currentFilter === 'completed') {
            filteredGoals = goals.filter(g => g.completed);
        }

        // Изчистване на списъка
        goalsList.innerHTML = '';

        if (filteredGoals.length === 0) {
            emptyStateEl.classList.remove('hidden');
        } else {
            emptyStateEl.classList.add('hidden');
            
            filteredGoals.forEach(goal => {
                const li = document.createElement('li');
                li.className = `goal-item ${goal.completed ? 'completed' : ''}`;

                const divContent = document.createElement('div');
                divContent.className = 'goal-content';

                const checkbox = document.createElement('input');
                checkbox.type = 'checkbox';
                checkbox.checked = goal.completed;
                checkbox.addEventListener('change', () => toggleGoal(goal.id));

                const span = document.createElement('span');
                span.className = 'goal-text';
                // Защита срещу XSS чрез използване на textContent
                span.textContent = goal.text;

                divContent.appendChild(checkbox);
                divContent.appendChild(span);

                const deleteBtn = document.createElement('button');
                deleteBtn.className = 'btn-danger';
                deleteBtn.textContent = 'Изтрий';
                deleteBtn.addEventListener('click', () => promptDeleteGoal(goal.id));

                li.appendChild(divContent);
                li.appendChild(deleteBtn);
                goalsList.appendChild(li);
            });
        }
    }
});
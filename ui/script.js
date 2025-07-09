document.addEventListener('DOMContentLoaded', async () => {
    const monthYearStr = document.getElementById('month-year-str');
    const prevMonthBtn = document.getElementById('prev-month-btn');
    const nextMonthBtn = document.getElementById('next-month-btn');
    const calendarDays = document.getElementById('calendar-days');

    let currentDate = new Date();
    let vacationData = {}; // Boş obyekt

    // --- YENİ HİSSƏ: Python-dan məlumatları alırıq ---
    try {
        // pywebview hazır olana qədər gözləyirik
        await window.pywebview.api.isReady; 
        console.log("Python API hazır. Məlumatlar sorğulanır...");
        vacationData = await window.pywebview.api.get_vacations();
        console.log("Məlumatlar alındı:", vacationData);
    } catch (e) {
        console.error("Python API ilə əlaqə qurula bilmədi:", e);
        alert("Python tərəfindən məzuniyyət məlumatları alına bilmədi.");
    }
    // --- YENİ HİSSƏNİN SONU ---

    function renderCalendar() {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();

        const monthNames = ["Yanvar", "Fevral", "Mart", "Aprel", "May", "İyun", "İyul", "Avqust", "Sentyabr", "Oktyabr", "Noyabr", "Dekabr"];
        monthYearStr.textContent = `${monthNames[month]} ${year}`;
        calendarDays.innerHTML = '';

        const firstDayOfMonth = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const startDay = (firstDayOfMonth === 0) ? 6 : firstDayOfMonth - 1;

        for (let i = 0; i < startDay; i++) {
            calendarDays.insertAdjacentHTML('beforeend', `<div class="day empty"></div>`);
        }

        for (let i = 1; i <= daysInMonth; i++) {
            const dayElement = document.createElement('div');
            dayElement.classList.add('day');
            dayElement.textContent = i;
            
            // --- GÜNLƏRİ MƏLUMATA ƏSASƏN RƏNGLƏYİRİK ---
            const currentDayStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
            const vacationsOnThisDay = vacationData.vacations?.filter(v => 
                v.start_date <= currentDayStr && v.end_date >= currentDayStr
            ) || [];

            if (vacationsOnThisDay.length > 0) {
                const vac = vacationsOnThisDay[0]; // Sadəlik üçün ilkini götürürük
                const color = vacationData.employee_colors[vac.employee] || 'lightgray';
                dayElement.style.backgroundColor = color;
                dayElement.style.color = '#111'; // Rəngli fonda yazı görünsün
                dayElement.title = vac.employee; // Tooltip üçün
                dayElement.style.cursor = 'pointer';

                dayElement.addEventListener('click', () => {
                    // Python tərəfinə məlumat göndəririk
                    window.pywebview.api.on_day_click(vac.employee);
                });
            }

            const today = new Date();
            if (i === today.getDate() && month === today.getMonth() && year === today.getFullYear()) {
                dayElement.classList.add('today');
            }

            calendarDays.appendChild(dayElement);
        }
    }

    prevMonthBtn.addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() - 1);
        renderCalendar();
    });

    nextMonthBtn.addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() + 1);
        renderCalendar();
    });

    renderCalendar(); // İlk təqvimi çəkirik
});
// ===== Плавное появление блоков при скролле (используется на всех страницах) =====
document.addEventListener('DOMContentLoaded', () => {
  const revealEls = document.querySelectorAll('[data-reveal]');
  if (revealEls.length) {
    const revealObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.2 });
    revealEls.forEach(el => revealObserver.observe(el));
  }

  // Фото дворика на главной странице (поиск по id, оставлено для обратной совместимости со старой вёрсткой)
  const courtyardImg = document.getElementById('courtyardImg');
  if (courtyardImg) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          courtyardImg.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.2 });
    observer.observe(courtyardImg);
  }

    // ===== Сезонный индикатор дворика: "Открыт сейчас" / "Откроется в мае" — считается по текущему месяцу (сезон май–октябрь) =====
  const seasonStatusEl = document.getElementById('seasonStatus');
  if (seasonStatusEl) {
    const month = new Date().getMonth() + 1; // 1–12
    const isSeasonOpen = month >= 5 && month <= 10;
    const textEl = seasonStatusEl.querySelector('.status-text');
    if (isSeasonOpen) {
      textEl.textContent = 'Открыт сейчас';
    } else {
      seasonStatusEl.classList.add('closed');
      textEl.textContent = 'Откроется в мае';
    }
  }

  // ===== Анимированный счётчик чисел (атрибут data-count) =====
  const counters = document.querySelectorAll('[data-count]');
  if (counters.length) {
    const countObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        const target = parseInt(el.dataset.count, 10);
        const suffix = el.dataset.suffix || '';
        const duration = 900;
        const start = performance.now();
        function tick(now) {
          const progress = Math.min((now - start) / duration, 1);
          const eased = 1 - Math.pow(1 - progress, 3);
          el.textContent = Math.round(eased * target) + suffix;
          if (progress < 1) requestAnimationFrame(tick);
        }
        requestAnimationFrame(tick);
        countObserver.unobserve(el);
      });
    }, { threshold: 0.4 });
    counters.forEach(el => countObserver.observe(el));
  }

  // ===== Лёгкий параллакс для hero-фото (About / Sport) =====
  const parallaxTargets = ['parallaxImg1'].map(id => document.getElementById(id)).filter(Boolean);
  if (parallaxTargets.length && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    let ticking = false;
    function updateParallax() {
      parallaxTargets.forEach(wrap => {
        const img = wrap.querySelector('img');
        if (!img) return;
        const rect = wrap.getBoundingClientRect();
        const centerOffset = rect.top + rect.height / 2 - window.innerHeight / 2;
        const shift = Math.max(-30, Math.min(30, centerOffset * -0.06));
        img.style.transform = `translateY(${shift}px)`;
      });
      ticking = false;
    }
    window.addEventListener('scroll', () => {
      if (!ticking) {
        requestAnimationFrame(updateParallax);
        ticking = true;
      }
    });
    updateParallax();
  }
});

// ==========================================================================
// СКРИПТЫ ОТДЕЛЬНЫХ СТРАНИЦ — идут в порядке навигации сайта (Главная → Меню →
// Спортивные трансляции → Контакты). У страниц "О нас" и "Клуб друзей"
// собственных скриптов нет — вся их анимация обеспечивается общим блоком выше.
// ==========================================================================

// ===== Скрипт страницы: ГЛАВНАЯ (index.html) =====
// ===== Подтягиваем актуальный матч со страницы sport.html, чтобы блок "Сегодня в пабе" всегда был синхронен с афишей =====
  (async function () {
    const teamsEl = document.getElementById('todayMatchTeams');
    const metaEl = document.getElementById('todayMatchMeta');
    const labelEl = document.getElementById('todayLabel');
    if (!teamsEl) return;

    try {
      const res = await fetch('sport.html');
      const html = await res.text();
      const doc = new DOMParser().parseFromString(html, 'text/html');
      const rows = Array.from(doc.querySelectorAll('.match-row'));
      if (!rows.length) throw new Error('Матчи не найдены');

      const todayNum = new Date().getDate();
      let picked = rows.find(r => Number(r.dataset.date) === todayNum);
      let isToday = !!picked;
      if (!picked) {
        picked = rows.find(r => Number(r.dataset.date) >= todayNum) || rows[0];
      }

      const leagueClone = picked.querySelector('.match-league').cloneNode(true);
      const badge = leagueClone.querySelector('.finished-badge');
      if (badge) badge.remove();
      const league = leagueClone.textContent.trim();

      const teamsNode = picked.querySelector('.match-teams');
      const vsSpan = teamsNode.querySelector('.vs');
      const home = teamsNode.childNodes[0].textContent.trim();
      const away = teamsNode.lastChild.textContent.trim();

      const timeNode = picked.querySelector('.match-time');
      const time = timeNode.childNodes[0].textContent.trim();

      const sameDayCount = rows.filter(r => r.dataset.date === picked.dataset.date).length;
      const extraNote = sameDayCount > 1 ? ` · ещё ${sameDayCount - 1} ${sameDayCount - 1 === 1 ? 'матч' : 'матча'} в этот день` : '';

      teamsEl.innerHTML = `${home} <span class="vs">vs</span> ${away}`;
      metaEl.textContent = `${league} · начало в ${time}${extraNote}`;
      if (labelEl) labelEl.textContent = isToday ? 'Сегодня в пабе' : 'Ближайшая трансляция';
    } catch (e) {
      // если открыт локально через file:// — fetch недоступен, оставляем заглушку
      teamsEl.textContent = 'Полная афиша';
      metaEl.innerHTML = 'Смотрите расписание на странице <a href="sport.html" style="color:var(--brass);">Трансляции</a>';
    }
  })();

// ===== Скрипт страницы: МЕНЮ (menu.html) =====
// Переключение вкладок меню: клик по кнопке .tab-btn показывает нужную .tab-panel и прячет остальные
  const tabBtns = document.querySelectorAll('.tab-btn');
  const panels = {
    kitchen: document.getElementById('panel-kitchen'),
    bar: document.getElementById('panel-bar'),
    beer: document.getElementById('panel-beer'),
  };

  function selectTab(tabKey) {
    if (!panels[tabKey]) return;
    tabBtns.forEach(b => b.classList.remove('active'));
    const btn = document.querySelector(`.tab-btn[data-tab="${tabKey}"]`);
    if (btn) btn.classList.add('active');
    Object.keys(panels).forEach(key => { panels[key].hidden = true; });
    panels[tabKey].hidden = false;
  }

  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => selectTab(btn.dataset.tab));
  });

  // Открываем нужную вкладку сразу, если пришли по ссылке с якорем (#beer, #bar, #kitchen)
  const initialTab = window.location.hash.replace('#', '');
  if (initialTab && panels[initialTab]) {
    selectTab(initialTab);
  }

  // Фильтр по категориям (чипы) — работает независимо в каждой вкладке (Кухня/Бар/Пиво)
  document.querySelectorAll('.tab-panel').forEach(panel => {
    const chips = panel.querySelectorAll('.cat-chip');
    const categories = panel.querySelectorAll('.dish-category');
    chips.forEach(chip => {
      chip.addEventListener('click', () => {
        chips.forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        const filter = chip.dataset.filter;
        categories.forEach(cat => {
          cat.style.display = (filter === 'all' || cat.dataset.cat === filter) ? '' : 'none';
        });
      });
    });
  });

// ===== Скрипт страницы: СПОРТ (sport.html) =====
const dateChips = document.querySelectorAll('.date-chip');
  const matchRows = document.querySelectorAll('.match-row');

  function selectDate(chip) {
    dateChips.forEach(c => c.classList.remove('active'));
    chip.classList.add('active');
    const date = chip.dataset.date;
    matchRows.forEach(row => {
      row.style.display = (row.dataset.date === date) ? '' : 'none';
    });
  }

  dateChips.forEach(chip => {
    chip.addEventListener('click', () => selectDate(chip));
  });

  // ===== Автоопределение сегодняшнего дня среди вписанных дат афиши =====
  (function () {
    const todayNum = String(new Date().getDate());
    let todayChip = null;
    let firstFutureOrEqual = null;

    dateChips.forEach(chip => {
      const chipDate = chip.dataset.date;
      if (chipDate === todayNum) {
        todayChip = chip;
        chip.classList.add('is-today');
      }
      if (firstFutureOrEqual === null && Number(chipDate) >= Number(todayNum)) {
        firstFutureOrEqual = chip;
      }
    });

    // если сегодняшняя дата есть в афише — выбираем её, иначе ближайшую следующую, иначе первую по списку
    const initialChip = todayChip || firstFutureOrEqual || dateChips[0];
    if (initialChip) selectDate(initialChip);
  })();

  // ===== Автоматическая пометка прошедших матчей как "Матч завершён" =====
  // Ничего вручную помечать не нужно: как только реальная дата на устройстве
  // становится больше data-date матча — он сам получает пометку и (если указан) счёт.
  // Счёт указывается через data-score="2:1" в разметке .match-row — необязательно.
  (function () {
    const todayNum = Number(new Date().getDate());

    matchRows.forEach(row => {
      const rowDate = Number(row.dataset.date);
      if (rowDate >= todayNum) return; // матч сегодня или ещё впереди — не трогаем

      row.classList.add('finished');

      // добавляем бейдж "Матч завершён" в строку лиги, если его там ещё нет
      const leagueEl = row.querySelector('.match-league');
      if (leagueEl && !leagueEl.querySelector('.finished-badge')) {
        const badge = document.createElement('span');
        badge.className = 'finished-badge';
        badge.textContent = 'Матч завершён';
        leagueEl.appendChild(badge);
      }

      // если в разметке указан счёт — подставляем его вместо "vs"
      const score = row.dataset.score;
      if (score) {
        const vsEl = row.querySelector('.vs');
        if (vsEl) {
          vsEl.textContent = score;
          vsEl.classList.remove('vs');
          vsEl.classList.add('match-score');
        }
      }
    });
  })();

  // ===== LIVE-статус матчей: если матч сегодня и текущее время попадает в его промежуток — вешаем бейдж "Идёт сейчас" и подсвечиваем строку =====
  (function () {
    function updateLiveMatches() {
      const now = new Date();
      const todayNum = now.getDate();

      matchRows.forEach(row => {
        const rowDate = Number(row.dataset.date);
        const matchTime = row.dataset.time;
        const duration = Number(row.dataset.duration) || 120;

        if (!matchTime) return;

        // Если матч не сегодня — он не может идти сейчас, снимаем бейдж, если он вдруг остался
        if (rowDate !== todayNum) {
          row.classList.remove('live-now');
          const oldBadge = row.querySelector('.live-badge');
          if (oldBadge) oldBadge.remove();
          return;
        }

        // Время начала матча
        const [hours, minutes] = matchTime.split(':').map(Number);
        const matchStart = new Date(now);
        matchStart.setHours(hours);
        matchStart.setMinutes(minutes);
        matchStart.setSeconds(0);
        matchStart.setMilliseconds(0);

        // Время окончания = начало + продолжительность (data-duration, по умолчанию 120 минут)
        const matchEnd = new Date(matchStart.getTime() + duration * 60 * 1000);

        // Идёт ли матч прямо сейчас?
        const isLive = now >= matchStart && now < matchEnd;

        const leagueEl = row.querySelector('.match-league');
        if (!leagueEl) return;
        const oldBadge = leagueEl.querySelector('.live-badge');

        if (isLive) {
          // Подсвечиваем карточку и добавляем индикатор, если его ещё нет
          row.classList.add('live-now');
          if (!oldBadge) {
            const badge = document.createElement('span');
            badge.className = 'live-badge';
            badge.innerHTML = `<span class="live-dot"></span>Идёт сейчас`;
            leagueEl.appendChild(badge);
          }
        } else {
          // Матч сейчас не идёт — убираем подсветку и бейдж
          row.classList.remove('live-now');
          if (oldBadge) oldBadge.remove();
        }
      });
    }

    // Запускаем сразу при загрузке страницы
    updateLiveMatches();

    // И далее проверяем каждую минуту, чтобы бейдж появлялся/исчезал без перезагрузки
    setInterval(updateLiveMatches, 60000);
  })();

// ===== Скрипт страницы: КОНТАКТЫ (contacts.html) =====
// ===== Открыто/закрыто прямо сейчас + подсветка сегодняшнего дня =====
  (function() {
    const now = new Date();
    const day = now.getDay(); // 0 = вс, 1 = пн, ... 6 = сб
    const hour = now.getHours() + now.getMinutes() / 60;

    // расписание: [деньНедели]: {open, close} — close < open значит переход через полночь
    const schedule = {
      0: { open: 14, close: 26 }, // вс 14:00–02:00 (след. день)
      1: { open: 16, close: 26 }, // пн 16:00–02:00
      2: { open: 16, close: 26 },
      3: { open: 16, close: 26 },
      4: { open: 16, close: 26 },
      5: { open: 14, close: 27 }, // пт 14:00–03:00
      6: { open: 14, close: 27 }, // сб 14:00–03:00
    };

    // подсветка строки сегодняшнего дня
    document.querySelectorAll('.hours-row').forEach(row => {
      const days = row.dataset.days.split(',').map(Number);
      if (days.includes(day)) row.classList.add('is-today');
    });

    // определяем открыто ли сейчас (учитывая, что после полуночи расписание "вчерашнего" дня ещё действует)
    const todayRule = schedule[day];
    const yesterdayRule = schedule[(day + 6) % 7];
    const isOpenToday = hour >= todayRule.open;
    const isOpenFromYesterday = hour < (yesterdayRule.close - 24);
    const isOpen = isOpenToday || isOpenFromYesterday;

    const statusEl = document.getElementById('openStatus');
    if (statusEl) {
      const textEl = statusEl.querySelector('.status-text');
      if (isOpen) {
        textEl.textContent = 'Открыто сейчас';
      } else {
        statusEl.classList.add('closed');
        textEl.textContent = 'Сейчас закрыто';
      }
    }
  })();

  // Плавающая кнопка навигации на мобилке
document.querySelectorAll('.mobile-nav-fab-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    btn.closest('.mobile-nav-fab').classList.toggle('open');
  });
});
document.addEventListener('click', (e) => {
  document.querySelectorAll('.mobile-nav-fab.open').forEach((fab) => {
    if (!fab.contains(e.target)) fab.classList.remove('open');
  });
});
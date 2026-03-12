(function () {
  function getQueryParam(name) {
    const params = new URLSearchParams(window.location.search);
    return params.get(name);
  }

  document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('gameCanvasFull');
    const ctx = canvas?.getContext('2d');
    const titleEl = document.getElementById('gameTitle');
    const subtitleEl = document.getElementById('gameSubtitle');
    const scoreEl = document.getElementById('gameScoreFull');
    const bestScoreEl = document.getElementById('gameBestScore');
    const btnRestart = document.getElementById('btnRestart');
    const btnPause = document.getElementById('btnPauseFull');

    if (!canvas || !ctx || !titleEl || !subtitleEl || !scoreEl || !bestScoreEl || !btnRestart || !btnPause) {
      return;
    }

    const registry = window.gamesRegistry || {};
    const gameIdFromUrl = getQueryParam('game');
    const gameKey = gameIdFromUrl && registry[gameIdFromUrl] ? gameIdFromUrl : Object.keys(registry)[0];
    const gameMeta = gameKey ? registry[gameKey] : null;
    const storageKey = gameKey ? `syharikplay_highscore_${gameKey}` : null;

    if (!gameMeta || !gameMeta.create) {
      titleEl.textContent = 'Игра не найдена';
      subtitleEl.textContent = 'Проверь параметр ?game= в адресной строке и подключённые JS‑файлы игр.';
      return;
    }

    let instance = null;
    let running = false;
    let lastTime = 0;
    let paused = false;
    let bestScore = 0;

    if (storageKey) {
      const stored = localStorage.getItem(storageKey);
      if (stored != null && !Number.isNaN(parseInt(stored, 10))) {
        bestScore = parseInt(stored, 10);
      }
    }
    bestScoreEl.textContent = String(bestScore | 0);

    function setScore(value) {
      const v = value | 0;
      scoreEl.textContent = String(v);
      if (v > bestScore) {
        bestScore = v;
        bestScoreEl.textContent = String(bestScore);
        if (storageKey) {
          localStorage.setItem(storageKey, String(bestScore));
        }
      }
    }

    function setSubtitle(text) {
      subtitleEl.textContent = text;
    }

    function clearCanvas() {
      const bg = getComputedStyle(document.documentElement).getPropertyValue('--bg-secondary') || '#141417';
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    function stopGame() {
      running = false;
      paused = false;
      btnPause.textContent = 'Пауза';
    }

    function startLoop() {
      if (running) return;
      running = true;
      paused = false;
      btnPause.textContent = 'Пауза';
      lastTime = performance.now();
      requestAnimationFrame(loop);
    }

    function loop(timestamp) {
      if (!running || !instance) return;
      const dt = (timestamp - lastTime) / 1000;
      lastTime = timestamp;

      if (!paused && typeof instance.update === 'function') {
        instance.update(dt);
      }
      clearCanvas();
      if (typeof instance.render === 'function') {
        instance.render(ctx);
      }

      if (running) {
        requestAnimationFrame(loop);
      }
    }

    const uiApi = {
      setScore,
      setSubtitle,
      stopGame,
      startLoop,
      canvas
    };

    function createInstance() {
      if (instance && typeof instance.dispose === 'function') {
        instance.dispose();
      }
      instance = gameMeta.create(uiApi);
      setScore(0);
      titleEl.textContent = gameMeta.title || 'Игра';
      subtitleEl.textContent = gameMeta.subtitle || '';
      clearCanvas();
      if (typeof instance.render === 'function') {
        instance.render(ctx);
      }
    }

    // Кнопки управления
    btnRestart.addEventListener('click', () => {
      if (instance && typeof instance.reset === 'function') {
        instance.reset();
      } else {
        createInstance();
      }
      startLoop();
    });

    btnPause.addEventListener('click', () => {
      if (!running) {
        // Если игра ещё не запущена, просто игнорируем нажатие
        return;
      }
      paused = !paused;
      btnPause.textContent = paused ? 'Возобновить' : 'Пауза';
    });

    // События клавиатуры пробрасываем внутрь игры.
    // При поставленной на паузу игре ввод игнорируется.
    window.addEventListener('keydown', (e) => {
      if (paused) return;
      if (instance && typeof instance.onKeyDown === 'function') {
        instance.onKeyDown(e);
      }
    });

    window.addEventListener('keyup', (e) => {
      if (paused) return;
      if (instance && typeof instance.onKeyUp === 'function') {
        instance.onKeyUp(e);
      }
    });

    // Первичная инициализация и запуск
    createInstance();
    startLoop();
  });
})();


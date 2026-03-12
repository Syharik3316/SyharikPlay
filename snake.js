// SyharikPlay — Змейка
// Вся модель и поведение змейки сконцентрированы в этом файле.
// Чтобы изменить игру, меняй константы и функции ниже.

(function () {
  const CONFIG = {
    gridSize: 20,
    speed: 8, // клеток в секунду
    background: '#141417',
    snakeColor: '#e8c547',
    snakeHeadColor: '#f5f5f5',
    foodColor: '#ff6b6b'
  };

  function createSnakeGame(ui) {
    const canvas = ui.canvas;
    const ctx = canvas.getContext('2d');
    const cellSize = Math.floor(canvas.width / CONFIG.gridSize);

    let snake;
    let direction;
    let nextDirection;
    let food;
    let elapsed = 0;
    let score = 0;
    let alive = true;

    function reset() {
      const center = Math.floor(CONFIG.gridSize / 2);
      snake = [
        { x: center, y: center },
        { x: center - 1, y: center },
        { x: center - 2, y: center }
      ];
      direction = { x: 1, y: 0 };
      nextDirection = { x: 1, y: 0 };
      score = 0;
      alive = true;
      spawnFood();
      ui.setScore(score);
      ui.setSubtitle('Управление: стрелки или WASD');
    }

    function spawnFood() {
      while (true) {
        const x = Math.floor(Math.random() * CONFIG.gridSize);
        const y = Math.floor(Math.random() * CONFIG.gridSize);
        if (!snake.some(seg => seg.x === x && seg.y === y)) {
          food = { x, y };
          return;
        }
      }
    }

    function update(dt) {
      if (!alive) return;
      elapsed += dt;
      const stepTime = 1 / CONFIG.speed;
      if (elapsed < stepTime) return;
      elapsed -= stepTime;

      direction = nextDirection;
      const head = snake[0];
      const newHead = {
        x: head.x + direction.x,
        y: head.y + direction.y
      };

      // Столкновение со стенами
      if (
        newHead.x < 0 ||
        newHead.y < 0 ||
        newHead.x >= CONFIG.gridSize ||
        newHead.y >= CONFIG.gridSize
      ) {
        gameOver();
        return;
      }

      // Столкновение с самим собой
      if (snake.some(seg => seg.x === newHead.x && seg.y === newHead.y)) {
        gameOver();
        return;
      }

      snake.unshift(newHead);

      if (newHead.x === food.x && newHead.y === food.y) {
        score += 10;
        ui.setScore(score);
        spawnFood();
      } else {
        snake.pop();
      }
    }

    function gameOver() {
      alive = false;
      ui.setSubtitle('Поражение. Нажми «Старт / Перезапуск», чтобы сыграть ещё раз.');
    }

    function render(ctx) {
      const bg = getComputedStyle(document.documentElement).getPropertyValue('--bg-secondary').trim() || CONFIG.background;
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Еда
      if (food) {
        ctx.fillStyle = CONFIG.foodColor;
        ctx.fillRect(
          food.x * cellSize,
          food.y * cellSize,
          cellSize,
          cellSize
        );
      }

      // Змейка
      snake.forEach((seg, index) => {
        ctx.fillStyle = index === 0 ? CONFIG.snakeHeadColor : CONFIG.snakeColor;
        ctx.fillRect(
          seg.x * cellSize,
          seg.y * cellSize,
          cellSize,
          cellSize
        );
      });

      // Оверлей при поражении
      if (!alive) {
        ctx.fillStyle = 'rgba(0,0,0,0.7)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 48px Outfit, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('Поражение', canvas.width / 2, canvas.height / 2 - 20);
        ctx.font = '24px Outfit, sans-serif';
        ctx.fillText('Нажми «Перезапуск»', canvas.width / 2, canvas.height / 2 + 30);
        ctx.textAlign = 'left';
        ctx.textBaseline = 'alphabetic';
      }
    }

    function onKeyDown(e) {
      const key = (e.key || '').toLowerCase();
      const code = e.code;
      let handled = false;

      const up = key === 'arrowup' || key === 'w' || code === 'ArrowUp' || code === 'KeyW';
      const down = key === 'arrowdown' || key === 's' || code === 'ArrowDown' || code === 'KeyS';
      const left = key === 'arrowleft' || key === 'a' || code === 'ArrowLeft' || code === 'KeyA';
      const right = key === 'arrowright' || key === 'd' || code === 'ArrowRight' || code === 'KeyD';

      // Смотрим не на прошлое направление движения, а на то,
      // в которое уже собираемся повернуть (nextDirection).
      const current = nextDirection || direction;

      if (up && current.y !== 1) {
        nextDirection = { x: 0, y: -1 };
        handled = true;
      } else if (down && current.y !== -1) {
        nextDirection = { x: 0, y: 1 };
        handled = true;
      } else if (left && current.x !== 1) {
        nextDirection = { x: -1, y: 0 };
        handled = true;
      } else if (right && current.x !== -1) {
        nextDirection = { x: 1, y: 0 };
        handled = true;
      }

      if (handled) {
        e.preventDefault();
      }
    }

    // Свайпы на мобильных
    let touchStartX = null;
    let touchStartY = null;

    function handleTouchStart(ev) {
      const t = ev.touches[0];
      touchStartX = t.clientX;
      touchStartY = t.clientY;
      ev.preventDefault();
    }

    function handleTouchMove(ev) {
      // Блокируем прокрутку страницы во время свайпа по канвасу
      if (touchStartX !== null && touchStartY !== null) {
        ev.preventDefault();
      }
    }

    function handleTouchEnd(ev) {
      if (touchStartX === null || touchStartY === null) return;
      const t = ev.changedTouches[0];
      const dx = t.clientX - touchStartX;
      const dy = t.clientY - touchStartY;
      const absX = Math.abs(dx);
      const absY = Math.abs(dy);

      if (Math.max(absX, absY) < 20) {
        touchStartX = touchStartY = null;
        return;
      }

      if (absX > absY) {
        // горизонтальный свайп
        if (dx > 0 && direction.x !== -1) {
          nextDirection = { x: 1, y: 0 };
        } else if (dx < 0 && direction.x !== 1) {
          nextDirection = { x: -1, y: 0 };
        }
      } else {
        // вертикальный свайп
        if (dy > 0 && direction.y !== -1) {
          nextDirection = { x: 0, y: 1 };
        } else if (dy < 0 && direction.y !== 1) {
          nextDirection = { x: 0, y: -1 };
        }
      }

      touchStartX = touchStartY = null;
      ev.preventDefault();
    }

    canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
    canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
    canvas.addEventListener('touchend', handleTouchEnd, { passive: false });

    reset();

    return {
      update,
      render,
      reset,
      onKeyDown,
      dispose() {
        canvas.removeEventListener('touchstart', handleTouchStart);
        canvas.removeEventListener('touchmove', handleTouchMove);
        canvas.removeEventListener('touchend', handleTouchEnd);
      }
    };
  }

  window.gamesRegistry = window.gamesRegistry || {};
  window.gamesRegistry.snake = {
    id: 'snake',
    title: 'Змейка',
    subtitle: 'Классическая змейка на сетке',
    description: 'Собирай еду, избегай столкновений с границами и своим хвостом.',
    genre: 'Аркада',
    difficulty: 'Лёгкая',
    shortcode: 'SNAKE',
    create: createSnakeGame
  };
})();


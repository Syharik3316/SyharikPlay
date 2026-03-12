// SyharikPlay — Тетрис
// Базовая реализация с поддержкой клавиатуры и свайпов.

(function () {
  const CONFIG = {
    cols: 10,
    rows: 20,
    fallSpeed: 1.2, // клеток в секунду
    softDropSpeed: 12,
    background: '#141417',
    gridColor: 'rgba(255,255,255,0.06)',
    colors: {
      I: '#4dd0e1',
      J: '#5c6bc0',
      L: '#ffb74d',
      O: '#ffd54f',
      S: '#81c784',
      T: '#ba68c8',
      Z: '#e57373'
    }
  };

  const SHAPES = {
    I: [
      [0, 0, 0, 0],
      [1, 1, 1, 1],
      [0, 0, 0, 0],
      [0, 0, 0, 0]
    ],
    J: [
      [1, 0, 0],
      [1, 1, 1],
      [0, 0, 0]
    ],
    L: [
      [0, 0, 1],
      [1, 1, 1],
      [0, 0, 0]
    ],
    O: [
      [1, 1],
      [1, 1]
    ],
    S: [
      [0, 1, 1],
      [1, 1, 0],
      [0, 0, 0]
    ],
    T: [
      [0, 1, 0],
      [1, 1, 1],
      [0, 0, 0]
    ],
    Z: [
      [1, 1, 0],
      [0, 1, 1],
      [0, 0, 0]
    ]
  };

  const TYPES = Object.keys(SHAPES);

  function randomType() {
    return TYPES[Math.floor(Math.random() * TYPES.length)];
  }

  function rotateMatrix(matrix) {
    const size = matrix.length;
    const res = Array.from({ length: size }, () => Array(size).fill(0));
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        res[x][size - 1 - y] = matrix[y][x];
      }
    }
    return res;
  }

  function createTetrisGame(ui) {
    const canvas = ui.canvas;
    const ctx = canvas.getContext('2d');

    const cellSize = Math.floor(canvas.height / CONFIG.rows);
    const playWidth = CONFIG.cols * cellSize;
    const offsetX = Math.floor((canvas.width - playWidth) / 2);

    let board;
    let current;
    let next;
    let fallTimer = 0;
    let dropSpeed = CONFIG.fallSpeed;
    let score = 0;
    let alive = true;

    function emptyBoard() {
      return Array.from({ length: CONFIG.rows }, () =>
        Array(CONFIG.cols).fill(null)
      );
    }

    function spawnPiece() {
      const type = next || randomType();
      next = randomType();
      const shapeBase = SHAPES[type];
      const size = shapeBase.length;
      const shape = shapeBase.map(row => row.slice());
      const x = Math.floor((CONFIG.cols - size) / 2);
      const y = -1;
      current = { type, shape, x, y, size };
      if (collides(0, 1, shape)) {
        gameOver();
      }
    }

    function reset() {
      board = emptyBoard();
      score = 0;
      alive = true;
      fallTimer = 0;
      dropSpeed = CONFIG.fallSpeed;
      next = randomType();
      spawnPiece();
      ui.setScore(score);
      ui.setSubtitle('Управление: ← → — влево/вправо, ↑ или W — поворот, ↓ — ускорить падение, пробел — уронить фигуру.');
    }

    function collides(dx, dy, shape = current.shape) {
      const size = current.size;
      for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
          if (!shape[y][x]) continue;
          const nx = current.x + x + dx;
          const ny = current.y + y + dy;
          if (ny < 0) continue;
          if (nx < 0 || nx >= CONFIG.cols || ny >= CONFIG.rows) return true;
          if (board[ny][nx]) return true;
        }
      }
      return false;
    }

    function merge() {
      const size = current.size;
      for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
          if (!current.shape[y][x]) continue;
          const nx = current.x + x;
          const ny = current.y + y;
          if (ny < 0) continue;
          board[ny][nx] = current.type;
        }
      }
      clearLines();
      spawnPiece();
    }

    function clearLines() {
      let lines = 0;
      for (let y = CONFIG.rows - 1; y >= 0; y--) {
        if (board[y].every(cell => cell)) {
          board.splice(y, 1);
          board.unshift(Array(CONFIG.cols).fill(null));
          lines++;
          y++;
        }
      }
      if (lines > 0) {
        const points = [0, 100, 300, 500, 800][lines] || 0;
        score += points;
        ui.setScore(score);
      }
    }

    function gameOver() {
      alive = false;
      ui.setSubtitle('Игра окончена. Нажми «Перезапуск», чтобы сыграть ещё раз.');
    }

    function move(dx) {
      if (!alive) return;
      if (!collides(dx, 0)) {
        current.x += dx;
      }
    }

    function softDrop() {
      if (!alive) return;
      if (!collides(0, 1)) {
        current.y += 1;
      } else {
        merge();
      }
    }

    function hardDrop() {
      if (!alive) return;
      while (!collides(0, 1)) {
        current.y += 1;
      }
      merge();
    }

    function rotate() {
      if (!alive) return;
      if (current.type === 'O') return;
      const rotated = rotateMatrix(current.shape);
      if (!collides(0, 0, rotated)) {
        current.shape = rotated;
      }
    }

    function update(dt) {
      if (!alive) return;
      fallTimer += dt;
      const interval = 1 / dropSpeed;
      const maxSteps = dropSpeed === CONFIG.softDropSpeed ? 4 : 10;
      let steps = 0;
      while (fallTimer >= interval && steps < maxSteps) {
        fallTimer -= interval;
        steps++;
        if (!collides(0, 1)) {
          current.y += 1;
        } else {
          merge();
          if (!alive) return;
        }
      }
    }

    function render(ctx) {
      const bg = getComputedStyle(document.documentElement).getPropertyValue('--bg-secondary').trim() || CONFIG.background;
      const gridC = document.documentElement.getAttribute('data-theme') === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.1)';
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Сетка
      ctx.strokeStyle = gridC;
      ctx.lineWidth = 1;
      for (let x = 0; x <= CONFIG.cols; x++) {
        ctx.beginPath();
        ctx.moveTo(offsetX + x * cellSize + 0.5, 0);
        ctx.lineTo(offsetX + x * cellSize + 0.5, CONFIG.rows * cellSize);
        ctx.stroke();
      }
      for (let y = 0; y <= CONFIG.rows; y++) {
        ctx.beginPath();
        ctx.moveTo(offsetX + 0.5, y * cellSize + 0.5);
        ctx.lineTo(offsetX + CONFIG.cols * cellSize + 0.5, y * cellSize + 0.5);
        ctx.stroke();
      }

      // Поле
      for (let y = 0; y < CONFIG.rows; y++) {
        for (let x = 0; x < CONFIG.cols; x++) {
          const cell = board[y][x];
          if (!cell) continue;
          drawCell(x, y, CONFIG.colors[cell]);
        }
      }

      // Превью следующей фигуры — справа от поля
      if (next && alive) {
        const prevCell = Math.min(16, Math.floor((canvas.width - offsetX - playWidth - 20) / 4));
        const prevBox = 4 * prevCell;
        const prevX = offsetX + playWidth + 12;
        const prevY = 40;
        ctx.strokeStyle = gridC;
        ctx.lineWidth = 1;
        ctx.strokeRect(prevX - 1, prevY - 1, prevBox + 2, prevBox + 2);
        const shape = SHAPES[next];
        const sz = shape.length;
        const padX = Math.floor((4 - sz) / 2);
        const padY = Math.floor((4 - sz) / 2);
        for (let y = 0; y < sz; y++) {
          for (let x = 0; x < sz; x++) {
            if (!shape[y][x]) continue;
            const px = prevX + (padX + x) * prevCell;
            const py = prevY + (padY + y) * prevCell;
            ctx.fillStyle = CONFIG.colors[next];
            ctx.fillRect(px, py, prevCell, prevCell);
            ctx.fillStyle = 'rgba(0,0,0,0.2)';
            ctx.fillRect(px, py + prevCell * 0.5, prevCell, prevCell * 0.5);
          }
        }
        ctx.font = '10px Outfit, sans-serif';
        ctx.fillStyle = document.documentElement.getAttribute('data-theme') === 'dark' ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.5)';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.fillText('След.', prevX, prevY + prevBox + 4);
      }

      // Текущая фигура
      const size = current.size;
      for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
          if (!current.shape[y][x]) continue;
          const nx = current.x + x;
          const ny = current.y + y;
          if (ny < 0) continue;
          drawCell(nx, ny, CONFIG.colors[current.type]);
        }
      }

      // Оверлей при поражении
      if (!alive) {
        ctx.fillStyle = 'rgba(0,0,0,0.7)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 48px Outfit, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('Игра окончена', canvas.width / 2, canvas.height / 2 - 20);
        ctx.font = '24px Outfit, sans-serif';
        ctx.fillText('Нажми «Перезапуск»', canvas.width / 2, canvas.height / 2 + 30);
        ctx.textAlign = 'left';
        ctx.textBaseline = 'alphabetic';
      }
    }

    function drawCell(x, y, color) {
      const px = offsetX + x * cellSize;
      const py = y * cellSize;
      ctx.fillStyle = color;
      ctx.fillRect(px, py, cellSize, cellSize);
      ctx.fillStyle = 'rgba(0,0,0,0.25)';
      ctx.fillRect(px, py + cellSize * 0.6, cellSize, cellSize * 0.4);
    }

    function onKeyDown(e) {
      const key = (e.key || '').toLowerCase();
      const code = e.code;
      let handled = false;

      if (key === 'arrowleft' || code === 'ArrowLeft' || key === 'a' || code === 'KeyA') {
        move(-1);
        handled = true;
      } else if (key === 'arrowright' || code === 'ArrowRight' || key === 'd' || code === 'KeyD') {
        move(1);
        handled = true;
      } else if (key === 'arrowdown' || code === 'ArrowDown' || key === 's' || code === 'KeyS') {
        if (dropSpeed !== CONFIG.softDropSpeed) {
          fallTimer = 0;
        }
        dropSpeed = CONFIG.softDropSpeed;
        handled = true;
      } else if (key === 'arrowup' || code === 'ArrowUp' || key === 'w' || code === 'KeyW') {
        rotate();
        handled = true;
      } else if (code === 'Space') {
        hardDrop();
        handled = true;
      }

      if (handled) {
        e.preventDefault();
      }
    }

    function onKeyUp(e) {
      const key = (e.key || '').toLowerCase();
      const code = e.code;
      if (key === 'arrowdown' || code === 'ArrowDown' || key === 's' || code === 'KeyS') {
        dropSpeed = CONFIG.fallSpeed;
        fallTimer = 0;
        e.preventDefault();
      }
    }

    // Свайпы и тапы на мобильных
    let touchStartX = null;
    let touchStartY = null;
    let touchStartTime = 0;

    function handleTouchStart(ev) {
      const t = ev.touches[0];
      touchStartX = t.clientX;
      touchStartY = t.clientY;
      touchStartTime = performance.now();
      ev.preventDefault();
    }

    function handleTouchMove(ev) {
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
      const dt = performance.now() - touchStartTime;

      const TAP_THRESHOLD = 120;
      const MOVE_THRESHOLD = 24;

      if (absX < MOVE_THRESHOLD && absY < MOVE_THRESHOLD && dt < TAP_THRESHOLD) {
        // Короткий тап — поворот
        rotate();
      } else if (absX > absY) {
        if (dx > 0) move(1);
        else move(-1);
      } else {
        if (dy > 0) hardDrop();
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
      onKeyUp,
      dispose() {
        canvas.removeEventListener('touchstart', handleTouchStart);
        canvas.removeEventListener('touchmove', handleTouchMove);
        canvas.removeEventListener('touchend', handleTouchEnd);
      }
    };
  }

  window.gamesRegistry = window.gamesRegistry || {};
  window.gamesRegistry.tetris = {
    id: 'tetris',
    title: 'Тетрис',
    subtitle: 'Собирай линии из падающих фигур',
    description: 'Классический тетрис: поворачивай фигуры, заполняй ряды, набирай максимум очков.',
    genre: 'Головоломка',
    difficulty: 'Средняя',
    shortcode: 'TETRIS',
    create: createTetrisGame
  };
})();


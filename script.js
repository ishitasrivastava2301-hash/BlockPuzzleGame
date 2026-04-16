const boardSize = 5;
const boardCells = Array.from(document.querySelectorAll('.board-cell'));
const pieceElements = Array.from(document.querySelectorAll('.piece'));
const statusText = document.getElementById('statusText');
const scoreText = document.getElementById('scoreText');
const resetButton = document.getElementById('resetButton');

const shapes = {
  line: { offsets: [[0, 0], [0, 1], [0, 2], [0, 3]], color: 'orange', label: 'Line' },
  square: { offsets: [[0, 0], [0, 1], [1, 0], [1, 1]], color: 'yellow', label: 'Square' },
  two: { offsets: [[0, 0], [0, 1]], color: 'cyan', label: '2x1' },
  l: { offsets: [[0, 0], [1, 0], [2, 0], [2, 1]], color: 'pink', label: 'L-Shape' },
  t: { offsets: [[0, 0], [0, 1], [0, 2], [1, 1]], color: 'green', label: 'T-Shape' },
  z: { offsets: [[0, 0], [0, 1], [1, 1], [1, 2]], color: 'purple', label: 'Z-Shape' },
  wide: { offsets: [[0, 0], [0, 1], [0, 2]], color: 'blue', label: '3x1' },
};

let score = 0;

function getCellIndex(cell) {
  return Number(cell.dataset.index);
}

function getCellColor(index) {
  return boardCells[index].dataset.piece || null;
}

function setCell(index, color) {
  const cell = boardCells[index];
  cell.dataset.piece = color;
  cell.classList.add('filled', `block-${color}`);
}

function clearCell(index) {
  const cell = boardCells[index];
  const color = cell.dataset.piece;
  cell.removeAttribute('data-piece');
  cell.classList.remove('filled', `block-${color}`);
}

function countEmptyCells() {
  return boardCells.filter((cell) => !cell.dataset.piece).length;
}

function checkFullLines() {
  const fullRows = [];
  const fullCols = [];

  for (let row = 0; row < boardSize; row += 1) {
    const start = row * boardSize;
    const rowCells = boardCells.slice(start, start + boardSize);
    if (rowCells.every((cell) => cell.dataset.piece)) {
      fullRows.push(row);
    }
  }

  for (let col = 0; col < boardSize; col += 1) {
    const colCells = [];
    for (let row = 0; row < boardSize; row += 1) {
      colCells.push(boardCells[row * boardSize + col]);
    }
    if (colCells.every((cell) => cell.dataset.piece)) {
      fullCols.push(col);
    }
  }

  return { fullRows, fullCols };
}

function clearFullLines() {
  const { fullRows, fullCols } = checkFullLines();
  const clearedCells = new Set();

  fullRows.forEach((row) => {
    for (let col = 0; col < boardSize; col += 1) {
      clearedCells.add(row * boardSize + col);
    }
  });

  fullCols.forEach((col) => {
    for (let row = 0; row < boardSize; row += 1) {
      clearedCells.add(row * boardSize + col);
    }
  });

  clearedCells.forEach(clearCell);
  return clearedCells.size;
}

function canPlaceShape(shapeId, startIndex) {
  const shape = shapes[shapeId];
  if (!shape) return false;

  const startRow = Math.floor(startIndex / boardSize);
  const startCol = startIndex % boardSize;

  return shape.offsets.every(([rowOffset, colOffset]) => {
    const row = startRow + rowOffset;
    const col = startCol + colOffset;
    if (row < 0 || col < 0 || row >= boardSize || col >= boardSize) {
      return false;
    }
    const cellIndex = row * boardSize + col;
    return !boardCells[cellIndex].dataset.piece;
  });
}

function placeShape(shapeId, startIndex) {
  const shape = shapes[shapeId];
  if (!shape) {
    updateDisplay('Unknown shape.');
    return;
  }

  if (!canPlaceShape(shapeId, startIndex)) {
    updateDisplay('That shape does not fit there. Try a different position.');
    return;
  }

  const startRow = Math.floor(startIndex / boardSize);
  const startCol = startIndex % boardSize;
  shape.offsets.forEach(([rowOffset, colOffset]) => {
    const row = startRow + rowOffset;
    const col = startCol + colOffset;
    const cellIndex = row * boardSize + col;
    setCell(cellIndex, shape.color);
  });

  const cleared = clearFullLines();
  if (cleared > 0) {
    score += cleared;
    updateDisplay(`Placed ${shape.label}, cleared ${cleared} cells!`);
  } else {
    score += shape.offsets.length;
    updateDisplay(`Placed ${shape.label}. Keep filling rows or columns.`);
  }

  if (countEmptyCells() === 0) {
    updateDisplay('Game over — no more space left on the board. Reset to try again.');
  }
}

function updateDisplay(message) {
  statusText.textContent = message;
  scoreText.textContent = `Score: ${score}`;
}

function handleDragStart(event) {
  const pieceId = event.target.dataset.piece;
  if (!pieceId) return;
  event.dataTransfer.setData('text/plain', pieceId);
  event.dataTransfer.effectAllowed = 'move';
}

function handleDragOver(event) {
  event.preventDefault();
  event.currentTarget.classList.add('over');
}

function handleDragLeave(event) {
  event.currentTarget.classList.remove('over');
}

function handleDrop(event) {
  event.preventDefault();
  const cell = event.currentTarget;
  cell.classList.remove('over');
  const shapeId = event.dataTransfer.getData('text/plain');
  if (!shapeId) return;

  const targetIndex = getCellIndex(cell);
  placeShape(shapeId, targetIndex);
}

function handleReset() {
  boardCells.forEach((cell) => {
    cell.removeAttribute('data-piece');
    cell.classList.remove('filled', 'block-blue', 'block-pink', 'block-yellow', 'block-green', 'block-purple', 'block-orange', 'block-cyan');
  });
  score = 0;
  updateDisplay('Board reset. Drop shapes to start again.');
}

boardCells.forEach((cell) => {
  cell.addEventListener('dragover', handleDragOver);
  cell.addEventListener('dragleave', handleDragLeave);
  cell.addEventListener('drop', handleDrop);
});

pieceElements.forEach((piece) => {
  piece.addEventListener('dragstart', handleDragStart);
});

resetButton.addEventListener('click', handleReset);
updateDisplay('Drop a shape to start.');

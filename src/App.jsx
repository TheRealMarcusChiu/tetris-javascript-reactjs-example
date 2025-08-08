import React, { useState, useEffect, useRef } from 'react'
import './App.css'
import GlobalKeyListener from './components/GlobalKeyListener.jsx'


const audio_koro = new Audio('/korobeiniki.ogg');
audio_koro.volume = 0.10;
audio_koro.loop = true;

const audio_clear = new Audio('/clear.ogg');
audio_clear.volume = 0.30;
const audio_drop = new Audio('/drop.ogg');
audio_drop.volume = 0.30;
const audio_move = new Audio('/move.ogg');
audio_move.volume = 0.30;
const audio_rotate = new Audio('/rotate.ogg');
audio_rotate.volume = 0.30;
const audio_landing = new Audio('/landing.ogg');
audio_landing.volume = 0.30;
const audio_game_over = new Audio('/game-over.ogg');
audio_game_over.volume = 0.30;


const pieceMap = [
    [[0,0,0,0],
     [0,1,1,0],
     [0,1,1,0],
     [0,0,0,0]],
    [[0,2,0,0],
     [0,2,0,0],
     [0,2,0,0],
     [0,2,0,0]],
    [[0,3,0],
     [0,3,3],
     [0,3,0]],
    [[0,4,0],
     [0,4,4],
     [0,0,4]],
    [[0,0,5],
     [0,5,5],
     [0,5,0]],
    [[0,0,0,0,0],
     [0,0,0,0,0],
     [0,0,6,6,0],
     [0,0,6,0,0],
     [0,0,6,0,0]],
    [[0,0,7,0,0],
     [0,0,7,0,0],
     [0,0,7,7,0],
     [0,0,0,0,0],
     [0,0,0,0,0]],
];


///////////////////////////
// Piece Generator State //
///////////////////////////

const pieceSequence1 = [0, 1, 2, 3, 4, 5, 6];
const pieceSequence2 = [0, 0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6];
let chosenPieceSequence = pieceSequence1;

let curPieceSequence = null;
let curPieceSequenceIdx = null;


/////////////////////////
// Current Piece State //
/////////////////////////

let curPieceIndex = null;
let curPieceMap = null;
let curPieceX = null;
let curPieceY = null;

let curPieceX_hardSet = null;
let curPieceY_hardSet = null;

let curPieceIndex_hold = null;
let canHold = null;


/////////////////////////////////
// Grid State & Canvas Context //
/////////////////////////////////

let gridState = null;
let ctx = null;
let width = null;
let height = null;

//////////////////////
// Other Game State //
//////////////////////

let scoreHtml = null;
let curLevel = null;
let curScore = null;
let gameOver = null;

let widthHold = null;
let heightHold = null;
let ctxHold = null;

let widthNext = null;
let heightNext = null;
let ctxNext = null;

let widthNext2 = null;
let heightNext2 = null;
let ctxNext2 = null;

const x_shifts = [5, 3, 22, 22, 22, -57, 20];
const y_shifts = [5, 20, 10, 10, 10, -35, -35];



function hold() {
    if (canHold) {
        canHold = false;
        if (curPieceIndex_hold === null) {
            curPieceIndex_hold = curPieceIndex;
            genRandCurPiece();
            rerender();
        } else {
            const temp = curPieceIndex;
            setCurPiece(curPieceIndex_hold);
            curPieceIndex_hold = temp;
            rerender();
        }
    }
}

function lockCurPieceIntoGridState() {
    embedPieceIntoGridState(gridState, curPieceX, curPieceY, curPieceMap);
    const linesCleared = clearLines(gridState);
    if (linesCleared > 0) {
        audio_clear.play();
    }
    updateScore(linesCleared);
    genRandCurPiece();
    canHold = true;
    rerender();

    if (isCollision(gridState, curPieceX, curPieceY + 1, curPieceMap)) {
        gameOverHandler();
    }
}

function gameOverHandler() {
    gameOver = true;
    audio_game_over.play();
    gameEngineStepCounter_Stop();
    renderGameOver();
}

function stepCounter() {
    if (isCollision(gridState, curPieceX, curPieceY + 1, curPieceMap)) {
        audio_landing.play();
        lockCurPieceIntoGridState();
    } else {
        curPieceY++;
        rerender();
    }
}

function updateScore(linesCleared) {
    switch (linesCleared) {
        case 1:
            curScore = curScore + (40) * (curLevel + 1)
            break;
        case 2:
            curScore = curScore + (100) * (curLevel + 1)
            break;
        case 3:
            curScore = curScore + (300) * (curLevel + 1)
            break;
        case 4:
            curScore = curScore + (1200) * (curLevel + 1)
            break;
        default:
            // Code to execute if no case matches
    }
    renderScore();
}

function renderScore() {
    scoreHtml.innerHTML = curScore;
}

function clearLines(gridState) {
    const rows2Clear = [];

    // find rows to clear
    for (let y = 0; y < 20; y++) {
        let clear = true;
        for (let x = 0; x < 10; x++) {
            if (gridState[y][x] === 0) {
                clear = false;
                break;
            }
        }
        if (clear) {
            rows2Clear.push(y);
        }
    }

    // clear rows and replace
    for (let i = 0; i < rows2Clear.length; i++) {
        gridState.splice(rows2Clear[i], 1);
        gridState.unshift(new Array(10).fill(0));
    }

    return rows2Clear.length;
}

function embedPieceIntoGridState(gridState, curPieceX, curPieceY, curPieceMap) {
    let xSize = curPieceMap.length;
    let ySize = curPieceMap[0].length;

    for (let i = 0; i < xSize; i++) {
        for (let j = 0; j < ySize; j++) {
            if (curPieceMap[i][j] !== 0) {
                let x = curPieceX + i;
                let y = curPieceY + j;

                if (!(x < 0 || x > 9 || y < 0 || y > 19)) {
                    gridState[y][x] = curPieceMap[i][j];
                }
            }
        }
    }
}

let intervalId_gameEngineStepCounter = 0;
function gameEngineStepCounter_Start(stepCounter) {
    if (intervalId_gameEngineStepCounter === 0) {
        intervalId_gameEngineStepCounter = setInterval(stepCounter, 1000);
    }
}
function gameEngineStepCounter_Stop() {
    if (intervalId_gameEngineStepCounter !== 0) {
        clearInterval(intervalId_gameEngineStepCounter);
        intervalId_gameEngineStepCounter = 0;
    }
}

function renderBackgroundAll() {
    ctx.clearRect(0, 0, width, height);
    renderBackground();
    renderGrid(ctx);
    renderHoldBackground();
    renderNextBackground();
    renderNext2Background();
}

function rerender() {
    calculateCurPieceXY_hardSet(curPieceX, curPieceY, curPieceMap);
    renderBackgroundAll();
    renderGridState(ctx, gridState);
    renderCurPieceHardSet(ctx, curPieceX_hardSet, curPieceY_hardSet, curPieceMap);
    renderCurPiece(ctx, curPieceX, curPieceY, curPieceMap);
    renderHoldPiece();
    renderNextPiece();
    renderNext2Piece();
}

function keydownEC(event) {
    if (gameOver) {
        return;
    }

    if (event.key === "c") {
        hold();
    } else if (event.key === "ArrowLeft") {
        if (!isCollision(gridState, curPieceX - 1, curPieceY, curPieceMap)) {
            curPieceX--;
            audio_move.play();
            rerender();
        }
    } else if (event.key === "ArrowRight") {
        if (!isCollision(gridState, curPieceX + 1, curPieceY, curPieceMap)) {
            curPieceX++;
            audio_move.play();
            rerender();
        }
    } else if (event.key === "ArrowDown") {
        gameEngineStepCounter_Stop();
        if (!isCollision(gridState, curPieceX, curPieceY + 1, curPieceMap)) {
            curPieceY++;
            rerender();
        }
    } else if (event.shiftKey && event.key === "ArrowUp") {
        if (canRotateCounterClockwise(gridState, curPieceX, curPieceY, curPieceMap)) {
            curPieceMap = rotateMatrixCounterClockwise(curPieceMap);
            audio_rotate.play();
            rerender();
        } else if (canRotateCounterClockwise(gridState, curPieceX, curPieceY - 1, curPieceMap)) {
            curPieceY--;
            curPieceMap = rotateMatrixCounterClockwise(curPieceMap);
            audio_rotate.play();
            rerender();
        } else if (canRotateCounterClockwise(gridState, curPieceX, curPieceY + 1, curPieceMap)) {
            curPieceY++;
            curPieceMap = rotateMatrixCounterClockwise(curPieceMap);
            audio_rotate.play();
            rerender();
        } else if (canRotateCounterClockwise(gridState, curPieceX - 1, curPieceY, curPieceMap)) {
            curPieceX--;
            curPieceMap = rotateMatrixCounterClockwise(curPieceMap);
            audio_rotate.play();
            rerender();
        } else if (canRotateCounterClockwise(gridState, curPieceX + 1, curPieceY, curPieceMap)) {
            curPieceX++;
            curPieceMap = rotateMatrixCounterClockwise(curPieceMap);
            audio_rotate.play();
            rerender();
        }
    } else if (event.key === "ArrowUp") {
        if (canRotateClockwise(gridState, curPieceX, curPieceY, curPieceMap)) {
            curPieceMap = rotateMatrixClockwise(curPieceMap);
            audio_rotate.play();
            rerender();
        } else if (canRotateClockwise(gridState, curPieceX, curPieceY - 1, curPieceMap)) {
            curPieceY--;
            curPieceMap = rotateMatrixClockwise(curPieceMap);
            audio_rotate.play();
            rerender();
        } else if (canRotateClockwise(gridState, curPieceX, curPieceY + 1, curPieceMap)) {
            curPieceY++;
            curPieceMap = rotateMatrixClockwise(curPieceMap);
            audio_rotate.play();
            rerender();
        } else if (canRotateClockwise(gridState, curPieceX - 1, curPieceY, curPieceMap)) {
            curPieceX--;
            curPieceMap = rotateMatrixClockwise(curPieceMap);
            audio_rotate.play();
            rerender();
        } else if (canRotateClockwise(gridState, curPieceX + 1, curPieceY, curPieceMap)) {
            curPieceX++;
            curPieceMap = rotateMatrixClockwise(curPieceMap);
            audio_rotate.play();
            rerender();
        }
    } else if (event.key === " " || event.key === "Space") {
        audio_drop.play();
        hardSet();
        lockCurPieceIntoGridState();
    }
}

function keyupEC(event) {
    if (gameOver) {
        return;
    }

    if (event.key === "ArrowDown") {
        gameEngineStepCounter_Start(stepCounter);
    }
}

function renderBackground() {
    ctx.fillStyle = 'rgb(24,23,22)';
    ctx.fillRect(0, 0, width, height); // x, y, width, height
    ctx.fill();
}

function renderHoldBackground() {
    ctxHold.fillStyle = 'rgb(24,23,22)';
    ctxHold.fillRect(0, 0, widthHold, heightHold); // x, y, width, height
    ctxHold.fill();
}

function renderNextBackground() {
    ctxNext.fillStyle = 'rgb(24,23,22)';
    ctxNext.fillRect(0, 0, widthNext, heightNext); // x, y, width, height
    ctxNext.fill();
}

function renderNext2Background() {
    ctxNext2.fillStyle = 'rgb(24,23,22)';
    ctxNext2.fillRect(0, 0, widthNext2, heightNext2); // x, y, width, height
    ctxNext2.fill();
}

function renderHoldPiece() {
    if (curPieceIndex_hold !== null) {
        const holdPieceMap = pieceMap[curPieceIndex_hold];
        let xSize = holdPieceMap.length;
        let ySize = holdPieceMap[0].length;

        const x_shift = x_shifts[curPieceIndex_hold];
        const y_shift = y_shifts[curPieceIndex_hold];

        for (let i = 0; i < xSize; i++) {
            for (let j = 0; j < ySize; j++) {
                if (holdPieceMap[i][j] !== 0) {
                    renderBlock(ctxHold, i, j, holdPieceMap[i][j], x_shift, y_shift);
                }
            }
        }
    }
}

function renderNextPiece() {
    const nextPieceIndex = curPieceSequence[curPieceSequenceIdx];

    const nextPieceMap = pieceMap[nextPieceIndex];
    let xSize = nextPieceMap.length;
    let ySize = nextPieceMap[0].length;

    const x_shift = x_shifts[nextPieceIndex];
    const y_shift = y_shifts[nextPieceIndex];

    for (let i = 0; i < xSize; i++) {
        for (let j = 0; j < ySize; j++) {
            if (nextPieceMap[i][j] !== 0) {
                renderBlock(ctxNext, i, j, nextPieceMap[i][j], x_shift, y_shift);
            }
        }
    }
}

function renderNext2Piece_Helper(nextPieceIndex, idx) {
    const next2PieceMap = pieceMap[nextPieceIndex];
    let xSize = next2PieceMap.length;
    let ySize = next2PieceMap[0].length;

    const x_shift = x_shifts[nextPieceIndex];
    const y_shift = y_shifts[nextPieceIndex];

    for (let i = 0; i < xSize; i++) {
        for (let j = 0; j < ySize; j++) {
            if (next2PieceMap[i][j] !== 0) {
                renderBlock(ctxNext2, i, j + (3 * idx), next2PieceMap[i][j], x_shift, y_shift);
            }
        }
    }
}
function renderNext2Piece() {
    const nextPieceIndex1 = curPieceSequence[curPieceSequenceIdx + 1];
    const nextPieceIndex2 = curPieceSequence[curPieceSequenceIdx + 2];
    const nextPieceIndex3 = curPieceSequence[curPieceSequenceIdx + 3];

    renderNext2Piece_Helper(nextPieceIndex1, 0);
    renderNext2Piece_Helper(nextPieceIndex2, 1);
    renderNext2Piece_Helper(nextPieceIndex3, 2);
}

function renderGrid(ctx) {
    ctx.lineWidth = 4;
    ctx.strokeStyle = "black";

    // render horizontal lines
    for (let i = 1; i < 20; i++) {
        ctx.beginPath();
        ctx.moveTo(0, (i*40) + 2);
        ctx.lineTo(width, (i*40) + 2);
        ctx.stroke();
    }

    // render vertical lines
    for (let i = 1; i < 10; i++) {
        ctx.beginPath();
        ctx.moveTo((i*40) + 2, 0);
        ctx.lineTo((i*40) + 2, height);
        ctx.stroke();
    }
}

function renderBlock(ctx, x, y, gridStateValue, x_shift = 0, y_shift = 0) {
    let fillColor = 'blue';
    let fillColorShade = 'blue';

    switch (gridStateValue) {
        case 1:
            // Code to execute if expression === value1
            fillColor = 'rgb(251,219,15)';
            fillColorShade = 'rgb(255,193,0)';
            break;
        case 2:
            fillColor = 'rgb(0,247,255)';
            fillColorShade = 'rgb(2,195,212)';
            break;
        case 3:
            fillColor = 'rgb(137,59,253)';
            fillColorShade = 'rgb(114,18,254)';
            break;
        case 4:
            fillColor = 'rgb(254,103,2)';
            fillColorShade = 'rgb(254,5,0)';
            break;
        case 5:
            fillColor = 'rgb(0,180,0)';
            fillColorShade = 'rgb(0,164,1)';
            break;
        case 6:
            fillColor = 'rgb(252,110,1)';
            fillColorShade = 'rgb(216,100,0)';
            break;
        case 7:
            fillColor = 'rgb(1,0,252)';
            fillColorShade = 'rgb(1,0,194)';
            break;
        default:
            // Code to execute if no case matches
    }

    // Fill Color
    ctx.fillStyle = fillColor;
    ctx.fillRect((x * 40) + 2 + x_shift, (y * 40) + 2 + y_shift, 40, 40); // x, y, width, height
    ctx.fill();

    // Fill Color Shade
    ctx.fillStyle = fillColorShade;
    ctx.fillRect((x * 40) + 2 + x_shift, (y * 40) + 2 + y_shift, 15, 40); // x, y, width, height
    ctx.fill();
    ctx.fillStyle = fillColorShade;
    ctx.fillRect((x * 40) + 2 + x_shift, (y * 40) + 2 + 25 + y_shift, 40, 15); // x, y, width, height
    ctx.fill();

    // Outline
    ctx.strokeStyle = 'rgb(41,39,39)'; // Set the stroke color
    ctx.lineWidth = 4; // Set the line width
    ctx.strokeRect((x * 40) + 2 + x_shift, (y * 40) + 2 + y_shift, 40, 40); // Draw an outlined red rectangle
}

function renderBlock_hardSet(ctx, x, y) {
    ctx.strokeStyle = 'rgb(169,169,169)'; // Set the stroke color
    ctx.lineWidth = 4; // Set the line width
    ctx.strokeRect((x * 40) + 8, (y * 40) + 8, 28, 28); // Draw an outlined red rectangle
}

function renderGridState(ctx, gridState) {
    for (let x = 0; x < 10; x++) {
        for (let y = 0; y < 20; y++) {
            if (gridState[y][x] !== 0) {
                renderBlock(ctx, x, y, gridState[y][x]);
            }
        }
    }
}

function renderCurPiece(ctx, curPieceX, curPieceY, curPieceMap) {
    let xSize = curPieceMap.length;
    let ySize = curPieceMap[0].length;

    for (let i = 0; i < xSize; i++) {
        for (let j = 0; j < ySize; j++) {
            if (curPieceMap[i][j] !== 0) {
                renderBlock(ctx, (i + curPieceX), (j + curPieceY), curPieceMap[i][j]);
            }
        }
    }
}

function renderCurPieceHardSet(ctx, curPieceX, curPieceY, curPieceMap) {
    let xSize = curPieceMap.length;
    let ySize = curPieceMap[0].length;

    for (let i = 0; i < xSize; i++) {
        for (let j = 0; j < ySize; j++) {
            if (curPieceMap[i][j] !== 0) {
                renderBlock_hardSet(ctx, (i + curPieceX), (j + curPieceY));
            }
        }
    }
}

// Fisher-Yates shuffle
function shuffleArray(array) {
    // Loop backward through the array
    for (let i = array.length - 1; i > 0; i--) {
        // Generate a random index 'j' between 0 and 'i' (inclusive)
        const j = Math.floor(Math.random() * (i + 1));

        // Swap elements at indices 'i' and 'j'
        // This is a concise way to swap using array destructuring
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

function initializePieceSequence() {
    curPieceSequence = [...chosenPieceSequence];
    shuffleArray(curPieceSequence);
    curPieceSequenceIdx = 0;
}

function getNextPieceIndex() {
    let t = curPieceSequence[curPieceSequenceIdx];

    curPieceSequenceIdx++;
    if (curPieceSequenceIdx >= curPieceSequence.length - 5) {
        let curPieceSequenceNew = [...chosenPieceSequence];
        shuffleArray(curPieceSequenceNew);
        curPieceSequence.push(...curPieceSequenceNew);
    }

    return t;
}

function calculateCurPieceXY_hardSet(curPieceX, curPieceY, curPieceMap) {
    curPieceX_hardSet = curPieceX;
    curPieceY_hardSet = curPieceY;
    while (!isCollision(gridState, curPieceX_hardSet, curPieceY_hardSet + 1, curPieceMap)) {
        curPieceY_hardSet++;
    }
}

function genRandCurPiece() {
//     nextPieceIndex = Math.floor(Math.random() * 7);
    const nextPieceIndex = getNextPieceIndex();
    setCurPiece(nextPieceIndex);
}

function setCurPiece(nextPieceIndex) {
    curPieceIndex = nextPieceIndex;
    curPieceMap = JSON.parse(JSON.stringify(pieceMap[curPieceIndex]));
    if (curPieceIndex === 5) {
        curPieceX = 1;
        curPieceY = -3;
    } else if (curPieceIndex === 6) {
        curPieceX = 3;
        curPieceY = -3;
    } else {
        curPieceX = 3;
        curPieceY = -2;
    }

    calculateCurPieceXY_hardSet(curPieceX, curPieceY, curPieceMap);
}

function isCollision(gridState, curPieceX, curPieceY, curPieceMap) {
    let xSize = curPieceMap.length;
    let ySize = curPieceMap[0].length;

    for (let i = 0; i < xSize; i++) {
        for (let j = 0; j < ySize; j++) {

            let x = curPieceX + i;
            let y = curPieceY + j;

            if (curPieceMap[i][j] !== 0) {
                if (y > 19 || x < 0 || x > 9) {
                    return true;
                } else {
                    if (y < 0) {
                        // do nothing
                    } else if (gridState[y][x] !== 0) {
                        return true;
                    }
                }
            }
        }
    }
    return false;
}

function transposeMatrix(matrix) {
    const n = matrix.length;
    const transposed = Array.from({ length: n }, () => Array(n).fill(0));

    for (let i = 0; i < n; i++) {
        for (let j = 0; j < n; j++) {
            transposed[j][i] = matrix[i][j];
        }
    }
    return transposed;
}

function reverseRows(matrix) {
    for (let i = 0; i < matrix.length; i++) {
        matrix[i].reverse();
    }
    return matrix;
}

function rotateMatrixCounterClockwise(matrix) {
    const transposedMatrix = transposeMatrix(matrix);
    return reverseRows(transposedMatrix);
}

function rotateMatrixClockwise(matrix) {
    const n = matrix.length;

    // Create a new matrix to store the rotated result
    const rotatedMatrix = Array(n).fill(null).map(() => Array(n).fill(null));

    for (let row = 0; row < n; row++) {
        for (let col = 0; col < n; col++) {
            // New position for counter-clockwise rotation: (n - 1 - col, row)
            rotatedMatrix[n - 1 - col][row] = matrix[row][col];
        }
    }

    return rotatedMatrix;
}

function canRotateCounterClockwise(gridState, curPieceX, curPieceY, curPieceMap) {
    let curPieceMapNew = rotateMatrixCounterClockwise(curPieceMap);
    if (curPieceIndex === 0) {
        return false;
    } else {
        return !isCollision(gridState, curPieceX, curPieceY, curPieceMapNew);
    }
}

function canRotateClockwise(gridState, curPieceX, curPieceY, curPieceMap) {
    let curPieceMapNew = rotateMatrixClockwise(curPieceMap);
    if (curPieceIndex === 0) {
        return false;
    } else {
        return !isCollision(gridState, curPieceX, curPieceY, curPieceMapNew);
    }
}

function hardSet() {
    while (!isCollision(gridState, curPieceX, curPieceY + 1, curPieceMap)) {
        curPieceY++;
    }
}

function startGame() {
    canHold = true;
    gridState = Array.from({ length: 20 }, () => new Array(10).fill(0));
    curLevel = 0;
    curScore = 0;
    renderScore();
    gameOver = false;
    gameEngineStepCounter_Start(stepCounter);
    initializePieceSequence();
    genRandCurPiece();
    rerender();
}

function renderGameOver() {
    ctx.font = "40px 'Comic Sans MS'";
    ctx.fillStyle = "white";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    const text = "GAME OVER\nClick to Play Again";
    const lines = text.split('\n'); // Split the text by newline character
    const x = width / 2; // X-coordinate for text
    let y = height / 2 - 60; // Initial Y-coordinate for the first line
    const lineHeight = 60; // Spacing between lines

    for (let i = 0; i < lines.length; i++) {
        ctx.fillText(lines[i], x, y + (i * lineHeight));
    }
}

function renderInitial() {
    ctx.font = "40px 'Comic Sans MS'";
    ctx.fillStyle = "white";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    ctx.fillText("Click HERE to Play", width / 2, height / 2);
}

function App() {

    const canvasRef = useRef(null);
    const canvasRefHold = useRef(null);
    const canvasRefNext = useRef(null);
    const canvasRefNext2 = useRef(null);
    const scoreRef = useRef(null);

    useEffect(() => {
        scoreHtml = scoreRef.current;

        const canvasHold = canvasRefHold.current;
        widthHold = canvasHold.width;
        heightHold = canvasHold.height;
        ctxHold = canvasHold.getContext('2d');

        const canvasNext = canvasRefNext.current;
        widthNext = canvasNext.width;
        heightNext = canvasNext.height;
        ctxNext = canvasNext.getContext('2d');

        const canvasNext2 = canvasRefNext2.current;
        widthNext2 = canvasNext2.width;
        heightNext2 = canvasNext2.height;
        ctxNext2 = canvasNext2.getContext('2d');

        const canvas = canvasRef.current;
        width = canvas.width;
        height = canvas.height;
        ctx = canvas.getContext('2d');

        canvas.addEventListener('click', function(event) {
            audio_koro.play();
            startGame();
        });

        renderBackgroundAll();
        renderInitial();
    }, []);

    return (
        <>
            <div className="flex-container-outer">
                <div className="flex-container-score">
                    <div className="score">SCORE</div>
                    <div className="score-value" ref={scoreRef}>0</div>
                </div>
                <div className="flex-container">
                    <div className="canvas-border">
                        <div className="text">
                            HOLD
                        </div>
                        <div>
                            <canvas className="canvas" width="170" height="170" ref={canvasRefHold} />
                        </div>
                        <div className="canvas-border-split"></div>
                        <div className="text-instructions">
                            <div>c - hold</div>
                            <div>space - drop</div>
                            <div>↑ - rotate</div>
                            <div>← - left</div>
                            <div>→ - right</div>
                            <div>↓ - down</div>
                            <div className="canvas-border-split"></div>
                            <div className="text-instructions-small">OMOLORD I NEED TO STOP</div>
                            <div className="text-instructions-small"><a href="https://www.marcuschiu.com/tinkering/2025-08-07/">How I Coded This</a></div>
                        </div>
                    </div>
                    <div className="canvas-border">
                        <div>
                            <canvas className="canvas" width="404" height="804" ref={canvasRef} />
                        </div>
                    </div>
                    <div className="canvas-border">
                        <div className="text">
                            NEXT
                        </div>
                        <div>
                            <canvas className="canvas" width="170" height="170" ref={canvasRefNext} />
                        </div>
                        <div className="canvas-border-split"></div>
                        <div>
                            <canvas className="canvas" width="170" height="400" ref={canvasRefNext2} />
                        </div>
                    </div>
                </div>
            </div>
            <GlobalKeyListener keydownEC={keydownEC} keyupEC={keyupEC} />
        </>
    );
}

export default App

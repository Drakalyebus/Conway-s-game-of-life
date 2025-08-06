import Life from "./modules/life.js";
import { rules } from "./rules.js";

const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const start = document.getElementById("start");
const stop = document.getElementById("stop");
const random = document.getElementById("random");
const clear = document.getElementById("clear");

const gridWidth = 100;
const gridHeight = 100;
const cellSize = 10;

let started = false;

canvas.width = gridWidth * cellSize;
canvas.height = gridHeight * cellSize;

const life = new Life(gridWidth, gridHeight, rules);

start.addEventListener("click", () => started = true);
stop.addEventListener("click", () => started = false);
const types = life.types();
let selectedType = 0;
canvas.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    selectedType = (selectedType + 1) % types.length;
});
random.addEventListener("click", () => {
    life.randomize(types);
});
clear.addEventListener("click", () => life.clear());

function renderGrid(x, y = x, width = canvas.width / x, height = canvas.height / y) {
    for (let i = 0; i < x; i++) {
        for (let j = 0; j < y; j++) {
            ctx.strokeStyle = "grey";
            ctx.strokeRect(i * width, j * height, width, height);
        }
    }
}

function gridClickPosition(e) {
    const x = Math.floor(e.offsetX / cellSize);
    const y = Math.floor(e.offsetY / cellSize);
    return { x, y };
}

function lifeRender() {
    life.field.forEach((value, y, x) => {
        // ctx.fillStyle = `hsl(${types.indexOf(value) / types.length * 360}, 100%, 50%)`;
        ctx.fillStyle = `hsl(0, 0%, ${(types.length - 1 - types.indexOf(value)) / (types.length - 1) * 100}%)`;
        ctx.fillRect(x * cellSize + 1, y * cellSize + 1, cellSize - 2, cellSize - 2);
    });
}

let mousedown = false;

const draw = () => {
    if (started && !mousedown) life.step();
    lifeRender();
    canvas.onmousedown = (e) => {
        mousedown = true;
        life.field.set(gridClickPosition(e).y, gridClickPosition(e).x, types[selectedType]);
    }
    canvas.onmouseup = (e) => {
        mousedown = false;
    }
    canvas.onmouseleave = (e) => {
        mousedown = false;
    }
    canvas.onmousemove = (e) => {
        if (mousedown) {
            life.field.set(gridClickPosition(e).y, gridClickPosition(e).x, types[selectedType]);
        }
    }
    setTimeout(draw, 1);
}

renderGrid(gridWidth, gridHeight, cellSize, cellSize);

draw();
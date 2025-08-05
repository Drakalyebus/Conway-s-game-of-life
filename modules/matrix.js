function calcBoundary(row, column, rows, columns, boundary = 'wrap') {
    let calculatedRow = row;
    let calculatedColumn = column;
    const mod = (a, b) => {
        return ((a % b) + b) % b;
    }
    const mirror = (index, length) => {
        const period = length * 2;
        const remainder = mod(index, period);
        return remainder < length ? remainder : period - remainder - 1;
    }
    switch (boundary) {
        case 'wrap':
            calculatedRow = mod(row, rows);
            calculatedColumn = mod(column, columns);
            break;
        case 'mirror':
            calculatedRow = mirror(row, rows);
            calculatedColumn = mirror(column, columns);
            break;
        default:
            break;
    }
    return {
        row: calculatedRow,
        column: calculatedColumn
    };
}

class Matrix {
    constructor(rows, columns, filler = 0) {
        this.rows = rows;
        this.columns = columns;
        this.filler = filler
        this.matrix = new Array(this.rows).fill([]).map(() => new Array(this.columns).fill(this.filler));
    }
    get(row, column, boundary = 'wrap') {
        if (boundary === 'unset' && (row < 0 || column < 0 || row >= this.rows || column >= this.columns)) {
            return this.filler;
        }
        const { row: calculatedRow, column: calculatedColumn } = calcBoundary(row, column, this.rows, this.columns, boundary);
        return this.matrix[calculatedRow][calculatedColumn];
    }
    set(row, column, value = 0, boundary = 'wrap') {
        if (boundary === 'unset' && (row < 0 || column < 0 || row >= this.rows || column >= this.columns)) {
            return;
        }
        const { row: calculatedRow, column: calculatedColumn } = calcBoundary(row, column, this.rows, this.columns, boundary);
        this.matrix[calculatedRow][calculatedColumn] = value;
    }
    forEach(callback) {
        for (let i = 0; i < this.rows; i++) {
            for (let j = 0; j < this.columns; j++) {
                callback(this.matrix[i][j], i, j);
            }
        }
    }
    flat() {
        return this.matrix.flat();
    }
    clone() {
        let newMatrix = new Matrix(this.rows, this.columns);
        for (let i = 0; i < this.rows; i++) {
            for (let j = 0; j < this.columns; j++) {
                newMatrix.matrix[i][j] = this.matrix[i][j];
            }
        }
        return newMatrix;
    }
    has(value) {
        for (let i = 0; i < this.rows; i++) {
            for (let j = 0; j < this.columns; j++) {
                if (this.matrix[i][j] === value) return true;
            }
        }
        return false;
    }
    all(value) {
        for (let i = 0; i < this.rows; i++) {
            for (let j = 0; j < this.columns; j++) {
                if (this.matrix[i][j] !== value) return false;
            }
        }
        return true;
    }
    clear(filler = this.filler) {
        for (let i = 0; i < this.rows; i++) {
            for (let j = 0; j < this.columns; j++) {
                this.matrix[i][j] = filler;
            }
        }
    }
    equal(matrix) {
        if (this.rows !== matrix.rows || this.columns !== matrix.columns) return false;
        for (let i = 0; i < this.rows; i++) {
            for (let j = 0; j < this.columns; j++) {
                if (this.matrix[i][j] !== matrix.matrix[i][j]) return false;
            }
        }
        return true;
    }
    toString(splitter = ' ') {
        let string = ``;
        for (let i = 0; i < this.rows; i++) {
            for (let j = 0; j < this.columns; j++) {
                string += this.matrix[i][j] + splitter;
            }
            string += `\n`;
        }
        return string;
    }
}

export default Matrix;
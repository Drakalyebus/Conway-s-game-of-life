class Matrix {
    constructor(rows, columns, filler = 0) {
        this.rows = rows;
        this.columns = columns;
        this.matrix = new Array(rows).fill([]).map(() => new Array(columns).fill(filler));
    }
    get(row, column) {
        return this.matrix[row][column];
    }
    set(row, column, value = 0) {
        this.matrix[row][column] = value;
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
    clear(filler = 0) {
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
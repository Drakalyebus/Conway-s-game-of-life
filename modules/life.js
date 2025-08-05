import Matrix from "./matrix.js";
import compile from "./mathcompiler.js";

const defRules = {
    "types": [0, 1],
    "kernels": {
        "moore": [
            [1, 1, 1],
            [1, 0, 1],
            [1, 1, 1]
        ]
    },
    "default": {
        "kernel": "moore"
    },
    "behavior": [
        {
            "from": [0],
            "condition": {
                "value": [1],
                "sign": "=",
                "count": 3,
                "kernel": "moore"
            },
            "elseTo": 0,
            "to": 1
        },
        {
            "from": [1],
            "condition": {
                "or": [
                    {
                        "value": [1],
                        "sign": "<",
                        "count": 2,
                        "kernel": "moore"
                    },
                    {
                        "value": [1],
                        "sign": ">",
                        "count": 3,
                        "kernel": "moore"
                    }
                ]
            },
            "elseTo": 1,
            "to": 0
        }
    ]
};

class Life {
    constructor(x, y = x, rules = defRules) {
        this.x = x;
        this.y = y;
        this.rules = rules;
        this.field = new Matrix(this.y, this.x);
    }
    countNeighbors(x, y, value = 0, kernel = [
        [1, 1, 1],
        [1, 0, 1],
        [1, 1, 1]
    ]) {
        let count = 0;
        const kw = Math.ceil((Math.max(...kernel.map(row => row.length)) + 1) / 2) * 2 - 1;
        const kh = Math.ceil((kernel.length + 1) / 2) * 2 - 1;
        const skw = -(kw - 1) / 2;
        const ekw = (kw + 1) / 2;
        const skh = -(kh - 1) / 2;
        const ekh = (kh + 1) / 2;
        const paddedKernel = new Array(kh).fill([]).map((el, y) => new Array(kw).fill(0).map((el, x) => kernel[y]?.[x] ?? 0));
        for (let i = skw; i < ekw; i++) {
            const nx = (x + i + this.x) % this.x;
            for (let j = skh; j < ekh; j++) {
                const ny = (y + j + this.y) % this.y;
                const calculated = compile(paddedKernel[j - skh][i - skw] ?? 0, { x: nx, y: ny, row: j - skh, column: i - skw });
                if (this.field.get(ny, nx) === value) count += calculated;
            }
        }
        return count;
    }
    step() {
        const clone = this.field.clone();
        if (this.rules.behavior === undefined) return;
        this.field.forEach((value, y, x) => {
            for (const rule of this.rules.behavior) {
                const checkTrue = (obj) => {
                    if (obj.and !== undefined) {
                        return obj.and.every(checkTrue);
                    } else if (obj.or !== undefined) {
                        return obj.or.some(checkTrue);
                    } else {
                        return obj.value.some((formula) => {
                            const value = compile(formula, { x, y });
                            const selector = obj.kernel ?? this.rules.default?.kernel;
                            const count = this.countNeighbors(x, y, value, this.rules.kernels === undefined ? [
                                [1, 1, 1],
                                [1, 0, 1],
                                [1, 1, 1]
                            ] : ((typeof selector !== "string") ? [
                                [1, 1, 1],
                                [1, 0, 1],
                                [1, 1, 1]
                            ] : this.rules.kernels[selector]));
                            const requiredCount = compile(obj.count, { x, y });
                            switch (obj.sign ?? "=") {
                                case "=":
                                    return count === requiredCount;
                                case ">":
                                    return count > requiredCount;
                                case "<":
                                    return count < requiredCount;
                                case "!=":
                                    return count !== requiredCount;
                                case ">=":
                                    return count >= requiredCount;
                                case "<=":
                                    return count <= requiredCount;
                                default:
                                    return count === requiredCount;
                            }
                        });
                    }
                }
                const unset = rule.condition === undefined;
                let check = false;
                if (!unset) {
                    check = checkTrue(rule.condition);
                }
                if (check && rule.from.some(type => compile(type, { x, y }) === value)) {
                    clone.set(y, x, rule.to);
                    break;
                } else if (!check && rule.from.some(type => compile(type, { x, y }) === value)) {
                    clone.set(y, x, rule.elseTo ?? value);
                    break;
                }
            }
        });
        this.field = clone;
    }
    steps(steps = 1) {
        for (let i = 0; i < steps; i++) this.step();
    }
    clone() {
        const clone = new Life(this.x, this.y, this.rules);
        clone.field = this.field.clone();
        return clone;
    }
    toString(splitter = ' ') {
        return this.field.toString(splitter);
    }
    randomize(types = this.types()) {
        this.field.forEach((value, y, x) => this.field.set(y, x, types[Math.floor(Math.random() * types.length)]));
    }
    clear(filler = 0) {
        this.field.clear(filler);
    }
    types() {
        const types = [...(this.rules.types ?? []).map((type) => compile(type))];
        if (this.rules.behavior === undefined) return types;
        this.rules.behavior.forEach(rule => {
            rule.from.forEach(type => {
                const calculated = compile(type, { x: 0, y: 0 });
                if (!types.includes(calculated)) types.push(calculated);
            });
            const calculatedTo = compile(rule.to, { x: 0, y: 0 });
            if (!types.includes(calculatedTo)) types.push(calculatedTo);
            const calculatedElseTo = compile(rule.elseTo ?? rule.from[0], { x: 0, y: 0 });
            if (calculatedElseTo !== undefined && !types.includes(calculatedElseTo)) types.push(calculatedElseTo);
            const check = (obj) => {
                if (obj.and !== undefined) {
                    obj.and.forEach(check);
                } else if (obj.or !== undefined) {
                    obj.or.forEach(check);
                } else {
                    obj.value.forEach(type => {
                        const calculated = compile(type, { x: 0, y: 0 });
                        if (!types.includes(calculated)) types.push(calculated);
                    });
                }
            }
            if (rule.condition !== undefined) {
                check(rule.condition);
            }
        });
        this.field.forEach((value, y, x) => {
            const calculated = compile(value, { x, y });
            if (!types.includes(calculated)) types.push(calculated);
        });
        return types;
    }
}

export default Life;
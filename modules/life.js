import Matrix from "./matrix.js";
import compile from "./mathcompiler.js";

const defRules = {
    "types": [0, 1],
    "background": 0,
    "kernels": {
        "moore": [
            [1, 1, 1],
            [1, 0, 1],
            [1, 1, 1]
        ]
    },
    "default": {
        "kernel": "moore",
        "boundary": "wrap"
    },
    "behavior": [
        {
            "priority": 0,
            "order": [0],
            "from": [0],
            "condition": {
                "value": [1],
                "sign": "=",
                "count": [3],
                "kernel": "moore",
                "boundary": "wrap"
            },
            "elseTo": 0,
            "to": 1
        },
        {
            "priority": 0,
            "order": [0],
            "from": [1],
            "condition": {
                "or": [
                    {
                        "value": [1],
                        "sign": "<",
                        "count": [2],
                        "kernel": "moore",
                        "boundary": "wrap"
                    },
                    {
                        "value": [1],
                        "sign": ">",
                        "count": [3],
                        "kernel": "moore",
                        "boundary": "wrap"
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
        this.rules.behavior.sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0));
        this.defined = [];
        const globalRandom = Math.random();
        const background = compile(this.rules.background ?? 0, { globalRandom });
        this.field = new Matrix(this.y, this.x, background);
    }
    countNeighbors(x, y, value = 0, kernel = [
        [1, 1, 1],
        [1, 0, 1],
        [1, 1, 1]
    ], globalRandom = Math.random(), boundary = this.rules.default?.boundary ?? 'wrap') {
        let count = 0;
        const kw = Math.ceil((Math.max(...kernel.map(row => row.length)) + 1) / 2) * 2 - 1;
        const kh = Math.ceil((kernel.length + 1) / 2) * 2 - 1;
        const skw = -(kw - 1) / 2;
        const ekw = (kw + 1) / 2;
        const skh = -(kh - 1) / 2;
        const ekh = (kh + 1) / 2;
        const paddedKernel = new Array(kh).fill([]).map((el, y) => new Array(kw).fill(0).map((el, x) => kernel[y]?.[x] ?? 0));
        for (let i = skw; i < ekw; i++) {
            const nx = x + i;
            for (let j = skh; j < ekh; j++) {
                const ny = y + j;
                const calculated = compile(paddedKernel[j - skh][i - skw] ?? 0, { x: nx, y: ny, row: j - skh, column: i - skw, globalRandom });
                if (this.field.get(ny, nx, boundary) === value) count += calculated;
            }
        }
        return count;
    }
    step() {
        if (this.rules.behavior === undefined) return;
        const globalRandom = Math.random();
        const orders = [];
        this.rules.behavior.forEach(rule => {
            (rule.order ?? [0])?.forEach(order => {
                const calculatedOrder = compile(order, { globalRandom });
                if (!orders.includes(calculatedOrder)) orders.push(calculatedOrder);
            });
        });
        orders.sort((a, b) => a - b);
        orders.forEach((order) => {
            const rules = this.rules.behavior.filter(rule => {
                return (rule.order ?? [0])?.some(orderInRule => {
                    const calculatedOrder = compile(orderInRule, { globalRandom });
                    return calculatedOrder === order;
                });
            });
            const clone = this.field.clone();
            this.field.forEach((value, y, x) => {
                for (const rule of rules) {
                    const checkTrue = (obj) => {
                        if (obj.and !== undefined) {
                            return obj.and.every(checkTrue);
                        } else if (obj.or !== undefined) {
                            return obj.or.some(checkTrue);
                        } else if (obj.not !== undefined) {
                            return !checkTrue(obj.not)
                        } else if (obj.expression !== undefined) {
                            const result = compile(obj.expression, { x, y, globalRandom });
                            const requiredSign = obj.sign ?? "=";
                            const requiredValue = (obj.value ?? [1]).map(formula => compile(formula, { x, y, globalRandom }));
                            switch (requiredSign) {
                                case "=":
                                    return requiredValue.some(value => result === value);
                                case ">":
                                    return requiredValue.some(value => result > value);
                                case "<":
                                    return requiredValue.some(value => result < value);
                                case "!=":
                                    return requiredValue.some(value => result !== value);
                                case ">=":
                                    return requiredValue.some(value => result >= value);
                                case "<=":
                                    return requiredValue.some(value => result <= value);
                                default:
                                    return requiredValue.some(value => result === value);
                            }
                        } else {
                            return obj.value.some((formula) => {
                                const value = compile(formula, { x, y, globalRandom });
                                const selector = obj.kernel ?? this.rules.default?.kernel;
                                const count = this.countNeighbors(x, y, value, this.rules.kernels === undefined ? [
                                    [1, 1, 1],
                                    [1, 0, 1],
                                    [1, 1, 1]
                                ] : ((typeof selector !== "string") ? [
                                    [1, 1, 1],
                                    [1, 0, 1],
                                    [1, 1, 1]
                                ] : this.rules.kernels[selector]), globalRandom, (obj.boundary ?? this.rules.default?.boundary) ?? 'wrap');
                                const requiredCount = obj.count.map(formula => compile(formula, { x, y, globalRandom }));
                                switch (obj.sign ?? "=") {
                                    case "=":
                                        return requiredCount.some(count2 => count === count2);
                                    case ">":
                                        return requiredCount.some(count2 => count > count2);
                                    case "<":
                                        return requiredCount.some(count2 => count < count2);
                                    case "!=":
                                        return requiredCount.some(count2 => count !== count2);
                                    case ">=":
                                        return requiredCount.some(count2 => count >= count2);
                                    case "<=":
                                        return requiredCount.some(count2 => count <= count2);
                                    default:
                                        return requiredCount.some(count2 => count === count2);
                                }
                            });
                        }
                    }
                    const unset = rule.condition === undefined;
                    let check = true;
                    if (!unset) {
                        check = checkTrue(rule.condition);
                    }
                    if (check && rule.from.some(type => compile(type, { x, y, globalRandom }) === value)) {
                        clone.set(y, x, rule.to);
                        break;
                    } else if (!check && rule.from.some(type => compile(type, { x, y, globalRandom }) === value)) {
                        if (rule.elseTo !== undefined) {
                            clone.set(y, x, rule.elseTo);
                        }
                        break;
                    }
                }
            });
            this.field = clone;
        });
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
    randomize(types = this.defined) {
        this.field.forEach((value, y, x) => this.field.set(y, x, types[Math.floor(Math.random() * types.length)]));
    }
    clear(filler = 0) {
        this.field.clear(filler);
    }
    types() {
        const globalRandom = Math.random();
        const types = [...(this.rules.types ?? []).map((type) => compile(type, { globalRandom }))];
        this.defined.forEach(type => {
            if (!types.includes(type)) {
                types.push(type);
            }
        });
        if (!types.includes(this.rules.background ?? 0)) {
            types.push(this.rules.background ?? 0);
        }
        if (this.rules.behavior === undefined) return types;
        this.rules.behavior.forEach(rule => {
            rule.from.forEach(type => {
                const calculated = compile(type, { x: 0, y: 0, globalRandom });
                if (!types.includes(calculated)) types.push(calculated);
            });
            const calculatedTo = compile(rule.to, { x: 0, y: 0, globalRandom });
            if (!types.includes(calculatedTo)) types.push(calculatedTo);
            const calculatedElseTo = compile(rule.elseTo ?? rule.from[0], { x: 0, y: 0, globalRandom });
            if (calculatedElseTo !== undefined && !types.includes(calculatedElseTo)) types.push(calculatedElseTo);
            const check = (obj) => {
                if (obj.and !== undefined) {
                    obj.and.forEach(check);
                } else if (obj.or !== undefined) {
                    obj.or.forEach(check);
                } else if (obj.not !== undefined) {
                    check(obj.not);
                } else if (obj.expression === undefined) {
                    obj.value.forEach(type => {
                        const calculated = compile(type, { x: 0, y: 0, globalRandom });
                        if (!types.includes(calculated)) types.push(calculated);
                    });
                }
            }
            if (rule.condition !== undefined) {
                check(rule.condition);
            }
        });
        this.field.forEach((value, y, x) => {
            const calculated = compile(value, { x, y, globalRandom });
            if (!types.includes(calculated)) types.push(calculated);
        });
        types.sort((a, b) => a - b);
        this.defined = types;
        return types;
    }
}

export default Life;
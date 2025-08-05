function tokenize(formula, variables = {}) {
    const keys = Object.keys(variables);
    const regex = /[a-z]+|[-+*/^()?:!&|<>=,]|(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][-+]?\d+)?/gi;
    // const regex = new RegExp(
    //     `(?:^|[^a-zA-Z])(?:${keys.join('|')})(?=$|[^a-zA-Z])|[-+*%/^(),]|[-+]?\d*\.?\d+(?:[eE][-+]?\d+)?|[a-zA-Z]+`,
    //     'g'
    // );
    return formula.toString().match(regex) || [];
}

function build(formula, variables = {}) {
    const tokens = tokenize(formula, variables);
    const operators = ['+', '-', '*', '/', '^', '(', ')', ',', ':', '?', '!', '&', '|', '<', '>', '='];
    const functions = {
        ln: 'Math.log',
        log: '(x, y = 10) => Math.log(x) / Math.log(y)',
        sin: 'Math.sin',
        cos: 'Math.cos',
        tan: 'Math.tan',
        asin: 'Math.asin',
        acos: 'Math.acos',
        atan: 'Math.atan',
        csc: '(x) => 1 / Math.sin(x)',
        sec: '(x) => 1 / Math.cos(x)',
        cot: '(x) => 1 / Math.tan(x)',
        acsc: '(x) => Math.asin(1 / x)',
        asec: '(x) => Math.acos(1 / x)',
        acot: '(x) => Math.atan(1 / x)',
        sinh: 'Math.sinh',
        cosh: 'Math.cosh',
        tanh: 'Math.tanh',
        asinh: 'Math.asinh',
        acosh: 'Math.acosh',
        atanh: 'Math.atanh',
        csch: '(x) => 1 / Math.sinh(x)',
        sech: '(x) => 1 / Math.cosh(x)',
        coth: '(x) => 1 / Math.tanh(x)',
        acsch: '(x) => Math.asinh(1 / x)',
        asech: '(x) => Math.acosh(1 / x)',
        acoth: '(x) => Math.atanh(1 / x)',
        abs: 'Math.abs',
        floor: 'Math.floor',
        ceil: 'Math.ceil',
        pi: 'Math.PI',
        e: 'Math.E',
        tau: '2 * Math.PI',
        basel: 'Math.PI ** 2 / 6',
        phi: '(1 + Math.sqrt(5)) / 2',
        max: 'Math.max',
        min: 'Math.min',
        mod: '(x, y) => x % y',
        round: 'Math.round',
        sqrt: 'Math.sqrt',
        cbrt: 'Math.cbrt',
        sign: 'Math.sign',
        exp: 'Math.exp',
        pow: 'Math.pow',
        sigmoid: '(x) => 1 / (1 + Math.exp(-x))',
        logit: '(x) => Math.log(x / (1 - x))',
        factorial: `(x) => {
            let n = 1;
            for (let i = 0; i < x; i++) {
                n *= i + 1;
            }
            return n;
        }`,
        random: '(min = 0, max = 1) => Math.random() * (max - min) + min',
        epsilon: 'Number.EPSILON',
        infinity: 'Number.POSITIVE_INFINITY',
        nan: 'Number.NaN',
        maxSafeInteger: 'Number.MAX_SAFE_INTEGER',
        minSafeInteger: 'Number.MIN_SAFE_INTEGER',
        maxSafeFloat: 'Number.MAX_VALUE',
        minSafeFloat: 'Number.MIN_VALUE'
    };
    const combinations = [') (', 'n f', ') n', ') f', 'n (', 'v v', 'v n', 'n v', 'v (', ') v'].map(el => el.split(' '));
    const isFunction = token => {
        if (token === undefined) return false;
        return functions[token] !== undefined;
    }
    const isNumber = token => {
        if (token === undefined) return false;
        return !isNaN(+token);
    }
    const isOperator = token => operators.includes(token);
    const isVariable = token => typeof variables[token] === 'number';
    const isSomething = token => isFunction(token) || isNumber(token) || isOperator(token) || isVariable(token);
    for (let i = 0; i < tokens.length; i++) {
        const token = tokens[i];
        const space = [token, tokens[i + 1]];
        if (combinations.some(comb => comb.every((combToken, combIndex) => {
            switch (combToken) {
                case 'n':
                    return isNumber(space[combIndex]);
                case 'f':
                    return isFunction(space[combIndex]);
                case 'v':
                    return isVariable(space[combIndex]);
                default:
                    return combToken === space[combIndex];
            }
        }))) {
            tokens.splice(i + 1, 0, '*');
            i++;
        }
        if (!isSomething(token)) {
            tokens[i] = 'NaN';
        }
        switch (token) {
            case '^':
                tokens[i] = '**';
                break;
            case '&':
                tokens[i] = '&&';
                break;
            case '|':
                tokens[i] = '||';
                break;
            case '=':
                tokens[i] = '===';
                break;
            default:
                break;
        }
        if (isFunction(token)) {
            tokens[i] = `(${functions[token]})`;
        }
    }
    const code = tokens.join('');
    return code;
}

function compile(formula, variables = {}) {
    if (!isNaN(+formula)) return +formula;
    const code = build(formula, variables);
    let result = NaN;
    try {
        result = new Function(...Object.keys(variables), `return (${code});`)(...Object.values(variables));
    } catch {
        result = NaN;
    }
    if (isNaN(+result)) {
        result = NaN;
    } else {
        result = +result;
    }
    return result;
}

export default compile;
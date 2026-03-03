/**
 * Advanced Calculator Logic
 * Includes functionality for arithmetic operations, history management,
 * theme toggling, and keyboard support.
 */

class Calculator {
    constructor(previousExpElement, currentDisplayElement) {
        this.previousExpElement = previousExpElement;
        this.currentDisplayElement = currentDisplayElement;
        this.history = JSON.parse(localStorage.getItem('calc-history')) || [];
        this.expression = '';
        this.displayExpression = '';
        this.shouldResetScreen = false;
        this.updateHistoryUI();
    }

    clear() {
        this.expression = '';
        this.displayExpression = '';
        this.shouldResetScreen = false;
    }

    delete() {
        if (this.shouldResetScreen) {
            this.clear();
            return;
        }

        const input = this.currentDisplayElement;
        const start = input.selectionStart;
        const end = input.selectionEnd;

        if (start === end) {
            // Standard backspace: delete character before cursor
            if (start === 0) return;
            const left = this.displayExpression.slice(0, start - 1);
            const right = this.displayExpression.slice(start);
            this.displayExpression = left + right;
            this.setCursorPosition(start - 1);
        } else {
            // Delete selection
            const left = this.displayExpression.slice(0, start);
            const right = this.displayExpression.slice(end);
            this.displayExpression = left + right;
            this.setCursorPosition(start);
        }

        if (this.displayExpression === '') this.displayExpression = '0';
    }

    appendValue(value, displayValue = null) {
        if (this.shouldResetScreen) {
            this.displayExpression = '';
            this.shouldResetScreen = false;
        }

        const dVal = (displayValue !== null ? displayValue : value).toString();
        const input = this.currentDisplayElement;
        const start = input.selectionStart;
        const end = input.selectionEnd;

        if (this.displayExpression === '0' && dVal !== '.' && !dVal.includes('(') && dVal !== 'π' && dVal !== 'e') {
            this.displayExpression = dVal;
            this.setCursorPosition(dVal.length);
        } else {
            const left = this.displayExpression.slice(0, start);
            const right = this.displayExpression.slice(end);
            this.displayExpression = left + dVal + right;
            this.setCursorPosition(start + dVal.length);
        }
    }

    setCursorPosition(pos) {
        this.pendingCursorPos = pos;
    }

    calculate() {
        let result;
        try {
            // Pre-process the display expression for evaluation
            let evalExpr = this.displayExpression;

            // Replace display symbols with JS Math equivalents
            evalExpr = evalExpr.replace(/×/g, '*')
                .replace(/÷/g, '/')
                .replace(/−/g, '-')
                .replace(/π/g, 'Math.PI')
                .replace(/e/g, 'Math.E')
                .replace(/sin\(/g, 'Math.sin(Math.PI/180*')
                .replace(/cos\(/g, 'Math.cos(Math.PI/180*')
                .replace(/tan\(/g, 'Math.tan(Math.PI/180*')
                .replace(/log\(/g, 'Math.log10(')
                .replace(/ln\(/g, 'Math.log(')
                .replace(/abs\(/g, 'Math.abs(')
                .replace(/√\(/g, 'Math.sqrt(')
                .replace(/∛\(/g, 'Math.cbrt(')
                .replace(/\^/g, '**');

            // Handle factorials (simple regex for basic cases like 5! -> factorial(5))
            evalExpr = evalExpr.replace(/(\d+)!/g, (match, n) => this.factorial(parseInt(n)));

            // Basic santization and evaluation
            // Using Function constructor as a safer alternative to eval for simple math
            result = new Function(`return ${evalExpr}`)();

            if (isNaN(result) || !isFinite(result)) {
                throw new Error("Invalid Input");
            }

            // Format result (round long decimals)
            result = Math.round(result * 100000000) / 100000000;

            this.addToHistory(this.displayExpression, result);
            this.previousValue = this.displayExpression;
            this.displayExpression = result.toString();
            this.shouldResetScreen = true;
            this.pendingCursorPos = undefined; // Reset cursor position after calculation

        } catch (error) {
            alert('Error: ' + error.message);
            this.clear();
        }
    }

    factorial(n) {
        if (n < 0) return NaN;
        if (n === 0 || n === 1) return 1;
        let res = 1;
        for (let i = 2; i <= n; i++) res *= i;
        return res;
    }

    addToHistory(expression, result) {
        const historyItem = { expression, result };
        this.history.unshift(historyItem);
        if (this.history.length > 20) this.history.pop();
        localStorage.setItem('calc-history', JSON.stringify(this.history));
        this.updateHistoryUI();
    }

    updateHistoryUI() {
        const historyList = document.getElementById('history-list');
        if (!historyList) return;

        if (this.history.length === 0) {
            historyList.innerHTML = '<p class="empty-msg">No history yet</p>';
            return;
        }

        historyList.innerHTML = this.history.map((item, index) => `
            <div class="history-item" onclick="calculator.loadHistoryItem(${index})">
                <div class="history-item-exp">${item.expression} =</div>
                <div class="history-item-res">${item.result}</div>
            </div>
        `).join('');
    }

    loadHistoryItem(index) {
        const item = this.history[index];
        this.displayExpression = item.result;
        this.shouldResetScreen = true;
        this.pendingCursorPos = this.displayExpression.length; // Set cursor at end when loading history
        this.updateDisplay();
        toggleHistory();
    }

    clearHistory() {
        this.history = [];
        localStorage.setItem('calc-history', JSON.stringify(this.history));
        this.updateHistoryUI();
    }

    updateDisplay() {
        const input = this.currentDisplayElement;

        if (this.displayExpression === '') {
            input.value = '0';
        } else {
            input.value = this.displayExpression;
        }

        // Update input field and maintain focus/cursor
        if (this.pendingCursorPos !== undefined) {
            input.setSelectionRange(this.pendingCursorPos, this.pendingCursorPos);
            this.pendingCursorPos = undefined;
        }
        input.focus();

        if (this.shouldResetScreen && this.previousValue) {
            this.previousExpElement.innerText = this.previousValue + ' =';
        } else {
            this.previousExpElement.innerText = '';
        }
    }
}

// DOM Elements
const previousExpElement = document.getElementById('previous-expression');
const currentDisplayElement = document.getElementById('current-display');
const themeToggle = document.getElementById('theme-toggle');
const modeToggle = document.getElementById('mode-toggle');
const scientificBtns = document.getElementById('scientific-btns');
const historyToggle = document.getElementById('history-toggle');
const historyPanel = document.getElementById('history-panel');
const clearHistoryBtn = document.getElementById('clear-history');
const closeHistoryBtn = document.getElementById('close-history');
const copyBtn = document.getElementById('copy-btn');
const toast = document.getElementById('toast');

const calculator = new Calculator(previousExpElement, currentDisplayElement);

// Sync internal state with typed input
currentDisplayElement.addEventListener('input', (e) => {
    calculator.displayExpression = e.target.value;
});

// Event Listeners
document.querySelectorAll('[data-number]').forEach(button => {
    button.addEventListener('click', () => {
        calculator.appendValue(button.dataset.number);
        calculator.updateDisplay();
    });
});

document.querySelectorAll('[data-operator]').forEach(button => {
    button.addEventListener('click', () => {
        const opMap = { '*': '×', '/': '÷', '-': '−', '+': '+', '**': '^' };
        calculator.appendValue(button.dataset.operator, opMap[button.dataset.operator] || button.dataset.operator);
        calculator.updateDisplay();
    });
});

document.querySelectorAll('[data-func]').forEach(button => {
    button.addEventListener('click', () => {
        const func = button.dataset.func;
        const funcMap = {
            'sin': 'sin(', 'cos': 'cos(', 'tan': 'tan(',
            'log': 'log(', 'ln': 'ln(', 'sqrt': '√(', 'cbrt': '∛(',
            'abs': 'abs(', 'fact': '!', 'square': '^2', 'cube': '^3'
        };
        calculator.appendValue(func === 'fact' || func === 'square' || func === 'cube' ? funcMap[func] : funcMap[func], funcMap[func]);
        calculator.updateDisplay();
    });
});

document.querySelectorAll('[data-constant]').forEach(button => {
    button.addEventListener('click', () => {
        const constMap = { 'pi': 'π', 'e': 'e' };
        calculator.appendValue(button.dataset.constant, constMap[button.dataset.constant]);
        calculator.updateDisplay();
    });
});

document.querySelectorAll('[data-action="parenthesis"]').forEach(button => {
    button.addEventListener('click', () => {
        calculator.appendValue(button.dataset.value);
        calculator.updateDisplay();
    });
});

document.querySelector('[data-action="calculate"]').addEventListener('click', () => {
    calculator.calculate();
    calculator.updateDisplay();
});

document.querySelector('[data-action="clear"]').addEventListener('click', () => {
    calculator.clear();
    calculator.updateDisplay();
});

document.querySelector('[data-action="delete"]').addEventListener('click', () => {
    calculator.delete();
    calculator.updateDisplay();
});

// Mode Toggle (Basic vs Scientific)
modeToggle.addEventListener('click', () => {
    scientificBtns.classList.toggle('hidden');
    const isSci = !scientificBtns.classList.contains('hidden');
    modeToggle.querySelector('.mode-text').innerText = isSci ? 'Basic' : 'Sci';
});

// Theme Toggle Logic
themeToggle.addEventListener('click', () => {
    const html = document.documentElement;
    const isDark = html.getAttribute('data-theme') === 'dark';
    const newTheme = isDark ? 'light' : 'dark';
    html.setAttribute('data-theme', newTheme);

    const icon = themeToggle.querySelector('ion-icon');
    icon.name = isDark ? 'sunny-outline' : 'moon-outline';
});

// History Panel Logic
function toggleHistory() {
    historyPanel.classList.toggle('active');
}

historyToggle.addEventListener('click', toggleHistory);
closeHistoryBtn.addEventListener('click', toggleHistory);

clearHistoryBtn.addEventListener('click', () => {
    calculator.clearHistory();
});

// Copy Result Logic
copyBtn.addEventListener('click', () => {
    const text = currentDisplayElement.value;
    navigator.clipboard.writeText(text).then(() => {
        toast.classList.add('show');
        setTimeout(() => toast.classList.remove('show'), 2000);
    });
});

// Keyboard Support
window.addEventListener('keydown', (e) => {
    if (e.key >= 0 && e.key <= 9) calculator.appendNumber(e.key);
    if (e.key === '.') calculator.appendNumber('.');
    if (e.key === '=' || e.key === 'Enter') calculator.calculate();
    if (e.key === 'Backspace') calculator.delete();
    if (e.key === 'Escape') calculator.clear();
    if (e.key === '+') calculator.chooseOperation('+');
    if (e.key === '-') calculator.chooseOperation('-');
    if (e.key === '*') calculator.chooseOperation('*');
    if (e.key === '/') calculator.chooseOperation('/');
    if (e.key === '%') calculator.chooseOperation('%');
    calculator.updateDisplay();
});

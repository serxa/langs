import DICTS from "./clickhouse-dicts.js";

class Card {
    constructor() {
        this.state = 'init';
        this.node = document.getElementById("card");
        this.node.onclick = () => this.onAnswer();
        document.getElementById("btn-y").onclick = () => this.onRight();
        document.getElementById("btn-n").onclick = () => this.onWrong();
    }

    reset(q, a, onDone) {
        this.question = q;
        this.answer = a;
        this.onDone = onDone;
        this.state = 'question';

        this.node.innerText = this.question;
        document.getElementById("answer").style.display = "none";
    }

    onAnswer() {
        if (this.state !== 'question') {
            return;
        }
        this.state = 'answer';
        this.node.innerText = this.answer;
        document.getElementById("answer").style.display = "flex";
    }

    onRight() {
        if (this.state !== 'answer') {
            return;
        }
        this.state = 'done';
        this.onDone(true);
    }

    onWrong() {
        if (this.state !== 'answer') {
            return;
        }
        this.state = 'done';
        this.onDone(false);
    }
}

function shuffled(arr) {
    let res = [];
    for (let e of arr) {
        res.push(e);
    }
    for (let i = 0; i < res.length - 1; i++) {
        let j = i + Math.floor(Math.random() * (res.length - i));
        if (j != i) {
            let tmp = res[i];
            res[i] = res[j]
            res[j] = tmp;
        }
    }
    return res;
}

class Exercise {
    constructor(card, words, question_key, answer_key) {
        this.card = card;
        this.words = words;
        this.deck = shuffled([...Array(this.words.length).keys()])
        this.question_key = question_key;
        this.answer_key = answer_key;
        this.id = -1;
        for (let word of this.words) {
            word.total = 0;
            word.right = 0;
            word.maCorrect = 0.5; // correctness moving average
        };
    }

    getWeight(w) {
        return 1 - w.maCorrect;
    }

    isEligible(id, w) {
        if (id == this.id) {
            return false;
        }
        if (w.maCorrect > 0.90) {
            return false;
        }
        return true;
    }

    select_random() {
        let weights = [];
        let totalWeight = 0;
        for (let i = 0; i < this.words.length; i++) {
            if (!this.isEligible(i, this.words[i])) {
                continue;
            }
            totalWeight += this.getWeight(this.words[i]);
        }
        if (totalWeight == 0) {
            return -1;
        }
        let p = Math.random() * totalWeight;
        let w = 0;
        for (let i = 0; i < this.words.length; i++) {
            if (!this.isEligible(i, this.words[i])) {
                continue;
            }
            w += this.getWeight(this.words[i]);
            if (p < w) {
                return i;
            }
        }
        console.log("Error generating random word id in Exercise.select()");
        return this.words.length - 1;
    }

    select_from_deck() {
        if (this.deck.length > 0) {
            return this.deck.shift();
        } else {
            return -1;
        }
    }

    select() {
        //return this.select_random();
        return this.select_from_deck();
    }

    run() {
        this.id = this.select();
        if (this.id == -1) {
            this.congratulate();
            return;
        }
        this.word = this.words[this.id];
        this.card.reset(this.word[this.question_key], this.word[this.answer_key], (isCorrect) => this.gatherResult(isCorrect));
    }

    congratulate() {
        document.getElementById("card").innerText = "You have learned these words";
        document.getElementById("answer").style.display = "none";
    }

    gatherResult(isCorrect) {
        this.word.total++;
        if (isCorrect) {
            this.word.right++;
        } else {
            this.deck.push(this.id); // add word under the deck to ask again later
        }
        let maCoef = 0.5;
        this.word.maCorrect = maCoef * this.word.maCorrect + (1 - maCoef) * (isCorrect ? 1 : 0);
        this.run();
    }
}

class View {
    constructor(words, columns) {
        this.words = words;
        this.columns = columns;
        this.node = document.getElementById("view");
    }

    run() {
        let html = `<table class="view-table">`;
        for (let word of this.words) {
            html += `<tr>`;
            for (let col of this.columns) {
                html += `<td>${word[col]}</td>`;
            }
            html += `</tr>`;
        }
        html += `</table>`;
        this.node.innerHTML = html;
    }
}

export class DictList {
    constructor() {
        this.card = new Card();
        this.selected = [];
        this.processTextDicts();
        this.processTextWords();
        this.createDictsForTags();
    }

    processTextDicts() {
        for (let dict in DICTS) {
            if (typeof DICTS[dict] === "string") {
                let text = DICTS[dict];
                DICTS[dict] = [text];
            }
        }
    }

    processTextWords() {
        for (let dict in DICTS) {
            for (let i = 0; i < DICTS[dict].length; i++) {
                if (typeof DICTS[dict][i] === "string") {
                    let words = [];
                    for (let line of DICTS[dict][i].split("\n")) {
                        if (line.trim().substring(0, 2) == "//")
                            continue;
                        let tags = [];
                        var tag;
                        var regex = /#([A-Za-z0-9_]+)/g;
                        while (tag = regex.exec(line)) {
                            tags.push(tag[1]);
                        }
                        let line_no_tags = line.replaceAll(/#[a-zA-Z0-9_]*/g, "");
                        let parts = line_no_tags.split(" - ").map(s => s.trim());
                        if (parts.length == 2) {
                            words.push({
                                nl: parts[0],
                                en: parts[1],
                                tag: tags
                            });
                        }
                    }
                    DICTS[dict].splice(i, 1, ...words);
                    i += words.length - 1;
                }
            }
        }
    }

    createDictsForTags() {
        for (let dict in DICTS) {
            for (let word of DICTS[dict]) {
                if ("tag" in word) {
                    let tags = [];
                    if (typeof word.tag === "string") {
                        tags.push(word.tag);
                    } else if (typeof word.tag === typeof []) {
                        for (let tag of word.tag)
                            tags.push(tag);
                    }
                    for (let tag of tags) {
                        let name;
                        if (tag == "v") {
                            name = "Verbos";
                        } else if (tag == "n") {
                            name = "Sustantivos";
                        } else if (tag == "a") {
                            name = "Adjectivos";
                        } else {
                            name = "Tag: " + tag;
                        }
                        if (!(name in DICTS))
                            DICTS[name] = [];
                        DICTS[name].push(word);
                    }
                }
            }
        }
    }

    render() {
        let dicts = document.getElementById("dicts");
        let html = '<p>elegir diccionarios:</p>';
        for (let name in DICTS) {
            html += `<div id="dict-${name}" class="dicts-item">${name}</div>`;
        }
        dicts.innerHTML = html;
        for (let name in DICTS) {
            document.getElementById(`dict-${name}`).onclick = () => this.onToggle(name);
        }
        document.getElementById("btn-en-nl").onclick = () => this.onRun("en", "nl");
        document.getElementById("btn-nl-en").onclick = () => this.onRun("nl", "en");
        document.getElementById("btn-view").onclick = () => this.onView(["nl", "en"]);
    }

    onToggle(name) {
        let node = document.getElementById(`dict-${name}`);
        let idx = this.selected.indexOf(name);
        if (idx == -1) {
            this.selected.push(name);
            node.classList.add("dicts-item-selected");
        } else {
            this.selected.splice(idx, 1);
            node.classList.remove("dicts-item-selected");
        }
    }

    onRun(question_key, answer_key) {
        let words = [];
        for (let name of this.selected) {
            for (let word of DICTS[name]) {
                words.push(word);
            }
        }
        if (words.length > 0) {
            document.getElementById("card").style.display = "";
            document.getElementById("dicts").style.display = "none";
            document.getElementById("dicts-menu").style.display = "none";
            let excecise = new Exercise(this.card, words, question_key, answer_key);
            excecise.run();
        }
    }

    onView(columns) {
        let words = [];
        for (let name of this.selected) {
            for (let word of DICTS[name]) {
                words.push(word);
            }
        }
        if (words.length > 0) {
            document.getElementById("view").style.display = "";
            document.getElementById("dicts").style.display = "none";
            document.getElementById("dicts-menu").style.display = "none";
            let view = new View(words, columns);
            view.run();
        }
    }
}

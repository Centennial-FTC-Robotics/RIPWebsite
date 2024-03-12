const splitBunch = (str) => {
    const names = str.split(/,\s*/);
    for (let i = 0; i < names.length; i++) {
        if (!/".*"/.test(names[i])) throw new Error("no");
        names[i] = names[i].slice(1, -1);
        console.log(names[i]);
    }
    return names;
};

const parseLayout = (str) => {
    let options = [];
    let answers = [];
    str = str.replace(/\s*\\options\[.*\]/, (opt) => {
        opt = opt.slice(opt.indexOf("[") + 1, -1);
        options = splitBunch(opt);
        return "";
    });
    str = str.replace(/\s*\\answers\[.*\]/, (ans) => {
        ans = ans.slice(ans.indexOf("[") + 1, -1);
        answers = splitBunch(ans);
        return "";
    });
    const stream = [];
    let start = 0;
    for (let current = 0; current < str.length; current++) {
        if (str[current] === '$') {
            stream.push({
                type: "plain",
                value: str.slice(start, current)
            });
            stream.push({
                type: "input",
                value: null
            });
            start = current + 1;
        }
        else if (str[current] === '\\') {
            stream.push({
                type: "plain",
                value: str.slice(start, current) + str[current + 1]
            });
            current++;
            start = current + 1;
        }
    }
    if (start !== str.length) stream.push({
        type: "plain",
        value: str.slice(start, str.length)
    })
    return {
        stream,
        options,
        answers
    };
};

let lastDragged = null;
let lastID = -1;

const createBlock = (text, id) => {
    const block = document.createElement("span");
    block.textContent = text;
    block.setAttribute("draggable", "true");
    block.classList.add("block");
    block.addEventListener("dragstart", (e) => {
        lastDragged = e.target;
        lastID = id;
    });
    return block;
};

const createContainer = (child, id) => {
    const container = document.createElement("span");
    container.classList.add("container");
    container.addEventListener("dragover", (e) => {
        if(id === lastID) e.preventDefault();
    });
    container.addEventListener("drop", function(e) {
        e.preventDefault();
        if(id !== lastID) return;
        const parent = lastDragged.parentNode;
        console.log(parent)
        if(!e.target.classList.contains("empty")) {
            // Swap
            const block1 = parent.firstChild;
            const block2 = this.firstChild;
            block1.remove();
            block2.remove();
            parent.appendChild(block2);
            this.appendChild(block1);
            return;
        };
        parent.classList.add("empty");
        parent.innerHTML = "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;";
        lastDragged.remove();
        e.target.textContent = "";
        e.target.appendChild(lastDragged);
        e.target.classList.remove("empty");
    });
    if(child) {
        container.textContent = "";
        container.appendChild(child);
    }
    else {
        container.innerHTML = "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;";
        container.classList.add("empty");
    }
    return container;
};

const constructQuiz = (element, id) => {
    const text = element.textContent;
    element.textContent = "";
    const {options, answers, stream} = parseLayout(text);
    const checks = [];
    for(let i = 0; i < stream.length; i++) {
        const current = stream[i];
        if(current.type === "plain") {
            const span = document.createElement("span");
            span.textContent = current.value;
            element.appendChild(span);
        }
        else if(current.type === "input") {
            const container = createContainer(null, id);
            element.appendChild(container);
            checks.push(container);
        }
    }
    element.appendChild(document.createTextNode("\n"));
    for(let i = 0; i < options.length; i++) {
        const option = options[i];
        element.appendChild(createContainer(createBlock(option, id), id));
        element.appendChild(document.createTextNode(" "));
    }
    const check = document.createElement("button");
    check.textContent = "-Check-";
    check.addEventListener("mouseup", () => {
        let correct = true;
        for(let i = 0; i < answers.length; i++) {
            const expected = answers[i];
            const actual = checks[i].firstChild?.textContent;
            correct &&= (expected === actual);
        }
        console.log(correct);
    });
    element.appendChild(check);
}

document.querySelectorAll(".interactive").forEach((element, id) => {
    constructQuiz(element, id);
});


console.log("e")
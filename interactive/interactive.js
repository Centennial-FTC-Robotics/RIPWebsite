const emptify = (str) => str.replace(/./g, " ");
const rectCenter = (rect) => {
    return [
        0.5 * (rect.right + rect.left),
        0.5 * (rect.bottom + rect.top)
    ];
}
const rectCollide = (rect1, rect2) => {
    let [x, y] = rectCenter(rect1);
    return (
        (rect2.left < x) && (x < rect2.right) &&
        (rect2.top < y) && (y < rect2.bottom)
    );
}

const splitBunch = (str) => {
    const names = str.split(/,\s*/);
    for (let i = 0; i < names.length; i++) {
        if (!/".*"/.test(names[i])) throw new Error("no");
        names[i] = names[i].slice(1, -1);
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
let lastChangedTouches;
let lastMousePos;
let mouseHold = false;
let selected = null;
let selectedID = -1;
const quizContainers = [];

const removeAddons = (obj, forContainer=false) => {
    if(forContainer) {
        obj.classList.remove("missing");
        obj.classList.remove("selected");
        return;
    }
    obj.classList.remove("correct");
    obj.classList.remove("incorrect");
}


/**
 * Swaps the content of two containers OR moves the content from one container to another
 * @param {Element} container1 -First container
 * @param {Element} container2 -Second container
 */
const transferContents = (container1, container2) => {
    removeAddons(container1, true);
    removeAddons(container2, true);
    const empty1 = container1.classList.contains("empty");
    const empty2 = container2.classList.contains("empty");
    if (empty1 && empty2) return;
    if (empty1 && !empty2) {
        [container1, container2] = [container2, container1];
    }
    if (empty1 !== empty2) {
        // Insert contents of c1 to c2
        container1.classList.add("empty");
        container2.classList.remove("empty");
        const child = container1.lastChild;
        child.remove();
        removeAddons(child);
        container2.textContent = emptify(child.textContent);
        container2.appendChild(child);
    }
    else {
        // Swap contents of c1 and c2
        const child1 = container1.lastChild;
        const child2 = container2.lastChild;
        child1.remove();
        child2.remove();
        removeAddons(child1);
        removeAddons(child2);
        container1.textContent = emptify(child2.textContent);
        container2.textContent = emptify(child1.textContent);
        container1.appendChild(child2);
        container2.appendChild(child1);
    }
}

const initTransBlock = (block) => {
    block.parentNode.classList.add("dragging");
};

const translateBlock = (block, x, y) => {
    const oldX = Number(block.style.left.slice(0, -2));
    const oldY = Number(block.style.top.slice(0, -2));
    block.style.left = `${oldX + x}px`;
    block.style.top = `${oldY + y}px`;
};

const snapBlock = (block, id, cancel=false) => {
    const rect = block.getBoundingClientRect();
    block.parentNode.classList.remove("dragging");
    block.style.left = "0px";
    block.style.top = "0px";
    if(cancel) return;
    for (let i = 0; i < quizContainers[id].length; i++) {
        const container = quizContainers[id][i];
        const ctnRect = container.getBoundingClientRect();
        if(rectCollide(rect, ctnRect)) {
            transferContents(block.parentNode, container);
            return;
        }
    }
};

const createBlock = (text, id) => {
    const block = document.createElement("span");
    block.style.left = "0px";
    block.style.top = "0px";
    block.textContent = text;
    block.classList.add("block");
    block.addEventListener("touchstart", (e) => {
        lastDragged = e.target;
        initTransBlock(lastDragged);
        lastChangedTouches = e.touches;
    });
    document.addEventListener("touchmove", (e) => {
        if(lastDragged !== null) e.preventDefault();
        const shiftX = e.changedTouches.item(0).clientX - lastChangedTouches.item(0).clientX;
        const shiftY = e.changedTouches.item(0).clientY - lastChangedTouches.item(0).clientY;
        translateBlock(lastDragged, shiftX, shiftY);
        lastChangedTouches = e.changedTouches;

        if (Math.random() < 0.001) {
            let ee = false;
            while (!ee) {
                ee = confirm("Tu eres un mono");
                if (!ee) alert("NO! TU ERES UN MONO");
                else break;
            }
        }
    }, {passive: false});
    document.addEventListener("touchcancel", (e) => {
        if(!lastDragged) return;
        snapBlock(lastDragged, id, true);
        lastDragged = null;
    }, {passive: false});
    document.addEventListener("touchend", (e) => {     
        if(!lastDragged) return;   
        snapBlock(lastDragged, id);
        lastDragged = null;
    }, {passive: false});
    block.addEventListener("mousedown", (e) => {
        e.preventDefault();
        initTransBlock(e.target);
        lastMousePos = {x: e.clientX, y: e.clientY};
        lastDragged = e.target;
        lastID = id;
        mouseHold = true;
    });
    document.addEventListener("mousemove", (e) => {
        if(!mouseHold) return;
        const shiftX = e.clientX - lastMousePos.x;
        const shiftY = e.clientY - lastMousePos.y;
        translateBlock(lastDragged, shiftX, shiftY);
        lastMousePos = {x: e.clientX, y: e.clientY};
    });
    document.addEventListener("mouseup", (e) => {
        if(!lastDragged) return;
        snapBlock(lastDragged, lastID);
        mouseHold = false;
        lastDragged = null;
        lastID = -1;
    });
    return block;
};

const createContainer = (child, id) => {
    const container = document.createElement("span");
    container.tabIndex = "0";
    container.classList.add("container");
    container.addEventListener("keydown", (e) => {
        if(e.key === "Enter") {
            if(!selected) {
                console.log("eoa");
                selected = container;
                selectedID = id;
                container.classList.add("selected");
            }
            else {
                if(id !== selectedID) return;
                transferContents(selected, e.target);
                selected = null;
            }
        }
        else if(e.key === "Escape") {
            selected.classList.remove("selected");
            selected = null;
        }
    });
    if (child) {
        container.textContent = emptify(child.textContent);
        container.appendChild(child);
    }
    else {
        container.innerHTML = "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;";
        container.classList.add("empty");
    }
    return container;
};

const constructQuiz = (element, id) => {
    quizContainers[id] = [];
    const text = element.textContent;
    element.textContent = "";
    const { options, answers, stream } = parseLayout(text);
    const checks = [];
    for (let i = 0; i < stream.length; i++) {
        const current = stream[i];
        if (current.type === "plain") {
            const span = document.createElement("span");
            span.textContent = current.value;
            element.appendChild(span);
        }
        else if (current.type === "input") {
            const container = createContainer(null, id);
            element.appendChild(container);
            checks.push(container);
            quizContainers[id].push(container);
        }
    }
    element.appendChild(document.createTextNode("\n"));
    for (let i = 0; i < options.length; i++) {
        const option = options[i];
        const container = createContainer(createBlock(option, id), id);
        element.appendChild(container);
        element.appendChild(document.createTextNode(" "));
        quizContainers[id].push(container);
    }
    const check = document.createElement("button");
    check.textContent = "-Check-";
    const gradeQuiz = () => {
        let correct = true;
        for (let i = 0; i < answers.length; i++) {
            const expected = answers[i];
            const checked = checks[i].lastChild;
            const actual = checked?.textContent;
            if (expected === actual) checked.classList.add("correct");
            else if (checked.classList) checked.classList.add("incorrect");
            else checked.parentNode.classList.add("missing");
            correct &&= (expected === actual);
        }
        if (correct) alert("All correct! :)");
        else alert("Try again...");
    };
    check.addEventListener("mouseup", (e) => {
        e.stopPropagation();
        gradeQuiz();
    });
    check.addEventListener("keydown", (e) => {
        if (e.key === "Enter") gradeQuiz();
    });
    element.appendChild(check);
}

document.querySelectorAll(".interactive").forEach((element, id) => {
    constructQuiz(element, id);
});


console.log("e")
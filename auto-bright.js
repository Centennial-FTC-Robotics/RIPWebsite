window.onload = () => {
    const change = (mode) => {
        if(mode === "dark") {
            document.querySelector("html").classList.add("dark");
            document.querySelector("html").style["color-scheme"] = "dark";
        }
        else {
            document.querySelector("html").classList.remove("dark");
            document.querySelector("html").style["color-scheme"] = "light";
        }
    }
    const detect = () => {
        if(!window.matchMedia) return "light";
        if(window.matchMedia("(prefers-color-scheme: dark)").matches) return "dark";
        else return "light";
    };
    const map = {"light": "dark", "dark": "light"};

    let mode = localStorage.getItem("mode");
    if(!mode) {
        const detected = detect();
        localStorage.setItem("mode", detected);
        mode = detected;
    }
    change(mode);

    const toggle = document.createElement("input");
    toggle.setAttribute("type", "checkbox");
    toggle.style.position = "fixed";
    toggle.style.bottom = "5px";
    toggle.style.right = "5px";
    toggle.addEventListener("input", () => {
        mode = map[mode];
        localStorage.setItem("mode", mode);
        change(mode);
    });
    if(mode === "dark") toggle.click();
    document.body.appendChild(toggle);
};
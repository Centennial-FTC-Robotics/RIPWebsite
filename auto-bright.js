window.onload = () => {
    const mode = localStorage.getItem("mode");
    if(mode) {
        if(mode === "dark") document.body.classList.add("dark");
    }
    else localStorage.setItem("mode", "light");

}
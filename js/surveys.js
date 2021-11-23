window.onload = async () => {
    if (document.cookie.indexOf("user") === -1) {
        window.location = "./index.html"
    }
}
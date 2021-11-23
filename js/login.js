window.onload = async () =>{
  if(document.cookie.indexOf("user") !== -1){
      window.location = "/surveys.html"
  }
};

document.getElementById("login").addEventListener("submit", async function(e) {
    e.preventDefault();
    let login = e.target.elements.login.value;
    let password = e.target.elements.password.value;
    let div = document.getElementById("errors_log");
    let user = {
        login,
        password
    };
    let response = await fetch("https://back-course-work.herokuapp.com/login", {method: "POST",  headers: {
            'Content-Type': 'application/json;charset=utf-8'
        },
        body: JSON.stringify(user)});
    let result = await response.text();
    switch (result) {
        case "Wrong login":
            div.style.display = "";
            div.textContent = "Пользователя с таким логином не существует";
            break;
        case "Wrong password":
            div.style.display = "";
            div.textContent = "Неправильный пароль";
            break;
        default:
            document.cookie = result;
            window.location = "/";
            break;
    }
});

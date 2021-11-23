document.getElementById("register").addEventListener("submit", async function(e) {
    e.preventDefault();
    let login = e.target.elements.login.value;
    let password = e.target.elements.password.value;
    let password2 = e.target.elements.password2.value;
    let div = document.getElementById("errors_reg");
    let li = document.getElementById("error");
    let errors = false;

    if(password.length < 8 || password.length > 32){
        div.style.display = "";
        li.textContent = "Пароль должен быть от 8 до 32 символов";
        errors = true;
    } else if(password !== password2){
        div.style.display = "";
        li.textContent = "Пароли не совпадают";
        errors = true;
    }

    if(!errors){
        let user = {
            login,
            password
        };
        let response = await fetch("http://localhost:8080/register", {method: "POST",  headers: {
                'Content-Type': 'application/json;charset=utf-8'
            },
            body: JSON.stringify(user)});
        let result = await response.json();
        console.log(result)
        if(result !== ""){
            window.location = "/";
        }else{
            div.style.display = "";
            li.textContent = "Пользователь с таким именем уже существует"
        }

    }
});
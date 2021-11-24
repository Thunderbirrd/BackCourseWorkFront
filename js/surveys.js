window.onload = async () => {
    if (document.cookie.indexOf("User") === -1 || document.cookie.indexOf("Id:") === -1) {
        window.location = "./index.html"
    }

    let loginStart = document.cookie.indexOf("User: ") + 6
    let idStart = document.cookie.indexOf("Id: ") + 4
    let login = document.cookie.substr(loginStart, idStart - 6 - loginStart)
    let id = document.cookie.substr(idStart, document.cookie.indexOf("; csrf") - idStart)
    let user = {login, id}

    let response = await fetch("http://localhost:8080/checkUser", {method: "POST",  headers: {
            'Content-Type': 'application/json;charset=utf-8'
        },
        body: JSON.stringify(user)});

    let result = await response.text()
    if (result !== "User is valid"){
        window.location = "./index.html"
    }else{
        console.log("User is valid")
    }

    response = await fetch("http://localhost:8080/survey/getAllUsersAnswers", {method: "POST",  headers: {
            'Content-Type': 'application/json;charset=utf-8'
        },
        body: JSON.stringify({id})
    });
    let answers = await response.json();
    console.log(answers)
    let answeredSurveys = []
    for (let i = 0; i < answers.length; i++) {
        answeredSurveys.push(answers[i]["surveyId"])
    }
    console.log(answeredSurveys)

    response = await fetch("http://localhost:8080/survey/getAll", {method: "GET",  headers: {
            'Content-Type': 'application/json;charset=utf-8'
        },
        });
    let surveys = await response.json();
    for (let i = 0; i < surveys.length; i++) {
        let survey = surveys[i]
        if(survey["ownerId"] !== id) {
            if (survey["type"] === "one") {
                await createOneAnswerSurvey(survey)
            }else{
                await createFewAnswerSurvey(survey)
            }
        }
    }

    response = await fetch("http://localhost:8080/getRating", {method: "POST",  headers: {
            'Content-Type': 'application/json;charset=utf-8'
        },
        body: JSON.stringify({id})});
    let rating = await response.json()
    let ratingDiv = document.getElementById("rating")
    ratingDiv.textContent = "Ваш рейтинг: " + rating
}

async function createOneAnswerSurvey(survey) {
    let options = await getOptions(survey["id"])
    let d = document.createElement("div")
    d.innerHTML = "<h3>" + survey["description"] + "</h3>"
    d.innerHTML += "<form id='" + "survey" + survey["id"] + "'>"
    for (let i = 0; i < options.length; i++) {
        let id = survey["id"] + "option" + options[i]["id"]
        d.innerHTML += "<input type='radio' id='" + id + "'" + " name='options'" + "> <label for='" + id + "'>" + options[i]["description"] +
            "; Голосов: " + options[i]["votes"] + "</label>" + "<br>"
    }
    d.innerHTML += "<br>"
    d.innerHTML += "<input type='submit' id='vote" + survey["id"] + "' value='Проголосовать'/>"
    d.innerHTML += "</form>"
    let s = document.getElementById("one")
    s.appendChild(d)
    document.getElementById("one").addEventListener('click', function(e) {
        if(e.target && e.target.id.indexOf("vote") !== -1) {
            e.stopImmediatePropagation();
            let num = e.target.id.substr(4)
            let radios = document.querySelectorAll("input[type=radio]:checked")
            for (let i = 0; i < radios.length; i++) {
                if(radios[i].id.substr(0, radios[i].id.indexOf("option")) === num){
                    let idStart = document.cookie.indexOf("Id: ") + 4
                    let id = document.cookie.substr(idStart, document.cookie.indexOf("; csrf") - idStart)
                    vote(num, radios[i].id.substr(radios[i].id.indexOf("n") + 1), id)
                    break
                }
            }
        }
    });
}

async function createFewAnswerSurvey(survey) {
    let options = await getOptions(survey["id"])
    let d = document.createElement("div")
    d.innerHTML = "<h3>" + survey["description"] + "</h3>"
    d.innerHTML += "<form id='" + "survey" + survey["id"] + "'>"
    for (let i = 0; i < options.length; i++) {
        let id = survey["id"] + "check" + options[i]["id"]
        d.innerHTML += "<input type='checkbox' id='" + id + "'" + " name='options'" + "> <label for='" + id + "'>" + options[i]["description"] +
            "; Голосов: " + options[i]["votes"] + "</label>" + "<br>"
    }
    d.innerHTML += "<br>"
    d.innerHTML += "<input type='submit' id='vote" + survey["id"] + "' value='Проголосовать'/>"
    d.innerHTML += "</form>"
    let s = document.getElementById("many")
    s.appendChild(d)
    document.getElementById("many").addEventListener('click', function(e) {
        if(e.target && e.target.id.indexOf("vote") !== -1) {
            e.stopImmediatePropagation();
            let num = e.target.id.substr(4)
            let radios = document.querySelectorAll("input[type=checkbox]:checked")
            for (let i = 0; i < radios.length; i++) {
                if(radios[i].id.substr(0, radios[i].id.indexOf("check")) === num){
                    let idStart = document.cookie.indexOf("Id: ") + 4
                    let id = document.cookie.substr(idStart, document.cookie.indexOf("; csrf") - idStart)
                    vote(num, radios[i].id.substr(radios[i].id.indexOf("k") + 1), id)
                }
            }
        }
    });
}

async function getOptions(survey_id) {
    let response = await fetch("http://localhost:8080/survey/option/getAll", {
        method: "POST", headers: {
            'Content-Type': 'application/json;charset=utf-8'
        },
        body: JSON.stringify({survey_id})
    });
    return await response.json()
}

async function vote(survey_id, option_id, user_id){
    let response = await fetch("http://localhost:8080/survey/vote", {method: "POST",  headers: {
            'Content-Type': 'application/json;charset=utf-8'
        },
        body: JSON.stringify({survey_id, option_id, user_id})
    });
    let result = await response.text();
    console.log(result)
    document.location.reload()
}

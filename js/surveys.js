window.onload = async () => {
    if (document.cookie.indexOf("User") === -1 || document.cookie.indexOf("Id:") === -1) {
        window.location = "./index.html"
    }

    let loginStart = document.cookie.indexOf("User: ") + 6
    let idStart = document.cookie.indexOf("Id: ") + 4
    let login = document.cookie.substr(loginStart, idStart - 6 - loginStart)
    let id = document.cookie.substr(idStart, document.cookie.indexOf("; csrf") - idStart)
    let user = {login, id}

    let response = await fetch("https://back-course-work.herokuapp.com/checkUser", {method: "POST",  headers: {
            'Content-Type': 'application/json;charset=utf-8'
        },
        body: JSON.stringify(user)});

    let result = await response.text()
    if (result !== "User is valid"){
        window.location = "./index.html"
    }else{
        console.log("User is valid")
    }

    await create(id)

    response = await fetch("https://back-course-work.herokuapp.com/getAllUsersAnswers", {method: "POST",  headers: {
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

    response = await fetch("https://back-course-work.herokuapp.com/survey/getAll", {method: "GET",  headers: {
            'Content-Type': 'application/json;charset=utf-8'
        },
        });
    let surveys = await response.json();
    for (let i = 0; i < surveys.length; i++) {
        let survey = surveys[i]
        if(survey["ownerId"].toString() !== id.toString() && answeredSurveys.indexOf(survey["id"]) === -1) {
            if (survey["type"] === "one") {
                await createOneAnswerSurvey(survey)
            }else{
                await createFewAnswerSurvey(survey)
            }
        }else if(survey["ownerId"].toString() === id.toString()){
            await createMySurvey(survey)
        }else{
            let thisAnswers = []
            for (let i = 0; i < answers.length; i++) {
                if (answers[i]["surveyId"] === survey["id"]){
                    thisAnswers.push(answers[i]["optionId"])
                }
            }
            await createAnsweredSurvey(survey, thisAnswers)
        }
    }

    response = await fetch("https://back-course-work.herokuapp.com/getRating", {method: "POST",  headers: {
            'Content-Type': 'application/json;charset=utf-8'
        },
        body: JSON.stringify({id})});
    let rating = await response.json()
    let ratingDiv = document.getElementById("rating")
    ratingDiv.innerText = "Ваш рейтинг: " + rating
}

async function create(id){
    let addBtn = document.getElementById("addOption")
    addBtn.addEventListener('click', async function (){
        let optionsDiv = document.createElement("div")
        optionsDiv.innerHTML = "<input type='text' placeholder='Описание варианта' class='newOption'>"
        let d = document.getElementById("create")
        d.appendChild(optionsDiv)
    })
    document.getElementById("save").addEventListener('click', async function (){
        let desc = document.getElementById("newSurveyDesc").value
        let one = document.getElementById("1")
        let many = document.getElementById("2")
        let options = document.getElementsByClassName("newOption")
        if(one.checked){
            await saveSurvey(id, "one", desc, options)
        }else if (many.checked){
            await saveSurvey(id, "many", desc, options)
        }else{
            let div = document.getElementById("error")
            div.style.display = "";
            div.innerHTML = "<strong>Выберите тип опроса!</strong>"
        }
    })
}

async function createOneAnswerSurvey(survey) {
    let options = await getOptions(survey["id"])
    let d = document.createElement("div")
    d.innerHTML = "<h3 class='display-6'>" + survey["description"] + "</h3>"
    d.innerHTML += "<form id='" + "survey" + survey["id"] + "'>"
    for (let i = 0; i < options.length; i++) {
        let id = survey["id"] + "option" + options[i]["id"]
        d.innerHTML += "<input type='radio' id='" + id + "'" + " name='options'" + " class='form-check-input'> <label for='" + id + "'>" + options[i]["description"]  + "</label>"
            + "<span class='badge bg-info rounded-pill' style='width: 3rem;'>" +
            options[i]["votes"] + "</span>" + "<br>" + "<br>"
    }
    d.innerHTML += "<br>"
    d.innerHTML += "<input class='btn btn-outline-primary' type='submit' id='vote" + survey["id"] + "' value='Проголосовать'/>"
    d.innerHTML += "</form>"
    let s = document.getElementById("one")
    s.appendChild(d)
    document.getElementById("one").addEventListener('click', async function(e) {
        if(e.target && e.target.id.indexOf("vote") !== -1) {
            e.stopImmediatePropagation();
            let num = e.target.id.substr(4)
            let radios = document.querySelectorAll("input[type=radio]:checked")
            for (let i = 0; i < radios.length; i++) {
                if(radios[i].id.substr(0, radios[i].id.indexOf("option")) === num){
                    let idStart = document.cookie.indexOf("Id: ") + 4
                    let id = document.cookie.substr(idStart, document.cookie.indexOf("; csrf") - idStart)
                    await vote(num, radios[i].id.substr(radios[i].id.indexOf("n") + 1), id)
                    break
                }
            }
        }
    });
}

async function createFewAnswerSurvey(survey) {
    let options = await getOptions(survey["id"])
    let d = document.createElement("div")
    d.innerHTML = "<h3 class='display-6'>" + survey["description"] + "</h3>"
    d.innerHTML += "<form id='" + "survey" + survey["id"] + "'>"
    for (let i = 0; i < options.length; i++) {
        let id = survey["id"] + "check" + options[i]["id"]
        d.innerHTML += "<input type='checkbox' id='" + id + "'" + " name='options'" + " class='form-check-input'> <label for='" + id + "'>" + options[i]["description"] +
            "</label>" + "<span class='badge bg-info rounded-pill' style='width: 3rem;'>" +
            options[i]["votes"] + "</span>" + "<br>" + "<br>"
    }
    d.innerHTML += "<br>"
    d.innerHTML += "<input class='btn btn-outline-primary' type='submit' id='vote" + survey["id"] + "' value='Проголосовать'/>"
    d.innerHTML += "</form>"
    let s = document.getElementById("many")
    s.appendChild(d)
    document.getElementById("many").addEventListener('click', async function (e) {
        if (e.target && e.target.id.indexOf("vote") !== -1) {
            e.stopImmediatePropagation();
            let num = e.target.id.substr(4)
            let radios = document.querySelectorAll("input[type=checkbox]:checked")
            for (let i = 0; i < radios.length; i++) {
                if (radios[i].id.substr(0, radios[i].id.indexOf("check")) === num) {
                    let idStart = document.cookie.indexOf("Id: ") + 4
                    let id = document.cookie.substr(idStart, document.cookie.indexOf("; csrf") - idStart)
                    await vote(num, radios[i].id.substr(radios[i].id.indexOf("k") + 1), id)
                }
            }
        }
    });
}

async function createMySurvey(survey){
    let options = await getOptions(survey["id"])
    let d = document.createElement("div")
    d.innerHTML = "<h3 class='display-6'>" + survey["description"] + "</h3> <input type='text' placeholder='Новое описание опроса' id='"+ survey["id"] + "surdescVal" + "'>" + "<button class='btn btn-outline-primary' id='"+ survey["id"] + "surdescBtn" + "'>Изменить описание</button>"
    d.innerHTML += "<form id='" + "survey" + survey["id"] + "'>"
    for (let i = 0; i < options.length; i++) {
        let id = survey["id"] + "option" + options[i]["id"]
        d.innerHTML += "<input value='" + options[i]["description"] + "' type='text' id='" + id + "'> " +
            "<button class='btn btn-outline-primary' id='" + id + "desc" + "'>Изменить описание</button>" + "<span class='badge bg-info rounded-pill' style='width: 3rem;'>" +
            options[i]["votes"] + "</span>" + "<br>"
        d.innerHTML += ""
    }
    d.innerHTML += "</form>"
    d.innerHTML += "<button class='btn btn-outline-primary' id='" + survey["id"] + "descDelete" + "'>Удалить опрос</button>"
    let s = document.getElementById("my")
    s.appendChild(d)
    document.getElementById("my").addEventListener('click', async function (e) {
        if (e.target && e.target.id.indexOf("desc") !== -1 && e.target.tagName === "BUTTON") {
            e.stopImmediatePropagation();
            if (e.target.id.indexOf("surdescBtn") !== -1) {
                let surveyId = e.target.id.substr(0, e.target.id.indexOf("surdescBtn"))
                let newDesc = document.getElementById(surveyId + "surdescVal")
                newDesc = newDesc.value
                await changeSurveyDesc(surveyId, newDesc)
            }else if (e.target.id.indexOf("Delete") !== -1){
                let surveyId = e.target.id.substr(0, e.target.id.indexOf("desc"))
                await deleteSurvey(surveyId)
            }
            else {
                let optionId = e.target.id.substr(e.target.id.indexOf("n") + 1, e.target.id.indexOf("desc") - e.target.id.indexOf("n") - 1)
                let newDesc = document.getElementById(e.target.id.substr(0, e.target.id.indexOf("desc")))
                newDesc = newDesc.value
                await changeOptionDesc(optionId, newDesc)
            }
        }
    });
}

async function createAnsweredSurvey(survey, answeredOptions){
    let options = await getOptions(survey["id"])
    let d = document.createElement("div")
    d.innerHTML = "<h3 class='display-6'>" + survey["description"] + "</h3>"
    d.innerHTML += "<form id='" + "survey" + survey["id"] + "'>"
    for (let i = 0; i < options.length; i++) {
        let id = survey["id"] + "option" + options[i]["id"]
        if(answeredOptions.indexOf(options[i]["id"]) === -1) {
            d.innerHTML += "<input type='radio' id='" + id + "'" + "" + " class='form-check-input' disabled> <label for='" + id + "'>" + options[i]["description"] +
                "</label>" + "<span class='badge bg-info rounded-pill' style='width: 3rem;'>" +
                options[i]["votes"] + "</span>" + "<br>"
        }else{
            d.innerHTML += "<input type='radio' onclick='return false;' checked id='" + id + "'" + "" + " class='form-check-input'> <label for='" + id + "'>" + options[i]["description"] +
                 "</label>" +"<span class='badge bg-info rounded-pill' style='width: 3rem;'>" +
                options[i]["votes"] + "</span>" + "<br>"
        }
    }
    d.innerHTML += "<br>"
    d.innerHTML += "<input class='btn btn-outline-primary' type='submit' id='unvote" + survey["id"] + "' value='Отменить голоса'/>"
    d.innerHTML += "</form>"
    let s = document.getElementById("voted")
    s.appendChild(d)
    document.getElementById("voted").addEventListener('click', async function(e) {
        if(e.target && e.target.id.indexOf("unvote") !== -1) {
            e.stopImmediatePropagation();
            let num = e.target.id.substr(6)
            let radios = document.querySelectorAll("input[type=radio]:checked")
            for (let i = 0; i < radios.length; i++) {
                if(radios[i].id.substr(0, radios[i].id.indexOf("option")) === num){
                    let idStart = document.cookie.indexOf("Id: ") + 4
                    let id = document.cookie.substr(idStart, document.cookie.indexOf("; csrf") - idStart)
                    await unvote(num, radios[i].id.substr(radios[i].id.indexOf("n") + 1), id)
                }
            }
        }
    });
}

async function deleteSurvey(id){
    let response = await fetch("https://back-course-work.herokuapp.com/survey/delete", {method: "DELETE",  headers: {
            'Content-Type': 'application/json;charset=utf-8'
        },
        body: JSON.stringify({id})
    });
    let result = await response.text();
    console.log(result)
    document.location.reload()
}

async function saveSurvey(user_id, type, description, options){
    let response = await fetch("https://back-course-work.herokuapp.com/survey/save", {method: "PUT",  headers: {
            'Content-Type': 'application/json;charset=utf-8'
        },
        body: JSON.stringify({user_id, type, description})
    });
    let result = await response.json();
    let survey_id = result["id"]

    for (let i = 0; i < options.length; i++) {
        let option = options[i]
        if (option.value !== ""){
            await saveOption(survey_id, option.value)
        }
    }
    document.location.reload()
}

async function saveOption(survey_id, description){
    let response = await fetch("https://back-course-work.herokuapp.com/survey/option/save", {method: "POST",  headers: {
            'Content-Type': 'application/json;charset=utf-8'
        },
        body: JSON.stringify({survey_id, description})
    });
    let result = await response.text();
    console.log(result)
}

async function getOptions(survey_id) {
    let response = await fetch("https://back-course-work.herokuapp.com/survey/option/getAll", {
        method: "POST", headers: {
            'Content-Type': 'application/json;charset=utf-8'
        },
        body: JSON.stringify({survey_id})
    });
    return await response.json()
}

async function vote(survey_id, option_id, user_id){
    let response = await fetch("https://back-course-work.herokuapp.com/survey/vote", {method: "POST",  headers: {
            'Content-Type': 'application/json;charset=utf-8'
        },
        body: JSON.stringify({survey_id, option_id, user_id})
    });
    let result = await response.text();
    console.log(result)
    document.location.reload()
}

async function changeOptionDesc(id, description){
    let response = await fetch("https://back-course-work.herokuapp.com/survey/option/update", {method: "POST",  headers: {
            'Content-Type': 'application/json;charset=utf-8'
        },
        body: JSON.stringify({id, description})
    });
    let result = await response.text();
    console.log(result)
    document.location.reload()
}

async function changeSurveyDesc(id, description){
    let response = await fetch("https://back-course-work.herokuapp.com/survey/update", {method: "POST",  headers: {
            'Content-Type': 'application/json;charset=utf-8'
        },
        body: JSON.stringify({id, description})
    });
    let result = await response.text();
    console.log(result)
    document.location.reload()
}

async function unvote(survey_id, option_id, user_id){
    let response = await fetch("https://back-course-work.herokuapp.com/survey/unvote", {method: "POST",  headers: {
            'Content-Type': 'application/json;charset=utf-8'
        },
        body: JSON.stringify({survey_id, option_id, user_id})
    });
    let result = await response.text();
    console.log(result)
    document.location.reload()
}


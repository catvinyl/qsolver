var authdata = {};
const endpoint = 'https://naurok.com.ua';
const nhp = require('node-html-parser');

async function getTitle(url) {
    const response = await fetch(url);
    const text = await response.text();
    const root = nhp.parse(text);
    const title = root.querySelector('title');
    if(title){
        return title.textContent;
    }
}

function setSecrets (data){
    authdata = data;
}
function createDeadline (left_minutes){
    var currentDate = new Date();
    var date = new Date(currentDate.getTime() + left_minutes * 60 * 1000);
    var month = date.getMonth() + 1;
    month = month.toString();
    if(month.length == 1){
        month = '0' + month;
    }
    var day = date.getDate().toString();
    if (day.length == 1) {
        day = '0' + day;
    }
    const deadline_date = date.getFullYear() + '-' + month + '-' + day;
    var hour = date.getHours().toString();
    if (hour.length == 1) {
        hour = '0' + hour;
    }
    var minute = date.getMinutes().toString();
    if (minute.length == 1) {
        minute = '0' + minute;
    }
    const deadline_time = hour + ':' + minute;
    return [deadline_date, deadline_time];
}

async function template_post (url){
    const csrfdata = await csrfGet();
    var body = {
        '_csrf': csrfdata._csrf
    };
    const res = await fetch(url, {
        "headers": {
            "content-type": "application/x-www-form-urlencoded",
            "cookie": "PHPSESSID=" + authdata.authtoken + "; _csrf=" + csrfdata._csrfCookie
        },
        "body": new URLSearchParams(body).toString(),
        "method": "POST"
    });
    return res;
}

async function stopHomework (homework_url){
    return await template_post(homework_url + '/stop');
}

async function deleteHomework(homework_url) {
    return await template_post(homework_url + '/delete');
}

async function createHomework(url, name, deadline) {
    const csrfdata = await csrfGet();
    url = url.replace('.html', '');
    url += '/set';
    var body = {
        '_csrf': csrfdata._csrf,
        'Homework[name]': name,
        'Homework[deadline_day]': deadline[0],
        'Homework[deadline_hour]': deadline[1],
        'Homework[shuffle_question]': '0',
        'Homework[shuffle_options]': '0',
        'Homework[show_answer]': '1',
        'Homework[show_review]': '1',
        'Homework[show_leaderbord]': '0',
        'Homework[available_attempts]': '0',
        'Homework[duration]': '40',
        'Homework[show_timer]': '0',
        'Homework[show_flashcard]': '0',
        'Homework[show_match]': '0'
    };
    const res = await fetch(url, {
        "headers": {
            "content-type": "application/x-www-form-urlencoded",
            "cookie": "PHPSESSID=" + authdata.authtoken + "; _csrf=" + csrfdata._csrfCookie
        },
        "body": new URLSearchParams(body).toString(),
        "method": "POST"
    });
    var html = (await res.text()).toString();
    var gamecode = html.split('gamecode=');
    var homework_id = findLineWithText(html, 'action="/test/homework/').split('"');
    var homework_url;
    if(homework_id.length == 7){
        homework_id = homework_id[3];
        homework_url = homework_id;
        homework_id = homework_id.split('/');
        homework_id = homework_id[homework_id.length - 1];
    }else {
        homework_id = null;
    }
    if (gamecode.length > 1) {
        gamecode = gamecode[1];
    } else {
        return res;
    }
    gamecode = gamecode.split('"')[0];
    return { game_url: endpoint + '/test/join?gamecode=' + gamecode, gamecode: gamecode, homework_url: endpoint + homework_url, homework_id: homework_id };
}

async function getHomework(session_id){
    const r = await fetch(endpoint + '/api2/test/sessions/' + session_id, {
        "method": "GET"
    });
    var text = await r.text();
    try {
        return JSON.parse(text);
    } catch (error) {
        console.log(error);
    }
}

var csrfcache = {}; 
async function csrfGet(url){
    const timestamp = Math.floor((new Date()).getTime() / 1000);
    const period = 60 * 60; // hour
    if(csrfcache.timestamp){
        if (timestamp - csrfcache.timestamp < period){
            return csrfcache;
        }
    }
    const r = await fetch(url || endpoint, {
        "method": "GET"
    });
    var text = await r.text();
    var csrfToken = findLineWithText(text, 'csrf-token');
    var cookies = r.headers.getSetCookie()[0];
    cookies = cookies.split(';');
    cookies = cookies[0];
    cookies = cookies.replace('_csrf=', '');
    if(csrfToken){
        csrfToken = csrfToken.split('"');
        if(csrfToken.length == 5){
            csrfToken = csrfToken[3]
        }else{
            return;
        }
    }
    csrfcache = { _csrf: csrfToken, _csrfCookie: cookies, timestamp: timestamp};
    return csrfcache;
}

function findLineWithText(text, find){
    const lines = text.split('\n');
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (line.indexOf(find) != -1) {
            return line;
        }
    }
}
async function joinHomework(gamecode, name) {
    const csrfdata = await csrfGet();
    var body = {
        '_csrf': csrfdata._csrf,
        'JoinForm[gamecode]': gamecode,
        'JoinForm[name]': name
    };
    const r = await fetch(endpoint + "/test/join?gamecode=" + gamecode, {
        "headers": {
            "content-type": "application/x-www-form-urlencoded",
            "cookie": "_csrf=" + csrfdata._csrfCookie
        },
        "body": new URLSearchParams(body).toString(),
        "method": "POST"
    });
    var text = await r.text();
    const line = findLineWithText(text, 'ng-init="init(');
    const initline = line.split(',');
    if (initline.length == 3) {
        return initline[1];
    }
}

function getGamecode (url){ // TODO: Improve
    return url.split('=')[1];
}

async function answerHomework(session_id, answer, question_id){
    var body = { session_id: session_id, answer: answer, question_id: question_id, show_answer: 1, type: "multiquiz", point: "1", homeworkType: 1, homework: true };
    if(typeof answer == 'string'){
        body.answer = [answer];
        body.type = 'quiz';
    }
    const r = await fetch(endpoint + "/api2/test/responses/answer", {
        "headers": {
            "content-type": "application/json;charset=UTF-8"
        },
        "body": JSON.stringify(body),
        "method": "PUT"
    });
    var text = await r.text();
    try {
        return JSON.parse(text);
    } catch (error) {
        console.log(error);
    }
    return text;
}

function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function selectAnswers(question){
    const options = question.options;
    const id = options[getRandomInt(0, options.length - 1)].id;
    if (question.type == 'multiquiz'){
        return [id];
    }
    return id;
}

async function completeTest(url){
    const deadline = createDeadline(24 * 60);
    const title = await getTitle(url);
    if (title == 'Not Found (#404)'){
        return { error: ' Not Found (#404)' };
    }
    const name_homework = title.split(' | ')[0] + ' ' + deadline[0] + ' ' + deadline[1];
    const homeworkOwned = await createHomework(url, name_homework.slice(0, 254), deadline);
    const homeworkUrl = homeworkOwned.homework_url;
    if(!homeworkUrl){
        return { error: homeworkUrl.statusText };
    }
    // const gamecode = getGamecode(homeworkUrl);
    // if (!gamecode) {
    //     return;
    // }
    const session_id = await joinHomework(homeworkOwned.gamecode, 'Учень');
    const homework = await getHomework(session_id);
    const questions = homework.questions;
    homework.answers = [];
    // console.log(homework, url, homeworkUrl);
    if(homework.document.questions == 0){
        return;
    }
    for (let i = 0; i < questions.length; i++) {
        const question = questions[i];
        const response = await answerHomework(session_id, selectAnswers(question), question.id);
        homework.answers.push(response);
    }
    stopHomework(homeworkOwned.homework_url).then(function () {
        deleteHomework(homeworkOwned.homework_url)
    });
    homework.title = title;
    return homework;
}

async function init(){
    await csrfGet();
}

init();
async function test (){
    const url = endpoint + '/test/uzagalnennya-znan-z-temi-geografichniy-prostir-ukra-ni-2472351.html';
    // return await completeTest(url);
    // const res = await csrfGet()
    // console.log(res);
    return await getTitle(url);
}

if(false){
    test().then(function (res){
        console.log(res);
        // const fs = require('fs');
        // fs.writeFileSync('test.json', JSON.stringify(res), { encoding: 'utf-8'});
    });
}

exports.completeTest = completeTest;
exports.answerHomework = answerHomework;
exports.setSecrets = setSecrets;
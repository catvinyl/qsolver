if (typeof document == 'object') {
    const dom_elements = document.querySelectorAll('*');
    for (let i = 0; i < dom_elements.length; i++) {
        let e = dom_elements[i];
        let id = e.id || e.className;
        if (id) {
            window[id] = e;
        }
    }
}

function api(pth, objData, func){
    document.body.style.cursor = 'wait';
    element_progressbar.style.display = '';
    const data = encodeURIComponent(JSON.stringify(objData));
    fetch(location.origin + '/' + pth + '?a=' + data, { "method": "GET" }).then(async function (response) {
        const text = await response.text();
        const json = JSON.parse(text);
        document.body.style.cursor = '';
        element_progressbar.style.display = 'none';
        if(func){
            func(json, pth);
        }
    })
}

function fixText(text){
    return text.replaceAll('</p>', '').replaceAll('<p>', '');
}

function renderQAOptions(options, correct_options){
    var options_div = document.createElement('div');
    options_div.className = 'options_div';
    const correct = Object.values(correct_options);
    for (let i = 0; i < options.length; i++) {
        const option = options[i];
        var div = document.createElement('div');
        div.className = 'render_option';
        div.classList.add(correct[i] == '1' ? 'correct_option' : 'wrong_option');
        const prefix = correct[i] == '1' ? '✅' : '❌';
        var p = document.createElement('p');
        p.innerText = prefix + ' ' + (i + 1) + '. ' + fixText(option.value);
        div.appendChild(p);

        if (option.image) {
            var img = document.createElement('img');
            img.src = option.image;
            div.appendChild(img);
        }
        options_div.appendChild(div);
    }
    return options_div;
}
function renderQA (data){
    var render_qa = document.createElement('div');
    render_qa.className = 'render_qa';
    if (data.questions){
        const length = data.questions.length;
        for (let i = 0; i < length; i++) {
            var div = document.createElement('div');
            div.className = 'render_qa_question';

            const question = data.questions[i];
            var counter = document.createElement('b');
            counter.className = 'counter';
            counter.innerText = 'Питання ' + (i + 1) + '/' + length;
            div.appendChild(counter);

            var p = document.createElement('p');
            p.innerText = fixText(question.content);
            div.appendChild(p);

            if (question.image){
                var img = document.createElement('img');
                img.src = question.image;
                div.appendChild(img);
            }

            if (question.options){
                var options_text = document.createElement('b');
                options_text.className = 'options_text';
                options_text.innerText = 'варіанти відповідей';
                div.appendChild(options_text); 

                var correct_options;
                if(data.answers){
                    correct_options = data.answers[i].correct_options;
                }
                div.appendChild(renderQAOptions(question.options, correct_options));
            }
            render_qa.appendChild(div);
        }
    }
    return render_qa;
}

function renderElement (data){
    if (data.error) {
        return;
    }
    if(data.type == 'test'){
        return renderQA(data);
    }
    var render_qa = document.createElement('div');
    render_qa.className = 'render_qa';

    if(data.title){
        var title = document.createElement('h2');
        title.innerText = data.title;
        render_qa.appendChild(title);
    }

    if (data.description) {
        var description = document.createElement('span');
        description.innerText = data.description;
        render_qa.appendChild(description);
    }

    if (data.image) {
        var img = document.createElement('img');
        img.src = data.image;
        render_qa.appendChild(img);
    }
    if (data.url) {
        var a = document.createElement('a');
        a.href = data.url;
        a.innerText = data.url;
        render_qa.appendChild(a);
    }

    return render_qa;
}

function renderResponse(data){
    var render_response = document.createElement('div');
    render_response.className = 'render_response';
    div_content.appendChild(render_response);
    if (data.error) {
        return render_response.appendChild(renderElement({ title: 'Помилка!', description: data.error }));
    }
    for (let i = 0; i < data.length; i++) {
        const element = data[i];
        const dom_element = renderElement(element);
        if(dom_element){
            render_response.appendChild(dom_element);
        }
    }
    hint_load();
}

function render_selectOption (data){
    const array = data.array;
    for (let i = 0; i < array.length; i++) {
        const text = array[i];
        var title = document.createElement('h2');
        title.className = 'selectOption';
        title.innerText = text;
        title.i = i;
        hint_search.onclick = function (e) {
            api('api/qhistory', { i: e.target.i }, renderResponse);
        }
        hint_search.appendChild(title);
    }
}

function hint_load(){
    while (hint_search.firstChild) {
        hint_search.removeChild(hint_search.lastChild);
    }
    api('api/history', {}, render_selectOption);
}

hint_load();

go_btn.onclick = function (){
    document.title = 'qsolver - ' + input_text.value;
    api('api/q', { data: input_text.value }, renderResponse);
}

input_text.onkeyup = function (e) {
    if (e.key === 'Enter') {
        go_btn.onclick();
    }
}

clear_btn.onclick = function () {
    while (div_content.firstChild) {
        div_content.removeChild(div_content.lastChild);
    }
}

element_progressbar.style.display = 'none';
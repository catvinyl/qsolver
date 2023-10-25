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
    const data = encodeURIComponent(JSON.stringify(objData));
    fetch(location.origin + '/' + pth + '?a=' + data, { "method": "GET" }).then(async function (response) {
        const text = await response.text();
        const json = JSON.parse(text);
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
    div_content.appendChild(render_qa);
}

go_btn.onclick = function (){
    api('api/completeTest', { data: input_text.value }, function (data){
        if(data.error){
            return alert('Error: ' + data.error);
        }
        renderQA(data);
    });
}
const nhp = require('node-html-parser');

async function search (query){
    const response = await fetch("https://html.duckduckgo.com/html/", { "body": "q=" + encodeURIComponent(query) + '&b=&kl=&df=', "method": "POST", "headers": { "Content-Type": "application/x-www-form-urlencoded", "User-Agent": "Mozilla/5.0 (X11; Linux x86_64; rv:120.0) Gecko/20100101 Firefox/120.0" } });
    const text = await response.text();
    const root = nhp.parse(text);
    const results = root.querySelectorAll('.result__body');
    const anomaly = root.querySelector('.anomaly-modal__modal');
    console.log(anomaly);
    if(anomaly){
        return await search(query);
    }
    var array = [];
    for (let i = 0; i < results.length; i++) {
        const result = results[i];
        const title = result.querySelector('.result__a');
        const description = result.querySelector('.result__snippet');
        const o = {
            title: title.textContent,
            url: title.getAttribute('href'),
            description: description.textContent
        };
        array.push(o);
    }
    return array;
}

exports.search = search;

// await fetch("https://html.duckduckgo.com/html/", {     "credentials": "omit",     "headers": {         "User-Agent": ,         "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",         "Accept-Language": "en-US,en;q=0.5",         "Content-Type": "application/x-www-form-urlencoded",         "Sec-GPC": "1",         "Upgrade-Insecure-Requests": "1",         "Sec-Fetch-Dest": "document",         "Sec-Fetch-Mode": "navigate",         "Sec-Fetch-Site": "same-origin",         "Sec-Fetch-User": "?1",         "Pragma": "no-cache",         "Cache-Control": "no-cache"     },     "referrer": "https://html.duckduckgo.com/",     "body": "q=site%3Anaurok.com.ua%2Ftest+%22%D0%92%D0%BA%D0%B0%D0%B6%D1%96%D1%82%D1%8C%2C+%D0%BF%D1%80%D0%B5%D0%B4%D1%81%D1%82%D0%B0%D0%B2%D0%BD%D0%B8%D0%BA%D0%B8+%D1%8F%D0%BA%D0%BE%D0%B3%D0%BE+%D1%82%D0%B8%D0%BF%D1%83+%D1%82%D0%B2%D0%B0%D1%80%D0%B8%D0%BD+%D0%BC%D0%B0%D1%8E%D1%82%D1%8C+%D0%BC%D0%B0%D0%BD%D1%82%D1%96%D1%8E%22&b=&kl=&df=",     "method": "POST",     "mode": "cors" });
const fs = require('fs');
const path = require('path');
const http = require('http');

const portServer = 5821;
const srvPath = 'srv';
var srvFiles = {};

var filesInMemory = false; 



const mimeType = { 'html': 'text/html', 'js': 'text/javascript', 'css': 'text/css'};

function fileExtensionToMimeType(fileName){
    const arr = fileName.split('.');
    const fileExt = arr[arr.length - 1];
    return mimeType[fileExt] || 'text/plain';
}

function scanSrv(){
    fs.readdir(srvPath, (err, files) => {
        files.forEach(file => {
            const pth = path.join(srvPath, file);
            srvFiles[file] = pth;
            if(filesInMemory){
                fs.readFile(pth, function (err, data) {
                     srvFiles[file] = {
                        mimeType: fileExtensionToMimeType(file),
                        data: data
                     };
                });
            }
        });
    });
}

function responseFile(file, response){
    response.writeHead(200, {
        'Content-Type': file.mimeType
    });
    response.write(file.data);
    response.end();
}
function httpServerHandle(request, response){
    var pth = request.url.slice(1);
    pth = pth.split('?')[0];
    if(pth == ''){
        pth = 'index.html';
    }
    const file = srvFiles[pth];
    if (typeof file == 'object'){
        if(file.custom){
            file.custom(request, response);
        }else{
            responseFile(file, response);
        }
        return;
    }
    if(typeof file == 'string'){
        fs.readFile(file, function (err, data) {
            const f = {
                mimeType: fileExtensionToMimeType(file),
                data: data
            };
            responseFile(f, response);
        });
        return;
    }
    response.writeHead(404, {
        'Content-Type': 'text/plain'
    });
    response.write('404');
    response.end();
}

function setCustom(pth, func){
    srvFiles[pth] = {
        custom: func
    };
}

function setApi(pth, func){
    setCustom(pth, async function (request, response) {
        response.writeHead(200, {
            'Content-Type': 'application/json'
        });
        var pth = request.url.split('=');
        var out = null;
        if(pth.length > 1){
            pth = pth[pth.length - 1];
            pth = decodeURIComponent(pth);
            var ino = null;
            try {
                ino = JSON.parse(pth);
            } catch ({ name, message }) {
                out = { error: 'json', message: message };
            }
            if (ino){
                out = await func(ino);
            }
        }else{
            out = { error: 'no-data' };
        }
        response.write(JSON.stringify(out));
        response.end();
    });
}
function init() {
    if (Number(process.env.PRODUCTION) == 1) {
        filesInMemory = true;
    }
    scanSrv();
    http.createServer(httpServerHandle).listen(portServer);
    console.log('Server port: ' + portServer);
    // setApi('api/echo', function(data){
    //     return data;
    // });
}

init();
exports.setCustom = setCustom;
exports.setApi = setApi;
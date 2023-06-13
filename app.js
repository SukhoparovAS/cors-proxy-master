const express = require('express');
const request = require('request');
const bodyParser = require('body-parser');
const multer = require('multer');
const upload = multer();
const FormData = require('form-data');


const app = express();
/* require('request-debug')(request); */

const myLimit = typeof(process.argv[2]) !== 'undefined' ? process.argv[2] : '10000kb';
console.log('Using limit: ', myLimit);

app.use(bodyParser.json({limit: myLimit}));

app.all('*', upload.any(), function (req, res, next) {
  // Set CORS headers: allow all origins, methods, and headers: you may want to lock this down in a production environment
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, PUT, PATCH, POST, DELETE");
  res.header("Access-Control-Allow-Headers", req.header('access-control-request-headers'));
  res.header("allow", "GET, PUT, PATCH, POST, DELETE");

  if (req.method === 'OPTIONS') {
    // CORS Preflight
    res.send();
  } else {
    const targetURL = req.header('Target-URL');
    if (!targetURL) {
      res.send(500, { error: 'There is no Target-UR header in the request' });
      return;
    }

    const requestHeaders = {};
    const TRANSFERS_HEADERS = ['x-node-id', 'token', 'Content-Type', 'accept', 'accept-version'];
    for (const header in req.headers){
      if (TRANSFERS_HEADERS.includes(header)){
        requestHeaders[header] = req.header(header);
      }
    }

    
    
    const options = {
      url: targetURL + req.url,
      method: req.method,
      headers: requestHeaders,
      
    };
    if (req.files && req.files.length > 0) {
        const formData = new FormData();
        /* formData.append('myField', 'myValue'); // Добавьте другие поля формы, если необходимо */

         for (const file of req.files) {
            formData.append('file', file.buffer, { filename: file.originalname });
        }
        // Преобразование объекта формы в поток и установка заголовков контента
        const formHeaders = formData.getHeaders();
        for (const header in formHeaders) {
        options.headers[header] = formHeaders[header];
        }
        
        // Отправка запроса с использованием объекта формы в качестве тела запроса
        formData.pipe(request(options, function (error, response, body) {
        if (error) {
            console.error('error: ' + error);
        }
        })).pipe(res);
    } else {
        options.json = req.body
        request(options, function (error, response, body) {
            if (error) {
                console.error('error: ' + error);
            }
            /* console.log(body); */
            }).pipe(res);
    }
    
  }
});

app.set('port', process.env.PORT || 3000);

app.listen(app.get('port'), function () {
  console.log('Proxy server listening on port ' + app.get('port'));
});
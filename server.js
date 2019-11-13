// const http = require('http');

// const hostname = '127.0.0.1';
// const port = 5000;

// const server = http.createServer((req, res) => {
//     res.statusCode = 200;
//     res.setHeader('Content-Type', 'text/plain');
//     res.end('Hello World\n');
// });

// server.listen(port, hostname, () => {
//     console.log(`Server running at http://${hostname}:${port}/`);
// });

const express = require('express');
const path = require('path');

const app = express();
const hostname = 'localhost';
const port = 5000;

app.get('/', (req, res) => {
    res.sendFile('index.html', { root: __dirname });
})

app.use('/js', express.static(path.join(__dirname, '/js')));
app.use('/css', express.static(path.join(__dirname, '/css')));
app.use('/img', express.static(path.join(__dirname, '/img')));
app.use('/font', express.static(path.join(__dirname, '/font')));

app.listen(port, () => console.log(`Server running at http://${hostname}:${port}/`));
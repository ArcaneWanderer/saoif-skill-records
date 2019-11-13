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
const sqlite3 = require('sqlite3').verbose();

const app = express();
const hostname = 'localhost';
const port = 5000;

const DATABASE_FILE = 'Db/gamemaster.db3';

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname + '/index.html'));
})

app.use('/js', express.static(path.join(__dirname, '/js')));
app.use('/css', express.static(path.join(__dirname, '/css')));
app.use('/img', express.static(path.join(__dirname, '/img')));
app.use('/font', express.static(path.join(__dirname, '/font')));


app.get('/card', (req, res) => {
    var db = createConnection(DATABASE_FILE);
    var sql = `SELECT card_masterid, data, evolution_card_masterid, skill_masterid
                FROM MCardMasters
                INNER JOIN textmaster.MTextMasterS
                ON text_name_id = id
                WHERE data LIKE "[%" AND rarity = max_rarity - 1`;

    var data = [];
    
    db.run('ATTACH DATABASE \'Db/en/textmaster.db3\' AS textmaster', [], (error) => {
        if (error) {
            throw error;
        }
        db.all(sql, [], (error, rows) => {
            if (error) {
                throw error;
            }
            rows.forEach((row) => {
                // console.log(`#${row.card_masterid} - ${row.data}`);
                data.push(row);
            });

            res.contentType('application/json');
            res.send(JSON.stringify(data));
        });
    });
});

function createConnection(databaseFile) {
    var db = new sqlite3.Database(databaseFile, (error) => {
        if (error) {
        return console.error(error.message);
        }
        console.log('Connected to the SQlite database.');
    });
    return db;
}

function closeConnection(databaseObject) {
    databaseObject.close((error) => {
        if (error) {
          return console.error(error.message);
        }
        console.log('Closed the database connection.');
    });
}

app.listen(port, () => console.log(`Server running at http://${hostname}:${port}/`));
const express = require('express');
const path = require('path');

const app = express();

const SkillRecordDatabase = require('./skillrecorddb');
const srdb = new SkillRecordDatabase();

const SERVER_HOST = process.env.OPENSHIFT_NODEJS_IP || '0.0.0.0';
const SERVER_PORT = process.env.OPENSHIFT_NODEJS_PORT || process.env.I247_PORT || 8080;

app.use(express.static(path.join(__dirname, 'public')));

app.get('/:language', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/:language/card', (req, res) => {
    const language = req.params.language;
    srdb.fetchCardOptions(language).then((data) => {
        res.contentType('application/json');
        res.send(JSON.stringify(data));
    }).catch((error) => {
        console.log(error);
        res.status(500).json({ error: error.toString() });
    });
});

app.get('/:language/sr/', (req, res) => {
    const language = req.params.language;
    srdb.fetchCardData(language).then((data) => {
        return Promise.all(data.map((element) => {
            return srdb.getSkillRecordData(element.card_masterid, language);
        }));
    }).then((data) => {
        res.contentType('application/json');
        res.send(JSON.stringify(data));
    }).catch((error) => {
        console.log(error);
        res.status(500).json({ error: error.toString() });
    });
});

app.get('/:language/sr/:cardId', (req, res) => {
    const cardId = req.params.cardId;
    const language = req.params.language;
    srdb.getSkillRecordData(cardId, language).then((data) => {
        res.contentType('application/json');
        res.send(JSON.stringify(data));
    }).catch((error) => {
        console.log(error);
        res.status(500).json({ error: error.toString() });
    });
});

process.on('SIGINT', () => {
    srdb.closeConnection();
});

app.listen(SERVER_PORT, SERVER_HOST, () => console.log(`Server running at http://${SERVER_HOST}:${SERVER_PORT}/`));

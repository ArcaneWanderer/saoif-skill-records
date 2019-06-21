import sqlite3
from sqlite3 import Error

from flask import Flask, request, url_for, send_from_directory
import json

app = Flask(__name__, static_url_path='')

@app.route('/')
def index():
    return send_from_directory('', 'index.html')

@app.route('/js/<path:path>')
def send_js(path):
    return send_from_directory('js', path)

@app.route('/css/<path:path>')
def send_css(path):
    return send_from_directory('css', path)

@app.route('/img/<path:path>')
def send_img(path):
    return send_from_directory('img', path)

@app.route('/font/<path:path>')
def send_font(path):
    return send_from_directory('font', path)

@app.route('/card')
def get_all_cards(language='en'):
    connection = create_connection('Db/gamemaster.db3')
    if (connection is None):
        print('Error opening the database')
        return
    
    query = '''SELECT card_masterid, data, evolution_card_masterid, skill_masterid
                FROM MCardMasters
                INNER JOIN textmaster.MTextMasterS
                ON text_name_id = id
                WHERE data LIKE "[%" AND rarity = max_rarity - 1'''

    cursor = connection.cursor()
    cursor.execute('ATTACH DATABASE \'Db/en/textmaster.db3\' AS textmaster')
    cursor.execute(query)
    rows = cursor.fetchall()

    cards = []
    cards.extend(rows)
    return json.dumps(cards)

@app.route('/card/<int:card_id>')
def get_card_info(card_id):
    connection = create_connection('Db/gamemaster.db3')
    if (connection is None):
        print('Error opening the database')
        return
    
    query = '''SELECT *
                FROM MCardMasters
                WHERE card_masterid = \'''' + str(card_id) + '\''

    cursor = connection.cursor()
    cursor.execute(query)
    row = cursor.fetchone()

    card = row
    return json.dumps(card)

@app.route('/skill/<int:skill_id>')
def get_skill_info(skill_id):
    connection = create_connection('Db/gamemaster.db3')
    if (connection is None):
        print('Error opening the database')
        return
    
    query = '''SELECT *
                FROM MSkillMasters
                WHERE skill_masterid = \'''' + str(skill_id) + '\''

    cursor = connection.cursor()
    cursor.execute(query)
    row = cursor.fetchone()

    skill = row
    return json.dumps(skill)

@app.route('/buff/passive/<int:card_id>')
def get_passive_buffs(card_id):
    connection = create_connection('Db/gamemaster.db3')
    if (connection is None):
        print('Error opening the database')
        return
    
    query = '''SELECT *
                FROM MCardPowerupMasters
                WHERE card_masterid = \'''' + str(card_id) + '\''

    cursor = connection.cursor()
    cursor.execute(query)
    rows = cursor.fetchall()

    buffs = []
    buffs.extend(rows)
    return json.dumps(buffs)

@app.route('/buff/active/<int:card_id>')
def get_active_buffs(card_id):
    connection = create_connection('Db/gamemaster.db3')
    if (connection is None):
        print('Error opening the database')
        return
    
    query = '''SELECT *
                FROM MCardMasters
                WHERE card_masterid = \'''' + str(card_id) + '\''

    cursor = connection.cursor()
    cursor.execute(query)
    skill_id = cursor.fetchone()['skill_masterid']

    query2 = '''SELECT *
                FROM MSkillBuffMasters
                WHERE skill_masterid = \'''' + str(skill_id) + '\''

    cursor = connection.cursor()
    cursor.execute(query2)
    rows = cursor.fetchall()

    buffSkills = []
    buffSkills.extend(rows)

    for buffSkill in buffSkills:
        query3 = '''SELECT *
                    FROM MBuffPowerupMasters
                    WHERE buff_masterid = \'''' + str(buffSkill['buff_masterid']) + '\''

        cursor = connection.cursor()
        cursor.execute(query3)
        rows = cursor.fetchall()

        buffEffects = []
        buffEffects.extend(rows)

        buffSkill['buffEffects'] = buffEffects
    
    buffs = []
    buffs.extend(buffSkills)
    return json.dumps(buffs)

@app.route('/text/<int:text_id>')
def get_text_data(text_id):
    connection = create_connection('Db/en/textmaster.db3')
    if (connection is None):
        print('Error opening the database')
        return
    
    query = '''SELECT *
                FROM MTextMasters
                WHERE id = \'''' + str(text_id) + '\''

    cursor = connection.cursor()
    cursor.execute(query)
    row = cursor.fetchone()

    text_data = row
    return json.dumps(text_data)

def create_connection(database_file):
    try:
        connection = sqlite3.connect(database_file)
        connection.row_factory = dict_factory
        return connection
    except Error as e:
        print(e)

    return None

def dict_factory(cursor, row):
    d = {}
    for idx, col in enumerate(cursor.description):
        d[col[0]] = row[idx]
    return d

def add_cors_headers(response):
    response.headers['Access-Control-Allow-Origin'] = '*'
    if request.method == 'OPTIONS':
        response.headers['Access-Control-Allow-Methods'] = 'DELETE, GET, POST, PUT'
        headers = request.headers.get('Access-Control-Request-Headers')
        if headers:
            response.headers['Access-Control-Allow-Headers'] = headers
    return response
app.after_request(add_cors_headers)


if __name__ == '__main__':
    app.run(host='0.0.0.0', port='5000', debug=True)
var HOST = 'http://localhost'
var PORT = 5000
var HOST_URL = HOST + ':' + PORT

var cards = []
var selectedCard = {}

Vue.component('skill-record-info', {
    props: ['cardId'],
    data: function () {
        return {
            skillRecord: {'cardInfo': {}},
            level: 1
        }
    },
    methods: {
        toggleTransform: function() {
            if (this.skillRecord.cardInfo.evolution_card_masterid > 0) {
                this.cardId = this.skillRecord.cardInfo.evolution_card_masterid;
            } else {
                this.cardId = this.skillRecord.cardInfo.base_card_masterid;
            }
        },
        updateSkillRecord: async function() {
            this.skillRecord = await buildSkillRecordInfo(this.cardId);
            console.log(this.skillRecord);

            var description = this.skillRecord.skillDescription;
            console.log(description);

            description = this.mapDescription(description);
            this.skillRecord.skillDescription = description;
        },
        mapDescription: function (rawDescription) {
            description = rawDescription;
            
            description = description.replace(/\\n/g, '<br>');
            description = description.replace('%SkillDamage%', this.skillRecord.skillInfo['bAtkRate'] / 100 + (this.level-1) + '%');

            var buffTags = description.match(/\%Buff.+?\%/g);

            if (buffTags == null) {
                return description;
            }

            console.log(buffTags);

            var buffs = [];
            var buffList = [];
            var durations = [];

            // If the skill record is a passive/ability-type
            if (this.skillRecord.cardInfo.type == 2) {
                buffList = this.skillRecord.passiveBuffs;
            } else {
                buffList = this.skillRecord.activeBuffs;
            }

            for (var i = 0; i < buffList.length; i++) {
                var buff = buffList[i];
                buffs.push(buff);

                if (buff.hasOwnProperty('buff_time')) {
                    durations.push(buff.buff_time);
                }
            }
            
            console.log(buffs.length);

            var buffMappings = {};

            while (buffTags.length > 0) {
                var buffTag = buffTags.shift();
                var value = -1;

                if (buffTag.includes('BuffTime')) {
                    value = durations.shift();
                } else {
                    if (buffList.length <= 0) {
                        break;
                    }
                    var buff = buffList.shift();

                    if (buff.hasOwnProperty('buffEffects')) {
                        value = buff.buffEffects[0].slope * (buff.buff_level + this.level) + buff.buffEffects[0].intercept;
                    } else {
                        value = buff.slope * this.level + buff.intercept;
                    }

                    if (value < 0) {
                        value *= -1;
                    }

                    if (buffTag.includes('BuffRate')) {
                        value = value / 100 + '%';
                    }
                }

                buffMappings[buffTag] = value;
            }

            for (var tag in buffMappings) {
                console.log(tag, buffMappings[tag]);
                description = description.replace(new RegExp(tag, "g"), buffMappings[tag]);
            }

            return description;
        },
    },
    watch: {
        cardId: function() {
            this.updateSkillRecord();
        },
        level: function() {
            this.updateSkillRecord();
        }
    },
    created: function() {
        // this.skillRecord = await buildSkillRecordInfo(this.cardId);
        this.updateSkillRecord();

        switch (this.skillRecord.cardInfo.rarity) {
            case 5:
                this.level = 80;
                break;
            case 4:
                this.level = 70;
                break;
            case 3:
                this.level = 60;
                break;
            case 2:
                this.level = 50;
                break;
            case 1:
                this.level = 40;
                break;
        }
    },
    template: `
        <div class="card">
            <div><input v-model="level"></div><br>
            <div class="card-info">
                <div class="card-type">
                    <span>{{ skillRecord.cardInfo.type == 1 ? "Sword Skill" : "Ability" }}</span>
                </div>
                <p class="card-title">{{ skillRecord.cardName }}</p>
                <div class="card-rarity">
                    <span v-for="index in skillRecord.cardInfo.rarity" :key="index"><img width=25em height=25em src="http://localhost:5000/img/UI_icon_status_rare_on.png"></span><span v-if="skillRecord.cardInfo.evolution_card_masterid > 0"><img width=25em height=25em src="http://localhost:5000/img/UI_icon_status_rare_off.png"></span>
                </div>
                <div class="card-img">
                    <img v-if="skillRecord.cardInfo.rarity == 2 && skillRecord.cardInfo.evolution_card_masterid == 0" src="http://localhost:5000/img/Base_Frame/sr_base_1_2.png">
                    <img v-else-if="skillRecord.cardInfo.rarity == 1" src="http://localhost:5000/img/Base_Frame/sr_base_1_1.png">
                    <img v-else-if="skillRecord.cardInfo.rarity == 3 && skillRecord.cardInfo.evolution_card_masterid == 0" src="http://localhost:5000/img/Base_Frame/sr_base_2_2.png">
                    <img v-else-if="skillRecord.cardInfo.rarity == 2" src="http://localhost:5000/img/Base_Frame/sr_base_2_1.png">
                    <img v-else-if="skillRecord.cardInfo.rarity == 4 && skillRecord.cardInfo.evolution_card_masterid == 0" src="http://localhost:5000/img/Base_Frame/sr_base_3_2.png">
                    <img v-else-if="skillRecord.cardInfo.rarity == 3" src="http://localhost:5000/img/Base_Frame/sr_base_3_1.png">
                    <img v-else-if="skillRecord.cardInfo.rarity == 5 && skillRecord.cardInfo.evolution_card_masterid == 0" src="http://localhost:5000/img/Base_Frame/sr_base_4_2.png">
                    <img v-else-if="skillRecord.cardInfo.rarity == 4" src="http://localhost:5000/img/Base_Frame/sr_base_4_1.png">
                    <img v-bind:src="'https://raw.githubusercontent.com/Nayuta-Kani/SAOIF-Skill-Records-Database/master/srimages/sr_icon_l_' + (skillRecord.cardInfo.evolution_card_masterid > 0 ? skillRecord.cardInfo.evolution_card_masterid : skillRecord.cardInfo.card_masterid) + '.png'">
                </div>
                <div class="card-details">
                    <p class="skill-name">{{ skillRecord.skillName }}</p>
                    <span class="skill-level">Lv. {{ level }}</span>
                    <p class="skill-description" v-html="skillRecord.skillDescription"></p>
                    <div class="card-id-text">
                        <span>#{{ skillRecord.cardInfo.card_masterid }}</span>
                    </div>
                </div>
            </div>
            <div class="card-actions">
                <button @click="toggleTransform">Toggle transform</button>
            </div>
        </div>
    `
});

/* <p class="skill-name">{{ skillRecord.skillName }}</p> */

// <p v-for="(info, key, index) in skillRecord.cardInfo">
//     {{ key + ": " + info }}
// </p>

var app = new Vue({
    el: '#app',
    data: {
        selected: selectedCard,
        cardOptions: cards,
        currentCard: null
    },
    methods: {
        loadSkillRecord: async function() {
            // this.currentCard = await buildSkillRecordInfo(this.selected.card_masterid);
            console.log(this.currentCard);
        },
        triggerCardSelect: function(value) {
            this.selected = value;
        }
    }
})

window.onload = async function() {
    await loadCardOptions()
        .then(function(data) {
            document.getElementById("card-select").selectedIndex = "0";
            selectedCard = data[0];
            cards = data;
            // console.log(app.selected);
            app.triggerCardSelect(selectedCard);
        });
}

async function loadCardOptions() {
    return new Promise(function(resolve, reject) {
        fetch(HOST_URL + '/card', {method: 'get'})
            .then(function(response) {
                if (response.status !== 200) {
                    console.log('Looks like there was a problem. Status Code: ' + response.status);
                    return;
                }

                return response.json();
            }).then(function(data) {
                app.cardOptions = data;
                resolve(app.cardOptions);
            }).catch(function(err) {
                console.log('Fetch Error :-S', err);
            });
    });
}

async function loadCardInfo(cardId) {
    card = ''
    return new Promise(function(resolve, reject) {
        fetch(HOST_URL + '/card/' + cardId, {method: 'get'})
            .then(function(response) {
                if (response.status !== 200) {
                    console.log('Looks like there was a problem. Status Code: ' + response.status);
                    return;
                }

                return response.json();
            }).then(function(data) {
                card = data;
                resolve(card);
            }).catch(function(err) {
                console.log('Fetch Error :-S', err);
            });
    });
}

async function loadSkillInfo(skillId) {
    skill = ''
    return new Promise(function(resolve, reject) {
        fetch(HOST_URL + '/skill/' + skillId, {method: 'get'})
            .then(function(response) {
                if (response.status !== 200) {
                    console.log('Looks like there was a problem. Status Code: ' + response.status);
                    return;
                }

                return response.json();
            }).then(function(data) {
                skill = data;
                resolve(skill);
            }).catch(function(err) {
                console.log('Fetch Error :-S', err);
            });
    });
}

async function loadPassiveBuffs(cardId) {
    buffs = []
    return new Promise(function(resolve, reject) {
        fetch(HOST_URL + '/buff/passive/' + cardId, {method: 'get'})
            .then(function(response) {
                if (response.status !== 200) {
                    console.log('Looks like there was a problem. Status Code: ' + response.status);
                    return;
                }

                return response.json();
            }).then(function(data) {
                buffs = data;
                resolve(buffs);
            }).catch(function(err) {
                console.log('Fetch Error :-S', err);
            });
    });
}

async function loadActiveBuffs(cardId) {
    buffs = []
    return new Promise(function(resolve, reject) {
        fetch(HOST_URL + '/buff/active/' + cardId, {method: 'get'})
            .then(function(response) {
                if (response.status !== 200) {
                    console.log('Looks like there was a problem. Status Code: ' + response.status);
                    return;
                }

                return response.json();
            }).then(function(data) {
                buffs = data;
                resolve(buffs);
            }).catch(function(err) {
                console.log('Fetch Error :-S', err);
            });
    });
}

async function loadTextData(textId) {
    textData = ''
    return new Promise(function(resolve, reject) {
        fetch(HOST_URL + '/text/' + textId, {method: 'get'})
            .then(function(response) {
                if (response.status !== 200) {
                    console.log('Looks like there was a problem. Status Code: ' + response.status);
                    return;
                }

                return response.json();
            }).then(function(data) {
                textData = data;
                resolve(textData);
            }).catch(function(err) {
                console.log('Fetch Error :-S', err);
            });
    });
}

function buildSkillRecordInfo(cardId) {
    var skillRecord = {};
    var cardInfo;
    var skillInfo;
    var cardName;
    var cardDescription;
    var skillName;
    var skillDescription;
    var passiveBuffs = [];
    var activeBuffs = [];

    return new Promise(async function(resolve, reject) {
        await loadCardInfo(cardId)
            .then(async function(data) {
                cardInfo = data;
                return await loadSkillInfo(data['skill_masterid']);
            }).then(async function(data) {
                skillInfo = data;
                return await loadTextData(cardInfo['text_name_id']);
            }).then(async function(data) {
                cardName = data['data'];
                return await loadTextData(cardInfo['text_comment_id']);
            }).then(async function(data) {
                cardDescription = data['data'];
                return await loadTextData(skillInfo['text_name_id']);
            }).then(async function(data) {
                skillName = data['data'];
                return await loadTextData(skillInfo['text_comment_id']);
            }).then(async function(data) {
                skillDescription = data['data'];
                
                if (cardInfo['type'] == 2) {
                    return await loadPassiveBuffs(cardInfo['card_masterid']);
                } else {
                    return await loadActiveBuffs(cardInfo['card_masterid']);
                }
            }).then(async function(data) {
                if (cardInfo['type'] == 2) {
                    passiveBuffs = data;
                } else {
                    activeBuffs = data;
                }

                skillRecord['cardInfo'] = cardInfo;
                skillRecord['skillInfo'] = skillInfo;
                skillRecord['cardName'] = cardName;
                skillRecord['cardDescription'] = cardDescription;
                skillRecord['skillName'] = skillName;
                skillRecord['skillDescription'] = skillDescription;
                skillRecord['passiveBuffs'] = passiveBuffs;
                skillRecord['activeBuffs'] = activeBuffs;

                resolve(skillRecord);
            });
    });
}
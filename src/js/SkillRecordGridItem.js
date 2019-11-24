import React from 'react';
import {buildSkillRecordInfo} from './script.js';
import '../css/SkillRecordGridItem.css';

import starOn from '../img/UI_icon_status_rare_on.png';
import starOff from '../img/UI_icon_status_rare_off.png';
import cardFrame1_1 from '../img/Base_Frame/sr_base_1_1.png';
import cardFrame2_1 from '../img/Base_Frame/sr_base_2_1.png';
import cardFrame3_1 from '../img/Base_Frame/sr_base_3_1.png';
import cardFrame4_1 from '../img/Base_Frame/sr_base_4_1.png';
import cardFrame1_2 from '../img/Base_Frame/sr_base_1_2.png';
import cardFrame2_2 from '../img/Base_Frame/sr_base_2_2.png';
import cardFrame3_2 from '../img/Base_Frame/sr_base_3_2.png';
import cardFrame4_2 from '../img/Base_Frame/sr_base_4_2.png';

class SkillRecordGridItem extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            level: 1,
            cardId: props.cardId,
            skillRecord: null
        };

        buildSkillRecordInfo(props.cardId).then((data) => {
            this.initializeLevel(data);
            this.updateSkillRecord();
        });
    }

    initializeLevel(skillRecord) {
        var level = 1;
        switch (skillRecord.cardInfo.rarity) {
            case 5:
                level = 80;
                break;
            case 4:
                level = 70;
                break;
            case 3:
                level = 60;
                break;
            case 2:
                level = 50;
                break;
            case 1:
                level = 40;
                break;
            default:
                level = 1;
        }
        this.setState({ level: level });
    }

    componentWillReceiveProps(nextProps) {
        this.setState({ cardId: nextProps.cardId, });
        buildSkillRecordInfo(nextProps.cardId).then((data) => {
            this.initializeLevel(data);
            this.updateSkillRecord();
        });
    }

    async updateSkillRecord() {
        return new Promise(async (resolve, reject) => {
            var skillRecord = await buildSkillRecordInfo(this.state.cardId);
            console.log(skillRecord);
    
            var description = skillRecord.skillDescription;
            console.log(description);
    
            description = this.mapDescription(description, skillRecord, this.state.level);
            skillRecord.skillDescription = description;
    
            this.setState({
                skillRecord: skillRecord
            }, () => {
                resolve();
            });
        });
    }
    
    toggleTransform() {
        if (this.state.skillRecord.cardInfo.evolution_card_masterid > 0) {
            this.setState({ cardId: this.state.skillRecord.cardInfo.evolution_card_masterid }, () => {
                this.updateSkillRecord();
            });
        } else {
            this.setState({ cardId: this.state.skillRecord.cardInfo.base_card_masterid }, () => {
                this.updateSkillRecord();
            });
        }
    }

    mapDescription(rawDescription, skillRecord, level) {
        var description = rawDescription; // The description template containing buff tags and no values
        
        // Replace line breaks with HTML line breaks <br>
        description = description.replace(/\\n/g, '\n');

        // Immediately compute and map the skill damage multiplier
        description = description.replace('%SkillDamage%', skillRecord.skillInfo['bAtkRate'] / 100 + (level-1) + '%');

        console.log(skillRecord);
        console.log(description);

        // Get all the buff tags and store them in an array in the order that they are found
        // e.g. ["%BuffRate%", "%BuffTime%"]
        var buffTags = description.match(/\%Buff.+?\%/g);

        // If there are no buff tags, no need to map anything else
        if (buffTags == null) {
            return description;
        }

        console.log(buffTags);

        var buffs = []; // The buffs taken from buffList and stored in a Queue data structure
        var buffList = []; // Contains a reference to the buffs according to the database format
        var durations = []; // The durations of each skill record as a Queue data structure

        // If the skill record is a passive/ability-type (i.e. type == 2)
        if (skillRecord.cardInfo.type == 2) {
            buffList = skillRecord.passiveBuffs.reverse();
        } else {
            buffList = skillRecord.activeBuffs.reverse();
        }

        // Do one pass across the list of buffs and store them in a different array
        // Also store the durations of each buff
        console.log(buffList);
        for (var i = 0; i < buffList.length; i++) {
            var buff = buffList[i];
            buffs.push(buff);

            if (buff.hasOwnProperty('buff_time')) {
                durations.push(buff.buff_time);
            }
        }
        console.log(buffList);
        
        console.log(buffs.length);

        // e.g. {"%BuffRate%": "23%"}
        // The stored value is already the computed one based on level ^
        var buffMappings = {};

        // While there are still buff tags to be processed
        // Treat buffTags as a Queue data structure
        while (buffTags.length > 0) {
            var buffTag = buffTags.shift(); // Dequeue
            var value = -1; // The computed value to be added in buffMappings

            // If the buff tag is BuffTime, the value is from the durations queue
            if (buffTag.includes('BuffTime')) {
                value = durations.shift();
            } else {
                if (buffList.length <= 0) {
                    break;
                }
                var buff = buffList.shift();

                // If it has buffEffects, then the buff is from an active skill
                // Data from active and passive skills are stored differently for some reason
                if (buff.hasOwnProperty('buffEffects')) {
                    value = buff.buffEffects[0].slope * (buff.buff_level + level) + buff.buffEffects[0].intercept;
                } else {
                    value = buff.slope * level + buff.intercept;
                }

                // If the value is negative, make it positive
                // The description already has the "-" so no need for the actual value to be negative
                if (value < 0) {
                    value *= -1;
                }

                // If it's a rate/percentage, multiply by 100 and add a %
                if (buffTag.includes('BuffRate')) {
                    value = value / 100 + '%';
                }
            }

            // Store the buffTag and value in the mapping
            // e.g. {"%BuffRate%": "23%"}
            buffMappings[buffTag] = value;
        }

        // The replacement via mapping proper
        for (var tag in buffMappings) {
            console.log(tag, buffMappings[tag]);
            description = description.replace(new RegExp(tag, "g"), buffMappings[tag]);
        }

        return description;
    }

    handleChange(e) {
        this.setState({ level: e.target.value }, () => {
            this.updateSkillRecord();
        });
    }

    render() {

        if (this.state && this.state.skillRecord) {
            var stars = [];

            for (var i = 0; i < this.state.skillRecord.cardInfo.rarity; i++) {
                var star = <span key={i}><img width='25em' height='25em' src={starOn}></img></span>;
                stars.push(star);
                
                if (this.state.skillRecord.cardInfo.evolution_card_masterid > 0) {
                    stars.push(<span key={i+1}><img width='25em' height='25em' src={starOff}></img></span>);
                }
            }

            var cardImage = (
                <img src={'https://raw.githubusercontent.com/Nayuta-Kani/SAOIF-Skill-Records-Database/master/srimages/sr_icon_l_' + (this.state.skillRecord.cardInfo.evolution_card_masterid > 0 ? this.state.skillRecord.cardInfo.evolution_card_masterid : this.state.skillRecord.cardInfo.card_masterid) + '.png'}></img>
            )

            var imageSource;

            if (this.state.skillRecord.cardInfo.evolution_card_masterid == 0) {
                switch (this.state.skillRecord.cardInfo.rarity) {
                    case 2:
                        imageSource = cardFrame1_2;
                        break;
                    case 3:
                        imageSource = cardFrame2_2;
                        break;
                    case 4:
                        imageSource = cardFrame3_2;
                        break;
                    case 5:
                        imageSource = cardFrame4_2;
                        break;
                }
            } else {
                switch (this.state.skillRecord.cardInfo.rarity) {
                    case 1:
                        imageSource = cardFrame1_1;
                        break;
                    case 2:
                        imageSource = cardFrame2_1;
                        break;
                    case 3:
                        imageSource = cardFrame3_1;
                        break;
                    case 4:
                        imageSource = cardFrame4_1;
                        break;
                }
            }

            var cardBackground = <img src={imageSource}></img>;
        }

        return (
            this.state && this.state.skillRecord &&
            <div className="card">
                <div><input type="number" placeholder="Level" min="1" max="100" onChange={ this.handleChange.bind(this) } value={ this.state.level }></input></div><br></br>
                <div className="card-info">
                    <div className="card-type">
                        <span>{ this.state.skillRecord.cardInfo.type == 1 ? "Sword Skill" : "Ability" }</span>
                    </div>
                    <p className="card-title">{ this.state.skillRecord.cardName }</p>
                    <div className="card-rarity">
                        { stars }
                    </div>
                    <div className="card-img">
                        { cardBackground}
                        { cardImage }
                    </div>
                    <div className="card-details">
                        <p className="skill-name">
                            { this.state.skillRecord.skillName }
                            <span className="skill-level">Lv. { this.state.level }</span>
                        </p>
                        {/* <p className="skill-description" dangerouslySetInnerHTML={{ __html: this.state.skillRecord.skillDescription }}> */}
                        <p className="skill-description" style={{ whiteSpace: 'pre-line' }}>
                            {this.state.skillRecord.skillDescription }
                        </p>
                        <div className="card-id-text">
                            <span>#{ this.state.skillRecord.cardInfo.card_masterid }</span>
                        </div>
                    </div>
                </div>
                <div className="card-actions">
                    <button onClick={ this.toggleTransform.bind(this) }>Toggle transform</button>
                </div>
            </div>
        )
    }
}

export default SkillRecordGridItem;
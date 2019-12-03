import React from 'react';
import '../css/App.css';
import SkillRecordGridItem from './SkillRecordGridItem';
import Immutable from 'immutable';
import starOn from '../img/UI_icon_status_rare_on.png';

class App extends React.Component {
    constructor(props) {
        super(props);

        var filters = {};
        filters['rarity'] = [];
        filters['character'] = [];
        
        this.state = {
            cards: [],
            rarityFour: false,
            rarityThree: false,
            rarityTwo: false,
            rarityOne: false,
            filters: filters
        };

        // this.loadCardOptions('en').then((data) => {
        //     // this.initializeCardOptions('en');
        //     this.setState({ cards: data });
        // });
        this.loadSkillRecordData('en').then((data) => {
            // this.initializeCardOptions('en');
            this.setState({ cards: data });
        });

        this.handleChange = this.handleChange.bind(this);
    }

    handleChange(e) {
        this.setState({ selected: e.target.value });
    }

    initializeCardOptions(language) {
        var cardOptions = [];
        for (var [index, card] of this.state.cards.entries()) {
            var option = (
                <option key={ index } value={ card.evolution_card_masterid }>
                    { '#' + ++index + ' ' + card.data }
                </option>
            );
            cardOptions.push(option);
        }
        var selectedCard = this.state.cards[178].evolution_card_masterid;
        this.setState({
            selected: selectedCard,
            cardOptions: cardOptions
        });
    }

    async loadSkillRecordData(language) {
        return new Promise(function(resolve, reject) {
            fetch(`/${language}/sr`, {method: 'get'})
                .then((response) => {
                    if (response.status !== 200) {
                        console.log('Looks like there was a problem. Status Code: ' + response.status);
                        reject();
                    }
        
                    return response.json();
                }).then((data) => {
                    resolve(data);
                }).catch((err) => {
                    console.log('Fetch Error :-S', err);
                });
        });
    }
    
    async loadCardOptions(language) {
        return new Promise(function(resolve, reject) {
            fetch(`/${language}/card`, {method: 'get'})
                .then(function(response) {
                    if (response.status !== 200) {
                        console.log('Looks like there was a problem. Status Code: ' + response.status);
                        reject();
                    }
    
                    return response.json();
                }).then(function(data) {
                    resolve(data);
                }).catch(function(err) {
                    console.log('Fetch Error :-S', err);
                });
        });
    }

    filterCardOptions(cards) {
        var rarity = this.state.filters.rarity;
        var character = ['Alice'];

        return Immutable.List(cards).filter((card) => {
            var rarityFilter = true;
            var characterFilter = true;

            if (rarity.length > 0) {
                rarityFilter = rarity.some(value => card.cardData.rarity === value);
            }
            
            if (character.length > 0) {
                characterFilter = character.some(value => card.characterName === value);
            }

            return [rarityFilter, characterFilter].every(filter => filter === true);
        });
    }

    handleFilterChoice(e) {
        console.log(e.target);
        var rarity = parseInt(e.target.value);
        var filters = this.state.filters;
        if (filters.rarity.includes(rarity)) {
            filters.rarity = filters.rarity.filter(value => value !== rarity);
        } else {
            filters.rarity.push(rarity);
        }
        this.setState({ filters: filters });
    }

    render() {
        var app;

        if (this.state && this.state.cards && this.state.cards.length > 0) {
            var cardElements = this.filterCardOptions(this.state.cards);
            // console.log(cardElements);
            cardElements = cardElements.map((card) => {
                return <SkillRecordGridItem
                    key={card.cardData.card_masterid}
                    // cardId={card.evolution_masterid}
                    skillRecord={card}
                ></SkillRecordGridItem>
            })
            // .slice(0, 10);

            console.log(this.state.filters);

            var rarityFilterButtons = [];
            for (var i = 1; i < 5; i++) {
                var buttonClass = "filter-button" + (this.state.filters.rarity.includes(i) ? " active" : "");
                rarityFilterButtons.push(
                    <label key={i} className={buttonClass}>
                        {i} <img src={starOn} className="filter-star"></img>
                        <input
                            type="checkbox"
                            value={i}
                            checked={this.state.filters.rarity.includes({i})}
                            onChange={this.handleFilterChoice.bind(this)}
                        >
                        </input>
                    </label>
                );
            }

            app = (
                <div id="app">
                    <div className="filter-group">
                        {rarityFilterButtons}
                    </div>
                    <div className="card-group">
                        {cardElements}
                    </div>
                    {/* <select id="card-select" value={ this.state.selected } onChange={ this.handleChange }>
                        { this.state.cardOptions }
                    </select>
                    <br></br>
    
                    <SkillRecordGridItem id="currentCard" cardId={ this.state.selected }></SkillRecordGridItem> */}
                </div>
            );
        } else {
            app = (
                <div id="app">
                    <div id="loading-text">
                        Loading app...
                    </div>
                    <select hidden id="card-select"></select>
                </div>
            )
        }

        return app;
    }
}

export default App;
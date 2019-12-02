import React from 'react';
import '../css/App.css';
import SkillRecordGridItem from './SkillRecordGridItem';
import Immutable from 'immutable';

class App extends React.Component {
    constructor(props) {
        super(props);
        
        this.state = {
            cards: []
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
        var rarity = [4];
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

    render() {
        var app;

        if (this.state && this.state.cards) {
            var cardElements = this.filterCardOptions(this.state.cards);
            cardElements = cardElements.map((card) => {
                return <SkillRecordGridItem
                    key={card.card_masterid}
                    // cardId={card.evolution_masterid}
                    skillRecord={card}
                ></SkillRecordGridItem>
            })
            // .slice(0, 10);

            app = (
                <div id="app">
                    <div>
                        <span className="filter-button">
                            <label>
                                4*
                                <input type="checkbox"></input>
                            </label>
                        </span>
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
                    Loading app...
                    <select hidden id="card-select"></select>
                </div>
            )
        }

        return app;
    }
}

export default App;
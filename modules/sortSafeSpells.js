const sortSafeSpells = {
    module: async (api) => {
        const mod = await api.registerModule(
            'sortSafeSpells',
            'Safe Spellgem Sorter',
            'local',
            'Sort Spellgems in Faction Safe.',
        );

        const sortSafeSpells = async () => {
            const safeSpellButton = document.querySelector('form[name="footlockergrab"] input[value^="Retrieve Spell"]');
            if (!safeSpellButton) {
                mod.debug('Retrieve Spell From Safe button not found.');
                return;
            }
            const safeSpellSelect = safeSpellButton.parentNode.querySelector('select');

            const displayLeastCharged = await mod.getSetting('show-least-charged')

            const mostCharged = {};
            const leastCharged = {};
            const notCharged = {};

            // Spellgems display as either
            // Acrid Vapors - Small Tan Gem, (2 charges) (1)
            // Acrid Vapors - Small Gem, (2 charges) (1)

            const SpellgemTextRegExp = /^(?<spell>.*) - Small( \w*)? Gem, \((?<charges>\d) charges\) \((?<amount>\d)\)$/;
            Array.from(safeSpellSelect.options).forEach(opt => {
                const { groups: groups } = SpellgemTextRegExp.exec(opt.text);
                const spell = groups.spell;
                const charges = parseInt(groups.charges);
                const amount = parseInt(groups.amount);

                if (charges > 0) {
                    if (!(spell in mostCharged)) {
                        mostCharged[spell] = { id: opt.value, charges: charges, amount: amount }
                    } else {
                        if (mostCharged[spell].charges < charges) {
                            mostCharged[spell] = { id: opt.value, charges: charges, amount: mostCharged[spell].amount + amount }
                        } else {
                            mostCharged[spell].amount += amount;
                        }
                    }

                    if (displayLeastCharged) {
                        if (!(spell in leastCharged)) {
                            leastCharged[spell] = { id: opt.value, charges: charges, amount: amount }
                        } else {
                            if (leastCharged[spell].charges > charges) {
                                leastCharged[spell] = { id: opt.value, charges: charges, amount: leastCharged[spell].amount + amount }
                            } else {
                                leastCharged[spell].amount += amount;
                            }
                        }
                    }
                } else {
                    if (!(spell in notCharged)) {
                        notCharged[spell] = { id: opt.value, charges: charges, amount: amount }
                    } else {
                        notCharged[spell].amount += amount;
                    }
                }
            });

            safeSpellSelect.innerHTML = '';

            const displayedGroups = [];
            displayedGroups.push([mostCharged, 'Most Charged Spellgems', '#75BFF0']);
            if (displayLeastCharged) {
                displayedGroups.push([leastCharged, 'Least Charged Spellgems', '#B6DDF7']);
            }
            displayedGroups.push([notCharged, 'Discharged Spellgems', '#F6FBFE']);
            displayedGroups.forEach(([spellgems, groupName, groupColor]) => {
                const group = safeSpellSelect.appendChild(document.createElement('optgroup'));
                group.label = groupName;
                group.style.backgroundColor = groupColor;
                Object.entries(spellgems).forEach(([spell, { id: id, charges: charges, amount: amount }]) => {
                    group.appendChild(new Option(`${spell} (${charges} charges) (${amount})`, id));
                });
            });
            safeSpellSelect.selectedIndex = 0;
        }

        await mod.registerSetting(
            'checkbox',
            'show-least-charged',
            'Display Least Charged spellgems',
            ''
        );

        await mod.registerMethod(
            'async',
            sortSafeSpells
        );
    }
}

const noTargetAllies = {
    module: async (api) => {
        const mod = await api.registerModule(
            'noTargetAllies',
            'No Targeting Allies',
            'local',
            'Allows disabling targeting factionmates/allies/friendlies on the attack selection box.',
        );

        const filteredDropdown = (oldDropdown, dict, filter, optFilterCallback) => {
            const newDropdown = oldDropdown.cloneNode(false);
            const selected = oldDropdown.options[oldDropdown.selectedIndex];
            let selectIndex = 0;

            for (const opt of [...oldDropdown.options]) {
                if (optFilterCallback && optFilterCallback(opt)) continue;
                const value = Number(opt.value);
                switch (dict[value]) {
                    case 'faction':
                        if (!filter.faction) newDropdown.options.add(opt);
                        else continue;
                        break;
                    case 'ally':
                        if (!filter.ally) newDropdown.options.add(opt);
                        else continue;
                        break;
                    case 'friendly':
                        if (!filter.friendly) newDropdown.options.add(opt);
                        else continue;
                        break;
                    case 'enemy':
                        if (!filter.enemy) newDropdown.options.add(opt);
                        else continue;
                        break;
                    case 'hostile':
                        if (!filter.hostile) newDropdown.options.add(opt);
                        else continue;
                        break;
                    default:
                        if (!filter.other) newDropdown.options.add(opt);
                        else continue;
                        break;
                }
                if (opt === selected) selectIndex = newDropdown.length - 1;
            }
            newDropdown.selectedIndex = selectIndex;

            return newDropdown;
        }

        const noTargetAllies = async () => {
            const combatTargetDropdown = document.getElementById('combat_target_id');
            const petTargetDropdown = document.getElementById('pet_target_id');

            const charList = document.querySelector('#OccupantsDescription .charListArea');
            const charListLinks = charList.querySelectorAll('[onclick^="SelectItem"],[href^="javascript:SelectItem"]');
            const charPoliticsDict = {};
            const charNameToId = {};
            const SMDict = {};
            for (const link of charListLinks) {
                const selectItem = link.href ? link.href : link.onclick;
                const charId = Number(selectItem.toString().match(/\d+/)[0]);
                const containsPolitics = (classList, politics) => (classList.contains(politics) || classList.contains(`politics-${politics}`));
                let charPolitics = 'other';
                const possiblePolitics = ['faction', 'ally', 'friendly', 'enemy', 'hostile'];
                for (const politics of possiblePolitics) {
                    if (containsPolitics(link.classList, politics)) {
                        charPolitics = politics;
                        break;
                    }
                }
                charPoliticsDict[charId] = charPolitics;
                const SMitem = charList.querySelector(`img[title^="${link.textContent.trim()}"][title*="Sorcerers Might"]`) || link.parentElement.querySelector(`.status-tag[title^="Sorcerer's Might"`);
                if (SMitem) {
                    const SMtime = Number(SMitem.title.match(/(\d+) minutes/)[1]);
                    SMDict[charId] = SMtime;
                }
            }

            if (!combatTargetDropdown) {
                mod.debug('No combat target dropdown found');
            } else {
                const combatTargetFilter = {
                    faction: await mod.getSetting('no-target-faction'),
                    ally: await mod.getSetting('no-target-allies'),
                    friend: await mod.getSetting('no-target-friendlies'),
                    enemy: await mod.getSetting('no-target-enemies'),
                    hostile: await mod.getSetting('no-target-hostiles'),
                    other: await mod.getSetting('no-target-others'),
                };
                const noTargetPets = await mod.getSetting('no-target-pets');

                const newCombatDropdown = filteredDropdown(combatTargetDropdown, charPoliticsDict, combatTargetFilter);
                combatTargetDropdown.parentNode.replaceChild(newCombatDropdown, combatTargetDropdown);

                if (noTargetPets && petTargetDropdown) {
                    const petList = document.querySelector('#OccupantsDescription .petListArea');
                    const petListLinks = petList.querySelectorAll('[href^="javascript:SelectItem"]');
                    const petPoliticsDict = {};
                    const petNameToId = {};
                    for (const link of petListLinks) {
                        const selectItem = link.href;
                        const petId = Number(selectItem.toString().match(/\d+/)[0]);
                        let petPolitics = link.className;
                        petPolitics = petPolitics ? petPolitics : 'other';
                        petPoliticsDict[petId] = petPolitics;
                    }

                    const newPetDropdown = filteredDropdown(petTargetDropdown, petPoliticsDict, combatTargetFilter);
                    petTargetDropdown.parentNode.replaceChild(newPetDropdown, petTargetDropdown);
                }
            }

            const healTargetDropdowns = [];
            const healDropdownSelectors = [
                'form[name="FAKHeal"] select[name="target_id"]',
                'form[name="Surgery"] select[name="target_id"]',
                'form[name="Heal Others"] select[name="target_id"]',
                'form[name="Energize"] select[name="target_id"]',
            ];
            for (const selector of healDropdownSelectors) {
                const dropdown = document.querySelector(selector);
                if (dropdown) healTargetDropdowns.push(dropdown);
            }
            if (healTargetDropdowns.length === 0) {
                mod.debug('No heal target dropdown found');
            } else {

                const healTargetFilter = {
                    faction: await mod.getSetting('no-heal-faction'),
                    ally: await mod.getSetting('no-heal-allies'),
                    friend: await mod.getSetting('no-heal-friendlies'),
                    enemy: await mod.getSetting('no-heal-enemies'),
                    hostile: await mod.getSetting('no-heal-hostiles'),
                    other: await mod.getSetting('no-heal-others'),
                };
                const ht = await mod.getSetting('healing-threshold')
                const healingThreshold = Number(ht) ? Number(ht) : 0;
                const noHealSM = await mod.getSetting('no-heal-SM');
                const healFilterCallback = (opt) => {
                    const charId = Number(opt.value);
                    if (healingThreshold > 0) { // If there's a healing threshold
                        const matchHP = opt.textContent.match(/\((?<currHP>\d+)\/(?<maxHP>\d+) HP\)/);
                        if (matchHP) { // If we can read a target's HP
                            // If the target is missing less health than the threshold
                            // Then skip target from healing dropdown
                            if (Number(matchHP.groups.maxHP) - Number(matchHP.groups.currHP) < healingThreshold) return true;
                        }
                    }
                    if (charId in SMDict) {
                        if (noHealSM) return true;
                        opt.textContent += ` (SM ${SMDict[charId]})`;
                    }
                    return false;
                };

                for (const healTargetDropdown of healTargetDropdowns) {
                    const newHealDropdown = filteredDropdown(healTargetDropdown, charPoliticsDict, healTargetFilter, healFilterCallback);
                    healTargetDropdown.parentNode.replaceChild(newHealDropdown, healTargetDropdown);
                }
            }

            const miscTargetDropdowns = [];
            const miscDropdownSelectors = [
                'form[name="give"] select[name="target_id"]',
            ];
            for (const selector of miscDropdownSelectors) {
                const dropdown = document.querySelector(selector);
                if (dropdown) miscTargetDropdowns.push(dropdown);
            }
            if (miscTargetDropdowns.length === 0) {
                mod.debug('No misc target dropdown found');
            } else {
                const miscTargetFilter = {
                    faction: await mod.getSetting('no-misc-faction'),
                    ally: await mod.getSetting('no-misc-allies'),
                    friend: await mod.getSetting('no-misc-friendlies'),
                    enemy: await mod.getSetting('no-misc-enemies'),
                    hostile: await mod.getSetting('no-misc-hostiles'),
                    other: await mod.getSetting('no-misc-others'),
                };

                for (const miscTargetDropdown of miscTargetDropdowns) {
                    miscTargetDropdown.innerHTML = filteredDropdown(miscTargetDropdown, charPoliticsDict, miscTargetFilter).innerHTML;
                }
            }
        }

        // Combat settings
        await mod.registerSetting(
            'checkbox',
            'no-target-faction',
            'Prevent Targeting Factionmates',
            ''
        );
        await mod.registerSetting(
            'checkbox',
            'no-target-allies',
            'Prevent Targeting Allies',
            ''
        );
        await mod.registerSetting(
            'checkbox',
            'no-target-friendlies',
            'Prevent Targeting Friendlies',
            ''
        );
        await mod.registerSetting(
            'checkbox',
            'no-target-enemies',
            'Prevent Targeting Enemies',
            ''
        );
        await mod.registerSetting(
            'checkbox',
            'no-target-hostiles',
            'Prevent Targeting Hostiles',
            ''
        );
        await mod.registerSetting(
            'checkbox',
            'no-target-others',
            'Prevent Targeting Others',
            ''
        );

        await mod.registerSetting(
            'checkbox',
            'no-target-pets',
            'Apply to Pet dropdown',
            ''
        );

        // Heal settings
        await mod.registerSetting(
            'checkbox',
            'no-heal-faction',
            'Prevent Healing Factionmates',
            ''
        );
        await mod.registerSetting(
            'checkbox',
            'no-heal-allies',
            'Prevent Healing Allies',
            ''
        );
        await mod.registerSetting(
            'checkbox',
            'no-heal-friendlies',
            'Prevent Healing Friendlies',
            ''
        );
        await mod.registerSetting(
            'checkbox',
            'no-heal-enemies',
            'Prevent Healing Enemies',
            ''
        );
        await mod.registerSetting(
            'checkbox',
            'no-heal-hostiles',
            'Prevent Healing Hostiles',
            ''
        );
        await mod.registerSetting(
            'checkbox',
            'no-heal-others',
            'Prevent Healing Others',
            ''
        );
        await mod.registerSetting(
            'textfield',
            'healing-threshold',
            'Healing Threshold',
            'Characters missing less than this much HP won\'t be shown on healing dropdowns.'
        );
        await mod.registerSetting(
            'checkbox',
            'no-heal-SM',
            'No SM Healing',
            'Characters under SM effects won\'t be shown on healing dropdowns.'
        );

        // Give settings
        await mod.registerSetting(
            'checkbox',
            'no-misc-faction',
            'Prevent Giving Items To Factionmates',
            ''
        );
        await mod.registerSetting(
            'checkbox',
            'no-misc-allies',
            'Prevent Giving Items To Allies',
            ''
        );
        await mod.registerSetting(
            'checkbox',
            'no-misc-friendlies',
            'Prevent Giving Items To Friendlies',
            ''
        );
        await mod.registerSetting(
            'checkbox',
            'no-misc-enemies',
            'Prevent Giving Items To Enemies',
            ''
        );
        await mod.registerSetting(
            'checkbox',
            'no-misc-hostiles',
            'Prevent Giving Items To Hostiles',
            ''
        );
        await mod.registerSetting(
            'checkbox',
            'no-misc-others',
            'Prevent Giving Items To Others',
            ''
        );

        await mod.registerMethod(
            'async',
            noTargetAllies
        );
    }
}

const betterFactionPage = {
    module: async (api) => {
        const mod = await api.registerModule(
            'betterFactionPage',
            'Better Faction Page',
            'global',
            'Displays the faction\'s roster and politics directly on the main faction\'s page.',
        );

        const betterFactionPage = () => {
			const factionIDmatch = window.location.search.match(/\?op=faction%do=view&id=(\d*)/);
            if (!factionIDmatch) {
                mod.debug('Not on a faction\'s page');
                return;
            }
			factionID = factionIDmatch[1];
			
            const roster = document.createElement('div');
			const politics = document.createElement('div');

			roster.innerHTML = `
				<iframe
					style='border: 0px; width: 45%; height: 400px;'
					src='/clash.php?op=faction&do=roster&faction_id=${factionID}'
					onload='
						let fetchRoster = this.contentWindow.document.body.querySelector(".content>table");
						this.contentWindow.document.body.innerHTML = "";
						this.replaceWith(fetchRoster);
					'
					hidden=true
				>
				</iframe>
			`;
			politics.innerHTML = `
				<iframe
					style='border: 0px; width: 45%; height: 400px;'
					src='/clash.php?op=faction&do=politics&faction_id=${factionID}'
					onload='
						let fetchPolitics = this.contentWindow.document.body.querySelectorAll(".content>p");
						this.contentWindow.document.body.innerHTML = "";
						this.replaceWith(fetchPolitics[0], fetchPolitics[1]);
					'
					hidden=true
				>
				</iframe>
			`;

			roster.insertBefore(document.createElement('h2'), roster.firstElementChild).innerHTML = '<b>Roster</b>';
			roster.className = 'content';
			roster.style.display = 'inline-block';
			roster.style.width = '50%';
			roster.style.verticalAlign = 'top';

			politics.insertBefore(document.createElement('h2'), politics.firstElementChild).innerHTML = '<b>Faction Politics</b>';
			politics.className = 'content';
			politics.style.display = 'inline-block';
			politics.style.width = '50%';
			politics.style.verticalAlign = 'top';

			document.body.querySelector('form[name="roster"]').replaceWith(roster);
			document.body.querySelector('form[name="roster"]').replaceWith(politics);
        }

        await mod.registerMethod(
            'sync',
            betterFactionPage
        );
    }
}

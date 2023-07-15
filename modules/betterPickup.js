const betterPickup = {
    module: async (api) => {
        const mod = await api.registerModule(
            'betterPickup',
            'Better Pickup Dropdown',
            'global',
            'Sorts and condenses the pickup dropdown.',
        );

		const SortAndGroupPickup = (PickupDropdown) => {
			const temp = Array.from(PickupDropdown.options).map(option => {
				return {
					text: option.text,
					value: option.value,
					count: 1
				};
			}).sort((A, B) =>
				A.text.localeCompare(B.text)
			).filter((option, index, array) => {
				if (index == 0 || option.text != array[index-1].text) {
					option.count = array.filter(same => same.text == option.text).length;
					return true;
				}
				else {
					return false;
				}
			});
			
			PickupDropdown.length = 0;
			
			temp.forEach(option => {
				PickupDropdown.add(new Option(
					option.count == 1 ? option.text : `${option.text} (${option.count})`,
					option.value
				));
			});
			
			return PickupDropdown;
		};
		
		const BetterPickup = () => {
            'use strict';
            const pickupSelect = document.querySelector('form[name="pickup"]>select[name="item"]');
            if (pickupSelect) SortAndGroupPickup(pickupSelect);
            else mod.debug('No Pickup Pane found');
        }

        await mod.registerMethod(
            'sync',
            BetterPickup
        );
	}
}

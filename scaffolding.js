// object constructor for the API and Scaffolding
// Call once, at the beginning of the userscript
function NexusTweaksScaffolding(scriptId, scriptName, scriptLink, scriptVersion) {
  'use strict';
  // GM.info refers to the caller's metadata block instead of this script's - at least, that's how it works on TM for Chrome
  // Given how GM does apparently ignore the metadata block on @require scripts, it could possibly be removed
  // Leaving it here for backwards-compatibility, in case any scripts need it
  this.version = `${GM.info.script.version}`;
  this.APIversion = '999.api.21.1';
  this.APIname = 'Nexus Tweaks API & Scaffolding';
  this.APIhomepage = 'https://github.com/Argavyon/nexus-clash-interface-tweaks/tree/preview';
  // logs to console; can disable if you want
  this.logging = true;
  // verbose logging, set true for dev-work
  this.verbose = true;


  this.log = async (message) => {
    if (this.logging) {
      console.log(`[Nexus-Tweaks-${this.APIversion}]:  ${message}`);
    }
  }


  this.debug = async (message) => {
    if (this.verbose) {
      await this.log(message);
    }
  }


  this.error = async (message) => {
    console.error(`[Nexus-Tweaks-${this.APIversion}]:  ${message}`);
  }


  // CSS
  this.addGlobalStyle = async (url) => {
    // injects a resource link into the global style sheet
    const head = document.getElementsByTagName('head')[0];
    if (!head) {
      this.error('addGlobalStyle failed to find the document head');
      return;
    }
    const style = document.createElement('link');
    style.setAttribute('type', 'text/css');
    style.setAttribute('rel', 'stylesheet');
    style.setAttribute('href', url);
    head.appendChild(style);
  }

  // Add scaffolding CSS here
  (async () => { this.addGlobalStyle(await GM.getResourceUrl('scaffoldingCSS')); } )();


  // true if a character is logged into the game module
  // used to determine whether the local scripts can run
  this.inGame = false;


  // Character Info
  this.charinfo = {
    'level':null,
    'class':null,
    'id':null,
    'ap':null,
    'mp':null,
    'hp':null,
    'div':null,
  };


  // Nexus Tweaks Promises: will only run after all promises complete
  this.promises = [];
  this.runCalled = false;


  function getDeferredPromise() {
    let res, rej;
    const p = new Promise(
      (resolve, reject) => { res = resolve; rej = reject; }
    );
    p.resolve = res;
    p.reject = rej;
    return p;
  }


  this.registerPromise = () => {
    const promise = getDeferredPromise();
    this.promises.push(promise);
    return promise
  }


  // Nexus Tweaks Modules
  this.modules = [];


  this.registerModule = async (id, name, type, description) => {
    const mod = new NexusTweaksModule(this, id, name, type, description);
    this.modules.push(mod);
    this.debug(`Registered module ${mod.name}`);
    return mod
  }


  const addToRow = async (tdid, element) => {
    const td = document.getElementById(`nexus-tweaks-setting-${tdid}`);
    if (!td) {
      this.error(`addToRow failed to find settingsRow with <td>.id ${tdid}`);
      return;
    }
    const tempspan = document.createElement('span');
    tempspan.className = 'nexus-tweaks-settingspan';
    tempspan.appendChild(element);
    td.appendChild(tempspan);
    td.appendChild(document.createElement('br'));
  }


  const createSettingsRow = async (settingTable, mod, isOdd) => {
    const settingsRow = document.createElement('tr');
    settingsRow.className = 'nexus-tweaks-settingrow';
    const settingTitle = document.createElement('td');
    settingTitle.className = 'nexus-tweaks-settingname';
    settingTitle.appendChild(await mod.getModuleEnableElement());
    const settingList = document.createElement('td');
    settingList.className = 'nexus-tweaks-settinglist';
    settingList.id = `nexus-tweaks-setting-${mod.id}`;
    settingsRow.appendChild(settingTitle);
    settingsRow.appendChild(settingList);
    settingTable.appendChild(settingsRow);

    settingsRow.classList.add(isOdd ? 'odd-row' : 'even-row');
  }


  const addModSettings = async (settingsTable) => {
	// Add a white row between different userscript setting panes
	settingsTable.appendChild(document.createElement('tr')).appendChild(document.createElement('br'));
	
	const modSettingsTB = settingsTable.appendChild(document.createElement('tbody'));
	modSettingsTB.id = `nexus-tweaks-settings-${scriptId}`;
    const modSettingsTD = modSettingsTB.appendChild(document.createElement('tr')).appendChild(document.createElement('td'));
    modSettingsTD.colSpan = 2;
    modSettingsTD.style.padding = '0px';
    const modSettingsTable = modSettingsTD.appendChild(document.createElement('table'));

    const modSettingsTHeader = modSettingsTable.appendChild(document.createElement('tr'));
    modSettingsTHeader.className = 'nexus-tweaks-settingheader';
    const modLink = modSettingsTHeader.appendChild(document.createElement('td')).appendChild(document.createElement('a'));
    modLink.textContent = scriptName;
    modLink.href = scriptLink;
    const modVer = modSettingsTHeader.appendChild(document.createElement('td'));
    modVer.textContent = `Version ${scriptVersion}`;

    const modSettingsTBody = modSettingsTable.appendChild(document.createElement('tbody'));
    let isOdd = true;
    for (const nexusTweaksMod of this.modules) {
      await createSettingsRow(modSettingsTBody, nexusTweaksMod, isOdd);
      isOdd = !isOdd;
      const settingElements = await nexusTweaksMod.getSettingElements();
      for (const setElem of settingElements) {
        await addToRow(nexusTweaksMod.id, setElem);
      }
    }
  }


  const createSettingsPane = async (table) => {
    table.appendChild(document.createElement('tr'));
    table.lastElementChild.appendChild(document.createElement('td'));

    const temptable = document.createElement('table');
    temptable.id = 'nexus-tweaks-settingtable';
    temptable.className = 'nexus-tweaks-settingtable';
    temptable.appendChild(document.createElement('tbody'));
	temptable.lastChild.id = 'nexus-tweaks-settings-API';

    const link = document.createElement('a');
    link.href = this.APIhomepage;
    link.textContent = this.APIname;

    const verspan = document.createElement('span');
    verspan.appendChild(document.createTextNode(`Version ${this.APIversion}`));

    const temptablerow = document.createElement('tr');
    temptablerow.className = 'nexus-tweaks-settingheader';
    temptablerow.appendChild(document.createElement('td'));
    temptablerow.lastElementChild.className = 'nexus-tweaks-settingname';
    temptablerow.lastElementChild.appendChild(link);
    temptablerow.appendChild(document.createElement('td'));
    temptablerow.lastElementChild.className = 'nexus-tweaks-settinglist';
    temptablerow.lastElementChild.appendChild(verspan);

    const temptablerow2 = document.createElement('tr');
    temptablerow2.className = 'nexus-tweaks-settingrow odd-row';
    const settingsStyleLabel = temptablerow2.appendChild(document.createElement('td'));
    settingsStyleLabel.textContent = 'Settings Pane Style';
    const settingsStyleSelect = temptablerow2.appendChild(document.createElement('td')).appendChild(document.createElement('select'));
    settingsStyleSelect.id = 'nexus-tweaks-settingstyle';
    const defaultStyleOpt = settingsStyleSelect.appendChild(document.createElement('option'));
    defaultStyleOpt.value = '';
    defaultStyleOpt.textContent = 'Default';
    const argRevampedStyleOpt = settingsStyleSelect.appendChild(document.createElement('option'));
    argRevampedStyleOpt.value = 'argavyon-revamped';
    argRevampedStyleOpt.textContent = 'Argavyon\'s Revamped';
    const selectedStyle = await GM.getValue('nexus-tweaks-settingStyle');
    settingsStyleSelect.value = selectedStyle;
    temptable.className = 'nexus-tweaks-settingtable ' + selectedStyle;
    settingsStyleSelect.onchange = async function() {
      temptable.className = 'nexus-tweaks-settingtable ' + this.value;
      GM.setValue('nexus-tweaks-settingStyle', this.value);
    }

    temptable.lastElementChild.appendChild(temptablerow);
    temptable.lastElementChild.appendChild(temptablerow2);
    table.lastElementChild.lastElementChild.appendChild(temptable);
  }


  const createSettingsButton = () => {
    const sidebar = document.getElementById('sidebar-menu');
    if (!sidebar) {
      this.debug('No sidebar detected');
      return;
    }
    let SettingsTabButton = document.getElementById('nexus-tweaks-settings-button');
    if (SettingsTabButton) {
      this.debug('Settings button already exists');
    } else {
      SettingsTabButton = sidebar.firstElementChild.firstElementChild.appendChild(document.createElement('td')).appendChild(document.createElement('input'));
      SettingsTabButton.id = 'nexus-tweaks-settings-button';
      SettingsTabButton.value = 'Nexus Tweaks';
      SettingsTabButton.type = 'button';
      SettingsTabButton.onclick = async function() {
        const mainRightTBody = document.getElementById('main-right').firstElementChild.firstElementChild;
        while (mainRightTBody.children[2]) mainRightTBody.removeChild(mainRightTBody.children[2]); // Clear the right pane under the tab buttons
        await createSettingsPane(mainRightTBody); // It's important to synchronize this, as it creates the table for mod settings
        let nextPaneButton = this.parentNode.firstElementChild;
        while (nextPaneButton) {
          if (nextPaneButton.id !== SettingsTabButton.id) nextPaneButton.click();
          nextPaneButton = nextPaneButton.nextSibling;
        }
      }
    }
    const ModSettingsButton = SettingsTabButton.parentNode.appendChild(document.createElement('input'));
    ModSettingsButton.hidden = true;
    ModSettingsButton.onclick = function () {
      const mainRightTBody = document.getElementById('main-right').firstElementChild.firstElementChild;
      addModSettings(document.getElementById('nexus-tweaks-settingtable'));
    }
  }


  this.runNexusTweaks = async () => {
    if (this.runCalled) {
      this.log('runNexusTweaks has already been called. Preventing duplicate run.');
      return
    }
    this.runCalled = true;
    // wait for module registration promises
    await Promise.all(this.promises);

    for (const nexusTweaksMod of this.modules) {
      if (await nexusTweaksMod.isEnabled() !== true) { continue; }
      try {
        this.debug(`Running (sync) module [${nexusTweaksMod.name}]`);
        await nexusTweaksMod.runSync();
      } catch (err) {
        this.error(`Error while (sync) running ${nexusTweaksMod.name}: ${err.message}`);
      }
    }

    await createSettingsButton();

    const mapRunAsync = async (nexusTweaksMod) => {
      if (!await nexusTweaksMod.isEnabled()) { return; }
      try {
        this.debug(`Running (async) module [${nexusTweaksMod.name}]`);
        await nexusTweaksMod.runAsync();
      } catch (err) {
        this.error(`Error while (async) running ${nexusTweaksMod.name}: ${err.message}`);
      }
    }
    const asyncPromises = this.modules.map(mapRunAsync);
    await Promise.all(asyncPromises);
  }


  // Character Info Parsing
  (() => {
    try {
      if (!document.getElementById('CharacterInfo')) { return; }
      // used to determine if script can safely run without errors
      this.inGame = true;
      this.charinfo.div = document.getElementById('CharacterInfo');
      this.charinfo.id = this.charinfo.div.getElementsByTagName('a')[0].href.match(/character&id=(\d+)$/)[1];

      const levelclass = this.charinfo.div.getElementsByTagName('td')[2];
      const levelclassdata = /Level ([0-9]{1,3}) (.+)/.exec(levelclass.innerHTML);
      this.charinfo.level = levelclassdata[1];
      this.charinfo.class = levelclassdata[2];

      const statParser = (div, title) => {
        try {
          const node = document.evaluate(
            `//td/a[contains(@title, "${title}")]`,
            div, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null
          ).snapshotItem(0);
          let matchResult = node.title.match(new RegExp(`^You have (\\d+) of \\d+ ${title}`));
          if (matchResult) {
            return matchResult[1];
          }
        } catch (err) {
          this.log(`Charinfo Parse ${match} error: ${err.message}`);
        }
        return null;
      }

      this.charinfo.ap = statParser(this.charinfo.div, 'Action Points');
      this.charinfo.hp = statParser(this.charinfo.div, 'Hit Points');
      this.charinfo.mp = statParser(this.charinfo.div, 'Magic Points');
    } catch (err) {
      this.error(`Error in getCharacterInfo: ${err.message}`);
    }
  })();


  this.getSetting = async (settingName, def=undefined) => {
    const value = await GM.getValue(settingName);
    if (typeof value !== 'undefined') {
      return JSON.parse(value)
    }
    return def
  }


  this.setSetting = async (settingName, value) => {
    return await GM.setValue(settingName, JSON.stringify(value));
  }


  const getLocalSettingName = (settingName) => {
    return `${scriptId}-${this.charinfo.id}-${settingName}`;
  }


  const getGlobalSettingName = (settingName) => {
    return `${scriptId}-global-${settingName}`;
  }


  this.getLocalSetting = async (settingName, def) => {
    if (!this.inGame || typeof this.charinfo.id === 'undefined') {
      this.error('getLocalSetting: not in game, no character ID');
      return undefined;
    }
    return await this.getSetting(getLocalSettingName(settingName), def);
  }


  this.getGlobalSetting = async (settingName, def) => {
    return await this.getSetting(getGlobalSettingName(settingName), def);
  }


  this.setLocalSetting = async (settingName, value) => {
    if (!this.inGame || typeof this.charinfo.id === 'undefined') {
      this.error('setLocalSetting: not in game, no character ID');
      return undefined;
    }
    return await this.setSetting(getLocalSettingName(settingName), value);
  }


  this.setGlobalSetting = async (settingName, value) => {
    return await this.setSetting(getGlobalSettingName(settingName), value);
  }
}


// object constructor representing a module-specific setting
function NexusTweaksSetting(API, settingType, id, name, description, extras) {
  if (['checkbox', 'select', 'textfield'].indexOf(settingType) === -1) {
    API.error(`Error constructing NexusTweaksSetting ${id}: Unrecognised type ${settingType}`);
  }
  this.settingType = settingType;
  this.id = id;
  this.name = name;
  this.description = description;
  this.extras = extras;


  const getCheckbox = async (mod) => {
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    if (await mod.getSetting(this.id) === true) { checkbox.checked = true; }
    else { checkbox.checked = false; }
    checkbox.title = this.description;
    checkbox.id = `${mod.id}-${this.id}`;
    checkbox.addEventListener('click', mod.getCheckboxListener(this.id), false);
    return checkbox;
  }


  const getSelect = async (mod) => {
    const select = document.createElement('select');
    select.title = this.description;
    select.id = `${mod.id}-${this.id}`;
    const setting = await mod.getSetting(this.id);
    let sidx = 0, i = 0;
    for (const opt of this.extras) {
      if (opt.value === setting) {
        // set initial index of select to stored option
        sidx = i;
      }
      i++;
      let option = document.createElement('option');
      option.value = opt.value;
      option.text = opt.text;
      select.add(option);
    }
    select.selectedIndex = sidx;
    select.addEventListener('change', mod.getSelectListener(this.id), false);
    return select;
  }


  const getTextfield = async (mod) => {
    const textfield = document.createElement('input');
    textfield.type = 'text';
    textfield.setAttribute('maxlength', 10);
    textfield.setAttribute('size', 10);
    const initValue = await mod.getSetting(this.id);
    if (initValue !== undefined) {
      textfield.value = initValue;
    }
    textfield.title = this.description;
    textfield.id = `${mod.id}-${this.id}`;
    textfield.addEventListener('input', mod.getTextfieldListener(this.id), false);
    return textfield;
  }


  this.getSettingsRowElement = async (mod) => {
    const tempspan = document.createElement('span');
    tempspan.className = 'nexus-tweaks-settingspan';
    tempspan.appendChild(document.createTextNode(this.name));
    const elemFuncs = {
      'checkbox': getCheckbox,
      'select': getSelect,
      'textfield': getTextfield,
    };
    if (!elemFuncs.hasOwnProperty(this.settingType)) {
      mod.error(`getSettingsRowElement failed with unknown type ${this.settingType}`);
      return null
    }
    tempspan.appendChild(await elemFuncs[this.settingType](mod));
    return tempspan;
  }
}


// object constructor representing a script module, which is passed in to any methods registered with it
function NexusTweaksModule(API, id, name, localType, description) {
  if (['global', 'local'].indexOf(localType) === -1) {
    API.error(`Error constructing NexusTweaksModule ${id}: Unrecognised type ${localType}`);
    return
  }
  this.id = id;
  this.name = name;
  this.description = description;
  this.localType = localType
  this.settings = [];
  this.syncMethods = [];
  this.asyncMethods = [];

  this.log = async (message) => { await API.log(`[${this.id}] ${message}`); }
  this.debug = async (message) => { await API.debug(`[${this.id}] ${message}`); }
  this.error = async (message) => { await API.error(`[${this.id}] ${message}`); }


  this.getValue = this.getSetting = async (key, def) => {
    key = `${this.id}-${key}`;
    if (this.localType === 'global') {
      return await API.getGlobalSetting(key, def);
    }
    return await API.getLocalSetting(key, def);
  }


  this.setValue = this.setSetting = async (key, value) => {
    key = `${this.id}-${key}`;
    if (this.localType === 'global') {
      return await API.setGlobalSetting(key, value);
    }
    return await API.setLocalSetting(key, value);
  }


  this.getCheckboxListener = (id) => {
    return async (e) => {
      this.log(`Toggled ${id} to ${e.target.checked}`);
      await this.setSetting(id, e.target.checked);
    }
  }


  this.getTextfieldListener = (id) => {
    return async (e) => {
      this.log(`Set ${id} to ${e.target.value}`);
      await this.setSetting(id, e.target.value);
    }
  }


  this.getSelectListener = (id) => {
    return async (e) => {
      this.log(`Set ${id} to ${e.target.options[e.target.selectedIndex].value}`);
      await this.setSetting(id, e.target.options[e.target.selectedIndex].value);
    }
  }


  this.registerSetting = async (type, id, name, desc, extra=null) => {
    // if type is select, extra must be list of objects with properties 'value' and 'text'
    // corresponding to option value and display text
    const setting = new NexusTweaksSetting(API, type, id, name, desc, extra);
    this.settings.push(setting);
    return setting
  }


  this.getSettingElements = async () => {
    const elementPromises = this.settings.map( async (nexusTweaksSet) => {
      return await nexusTweaksSet.getSettingsRowElement(this);
    });
    const resultElements = [];
    for (const elementPromise of elementPromises) {
      resultElements.push(await elementPromise);
    }
    return resultElements
  }


  this.registerMethod = async (type, method) => {
    if (type === 'sync') {
      this.syncMethods.push(method);
    } else if (type === 'async') {
      this.asyncMethods.push(method);
    } else {
      this.error(`Unrecognised type ${type} during registerMethod`);
    }
    return this
  }


  this.getModuleEnableElement = async () => {
    const moduleEnableSetting = new NexusTweaksSetting(
      API, 'checkbox', 'module_enabled', this.name, this.description, null
    );
    return await moduleEnableSetting.getSettingsRowElement(this);
  }


  this.isEnabled = async () => {
    if (this.localType === 'local' && !API.inGame) {
      return false;
    }
    return await this.getSetting('module_enabled');
  }


  this.runSync = async () => {
    try {
      for (const method of this.syncMethods) {
        await method(this);
      }
    } catch (err) {
      this.error(`runSync error: ${err}`);
    }
  }


  this.runAsync = async () => {
    try {
      const runPromises = this.asyncMethods.map((method) => { method(this); });
      await Promise.all(runPromises);
    } catch (err) {
      this.error(`runAsync error: ${err}`);
    }
  }
}
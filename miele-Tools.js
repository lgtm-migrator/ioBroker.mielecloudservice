// @ts-nocheck
// jshint -W097
// jslint node: true
'use strict';

/**
 * Miele Tools
 *
 * This file contains some tool functions needed for this adapter to work
 *
 */

// required files to load
const mieleTools = require('./miele-Tools.js');
const mieleConst = require('./miele-constants.js');


/**
 * Function decryptPasswords
 *
 * decrypts the passwords stored in ioBroker secure area and returns the decrypted values in their config variables.
 *
 * @param adapter {object} link to the adapter instance
 *
 * @returns promise {promise}
 *  resolves to true if password has been decrypted
 *  rejects with error message
 */
module.exports.decryptPasswords = function(adapter) {
    return new Promise((resolve, reject) => {
        if (adapter.supportsFeature && adapter.supportsFeature('ADAPTER_AUTO_DECRYPT_NATIVE')) {
            adapter.getForeignObject('system.config', (err, obj) => {
                if (obj && obj.native && obj.native.secret) {
                    //noinspection JSUnresolvedVariable
                    adapter.config.Miele_pwd = adapter.decrypt(obj.native.secret, adapter.config.Miele_pwd);
                    adapter.config.Client_secret = adapter.decrypt(obj.native.secret, adapter.config.Client_secret);
                    resolve(true);
                } else {
                    reject('Error during password decryption: ' + err);
                }
            });
        } else {
            reject('This adapter requires at least js-controller V3.0.0. Your system is not compatible. Please update your system or use max. v2.0.3 of this adapter.');
        }
    })
}



/**
 * Function addActionButton
 *
 * Adds an action button to the device tree and subscribes for changes to it
 *
 * @param adapter {object} link to the adapter instance
 * @param path {string} path where the action button is going to be created
 * @param action {string} name of the action button
 * @param description {string} description of the action button
 * @param buttonType {string} type of the action button (default: button)
 *
 */
module.exports.addActionButton = function(adapter, path, action, description, buttonType){
    adapter.log.debug('addActionButton: Path['+ path +']');
    buttonType = buttonType || "button";
    mieleTools.createExtendObject(adapter, path + '.ACTIONS.' + action, {
            type: 'state',
            common: {"name": description,
                "read": false,
                "write": true,
                "role": 'button',
                "type": 'boolean'
            },
            native: {"type": buttonType // "button"
            }
        }
        , () => {
            adapter.subscribeStates(path + '.ACTIONS.' + action);
        });
}



/**
 * Function addPowerSwitch
 *
 * Adds an Power switch to the device tree and subscribes for changes to it
 *
 * @param adapter {object} link to the adapter instance
 * @param setup {boolean} indicates whether the adapter is in setup mode
 * @param path {string} path where the action button is going to be created
 * @param actions {object} JSON containing the currently permitted actions
 *
 */
module.exports.addPowerSwitch = function(adapter, setup, path, actions){
    adapter.log.debug('addPowerSwitch: Path['+ path +']');
    if (setup) {
        mieleTools.createExtendObject(adapter, path + '.ACTIONS.Power' , {
                type: 'state',
                common: {"name": 'Main power switch of the device',
                    "read": true,
                    "write": true,
                    "role": 'switch.power',
                    "type": 'string',
                    "states":{'On':'On', 'Off':'Off'}
                },
                native: {}
            }
            , (device) => {
                adapter.subscribeStates(path + '.ACTIONS.Power');
                checkPowerAction(adapter, path, actions.powerOn, actions.powerOff);
            });
    } else {
        checkPowerAction(adapter, path, actions.powerOn, actions.powerOff);
    }
}



/**
 * Function addLightSwitch
 *
 * Adds a Light switch to the device tree and subscribes for changes to it
 *
 * @param adapter {object} link to the adapter instance
 * @param setup {boolean} indicates whether the adapter is in setup mode
 * @param path {string} path where the action button is going to be created
 * @param actions {object} JSON containing the currently permitted actions
 *
 */
module.exports.addLightSwitch = function(adapter, setup, path, actions){
    adapter.log.debug('addLightSwitch: Path['+ path +']');
    if (setup) {
        mieleTools.createExtendObject(adapter, path + '.ACTIONS.Light' , {
                type: 'state',
                common: {"name": 'Light switch of the device',
                    "read": true,
                    "write": true,
                    "role": 'switch',
                    "type": 'string',
                    "states":{'On':'On', 'Off':'Off'}
                },
                native: {}
            }
            , (device) => {
                adapter.subscribeStates(path + '.ACTIONS.Light');
                checkLightAction(adapter, path, actions.light);
            });
    } else {
        checkLightAction(adapter, path, actions.light);
    }
}



/**
 * Function addSuperCoolingSwitch
 *
 * Adds a SuperCooling switch to the device tree and subscribes for changes to it
 *
 * @param adapter {object} link to the adapter instance
 * @param setup {boolean} indicates whether the adapter is in setup mode
 * @param path {string} path where the action button is going to be created
 * @param actions {object} JSON containing the currently permitted actions
 *
 */
module.exports.addSuperCoolingSwitch = function(adapter, setup, path, actions){
    adapter.log.debug('addSuperCoolingSwitch: Path['+ path +']');
    if (setup) {
        mieleTools.createExtendObject(adapter, path + '.ACTIONS.SuperCooling' , {
                type: 'state',
                common: {"name": 'SuperCooling switch of the device',
                    "read": true,
                    "write": true,
                    "role": 'switch',
                    "type": 'string',
                    "states":{'On':'On', 'Off':'Off'}
                },
                native: {}
            }
            , (device) => {
                adapter.subscribeStates(path + '.ACTIONS.SuperCooling');
                checkSuperCoolingAction(adapter, path, actions.processAction);
            });
    } else {
        checkSuperCoolingAction(adapter, path, actions.processAction);
    }
}



/**
 * Function addVentilationStepSwitch
 *
 * Adds a VentilationStep switch to the device tree and subscribes for changes to it
 *
 * @param adapter {object} link to the adapter instance
 * @param setup {boolean} indicates whether the adapter is in setup mode
 * @param path {string} path where the action button is going to be created
 *
 */
module.exports.addVentilationStepSwitch = function(adapter, setup, path){
    adapter.log.debug('addVentilationStepSwitch: Path['+ path +']');
    if (setup) {
        mieleTools.createExtendObject(adapter, path + '.ACTIONS.VentilationStep' , {
                type: 'state',
                common: {"name": 'VentilationStep switch of the device',
                    "read": true,
                    "write": true,
                    "role": 'switch',
                    "type": 'string',
                    "states":{'Off':0, 'Step 1':1, 'Step 2':2, 'Step 3':3, 'Step 4':4 }
                },
                native: {}
            }
            , (device) => {
                adapter.subscribeStates(path + '.ACTIONS.VentilationStep');
            });
    }
}



/**
 * Function addModeSwitch
 *
 * Adds a Modes switch to the device tree and subscribes for changes to it
 *
 * @param adapter {object} link to the adapter instance
 * @param setup {boolean} indicates whether the adapter is in setup mode
 * @param path {string} path where the action button is going to be created
 * @param actions {object} JSON containing the currently permitted actions
 *
 */
module.exports.addModeSwitch = function(adapter, setup, path, actions){
    adapter.log.debug('addModesSwitch: Path['+ path +']');
    if (setup) {
        mieleTools.createExtendObject(adapter, path + '.ACTIONS.Mode' , {
                type: 'state',
                common: {"name": 'Modes switch of the device',
                    "read": true,
                    "write": true,
                    "role": 'switch',
                    "type": 'number',
                    "states":{'Normal':0, 'Sabbath':1}
                },
                native: {}
            }
            , (device) => {
                adapter.subscribeStates(path + '.ACTIONS.Mode');
                checkModesAction(adapter, path, actions.modes);
            });
    } else {
        checkModesAction(adapter, path, actions.modes);
    }
}



/**
 * Function addSuperFreezingSwitch
 *
 * Adds a SuperFreezing switch to the device tree and subscribes for changes to it
 *
 * @param adapter {object} link to the adapter instance
 * @param setup {boolean} indicates whether the adapter is in setup mode
 * @param path {string} path where the action button is going to be created
 * @param actions {object} JSON containing the currently permitted actions
 *
 */
module.exports.addSuperFreezingSwitch = function(adapter, setup, path, actions){
    adapter.log.debug('addSuperFreezingSwitch: Path['+ path +']');
    if (setup) {
        mieleTools.createExtendObject(adapter, path + '.ACTIONS.SuperFreezing' , {
                type: 'state',
                common: {"name": 'SuperFreezing switch of the device',
                    "read": true,
                    "write": true,
                    "role": 'switch',
                    "type": 'string',
                    "states":{'On':'On', 'Off':'Off'}
                },
                native: {}
            }
            , (device) => {
                adapter.subscribeStates(path + '.ACTIONS.SuperFreezing');
                checkSuperFreezingAction(adapter, path, actions.processAction);
            });
    } else {
        checkSuperFreezingAction(adapter, path, actions.processAction);
    }
}



/**
 * Function addProgramIdAction
 *
 * Adds programId action switch to the device tree
 *
 * @param adapter {object} link to the adapter instance
 * @param setup {boolean} indicates whether the adapter is in setup mode
 * @param path {string} path where the action button is going to be created
 * @param value {number} value containing the currently selected program
 *
 */
module.exports.addProgramIdAction = function(adapter, setup, path, value){
    adapter.log.debug('addProgramIdAction: Path['+ path +']');
    if (setup) {
        mieleTools.createExtendObject(adapter, path + '.ACTIONS.programId' , {
                type: 'state',
                common: {"name": 'Program Id - to select a program. Values depend on your device. See Miele docs.',
                    "read": true,
                    "write": true,
                    "role": 'switch',
                    "type": 'integer'
                },
                native: {}
            }
            , (device) => {
                adapter.subscribeStates(path + '.ACTIONS.programId');
                adapter.setState(path + '.ACTIONS.programId', value, true);
            });
    } else {
        adapter.setState(path + '.ACTIONS.programId', value, true);
    }
}



/**
 * Function addColorsAction
 *
 * Adds colors action switch to the device tree
 *
 * @param adapter {object} link to the adapter instance
 * @param setup {boolean} indicates whether the adapter is in setup mode
 * @param path {string} path where the action button is going to be created
  */
module.exports.addColorsAction = function(adapter, setup, path){
    if (setup) {
        adapter.log.debug('addColorsAction: Path['+ path +']');
        mieleTools.createExtendObject(adapter, path + '.ACTIONS.color' , {
                type: 'state',
                common: {"name": 'select ambient light color',
                    "read": true,
                    "write": true,
                    "role": 'switch',
                    "type": 'integer',
                    states:{'white':'white', 'blue':'blue', 'red':'red', 'yellow':'yellow', 'orange':'orange', 'green':'green', 'pink':'pink', 'purple':'purple', 'turquoise':'turquoise'}
                },
                native: {}
            }
            , (device) => {
                adapter.subscribeStates(path + '.ACTIONS.color');
            });
    }
}



/**
 * Function addStartButton
 *
 * Adds an start button to the given device
 *
 * @param adapter {object} link to the adapter instance
 * @param setup {boolean} indicator whether the devices need to setup or only states are to be updated
 * @param path {string} path where the action button is going to be created
 * @param actionState {boolean} permission state of the action
 *
 */
module.exports.addStartButton = function(adapter, setup, path, actionState){
    adapter.log.debug(`addStartButton: Path[${path}], setup: [${setup}], path: [${path}], actionState: [${actionState}]`);
    if (setup) {
        mieleTools.createExtendObject(adapter, path + '.ACTIONS.Start_Button_Active', {
            type: 'state',
            common: {"name": 'True if the start action can be executed, false if not.',
                "read": true,
                "write": false,
                "role": 'state',
                "type": 'boolean'
            },
            native: {}
        }, () => {
            adapter.setState(path + '.ACTIONS.Start_Button_Active', actionState, true)
        });

        mieleTools.createExtendObject(adapter, path + '.ACTIONS.Start' , {
                type: 'state',
                common: {"name": 'Starts the device',
                    "read": true,
                    "write": true,
                    "role": 'button',
                    "type": 'boolean'
                },
                native: {buttonType:'button.start'}
            }
            , () => {
                adapter.subscribeStates(path + '.ACTIONS.Start');
            });
    } else {
        adapter.setState(path + '.ACTIONS.Start_Button_Active', actionState, true);
    }
}



/**
 * Function addStopButton
 *
 * Adds a stop button to the given device
 *
 * @param adapter {object} link to the adapter instance
 * @param setup {boolean} indicator whether the devices need to setup or only states are to be updated
 * @param path {string} path where the action button is going to be created
 * @param actionState {boolean} permission state of the action
 *
 */
module.exports.addStopButton = function(adapter, setup, path, actionState){
    adapter.log.debug('addStopButton: Path['+ path +']');
    if (setup) {
        mieleTools.createExtendObject(adapter, path + '.ACTIONS.Stop_Button_Active', {
            type: 'state',
            common: {"name": 'True if the stop action can be executed, false if not.',
                "read": true,
                "write": false,
                "role": 'state',
                "type": 'boolean'
            },
            native: {}
        }, () => {
            adapter.setState(path + '.ACTIONS.Stop_Button_Active', actionState, true)
        });

        mieleTools.createExtendObject(adapter, path + '.ACTIONS.Stop' , {
                type: 'state',
                common: {"name": 'Stops the device',
                    "read": true,
                    "write": true,
                    "role": 'button',
                    "type": 'boolean'
                },
                native: {buttonType:'button.stop'}
            }
            , () => {
                adapter.subscribeStates(path + '.ACTIONS.Stop');
            });
    } else {
        adapter.setState(path + '.ACTIONS.Stop_Button_Active', actionState, true);
    }
}



/**
 * Function createBool
 *
 * Adds a boolean data point to the device tree
 *
 * @param adapter {object} link to the adapter instance
 * @param setup {boolean} indicator whether the devices need to setup or only states are to be updated
 * @param path {string} path where the data point is going to be created
 * @param description {string} description of the data point
 * @param value {boolean} value to set to the data point
 * @param role {string} role of the data point (default: indicator)
 *
 * @returns promise {promise}
 *
 */
module.exports.createBool = function(adapter, setup,path, description, value, role){
    return new Promise(resolve => {
        role = role || 'indicator';
        adapter.log.debug('createBool: Path['+ path +'] Value[' + value + ']');
        if (setup) {
            mieleTools.createExtendObject(adapter, path, {
                type: 'state',
                common: {"name": description,
                    "read": true,
                    "write":false,
                    "role": role,
                    "type": "boolean"
                }
            }, () => {
                adapter.setState(path, value, true);
            });
        } else {
            adapter.setState(path, value, true);
        }
        resolve(true);
    })
}



/**
 * Function createString
 *
 * Adds a string data point to the device tree
 *
 * @param adapter {object} link to the adapter instance
 * @param setup {boolean} indicator whether the devices need to setup or only states are to be updated
 * @param path {string} path where the data point is going to be created
 * @param description {string} description of the data point
 * @param value {string} value to set to the data point
 *
 * @returns promise {promise}
 */
module.exports.createString = function(adapter, setup, path, description, value){
    return new Promise(resolve => {
        adapter.log.debug('createString: Path['+ path +'] Value[' + value + ']');
        if (setup){
            mieleTools.createExtendObject(adapter, path, {
                type: 'state',
                common: {"name": description,
                    "read":  true,
                    "write": false,
                    "role": "text",
                    "type": "string"
                }
            }, () => {
                adapter.setState(path, value, true);
            });
        } else {
            adapter.setState(path, value, true);
        }
        resolve(true);
    })
}



/**
 * Function createTime
 *
 * Adds a time data point to the device tree by a given array containing [hours, minutes]
 *
 * @param adapter {object} link to the adapter instance
 * @param setup {boolean} indicator whether the devices need to setup or only states are to be updated
 * @param path {string} path where the data point is going to be created
 * @param description {string} description of the data point
 * @param value {object} array value to set to the data point
 * @param role {string} role to set to the data point (default: text)
 *
 */
module.exports.createTime = function(adapter, setup, path, description, value, role){
    role = role || 'text';
    adapter.log.debug('createTime: Path:['+ path +'], value:['+ value +']');
    let assembledValue = value[0] + ':' + (value[1]<10? '0': '') + value[1];
    if (setup){
        mieleTools.createExtendObject(adapter, path, {
            type: 'state',
            common: {"name": description,
                "read": true,
                "write": (path.split('.').pop() === 'startTime'? true : false),
                "role": role,
                "type": "string"
            }
        }, () => {
            adapter.setState(path, assembledValue, true);
            adapter.subscribeStates(path);
        });
    } else {
        adapter.setState(path, assembledValue, true);
    }
}



/**
 * Function createNumber
 *
 * Adds a number data point to the device tree
 * Unit "Celsius" will be converted to "°C" and "Fahrenheit" to "°F"
 *
 * @param adapter {object} link to the adapter instance
 * @param setup {boolean} indicator whether the devices need to setup or only states are to be updated
 * @param path {string} path where the data point is going to be created
 * @param description {string} description of the data point
 * @param value {number} value to set to the data point
 * @param unit {string} unit to set to the data point
 * @param role {string} role to set to the data point (default: text)
 *
 * @returns {promise}
 *
 */
module.exports.createNumber = function(adapter, setup,  path, description, value, unit, role){
    adapter.log.debug('[createNumber]: Path['+ path +'] Value[' + value + '] Unit[' + unit + ']');
    // get back to calling function if there is no valid value given.
    return new Promise((resolve) => {
        if ( !value || value === -32768 ) {
            adapter.log.debug('[createNumber]: invalid value detected. Skipping...');
        }
        if (setup){
            role = role || 'value';
            switch (unit){
                case "Celsius" : unit = "°C";
                    break;
                case "Fahrenheit" : unit = "°F";
                    break;
            }
            mieleTools.createExtendObject(adapter, path, {
                type: 'state',
                common: {"name": description,
                    "read": true,
                    "write":false,
                    "role": role,
                    "type": "number",
                    "unit": unit
                }
            }, () => {
                adapter.setState(path, value, true);
                resolve(true);
            });
        } else {
            adapter.setState(path, value, true);
            resolve(true);
        }
    })
}



/**
 * Function createArray
 *
 * Adds a number data point to the device tree for each element in the given array
 *
 * @param adapter {object} link to the adapter instance
 * @param setup {boolean} indicator whether the devices need to setup or only states are to be updated
 * @param path {string} path where the data point is going to be created
 * @param description {string} description of the data point
 * @param value {object} array containing the value(s) to set to the data point(s)
 *
 */
module.exports.createArray = function(adapter, setup, path, description, value){
    // depending on the device we receive up to 3 values
    // there is a min of 1 and a max of 3 temperatures returned by the miele API
    let MyPath = path;
    const items = Object.keys(value).length;
    adapter.log.debug('Number of Items in Array: [' + items +']');
    for (let n in value) {
        if (items > 1){
            MyPath = path + '_' + n;
        }
        adapter.log.debug('createArray: Path:['   + MyPath  + ']');
        adapter.log.debug('createArray:  value:[' + JSON.stringify(value)   + ']');
        adapter.log.debug('createArray:  OrgUnit: [' + value[n].unit + ']');
        mieleTools.createNumber(adapter, setup, MyPath, description, value[n].value_localized, value[n].unit, 'value.temperature')
    }
}



/**
 * createExtendObject
 *
 * creates a new object in device tree or extends it if it's already existing
 *
 * @param adapter {object} link to the adapter instance
 * @param id {string} id of the object in the device tree
 * @param objData {object} informational data with which attributes the object should be created
 * @param callback {function} callback function
 *
 */
module.exports.createExtendObject = function(adapter, id, objData, callback) {
    adapter.getObject(id, function (err, oldObj) {
        if (!err && oldObj) {
            adapter.extendObject(id, objData, callback);
        } else {
            adapter.setObjectNotExists(id, objData, callback);
        }
    });
}



/**
 * adapterConfigIsValid
 *
 * tests the given adapter config whether it is valid
 *
 * @param adapter {object} link to the adapter instance
 *
 * @returns {boolean} true if config is valid. false if config is invalid
 */
module.exports.adapterConfigIsValid = function(adapter) {
    let configIsValid = true;

    if ('' === adapter.config.Miele_account) {
        adapter.log.warn('Miele account is missing.');
        configIsValid = false;
    }
    if ('' === adapter.config.Miele_pwd) {
        adapter.log.warn('Miele password is missing.');
        configIsValid = false;
    }
    if ('' === adapter.config.Client_ID) {
        adapter.log.warn('Miele API client ID is missing.');
        configIsValid = false;
    }
    if ('' === adapter.config.Client_secret) {
        adapter.log.warn('Miele API client secret is missing.');
        configIsValid = false;
    }
    if ('' === adapter.config.locale) {
        adapter.log.warn('Locale is missing.');
        configIsValid = false;
    }
    if ('' === adapter.config.oauth2_vg) {
        adapter.log.warn('OAuth2_vg is missing.');
        configIsValid = false;
    }
    if ('' === adapter.config.pollinterval) {
        adapter.log.warn('PollInterval is missing.');
        configIsValid = false;
    }
    return configIsValid;
}



/**
 * addMieleDeviceIdent
 *
 * add the ident data to the device tree
 *
 * @param adapter {object} link to the adapter instance
 * @param path {string} path where the data point is going to be created
 * @param currentDeviceIdent {object} ident data of the device
 * @param setup {boolean} indicator whether the devices need to setup or only states are to be updated
 */
module.exports.addMieleDeviceIdent = async function(adapter, path, currentDeviceIdent, setup){
    adapter.log.debug('addMieleDeviceIdent: Path = [' + path + ']');
    await mieleTools.createString(adapter, setup, path + '.ComModFirmware', "the release version of the communication module", currentDeviceIdent.xkmIdentLabel.releaseVersion);
    await mieleTools.createString(adapter, setup,path + '.ComModTechType', "the technical type of the communication module", currentDeviceIdent.xkmIdentLabel.techType);
    await mieleTools.createString(adapter, setup,path + '.DeviceSerial', "the serial number of the device", currentDeviceIdent.deviceIdentLabel.fabNumber);
    await mieleTools.createString(adapter, setup,path + '.DeviceTechType', "the technical type of the device", currentDeviceIdent.deviceIdentLabel.techType);
    await mieleTools.createString(adapter, setup,path + '.DeviceMatNumber', "the material number of the device", currentDeviceIdent.deviceIdentLabel.matNumber);
}



/**
 * addDeviceNicknameAction
 *
 * add the nickname action to the device tree
 *
 * @param adapter {object} link to the adapter instance
 * @param path {string} path where the data point is going to be created
 * @param mieleDevice {object} ident data of the device
 */
module.exports.addDeviceNicknameAction = function(adapter, path, mieleDevice) {
    adapter.log.debug( 'addDeviceNicknameAction: Path:['+ path +'], mieleDevice:['+JSON.stringify(mieleDevice)+']' );
    // addDeviceNicknameAction - suitable for each and every device
    mieleTools.createExtendObject(adapter,path + '.ACTIONS.Nickname', {
        type: 'state',
        common: {
            name: 'Nickname of your device. Can be edited in Miele APP or here!',
            read: true,
            write: true,
            type: 'string',
            role:'text'
        },
        native: {}
    }, () => {
        adapter.setState(path + '.ACTIONS.Nickname', (mieleDevice.ident.deviceName === '' ? mieleDevice.ident.type.value_localized : mieleDevice.ident.deviceName), true);
        adapter.subscribeStates(path + '.ACTIONS.Nickname');
    });
}



/**
 * createStateConnected
 *
 * create the state that shows whether the device is connected to WLAN or Gateway.
 *
 * @param adapter {object} link to the adapter instance
 * @param setup {boolean} indicator whether the devices need to setup or only states are to be updated
 * @param path {string} path where the data point is going to be created
 * @param value {boolean} value to set to the data point
 *
 * @returns promise {promise}
 */
module.exports.createStateConnected = function(adapter, setup, path, value){
    return mieleTools.createBool( adapter,
                                  setup,
                             path + '.Connected',
                        'Indicates whether the device is connected to WLAN or Gateway.',
                            value,
                            'indicator.reachable');
}



/**
 * createStateSignalInUse
 *
 * create the state that shows whether the device is connected to WLAN or Gateway.
 *
 * @param adapter {object} link to the adapter instance
 * @param setup {boolean} indicator whether the devices need to setup or only states are to be updated
 * @param path {string} path where the data point is going to be created
 * @param value {boolean} value to set to the data point
 *
 * @returns promise {promise}
 */
module.exports.createStateSignalInUse = function(adapter, setup, path, value){
    return mieleTools.createBool( adapter,
                                  setup,
                             path + '.signalInUse',
                        'Indicates whether the device is in use or switched off.',
                             value,
                              'indicator.InUse');
}



/**
 * createStateSignalInfo
 *
 * create the state that shows whether a notification is active for this Device
 *
 * @param adapter {object} link to the adapter instance
 * @param setup {boolean} indicator whether the devices need to setup or only states are to be updated
 * @param path {string} path where the data point is going to be created
 * @param value {boolean} value to set to the data point
 *
 * @returns promise {promise}
 */
module.exports.createStateSignalInfo = function(adapter, setup, path, value){
    return mieleTools.createBool( adapter,
        setup,
        path + '.signalInfo',
        'Indicates whether a notification is active for this Device.',
        value,
        '');
}



/**
 * createStateSmartGrid
 *
 * create the state that shows whether the device is set to Smart Grid mode
 *
 * @param adapter {object} link to the adapter instance
 * @param setup {boolean} indicator whether the devices need to setup or only states are to be updated
 * @param path {string} path where the data point is going to be created
 * @param value {boolean} value to set to the data point
 *
 * @returns promise {promise}
 */
module.exports.createStateSmartGrid = function(adapter, setup, path, value){
    return mieleTools.createBool( adapter,
        setup,
        path + '.smartGrid',
        'Indicates whether the device is set to Smart Grid mode',
        value,
        '');
}



/**
 * createStateFullRemoteControl
 *
 * create the state that shows whether the device can be controlled from remote.
 *
 * @param adapter {object} link to the adapter instance
 * @param setup {boolean} indicator whether the devices need to setup or only states are to be updated
 * @param path {string} path where the data point is going to be created
 * @param value {boolean} value to set to the data point
 *
 * @returns promise {promise}
 */
module.exports.createStateFullRemoteControl = function(adapter, setup, path, value){
    return mieleTools.createBool( adapter,
        setup,
        path + '.signalInfo',
        'Indicates whether the device can be controlled from remote.',
        value,
        '');
}



/**
 * createStateSignalDoor
 *
 * create the state that shows whether a door-open message is active for this Device
 *
 * @param adapter {object} link to the adapter instance
 * @param setup {boolean} indicator whether the devices need to setup or only states are to be updated
 * @param path {string} path where the data point is going to be created
 * @param value {boolean} value to set to the data point
 *
 * @returns promise {promise}
 */
module.exports.createStateSignalDoor = function(adapter, setup, path, value){
    return mieleTools.createBool( adapter,
        setup,
        path + '.signalDoor',
        'Indicates whether a door-open message is active for this Device.',
        value,
        '');
}



/**
 * createStateSignalFailure
 *
 * create the state that shows whether a failure message is active for this Device.
 *
 * @param adapter {object} link to the adapter instance
 * @param setup {boolean} indicator whether the devices need to setup or only states are to be updated
 * @param path {string} path where the data point is going to be created
 * @param value {boolean} value to set to the data point
 *
 * @returns promise {promise}
 */
module.exports.createStateSignalFailure = function(adapter, setup, path, value){
    return mieleTools.createBool( adapter,
        setup,
        path + '.signalFailure',
        'Indicates whether a failure message is active for this Device.',
        value,
        '');
}



/**
 * createStateDeviceMainState
 *
 * create the state that shows the main state for this Device.
 *
 * @param adapter {object} link to the adapter instance
 * @param setup {boolean} indicator whether the devices need to setup or only states are to be updated
 * @param path {string} path where the data point is going to be created
 * @param value {string} value to set to the data point
 * @param value_raw {number} value to set to the raw-data point
 *
 * @returns promise {promise}
 */
module.exports.createStateDeviceMainState = async function(adapter, setup, path, value, value_raw){
    await mieleTools.createNumber( adapter, setup, path + '_raw', 'Main state of the Device (raw-value)', value_raw, '', '');

    return mieleTools.createString( adapter,
        setup,
        path,
        'Main state of the Device',
        value);
}



/**
 * createStateProgramID
 *
 * create the state that shows the main state for this Device.
 *
 * @param adapter {object} link to the adapter instance
 * @param setup {boolean} indicator whether the devices need to setup or only states are to be updated
 * @param path {string} path where the data point is going to be created
 * @param value {string} value to set to the data point
 * @param value_raw {number} value to set to the raw-data point
 *
 * @returns promise {promise}
 */
module.exports.createStateProgramID = async function(adapter, setup, path, value, value_raw){
    await mieleTools.createNumber( adapter, setup, path + '_raw', 'ID of the running Program (raw-value)', value_raw, '', '');

    return mieleTools.createString( adapter,
        setup,
        path,
        'ID of the running Program',
        value);
}



/**
 * createStateProgramType
 *
 * create the state that shows the Program type of the running Program
 *
 * @param adapter {object} link to the adapter instance
 * @param setup {boolean} indicator whether the devices need to setup or only states are to be updated
 * @param path {string} path where the data point is going to be created
 * @param value {string} value to set to the data point
 * @param value_raw {number} value to set to the raw-data point
 *
 * @returns promise {promise}
 */
module.exports.createStateProgramType = async function(adapter, setup, path, value, value_raw){
    await mieleTools.createNumber( adapter, setup, path + '_raw', 'Program type of the running Program (raw-value)', value_raw, '', '');

    return mieleTools.createString( adapter,
        setup,
        path,
        'Program type of the running Program',
        value);
}



/**
 * createStateProgramPhase
 *
 * create the state that shows the Phase of the running program
 *
 * @param adapter {object} link to the adapter instance
 * @param setup {boolean} indicator whether the devices need to setup or only states are to be updated
 * @param path {string} path where the data point is going to be created
 * @param value {string} value to set to the data point
 * @param value_raw {number} value to set to the raw-data point
 *
 * @returns promise {promise}
 */
module.exports.createStateProgramPhase = async function(adapter, setup, path, value, value_raw){
    await mieleTools.createNumber( adapter, setup, path + '_raw', 'Phase of the running program (raw-value)', value_raw, '', '');

    return mieleTools.createString( adapter,
        setup,
        path,
        'Phase of the running program',
        value);
}



/**
 * createStateVentilationStep
 *
 * create the state that shows the
 *
 * @param adapter {object} link to the adapter instance
 * @param setup {boolean} indicator whether the devices need to setup or only states are to be updated
 * @param path {string} path where the data point is going to be created
 * @param value {string} value to set to the data point
 */
module.exports.createStateVentilationStep = async function(adapter, setup, path, value){
    await mieleTools.addVentilationStepSwitch(adapter, setup, path);
    adapter.setState(path + 'ACTIONS.VentilationStep', value, true);
}



/**
 * createStateDryingStep
 *
 * create the state that shows the
 *
 * @param adapter {object} link to the adapter instance
 * @param setup {boolean} indicator whether the devices need to setup or only states are to be updated
 * @param path {string} path where the data point is going to be created
 * @param value {string} value to set to the data point
 * @param value_raw {number} value to set to the raw-data point
 *
 * @returns promise {promise}
 */
module.exports.createStateDryingStep = async function(adapter, setup, path, value, value_raw){
    await mieleTools.createNumber( adapter, setup, path + '_raw', 'This field is only valid for hoods (raw-value)', value_raw, '', '');

    return mieleTools.createString( adapter,
        setup,
        path,
        'This field is only valid for hoods.',
        value);
}



/**
 * createStateEstimatedEndTime
 *
 * create the state that shows the estimated ending time of the current running program
 *
 * @param adapter {object} link to the adapter instance
 * @param setup {boolean} indicator whether the devices need to setup or only states are to be updated
 * @param path {string} path where the data point is going to be created
 * @param remainingTime {object} array that contains the remaining time in format [hours, minutes]
 *
 * @returns promise {promise}
 */
module.exports.createStateEstimatedEndTime = async function(adapter, setup, path, remainingTime){
    let timeToShow = '';
    if ( remainingTime[0]+remainingTime[1] ===0 ){
        adapter.log.debug('No EstimatedEndTime to show!');
    } else {
        let now = new Date;
        let estimatedEndTime = new Date;
        estimatedEndTime.setMinutes((now.getMinutes() + ((remainingTime[0]*60) + (remainingTime[1]*1))));
        timeToShow = estimatedEndTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }

    return mieleTools.createString(adapter,
                                    setup,
                                    path + '.estimatedEndTime',
                          'The EstimatedEndTime is the current time plus remaining time of the running program.',
                                    timeToShow
    );
}



/**
 * createStateAmbientLight
 *
 * create the state that shows the state of ambient light of the current device
 *
 * @param adapter {object} link to the adapter instance
 * @param setup {boolean} indicator whether the devices need to setup or only states are to be updated
 * @param path {string} path where the data point is going to be created
 * @param value {string}
 *
 * @returns promise {promise}
 */
module.exports.createStateAmbientLight = function(adapter, setup, path, value){
    return mieleTools.createString(adapter,
        setup,
        path,
        'The ambientLight field indicates the status of the device ambient light.',
        value
    );
}



/**
 * createStateLight
 *
 * create the state that shows the state of light of the current device
 *
 * @param adapter {object} link to the adapter instance
 * @param setup {boolean} indicator whether the devices need to setup or only states are to be updated
 * @param path {string} path where the data point is going to be created
 * @param value {string} array that contains the remaining time in format [hours, minutes]
 *
 * @returns promise {promise}
 */
module.exports.createStateLight = function(adapter, setup, path, value){

    //currentDeviceState.light === 1 ? 'Enabled' : (currentDeviceState.light === 2 ? 'Disabled' : 'Invalid'));

    return mieleTools.createString(adapter,
        setup,
        path,
        'The light field indicates the status of the device\'s light.',
        value
    );
}



/**
 * createStateRemainingTime
 *
 * create the state that shows the remaining time of the running program
 *
 * @param adapter {object} link to the adapter instance
 * @param setup {boolean} indicator whether the devices need to setup or only states are to be updated
 * @param path {string} path where the data point is going to be created
 * @param remainingTime {object} array value to set to the data point
 *
 * @returns promise {promise}
 */
module.exports.createStateRemainingTime = function(adapter, setup, path, remainingTime){
    mieleTools.createTime(  adapter,
                            setup,
                       path + '.remainingTime',
                  'The RemainingTime equals the relative remaining time',
                             remainingTime,
                        '');
}



/**
 * createStateStartTime
 *
 * create the state that shows the start time of the running program
 *
 * @param adapter {object} link to the adapter instance
 * @param setup {boolean} indicator whether the devices need to setup or only states are to be updated
 * @param path {string} path where the data point is going to be created
 * @param startTime {object} array value to set to the data point
 *
 * @returns promise {promise}
 */
module.exports.createStateStartTime = function(adapter, setup, path, startTime){
    mieleTools.createTime(  adapter,
        setup,
        path + '.startTime',
        'The StartTime equals the relative starting time',
        startTime,
        '');
}


/**
 * createStateElapsedTime
 *
 * create the state that shows the elapsed time of the running program
 *
 * @param adapter {object} link to the adapter instance
 * @param setup {boolean} indicator whether the devices need to setup or only states are to be updated
 * @param path {string} path where the data point is going to be created
 * @param value {object} array value that represents a time value to set to the data point
 *
 */
module.exports.createStateElapsedTime = function(adapter, setup, path, value){
    mieleTools.createTime(  adapter,
        setup,
        path + '.elapsedTime',
        'ElapsedTime since program start (only present for certain devices)',
        value,
        '');
}



/**
 * createStateTargetTemperature
 *
 * create the state that shows information about one or multiple target temperatures of the process.
 * API returns 1 to 3 values depending on the device
 *
 * @param adapter {object} link to the adapter instance
 * @param setup {boolean} indicator whether the devices need to setup or only states are to be updated
 * @param path {string} path where the data point is going to be created
 * @param value {object} array value to set to the data point
 */
module.exports.createStateTargetTemperature = function(adapter, setup, path, value){
    mieleTools.createArray( adapter,
        setup,
        path + '.targetTemperature',
        'The TargetTemperature field contains information about one or multiple target temperatures of the process.',
        value);
}



/**
 * createStateTargetTemperatureFridge
 *
 * create the state that shows information about the target temperature of the fridge
 *
 * @param adapter {object} link to the adapter instance
 * @param setup {boolean} indicator whether the devices need to setup or only states are to be updated
 * @param path {string} path where the data point is going to be created
 * @param value {object} array value to set to the data point
 */
module.exports.createStateTargetTemperatureFridge = function(adapter, setup, path, value){
    if (setup) {
        mieleTools.createExtendObject(adapter,
            '.ACTIONS.targetTemperatureFridge',
            {
                type: 'state',
                common: {
                    name: 'The target temperature of the fridge (1 to 9).',
                    read: true,
                    write: true,
                    type: 'number',
                    min: 1,
                    max: 9,
                    role: 'value.temperature'
                },
                native: {}
            }, () => {
                adapter.setState(path + '.ACTIONS.targetTemperatureFridge', value, true);
                adapter.subscribeStates(path + '.ACTIONS.targetTemperatureFridge');
            });
    } else {
        adapter.setState(path + '.ACTIONS.targetTemperatureFridge', value, true);
    }
}



/**
 * createStateTargetTemperatureFreezer
 *
 * create the state that shows information about the target temperature of the Freezer
 *
 * @param adapter {object} link to the adapter instance
 * @param setup {boolean} indicator whether the devices need to setup or only states are to be updated
 * @param path {string} path where the data point is going to be created
 * @param value {object} array value to set to the data point
 */
module.exports.createStateTargetTemperatureFreezer = function(adapter, setup, path, value){
    if (setup) {
        mieleTools.createExtendObject(adapter,
            '.ACTIONS.targetTemperatureFreezer',
            {
                type: 'state',
                common: {
                    name: 'The target temperature of the Freezer (-16 to -26).',
                    read: true,
                    write: true,
                    type: 'number',
                    min: -26,
                    max: -16,
                    role: 'value.temperature'
                },
                native: {}
            }, () => {
                adapter.setState(path + '.ACTIONS.targetTemperatureFreezer', value, true);
                adapter.subscribeStates(path + '.ACTIONS.targetTemperatureFreezer');
            });
    } else {
        adapter.setState(path + '.ACTIONS.targetTemperatureFreezer', value, true);
    }
}



/**
 * createStateTemperature
 *
 * create the state that shows information about one or multiple temperatures of the device.
 * API returns 1 to 3 values depending on the device
 *
 * @param adapter {object} link to the adapter instance
 * @param setup {boolean} indicator whether the devices need to setup or only states are to be updated
 * @param path {string} path where the data point is going to be created
 * @param value {object} array value to set to the data point
 */
module.exports.createStateTemperature = function(adapter, setup, path, value){
    mieleTools.createArray( adapter,
        setup,
        path + '.Temperature',
        'The Temperature field contains information about one or multiple target temperatures of the process.',
        value);
}



/**
 * createStatePlateStep
 *
 * create the state that shows the selected cooking zone levels for a hob
 *
 * @param adapter {object} link to the adapter instance
 * @param setup {boolean} indicator whether the devices need to setup or only states are to be updated
 * @param path {string} path where the data point is going to be created
 * @param value {object} array value to set to the data point
 */
module.exports.createStatePlateStep = function(adapter, setup, path, value){
    // PlateStep - occurs at Hobs
    mieleTools.createArray( adapter,
        setup,
        path + '.PlateStep',
        'The plateStep object represents the selected cooking zone levels for a hob.',
        value);
}

/**
 * createStateBatteryLevel
 *
 * create the state that shows the charging level of a builtin battery as a percentage value between 0 .. 100
 * NEW API 1.0.4
 *
 * @param adapter {object} link to the adapter instance
 * @param setup {boolean} indicator whether the devices need to setup or only states are to be updated
 * @param path {string} path where the data point is going to be created
 * @param value {number} value to set to the data point
 */
module.exports.createStateBatteryLevel = function(adapter, setup, path, value) {
        mieleTools.createNumber(adapter,
                                setup,
                           path + '.batteryLevel',
                      'The batteryLevel object returns the charging level of a builtin battery as a percentage value between 0 .. 100',
                                 value==null?0:value,
                            '%',
                            'value');
}



/**
 * createStateEcoFeedbackWater
 *
 * create the states that show
 * NEW API 1.0.4
 *
 * @param adapter {object} link to the adapter instance
 * @param setup {boolean} indicator whether the devices need to setup or only states are to be updated
 * @param path {string} path where the data point is going to be created
 * @param ecoFeedback {object} value to set to the data point
 */
module.exports.createStateEcoFeedbackWater = function(adapter, setup, path, ecoFeedback) {
    mieleTools.createNumber(adapter,
                            setup,
                      path + '.EcoFeedback.currentWaterConsumption',
                 'The amount of water used by the current running program up to the present moment.',
                            (ecoFeedback===null? 0: ecoFeedback.currentWaterConsumption.value.valueOf()*1),
                            (ecoFeedback===null? 0: ecoFeedback.currentWaterConsumption.unit.valueOf()),
                      'value');
    mieleTools.createNumber(adapter,
                            setup,
                       path + '.EcoFeedback.waterForecast',
                  'The relative water usage for the selected program from 0 to 100.',
                            (ecoFeedback===null? 0: ecoFeedback.waterForecast*100),
                       '%',
                       'value');
}


/**
 * createStateEcoFeedbackEnergy
 *
 * create the states that show
 * NEW API 1.0.4
 *
 * @param adapter {object} link to the adapter instance
 * @param setup {boolean} indicator whether the devices need to setup or only states are to be updated
 * @param path {string} path where the data point is going to be created
 * @param ecoFeedback {object} value to set to the data point
 */
module.exports.createStateEcoFeedbackEnergy = function(adapter, setup, path, ecoFeedback) {
    mieleTools.createNumber(adapter,
        setup,
        path + '.EcoFeedback.currentEnergyConsumption',
        'The amount of energy used by the current running program up to the present moment.',
        (ecoFeedback===null? 0: ecoFeedback.currentEnergyConsumption.value.valueOf()*1),
        (ecoFeedback===null? 0: ecoFeedback.currentEnergyConsumption.unit.valueOf()),
        'value.power.consumption'
    );
    mieleTools.createNumber(adapter,
        setup,
        path + '.EcoFeedback.EnergyForecast',
        'The relative energy usage for the selected program from 0 to 100.',
        (ecoFeedback===null? 0: ecoFeedback.energyForecast*100),
        '%',
        'value');
}



/**
 * createStateSpinningSpeed
 *
 * create the states that show
 *
 * @param adapter {object} link to the adapter instance
 * @param setup {boolean} indicator whether the devices need to setup or only states are to be updated
 * @param path {string} path where the data point is going to be created
 * @param value {number} value to set to the data point
 * @param unit {string} unit the value is in
 */
module.exports.createStateSpinningSpeed = function(adapter, setup, path, value, unit) {
    mieleTools.createNumber(adapter,
        setup,
        path,
        'Spinning speed of a washing machine.',
        value,
        unit,
        'value');
}



/**
 * createChannelActions
 *
 * create the channel for Actions
 *
 * @param adapter {object} link to the adapter instance
 * @param path {string} path where the data point is going to be created
 * @param setup {boolean} indicator whether the devices need to setup or only states are to be updated
 */
module.exports.createChannelActions = function(adapter, path, setup) {
    if (setup){
        mieleTools.createExtendObject(adapter, path + '.ACTIONS', {
            type: 'channel',
            common: {
                name: 'Actions which are available for this device',
                read: true,
                write: false,
                icon: 'icons/cog.svg'
            },
            native: {}
        }, null);
    }
}



/**
 * createChannelIdent
 *
 * create the channel for Ident-information
 *
 * @param adapter {object} link to the adapter instance
 * @param path {string} path where the data point is going to be created
 * @param setup {boolean} indicator whether the devices need to setup or only states are to be updated
 */
module.exports.createChannelIdent = function(adapter, path, setup) {
    if (setup) {
        mieleTools.createExtendObject(adapter, path + '.IDENT', {
            type: 'channel',
            common: {
                name: 'Ident information available for this device',
                read: true,
                write: false,
                icon: 'icons/info.svg'
            },
            native: {}
        }, null);
    }
}


/**
 * createChannelEcoFeedback
 *
 * create the channel for EcoFeedback-information
 *
 * @param adapter {object} link to the adapter instance
 * @param path {string} path where the data point is going to be created
 * @param setup {boolean} indicator whether the devices need to setup or only states are to be updated
 */
module.exports.createChannelEcoFeedback = function(adapter, path, setup) {
    if (setup) {
        mieleTools.createExtendObject(adapter, path + '.EcoFeedback', {
            type: 'channel',
            common: {
                name: 'EcoFeedback information available for this device',
                read: true,
                write: false,
                icon: 'icons/eco.svg'
            },
            native: {}
        }, null);
    }
}



/**
 * checkPowerAction
 *
 * sets the Actions.Power-Switch according to it's current permitted action
 *
 * @param adapter {object} link to the adapter instance
 * @param device {string} the path to the current device
 * @param powerOn {boolean} permission state of the powerOn action
 * @param powerOff {boolean} permission state of the powerOff action
 *
 * @returns {promise} resolves on either PowerOn=True or PowerOff=true; rejects if both have the same value
 */
async function checkPowerAction(adapter, device, powerOn, powerOff) {
    return new Promise((resolve, reject) => {
        if ( powerOn && !powerOff ) {
            adapter.setState(device + '.ACTIONS.Power', 'Off', true);
            adapter.log.debug(`[checkPowerAction]: Device [${device}]: PowerOn is permitted!`);
            resolve(true);
        } else if ( !powerOn && powerOff ) {
            adapter.setState(device + '.ACTIONS.Power', 'On', true);
            adapter.log.debug(`[checkPowerAction]: Device [${device}]: PowerOff is permitted!`);
            resolve(true);
        } else {
            adapter.log.warn(`[checkPowerAction]: Device [${device}]: PowerOn=${powerOn} and PowerOff=${powerOff}!! Don't know what to do!`);
            reject(`[checkPowerAction]: Device [${device}]: PowerOn=${powerOn} and PowerOff=${powerOff}!! Don't know what to do!`);
        }
    })
}



/**
 * checkLightAction
 *
 * sets the Actions.Light-Switch according to it's current permitted action
 *
 * @param adapter {object} link to the adapter instance
 * @param device {string} the path to the current device
 * @param light {object} permission state of the light action
 *
 * @returns {promise} resolves on either PowerOn=True or PowerOff=true; rejects if both have the same value
 */
async function checkLightAction(adapter, device, light) {
    return new Promise((resolve) => {
        if ( Array(light).includes(mieleConst.LIGHT_ON) ){
            adapter.setState(device + '.ACTIONS.Light', 'Off', true);
            adapter.log.debug(`[checkLightAction]: Device [${device}]: Light_On is permitted!`);
            resolve(true);
        } else if ( Array(light).includes(mieleConst.LIGHT_OFF) ) {
            adapter.setState(device + '.ACTIONS.Light', 'On', true);
            adapter.log.debug(`[checkLightAction]: Device [${device}]: Light_Off is permitted!`);
            resolve(true);
        }
    })
}



/**
 * checkSuperCoolingAction
 *
 * sets the Actions.SuperCooling-Switch according to it's current permitted action
 *
 * @param adapter {object} link to the adapter instance
 * @param device {string} the path to the current device
 * @param actions {object} permission state of the light action
 *
 * @returns {promise} resolves on either PowerOn=True or PowerOff=true; rejects if both have the same value
 */
async function checkSuperCoolingAction(adapter, device, actions) {
    return new Promise((resolve) => {
        if ( Array(actions).includes(mieleConst.START_SUPERCOOLING) ){
            adapter.setState(device + '.ACTIONS.SuperCooling', 'Off', true);
            adapter.log.debug(`[checkSuperCoolingAction]: Device [${device}]: START_SUPERCOOLING is permitted!`);
            resolve(true);
        } else if ( Array(actions).includes(mieleConst.STOP_SUPERCOOLING) ) {
            adapter.setState(device + '.ACTIONS.SuperCooling', 'On', true);
            adapter.log.debug(`[checkSuperCoolingAction]: Device [${device}]: STOP_SUPERCOOLING is permitted!`);
            resolve(true);
        }
    })
}


/**
 * checkSuperFreezingAction
 *
 * sets the Actions.Light-Switch according to it's current permitted action
 *
 * @param adapter {object} link to the adapter instance
 * @param device {string} the path to the current device
 * @param actions {object} permission state of the light action
 *
 * @returns {promise} resolves on either PowerOn=True or PowerOff=true; rejects if both have the same value
 */
async function checkSuperFreezingAction(adapter, device, actions) {
    return new Promise((resolve) => {
        if ( Array(actions).includes(mieleConst.START_SUPERFREEZING) ){
            adapter.setState(device + '.ACTIONS.SuperFreezing', 'Off', true);
            adapter.log.debug(`[checkSuperFreezingAction]: Device [${device}]: START_SUPERFREEZING is permitted!`);
            resolve(true);
        } else if ( Array(actions).includes(mieleConst.STOP_SUPERFREEZING) ) {
            adapter.setState(device + '.ACTIONS.SuperFreezing', 'On', true);
            adapter.log.debug(`[checkSuperFreezingAction]: Device [${device}]: STOP_SUPERFREEZING is permitted!`);
            resolve(true);
        }
    })
}


/**
 * checkModesAction
 *
 * sets the Actions.Modes-Switch according to it's current permitted action
 *
 * @param adapter {object} link to the adapter instance
 * @param device {string} the path to the current device
 * @param modes {object} permission state of the Modes action
 *
 * @returns {promise} resolves on either PowerOn=True or PowerOff=true; rejects if both have the same value
 */
async function checkModesAction(adapter, device, modes) {
    return new Promise((resolve) => {
        if ( Array(modes).includes(mieleConst.MODE_NORMAL) ){
            adapter.setState(device + '.ACTIONS.Mode', 1, true);
            adapter.log.debug(`[checkModesAction]: Device [${device}]: MODE_NORMAL is permitted!`);
            resolve(true);
        } else if ( Array(modes).includes(mieleConst.MODE_SABBATH) ) {
            adapter.setState(device + '.ACTIONS.Mode', 0, true);
            adapter.log.debug(`[checkModesAction]: Device [${device}]: MODE_SABBATH is permitted!`);
            resolve(true);
        }
    })
}



/**
 * checkStartAction
 *
 * sets the Actions.Start_Active-State according to it's current permitted action
 *
 * @param adapter {object} link to the adapter instance
 * @param device {string} the path to the current device
 * @param start {boolean} permission state of the start action
 */
async function checkStartAction(adapter, device, start) {
    return new Promise((resolve) => {
        adapter.setState(device + '.ACTIONS.Start_Button_Active', start, true);
        resolve(true);
    })
}



/**
 * checkStopAction
 *
 * sets the Actions.Stop_Active-State according to it's current permitted action
 *
 * @param adapter {object} link to the adapter instance
 * @param device {string} the path to the current device
 * @param stop {boolean} permission state of the stop action
 */
async function checkStopAction(adapter, device, stop) {
    return new Promise((resolve) => {
        adapter.setState(device + '.ACTIONS.Stop_Button_Active', stop, true);
        resolve(true);
    })
}




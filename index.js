const { v3 } = require('node-hue-api');
const readline = require('readline');
const LightState = v3.lightStates.LightState;
const dotenv = require('dotenv');
const fs = require('fs');

dotenv.config();

let USERNAME = process.env.HUE_USERNAME;
const BRIDGE_IP = process.env.BRIDGE_IP;

const appName = 'hue-lights-app';
const deviceName = 'my-hue-device';

async function waitForKeyPress(rl) {
    return new Promise((resolve) => {
        rl.question('\nPress any key to continue...', () => {
            resolve();
        });
    });
}

async function discoverBridge() {
    const discoveryResults = await v3.discovery.nupnpSearch();
    if (discoveryResults.length === 0) {
        console.error('Failed to resolve any Hue Bridges');
        return null;
    } else {
        return discoveryResults[0].ipaddress;
    }
}

async function createUser(rl) {
    const bridgeIp = BRIDGE_IP || await discoverBridge();
    if (!bridgeIp) {
        throw new Error('Could not find a Hue Bridge');
    }

    const unauthenticatedApi = await v3.api.createLocal(bridgeIp).connect();

    try {
        const createdUser = await unauthenticatedApi.users.createUser(appName, deviceName);
        console.log(`Created user: ${createdUser.username}`);

        fs.appendFileSync('.env', `\nHUE_USERNAME=${createdUser.username}`);

        USERNAME = createdUser.username;
        
        return createdUser.username;
    } catch (err) {
        if (err.getHueErrorType() === 101) {
            console.clear();
            console.log("╭─────────────────────╮");
            console.log("│        ERROR        │");
            console.log("╰─────────────────────╯");
            console.error('The Link button on the bridge was not pressed. Please press the Link button and try again.');
        } else {
            console.error(`Unexpected error creating user: ${err.message}`);
        }
        await waitForKeyPress(rl);
    }
    return null;
}

async function connectToBridge(rl) {
    let username = USERNAME;
    let bridgeIp = BRIDGE_IP || await discoverBridge();
    let apiInstance;

    if (!bridgeIp) {
        throw new Error('Could not find a Hue Bridge');
    }

    try {
        if (username) {
            apiInstance = await v3.api.createLocal(bridgeIp).connect(username);
        } else {
            throw new Error('Username not found in .env');
        }
    } catch (err) {
        console.warn('Failed to connect with existing username, creating a new user...');
        username = await createUser(rl);
        if (username) {
            apiInstance = await v3.api.createLocal(bridgeIp).connect(username);
        } else {
            throw new Error('Could not create a new Hue Bridge user');
        }
    }

    return apiInstance;
}

async function listAllLights(rl) {
    const api = await connectToBridge(rl);
    const lights = await api.lights.getAll();
    console.log('╭──────┬──────────────┬───────────┬───────╮\n│  ID  │     Name     │   Status  │  Hue  │\n├──────┼──────────────┼───────────┼───────┤');
    lights.forEach(light => {
        console.log(`│  ${light.id}   │ ${light.name.padEnd(12)} │ ${String(light.state.on).padEnd(9)} │ ${String(light.state.hue).padEnd(5)} │`);
    });
    console.log('╰──────┴──────────────┴───────────┴───────╯');
    await waitForKeyPress(rl);
}

async function turnOnLight(lightId, rl) {
    const api = await connectToBridge(rl);
    const lights = await api.lights.getAll();
    const light = lights.find(l => l.id === lightId);

    if (!light) {
        console.error(`Invalid light ID: ${lightId}`);
        await waitForKeyPress(rl);
        return;
    }

    const state = new LightState().on().brightness(100);
    await api.lights.setLightState(lightId, state);
    console.log(`Light ${lightId} turned on`);
    await waitForKeyPress(rl);
}

async function turnOffLight(lightId, rl) {
    const api = await connectToBridge(rl);
    const lights = await api.lights.getAll();
    const light = lights.find(l => l.id === lightId);

    if (!light) {
        console.error(`Invalid light ID: ${lightId}`);
        await waitForKeyPress(rl);
        return;
    }

    const state = new LightState().off();
    await api.lights.setLightState(lightId, state);
    console.log(`Light ${lightId} turned off`);
    await waitForKeyPress(rl);
}

function promptUser() {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    async function askQuestion() {
        console.clear();
        console.log("╭─────────────────────╮");
        console.log("│         MENU        │");
        console.log("╰─────────────────────╯");
        console.log("┌─────────────────────┐");
        console.log("│ 1. List all lights  │");
        console.log("│ 2. Turn on light    │");
        console.log("│ 3. Turn off light   │");
        console.log("│ 4. Exit             │");
        console.log("└─────────────────────┘");
        rl.question('Command » ', async (action) => {
            try {
                switch (action) {
                    case '1':
                        console.clear();
                        console.log("╭─────────────────────╮");
                        console.log("│        LIGHTS       │");
                        console.log("╰─────────────────────╯");
                        await listAllLights(rl);
                        askQuestion();
                        break;
                    case '2':
                        console.clear();
                        console.log("╭─────────────────────╮");
                        console.log("│   TURN ON LIGHTS    │");
                        console.log("╰─────────────────────╯");
                        rl.question('Enter the light ID to turn on: ', async (lightId) => {
                            await turnOnLight(parseInt(lightId), rl);
                            askQuestion();
                        });
                        break;
                    case '3':
                        console.clear();
                        console.log("╭─────────────────────╮");
                        console.log("│   TURN OFF LIGHTS   │");
                        console.log("╰─────────────────────╯");
                        rl.question('Enter the light ID to turn off: ', async (lightId) => {
                            await turnOffLight(parseInt(lightId), rl);
                            askQuestion();
                        });
                        break;
                    case '4':
                        console.clear();
                        console.log("╭─────────────────────╮");
                        console.log("│      GOODBYE!       │");
                        console.log("╰─────────────────────╯");
                        console.log('Exiting...');
                        rl.close();
                        break;
                    default:
                        console.log('Invalid option');
                        await waitForKeyPress(rl);
                        askQuestion();
                        break;
                }
            } catch (err) {
                console.error(`Unexpected error: ${err.message}`);
                await waitForKeyPress(rl);
                askQuestion();
            }
        });
    }

    askQuestion();
}

promptUser();

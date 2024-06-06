# Hue Lights Manager

Hue Lights Manager is a Node.js application designed to manage Philips Hue lights. This app allows you to list all connected lights, turn them on or off, and create users for the Hue Bridge.

## Features

- Discover and connect to your Philips Hue Bridge
- List all connected lights with their status and hue values
- Turn lights on and off
- Create new users for the Hue Bridge

## Prerequisites

- Node.js (v12 or higher)
- Philips Hue Bridge and lights

## Installation

1. Clone the repository:
    ```bash
    git clone https://github.com/DavidH45/hue-lights-manager.git
    cd hue-lights-manager
    ```

2. Install the dependencies:
    ```bash
    npm install
    ```

3. Create a `.env` file in the root directory with the following content:
    ```
    HUE_USERNAME= (Leave this blank, app will auto-generate new user)
    BRIDGE_IP=your-bridge-ip (Get this from Philips Hue App)
    ```

## Usage

1. Start the application:
    ```bash
    node index.js
    ```

2. Follow the on-screen menu to list lights, turn lights on or off, and manage users.

## Code Overview

The app consists of the following main functions:

- `discoverBridge()`: Discover the Hue Bridge on the local network.
- `createUser(rl)`: Create a new user for the Hue Bridge.
- `connectToBridge(rl)`: Connect to the Hue Bridge using the provided username.
- `listAllLights(rl)`: List all connected lights with their status and hue values.
- `turnOnLight(lightId, rl)`: Turn on a specific light by its ID.
- `turnOffLight(lightId, rl)`: Turn off a specific light by its ID.
- `promptUser()`: Display the main menu and handle user input.

## Notice

This project was created for learning purposes; feel free to use this however you wish.

## License

This project is licensed under the MIT License. See the LICENSE file for details.

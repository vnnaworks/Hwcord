const inject = require('./injection/inject');
const os = require('os');
const path = require('path');
const ps = require('ps-node');
const fs = require('fs');
const { exec, spawn } = require('child_process');
const readline = require('readline');
const homeDir = os.homedir();
const discordDir = path.join(homeDir, 'AppData', 'Local', 'Discord');
const appDir = fs.readdirSync(discordDir).find(dir => dir.startsWith('app-'));
const discordPath = path.join(discordDir, appDir, 'Discord.exe');
const portt = 8009;
var clc = require("cli-color");
const figlet = require('figlet');
let isConnectedLogged = false
let discord;

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

async function main() {
    const target = discordPath;
    const scriptsDir = path.join(__dirname, 'scripts');
    const scripts = fs.readdirSync(scriptsDir).map(file => path.join(scriptsDir, file));
    const port = portt;

    ps.lookup({
        command: 'Discord.exe',
    }, (err, resultList ) => {
        if (err) {
            console.error('An error occurred:', err);
            return;
        }

        if (resultList.length > 0) {
            exec('taskkill /IM Discord.exe /F', (err) => {
                if (err) {
                    console.error('Failed to kill Discord process:', err);
                    return;
                }

                console.log('[HWSB]: Killed discord! ✅');
                startDiscord();
            });
        } else {
            startDiscord();
        }
    });

    function startDiscord() {
        console.clear();
        console.log(clc.blue(figlet.textSync('HWSB')));
        console.log(clc.green("Welcome to HWSB!"));
        console.log(clc.white("Created by CasualDev"));

        discord = spawn(target, [`--remote-debugging-port=${port}`, `--remote-allow-origins=http://localhost:${port}`]);

        discord.stdout.on('data', async (data) => { 
            if (!isConnectedLogged) {
                console.log(clc.green(`[HWSB]: Connected to Discord! ✅`));
                isConnectedLogged = true;
            }
            if (data.includes('splashScreen.pageReady')) {
                console.log(clc.yellow("[HWSB]: Injecting... ⚠️"));
                try {
                    await inject(target, scripts, port);
                    console.log(clc.green("[HWSB]: Done! ✅"));
                    commandPrompt();
                } catch (err) {
                    console.error(clc.red('[HWSB]: An error occurred ❌ ', err.message || err));
                    process.exit(1);
                }
            }
        });
    }

    function commandPrompt() {
        rl.question('Enter a command: ', (command) => {
            if (command === 'reload') {
                console.log(clc.yellow('[HWSB]: Reloading... ⚠️'));
                discord.kill();
                isConnectedLogged = false;
                main();
            } else if (command === 'reinject') {
                console.log(clc.yellow('[HWSB]: Reinjecting... ⚠️'));
                inject(target, scripts, port)
                    .then(() => {
                        console.log(clc.green("[HWSB]: Done! ✅"));
                        commandPrompt();
                    })
                    .catch(err => {
                        console.error(clc.red('[HWSB]: An error occurred ❌ ', err.message || err));
                        process.exit(1);
                    });
                } else if (command === 'exit') {
                console.log(clc.red('[HWSB]: Exiting... ❌'));
                discord.kill();
                process.exit(0);
                } else if (command === 'help') {
                console.log(clc.white('reload - Reloads Discord'));
                console.log(clc.white('reinject - Reinjects scripts'));
                console.log(clc.white('exit - Exits HWSB'));
                commandPrompt();
            } else {
                console.log('Unknown command.');
                commandPrompt();
            }
        });
    }    
}


main();
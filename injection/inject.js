const fs = require('fs').promises;
const ED = require('../debug/debug');
var clc = require("cli-color");

async function inject(target, scripts = [], port = null) {
    scripts = await Promise.all(scripts.map(async name => ({[name]: await fs.readFile(name, 'utf-8')})));
    scripts = Object.assign({}, ...scripts);

    const erb = new ED('localhost', port);

    const windowsVisited = new Set();
    let allWindowsVisited = false;

    while (!allWindowsVisited) {
        const windows = await erb.windows();

        const newWindows = windows.filter(w => !windowsVisited.has(w.id));

        const windowsToInject = newWindows.filter(w => w.title !== "Discord Updater");

        for (const window of windowsToInject) {
            for (const [name, content] of Object.entries(scripts)) {
                try {
                    console.log(clc.yellow(`[HWSB]: Injecting ${name} into ${window.id} ⚠️`));
                    await erb.eval(window, content);
                    console.log(clc.green(`[HWSB]: Injected ${name} into ${window.id} ✅`));
                    await new Promise(resolve => setTimeout(resolve, 2000)); 
                } catch (e) {
                    console.error(`Error injecting ${name} into ${window.id}:`, e);
                }
            }
            windowsVisited.add(window.id);
        }

        allWindowsVisited = windows.every(w => windowsVisited.has(w.id));
        await new Promise(resolve => setTimeout(resolve, 1000)); 
    }
}

module.exports = inject;
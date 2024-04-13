const WebSocket = require('ws');
const axios = require('axios');

class ED {
    constructor(host, port) {
        this.host = host;
        this.port = port;
    }

    async windows() {
        const response = await axios.get(`http://${this.host}:${this.port}/json/list`);
        return response.data.map(w => {
            w.ws = new WebSocket(w.webSocketDebuggerUrl);
            return w;
        });
    }

    async eval(w, expression) {
        const data = {
            id: 1,
            method: "Runtime.evaluate",
            params: {
                contextId: 1,
                doNotPauseOnExceptionsAndMuteConsole: false,
                expression: expression,
                generatePreview: false,
                includeCommandLineAPI: true,
                objectGroup: 'console',
                returnByValue: false,
                userGesture: true
            }
        };
    
        return new Promise((resolve, reject) => {
            const handleMessage = message => {
                const ret = JSON.parse(message);
                if (!ret.result) {
                    reject(ret);
                } else if (ret.result.wasThrown) {
                    reject(ret.result.result);
                } else {
                    resolve(ret.result);
                }
                w.ws.close();
            };
    
            w.ws.on('message', handleMessage);
    
            w.ws.on('open', () => {
                w.ws.send(JSON.stringify(data));
            });
    
            
            w.ws.on('close', () => {
                w.ws.removeListener('message', handleMessage);
            });
    
            
            w.ws.on('error', err => {
                reject(err);
            });
        });
    }
}

module.exports = ED;
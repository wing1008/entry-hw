const spawn = require('cross-spawn');
const { app } = require('electron');
const path = require('path');

class ServerWrapper {
    constructor(router) {
        // this.childProcess = new Server();
        this.childProcess = spawn(this._getServerFilePath(), [], {
            stdio: ['ignore', 'inherit', 'inherit', 'ipc'],
            detached: true,
        });
        this.router = router;
    }

    _getServerFilePath() {
        const asarIndex = app.getAppPath().indexOf(`${path.sep}app.asar`);
        if (asarIndex > -1) {
            return path.join(app.getAppPath().substr(0, asarIndex), 'server.exe');
        } else {
            return path.resolve(__dirname, 'server.exe');
        }
    }

    open() {
        this._receiveFromChildEventRegister();
        this._sendToChild('open');
        // this.childProcess.open();
    }

    close() {
        this.childProcess && this.childProcess.kill();
    }

    addRoomIdsOnSecondInstance(roomId) {
        // this.childProcess.addRoomId(roomId);
        this._sendToChild('addRoomId', roomId);
    }

    disconnectHardware() {
        // this.childProcess.disconnectHardware();
        this._sendToChild('disconnectHardware');
    }

    send(data) {
        // this.childProcess.sendToClient(data);
        this._sendToChild('send', data);
    }

    /**
     * @param methodName{string}
     * @param message{Object?}
     * @private
     */
    _sendToChild(methodName, message) {
        this.childProcess && this.childProcess.send && this.childProcess.send({
            key: methodName,
            value: message,
        });
    }

    _receiveFromChildEventRegister() {
        // this.childProcess.on('cloudModeChanged', (mode) => {
        //     this.router.notifyServerMode(mode);
        // });
        // this.childProcess.on('runningModeChanged', (mode) => {
        //     this.router.notifyServerMode(mode);
        // });
        // this.childProcess.on('message', (message) => {
        //     this.router.handleServerData(message);
        // });
        // this.childProcess.on('close', () => {

        // });
        this.childProcess && this.childProcess.on('message', (message) => {
            console.log('register from ', message);
            const { key, value } = message;
            switch (key) {
                case 'cloudModeChanged': {
                    this.router.notifyServerMode(value);
                    break;
                }
                case 'runningModeChanged': {
                    this.router.notifyServerMode(value);
                    break;
                }
                case 'data': {
                    this.router.handleServerData(value);
                    break;
                }
                case 'close': {
                    //TODO 서버가 닫혔다는 신호가 필요하면 이곳에서 처리
                    break;
                }
                default: {
                    console.error('unhandled pkg server message', key, value);
                }
            }
        });
    }
}

module.exports = ServerWrapper;
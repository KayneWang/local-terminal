import { Terminal, ITerminalOptions } from 'xterm'

class LocalTerminal {
    private term: Terminal;

    constructor(term: Terminal, option: ITerminalOptions = {}) {
        this.term = term;

        this.init()
    }

    init() {
        this.term.onData((data: string) => this.handleInputData(data))
    }

    handleInputData(data: string) {
        // if (!this._active) {
        //     return;
        // }

        // if data look like a pasted input.
        if (data.length > 3 && data.charCodeAt(0) !== 0x1b) {
            const _data = data.replace(/[\r\n]+/g, "\r");
            Array.from(_data).forEach(c => {
                // write data
            })
        } else {
            // write data
        }
    }

    writeData(data: string) {

    }
}

export default LocalTerminal
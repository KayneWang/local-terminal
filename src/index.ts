import { Terminal, ITerminalOptions } from 'xterm'
import { countLines, offsetToColRow } from './utils';

interface ITermSize {
    cols: number;
    rows: number;
}

interface IOptions extends ITerminalOptions {
    prompt?: string;
}

class LocalTerminal {
    private term: Terminal;
    private _cursor: number;
    private _input: string;
    private _termSize: ITermSize;
    private _prompt: string;

    constructor(term: Terminal, option: IOptions = {}) {
        this.term = term;

        this._cursor = 0;
        this._input = "";
        this._termSize = {
            cols: term.cols,
            rows: term.rows
        }

        this._prompt = option.prompt

        this.init()
    }

    init() {
        this.term.onData((data: string) => this.handleInputData(data))
    }

    handleInputData(data: string) {
        // if data look like a pasted input.
        if (data.length > 3 && data.charCodeAt(0) !== 0x1b) {
            const _data = data.replace(/[\r\n]+/g, "\r");
            Array.from(_data).forEach(c => {
                this.writeData(c)
            })
        } else {
            this.writeData(data)
        }
    }

    writeData(data: string) {
        const ord = data.charCodeAt(0)
        let ofs

        if (ord === 0x1b) {
            console.log(data.substr(1))
            switch (data.substr(1)) {
                case '[A': // Up arrow
                    // TODO: 上一条历史命令
                    break

                case '[B': // Down arrow
                    // TODO: 下一条历史命令
                    break

                case '[D': // Left arrow
                    this.handleCursorMove(-1)
                    break

                case '[C': // Right arrow
                    this.handleCursorMove(1)
                    break

                case '[3~': // Delete
                    this.handleCursorEarse(false)
                    break

                case '[F': // End
                    this.setCursor(this._input.length)
                    break

                case '[H': // Home
                    this.setCursor(0)
                    break

                default:
                    break
            }

            // Special characters
        } else if (ord < 32 || ord === 0x7f) {
            // TODO
            console.log(data)
        } else {
            // Basic input
            this.handleCursorInster(data)
        }
    }

    /**
     * cursor move
     */
    handleCursorMove(dir: number) {
        // TODO
        console.log('cursor move', dir)
    }

    /**
     * Earse character at cursor location
     */
    handleCursorEarse(backspace) {
        const { _cursor, _input } = this
        if (backspace) { // cursor need backspace
            // TODO
        } else {
            // TODO
        }
    }

    /**
     * Set the new cursor postion
     */
    setCursor(newCursor: number) {
        // TODO
        console.log('set cursor: ', newCursor)
    }

    /**
     * Insert character at cursor location
     */
    handleCursorInster(data: string) {
        const { _cursor, _input } = this
        const newInput = _input.substr(0, _cursor) + data + _input.substr(_cursor)
        this._cursor += data.length
        // real input
        this.setInput(newInput)
    }

    /**
     * Replace input with the new input given
     */
    setInput(newInput: string, clearInput: boolean = true) {
        if (clearInput) {
            // clear current input
            // TODO
        }

        // write the new input with prompt
        const newPrompt = this.applyPrompt(newInput)
        this.print(newPrompt)

        // trim cursor overflow
        if (this._cursor > newInput.length) {
            this._cursor = newInput.length
        }

        // move the cursor to the appropriate row/col
        const newCursor = this.applyPromptOffset(newInput, this._cursor)
        const newLines = countLines(newPrompt, this._termSize.cols)
        const { col, row } = offsetToColRow(newInput, newCursor, this._termSize.cols)
        const moveUpRows = newLines - row - 1

        this.term.write('\r')
        for (let i = 0; i < moveUpRows; i++) {
            this.term.write('\x1B[F')
        }
        for (let i = 0; i < col; i++) {
            this.term.write('\x1B[C')
        }

        this._input = newInput
    }

    applyPrompt(input: string): string {
        const prompt = this._prompt || ''
        return prompt + input
    }

    applyPromptOffset(input: string, offset: number): number {
        const newInput = this.applyPrompt(input.substr(0, offset))
        return newInput.length
    }

    print(message: string) {
        const normInput = message.replace(/[\r\n]+/g, '\n')
        this.term.write(normInput.replace(/\n/g, '\r\n'))
    }
}

export default LocalTerminal
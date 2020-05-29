import { Terminal, ITerminalOptions } from 'xterm'
import { countLines, offsetToColRow } from './utils';

interface ITermSize {
    cols: number;
    rows: number;
}

interface IActivePrompt {
    prompt?: string;
    continuationPrompt?: string;
}

interface IOptions extends ITerminalOptions {
    prompt?: IActivePrompt;
}

class LocalTerminal {
    private term: Terminal;
    private _cursor: number;
    private _input: string;
    private _termSize: ITermSize;
    private _activePrompt: IActivePrompt;

    constructor(term: Terminal, option: IOptions = {}) {
        this.term = term;

        this._cursor = 0;
        this._input = "";
        this._termSize = {
            cols: term.cols,
            rows: term.rows
        }

        this._activePrompt = option.prompt

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

        if (ord === 0x1b) {
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
            switch (data) {
                case '\r': // Enter
                    console.log('enter')
                    break
                case '\x7F': // Backspace
                    this.handleCursorEarse(true)
                    break
            }
        } else {
            // Basic input
            this.handleCursorInster(data)
        }
    }

    /**
     * cursor move
     */
    handleCursorMove(dir: number) {
        let num = 0
        if (dir > 0) {
            // right move, if current cursor location equal input length, should not move
            num = Math.min(dir, this._input.length - this._cursor)
        } else if (dir < 0) {
            // left move
            num = Math.max(dir, -this._cursor)
        }
        this.setCursor(this._cursor + num)
    }

    /**
     * Earse character at cursor location
     */
    handleCursorEarse(backspace: boolean) {
        const { _cursor, _input } = this
        if (backspace) { // cursor need backspace
            if (_cursor <= 0) return
            const newInput = _input.substr(0, _cursor - 1) + _input.substr(_cursor)
            this.clearInput()
            this._cursor -= 1
            this.setInput(newInput, false)
        } else {
            const newInput = _input.substr(0, _cursor) + _input.substr(_cursor + 1)
            this.setInput(newInput)
        }
    }

    /**
     * Set the new cursor postion
     */
    setCursor(newCursor: number) {
        if (newCursor < 0) {
            newCursor = 0
        }
        if (newCursor > this._input.length) {
            newCursor = this._input.length
        }

        const inputWithPrompt = this.applyPrompts(this._input)

        // previous cursor position
        const prevPromptOffset = this.applyPromptOffset(this._input, this._cursor)
        const { col: prevCol, row: prevRow } = offsetToColRow(inputWithPrompt, prevPromptOffset, this._termSize.cols)

        // next cursor position
        const newPromptOffset = this.applyPromptOffset(this._input, newCursor)
        const { col: newCol, row: newRow } = offsetToColRow(inputWithPrompt, newPromptOffset, this._termSize.cols)

        // adjust vertically
        if (newRow > prevRow) {
            for (let i = prevRow; i < newRow; i++) {
                this.term.write('\x1B[B')
            }
        } else {
            for (let i = newRow; i < prevRow; i++) {
                this.term.write('\x1B[A')
            }
        }

        // adjust horizontally
        if (newCol > prevCol) {
            for (let i = prevCol; i < newCol; i++) {
                this.term.write('\x1B[C')
            }
        } else {
            for (let i = newCol; i < prevCol; i++) {
                this.term.write('\x1B[D')
            }
        }

        this._cursor = newCursor
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
            this.clearInput()
        }

        // write the new input with prompt
        const newPrompt = this.applyPrompts(newInput)
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

    clearInput() {
        const currentPrompt = this.applyPrompts(this._input)
        const allRows = countLines(this._input, this._termSize.cols)
        const promptCursor = this.applyPromptOffset(this._input, this._cursor)
        const { row } = offsetToColRow(currentPrompt, promptCursor, this._termSize.cols)

        const moveRows = allRows - row - 1
        for (let i = 0; i < moveRows; i++) {
            this.term.write('\x1B[E')
        }

        this.term.write('\x1B[K')
        for (let i = 0; i < allRows; i++) {
            this.term.write('\x1B[F\x1B[K')
        }
    }

    applyPrompts(input: string): string {
        const prompt = (this._activePrompt || {}).prompt || ''
        const continuationPrompt = (this._activePrompt || {}).continuationPrompt || '> '
        return prompt + input.replace(/\n/g, continuationPrompt)
    }

    applyPromptOffset(input: string, offset: number): number {
        const newInput = this.applyPrompts(input.substr(0, offset))
        return newInput.length
    }

    print(message: string) {
        const normInput = message.replace(/[\r\n]+/g, '\n')
        this.term.write(normInput.replace(/\n/g, '\r\n'))
    }
}

export default LocalTerminal
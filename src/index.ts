import { Terminal } from 'xterm'
import { countLines, offsetToColRow, isIncompleteInput } from './utils';

interface ITermSize {
    cols: number;
    rows: number;
}

interface IActivePrompt {
    prompt?: string;
    continuationPrompt?: string;
    resolve?: (value: string) => void;
    reject?: (reason: any) => void;
}

interface IOptions {
}

class LocalTerminal {
    private term: Terminal;
    private _cursor: number;
    private _input: string;
    private _active: boolean;
    private _activePrompt: IActivePrompt;
    private _termSize: ITermSize;

    constructor(term: Terminal, option: IOptions = {}) {
        this.term = term

        this._cursor = 0
        this._input = ""
        this._active = false
        this._activePrompt = null
        this._termSize = {
            cols: term.cols,
            rows: term.rows
        }

        this.init()
    }

    private init() {
        this.term.onData((data: string) => this.handleInputData(data))
    }

    private handleInputData(data: string) {
        if (!this._active) return

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

    private writeData(data: string) {
        if (!this._active) return

        const ord = data.charCodeAt(0)

        if (ord === 0x1b) {
            switch (data.substr(1)) {
                case '[A': // Up arrow
                    // TODO: last history command
                    break

                case '[B': // Down arrow
                    // TODO: next history command
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
                    if (isIncompleteInput(this._input)) {
                        this.handleCursorInster('\n')
                    } else {
                        // complete
                        this.handleReadComplete()
                    }
                    break

                case '\x7F': // Backspace
                    this.handleCursorEarse(true)
                    break

                case '\x03': // Ctrl + C
                    this.term.write('^C\r\n' + ((this._activePrompt || {}).prompt || ""))
                    this._input = ""
                    this._cursor = 0
                    // TODO: history rewind
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
    private handleCursorMove(dir: number) {
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
    private handleCursorEarse(backspace: boolean) {
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
    private setCursor(newCursor: number) {
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
    private handleCursorInster(data: string) {
        const { _cursor, _input } = this
        const newInput = _input.substr(0, _cursor) + data + _input.substr(_cursor)
        this._cursor += data.length
        // real input
        this.setInput(newInput)
    }

    /**
     * Replace input with the new input given
     */
    private setInput(newInput: string, clearInput: boolean = true) {
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
        const { col, row } = offsetToColRow(newPrompt, newCursor, this._termSize.cols)
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

    private clearInput() {
        const currentPrompt = this.applyPrompts(this._input)
        const allRows = countLines(currentPrompt, this._termSize.cols)
        const promptCursor = this.applyPromptOffset(this._input, this._cursor)
        const { row } = offsetToColRow(currentPrompt, promptCursor, this._termSize.cols)

        const moveRows = allRows - row - 1
        for (let i = 0; i < moveRows; i++) {
            this.term.write('\x1B[E')
        }

        this.term.write('\r\x1B[K')
        for (let i = 1; i < allRows; i++) {
            this.term.write('\x1B[F\x1B[K')
        }
    }

    private applyPrompts(input: string): string {
        const prompt = (this._activePrompt || {}).prompt || ''
        const continuationPrompt = (this._activePrompt || {}).continuationPrompt || ''
        return prompt + input.replace(/\n/g, '\n' + continuationPrompt)
    }

    private applyPromptOffset(input: string, offset: number): number {
        const newInput = this.applyPrompts(input.substr(0, offset))
        return newInput.length
    }

    public handleReadComplete() {
        // TODO: append history

        if (this._activePrompt) {
            this._activePrompt.resolve(this._input)
            this._activePrompt = null
        }
        this.term.write('\r\n')
        this._active = false
    }

    public print(message: string) {
        const normInput = message.replace(/[\r\n]+/g, '\n')
        this.term.write(normInput.replace(/\n/g, '\r\n'))
    }

    public read(prompt: string, continuationPrompt: string = '>') {
        return new Promise((resolve, reject) => {
            this.term.write(prompt)
            this._activePrompt = {
                prompt: prompt,
                continuationPrompt: continuationPrompt,
                resolve: resolve,
                reject: reject
            }

            this._active = true
            this._input = ""
            this._cursor = 0
        })
    }
}

export default LocalTerminal
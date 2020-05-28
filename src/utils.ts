export function countLines(input: string, maxCols: number): number {
    return offsetToColRow(input, input.length, maxCols).row + 1
}

export function offsetToColRow(input: string, offset, maxCols: number): { col: number; row: number } {
    let col = 0
    let row = 0

    for (let i = 0; i < offset; i++) {
        const chr = input.charAt(i)
        if (chr === '\n') {
            col = 0
            row += 1
        } else {
            col += 1
            row = 0
            if (col > maxCols) {
                col = 0
                row += 1
            }
        }
    }

    return { col, row }
}
export function countLines(input: string, maxCols: number): number {
    return offsetToColRow(input, input.length, maxCols).row + 1
}

export function offsetToColRow(input: string, offset: number, maxCols: number): { col: number; row: number } {
    let col = 0
    let row = 0

    for (let i = 0; i < offset; i++) {
        const chr = input.charAt(i)
        if (chr === '\n') {
            col = 0
            row += 1
        } else {
            col += 1
            if (col > maxCols) {
                col = 0
                row += 1
            }
        }
    }

    return { col, row }
}

/**
 * Checks if there is an incomplete input
 *
 * An incomplete input is considered:
 * - An input that contains unterminated single quotes
 * - An input that contains unterminated double quotes
 * - An input that ends with "\"
 * - An input that has an incomplete boolean shell expression (&& and ||)
 * - An incomplete pipe expression (|)
 */
export function isIncompleteInput(input: string) {
    // Empty input is not incomplete
    if (input.trim() == "") {
        return false;
    }

    // Check for dangling single-quote strings
    if ((input.match(/'/g) || []).length % 2 !== 0) {
        return true;
    }
    // Check for dangling double-quote strings
    if ((input.match(/"/g) || []).length % 2 !== 0) {
        return true;
    }
    // Check for dangling boolean or pipe operations
    if (
        input
            .split(/(\|\||\||&&)/g)
            .pop()
            .trim() == ""
    ) {
        return true;
    }
    // Check for tailing slash
    if (input.endsWith("\\") && !input.endsWith("\\\\")) {
        return true;
    }

    return false;
}
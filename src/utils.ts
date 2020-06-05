import { parse } from 'shell-quote'
import { IAutocompleteHandler, AutocompleteHandlerFn } from './index'

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

/**
 * Check tailing whitespace
 */
export function hasTailingWhitespace(input: string): boolean {
    return input.match(/[^\\][ \t]$/m) !== null
}

/**
 * Returns the auto-complete candidates for the given input
 */
export function collectAutocompleteCandidates(callbacks: IAutocompleteHandler[], input: string): string[] {
    const tokens: string[] = parse(input)
    let index = tokens.length - 1
    let expr = tokens[index] || ""

    if (input.trim() === '') {
        index = 0
        expr = ""
    } else if (hasTailingWhitespace(input)) {
        index += 1
        expr = ""
    }

    const all = callbacks.reduce<string[]>((candidates, { fn, args }) => {
        try {
            return candidates.concat(fn(index, tokens, ...args))
        } catch (error) {
            console.error('Autocomplete error:', error)
            return candidates
        }
    }, [])

    return all.filter(txt => txt.startsWith(expr))
}

export function getLastToken(input: string): string {
    if (input.trim() === '') return ''
    if (hasTailingWhitespace(input)) return ''

    const tokens: string[] = parse(input)
    return tokens.pop() || ''
}

export function getSharedFragment(fragment: string, candidates: string[]): string {
    if (fragment.length >= candidates[0].length) return fragment

    const oldFragment = fragment

    fragment += candidates[0].slice(fragment.length, fragment.length + 1)

    for (let i = 0; i < candidates.length; i++) {
        // this is wrong candidate
        if (!candidates[i].startsWith(oldFragment)) return ''

        if (!candidates[i].startsWith(fragment)) return oldFragment
    }

    return getSharedFragment(fragment, candidates)
}
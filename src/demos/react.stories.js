import React, { useRef, useEffect } from 'react';
import { Terminal } from 'xterm'
/**
 * When use npm package you should:
 * import LocalTerminal from 'local-termianl'
 */
import LocalTerminal from '../index'
import 'xterm/css/xterm.css'

export default { title: 'Terminal' };

export const ReactDemo = () => {
    const container = useRef(null)

    useEffect(() => {
        const xterm = new Terminal({
            cursorBlink: true
        })

        const local = new LocalTerminal(xterm)
        LocalTerminalListener(local)
        local.addAutocompleteHandler(autocompleteCommonCommands)

        if (container.current) {
            xterm.open(container.current)
        }
    }, [])

    const LocalTerminalListener = (lc) => {
        lc.read('~ ')
            .then((input) => {
                otherOperation(lc, input)
            })
            .catch((err) => {
                console.error(err)
            })
    }

    const otherOperation = (lc, input) => {
        // add clear command
        if (input === 'clear') {
            lc.clear()
        } else {
            lc.print('local terminal command: ' + input)
            lc.handleReadComplete()
        }

        // continue listening
        LocalTerminalListener(lc)
    }

    const autocompleteCommonCommands = (index, tokens) => {
        if (index === 0) {
            return ["cp", "mv", "ls", "chown"]
        }
        return []
    }


    return <div ref={container} />
}

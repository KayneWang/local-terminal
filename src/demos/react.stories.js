import React, { useRef, useEffect } from 'react';
import { Terminal } from 'xterm'
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


    return <div ref={container} />
}

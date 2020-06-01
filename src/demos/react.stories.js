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
                lc.print('local terminal command: ' + input)
                lc.handleReadComplete()

                // callback the listener
                LocalTerminalListener(lc)
            })
            .catch((err) => {
                console.error(err)
            })
    }


    return <div ref={container} />
}

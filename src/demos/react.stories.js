import React, { useRef, useEffect } from 'react';
import { Terminal } from 'xterm'
import LocalTerminal from '../index'
import 'xterm/css/xterm.css'

export default { title: 'Terminal' };

export const TerminalWithReact = () => {
    const container = useRef(null)

    useEffect(() => {
        const xterm = new Terminal()
        const local = new LocalTerminal(xterm)
        console.log('local terminal:', local)
        if (container.current) {
            xterm.open(container.current)
        }
    }, [])

    return <div ref={container} />
}

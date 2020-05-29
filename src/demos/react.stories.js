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

        const local = new LocalTerminal(xterm, {
            // activePrompt: {
            //     prompt: '~$ '
            // },
            // getInput: (input) => {
            //     local.print('I get command input: ' + input)
            // }
        })

        if (container.current) {
            xterm.open(container.current)
        }
    }, [])


    return <div ref={container} />
}

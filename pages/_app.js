import '../styles/globals.css'
import { SessionProvider } from "next-auth/react"

import { setChonkyDefaults } from 'chonky';
import { ChonkyIconFA } from 'chonky-icon-fontawesome';

setChonkyDefaults({
    iconComponent: ChonkyIconFA,
    disableDragAndDrop: true,
    disableSelection: true
});

export default function App({
    Component,
    pageProps: { session, ...pageProps },
}) {
    return (
        <SessionProvider session={session}>
            <Component {...pageProps} />
        </SessionProvider>
    )
}
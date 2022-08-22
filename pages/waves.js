import { Card, Center } from '@mantine/core';
import VideoJS from '../components/video.js';
import { useRef, useState, useEffect } from 'react';
import { useRouter } from "next/router";
import Loading from '-!svg-react-loader?name=Loading!../public/waves/loading.svg';

export default function Waves() {
    const router = useRouter();
    const query = router.query;
    const wavesOptions = {
        autoplay: true,
        controls: true,
        responsive: true,
        fill: true
    };
    const playerRef = useRef(null);

    const handlePlayerReady = (player) => {

        playerRef.current = player;

        if (router.isReady) {
            player.src({
                src: '/api/waves?id=' + query.id,
                type: 'video/mp4'
            })
        }

        // You can handle player events here, for example:
        // player.on('waiting', () => {
        //     videojs.log('player is waiting');
        // });

        // player.on('dispose', () => {
        //     videojs.log('player will dispose');
        // });
    };

    return (
        <div className="fixed inset-0 w-full h-full">
            {(router.isReady) ? <VideoJS options={wavesOptions} onReady={handlePlayerReady} /> : <Loading />}
        </div>
    )
}
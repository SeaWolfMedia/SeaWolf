import React from 'react';
import videojs from 'video.js';
import 'videojs-mobile-ui'
import 'video.js/dist/video-js.css';
import 'videojs-mobile-ui/dist/videojs-mobile-ui.css';

// export function VideoJS(props) {
//     const videoRef = useRef(null);
//     const playerRef = useRef(null);
//     const { options, onReady } = props;
//     return (
//         <div data-vjs-player>
//             <video ref={videoRef} className='video-js vjs-big-play-centered' />
//         </div>
//     )
// }

export const VideoJS = (props) => {
    const videoRef = React.useRef(null);
    const playerRef = React.useRef(null);
    const { options, onReady } = props;

    React.useEffect(() => {

        // Make sure Video.js player is only initialized once
        if (!playerRef.current) {
            const videoElement = videoRef.current;

            if (!videoElement) return;

            const player = playerRef.current = videojs(videoElement, options, () => {
                videojs.log('player is ready');
                onReady && onReady(player);
            });

            player.mobileUi();

            // You could update an existing player in the `else` block here
            // on prop change, for example:
        } else {
            const player = playerRef.current;

            //player.autoplay(options.autoplay);
            player.src(options.sources);
        }
    }, [options]);//, videoRef]);

    // Dispose the Video.js player when the functional component unmounts
    React.useEffect(() => {
        const player = playerRef.current;

        return () => {
            if (player) {
                player.dispose();
                playerRef.current = null;
            }
        };
    }, [playerRef]);

    return (
        <div data-vjs-player>
            <video ref={videoRef} className='video-js vjs-big-play-centered vjs-default-skin' />
        </div>
    );
}

export default VideoJS;
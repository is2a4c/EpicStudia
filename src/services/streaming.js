import Hls from 'hls.js';

export const initVideoStream = ({ video, streamUrl, hlsRef, onError }) => {
    if (!video || !streamUrl) {
        return;
    }

    const handleNativeLoadedMetadata = () => {
        video.play().catch((error) => {
            console.log('Autoplay prevented:', error);
        });
    };

    if (Hls.isSupported()) {
        if (hlsRef.current) {
            hlsRef.current.destroy();
        }

        const hls = new Hls({
            enableWorker: true,
            lowLatencyMode: false,
            backBufferLength: 90,
        });

        hls.loadSource(streamUrl);
        hls.attachMedia(video);
        hlsRef.current = hls;

        hls.on(Hls.Events.MANIFEST_PARSED, () => {
            video.play().catch((error) => {
                console.log('Autoplay prevented:', error);
            });
        });

        hls.on(Hls.Events.ERROR, (event, data) => {
            if (typeof onError === 'function') {
                onError(data);
                return;
            }

            console.error('HLS error:', data);
        });

        return;
    }

    if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = streamUrl;
        video.addEventListener('loadedmetadata', handleNativeLoadedMetadata, { once: true });
    }
};

export const destroyVideoStream = (hlsRef) => {
    if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
    }
};

async function test() {
    const videoId = 'd3n8u3vwGZY'; 
    console.log('Testing Piped API for ID:', videoId);
    try {
        const response = await fetch(`https://pipedapi.kavin.rocks/streams/${videoId}`);
        const data = await response.json() as any;
        const audioStreams = data.audioStreams;
        if (audioStreams && audioStreams.length > 0) {
            console.log('Got Stream URL:', audioStreams[0].url.substring(0, 100) + '...');
        } else {
            console.log('No audio streaming formats found or error:', data.error || data);
        }
    } catch (err: any) {
        console.error('Error fetching info:', err.message);
    }
}

test();

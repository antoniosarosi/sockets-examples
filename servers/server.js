const decoder = new TextDecoder();
const encoder = new TextEncoder();
const END = 'END';

async function handleConnection(conn) {
    const buff = new Uint8Array(1024);
    const { hostname, port } = conn.remoteAddr;
    try {
        let msg = 'OK';
        while (msg !== END) {
            const bytes = await conn.read(buff);
            msg = decoder.decode(buff.subarray(0, bytes)).trim();
            console.log(msg);
            await conn.write(encoder.encode('RECEIVED'));
        }
    } catch (err) {
        if (err.name === 'BrokenPipe') {
            console.log(`Client ${hostname}:${port} disconnected unexpectedly`);
        } else {
            console.error(err);
        }
    } finally {
        await conn.close();
        console.log(`Connection with ${hostname}:${port} closed`);
    }
}

async function listen(port) {
    console.log(`Server running on port ${port}`);
    for await (const conn of Deno.listen({ port })) {
        const { hostname, port } = conn.remoteAddr;
        console.log(`New connection from ${hostname}:${port}`);
        handleConnection(conn);
    }
}

function error(msg) {
    console.error(msg);
    Deno.exit(-1);
}

async function main() {
    if (Deno.args.length < 1) {
        error('No port number recieved');
    }

    const [port] = Deno.args;
    if (isNaN(port)) {
        error(`Failed parsing port '${port}'`);
    }

    try {
        await listen(parseInt(port));
    } catch (err) {
        console.error(err);
        error('Server crashed');
    }
}

if (import.meta.main) {
    main();
}

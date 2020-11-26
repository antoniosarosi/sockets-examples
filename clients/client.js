const decoder = new TextDecoder();
const encoder = new TextEncoder();
const END = 'END';

function error(msg) {
    console.error(msg);
    Deno.exit(-1);
}

async function write(msg, output = Deno.stdout) {
    await output.write(encoder.encode(msg));
}

async function read({ input = Deno.stdin, prompt, output = Deno.stdout }) {
    if (prompt) {
        await write(prompt, output);
    }
    const buff = new Uint8Array(128);
    const bytes = await input.read(buff);

    if (bytes === Deno.EOF) {
        return END;
    }

    return decoder.decode(buff.subarray(0, bytes)).trim();
}

async function connect(hostname, port) {
    let sock;
    try {
        sock = await Deno.connect({ hostname, port });
    } catch (err) {
        error(err.message);
    }

    console.log(`Connected to ${hostname}:${port}, type END to finish`);
    const username = await read({ prompt: 'Type your username: ' });
    let msg = 'OK';
    console.log(`Send the message ${END} to finish`);
    while (msg !== END) {
        msg = await read({ prompt: 'Write a message and type enter to send it\n' });
        await write(`[${username}]: ${msg}\n`, sock);
        console.log(await read({ input: sock }));
    }

    sock.close();
    console.log('Connection closed');
}

function main() {
    if (Deno.args.length < 2) {
        error(`Missing arguments.\nArgs: [HOST] [PORT]`)
    }

    const [host, port] = Deno.args;

    if (isNaN(port)) {
        error(`Failed parsing port "${port}"`);
    }

    connect(host, parseInt(port));
}

if (import.meta.main) {
    main();
}

from sys import argv, stderr, exit
from socket import socket, AF_INET, SOCK_STREAM, gethostbyname, gaierror


END = 'END'


def error(msg):
    print(msg, file=stderr)
    exit(-1)


def connect(host, port):
    sock = socket(AF_INET, SOCK_STREAM)
    try:
        sock.connect((host, port))
    except ConnectionRefusedError:
        error(f'No server listening on {host}:{port}')

    print(f'Connected to {host}:{port}')
    username = input('Type your username: ')
    msg = 'OK'
    print(f'Send the message {END} to finish')
    while msg != END:
        msg = input('Write a message and type enter to send it\n')
        sock.send(f'[{username}]: {msg}\n'.encode('utf-8'))
        print(sock.recv(128).decode('utf-8'))

    sock.close()
    print('Connection closed')


def main():
    if len(argv) < 3:
        error(f'Missing arguments.\nUsage: {argv[0]} [HOST] [PORT]')

    try:
        host = gethostbyname(argv[1])
        port = int(argv[2])
    except gaierror:
        error(f'Host name "{argv[1]}" is invalid')
    except ValueError:
        error(f'Failed parsing port "{argv[2]}"')

    connect(host, port)


if __name__  == '__main__':
    main()

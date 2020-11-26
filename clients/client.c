#include <stdio.h>
#include <stdlib.h>
#include <unistd.h>
#include <string.h>
#include <netdb.h>

#define END "END"
#define MAX 128

void error(char *msg) {
    fprintf(stderr, msg);
    exit(-1);
}

int open_socket(char *host, char *port) {
    struct addrinfo hints, *addr;
    
    memset(&hints, 0, sizeof(hints));
    hints.ai_family = AF_UNSPEC;
    hints.ai_socktype = SOCK_STREAM;

    int info_result = getaddrinfo(host, port, &hints, &addr);
    if (info_result != 0) {
        fprintf(stderr, "%s\n", gai_strerror(info_result));
        error("Failed getting host info\n");
    }

    int sock = socket(addr->ai_family, addr->ai_socktype, addr->ai_protocol);
    if (sock < 0) {
        error("Failed creating socket\n");
    }

    if (connect(sock, addr->ai_addr, addr->ai_addrlen) < 0) {
        error("Failed connecting to server\n");
    }

    freeaddrinfo(addr);
    
    return sock;
}

void clean_buffer(char *buff) {
    int len = strlen(buff);
    if (len > 0 && buff[len - 1] == '\n') {
        buff[len - 1] = '\0';
    }
}

void connect_to(char *host, char *port) {
    int sock = open_socket(host, port);
    printf("Connected to %s:%s\n", host, port);

    printf("Type your username: ");
    char username[MAX];
    fgets(username, MAX, stdin);
    clean_buffer(username);

    printf("Send the message %s to finish\n", END);
    char user_message[MAX] = "\0";
    char reply[MAX];
    char full_message[MAX];

    while (strcmp(user_message, END) != 0) {
        printf("Write a message and type enter to send it\n");
        fgets(user_message, MAX, stdin);
        clean_buffer(user_message);

        sprintf(full_message, "[%s]: %s\n", username, user_message);
        if (send(sock, full_message, strlen(full_message), 0) < 0) {
            error("Failed sending message\n");
        }

        int bytes = recv(sock, reply, MAX - 1, 0);
        if (bytes < 0) {
            error("Failed recieving the message from the server\n");
        }
        reply[bytes] = '\0';
        printf("%s\n", reply);
    }

    close(sock);
    printf("Connection closed\n");
}

int main(int argc, char **argv) {
    if (argc < 3) {
        error("Missing arguments.\nArgs: [HOST] [PORT]\n");
    }

    connect_to(argv[1], argv[2]);
}

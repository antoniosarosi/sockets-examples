package servers;

import java.net.ServerSocket;
import java.net.BindException;
import java.net.Socket;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.io.IOException;
import java.io.BufferedReader;
import java.io.PrintWriter;
import java.io.InputStreamReader;
import java.io.OutputStreamWriter;

class StreamSocket implements AutoCloseable {
    private Socket socket;
    private BufferedReader input;
    private PrintWriter output;

    public StreamSocket(Socket socket) throws IOException {
        this.socket = socket;
        input = new BufferedReader(new InputStreamReader(socket.getInputStream()));
        output = new PrintWriter(new OutputStreamWriter(socket.getOutputStream()));
    }

    public void send(String msg) {
        output.println(msg);
        output.flush();
    }

    public String receive() throws IOException {
        String msg = input.readLine();

        return msg != null ? msg : Server.END;
    }
    
    public String host() {
        return String.format("%s:%d", socket.getInetAddress(), socket.getPort());
    }

    @Override
    public void close() throws IOException {
        socket.close();
    }        
}

class HandleConnection implements Runnable {
    private final StreamSocket socket;

    public HandleConnection(StreamSocket socket) {
        this.socket = socket;
    }

    @Override
    public void run() {
        String msg = "OK";
        try (socket) {
            while (!msg.equals(Server.END)) {
                msg = socket.receive();
                System.out.println(msg);
                socket.send("RECEIVED");
            }
        } catch (IOException e) {
            e.printStackTrace();
        } finally {
            System.out.printf("Connection with %s closed\n", socket.host());
        }
    }
}

public class Server {
    public static String END = "END";

    private static void listen(int port) {
        try (ServerSocket connection = new ServerSocket(port)) {
            System.out.printf("Server running on port %d\n", port);
            ExecutorService pool = Executors.newCachedThreadPool();
            while (true) {
                System.out.println("Waiting for connections...");
                StreamSocket socket = new StreamSocket(connection.accept());
                System.out.printf("New connection from %s\n", socket.host());
                pool.execute(new HandleConnection(socket));
            }
        } catch (BindException e) {
            error("Port %d is not available\n", port);
        } catch (IOException e) {
            e.printStackTrace();
            error("Server crashed\n");
        }
    }

    private static void error(String msg, Object... args) {
        System.err.printf(msg, args);
        System.exit(-1);
    }

    public static void main(String[] args) {
        if (args.length < 1) {
            error("No port number recieved\n");
        }
        try {
            listen(Integer.parseInt(args[0]));
        } catch(NumberFormatException e) {
            error("Failed parsing port number '%s'\n", args[0]);
        }
    }
}

# subnet-topology-demo

### Architecture Diagram

                       +----------------------+
                       |       INTERNET       |
                       |   External Traffic   |
                       +----------------------+
                                  |
                                  |
                                  v
                 +--------------------------------+
                 |         NGINX LOAD BALANCER    |
                 |                                |
                 |          Port 80:80            |
                 |                                |
                 |     Connected to both nets     |
                 +--------------------------------+
                           /             \
                          /               \
                         v                 v
          +------------------------+  +------------------------+
          |     PRIVATE NETWORK    |  |     PUBLIC NETWORK     |
          |                        |  |                        |
          |      internal: true    |  |    External access     |
          |                        |  |        (nginx)         |
          |   +----------------+   |  |                        |
          |   |   BACKEND-1    |   |  |                        |
          |   |                |   |  |                        |
          |   | Node.js Server |   |  |                        |
          |   +----------------+   |  |                        |
          |                        |  |                        |
          |   +----------------+   |  |                        |
          |   |   BACKEND-2    |   |  |                        |
          |   |                |   |  |                        |
          |   | Node.js Server |   |  |                        |
          |   +----------------+   |  |                        |
          |                        |  |                        |
          +------------------------+  +------------------------+

### Setup and Execution Guide:
Important! Make sure Docker is running
Do not run in Powershell. Recommended to run in Bash
build: docker compose up -d
verify status: docker compose ps
verify subnet isolation: curl http://localhost/3000
round robin test: for i in {1..10}; do curl -s http://localhost | grep handledBy; done
inspect reverse proxy logs (try curl http://localhost a few times): docker compose logs -f lb
test failing server: docker compose stop backend-1
for i in {1..4}; do curl -s http://localhost | grep handledBy; done
docker compose start backend-1
for i in {1..10}; do curl -s http://localhost | grep handledBy; done
teardown: docker compose down

### AI prompts:
Prompt: I used the sample prompt given to us

Answer: I was given three files of code, which looked pretty good on the first pass

Prompt: Does the nginx file include connection timeouts and retry buffers?

Answer: The minimal configuration provided earlier does not include explicit connection timeouts or retry buffers. It relies entirely on Nginx's default settings, which can leave connections hanging for up to 60 seconds if a backend node becomes unresponsive.

For a robust deployment, you should explicitly define these limits to ensure the load balancer fails over quickly and handles large responses efficiently.

Add these directives inside your location / block in the nginx.conf file:

Nginx
location / {
    proxy_pass http://backend_pool;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;

    # Connection Timeouts
    proxy_connect_timeout 5s;
    proxy_send_timeout 10s;
    proxy_read_timeout 10s;

    # Failover and Retry Logic
    proxy_next_upstream error timeout invalid_header http_500 http_502 http_503 http_504;
    proxy_next_upstream_tries 3;
    proxy_next_upstream_timeout 10s;

    # Response Buffers
    proxy_buffer_size 16k;
    proxy_buffers 4 32k;
    proxy_busy_buffers_size 64k;
}
What these settings change:

proxy_connect_timeout: Hard-caps the time Nginx waits to open a socket to the Node.js backend. A healthy internal container network should connect in milliseconds; setting this to 5 seconds prevents the proxy from locking up if a backend container silently hangs.

proxy_next_upstream: Instructs Nginx to immediately route the request to the next available backend in the pool if it encounters network errors, timeouts, or specific 5xx server errors from the initial backend.

proxy_buffers: Allocates RAM to hold the response coming from the backend before sending it to the client. If a response exceeds this memory allocation, Nginx writes the overflow to a temporary file on the disk, which significantly degrades performance.

### AI analysis
The AI (Gemini Pro) did a much better job on this one than the last assignment. The basic security of the architecture was in tact. It was missing the timeouts and retry buffers until it was asked however.


# Expensify coding challenge

## Accessing the application

### Online - over the internet

Please visit https://expensify.xently.co.ke.

### Locally - via local host

#### Using docker (compose)

1. Install [docker](https://docs.docker.com/engine/install/)
   and [docker-compose](https://docs.docker.com/compose/install/).
2. Run `docker compose up -d`. By default the application will exposed on port `80`, and can be accessed by
   visiting http://localhost. If for some reason the port is not available, then rerun the command as
   follows `PORT=<port number> docker compose up -d`, and then visit `http://localhost:<port-number>` to access the
   website.
3. To shutdown the local server, run `docker compose down`.

#### Manually - without docker

Requirements:

1. At least PHP version 8.
2. `curl` extension - provides the underlying functionality for making API calls. In ubuntu this can be installed by
   running `sudo apt[-get] install php8.1-curl`. `8.1` can be replaced with the version of PHP you installed in step 1.
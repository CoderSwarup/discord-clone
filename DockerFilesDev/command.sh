# to run this Testing Docker File in Development Mode
docker compose --env-file ../.env -f <FILE_NAME> up


# to run the postrgress
docker run -d --name my_postgres -e POSTGRES_USER=myuser -e POSTGRES_PASSWORD=mypassword -e POSTGRES_DB=mydatabase -p 5432:5432 postgres:latest

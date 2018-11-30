# ADAMANT 2FA
## Prerequisites
* [adamant-console](https://github.com/Adamant-im/adamant-console/wiki/Installation-and-configuration)
* [PostgreSQL](https://www.postgresql.org/download/)
## Setup
### Clone repository and install dependencies
    $ git clone https://github.com/Adamant-im/adamant-2fa.git
    $ cd adamant-2fa && npm i
    $ cd client && yarn install
    $ cd ../
### Create user and database
    $ sudo -u postgres psql
    postgres=# CREATE USER "adamant-2fa" WITH PASSWORD 'password';
    postgres=# CREATE DATABASE "adamant-2fa" WITH OWNER "adamant-2fa";
    $ sudo nano /etc/postgresql/10/main/pg_hba.conf
        local   adamant-2fa  adamant-2fa        md5
    $ sudo service postgresql restart
### Create tables for built-in models
    $ cd server && node create-lb-tables.js
    $ cd ../
## Start development server
### Loopback
    $ node .
### Vue
    $ cd client && yarn serve

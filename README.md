# ADAMANT 2FA Demo application
## What is ADAMANT 2FA
ADAMANT 2FA is a service to deliver one-time passwords (OTP) to ADAMANT Messenger account.

It is cheaper, more secure and reliable than SMS. [ADAMANT 2FA advantages](https://medium.com/adamant-im/adamant-is-working-on-a-perfect-2fa-solution-15280b8a3349).

Live demo is available at [2fa-demo.adamant.im](https://2fa-demo.adamant.im/signup). For instructions, read [Presenting ADAMANT 2FA article](https://medium.com/adamant-im/presenting-adamant-2fa-838db2322f7a).

## How to connect
If you own your service and want to add 2FA security for users, connect ADAMANT 2FA. It is perfect for crypto exchanges, webmail services, financial services.

To use ADAMANT 2FA, you have to install [ADAMANT Console](https://github.com/Adamant-im/adamant-console) on your server and use [`Send message`](https://github.com/Adamant-im/adamant-console/wiki/Available-Commands#message) method. 2FA codes are sent from account set in Console’s configuration. Other than that, ADAMANT 2FA implementation is no different from classical approaches of sending one-time codes. Read more: [How to connect ADAMANT 2FA to your business](https://medium.com/adamant-im/go-to-secure-2fa-on-a-blockchain-344500a5f010).

This repository is only an example of ADAMANT 2FA implementation.

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

####Get hba_file path
````
postgres=# SHOW hba_file;
              hba_file
-------------------------------------
 /usr/local/var/postgres/pg_hba.conf
(1 row)
````
    $ sudo nano /usr/local/var/postgres/pg_hba.conf
        local   adamant-2fa  adamant-2fa        md5
    $ sudo service postgresql restart
### Create tables for Loopback models
    $ cd server && node create-lb-tables.js
    $ cd ../

### Set up passPhrase in configuration
The bot will use ```config.json```, if available, or ```config.default.json``` otherwise.

    cp config.default.json config.json
    nano config.json

Enter your passphrase into passPhrase field

## Development
### Serve
    $ node .
    $ cd client && yarn serve
### Build
    $ cd client && yarn build
    $ npm i -g serve
    $ serve dist

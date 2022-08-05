# ADAMANT 2FA Demo Application

## What is ADAMANT 2FA

ADAMANT 2FA is a service to deliver one-time passwords (OTP) to ADAMANT Messenger account.

It's cheaper, more secure and reliable than SMS. [ADAMANT 2FA advantages](https://medium.com/adamant-im/adamant-is-working-on-a-perfect-2fa-solution-15280b8a3349).

Live demo is available at [2fa-demo.adamant.im](https://2fa-demo.adamant.im/signup). For details read [Presenting ADAMANT 2FA](https://medium.com/adamant-im/presenting-adamant-2fa-838db2322f7a).

## Prerequisites

* [PostgreSQL](https://www.postgresql.org/download/)

## Setup

Clone repository and install dependencies:

``` bash
git clone https://github.com/Adamant-im/adamant-2fa.git
cd adamant-2fa && npm i
cd client && yarn install
cd ../
```

Create db-user and 2fa database:

```
sudo -u postgres psql
postgres=# CREATE USER "adamant-2fa" WITH PASSWORD 'password';
postgres=# CREATE DATABASE "adamant-2fa" WITH OWNER "adamant-2fa";
```

Set up md5 auth method.
Get hba_file path:

```
postgres=# SHOW hba_file;
          hba_file
-------------------------------------
/usr/local/var/postgres/pg_hba.conf
(1 row)
```

Update hba_file and restart postgresql:

``` bash
sudo nano /usr/local/var/postgres/pg_hba.conf
  local   adamant-2fa  adamant-2fa        md5
sudo service postgresql restart
```

Create tables for Loopback models

``` bash
cd server && node create-lb-tables.js
cd ../
```

Set up ADAMANT `passPhrase` to send 2fa codes from:

```
cp config.default.json config.2fa.json
nano config.2fa.json
```

Enter your ADM passphrase into `passPhrase` field. Make sure this account has ADM to send messages with 2fa codes.

The 2FA app will use `config.2fa.json`, if available, or `config.default.json` otherwise.

## Start

### Serve (Dev mode)

``` bash
node .
cd client && yarn serve
```

### Build

```
cd client && yarn build
npm i -g serve
serve dist
```

## How to connect ADAMANT 2FA to your service

If you own a service (as email, exchange, financial interface, etc.) and want to add 2FA security for users, connect ADAMANT 2FA. To use ADAMANT 2FA, clone this project and modify client and server parts. Read more: [How to connect ADAMANT 2FA to your business](https://medium.com/adamant-im/go-to-secure-2fa-on-a-blockchain-344500a5f010).

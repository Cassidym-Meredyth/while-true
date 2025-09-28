#!/bin/bash

cd .. 
cd backend/KeyCloak

docker compose up -d
cd ../..

cd database/ && docker compose up -d
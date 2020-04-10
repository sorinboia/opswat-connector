This is a very very basic description maybe more will come.

The idea behind the code is to be able to pass file to Opswat Metadefender scan them and upload them to the backend server.
All of this without needing to change the front or backend applications.
Pre requirnements:
F5 LTM
Opswat Metadefender
Backend server


The docker container can be found at https://hub.docker.com/r/sorinboia/opswat-connector

When starting the container you need to pass ENV variables of Opswat server and backend server.


Example:

docker run -e OPSWAT=http://vault.bulwarx.com:8008/file -e BACKEND=https://www.thebackendserver.com  -p 3000:3000 sorinboia/opswat-connector
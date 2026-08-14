FROM debian:latest
LABEL maintainer='Cortex - Rodrigo Gonçalves' version="1.0" description="Cortex - Rodrigo Gonçalves"
RUN apt update && apt upgrade -y
RUN apt -y install nodejs npm
RUN apt clean
WORKDIR /cortex
COPY . .
EXPOSE 5000
RUN npm install
CMD ["npm", "start"]
# RUN cd ..
# RUN cd web
# RUN npm install
# CMD ["bash","-i"]
FROM debian:latest
LABEL maintainer='Cortex - Rodrigo Gonçalves' version="1.0" description="Cortex - Rodrigo Gonçalves"
RUN apt update && apt upgrade -y
RUN apt -y install nodejs npm redis
RUN apt clean
WORKDIR /cortex
COPY . .
EXPOSE 5000
RUN cd server
RUN npm install
CMD ["sh",  "-c", "bash", "&&""npm" "start"]
# RUN cd ..
# RUN cd web
# RUN npm install
# CMD ["bash","-i"]
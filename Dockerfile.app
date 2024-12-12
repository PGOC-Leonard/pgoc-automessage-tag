# Build step #1: Build the React front end
FROM node:16-alpine as build-step
WORKDIR /app

# Set environment variable for node_modules/.bin
ENV PATH /app/automessage-webapp/node_modules/.bin:$PATH

# Copy package.json and package-lock.json for installing dependencies
COPY automessage-webapp/package.json automessage-webapp/package-lock.json ./

# Copy the source files from the automessage-webapp folder into the container
COPY automessage-webapp/src ./src
COPY automessage-webapp/public ./public

# Install dependencies and build the React app
RUN npm install
RUN npm run build

# Build step #2: Set up Flask API with React client as static files
FROM python:3.12 as api-step
WORKDIR /app

# Copy the built React app into the Flask container (to serve it as static files)
COPY --from=build-step /app/build /app/build

# Copy the Flask app files (API code)
COPY automessage-api/ /app/

# Install Flask dependencies
COPY automessage-api/requirements.txt /app/requirements.txt
RUN pip install -r /app/requirements.txt

# Set Flask environment to production
ENV FLASK_ENV=production

# Expose the ports (React on 80, Flask on 5000)
EXPOSE 5000
EXPOSE 80


# Install and configure Nginx for static React files
RUN apt-get update && apt-get install -y nginx

# Copy custom Nginx configuration to serve React app
COPY automessage-webapp/deployment/nginx.default.conf /etc/nginx/nginx.conf

# Start both Flask app (on port 5000) and Nginx (on port 80) using supervisord
RUN pip install gunicorn
RUN apt-get install -y supervisor

# Copy the supervisor configuration file to manage both services
COPY automessage-webapp/deployment/supervisord.conf /etc/supervisor/conf.d/supervisord.conf

# Run the services with supervisord
CMD ["/usr/bin/supervisord"]

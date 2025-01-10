# The PGOC Automessage and Tag Webapp

## For Getting Pull Request

### Create SSH Keygen:
```bash
ssh-keygen -t ecdsa
```

### Navigate to Your Project Directory
```bash
cd <your project directory>
```

### Initialize Git
```bash
git init
```

### Add Your Git Configuration
```bash
git config core.sshCommand "ssh -i ~<your ssh key .pub directory>"
```

### Pull the Project
```bash
git remote add origin git@github.com:jmcanete-pgoc/web-autotag-automessage.git
git pull origin
```
### Look for the updated branch
```bash
git checkout <branchname>
```
## Install Docker on Windows and Adding Docker to User Group

### Step 1: Download Docker Desktop
1. Visit the official Docker website: [Docker Desktop for Windows](https://www.docker.com/products/docker-desktop/).
2. Download the latest version of Docker Desktop for Windows.

### Step 2: Install Docker Desktop
1. Run the downloaded installer (`Docker Desktop Installer.exe`).
2. Follow the on-screen instructions to complete the installation.
   - During installation, ensure that **Hyper-V** and **Containers** features are enabled.
3. Restart your computer if prompted.

### Step 3: Verify Docker Installation
1. Open PowerShell or Command Prompt.
2. Run the following command to check if Docker is installed and running:
   ```bash
   docker --version
   ```
   This should display the installed Docker version.

## Add Your User to the Docker-Users Group on Windows

Follow the steps below to add your user to the `docker-users` group, which allows non-admin users to run Docker commands without administrative privileges.

### 1. Open Local Users and Groups

- Press **`Win + R`** to open the Run dialog.
- Type `lusrmgr.msc` and press **Enter**.

This will open the **Local Users and Groups** window.

### 2. Add Your User to the Docker-Users Group

- In the **Local Users and Groups** window, click on **Groups** in the left sidebar.
- Find and double-click the **docker-users** group to open its properties.
- Click **Add** to add a new user to the group.
- In the **Select Users** window, type your **username** and click **Check Names**.
- Once your username is verified, click **OK** to add your user to the `docker-users` group.

### 3. Log Out and Log Back In

- After adding your user to the `docker-users` group, log out of your Windows account.
- Log back in to apply the changes.

### 4. Verify Docker Works Without Admin Rights

After logging back in, open a **Command Prompt** or **PowerShell** and test Docker by running the following command:

```bash
docker run hello-world
```

## Create .env Files

### For automessage-webapp (Front End)
Create a new file `.env`:
```env
REACT_APP_AUTOMESSAGE_TAG_API_LINK = "<ApiURL>"
```

### For automessage-api
Create a new file `.env`:

#### Flask Configuration
```env
FLASK_APP=main.py
FLASK_ENV=development

# JWT Secret Key
JWT_SECRET_KEY=your_jwt_secret_key

MYSQL_HOST=mysql
MYSQL_USER=PGOCADMIN
MYSQL_PASSWORD=@_PGOCEncrypted54.
MYSQL_DB=automessage_tag_db
MYSQL_PORT=3306

# Redis Configuration
REDIS_URL=redis://redis:6379/0
CELERY_BROKER_URL=redis://redis:6379/1
CELERY_RESULT_BACKEND=redis://redis:6379/1
```

## Starting the Project Using Docker-Compose
```bash
docker-compose -f docker-compose.yml up --build -d
```

## Configuration Files

### API Configuration File
`Dockerfile.api`

### Front-End Configuration File
`Dockerfile.reactest`

## Creating MySQL from Docker with Configurations

### Create a MySQL Image on `docker-compose.yml`
```yaml
services:
  mysql:
    image: mysql:8.0
    container_name: mysql
    ports:
      - "3308:3306" # Map MySQL container port 3306 to host port 3308
    environment:
      MYSQL_ROOT_PASSWORD: "yourpassword"
      MYSQL_DATABASE: mydatabasename
      MYSQL_USER: yourusername
      MYSQL_PASSWORD: "yourpassword"
    volumes:
      - ./mysql_data:/var/lib/mysql
    healthcheck:
      test: ["CMD", "mysql", "-h", "localhost", "-u", "yourusername", "-p<yourpassword>", "-e", "SELECT 1;"]
      retries: 5
      interval: 10s
      start_period: 10s
      timeout: 10s
volumes:
  mysql_data:
```

## Create Redis Image on Docker
```yaml
redis:
  image: redis/redis-stack-server:latest
  container_name: redis
  ports:
    - "6390:6379"
  healthcheck:
    test: ["CMD", "redis-cli", "--raw", "incr", "ping"]
```

## Configuring NGROK

### Create NGROK Account

### Download NGROK
Follow the setup instructions at [NGROK Documentation](https://download.ngrok.com/windows).

### Open `ngrok.exe`
Run this command:
```bash
ngrok config add-authtoken $YOUR_AUTHTOKEN
```

### Configure NGROK
Go to the NGROK configuration file located at `User/AppData/Local/ngrok/ngrok.yml`.

#### Example Configuration:
```yaml
version: "3"
agent:
  authtoken: <authtoken>
tunnels:
  # For Exposing Your Port
  webapp:
    addr: http://localhost:3000       # Port of your React web app
    proto: http        # Use HTTP protocol
    host_header: passthrough  # Pass headers without modification
    inspect: false     # Disable inspection to prevent header addition
  # For Tunneling the Port to Your Free Domain Endpoint
  api:
    addr: https://localhost:5000
    labels:
      - <youredge> # Obtain this from your NGROK dashboard
```

### Add Your Domain
You can add your domain by including:
```yaml
domain: <yourdomain>
```
Ensure that you add it first on your NGROK account endpoints.



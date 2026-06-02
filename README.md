SIM & MOBILE - AUTOMATED DEPLOYMENT 
========================================================================
System Architecture: Full-Stack HTML5/JavaScript Framework + Node.js 
Express Telemetry Gateway + MongoDB Cluster Matrix
Orchestrator Tool:   Docker Compose Sandbox Isolation Framework

------------------------------------------------------------------------
[01] DEPLOYMENT PREREQUISITES
------------------------------------------------------------------------
Before initiating the orchestration pipeline sequence, ensure your 
local workstation architecture satisfies the following dependencies:

1. Docker Desktop Operational Environment
   - Version: 25.0+ or newer runtime engine layers active.
   - Status: Service daemon must be running (Green indicator status).
   - Download Link: https://www.docker.com/products/docker-desktop/

2. Modern Sandbox Web Browser Component
   - Google Chrome, Brave, or Mozilla Firefox with active local 
     transmission ports open.

3. Live Server Workspace Extension (Optional / Frontend Host)
   - VS Code Extension or standard HTTP local deployment utility.

------------------------------------------------------------------------
[02] LOCAL PROJECT MATRIX RE-CHECK
------------------------------------------------------------------------
Verify that your directory layout matches the following single-root 
all-inclusive structural mapping rules perfectly before building:

Repair_Store_Web/            <-- Project Main Root Directory
├── init-db/
│   ├── admin.json          <-- Seeding: Admin structural credential nodes
│   ├── bookings.json       <-- Seeding: Custom high-volume booking history
│   ├── enquiries.json      <-- Seeding: Frontline customer inquiries
│   ├── reviews.json        <-- Seeding: 20 high-fidelity review feeds
│   ├── services.json       <-- Seeding: Device repair service price catalog
│   ├── users.json          <-- Seeding: Pro Member encrypted hash logins
│   └── import.sh           <-- Automated batch injection script matrix
├── js/
│   ├── booking.js          <-- Validation Gateways & Date chrono interceptors
│   ├── config.js           <-- Static API base parameter maps
│   └── (other core application web assets)
├── .dockerignore           <-- Core building exclusions (node_modules block)
├── Dockerfile              <-- Node runtime image construction blueprint
├── docker-compose.yml      <-- High commander network cluster orchestrator
├── package.json            <-- Server metadata allocation dependencies
└── server.js               <-- Express server gateway router entry point

------------------------------------------------------------------------
[03] STEP-BY-STEP ORCHESTRATION SETUP
------------------------------------------------------------------------

STEP 1: SHUT DOWN LOCAL CONFLICTING RUNTIMES
-------------------------------------------
Ensure that any native node processes running 'node server.js' or local 
standalone MongoDB instances occupying ports :5000 or :27017 are completely 
terminated. This frees up the transmission ports for the container sandbox.

STEP 2: FIRE UP DOCKER DAEMON MATRIX
------------------------------------
Launch your local Docker Desktop software application. Wait until the 
lower-left engine lifecycle indicator block shifts to a steady green, 
displaying the "Engine Running" handshake protocol safely.

STEP 3: EXECUTE AUTOMATED COMPILE & INITIALIZATION
--------------------------------------------------
Open a command-line terminal window directly inside the main root folder path
('Repair_Store_Web/') and execute the following unified command sequence:

   docker-compose up --build

* What this automated sequence performs behind the terminal loop:
  - Fetches the long-term stable slim Linux Node engine distribution.
  - Installs all network server dependencies into an isolated workspace.
  - Pulls the pristine official Mongo image framework securely.
  - Hooks the 'import.sh' script to execute a one-off batch injection, 
    populating all 6 operational tables cleanly from raw json templates.
  - Locks and binds the secure internal communication line between containers.

STEP 4: SPIN UP THE FRONTEND WIRE PANEL
----------------------------------------
While leaving the terminal engine actively running in the background, 
open your VS Code editor tool and deploy your local frontend client host:
1. Right-click on 'index.html' or 'login.html' within the workspace sidebar.
2. Select 'Open with Live Server' from the context action tray.
3. Your browser will automatically render: http://127.0.0.1:5500/index.html

------------------------------------------------------------------------
[04] VERIFIED TESTING TELEMETRY ACCOUNTS
------------------------------------------------------------------------
Once the database data-seeding script finishes processing execution paths,
you can proceed to run end-to-end user tracking tests via these parameters:

TEST USER: PRO MEMBER INTERFACE ACCESS
----------------------------------------------
- Navigation Entry: Click [LOGIN] menu segment.
- Authorized Email Identity: willweiai88@gmail.com
- Hardened Account Password: password123
* Expected Outcome: Dashboard successfully mounts, pulling 10 bespoke 
  repair tracking charts, status nodes, and active schedules mapped out 
  under the target profile's session matrix records.

TEST ADMIN: SUPER ADMINISTRATOR PANEL
-------------------------------------------
- Navigation Entry: Request page route target: /admin-login.html
- Secure Admin Email Node:  admin@simmobile.com.au
- System Master Password:   AdminSecure2026
* Expected Outcome: Full operational bypass cleared, presenting 20 high-spec 
  customer analytics cards, pending support ticket streams, and full 
  dynamic review flow moderation tools.

------------------------------------------------------------------------
[05] CLEANUP AND SYSTEM SHUTDOWN PROCEDURES
------------------------------------------------------------------------
To safely disconnect container interfaces and power down server modules:

1. Press [ CTRL + C ] directly within the active terminal monitoring block.
2. To wipe the ephemeral virtual volumes clean and reset the entire cluster state,
   execute the following tear-down command script:

   docker-compose down -v
# Storyteller

Find releases [here](https://github.com/NDSU-CS445-MR/Storyteller/releases)

## Table Of Contents
[Overview](#Overview)

[Requirements](#Requirements)

[Installation](#Installation)

[Usage](#Usage)

[Credits](#Credits)

### <a name="Overview"></a>Overview

Welcome to the Storyteller repository.
Storyteller is a web-based application to assist the generation of user stories.
It works with Firebase and AngularJS to enable realtime collaboration and user story analysis.
Many users can work on a storyboard simulateously and see each others changes instantly.
While changes are being made, the server analyzes changes to find overly technical stories or duplicate information.

Other features of Storyteller include three-dimensional categorization of stories by acceptance and due date, perspective by user, and story groups.

### <a name="Requirements"></a> Requirements
Installation of some required software is covered in the Installation section. To install Google Chrome, visit [the download page](https://www.google.com/chrome/browser/)
* Chrome 57.0.2987.132 or later
* node.js 7.5 or later  
* npm 4.1.2 or later (npm is typically packaged with node.js)  
* Firebase

### <a name="Installation"></a> Installation

Storyteller should be installable on any operating system that can run node.js.  
#### Installing Node.js
Follow the guide at [node.js.org](https://nodejs.org/en/download/package-manager/)

#### Getting Storyteller
Download the latest archive from [the release page](https://github.com/NDSU-CS445-MR/Storyteller/releases). Unzip this archive to where you would like Storyteller to be run from.

#### Getting Dependencies
Enter the Storyteller directory and run `npm install` to fetch Storyteller's dependencies.

#### Configuration
Copy the `config.json.template` file to `config.json` and modify the configuration values. Here's an example:
```javascript
{
  // this number is the port on which the Storyteller webserver will run
  "port": 8081,
  // this flag turned story analysis on and off
  "analysisEnabled": true
}
```

If you wish to modify the jargon dictionary, make changes to the dictionary by modifying `jargonList.txt`.

#### Firebase
A new instance of Firebase can be implemented in three steps: 
* Creating a new project 
* Configuring authentication
* Adding the Firebase reference to storyteller 

Please note you will need a google account to create a new Firebase project. To create a new account go [here](https://accounts.google.com/signup).

 ##### Creating a new project
 1.) After signing in to your google account go to the [firebase console](https://firebase.google.com/) and click "GET STARTED FOR FREE"<br /> 
 2.) Click on the "Add Project" tile and enter a name for your new project (name and location are arbitrary) then click the "CREATE PROJECT" button.<br />
 3.) Once the Project Overview page is loaded your new project has been created successfully.
 
 ##### Configuring Authentication
 1.) While on the project overview page click the "Authentication" button on the left side menu and select "SIGN-IN METHOD" tab at the top.<br />
 2.) Enable Email/Password authentication.<br />
 
 ##### Adding the Firebase reference to Storyteller
 1.) While on the project overview page click the "Add Firebase to your web app" icon at the top.<br />
 2.) Copy everything including the brackets after the `var config = ` and before the `firebase.initializeApp(config);` line.<br />
 3.) Paste the object after the `fb_config = ` and before the `//END FIREBASE CONFIGURATION OBJECT` comment.<br />

#### Starting Storyteller
Enter the Storyteller directory and run `npm start` or `node index.js`.

### <a name="Usage"></a> Usage
From a compatible browser, navigate to your web server's internet address followed by `:port_number` where port_number is the number assigned in `config.json`. If you choose to set the port number to 80 or 443, you may skip appending `:port_number` to the internet address.

### <a name="Credits"></a> Credits
Mindroad AB [website](http://mindroad.se)  
[North Dakota State University](http://ndsu.edu) [Computer Science Dept.](http://ndsu.edu/cs) and [Capstone Course](http://csprojects.cs.ndsu.nodak.edu/capstone/)  
Tyler Johnson [@arctair](https://github.com/arctair)  
Scott St.Amant [@Scootly23](https://github.com/scootly23)  
James Corcoran [@goenff](https://github.com/goenff)  
Nathan Diemer   
Nathan Raatz [@XxChronOblivionxX](https://github.com/XxChronOblivionxX)

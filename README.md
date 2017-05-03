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

For a quick video tutorial click [here](https://youtu.be/m4qn-XmdMOM)

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
From a compatible browser, navigate to your web server's internet address followed by `:port_number` where port_number is the number assigned in `config.json`. If you choose to set the port number to 80 or 443, you may skip appending `:port_number` to the internet 
address.

**First time setup**

Login into Storyteller through the web interface with the following credentials:  
Email: admin@storyteller.com  
password: password1  

To secure your instance of Storyteller, create a new administrator profile, log into it, and deactivate the 'admin@storyteller.com' admin account.

**Setting up boards, creating users, and granting access**

To create a new board use the dashboard to navigate to the board tab. This will bring up a list of existing boards and the option to add boards or look at inactive boards.  Click Add New +, now give the board a name and enable any of the story analysis features you want. If one of these is the jargon checker, make sure to list the target words in comma-separated format.
To create a new user use the dashboard to navigate to the user tab, this will bring up a list of existing users and the option to add new users.  Click Add New +, then fill out the basic info (the user will use the email and password to login).  If you don't want the user to have access to all boards deselct that option, click on the manage boards button that appears and select which boards they will have access to.

**User first time use**

Users can now go to the **url:port** and register using an email address and other standard information or log in using the credentials their admin provides them.  If the user registers themself they will need an admin to give them permission to the boards they will be working on.  Once the user is given permission to the necessary board they can navigate to that board and start adding and editing stories.

**Adding and Editing Stories to a Board**

To navigate to a board use the dashboard and select the board tab then select the board to work on, then click on the go to board button.  To add a story the user will click on the add new story tab on the navigation bar, This will pop up a user story to populate.  The user story must follow the format As a * I want * so that *, the app will automatically enforce this so the user doesn't need to worry.  To edit a story's body or title double click the story to edit, then change what needs to be changed, afterwards click on the save and close button.  To change the status of a story (mvp, accepted, ect...) simply drag and drop the user story into the correct status.  Users can also drag stories to different locations in a status to cluster related stories together.  To Remove a story from a board completely simply drag and drop the story into the **discard user story [!]** zone located at the bottom of the board.

**Other Neat and Useful Features**

Flags will appear on user stories, on the bottom left corner, that are either too similar to other stories or contain jargon(if the options are selected).
If the user wants to add a category to catagorize user stories by they can select the new category tab on the navigation bar and fill in the category name, where the zone should be and the color scheme.
If the user wants to change font size they simply need to click on the ^Aa, vAa tabs on the navigation bar.
If the user makes a mistake they can simply click on the undo tab on the navigation bar to undo the last change that they made.
When a board is ready to move into JIRA, use the 'Export to CSV' button available to board administrators in the admin dashboard.

### <a name="Credits"></a> Credits
Mindroad AB [website](http://mindroad.se)  
[North Dakota State University](http://ndsu.edu) [Computer Science Dept.](http://ndsu.edu/cs) and [Capstone Course](http://csprojects.cs.ndsu.nodak.edu/capstone/)  
Tyler Johnson [@arctair](https://github.com/arctair)  
Scott St.Amant [@Scootly23](https://github.com/scootly23)  
James Corcoran [@goenff](https://github.com/goenff)  
Nathan Diemer   
Nathan Raatz [@XxChronOblivionxX](https://github.com/XxChronOblivionxX)

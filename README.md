# Purpose
Les is a program for use during class, to ask questions to students

# Requirements
To install les, you need a computer that runs GNU/Linux. The system is web
based, which means that the players only need a web browser and there are no
limitations on their platform.

# Installation
You will need
[https://github.com/wijnen/lesverhaal](https://github.com/wijnen/lesverhaal) to
be downloaded and ready to run. While you don't need to actually run
lesverhaal, les uses several parts of it, including parts that need to be
downloaded manually. So please get the source and put it in the same directory
as les. (That is, from the top level source directory of les, lesverhaal should
be reachable as ../lesverhaal/.)

Then follow the instructions for installing lesverhaal, including creating at
least one admin.

Make a virtual environment for Python 3 named *.env*

```python3 -m venv .env```

Activate the virtual environment (Do this every time before you start the servers)

(for bash+zsh) ```source .env/bin/activate```

(for powershell) ```.\.env\Scripts\Activate.ps1```

(for CMD) ```.\.env\Scripts\activate.bat```

Install the dependencies

```pip install -r requirements.txt```

From the top level directory of the source tree, run ```python3 les```.  This
should start the system and tell you that servers are running.

Students can log in from the interface at http://localhost:8010 . Only students
in the group that was selected by the admin can log in.

The *admin* group cannot be used when logging in on the student interface.
Instead, you log in on http://localhost:8011 .  From there, you can manage the
session.

If you want the results to be visible for all
students, you can connect to http://localhost:8012 on the computer that is
connected to the projector screen.  This does not require a password.

## Integration with the machine's main web site
It is recommended to use Apache as a web server. Apache can be set up to act as
a virtual proxy to tunnel the websocket from les. All other files can be hosted
directly by Apache. Using this system also allows Apache to use an encrypted
connection. This is recommended, because there are passwords sent over the
connection.

When doing this, the student proxy is required to be named *hostname*/les, the
admin proxy must be named *hostname*/les-admin and the public screen must be
named *hostname*/les-beamer. Those are defaults that can be changed on the
command line. You do not need to create proxies for targets that you will only
access locally.

# Feedback
Questions, suggestions, praise or any other feedback is welcome at
[wijnen@debian.org](mailto:wijnen@debian.org). Bugs should be reported in the
issue tracker on github.

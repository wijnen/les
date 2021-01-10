# Purpose
Les is a program for use during class, to ask questions to students

# Requirements
To install les, you need a computer that runs GNU/Linux. The system is web
based, which means that the players only need a web browser and there are no
limitations on their platform.

# Installation
If your system is Debian-based, you will want to download the script I use for
building packages from [here](https://people.debian.org/~wijnen/mkdeb).

You will need to clone the following repositories (and les itself):

  - [https://github.com/wijnen/python-fhs](https://github.com/wijnen/python-fhs)
  - [https://github.com/wijnen/python-network](https://github.com/wijnen/python-network)
  - [https://github.com/wijnen/python-websocketd](https://github.com/wijnen/python-websocketd)

If you downloaded mkdeb, run it in each of those directories to create the
packages. Then run dpkg -i /tmp/\*.deb to install them. Otherwise, just copy or
link the python files (fhs.py, network.py, websocketd.py) to the lesverhaal
directory.

The files rpc.js and builders.js from the websocketd package need to be copied
(or linked) into the html directories. If you installed the package, you should
make symlinks to the installed versions in /usr/share/python3-websocketd/. They
need to go in all three html/\*/code/ directories.

Create a directory named *users*. In there, create a directory named *admin*
and one named *test*. The latter directory is the first group you will use. It
can have any name, but may not contain uppercase characters.

In *test/*, create a file *user*. Don't put anything in it, it only needs to be
created. Similar to *test*, *user* may have any name, but it must not contain
uppercase characters.

Make a virtual environment for Python 3 named *.env*

```python3 -m venv .env```

Activate the virtual environment (Do this every time before you start the servers)

(for bash+zsh) ```source .env/bin/activate```

(for powershell) ```.\.env\Scripts\Activate.ps1```

(for CMD) ```.\.env\Scripts\activate.bat```

Install the dependencies

```pip install -r requirements.txt```

From the top level directory of the lesverhaal source tree, run ```python3 les```.
This should start the system and tell you that servers are running.

Using a browser from the same computer, go to http://localhost:8010 and log in
with the name and group that you just created (*user* and *test* if you
followed this document). Capitals are allowed. Any password is accepted. A hash
of the given password is stored in the user file that you created. (To reset a
user's password, simply remove the line with the password hash from the user
file. After that, any password will be accepted and the new password hash will
be stored in the file.)

Check that the password is in there, then copy the file to the *admin*
directory. This gives your user access to the admin interface.

The *admin* group cannot be used when logging in on the student interface.
Instead, you log in on http://localhost:8011 .  From there, you can manage the
session.

If you want the results to show up on the screen to be visible for all
students, you can connect to http://localhost:8012 .  This does not require a
password.

## Integration with the machine's main web site
It is recommended to use Apache as a web server. Apache can be set up to act as
a virtual proxy to tunnel the websocket from les. All other files can be hosted
directly by Apache. Using this system also allows Apache to use an encrypted
connection. This is recommended, because there are passwords sent over the
connection.

When doing this, the student proxy is required to be named *hostname*/les, the
admin proxy must be named *hostname*/les-admin and the public screen must be
named *hostname*/les-beamer. You do not need to create proxies for targets that
you will only access locally.

# Feedback
Questions, suggestions, praise or any other feedback is welcome at
[wijnen@debian.org](mailto:wijnen@debian.org). Bugs should be reported in the
issue tracker on github.

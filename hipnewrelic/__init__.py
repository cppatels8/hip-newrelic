from flask import Flask
from ac_flask.hipchat import Addon
import config
import os

_ENV_PREFIX = "HIPNEWRELIC_"

app = Flask(__name__)

addon = Addon(app,
              key=os.environ.get("%sADDON_KEY" % _ENV_PREFIX,
                                 "com.atlassian.HipNewrelic"),
              name=os.environ.get("%sADDON_NAME" % _ENV_PREFIX, "Newrelic"),
              description="Get all new relic alerts in your hipchat room.",
              config=config,
              env_prefix=_ENV_PREFIX,
              allow_global=False,
              allow_room=True,
              scopes=['send_notification', 'view_group'])


"""Import this last so that views are loaded"""
import main

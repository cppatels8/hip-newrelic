import db
import json

from ac_flask.hipchat.auth import tenant
from hipnewrelic import app, addon
from decorator import require_jwt
from ac_flask.hipchat import events
from flask import request, render_template

from send_notifications import send_notification


@addon.configure_page(path="/configure", methods=['GET', 'POST'])
@require_jwt
def configuration_page(*args, **kwargs):
    if request.method == 'GET':
        signed_request = request.args.get("signed_request")
        return _render_configuration_page(signed_request)
    else:
        return '%s not allowed' % request.method, 405
    
    
def _render_configuration_page(signed_request):
    tenant_setting = db.get_tenant_settings(tenant.id)
    if tenant_setting and 'first_notification_sent' in tenant_setting and\
                             not tenant_setting['first_notification_sent']:
        send_first_notification(tenant.id)

    model = {
            "settings": tenant_setting,
            "room_name": "Chandan",
            "signed_request": signed_request,
            "learn_more_url": app.config['LEARN_MORE']
            }
    return render_template('configure.html', **model)


@app.route('/nr-callback', methods=['GET', 'POST'])
def newrelic_webhook_callback():
    if request.method == 'GET':
        app.logger.info("Subscribing app for webhooks")
        return request.args.get("hub.challenge")

    tenant_id = request.args.get("tenant_id")
    event_data = json.dumps(request.form)
    tenant_settings = db.get_tenant_settings(tenant_id)
    message = get_newrelic_notification_message(event_data, tenant_settings)
    send_notification(tenant_id, message, "green")
    return "OK", 200
    
def get_newrelic_notification_message(event_data, tenant_settings):
    return event_data

def send_first_notification(tenant_id):
    message = ("Newrelic integration has been installed successfully. You will start getting notifications" \
                + "for alerts that you have configured.")
    try:
        send_notification(tenant.id, message, "green")
        params = {'first_notification_sent': True}
        db.set_tenant_settings(tenant_id, params)
    except:
        app.logger.error("Unable to send first notification for tenant: "
                                  + tenant_id)


def on_install(params):
    client = params['client']
    params = {"first_notification_sent": False,
              "is_valid_hipchat_creds": True,
              "webhook_url": "{}/nr-callback?tenant_id={}".format(app.config['BASE_URL'], client.id) }
    db.set_tenant_settings(client.id, params)
    app.logger.info("Successfully installed newrelic "\
    + "for client %s" % str(client.id))


def on_uninstall(params):
    client = params['client']
    db.remove_tenant_settings(client.id)
    app.logger.info("Successfully uninstalled "
    + "Newrelic for client " + str(client.id))


events.register_event("uninstall", on_uninstall)
events.register_event("install", on_install)
    
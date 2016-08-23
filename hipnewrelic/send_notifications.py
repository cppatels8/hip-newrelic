import db
import json
import requests

from hipnewrelic import app

def send_notification(tenant_id, message, color="gray"):
    data = json.dumps({"message": message, "color": color, "notify": False,
                       "message_format": 'html'})
    tenant = db.get_tenant(tenant_id)
    url = "/room/%s/notification" % (tenant.room_id)
    app.logger.info("Sent notification for the tenant: " + str(tenant_id)
                     + " to room: " + str(tenant.room_id))
    try:
        _get_response_from_hipchat(tenant_id, "POST", url, data)
    except Exception as ex:
        app.logger.error("Unable to send notification to tenant: " + str(tenant_id))
        app.logger.error(ex)


def _get_response_from_hipchat(tenant_id, method, url, data=None):
    tenant = db.get_tenant(tenant_id)
    try:
        token = db.get_tenant_token(tenant)
    except Exception as ex:
        app.logger.error("Could not find token for tenant " + str(tenant_id))
        raise Exception(ex)

    base_url = tenant.capabilities_url[0:tenant.capabilities_url.rfind('/')]
    url = base_url + url + "?auth_token=" + token
    resp = requests.request(method, url,
                            headers={'content-type': 'application/json'},
                             data=data, timeout=14)
    
    if resp.status_code >= 200 and resp.status_code <= 299:
        return resp
    else:
        raise Exception("Some error occurred while making call to hipchat server.")
    
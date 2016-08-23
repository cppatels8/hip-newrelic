
from ac_flask.hipchat.tenant import Tenant
from ac_flask.hipchat.db import mongo, redis


def get_tenant_settings(tenant_id):
    return mongo['tenant_settings'].find_one({"tenant_id": tenant_id}) or {}


def set_tenant_settings(tenant_id, params):
    mongo['tenant_settings'].find_and_modify(
                query={"tenant_id": tenant_id},
                update={"$set": params},
                upsert=True
                )
    
def get_tenant(tenant_id):
    return Tenant.load(tenant_id)

def get_tenant_token(tenant):
    return tenant.get_token(redis, scopes=['send_notification', 'view_group'])

def remove_tenant_settings(tenant_id):
    mongo['tenant_settings'].remove({"tenant_id": tenant_id})
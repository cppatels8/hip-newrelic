import jwt
import db

from flask import abort, request
from functools import wraps
from hipnewrelic import app


def validate_jwt(request):
    jwt_data = request.args.get('signed_request', None)
    if not jwt_data:
        abort(401)

    oauth_id = jwt.decode(jwt_data, verify=False)['iss']
    client = db.get_tenant(oauth_id)
    if not client:
        abort(400)
    
    data = jwt.decode(jwt_data, client.secret)
    return client, data['prn']


def require_jwt(func):
    @wraps(func)
    def inner(*args, **kwargs):
        app.logger.warn("Validating jwt")
        client, user_id = validate_jwt(request)
        kwargs.update({
            "client": client,
            "user_id": user_id})
        return func(*args, **kwargs)
    return inner
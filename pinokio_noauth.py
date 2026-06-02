import os
import sys

from starlette.middleware.base import BaseHTTPMiddleware


ROOT = os.path.dirname(os.path.abspath(__file__))
APP_DIR = os.path.join(ROOT, "app")
if APP_DIR not in sys.path:
    sys.path.insert(0, APP_DIR)

os.environ["AUTH_ENABLED"] = "false"
os.environ["LOCALHOST_BYPASS"] = "false"

from app import app  # noqa: E402


def _select_local_user():
    preferred = (os.environ.get("ODYSSEUS_LOCAL_USER") or "admin").strip().lower() or "admin"
    auth_manager = getattr(app.state, "auth_manager", None)
    users = getattr(auth_manager, "users", {}) if auth_manager is not None else {}
    if preferred in users:
        return preferred
    for username, data in users.items():
        if data.get("is_admin"):
            return username
    if users:
        return next(iter(users))
    return preferred


LOCAL_USER = _select_local_user()
auth_manager = getattr(app.state, "auth_manager", None)

if auth_manager is not None:
    def _get_username_for_token(_token):
        return LOCAL_USER

    def _validate_token(_token):
        return True

    auth_manager.get_username_for_token = _get_username_for_token
    auth_manager.validate_token = _validate_token


class PinokioNoAuthMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request, call_next):
        request.state.current_user = LOCAL_USER
        request.state.api_token = False
        return await call_next(request)


app.add_middleware(PinokioNoAuthMiddleware)

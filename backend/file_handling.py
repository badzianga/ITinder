import os

APP_ROOT = os.path.dirname(os.path.abspath(__file__))
UPLOAD_FOLDER = os.path.join(APP_ROOT, 'static')

ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg'}


def is_allowed_file(file_name: str) -> bool:
    return '.' in file_name and \
        file_name.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

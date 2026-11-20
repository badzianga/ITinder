from flask_bcrypt import Bcrypt
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from flask_socketio import SocketIO
from flask_sqlalchemy import SQLAlchemy
from flask_restful import Api

api = Api()
bcrypt = Bcrypt()
cors = CORS()
db = SQLAlchemy()
jwt = JWTManager()
socketio = SocketIO()

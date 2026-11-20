import os
from datetime import datetime, timezone

from flask import Flask
from flask_socketio import join_room, leave_room

from auth import Register, Login, Logout, IsLoggedIn
from extensions import api, bcrypt, cors, db, jwt, socketio
from models import RevokedTokenModel, MessageModel
from resources import Discover, Me, React, MatchedProfile, Hello, MyId, MatchedProfiles, Room, Messages
from file_handling import UPLOAD_FOLDER

app = Flask(__name__)
app.config['SECRET_KEY'] = 'fc9fd54758ad5fe50eb558290098c476'
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///db.sqlite3'
app.config['JWT_SECRET_KEY'] = 'a4438111e3a3b76df4c874344f787f36'
app.config['JWT_BLACKLIST_ENABLED'] = True
app.config['JWT_BLACKLIST_TOKEN_CHECKS'] = ['access']

api.add_resource(Register, '/auth/register')
api.add_resource(Login, '/auth/login')
api.add_resource(Logout, '/auth/logout')
api.add_resource(IsLoggedIn, '/auth/is_logged_in')
api.add_resource(Me, '/api/me')
api.add_resource(Discover, '/api/discover/<int:amount>')
api.add_resource(React, '/api/react')
api.add_resource(MatchedProfile, '/api/matched_profile/<string:profile_id>')
api.add_resource(Hello, '/api/hello')
api.add_resource(MyId, '/api/myid')
api.add_resource(MatchedProfiles, '/api/matched_profiles')
api.add_resource(Room, '/api/room/<string:profile_id>')
api.add_resource(Messages, '/api/messages/<int:room_id>')

@jwt.token_in_blocklist_loader
def check_if_token_in_blocklist(_, jwt_payload: dict) -> bool:
    jti = jwt_payload['jti']
    return RevokedTokenModel.is_jti_blocklisted(jti)

api.init_app(app)
bcrypt.init_app(app)
cors.init_app(app)
db.init_app(app)
jwt.init_app(app)
socketio.init_app(app, cors_allowed_origins="*")


# data: { 'room_id': int, 'user_id': string }
@socketio.on('join_room')
def on_join_room(data: dict):
    join_room(data['room_id'])


# data: { 'room_id': int, 'user_id': string }
@socketio.on('leave_room')
def on_leave_room(data: dict):
    leave_room(data['room_id'])


# data: { 'room_id': int, 'user_id': string, 'message': string }
@socketio.on('send_message')
def on_send_message(data: dict):
    message = MessageModel(
        room_id=data['room_id'],
        sender_id=data['user_id'],
        content=data['message'],
        sent_at=datetime.now(timezone.utc)
    )
    message.save()
    socketio.emit('receive_message', data, room=data['room_id'])


if not os.path.exists('instance/db.sqlite3'):
    app.app_context().push()
    db.create_all()
    app.logger.info('Database created')


if __name__ == '__main__':
    socketio.run(app, host='0.0.0.0', port=5000, debug=True, allow_unsafe_werkzeug=True)

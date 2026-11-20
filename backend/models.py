from uuid import uuid4

from extensions import bcrypt, db


class AccountModel(db.Model):
    __tablename__ = 'accounts'

    id = db.Column(db.String(), primary_key=True, default=str(uuid4()))
    email = db.Column(db.String(), nullable=False)
    _password = db.Column(db.Text(), nullable=False)

    def set_password(self, password: str):
        self._password = bcrypt.generate_password_hash(password)

    def check_password(self, password: str) -> bool:
        return bcrypt.check_password_hash(self._password, password)

    @classmethod
    def get_by_email(cls, email: str):
        return cls.query.filter_by(email=email).first()

    def save(self):
        db.session.add(self)
        db.session.commit()

    def delete(self):
        db.session.delete(self)
        db.session.commit()

    def __repr__(self) -> str:
        return f'<Account {self.email}>'


class ProfileModel(db.Model):
    __tablename__ = 'profiles'

    account_id = db.Column(db.String(), db.ForeignKey('accounts.id'), primary_key=True)
    name = db.Column(db.String(32), nullable=False)
    age = db.Column(db.Integer, nullable=False)
    gender = db.Column(db.String(32), nullable=False)
    description = db.Column(db.String(2048), nullable=True)

    @classmethod
    def get_by_id(cls, account_id: str):
        return cls.query.filter_by(account_id=account_id).first()

    def save(self):
        db.session.add(self)
        db.session.commit()

    @staticmethod
    def update():
        db.session.commit()

    def delete(self):
        db.session.delete(self)
        db.session.commit()

    def as_json(self) -> dict:
        return {
            'account_id': self.account_id,
            'name': self.name,
            'age': self.age,
            'gender': self.gender,
            'description': self.description
        }

    def __repr__(self) -> str:
        return f'<Profile {self.name}, {self.age}>'


class PreferenceModel(db.Model):
    __tablename__ = 'preferences'

    account_id = db.Column(db.String(), db.ForeignKey('accounts.id'), primary_key=True)
    min_age = db.Column(db.Integer, nullable=False)
    max_age = db.Column(db.Integer, nullable=False)
    gender = db.Column(db.String(32), nullable=False)

    @classmethod
    def get_by_id(cls, account_id: str):
        return cls.query.filter_by(account_id=account_id).first()

    def save(self):
        db.session.add(self)
        db.session.commit()

    @staticmethod
    def update():
        db.session.commit()

    def delete(self):
        db.session.delete(self)
        db.session.commit()

    def as_json(self) -> dict:
        return {
            'preferred_min_age': self.min_age,
            'preferred_max_age': self.max_age,
            'preferred_gender': self.gender
        }

    def __repr__(self) -> str:
        return f'<Preference {self.min_age}-{self.max_age} {self.gender}>'


class PhotoModel(db.Model):
    __tablename__ = 'photos'

    id = db.Column(db.Integer, primary_key=True)
    account_id = db.Column(db.String(), db.ForeignKey('accounts.id'))
    file_name = db.Column(db.String(), nullable=False)
    position = db.Column(db.Integer, nullable=False)

    def save(self):
        db.session.add(self)
        db.session.commit()

    @staticmethod
    def update():
        db.session.commit()

    def delete(self):
        db.session.delete(self)
        db.session.commit()

    @classmethod
    def get_first_by_id(cls, account_id: str):
        return cls.query.filter_by(account_id=account_id).first()

    @classmethod
    def get_all_by_id(cls, account_id: str) -> list:
        return cls.query.filter_by(account_id=account_id).all()

    def as_json(self) -> dict:
        return {
            'file_name': self.file_name,
            'position': self.position
        }

    def __repr__(self) -> str:
        return f'<Photo {self.file_name}>'


class ReactionModel(db.Model):
    __tablename__ = 'reactions'

    id = db.Column(db.Integer, primary_key=True)
    reacting_id = db.Column(db.String(), db.ForeignKey('accounts.id'), nullable=False)
    reacted_id = db.Column(db.String(), db.ForeignKey('accounts.id'), nullable=False)
    reaction = db.Column(db.Boolean, nullable=False)

    def save(self):
        db.session.add(self)
        db.session.commit()

    @staticmethod
    def update():
        db.session.commit()

    def delete(self):
        db.session.delete(self)
        db.session.commit()

    # temporary - used for clearing all rows with button
    @staticmethod
    def delete_all():
        db.session.query(ReactionModel).delete()
        db.session.commit()

    def __repr__(self) -> str:
        return f'<Reaction {self.reacting_id} -> {self.reacted_id}, {self.reaction}>'


class RoomModel(db.Model):
    __tablename__ = 'rooms'

    id = db.Column(db.Integer, primary_key=True)
    first_id = db.Column(db.String(), db.ForeignKey('profiles.account_id'), nullable=False)
    second_id = db.Column(db.String(), db.ForeignKey('profiles.account_id'), nullable=False)
    created_at = db.Column(db.DateTime, nullable=False)

    def save(self):
        db.session.add(self)
        db.session.commit()

    @staticmethod
    def update():
        db.session.commit()

    def delete(self):
        db.session.delete(self)
        db.session.commit()

    def as_json(self) -> dict:
        return {
            'id': self.id,
            'first_id': self.first_id,
            'second_id': self.second_id,
            # 'created_at': self.created_at
        }

    # temporary - used for clearing all rows with button
    @staticmethod
    def delete_all():
        db.session.query(RoomModel).delete()
        db.session.commit()

    def __repr__(self):
        return f'<Room {id}: {self.first_id} <-> {self.second_id}>'


class MessageModel(db.Model):
    __tablename__ = 'messages'
    id = db.Column(db.Integer, primary_key=True)
    room_id = db.Column(db.Integer, db.ForeignKey('rooms.id'), nullable=False)
    sender_id = db.Column(db.String(), db.ForeignKey('profiles.account_id'), nullable=False)
    content = db.Column(db.Text, nullable=False)
    sent_at = db.Column(db.DateTime, nullable=False)

    def save(self):
        db.session.add(self)
        db.session.commit()

    @staticmethod
    def update():
        db.session.commit()

    def delete(self):
        db.session.delete(self)
        db.session.commit()

    # temporary - used for clearing all rows with button
    @staticmethod
    def delete_all():
        db.session.query(MessageModel).delete()
        db.session.commit()

    @classmethod
    def get_all_by_room_id(cls, room_id: int) -> list:
        return cls.query.filter_by(room_id=room_id).all()

    def as_json(self) -> dict:
        return {
            'room_id': self.room_id,
            'user_id': self.sender_id,
            'message': self.content
        }

    def __repr__(self):
        return f'<Message {self.id}: {self.content}>'


class RevokedTokenModel(db.Model):
    __tablename__ = 'revoked_tokens'

    id = db.Column(db.Integer, primary_key=True)
    jti = db.Column(db.String(120), nullable=False)

    @classmethod
    def is_jti_blocklisted(cls, jti: str) -> bool:
        query = cls.query.filter_by(jti=jti).first()
        return bool(query)

    def save(self):
        db.session.add(self)
        db.session.commit()
    
    def __repr__(self) -> str:
        return f'<RevokedToken {self.jti}>'

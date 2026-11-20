from http import HTTPStatus
import os
from datetime import datetime, timezone
from random import shuffle

from flask_jwt_extended import jwt_required, get_jwt_identity
from flask_restful import Resource, reqparse
from sqlalchemy import or_, and_
from werkzeug.datastructures import FileStorage
from werkzeug.utils import secure_filename

from extensions import socketio
from models import ProfileModel, PreferenceModel, PhotoModel, ReactionModel, RoomModel, MessageModel
from file_handling import is_allowed_file, UPLOAD_FOLDER


class Hello(Resource):
    @staticmethod
    def get():
        socketio.emit('test', "Hello everyone")
        return {'hello': 'world'}, HTTPStatus.OK


class Me(Resource):
    parser = (reqparse.RequestParser()
              .add_argument('name', type=str, location='form', required=True)
              .add_argument('age', type=int, location='form', required=True)
              .add_argument('gender', type=str, location='form', required=True)
              .add_argument('description', type=str, location='form', required=True)
              .add_argument('preferred_min_age', type=int, location='form', required=True)
              .add_argument('preferred_max_age', type=int, location='form', required=True)
              .add_argument('preferred_gender', type=str, location='form', required=True)
              .add_argument('photo', type=FileStorage, location='files', required=False)
              )

    @jwt_required()
    def get(self):
        account_id = get_jwt_identity()

        profile = ProfileModel.get_by_id(account_id)
        preference = PreferenceModel.get_by_id(account_id)
        photos = PhotoModel.get_all_by_id(account_id)

        if not profile or not preference or not photos:
            return {'message': 'Profile not found'}, HTTPStatus.NOT_FOUND

        profile_json = profile.as_json()
        profile_json['photos'] = [photo.as_json() for photo in photos]

        return {'profile': profile_json, 'preference': preference.as_json()}, HTTPStatus.OK

    @jwt_required()
    def post(self):
        account_id = get_jwt_identity()
        args = self.parser.parse_args()

        photo = PhotoModel.get_first_by_id(account_id)
        file_name = secure_filename(args['photo'].filename)
        # zrobiłem, żeby przesłanie zdjęcia przy edycji było opcjonalne, to chyba ma więcej sensu
        if file_name is not None and file_name != '':
            if not is_allowed_file(file_name):
                return {'message': f'Invalid file name {file_name}'}, HTTPStatus.UNPROCESSABLE_ENTITY

            # add timestamp to filename to distinguish files with the same name
            # TODO: maybe consider setting filenames as uuid4()
            timestamp = datetime.now(timezone.utc).strftime('%Y-%m-%d_%I-%M-%S')
            file_name = timestamp + '_' + file_name

            # TODO: temporary I think - photo should exist at this moment
            if not photo:
                photo = PhotoModel(account_id=account_id, file_name=file_name, position=0)
                photo.save()
            else:
                photo.file_name = file_name
                photo.update()

            file = args['photo']
            file.save(os.path.join(UPLOAD_FOLDER, file_name))

        profile = ProfileModel.get_by_id(account_id)
        profile.name = args['name']
        profile.age = args['age']
        profile.gender = args['gender']
        profile.description = args['description']
        profile.update()

        preference = PreferenceModel.get_by_id(account_id)
        preference.min_age = args['preferred_min_age']
        preference.max_age = args['preferred_max_age']
        preference.gender = args['preferred_gender']
        preference.update()

    @jwt_required()
    def put(self):
        account_id = get_jwt_identity()
        args = self.parser.parse_args()

        profile = ProfileModel(
            account_id=account_id,
            name=args['name'],
            age=args['age'],
            gender=args['gender'],
            description=args['description']
        )
        profile.save()

        preference = PreferenceModel(
            account_id=account_id,
            min_age=args['preferred_min_age'],
            max_age=args['preferred_max_age'],
            gender=args['preferred_gender']
        )
        preference.save()

        file_name = secure_filename(args['photo'].filename)
        if not is_allowed_file(file_name):
            return {'message': f'Invalid file name {file_name}'}, HTTPStatus.UNPROCESSABLE_ENTITY

        # add timestamp to filename to distinguish files with the same name
        # TODO: maybe consider setting filenames as uuid4()
        timestamp = datetime.now(timezone.utc).strftime('%Y-%m-%d_%I-%M-%S')
        file_name = timestamp + '_' + file_name

        photo = PhotoModel(
            account_id=account_id,
            file_name=file_name,
            position=0
        )
        photo.save()
        file = args['photo']
        file.save(os.path.join(UPLOAD_FOLDER, file_name))


class MyId(Resource):
    @jwt_required()
    def get(self):
        account_id = get_jwt_identity()
        return {'account_id': account_id}, HTTPStatus.OK


class Discover(Resource):
    @jwt_required()
    def get(self, amount: int):
        account_id = get_jwt_identity()

        preference = PreferenceModel.get_by_id(account_id)

        unreacted_profiles = ProfileModel.query.outerjoin(
            ReactionModel,
            (ReactionModel.reacted_id == ProfileModel.account_id)
            & (ReactionModel.reacting_id == account_id)
        ).filter(
            ReactionModel.id.is_(None),
            ProfileModel.account_id != account_id,
            ProfileModel.gender == preference.gender,
            ProfileModel.age >= preference.min_age,
            ProfileModel.age <= preference.max_age
        ).all()

        profiles = [profile.as_json() for profile in unreacted_profiles][:amount]
        shuffle(profiles)
        for profile in profiles:
            photos = PhotoModel.get_all_by_id(profile['account_id'])
            profile['photos'] = [photo.as_json() for photo in photos]
        return {"profiles": profiles}, HTTPStatus.OK


class React(Resource):
    parser = (reqparse.RequestParser()
              .add_argument('reacted_id', type=str, location='json', required=True)
              .add_argument('reaction', type=bool, location='json', required=True)
              )

    @jwt_required()
    def post(self):
        account_id = get_jwt_identity()
        args = self.parser.parse_args()

        # react to profile
        reaction = ReactionModel(reacting_id=account_id, reacted_id=args['reacted_id'], reaction=args['reaction'])
        reaction.save()

        # if reaction is 'not' - don't check feedback
        if not args['reaction']:
            return

        # reaction is hot, so check if this person also reacted
        feedback = ReactionModel.query.filter(
            ReactionModel.reacting_id == args['reacted_id'],
            ReactionModel.reacted_id == account_id
        )
        # person reacted
        if feedback.count() > 0:
            # and it's also 'hot'
            if feedback.first().reaction:
                print("IT'S A MATCH!")
                room = RoomModel(first_id=account_id, second_id=args['reacted_id'], created_at=datetime.now(timezone.utc))
                room.save()
                # emit a signal to clients to add new chatting option
                socketio.emit('match', room.as_json())

    # temporary - used to delete all reactions from database for testing
    @staticmethod
    def delete():
        ReactionModel.delete_all()
        RoomModel.delete_all()
        MessageModel.delete_all()


class MatchedProfile(Resource):
    @jwt_required()
    def get(self, profile_id: str):
        profile = ProfileModel.get_by_id(profile_id).as_json()
        photos = PhotoModel.get_all_by_id(profile['account_id'])
        profile['photos'] = [photo.as_json() for photo in photos]
        return profile, HTTPStatus.OK


class MatchedProfiles(Resource):
    @jwt_required()
    def get(self):
        account_id = get_jwt_identity()

        rooms = RoomModel.query.filter(
            or_(RoomModel.first_id == account_id, RoomModel.second_id == account_id)
        ).all()

        other_ids = [
            room.second_id if room.first_id == account_id else room.first_id
            for room in rooms
        ]

        other_profiles = ProfileModel.query.filter(ProfileModel.account_id.in_(other_ids)).all()

        profiles = [profile.as_json() for profile in other_profiles]
        for profile in profiles:
            photos = PhotoModel.get_all_by_id(profile['account_id'])
            profile['photos'] = [photo.as_json() for photo in photos]

        return {"profiles": profiles}, HTTPStatus.OK


class Room(Resource):
    @jwt_required()
    def get(self, profile_id: str):
        account_id = get_jwt_identity()

        room = RoomModel.query.filter(
            or_(
                and_(RoomModel.first_id == account_id, RoomModel.second_id == profile_id),
                and_(RoomModel.first_id == profile_id, RoomModel.second_id == account_id)
            )
        ).first()

        return {'room_id': room.id}, HTTPStatus.OK


class Messages(Resource):
    @jwt_required()
    def get(self, room_id: int):
        messages = [
            message.as_json()
            for message in MessageModel.get_all_by_room_id(room_id)
        ]
        print(messages)
        return {'messages': messages}, HTTPStatus.OK

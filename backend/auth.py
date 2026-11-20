from http import HTTPStatus
from uuid import uuid4

from flask_jwt_extended import create_access_token, jwt_required, get_jwt, get_jwt_identity
from flask_restful import Resource, reqparse, abort

from models import AccountModel, RevokedTokenModel


class Register(Resource):
    parser = (reqparse.RequestParser()
              .add_argument('email', type=str, location='form', required=True)
              .add_argument('password', type=str, location='form', required=True))

    def post(self):
        args = self.parser.parse_args()

        if not args['email']:
            abort(HTTPStatus.BAD_REQUEST, message='Email address is required')
        if not args['password']:
            abort(HTTPStatus.BAD_REQUEST, message='Password is required')

        if AccountModel.get_by_email(args['email']):
            abort(HTTPStatus.CONFLICT, message='Account with this email already exists')

        account = AccountModel(email=args['email'].lower())
        account.set_password(args['password'])
        # TODO: for whatever reason one case of registering accounts made id the same as the last one
        # so, even with default=str(uuid4()) I'm doing it here again, so this bug doesn't occur
        account.id = str(uuid4())

        account.save()

        access_token = create_access_token(identity=account.id, expires_delta=False)
        return {'access_token': access_token}, HTTPStatus.OK


class Login(Resource):
    parser = (reqparse.RequestParser()
              .add_argument('email', type=str, location='form', required=True)
              .add_argument('password', type=str, location='form', required=True))

    def post(self):
        args = self.parser.parse_args()

        if not args['email']:
            abort(HTTPStatus.BAD_REQUEST, message='Email address is required')
        if not args['password']:
            abort(HTTPStatus.BAD_REQUEST, message='Password is required')

        account = AccountModel.get_by_email(args['email'].lower())

        if not account:
            abort(HTTPStatus.CONFLICT, message='Account with this email does not exist')

        if not account.check_password(args['password']):
            abort(HTTPStatus.UNAUTHORIZED, message='Password is incorrect')

        access_token = create_access_token(identity=account.id, expires_delta=False)
        return {'access_token': access_token}, HTTPStatus.OK


class Logout(Resource):
    @jwt_required()
    def post(self):
        jti = get_jwt()['jti']
        revoked_token = RevokedTokenModel(jti=jti)
        revoked_token.save()


class IsLoggedIn(Resource):
    @jwt_required()
    def post(self):
        account_id = get_jwt_identity()
        if account_id is None:
            return {}, HTTPStatus.UNAUTHORIZED
        return {}, HTTPStatus.OK

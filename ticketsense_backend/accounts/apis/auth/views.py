from django.conf import settings
from rest_framework import status
from rest_framework.exceptions import AuthenticationFailed
from rest_framework.generics import CreateAPIView, GenericAPIView
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
from rest_framework_simplejwt.serializers import TokenRefreshSerializer
from rest_framework_simplejwt.tokens import RefreshToken

from accounts.apis.auth.serializers import RegisterSerializer, LoginSerializer


REFRESH_COOKIE_NAME = "ticketsense_refresh"


def set_refresh_cookie(response, refresh_token, persistent=True):
    refresh_lifetime = settings.SIMPLE_JWT["REFRESH_TOKEN_LIFETIME"]
    response.delete_cookie(
        key=REFRESH_COOKIE_NAME,
        path="/api/auth/",
        samesite="Lax",
    )
    response.set_cookie(
        key=REFRESH_COOKIE_NAME,
        value=refresh_token,
        max_age=int(refresh_lifetime.total_seconds()) if persistent else None,
        httponly=True,
        secure=not settings.DEBUG,
        samesite="Lax",
        path="/",
    )


# Create your views here.
class RegisterView(CreateAPIView):
    serializer_class = RegisterSerializer


class LoginView(GenericAPIView):
    serializer_class = LoginSerializer
    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        persistent = serializer.validated_data["remember"]
        tokens = serializer.save()

        response = Response(
            {"access": tokens["access"]},
            status=status.HTTP_200_OK,
        )
        set_refresh_cookie(response, tokens["refresh"], persistent=persistent)
        return response


class RefreshView(GenericAPIView):
    permission_classes = [AllowAny]
    serializer_class = TokenRefreshSerializer

    def post(self, request, *args, **kwargs):
        refresh_token = request.COOKIES.get(REFRESH_COOKIE_NAME)
        if not refresh_token:
            raise AuthenticationFailed("Session expired. Please sign in again.")

        serializer = self.get_serializer(data={"refresh": refresh_token})
        try:
            persistent = bool(RefreshToken(refresh_token).get("remember", True))
            serializer.is_valid(raise_exception=True)
        except TokenError as error:
            raise InvalidToken(error.args[0]) from error

        tokens = serializer.validated_data
        rotated_refresh = tokens.get("refresh", refresh_token)
        response = Response(
            {"access": tokens["access"]},
            status=status.HTTP_200_OK,
        )
        set_refresh_cookie(response, rotated_refresh, persistent=persistent)
        return response


class LogoutView(GenericAPIView):
    permission_classes = [AllowAny]
    serializer_class = TokenRefreshSerializer

    def post(self, request, *args, **kwargs):
        refresh_token = request.COOKIES.get(REFRESH_COOKIE_NAME)
        if refresh_token:
            try:
                RefreshToken(refresh_token).blacklist()
            except TokenError:
                pass

        response = Response(status=status.HTTP_204_NO_CONTENT)
        response.delete_cookie(
            key=REFRESH_COOKIE_NAME,
            path="/",
            samesite="Lax",
        )
        response.delete_cookie(
            key=REFRESH_COOKIE_NAME,
            path="/api/auth/",
            samesite="Lax",
        )
        return response

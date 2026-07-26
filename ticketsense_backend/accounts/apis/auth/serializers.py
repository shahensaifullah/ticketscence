from django.contrib.auth import authenticate
from django.db import transaction
from rest_framework import serializers
from rest_framework_simplejwt.tokens import RefreshToken

from accounts.choices import WorkspaceRole
from accounts.models import User
from organizations.models import Workspace, WorkspaceMember
from organizations.services import (
    PERSONAL_WORKSPACE_NAME,
    ensure_user_workspace,
)


class RegisterSerializer(serializers.Serializer):
    first_name = serializers.CharField()
    last_name = serializers.CharField()
    workspace_name = serializers.CharField(
        required=False,
        allow_blank=True,
        default="",
        write_only=True,
    )
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)

    def validate_email(self, data):
        email = data.strip().lower()
        if User.all_objects.filter(email__iexact=email).exists():
            raise serializers.ValidationError("Email already exists")
        return email

    @transaction.atomic
    def create(self, validated_data):
        workspace_name = (
            validated_data.pop("workspace_name", "").strip()
            or PERSONAL_WORKSPACE_NAME
        )

        user = User.objects.create_user(**validated_data)
        workspace = Workspace.objects.create(
            name=workspace_name,
            is_active=True,
        )
        WorkspaceMember.objects.create(
            user=user,
            workspace=workspace,
            role=WorkspaceRole.OWNER,
            is_active=True,
            is_current=True,
        )

        return user


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField(write_only=True)
    password = serializers.CharField(write_only=True)
    remember = serializers.BooleanField(default=True, write_only=True)

    def create(self, validated_data):
        email = validated_data.pop('email')
        password = validated_data.pop('password')
        remember = validated_data.pop('remember')

        user = authenticate(email=email, password=password)
        if user is None:
            raise serializers.ValidationError("Invalid credentials")

        ensure_user_workspace(user)
        refresh = RefreshToken.for_user(user)
        refresh["remember"] = remember
        return {
            'refresh': str(refresh),
            'access': str(refresh.access_token),
        }

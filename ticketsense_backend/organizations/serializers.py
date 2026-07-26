from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
from django.db import transaction
from rest_framework import serializers

from accounts.choices import WorkspaceRole
from accounts.models import User
from organizations.models import Workspace, WorkspaceMember
from organizations.services import (
    ensure_user_workspace,
    set_current_membership,
)


class WorkspaceCreateSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=255)

    def validate_name(self, value):
        name = value.strip()
        if not name:
            raise serializers.ValidationError(
                "Workspace name cannot be blank."
            )
        return name

    @transaction.atomic
    def create(self, validated_data):
        user = self.context["request"].user
        workspace = Workspace.objects.create(
            name=validated_data["name"],
            is_active=True,
        )
        membership = WorkspaceMember.objects.create(
            workspace=workspace,
            user=user,
            role=WorkspaceRole.OWNER,
            is_active=True,
        )
        set_current_membership(membership)
        return workspace


class WorkspaceUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Workspace
        fields = ("name",)

    def validate_name(self, value):
        name = value.strip()
        if not name:
            raise serializers.ValidationError(
                "Workspace name cannot be blank."
            )
        return name


class MemberCreateSerializer(serializers.Serializer):
    first_name = serializers.CharField(max_length=150)
    last_name = serializers.CharField(max_length=150)
    email = serializers.EmailField()
    password = serializers.CharField(
        min_length=8,
        max_length=128,
        write_only=True,
    )
    role = serializers.ChoiceField(
        choices=[
            choice
            for choice in WorkspaceRole.choices
            if choice[0] != WorkspaceRole.OWNER
        ]
    )

    def validate_email(self, value):
        email = value.strip().lower()
        workspace = self.context["workspace"]
        user = User.all_objects.filter(email__iexact=email).first()

        if user and user.is_deleted:
            raise serializers.ValidationError(
                "This account is inactive. Restore it before adding membership."
            )

        if user and WorkspaceMember.objects.filter(
            workspace=workspace,
            user=user,
            is_active=True,
        ).exists():
            raise serializers.ValidationError(
                "This user is already a member of the workspace."
            )

        return email

    def validate_password(self, value):
        try:
            validate_password(value)
        except DjangoValidationError as error:
            raise serializers.ValidationError(list(error.messages)) from error
        return value

    @transaction.atomic
    def create(self, validated_data):
        workspace = self.context["workspace"]
        password = validated_data.pop("password")
        email = validated_data["email"]
        user = User.objects.filter(email__iexact=email).first()
        created_user = user is None

        if created_user:
            user = User.objects.create_user(
                email=email,
                password=password,
                first_name=validated_data["first_name"].strip(),
                last_name=validated_data["last_name"].strip(),
            )

        membership = WorkspaceMember.all_objects.filter(
            workspace=workspace,
            user=user,
        ).first()
        if membership:
            membership.deleted_at = None
            membership.role = validated_data["role"]
            membership.is_active = True
            membership.is_current = False
            membership.save(
                update_fields=[
                    "deleted_at",
                    "role",
                    "is_active",
                    "is_current",
                    "updated_at",
                ]
            )
        else:
            membership = WorkspaceMember.objects.create(
                workspace=workspace,
                user=user,
                role=validated_data["role"],
                is_active=True,
            )

        ensure_user_workspace(user)
        membership.created_user = created_user
        membership.supplied_password = password
        return membership

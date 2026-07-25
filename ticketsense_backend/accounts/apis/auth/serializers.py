from django.contrib.auth import authenticate
from rest_framework import serializers
from rest_framework_simplejwt.tokens import RefreshToken

from accounts.choices import OrganizationRole
from accounts.models import User
from organizations.models import Organization, OrganizationMember


class RegisterSerializer(serializers.Serializer):
    first_name = serializers.CharField()
    last_name = serializers.CharField()
    organization_name = serializers.CharField()
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)

    def validate_email(self, data):
        if User.all_objects.filter(email=data).exists():
            raise serializers.ValidationError("Email already exists")
        return data


    def create(self, validated_data):
        # create organization
        organization = Organization.objects.create(name=validated_data.pop('organization_name'))

        # create user
        user = User.objects.create_user(**validated_data)

        # connect user and the organization with ADMIN role
        OrganizationMember.objects.create(user=user, organization=organization, role=OrganizationRole.ADMIN)

        validated_data['organization_name'] = organization.name
        return validated_data


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

        refresh = RefreshToken.for_user(user)
        refresh["remember"] = remember
        return {
            'refresh': str(refresh),
            'access': str(refresh.access_token),
        }

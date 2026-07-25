from rest_framework import serializers

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

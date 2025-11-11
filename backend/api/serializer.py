from rest_framework import serializers
from django.contrib.auth.hashers import make_password
from .models import UserProfile, CentralClientAssignment, CentralAuthModel

class UserProfileSerializers(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    class Meta:
        model = UserProfile
        fields = ['id', 'email', 'password', 'hospital', 'role']

    def validate_email(self, value):
        if UserProfile.objects.filter(email=value).exists():
            raise serializers.ValidationError("Email already exists")
        return value

    def create(self, validated_data):
        validated_data['password'] = make_password(validated_data['password'])
        return super().create(validated_data)

class CentralClientAssignmentSerializer(serializers.ModelSerializer):
    client_email = serializers.CharField(source='client.email', read_only=True)
    client_hospital = serializers.CharField(source='client.hospital', read_only=True)
    central_auth_email = serializers.CharField(source='central_auth.email', read_only=True)

    class Meta:
        model = CentralClientAssignment
        fields = [
            'id',
            'client_email',
            'client_hospital',
            'central_auth_email',
            'data_domain',
            'model_name',
            'assigned_at',
        ]

class CentralAuthModelSerializer(serializers.ModelSerializer):
    central_auth_email = serializers.CharField(source='central_auth.email', read_only=True)

    
    central_auth = serializers.PrimaryKeyRelatedField(
        queryset=UserProfile.objects.filter(role='central'),
        write_only=True
    )

    class Meta:
        model = CentralAuthModel
        fields = [
            'id',
            'central_auth',
            'central_auth_email',
            'model_name',
            'dataset_domain',
            'model_file',
            'version',
            'created_at',
        ]
        read_only_fields = ['id', 'created_at', 'central_auth_email']

    def validate_central_auth(self, value):
        if value.role != 'central':
            raise serializers.ValidationError("The selected user is not a Central Auth user.")
        return value

    def create(self, validated_data):
        return super().create(validated_data)
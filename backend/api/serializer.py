from rest_framework import serializers
from django.contrib.auth.hashers import make_password
from .models import UserProfile, CentralClientAssignment, CentralAuthModel, ClientModel


# ---------------------------
# ✅ UserProfile Serializer
# ---------------------------
class UserProfileSerializers(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta:
        model = UserProfile
        fields = ["id", "email", "password", "hospital", "role"]

    def validate_email(self, value):
        """Ensure email uniqueness."""
        if UserProfile.objects.filter(email=value).exists():
            raise serializers.ValidationError("Email already exists.")
        return value

    def create(self, validated_data):
        """Hash the password before saving the user."""
        validated_data["password"] = make_password(validated_data["password"])
        return super().create(validated_data)


# ---------------------------
# ✅ CentralClientAssignment Serializer
# ---------------------------
class CentralClientAssignmentSerializer(serializers.ModelSerializer):
    client_email = serializers.CharField(source="client.email", read_only=True)
    client_hospital = serializers.CharField(source="client.hospital", read_only=True)
    central_auth_email = serializers.CharField(source="central_auth.email", read_only=True)
    iteration_name = serializers.CharField(read_only=True)

    class Meta:
        model = CentralClientAssignment
        fields = [
            "id",
            "client_email",
            "client_hospital",
            "central_auth_email",
            "data_domain",
            "model_name",
            "iteration_name",
            "assigned_at",
        ]
        read_only_fields = [
            "id",
            "client_email",
            "client_hospital",
            "central_auth_email",
            "iteration_name"
            "assigned_at",
        ]


# ---------------------------
# ✅ CentralAuthModel Serializer
# ---------------------------
class CentralAuthModelSerializer(serializers.ModelSerializer):
    central_auth_email = serializers.CharField(source="central_auth.email", read_only=True)

    # ensure central_auth is from central users only
    central_auth = serializers.PrimaryKeyRelatedField(
        queryset=UserProfile.objects.filter(role="central"),
        write_only=True
    )
    iteration_name = serializers.CharField()

    class Meta:
        model = CentralAuthModel
        fields = [
            "id",
            "central_auth",
            "iteration_name",
            "central_auth_email",
            "model_name",
            "dataset_domain",
            "model_file",
            "version",
            "created_at",
        ]
        read_only_fields = ["id", "created_at", "central_auth_email"]

    def validate_central_auth(self, value):
        """Ensure the provided user is a valid Central Auth user."""
        if value.role != "central":
            raise serializers.ValidationError("The selected user is not a Central Auth user.")
        return value

    def create(self, validated_data):
        """Handle file upload safely if present."""
        model_file = validated_data.get("model_file", None)
        if model_file and hasattr(model_file, "name"):
            validated_data["model_file"].name = model_file.name
        return super().create(validated_data)

class ClientModelSerializer(serializers.ModelSerializer):
    client_email = serializers.CharField(source="assignment.client.email", read_only=True)
    iteration_name = serializers.CharField(source="assignment.iteration_name", read_only=True)
    model_name = serializers.CharField(source="assignment.model_name", read_only=True)

    class Meta:
        model = ClientModel
        fields = [
            "id",
            "assignment",
            "client_email",
            "iteration_name",
            "model_name",
            "model_file",
            "accuracy",
            "precision",
            "recall",
            "f1_score",
            "version",
            "created_at"
        ]
        read_only_fields = ["id", "client_email", "iteration_name", "model_name", "created_at"]

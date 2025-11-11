from django.shortcuts import get_object_or_404, render
from django.db.models import Q
from django.contrib.auth.hashers import check_password
from rest_framework import status
from rest_framework.decorators import api_view, parser_classes
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.response import Response

from .models import UserProfile, CentralClientAssignment, CentralAuthModel
from .serializer import (
    UserProfileSerializers,
    CentralClientAssignmentSerializer,
    CentralAuthModelSerializer,
)


# ---------------------------
# ✅ Health Check / Home
# ---------------------------
@api_view(["GET"])
def home(request):
    return Response({"message": "Federated Backend Running!"})


# ---------------------------
# ✅ Authentication
# ---------------------------
@api_view(["POST"])
def signup(request):
    serializer = UserProfileSerializers(data=request.data)
    if serializer.is_valid():
        serializer.save()
        return Response(
            {"message": "User registered successfully!"},
            status=status.HTTP_201_CREATED,
        )
    print("Serializer errors:", serializer.errors)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(["POST"])
def login(request):
    email = request.data.get("email")
    password = request.data.get("password")

    if not email or not password:
        return Response(
            {"error": "Email and password are required."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    try:
        user = UserProfile.objects.get(email=email)
    except UserProfile.DoesNotExist:
        return Response(
            {"error": "Invalid email or password."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    if not check_password(password, user.password):
        return Response(
            {"error": "Invalid email or password."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    return Response(
        {
            "message": "Login successful!",
            "id": user.id,
            "email": user.email,
            "hospital": user.hospital,
            "role": user.role,
        },
        status=status.HTTP_200_OK,
    )


# ---------------------------
# ✅ Client Management
# ---------------------------
@api_view(["GET"])
def filter_client(request):
    text = request.GET.get("search", "")
    clients = UserProfile.objects.filter(role="client").filter(
        Q(email__icontains=text) | Q(hospital__icontains=text)
    )
    serializer = UserProfileSerializers(clients, many=True)
    return Response(serializer.data)


@api_view(["GET"])
def fetch_assign(request, email):
    if not email:
        return Response(
            {"error": "email parameter is required"}, status=status.HTTP_400_BAD_REQUEST
        )

    assignments = CentralClientAssignment.objects.filter(central_auth__email=email)
    serializer = CentralClientAssignmentSerializer(assignments, many=True)
    return Response(serializer.data)


@api_view(["POST"])
def assign_client(request):
    """
    Assign a client to a central user.
    Expected payload:
    {
        "central_auth_id": 1,
        "client_id": 2,
        "data_domain": "Healthcare",
        "model_name": "PredictiveModel"
    }
    """
    data = request.data
    central_auth_id = data.get("central_auth_id")
    client_id = data.get("client_id")
    data_domain = data.get("data_domain")
    model_name = data.get("model_name")
    iteration_name = data.get("iteration_name")

    if not all([central_auth_id, client_id, data_domain, model_name]):
        return Response(
            {"error": "All fields are required"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    try:
        central_auth = UserProfile.objects.get(id=central_auth_id, role="central")
        client = UserProfile.objects.get(id=client_id, role="client")
    except UserProfile.DoesNotExist:
        return Response(
            {"error": "Invalid central_auth_id or client_id"},
            status=status.HTTP_404_NOT_FOUND,
        )

    if CentralClientAssignment.objects.filter(client=client).exists():
        return Response(
            {"error": "This client is already assigned"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    assignment = CentralClientAssignment.objects.create(
        central_auth=central_auth,
        client=client,
        data_domain=data_domain,
        model_name=model_name,
        iteration_name=iteration_name,
    )

    serializer = CentralClientAssignmentSerializer(assignment)
    return Response(serializer.data, status=status.HTTP_201_CREATED)


# ---------------------------
# ✅ Model / Iteration Management
# ---------------------------
@api_view(["GET"])
def list_central_models(request):
    user_id = request.GET.get("user_id")
    if not user_id:
        return Response(
            {"error": "user_id parameter is required"}, status=status.HTTP_400_BAD_REQUEST
        )

    try:
        user = UserProfile.objects.get(id=user_id, role="central")
    except UserProfile.DoesNotExist:
        return Response(
            {"error": "Central Auth user not found"}, status=status.HTTP_404_NOT_FOUND
        )

    models = CentralAuthModel.objects.filter(central_auth=user).order_by("-created_at")
    serializer = CentralAuthModelSerializer(models, many=True)
    return Response(serializer.data)


@api_view(["POST"])
@parser_classes([MultiPartParser, FormParser])
def start_iteration(request):
    """
    Create a new model iteration.
    Expected payload:
    {
        "central_auth": 1,
        "model_name": "ResNet50",
        "dataset_domain": "chest-xray",
        "version": 1,
        "model_file": <uploaded file>
    }
    """
    serializer = CentralAuthModelSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    print("Serializer errors:", serializer.errors)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(["GET"])
def running_iterations(request):
    user_id = request.GET.get("user_id")
    if not user_id:
        return Response(
            {"error": "user_id parameter is required"}, status=status.HTTP_400_BAD_REQUEST
        )

    try:
        user = UserProfile.objects.get(id=user_id, role="central")
    except UserProfile.DoesNotExist:
        return Response(
            {"error": "Central Auth user not found"}, status=status.HTTP_404_NOT_FOUND
        )

    iterations = (
        CentralAuthModel.objects.filter(central_auth=user, version__gt=0)
        .order_by("-version")
    )
    serializer = CentralAuthModelSerializer(iterations, many=True)
    return Response(serializer.data)


@api_view(["PUT", "PATCH"])
@parser_classes([MultiPartParser, FormParser])
def update_iteration(request, pk):
    """
    Update an existing CentralAuthModel instance.
    Accepts multipart/form-data for file updates.
    """
    try:
        iteration = CentralAuthModel.objects.get(pk=pk)
    except CentralAuthModel.DoesNotExist:
        return Response(
            {"error": "Iteration not found."},
            status=status.HTTP_404_NOT_FOUND,
        )

    provided_central_auth = request.data.get("central_auth")
    if provided_central_auth:
        try:
            provided_user = UserProfile.objects.get(id=provided_central_auth)
        except UserProfile.DoesNotExist:
            return Response(
                {"error": "Provided central_auth user not found."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if provided_user.role != "central":
            return Response(
                {"error": "Provided user is not a central auth user."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if iteration.central_auth.id != int(provided_central_auth):
            return Response(
                {"error": "You are not allowed to edit this iteration."},
                status=status.HTTP_403_FORBIDDEN,
            )

    serializer = CentralAuthModelSerializer(iteration, data=request.data, partial=True)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data, status=status.HTTP_200_OK)

    print("Update serializer errors:", serializer.errors)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

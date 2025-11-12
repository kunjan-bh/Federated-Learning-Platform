from django.shortcuts import get_object_or_404, render
from django.db.models import Q
from django.contrib.auth.hashers import check_password
from rest_framework import status
from rest_framework.decorators import api_view, parser_classes
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.response import Response

from .models import UserProfile, CentralClientAssignment, CentralAuthModel, ClientModel
from .serializer import (
    UserProfileSerializers,
    CentralClientAssignmentSerializer,
    CentralAuthModelSerializer,
    ClientModelSerializer,
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

@api_view(["GET"])
def iteration_clients(request, iteration_id):
    """
    Returns the list of clients assigned to a specific iteration (by iteration_name).
    """
    try:
        iteration = CentralAuthModel.objects.get(id=iteration_id)
    except CentralAuthModel.DoesNotExist:
        return Response({"error": "Iteration not found"}, status=status.HTTP_404_NOT_FOUND)

    assignments = CentralClientAssignment.objects.filter(iteration_name=iteration.iteration_name)
    data = [
        {
            "client_email": a.client.email,
            "client_hospital": a.client.hospital,
            "data_domain": a.data_domain,
            "assigned_at": a.assigned_at,
        }
        for a in assignments
    ]
    return Response(data)

@api_view(["GET"])
def client_dashboard_data(request, email):
    """
    Returns summarized analytics for a given client.
    Includes:
      - Current running iteration
      - Total rounds participated (completed + current)
      - Total finalized models involved
    """
    try:
        client = UserProfile.objects.get(email=email, role="client")
    except UserProfile.DoesNotExist:
        return Response({"error": "Client not found"}, status=status.HTTP_404_NOT_FOUND)

    # Find all assignments for this client
    assignments = CentralClientAssignment.objects.filter(client=client)

    # Count how many iterations the client has participated in
    total_rounds = assignments.count()

    # Determine which iteration is currently running
    running_iterations = CentralAuthModel.objects.filter(
        iteration_name__in=assignments.values_list("iteration_name", flat=True),
        version__gt=0  # version > 0 means running
    )

    current_running_rounds = running_iterations.count()

    # Count finalized models (version == 0 means finalized)
    finalized_models = CentralAuthModel.objects.filter(
        iteration_name__in=assignments.values_list("iteration_name", flat=True),
        version=0
    ).count()

    return Response({
        "client_email": client.email,
        "hospital": client.hospital,
        "total_rounds": total_rounds,
        "current_running_rounds": current_running_rounds,
        "total_finalized_models": finalized_models
    }, status=status.HTTP_200_OK)

@api_view(["GET"])
def list_client_models(request):
    """
    Returns all iterations (both current & completed)
    related to the client's assigned central auth.
    Includes current (version > 0) and finished (version = 0) models.
    """
    user_id = request.GET.get("user_id")
    if not user_id:
        return Response({"error": "user_id parameter is required"}, status=status.HTTP_400_BAD_REQUEST)

    try:
        client = UserProfile.objects.get(id=user_id, role="client")
    except UserProfile.DoesNotExist:
        return Response({"error": "Client not found"}, status=status.HTTP_404_NOT_FOUND)

    # Find all iterations linked via assignments
    assigned_iterations = CentralClientAssignment.objects.filter(client=client)
    iteration_names = assigned_iterations.values_list("iteration_name", flat=True)

    # Fetch corresponding CentralAuthModel iterations
    iterations = CentralAuthModel.objects.filter(iteration_name__in=iteration_names).order_by("-created_at")

    serializer = CentralAuthModelSerializer(iterations, many=True)
    return Response(serializer.data, status=status.HTTP_200_OK)

@api_view(["GET"])
def current_client_iterations(request, email):
    """
    Fetch only the current (running) iterations assigned to a specific client.
    """
    try:
        client = UserProfile.objects.get(email=email, role="client")
    except UserProfile.DoesNotExist:
        return Response({"error": "Client not found"}, status=status.HTTP_404_NOT_FOUND)

    # Get current running central models (version > 0)
    current_iterations = CentralAuthModel.objects.filter(version__gt=0)

    # Filter by assignments for this client
    assigned_iterations = CentralClientAssignment.objects.filter(
        client=client, iteration_name__in=current_iterations.values_list("iteration_name", flat=True)
    )

    data = [
        {
            "assignment_id": a.id,
            "iteration_name": a.iteration_name,
            "model_name": a.model_name,
            "data_domain": a.data_domain,
            "central_auth_email": a.central_auth.email,
            "version": getattr(a.central_auth.centralauthmodel_set.filter(iteration_name=a.iteration_name, version__gt=0).first(), 'version', 0)
        }
        for a in assigned_iterations
    ]
    return Response(data, status=status.HTTP_200_OK)


@api_view(["POST"])
@parser_classes([MultiPartParser, FormParser])
def submit_client_model(request):
    """
    Client uploads their trained model and metrics for an assigned iteration.
    Expected fields:
    {
        "assignment": <assignment_id>,
        "model_file": <uploaded_file>,
        "accuracy": 0.92,
        "precision": 0.89,
        "recall": 0.91,
        "f1_score": 0.90,
        "version": 1
    }
    """
    serializer = ClientModelSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save()
        return Response({"message": "Client model submitted successfully!"}, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(["GET"])
def current_iteration_submissions(request, iteration_id):
    """
    Returns latest client submissions for a given current iteration.
    Only returns the latest version submitted by each client for this iteration.
    """
    try:
        iteration = CentralAuthModel.objects.get(id=iteration_id)
    except CentralAuthModel.DoesNotExist:
        return Response({"error": "Iteration not found"}, status=status.HTTP_404_NOT_FOUND)

    # Get all assignments for this iteration
    assignments = CentralClientAssignment.objects.filter(iteration_name=iteration.iteration_name)

    submissions = []
    for assignment in assignments:
        # Get latest client model for this assignment
        latest_model = ClientModel.objects.filter(assignment=assignment).order_by('-created_at').first()
        if latest_model:
            submissions.append({
                "client_email": assignment.client.email,
                "client_hospital": assignment.client.hospital,
                "accuracy": latest_model.accuracy,
                "precision": latest_model.precision,
                "recall": latest_model.recall,
                "f1_score": latest_model.f1_score,
                "version": latest_model.version,
                "model_file": latest_model.model_file.url if latest_model.model_file else None,
                "submitted_at": latest_model.created_at,
            })

    return Response(submissions)

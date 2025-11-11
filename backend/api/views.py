from django.shortcuts import render
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from .serializer import UserProfileSerializers
from django.contrib.auth.hashers import check_password
from django.db.models import Q
from rest_framework import status
from .models import CentralClientAssignment, UserProfile, CentralAuthModel
from .serializer import CentralClientAssignmentSerializer

from django.shortcuts import get_object_or_404



@api_view(['GET'])
def home(request):
    return Response({"message": "Federated Backend Running!"})

@api_view(['POST'])
def signup(request):
    serializer = UserProfileSerializers(data = request.data)
    if serializer.is_valid():
        serializer.save()
        return Response({"message": "User registered successfully!"}, status=status.HTTP_201_CREATED)
    print("Serializer errors:", serializer.errors)
    return Response(serializer.errors, status=400)

@api_view(['POST'])
def login(request):
    email = request.data.get('email')
    password = request.data.get('password')
    try:
        user = UserProfile.objects.get(email=email)
    
    except UserProfile.DoesNotExist:
        return Response({"error": "Invalid email or password."}, status=status.HTTP_400_BAD_REQUEST)
    

    if not check_password(password, user.password):
        return Response({"error": "Invalid email or password."}, status=status.HTTP_400_BAD_REQUEST)
    
    return Response({"message": "Login successful!",'id': user.id, "email": user.email, "hospital": user.hospital,"role": user.role}, status=status.HTTP_200_OK)

@api_view(['GET'])
def filter_client(request):
    text = request.GET.get('search', '')
    clients = UserProfile.objects.filter(
        role='client'
    ).filter(
        Q(email__icontains=text) | Q(hospital__icontains=text)
    )
    serializer = UserProfileSerializers(clients, many=True)
    return Response(serializer.data)

@api_view(['GET'])
def fetch_assign(request, email): 

    if not email:
        return Response({'error': 'email parameter is required'}, status=400)

    assignments = CentralClientAssignment.objects.filter(central_auth__email=email)
    serializer = CentralClientAssignmentSerializer(assignments, many=True)
    return Response(serializer.data)




@api_view(['POST'])
def assign_client(request):
    """
    Create a new assignment of a client to a central user.
    Expected JSON payload:
    {
        "central_auth_id": 1,
        "client_id": 2,
        "data_domain": "Healthcare",
        "model_name": "PredictiveModel"
    }
    """
    data = request.data
    central_auth_id = data.get('central_auth_id')
    client_id = data.get('client_id')
    data_domain = data.get('data_domain')
    model_name = data.get('model_name')

    
    if not all([central_auth_id, client_id, data_domain, model_name]):
        return Response({"error": "All fields are required"}, status=status.HTTP_400_BAD_REQUEST)

    try:
        central_auth = UserProfile.objects.get(id=central_auth_id, role='central')
        client = UserProfile.objects.get(id=client_id, role='client')
    except UserProfile.DoesNotExist:
        return Response({"error": "Invalid central_auth_id or client_id"}, status=status.HTTP_404_NOT_FOUND)

    
    if CentralClientAssignment.objects.filter(client=client).exists():
        return Response({"error": "This client is already assigned"}, status=status.HTTP_400_BAD_REQUEST)

    
    assignment = CentralClientAssignment.objects.create(
        central_auth=central_auth,
        client=client,
        data_domain=data_domain,
        model_name=model_name
    )

    serializer = CentralClientAssignmentSerializer(assignment)
    return Response(serializer.data, status=status.HTTP_201_CREATED)




@api_view(['GET'])
def list_central_models(request):
    """
    Returns all models created by the logged-in central auth user.
    If you want to filter by query param email, can add later.
    """
    user_id = request.GET.get('user_id')
    if not user_id:
        return Response({'error': 'user_id parameter is required'}, status=400)

    try:
        user = UserProfile.objects.get(id=user_id, role='central')
    except UserProfile.DoesNotExist:
        return Response({'error': 'Central Auth user not found'}, status=404)

    models = CentralAuthModel.objects.filter(central_auth=user).order_by('-created_at')
    serializer = CentralAuthModelSerializer(models, many=True)
    return Response(serializer.data)



@api_view(['POST'])
def start_iteration(request):
    """
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
        serializer.save()  # central_auth is provided in payload
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    print("Serializer errors:", serializer.errors)
    return Response(serializer.errors, status=400)



@api_view(['GET'])
def running_iterations(request):
    user_id = request.GET.get('user_id')
    if not user_id:
        return Response({'error': 'user_id parameter is required'}, status=400)

    try:
        user = UserProfile.objects.get(id=user_id, role='central')
    except UserProfile.DoesNotExist:
        return Response({'error': 'Central Auth user not found'}, status=404)

    iterations = CentralAuthModel.objects.filter(
        central_auth=user,
        version__gt=0
    ).order_by('-version')
    serializer = CentralAuthModelSerializer(iterations, many=True)
    return Response(serializer.data)


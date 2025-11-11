from django.db import models
from django.contrib import admin

class UserProfile(models.Model):
    email = models.EmailField(unique=True)
    password = models.CharField(max_length=128)
    hospital = models.CharField(max_length=255, blank=True, null=True)
    role = models.CharField(max_length=50, choices=[
        ('client', 'Client'),
        ('central', 'Central Auth'),
    ])
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.email



class CentralAuthModel(models.Model):
    central_auth = models.ForeignKey(UserProfile, on_delete=models.CASCADE, limit_choices_to={'role': 'central'})
    iteration_name = models.CharField(max_length=255)
    model_name = models.CharField(max_length=255)
    dataset_domain = models.CharField(max_length=255, blank=True, null=True)
    model_file = models.FileField(upload_to='central_models/')
    version = models.IntegerField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.model_name} v{self.version} ({self.central_auth.email})"



class CentralClientAssignment(models.Model):
    client = models.ForeignKey(
        UserProfile, 
        on_delete=models.CASCADE, 
        limit_choices_to={'role': 'client'},
        related_name='client_assignments' 
    )
    central_auth = models.ForeignKey(
        UserProfile, 
        on_delete=models.CASCADE, 
        limit_choices_to={'role': 'central'},
        related_name='central_auth_assignments' 
    )
    data_domain = models.CharField(max_length=255)  
    model_name = models.CharField(max_length=255)   
    iteration_name = models.CharField(max_length=255)
    assigned_at = models.DateTimeField(auto_now_add=True)

    

    def __str__(self):
        return f"{self.client.email} -> {self.central_auth.email} ({self.model_name})"




# Client-updated models (for each assignment)
class ClientModel(models.Model):
    assignment = models.ForeignKey(CentralClientAssignment, on_delete=models.CASCADE)
    model_file = models.FileField(upload_to='client_models/')
    accuracy = models.FloatField(blank=True, null=True)
    precision = models.FloatField(blank=True, null=True)
    recall = models.FloatField(blank=True, null=True)
    f1_score = models.FloatField(blank=True, null=True)
    version = models.IntegerField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.assignment.client.email} - {self.assignment.model_name} v{self.version}"


# Admin registration
admin.site.register(UserProfile)
admin.site.register(CentralAuthModel)
admin.site.register(CentralClientAssignment)
admin.site.register(ClientModel)

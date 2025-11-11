from django.urls import path
from django.conf.urls.static import static
from django.conf import settings

from . import views

urlpatterns = [
    path('signup/', views.signup, name='signup'),
    path('login/', views.login, name='login'),
    path('filter_client/', views.filter_client, name='filter_client'),
    path('fetch_assign/<str:email>/', views.fetch_assign, name='fetch_assign'),
    path('assign_client/', views.assign_client, name='assign_client'),
    path('central-models/', views.list_central_models, name='list_central_models'),
    path('central-models/start/', views.start_iteration, name='start_iteration'),
    path('central-models/running/', views.running_iterations, name='running_iterations'),
    path('central-models/<int:pk>/', views.update_iteration, name='central-models-update'),
]+ static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

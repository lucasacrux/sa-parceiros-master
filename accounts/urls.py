from django.urls import path
from accounts import views
from django.conf.urls.static import static
from django.conf import settings

urlpatterns = [ 
    path('registro/', views.register, name='register'), 
    path('login/', views.login_view, name='login'),
    path('logout/', views.logout_view, name='logout')
] 

urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
from django.shortcuts import render
from rest_framework import permissions
from rest_framework.generics import CreateAPIView

from accounts.apis.auth.serializers import RegisterSerializer


# Create your views here.
class RegisterView(CreateAPIView):
    serializer_class = RegisterSerializer
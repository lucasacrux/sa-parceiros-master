from rest_framework import serializers
from core.models import Acordo


class AcordoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Acordo
        fields = '__all__'
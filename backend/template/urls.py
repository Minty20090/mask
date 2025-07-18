from rest_framework.routers import DefaultRouter
from .views import MaskViewSet, ObjectViewSet, InstrumentViewSet

router = DefaultRouter()
router.register(r"masks", MaskViewSet, basename="mask")
router.register(r"objects", ObjectViewSet, basename="object")
router.register(r"instruments", InstrumentViewSet, basename="instrum")

urlpatterns = router.urls

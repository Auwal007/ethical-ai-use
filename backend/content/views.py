"""
Thin content views. Access decisions delegate to progress.services (gating) and
all branching/completion logic to content.services.
"""
from __future__ import annotations

from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

from common.exceptions import GatingError
from progress.services import get_user_state, is_module_accessible

from .models import Module, Scenario
from .serializers import ModuleDetailSerializer, ModuleListSerializer
from .services import choose_scenario_option, complete_module, visible_scenarios


class ModuleListView(APIView):
    """GET /api/modules/ — published modules with per-user status/accessibility."""

    permission_classes = [IsAuthenticated]

    def get(self, request: Request) -> Response:
        from progress.models import Progress

        state = get_user_state(request.user)
        status_by_module = dict(
            Progress.objects.filter(user=request.user).values_list(
                "module_id", "status"
            )
        )

        modules = Module.objects.filter(is_published=True).order_by("sequence_no")
        for module in modules:
            accessible = module.id in state.unlocked_module_ids
            stored = status_by_module.get(module.id)
            # Reflect gating in the reported status: unlocked but unstarted
            # modules read as 'unlocked'; locked ones as 'locked'.
            if stored:
                module.status = stored
            else:
                module.status = "unlocked" if accessible else "locked"
            module.is_accessible = accessible

        return Response(ModuleListSerializer(modules, many=True).data)


class ModuleDetailView(APIView):
    """GET /api/modules/<id>/ — full module; 403 if gating disallows."""

    permission_classes = [IsAuthenticated]

    def get(self, request: Request, module_id: int) -> Response:
        module = get_object_or_404(Module, id=module_id, is_published=True)
        if not is_module_accessible(request.user, module.id):
            raise GatingError(detail="This module is not accessible yet.")

        visible = visible_scenarios(request.user, module)
        serializer = ModuleDetailSerializer(
            module, context={"visible_scenarios": visible}
        )
        return Response(serializer.data)


class ModuleCompleteView(APIView):
    """POST /api/modules/<id>/complete/ — mark completed; returns user state."""

    permission_classes = [IsAuthenticated]

    def post(self, request: Request, module_id: int) -> Response:
        module = get_object_or_404(Module, id=module_id, is_published=True)
        complete_module(request.user, module)
        return Response(get_user_state(request.user).as_dict())


class ScenarioChooseView(APIView):
    """POST /api/scenarios/<id>/choose/ — record a choice, return consequence."""

    permission_classes = [IsAuthenticated]

    def post(self, request: Request, scenario_id: int) -> Response:
        scenario = get_object_or_404(Scenario, id=scenario_id)
        # Module must be accessible for the student to choose within it.
        if not is_module_accessible(request.user, scenario.module_id):
            raise GatingError(detail="This scenario's module is not accessible yet.")

        option_id = request.data.get("option_id")
        if option_id is None:
            return Response(
                {"detail": "option_id is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        result = choose_scenario_option(
            request.user, scenario=scenario, option_id=int(option_id)
        )
        return Response(result, status=status.HTTP_201_CREATED)

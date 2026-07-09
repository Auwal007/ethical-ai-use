"""
Management command: fail loudly if the pre-test and post-test diverge.

Run this in CI and before opening data collection. If the two instruments differ
in question count, order, dimension, or text, the within-subject O1 X O2 gain is
no longer a valid comparison — so a mismatch must halt the pipeline rather than
silently produce a misleading result.
"""
from __future__ import annotations

from django.core.management.base import BaseCommand, CommandError

from assessments.services import verify_instrument_parity


class Command(BaseCommand):
    help = "Verify the pretest and posttest question sets are identical."

    def handle(self, *args, **options) -> None:
        problems = verify_instrument_parity()
        if problems:
            self.stderr.write(self.style.ERROR("Instrument parity FAILED:"))
            for problem in problems:
                self.stderr.write(self.style.ERROR(f"  - {problem}"))
            raise CommandError(
                f"Pretest/posttest parity check failed with {len(problems)} issue(s)."
            )
        self.stdout.write(
            self.style.SUCCESS("Instrument parity OK: pretest and posttest match.")
        )

"""
Management command: load authored course content from seed_data/ into the DB.

    python manage.py seed_content [--flush] [--dry-run]

The whole operation runs in a single ``transaction.atomic`` block. On --dry-run
the transaction is rolled back at the end so nothing is written. If instrument
parity fails, the SeedError propagates and the transaction rolls back — the DB is
never left with a divergent pre/post-test.
"""
from __future__ import annotations

from django.core.management.base import BaseCommand, CommandError
from django.db import transaction

from content.seeding import ContentSeeder, SeedError, flush_content, load_seed_files


class _DryRunRollback(Exception):
    """Internal sentinel used to roll back the transaction after a dry run."""


class Command(BaseCommand):
    help = "Seed authored course content (modules, scenarios, EAILT, usability)."

    def add_arguments(self, parser) -> None:
        parser.add_argument(
            "--flush",
            action="store_true",
            help="Delete existing authored content before seeding.",
        )
        parser.add_argument(
            "--dry-run",
            action="store_true",
            help="Validate and report without writing anything.",
        )

    def handle(self, *args, **options) -> None:
        flush = options["flush"]
        dry_run = options["dry_run"]

        try:
            data = load_seed_files()
        except SeedError as exc:
            raise CommandError(str(exc)) from exc

        seeder = ContentSeeder(data, log=lambda msg: self.stdout.write(f"  {msg}"))

        try:
            with transaction.atomic():
                if flush:
                    self.stdout.write("Flushing existing content …")
                    flush_content()

                counts = seeder.run()

                if dry_run:
                    # Roll everything back — validation happened, nothing persists.
                    raise _DryRunRollback()
        except _DryRunRollback:
            self._report(seeder.counts, dry_run=True)
            self.stdout.write(self.style.WARNING("DRY RUN — no changes written."))
            return
        except SeedError as exc:
            raise CommandError(str(exc)) from exc

        self._report(counts, dry_run=False)
        self.stdout.write(self.style.SUCCESS("Content seeded successfully."))

    def _report(self, counts: dict[str, int], *, dry_run: bool) -> None:
        header = "Would create/update" if dry_run else "Created/updated"
        self.stdout.write(f"\n{header}:")
        for key, value in counts.items():
            self.stdout.write(f"  {key:22s}: {value}")

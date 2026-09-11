import unittest
from tempfile import TemporaryDirectory
from pathlib import Path
from datetime import date
from university_history import atomic_write, read_records, save_with_history

class HistoryTests(unittest.TestCase):
    def event(self, day, **changes):
        return dict(date=day, start='08:00', end='10:00', title='CM Ville durable', **changes)

    def test_disappearing_past_kept_but_cancelled_future_removed(self):
        with TemporaryDirectory() as d:
            p=Path(d)/'univ_events.json'
            atomic_write(p,[self.event('09/09/2026'),self.event('20/09/2026')])
            rows=save_with_history(p,[],date(2026,9,11))
            self.assertEqual([e['date'] for e in rows],['09/09/2026'])
            self.assertEqual(read_records(p.parent/'history'/p.name),rows)
            self.assertEqual(save_with_history(p,[],date(2026,9,12)),rows)

    def test_current_revision_replaces_legacy_without_duplicate(self):
        with TemporaryDirectory() as d:
            p=Path(d)/'univ_events.json';atomic_write(p,[self.event('09/09/2026')])
            current=self.event('09/09/2026',uid='one',salle='E104')
            self.assertEqual(save_with_history(p,[current],date(2026,9,11)),[current])

    def test_failed_collection_snapshot_keeps_future_and_archive(self):
        with TemporaryDirectory() as d:
            p=Path(d)/'univ_events.json';events=[self.event('09/09/2026'),self.event('20/09/2026')]
            atomic_write(p,events)
            self.assertEqual(save_with_history(p,None,date(2026,9,11)),events)
            self.assertEqual(len(read_records(p.parent/'history'/p.name)),1)

    def test_archived_backup_restores_missing_published_file(self):
        with TemporaryDirectory() as d:
            p=Path(d)/'univ_events.json';old=self.event('09/09/2026')
            atomic_write(p.parent/'history'/p.name,[old])
            self.assertEqual(save_with_history(p,[],date(2026,9,11)),[old])

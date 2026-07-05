import unittest

from gfs_retention import classify_gfs_keepers, apply_gfs_to_legacy_folders
import datetime


class TestGfsRetention(unittest.TestCase):
    def test_daily_keepers(self):
        points = [
            {"id": "20260705-120000", "timestamp": "2026-07-05T12:00:00Z"},
            {"id": "20260704-120000", "timestamp": "2026-07-04T12:00:00Z"},
            {"id": "20260703-120000", "timestamp": "2026-07-03T12:00:00Z"},
        ]
        keep = classify_gfs_keepers(points, daily=2, weekly=0, monthly=0,
                                    now=datetime.datetime(2026, 7, 5, 14, 0, 0))
        self.assertIn("20260705-120000", keep)
        self.assertIn("20260704-120000", keep)

    def test_legacy_folder_prune(self):
        folders = ["2026-07-05", "2026-07-04", "2026-07-03", "2026-07-02"]
        to_delete = apply_gfs_to_legacy_folders(folders, daily=2, weekly=0, monthly=0)
        self.assertIn("2026-07-02", to_delete)
        self.assertIn("2026-07-03", to_delete)


if __name__ == "__main__":
    unittest.main()

#!/usr/bin/env python3
"""Build the public GitHub contribution data and a profile-ready SVG.

Usage: python scripts/build_contributions.py [--input saved-contributions.html]
"""

import argparse
from datetime import date, datetime, timezone
from html import escape
from html.parser import HTMLParser
import json
from pathlib import Path
import re
from urllib.request import Request, urlopen


ROOT = Path(__file__).resolve().parents[1]
USER = "wkroh"
COLORS = ("#161b22", "#0e4429", "#006d32", "#26a641", "#39d353")


class ContributionParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.days = {}
        self.tooltip_for = None
        self.tooltip_text = []

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag == "td" and "ContributionCalendar-day" in attrs.get("class", ""):
            day = attrs.get("data-date")
            if day:
                self.days[attrs.get("id", day)] = {
                    "date": day,
                    "level": int(attrs.get("data-level", "0")),
                    "count": 0,
                }
        elif tag == "tool-tip":
            self.tooltip_for = attrs.get("for")
            self.tooltip_text = []

    def handle_data(self, data):
        if self.tooltip_for:
            self.tooltip_text.append(data)

    def handle_endtag(self, tag):
        if tag == "tool-tip" and self.tooltip_for:
            item = self.days.get(self.tooltip_for)
            if item:
                match = re.search(r"(\d+) contributions?", " ".join(self.tooltip_text))
                if match:
                    item["count"] = int(match.group(1))
            self.tooltip_for = None


def load_html(input_path):
    if input_path:
        return Path(input_path).read_text(encoding="utf-8")
    request = Request(
        f"https://github.com/users/{USER}/contributions",
        headers={"User-Agent": "wkroh-profile-activity/1.0", "Accept": "text/html"},
    )
    with urlopen(request, timeout=30) as response:
        return response.read().decode("utf-8")


def build_svg(days, total):
    first = date.fromisoformat(days[0]["date"])
    last = date.fromisoformat(days[-1]["date"])
    sunday = first.toordinal() - ((first.weekday() + 1) % 7)
    cols = (last.toordinal() - sunday) // 7 + 1
    cell, gap = 12, 4
    left, top = 54, 67
    width = max(980, left + cols * (cell + gap) + 35)
    height = 226
    pieces = [
        f'<svg xmlns="http://www.w3.org/2000/svg" width="{width}" height="{height}" viewBox="0 0 {width} {height}" role="img" aria-labelledby="title desc">',
        f'<title id="title">{total} GitHub contributions in the last year by {USER}</title>',
        '<desc id="desc">A green contribution calendar based on the public GitHub activity grid, updated daily.</desc>',
        '<rect width="100%" height="100%" rx="20" fill="#0d1117"/>',
        f'<rect x="1" y="1" width="{width - 2}" height="224" rx="19" fill="none" stroke="#30363d"/>',
        f'<text x="29" y="37" fill="#e6edf3" font-family="Segoe UI,Arial,sans-serif" font-size="19" font-weight="700">{total} contributions in the last year</text>',
        '<text x="29" y="191" fill="#8b949e" font-family="Segoe UI,Arial,sans-serif" font-size="12">GitHub activity · refreshed daily</text>',
    ]
    for label, row in (("Mon", 1), ("Wed", 3), ("Fri", 5)):
        pieces.append(f'<text x="26" y="{top + row * 16 + 10}" fill="#8b949e" font-family="Segoe UI,Arial,sans-serif" font-size="10">{label}</text>')
    current_month = None
    for item in days:
        d = date.fromisoformat(item["date"])
        week = (d.toordinal() - sunday) // 7
        row = (d.weekday() + 1) % 7
        x, y = left + week * 16, top + row * 16
        if d.month != current_month:
            current_month = d.month
            if d.day <= 7:
                pieces.append(f'<text x="{x}" y="58" fill="#8b949e" font-family="Segoe UI,Arial,sans-serif" font-size="11">{escape(d.strftime("%b"))}</text>')
        level = max(0, min(4, item["level"]))
        title = f'{item["count"]} contributions on {d.isoformat()}'
        pieces.append(f'<rect x="{x}" y="{y}" width="12" height="12" rx="3" fill="{COLORS[level]}"><title>{escape(title)}</title></rect>')
    legend_x = width - 185
    pieces.append(f'<text x="{legend_x - 29}" y="192" fill="#8b949e" font-family="Segoe UI,Arial,sans-serif" font-size="11">Less</text>')
    for i, color in enumerate(COLORS):
        pieces.append(f'<rect x="{legend_x + i * 17}" y="181" width="12" height="12" rx="2" fill="{color}"/>')
    pieces.append(f'<text x="{legend_x + 90}" y="192" fill="#8b949e" font-family="Segoe UI,Arial,sans-serif" font-size="11">More</text>')
    pieces.append('</svg>')
    return "\n".join(pieces) + "\n"


def main():
    args = argparse.ArgumentParser()
    args.add_argument("--input", help="Use a saved contribution response instead of fetching GitHub")
    options = args.parse_args()
    parser = ContributionParser()
    parser.feed(load_html(options.input))
    days = sorted(parser.days.values(), key=lambda item: item["date"])
    if len(days) < 300 or not any(item["count"] for item in days):
        raise RuntimeError(f"Unexpected contribution data: {len(days)} days")
    total = sum(item["count"] for item in days)
    data = {
        "username": USER,
        "source": f"https://github.com/users/{USER}/contributions",
        "updated": datetime.now(timezone.utc).date().isoformat(),
        "total": total,
        "days": days,
    }
    (ROOT / "profile-3d" / "contributions.json").write_text(
        json.dumps(data, ensure_ascii=False, separators=(",", ":")) + "\n", encoding="utf-8"
    )
    (ROOT / "assets" / "contributions.svg").write_text(build_svg(days, total), encoding="utf-8")
    print(f"Built {len(days)} days and {total} contributions")


if __name__ == "__main__":
    main()

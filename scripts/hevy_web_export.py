"""
Hevy web export — headless browser automation for free-tier users.

Simulates the manual export flow at hevy.com/settings?export,
then pipes the CSV into workout_sync.py to generate workouts.json.

Requirements:
    pip install playwright
    playwright install chromium --with-deps

Usage:
    python3 run_page/hevy_web_export.py EMAIL PASSWORD
    python3 run_page/hevy_web_export.py EMAIL PASSWORD --output src/static/workouts.json
    python3 run_page/hevy_web_export.py EMAIL PASSWORD --csv-only --csv-path workouts.csv

GitHub Actions secrets needed:
    HEVY_EMAIL      — your Hevy account email
    HEVY_PASSWORD   — your Hevy account password
"""

import argparse
import os
import subprocess
import sys
import tempfile

try:
    from playwright.sync_api import sync_playwright, TimeoutError as PWTimeoutError
except ImportError:
    raise SystemExit(
        "playwright not installed.\n"
        "Run: pip install playwright && playwright install chromium --with-deps"
    )


# ---------------------------------------------------------------------------
# Selectors to try for the export button (Hevy may update the UI)
# ---------------------------------------------------------------------------
EXPORT_BUTTON_SELECTORS = [
    'button:has-text("Export Workout Data")',
    'button:has-text("Export Workouts")',
    'button:has-text("Export")',
    'a:has-text("Export Workout Data")',
    'a:has-text("Export Workouts")',
    '[data-testid*="export"]',
]

LOGIN_URL = "https://hevy.com/login"
EXPORT_URL = "https://hevy.com/settings?export"

# Fallback selectors for the email field (Hevy uses a custom label= attribute)
EMAIL_SELECTORS = [
    'input[label="Email or username"]',
    'input[label*="email" i]',
    'input[label*="username" i]',
    'input[type="email"]',
    'input[name="email"]',
    'input[name="username"]',
    'input[placeholder*="email" i]',
    'input[autocomplete="email"]',
    'input[autocomplete="username"]',
    # Last resort: first text-like input on the page
    'input:not([type]):not([type="password"])',
]


def _find_input(page, selectors: list[str], timeout: int = 12_000):
    """Try each selector in order, return the first visible element found."""
    for sel in selectors:
        try:
            el = page.wait_for_selector(sel, timeout=timeout)
            if el:
                return el, sel
        except PWTimeoutError:
            continue
    return None, None


def export_hevy_csv(
    email: str, password: str, csv_path: str, headless: bool = True
) -> bool:
    """
    Log in to Hevy and download the workout CSV.
    Returns True on success.
    """
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=headless)
        context = browser.new_context(
            # Mimic a real browser to avoid bot detection
            user_agent=(
                "Mozilla/5.0 (X11; Linux x86_64) "
                "AppleWebKit/537.36 (KHTML, like Gecko) "
                "Chrome/124.0.0.0 Safari/537.36"
            ),
            viewport={"width": 1280, "height": 800},
            locale="en-US",
        )
        page = context.new_page()

        try:
            # ----------------------------------------------------------------
            # Step 1: Log in
            # ----------------------------------------------------------------
            print(f"Navigating to {LOGIN_URL} ...")
            # domcontentloaded is less strict than networkidle — avoids
            # timing out when the page fires background requests indefinitely.
            page.goto(LOGIN_URL, wait_until="domcontentloaded")

            # Give JS frameworks a moment to mount the login form
            page.wait_for_timeout(2_000)

            email_el, email_sel = _find_input(page, EMAIL_SELECTORS, timeout=12_000)
            if not email_el:
                # Dump debug info
                debug_path = "/tmp/hevy_login_debug.html"
                with open(debug_path, "w") as f:
                    f.write(page.content())
                page.screenshot(path="/tmp/hevy_login_debug.png")
                print(
                    f"ERROR: Could not find email input on login page.\n"
                    f"HTML saved to {debug_path}, screenshot to /tmp/hevy_login_debug.png",
                    file=sys.stderr,
                )
                browser.close()
                return False

            print(f"Found email field: {email_sel!r}")
            # Fill email
            page.fill(email_sel, email)

            # Fill password
            page.fill('input[type="password"]', password)

            # Submit — try submit button first, then Enter key
            try:
                page.click('button[type="submit"]', timeout=5_000)
            except PWTimeoutError:
                page.keyboard.press("Enter")

            # Wait for successful login (URL changes away from /login)
            try:
                page.wait_for_url(lambda url: "/login" not in url, timeout=15_000)
                print("Login successful.")
            except PWTimeoutError:
                # Sometimes the redirect is slow; check current URL
                if "/login" in page.url:
                    print(
                        "ERROR: Still on login page. Check credentials.",
                        file=sys.stderr,
                    )
                    browser.close()
                    return False

            # ----------------------------------------------------------------
            # Step 2: Navigate to settings/export
            # ----------------------------------------------------------------
            print(f"Navigating to {EXPORT_URL} ...")
            page.goto(EXPORT_URL, wait_until="networkidle")

            # ----------------------------------------------------------------
            # Step 3: Find and click the export button, capture download
            # ----------------------------------------------------------------
            export_btn = None
            for selector in EXPORT_BUTTON_SELECTORS:
                try:
                    export_btn = page.wait_for_selector(selector, timeout=5_000)
                    if export_btn:
                        print(f"Found export button: {selector!r}")
                        break
                except PWTimeoutError:
                    continue

            if not export_btn:
                # Dump page content for debugging
                content = page.content()
                debug_path = "/tmp/hevy_settings_debug.html"
                with open(debug_path, "w") as f:
                    f.write(content)
                print(
                    f"ERROR: Could not find the export button.\n"
                    f"Page HTML saved to {debug_path} for inspection.",
                    file=sys.stderr,
                )
                browser.close()
                return False

            print("Clicking export button and waiting for download...")
            with page.expect_download(timeout=60_000) as download_info:
                export_btn.click()

            download = download_info.value
            download.save_as(csv_path)
            print(f"CSV saved to: {csv_path}")
            browser.close()
            return True

        except Exception as exc:
            print(f"ERROR during export: {exc}", file=sys.stderr)
            browser.close()
            return False


def run_sync(csv_path: str, output_path: str, tz_offset: int = 0) -> bool:
    """Parse the downloaded CSV into workouts.json via workout_sync.py."""
    script = os.path.join(os.path.dirname(__file__), "workout_sync.py")
    cmd = [
        sys.executable,
        script,
        "--input",
        csv_path,
        "--output",
        output_path,
        "--tz-offset",
        str(tz_offset),
    ]
    print(f"Running: {' '.join(cmd)}")
    result = subprocess.run(cmd)
    return result.returncode == 0


def main():
    parser = argparse.ArgumentParser(
        description="Export Hevy workouts via browser automation (free tier compatible)"
    )
    parser.add_argument("email", help="Hevy account email")
    parser.add_argument("password", help="Hevy account password")
    parser.add_argument(
        "--output",
        default="src/static/workouts.json",
        help="Output workouts.json path (default: src/static/workouts.json)",
    )
    parser.add_argument(
        "--csv-path",
        default=None,
        help="Where to save the downloaded CSV (default: temp file)",
    )
    parser.add_argument(
        "--csv-only",
        action="store_true",
        help="Only download the CSV, skip JSON generation",
    )
    parser.add_argument(
        "--no-headless",
        action="store_true",
        help="Show the browser window (useful for debugging)",
    )
    parser.add_argument(
        "--tz-offset",
        type=int,
        default=0,
        metavar="HOURS",
        help="Hours to add to parsed timestamps (e.g. 8 for UTC→UTC+8, default: 0)",
    )
    args = parser.parse_args()

    # Determine CSV path
    use_temp = args.csv_path is None
    if args.csv_path:
        csv_path = args.csv_path
    else:
        fd, csv_path = tempfile.mkstemp(suffix=".csv", prefix="hevy_")
        os.close(fd)

    try:
        success = export_hevy_csv(
            email=args.email,
            password=args.password,
            csv_path=csv_path,
            headless=not args.no_headless,
        )
        if not success:
            raise SystemExit(1)

        if not args.csv_only:
            ok = run_sync(csv_path, args.output, tz_offset=args.tz_offset)
            if not ok:
                raise SystemExit(1)
    finally:
        if use_temp and os.path.exists(csv_path):
            os.unlink(csv_path)

    print("Done!")


if __name__ == "__main__":
    main()
